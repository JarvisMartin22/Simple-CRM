# Google Cloud Console Setup for Simple-CRM

## Accessing OAuth Client Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the "Simple-CRM" project from the project dropdown at the top
3. In the left sidebar, navigate to "APIs & Services" > "Credentials"

## Configuring OAuth Client

1. Find the OAuth 2.0 Client ID for "Web application"
2. Click on the client name to edit it
3. Under "Authorized redirect URIs", ensure the following URIs are present:
   - `http://localhost:8080/auth/callback/gmail`
   - `http://localhost:8080/test-gmail-callback.html`
   - `https://bujaaqjxrvntcneoarkj.supabase.co/auth/v1/callback`
   - Production domain URL (if applicable)
4. If any are missing, click "ADD URI" and add them
5. Click "SAVE" at the bottom of the page

## Verifying API Scopes

1. From the left sidebar, navigate to "APIs & Services" > "OAuth consent screen"
2. Scroll down to "Scopes for Google APIs"
3. Verify the following scopes are included:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/contacts.readonly`
   - `https://www.googleapis.com/auth/contacts.other.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `openid`
4. If any are missing, click "ADD OR REMOVE SCOPES" and add them
5. Click "SAVE AND CONTINUE"

## Checking API Enablement

1. From the left sidebar, navigate to "APIs & Services" > "Enabled APIs & services"
2. Verify that the following APIs are enabled:
   - Gmail API
   - People API
   - Google OAuth2 API
3. If any are missing, click "+ ENABLE APIS AND SERVICES" at the top
4. Search for the missing API and enable it

## Additional Notes

- The OAuth client credentials (ID and secret) should match what's configured in Supabase environment variables
- Any changes to redirect URIs require updating the GMAIL_REDIRECT_URI in Supabase
- The application must be running on port 8080 for the redirect URIs to work properly 