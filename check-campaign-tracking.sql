-- Check campaign data for specific campaign
SELECT '=== Campaign Details ===' AS section;
SELECT * FROM campaigns WHERE id = '94e1db42-6586-47dd-b827-18d1d05f4364';

SELECT '=== Email Events ===' AS section;
SELECT event_type, COUNT(*) as count, MIN(created_at) as first_event, MAX(created_at) as last_event
FROM email_events 
WHERE campaign_id = '94e1db42-6586-47dd-b827-18d1d05f4364'
GROUP BY event_type;

SELECT '=== Latest Email Events ===' AS section;
SELECT * FROM email_events 
WHERE campaign_id = '94e1db42-6586-47dd-b827-18d1d05f4364'
ORDER BY created_at DESC
LIMIT 10;

SELECT '=== Campaign Analytics ===' AS section;
SELECT * FROM campaign_analytics WHERE campaign_id = '94e1db42-6586-47dd-b827-18d1d05f4364';

SELECT '=== Email Tracking ===' AS section;
SELECT COUNT(*) as total_tracking, 
       COUNT(CASE WHEN open_count > 0 THEN 1 END) as opened,
       COUNT(CASE WHEN click_count > 0 THEN 1 END) as clicked
FROM email_tracking 
WHERE campaign_id = '94e1db42-6586-47dd-b827-18d1d05f4364';

SELECT '=== Sample Tracking Records ===' AS section;
SELECT * FROM email_tracking 
WHERE campaign_id = '94e1db42-6586-47dd-b827-18d1d05f4364'
ORDER BY created_at DESC
LIMIT 5;