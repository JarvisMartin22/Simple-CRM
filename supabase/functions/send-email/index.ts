import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userId, 
      to, 
      subject, 
      html, 
      body,  // Support both 'html' and 'body' parameters
      trackOpens = true, 
      trackClicks = true,
      campaign_id = null,
      contact_id = null
    } = await req.json();
    
    // Use either html or body parameter
    const emailContent = html || body;
    
    // Check if we have direct user ID or need to get it from campaign
    let userIdToUse = userId;
    
    if (!userIdToUse && campaign_id) {
      // Get user ID from the campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('user_id')
        .eq('id', campaign_id)
        .single();
        
      if (campaignError) {
        return new Response(
          JSON.stringify({ error: "Campaign not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      userIdToUse = campaignData.user_id;
    }
    
    if (!userIdToUse || !to || !subject || !emailContent) {
      console.error("Missing required fields:", {
        hasUserId: !!userIdToUse,
        hasTo: !!to,
        hasSubject: !!subject,
        hasContent: !!emailContent
      });
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields",
          details: {
            hasUserId: !!userIdToUse,
            hasTo: !!to,
            hasSubject: !!subject,
            hasContent: !!emailContent
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Preparing to send email from user ${userIdToUse} to ${to}`);
    if (campaign_id) {
      console.log(`As part of campaign ${campaign_id}`);
    }
    
    // 1. Get the user's Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userIdToUse)
      .eq('provider', 'gmail')
      .single();
      
    if (integrationError) {
      console.error("Error fetching integration:", integrationError);
      return new Response(
        JSON.stringify({ error: "Gmail integration not found or not active" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // 2. Check if token needs refreshing
    const now = new Date();
    const expiresAt = new Date(integration.expires_at);
    let accessToken = integration.access_token;
    
    if (expiresAt < now) {
      console.log("Token expired, refreshing...");
      try {
        // Refresh the token
        const response = await fetch(`${supabaseUrl}/functions/v1/gmail-auth`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ refresh_token: integration.refresh_token }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to refresh token: ${response.statusText}`);
        }
        
        const refreshData = await response.json();
        
        // Update token in database
        await supabase
          .from('user_integrations')
          .update({
            access_token: refreshData.access_token,
            expires_at: refreshData.expires_at,
          })
          .eq('id', integration.id);
          
        accessToken = refreshData.access_token;
        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Token refresh error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to refresh access token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }
    
    // 3. Generate tracking pixel ID if needed
    let trackingPixelId = null;
    let modifiedBody = emailContent;
    
    if (trackOpens) {
      // Generate a unique ID for tracking
      trackingPixelId = crypto.randomUUID();
      const trackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${trackingPixelId}`;
      
      // Append tracking pixel to email body
      modifiedBody += `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;"/>`;
    }
    
    // 4. Process links for click tracking if needed
    const trackedLinks = [];
    if (trackClicks) {
      // Simple regex to find all links in the HTML
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
      let match;
      
      while ((match = linkRegex.exec(modifiedBody)) !== null) {
        const fullMatch = match[0];
        const url = match[2];
        const linkTrackingId = crypto.randomUUID();
        const trackingUrl = `${supabaseUrl}/functions/v1/link-tracker?id=${linkTrackingId}&url=${encodeURIComponent(url)}`;
        
        // Store the link for database
        trackedLinks.push({
          tracking_id: linkTrackingId,
          original_url: url,
          user_id: userIdToUse
        });
        
        // Replace the link in the email
        modifiedBody = modifiedBody.replace(fullMatch, fullMatch.replace(url, trackingUrl));
      }
    }
    
    // 5. Encode the email for Gmail API
    const emailLines = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      modifiedBody
    ];
    
    // Join lines with CRLF as per RFC 5322
    const emailString = emailLines.join('\r\n');
    
    // Encode to base64url format as required by Gmail API
    // Handle UTF-8 encoding properly by using TextEncoder first
    const encoder = new TextEncoder();
    const emailBytes = encoder.encode(emailString);
    
    // Convert to base64 - in Deno, use a different approach than btoa which can have issues with binary data
    const base64Email = btoa(String.fromCharCode(...new Uint8Array(emailBytes)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // 6. Send the email via Gmail API
    console.log("Sending email via Gmail API");
    console.log("Email recipient:", to);
    console.log("Email subject:", subject);
    console.log("Using Gmail token (first 10 chars):", accessToken.substring(0, 10) + "...");
    
    let emailId;
    try {
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raw: base64Email
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gmail API error response:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to send email: ${errorData.error?.message || response.statusText}`);
      }
      
      const emailData = await response.json();
      emailId = emailData.id;
      
      console.log(`Email sent successfully with ID: ${emailId}`);
    } catch (apiError) {
      console.error("Gmail API call failed:", apiError);
      throw apiError; // Re-throw to be caught by the outer try/catch
    }
    
    // 7. Record the email in our tracking system
    const { data: trackingData, error: trackingError } = await supabase
      .from('email_tracking')
      .insert({
        email_id: emailId,
        user_id: userIdToUse,
        recipient: to,
        subject: subject,
        sent_at: new Date().toISOString(),
        provider: 'gmail',
        tracking_pixel_id: trackingPixelId,
        updated_at: new Date().toISOString(),
        open_count: 0,
        click_count: 0,
        campaign_id: campaign_id,
        contact_id: contact_id
      })
      .select();
      
    if (trackingError) {
      console.error("Error recording email tracking:", trackingError);
      // Don't fail the entire operation for tracking errors
    } else {
      console.log("Successfully recorded email tracking");
    }
    
    // 8. Store tracked links if any
    if (trackedLinks.length > 0) {
      for (const link of trackedLinks) {
        await supabase
          .from('tracked_links')
          .insert({
            ...link,
            email_id: emailId,
            email_tracking_id: trackingData ? trackingData[0].id : null,
            campaign_id: campaign_id,
            contact_id: contact_id,
            created_at: new Date().toISOString()
          });
      }
    }
    
    // 9. Update recipient analytics if this is a campaign email
    if (campaign_id && contact_id) {
      // Check if recipient analytics already exists
      const { data: existingRecipient } = await supabase
        .from('recipient_analytics')
        .select('id')
        .eq('campaign_id', campaign_id)
        .eq('recipient_id', contact_id)
        .single();
        
      if (existingRecipient) {
        // Update existing record
        await supabase
          .from('recipient_analytics')
          .update({
            email_id: emailId,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecipient.id);
      } else {
        // Create new record
        await supabase
          .from('recipient_analytics')
          .insert({
            campaign_id: campaign_id,
            recipient_id: contact_id,
            email_id: emailId,
            sent_at: new Date().toISOString(),
            open_count: 0,
            click_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }
    
    // Update campaign_analytics if campaign_id is provided
    if (campaign_id) {
      console.log(`Updating campaign analytics for campaign ${campaign_id}`);
      
      // 1. Check if campaign_analytics record exists
      const { data: existingAnalytics, error: analyticsCheckError } = await supabase
        .from('campaign_analytics')
        .select('id, total_recipients, sent_count, delivered_count')
        .eq('campaign_id', campaign_id)
        .single();
        
      if (analyticsCheckError && analyticsCheckError.code !== 'PGRST116') {
        console.error("Error checking campaign analytics:", analyticsCheckError);
      }
      
      if (!existingAnalytics) {
        // Create a new entry if one doesn't exist
        console.log("Campaign analytics record not found, creating new record");
        const { error: createAnalyticsError } = await supabase
          .from('campaign_analytics')
          .insert({
            campaign_id: campaign_id,
            total_recipients: 1,
            sent_count: 1,
            delivered_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_event_at: new Date().toISOString()
          });
          
        if (createAnalyticsError) {
          console.error("Error creating campaign analytics:", createAnalyticsError);
        } else {
          console.log("Created new campaign analytics record");
        }
      } else {
        // Update existing record
        console.log("Found campaign analytics record:", existingAnalytics);
        const { error: updateAnalyticsError } = await supabase
          .from('campaign_analytics')
          .update({
            sent_count: (existingAnalytics.sent_count || 0) + 1,
            delivered_count: (existingAnalytics.delivered_count || 0) + 1,
            updated_at: new Date().toISOString(),
            last_event_at: new Date().toISOString()
          })
          .eq('id', existingAnalytics.id);
          
        if (updateAnalyticsError) {
          console.error("Error updating campaign analytics:", updateAnalyticsError);
        } else {
          console.log("Successfully updated campaign analytics");
        }
      }
      
      // Add an entry in recipient_analytics if contact_id is provided
      if (contact_id) {
        console.log(`Updating recipient analytics for contact ${contact_id}`);
        
        // Check if recipient_analytics entry exists
        const { data: existingRecipient, error: recipientCheckError } = await supabase
          .from('recipient_analytics')
          .select('id')
          .eq('campaign_id', campaign_id)
          .eq('recipient_id', contact_id)
          .single();
          
        if (recipientCheckError && recipientCheckError.code !== 'PGRST116') {
          console.error("Error checking recipient analytics:", recipientCheckError);
        }
          
        if (!existingRecipient) {
          // Create a new entry
          console.log("Recipient analytics record not found, creating new record");
          const { error: createRecipientError } = await supabase
            .from('recipient_analytics')
            .insert({
              campaign_id: campaign_id,
              recipient_id: contact_id,
              sent_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              open_count: 0,
              click_count: 0
            });
            
          if (createRecipientError) {
            console.error("Error creating recipient analytics:", createRecipientError);
          } else {
            console.log("Created new recipient analytics record");
          }
        } else {
          // Update existing entry
          console.log("Found recipient analytics record:", existingRecipient);
          const { error: updateRecipientError } = await supabase
            .from('recipient_analytics')
            .update({
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRecipient.id);
            
          if (updateRecipientError) {
            console.error("Error updating recipient analytics:", updateRecipientError);
          } else {
            console.log("Successfully updated recipient analytics");
          }
        }
      }
      
      // Log send event
      console.log("Logging email send event");
      const { error: eventError } = await supabase
        .from('email_events')
        .insert({
          campaign_id: campaign_id,
          recipient_id: contact_id,
          event_type: 'sent',
          event_data: {
            recipient: to,
            subject: subject
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (eventError) {
        console.error("Error logging send event:", eventError);
      } else {
        console.log("Successfully logged send event");
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailId,
        tracking_id: trackingData ? trackingData[0].id : null,
        tracking_pixel_id: trackingPixelId,
        links_tracked: trackedLinks.length,
        campaign_id: campaign_id,
        contact_id: contact_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Send email error:", error);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    let errorMessage = error.message || 'Unknown error occurred';
    
    if (errorMessage.includes('Gmail integration not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('Failed to refresh')) {
      statusCode = 401;
    } else if (errorMessage.includes('Failed to send email')) {
      statusCode = 502; // Bad Gateway - external service error
    } else if (errorMessage.includes('Missing required fields')) {
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 