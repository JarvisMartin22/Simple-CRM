-- Combined migration script for Simple CRM
-- Generated on 2025-05-21T23:40:04.943Z
-- Run this in your Supabase SQL Editor

BEGIN;

-- ==========================================
-- Migration: 20240325000000_contacts_companies_schema.sql
-- ==========================================

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company_id UUID,
  title TEXT,
  phone TEXT,
  website TEXT,
  last_contacted TIMESTAMP WITH TIME ZONE,
  interaction_count INTEGER DEFAULT 0,
  source TEXT DEFAULT NULL,
  external_id TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  description TEXT,
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Add foreign key from contacts to companies
ALTER TABLE public.contacts
ADD CONSTRAINT fk_company
FOREIGN KEY (company_id)
REFERENCES public.companies(id)
ON DELETE SET NULL;

-- Create tags table to track available tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'contact' or 'company'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name, entity_type)
);

-- Create contact_activities table for timeline
CREATE TABLE IF NOT EXISTS public.contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- email, note, meeting, call, etc.
  title TEXT NOT NULL,
  description TEXT,
  email_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Setup Row Level Security
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Users can view their own contacts"
  ON public.contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts"
  ON public.contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON public.contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON public.contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for companies
CREATE POLICY "Users can view their own companies"
  ON public.companies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own companies"
  ON public.companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
  ON public.companies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
  ON public.companies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for tags
CREATE POLICY "Users can view their own tags"
  ON public.tags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON public.tags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON public.tags
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.tags
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for contact_activities
CREATE POLICY "Users can view their own contact activities"
  ON public.contact_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact activities"
  ON public.contact_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS contacts_email_idx ON public.contacts(email);
CREATE INDEX IF NOT EXISTS contacts_company_id_idx ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS companies_user_id_idx ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS companies_domain_idx ON public.companies(domain);
CREATE INDEX IF NOT EXISTS tags_user_id_idx ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS contact_activities_contact_id_idx ON public.contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS contact_activities_user_id_idx ON public.contact_activities(user_id); 

-- ==========================================
-- Migration: 20240326000000_create_crm_tables.sql
-- ==========================================

-- Create enum types
CREATE TYPE industry_type AS ENUM (
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Education',
  'Real Estate',
  'Consulting',
  'Other'
);

CREATE TYPE custom_field_type AS ENUM (
  'text',
  'number',
  'date',
  'boolean'
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry industry_type NOT NULL DEFAULT 'Other',
  domain TEXT,
  website TEXT,
  size TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create contact_employment_history table
CREATE TABLE IF NOT EXISTS contact_employment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create custom_fields table
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  type custom_field_type NOT NULL DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create contact_tags table
CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(contact_id, tag_id)
);

-- Create email_stats table
CREATE TABLE IF NOT EXISTS email_stats (
  contact_id UUID PRIMARY KEY,
  total_sent INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  response_rate FLOAT DEFAULT 0,
  linked_deals FLOAT DEFAULT 0,
  revenue FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own companies"
  ON companies FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own contacts"
  ON contacts FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE contact_employment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own contact employment history"
  ON contact_employment_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_employment_history.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own custom fields"
  ON custom_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = custom_fields.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own contact tags"
  ON contact_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tags.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

ALTER TABLE email_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own email stats"
  ON email_stats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = email_stats.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contact_employment_history_contact_id ON contact_employment_history(contact_id);
CREATE INDEX idx_contact_employment_history_company_id ON contact_employment_history(company_id);
CREATE INDEX idx_custom_fields_contact_id ON custom_fields(contact_id);
CREATE INDEX idx_contact_tags_contact_id ON contact_tags(contact_id);
CREATE INDEX idx_contact_tags_tag_id ON contact_tags(tag_id); 

-- ==========================================
-- Migration: 20240530000001_add_full_name_to_contacts.sql
-- ==========================================

-- Add full_name field to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create an index for full_name to optimize search
CREATE INDEX IF NOT EXISTS contacts_full_name_idx ON public.contacts(full_name);

-- Create a function to auto-update full_name
CREATE OR REPLACE FUNCTION public.update_contact_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update full_name when first_name or last_name changes
CREATE TRIGGER update_full_name_trigger
BEFORE INSERT OR UPDATE OF first_name, last_name ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_contact_full_name();

-- Update existing records
UPDATE public.contacts
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL; 

-- ==========================================
-- Migration: 20240530000002_create_user_integrations_table.sql
-- ==========================================

-- Create user_integrations table to store email and API integrations
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Setup Row Level Security
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for user_integrations
CREATE POLICY "Users can view their own integrations"
  ON public.user_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations"
  ON public.user_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.user_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.user_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_integrations_user_id_idx ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS user_integrations_provider_idx ON public.user_integrations(provider); 

-- ==========================================
-- Migration: 20240517000000_gmail_tracking_tables.sql
-- ==========================================

-- Create sync_logs table to track synchronization status
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tracked_links table for link tracking
CREATE TABLE IF NOT EXISTS public.tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  email_id TEXT,
  email_tracking_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  tracking_pixel_id UUID UNIQUE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  last_user_agent TEXT,
  last_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, email_id)
);

-- Create email_events table for tracking all email-related events
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_tracking_id UUID REFERENCES public.email_tracking(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  recipient TEXT,
  subject TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_notifications table for notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  email_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_logs
CREATE POLICY "Users can view their own sync logs"
  ON public.sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for tracked_links
CREATE POLICY "Users can view their own tracked links"
  ON public.tracked_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for email_tracking
CREATE POLICY "Users can view their own email tracking"
  ON public.email_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for email_events
CREATE POLICY "Users can view their own email events"
  ON public.email_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sync_logs_user_id_idx ON public.sync_logs(user_id);
CREATE INDEX IF NOT EXISTS tracked_links_user_id_idx ON public.tracked_links(user_id);
CREATE INDEX IF NOT EXISTS tracked_links_tracking_id_idx ON public.tracked_links(tracking_id);
CREATE INDEX IF NOT EXISTS email_tracking_user_id_idx ON public.email_tracking(user_id);
CREATE INDEX IF NOT EXISTS email_tracking_email_id_idx ON public.email_tracking(email_id);
CREATE INDEX IF NOT EXISTS email_events_user_id_idx ON public.email_events(user_id);
CREATE INDEX IF NOT EXISTS email_events_email_id_idx ON public.email_events(email_id);
CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS user_notifications_read_idx ON public.user_notifications(read); 

-- ==========================================
-- Migration: 20240605000000_create_pipelines_deals_tables.sql
-- ==========================================

-- Create pipelines table
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  value NUMERIC,
  probability INTEGER,
  close_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Setup Row Level Security
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policies for pipelines
CREATE POLICY "Users can manage their own pipelines"
  ON public.pipelines
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for pipeline stages
CREATE POLICY "Users can manage their own pipeline stages"
  ON public.pipeline_stages
  FOR ALL
  USING (
    pipeline_id IN (
      SELECT id FROM public.pipelines 
      WHERE user_id = auth.uid()
    )
  );

-- Create policies for deals
CREATE POLICY "Users can manage their own deals"
  ON public.deals
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS pipelines_user_id_idx ON public.pipelines(user_id);
CREATE INDEX IF NOT EXISTS pipeline_stages_pipeline_id_idx ON public.pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS deals_user_id_idx ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS deals_pipeline_id_idx ON public.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS deals_stage_id_idx ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS deals_company_id_idx ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS deals_contact_id_idx ON public.deals(contact_id); 

COMMIT;
