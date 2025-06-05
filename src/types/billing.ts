export interface Tenant {
  id: string;
  name: string | null;
  plan_type: 'essential' | 'advanced' | 'expert';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  contact_cap: number;
  email_cap: number;
  can_use_campaigns: boolean;
  can_invite_users: boolean;
  api_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantUsage {
  tenant_id: string;
  contact_count: number;
  email_send_count: number;
  last_reset: string;
  updated_at: string;
}

export interface BillingState {
  tenant: Tenant | null;
  usage: TenantUsage | null;
  loading: boolean;
  error: string | null;
}

export interface SubscriptionDetails {
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_end: Date;
  cancel_at_period_end: boolean;
  plan: string;
}