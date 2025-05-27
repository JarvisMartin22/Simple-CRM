-- Create function to update campaign stats if it doesn't exist
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL OR
    NEW.opened_at IS NOT NULL AND OLD.opened_at IS NULL OR
    NEW.clicked_at IS NOT NULL AND OLD.clicked_at IS NULL OR
    NEW.replied_at IS NOT NULL AND OLD.replied_at IS NULL OR
    NEW.bounced_at IS NOT NULL AND OLD.bounced_at IS NULL
  ) THEN
    UPDATE public.campaigns
    SET stats = (
      SELECT jsonb_build_object(
        'total_recipients', COUNT(*),
        'sent', COUNT(sent_at),
        'opened', COUNT(opened_at),
        'clicked', COUNT(clicked_at),
        'replied', COUNT(replied_at),
        'bounced', COUNT(bounced_at)
      )
      FROM public.campaign_recipients
      WHERE campaign_id = NEW.campaign_id
    )
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating campaign stats
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON public.campaign_recipients;
CREATE TRIGGER update_campaign_stats_trigger
AFTER UPDATE ON public.campaign_recipients
FOR EACH ROW
EXECUTE FUNCTION update_campaign_stats();

-- Create function to increment monthly email count
CREATE OR REPLACE FUNCTION increment_monthly_email_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL THEN
    UPDATE public.users
    SET monthly_email_count = monthly_email_count + 1
    FROM public.campaigns
    WHERE campaigns.id = NEW.campaign_id
    AND users.id = campaigns.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for incrementing monthly email count
DROP TRIGGER IF EXISTS increment_monthly_email_count_trigger ON public.campaign_recipients;
CREATE TRIGGER increment_monthly_email_count_trigger
AFTER UPDATE ON public.campaign_recipients
FOR EACH ROW
EXECUTE FUNCTION increment_monthly_email_count();

-- Create missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS campaign_templates_user_id_idx ON public.campaign_templates(user_id);
CREATE INDEX IF NOT EXISTS campaign_recipients_campaign_id_idx ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_recipients_contact_id_idx ON public.campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS campaign_sequences_campaign_id_idx ON public.campaign_sequences(campaign_id); 