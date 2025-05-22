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

// Extract Supabase URL and key
const urlMatch = clientContent.match(/supabaseUrl = ['"](.+?)['"]/);
const keyMatch = clientContent.match(/supabaseAnonKey = ['"](.+?)['"]/);

// If the standard patterns don't work, try alternatives
const url = urlMatch ? 
  urlMatch[1] : 
  clientContent.match(/const supabaseUrl = ['"](.+?)['"]/)?.[1];

const key = keyMatch ? 
  keyMatch[1] : 
  clientContent.match(/const supabaseAnonKey = ['"](.+?)['"]/)?.[1];

if (!url || !key) {
  console.error('Could not extract Supabase URL and key from client file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(url, key);

// List of tables we want to verify exist
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

// Function to verify all tables exist
async function verifyTables() {
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
  
  return { 
    allTablesExist,
    results,
    missingTables: results.filter(r => !r.exists).map(r => r.tableName)
  };
}

async function runMigrations() {
  console.log('Checking Supabase connection...');
  console.log('URL:', url);

  // First verify which tables already exist
  const { allTablesExist, missingTables } = await verifyTables();
  
  if (allTablesExist) {
    console.log('\n✅ All required tables already exist! No migrations needed.');
    return;
  }
  
  console.log(`\nMissing tables: ${missingTables.join(', ')}`);
  console.log('\nContinuing with migrations to create missing tables...');

  // Read combined migrations file
  const migrationsFile = path.join(__dirname, 'combined_migrations.sql');
  if (!fs.existsSync(migrationsFile)) {
    console.error('Migration file not found. Run node combine_migrations.js first.');
    process.exit(1);
  }

  console.log('\n⚠️ WARNING: Direct SQL execution is not possible through Supabase JS client.');
  console.log('Please follow these steps to run the migrations:');
  console.log('1. Go to the Supabase dashboard: https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Navigate to the SQL Editor');
  console.log('4. Create a new query');
  console.log('5. Copy and paste the contents of combined_migrations.sql');
  console.log('6. Run the SQL query');
  console.log('\nAfter running the migrations, run "node verify_database.js" to verify all tables were created.');
  
  // Ask if the user wants to open the combined_migrations.sql file
  console.log('\nWould you like to open the combined_migrations.sql file now? (yes/no)');
  // Since we can't read user input directly, we'll just provide the command
  console.log('Run: open combined_migrations.sql  # on macOS');
  console.log('Run: xdg-open combined_migrations.sql  # on Linux');
  console.log('Run: start combined_migrations.sql  # on Windows');
}

// Execute directly if run as a script
runMigrations().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 