import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CampaignAnalytics, EngagementDataPoint, RecipientAnalytics, LinkClick, EmailEvent, AnalyticsPeriod } from '../types/analytics';
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

interface UseCampaignAnalyticsResult {
  analytics: CampaignAnalytics | null;
  recipientAnalytics: RecipientAnalytics[];
  linkClicks: LinkClick[];
  events: EmailEvent[];
  loading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
  fetchRecipientAnalytics: () => Promise<void>;
  fetchLinkClicks: () => Promise<void>;
  fetchEvents: (period?: AnalyticsPeriod) => Promise<void>;
  exportAnalytics: () => Promise<void>;
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

export function useCampaignAnalytics(campaignId?: string): UseCampaignAnalyticsResult {
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
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipientAnalytics = async () => {
    if (!campaignId) return;

    try {
      const { data, error } = await supabase
        .from('recipient_analytics')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;
      setRecipientAnalytics(data || []);
    } catch (err) {
      console.error('Error fetching recipient analytics:', err);
      toast({
        title: "Error",
        description: "Failed to fetch recipient analytics",
        variant: "destructive",
      });
    }
  };

  const fetchLinkClicks = async () => {
    if (!campaignId) return;

    try {
      const { data, error } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;
      setLinkClicks(data || []);
    } catch (err) {
      console.error('Error fetching link clicks:', err);
      toast({
        title: "Error",
        description: "Failed to fetch link click data",
        variant: "destructive",
      });
    }
  };

  const fetchEvents = async (period?: AnalyticsPeriod) => {
    if (!campaignId) return;

    try {
      let query = supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaignId);

      if (period) {
        query = query
          .gte('created_at', period.start_date.toISOString())
          .lte('created_at', period.end_date.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      toast({
        title: "Error",
        description: "Failed to fetch event data",
        variant: "destructive",
      });
    }
  };

  const exportAnalytics = async () => {
    if (!campaignId) return;
    
    try {
      const exportData = {
        analytics,
        recipientAnalytics,
        linkClicks,
        events,
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign-analytics-${campaignId}-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting analytics:', err);
      toast({
        title: "Error",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchRecipientAnalytics();
    fetchLinkClicks();
    fetchEvents();
  }, [campaignId]);

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
} 