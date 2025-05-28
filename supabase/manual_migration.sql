-- First, create the campaign_templates table
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

-- Enable RLS
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own templates" ON public.campaign_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.campaign_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.campaign_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.campaign_templates;

-- Create fresh policies
CREATE POLICY "Users can view their own templates"
  ON public.campaign_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.campaign_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.campaign_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.campaign_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS campaign_templates_user_id_idx ON public.campaign_templates(user_id); 