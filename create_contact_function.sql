-- Function to create a contact with proper handling of tags
CREATE OR REPLACE FUNCTION create_contact(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_title TEXT,
  p_company_id UUID,
  p_website TEXT,
  p_notes TEXT,
  p_tags TEXT[] DEFAULT '{}'::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id UUID;
  v_result JSONB;
BEGIN
  -- Insert the contact record
  INSERT INTO contacts (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    title,
    company_id,
    website,
    notes,
    tags,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_title,
    p_company_id,
    p_website,
    p_notes,
    COALESCE(p_tags, '{}'::TEXT[]),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_contact_id;
  
  -- Get the complete contact record
  SELECT row_to_json(c)::JSONB INTO v_result
  FROM contacts c
  WHERE c.id = v_contact_id;
  
  RETURN v_result;
END;
$$; 