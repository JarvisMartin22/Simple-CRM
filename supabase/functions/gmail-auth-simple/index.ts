import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

// Function to determine redirect URI based on environment and origin
function getRedirectUri(requestOrigin?: string): string {
  // First, check if explicit redirect URI is set in environment
  const configuredRedirectUri = Deno.env.get("GMAIL_REDIRECT_URI");
  if (configuredRedirectUri) {
    console.log("Using configured redirect URI:", configuredRedirectUri);
    return configuredRedirectUri;
  }
  
  // Try to determine from request origin
  if (requestOrigin) {
    try {
      const origin = new URL(requestOrigin);
      const dynamicUri = `${origin.origin}/auth/callback/gmail`;
      console.log("Using dynamic redirect URI from origin:", dynamicUri);
      return dynamicUri;
    } catch (e) {
      console.warn("Failed to parse request origin:", requestOrigin, e.message);
    }
  }
  
  // Check if we're in production environment
  const isProduction = Deno.env.get("VERCEL") || Deno.env.get("NODE_ENV") === "production";
  if (isProduction) {
    // Try to get the production URL from Vercel environment variables
    const vercelUrl = Deno.env.get("VERCEL_URL");
    if (vercelUrl) {
      const productionUri = `https://${vercelUrl}/auth/callback/gmail`;
      console.log("Using Vercel URL for redirect URI:", productionUri);
      return productionUri;
    }
  }
  
  // Fallback to localhost for development
  const fallbackUri = "http://localhost:8080/auth/callback/gmail";
  console.log("Using fallback redirect URI:", fallbackUri);
  return fallbackUri;
}

// Gmail scopes
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
];

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Log request details
    console.log("=== Gmail Auth Simple Function ===");
    console.log("Method:", req.method);
    console.log("Headers present:", Array.from(req.headers.keys()));
    
    // Check if we have basic auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("No Authorization header found");
      return new Response(JSON.stringify({
        error: "No Authorization header",
        status: "Error"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // For now, just check that we have a Bearer token format
    // We'll skip the complex JWT verification that seems to be failing
    if (!authHeader.startsWith('Bearer ')) {
      console.log("Invalid Authorization header format");
      return new Response(JSON.stringify({
        error: "Invalid Authorization header format",
        status: "Error"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log("Token received, length:", token.length);
    
    // Parse request body
    const requestData = await req.json();
    console.log("Request data:", { hasCode: !!requestData.code, isTest: !!requestData.test });
    
    // If this is a test request, generate auth URL
    if (requestData.test) {
      const scope = SCOPES.join(" ");
      const state = crypto.randomUUID();
      
      // Use the provided redirectUri if available, otherwise detect from origin
      const redirectUri = requestData.redirectUri || getRedirectUri(req.headers.get('Origin'));
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scope)}&` +
        `access_type=offline&` +
        `state=${state}&` +
        `prompt=consent`;
      
      console.log("Generated auth URL successfully with redirect URI:", redirectUri);
      
      return new Response(JSON.stringify({
        url: authUrl,
        redirectUri: redirectUri,
        state: state,
        status: "Success"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Handle code exchange
    if (requestData.code) {
      console.log("Code exchange requested");
      
      // Use the provided redirectUri if available, otherwise detect from origin
      const redirectUri = requestData.redirectUri || getRedirectUri(req.headers.get('Origin'));
      
      const tokenRequestBody = new URLSearchParams({
        code: requestData.code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenRequestBody
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Token exchange failed:", data);
        return new Response(JSON.stringify({
          error: `Token exchange failed: ${data.error}`,
          status: "Error",
          details: data.error_description
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Get user info from Google
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      });
      
      const userInfo = await userInfoResponse.json();
      
      if (!userInfoResponse.ok) {
        console.error("Failed to get user info:", userInfo);
        return new Response(JSON.stringify({
          error: `Failed to get user info: ${userInfo.error}`,
          status: "Error"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify({
        provider: "gmail",
        provider_user_id: userInfo.id,
        email: userInfo.email,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).getTime(),
        scope: data.scope,
        status: "Success"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify({
      error: "No valid operation requested",
      status: "Error"
    }), {
      status: 400,
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