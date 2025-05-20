import fs from 'fs';
import path from 'path';
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

// Read all migration files
const migrationsDir = './supabase/migrations';
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort to apply in order

console.log(`Found ${migrationFiles.length} migration files:`);
migrationFiles.forEach(file => console.log(`- ${file}`));

// Function to check if table exists
async function tableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
      
    return !error;
  } catch (error) {
    return false;
  }
}

// Main function to check tables and provide migration instructions
async function checkTables() {
  console.log('\nChecking database tables...');
  
  // List of tables to check (from migration files)
  const tables = [
    'contacts',
    'companies',
    'tags',
    'contact_activities',
    'user_integrations',
    'emails',
    'email_threads'
  ];
  
  const results = {};
  for (const table of tables) {
    results[table] = await tableExists(table);
    console.log(`- ${table}: ${results[table] ? 'EXISTS' : 'MISSING'}`);
  }

  // Provide instructions for missing tables
  const missingTables = tables.filter(table => !results[table]);
  if (missingTables.length > 0) {
    console.log(`\nYou need to create the following tables: ${missingTables.join(', ')}`);
    console.log(`\nTo create these tables, run the SQL migrations in your Supabase dashboard:`);
    
    for (const file of migrationFiles) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      if (missingTables.some(table => content.includes(`public.${table}`))) {
        console.log(`\n1. Run migration: ${file}`);
        console.log(`   SQL content to run in Supabase SQL Editor:`);
        console.log(`   ------------------------------------------`);
        console.log(content);
        console.log(`   ------------------------------------------\n`);
      }
    }
    
    console.log(`\nAfter running these migrations, restart your application.`);
  } else {
    console.log('\nAll required tables exist! Your database is up to date.');
  }
}

checkTables(); 