-- Migration to create missing tables for Simple CRM
-- Generated on 2024-06-07

BEGIN;

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add row level security to tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies for tags
CREATE POLICY "Users can view their own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

-- Create contact_activities table
CREATE TABLE IF NOT EXISTS public.contact_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add row level security to contact_activities
ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_activities
CREATE POLICY "Users can view their own contact activities" ON public.contact_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact activities" ON public.contact_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact activities" ON public.contact_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact activities" ON public.contact_activities
  FOR DELETE USING (auth.uid() = user_id);

-- Create tracked_links table
CREATE TABLE IF NOT EXISTS public.tracked_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES public.email_tracking(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  tracking_id TEXT NOT NULL UNIQUE,
  click_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add row level security to tracked_links
ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;

-- Create policies for tracked_links
CREATE POLICY "Users can view their own tracked links" ON public.tracked_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tracked links" ON public.tracked_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked links" ON public.tracked_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked links" ON public.tracked_links
  FOR DELETE USING (auth.uid() = user_id);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES public.user_integrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  details TEXT,
  sync_type TEXT NOT NULL,
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add row level security to sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for sync_logs
CREATE POLICY "Users can view their own sync logs" ON public.sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync logs" ON public.sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync logs" ON public.sync_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync logs" ON public.sync_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Create email_events table
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID REFERENCES public.email_tracking(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add row level security to email_events
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Create policies for email_events
CREATE POLICY "Users can view their own email events" ON public.email_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email events" ON public.email_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email events" ON public.email_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email events" ON public.email_events
  FOR DELETE USING (auth.uid() = user_id);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  notification_type TEXT,
  related_record_id UUID,
  related_record_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add row level security to user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.user_notifications
  FOR DELETE USING (auth.uid() = user_id);

COMMIT; 