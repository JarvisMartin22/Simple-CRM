-- Add template_id column to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.campaign_templates(id);

-- Create index for template_id
CREATE INDEX IF NOT EXISTS campaigns_template_id_idx ON public.campaigns(template_id); 