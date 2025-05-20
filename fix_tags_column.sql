-- Fix the tags column default value
ALTER TABLE contacts 
ALTER COLUMN tags SET DEFAULT '{}';

-- Update any existing rows with NULL or empty tags
UPDATE contacts 
SET tags = '{}'
WHERE tags IS NULL; 