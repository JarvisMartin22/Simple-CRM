# Gmail Integration Guide

## Overview

Simple CRM's Gmail integration allows you to:
- Import and sync contacts from Gmail
- Track email opens and clicks
- Send tracked emails directly from CRM
- View email history for contacts

> **Quick Links**:
> - [Setup Guide](../setup/gmail-integration-setup.md) - Complete setup instructions
> - [Troubleshooting](../troubleshooting/gmail-integration.md) - Common issues and solutions
> - [Contact Import](./gmail-contact-import.md) - Detailed import documentation

## ⚠️ Important Development Note

**Local Development Limitation**: The Gmail integration **cannot** be tested with local Supabase instances. This is due to OAuth2 callback requirements and security restrictions. For development and testing:

1. Always use a deployed Supabase instance (staging/production)
2. Configure your OAuth2 credentials with proper public URLs
3. Use a development/staging environment in Supabase for testing

This limitation means you'll need to:
- Deploy Edge Functions to a real Supabase project for testing
- Use actual domain URLs for OAuth callbacks
- Maintain separate OAuth credentials for staging/production

## Quick Setup Guide

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Gmail API and People API
4. Configure OAuth consent screen:
   - User Type: External
   - Application name: "Golly CRM"
   - Authorized domains: Add your domain
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - **Authorized redirect URIs** (CRITICAL - must be exact):
     - `http://localhost:8080/auth-callback.html` (for local development)
     - `https://your-domain.com/auth-callback.html` (for production)

### 2. Environment Variables

Set these variables in your Supabase project:
```bash
supabase secrets set GOOGLE_CLIENT_ID="your-client-id"
supabase secrets set GOOGLE_CLIENT_SECRET="your-client-secret"
supabase secrets set GMAIL_REDIRECT_URI="http://localhost:8080/auth-callback.html"
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy gmail-auth --project-ref your-project-ref
```

### 4. Start Development Server

**Important**: Must run on port 8080 to match redirect URI:
```bash
npm run dev -- --port 8080
```

## 🎯 Expected Clean Console Output

After our improvements, you should see minimal, clean console output:

### ✅ Successful Connection
```
Gmail: Starting connection process...
Gmail: Processing auth code...
✅ Gmail connected successfully: your-email@gmail.com
```

### 🆕 OAuth Flow Improvements (May 2025)

**Automatic Window Closing**: The OAuth callback window now automatically closes after successful authentication, providing a seamless user experience. The integration handles both popup and redirect flows gracefully.

### ❌ Common Issues (Resolved)

**BEFORE (Messy):**
```
Cross-Origin-Opener-Policy policy would block the window.closed call. (x10)
DEBUG - Message received: MessageEvent {...}
Gmail auth endpoint error: FunctionsHttpError: Edge Function returned a non-2xx status code
OAuth service error (non-500): FunctionsHttpError...
Error processing auth code: Error: Gmail connection failed...
```

**AFTER (Clean):**
No more console spam! The integration handles these errors gracefully behind the scenes.

## 🔧 Technical Implementation Details

### Error Handling Improvements

1. **COOP Policy Errors**: All `window.closed` checks are wrapped in try-catch blocks
2. **OAuth Race Conditions**: 400 errors wait 3 seconds for retry before failing
3. **Server Errors**: 500 errors wait 5 seconds for recovery
4. **Duplicate Prevention**: Multiple auth attempts are properly deduplicated

### Code Architecture

- **`useGmailConnect.ts`**: Main connection hook with clean error handling
- **`GmailIntegration.tsx`**: UI component with minimal logging
- **`gmail-auth/index.ts`**: Edge function with comprehensive OAuth flow

## Features

### Contact Import

The Gmail integration fetches contacts from three sources:
1. Main Contacts (saved contacts)
2. Other Contacts (people you've emailed)
3. Frequently Contacted

Contact data includes:
- Names
- Email addresses
- Organizations
- Phone numbers
- Profile photos
- URLs/social links

### Email Tracking

Track email interactions:
- Open tracking via pixel
- Link click tracking
- Reply detection
- Engagement metrics

### Campaign Management

Create and manage email campaigns:
- Template support
- Scheduled sending
- Open/click analytics
- A/B testing

## 🚨 Troubleshooting Guide

### Environment Verification

Run the environment checker:
```bash
node check-gmail-env.js
```

Expected output:
```
✅ Gmail Integration Environment Check
-------------------------------------
✅ GMAIL_REDIRECT_URI is set and contains port 8080
✅ GOOGLE_CLIENT_ID is set
✅ GOOGLE_CLIENT_SECRET is set
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `redirect_uri_mismatch` | URI not in Google Console | Add exact URI to Google Cloud Console |
| `invalid_client` | Wrong credentials | Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |
| Port mismatch | App running on wrong port | Ensure app runs on port 8080: `npm run dev -- --port 8080` |
| Function not updated | Environment variables changed | Redeploy: `supabase functions deploy gmail-auth` |

### Advanced Debugging

#### 1. Check Function Logs
```bash
supabase functions logs gmail-auth --project-ref your-project-ref
```

#### 2. Test OAuth URL Generation
```bash
# Should return a valid OAuth URL
curl -X POST https://your-project.supabase.co/functions/v1/gmail-auth \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### 3. Verify Database Schema
```sql
-- Check if user_integrations table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_integrations';
```

### Google Cloud Console Checklist

- [ ] Gmail API enabled
- [ ] People API enabled
- [ ] OAuth consent screen configured
- [ ] Exact redirect URIs added:
  - [ ] `http://localhost:8080/auth-callback.html`
  - [ ] `https://your-domain.com/auth-callback.html`
- [ ] Required scopes allowed:
  - [ ] `gmail.readonly`
  - [ ] `gmail.send`
  - [ ] `contacts.readonly`
  - [ ] `contacts.other.readonly`
  - [ ] `userinfo.email`
  - [ ] `userinfo.profile`

## 🧪 Testing Tools

### Gmail API Tester
Use the included `gmail-api-tester.html` file:
1. Open in browser
2. Configure Supabase URL and API key
3. Test each endpoint individually
4. Verify integration status

### Manual Testing Steps
1. Clear browser console (Cmd+K)
2. Navigate to `/app/integrations`
3. Click "Connect Gmail"
4. Complete OAuth flow
5. Verify clean console output
6. Check integration shows as connected

## 🎉 Success Indicators

✅ **Clean Console**: No COOP errors or OAuth spam  
✅ **Quick Connection**: OAuth completes in ~5 seconds  
✅ **Proper Fallbacks**: Handles errors gracefully  
✅ **Persistent State**: Integration survives page refresh  
✅ **Real Data**: Email stats and contact sync work  

## Getting Help

- **Check logs**: `supabase functions logs gmail-auth`
- **Environment check**: `node check-gmail-env.js`
- **API testing**: Open `gmail-api-tester.html`
- **Support**: Contact the development team

---

*Last updated: After comprehensive console cleanup and error handling improvements* 