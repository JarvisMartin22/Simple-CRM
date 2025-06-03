# Fix for Local Email Tracking

## Issue Summary
The click tracking isn't working in local development because:
1. Tracking URLs in emails might be pointing to production functions
2. The `unique_opened_count` and `unique_clicked_count` calculations might be incorrect

## Solutions

### 1. Ensure Local Functions are Running
```bash
# In terminal 1 - Start Supabase
npx supabase start

# In terminal 2 - Serve functions locally
npx supabase functions serve
```

### 2. Fix the Analytics Aggregation Function
The issue with `unique_opened_count` being 0 even when `opened_count` is 1 suggests the DISTINCT counting might be failing.

Update the `refresh_campaign_analytics_simple` function:

```sql
-- Fix the unique count calculation
CREATE OR REPLACE FUNCTION refresh_campaign_analytics_simple(p_campaign_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_recipients INTEGER := 0;
    v_sent_count INTEGER := 0;
    v_delivered_count INTEGER := 0;
    v_opened_count INTEGER := 0;
    v_clicked_count INTEGER := 0;
    v_bounced_count INTEGER := 0;
    v_complained_count INTEGER := 0;
    v_unsubscribed_count INTEGER := 0;
    v_unique_opened_count INTEGER := 0;
    v_unique_clicked_count INTEGER := 0;
    v_last_event_at TIMESTAMPTZ;
BEGIN
    -- Get total recipients from campaign_recipients table
    SELECT COUNT(*) INTO v_total_recipients
    FROM campaign_recipients
    WHERE campaign_id = p_campaign_id;
    
    -- Count total events
    SELECT 
        COUNT(*) FILTER (WHERE event_type = 'sent'),
        COUNT(*) FILTER (WHERE event_type = 'delivered'),
        COUNT(*) FILTER (WHERE event_type = 'opened'),
        COUNT(*) FILTER (WHERE event_type = 'clicked'),
        COUNT(*) FILTER (WHERE event_type = 'bounced'),
        COUNT(*) FILTER (WHERE event_type = 'complained'),
        COUNT(*) FILTER (WHERE event_type = 'unsubscribed'),
        MAX(created_at)
    INTO 
        v_sent_count, v_delivered_count, v_opened_count, v_clicked_count,
        v_bounced_count, v_complained_count, v_unsubscribed_count, v_last_event_at
    FROM email_events
    WHERE campaign_id = p_campaign_id;
    
    -- Count unique opens (by tracking_id or recipient_email)
    SELECT COUNT(DISTINCT tracking_id)
    INTO v_unique_opened_count
    FROM email_events
    WHERE campaign_id = p_campaign_id
    AND event_type = 'opened';
    
    -- Count unique clicks (by tracking_id or recipient_email)
    SELECT COUNT(DISTINCT tracking_id)
    INTO v_unique_clicked_count
    FROM email_events
    WHERE campaign_id = p_campaign_id
    AND event_type = 'clicked';

    -- Update or insert analytics
    INSERT INTO campaign_analytics (
        campaign_id, total_recipients, sent_count, delivered_count, opened_count, clicked_count,
        bounced_count, complained_count, unsubscribed_count, 
        unique_opened_count, unique_clicked_count, last_event_at, updated_at
    ) VALUES (
        p_campaign_id, v_total_recipients, v_sent_count, v_delivered_count, v_opened_count, v_clicked_count,
        v_bounced_count, v_complained_count, v_unsubscribed_count,
        v_unique_opened_count, v_unique_clicked_count, v_last_event_at, NOW()
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
        total_recipients = EXCLUDED.total_recipients,
        sent_count = EXCLUDED.sent_count,
        delivered_count = EXCLUDED.delivered_count,
        opened_count = EXCLUDED.opened_count,
        clicked_count = EXCLUDED.clicked_count,
        bounced_count = EXCLUDED.bounced_count,
        complained_count = EXCLUDED.complained_count,
        unsubscribed_count = EXCLUDED.unsubscribed_count,
        unique_opened_count = EXCLUDED.unique_opened_count,
        unique_clicked_count = EXCLUDED.unique_clicked_count,
        last_event_at = EXCLUDED.last_event_at,
        updated_at = NOW();

    -- Return the updated analytics
    RETURN jsonb_build_object(
        'success', true,
        'campaign_id', p_campaign_id,
        'total_recipients', v_total_recipients,
        'sent_count', v_sent_count,
        'opened_count', v_opened_count,
        'clicked_count', v_clicked_count,
        'unique_opened_count', v_unique_opened_count,
        'unique_clicked_count', v_unique_clicked_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Test the Complete Flow

1. Send a test campaign email
2. Open the email (tracking pixel should load)
3. Click a link in the email
4. Check the analytics:

```sql
-- Check email events
SELECT * FROM email_events 
WHERE campaign_id = 'your-campaign-id'
ORDER BY created_at DESC;

-- Manually refresh analytics
SELECT refresh_campaign_analytics_simple('your-campaign-id');

-- Check updated analytics
SELECT * FROM campaign_analytics
WHERE campaign_id = 'your-campaign-id';
```

### 4. For Production Deployment

Make sure edge functions have the correct environment variables:
```bash
# Set secrets for production
npx supabase secrets set SUPABASE_URL=your-production-url
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 5. Alternative: Use Relative URLs

Modify the tracking URL generation to use relative paths that work in both environments:
- Instead of: `${supabaseUrl}/functions/v1/email-tracker`
- Use: `/functions/v1/email-tracker` (relative to the current domain)