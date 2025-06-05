-- Add tenant_id to all usage-tracked tables

-- Add tenant_id to contacts table
ALTER TABLE public.contacts 
ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- Add index for performance
CREATE INDEX idx_contacts_tenant_id ON public.contacts(tenant_id);

-- Update existing contacts to use the user's tenant_id
UPDATE public.contacts c
SET tenant_id = (
  SELECT (au.raw_user_meta_data->>'tenant_id')::uuid
  FROM auth.users au
  WHERE au.id = c.user_id
)
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE public.contacts 
ALTER COLUMN tenant_id SET NOT NULL;

-- Add tenant_id to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- Add index for performance
CREATE INDEX idx_campaigns_tenant_id ON public.campaigns(tenant_id);

-- Update existing campaigns
UPDATE public.campaigns c
SET tenant_id = (
  SELECT (au.raw_user_meta_data->>'tenant_id')::uuid
  FROM auth.users au
  WHERE au.id = c.user_id
)
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE public.campaigns 
ALTER COLUMN tenant_id SET NOT NULL;

-- Add tenant_id to email_events table
ALTER TABLE public.email_events 
ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- Add index for performance
CREATE INDEX idx_email_events_tenant_id ON public.email_events(tenant_id);

-- Update existing email_events through campaigns
UPDATE public.email_events ee
SET tenant_id = c.tenant_id
FROM public.campaigns c
WHERE ee.campaign_id = c.id
AND ee.tenant_id IS NULL;

-- Add tenant_id to companies table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    ALTER TABLE public.companies ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
    CREATE INDEX idx_companies_tenant_id ON public.companies(tenant_id);
    
    -- Update existing companies
    UPDATE public.companies comp
    SET tenant_id = (
      SELECT (au.raw_user_meta_data->>'tenant_id')::uuid
      FROM auth.users au
      WHERE au.id = comp.user_id
    )
    WHERE tenant_id IS NULL;
    
    -- Make tenant_id NOT NULL after backfill
    ALTER TABLE public.companies ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- Update RLS policies to include tenant_id checks
-- Contacts RLS
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
CREATE POLICY "Users can view their tenant's contacts" ON public.contacts
  FOR SELECT USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contacts;
CREATE POLICY "Users can create contacts for their tenant" ON public.contacts
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
CREATE POLICY "Users can update their tenant's contacts" ON public.contacts
  FOR UPDATE USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
CREATE POLICY "Users can delete their tenant's contacts" ON public.contacts
  FOR DELETE USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Campaigns RLS
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
CREATE POLICY "Users can view their tenant's campaigns" ON public.campaigns
  FOR SELECT USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their own campaigns" ON public.campaigns;
CREATE POLICY "Users can create campaigns for their tenant" ON public.campaigns
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
CREATE POLICY "Users can update their tenant's campaigns" ON public.campaigns
  FOR UPDATE USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;
CREATE POLICY "Users can delete their tenant's campaigns" ON public.campaigns
  FOR DELETE USING (
    tenant_id IN (
      SELECT (raw_user_meta_data->>'tenant_id')::uuid 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );