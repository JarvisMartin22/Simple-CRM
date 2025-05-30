# Gmail Integration Setup Guide

## Quick Setup

1. **Configure Google Cloud Console**:
   - Go to your Google Cloud Console project
   - Navigate to **APIs & Services > Credentials**
   - Edit your OAuth 2.0 Client ID
   - Make sure you have these Authorized redirect URIs:
     ```
     http://localhost:8080/integrations
     http://localhost:8080/auth-callback.html
     ```
   - The main application uses `/integrations` as fallback, while the popup uses `/auth-callback.html`

2. **Set up Supabase environment variables**:
   ```bash
   supabase secrets set GMAIL_REDIRECT_URI="http://localhost:8080/auth-callback.html"
   ```

3. **Run your application on port 8080**:
   ```bash
   npm run dev -- --port 8080
   ```

## Popup Authentication Flow

The application now uses a popup window for the Gmail authentication flow:

1. When you click "Connect Gmail", a popup window opens with the Google authentication page
2. After you authenticate, the popup sends the auth code back to the main window
3. The main window processes the auth code and establishes the Gmail connection
4. The popup window closes automatically

This approach keeps you on the same page in your main application window and provides a better user experience.

## Troubleshooting "redirect_uri_mismatch" Error

If you see a "redirect_uri_mismatch" error:

1. Double-check that the EXACT redirect URIs are configured in Google Cloud Console
2. Verify your app is running on port 8080
3. Note that the error message will show the URI that failed to match
4. Make sure popups are allowed for your site

## Current Authorized Redirect URIs

Based on your Google Cloud Console configuration, these are your currently authorized URIs:

1. `https://bujaaqjxrvntcneoarkj.supabase.co/auth/v1/callback`
2. `http://localhost:8080/integrations`  ← Main application fallback
3. `http://localhost:8080/campaigns`
4. `http://localhost:8080/auth-callback.html`  ← Popup callback uses this
5. `https://www.trygolly.com/auth-callback.html`
6. `http://127.0.0.1:54321/auth/v1/callback`

## Verification

To verify your setup:
```bash
# Start Supabase functions
supabase functions serve --no-verify-jwt

# Start your application
npm run dev -- --port 8080
``` 