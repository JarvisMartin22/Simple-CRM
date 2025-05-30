-- Ensure email_tracking table exists with proper schema
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  tracking_pixel_id UUID UNIQUE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  last_user_agent TEXT,
  last_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, email_id)
);

-- Enable RLS
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own email tracking" ON public.email_tracking;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow service role and users to insert email tracking" ON public.email_tracking;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow service role and users to update email tracking" ON public.email_tracking;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create fresh policies
CREATE POLICY "Users can view their own email tracking"
  ON public.email_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow service role and users to insert email tracking"
  ON public.email_tracking
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role and users to update email tracking"
  ON public.email_tracking
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS email_tracking_user_id_idx ON public.email_tracking(user_id);
CREATE INDEX IF NOT EXISTS email_tracking_email_id_idx ON public.email_tracking(email_id);
CREATE INDEX IF NOT EXISTS email_tracking_tracking_pixel_id_idx ON public.email_tracking(tracking_pixel_id); 