-- Drop any existing insert policy
DROP POLICY IF EXISTS "Users can insert their own campaign analytics" ON public.campaign_analytics;

-- Create a policy that allows users to insert their own analytics
CREATE POLICY "Users can insert their own campaign analytics"
  ON public.campaign_analytics
  FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE user_id = auth.uid()
    )
  );

-- Make the trigger function security definer so it can bypass RLS
CREATE OR REPLACE FUNCTION initialize_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial analytics record
  INSERT INTO public.campaign_analytics (
    campaign_id,
    template_id,
    total_recipients,
    sent_count,
    delivered_count,
    opened_count,
    unique_opened_count,
    clicked_count,
    unique_clicked_count,
    bounced_count,
    complained_count,
    unsubscribed_count
  ) VALUES (
    NEW.id,
    NEW.template_id,
    COALESCE((NEW.audience_filter->>'size')::integer, 0),
    0, 0, 0, 0, 0, 0, 0, 0, 0
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to use the security definer function
DROP TRIGGER IF EXISTS initialize_analytics_on_campaign_create ON public.campaigns;

CREATE TRIGGER initialize_analytics_on_campaign_create
  AFTER INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION initialize_campaign_analytics();
