import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ENHANCED: Helper function to auto-label emails for organization
async function labelSentEmail(emailId: string, accessToken: string, campaignId?: string) {
  try {
    console.log(`🏷️  Auto-labeling email ${emailId}...`);
    
    // First, ensure CRM labels exist
    const labels = await ensureCRMLabels(accessToken, campaignId);
    
    // Apply labels to the sent email
    if (labels.length > 0) {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            addLabelIds: labels
          })
        }
      );
      
      if (response.ok) {
        console.log(`✅ Successfully labeled email ${emailId} with CRM labels`);
        return labels;
      } else {
        console.log(`⚠️  Label application failed with status ${response.status}`);
      }
    }
    return [];
  } catch (error) {
    console.log('⚠️  Label application failed (non-critical):', error.message);
    // Don't fail the email send for labeling errors
    return [];
  }
}

// ENHANCED: Helper function to ensure CRM labels exist
async function ensureCRMLabels(accessToken: string, campaignId?: string) {
  const labelNames = ['CRM-Sent'];
  if (campaignId) {
    labelNames.push(`CRM-Campaign-${campaignId.substring(0, 8)}`);
  }
  
  const labelIds = [];
  
  for (const labelName of labelNames) {
    try {
      // Check if label exists
      const existingLabels = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      
      const labelsData = await existingLabels.json();
      let label = labelsData.labels?.find(l => l.name === labelName);
      
      if (!label) {
        // Create the label
        const createResponse = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/labels',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: labelName,
              labelListVisibility: 'labelShow',
              messageListVisibility: 'show',
              color: { backgroundColor: '#4285f4' } // CRM blue
            })
          }
        );
        
        if (createResponse.ok) {
          label = await createResponse.json();
          console.log(`🆕 Created label: ${labelName}`);
        }
      }
      
      if (label?.id) {
        labelIds.push(label.id);
      }
    } catch (error) {
      console.log(`⚠️  Failed to create/find label ${labelName}:`, error.message);
    }
  }
  
  return labelIds;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create client with the user's JWT for authentication
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") as string, {
      global: {
        headers: {
          authorization: authHeader
        }
      }
    });

    // Verify the user's authentication
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

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
    let userIdToUse = userId || user.id;
    
    // Verify campaign ownership if campaign_id is provided
    if (campaign_id) {
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
      
      // Ensure the authenticated user owns this campaign
      if (campaignData.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: You don't own this campaign" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      userIdToUse = campaignData.user_id;
    }
    
    // Ensure the userIdToUse matches the authenticated user
    if (userIdToUse && userIdToUse !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: User ID mismatch" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
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
    
    console.log(`📧 Preparing ENHANCED email send from user ${userIdToUse} to ${to}`);
    if (campaign_id) {
      console.log(`🎯 Campaign email: ${campaign_id}`);
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
    
    // ENHANCED: 3. Generate tracking pixel with stealth placement
    let trackingPixelId = null;
    let modifiedBody = emailContent;
    
    if (trackOpens) {
      // Generate a unique ID for tracking
      trackingPixelId = crypto.randomUUID();
      // Use the edge function for tracking
      const trackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${trackingPixelId}`;
      
      // ENHANCED: Use more natural tracking pixel placement for better stealth
      const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="position:absolute;left:-9999px;top:-9999px;visibility:hidden;opacity:0;border:0;outline:0;" loading="lazy" />`;
      
      // Insert near the end but before closing body tag for better stealth
      if (modifiedBody.includes('</body>')) {
        modifiedBody = modifiedBody.replace('</body>', `${trackingPixel}</body>`);
      } else if (modifiedBody.includes('</html>')) {
        modifiedBody = modifiedBody.replace('</html>', `${trackingPixel}</html>`);
      } else {
        // Add tracking pixel with some spacing to appear more natural
        modifiedBody += `\n\n${trackingPixel}`;
      }
      
      console.log(`🎯 Enhanced tracking pixel added with ID: ${trackingPixelId}`);
    }

    // ENHANCED: 3.5. Add unsubscribe link for campaign emails
    if (campaign_id) {
      // Generate unsubscribe token
      const unsubscribeData = {
        email: to,
        campaign_id: campaign_id,
        contact_id: contact_id,
        timestamp: Date.now()
      };
      const unsubscribeToken = btoa(JSON.stringify(unsubscribeData));
      const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}&email=${encodeURIComponent(to)}&campaign=${campaign_id}`;
      
      // Create unsubscribe footer
      const unsubscribeFooter = `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          <p>You received this email because you are subscribed to our updates.</p>
          <p><a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from this campaign</a> | <a href="mailto:support@example.com" style="color: #6b7280; text-decoration: underline;">Contact Support</a></p>
        </div>
      `;
      
      // Add unsubscribe footer to email
      if (modifiedBody.includes('</body>')) {
        modifiedBody = modifiedBody.replace('</body>', `${unsubscribeFooter}</body>`);
      } else if (modifiedBody.includes('</html>')) {
        modifiedBody = modifiedBody.replace('</html>', `${unsubscribeFooter}</html>`);
      } else {
        modifiedBody += unsubscribeFooter;
      }
      
      console.log(`📧 Unsubscribe link added for campaign: ${campaign_id}`);
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
      
      if (trackedLinks.length > 0) {
        console.log(`🔗 Enhanced click tracking added for ${trackedLinks.length} links`);
      }
    }
    
    // ENHANCED: 5. Create more personal email headers for better deliverability
    const emailLines = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      `X-Mailer: Gmail`,  // ENHANCED: Appear more personal
      `X-Priority: 3`,    // ENHANCED: Normal priority
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
    
    // ENHANCED: 6. Send email with improved personal appearance
    console.log("🚀 Sending ENHANCED email via Gmail API");
    console.log("📧 Email recipient:", to);
    console.log("📝 Email subject:", subject);
    console.log("🔑 Using Gmail token (first 10 chars):", accessToken.substring(0, 10) + "...");
    
    let emailId;
    let appliedLabels = [];
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
      
      console.log(`✅ Email sent successfully with ID: ${emailId}`);
      
      // ENHANCED: Auto-label the sent email for organization
      appliedLabels = await labelSentEmail(emailId, accessToken, campaign_id);
      
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
        campaign_id: campaign_id,
        updated_at: new Date().toISOString()
      })
      .select();
      
    if (trackingError) {
      console.error("Error recording email tracking:", trackingError);
      console.error("Tracking data that failed:", {
        email_id: emailId,
        user_id: userIdToUse,
        recipient: to,
        subject: subject,
        tracking_pixel_id: trackingPixelId,
        tracking_pixel_id_type: typeof trackingPixelId
      });
      // Don't fail the entire operation for tracking errors, but log extensively
    } else {
      console.log("📊 Successfully recorded email tracking with pixel ID:", trackingPixelId);
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
      console.log(`📈 Updating campaign analytics for campaign ${campaign_id}`);
      
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
        console.log(`📊 Updating recipient analytics for contact ${contact_id}`);
        
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
      console.log("📝 Logging email send event");
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
        contact_id: contact_id,
        enhanced_features: {
          labels_applied: appliedLabels.length,
          stealth_tracking: true,
          personal_headers: true
        }
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