import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing migration files
const migrationsDir = path.join(__dirname, 'supabase/migrations');

// Order of migrations to apply
const migrationOrder = [
  '20240325000000_contacts_companies_schema.sql',
  '20240326000000_create_crm_tables.sql',
  '20240530000001_add_full_name_to_contacts.sql',
  '20240530000002_create_user_integrations_table.sql',
  '20240517000000_gmail_tracking_tables.sql',
  '20240605000000_create_pipelines_deals_tables.sql'
];

// Function to get all available migration files
function getAllMigrationFiles() {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

// Function to combine migrations
function combineMigrations() {
  const availableFiles = getAllMigrationFiles();
  console.log('Available migration files:');
  availableFiles.forEach(file => console.log(`- ${file}`));
  
  // Determine which files to process (use specified order or all available files)
  const filesToProcess = migrationOrder.length > 0 
    ? migrationOrder.filter(file => availableFiles.includes(file))
    : availableFiles;
  
  // Check if any files in the order are missing
  const missingFiles = migrationOrder.filter(file => !availableFiles.includes(file));
  if (missingFiles.length > 0) {
    console.warn('Warning: The following migration files specified in the order were not found:');
    missingFiles.forEach(file => console.warn(`- ${file}`));
  }
  
  console.log('\nCombining migration files in this order:');
  filesToProcess.forEach(file => console.log(`- ${file}`));
  
  // Combine the SQL files
  let combinedSQL = '';
  
  // Add a header
  combinedSQL += '-- Combined migration script for Simple CRM\n';
  combinedSQL += '-- Generated on ' + new Date().toISOString() + '\n';
  combinedSQL += '-- Run this in your Supabase SQL Editor\n\n';
  
  // Add BEGIN transaction
  combinedSQL += 'BEGIN;\n\n';
  
  // Add each migration file
  filesToProcess.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    combinedSQL += `-- ==========================================\n`;
    combinedSQL += `-- Migration: ${file}\n`;
    combinedSQL += `-- ==========================================\n\n`;
    combinedSQL += content;
    combinedSQL += '\n\n';
  });
  
  // Add COMMIT transaction
  combinedSQL += 'COMMIT;\n';
  
  // Write to file
  const outputFile = path.join(__dirname, 'combined_migrations.sql');
  fs.writeFileSync(outputFile, combinedSQL);
  
  console.log(`\nSuccessfully combined ${filesToProcess.length} migration files into ${outputFile}`);
  console.log(`Total size: ${(combinedSQL.length / 1024).toFixed(2)} KB`);
}

// Execute the function
combineMigrations(); 