-- Fix multiple rows issue in tracking function
CREATE OR REPLACE FUNCTION track_email_open(tracking_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tracking_record RECORD;
    rows_updated INTEGER;
BEGIN
    -- Get one tracking record to work with
    SELECT campaign_id, recipient 
    INTO tracking_record
    FROM email_tracking 
    WHERE tracking_pixel_id = tracking_id 
    LIMIT 1;
    
    -- Update the tracking record(s)
    UPDATE email_tracking 
    SET 
        opened_at = COALESCE(opened_at, NOW()),
        updated_at = NOW()
    WHERE tracking_pixel_id = tracking_id;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    -- If we updated tracking records, update all related analytics
    IF rows_updated > 0 AND tracking_record.campaign_id IS NOT NULL THEN
        
        -- 1. Insert an "opened" event into email_events for engagement charts
        INSERT INTO email_events (
            campaign_id,
            recipient_id,
            event_type,
            event_data,
            created_at
        )
        SELECT 
            tracking_record.campaign_id,
            (SELECT id FROM contacts WHERE email = tracking_record.recipient LIMIT 1),
            'opened',
            jsonb_build_object('tracking_id', tracking_id, 'recipient', tracking_record.recipient),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM email_events 
            WHERE campaign_id = tracking_record.campaign_id 
            AND event_type = 'opened'
            AND event_data->>'tracking_id' = tracking_id
        );
        
        -- 2. Update recipient_analytics for individual recipient tracking
        UPDATE recipient_analytics 
        SET 
            first_opened_at = COALESCE(first_opened_at, NOW()),
            last_opened_at = NOW(),
            open_count = open_count + 1,
            updated_at = NOW()
        WHERE campaign_id = tracking_record.campaign_id
        AND recipient_id = (SELECT id FROM contacts WHERE email = tracking_record.recipient LIMIT 1);
        
        -- If no recipient_analytics record exists, create one
        IF NOT FOUND THEN
            INSERT INTO recipient_analytics (
                campaign_id,
                recipient_id,
                first_opened_at,
                last_opened_at,
                open_count,
                created_at,
                updated_at
            )
            SELECT 
                tracking_record.campaign_id,
                c.id,
                NOW(),
                NOW(),
                1,
                NOW(),
                NOW()
            FROM contacts c 
            WHERE c.email = tracking_record.recipient
            LIMIT 1;
        END IF;
        
        RETURN 'tracked';
    ELSE
        RETURN 'not_found';
    END IF;
END;
$$; 