import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Supabase URL and key from the client file
const clientFilePath = path.join(__dirname, 'src/integrations/supabase/client.ts');
const clientContent = fs.readFileSync(clientFilePath, 'utf8');

// Extract Supabase URL
const urlMatch = clientContent.match(/supabaseUrl = ['"](.+?)['"]/);
const SUPABASE_URL = urlMatch ? urlMatch[1] : null;

// If the above doesn't work, try alternative patterns
const altUrlMatch = clientContent.match(/SUPABASE_URL = ['"](.+?)['"]/);
const altUrlMatch2 = clientContent.match(/const supabaseUrl = ['"](.+?)['"]/);

// Extract Supabase key
const keyMatch = clientContent.match(/supabaseAnonKey = ['"](.+?)['"]/);
const SUPABASE_KEY = keyMatch ? keyMatch[1] : null;

// If the above doesn't work, try alternative patterns
const altKeyMatch = clientContent.match(/SUPABASE_PUBLISHABLE_KEY = ['"](.+?)['"]/);
const altKeyMatch2 = clientContent.match(/SUPABASE_KEY = ['"](.+?)['"]/);
const altKeyMatch3 = clientContent.match(/const supabaseKey = ['"](.+?)['"]/);

// Determine the actual URL and KEY to use
const finalUrl = SUPABASE_URL || (altUrlMatch && altUrlMatch[1]) || (altUrlMatch2 && altUrlMatch2[1]);
const finalKey = SUPABASE_KEY || (altKeyMatch && altKeyMatch[1]) || (altKeyMatch2 && altKeyMatch2[1]) || (altKeyMatch3 && altKeyMatch3[1]);

if (!finalUrl || !finalKey) {
  console.error('Error: Could not extract Supabase URL and key from client file');
  console.error('Client file content:');
  console.error(clientContent);
  process.exit(1);
}

console.log('Using Supabase URL:', finalUrl);

// Create Supabase client
const supabase = createClient(finalUrl, finalKey);

// Tables that should exist after all migrations
const requiredTables = [
  'contacts',
  'companies',
  'tags',
  'contact_activities',
  'user_integrations',
  'email_tracking',
  'tracked_links',
  'sync_logs',
  'email_events',
  'user_notifications',
  'pipelines',
  'pipeline_stages',
  'deals'
];

// Function to check if a table exists
async function tableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST204') {
        // This error means the table exists but is empty
        return true;
      }
      if (error.code === '42P01') {
        // This error means the table doesn't exist
        return false;
      }
      console.error(`Error checking table ${tableName}:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Exception checking table ${tableName}:`, error.message);
    return false;
  }
}

async function verifyDatabase() {
  console.log('Verifying database tables...\n');
  
  const results = [];
  let allTablesExist = true;
  
  for (const tableName of requiredTables) {
    const exists = await tableExists(tableName);
    results.push({ tableName, exists });
    
    if (!exists) {
      allTablesExist = false;
    }
  }
  
  // Print results
  console.log('Table verification results:');
  console.log('=========================');
  
  for (const result of results) {
    const status = result.exists ? '✅ Exists' : '❌ Missing';
    console.log(`${result.tableName.padEnd(20)} ${status}`);
  }
  
  console.log('\nSummary:');
  if (allTablesExist) {
    console.log('✅ All required tables exist! Your database is properly set up.');
  } else {
    const missingTables = results.filter(r => !r.exists).map(r => r.tableName);
    console.log(`❌ Some tables are missing: ${missingTables.join(', ')}`);
    console.log('\nTo create the missing tables:');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to the SQL Editor');
    console.log('4. Run the combined_migrations.sql file');
  }
}

verifyDatabase(); 