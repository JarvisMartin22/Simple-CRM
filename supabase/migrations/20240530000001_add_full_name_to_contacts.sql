-- Add full_name field to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create an index for full_name to optimize search
CREATE INDEX IF NOT EXISTS contacts_full_name_idx ON public.contacts(full_name);

-- Create a function to auto-update full_name
CREATE OR REPLACE FUNCTION public.update_contact_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update full_name when first_name or last_name changes
CREATE TRIGGER update_full_name_trigger
BEFORE INSERT OR UPDATE OF first_name, last_name ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_contact_full_name();

-- Update existing records
UPDATE public.contacts
SET full_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE full_name IS NULL; 