// This script provides instructions for creating the missing tables in Supabase

console.log(`
IMPORTANT: You need to create the pipelines and deals tables in your Supabase database.

To fix the "Could not find a relationship between 'companies' and 'deals'" error:

1. Go to your Supabase dashboard (https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy the SQL from the file: supabase/migrations/20240605000000_create_pipelines_deals_tables.sql
6. Run it in the SQL Editor

This will create:
- pipelines table
- pipeline_stages table
- deals table
- proper relationships between companies and deals

After running this SQL, restart your application and the CRM pipeline functionality should work properly.
`); 