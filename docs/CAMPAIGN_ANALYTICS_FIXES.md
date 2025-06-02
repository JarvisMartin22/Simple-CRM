# Campaign Analytics System Fixes

## Overview
This document outlines the comprehensive fixes applied to the campaign analytics system to resolve data mapping issues, consolidate overlapping tables, and ensure proper recipient tracking.

## Issues Identified

### 1. **Campaign Recipients Not Populated**
- **Problem**: `campaign_recipients` table existed but was empty, breaking recipient analytics
- **Root Cause**: Email sending function (`send-email-simple`) only created `email_events` records
- **Impact**: No recipient-level analytics, total_recipients always 0

### 2. **Data Mapping Confusion** 
- **Problem**: Opens showing as clicks, clicks showing empty in analytics dashboard
- **Root Cause**: Event type processing inconsistencies in frontend and backend
- **Impact**: Misleading analytics metrics, incorrect performance reporting

### 3. **Overlapping Analytics Tables**
- **Problem**: Multiple conflicting tables (`recipient_analytics`, `campaign_engagement_details`, etc.)
- **Root Cause**: Migration history removed some tables but frontend still expected them
- **Impact**: Broken analytics dashboard, missing recipient activity data

### 4. **Incorrect Analytics Calculations**
- **Problem**: opened_count showing clicks value, total_recipients = 0 despite sends
- **Root Cause**: Broken analytics refresh function and missing recipient population
- **Impact**: All analytics metrics were incorrect

## Fixes Implemented

### 1. **Fixed Campaign Recipients Population**

#### Changes to `send-email-simple` Edge Function:
```typescript
// Create or update campaign recipient record BEFORE sending
if (campaign_id && contact_id) {
  const { error: recipientError } = await supabase
    .from('campaign_recipients')
    .upsert({
      campaign_id: campaign_id,
      contact_id: contact_id,
      email: to,
      status: 'pending',
      metadata: trackingId ? { tracking_id: trackingId } : {},
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'campaign_id,contact_id'
    });
}

// Update status to 'sent' after successful send
if (campaign_id && contact_id) {
  const { error: updateError } = await supabase
    .from('campaign_recipients')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('campaign_id', campaign_id)
    .eq('contact_id', contact_id);
}
```

### 2. **Fixed Email Tracking Function**

#### Changes to `email-tracker` Edge Function:
```typescript
// Find the original sent event to get campaign and contact details
const { data: sentEvent, error: sentError } = await supabase
  .from('email_events')
  .select('campaign_id, contact_id, recipient_email')
  .eq('tracking_id', trackingId)
  .eq('event_type', 'sent')
  .single();

// Insert the tracking event with correct mapping
const { error: eventError } = await supabase
  .from('email_events')
  .insert({
    campaign_id: sentEvent.campaign_id,
    contact_id: sentEvent.contact_id,
    recipient_email: sentEvent.recipient_email,
    event_type: 'opened', // Always 'opened' for tracking pixel
    tracking_id: trackingId,
    event_data: eventMetadata,
    user_agent: userAgent,
    ip_address: ipAddress,
    created_at: new Date().toISOString()
  });

// Update campaign recipient with first open time
if (sentEvent.contact_id) {
  const { error: recipientError } = await supabase
    .from('campaign_recipients')
    .update({
      opened_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('campaign_id', sentEvent.campaign_id)
    .eq('contact_id', sentEvent.contact_id)
    .is('opened_at', null); // Only update if not already opened
}
```

### 3. **Unified Analytics Schema**

#### New Migration: `20250604000001_unified_campaign_analytics.sql`

**Core Analytics Table**: `campaign_analytics`
- Fixed to include `total_recipients` field
- Proper calculation from `campaign_recipients` table

**Unified Views**:
```sql
-- recipient_analytics: Individual recipient analytics
CREATE OR REPLACE VIEW recipient_analytics AS
SELECT 
    cr.id,
    cr.campaign_id,
    cr.contact_id as recipient_id, -- Map to expected field name
    cr.email as recipient_email,
    cr.status,
    cr.sent_at,
    cr.opened_at,
    cr.clicked_at,
    cr.bounced_at,
    COALESCE(opens.open_count, 0) as open_count,
    COALESCE(clicks.click_count, 0) as click_count
FROM campaign_recipients cr
LEFT JOIN (email event counts)

-- campaign_engagement_details: Per-recipient engagement metrics
CREATE OR REPLACE VIEW campaign_engagement_details AS
SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    ee.tracking_id,
    ee.recipient_email,
    COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as total_opens,
    COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) as total_clicks
FROM campaigns c
LEFT JOIN email_events ee ON c.id = ee.campaign_id

-- link_clicks: Link performance from email_events  
CREATE OR REPLACE VIEW link_clicks AS
SELECT 
    ee.campaign_id,
    ee.link_url,
    COUNT(*) as click_count,
    MIN(ee.created_at) as first_clicked_at,
    MAX(ee.created_at) as last_clicked_at
FROM email_events ee
WHERE ee.event_type = 'clicked' AND ee.link_url IS NOT NULL
```

