# Email Tracking Verification

This document outlines how to verify that email tracking correctly includes campaign_id.

## Critical Code Check

In the `send-email` Edge Function, ensure the following field is included in the email_tracking insert statement:

```javascript
// When inserting into email_tracking table, campaign_id must be included
await supabase.from('email_tracking').insert({
  user_id: user_id,
  email_id: emailId, 
  recipient_email: recipientEmail,
  campaign_id: campaign_id, // This line is critical
  tracking_pixel_id: trackingPixelId,
  // other fields...
});
```

## Testing Campaign Tracking

1. Create a test campaign in the application
2. Send a test email to yourself from that campaign
3. Open the email (to trigger tracking pixel)
4. In Supabase Table Editor, check the `email_tracking` table:
   
   ```sql
   SELECT * FROM email_tracking 
   WHERE campaign_id = 'your-campaign-id'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

5. Verify that records exist with the correct campaign_id

## Debugging Tips

If tracking records aren't associated with campaigns:

1. Check Supabase Edge Function logs for the `send-email` function
2. Look for any errors related to inserting into `email_tracking` table
3. Verify that campaign_id is being passed correctly from the client to the function
4. Test with a simple tracking link to isolate the issue:

   ```
   https://bujaaqjxrvntcneoarkj.supabase.co/functions/v1/simple-tracker?type=pixel&id=[tracking_id]&campaign=[campaign_id]
   ```

5. If needed, deploy an updated version of the `send-email` function with additional logging

## SQL Queries for Verification

```sql
-- Check if campaign_id exists in email_tracking table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_tracking' AND column_name = 'campaign_id';

-- Check if any email_tracking records have campaign_id set
SELECT COUNT(*) 
FROM email_tracking 
WHERE campaign_id IS NOT NULL;

-- Look at specific campaign tracking
SELECT et.*, e.subject 
FROM email_tracking et
JOIN emails e ON et.email_id = e.id
WHERE et.campaign_id = 'your-campaign-id';
```

## Updating the Edge Function

If you need to update the send-email function:

1. Add the missing campaign_id field to the insert statement
2. Deploy the updated function:
   ```bash
   supabase functions deploy send-email --project-ref bujaaqjxrvntcneoarkj
   ```
3. Test again following the steps above 