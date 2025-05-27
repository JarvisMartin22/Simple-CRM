import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  sequence_id?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  unique_opened_count: number;
  clicked_count: number;
  unique_clicked_count: number;
  bounced_count: number;
  complained_count: number;
  unsubscribed_count: number;
  last_event_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecipientAnalytics {
  id: string;
  campaign_id: string;
  sequence_id?: string;
  recipient_id: string;
  sent_at?: string;
  delivered_at?: string;
  first_opened_at?: string;
  last_opened_at?: string;
  open_count: number;
  first_clicked_at?: string;
  last_clicked_at?: string;
  click_count: number;
  bounced_at?: string;
  bounce_reason?: string;
  unsubscribed_at?: string;
}

export interface LinkClick {
  id: string;
  campaign_id: string;
  sequence_id?: string;
  recipient_id: string;
  link_url: string;
  click_count: number;
  first_clicked_at?: string;
  last_clicked_at?: string;
}

export interface EmailEvent {
  id: string;
  campaign_id: string;
  sequence_id?: string;
  recipient_id: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  event_data?: any;
  ip_address?: string;
  user_agent?: string;
  link_url?: string;
  created_at?: string;
}

export interface AnalyticsPeriod {
  start_date: Date;
  end_date: Date;
}

export const useCampaignAnalytics = (campaignId?: string) => {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [recipientAnalytics, setRecipientAnalytics] = useState<RecipientAnalytics[]>([]);
  const [linkClicks, setLinkClicks] = useState<LinkClick[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (fetchError) throw fetchError;

      setAnalytics(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching analytics',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const fetchRecipientAnalytics = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('recipient_analytics')
        .select('*')
        .eq('campaign_id', campaignId);

      if (fetchError) throw fetchError;

      setRecipientAnalytics(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching recipient analytics',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const fetchLinkClicks = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('campaign_id', campaignId);

      if (fetchError) throw fetchError;

      setLinkClicks(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching link clicks',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const fetchEvents = useCallback(async (period?: AnalyticsPeriod) => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaignId);

      if (period) {
        query = query
          .gte('created_at', period.start_date.toISOString())
          .lte('created_at', period.end_date.toISOString());
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEvents(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error fetching events',
        description: err.message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const exportAnalytics = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all necessary data
      const [analyticsData, recipientData, linkData, eventData] = await Promise.all([
        fetchAnalytics(),
        fetchRecipientAnalytics(),
        fetchLinkClicks(),
        fetchEvents(),
      ]);

      // Prepare export data
      const exportData = {
        campaign_analytics: analyticsData,
        recipient_analytics: recipientData,
        link_clicks: linkData,
        events: eventData,
      };

      // Create and download CSV
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-analytics-${campaignId}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Analytics exported',
        description: 'Successfully exported analytics data.',
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error exporting analytics',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [campaignId, fetchAnalytics, fetchRecipientAnalytics, fetchLinkClicks, fetchEvents, toast]);

  return {
    analytics,
    recipientAnalytics,
    linkClicks,
    events,
    loading,
    error,
    fetchAnalytics,
    fetchRecipientAnalytics,
    fetchLinkClicks,
    fetchEvents,
    exportAnalytics,
  };
}; 