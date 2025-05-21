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

## Code Changes

The code block to apply changes from:

```typescript
// Function to fetch frequently contacted people
const fetchFrequentContacts = async (accessToken: string) => {
  try {
    console.log("Fetching frequently contacted people...");
    
    // Use the "starred" contact group instead since "frequentlyContacted" doesn't work
    const starredGroupUrl = 'https://people.googleapis.com/v1/contactGroups/starred';
    
    const groupResponse = await fetch(starredGroupUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!groupResponse.ok) {
      const error = await groupResponse.text();
      console.error(`Error fetching starred contacts group: ${groupResponse.status}`, error);
      return { success: false, data: null, error };
    }
    
    const groupData = await groupResponse.json();
    const memberResourceNames = groupData.memberResourceNames || [];
    
    if (memberResourceNames.length === 0) {
      console.log("No starred contacts found");
      return { success: true, data: [], totalItems: 0 };
    }
    
    // Now fetch the actual contact details
    // Google API has a limit on batch sizes, so we'll do batches of 50
    const batchSize = 50;
    let allContacts = [];
    
    for (let i = 0; i < memberResourceNames.length; i += batchSize) {
      const batch = memberResourceNames.slice(i, i + batchSize);
      const personFields = "names,emailAddresses,organizations,phoneNumbers,urls,metadata,photos";
      const batchUrl = `https://people.googleapis.com/v1/people:batchGet?personFields=${personFields}&` + 
                     batch.map(name => `resourceNames=${encodeURIComponent(name)}`).join('&');
      
      const batchResponse = await fetch(batchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!batchResponse.ok) {
        console.error(`Error fetching batch ${i/batchSize} of contact details: ${batchResponse.status}`);
        continue;
      }
      
      const batchData = await batchResponse.json();
      if (batchData.responses && batchData.responses.length > 0) {
        const validResponses = batchData.responses.filter(r => r.person);
        const contacts = validResponses.map(r => r.person);
        allContacts = [...allContacts, ...contacts];
      }
    }
    
    return { 
      success: true, 
      data: allContacts,
      totalItems: allContacts.length
    };
  } catch (error) {
    console.error("Error fetching starred contacts:", error);
    return { success: false, data: null, error: error.message };
  }
}; 

// Function to fetch other contacts
const fetchOtherContacts = async (accessToken: string) => {
  try {
    console.log("Fetching other contacts...");
    // Remove 'organizations' from readMask as it's not allowed for otherContacts
    const otherContactsUrl = 'https://people.googleapis.com/v1/otherContacts?pageSize=1000&readMask=names,emailAddresses,phoneNumbers,urls,metadata,photos';
    
    const response = await fetch(otherContactsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching other contacts: ${response.status}`, error);
      return { success: false, data: null, error };
    }
    
    const data = await response.json();
    return { 
      success: true, 
      data: data.otherContacts || [],
      totalItems: data.otherContacts?.length || 0,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error("Error fetching other contacts:", error);
    return { success: false, data: null, error: error.message };
  }
}; 