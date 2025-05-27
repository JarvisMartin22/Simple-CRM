-- Add scheduling fields to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN schedule_config jsonb,
ADD COLUMN scheduled_at timestamptz,
ADD COLUMN started_at timestamptz,
ADD COLUMN completed_at timestamptz,
ADD COLUMN paused_at timestamptz;

-- Add status enum type if it doesn't exist
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

-- Add status column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.campaigns
    ADD COLUMN status public.campaign_status DEFAULT 'draft';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_campaign_id ON public.campaign_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_status ON public.campaign_sequences(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- Add RLS policies
ALTER TABLE public.campaign_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaign sequences"
    ON public.campaign_sequences
    FOR SELECT
    USING (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own campaign sequences"
    ON public.campaign_sequences
    FOR INSERT
    WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own campaign sequences"
    ON public.campaign_sequences
    FOR UPDATE
    USING (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own campaign sequences"
    ON public.campaign_sequences
    FOR DELETE
    USING (
        campaign_id IN (
            SELECT id FROM public.campaigns
            WHERE user_id = auth.uid()
        )
    ); 