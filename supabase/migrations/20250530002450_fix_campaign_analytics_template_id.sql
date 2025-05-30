-- Check if the campaign_analytics table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'campaign_analytics'
  ) THEN
    -- Add template_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'campaign_analytics' 
      AND column_name = 'template_id'
    ) THEN
      ALTER TABLE public.campaign_analytics 
      ADD COLUMN template_id uuid REFERENCES public.campaign_templates(id) ON DELETE SET NULL;
    END IF;
  ELSE
    -- Create the campaign_analytics table if it doesn't exist
    CREATE TABLE public.campaign_analytics (
      id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
      campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE,
      template_id uuid REFERENCES public.campaign_templates(id) ON DELETE SET NULL,
      total_recipients integer DEFAULT 0,
      sent_count integer DEFAULT 0,
      delivered_count integer DEFAULT 0,
      opened_count integer DEFAULT 0,
      unique_opened_count integer DEFAULT 0,
      clicked_count integer DEFAULT 0,
      unique_clicked_count integer DEFAULT 0,
      bounced_count integer DEFAULT 0,
      complained_count integer DEFAULT 0,
      unsubscribed_count integer DEFAULT 0,
      last_event_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS on campaign_analytics
    ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policy for campaign_analytics
    CREATE POLICY "Users can view their own campaign analytics"
      ON public.campaign_analytics
      FOR SELECT
      USING (
        campaign_id IN (
          SELECT id FROM public.campaigns
          WHERE user_id = auth.uid()
        )
      );
      
    -- Create RLS policy for updating
    CREATE POLICY "Users can update their own campaign analytics"
      ON public.campaign_analytics
      FOR UPDATE
      USING (
        campaign_id IN (
          SELECT id FROM public.campaigns
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create or replace the trigger function
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
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'initialize_analytics_on_campaign_create'
  ) THEN
    CREATE TRIGGER initialize_analytics_on_campaign_create
      AFTER INSERT ON public.campaigns
      FOR EACH ROW
      EXECUTE FUNCTION initialize_campaign_analytics();
  END IF;
END $$;
