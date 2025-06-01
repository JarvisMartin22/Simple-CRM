# Gmail Authentication Debug Steps

## Current Issues

1. **401 Unauthorized Error** - The gmail-auth edge function is rejecting the authentication
2. **406 Not Acceptable** - The `user_integrations` and `api_keys` tables are returning 406 errors (likely RLS issues)
3. **Multiple Supabase Clients** - Warning about multiple GoTrueClient instances

## Debug Tools Created

### 1. Debug Edge Function
- **Path**: `/supabase/functions/gmail-auth-debug/`
- **Purpose**: Provides detailed debug information about the auth process
- **Deploy**: `npx supabase functions deploy gmail-auth-debug`

### 2. Test Pages
- **http://localhost:8080/test-gmail-debug.html** - Tests both debug and original functions
- **http://localhost:8080/debug-gmail-auth.html** - Comprehensive auth debugger
- **http://localhost:8080/test-auth-direct.html** - Direct API test bypassing frameworks

## Debugging Steps

1. **Open http://localhost:8080/test-gmail-debug.html**
   - Make sure you're logged into the app
   - Click "Test Debug Function"
   - This will show detailed information about:
     - Environment variables in the edge function
     - Auth header processing
     - JWT verification results

2. **Check the debug output for:**
   - `env.hasAnonKey` - Should be true
   - `env.hasSupabaseUrl` - Should be true
   - `authResult.success` - Should be true if auth is working

3. **Common Issues and Fixes:**

   **If env.hasAnonKey is false:**
   ```bash
   npx supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw
   ```

   **If authResult.success is false:**
   - Check if the session is expired
   - Try logging out and back in
   - Check if the JWT is valid

## Quick Fix Attempt

If the debug function works but the original doesn't, the issue is likely in the original function's code. Try this simplified fix:

1. **Update the gmail-auth function to use simpler auth verification:**
   ```typescript
   // Instead of creating a new client for verification
   const { data: { user }, error } = await supabase.auth.getUser(token);
   ```

2. **Or bypass Supabase auth and manually verify the JWT:**
   ```typescript
   import jwt from "https://deno.land/x/djwt@v2.8/mod.ts";
   const payload = await jwt.verify(token, SUPABASE_JWT_SECRET);
   ```

## RLS Policy Fix for 406 Errors

The 406 errors on `user_integrations` and `api_keys` tables need RLS policies. Run this SQL:

```sql
-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy for user_integrations
CREATE POLICY "Users can view own integrations" ON user_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON user_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON user_integrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for api_keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);
```

## Next Steps

1. Run the debug function test first
2. Based on the results, we can identify exactly what's failing
3. The debug output will tell us if it's:
   - Missing environment variables
   - JWT verification issues
   - Expired sessions
   - Configuration mismatches