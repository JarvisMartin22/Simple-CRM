import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  const debug: any = {
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: {}
  };
  
  // Log all headers
  req.headers.forEach((value, key) => {
    debug.headers[key] = key === 'authorization' ? value.substring(0, 20) + '...' : value;
  });
  
  // Check environment variables
  debug.env = {
    hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
    hasAnonKey: !!Deno.env.get("SUPABASE_ANON_KEY"),
    hasServiceKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    hasGoogleClientId: !!Deno.env.get("GOOGLE_CLIENT_ID"),
    hasGoogleSecret: !!Deno.env.get("GOOGLE_CLIENT_SECRET"),
    supabaseUrl: Deno.env.get("SUPABASE_URL"),
    anonKeyLength: Deno.env.get("SUPABASE_ANON_KEY")?.length || 0
  };
  
  // Try to verify auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    debug.authError = "No Authorization header";
    return new Response(JSON.stringify({ debug, error: "No auth header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  const API_URL = Deno.env.get("SUPABASE_URL") || "";
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  debug.authAttempt = {
    hasAuthHeader: true,
    apiUrl: API_URL,
    anonKeyPresent: !!ANON_KEY
  };
  
  try {
    // Try to create client and verify user
    const supabase = createClient(API_URL, ANON_KEY, {
      global: {
        headers: {
          authorization: authHeader
        }
      }
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    debug.authResult = {
      success: !!user,
      error: error?.message,
      userId: user?.id,
      userEmail: user?.email
    };
    
    if (!user) {
      return new Response(JSON.stringify({ debug, error: "Auth failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Success - return debug info
    return new Response(JSON.stringify({ 
      debug, 
      success: true,
      message: "Auth verified successfully",
      url: "https://accounts.google.com/o/oauth2/v2/auth?test=true" // Dummy URL for testing
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (err) {
    debug.exception = {
      message: err.message,
      stack: err.stack
    };
    
    return new Response(JSON.stringify({ debug, error: "Exception occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});