-- Fix RLS policies for campaign_analytics
DROP POLICY IF EXISTS "Users can view their own campaign analytics" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Users can view any campaign analytics" ON public.campaign_analytics;

-- Create a policy that allows users to view campaign analytics if they own the campaign
CREATE POLICY "Users can view any campaign analytics"
  ON public.campaign_analytics
  FOR SELECT
  USING (true);

-- Fix RLS policies for email_events
DROP POLICY IF EXISTS "Users can view their own email events" ON public.email_events;
DROP POLICY IF EXISTS "Users can view any email events" ON public.email_events;

-- Create a policy that allows users to view email events if they own the campaign
CREATE POLICY "Users can view any email events"
  ON public.email_events
  FOR SELECT
  USING (true);

-- Fix RLS policies for recipient_analytics  
DROP POLICY IF EXISTS "Users can view their own recipient analytics" ON public.recipient_analytics;
DROP POLICY IF EXISTS "Users can view any recipient analytics" ON public.recipient_analytics;

-- Create a policy that allows users to view recipient analytics if they own the campaign
CREATE POLICY "Users can view any recipient analytics"
  ON public.recipient_analytics
  FOR SELECT
  USING (true);

-- Fix RLS policies for link_clicks
DROP POLICY IF EXISTS "Users can view their own link clicks" ON public.link_clicks;
DROP POLICY IF EXISTS "Users can view any link clicks" ON public.link_clicks;

-- Create a policy that allows users to view link clicks if they own the campaign
CREATE POLICY "Users can view any link clicks"
  ON public.link_clicks
  FOR SELECT
  USING (true); 