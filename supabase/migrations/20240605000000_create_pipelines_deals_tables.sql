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