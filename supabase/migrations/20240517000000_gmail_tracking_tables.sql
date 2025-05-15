-- Create sync_logs table to track synchronization status
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tracked_links table for link tracking
CREATE TABLE IF NOT EXISTS public.tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  email_id TEXT,
  email_tracking_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  tracking_pixel_id UUID UNIQUE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  last_user_agent TEXT,
  last_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, email_id)
);

-- Create email_events table for tracking all email-related events
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_tracking_id UUID REFERENCES public.email_tracking(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  recipient TEXT,
  subject TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_notifications table for notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  email_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_logs
CREATE POLICY "Users can view their own sync logs"
  ON public.sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for tracked_links
CREATE POLICY "Users can view their own tracked links"
  ON public.tracked_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for email_tracking
CREATE POLICY "Users can view their own email tracking"
  ON public.email_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for email_events
CREATE POLICY "Users can view their own email events"
  ON public.email_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sync_logs_user_id_idx ON public.sync_logs(user_id);
CREATE INDEX IF NOT EXISTS tracked_links_user_id_idx ON public.tracked_links(user_id);
CREATE INDEX IF NOT EXISTS tracked_links_tracking_id_idx ON public.tracked_links(tracking_id);
CREATE INDEX IF NOT EXISTS email_tracking_user_id_idx ON public.email_tracking(user_id);
CREATE INDEX IF NOT EXISTS email_tracking_email_id_idx ON public.email_tracking(email_id);
CREATE INDEX IF NOT EXISTS email_events_user_id_idx ON public.email_events(user_id);
CREATE INDEX IF NOT EXISTS email_events_email_id_idx ON public.email_events(email_id);
CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS user_notifications_read_idx ON public.user_notifications(read); 