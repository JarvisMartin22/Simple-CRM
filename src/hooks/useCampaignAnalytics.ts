import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CampaignAnalytics, EngagementDataPoint, RecipientAnalytics } from '../types/analytics';
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
  engagementData: EngagementDataPoint[];
  recipientData: RecipientAnalytics[];
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

interface UseCampaignAnalyticsResult {
  data: CampaignAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCampaignAnalytics(campaignId: string | undefined): UseCampaignAnalyticsResult {
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    if (!campaignId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch campaign analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (analyticsError) throw analyticsError;

      // Fetch engagement data
      const { data: eventsData, error: eventsError } = await supabase
        .from('email_events')
        .select('event_type, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      // Process events into time series data
      const engagementData: EngagementDataPoint[] = processEventsData(eventsData);

      // Fetch recipient analytics
      const { data: recipientData, error: recipientError } = await supabase
        .from('recipient_analytics')
        .select(`
          *,
          links_clicked:link_clicks(*)
        `)
        .eq('campaign_id', campaignId);

      if (recipientError) throw recipientError;

      setData({
        ...analyticsData,
        engagementData,
        recipientData,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}

function processEventsData(events: any[]): EngagementDataPoint[] {
  const timePoints = new Map<string, EngagementDataPoint>();

  events.forEach(event => {
    const timestamp = new Date(event.created_at).toISOString();
    const existing = timePoints.get(timestamp) || {
      timestamp,
      opens: 0,
      clicks: 0,
      bounces: 0,
      complaints: 0,
    };

    switch (event.event_type) {
      case 'opened':
        existing.opens++;
        break;
      case 'clicked':
        existing.clicks++;
        break;
      case 'bounced':
        existing.bounces++;
        break;
      case 'complained':
        existing.complaints++;
        break;
    }

    timePoints.set(timestamp, existing);
  });

  return Array.from(timePoints.values()).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export const useCampaignAnalytics = (campaignId?: string) => {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [recipientAnalytics, setRecipientAnalytics] = useState<RecipientAnalytics[]>([]);
  const [linkClicks, setLinkClicks] = useState<LinkClick[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch campaign analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (analyticsError) throw analyticsError;

      // Fetch engagement data
      const { data: eventsData, error: eventsError } = await supabase
        .from('email_events')
        .select('event_type, created_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      // Process events into time series data
      const engagementData: EngagementDataPoint[] = processEventsData(eventsData);

      // Fetch recipient analytics
      const { data: recipientData, error: recipientError } = await supabase
        .from('recipient_analytics')
        .select(`
          *,
          links_clicked:link_clicks(*)
        `)
        .eq('campaign_id', campaignId);

      if (recipientError) throw recipientError;

      setAnalytics({
        ...analyticsData,
        engagementData,
        recipientData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId]);

  const fetchRecipientAnalytics = async () => {
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
  };

  const fetchLinkClicks = async () => {
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
  };

  const fetchEvents = async (period?: AnalyticsPeriod) => {
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
  };

  const exportAnalytics = async () => {
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
  };

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