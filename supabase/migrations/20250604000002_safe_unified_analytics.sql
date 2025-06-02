-- Safe unified campaign analytics migration
-- Handles existing tables and views properly

-- 1. First, let's safely drop any existing conflicting objects
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop existing tables that might conflict
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('recipient_analytics', 'link_clicks')) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Drop existing views that might conflict  
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname IN ('recipient_analytics', 'link_clicks', 'campaign_engagement_details')) LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', r.viewname;
    END LOOP;
END $$;

-- 2. Ensure campaign_analytics has all required fields
ALTER TABLE campaign_analytics
ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0;

-- 3. Create campaign_engagement_details view
CREATE OR REPLACE VIEW campaign_engagement_details AS
SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    ee.tracking_id,
    ee.recipient_email,
    ee.contact_id,
    COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as total_opens,
    COUNT(DISTINCT CASE WHEN ee.event_type = 'opened' THEN ee.created_at::date END) as days_opened,
    GREATEST(COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) - 1, 0) as reopens, -- First open doesn't count as reopen
    COUNT(DISTINCT ee.contact_id) FILTER (WHERE ee.event_type = 'opened') as unique_opens,
    COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) as total_clicks,
    COUNT(DISTINCT ee.contact_id) FILTER (WHERE ee.event_type = 'clicked') as unique_clicks,
    MIN(ee.created_at) FILTER (WHERE ee.event_type = 'sent') as sent_at,
    MIN(ee.created_at) FILTER (WHERE ee.event_type = 'opened') as first_opened_at,
    MAX(ee.created_at) FILTER (WHERE ee.event_type = 'opened') as last_opened_at,
    MIN(ee.created_at) FILTER (WHERE ee.event_type = 'clicked') as first_clicked_at,
    MAX(ee.created_at) FILTER (WHERE ee.event_type = 'clicked') as last_clicked_at,
    EXTRACT(EPOCH FROM (
        MIN(ee.created_at) FILTER (WHERE ee.event_type = 'opened') - 
        MIN(ee.created_at) FILTER (WHERE ee.event_type = 'sent')
    ))/60 as minutes_to_first_open
FROM campaigns c
LEFT JOIN email_events ee ON c.id = ee.campaign_id
WHERE ee.tracking_id IS NOT NULL
GROUP BY c.id, c.name, ee.tracking_id, ee.recipient_email, ee.contact_id;

-- 4. Create recipient_analytics view
CREATE OR REPLACE VIEW recipient_analytics AS
SELECT 
    cr.id,
    cr.campaign_id,
    cr.contact_id as recipient_id, -- Map to expected field name
    cr.email as recipient_email,
    cr.status,
    cr.sent_at,
    cr.opened_at,
    cr.clicked_at,
    cr.bounced_at,
    COALESCE(opens.open_count, 0) as open_count,
    COALESCE(clicks.click_count, 0) as click_count,
    COALESCE(opens.first_opened_at, cr.opened_at) as first_opened_at,
    COALESCE(opens.last_opened_at, cr.opened_at) as last_opened_at,
    COALESCE(clicks.first_clicked_at, cr.clicked_at) as first_clicked_at,
    COALESCE(clicks.last_clicked_at, cr.clicked_at) as last_clicked_at,
    cr.created_at,
    cr.updated_at
FROM campaign_recipients cr
LEFT JOIN (
    SELECT 
        campaign_id, 
        contact_id,
        COUNT(*) as open_count,
        MIN(created_at) as first_opened_at,
        MAX(created_at) as last_opened_at
    FROM email_events 
    WHERE event_type = 'opened' 
    GROUP BY campaign_id, contact_id
) opens ON cr.campaign_id = opens.campaign_id AND cr.contact_id = opens.contact_id
LEFT JOIN (
    SELECT 
        campaign_id, 
        contact_id,
        COUNT(*) as click_count,
        MIN(created_at) as first_clicked_at,
        MAX(created_at) as last_clicked_at
    FROM email_events 
    WHERE event_type = 'clicked' 
    GROUP BY campaign_id, contact_id
) clicks ON cr.campaign_id = clicks.campaign_id AND cr.contact_id = clicks.contact_id;

-- 5. Create link_clicks view
CREATE OR REPLACE VIEW link_clicks AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY ee.campaign_id, ee.link_url) as id, -- Generate unique numeric ID
    ee.campaign_id,
    ee.contact_id as recipient_id,
    ee.link_url,
    COUNT(*) as click_count,
    MIN(ee.created_at) as first_clicked_at,
    MAX(ee.created_at) as last_clicked_at,
    MIN(ee.created_at) as created_at,
    MAX(ee.created_at) as updated_at
FROM email_events ee
WHERE ee.event_type = 'clicked' AND ee.link_url IS NOT NULL
GROUP BY ee.campaign_id, ee.contact_id, ee.link_url;

-- 6. Update the refresh analytics function to correctly calculate totals
DROP FUNCTION IF EXISTS refresh_campaign_analytics_simple(UUID);
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
        'unique_clicked_count', v_unique_clicked_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION refresh_campaign_analytics_simple TO authenticated, service_role;

-- 8. Create trigger to automatically update analytics when campaign_recipients changes
DROP TRIGGER IF EXISTS update_campaign_analytics_on_recipient_change ON campaign_recipients;
DROP FUNCTION IF EXISTS trigger_refresh_campaign_analytics();

CREATE OR REPLACE FUNCTION trigger_refresh_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh analytics when recipient status changes
    PERFORM refresh_campaign_analytics_simple(COALESCE(NEW.campaign_id, OLD.campaign_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_analytics_on_recipient_change
    AFTER INSERT OR UPDATE OR DELETE ON campaign_recipients
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_campaign_analytics();

-- 9. Grant proper RLS permissions for views
GRANT SELECT ON campaign_engagement_details TO authenticated, anon;
GRANT SELECT ON recipient_analytics TO authenticated, anon;
GRANT SELECT ON link_clicks TO authenticated, anon;

-- 10. Add helpful comments
COMMENT ON VIEW campaign_engagement_details IS 'Unified view showing campaign engagement metrics per recipient';
COMMENT ON VIEW recipient_analytics IS 'Individual recipient analytics derived from campaign_recipients and email_events';
COMMENT ON VIEW link_clicks IS 'Link performance analytics derived from email_events';
COMMENT ON FUNCTION refresh_campaign_analytics_simple IS 'Refreshes campaign analytics from email_events and campaign_recipients';

-- 11. Test the views to ensure they work
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Test each view
    SELECT COUNT(*) INTO v_count FROM recipient_analytics LIMIT 1;
    RAISE NOTICE 'recipient_analytics view created successfully';
    
    SELECT COUNT(*) INTO v_count FROM link_clicks LIMIT 1;
    RAISE NOTICE 'link_clicks view created successfully';
    
    SELECT COUNT(*) INTO v_count FROM campaign_engagement_details LIMIT 1;
    RAISE NOTICE 'campaign_engagement_details view created successfully';
END $$;