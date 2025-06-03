-- Add 'forwarded' to the allowed event types
ALTER TABLE email_events 
DROP CONSTRAINT IF EXISTS email_events_event_type_check;

ALTER TABLE email_events 
ADD CONSTRAINT email_events_event_type_check 
CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'forwarded'));

-- Update the refresh_campaign_analytics_simple function to handle forwarded events
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
    v_forwarded_count INTEGER := 0;
    v_last_event_at TIMESTAMPTZ;
BEGIN
    -- Get total recipients from campaign_recipients table
    SELECT COUNT(*) INTO v_total_recipients
    FROM campaign_recipients
    WHERE campaign_id = p_campaign_id;
    
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
        COUNT(CASE WHEN event_type = 'forwarded' THEN 1 END),
        MAX(created_at)
    INTO 
        v_sent_count, v_delivered_count, v_opened_count, v_clicked_count,
        v_bounced_count, v_complained_count, v_unsubscribed_count,
        v_unique_opened_count, v_unique_clicked_count, v_forwarded_count, v_last_event_at
    FROM email_events
    WHERE campaign_id = p_campaign_id;

    -- Update or insert analytics
    INSERT INTO campaign_analytics (
        campaign_id, total_recipients, sent_count, delivered_count, opened_count, clicked_count,
        bounced_count, complained_count, unsubscribed_count, 
        unique_opened_count, unique_clicked_count, last_event_at, updated_at
    ) VALUES (
        p_campaign_id, v_total_recipients, v_sent_count, v_delivered_count, v_opened_count, v_clicked_count,
        v_bounced_count, v_complained_count, v_unsubscribed_count,
        v_unique_opened_count, v_unique_clicked_count, v_last_event_at, NOW()
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
        'unique_clicked_count', v_unique_clicked_count,
        'forwarded_count', v_forwarded_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add forwarded_count column to campaign_analytics if it doesn't exist
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS forwarded_count INTEGER DEFAULT 0;

-- Create a view to show forwarded emails
CREATE OR REPLACE VIEW campaign_forwarded_emails AS
SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    ee.tracking_id,
    ee.recipient_email as original_recipient,
    ee.event_data->>'forward_detection' as forward_detection,
    ee.user_agent,
    ee.ip_address,
    ee.created_at as forwarded_at
FROM campaigns c
JOIN email_events ee ON c.id = ee.campaign_id
WHERE ee.event_type = 'forwarded'
ORDER BY ee.created_at DESC;

-- Grant permissions
GRANT SELECT ON campaign_forwarded_emails TO authenticated;