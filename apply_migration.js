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

// The SQL to create the user_integrations table
const sql = `
-- Create user_integrations table to store email and API integrations
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Setup Row Level Security
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for user_integrations
CREATE POLICY "Users can view their own integrations"
  ON public.user_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations"
  ON public.user_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.user_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.user_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_integrations_user_id_idx ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS user_integrations_provider_idx ON public.user_integrations(provider);
`;

async function applyMigration() {
  console.log('Applying migration to create user_integrations table...');
  
  try {
    // Try to do a simpler check to see if the table already exists
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('user_integrations')
      .select('id')
      .limit(1);
      
    if (!tableCheckError) {
      console.log('Table user_integrations already exists.');
      return;
    }
    
    console.log('Table check error indicates table doesn\'t exist:', tableCheckError.message);
    
    // First, sign in as admin if you have admin credentials
    // Note: This requires admin credentials which we don't have
    // You'll need to apply this migration through the Supabase dashboard
    
    console.log(`
    IMPORTANT: The user_integrations table is missing in your database.
    
    To fix this, you need to:
    
    1. Go to your Supabase dashboard (https://app.supabase.com)
    2. Select your project
    3. Go to the SQL Editor
    4. Create a new query
    5. Paste the SQL below and run it:
    
    ${sql}
    
    After running this SQL, restart your application and the Gmail integration should work properly.
    `);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration(); 