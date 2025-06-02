-- Enhanced email tracking function that supports multiple event types
DROP FUNCTION IF EXISTS track_email_event(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION track_email_event(
    p_tracking_id TEXT,
    p_event_type TEXT DEFAULT 'opened',
    p_event_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_campaign_id UUID;
    v_contact_id UUID;
    v_recipient_email TEXT;
    v_existing_opens INTEGER;
    v_result JSONB;
BEGIN
    -- Find the original sent event
    SELECT campaign_id, contact_id, recipient_email 
    INTO v_campaign_id, v_contact_id, v_recipient_email
    FROM email_events
    WHERE tracking_id = p_tracking_id
    AND event_type = 'sent'
    LIMIT 1;
    
    IF v_campaign_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No sent event found for tracking_id'
        );
    END IF;
    
    -- Check for existing opens (for reopen detection)
    SELECT COUNT(*) INTO v_existing_opens
    FROM email_events
    WHERE tracking_id = p_tracking_id
    AND event_type = 'opened';
    
    -- Insert the event
    INSERT INTO email_events (
        campaign_id,
        contact_id,
        recipient_email,
        event_type,
        tracking_id,
        event_data,
        created_at
    ) VALUES (
        v_campaign_id,
        v_contact_id,
        v_recipient_email,
        CASE 
            WHEN p_event_type = 'open' THEN 'opened'
            WHEN p_event_type = 'reopen' AND v_existing_opens > 0 THEN 'opened'
            ELSE p_event_type
        END,
        p_tracking_id,
        p_event_metadata || jsonb_build_object(
            'is_reopen', v_existing_opens > 0,
            'open_count', v_existing_opens + 1
        ),
        NOW()
    );
    
    -- Update campaign analytics based on event type
    IF p_event_type IN ('open', 'opened', 'reopen') THEN
        UPDATE campaign_analytics
        SET 
            opened_count = opened_count + 1,
            unique_opened_count = (
                SELECT COUNT(DISTINCT COALESCE(contact_id::text, recipient_email)) 
                FROM email_events 
                WHERE campaign_id = v_campaign_id 
                AND event_type = 'opened'
            ),
            last_event_at = NOW(),
            updated_at = NOW()
        WHERE campaign_id = v_campaign_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'event_type', p_event_type,
        'is_reopen', v_existing_opens > 0,
        'total_opens', v_existing_opens + 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION track_email_event TO anon, authenticated, service_role;

-- Backward compatibility wrapper
CREATE OR REPLACE FUNCTION track_email_open(p_tracking_id TEXT)
RETURNS void AS $$
BEGIN
    PERFORM track_email_event(p_tracking_id, 'open', '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage for different tracking scenarios:
COMMENT ON FUNCTION track_email_event IS '
Enhanced email tracking function that supports multiple event types:

Basic open tracking:
SELECT track_email_event(''tracking-id-123'', ''open'');

Re-open tracking:
SELECT track_email_event(''tracking-id-123'', ''reopen'');

Section view tracking:
SELECT track_email_event(''tracking-id-123'', ''section_viewed'', 
    ''{"section": "header", "timestamp": "2025-06-02T10:30:00Z"}''::jsonb);

Forward detection (when new IP/location detected):
SELECT track_email_event(''tracking-id-123'', ''forwarded'', 
    ''{"ip_hash": "abc123", "location": "New York"}''::jsonb);
';

-- Create a view for email engagement analytics
CREATE OR REPLACE VIEW email_engagement_analytics AS
SELECT 
    ee.campaign_id,
    ee.tracking_id,
    ee.recipient_email,
    COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as open_count,
    COUNT(CASE WHEN ee.event_type = 'opened' AND (ee.event_data->>'is_reopen')::boolean THEN 1 END) as reopen_count,
    MIN(CASE WHEN ee.event_type = 'opened' THEN ee.created_at END) as first_opened_at,
    MAX(CASE WHEN ee.event_type = 'opened' THEN ee.created_at END) as last_opened_at,
    COUNT(DISTINCT ee.event_data->>'section') FILTER (WHERE ee.event_data->>'section' IS NOT NULL) as sections_viewed,
    ARRAY_AGG(DISTINCT ee.event_data->>'section') FILTER (WHERE ee.event_data->>'section' IS NOT NULL) as sections_list
FROM email_events ee
WHERE ee.tracking_id IS NOT NULL
GROUP BY ee.campaign_id, ee.tracking_id, ee.recipient_email;