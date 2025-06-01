import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client with service role for database operations
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== Send Email Simple Function ===");
    
    // Check for basic auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No valid Authorization header found");
      return new Response(JSON.stringify({
        error: "No valid Authorization header",
        status: "Error"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log("Token received, length:", token.length);
    
    // Parse request body
    const { 
      userId, 
      to, 
      subject, 
      html, 
      body,
      trackOpens = true, 
      trackClicks = true,
      campaign_id = null,
      contact_id = null
    } = await req.json();
    
    const emailContent = html || body;
    
    console.log("Email request:", {
      hasUserId: !!userId,
      hasTo: !!to,
      hasSubject: !!subject,
      hasContent: !!emailContent,
      hasCampaignId: !!campaign_id
    });
    
    if (!userId || !to || !subject || !emailContent) {
      console.error("Missing required fields");
      return new Response(JSON.stringify({
        error: "Missing required fields",
        details: {
          hasUserId: !!userId,
          hasTo: !!to,
          hasSubject: !!subject,
          hasContent: !!emailContent
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log(`📧 Sending email from user ${userId} to ${to}`);
    
    // Get the user's Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .single();
      
    if (integrationError || !integration) {
      console.error("Gmail integration not found:", integrationError);
      return new Response(JSON.stringify({
        error: "Gmail integration not found or not active"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log("Gmail integration found for user");
    
    // Check if access token is expired and refresh if needed
    const now = new Date();
    const expiresAt = new Date(integration.expires_at);
    
    let accessToken = integration.access_token;
    
    if (now >= expiresAt && integration.refresh_token) {
      console.log("Access token expired, refreshing...");
      
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
          refresh_token: integration.refresh_token,
          grant_type: "refresh_token"
        })
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        
        // Update the integration with new access token
        await supabase
          .from('user_integrations')
          .update({
            access_token: accessToken,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', integration.id);
          
        console.log("Access token refreshed successfully");
      } else {
        console.error("Failed to refresh access token");
        return new Response(JSON.stringify({
          error: "Failed to refresh Gmail access token"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Generate tracking pixel if requested
    let finalHtmlContent = emailContent;
    if (trackOpens && campaign_id) {
      const trackingId = crypto.randomUUID();
      const trackingPixel = `<img src="${supabaseUrl}/functions/v1/email-tracker?id=${trackingId}&campaign=${campaign_id}&contact=${contact_id || ''}" width="1" height="1" style="display:none;" />`;
      finalHtmlContent += trackingPixel;
      
      // Store tracking record
      await supabase
        .from('email_events')
        .insert({
          event_type: 'sent',
          campaign_id: campaign_id,
          contact_id: contact_id,
          tracking_id: trackingId,
          recipient_email: to,
          created_at: new Date().toISOString()
        });
    }
    
    // Create email message in Gmail format
    const emailMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      finalHtmlContent
    ].join('\r\n');
    
    // Base64 encode the message
    const encodedMessage = btoa(unescape(encodeURIComponent(emailMessage)));
    
    // Send via Gmail API
    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });
    
    if (!sendResponse.ok) {
      const errorData = await sendResponse.json();
      console.error("Gmail API error:", errorData);
      return new Response(JSON.stringify({
        error: "Failed to send email via Gmail",
        details: errorData
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const sendData = await sendResponse.json();
    console.log("Email sent successfully:", sendData.id);
    
    return new Response(JSON.stringify({
      success: true,
      messageId: sendData.id,
      to: to,
      subject: subject,
      status: "Success"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({
      error: error.message || "An unexpected error occurred",
      status: "Error",
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});