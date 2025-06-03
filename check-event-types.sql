-- Check the constraint on event_type column
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'email_events'::regclass
    AND contype = 'c'
    AND conname LIKE '%event_type%';

-- Check column information
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'email_events'
    AND column_name = 'event_type';

-- Get distinct event types currently in use
SELECT DISTINCT event_type, COUNT(*) as count
FROM email_events
GROUP BY event_type
ORDER BY event_type;