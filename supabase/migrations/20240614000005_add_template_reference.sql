-- Add foreign key constraint for template_id
ALTER TABLE public.campaigns 
  ADD CONSTRAINT campaigns_template_id_fkey 
  FOREIGN KEY (template_id) 
  REFERENCES public.campaign_templates(id)
  ON DELETE SET NULL; 