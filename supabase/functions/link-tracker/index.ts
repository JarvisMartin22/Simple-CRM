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
      .select("id, email_tracking_id, campaign_id, contact_id")
      .eq("tracking_id", trackingId)
      .single();

    if (fetchError) {
      console.error("Error fetching tracking data:", fetchError);
      return redirectToUrl(originalUrl, req.headers.get('Origin'));
    }

    // Get the email tracking record for user_id
    const { data: emailData, error: emailError } = await supabase
      .from("email_tracking")
      .select("id, user_id, email_id, recipient, subject, campaign_id, contact_id")
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
      
      // Get campaign_id from either the tracked link or the email data
      const campaignId = trackingData.campaign_id || emailData.campaign_id;
      const contactId = trackingData.contact_id || emailData.contact_id;
      
      // Update campaign analytics if this is part of a campaign
      if (campaignId) {
        console.log(`Updating campaign analytics for campaign ${campaignId}`);
        
        try {
          // 1. First, update the campaign_analytics table
          const { data: campaignAnalytics, error: fetchAnalyticsError } = await supabase
            .from("campaign_analytics")
            .select("id, clicked_count")
            .eq("campaign_id", campaignId)
            .single();
            
          if (fetchAnalyticsError) {
            console.error("Error fetching campaign analytics:", fetchAnalyticsError);
            
            // If the record doesn't exist, try to create it
            if (fetchAnalyticsError.code === "PGRST116") {
              console.log("Campaign analytics record not found, creating new record");
              const { error: insertError } = await supabase
                .from("campaign_analytics")
                .insert({
                  campaign_id: campaignId,
                  clicked_count: 1,
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
                clicked_count: (campaignAnalytics?.clicked_count || 0) + 1,
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
        if (contactId) {
          const { data: recipientAnalytics, error: fetchRecipientError } = await supabase
            .from("recipient_analytics")
            .select("click_count, first_clicked_at")
            .eq("campaign_id", campaignId)
            .eq("recipient_id", contactId)
            .single();
            
          if (fetchRecipientError) {
            console.error("Error fetching recipient analytics:", fetchRecipientError);
          } else {
            const { error: recipientAnalyticsError } = await supabase
              .from("recipient_analytics")
              .update({
                last_clicked_at: new Date().toISOString(),
                click_count: (recipientAnalytics?.click_count || 0) + 1,
                updated_at: new Date().toISOString(),
                first_clicked_at: recipientAnalytics?.first_clicked_at || new Date().toISOString()
              })
              .eq("campaign_id", campaignId)
              .eq("recipient_id", contactId);
              
            if (recipientAnalyticsError) {
              console.error("Error updating recipient analytics:", recipientAnalyticsError);
            }
          }
        }
        
        // 3. Update or insert into link_clicks table
        const linkClicksData = {
          campaign_id: campaignId,
          recipient_id: contactId,
          link_url: originalUrl,
          click_count: 1,
          last_clicked_at: new Date().toISOString(),
          first_clicked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Try to update existing record first
        const { data: existingClick, error: existingClickError } = await supabase
          .from("link_clicks")
          .select("id, click_count")
          .eq("campaign_id", campaignId)
          .eq("link_url", originalUrl)
          .maybeSingle();
          
        if (existingClick) {
          // Update existing record
          const { error: updateClickError } = await supabase
            .from("link_clicks")
            .update({
              click_count: existingClick.click_count + 1,
              last_clicked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", existingClick.id);
            
          if (updateClickError) {
            console.error("Error updating link click:", updateClickError);
          }
        } else {
          // Insert new record
          const { error: insertClickError } = await supabase
            .from("link_clicks")
            .insert([linkClicksData]);
            
          if (insertClickError) {
            console.error("Error inserting link click:", insertClickError);
          }
        }
        
        // 4. Record in the newer email_events table for campaign analytics
        const { error: campaignEventError } = await supabase
          .from("email_events")
          .insert({
            campaign_id: campaignId,
            recipient_id: contactId,
            event_type: "clicked",
            event_data: {
              user_agent: userAgent,
              ip_address: ipAddress,
              tracking_id: trackingId,
              url: originalUrl
            },
            ip_address: ipAddress,
            user_agent: userAgent,
            link_url: originalUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (campaignEventError) {
          console.error("Error recording campaign event:", campaignEventError);
        }
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