-- Drop the previous trigger and function that had schema issues
DROP TRIGGER IF EXISTS update_analytics_on_tracking_change ON email_tracking;
DROP FUNCTION IF EXISTS update_campaign_analytics();

-- Add campaign_id column to email_tracking table if it doesn't exist
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign_id ON email_tracking(campaign_id);

-- Update existing tracking records to link them to the correct campaign
-- For now, we'll link all tracking records to the campaign we know exists
UPDATE email_tracking 
SET campaign_id = 'f4690d47-2d77-4f88-ab21-fe5ab268eb35' 
WHERE campaign_id IS NULL;

-- Create function to update campaign analytics when tracking events occur
CREATE OR REPLACE FUNCTION update_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if we have a campaign_id
    IF NEW.campaign_id IS NOT NULL THEN
        -- Update campaign analytics based on email tracking changes
        UPDATE campaign_analytics 
        SET 
            opened_count = (
                SELECT COUNT(*) 
                FROM email_tracking 
                WHERE campaign_id = NEW.campaign_id 
                AND opened_at IS NOT NULL
            ),
            unique_opened_count = (
                SELECT COUNT(DISTINCT recipient) 
                FROM email_tracking 
                WHERE campaign_id = NEW.campaign_id 
                AND opened_at IS NOT NULL
            ),
            updated_at = NOW()
        WHERE campaign_id = NEW.campaign_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update campaign analytics on email tracking changes
CREATE TRIGGER update_analytics_on_tracking_change
    AFTER INSERT OR UPDATE ON email_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_analytics();

-- Update the track_email_open function to work with the real schema
CREATE OR REPLACE FUNCTION track_email_open(tracking_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tracking_record RECORD;
BEGIN
    -- Update the tracking record
    UPDATE email_tracking 
    SET 
        opened_at = COALESCE(opened_at, NOW()),
        updated_at = NOW()
    WHERE tracking_pixel_id = tracking_id
    RETURNING campaign_id, recipient INTO tracking_record;
    
    -- If we found and updated a record, return success
    IF FOUND THEN
        RETURN 'tracked';
    ELSE
        RETURN 'not_found';
    END IF;
END;
$$; 