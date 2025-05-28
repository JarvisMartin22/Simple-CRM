-- Drop existing tables and policies
DROP TABLE IF EXISTS public.email_events CASCADE;

-- Create email_events table
CREATE TABLE public.email_events (
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
    event_data jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    link_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_email_events_campaign_id ON public.email_events(campaign_id);
CREATE INDEX idx_email_events_sequence_id ON public.email_events(sequence_id);
CREATE INDEX idx_email_events_recipient_id ON public.email_events(recipient_id);
CREATE INDEX idx_email_events_template_id ON public.email_events(template_id);
CREATE INDEX idx_email_events_event_type ON public.email_events(event_type);
CREATE INDEX idx_email_events_created_at ON public.email_events(created_at);

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own email events"
ON public.email_events
FOR SELECT
USING (
    campaign_id IN (
        SELECT id FROM public.campaigns
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage email events"
ON public.email_events
FOR ALL
USING (true)
WITH CHECK (true); 