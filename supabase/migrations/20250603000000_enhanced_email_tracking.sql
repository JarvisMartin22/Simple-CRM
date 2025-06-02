-- Enhanced email tracking schema updates

-- 1. Add template structure field to campaign_templates
ALTER TABLE campaign_templates
ADD COLUMN IF NOT EXISTS template_structure JSONB DEFAULT '{"sections": []}';

-- 2. Update email_events to support enhanced tracking
ALTER TABLE email_events
ADD COLUMN IF NOT EXISTS tracking_type TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS section_id TEXT,
ADD COLUMN IF NOT EXISTS interaction_sequence INTEGER DEFAULT 1;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_email_events_tracking_type ON email_events(tracking_type);
CREATE INDEX IF NOT EXISTS idx_email_events_section_id ON email_events(section_id);

-- 3. Create enhanced tracking function that supports multiple event types
DROP FUNCTION IF EXISTS track_email_event(TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION track_email_event(
    p_tracking_id TEXT,
    p_event_type TEXT DEFAULT 'open',
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
    
    -- Count existing opens for this tracking_id
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
        tracking_type,
        section_id,
        event_data,
        interaction_sequence,
        created_at
    ) VALUES (
        v_campaign_id,
        v_contact_id,
        v_recipient_email,
        CASE 
            WHEN p_event_type IN ('open', 'reopen') THEN 'opened'
            WHEN p_event_type = 'section' THEN 'section_viewed'
            ELSE p_event_type
        END,
        p_tracking_id,
        p_event_type,
        p_event_metadata->>'section',
        p_event_metadata || jsonb_build_object(
            'is_reopen', v_existing_opens > 0,
            'open_count', v_existing_opens + 1,
            'timestamp', NOW()
        ),
        v_existing_opens + 1,
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

-- 4. Create view for enhanced analytics
CREATE OR REPLACE VIEW campaign_engagement_details AS
SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    ee.tracking_id,
    ee.recipient_email,
    COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as total_opens,
    COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN ee.created_at::date END) as days_opened,
    COUNT(CASE WHEN ee.tracking_type = 'reopen' THEN 1 END) as reopens,
    COUNT(DISTINCT ee.section_id) FILTER (WHERE ee.section_id IS NOT NULL) as sections_viewed,
    ARRAY_AGG(DISTINCT ee.section_id ORDER BY ee.section_id) FILTER (WHERE ee.section_id IS NOT NULL) as sections_list,
    MIN(ee.created_at) FILTER (WHERE ee.event_type = 'sent') as sent_at,
    MIN(ee.created_at) FILTER (WHERE ee.event_type = 'opened') as first_opened_at,
    MAX(ee.created_at) FILTER (WHERE ee.event_type = 'opened') as last_opened_at,
    EXTRACT(EPOCH FROM (
        MIN(ee.created_at) FILTER (WHERE ee.event_type = 'opened') - 
        MIN(ee.created_at) FILTER (WHERE ee.event_type = 'sent')
    ))/60 as minutes_to_first_open
FROM campaigns c
JOIN email_events ee ON c.id = ee.campaign_id
WHERE ee.tracking_id IS NOT NULL
GROUP BY c.id, c.name, ee.tracking_id, ee.recipient_email;

-- 5. Add delivered tracking function (for webhook use)
CREATE OR REPLACE FUNCTION track_email_delivered(
    p_campaign_id UUID,
    p_recipient_email TEXT,
    p_message_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_contact_id UUID;
BEGIN
    -- Find contact
    SELECT id INTO v_contact_id
    FROM contacts
    WHERE email = p_recipient_email
    LIMIT 1;
    
    -- Insert delivered event
    INSERT INTO email_events (
        campaign_id,
        contact_id,
        recipient_email,
        event_type,
        event_data,
        created_at
    ) VALUES (
        p_campaign_id,
        v_contact_id,
        p_recipient_email,
        'delivered',
        jsonb_build_object('message_id', p_message_id),
        NOW()
    );
    
    -- Update analytics
    UPDATE campaign_analytics
    SET 
        delivered_count = delivered_count + 1,
        updated_at = NOW()
    WHERE campaign_id = p_campaign_id;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_email_delivered TO authenticated, service_role;