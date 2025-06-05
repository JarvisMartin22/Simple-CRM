-- Create tenants table for multi-tenant architecture
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  plan_type text NOT NULL DEFAULT 'essential' CHECK (plan_type IN ('essential', 'advanced', 'expert')),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
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

-- Add indexes for performance
CREATE INDEX idx_tenants_stripe_customer_id ON public.tenants(stripe_customer_id);
CREATE INDEX idx_tenants_stripe_subscription_id ON public.tenants(stripe_subscription_id);
CREATE INDEX idx_tenants_plan_type ON public.tenants(plan_type);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant access
CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (id IN (
    SELECT tenant_id FROM auth.users WHERE auth.uid() = id
  ));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();