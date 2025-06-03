-- Check RLS policies on email_events table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'email_events'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    relname,
    relrowsecurity,
    relforcerowsecurity
FROM pg_class
WHERE relname = 'email_events';

-- Check table permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'email_events'
    AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Check if service role can bypass RLS
SELECT 
    rolname,
    rolbypassrls
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role');

-- Test insert as service role (this is what edge functions use)
-- This should work if edge functions can write to the table
INSERT INTO email_events (
    event_type,
    tracking_id,
    recipient_email,
    event_data,
    created_at
) VALUES (
    'test_rls',
    'test-' || gen_random_uuid()::text,
    'test@example.com',
    '{"test": true}'::jsonb,
    NOW()
) RETURNING id, event_type, tracking_id;