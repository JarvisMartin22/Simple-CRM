# Gmail Integration Verification

This document provides a step-by-step process to verify the Gmail integration is properly configured.

## 1. Verify Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the "Simple-CRM" project
3. Navigate to "APIs & Services" > "Credentials"
4. Find the OAuth 2.0 Client ID for "Web application"
5. Check the Authorized redirect URIs include:
   - `http://localhost:8080/auth/callback/gmail`
   - `http://localhost:8080/test-gmail-callback.html` 
   - `https://bujaaqjxrvntcneoarkj.supabase.co/auth/v1/callback`

If any URIs are missing, add them and click "Save".

## 2. Verify Supabase Environment Variables

Run the following command to check the environment variables:

```bash
supabase secrets list --project-ref bujaaqjxrvntcneoarkj
```

Ensure these variables exist and are correctly set:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` 
- `GMAIL_REDIRECT_URI` (should be `http://localhost:8080/auth/callback/gmail`)

## 3. Verify Development Server

1. Kill any processes using ports 8080-8082:
   ```bash
   lsof -i :8080 -i :8081 -i :8082 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
   ```

2. Start the development server explicitly on port 8080:
   ```bash
   npm run dev -- --port 8080
   ```

3. Verify the server is running on port 8080:
   ```
   ➜  Local:   http://localhost:8080/
   ```

## 4. Test Authentication Flow

1. Open the test page in your browser:
   ```
   http://localhost:8080/test-gmail-auth.html
   ```

2. Click "Test Gmail Auth" button
3. Complete the Google authentication process
4. You should be redirected back to the callback page
5. Check the logs in the test page for "Auth code received"

## 5. Verify Integration in Application

1. Navigate to the application settings:
   ```
   http://localhost:8080/app/settings/integrations
   ```

2. Click "Connect Gmail"
3. Complete the authentication process
4. Verify you see "Gmail connected successfully" message

## 6. Test Email Sending

1. Create a test campaign
2. Send a test email to yourself
3. Verify the email is received
4. Check that the tracking pixel loads (open tracking)
5. Click a link in the email (if link tracking is enabled)
6. Verify the events are recorded in the database

## 7. Check Supabase Logs

If any errors occur, check the Supabase Edge Function logs:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/bujaaqjxrvntcneoarkj/functions)
2. Select the "Edge Functions" section
3. Click on the relevant function (gmail-auth or send-email)
4. View the logs for any error messages

## Troubleshooting

### 401 Error: "Gmail integration not found or not active"
- Reconnect the Gmail integration following steps in section 5
- Check the `user_integrations` table for your Gmail integration record

### 500 Error from Edge Function
- Check Edge Function logs in the Supabase dashboard
- Verify all environment variables are correctly set
- Ensure the redirect URI in the environment matches Google Cloud Console

### "redirect_uri_mismatch" Error
- Verify the redirect URIs in Google Cloud Console match exactly
- Check that the application is running on port 8080
- Verify the GMAIL_REDIRECT_URI environment variable 