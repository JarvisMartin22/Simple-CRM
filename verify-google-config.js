// Verify Google OAuth Configuration

// Your redirect URI
const redirectUri = "http://localhost:8080/auth/callback/gmail";

// Standard scopes
const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/contacts.other.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
];

// Create the scope string
const scopeString = scopes.join(' ');
const encodedScope = encodeURIComponent(scopeString);

// Build the auth URL (using a placeholder client ID)
const clientId = "PLACEHOLDER_CLIENT_ID";
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(clientId)}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `response_type=code&` +
  `scope=${encodedScope}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log("Redirect URI:", redirectUri);
console.log("Encoded Redirect URI:", encodeURIComponent(redirectUri));
console.log("\nScopes:", scopeString);
console.log("Encoded Scopes:", encodedScope);
console.log("\nFull Auth URL:", authUrl);
console.log("\nGoogle OAuth Configuration Checklist:");
console.log("1. Ensure the exact redirect URI is in Google Cloud Console: " + redirectUri);
console.log("2. Make sure you have the right client ID and client secret");
console.log("3. Check that all needed scopes are allowed in your OAuth consent screen");
console.log("4. Verify your app configuration (API restrictions, etc.)"); 