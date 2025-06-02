import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Simple CORS headers for tracking pixel
const trackingHeaders = {
  "Content-Type": "image/gif",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "Access-Control-Allow-Origin": "*"
};

serve(async (req) => {
  // Always return tracking pixel for GET requests
  if (req.method === "GET") {
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

      if (trackingId && SERVICE_ROLE_KEY) {
        // Initialize Supabase client with service role key
        const supabase = createClient(API_URL, SERVICE_ROLE_KEY, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // Build event metadata
        const eventMetadata: any = {
          user_agent: userAgent,
          ip_address: ipAddress,
          timestamp: new Date().toISOString()
        };

        if (section) {
          eventMetadata.section = section;
        }

        // Hash IP for privacy
        if (ipAddress !== "Unknown") {
          const encoder = new TextEncoder();
          const data = encoder.encode(ipAddress);
          const hashBuffer = await crypto.subtle.digest("SHA-256", data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          eventMetadata.ip_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
        }

        // Call the enhanced tracking function
        const { data, error } = await supabase
          .rpc('track_email_event', { 
            p_tracking_id: trackingId,
            p_event_type: eventType,
            p_event_metadata: eventMetadata
          });

        if (error) {
          console.error('Error tracking email event:', error);
          // Fall back to simple tracking if enhanced function doesn't exist
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            const { error: fallbackError } = await supabase
              .rpc('track_email_open', { p_tracking_id: trackingId });
            
            if (!fallbackError) {
              console.log(`✅ Email open tracked (fallback) for campaign: ${campaignId}`);
            }
          }
        } else {
          console.log(`✅ Email event tracked - Type: ${eventType}, Result:`, data);
        }
      }
    } catch (error) {
      console.error("Error processing tracking:", error);
    }
  }

  // Always return the tracking pixel (1x1 transparent GIF)
  return new Response(
    Uint8Array.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
      0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
      0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
      0x01, 0x00, 0x3B
    ]),
    {
      headers: trackingHeaders
    }
  );
});