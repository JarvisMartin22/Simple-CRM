import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Log environment status
console.log("Link Tracker Function Started");
console.log("API_URL available:", !!API_URL);
console.log("SERVICE_ROLE_KEY available:", !!SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle HEAD requests for testing
  if (req.method === "HEAD") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("id");
    const originalUrl = url.searchParams.get("url");
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown";

    console.log(`Processing link click tracking:`, {
      trackingId,
      url: originalUrl,
      userAgent: userAgent.substring(0, 50),
      ip: ipAddress,
      method: req.method,
      origin: req.headers.get('Origin')
    });

    if (!trackingId || !originalUrl) {
      console.warn("Missing tracking ID or URL in request");
      // If we have the URL but no tracking ID, still redirect
      if (originalUrl) {
        return redirectToUrl(originalUrl);
      }
      return new Response(
        JSON.stringify({ error: "Missing tracking ID or URL" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    // Track the click if we have environment variables
    if (API_URL && SERVICE_ROLE_KEY) {
      // Initialize Supabase client with service role key
      const supabase = createClient(API_URL, SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Find the original sent event to get campaign and contact details
      const { data: sentEvent, error: sentError } = await supabase
        .from('email_events')
        .select('campaign_id, contact_id, recipient_email')
        .eq('tracking_id', trackingId)
        .eq('event_type', 'sent')
        .single();

      if (sentError || !sentEvent) {
        console.error('No sent event found for tracking_id:', trackingId, sentError);
      } else {
        // Build event metadata
        const eventMetadata = {
          user_agent: userAgent,
          ip_address: ipAddress,
          timestamp: new Date().toISOString(),
          url: originalUrl
        };

        // Hash IP for privacy
        if (ipAddress !== "Unknown") {
          try {
            const encoder = new TextEncoder();
            const data = encoder.encode(ipAddress);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            eventMetadata.ip_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
          } catch (e) {
            console.error("Error hashing IP:", e);
          }
        }

        // Insert the click event
        const { error: eventError } = await supabase
          .from('email_events')
          .insert({
            campaign_id: sentEvent.campaign_id,
            contact_id: sentEvent.contact_id,
            recipient_email: sentEvent.recipient_email,
            event_type: 'clicked',
            tracking_id: trackingId,
            event_data: eventMetadata,
            user_agent: userAgent,
            ip_address: ipAddress,
            link_url: originalUrl,
            created_at: new Date().toISOString()
          });

        if (eventError) {
          console.error('Error storing click event:', eventError);
        } else {
          console.log(`✅ Link click tracked for campaign: ${sentEvent.campaign_id}`);
          
          // Update campaign recipient clicked_at if not already set
          if (sentEvent.contact_id) {
            const { error: recipientError } = await supabase
              .from('campaign_recipients')
              .update({
                clicked_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('campaign_id', sentEvent.campaign_id)
              .eq('contact_id', sentEvent.contact_id)
              .is('clicked_at', null); // Only update if not already clicked
              
            if (!recipientError) {
              console.log('Campaign recipient marked as clicked');
            }
          }
          
          // Refresh campaign analytics
          const { error: refreshError } = await supabase
            .rpc('refresh_campaign_analytics_simple', { p_campaign_id: sentEvent.campaign_id });
            
          if (refreshError) {
            console.warn('Failed to refresh campaign analytics:', refreshError);
          } else {
            console.log('Campaign analytics refreshed successfully');
          }
        }
      }
    } else {
      console.error("Missing required environment variables for tracking");
    }

    // Always redirect to the original URL
    return redirectToUrl(originalUrl);
  } catch (error) {
    console.error("Error processing link tracking:", error);
    // If we have the URL, still redirect even if tracking fails
    const url = new URL(req.url).searchParams.get("url");
    if (url) {
      return redirectToUrl(url);
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});

// Helper function to handle redirects
function redirectToUrl(url: string) {
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Location': url,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}