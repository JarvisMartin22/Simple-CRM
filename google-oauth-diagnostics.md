# Google OAuth Configuration Diagnostics

## Current Status ✅
- All required environment variables are set in Supabase secrets
- Gmail-auth function has been redeployed to pick up secrets
- Authentication flow is working properly

## Likely Issue 🎯
The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured, but there may be a mismatch between:

1. **OAuth Redirect URI Configuration**
2. **Current Development Server Port**

## Quick Diagnosis Steps

### 1. Check Your Current Dev Server Port
Your Vite dev server is likely running on: `http://localhost:8081/` (not 8080)

### 2. Verify Google Cloud Console OAuth Configuration
In your Google Cloud Console OAuth credentials, you should have these redirect URIs authorized:

**Required Redirect URIs for Local Development:**
```
http://localhost:8080/auth-callback.html
http://localhost:8080/integrations  
http://localhost:8081/auth-callback.html
http://localhost:8081/integrations
http://localhost:8081/auth/callback/gmail
```

### 3. Check Current GMAIL_REDIRECT_URI Secret
Current value should match your dev server. Try this command:
```bash
npx supabase secrets set GMAIL_REDIRECT_URI="http://localhost:8081/auth/callback/gmail"
```

## Recommended Fix 🛠️

### Option 1: Update Google OAuth Redirect URIs (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Credentials > OAuth 2.0 Client IDs
3. Edit your OAuth client
4. Add these authorized redirect URIs:
   - `http://localhost:8081/auth/callback/gmail`
   - `http://localhost:8081/integrations`
   - `http://localhost:8081/auth-callback.html`

### Option 2: Update Environment Variable
```bash
npx supabase secrets set GMAIL_REDIRECT_URI="http://localhost:8081/auth/callback/gmail"
npx supabase functions deploy gmail-auth
```

### Option 3: Force Vite to Use Port 8080
In your `package.json` or `vite.config.ts`, set:
```json
{
  "scripts": {
    "dev": "vite --port 8080"
  }
}
```

## Testing the Fix ✨

After applying the fix:
1. Try the Gmail connection again
2. The OAuth popup should open successfully
3. After authorization, you should see "Connected" status
4. No more "Edge Function configuration error"

## Debug Information 📊

You can check the actual environment variable values by looking at the Supabase function logs after triggering the connection (they should show non-zero lengths for all variables).