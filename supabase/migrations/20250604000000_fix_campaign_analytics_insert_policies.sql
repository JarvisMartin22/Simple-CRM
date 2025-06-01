-- Fix RLS policies for campaign_analytics to allow inserts from triggers
-- The trigger runs as the user who inserted the campaign, so we need to allow inserts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert campaign analytics" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Users can insert their own campaign analytics" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Service role can insert recipient analytics" ON public.recipient_analytics;
DROP POLICY IF EXISTS "Users can insert their own recipient analytics" ON public.recipient_analytics;

-- Create INSERT policies for campaign_analytics
CREATE POLICY "Users can insert their own campaign analytics"
  ON public.campaign_analytics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_analytics.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create UPDATE policies for campaign_analytics
CREATE POLICY "Users can update their own campaign analytics"
  ON public.campaign_analytics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_analytics.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create INSERT policies for recipient_analytics
CREATE POLICY "Users can insert their own recipient analytics"
  ON public.recipient_analytics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = recipient_analytics.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create UPDATE policies for recipient_analytics
CREATE POLICY "Users can update their own recipient analytics"
  ON public.recipient_analytics
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = recipient_analytics.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Make sure the tables have RLS enabled
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_analytics ENABLE ROW LEVEL SECURITY;

-- Also ensure the trigger function has proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.campaign_analytics TO authenticated;
GRANT ALL ON public.recipient_analytics TO authenticated;