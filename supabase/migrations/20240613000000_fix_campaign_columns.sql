-- Ensure the campaigns table exists
CREATE TABLE IF NOT EXISTS public.campaigns (
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

-- Drop and recreate the audience_filter column to ensure correct type
DO $$ 
BEGIN
  -- Drop the column if it exists
  BEGIN
    ALTER TABLE public.campaigns DROP COLUMN audience_filter;
  EXCEPTION
    WHEN undefined_column THEN
      RAISE NOTICE 'Column audience_filter does not exist, skipping drop';
  END;
  
  -- Add the column back
  BEGIN
    ALTER TABLE public.campaigns ADD COLUMN audience_filter JSONB;
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Column audience_filter already exists, skipping add';
  END;
END $$;

-- Refresh the schema cache
ALTER TABLE public.campaigns ALTER COLUMN audience_filter SET DATA TYPE JSONB; 