# Troubleshooting Guide

This guide addresses common issues you might encounter while setting up and using Simple CRM.

## Authentication Issues

### "Failed to fetch" / "Invalid API key" during signup or login

**Symptoms**: You see errors like "Failed to fetch" or "AuthApiError: Invalid API key" when trying to sign up or log in.

**Solution**:
1. Verify your Supabase URL and API key in `src/integrations/supabase/client.ts`
2. Make sure the API key is the most recent anon key from your Supabase project
3. Try logging in with the TestSupabase page at `/auth/test-supabase` to debug connection issues

### Email rate limit exceeded

**Symptoms**: You see "email rate limit exceeded" errors during signup.

**Solution**:
- This is expected behavior when testing with the same email frequently
- Try using a different email address or wait a while before trying again
- For development, you can create users directly in the Supabase Auth dashboard

## Database Connection Issues

### "Could not find a relationship between 'companies' and 'deals'"

**Symptoms**: You see this error when trying to access the Companies page after logging in.

**Solution**:
1. The deals and pipelines tables need to be created in your Supabase database
2. Go to your Supabase dashboard
3. Navigate to the SQL Editor
4. Create a new query
5. Copy the SQL from `supabase/migrations/20240605000000_create_pipelines_deals_tables.sql`
6. Run the SQL
7. Restart your application

### "No query results" or "Not Acceptable" errors

**Symptoms**: You see errors related to missing tables or 406 Not Acceptable responses.

**Solution**:
- These errors typically happen when trying to query tables that don't exist yet
- The context files include fallbacks to handle these cases
- Run all migrations in the `supabase/migrations` directory to set up your database schema

## Integration Issues

### Gmail integration not working

**Symptoms**: You can't connect to Gmail or email features don't work.

**Solution**:
1. Ensure the `user_integrations` table exists in your database
2. If missing, run the migration at `supabase/migrations/20240530000002_create_user_integrations_table.sql`
3. Make sure your API key has proper permissions for Auth and Database operations

## UI/Development Issues

### "Could not Fast Refresh" errors

**Symptoms**: You see errors like "Could not Fast Refresh (useAuth export is incompatible)" in the console.

**Solution**:
- This is a known issue with React's Fast Refresh and context exports
- These warnings don't affect functionality and can be ignored
- If the UI isn't updating, try a full page reload

### Components not updating when data changes

**Symptoms**: Changes in data aren't reflected in the UI until manual refresh.

**Solution**:
1. Make sure you're using React Query's invalidation patterns correctly
2. Check that your context providers are set up properly
3. Verify that state updates are working as expected
4. Try a hard refresh if needed

## Missing Features

### Pipelines functionality not working

**Symptoms**: The Pipelines page shows no data or has errors.

**Solution**:
1. Make sure you've run the pipelines migration (see Database Connection Issues above)
2. Create your first pipeline and pipeline stages
3. Verify that the user_id is properly set when creating pipelines

## Contact Support

If you continue to experience issues not covered in this guide, please:

1. Check the GitHub issues for similar problems
2. Run the application with debug logging enabled
3. Create a new issue with detailed reproduction steps and error messages 