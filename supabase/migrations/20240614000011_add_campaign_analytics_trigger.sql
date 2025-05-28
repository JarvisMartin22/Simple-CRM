-- Function to initialize campaign analytics
CREATE OR REPLACE FUNCTION initialize_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Create initial analytics record
    INSERT INTO public.campaign_analytics (
        campaign_id,
        template_id,
        total_recipients,
        sent_count,
        delivered_count,
        opened_count,
        unique_opened_count,
        clicked_count,
        unique_clicked_count,
        bounced_count,
        complained_count,
        unsubscribed_count
    ) VALUES (
        NEW.id,
        NEW.template_id,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    );

    -- Create initial recipient analytics records for each contact in the audience
    IF NEW.audience_filter IS NOT NULL AND NEW.audience_filter->>'contacts' IS NOT NULL THEN
        INSERT INTO public.recipient_analytics (
            campaign_id,
            recipient_id,
            template_id,
            open_count,
            click_count
        )
        SELECT 
            NEW.id,
            (contact->>'id')::uuid,
            NEW.template_id,
            0,
            0
        FROM jsonb_array_elements(NEW.audience_filter->'contacts') AS contact;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new campaigns
DROP TRIGGER IF EXISTS initialize_analytics_on_campaign_create ON public.campaigns;
CREATE TRIGGER initialize_analytics_on_campaign_create
    AFTER INSERT ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION initialize_campaign_analytics(); 