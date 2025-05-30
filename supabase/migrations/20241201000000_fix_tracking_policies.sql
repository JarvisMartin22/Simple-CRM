-- Add missing INSERT and UPDATE policies for email_tracking table
-- These are needed for the send-email function to create tracking records

-- Add INSERT policy for email_tracking (allows service role and authenticated users)
CREATE POLICY "Allow service role and users to insert email tracking"
  ON public.email_tracking
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway, but this helps with regular users

-- Add UPDATE policy for email_tracking (for updating open counts)
CREATE POLICY "Allow service role and users to update email tracking"
  ON public.email_tracking
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add similar policies for email_events
CREATE POLICY "Allow service role and users to insert email events"
  ON public.email_events
  FOR INSERT
  WITH CHECK (true);

-- Add INSERT policy for tracked_links
CREATE POLICY "Allow service role and users to insert tracked links"
  ON public.tracked_links
  FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policy for tracked_links
CREATE POLICY "Allow service role and users to update tracked links"
  ON public.tracked_links
  FOR UPDATE
  USING (true)
  WITH CHECK (true); 