import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const unsubscribePageHTML = (email: string, success: boolean, campaignName?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe ${success ? 'Successful' : 'Failed'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .icon {
            text-align: center;
            margin-bottom: 20px;
            font-size: 48px;
        }
        .success { color: #22c55e; }
        .error { color: #ef4444; }
        h1 {
            text-align: center;
            color: #1f2937;
            margin-bottom: 20px;
        }
        p {
            color: #6b7280;
            text-align: center;
            margin-bottom: 15px;
        }
        .email {
            background-color: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon ${success ? 'success' : 'error'}">
            ${success ? '✓' : '✗'}
        </div>
        
        <h1>${success ? 'Successfully Unsubscribed' : 'Unsubscribe Failed'}</h1>
        
        ${success ? `
            <p>You have been successfully unsubscribed from our email campaigns.</p>
            ${campaignName ? `<p>Campaign: <strong>${campaignName}</strong></p>` : ''}
            <div class="email">${email}</div>
            <p>You will no longer receive marketing emails at this address.</p>
            <p>If you change your mind, you can re-subscribe by contacting us directly.</p>
        ` : `
            <p>We encountered an error while processing your unsubscribe request.</p>
            <div class="email">${email}</div>
            <p>Please try again later or contact support if the issue persists.</p>
        `}
        
        <div class="footer">
            <p>This is an automated unsubscribe system.</p>
        </div>
    </div>
</body>
</html>
`;

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

    const url = new URL(req.url);
    const unsubscribeToken = url.searchParams.get('token');
    const email = url.searchParams.get('email');
    const campaignId = url.searchParams.get('campaign');

    if (!unsubscribeToken || !email) {
      return new Response(
        unsubscribePageHTML(email || 'unknown', false),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      );
    }

    console.log(`Processing unsubscribe for ${email}, token: ${unsubscribeToken}`);

    // Verify the unsubscribe token
    // For security, we'll encode campaign_id:email:timestamp and check if it's valid
    let decodedData: any;
    try {
      const decoded = atob(unsubscribeToken);
      decodedData = JSON.parse(decoded);
    } catch (error) {
      console.error('Invalid unsubscribe token:', error);
      return new Response(
        unsubscribePageHTML(email, false),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      );
    }

    // Validate token data
    if (decodedData.email !== email || 
        (campaignId && decodedData.campaign_id !== campaignId)) {
      console.error('Token validation failed');
      return new Response(
        unsubscribePageHTML(email, false),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      );
    }

    // Check if token is not too old (7 days max)
    const tokenAge = Date.now() - decodedData.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (tokenAge > maxAge) {
      console.error('Token expired');
      return new Response(
        unsubscribePageHTML(email, false),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      );
    }

    let campaignName = 'Unknown Campaign';

    // Get campaign information if provided
    if (campaignId) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single();
      
      if (campaign) {
        campaignName = campaign.name;
      }
    }

    // Find the contact by email
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('email', email)
      .single();

    if (contactError) {
      console.log('Contact not found, creating unsubscribe record without contact ID');
    }

    // Record the unsubscribe event
    if (campaignId) {
      const { error: eventError } = await supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          recipient_id: contact?.id || null,
          event_type: 'unsubscribed',
          event_data: {
            email: email,
            unsubscribe_token: unsubscribeToken,
            user_agent: req.headers.get('user-agent') || 'Unknown',
            ip_address: req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 'Unknown'
          }
        });

      if (eventError) {
        console.error('Error recording unsubscribe event:', eventError);
      } else {
        console.log('Unsubscribe event recorded');

        // Update campaign analytics
        await supabase
          .from('campaign_analytics')
          .update({
            unsubscribed_count: supabase.sql`unsubscribed_count + 1`,
            last_event_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId);
      }
    }

    // Add email to global unsubscribe list
    const { error: unsubscribeError } = await supabase
      .from('unsubscribes')
      .upsert({
        email: email,
        campaign_id: campaignId || null,
        contact_id: contact?.id || null,
        user_id: contact?.user_id || null,
        unsubscribed_at: new Date().toISOString(),
        method: 'link',
        ip_address: req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 'Unknown',
        user_agent: req.headers.get('user-agent') || 'Unknown'
      }, {
        onConflict: 'email,campaign_id'
      });

    if (unsubscribeError) {
      console.error('Error adding to unsubscribe list:', unsubscribeError);
      return new Response(
        unsubscribePageHTML(email, false),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      );
    }

    console.log(`Successfully unsubscribed ${email}`);

    return new Response(
      unsubscribePageHTML(email, true, campaignName),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    );

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    
    const url = new URL(req.url);
    const email = url.searchParams.get('email') || 'unknown';
    
    return new Response(
      unsubscribePageHTML(email, false),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    );
  }
});