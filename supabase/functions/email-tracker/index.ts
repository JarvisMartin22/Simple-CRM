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
      .select("id, user_id, email_id, recipient, subject, campaign_id, contact_id")
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
      
      // Check if this is part of a campaign
      if (trackingData.campaign_id) {
        // Also update the campaign analytics tables
        console.log(`Updating campaign analytics for campaign ${trackingData.campaign_id}`);
        
        try {
          // 1. First, update the campaign_analytics table
          const { data: campaignAnalytics, error: fetchAnalyticsError } = await supabase
            .from("campaign_analytics")
            .select("id, opened_count")
            .eq("campaign_id", trackingData.campaign_id)
            .single();
            
          if (fetchAnalyticsError) {
            console.error("Error fetching campaign analytics:", fetchAnalyticsError);
            
            // If the record doesn't exist, try to create it
            if (fetchAnalyticsError.code === "PGRST116") {
              console.log("Campaign analytics record not found, creating new record");
              const { error: insertError } = await supabase
                .from("campaign_analytics")
                .insert({
                  campaign_id: trackingData.campaign_id,
                  opened_count: 1,
                  last_event_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
              if (insertError) {
                console.error("Error creating campaign analytics:", insertError);
              } else {
                console.log("Created new campaign analytics record");
              }
            }
          } else {
            console.log("Found campaign analytics record:", campaignAnalytics);
            const { error: campaignAnalyticsError } = await supabase
              .from("campaign_analytics")
              .update({
                opened_count: (campaignAnalytics?.opened_count || 0) + 1,
                last_event_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq("id", campaignAnalytics.id);
              
            if (campaignAnalyticsError) {
              console.error("Error updating campaign analytics:", campaignAnalyticsError);
            } else {
              console.log("Successfully updated campaign analytics");
            }
          }
        } catch (error) {
          console.error("Unexpected error updating campaign analytics:", error);
        }
        
        // 2. Next, update the recipient_analytics table if we have a contact_id
        if (trackingData.contact_id) {
          const { data: recipientAnalytics, error: fetchRecipientError } = await supabase
            .from("recipient_analytics")
            .select("open_count, first_opened_at")
            .eq("campaign_id", trackingData.campaign_id)
            .eq("recipient_id", trackingData.contact_id)
            .single();
            
          if (fetchRecipientError) {
            console.error("Error fetching recipient analytics:", fetchRecipientError);
          } else {
            const { error: recipientAnalyticsError } = await supabase
              .from("recipient_analytics")
              .update({
                last_opened_at: new Date().toISOString(),
                open_count: (recipientAnalytics?.open_count || 0) + 1,
                updated_at: new Date().toISOString(),
                first_opened_at: recipientAnalytics?.first_opened_at || new Date().toISOString()
              })
              .eq("campaign_id", trackingData.campaign_id)
              .eq("recipient_id", trackingData.contact_id);
              
            if (recipientAnalyticsError) {
              console.error("Error updating recipient analytics:", recipientAnalyticsError);
            }
          }
        }
        
        // 3. Record in the newer email_events table for campaign analytics
        const { error: campaignEventError } = await supabase
          .from("email_events")
          .insert({
            campaign_id: trackingData.campaign_id,
            recipient_id: trackingData.contact_id,
            event_type: "opened",
            event_data: {
              user_agent: userAgent,
              ip_address: ipAddress,
              tracking_id: trackingId
            },
            ip_address: ipAddress,
            user_agent: userAgent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (campaignEventError) {
          console.error("Error recording campaign event:", campaignEventError);
        }
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