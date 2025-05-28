-- Add new columns to campaigns table if they don't exist
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('one_time', 'automated', 'sequence')) NOT NULL DEFAULT 'one_time',
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS schedule_config JSONB,
ADD COLUMN IF NOT EXISTS audience_filter JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT jsonb_build_object(
  'total_recipients', 0,
  'sent', 0,
  'opened', 0,
  'clicked', 0,
  'replied', 0,
  'bounced', 0
),
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add monthly email tracking to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS monthly_email_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_email_limit INTEGER DEFAULT 100;

-- Create campaign_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaign_recipients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  email_tracking_id UUID REFERENCES public.email_tracking(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

-- Create campaign_sequences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.campaign_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  template_id UUID NOT NULL REFERENCES public.campaign_templates(id),
  delay_days INTEGER NOT NULL DEFAULT 0,
  conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, step_number)
);

-- Enable RLS on new tables
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_templates
DROP POLICY IF EXISTS "Users can view their own templates" ON public.campaign_templates;
CREATE POLICY "Users can view their own templates"
  ON public.campaign_templates FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own templates" ON public.campaign_templates;
CREATE POLICY "Users can create their own templates"
  ON public.campaign_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.campaign_templates;
CREATE POLICY "Users can update their own templates"
  ON public.campaign_templates FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.campaign_templates;
CREATE POLICY "Users can delete their own templates"
  ON public.campaign_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for campaign_recipients
DROP POLICY IF EXISTS "Users can view their own campaign recipients" ON public.campaign_recipients;
CREATE POLICY "Users can view their own campaign recipients"
  ON public.campaign_recipients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_recipients.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can manage their own campaign recipients" ON public.campaign_recipients;
CREATE POLICY "Users can manage their own campaign recipients"
  ON public.campaign_recipients FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_recipients.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- RLS Policies for campaign_sequences
DROP POLICY IF EXISTS "Users can view their own campaign sequences" ON public.campaign_sequences;
CREATE POLICY "Users can view their own campaign sequences"
  ON public.campaign_sequences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_sequences.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can manage their own campaign sequences" ON public.campaign_sequences;
CREATE POLICY "Users can manage their own campaign sequences"
  ON public.campaign_sequences FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = campaign_sequences.campaign_id
    AND campaigns.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS campaign_templates_user_id_idx ON public.campaign_templates(user_id);
CREATE INDEX IF NOT EXISTS campaign_recipients_campaign_id_idx ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_recipients_contact_id_idx ON public.campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS campaign_sequences_campaign_id_idx ON public.campaign_sequences(campaign_id);

-- Create function to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL OR
    NEW.opened_at IS NOT NULL AND OLD.opened_at IS NULL OR
    NEW.clicked_at IS NOT NULL AND OLD.clicked_at IS NULL OR
    NEW.replied_at IS NOT NULL AND OLD.replied_at IS NULL OR
    NEW.bounced_at IS NOT NULL AND OLD.bounced_at IS NULL
  ) THEN
    UPDATE public.campaigns
    SET stats = (
      SELECT jsonb_build_object(
        'total_recipients', COUNT(*),
        'sent', COUNT(sent_at),
        'opened', COUNT(opened_at),
        'clicked', COUNT(clicked_at),
        'replied', COUNT(replied_at),
        'bounced', COUNT(bounced_at)
      )
      FROM public.campaign_recipients
      WHERE campaign_id = NEW.campaign_id
    )
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating campaign stats
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON public.campaign_recipients;
CREATE TRIGGER update_campaign_stats_trigger
AFTER UPDATE ON public.campaign_recipients
FOR EACH ROW
EXECUTE FUNCTION update_campaign_stats();

-- Create function to increment monthly email count
CREATE OR REPLACE FUNCTION increment_monthly_email_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL THEN
    UPDATE public.users
    SET monthly_email_count = monthly_email_count + 1
    FROM public.campaigns
    WHERE campaigns.id = NEW.campaign_id
    AND users.id = campaigns.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for incrementing monthly email count
DROP TRIGGER IF EXISTS increment_monthly_email_count_trigger ON public.campaign_recipients;
CREATE TRIGGER increment_monthly_email_count_trigger
AFTER UPDATE ON public.campaign_recipients
FOR EACH ROW
EXECUTE FUNCTION increment_monthly_email_count(); 