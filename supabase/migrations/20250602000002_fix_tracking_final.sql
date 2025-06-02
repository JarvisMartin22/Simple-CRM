-- Final fix for email tracking issues
-- This migration consolidates all fixes and cleans up conflicts

-- 1. Clean up conflicting functions first
DROP FUNCTION IF EXISTS initialize_campaign_analytics(UUID);
DROP FUNCTION IF EXISTS initialize_campaign_analytics(UUID, INTEGER);
DROP FUNCTION IF EXISTS track_email_event(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS refresh_campaign_analytics(UUID);

-- 2. Remove problematic tables and views
DROP VIEW IF EXISTS campaign_engagement_details CASCADE;
DROP TABLE IF EXISTS recipient_analytics CASCADE;
DROP TABLE IF EXISTS link_clicks CASCADE;
DROP TABLE IF EXISTS tracked_links CASCADE;

-- 3. Ensure email_events table has correct structure
ALTER TABLE email_events 
DROP COLUMN IF EXISTS email_tracking_id,
DROP COLUMN IF EXISTS user_id,
DROP COLUMN IF EXISTS email_id,
DROP COLUMN IF EXISTS recipient,
DROP COLUMN IF EXISTS subject,
DROP COLUMN IF EXISTS url,
DROP COLUMN IF EXISTS tracking_type,
DROP COLUMN IF EXISTS section_id,
DROP COLUMN IF EXISTS interaction_sequence;

-- Add the correct columns
ALTER TABLE email_events
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS tracking_id TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS event_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS link_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Ensure campaign_analytics table has correct structure
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_clicked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounced_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS complained_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unsubscribed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_tracking_id ON email_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);

-- 6. Create a unique constraint on campaign_analytics to prevent duplicates
ALTER TABLE campaign_analytics DROP CONSTRAINT IF EXISTS campaign_analytics_campaign_id_key;
ALTER TABLE campaign_analytics ADD CONSTRAINT campaign_analytics_campaign_id_key UNIQUE (campaign_id);

-- 7. Create simple analytics refresh function
CREATE OR REPLACE FUNCTION refresh_campaign_analytics_simple(p_campaign_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_sent_count INTEGER := 0;
    v_delivered_count INTEGER := 0;
    v_opened_count INTEGER := 0;
    v_clicked_count INTEGER := 0;
    v_bounced_count INTEGER := 0;
    v_complained_count INTEGER := 0;
    v_unsubscribed_count INTEGER := 0;
    v_unique_opened_count INTEGER := 0;
    v_unique_clicked_count INTEGER := 0;
    v_last_event_at TIMESTAMPTZ;
BEGIN
    -- Count events by type from email_events
    SELECT 
        COUNT(CASE WHEN event_type = 'sent' THEN 1 END),
        COUNT(CASE WHEN event_type = 'delivered' THEN 1 END),
        COUNT(CASE WHEN event_type = 'opened' THEN 1 END),
        COUNT(CASE WHEN event_type = 'clicked' THEN 1 END),
        COUNT(CASE WHEN event_type = 'bounced' THEN 1 END),
        COUNT(CASE WHEN event_type = 'complained' THEN 1 END),
        COUNT(CASE WHEN event_type = 'unsubscribed' THEN 1 END),
        COUNT(DISTINCT CASE WHEN event_type = 'opened' THEN COALESCE(contact_id::text, recipient_email) END),
        COUNT(DISTINCT CASE WHEN event_type = 'clicked' THEN COALESCE(contact_id::text, recipient_email) END),
        MAX(created_at)
    INTO 
        v_sent_count, v_delivered_count, v_opened_count, v_clicked_count,
        v_bounced_count, v_complained_count, v_unsubscribed_count,
        v_unique_opened_count, v_unique_clicked_count, v_last_event_at
    FROM email_events
    WHERE campaign_id = p_campaign_id;

    -- Update or insert analytics
    INSERT INTO campaign_analytics (
        campaign_id, sent_count, delivered_count, opened_count, clicked_count,
        bounced_count, complained_count, unsubscribed_count, 
        unique_opened_count, unique_clicked_count, last_event_at, updated_at
    ) VALUES (
        p_campaign_id, v_sent_count, v_delivered_count, v_opened_count, v_clicked_count,
        v_bounced_count, v_complained_count, v_unsubscribed_count,
        v_unique_opened_count, v_unique_clicked_count, v_last_event_at, NOW()
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
        sent_count = EXCLUDED.sent_count,
        delivered_count = EXCLUDED.delivered_count,
        opened_count = EXCLUDED.opened_count,
        clicked_count = EXCLUDED.clicked_count,
        bounced_count = EXCLUDED.bounced_count,
        complained_count = EXCLUDED.complained_count,
        unsubscribed_count = EXCLUDED.unsubscribed_count,
        unique_opened_count = EXCLUDED.unique_opened_count,
        unique_clicked_count = EXCLUDED.unique_clicked_count,
        last_event_at = EXCLUDED.last_event_at,
        updated_at = NOW();

    -- Return the updated analytics
    RETURN jsonb_build_object(
        'success', true,
        'campaign_id', p_campaign_id,
        'sent_count', v_sent_count,
        'opened_count', v_opened_count,
        'clicked_count', v_clicked_count,
        'unique_opened_count', v_unique_opened_count,
        'unique_clicked_count', v_unique_clicked_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION refresh_campaign_analytics_simple TO authenticated, service_role;

-- 9. Clean up duplicate analytics records
DELETE FROM campaign_analytics ca1
USING campaign_analytics ca2
WHERE ca1.id > ca2.id
AND ca1.campaign_id = ca2.campaign_id;

-- 10. Update RLS policies to be permissive for debugging
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can insert email events" ON email_events;
DROP POLICY IF EXISTS "Users can view their email events" ON email_events;
DROP POLICY IF EXISTS "Service role can manage events" ON email_events;

CREATE POLICY "Allow email event inserts" ON email_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow email event reads" ON email_events
    FOR SELECT USING (true);

-- Analytics policies
DROP POLICY IF EXISTS "Users can view their campaign analytics" ON campaign_analytics;
DROP POLICY IF EXISTS "Service role can manage analytics" ON campaign_analytics;

CREATE POLICY "Allow analytics reads" ON campaign_analytics
    FOR SELECT USING (true);

CREATE POLICY "Allow analytics writes" ON campaign_analytics
    FOR ALL USING (true);

-- 11. Add helpful comments
COMMENT ON FUNCTION refresh_campaign_analytics_simple IS 'Simple function to refresh campaign analytics from email_events';
COMMENT ON TABLE email_events IS 'All email events: sent, opened, clicked, etc.';
COMMENT ON TABLE campaign_analytics IS 'Aggregated analytics per campaign';