import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  CampaignAnalytics as ICampaignAnalytics,
  EngagementDataPoint,
  RecipientAnalytics as IRecipientAnalytics,
  LinkClick as ILinkClick,
  EmailEvent as IEmailEvent,
  AnalyticsPeriod 
} from '../types/analytics';
import { useToast } from '@/components/ui/use-toast';

export interface CampaignAnalytics extends ICampaignAnalytics {}
export interface RecipientAnalytics extends IRecipientAnalytics {}
export interface LinkClick extends ILinkClick {}
export interface EmailEvent extends IEmailEvent {}

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

  const fetchAnalytics = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch campaign analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (analyticsError && analyticsError.code !== 'PGRST116') { // Not found error
        throw analyticsError;
      }

      // Initialize default analytics if none exist
      const baseAnalytics = analyticsData || {
        id: '',
        campaign_id: campaignId,
        total_recipients: 0,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        unique_opened_count: 0,
        clicked_count: 0,
        unique_clicked_count: 0,
        bounced_count: 0,
        complained_count: 0,
        unsubscribed_count: 0,
        engagementData: [],
        recipientData: []
      };

      setAnalytics(baseAnalytics);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
      toast({
        title: "Note",
        description: "No analytics data available yet",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  }, [campaignId, toast]);

  const fetchRecipientAnalytics = useCallback(async () => {
    if (!campaignId) return;

    try {
      const { data, error } = await supabase
        .from('recipient_analytics')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;
      setRecipientAnalytics(data || []);
    } catch (err: any) {
      console.error('Error fetching recipient analytics:', err);
      // Don't show error toast for missing data
      if (err.code !== 'PGRST116') {
        toast({
          title: "Note",
          description: "No recipient analytics available yet",
          variant: "default",
        });
      }
    }
  }, [campaignId, toast]);

  const fetchLinkClicks = useCallback(async () => {
    if (!campaignId) return;

    try {
      const { data, error } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;
      setLinkClicks(data || []);
    } catch (err: any) {
      console.error('Error fetching link clicks:', err);
      // Don't show error toast for missing data
      if (err.code !== 'PGRST116') {
        toast({
          title: "Note",
          description: "No link click data available yet",
          variant: "default",
        });
      }
    }
  }, [campaignId, toast]);

  const fetchEvents = useCallback(async (period?: AnalyticsPeriod) => {
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
    } catch (err: any) {
      console.error('Error fetching events:', err);
      // Don't show error toast for missing data
      if (err.code !== 'PGRST116') {
        toast({
          title: "Note",
          description: "No event data available yet",
          variant: "default",
        });
      }
    }
  }, [campaignId, toast]);

  const exportAnalytics = useCallback(async () => {
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
    } catch (err: any) {
      console.error('Error exporting analytics:', err);
      toast({
        title: "Error",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  }, [campaignId, analytics, recipientAnalytics, linkClicks, events, toast]);

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