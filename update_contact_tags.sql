-- Function to update contact tags safely
CREATE OR REPLACE FUNCTION update_contact_tags(
  contact_id UUID,
  tags_array TEXT[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE contacts
  SET 
    tags = COALESCE(tags_array, '{}'::TEXT[]),
    updated_at = NOW()
  WHERE id = contact_id;
END;
$$; 