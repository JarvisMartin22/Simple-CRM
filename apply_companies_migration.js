import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read Supabase URL and key from the client file
const clientFilePath = './src/integrations/supabase/client.ts';
const clientContent = fs.readFileSync(clientFilePath, 'utf8');

// Extract SUPABASE_URL
const urlMatch = clientContent.match(/SUPABASE_URL = "(.+?)"/);
const SUPABASE_URL = urlMatch ? urlMatch[1] : null;

// Extract SUPABASE_PUBLISHABLE_KEY
const keyMatch = clientContent.match(/SUPABASE_PUBLISHABLE_KEY = "(.+?)"/);
const SUPABASE_KEY = keyMatch ? keyMatch[1] : null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Could not extract Supabase URL and key from client file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SQL to create the companies table
const sql = `
-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  description TEXT,
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, domain)
);

-- Setup Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Users can view their own companies"
  ON public.companies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own companies"
  ON public.companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
  ON public.companies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
  ON public.companies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS companies_user_id_idx ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS companies_domain_idx ON public.companies(domain);
`;

async function applyMigration() {
  console.log('Checking if companies table exists...');
  
  try {
    // Try to do a simpler check to see if the table already exists
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
      
    if (!tableCheckError) {
      console.log('Table companies already exists.');
      return;
    }
    
    console.log('Table check error indicates companies table doesn\'t exist:', tableCheckError.message);
    
    console.log(`
    IMPORTANT: The companies table is missing in your database.
    
    To fix this, you need to:
    
    1. Go to your Supabase dashboard (https://app.supabase.com)
    2. Select your project
    3. Go to the SQL Editor
    4. Create a new query
    5. Paste the SQL below and run it:
    
    ${sql}
    
    After running this SQL, restart your application and the contacts form should work properly.
    `);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration(); 