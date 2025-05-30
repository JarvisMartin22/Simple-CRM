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

## Gmail Integration Issues

### 🎯 Quick Fix Checklist

Before diving deep, check these common issues:

1. **Port Mismatch**
   ```bash
   # Ensure app runs on port 8080
   npm run dev -- --port 8080
   ```

2. **Environment Variables**
   ```bash
   # Check if variables are set
   node check-gmail-env.js
   ```

3. **Function Deployment**
   ```bash
   # Redeploy after environment changes
   supabase functions deploy gmail-auth --project-ref your-project-ref
   ```

### ✅ Expected Clean Console Output

**Good (After fixes):**
```
Gmail: Starting connection process...
Gmail: Processing auth code...
✅ Gmail connected successfully: your-email@gmail.com
```

**Bad (Before fixes):**
```
Cross-Origin-Opener-Policy policy would block the window.closed call. (x10)
DEBUG - Message received: MessageEvent {...}
Gmail auth endpoint error: FunctionsHttpError...
```

If you see the "Bad" output, the integration needs the latest error handling fixes.

### 🚨 Common Error Patterns

| Error | Root Cause | Solution |
|-------|------------|----------|
| `redirect_uri_mismatch` | Google Console URI ≠ App URI | Verify exact match in Google Cloud Console |
| `Cross-Origin-Opener-Policy` | Unhandled popup state checks | Update to latest `useGmailConnect.ts` |
| `OAuth service returned an error` | Race condition in auth flow | Update error handling for 400/500 errors |
| `invalid_client` | Wrong Google credentials | Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |

### 🔧 Debugging Steps

1. **Clear Browser State**
   - Clear console (Cmd+K)
   - Clear localStorage
   - Hard refresh (Cmd+Shift+R)

2. **Check Network Tab**
   - Look for 400/500 errors to Gmail endpoints
   - Verify OAuth URL generation

3. **Test OAuth Flow Manually**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/gmail-auth \
     -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

## Development Workflow Issues

### Database Connection Problems

If you can't connect to the local database:
1. Stop Supabase: `supabase stop`
2. Remove volumes: `docker volume prune`
3. Start fresh: `supabase start`

### Edge Function Errors

If functions fail to deploy:
1. Check Deno compatibility
2. Verify function naming
3. Check environment variables
4. Ensure Docker is running

### Auth Problems

For local auth issues:
1. Clear browser cookies/storage
2. Verify GoTrue is running
3. Check auth settings in Supabase Studio

## Performance Issues

### Slow Page Loads

1. Check for console errors
2. Verify all API endpoints are responding
3. Check network requests in DevTools
4. Look for infinite re-render loops

### Database Query Optimization

1. Add proper indexes for frequent queries
2. Use `maybeSingle()` instead of `single()` for optional data
3. Implement proper error boundaries

## Code Quality Issues

### Linting Errors

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix where possible
```

### Type Errors

```bash
npm run type-check  # Check TypeScript errors
```

### Testing Failures

```bash
npm run test        # Run test suite
npm run test:watch  # Run in watch mode
```

## Environment-Specific Issues

### Development vs Production

- **Local**: Use `localhost:8080` for OAuth redirects
- **Production**: Use actual domain URLs
- **Staging**: Use staging domain URLs
- **Docker**: Ensure ports are properly mapped

### Supabase Project Issues

1. **Wrong Project**: Check `supabase/config.toml` project_id
2. **Missing Secrets**: Verify environment variables in Supabase dashboard
3. **Function Not Deployed**: Check functions list in Supabase dashboard

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Run environment checker: `node check-gmail-env.js`
3. ✅ Check function logs: `supabase functions logs gmail-auth`
4. ✅ Verify Google Cloud Console setup
5. ✅ Test with clean browser state

### Reporting Issues

Include this information:
- Console errors (full stack trace)
- Network requests (from DevTools)
- Environment details (local/staging/production)
- Steps to reproduce
- Expected vs actual behavior

### Quick Diagnostics

```bash
# Environment check
node check-gmail-env.js

# Function logs
supabase functions logs gmail-auth --project-ref your-project-ref

# Database connection test
supabase db ping

# Project status
supabase status
```

---

*Updated with Gmail integration fixes and clean console output guidance* 