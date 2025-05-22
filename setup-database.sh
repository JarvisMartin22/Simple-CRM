#!/bin/bash

# Simple CRM Database Setup Script

echo "========================================================="
echo "Simple CRM Database Setup Instructions"
echo "========================================================="
echo ""
echo "This script provides instructions for setting up the database"
echo "tables required for Simple CRM."
echo ""

# Print a section header
print_section() {
  echo ""
  echo "--------------------------------------------------------"
  echo "$1"
  echo "--------------------------------------------------------"
}

print_section "Required Migrations"

echo "For the CRM to function properly, you need to run these migrations"
echo "in your Supabase project:"
echo ""
echo "1. Base Schema"
echo "   - File: supabase/migrations/20240325000000_contacts_companies_schema.sql"
echo "   - Purpose: Creates contacts and companies tables"
echo ""
echo "2. CRM Tables"
echo "   - File: supabase/migrations/20240326000000_create_crm_tables.sql"
echo "   - Purpose: Creates additional CRM data tables"
echo ""
echo "3. Pipeline Schema"
echo "   - File: supabase/migrations/20240605000000_create_pipelines_deals_tables.sql"
echo "   - Purpose: Creates pipeline and deals tables"
echo ""
echo "4. Gmail Integration"
echo "   - File: supabase/migrations/20240530000002_create_user_integrations_table.sql"
echo "   - Purpose: Support for email integrations"
echo ""

print_section "Instructions"

echo "1. Go to your Supabase dashboard: https://app.supabase.com"
echo "2. Select your project"
echo "3. Go to the SQL Editor"
echo "4. Create a new query"
echo "5. Copy and paste the content of each migration file one by one"
echo "6. Run each SQL script in the order listed above"
echo ""
echo "After running all migrations, restart your application to see"
echo "all features working properly."
echo ""

print_section "Troubleshooting"

echo "If you encounter issues after running the migrations, please check:"
echo ""
echo "- TROUBLESHOOTING.md - Contains solutions for common problems"
echo "- Supabase logs - Check for any SQL errors during migration"
echo "- Application console - Look for specific error messages"
echo ""
echo "For more detailed information, see the project documentation."
echo ""
echo "=========================================================" 