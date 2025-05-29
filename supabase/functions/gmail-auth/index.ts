import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const REDIRECT_URI = Deno.env.get("GMAIL_REDIRECT_URI") || "http://localhost:8080/auth-callback.html";
const API_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Debug: Log configuration (but not secrets)
console.log("Gmail Auth Configuration:");
console.log("- Client ID length:", GOOGLE_CLIENT_ID.length);
console.log("- Client Secret length:", GOOGLE_CLIENT_SECRET.length);
console.log("- Redirect URI:", REDIRECT_URI);
console.log("- API URL:", API_URL);

// Scopes needed for Gmail integration
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

interface GmailAuthResponse {
  provider: string;
  provider_user_id: string;
  email: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string;
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Environment check:", {
    hasClientId: GOOGLE_CLIENT_ID !== "",
    hasClientSecret: GOOGLE_CLIENT_SECRET !== "",
    clientIdPrefix: GOOGLE_CLIENT_ID.substring(0, 5) + "...",
    redirectUri: REDIRECT_URI,
    apiUrl: API_URL
  });
  
  try {
    const { code, refresh_token, test } = await req.json();
    console.log("Request payload:", { 
      hasCode: !!code,
      codePrefix: code ? code.substring(0, 5) + "..." : null,
      hasRefreshToken: !!refresh_token,
      isTest: !!test
    });
    
    // If test is true, return the auth URL
    if (test) {
      const scope = SCOPES.join(" ");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
      
      console.log("Generated auth URL params:", {
        client_id_length: GOOGLE_CLIENT_ID.length,
        redirect_uri: REDIRECT_URI,
        scope: scope,
        full_url_length: authUrl.length
      });
      
      return new Response(
        JSON.stringify({ url: authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle token exchange
    if (code) {
      console.log("Attempting token exchange with code");
      const tokenRequestBody = new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      });
      
      console.log("Token request params:", {
        grant_type: "authorization_code",
        client_id_length: GOOGLE_CLIENT_ID.length,
        client_secret_length: GOOGLE_CLIENT_SECRET.length,
        redirect_uri: REDIRECT_URI,
        code_prefix: code.substring(0, 5) + "..."
      });

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenRequestBody
      });

      const data = await response.json();
      console.log("Token exchange response:", {
        status: response.status,
        ok: response.ok,
        error: data.error,
        error_description: data.error_description,
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
        scope: data.scope,
        expiresIn: data.expires_in
      });
      
      if (!response.ok) {
        console.error("Token exchange failed:", {
          status: response.status,
          error: data.error,
          description: data.error_description
        });
        throw new Error(`Failed to exchange code: ${data.error} - ${data.error_description}`);
      }

      // Get user info from Google
      console.log("Fetching user info with access token");
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const userInfo = await userInfoResponse.json();
      console.log("User info response:", {
        status: userInfoResponse.status,
        ok: userInfoResponse.ok,
        hasId: !!userInfo.id,
        hasEmail: !!userInfo.email,
        error: userInfo.error
      });

      if (!userInfoResponse.ok) {
        console.error("Failed to get user info:", userInfo);
        throw new Error(`Failed to get user info: ${userInfo.error}`);
      }

      const authResponse: GmailAuthResponse = {
        provider: "gmail",
        provider_user_id: userInfo.id,
        email: userInfo.email,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).getTime(),
        scope: data.scope
      };

      // Save or update the integration in the database
      const supabase = createClient(API_URL, SERVICE_ROLE_KEY);

      // Get the user ID from the request JWT
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing Authorization header');
      }
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        console.error("Failed to get user from token:", userError);
        throw new Error('Failed to authenticate user');
      }

      // Check for existing integration
      console.log("Checking for existing integration for user:", user.id);
      const { data: existingIntegrations, error: fetchError } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "gmail");

      if (fetchError) {
        console.error("Failed to check existing integrations:", fetchError);
        throw new Error(`Failed to check existing integrations: ${fetchError.message}`);
      }

      console.log("Existing integrations found:", existingIntegrations?.length || 0);

      let integrationResult;
      if (existingIntegrations && existingIntegrations.length > 0) {
        // Update existing integration
        console.log("Updating existing integration");
        integrationResult = await supabase
          .from("user_integrations")
          .update({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
            scope: data.scope,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingIntegrations[0].id)
          .select();

        if (integrationResult.error) {
          console.error("Failed to update integration:", integrationResult.error);
          throw new Error(`Failed to update integration: ${integrationResult.error.message}`);
        }
        console.log("Successfully updated integration:", {
          id: existingIntegrations[0].id,
          email: userInfo.email,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new integration
        console.log("Creating new integration for user:", user.id);
        integrationResult = await supabase
          .from("user_integrations")
          .insert([{
            user_id: user.id,
            provider: "gmail",
            provider_user_id: userInfo.id,
            email: userInfo.email,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
            scope: data.scope,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (integrationResult.error) {
          console.error("Failed to create integration:", integrationResult.error);
          throw new Error(`Failed to create integration: ${integrationResult.error.message}`);
        }
        console.log("Successfully created new integration:", {
          email: userInfo.email,
          created_at: new Date().toISOString()
        });
      }

      return new Response(
        JSON.stringify({
          ...authResponse,
          integration: integrationResult.data?.[0]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle refresh token request
    if (refresh_token) {
      console.log("Refreshing token with refresh_token:", refresh_token);
      
      const response = await fetch("https://oauth2.googleapis.com/token", {
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
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${data.error}`);
      }
      
      // Update the integration in the database
      const supabase = createClient(API_URL, SERVICE_ROLE_KEY);

      const { error: updateError } = await supabase
        .from("user_integrations")
        .update({
          access_token: tokenData.access_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("refresh_token", refresh_token);

      if (updateError) {
        throw new Error(`Failed to update integration: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "No valid code or refresh_token provided" }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
