# Gmail Contacts Preview Function Deployment

This directory contains scripts and instructions to deploy the updated Gmail contacts preview function that properly handles different contact categories from Google.

## Important Changes

The updated function now properly fetches contacts from:
- Main Contacts (your saved contacts)
- Other Contacts (people you've emailed but not saved)
- Frequently Contacted (people you interact with often)

The implementation uses different API endpoints for each category:
- `/people/me/connections` for Main Contacts
- `/people/me/otherContacts` for Other Contacts 
- `/contactGroups/frequentlyContacted` for Frequently Contacted

## Deployment Instructions

1. Make sure you have the Supabase CLI installed and configured
   ```bash
   npm install -g supabase
   supabase login
   ```

2. Link your project if not already linked
   ```bash
   supabase link --project-ref bujaaqjxrvntcneoarkj
   ```

3. Deploy the updated function
   ```bash
   cd supabase/functions/deploy-functions
   ./deploy.sh
   ```

   Or deploy manually with:
   ```bash
   npx supabase functions deploy gmail-contacts-preview
   ```

4. Test the updated function
   - Check the logs in the Supabase dashboard
   - Try importing each category separately in the app

## Troubleshooting

If you encounter any issues:

1. Check the Supabase logs:
   ```bash
   supabase functions logs gmail-contacts-preview
   ```

2. Verify you have the correct permissions:
   - The function needs People API access
   - The OAuth scope should include `https://www.googleapis.com/auth/contacts.readonly`
   - Make sure `otherContacts` access is enabled in your Google Cloud Console

3. If there are TypeScript errors:
   - These are linting errors in the Deno environment
   - They won't affect the runtime if the code is valid JavaScript

## Manual Testing

You can test each contact category separately with:

```bash
curl -X POST https://bujaaqjxrvntcneoarkj.supabase.co/functions/v1/gmail-contacts-preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${YOUR_TOKEN}" \
  -d '{"filters": {"resourceName": "otherContacts"}}'
```

Replace `otherContacts` with `connections` or `contactGroups/frequentlyContacted/members` to test other categories. 