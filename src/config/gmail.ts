/**
 * Gmail Integration Configuration
 * 
 * This file centralizes all Gmail integration settings to ensure
 * consistency across the application and prevent URI mismatch issues.
 */

// OAuth Callback Configuration
export const GMAIL_OAUTH_CONFIG = {
  // Standard callback path used across the application
  CALLBACK_PATH: '/auth/callback/gmail',
  
  // Redirect destination after successful authentication
  SUCCESS_REDIRECT: '/integrations',
  
  // Edge function names
  EDGE_FUNCTION: 'gmail-auth-simple',
  
  // OAuth Scopes
  SCOPES: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/contacts.other.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ],
  
  // Timeouts
  REDIRECT_TIMEOUT_MS: 120000, // 2 minutes
  ERROR_TIMEOUT_MS: 5000, // 5 seconds for error handling
  
  // Development server configuration
  DEV_PORT: 8080,
} as const;

/**
 * Get the standardized redirect URI for Gmail OAuth
 * @param origin - The origin (optional, defaults to window.location.origin)
 * @returns The complete redirect URI
 */
export function getGmailRedirectUri(origin?: string): string {
  const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : `http://localhost:${GMAIL_OAUTH_CONFIG.DEV_PORT}`);
  return `${baseOrigin}${GMAIL_OAUTH_CONFIG.CALLBACK_PATH}`;
}

/**
 * Get the OAuth configuration for Google Cloud Console setup
 * @param baseUrl - The base URL of your application
 * @returns Object with redirect URIs for different environments
 */
export function getOAuthConfigForConsole(baseUrl: string = `http://localhost:${GMAIL_OAUTH_CONFIG.DEV_PORT}`) {
  return {
    authorizedRedirectUris: [
      `${baseUrl}${GMAIL_OAUTH_CONFIG.CALLBACK_PATH}`,
      // Add production URL when deploying
      // `https://yourdomain.com${GMAIL_OAUTH_CONFIG.CALLBACK_PATH}`,
    ],
    authorizedJavaScriptOrigins: [
      baseUrl,
      // Add production URL when deploying
      // 'https://yourdomain.com',
    ]
  };
}

/**
 * Validates if the current environment is properly configured for Gmail OAuth
 * @returns Validation result with any issues found
 */
export function validateGmailConfig() {
  const issues: string[] = [];
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return { isValid: true, issues: [] }; // Skip validation on server side
  }
  
  // Check if current origin matches expected development pattern
  const currentOrigin = window.location.origin;
  const expectedDevOrigin = `http://localhost:${GMAIL_OAUTH_CONFIG.DEV_PORT}`;
  
  if (currentOrigin !== expectedDevOrigin && currentOrigin.includes('localhost')) {
    issues.push(`Development server running on ${currentOrigin} but Gmail OAuth expects ${expectedDevOrigin}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    currentRedirectUri: getGmailRedirectUri(),
    expectedRedirectUri: getGmailRedirectUri(expectedDevOrigin)
  };
}