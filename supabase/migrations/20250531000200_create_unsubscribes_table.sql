-- Create unsubscribes table for tracking email unsubscribes

CREATE TABLE IF NOT EXISTS public.unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  method TEXT DEFAULT 'link' CHECK (method IN ('link', 'reply', 'manual', 'bounce')),
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicate unsubscribes for the same email/campaign combination
  UNIQUE(email, campaign_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS unsubscribes_email_idx ON public.unsubscribes(email);
CREATE INDEX IF NOT EXISTS unsubscribes_campaign_id_idx ON public.unsubscribes(campaign_id);
CREATE INDEX IF NOT EXISTS unsubscribes_contact_id_idx ON public.unsubscribes(contact_id);
CREATE INDEX IF NOT EXISTS unsubscribes_user_id_idx ON public.unsubscribes(user_id);
CREATE INDEX IF NOT EXISTS unsubscribes_unsubscribed_at_idx ON public.unsubscribes(unsubscribed_at);

-- Enable RLS
ALTER TABLE public.unsubscribes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own unsubscribes"
  ON public.unsubscribes FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT user_id FROM public.campaigns WHERE id = campaign_id
  ));

CREATE POLICY "Service role can manage unsubscribes"
  ON public.unsubscribes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check if email is unsubscribed
CREATE OR REPLACE FUNCTION is_email_unsubscribed(email_address TEXT, campaign_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if email is globally unsubscribed (campaign_id is null)
  IF EXISTS (
    SELECT 1 FROM public.unsubscribes 
    WHERE email = email_address 
    AND campaign_id IS NULL
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if email is unsubscribed from specific campaign
  IF campaign_id_param IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.unsubscribes 
    WHERE email = email_address 
    AND campaign_id = campaign_id_param
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to generate unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token(
  email_address TEXT, 
  campaign_id_param UUID, 
  contact_id_param UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_data JSONB;
  encoded_token TEXT;
BEGIN
  -- Create token data
  token_data := jsonb_build_object(
    'email', email_address,
    'campaign_id', campaign_id_param,
    'contact_id', contact_id_param,
    'timestamp', extract(epoch from now()) * 1000
  );
  
  -- Encode as base64
  encoded_token := encode(token_data::text::bytea, 'base64');
  
  RETURN encoded_token;
END;
$$;