import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const url = new URL(req.url);
  const trackingId = url.searchParams.get('id');
  const originalUrl = url.searchParams.get('url');
  
  if (!trackingId || !originalUrl) {
    return new Response(
      JSON.stringify({ error: "Missing tracking ID or URL" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
  
  try {
    console.log(`Recording click for tracking ID: ${trackingId} to URL: ${originalUrl}`);
    
    // Get the user agent and IP for analytics
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ip = req.headers.get('x-forwarded-for') || 'Unknown';
    
    // Get the link information from the database
    const { data: linkData, error: linkError } = await supabase
      .from('tracked_links')
      .select('email_tracking_id, email_id, user_id')
      .eq('tracking_id', trackingId)
      .single();
      
    if (linkError) {
      console.error("Error fetching link data:", linkError);
    } else if (linkData) {
      // Update the email tracking record
      await supabase
        .from('email_tracking')
        .update({ 
          click_count: supabase.sql`click_count + 1`,
          last_clicked_at: new Date().toISOString()
        })
        .eq('id', linkData.email_tracking_id);
      
      // Record the click event
      await supabase
        .from('email_events')
        .insert({
          email_tracking_id: linkData.email_tracking_id,
          user_id: linkData.user_id,
          email_id: linkData.email_id,
          event_type: 'click',
          url: originalUrl,
          user_agent: userAgent,
          ip_address: ip,
          created_at: new Date().toISOString()
        });
      
      // Create a notification for the user
      await supabase
        .from('user_notifications')
        .insert({
          user_id: linkData.user_id,
          type: 'email_clicked',
          content: `A link was clicked in your email: ${originalUrl}`,
          email_id: linkData.email_id,
          read: false,
          created_at: new Date().toISOString()
        });
        
      console.log(`Successfully recorded click for tracking ID: ${trackingId}`);
    }
    
    // Redirect to the original URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': originalUrl,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error("Error tracking link click:", error);
    
    // Still redirect to the original URL even if tracking fails
    return new Response(null, {
      status: 302,
      headers: {
        'Location': originalUrl,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}); 