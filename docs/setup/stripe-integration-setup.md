# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe integration for the CRM billing system.

## Overview

The CRM uses Stripe for subscription management with three tiers:
- **Essential**: $29/mo - 1 user, 500 contacts, basic features
- **Advanced**: $99/mo - 5 users, 2,500 contacts, 1,200 emails/month, campaigns
- **Expert**: $299/mo - Unlimited users & contacts, 5,000 emails/month, API access

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Supabase project deployed (local development won't work for webhooks)
3. Node.js and npm installed

## Step 1: Create Stripe Products & Prices

1. Log into your Stripe Dashboard
2. Navigate to **Products** → **Add Product**
3. Create three products:

### Essential Plan
- **Name**: CRM Essential Plan
- **Description**: Perfect for individuals and small teams
- **Price**: $29.00 USD / month
- **Price ID**: Save this for later (e.g., `price_1234567890abcdef`)

### Advanced Plan
- **Name**: CRM Advanced Plan
- **Description**: Great for growing teams that need email campaigns
- **Price**: $99.00 USD / month
- **Price ID**: Save this for later

### Expert Plan
- **Name**: CRM Expert Plan
- **Description**: For larger teams that need full access and API
- **Price**: $299.00 USD / month
- **Price ID**: Save this for later

## Step 2: Configure Environment Variables

### Frontend (.env)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
VITE_STRIPE_PRICE_ESSENTIAL=price_essential_id
VITE_STRIPE_PRICE_ADVANCED=price_advanced_id
VITE_STRIPE_PRICE_EXPERT=price_expert_id
```

### Supabase Edge Functions
In your Supabase Dashboard, go to **Edge Functions** → **Settings** and add:
```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 3: Deploy Edge Functions

Deploy the Stripe edge functions to Supabase:

```bash
# From the project root
cd supabase/functions

# Deploy webhook handler
supabase functions deploy stripe-webhook

# Deploy checkout handler
supabase functions deploy stripe-checkout

# Deploy portal handler
supabase functions deploy stripe-portal
```

## Step 4: Configure Stripe Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```
4. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the **Signing secret** and add it to your Supabase Edge Functions environment

## Step 5: Apply Database Migrations

Run the migrations to set up the multi-tenant schema:

```bash
# From the project root
supabase db push
```

Or manually apply the migrations in order:
1. `20250606000003_create_tenants_table.sql`
2. `20250606000004_add_tenant_id_to_users.sql`
3. `20250606000005_add_tenant_id_to_tables.sql`
4. `20250606000006_create_tenant_usage_table.sql`

## Step 6: Configure Stripe Customer Portal

1. In Stripe Dashboard, go to **Settings** → **Billing** → **Customer portal**
2. Configure the following:
   - Enable customers to update payment methods
   - Enable customers to cancel subscriptions
   - Set cancellation policy (immediate or end of period)
   - Customize branding to match your CRM

## Testing

### Test Subscription Flow
1. Navigate to Settings → Billing in your CRM
2. Click "Upgrade" on a plan
3. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### Test Webhook Events
Use Stripe CLI for local testing:
```bash
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
```

### Verify Usage Enforcement
1. Try adding contacts beyond your plan limit
2. Try creating campaigns on Essential plan (should fail)
3. Check email send limits are enforced

## Troubleshooting

### Common Issues

1. **"No billing account found" error**
   - Ensure user has a tenant record
   - Check tenant_id is in user metadata

2. **Webhook failures**
   - Verify webhook secret is correct
   - Check edge function logs in Supabase Dashboard
   - Ensure all required events are configured

3. **Checkout not working**
   - Verify publishable key is correct
   - Check browser console for errors
   - Ensure price IDs match your Stripe products

### Debug Checklist
- [ ] All environment variables are set correctly
- [ ] Edge functions are deployed successfully
- [ ] Database migrations have been applied
- [ ] Stripe webhook endpoint is active
- [ ] RLS policies allow tenant access

## Production Checklist

Before going live:
- [ ] Switch from test to live Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Test full subscription flow with real card
- [ ] Set up monitoring for failed payments
- [ ] Configure customer support email in Stripe
- [ ] Review and adjust usage limits per plan
- [ ] Set up automated usage reset job (monthly)

## Support

For issues or questions:
- Stripe Documentation: https://stripe.com/docs
- Supabase Documentation: https://supabase.com/docs
- Create an issue in the repository