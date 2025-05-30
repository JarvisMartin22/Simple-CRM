-- Fix RLS policies for campaign_analytics
DO $$ 
BEGIN
  -- Drop policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own campaign analytics" ON public.campaign_analytics;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy Users can view their own campaign analytics: %', SQLERRM;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can view any campaign analytics" ON public.campaign_analytics;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy Users can view any campaign analytics: %', SQLERRM;
  END;
  
  -- Create new policy
  BEGIN
    CREATE POLICY "Users can view any campaign analytics"
      ON public.campaign_analytics
      FOR SELECT
      USING (true);
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating policy Users can view any campaign analytics: %', SQLERRM;
  END;
  
  -- Email events policies
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own email events" ON public.email_events;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy Users can view their own email events: %', SQLERRM;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can view any email events" ON public.email_events;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy Users can view any email events: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Users can view any email events"
      ON public.email_events
      FOR SELECT
      USING (true);
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating policy Users can view any email events: %', SQLERRM;
  END;
  
  -- Recipient analytics policies
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own recipient analytics" ON public.recipient_analytics;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy Users can view their own recipient analytics: %', SQLERRM;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can view any recipient analytics" ON public.recipient_analytics;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy Users can view any recipient analytics: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Users can view any recipient analytics"
      ON public.recipient_analytics
      FOR SELECT
      USING (true);
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating policy Users can view any recipient analytics: %', SQLERRM;
  END;
  
  -- Link clicks policies
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own link clicks" ON public.link_clicks;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy Users can view their own link clicks: %', SQLERRM;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can view any link clicks" ON public.link_clicks;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error dropping policy Users can view any link clicks: %', SQLERRM;
  END;
  
  BEGIN
    CREATE POLICY "Users can view any link clicks"
      ON public.link_clicks
      FOR SELECT
      USING (true);
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating policy Users can view any link clicks: %', SQLERRM;
  END;
END $$; 