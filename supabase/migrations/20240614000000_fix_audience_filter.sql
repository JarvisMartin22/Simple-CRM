-- Drop the column if it exists
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS audience_filter;

-- Add the column back with the correct type
ALTER TABLE public.campaigns ADD COLUMN audience_filter JSONB;

-- Refresh the schema cache
ALTER TABLE public.campaigns ALTER COLUMN audience_filter SET DATA TYPE JSONB; 