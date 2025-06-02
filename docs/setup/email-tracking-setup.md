# Email Tracking Setup Guide

## Prerequisites
- Supabase project with authentication configured
- Gmail integration set up
- Docker Desktop running (for local development)

## Installation Steps

### 1. Database Setup

Apply the email tracking migrations in order:

```sql
-- Run these migrations in your Supabase SQL editor
-- Location: supabase/migrations/

1. 20240614000021_email_events_final.sql
2. 20241201000000_fix_tracking_policies.sql  
3. 20250531000100_add_email_tracking_columns.sql
4. 20250602000000_fix_email_tracking_system.sql
5. 20250603000000_enhanced_email_tracking.sql
```

### 2. Deploy Edge Functions

```bash
# Deploy the tracking pixel handler
supabase functions deploy email-tracker --no-verify-jwt

# Deploy the enhanced email sender
supabase functions deploy send-email-enhanced --no-verify-jwt

# Deploy the simple email sender (backup)
supabase functions deploy send-email-simple --no-verify-jwt
```

### 3. Set Environment Variables

In your Supabase dashboard, add these secrets:
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `SUPABASE_SERVICE_ROLE_KEY` - From project settings

### 4. Update Frontend Integration

#### Use Enhanced Email Sending
```typescript
// In your campaign sending logic
import { supabaseWithAuth } from '@/lib/supabaseWithAuth';

const sendCampaignEmail = async (campaign, recipient) => {
  const { data, error } = await supabaseWithAuth.functions.invoke('send-email-enhanced', {
    body: {
      userId: campaign.user_id,
      to: recipient.email,
      subject: campaign.subject,
      template: campaign.template,
      trackOpens: true,
      trackClicks: true,
      trackSections: true,
      campaign_id: campaign.id,
      contact_id: recipient.id
    }
  });
  
  if (error) throw error;
  return data;
};
```

#### Display Analytics
```typescript
// The useCampaigns hook already fetches analytics
const { campaigns } = useCampaigns();

// Each campaign has stats property:
campaign.stats.sent
campaign.stats.opened
campaign.stats.clicked
```

### 5. Testing

1. Create a test campaign
2. Send to your email
3. Open the email
4. Check analytics in the dashboard
5. Verify events in database:

```sql
-- Check email events
SELECT * FROM email_events 
WHERE campaign_id = 'your-campaign-id' 
ORDER BY created_at DESC;

-- Check analytics
SELECT * FROM campaign_analytics 
WHERE campaign_id = 'your-campaign-id';
```

## Configuration Options

### Tracking Features
- `trackOpens`: Enable open tracking (default: true)
- `trackClicks`: Enable click tracking (default: true)  
- `trackSections`: Enable section tracking (default: false)

### Email Template Structure
```javascript
{
  subject: "Your Email Subject",
  preheader: "Preview text",
  sections: [
    {
      id: "header",
      type: "header",
      content: "<h1>Logo</h1>",
      tracking: true
    },
    {
      id: "main",
      type: "content", 
      content: "<p>Main content...</p>",
      tracking: true
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **"Function not found" error**
   - Ensure edge functions are deployed
   - Check function names match exactly

2. **No tracking events recorded**
   - Verify SERVICE_ROLE_KEY is set
   - Check RLS policies
   - Ensure tracking_id is being generated

3. **Analytics not updating**
   - Run `SELECT initialize_campaign_analytics('campaign-id');`
   - Check track_email_event function exists

### Debug Queries

```sql
-- Check if tracking function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'track_email_event';

-- Check campaign has analytics record
SELECT * FROM campaign_analytics 
WHERE campaign_id = 'your-campaign-id';

-- View detailed engagement
SELECT * FROM campaign_engagement_details 
WHERE campaign_id = 'your-campaign-id';
```