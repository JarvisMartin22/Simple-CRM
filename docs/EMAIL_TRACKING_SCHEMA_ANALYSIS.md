# Email Tracking Schema Analysis

## Overview
This document analyzes the inconsistencies between the email tracking functions and the database schema in the Simple CRM application.

## Current State

### 1. Tables That Actually Exist (Based on Migrations)

#### From `20240517000000_gmail_tracking_tables.sql`:
- **`tracked_links`** - For tracking link clicks
  - Columns: id, tracking_id, original_url, email_id, email_tracking_id, user_id, clicked_at, click_count, created_at
  
- **`email_tracking`** - For tracking email opens/interactions
  - Columns: id, email_id, user_id, provider, recipient, subject, sent_at, opened_at, replied_at, tracking_pixel_id, open_count, click_count, last_opened_at, last_clicked_at, last_user_agent, last_ip, created_at, updated_at
  
- **`email_events`** (original version) - For detailed event logging
  - Columns: id, email_tracking_id, user_id, email_id, event_type, recipient, subject, url, user_agent, ip_address, created_at

#### From `20240612000000_add_campaign_analytics.sql`:
- **`recipient_analytics`** - For individual recipient tracking
  - Columns: id, campaign_id, sequence_id, recipient_id, template_id, sent_at, delivered_at, first_opened_at, last_opened_at, open_count, first_clicked_at, last_clicked_at, click_count, bounced_at, bounce_reason, unsubscribed_at, created_at, updated_at
  
- **`link_clicks`** - For tracking individual link performance
  - Columns: id, campaign_id, sequence_id, recipient_id, template_id, link_url, click_count, first_clicked_at, last_clicked_at, created_at, updated_at
  
- **`campaign_analytics`** - For aggregated campaign metrics
  - Columns: id, campaign_id, sequence_id, template_id, total_recipients, sent_count, delivered_count, opened_count, unique_opened_count, clicked_count, unique_clicked_count, bounced_count, complained_count, unsubscribed_count, last_event_at, created_at, updated_at

#### From `20250602000002_fix_tracking_final.sql` (Most Recent):
This migration **DROPPED** several tables:
- ❌ Dropped `recipient_analytics`
- ❌ Dropped `link_clicks`
- ❌ Dropped `tracked_links`

And **MODIFIED** `email_events` to have:
- campaign_id, contact_id, recipient_email, tracking_id, event_type, event_data, user_agent, ip_address, link_url, created_at, updated_at

## Key Inconsistencies

### 1. **email-tracker Function** (`/supabase/functions/email-tracker/index.ts`)
- ✅ Correctly uses the modified `email_events` table structure
- ✅ Inserts events with campaign_id, contact_id, recipient_email, tracking_id
- ✅ Uses the `refresh_campaign_analytics_simple` function

### 2. **link-tracker Function** (`/supabase/functions/link-tracker/index.ts`)
- ❌ Tries to query `tracked_links` table (DROPPED)
- ❌ References `email_tracking` table with wrong structure
- ❌ Tries to update `recipient_analytics` table (DROPPED)
- ❌ Tries to update `link_clicks` table (DROPPED)
- ✅ Does correctly update `campaign_analytics` table
- ⚠️ Inserts into `email_events` with wrong column structure (email_tracking_id, user_id, email_id)

### 3. **simple-tracker Function** (`/supabase/functions/simple-tracker/index.ts`)
- ❌ Updates `email_tracking` table using `tracking_pixel_id` column
- ⚠️ This is the old Gmail integration tracking, not campaign tracking

## Current Correct Schema

Based on the most recent migration (`20250602000002_fix_tracking_final.sql`), the current schema is:

### `email_events` Table
```sql
- id (UUID, primary key)
- campaign_id (UUID, references campaigns)
- contact_id (UUID, references contacts) 
- recipient_email (TEXT)
- tracking_id (TEXT)
- event_type (TEXT) - 'sent', 'opened', 'clicked', etc.
- event_data (JSONB)
- user_agent (TEXT)
- ip_address (TEXT)
- link_url (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### `campaign_analytics` Table
```sql
- id (UUID, primary key)
- campaign_id (UUID, references campaigns, UNIQUE)
- total_recipients (INTEGER)
- sent_count (INTEGER)
- delivered_count (INTEGER)
- opened_count (INTEGER)
- unique_opened_count (INTEGER)
- clicked_count (INTEGER)
- unique_clicked_count (INTEGER)
- bounced_count (INTEGER)
- complained_count (INTEGER)
- unsubscribed_count (INTEGER)
- last_event_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### `email_tracking` Table (from Gmail integration, separate system)
```sql
- id (UUID, primary key)
- email_id (TEXT)
- user_id (UUID, references auth.users)
- provider (TEXT)
- recipient (TEXT)
- subject (TEXT)
- sent_at (TIMESTAMPTZ)
- opened_at (TIMESTAMPTZ)
- replied_at (TIMESTAMPTZ)
- tracking_pixel_id (UUID, UNIQUE)
- open_count (INTEGER)
- click_count (INTEGER)
- last_opened_at (TIMESTAMPTZ)
- last_clicked_at (TIMESTAMPTZ)
- last_user_agent (TEXT)
- last_ip (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## Recommendations

### 1. Fix the link-tracker Function
The link-tracker function needs to be completely rewritten to:
- Remove references to dropped tables (`tracked_links`, `recipient_analytics`, `link_clicks`)
- Store link click data directly in `email_events` table
- Use the correct column structure for `email_events`

### 2. Clarify Two Tracking Systems
There appear to be two separate tracking systems:
- **Campaign Email Tracking**: Uses `email_events` and `campaign_analytics` tables
- **Gmail Integration Tracking**: Uses `email_tracking` table

These should be clearly separated or unified.

### 3. Consider Restoring Some Tables
The `link_clicks` table provided valuable functionality for tracking which specific links were clicked. Consider:
- Either restoring this table
- Or storing link-specific data in the `event_data` JSONB column of `email_events`

### 4. Update simple-tracker Function
Either:
- Remove it if it's no longer needed
- Update it to work with the campaign tracking system
- Keep it separate for Gmail integration tracking only

## Migration Strategy

1. **Immediate Fix**: Update the link-tracker function to work with current schema
2. **Short Term**: Add proper link click tracking (either restore table or use JSONB)
3. **Long Term**: Unify or clearly separate the two tracking systems