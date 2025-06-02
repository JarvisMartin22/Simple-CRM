# Email Tracking System

## Overview

The Simple CRM email tracking system provides comprehensive analytics for email campaigns, including:
- Open tracking (with re-open detection)
- Click tracking
- Section-level engagement tracking
- Delivery confirmation
- Forward detection

## Architecture

### Database Schema

#### `email_events` Table
Stores all email-related events with the following key columns:
- `tracking_id` - Unique identifier for each email sent
- `event_type` - Type of event (sent, delivered, opened, clicked, etc.)
- `tracking_type` - Sub-type of tracking (open, reopen, section)
- `section_id` - For section-level tracking
- `event_data` - JSONB field with additional metadata
- `interaction_sequence` - Track order of interactions

#### `campaign_analytics` Table
Aggregated metrics for each campaign:
- `sent_count`, `delivered_count`, `opened_count`
- `unique_opened_count`, `clicked_count`
- `bounced_count`, `complained_count`

### Tracking Methods

#### 1. Open Tracking
- A 1x1 transparent pixel is embedded at the end of each email
- When loaded, it calls the `email-tracker` edge function
- Records "opened" event and updates analytics

#### 2. Re-open Detection
- System tracks if an email has been opened before
- Subsequent opens are marked with `is_reopen: true` in metadata
- Helps identify highly engaged recipients

#### 3. Section Tracking
- Multiple pixels can be embedded in different email sections
- Each pixel includes `?type=section&section=header` parameters
- Tracks which parts of long emails are actually viewed

#### 4. Click Tracking
- Links are rewritten to pass through the `link-tracker` function
- Original URL is preserved and user is redirected
- Tracks which links get the most engagement

## Implementation

### Sending Tracked Emails

```typescript
// Using the enhanced send function
const response = await supabase.functions.invoke('send-email-enhanced', {
  body: {
    userId: user.id,
    to: recipient.email,
    subject: 'Your Subject',
    template: {
      sections: [
        {
          id: 'header',
          type: 'header',
          content: '<h1>Welcome!</h1>',
          tracking: true
        },
        {
          id: 'main',
          type: 'content',
          content: '<p>Your main content...</p>',
          tracking: true
        }
      ]
    },
    trackOpens: true,
    trackClicks: true,
    trackSections: true,
    campaign_id: campaignId,
    contact_id: contactId
  }
});
```

### Tracking Pixel URLs

The system generates different pixel URLs for different tracking purposes:

```
# Main open tracking
https://your-project.supabase.co/functions/v1/email-tracker?id=TRACKING_ID&type=open&campaign=CAMPAIGN_ID

# Re-open tracking
https://your-project.supabase.co/functions/v1/email-tracker?id=TRACKING_ID&type=reopen&campaign=CAMPAIGN_ID

# Section tracking
https://your-project.supabase.co/functions/v1/email-tracker?id=TRACKING_ID&type=section&section=header&campaign=CAMPAIGN_ID
```

### Analytics Queries

#### Get Campaign Performance
```sql
SELECT * FROM campaign_analytics WHERE campaign_id = 'your-campaign-id';
```

#### Get Detailed Engagement
```sql
SELECT * FROM campaign_engagement_details WHERE campaign_id = 'your-campaign-id';
```

#### Get Section Performance
```sql
SELECT 
  section_id,
  COUNT(*) as views,
  COUNT(DISTINCT tracking_id) as unique_views
FROM email_events
WHERE campaign_id = 'your-campaign-id'
  AND tracking_type = 'section'
GROUP BY section_id;
```

## Edge Functions

### `email-tracker`
Processes tracking pixel requests:
- Validates tracking ID
- Records event in database
- Updates campaign analytics
- Returns 1x1 transparent GIF

### `send-email-enhanced`
Sends emails with tracking:
- Injects tracking pixels
- Rewrites links for click tracking
- Stores initial "sent" event
- Integrates with Gmail API

## Privacy Considerations

- IP addresses are hashed before storage
- User agent strings are truncated
- No personally identifiable information in URLs
- Complies with email tracking regulations

## Troubleshooting

### Tracking Not Working
1. Check if images are enabled in email client
2. Verify SERVICE_ROLE_KEY is set in edge functions
3. Check RLS policies on email_events table
4. Ensure campaign_analytics record exists

### Missing Analytics
1. Run `SELECT initialize_campaign_analytics('campaign-id');`
2. Check for errors in edge function logs
3. Verify tracking pixels are being injected

### Gmail-Specific Issues
- Gmail proxy may cache images
- Some Gmail clients block tracking pixels
- Corporate Gmail may have stricter policies