import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const API_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Return tracking pixel for HEAD requests (some email clients do this)
  if (req.method === "HEAD") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
        "Content-Length": "42", // Length of the GIF
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("id");
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown";

    console.log(`Processing email open tracking:`, {
      trackingId,
      userAgent: userAgent.substring(0, 50),
      ip: ipAddress,
      method: req.method
    });

    if (!trackingId) {
      console.warn("Missing tracking ID in request");
      // Still return the pixel but don't track
      return returnTrackingPixel();
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
      .from("email_tracking")
      .select("id, user_id, email_id, recipient, subject")
      .eq("tracking_pixel_id", trackingId)
      .single();

    if (fetchError) {
      console.error("Error fetching tracking data:", fetchError);
      return returnTrackingPixel();
    }

    // Record the open event
    const { error: updateError } = await supabase
      .from("email_tracking")
      .update({
        open_count: supabase.sql`open_count + 1`,
        opened_at: new Date().toISOString()
      })
      .eq("tracking_pixel_id", trackingId);

    if (updateError) {
      console.error("Error updating tracking record:", updateError);
    } else {
      console.log(`Successfully recorded open for tracking ID: ${trackingId}`);

      // Record the event in email_events
      const { error: eventError } = await supabase
        .from("email_events")
        .insert({
          email_tracking_id: trackingData.id,
          user_id: trackingData.user_id,
          email_id: trackingData.email_id,
          event_type: "open",
          recipient: trackingData.recipient,
          subject: trackingData.subject,
          user_agent: userAgent,
          ip_address: ipAddress
        });

      if (eventError) {
        console.error("Error recording event:", eventError);
      }
    }

    return returnTrackingPixel();
  } catch (error) {
    console.error("Error processing tracking:", error);
    // Always return the tracking pixel, even on error
    return returnTrackingPixel();
  }
});

// Helper function to return the tracking pixel
function returnTrackingPixel() {
  return new Response(
    Uint8Array.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
      0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
      0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
      0x01, 0x00, 0x3B
    ]),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    }
  );
} 