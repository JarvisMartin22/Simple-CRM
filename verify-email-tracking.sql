-- Comprehensive Email Tracking Verification Script
-- Run this in your Supabase SQL Editor or using psql

-- 1. Check if email_events table exists and its structure
SELECT 
    'email_events table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_events'
ORDER BY ordinal_position;

-- 2. Check if campaign_analytics table exists and its structure  
SELECT 
    'campaign_analytics table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'campaign_analytics'
ORDER BY ordinal_position;

-- 3. Check if email_tracking table exists and its structure
SELECT 
    'email_tracking table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'email_tracking'
ORDER BY ordinal_position;

-- 4. Check recent data in email_events table
SELECT 
    'Recent email_events data' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as last_24_hours,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM email_events;

-- 5. Check event types distribution in email_events
SELECT 
    'Email events by type' as check_type,
    event_type,
    COUNT(*) as count,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days
FROM email_events 
GROUP BY event_type
ORDER BY count DESC;

-- 6. Check recent data in campaign_analytics table
SELECT 
    'Recent campaign_analytics data' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 day' THEN 1 END) as last_24_hours,
    MIN(created_at) as earliest_record,
    MAX(updated_at) as latest_updated
FROM campaign_analytics;

-- 7. Check relationship between campaigns and email_events
SELECT 
    'Campaign to events relationship' as check_type,
    c.id as campaign_id,
    c.name as campaign_name,
    c.status,
    COUNT(ee.id) as event_count,
    COUNT(CASE WHEN ee.event_type = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN ee.event_type = 'delivered' THEN 1 END) as delivered_count,
    COUNT(CASE WHEN ee.event_type = 'opened' THEN 1 END) as opened_count,
    COUNT(CASE WHEN ee.event_type = 'clicked' THEN 1 END) as clicked_count
FROM campaigns c
LEFT JOIN email_events ee ON c.id = ee.campaign_id
WHERE c.created_at > NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name, c.status
ORDER BY c.created_at DESC
LIMIT 10;

-- 8. Check RLS policies for email tracking tables
SELECT 
    'RLS policies check' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('email_events', 'campaign_analytics', 'email_tracking', 'campaigns')
ORDER BY tablename, policyname;

-- 9. Check if RLS is enabled on tables
SELECT 
    'RLS status check' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('email_events', 'campaign_analytics', 'email_tracking', 'campaigns')
AND schemaname = 'public';

-- 10. Check for any triggers on email tracking tables
SELECT 
    'Triggers check' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema
FROM information_schema.triggers 
WHERE event_object_table IN ('email_events', 'campaign_analytics', 'email_tracking')
ORDER BY event_object_table, trigger_name;

-- 11. Check email_tracking table data
SELECT 
    'Email tracking data' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened_records,
    COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked_records,
    AVG(open_count) as avg_open_count,
    AVG(click_count) as avg_click_count,
    MIN(created_at) as earliest_tracking,
    MAX(GREATEST(opened_at, clicked_at, created_at)) as latest_activity
FROM email_tracking;

-- 12. Check for orphaned records
SELECT 
    'Orphaned records check' as check_type,
    'email_events without campaign' as issue_type,
    COUNT(*) as count
FROM email_events ee
LEFT JOIN campaigns c ON ee.campaign_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'Orphaned records check' as check_type,
    'campaign_analytics without campaign' as issue_type,
    COUNT(*) as count
FROM campaign_analytics ca
LEFT JOIN campaigns c ON ca.campaign_id = c.id
WHERE c.id IS NULL;

-- 13. Sample recent email events for inspection
SELECT 
    'Sample recent events' as check_type,
    id,
    campaign_id,
    recipient_email,
    event_type,
    created_at,
    metadata
FROM email_events 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 5;