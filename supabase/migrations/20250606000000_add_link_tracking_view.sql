-- Add link tracking functionality using event_data JSONB
-- This migration creates views and functions to track link clicks without additional tables

-- 1. Create a view to aggregate link clicks by URL
CREATE OR REPLACE VIEW campaign_link_clicks AS
SELECT 
    campaign_id,
    link_url,
    COUNT(*) as total_clicks,
    COUNT(DISTINCT COALESCE(contact_id::text, recipient_email)) as unique_clicks,
    MIN(created_at) as first_clicked_at,
    MAX(created_at) as last_clicked_at,
    ARRAY_AGG(DISTINCT recipient_email ORDER BY recipient_email) as recipients_clicked
FROM email_events
WHERE event_type = 'clicked' 
    AND link_url IS NOT NULL
GROUP BY campaign_id, link_url;

-- 2. Create a view for recipient engagement including link clicks
CREATE OR REPLACE VIEW campaign_recipient_engagement AS
SELECT 
    campaign_id,
    COALESCE(contact_id::text, recipient_email) as recipient_identifier,
    contact_id,
    recipient_email,
    -- Sent info
    MIN(CASE WHEN event_type = 'sent' THEN created_at END) as sent_at,
    -- Delivered info
    MIN(CASE WHEN event_type = 'delivered' THEN created_at END) as delivered_at,
    -- Open info
    MIN(CASE WHEN event_type = 'opened' THEN created_at END) as first_opened_at,
    MAX(CASE WHEN event_type = 'opened' THEN created_at END) as last_opened_at,
    COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as open_count,
    -- Click info
    MIN(CASE WHEN event_type = 'clicked' THEN created_at END) as first_clicked_at,
    MAX(CASE WHEN event_type = 'clicked' THEN created_at END) as last_clicked_at,
    COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as click_count,
    -- Links clicked
    ARRAY_AGG(DISTINCT link_url ORDER BY link_url) FILTER (WHERE event_type = 'clicked' AND link_url IS NOT NULL) as links_clicked,
    -- Other events
    MAX(CASE WHEN event_type = 'bounced' THEN created_at END) as bounced_at,
    MAX(CASE WHEN event_type = 'complained' THEN created_at END) as complained_at,
    MAX(CASE WHEN event_type = 'unsubscribed' THEN created_at END) as unsubscribed_at
FROM email_events
GROUP BY campaign_id, COALESCE(contact_id::text, recipient_email), contact_id, recipient_email;

-- 3. Create a function to get detailed link analytics for a campaign
CREATE OR REPLACE FUNCTION get_campaign_link_analytics(p_campaign_id UUID)
RETURNS TABLE (
    link_url TEXT,
    total_clicks BIGINT,
    unique_clicks BIGINT,
    click_rate NUMERIC,
    first_clicked_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    top_clickers JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH campaign_stats AS (
        SELECT 
            COUNT(DISTINCT COALESCE(contact_id::text, recipient_email)) as total_recipients
        FROM email_events
        WHERE campaign_id = p_campaign_id
        AND event_type = 'sent'
    ),
    link_stats AS (
        SELECT 
            ee.link_url,
            COUNT(*) as total_clicks,
            COUNT(DISTINCT COALESCE(ee.contact_id::text, ee.recipient_email)) as unique_clicks,
            MIN(ee.created_at) as first_clicked_at,
            MAX(ee.created_at) as last_clicked_at,
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'email', ee.recipient_email,
                    'clicks', sub.click_count,
                    'last_clicked', sub.last_clicked
                ) ORDER BY sub.click_count DESC
            ) FILTER (WHERE sub.row_num <= 5) as top_clickers
        FROM email_events ee
        INNER JOIN (
            SELECT 
                link_url,
                recipient_email,
                COUNT(*) as click_count,
                MAX(created_at) as last_clicked,
                ROW_NUMBER() OVER (PARTITION BY link_url ORDER BY COUNT(*) DESC) as row_num
            FROM email_events
            WHERE campaign_id = p_campaign_id
            AND event_type = 'clicked'
            AND link_url IS NOT NULL
            GROUP BY link_url, recipient_email
        ) sub ON ee.link_url = sub.link_url AND ee.recipient_email = sub.recipient_email
        WHERE ee.campaign_id = p_campaign_id
        AND ee.event_type = 'clicked'
        AND ee.link_url IS NOT NULL
        GROUP BY ee.link_url
    )
    SELECT 
        ls.link_url,
        ls.total_clicks,
        ls.unique_clicks,
        ROUND((ls.unique_clicks::numeric / NULLIF(cs.total_recipients, 0)) * 100, 2) as click_rate,
        ls.first_clicked_at,
        ls.last_clicked_at,
        ls.top_clickers
    FROM link_stats ls
    CROSS JOIN campaign_stats cs
    ORDER BY ls.total_clicks DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to track link clicks with deduplication
CREATE OR REPLACE FUNCTION track_link_click(
    p_tracking_id TEXT,
    p_link_url TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_campaign_id UUID;
    v_contact_id UUID;
    v_recipient_email TEXT;
    v_existing_clicks INTEGER;
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
    
    -- Count existing clicks for this link from this recipient
    SELECT COUNT(*) INTO v_existing_clicks
    FROM email_events
    WHERE tracking_id = p_tracking_id
    AND event_type = 'clicked'
    AND link_url = p_link_url;
    
    -- Insert the click event
    INSERT INTO email_events (
        campaign_id,
        contact_id,
        recipient_email,
        event_type,
        tracking_id,
        link_url,
        event_data,
        user_agent,
        ip_address,
        created_at
    ) VALUES (
        v_campaign_id,
        v_contact_id,
        v_recipient_email,
        'clicked',
        p_tracking_id,
        p_link_url,
        jsonb_build_object(
            'click_number', v_existing_clicks + 1,
            'timestamp', NOW(),
            'user_agent', p_user_agent,
            'ip_address', p_ip_address
        ),
        p_user_agent,
        p_ip_address,
        NOW()
    );
    
    -- Refresh campaign analytics
    PERFORM refresh_campaign_analytics_simple(v_campaign_id);
    
    RETURN jsonb_build_object(
        'success', true,
        'campaign_id', v_campaign_id,
        'link_url', p_link_url,
        'click_number', v_existing_clicks + 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions
GRANT SELECT ON campaign_link_clicks TO authenticated;
GRANT SELECT ON campaign_recipient_engagement TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_link_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION track_link_click TO anon, authenticated, service_role;

-- 6. Add helpful comments
COMMENT ON VIEW campaign_link_clicks IS 'Aggregated link click data per campaign';
COMMENT ON VIEW campaign_recipient_engagement IS 'Complete recipient engagement timeline';
COMMENT ON FUNCTION get_campaign_link_analytics IS 'Get detailed link performance analytics for a campaign';
COMMENT ON FUNCTION track_link_click IS 'Track a link click event with deduplication';