/**
 * Gmail Integration Configuration for Edge Functions
 * 
 * This file centralizes all Gmail integration settings for Edge Functions
 * to ensure consistency and prevent URI mismatch issues.
 */

// Standardized redirect URI configuration
export const GMAIL_CONFIG = {
  // Standard callback path used across the application
  CALLBACK_PATH: "/auth/callback/gmail",
  
  // OAuth Scopes
  SCOPES: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/contacts.readonly",
    "https://www.googleapis.com/auth/contacts.other.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid"
  ],
  
  // Development configuration
  DEV_PORT: 8080,
} as const;

/**
 * Function to determine redirect URI based on environment and origin
 * @param requestOrigin - The request origin from headers
 * @returns The standardized redirect URI
 */
export function getRedirectUri(requestOrigin?: string): string {
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
      const dynamicUri = `${origin.origin}${GMAIL_CONFIG.CALLBACK_PATH}`;
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
      const productionUri = `https://${vercelUrl}${GMAIL_CONFIG.CALLBACK_PATH}`;
      console.log("Using Vercel URL for redirect URI:", productionUri);
      return productionUri;
    }
  }
  
  // Fallback to localhost for development
  const fallbackUri = `http://localhost:${GMAIL_CONFIG.DEV_PORT}${GMAIL_CONFIG.CALLBACK_PATH}`;
  console.log("Using fallback redirect URI:", fallbackUri);
  return fallbackUri;
}

/**
 * Validates the OAuth configuration
 * @param clientId - Google Client ID
 * @param clientSecret - Google Client Secret
 * @returns Validation result
 */
export function validateOAuthConfig(clientId: string, clientSecret: string) {
  const issues: string[] = [];
  
  if (!clientId || clientId.length < 10) {
    issues.push("GOOGLE_CLIENT_ID is missing or invalid");
  }
  
  if (!clientSecret || clientSecret.length < 10) {
    issues.push("GOOGLE_CLIENT_SECRET is missing or invalid");
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}