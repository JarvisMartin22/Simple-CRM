import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EmailSection {
  id: string;
  type: string;
  content: string;
  tracking?: boolean;
}

interface EnhancedEmailRequest {
  userId: string;
  to: string;
  subject: string;
  html?: string;
  template?: {
    sections: EmailSection[];
  };
  trackOpens?: boolean;
  trackClicks?: boolean;
  trackSections?: boolean;
  campaign_id?: string;
  contact_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== Enhanced Email Send Function ===");
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: "No valid Authorization header",
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const requestData: EnhancedEmailRequest = await req.json();
    const { 
      userId, 
      to, 
      subject, 
      html,
      template,
      trackOpens = true, 
      trackClicks = true,
      trackSections = false,
      campaign_id = null,
      contact_id = null
    } = requestData;
    
    // Build email content from template or use provided HTML
    let emailContent = html || '';
    const trackingPixels: string[] = [];
    const mainTrackingId = crypto.randomUUID();
    
    if (template?.sections) {
      // Build email from sections
      emailContent = '<div style="max-width: 600px; margin: 0 auto;">';
      
      for (const section of template.sections) {
        emailContent += `<div id="${section.id}" class="email-section email-section-${section.type}">`;
        emailContent += section.content;
        
        // Add section tracking pixel if enabled
        if (trackSections && section.tracking !== false && campaign_id) {
          const sectionPixelUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${mainTrackingId}&type=section&section=${section.id}&campaign=${campaign_id}`;
          emailContent += `<img src="${sectionPixelUrl}" width="1" height="1" alt="" style="display:block;height:0;width:0;border:0;" />`;
        }
        
        emailContent += '</div>';
      }
      
      emailContent += '</div>';
    }
    
    // Add main tracking pixel at the end
    if (trackOpens && campaign_id) {
      const mainPixelUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${mainTrackingId}&type=open&campaign=${campaign_id}&contact=${contact_id || ''}`;
      trackingPixels.push(`<img src="${mainPixelUrl}" width="1" height="1" alt="" />`);
    }
    
    // Add re-open tracking pixel
    if (trackOpens && campaign_id) {
      const reopenPixelUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${mainTrackingId}&type=reopen&campaign=${campaign_id}`;
      trackingPixels.push(`<img src="${reopenPixelUrl}" width="1" height="1" alt="" style="display:none;" />`);
    }
    
    // Process links for click tracking
    if (trackClicks) {
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
      emailContent = emailContent.replace(linkRegex, (match, quote, href) => {
        if (href.startsWith('mailto:') || href.startsWith('#')) {
          return match; // Don't track mailto or anchor links
        }
        
        // Use the main tracking ID for link tracking
        const trackingUrl = `${supabaseUrl}/functions/v1/link-tracker?id=${mainTrackingId}&url=${encodeURIComponent(href)}`;
        
        return match.replace(href, trackingUrl);
      });
    }
    
    // Append all tracking pixels at the end
    const finalHtmlContent = emailContent + trackingPixels.join('');
    
    console.log(`📧 Sending enhanced email from user ${userId} to ${to}`);
    
    // Get Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .single();
      
    if (integrationError || !integration) {
      return new Response(JSON.stringify({
        error: "Gmail integration not found or not active"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Refresh token if needed (similar to original function)
    let accessToken = integration.access_token;
    const now = new Date();
    const expiresAt = new Date(integration.expires_at);
    
    if (now >= expiresAt && integration.refresh_token) {
      console.log("Refreshing access token...");
      
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
        
        await supabase
          .from('user_integrations')
          .update({
            access_token: accessToken,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', integration.id);
      } else {
        return new Response(JSON.stringify({
          error: "Failed to refresh Gmail access token"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Store initial tracking record
    if (campaign_id) {
      const { error: eventError } = await supabase
        .from('email_events')
        .insert({
          event_type: 'sent',
          campaign_id: campaign_id,
          contact_id: contact_id,
          tracking_id: mainTrackingId,
          recipient_email: to,
          event_data: {
            subject: subject,
            has_sections: !!template?.sections,
            section_count: template?.sections?.length || 0,
            tracking_enabled: {
              opens: trackOpens,
              clicks: trackClicks,
              sections: trackSections
            }
          },
          created_at: new Date().toISOString()
        });
        
      if (eventError) {
        console.error("Error storing email event:", eventError);
      }
    }
    
    // Create and send email via Gmail
    const emailMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      finalHtmlContent
    ].join('\r\n');
    
    const encodedMessage = btoa(unescape(encodeURIComponent(emailMessage)));
    
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
    console.log("Enhanced email sent successfully:", sendData.id);
    
    // Track delivered event (Gmail usually delivers immediately)
    if (campaign_id) {
      setTimeout(async () => {
        await supabase.rpc('track_email_delivered', {
          p_campaign_id: campaign_id,
          p_recipient_email: to,
          p_message_id: sendData.id
        });
      }, 1000);
    }
    
    return new Response(JSON.stringify({
      success: true,
      messageId: sendData.id,
      trackingId: mainTrackingId,
      to: to,
      subject: subject,
      features: {
        trackingEnabled: trackOpens || trackClicks || trackSections,
        sectionsTracked: template?.sections?.filter(s => s.tracking !== false).length || 0
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({
      error: error.message || "An unexpected error occurred",
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});