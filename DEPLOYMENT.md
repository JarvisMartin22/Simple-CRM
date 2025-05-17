# Golly CRM Deployment Guide

This guide outlines the steps required to properly deploy Golly CRM to production with full email verification functionality.

## Domain Configuration

The production site is deployed to: **https://trygolly.com**

## Supabase Configuration

### 1. Authentication Settings

Log in to your Supabase dashboard and select your project. Then go to Authentication → Settings and configure:

- Site URL: `https://trygolly.com`
- Redirect URLs:
  - `https://trygolly.com/auth/callback` (primary for auth flow)
  - `https://trygolly.com/app/dashboard`
  - `https://trygolly.com/auth/login`
  - `https://trygolly.com/auth/register`

### 2. Email Templates

Navigate to Authentication → Email Templates and update:

- Sender name: `Golly CRM`
- Sender email: `noreply@trygolly.com` (or your preferred email)
- Customize the email templates with Golly branding

### 3. Email Provider Configuration

For production, you should use a custom SMTP server:

1. Go to Authentication → Email Settings
2. Select "Custom SMTP Server"
3. Configure with your email provider's details:
   - Host: (from your email provider)
   - Port: 587 (or as specified by your provider)
   - Username & Password: (from your email provider)
   - Enable TLS encryption

Recommended email providers:
- Amazon SES
- SendGrid
- Mailgun
- Postmark

### 4. DNS Configuration for Email

To ensure email deliverability, add these DNS records:

- SPF record: `v=spf1 include:_spf.trygolly.com ~all`
- DKIM records: (as provided by your email service)
- DMARC record: `v=DMARC1; p=quarantine; rua=mailto:admin@trygolly.com`

## Environment Variables

Create a `.env.production` file with:

```
VITE_SITE_URL=https://trygolly.com
VITE_SUPABASE_URL=https://bujaaqjxrvntcneoarkj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw
```

## Build for Production

```bash
npm run build
```

## Testing Email Verification

1. Register a new test user at https://trygolly.com/auth/register
2. Check the inbox for the verification email
3. Click the verification link to confirm it redirects to the dashboard
4. Verify you can log in with the new user

## Troubleshooting

If verification emails are not received:
1. Check your Supabase logs for any errors
2. Verify SMTP credentials are correct
3. Check spam folders
4. Test with multiple email providers (Gmail, Outlook, etc.)

For email deliverability issues:
1. Verify SPF, DKIM, and DMARC records are correctly configured
2. Use a tool like [mail-tester.com](https://www.mail-tester.com/) to check your email reputation 