-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own email tracking" ON public.email_tracking;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Add template_id column to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.campaign_templates(id) ON DELETE SET NULL;

-- Drop existing index if it exists
DROP INDEX IF EXISTS campaigns_template_id_idx;

-- Create index for template_id
CREATE INDEX IF NOT EXISTS campaigns_template_id_idx ON public.campaigns(template_id);

-- Drop and recreate campaign_analytics table
DROP TABLE IF EXISTS public.campaign_analytics CASCADE;

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS initialize_analytics_on_campaign_create ON public.campaigns;
DROP FUNCTION IF EXISTS public.initialize_campaign_analytics();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.initialize_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.campaign_analytics (
        campaign_id,
        template_id,
        total_recipients,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.template_id,
        COALESCE((NEW.audience_filter->>'size')::integer, 0),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER initialize_analytics_on_campaign_create
    AFTER INSERT ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_campaign_analytics();

-- Recreate the email tracking policy
DO $$ BEGIN
    CREATE POLICY "Users can view their own email tracking"
      ON public.email_tracking FOR SELECT
      USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- Add RLS policies
DROP POLICY IF EXISTS "Users can update their own campaign analytics" ON public.campaign_analytics;
CREATE POLICY "Users can update their own campaign analytics"
    ON public.campaign_analytics
    FOR UPDATE
    USING (campaign_id IN (
        SELECT id FROM public.campaigns WHERE user_id = auth.uid()
    )); 