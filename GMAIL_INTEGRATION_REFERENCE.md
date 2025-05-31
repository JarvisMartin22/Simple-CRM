# Gmail Integration Reference Guide

## Configuration Requirements

### Google Cloud Console Configuration
- **Project**: Simple-CRM
- **OAuth Client Type**: Web application
- **Required APIs**: Gmail API, People API
- **Required Scopes**:
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/contacts.readonly`
  - `https://www.googleapis.com/auth/contacts.other.readonly`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
  - `openid`

### Authorized Redirect URIs
The following URIs **MUST** be added to Google Cloud Console's OAuth client configuration:
1. `http://localhost:8080/auth/callback/gmail` (local development)
2. `http://localhost:8080/auth-callback.html` (local testing)
3. `https://bujaaqjxrvntcneoarkj.supabase.co/auth/v1/callback` (Supabase)
4. `https://your-production-domain.com/auth/callback/gmail` (production)

### Supabase Environment Variables
The following environment variables **MUST** be set in Supabase for the Edge Functions:
```bash
GOOGLE_CLIENT_ID="your-client-id-from-google-cloud-console"
GOOGLE_CLIENT_SECRET="your-client-secret-from-google-cloud-console"
GMAIL_REDIRECT_URI="http://localhost:8080/auth/callback/gmail"
```

## Integration Process Flow

### Authentication Flow
1. User clicks "Connect Gmail" in the application
2. Application calls Supabase Edge Function: `gmail-auth` with `test: true`
3. Edge Function returns authorization URL
4. User is redirected to Google OAuth consent screen
5. User approves permissions
6. Google redirects to the specified redirect URI with an authorization code
7. The callback page extracts the code and saves it to localStorage
8. The application retrieves the code and calls the Edge Function again to exchange for tokens
9. Tokens are stored in the `user_integrations` table in Supabase

### Email Sending Flow
1. Application constructs email payload
2. Application calls Supabase Edge Function: `send-email`
3. Edge Function fetches Gmail integration from `user_integrations` table
4. Edge Function refreshes access token if expired
5. Edge Function constructs email with tracking pixel (if enabled)
6. Edge Function sends email via Gmail API
7. Edge Function creates records in:
   - `email_tracking` (includes campaign_id)
   - `tracked_links` (if link tracking enabled)
   - `campaign_analytics` (updates counts)
   - `recipient_analytics` (if campaign email)
   - `email_events` (creates "sent" event)

### Email Tracking Flow
1. Recipient opens email, triggering tracking pixel
2. Tracking pixel calls `track_email_open` function via direct Supabase API
3. Function updates timestamps in `email_tracking` table
4. Trigger functions update analytics tables automatically

## Critical Requirements

### 1. Port Number
The application **MUST** run on port 8080 for local development:
```bash
npm run dev -- --port 8080
```

### 2. Callback Handler Files
The following files **MUST** exist and be properly configured:
- `/auth/callback/gmail/index.html` - Main callback handler

### 3. Environment Variables
All environment variables must be properly set and verified before deployment:
```bash
supabase secrets list --project-ref bujaaqjxrvntcneoarkj
```

### 4. Edge Function Deployment
After any changes to Edge Functions, they must be redeployed:
```bash
supabase functions deploy gmail-auth --project-ref bujaaqjxrvntcneoarkj
```

## Troubleshooting Guide

### 1. Authentication Failures
- Verify Google Cloud Console redirect URIs match exactly
- Check GMAIL_REDIRECT_URI environment variable
- Ensure the application is running on port 8080
- Verify the OAuth client is properly configured with all required scopes

### 2. 500 Error from Edge Function
- Check Edge Function logs in Supabase dashboard
- Verify environment variables are correctly set
- Ensure the redirect URI matches exactly what's in Google Cloud Console

### 3. Email Sending Failures
- Check for expired tokens and refresh mechanism
- Verify campaign_id is included in all email_tracking records
- Check Edge Function logs for specific error messages

### 4. Tracking Issues
- Verify email_tracking records contain campaign_id
- Check trigger functions for analytical data aggregation
- Verify tracking pixel is correctly embedded in emails

## Testing Tools

### 1. Gmail Auth Test Page
- URL: `http://localhost:8080/test-gmail-auth.html`
- Purpose: Test the OAuth flow and verify callback handling

### 2. Gmail Callback Test
- URL: `http://localhost:8080/test-gmail-callback.html`
- Purpose: Test authorization code handling and localStorage storage

## Verification Checklist

Before deploying or committing code:
1. ✅ All environment variables set correctly
2. ✅ Google Cloud Console has correct redirect URIs
3. ✅ Edge Functions deployed with latest code
4. ✅ Port 8080 used for local development
5. ✅ Callback handlers implemented correctly
6. ✅ Email tracking includes campaign_id

## Error Codes Reference

| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | "Gmail integration not found or not active" | Reconnect Gmail integration |
| 500 | Edge Function error | Check Supabase logs, verify environment variables |
| redirect_uri_mismatch | Redirect URI doesn't match | Update Google Cloud Console URIs | 