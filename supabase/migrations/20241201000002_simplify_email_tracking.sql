-- Simplify email_tracking table by removing foreign key constraint
-- This allows tracking records to be created without requiring valid user references

-- Drop the foreign key constraint
ALTER TABLE public.email_tracking DROP CONSTRAINT IF EXISTS email_tracking_user_id_fkey;

-- Make user_id nullable so we don't need to worry about it
ALTER TABLE public.email_tracking ALTER COLUMN user_id DROP NOT NULL; 