-- Add end_date column to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create index for end_date
CREATE INDEX IF NOT EXISTS campaigns_end_date_idx ON public.campaigns(end_date); 