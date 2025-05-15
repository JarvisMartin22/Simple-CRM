import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Transparent 1x1 pixel GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 
  0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 
  0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 
  0x44, 0x01, 0x00, 0x3b
]);

serve(async (req) => {
  const url = new URL(req.url);
  const trackingId = url.searchParams.get('id');
  
  // Return tracking pixel regardless of success/failure
  const headers = {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  
  if (!trackingId) {
    console.error("Missing tracking ID");
    return new Response(TRACKING_PIXEL, { headers });
  }
  
  try {
    console.log(`Recording open for tracking ID: ${trackingId}`);
    
    // Get the user agent and IP for analytics
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ip = req.headers.get('x-forwarded-for') || 'Unknown';
    
    // Record the open event
    const { data, error } = await supabase
      .from('email_tracking')
      .update({ 
        opened_at: new Date().toISOString(),
        open_count: supabase.sql`open_count + 1`,
        last_opened_at: new Date().toISOString(),
        last_user_agent: userAgent,
        last_ip: ip
      })
      .eq('tracking_pixel_id', trackingId)
      .select('user_id, email_id, recipient, subject');
    
    if (error) {
      console.error("Error recording email open:", error);
    } else if (data && data.length > 0) {
      // Log the open event
      await supabase
        .from('email_events')
        .insert({
          email_tracking_id: trackingId,
          user_id: data[0].user_id,
          email_id: data[0].email_id,
          event_type: 'open',
          recipient: data[0].recipient,
          subject: data[0].subject,
          user_agent: userAgent,
          ip_address: ip,
          created_at: new Date().toISOString()
        });
      
      // Create a notification for the user
      await supabase
        .from('user_notifications')
        .insert({
          user_id: data[0].user_id,
          type: 'email_opened',
          content: `Your email "${data[0].subject}" was opened by ${data[0].recipient}`,
          email_id: data[0].email_id,
          read: false,
          created_at: new Date().toISOString()
        });
        
      console.log(`Successfully recorded open for email to ${data[0].recipient}`);
    }
  } catch (error) {
    console.error("Error in email tracking:", error);
  }
  
  // Always return the tracking pixel
  return new Response(TRACKING_PIXEL, { headers });
}); 