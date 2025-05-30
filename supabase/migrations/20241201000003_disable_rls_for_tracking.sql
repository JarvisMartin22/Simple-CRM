-- Disable RLS on email_tracking table so tracking pixels work without authentication
-- Tracking pixels should be publicly accessible

ALTER TABLE public.email_tracking DISABLE ROW LEVEL SECURITY; 