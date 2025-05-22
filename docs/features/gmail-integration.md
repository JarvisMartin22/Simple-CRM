# Gmail Integration Guide

## Overview

Golly CRM's Gmail integration allows you to:
- Import and sync contacts from Gmail
- Track email opens and clicks
- Send tracked emails directly from CRM
- View email history for contacts

## ⚠️ Important Development Note

**Local Development Limitation**: The Gmail integration **cannot** be tested with local Supabase instances. This is due to OAuth2 callback requirements and security restrictions. For development and testing:

1. Always use a deployed Supabase instance (staging/production)
2. Configure your OAuth2 credentials with proper public URLs
3. Use a development/staging environment in Supabase for testing

This limitation means you'll need to:
- Deploy Edge Functions to a real Supabase project for testing
- Use actual domain URLs for OAuth callbacks
- Maintain separate OAuth credentials for staging/production

## Setup Instructions

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
   - Authorized redirect URIs: Add `https://your-domain.com/auth-callback.html`

### 2. Environment Variables

Add these variables to your Supabase project:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=https://your-domain.com/auth-callback.html
```

### 3. Deploy Edge Function

```bash
cd supabase/functions
supabase functions deploy gmail-contacts-preview
```

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

## Troubleshooting

### Common Issues

1. OAuth Errors:
   - Verify redirect URI matches exactly
   - Check OAuth consent screen configuration
   - Ensure required scopes are enabled

2. Contact Sync Issues:
   - Check API quotas in Google Cloud Console
   - Verify token permissions include contacts.readonly
   - Check Edge Function logs for errors

3. Email Tracking Problems:
   - Confirm tracking pixel is not blocked
   - Check email client compatibility
   - Verify SSL certificate for tracking domain

### Getting Help

- Check Edge Function logs: `supabase functions logs gmail-contacts-preview`
- Review Google Cloud Console logs
- Contact support: support@trygolly.com 