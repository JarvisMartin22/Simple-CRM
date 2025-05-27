-- Add campaign status enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.campaign_status AS ENUM (
        'draft',
        'scheduled',
        'running',
        'paused',
        'completed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add analytics fields to campaigns table if they don't exist
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS schedule_config jsonb,
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS started_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS paused_at timestamptz;

-- Create campaign_sequences table for recurring campaigns
CREATE TABLE IF NOT EXISTS public.campaign_sequences (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sequence_number integer NOT NULL,
    scheduled_at timestamptz NOT NULL,
    started_at timestamptz,
    completed_at timestamptz,
    status public.campaign_status DEFAULT 'scheduled',
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create email_events table to track all email-related events
CREATE TABLE IF NOT EXISTS public.email_events (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sequence_id uuid REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
    recipient_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
    template_id uuid REFERENCES public.campaign_templates(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (
        event_type IN (
            'sent',
            'delivered',
            'opened',
            'clicked',
            'bounced',
            'complained',
            'unsubscribed'
        )
    ),
    event_data jsonb,
    ip_address text,
    user_agent text,
    link_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create campaign_analytics table for aggregated metrics
CREATE TABLE IF NOT EXISTS public.campaign_analytics (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE,
    sequence_id uuid REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
    template_id uuid REFERENCES public.campaign_templates(id) ON DELETE CASCADE,
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

-- Create recipient_analytics table for individual recipient tracking
CREATE TABLE IF NOT EXISTS public.recipient_analytics (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sequence_id uuid REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
    recipient_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
    template_id uuid REFERENCES public.campaign_templates(id) ON DELETE CASCADE,
    sent_at timestamptz,
    delivered_at timestamptz,
    first_opened_at timestamptz,
    last_opened_at timestamptz,
    open_count integer DEFAULT 0,
    first_clicked_at timestamptz,
    last_clicked_at timestamptz,
    click_count integer DEFAULT 0,
    bounced_at timestamptz,
    bounce_reason text,
    unsubscribed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (campaign_id, recipient_id)
);

-- Create link_clicks table for tracking individual link performance
CREATE TABLE IF NOT EXISTS public.link_clicks (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sequence_id uuid REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
    recipient_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
    template_id uuid REFERENCES public.campaign_templates(id) ON DELETE CASCADE,
    link_url text NOT NULL,
    click_count integer DEFAULT 0,
    first_clicked_at timestamptz,
    last_clicked_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (campaign_id, recipient_id, link_url)
);

-- Add indexes for performance optimization
DO $$ 
BEGIN
    -- Email events indexes
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON public.email_events(campaign_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_email_events_campaign_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_email_events_sequence_id ON public.email_events(sequence_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_email_events_sequence_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_email_events_template_id ON public.email_events(template_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_email_events_template_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_email_events_recipient_id ON public.email_events(recipient_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_email_events_recipient_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON public.email_events(event_type);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_email_events_event_type: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_email_events_created_at: column does not exist';
    END;

    -- Campaign analytics indexes
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON public.campaign_analytics(campaign_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_campaign_analytics_campaign_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_campaign_analytics_sequence_id ON public.campaign_analytics(sequence_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_campaign_analytics_sequence_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_campaign_analytics_template_id ON public.campaign_analytics(template_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_campaign_analytics_template_id: column does not exist';
    END;

    -- Recipient analytics indexes
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_recipient_analytics_campaign_id ON public.recipient_analytics(campaign_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_recipient_analytics_campaign_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_recipient_analytics_sequence_id ON public.recipient_analytics(sequence_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_recipient_analytics_sequence_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_recipient_analytics_template_id ON public.recipient_analytics(template_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_recipient_analytics_template_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_recipient_analytics_recipient_id ON public.recipient_analytics(recipient_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_recipient_analytics_recipient_id: column does not exist';
    END;

    -- Link clicks indexes
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_link_clicks_campaign_id ON public.link_clicks(campaign_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_link_clicks_campaign_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_link_clicks_sequence_id ON public.link_clicks(sequence_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_link_clicks_sequence_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_link_clicks_template_id ON public.link_clicks(template_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_link_clicks_template_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_link_clicks_recipient_id ON public.link_clicks(recipient_id);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_link_clicks_recipient_id: column does not exist';
    END;

    BEGIN
        CREATE INDEX IF NOT EXISTS idx_link_clicks_link_url ON public.link_clicks(link_url);
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'Skipping idx_link_clicks_link_url: column does not exist';
    END;
END $$;

-- Enable RLS on analytics tables
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_events
CREATE POLICY "Users can view their own email events"
    ON public.email_events
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert email events"
    ON public.email_events
    FOR INSERT
    WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.campaigns
        )
    );

-- RLS Policies for campaign_analytics
CREATE POLICY "Users can view their own campaign analytics"
    ON public.campaign_analytics
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage campaign analytics"
    ON public.campaign_analytics
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- RLS Policies for recipient_analytics
CREATE POLICY "Users can view their own recipient analytics"
    ON public.recipient_analytics
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage recipient analytics"
    ON public.recipient_analytics
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- RLS Policies for link_clicks
CREATE POLICY "Users can view their own link clicks"
    ON public.link_clicks
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage link clicks"
    ON public.link_clicks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Helper function to get campaign analytics summary
CREATE OR REPLACE FUNCTION get_campaign_analytics_summary(campaign_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'campaign_id', ca.campaign_id,
            'total_recipients', ca.total_recipients,
            'sent_count', ca.sent_count,
            'delivered_rate', CASE WHEN ca.sent_count > 0 
                THEN ROUND((ca.delivered_count::numeric / ca.sent_count::numeric) * 100, 2)
                ELSE 0 END,
            'open_rate', CASE WHEN ca.delivered_count > 0 
                THEN ROUND((ca.opened_count::numeric / ca.delivered_count::numeric) * 100, 2)
                ELSE 0 END,
            'click_rate', CASE WHEN ca.opened_count > 0 
                THEN ROUND((ca.clicked_count::numeric / ca.opened_count::numeric) * 100, 2)
                ELSE 0 END,
            'bounce_rate', CASE WHEN ca.sent_count > 0 
                THEN ROUND((ca.bounced_count::numeric / ca.sent_count::numeric) * 100, 2)
                ELSE 0 END,
            'unsubscribe_rate', CASE WHEN ca.delivered_count > 0 
                THEN ROUND((ca.unsubscribed_count::numeric / ca.delivered_count::numeric) * 100, 2)
                ELSE 0 END,
            'complaint_rate', CASE WHEN ca.delivered_count > 0 
                THEN ROUND((ca.complained_count::numeric / ca.delivered_count::numeric) * 100, 2)
                ELSE 0 END
        )
        FROM public.campaign_analytics ca
        WHERE ca.campaign_id = campaign_id_param
    );
END;
$$;

-- Helper function to get recipient engagement summary
CREATE OR REPLACE FUNCTION get_recipient_engagement_summary(campaign_id_param uuid, recipient_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'recipient_id', ra.recipient_id,
            'campaign_id', ra.campaign_id,
            'sent_at', ra.sent_at,
            'delivered_at', ra.delivered_at,
            'first_opened_at', ra.first_opened_at,
            'last_opened_at', ra.last_opened_at,
            'open_count', ra.open_count,
            'first_clicked_at', ra.first_clicked_at,
            'last_clicked_at', ra.last_clicked_at,
            'click_count', ra.click_count,
            'links_clicked', (
                SELECT jsonb_agg(jsonb_build_object(
                    'url', lc.link_url,
                    'clicks', lc.click_count,
                    'first_clicked', lc.first_clicked_at,
                    'last_clicked', lc.last_clicked_at
                ))
                FROM public.link_clicks lc
                WHERE lc.campaign_id = ra.campaign_id
                AND lc.recipient_id = ra.recipient_id
            )
        )
        FROM public.recipient_analytics ra
        WHERE ra.campaign_id = campaign_id_param
        AND ra.recipient_id = recipient_id_param
    );
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_analytics_on_event ON public.email_events;

-- Create trigger for email events
CREATE TRIGGER update_analytics_on_event
    AFTER INSERT ON public.email_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_campaign_analytics(); 