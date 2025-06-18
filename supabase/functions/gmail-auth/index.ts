import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

// Standardized redirect URI configuration
const STANDARD_CALLBACK_PATH = "/auth/callback/gmail";

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
      const dynamicUri = `${origin.origin}${STANDARD_CALLBACK_PATH}`;
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
      const productionUri = `https://${vercelUrl}${STANDARD_CALLBACK_PATH}`;
      console.log("Using Vercel URL for redirect URI:", productionUri);
      return productionUri;
    }
  }
  
  // Fallback to localhost for development
  const fallbackUri = `http://localhost:8080${STANDARD_CALLBACK_PATH}`;
  console.log("Using fallback redirect URI:", fallbackUri);
  return fallbackUri;
}

const API_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

// Debug: Log configuration (but not secrets)
console.log("Gmail Auth Configuration:");
console.log("- Client ID length:", GOOGLE_CLIENT_ID.length);
console.log("- Client Secret length:", GOOGLE_CLIENT_SECRET.length);
console.log("- Anon Key length:", SUPABASE_ANON_KEY.length);
console.log("- Service Key length:", SERVICE_ROLE_KEY.length);
console.log("- API URL:", API_URL);

// Scopes needed for Gmail integration
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
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
  console.log("Request received:", new Date().toISOString());
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  
  // Log environment variable lengths for debugging (but don't fail)
  console.log("Environment check:", {
    clientIdLength: GOOGLE_CLIENT_ID.length,
    clientSecretLength: GOOGLE_CLIENT_SECRET.length,
    anonKeyLength: SUPABASE_ANON_KEY.length
  });
  
  // Log headers for debugging
  const headersObj = Object.fromEntries(req.headers.entries());
  console.log("Request headers:", {
    hasAuthorization: !!headersObj.authorization,
    authPrefix: headersObj.authorization?.substring(0, 10) + "...",
    contentType: headersObj["content-type"],
    origin: headersObj.origin
  });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client for administrative operations
    const supabase = createClient(API_URL, SERVICE_ROLE_KEY);
    
    // Get user from token - this needs to happen for all requests
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error("No Authorization header found");
      return new Response(
        JSON.stringify({ 
          error: "Missing Authorization header", 
          status: "Error",
          code: 401 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log("Token length:", token.length);

    // Create a client with anon key for JWT verification
    const userSupabase = createClient(API_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          authorization: authHeader
        }
      }
    });

    // Verify the token
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    console.log("Auth verification result:", {
      hasUser: !!user,
      error: userError?.message,
      userId: user?.id
    });

    if (userError || !user) {
      console.error("Failed to verify token:", userError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid authentication token", 
          status: "Error",
          code: 401,
          details: userError?.message 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request payload:", { 
        hasCode: !!requestData.code,
        codePrefix: requestData.code ? requestData.code.substring(0, 10) + "..." : null,
        hasRefreshToken: !!requestData.refresh_token,
        isTest: !!requestData.test
      });
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body", 
          status: "Error",
          code: 400 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { code, refresh_token, test } = requestData;
    
    // If test is true, return the auth URL
    if (test) {
      try {
        // Properly join and encode the scopes
        const scope = SCOPES.join(" ");
        const encodedScope = encodeURIComponent(scope);
        
        // Generate a state parameter for CSRF protection
        const state = crypto.randomUUID();
        
        // Determine which redirect URI to use for the auth URL
        // 1. If explicit redirectUri is provided in the request, use that
        // 2. Otherwise use the configured URI from environment or default
        const requestedRedirectUri = requestData.redirectUri;
        const effectiveRedirectUri = requestedRedirectUri || getRedirectUri(req.headers.get('Origin'));
        
        console.log("Auth URL generation:", {
          requestedUri: requestedRedirectUri ? "provided" : "not provided",
          effectiveUri: effectiveRedirectUri,
          stateParam: state
        });
        
        // Build the auth URL with properly encoded parameters
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
          `redirect_uri=${encodeURIComponent(effectiveRedirectUri)}&` +
          `response_type=code&` +
          `scope=${encodedScope}&` +
          `access_type=offline&` +
          `state=${state}&` +
          `prompt=consent`;
        
        console.log("Generated auth URL for testing:", {
          client_id_length: GOOGLE_CLIENT_ID.length,
          redirect_uri: effectiveRedirectUri,
          scope_count: SCOPES.length,
          url_length: authUrl.length
        });
        
        return new Response(
          JSON.stringify({ 
            url: authUrl, 
            redirectUri: effectiveRedirectUri,
            state: state
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      } catch (error) {
        console.error("Error generating auth URL:", error);
        return new Response(
          JSON.stringify({ 
            error: "Failed to generate auth URL", 
            status: "Error",
            details: error.message
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Handle token exchange
    if (code) {
      try {
        console.log("Attempting token exchange with code");
        
        // Check if a specific redirect URI was provided with the code
        const providedRedirectUri = requestData.redirectUri;
        console.log("Provided redirect URI:", providedRedirectUri);
        
        // If a redirect URI was provided with the code, use that first
        if (providedRedirectUri) {
          console.log("Using provided redirect URI for token exchange");
          const tokenExchangeResult = await exchangeCodeForToken(code, providedRedirectUri);
          
          if (tokenExchangeResult.success) {
            // Process successful authentication
            return await processSuccessfulAuth(tokenExchangeResult.data, user, supabase);
          }
          
          console.log("Provided redirect URI failed:", tokenExchangeResult.error);
        }
        
        // Try with the primary redirect URI next
        console.log("Using primary redirect URI for token exchange:", getRedirectUri(req.headers.get('Origin')));
        const tokenExchangeResult = await exchangeCodeForToken(code, getRedirectUri(req.headers.get('Origin')));
        
        if (tokenExchangeResult.success) {
          // Process successful authentication
          return await processSuccessfulAuth(tokenExchangeResult.data, user, supabase);
        } 
        
        // If primary URI fails, log the error details
        if (tokenExchangeResult.error === "redirect_uri_mismatch") {
          console.error("Redirect URI mismatch:", {
            requestedUri: getRedirectUri(req.headers.get('Origin')),
            error: tokenExchangeResult.errorDetails
          });
          
          return new Response(
            JSON.stringify({ 
              error: "Redirect URI mismatch - please check your Google Cloud Console OAuth configuration",
              status: "Error",
              details: {
                expectedUri: getRedirectUri(req.headers.get('Origin')),
                errorDetails: tokenExchangeResult.errorDetails
              }
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }
        
        // Handle other errors
        return new Response(
          JSON.stringify({ 
            error: tokenExchangeResult.error,
            status: "Error",
            details: tokenExchangeResult.errorDetails
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      } catch (error) {
        console.error("Error handling code exchange:", error);
        return new Response(JSON.stringify({
          error: error.message || "Unknown error in code exchange",
          status: "Error",
          code: 500
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }
    // Handle refresh token request
    if (refresh_token) {
      try {
        console.log("Refreshing token with refresh_token");
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: refresh_token,
            grant_type: "refresh_token"
          })
        });
        const data = await response.json();
        if (!response.ok) {
          console.error("Token refresh failed:", {
            status: response.status,
            error: data.error,
            error_description: data.error_description
          });
          return new Response(JSON.stringify({
            error: `Failed to refresh token: ${data.error}`,
            status: "Error",
            details: data.error_description,
            code: response.status
          }), {
            status: response.status || 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          });
        }
        // Update the integration in the database
        const { error: updateError } = await supabase.from("user_integrations").update({
          access_token: data.access_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }).eq("refresh_token", refresh_token);
        if (updateError) {
          console.error("Failed to update integration:", updateError);
          return new Response(JSON.stringify({
            error: `Failed to update integration: ${updateError.message}`,
            status: "Error",
            code: 500
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          });
        }
        return new Response(JSON.stringify({
          access_token: data.access_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          status: "Success"
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      } catch (error) {
        console.error("Error refreshing token:", error);
        return new Response(JSON.stringify({
          error: error.message || "Unknown error refreshing token",
          status: "Error",
          code: 500
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }
    // If we get here, no valid operation was requested
    console.error("No valid operation requested");
    return new Response(JSON.stringify({
      error: "No valid code, refresh_token, or test parameter provided",
      status: "Error",
      code: 400
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({
      error: error.message || "An unexpected error occurred",
      status: "Error",
      code: 500,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

// Helper function to exchange code for token
async function exchangeCodeForToken(code, redirectUri) {
  console.log("Attempting token exchange with redirect URI:", redirectUri);
  
  const tokenRequestBody = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenRequestBody
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Token exchange failed:", {
        status: response.status,
        error: data.error,
        description: data.error_description,
        redirectUri
      });
      
      return {
        success: false,
        error: data.error,
        errorDetails: data.error_description || data.message,
        status: response.status
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("Error in token exchange:", error);
    return {
      success: false,
      error: "exception",
      errorDetails: error.message
    };
  }
}

// Helper function to process successful auth
async function processSuccessfulAuth(data, user, supabase) {
  // Get user info from Google
  console.log("Fetching user info with access token");
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
      status: "Error",
      code: userInfoResponse.status
    }), {
      status: userInfoResponse.status || 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  
  const authResponse = {
    provider: "gmail",
    provider_user_id: userInfo.id,
    email: userInfo.email,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).getTime(),
    scope: data.scope
  };
  
  // Check for existing integration
  console.log("Checking for existing integration for user:", user.id);
  const { data: existingIntegrations, error: fetchError } = await supabase.from("user_integrations").select("*").eq("user_id", user.id).eq("provider", "gmail");
  
  if (fetchError) {
    console.error("Failed to check existing integrations:", fetchError);
    return new Response(JSON.stringify({
      error: `Failed to check existing integrations: ${fetchError.message}`,
      status: "Error",
      code: 500
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  
  console.log("Existing integrations found:", existingIntegrations?.length || 0);
  
  let integrationResult;
  if (existingIntegrations && existingIntegrations.length > 0) {
    // Update existing integration
    console.log("Updating existing integration");
    integrationResult = await supabase.from("user_integrations").update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope,
      updated_at: new Date().toISOString()
    }).eq("id", existingIntegrations[0].id).select();
  } else {
    // Create new integration
    console.log("Creating new integration for user:", user.id);
    integrationResult = await supabase.from("user_integrations").insert([
      {
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
      }
    ]).select();
  }
  
  if (integrationResult.error) {
    console.error("Failed to update/create integration:", integrationResult.error);
    return new Response(JSON.stringify({
      error: `Failed to update/create integration: ${integrationResult.error.message}`,
      status: "Error",
      code: 500
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  
  return new Response(JSON.stringify({
    ...authResponse,
    integration: integrationResult.data?.[0],
    status: "Success"
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
