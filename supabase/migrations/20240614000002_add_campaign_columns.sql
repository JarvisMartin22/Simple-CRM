-- Add missing columns to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('one_time', 'automated', 'sequence')) NOT NULL DEFAULT 'one_time';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS audience_filter JSONB;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT jsonb_build_object(
  'total_recipients', 0,
  'sent', 0,
  'opened', 0,
  'clicked', 0,
  'replied', 0,
  'bounced', 0
);

-- Add missing columns to campaign_sequences table
ALTER TABLE public.campaign_sequences ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE public.campaign_sequences ADD COLUMN IF NOT EXISTS step_number INTEGER;
ALTER TABLE public.campaign_sequences ADD COLUMN IF NOT EXISTS delay_days INTEGER;
ALTER TABLE public.campaign_sequences ADD COLUMN IF NOT EXISTS conditions JSONB;

-- Add missing columns to campaign_analytics table
ALTER TABLE public.campaign_analytics ADD COLUMN IF NOT EXISTS template_id UUID; 