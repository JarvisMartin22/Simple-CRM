-- Add source column to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT NULL;

-- Create an index for source to optimize filtering
CREATE INDEX IF NOT EXISTS contacts_source_idx ON public.contacts(source);

-- Update existing contacts to have 'manual' as source
UPDATE public.contacts
SET source = 'manual'
WHERE source IS NULL; 