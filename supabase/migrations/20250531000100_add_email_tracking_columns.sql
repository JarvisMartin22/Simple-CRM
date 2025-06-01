-- Add missing columns to email_tracking table for proper analytics

-- Add the missing columns if they don't exist
ALTER TABLE public.email_tracking 
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_user_agent TEXT,
ADD COLUMN IF NOT EXISTS last_ip TEXT,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS email_tracking_campaign_id_idx ON public.email_tracking(campaign_id);

-- Update existing records to set open_count to 0 if null
UPDATE public.email_tracking SET open_count = 0 WHERE open_count IS NULL;
UPDATE public.email_tracking SET click_count = 0 WHERE click_count IS NULL;