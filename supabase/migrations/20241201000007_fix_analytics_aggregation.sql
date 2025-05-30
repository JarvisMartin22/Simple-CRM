-- Create function to update campaign analytics when tracking events occur
CREATE OR REPLACE FUNCTION update_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update campaign analytics based on email tracking changes
    UPDATE campaign_analytics 
    SET 
        opened_count = (
            SELECT COUNT(DISTINCT id) 
            FROM email_tracking 
            WHERE campaign_id = NEW.campaign_id 
            AND opened_at IS NOT NULL
        ),
        unique_opened_count = (
            SELECT COUNT(DISTINCT recipient_email) 
            FROM email_tracking 
            WHERE campaign_id = NEW.campaign_id 
            AND opened_at IS NOT NULL
        ),
        updated_at = NOW()
    WHERE campaign_id = NEW.campaign_id;
    
    -- If no campaign_analytics record exists, create one
    IF NOT FOUND THEN
        INSERT INTO campaign_analytics (
            campaign_id,
            total_recipients,
            sent_count,
            delivered_count,
            opened_count,
            unique_opened_count,
            clicked_count,
            unique_clicked_count,
            bounced_count,
            complained_count,
            unsubscribed_count
        ) VALUES (
            NEW.campaign_id,
            (SELECT COUNT(*) FROM email_tracking WHERE campaign_id = NEW.campaign_id),
            (SELECT COUNT(*) FROM email_tracking WHERE campaign_id = NEW.campaign_id AND sent_at IS NOT NULL),
            (SELECT COUNT(*) FROM email_tracking WHERE campaign_id = NEW.campaign_id AND delivered_at IS NOT NULL),
            (SELECT COUNT(DISTINCT id) FROM email_tracking WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
            (SELECT COUNT(DISTINCT recipient_email) FROM email_tracking WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
            0, -- clicked_count
            0, -- unique_clicked_count  
            0, -- bounced_count
            0, -- complained_count
            0  -- unsubscribed_count
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update campaign analytics on email tracking changes
DROP TRIGGER IF EXISTS update_analytics_on_tracking_change ON email_tracking;
CREATE TRIGGER update_analytics_on_tracking_change
    AFTER INSERT OR UPDATE ON email_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_analytics();

-- Update the track_email_open function to also update analytics
CREATE OR REPLACE FUNCTION track_email_open(tracking_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tracking_record RECORD;
BEGIN
    -- Update the tracking record and get campaign info
    UPDATE email_tracking 
    SET 
        opened_at = COALESCE(opened_at, NOW()),
        updated_at = NOW()
    WHERE tracking_pixel_id = tracking_id
    RETURNING campaign_id, recipient_email INTO tracking_record;
    
    -- If we found and updated a record, return success
    IF FOUND THEN
        RETURN 'tracked';
    ELSE
        RETURN 'not_found';
    END IF;
END;
$$; 