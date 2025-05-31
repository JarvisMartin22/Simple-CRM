# Gmail Integration Setup Guide

This guide provides complete instructions for setting up Gmail integration in Simple CRM.

## Prerequisites

- Google Cloud Console account
- Supabase project deployed
- Development environment running on port 8080

## Step 1: Google Cloud Console Configuration

### 1.1 Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
4. Select **Web application** as the application type
5. Configure the following:

   **Name**: `Simple CRM Gmail Integration`
   
   **Authorized JavaScript origins**:
   ```
   http://localhost:8080
   ```
   
   **Authorized redirect URIs**:
   ```
   http://localhost:8080/auth/callback/gmail
   http://localhost:8080/auth-callback.html
   https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
   ```

6. Click **CREATE** and save your credentials:
   - Client ID: `GOOGLE_CLIENT_ID`
   - Client Secret: `GOOGLE_CLIENT_SECRET`

### 1.2 Enable Required APIs

In the Google Cloud Console, enable these APIs:

1. **Gmail API** - For email sending and reading
2. **Google People API** - For contact information
3. **Google Contacts API** - For importing contacts

Navigate to **APIs & Services** → **Library** and search for each API to enable it.

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Set up your app information
3. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.labels`
   - `https://www.googleapis.com/auth/contacts.readonly`
   - `https://www.googleapis.com/auth/contacts.other.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

## Step 2: Supabase Configuration

### 2.1 Set Environment Variables

Set the following secrets in your Supabase project:

```bash
npx supabase secrets set GOOGLE_CLIENT_ID="your-client-id" --project-ref YOUR_PROJECT_ID
npx supabase secrets set GOOGLE_CLIENT_SECRET="your-client-secret" --project-ref YOUR_PROJECT_ID
npx supabase secrets set GMAIL_REDIRECT_URI="http://localhost:8080/auth/callback/gmail" --project-ref YOUR_PROJECT_ID
```

### 2.2 Deploy Edge Functions

The following edge functions need to be deployed:

```bash
npx supabase functions deploy gmail-auth --project-ref YOUR_PROJECT_ID
npx supabase functions deploy send-email --project-ref YOUR_PROJECT_ID
npx supabase functions deploy email-tracker --project-ref YOUR_PROJECT_ID
npx supabase functions deploy gmail-contacts --project-ref YOUR_PROJECT_ID
```

## Step 3: Local Development Setup

### 3.1 Environment Variables

Create or update your `.env` file:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_FUNCTIONS_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1
```

### 3.2 Start Development Server

**Important**: The application MUST run on port 8080:

```bash
npm run dev -- --port 8080
```

## Step 4: Testing the Integration

### 4.1 Connect Gmail Account

1. Navigate to **Settings** → **Integrations** in the app
2. Click **Connect Gmail**
3. Complete the OAuth flow in the popup window
4. The window will automatically close upon success

### 4.2 Verify Connection

Check that the integration was saved:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM user_integrations WHERE provider = 'gmail';
```

### 4.3 Test Email Sending

1. Go to **Campaigns** → **Create Campaign**
2. Compose a test email
3. Send to a test recipient
4. Verify email delivery and tracking

## Troubleshooting

### Common Issues

1. **redirect_uri_mismatch Error**
   - Ensure ALL redirect URIs are added to Google Cloud Console
   - Check that the app is running on port 8080
   - Verify the GMAIL_REDIRECT_URI environment variable

2. **401 Unauthorized Errors**
   - Check that Supabase secrets are set correctly
   - Verify the user is authenticated in the app
   - Ensure edge functions are deployed

3. **Popup Blocked**
   - Enable popups for localhost:8080
   - Try using a different browser
   - Check browser console for errors

### Debug Commands

```bash
# Check Supabase secrets
npx supabase secrets list --project-ref YOUR_PROJECT_ID

# View edge function logs
npx supabase functions logs gmail-auth --project-ref YOUR_PROJECT_ID

# Test edge function locally
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/gmail-auth \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Security Considerations

1. Never commit Google credentials to version control
2. Use environment variables for all sensitive data
3. Implement proper error handling for OAuth flows
4. Regularly rotate OAuth credentials
5. Monitor API usage in Google Cloud Console

## Next Steps

- [Import Gmail Contacts](../features/gmail-contact-import.md)
- [Configure Email Templates](../features/email-templates.md)
- [Set Up Campaign Analytics](../features/campaign-analytics.md)