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
    const { userId, to, subject, body, trackOpens = true, trackClicks = true } = await req.json();
    
    if (!userId || !to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Preparing to send email from user ${userId} to ${to}`);
    
    // 1. Get the user's Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .single();
      
    if (integrationError) {
      console.error("Error fetching integration:", integrationError);
      return new Response(
        JSON.stringify({ error: "Gmail integration not found" }),
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
    let modifiedBody = body;
    
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
          user_id: userId
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
    const encodedEmail = btoa(emailString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // 6. Send the email via Gmail API
    console.log("Sending email via Gmail API");
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send email: ${error.error?.message || response.statusText}`);
    }
    
    const emailData = await response.json();
    const emailId = emailData.id;
    
    console.log(`Email sent successfully with ID: ${emailId}`);
    
    // 7. Record the email in our tracking system
    const { data: trackingData, error: trackingError } = await supabase
      .from('email_tracking')
      .insert({
        email_id: emailId,
        user_id: userId,
        recipient: to,
        subject: subject,
        sent_at: new Date().toISOString(),
        provider: 'gmail',
        tracking_pixel_id: trackingPixelId,
        updated_at: new Date().toISOString(),
        open_count: 0,
        click_count: 0
      })
      .select();
      
    if (trackingError) {
      console.error("Error recording email tracking:", trackingError);
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
    
    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailId,
        tracking_id: trackingData ? trackingData[0].id : null,
        tracking_pixel_id: trackingPixelId,
        links_tracked: trackedLinks.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Send email error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 