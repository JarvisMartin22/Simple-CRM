import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ body?: { data?: string } }>;
  };
}

interface BounceDetection {
  messageId: string;
  originalRecipient?: string;
  bounceType: 'hard' | 'soft' | 'complaint';
  bounceReason: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking Gmail bounces for user: ${userId}`);

    // Get user's Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .single();

    if (integrationError || !integration) {
      throw new Error('Gmail integration not found');
    }

    if (!integration.access_token) {
      throw new Error('No access token found');
    }

    // Check if token needs refresh
    let accessToken = integration.access_token;
    if (integration.expires_at && new Date(integration.expires_at) <= new Date()) {
      console.log('Access token expired, refreshing...');
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh Gmail token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update the integration with new token
      await supabase
        .from('user_integrations')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id);
    }

    // Search for bounce-related messages in the last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const query = `subject:("Mail Delivery" OR "Delivery Status" OR "Undelivered" OR "Returned mail" OR "Delivery failure") after:${oneWeekAgo.toISOString().split('T')[0]}`;

    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(`Gmail API error: ${messagesResponse.status}`);
    }

    const messagesData = await messagesResponse.json();
    const bounces: BounceDetection[] = [];

    if (messagesData.messages) {
      console.log(`Found ${messagesData.messages.length} potential bounce messages`);

      // Process each message to extract bounce information
      for (const message of messagesData.messages) {
        try {
          const messageResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
              },
            }
          );

          if (!messageResponse.ok) continue;

          const messageData: GmailMessage = await messageResponse.json();
          const bounce = extractBounceInfo(messageData);

          if (bounce) {
            bounces.push(bounce);
          }
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
        }
      }
    }

    console.log(`Detected ${bounces.length} bounces`);

    // Process bounces and update campaign analytics
    const processedBounces = [];
    for (const bounce of bounces) {
      try {
        // Find the original email tracking record
        const { data: tracking, error: trackingError } = await supabase
          .from('email_tracking')
          .select('*')
          .eq('user_id', userId)
          .eq('recipient', bounce.originalRecipient || '')
          .order('created_at', { ascending: false })
          .limit(1);

        if (trackingError || !tracking || tracking.length === 0) {
          console.log(`No tracking found for recipient: ${bounce.originalRecipient}`);
          continue;
        }

        const trackingRecord = tracking[0];

        // Create bounce event
        const { error: eventError } = await supabase
          .from('email_events')
          .insert({
            campaign_id: trackingRecord.campaign_id,
            recipient_id: null, // We might not have the contact ID
            event_type: bounce.bounceType === 'complaint' ? 'complained' : 'bounced',
            event_data: {
              bounce_type: bounce.bounceType,
              bounce_reason: bounce.bounceReason,
              gmail_message_id: bounce.messageId,
              original_recipient: bounce.originalRecipient
            },
            created_at: bounce.timestamp
          });

        if (eventError) {
          console.error('Error creating bounce event:', eventError);
        } else {
          console.log(`Created bounce event for ${bounce.originalRecipient}`);
          processedBounces.push(bounce);

          // Update campaign analytics
          if (trackingRecord.campaign_id) {
            const updateField = bounce.bounceType === 'complaint' ? 'complained_count' : 'bounced_count';
            await supabase
              .from('campaign_analytics')
              .update({
                [updateField]: supabase.sql`${updateField} + 1`,
                last_event_at: bounce.timestamp,
                updated_at: new Date().toISOString()
              })
              .eq('campaign_id', trackingRecord.campaign_id);
          }
        }
      } catch (error) {
        console.error(`Error processing bounce for ${bounce.originalRecipient}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bounces_detected: bounces.length,
        bounces_processed: processedBounces.length,
        bounces: processedBounces
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking Gmail bounces:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to check Gmail bounces'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractBounceInfo(message: GmailMessage): BounceDetection | null {
  try {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';
    
    // Get message body
    let bodyText = '';
    if (message.payload.body?.data) {
      bodyText = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.body?.data) {
          bodyText += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }
    }

    // Check if this is actually a bounce message
    const bounceKeywords = [
      'delivery failure', 'mail delivery', 'undelivered', 'returned mail',
      'delivery status notification', 'bounce', 'mailer-daemon'
    ];

    const subjectLower = subject.toLowerCase();
    const bodyLower = bodyText.toLowerCase();
    
    const isBounce = bounceKeywords.some(keyword => 
      subjectLower.includes(keyword) || bodyLower.includes(keyword)
    );

    if (!isBounce) {
      return null;
    }

    // Extract recipient email
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const emailMatches = bodyText.match(emailRegex) || [];
    
    // Filter out common system emails
    const recipient = emailMatches.find(email => 
      !email.includes('mailer-daemon') && 
      !email.includes('postmaster') &&
      !email.includes('noreply')
    );

    // Determine bounce type
    let bounceType: 'hard' | 'soft' | 'complaint' = 'soft';
    let bounceReason = 'Unknown bounce reason';

    if (bodyLower.includes('permanent') || bodyLower.includes('user unknown') || 
        bodyLower.includes('mailbox unavailable') || bodyLower.includes('550')) {
      bounceType = 'hard';
      bounceReason = 'Permanent delivery failure';
    } else if (bodyLower.includes('temporary') || bodyLower.includes('452') || 
               bodyLower.includes('mailbox full')) {
      bounceType = 'soft';
      bounceReason = 'Temporary delivery failure';
    } else if (bodyLower.includes('spam') || bodyLower.includes('complaint') ||
               bodyLower.includes('abuse')) {
      bounceType = 'complaint';
      bounceReason = 'Spam complaint';
    }

    // Extract more specific reason if possible
    const reasonPatterns = [
      /reason:\s*(.+)/i,
      /error:\s*(.+)/i,
      /status:\s*(.+)/i,
      /diagnostic:\s*(.+)/i
    ];

    for (const pattern of reasonPatterns) {
      const match = bodyText.match(pattern);
      if (match && match[1]) {
        bounceReason = match[1].trim().substring(0, 200);
        break;
      }
    }

    return {
      messageId: message.id,
      originalRecipient: recipient,
      bounceType,
      bounceReason,
      timestamp: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString()
    };

  } catch (error) {
    console.error('Error extracting bounce info:', error);
    return null;
  }
}