-- Fix the tracking function to handle VARCHAR tracking_pixel_id
CREATE OR REPLACE FUNCTION track_email_open(tracking_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the tracking record
  UPDATE email_tracking 
  SET 
    opened_at = COALESCE(opened_at, NOW()),
    updated_at = NOW()
  WHERE tracking_pixel_id = tracking_id;
  
  -- Return a success message
  RETURN 'tracked';
END;
$$; 