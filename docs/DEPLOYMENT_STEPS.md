# Deployment Steps for Production

## 🚀 Moving from Development to Production

Your Stripe integration is currently in **development mode** with demo functionality. To enable full Stripe checkout in production, follow these steps:

### 1. Deploy Supabase Edge Functions

```bash
# Deploy the Stripe-related edge functions
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal  
supabase functions deploy stripe-webhook
```

### 2. Configure Stripe Environment Variables

In your Supabase Dashboard → Edge Functions → Settings, add:

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ESSENTIAL_MONTHLY=price_live_essential_monthly_id
STRIPE_PRICE_ESSENTIAL_ANNUAL=price_live_essential_annual_id
STRIPE_PRICE_ADVANCED_MONTHLY=price_live_advanced_monthly_id
STRIPE_PRICE_ADVANCED_ANNUAL=price_live_advanced_annual_id
STRIPE_PRICE_EXPERT_MONTHLY=price_live_expert_monthly_id
STRIPE_PRICE_EXPERT_ANNUAL=price_live_expert_annual_id
```

### 3. Update Frontend Environment Variables

Update your production `.env` with live Stripe keys:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
VITE_STRIPE_PRICE_ESSENTIAL_MONTHLY=price_live_essential_monthly_id
VITE_STRIPE_PRICE_ESSENTIAL_ANNUAL=price_live_essential_annual_id
VITE_STRIPE_PRICE_ADVANCED_MONTHLY=price_live_advanced_monthly_id
VITE_STRIPE_PRICE_ADVANCED_ANNUAL=price_live_advanced_annual_id
VITE_STRIPE_PRICE_EXPERT_MONTHLY=price_live_expert_monthly_id
VITE_STRIPE_PRICE_EXPERT_ANNUAL=price_live_expert_annual_id
```

### 4. Run Database Migrations

```bash
supabase db push
```

### 5. Configure Stripe Webhooks

In Stripe Dashboard → Webhooks → Add endpoint:
- **URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- **Events**: 
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated` 
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

## 🧪 Current Development Mode

Currently in localhost, the system shows:
- **Demo toasts** instead of real Stripe checkout
- **Correct pricing display**: $4.99, $14.99, $24.99 (monthly)
- **Working flow**: Registration → Login → Demo checkout
- **Settings redirect**: Takes you to billing tab for plan management

## ✅ Production Ready Features

- ✅ Correct pricing display ($4.99, $14.99, $24.99)
- ✅ 20% annual discount calculation
- ✅ User flow with plan selection
- ✅ Registration with plan context
- ✅ Login with plan context  
- ✅ Settings billing management
- ✅ Usage tracking and enforcement
- ✅ Multi-tenant architecture

Once edge functions are deployed, the demo mode will automatically switch to real Stripe integration! 🎉