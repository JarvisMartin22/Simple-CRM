import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
// We'll modify this in the environment variables to point to auth-callback.html
const REDIRECT_URI = Deno.env.get("GMAIL_REDIRECT_URI") || "";
const API_URL = Deno.env.get("SUPABASE_URL") || "";

// Scopes needed for Gmail integration
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check if this is a token refresh request
    if (req.method === "POST") {
      const { refresh_token } = await req.json();
      
      if (refresh_token) {
        console.log("Refreshing token with refresh_token:", refresh_token);
        
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refresh_token,
            grant_type: "refresh_token",
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
          throw new Error(`Refresh error: ${tokenData.error}`);
        }
        
        console.log("Token refreshed successfully");
        
        return new Response(
          JSON.stringify({
            access_token: tokenData.access_token,
            expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }
    
    const url = new URL(req.url);
    const params = url.searchParams;
    
    // Exchange authorization code for tokens
    if (params.has("code")) {
      const code = params.get("code");
      console.log("Code received:", code);
      console.log("Using redirect URI:", REDIRECT_URI);
      console.log("Client ID (first 4 chars):", GOOGLE_CLIENT_ID.substring(0, 4) + "...");
      
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code!,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      
      const tokenData = await tokenResponse.json();
      console.log("Token response status:", tokenResponse.status);
      
      if (tokenData.error) {
        console.error("Auth error details:", tokenData);
        throw new Error(`Auth error: ${tokenData.error}`);
      }
      
      // Get user information from Google
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      
      const userInfo = await userInfoResponse.json();
      
      // Store integration data in Supabase
      // Return tokens and user info to the client
      return new Response(
        JSON.stringify({
          provider: "gmail",
          provider_user_id: userInfo.id,
          email: userInfo.email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          scope: tokenData.scope,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // Generate OAuth authorization URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", SCOPES.join(" "));
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent");
    
    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Gmail auth error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
