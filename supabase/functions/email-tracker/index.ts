import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectEmailForward } from "./detect-forward.ts";

const API_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Log environment status
console.log("Email Tracker Function Started");
console.log("API_URL available:", !!API_URL);
console.log("SERVICE_ROLE_KEY available:", !!SERVICE_ROLE_KEY);

// Simple CORS headers for tracking pixel
const trackingHeaders = {
  "Content-Type": "image/gif",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "Access-Control-Allow-Origin": "*"
};

// 1x1 transparent GIF
const TRACKING_PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
  0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3B
]);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: trackingHeaders });
  }

  // Only process GET requests
  if (req.method !== "GET") {
    return new Response(TRACKING_PIXEL, { headers: trackingHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("id");
    const eventType = url.searchParams.get("type") || "open";
    const section = url.searchParams.get("section");
    const campaignId = url.searchParams.get("campaign");
    const contactId = url.searchParams.get("contact");
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown";

    console.log(`🔍 Tracking pixel accessed - ID: ${trackingId}, Type: ${eventType}, Section: ${section}`);

    if (trackingId && API_URL && SERVICE_ROLE_KEY) {
      // Initialize Supabase client with service role key
      const supabase = createClient(API_URL, SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Build event metadata
      const eventMetadata = {
        user_agent: userAgent,
        ip_address: ipAddress,
        timestamp: new Date().toISOString()
      };

      if (section) {
        eventMetadata.section = section;
      }

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
        // Get previous events for forward detection
        const { data: previousEvents } = await supabase
          .from('email_events')
          .select('*')
          .eq('tracking_id', trackingId)
          .in('event_type', ['opened', 'clicked'])
          .order('created_at', { ascending: false })
          .limit(10);

        // Detect if this might be a forwarded email
        const forwardDetection = detectEmailForward(
          userAgent,
          ipAddress,
          previousEvents || []
        );

        // Add forward detection to metadata
        if (forwardDetection.isForwarded) {
          eventMetadata.forward_detection = forwardDetection;
        }

        // Determine event type
        const finalEventType = forwardDetection.isForwarded ? 'forwarded' : 'opened';

        // Insert the tracking event
        const { error: eventError } = await supabase
          .from('email_events')
          .insert({
            campaign_id: sentEvent.campaign_id,
            contact_id: sentEvent.contact_id,
            recipient_email: sentEvent.recipient_email,
            event_type: finalEventType,
            tracking_id: trackingId,
            event_data: eventMetadata,
            user_agent: userAgent,
            ip_address: ipAddress,
            created_at: new Date().toISOString()
          });

        if (eventError) {
          console.error('Error storing email event:', eventError);
        } else {
          console.log(`✅ Email open tracked for campaign: ${sentEvent.campaign_id}`);
          
          // Update campaign recipient with first open time if not already set
          if (sentEvent.contact_id) {
            const { error: recipientError } = await supabase
              .from('campaign_recipients')
              .update({
                opened_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('campaign_id', sentEvent.campaign_id)
              .eq('contact_id', sentEvent.contact_id)
              .is('opened_at', null); // Only update if not already opened
              
            if (!recipientError) {
              console.log('Campaign recipient marked as opened');
            }
          }
          
          // Refresh campaign analytics
          const { error: refreshError } = await supabase
            .rpc('refresh_campaign_analytics_simple', { p_campaign_id: sentEvent.campaign_id });
            
          if (refreshError) {
            console.warn('Failed to refresh campaign analytics:', refreshError);
          }
        }
      }
    } else if (!API_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables");
    }
  } catch (error) {
    console.error("Error processing tracking:", error);
  }

  // Always return the tracking pixel
  return new Response(TRACKING_PIXEL, { headers: trackingHeaders });
});