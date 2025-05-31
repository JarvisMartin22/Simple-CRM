# Gmail Integration Troubleshooting Guide

This guide helps resolve common issues with Gmail integration in Simple CRM.

## Quick Diagnostics

Run this checklist first to identify common issues:

- [ ] Application running on port 8080 (`npm run dev -- --port 8080`)
- [ ] Google Cloud Console OAuth client configured
- [ ] All redirect URIs added to Google Cloud Console
- [ ] Supabase secrets configured (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- [ ] Edge functions deployed to Supabase
- [ ] User authenticated in the application

## Common Issues and Solutions

### 1. OAuth Errors

#### redirect_uri_mismatch

**Error**: "The redirect URI in the request does not match the ones authorized"

**Solution**:
1. Add these exact URIs to Google Cloud Console OAuth client:
   ```
   http://localhost:8080/auth/callback/gmail
   http://localhost:8080/auth-callback.html
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
2. Wait 5-10 minutes for Google to propagate changes
3. Clear browser cache and retry

#### 404 Page Not Found After OAuth

**Error**: Redirected to non-existent page after Google authorization

**Solution**:
1. Ensure the route `/auth/callback/gmail` exists in your React app
2. Check that `src/pages/auth/GmailCallback.tsx` is properly imported
3. Verify the route is added to `App.tsx`

#### Invalid Client Error

**Error**: "invalid_client: The OAuth client was not found"

**Solution**:
1. Verify GOOGLE_CLIENT_ID is correct
2. Check that the OAuth client is not deleted/disabled
3. Ensure you're using Web Application type OAuth client

### 2. Connection Issues

#### Popup Window Blocked

**Error**: "Please allow popups for this site"

**Solution**:
1. Enable popups for localhost:8080 in browser settings
2. Try clicking the connect button again
3. Alternative: Use a different browser

#### Popup Closes But Nothing Happens

**Possible Causes**:
1. CORS/COOP policy blocking messages
2. Authentication failed silently

**Solution**:
1. Check browser console for errors
2. Verify edge function logs:
   ```bash
   npx supabase functions logs gmail-auth --project-ref YOUR_PROJECT_ID
   ```
3. Ensure the callback page sends proper postMessage

#### Connection Successful But Not Saved

**Error**: OAuth completes but integration doesn't appear

**Solution**:
1. Check user_integrations table:
   ```sql
   SELECT * FROM user_integrations 
   WHERE user_id = 'YOUR_USER_ID' 
   AND provider = 'gmail';
   ```
2. Verify RLS policies allow insert/update
3. Check edge function response for errors

### 3. Email Sending Issues

#### Emails Not Sending

**Checklist**:
1. Verify Gmail integration exists in database
2. Check access token hasn't expired
3. Verify send-email edge function is deployed
4. Check edge function logs for errors

**Debug Query**:
```sql
-- Check integration status
SELECT 
  provider,
  email,
  expires_at,
  created_at,
  updated_at
FROM user_integrations 
WHERE provider = 'gmail' 
AND user_id = 'YOUR_USER_ID';
```

#### Email Tracking Not Working

**Error**: Opens/clicks not being tracked

**Solution**:
1. Verify tracking endpoints are accessible:
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/email-tracker?id=test
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/link-tracker?id=test&url=https://example.com
   ```
2. Check email_events table for records
3. Verify campaign_id is included in tracking URLs

### 4. Authentication Issues

#### 401 Unauthorized

**Common Causes**:
1. Missing or invalid authorization header
2. Expired session
3. Incorrect Supabase anon key

**Solution**:
1. Log out and log back in
2. Check browser DevTools for auth headers
3. Verify Supabase configuration

#### Token Refresh Failures

**Error**: "Failed to refresh access token"

**Solution**:
1. Check refresh_token exists in user_integrations
2. Verify GOOGLE_CLIENT_SECRET is correct
3. Re-authenticate if refresh token is invalid

### 5. Environment Issues

#### Edge Function Not Found

**Error**: "Edge Function returned a non-2xx status code"

**Solution**:
```bash
# List deployed functions
npx supabase functions list --project-ref YOUR_PROJECT_ID

# Deploy missing function
npx supabase functions deploy gmail-auth --project-ref YOUR_PROJECT_ID
```

#### Wrong Port Error

**Error**: Application not accessible on expected port

**Solution**:
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Start on correct port
npm run dev -- --port 8080
```

## Debug Tools and Commands

### Check Supabase Configuration

```bash
# View secrets (hashed)
npx supabase secrets list --project-ref YOUR_PROJECT_ID | grep GOOGLE

# Test edge function
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/gmail-auth \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Database Queries

```sql
-- Check all integrations
SELECT * FROM user_integrations WHERE provider = 'gmail';

-- Check recent email events
SELECT * FROM email_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Check campaign analytics
SELECT * FROM campaign_analytics 
WHERE campaign_id = 'YOUR_CAMPAIGN_ID';
```

### Browser Console Commands

```javascript
// Check if popup is blocked
const testPopup = window.open('', 'test', 'width=100,height=100');
if (!testPopup || testPopup.closed) {
  console.log('Popups are blocked');
} else {
  testPopup.close();
  console.log('Popups are allowed');
}

// Check localStorage for auth data
console.log('Gmail auth state:', localStorage.getItem('gmail_auth_state'));
console.log('Gmail integration:', localStorage.getItem('gmail_integration'));
```

## Getting Help

If issues persist after trying these solutions:

1. Check Supabase Dashboard logs
2. Review browser console errors
3. Verify all environment variables
4. Check [GitHub Issues](https://github.com/your-repo/issues)
5. Contact support with:
   - Error messages
   - Browser console logs
   - Edge function logs
   - Steps to reproduce