-- Fix unique count calculations in refresh_campaign_analytics_simple
CREATE OR REPLACE FUNCTION refresh_campaign_analytics_simple(p_campaign_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_recipients INTEGER := 0;
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
    -- Get total recipients from campaign_recipients table
    SELECT COUNT(*) INTO v_total_recipients
    FROM campaign_recipients
    WHERE campaign_id = p_campaign_id;
    
    -- Count total events
    SELECT 
        COUNT(*) FILTER (WHERE event_type = 'sent'),
        COUNT(*) FILTER (WHERE event_type = 'delivered'),
        COUNT(*) FILTER (WHERE event_type = 'opened'),
        COUNT(*) FILTER (WHERE event_type = 'clicked'),
        COUNT(*) FILTER (WHERE event_type = 'bounced'),
        COUNT(*) FILTER (WHERE event_type = 'complained'),
        COUNT(*) FILTER (WHERE event_type = 'unsubscribed'),
        MAX(created_at)
    INTO 
        v_sent_count, v_delivered_count, v_opened_count, v_clicked_count,
        v_bounced_count, v_complained_count, v_unsubscribed_count, v_last_event_at
    FROM email_events
    WHERE campaign_id = p_campaign_id;
    
    -- Count unique opens (by tracking_id - each tracking_id represents a unique recipient)
    SELECT COUNT(DISTINCT tracking_id)
    INTO v_unique_opened_count
    FROM email_events
    WHERE campaign_id = p_campaign_id
    AND event_type = 'opened'
    AND tracking_id IS NOT NULL;
    
    -- Count unique clicks (by tracking_id)
    SELECT COUNT(DISTINCT tracking_id)
    INTO v_unique_clicked_count
    FROM email_events
    WHERE campaign_id = p_campaign_id
    AND event_type = 'clicked'
    AND tracking_id IS NOT NULL;

    -- Update or insert analytics
    INSERT INTO campaign_analytics (
        campaign_id, total_recipients, sent_count, delivered_count, opened_count, clicked_count,
        bounced_count, complained_count, unsubscribed_count, 
        unique_opened_count, unique_clicked_count, last_event_at, updated_at
    ) VALUES (
        p_campaign_id, COALESCE(v_total_recipients, 0), 
        COALESCE(v_sent_count, 0), COALESCE(v_delivered_count, 0), 
        COALESCE(v_opened_count, 0), COALESCE(v_clicked_count, 0),
        COALESCE(v_bounced_count, 0), COALESCE(v_complained_count, 0), 
        COALESCE(v_unsubscribed_count, 0),
        COALESCE(v_unique_opened_count, 0), COALESCE(v_unique_clicked_count, 0), 
        v_last_event_at, NOW()
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
        total_recipients = EXCLUDED.total_recipients,
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
        'total_recipients', v_total_recipients,
        'sent_count', v_sent_count,
        'opened_count', v_opened_count,
        'clicked_count', v_clicked_count,
        'unique_opened_count', v_unique_opened_count,
        'unique_clicked_count', v_unique_clicked_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update total_recipients if it's 0 but we have sent events
UPDATE campaign_analytics ca
SET total_recipients = (
    SELECT COUNT(DISTINCT recipient_email)
    FROM email_events ee
    WHERE ee.campaign_id = ca.campaign_id
    AND ee.event_type = 'sent'
)
WHERE ca.total_recipients = 0
AND EXISTS (
    SELECT 1 FROM email_events ee
    WHERE ee.campaign_id = ca.campaign_id
    AND ee.event_type = 'sent'
);

-- Refresh all existing campaign analytics to fix counts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT DISTINCT campaign_id FROM campaign_analytics
    LOOP
        PERFORM refresh_campaign_analytics_simple(r.campaign_id);
    END LOOP;
END $$;