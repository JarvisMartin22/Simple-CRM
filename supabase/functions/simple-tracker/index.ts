import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("id");

    console.log(`🎯 Simple tracker called with ID: ${trackingId}`);

    // Create 1x1 transparent GIF
    const gif = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
      0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
      0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
      0x01, 0x00, 0x3B
    ]);

    // If no tracking ID, just return the pixel
    if (!trackingId) {
      console.log("⚠️ No tracking ID provided");
      return new Response(gif, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }
      });
    }

    // Try to update the tracking record
    try {
      const supabase = createClient(supabaseUrl, serviceKey);
      
      const { error } = await supabase
        .from("email_tracking")
        .update({
          opened_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("tracking_pixel_id", trackingId);

      if (error) {
        console.log(`❌ Error updating: ${error.message}`);
      } else {
        console.log(`✅ Successfully tracked open for: ${trackingId}`);
      }
    } catch (dbError) {
      console.log(`⚠️ Database error: ${dbError.message}`);
    }

    // Always return the tracking pixel
    return new Response(gif, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      }
    });

  } catch (error) {
    console.log(`💥 Function error: ${error.message}`);
    
    // Return tracking pixel even on error
    const gif = new Uint8Array([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
      0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
      0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
      0x01, 0x00, 0x3B
    ]);

    return new Response(gif, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      }
    });
  }
}); 