**Enhanced Analytics Function**:
```sql
CREATE OR REPLACE FUNCTION refresh_campaign_analytics_simple(p_campaign_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_recipients INTEGER := 0;
    -- ... other variables
BEGIN
    -- Get total recipients from campaign_recipients table (FIXED)
    SELECT COUNT(*) INTO v_total_recipients
    FROM campaign_recipients
    WHERE campaign_id = p_campaign_id;
    
    -- Count events by type with correct mapping
    SELECT 
        COUNT(CASE WHEN event_type = 'sent' THEN 1 END),
        COUNT(CASE WHEN event_type = 'opened' THEN 1 END), -- Fixed mapping
        COUNT(CASE WHEN event_type = 'clicked' THEN 1 END), -- Fixed mapping
        COUNT(DISTINCT CASE WHEN event_type = 'opened' THEN contact_id END),
        COUNT(DISTINCT CASE WHEN event_type = 'clicked' THEN contact_id END)
    INTO 
        v_sent_count, v_opened_count, v_clicked_count,
        v_unique_opened_count, v_unique_clicked_count
    FROM email_events
    WHERE campaign_id = p_campaign_id;
END;
$$
```

### 4. **Fixed Frontend Data Processing**

#### Changes to `useCampaignAnalytics.ts`:
```typescript
// Fixed event type processing to handle variations
const eventType = event.event_type.toLowerCase();
switch (eventType) {
  case 'opened':
  case 'open':
    existing.opens++;
    break;
  case 'clicked':
  case 'click':
    existing.clicks++;
    break;
  case 'sent':
  case 'delivered':
    // These are tracking events but not engagement metrics
    break;
  default:
    console.warn('Unknown event type:', event.event_type);
}
```

**Added Debug Logging**:
```typescript
// Debug logging to identify data mapping issues
if (analyticsData) {
  console.log('📊 Raw analytics data:', {
    total_recipients: analyticsData.total_recipients,
    sent_count: analyticsData.sent_count,
    delivered_count: analyticsData.delivered_count,
    opened_count: analyticsData.opened_count,
    unique_opened_count: analyticsData.unique_opened_count,
    clicked_count: analyticsData.clicked_count,
    unique_clicked_count: analyticsData.unique_clicked_count
  });
}
```

## Testing & Verification

### Test Script: `test-campaign-analytics-fix.js`
Created comprehensive test script to verify:
- Campaign recipients population
- Analytics views functionality  
- Data mapping correctness
- Refresh function operation

### Key Validation Checks:
1. `total_recipients > 0` when emails are sent
2. `opened_count` shows actual opens, not clicks
3. `clicked_count` shows actual clicks, not opens
4. `campaign_recipients` table is populated during sends
5. Recipient analytics views return data
6. Engagement metrics are calculated correctly

## Migration Strategy

### Safe Deployment Steps:
1. **Apply Migration**: `20250604000001_unified_campaign_analytics.sql`
2. **Deploy Edge Functions**: Updated `send-email-simple` and `email-tracker`
3. **Deploy Frontend**: Updated `useCampaignAnalytics.ts` hook
4. **Run Test Script**: Verify all systems working
5. **Refresh Existing Data**: Run analytics refresh for existing campaigns

### Backward Compatibility:
- Views provide the same interface as removed tables
- Existing queries continue to work
- No breaking changes to API contracts

## Expected Results After Fixes

### Campaign Analytics Dashboard:
- ✅ **Open Rate**: Shows actual opens, not clicks
- ✅ **Click Rate**: Shows actual clicks, not empty  
- ✅ **Total Recipients**: Shows correct count from campaign_recipients
- ✅ **Engagement Chart**: Correctly maps event types
- ✅ **Recipient Activity**: Populated with actual recipient data

### Database State:
- ✅ **campaign_recipients**: Populated during email sends
- ✅ **campaign_analytics**: Correct metrics calculations
- ✅ **email_events**: Proper event type mapping
- ✅ **Views**: Unified interface for analytics queries

### Edge Function Behavior:
- ✅ **send-email-simple**: Creates recipient records and tracks sends
- ✅ **email-tracker**: Properly records opens and updates recipients
- ✅ **refresh-campaign-analytics**: Accurately calculates all metrics

## Monitoring & Maintenance

### Key Metrics to Monitor:
1. **campaign_recipients table population rate**
2. **Analytics calculation accuracy** 
3. **Event type distribution in email_events**
4. **Dashboard metric consistency**

### Troubleshooting Common Issues:
- If `total_recipients = 0`: Check campaign_recipients population
- If metrics seem swapped: Verify event type mapping in email_events
- If recipient analytics empty: Check recipient_analytics view
- If engagement chart broken: Verify processEventsData function

## Files Modified

### Database:
- `supabase/migrations/20250604000001_unified_campaign_analytics.sql` (NEW)

### Edge Functions:
- `supabase/functions/send-email-simple/index.ts` (MODIFIED)
- `supabase/functions/email-tracker/index.ts` (MODIFIED)

### Frontend:
- `src/hooks/useCampaignAnalytics.ts` (MODIFIED)

### Testing:
- `test-campaign-analytics-fix.js` (NEW)

### Documentation:
- `docs/CAMPAIGN_ANALYTICS_FIXES.md` (NEW - this file)