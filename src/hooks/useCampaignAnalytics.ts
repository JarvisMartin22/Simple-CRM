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
  if (!events || events.length === 0) {
    return [];
  }

  // Group events by hour to create more meaningful data points
  const timePoints = new Map<string, EngagementDataPoint>();

  events.forEach(event => {
    if (!event.created_at || !event.event_type) {
      console.warn('Invalid event data:', event);
      return;
    }

    // Round to nearest hour for grouping
    const eventDate = new Date(event.created_at);
    eventDate.setMinutes(0, 0, 0); // Round to the hour
    const timestamp = eventDate.toISOString();
    
    const existing = timePoints.get(timestamp) || {
      timestamp,
      opens: 0,
      clicks: 0,
      bounces: 0,
      complaints: 0,
    };

    // Fix the data mapping - ensure correct event types are processed
    const eventType = event.event_type.toLowerCase();
    switch (eventType) {
      case 'opened':
      case 'open':
        existing.opens++;
        break;
      case 'clicked':
      case 'click':
        existing.clicks++;
        break;
      case 'bounced':
      case 'bounce':
        existing.bounces++;
        break;
      case 'complained':
      case 'complaint':
        existing.complaints++;
        break;
      case 'sent':
      case 'delivered':
        // These are tracking events but not engagement metrics
        break;
      default:
        console.warn('Unknown event type:', event.event_type);
    }

    timePoints.set(timestamp, existing);
  });

  const result = Array.from(timePoints.values()).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  console.log('Processed engagement data points:', result.length, 'time points');
  return result;
}

export function useCampaignAnalytics(campaignId?: string): UseCampaignAnalyticsResult {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [recipientAnalytics, setRecipientAnalytics] = useState<RecipientAnalytics[]>([]);
  const [linkClicks, setLinkClicks] = useState<LinkClick[]>([]);
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshCampaignAnalytics = useCallback(async (skipLoading = false) => {
    if (!campaignId) return;

    try {
      // Get the anon key from environment
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';
      
      // Call the refresh function to update analytics from events
      const response = await fetch(`https://bujaaqjxrvntcneoarkj.supabase.co/functions/v1/refresh-campaign-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: JSON.stringify({ campaign_id: campaignId })
      });

      if (response.ok) {
        console.log('Campaign analytics refreshed successfully');
      } else {
        console.warn('Failed to refresh campaign analytics:', response.status);
      }
    } catch (error) {
      console.warn('Error refreshing campaign analytics:', error);
    }
  }, [campaignId]);

  const fetchAnalytics = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);

      // First try to refresh analytics from events
      await refreshCampaignAnalytics(true);

      // Fetch campaign analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();

      if (analyticsError) {
        // Handle 406 Not Acceptable error (likely RLS issue)
        if (analyticsError.code === '406' || analyticsError.code === 'PGRST109') {
          console.warn('RLS policy preventing access to campaign_analytics, using default data');
          // Use default analytics data
        } else if (analyticsError.code !== 'PGRST116') { // Not found error
          throw analyticsError;
        }
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

      // Debug logging to identify data mapping issues
      if (analyticsData) {
        console.log('📊 Raw analytics data:', {
          total_recipients: analyticsData.total_recipients,
          sent_count: analyticsData.sent_count,
          delivered_count: analyticsData.delivered_count,
          opened_count: analyticsData.opened_count,
          unique_opened_count: analyticsData.unique_opened_count,
          clicked_count: analyticsData.clicked_count,
          unique_clicked_count: analyticsData.unique_clicked_count
        });
      }

      // Also fetch events to populate engagementData
      const { data: eventsData, error: eventsError } = await supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (eventsError) {
        console.warn('Failed to fetch events for engagement data:', eventsError);
      }

      if (eventsData && eventsData.length > 0) {
        console.log(`Processing ${eventsData.length} events for engagement chart`);
        baseAnalytics.engagementData = processEventsData(eventsData);
        console.log('Engagement data points:', baseAnalytics.engagementData.length);
      } else {
        console.log('No events found for campaign, using empty engagement data');
        baseAnalytics.engagementData = [];
      }

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

      if (error) {
        if (error.code === '406' || error.code === 'PGRST109') {
          console.warn('RLS policy preventing access to recipient_analytics, using empty data');
          setRecipientAnalytics([]);
          return;
        }
        throw error;
      }
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

      if (error) {
        if (error.code === '406' || error.code === 'PGRST109') {
          console.warn('RLS policy preventing access to link_clicks, using empty data');
          setLinkClicks([]);
          return;
        }
        throw error;
      }
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

      if (error) {
        if (error.code === '406' || error.code === 'PGRST109') {
          console.warn('RLS policy preventing access to email_events, using empty data');
          setEvents([]);
          return;
        }
        throw error;
      }
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