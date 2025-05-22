-- Fix the tags column default value and type
ALTER TABLE contacts 
ALTER COLUMN tags SET DEFAULT '{}'::TEXT[],
ALTER COLUMN tags TYPE TEXT[] USING COALESCE(tags, '{}'::TEXT[]);

-- Update any existing rows with NULL tags
UPDATE contacts 
SET tags = '{}'::TEXT[]
WHERE tags IS NULL;

-- Drop all versions of the function
DROP FUNCTION IF EXISTS create_contact(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_contact(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_contact(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT[]);

-- Create the contact creation function with proper array handling
CREATE FUNCTION create_contact(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'::TEXT[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id UUID;
BEGIN
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

  RETURN v_contact_id;
END;
$$;
