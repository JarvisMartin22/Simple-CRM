-- Create email_tracking table
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  tracking_pixel_id UUID DEFAULT uuid_generate_v4(),
  tracking_id UUID DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  subject TEXT,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  opened_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_messages table for Gmail sync
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  snippet TEXT,
  headers JSONB,
  labels TEXT[],
  internal_date TIMESTAMPTZ,
  sync_type TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- Create tracked_links table
CREATE TABLE IF NOT EXISTS tracked_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_tracking_id UUID REFERENCES email_tracking(id) ON DELETE CASCADE,
  tracking_id UUID DEFAULT uuid_generate_v4(),
  original_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_events table for analytics
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_tracking_id UUID REFERENCES email_tracking(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  recipient TEXT,
  subject TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Email tracking policies
CREATE POLICY "Users can view their own email tracking"
  ON email_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email tracking"
  ON email_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email tracking"
  ON email_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Email messages policies
CREATE POLICY "Users can view their own email messages"
  ON email_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email messages"
  ON email_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email messages"
  ON email_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Tracked links policies
CREATE POLICY "Users can view their own tracked links"
  ON tracked_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM email_tracking et
    WHERE et.id = tracked_links.email_tracking_id
    AND et.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own tracked links"
  ON tracked_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM email_tracking et
    WHERE et.id = tracked_links.email_tracking_id
    AND et.user_id = auth.uid()
  ));

-- Email events policies
CREATE POLICY "Users can view their own email events"
  ON email_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email events"
  ON email_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_user_id ON email_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_tracking_pixel_id ON email_tracking(tracking_pixel_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_tracking_id ON email_tracking(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_user_id ON email_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_message_id ON email_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_tracked_links_email_tracking_id ON tracked_links(email_tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email_tracking_id ON email_events(email_tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id); 