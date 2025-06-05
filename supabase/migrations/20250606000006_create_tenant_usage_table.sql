-- Create tenant_usage table for tracking usage limits
CREATE TABLE public.tenant_usage (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_count integer DEFAULT 0 NOT NULL,
  email_send_count integer DEFAULT 0 NOT NULL,
  last_reset timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant usage access
CREATE POLICY "Users can view their tenant's usage" ON public.tenant_usage
  FOR SELECT USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_tenant_usage_updated_at
  BEFORE UPDATE ON public.tenant_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to initialize tenant usage when tenant is created
CREATE OR REPLACE FUNCTION public.initialize_tenant_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tenant_usage (tenant_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize usage tracking
CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_tenant_usage();

-- Create function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_tenant_id uuid,
  p_usage_type text,
  p_increment integer DEFAULT 1
)
RETURNS boolean AS $$
DECLARE
  v_tenant record;
  v_usage record;
  v_current_count integer;
  v_limit integer;
BEGIN
  -- Get tenant limits
  SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get current usage
  SELECT * INTO v_usage FROM public.tenant_usage WHERE tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check the specific usage type
  CASE p_usage_type
    WHEN 'contacts' THEN
      v_current_count := v_usage.contact_count;
      v_limit := v_tenant.contact_cap;
    WHEN 'emails' THEN
      v_current_count := v_usage.email_send_count;
      v_limit := v_tenant.email_cap;
    ELSE
      RETURN false;
  END CASE;

  -- Check if adding increment would exceed limit
  RETURN (v_current_count + p_increment) <= v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_tenant_id uuid,
  p_usage_type text,
  p_increment integer DEFAULT 1
)
RETURNS boolean AS $$
BEGIN
  -- First check if we can increment
  IF NOT public.check_usage_limit(p_tenant_id, p_usage_type, p_increment) THEN
    RETURN false;
  END IF;

  -- Increment the usage
  CASE p_usage_type
    WHEN 'contacts' THEN
      UPDATE public.tenant_usage 
      SET contact_count = contact_count + p_increment,
          updated_at = now()
      WHERE tenant_id = p_tenant_id;
    WHEN 'emails' THEN
      UPDATE public.tenant_usage 
      SET email_send_count = email_send_count + p_increment,
          updated_at = now()
      WHERE tenant_id = p_tenant_id;
  END CASE;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset monthly usage
CREATE OR REPLACE FUNCTION public.reset_monthly_usage(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.tenant_usage
  SET email_send_count = 0,
      last_reset = now(),
      updated_at = now()
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically track usage
-- Track contact creation
CREATE OR REPLACE FUNCTION public.track_contact_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Check and increment contact count
    IF NOT public.increment_usage(NEW.tenant_id, 'contacts', 1) THEN
      RAISE EXCEPTION 'Contact limit exceeded for your subscription plan';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement contact count
    UPDATE public.tenant_usage
    SET contact_count = GREATEST(0, contact_count - 1),
        updated_at = now()
    WHERE tenant_id = OLD.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_contact_usage
  BEFORE INSERT OR DELETE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.track_contact_usage();

-- Initialize usage for existing tenants
INSERT INTO public.tenant_usage (tenant_id, contact_count)
SELECT 
  t.id,
  COALESCE(COUNT(c.id), 0)
FROM public.tenants t
LEFT JOIN public.contacts c ON c.tenant_id = t.id
GROUP BY t.id
ON CONFLICT (tenant_id) DO NOTHING;