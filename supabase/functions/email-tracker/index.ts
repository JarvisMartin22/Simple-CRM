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
  // Always return tracking pixel for GET requests, regardless of auth
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const trackingId = url.searchParams.get("id");
      const userAgent = req.headers.get("user-agent") || "Unknown";
      const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown";

      console.log(`🔍 Tracking pixel accessed: ${trackingId}`);

      if (trackingId && SERVICE_ROLE_KEY) {
        // Initialize Supabase client with service role key (bypasses RLS)
        const supabase = createClient(API_URL, SERVICE_ROLE_KEY, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // Get the tracking record
        const { data: trackingData, error: fetchError } = await supabase
          .from("email_tracking")
          .select("id, user_id, email_id, recipient, subject, campaign_id, open_count")
          .eq("tracking_pixel_id", trackingId)
          .single();

        if (!fetchError && trackingData) {
          console.log(`✅ Found tracking record for campaign: ${trackingData.campaign_id}`);

          // Update open count and timestamp
          const { error: updateError } = await supabase
            .from("email_tracking")
            .update({
              open_count: (trackingData.open_count || 0) + 1,
              opened_at: trackingData.open_count === 0 ? new Date().toISOString() : undefined,
              last_opened_at: new Date().toISOString(),
              last_user_agent: userAgent.substring(0, 255),
              last_ip: ipAddress.substring(0, 45),
              updated_at: new Date().toISOString()
            })
            .eq("tracking_pixel_id", trackingId);

          if (!updateError) {
            console.log(`✅ Updated tracking record`);

            // Record in email_events if it's a campaign email
            if (trackingData.campaign_id) {
              // For campaign emails, find recipient from contacts
              const { data: contact } = await supabase
                .from("contacts")
                .select("id")
                .eq("email", trackingData.recipient)
                .eq("user_id", trackingData.user_id)
                .single();

              await supabase
                .from("email_events")
                .insert({
                  campaign_id: trackingData.campaign_id,
                  recipient_id: contact?.id || null,
                  event_type: "opened",
                  event_data: {
                    tracking_id: trackingId,
                    email: trackingData.recipient,
                    open_count: (trackingData.open_count || 0) + 1
                  },
                  user_agent: userAgent,
                  ip_address: ipAddress
                });

              // Update campaign analytics
              await supabase.rpc('increment_campaign_opens', {
                p_campaign_id: trackingData.campaign_id
              }).catch(async (rpcError) => {
                // If RPC doesn't exist, update manually
                console.log('RPC failed, updating manually');
                await supabase
                  .from("campaign_analytics")
                  .update({
                    opened_count: supabase.sql`opened_count + 1`,
                    unique_opened_count: trackingData.open_count === 0 
                      ? supabase.sql`unique_opened_count + 1` 
                      : supabase.sql`unique_opened_count`,
                    last_event_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq("campaign_id", trackingData.campaign_id);
              });

              console.log(`✅ Updated campaign analytics`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing tracking:", error);
    }
  }

  // Always return the tracking pixel
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