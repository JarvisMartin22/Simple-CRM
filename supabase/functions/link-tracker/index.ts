import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const API_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': req.headers.get('Origin') || '*'
      }
    });
  }

  // Handle HEAD requests for testing
  if (req.method === "HEAD") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': req.headers.get('Origin') || '*'
      }
    });
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
      origin: req.headers.get('Origin'),
      headers: Object.fromEntries(req.headers.entries())
    });

    if (!trackingId || !originalUrl) {
      console.warn("Missing tracking ID or URL in request");
      // If we have the URL but no tracking ID, still redirect
      if (originalUrl) {
        return redirectToUrl(originalUrl, req.headers.get('Origin'));
      }
      return new Response(
        JSON.stringify({ error: "Missing tracking ID or URL" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': req.headers.get('Origin') || '*'
          } 
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(API_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the tracking record first
    const { data: trackingData, error: fetchError } = await supabase
      .from("tracked_links")
      .select("id, email_tracking_id")
      .eq("tracking_id", trackingId)
      .single();

    if (fetchError) {
      console.error("Error fetching tracking data:", fetchError);
      return redirectToUrl(originalUrl, req.headers.get('Origin'));
    }

    // Get the email tracking record for user_id
    const { data: emailData, error: emailError } = await supabase
      .from("email_tracking")
      .select("id, user_id, email_id, recipient, subject")
      .eq("id", trackingData.email_tracking_id)
      .single();

    if (emailError) {
      console.error("Error fetching email data:", emailError);
      return redirectToUrl(originalUrl, req.headers.get('Origin'));
    }

    // Record the click event in tracked_links
    const { error: updateError } = await supabase
      .from("tracked_links")
      .update({
        click_count: supabase.sql`click_count + 1`,
        last_clicked_at: new Date().toISOString()
      })
      .eq("tracking_id", trackingId);

    if (updateError) {
      console.error("Error updating tracking record:", updateError);
    } else {
      console.log(`Successfully recorded click for tracking ID: ${trackingId}`);

      // Record the event in email_events
      const { error: eventError } = await supabase
        .from("email_events")
        .insert({
          email_tracking_id: emailData.id,
          user_id: emailData.user_id,
          email_id: emailData.email_id,
          event_type: "click",
          recipient: emailData.recipient,
          subject: emailData.subject,
          url: originalUrl,
          user_agent: userAgent,
          ip_address: ipAddress
        });

      if (eventError) {
        console.error("Error recording event:", eventError);
      }
    }

    return redirectToUrl(originalUrl, req.headers.get('Origin'));
  } catch (error) {
    console.error("Error processing link tracking:", error);
    // If we have the URL, still redirect even if tracking fails
    const url = new URL(req.url).searchParams.get("url");
    if (url) {
      return redirectToUrl(url, req.headers.get('Origin'));
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': req.headers.get('Origin') || '*'
        } 
      }
    );
  }
});

// Helper function to handle redirects
function redirectToUrl(url: string, origin: string | null) {
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin || '*',
      'Location': url,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
} 