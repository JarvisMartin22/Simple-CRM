# CRM Billing & Subscription Management Plan (Stripe + Multi-Tenant Architecture)

## 🧩 Project Overview

You're implementing a Stripe-based billing system for a multi-tenant CRM with three subscription tiers:

- **Essential**: 1 user, 500 contacts, no campaigns
- **Advanced**: 2,500 contacts, 1,200 email sends, email campaigns
- **Expert**: Unlimited contacts, 5,000 email sends, API access, multi-user support

This document outlines the tasks and logic needed to support subscription enforcement, Stripe integration, and multi-tenant architecture.

---

## 📦 Phase 1: Data Model & Schema Updates

### ✅ Add `tenants` Table

```sql
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  plan_type text NOT NULL DEFAULT 'essential',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamp with time zone,
  trial_ends_at timestamp with time zone,
  contact_cap integer NOT NULL DEFAULT 500,
  email_cap integer NOT NULL DEFAULT 0,
  can_use_campaigns boolean DEFAULT false,
  can_invite_users boolean DEFAULT false,
  api_access boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### ✅ Update `auth.users` Table

```sql
ALTER TABLE auth.users ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
```

### ✅ Update All Usage-Tracked Tables with `tenant_id`

- `contacts`
- `campaigns`
- `email_tracking`
- `email_events`

Add a `tenant_id` column to these tables and backfill data if needed.

---

## 🔁 Phase 2: Stripe Integration

### 🔧 Stripe Setup

- Create products/plans for: Essential, Advanced, Expert
- Use **Stripe Checkout** and **Customer Portal**
- Setup webhook endpoints:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `customer.subscription.updated`

### 🛠 Webhook Logic

- On new subscription:
  - Link `stripe_customer_id`, `subscription_id` to `tenants`
  - Update `plan_type`, feature flags, usage caps
- On update:
  - Adjust `plan_type`, caps, and features
- On cancelation:
  - Downgrade to Essential or freeze access

### 🚀 User Flow

1. User signs up → tenant is created
2. Admin clicks "Upgrade" → Stripe Checkout is launched
3. Post-checkout, user is redirected to dashboard
4. Webhook finalizes plan settings

---

## 📊 Phase 3: Usage Enforcement

### ✅ Add `tenant_usage` Table

```sql
CREATE TABLE public.tenant_usage (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id),
  contact_count integer DEFAULT 0,
  email_send_count integer DEFAULT 0,
  last_reset timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### 🧠 Enforcement Logic (Backend Middleware)

| Action          | Check                          |
| --------------- | ------------------------------ |
| Add contact     | `contact_count < contact_cap`  |
| Send email      | `email_send_count < email_cap` |
| Create campaign | `can_use_campaigns = true`     |
| Invite users    | `can_invite_users = true`      |
| API access      | `api_access = true`            |

### 🔁 Monthly Resets

- Email + contact usage resets at `current_period_end`
- Trigger via Stripe or cron job

---

## 👥 Phase 4: Multi-User Tenant Support

### ✅ Tenant-Scoped Data

- All core records (contacts, pipelines, campaigns) are linked to `tenant_id`
- Users belong to a tenant

### ✅ User Invitation Flow

- Admin invites via email
- Invited user joins existing tenant (Expert plan only)
- Add optional RBAC (`admin`, `member`)

---

## 🔐 Feature Flag Schema (per Tenant)

```json
{
  "contact_cap": 2500,
  "email_cap": 1200,
  "can_use_campaigns": true,
  "can_invite_users": false,
  "api_access": false
}
```

These flags should be enforced on the backend and used to control frontend UI visibility.

---

## 🛠 Task Breakdown Summary

### Must-Have First:

-

### Next:

-

---

## 🧪 Bonus (If Time Allows)

-

---

This spec can be passed directly to Claude or Cursor to start implementation across backend (Supabase + API routes) and frontend logic (React/Next.js).
