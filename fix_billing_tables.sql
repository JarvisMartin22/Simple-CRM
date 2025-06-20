-- Fix billing/tenant tables and views
-- Run this in your Supabase SQL Editor

-- 1. Create tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  plan_type text NOT NULL DEFAULT 'essential' 
    CHECK (plan_type IN ('essential', 'advanced', 'expert')),
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

-- 2. Create tenant_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenant_usage (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_count integer DEFAULT 0 NOT NULL,
  email_send_count integer DEFAULT 0 NOT NULL,
  last_reset timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Check if user already has a tenant_id
  IF NEW.raw_user_meta_data ? 'tenant_id' THEN
    RETURN NEW;
  END IF;

  -- Create a new tenant for the user
  INSERT INTO public.tenants (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.email))
  RETURNING id INTO new_tenant_id;

  -- Update user metadata with tenant_id
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{tenant_id}',
    to_jsonb(new_tenant_id)
  );

  -- Create initial usage record
  INSERT INTO public.tenant_usage (tenant_id)
  VALUES (new_tenant_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Create or replace the user_tenants view
CREATE OR REPLACE VIEW public.user_tenants AS
SELECT 
  au.id as user_id,
  au.email,
  (au.raw_user_meta_data->>'tenant_id')::uuid as tenant_id,
  t.*
FROM auth.users au
LEFT JOIN public.tenants t ON t.id = (au.raw_user_meta_data->>'tenant_id')::uuid;

-- 6. Set up permissions
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT ON public.tenant_usage TO authenticated;
GRANT SELECT ON public.user_tenants TO authenticated;

-- 7. Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (
    id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'tenant_id')::uuid
  );

CREATE POLICY "Users can view their tenant usage" ON public.tenant_usage
  FOR SELECT USING (
    tenant_id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'tenant_id')::uuid
  );

-- 9. Fix existing users without tenant_id (if any)
DO $$
DECLARE
  user_record RECORD;
  new_tenant_id uuid;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE NOT (raw_user_meta_data ? 'tenant_id')
  LOOP
    -- Create tenant for user
    INSERT INTO public.tenants (name) 
    VALUES (user_record.email) 
    RETURNING id INTO new_tenant_id;
    
    -- Update user metadata
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{tenant_id}',
      to_jsonb(new_tenant_id)
    )
    WHERE id = user_record.id;
    
    -- Create usage record
    INSERT INTO public.tenant_usage (tenant_id) 
    VALUES (new_tenant_id);
  END LOOP;
END $$;

-- 10. Verify the setup
SELECT 'Setup complete!' as status;
SELECT COUNT(*) as tenant_count FROM public.tenants;
SELECT COUNT(*) as user_tenant_count FROM public.user_tenants;