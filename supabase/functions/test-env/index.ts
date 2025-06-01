import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Skip auth for this diagnostic function
  console.log("Environment diagnostic function called");

  // Test environment variables
  const envVars = {
    GOOGLE_CLIENT_ID: {
      exists: !!Deno.env.get("GOOGLE_CLIENT_ID"),
      length: (Deno.env.get("GOOGLE_CLIENT_ID") || "").length,
      firstChars: (Deno.env.get("GOOGLE_CLIENT_ID") || "").substring(0, 10)
    },
    GOOGLE_CLIENT_SECRET: {
      exists: !!Deno.env.get("GOOGLE_CLIENT_SECRET"),
      length: (Deno.env.get("GOOGLE_CLIENT_SECRET") || "").length,
      firstChars: (Deno.env.get("GOOGLE_CLIENT_SECRET") || "").substring(0, 10)
    },
    GMAIL_REDIRECT_URI: {
      exists: !!Deno.env.get("GMAIL_REDIRECT_URI"),
      length: (Deno.env.get("GMAIL_REDIRECT_URI") || "").length,
      value: Deno.env.get("GMAIL_REDIRECT_URI") || ""
    },
    SUPABASE_ANON_KEY: {
      exists: !!Deno.env.get("SUPABASE_ANON_KEY"),
      length: (Deno.env.get("SUPABASE_ANON_KEY") || "").length,
      firstChars: (Deno.env.get("SUPABASE_ANON_KEY") || "").substring(0, 10)
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      length: (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").length,
      firstChars: (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").substring(0, 10)
    },
    SUPABASE_URL: {
      exists: !!Deno.env.get("SUPABASE_URL"),
      length: (Deno.env.get("SUPABASE_URL") || "").length,
      value: Deno.env.get("SUPABASE_URL") || ""
    }
  };

  console.log("Environment Variables Check:", envVars);

  return new Response(
    JSON.stringify({
      message: "Environment variables diagnostic",
      timestamp: new Date().toISOString(),
      envVars
    }),
    { 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
});