-- Create robust analytics that work without contacts table dependencies
CREATE OR REPLACE FUNCTION track_email_open(tracking_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tracking_record RECORD;
    rows_updated INTEGER;
    contact_id UUID;
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
        
        -- Try to find contact, or use the existing recipient_id from recipient_analytics
        SELECT id INTO contact_id 
        FROM contacts 
        WHERE email = tracking_record.recipient 
        LIMIT 1;
        
        -- If no contact found, use the existing recipient_id from recipient_analytics
        IF contact_id IS NULL THEN
            SELECT recipient_id INTO contact_id
            FROM recipient_analytics 
            WHERE campaign_id = tracking_record.campaign_id
            LIMIT 1;
        END IF;
        
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
            contact_id,
            'opened',
            jsonb_build_object(
                'tracking_id', tracking_id, 
                'recipient', tracking_record.recipient,
                'timestamp', NOW()
            ),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM email_events 
            WHERE campaign_id = tracking_record.campaign_id 
            AND event_type = 'opened'
            AND event_data->>'tracking_id' = tracking_id
            AND created_at > NOW() - INTERVAL '1 minute'  -- Prevent duplicate events within 1 minute
        );
        
        -- 2. Update recipient_analytics for individual recipient tracking
        -- First try to update existing record
        UPDATE recipient_analytics 
        SET 
            first_opened_at = COALESCE(first_opened_at, NOW()),
            last_opened_at = NOW(),
            open_count = open_count + 1,
            updated_at = NOW()
        WHERE campaign_id = tracking_record.campaign_id
        AND (
            (contact_id IS NOT NULL AND recipient_id = contact_id)
            OR 
            (contact_id IS NULL)  -- Update any record if no contact found
        );
        
        -- If no update happened (no existing recipient_analytics record), 
        -- the trigger will handle the campaign_analytics update anyway
        
        RETURN 'tracked';
    ELSE
        RETURN 'not_found';
    END IF;
END;
$$; 