# Gmail Integration Verification Checklist

Use this checklist to quickly verify the Gmail integration is working properly.

## ✅ Environment Setup

- [ ] Server running on port 8080
- [ ] Gmail auth callback pages are accessible:
  - [ ] `http://localhost:8080/test-gmail-auth.html`
  - [ ] `http://localhost:8080/test-gmail-callback.html`
  - [ ] `http://localhost:8080/auth/callback/gmail/`
- [ ] Google Cloud Console has correct redirect URIs
- [ ] Supabase environment variables are set correctly:
  - [ ] GOOGLE_CLIENT_ID
  - [ ] GOOGLE_CLIENT_SECRET
  - [ ] GMAIL_REDIRECT_URI=`http://localhost:8080/auth/callback/gmail`

## ✅ Authentication Testing

- [ ] Click "Test Gmail Auth" on test page
- [ ] Successfully redirected to Google consent screen
- [ ] Successfully redirected back to callback page
- [ ] Auth code saved to localStorage
- [ ] No Cross-Origin-Opener-Policy errors in console

## ✅ Integration Testing

- [ ] Gmail connection successful in app settings
- [ ] Send test email to yourself
- [ ] Email successfully delivered
- [ ] Open tracking works
- [ ] Link tracking works (if enabled)

## ✅ Database Verification

- [ ] Record in `user_integrations` table for Gmail
- [ ] Records in `email_tracking` table with `campaign_id` field
- [ ] Records in `campaign_analytics` updated

## ✅ Troubleshooting (if needed)

- [ ] Check Supabase Edge Function logs
- [ ] Verify all Google Cloud APIs are enabled
- [ ] Confirm OAuth scopes are properly configured
- [ ] Check browser console for any errors
- [ ] Verify network requests in browser developer tools

---

If all items are checked, the Gmail integration is working properly! 