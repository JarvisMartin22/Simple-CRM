-- Fix the track_email_open function to handle multiple matching rows
CREATE OR REPLACE FUNCTION track_email_open(tracking_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tracking_record RECORD;
    rows_updated INTEGER;
BEGIN
    -- Update the tracking record(s) and count how many were updated
    UPDATE email_tracking 
    SET 
        opened_at = COALESCE(opened_at, NOW()),
        updated_at = NOW()
    WHERE tracking_pixel_id = tracking_id;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    -- If we updated at least one record, return success
    IF rows_updated > 0 THEN
        RETURN 'tracked';
    ELSE
        RETURN 'not_found';
    END IF;
END;
$$; 