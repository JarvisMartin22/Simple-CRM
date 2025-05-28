-- Drop and recreate the campaigns table with all required columns
DROP TABLE IF EXISTS public.campaigns CASCADE;

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('one_time', 'automated', 'sequence')) NOT NULL DEFAULT 'one_time',
  status TEXT CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed')) NOT NULL DEFAULT 'draft',
  template_id UUID,
  schedule_config JSONB,
  audience_filter JSONB,
  metadata JSONB,
  stats JSONB DEFAULT jsonb_build_object(
    'total_recipients', 0,
    'sent', 0,
    'opened', 0,
    'clicked', 0,
    'replied', 0,
    'bounced', 0
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status); 