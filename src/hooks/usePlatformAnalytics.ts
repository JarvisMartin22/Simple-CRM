import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface PlatformAnalytics {
  totalCampaigns: number;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplaints: number;
  totalUnsubscribed: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageBounceRate: number;
  recentActivity: any[];
  topPerformingCampaigns: any[];
  engagementTrend: any[];
}

interface UsePlatformAnalyticsResult {
  analytics: PlatformAnalytics | null;
  loading: boolean;
  error: string | null;
  fetchPlatformAnalytics: () => Promise<void>;
  refreshPlatformAnalytics: () => Promise<void>;
}

export function usePlatformAnalytics(): UsePlatformAnalyticsResult {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlatformAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch all campaign analytics for the user
      const { data: campaignAnalytics, error: analyticsError } = await supabase
        .from('campaign_analytics')
        .select(`
          *,
          campaigns!inner(user_id, name, status, created_at)
        `)
        .eq('campaigns.user_id', user.id);

      if (analyticsError) {
        console.warn('Failed to fetch campaign analytics:', analyticsError);
      }

      // Fetch recent email events for activity
      const { data: recentEvents, error: eventsError } = await supabase
        .from('email_events')
        .select(`
          *,
          campaigns!inner(user_id, name)
        `)
        .eq('campaigns.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (eventsError) {
        console.warn('Failed to fetch recent events:', eventsError);
      }

      // Calculate aggregate metrics
      const aggregatedAnalytics: PlatformAnalytics = {
        totalCampaigns: 0,
        totalRecipients: 0,
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalBounced: 0,
        totalComplaints: 0,
        totalUnsubscribed: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        averageBounceRate: 0,
        recentActivity: recentEvents || [],
        topPerformingCampaigns: [],
        engagementTrend: []
      };

      if (campaignAnalytics && campaignAnalytics.length > 0) {
        aggregatedAnalytics.totalCampaigns = campaignAnalytics.length;
        
        // Sum up all metrics
        campaignAnalytics.forEach(campaign => {
          aggregatedAnalytics.totalRecipients += campaign.total_recipients || 0;
          aggregatedAnalytics.totalSent += campaign.sent_count || 0;
          aggregatedAnalytics.totalDelivered += campaign.delivered_count || 0;
          aggregatedAnalytics.totalOpened += campaign.opened_count || 0;
          aggregatedAnalytics.totalClicked += campaign.clicked_count || 0;
          aggregatedAnalytics.totalBounced += campaign.bounced_count || 0;
          aggregatedAnalytics.totalComplaints += campaign.complained_count || 0;
          aggregatedAnalytics.totalUnsubscribed += campaign.unsubscribed_count || 0;
        });

        // Calculate average rates
        if (aggregatedAnalytics.totalDelivered > 0) {
          aggregatedAnalytics.averageOpenRate = 
            (aggregatedAnalytics.totalOpened / aggregatedAnalytics.totalDelivered) * 100;
          aggregatedAnalytics.averageClickRate = 
            (aggregatedAnalytics.totalClicked / aggregatedAnalytics.totalDelivered) * 100;
        }

        if (aggregatedAnalytics.totalSent > 0) {
          aggregatedAnalytics.averageBounceRate = 
            (aggregatedAnalytics.totalBounced / aggregatedAnalytics.totalSent) * 100;
        }

        // Get top performing campaigns by open rate
        aggregatedAnalytics.topPerformingCampaigns = campaignAnalytics
          .map(campaign => ({
            id: campaign.campaign_id,
            name: campaign.campaigns?.name || 'Unknown',
            openRate: campaign.delivered_count > 0 
              ? ((campaign.opened_count || 0) / campaign.delivered_count) * 100 
              : 0,
            clickRate: campaign.delivered_count > 0 
              ? ((campaign.clicked_count || 0) / campaign.delivered_count) * 100 
              : 0,
            sent: campaign.sent_count || 0,
            opened: campaign.opened_count || 0,
            clicked: campaign.clicked_count || 0
          }))
          .sort((a, b) => b.openRate - a.openRate)
          .slice(0, 5);

        // Create engagement trend from recent events
        if (recentEvents && recentEvents.length > 0) {
          const trendMap = new Map();
          
          recentEvents.forEach(event => {
            const date = new Date(event.created_at).toISOString().split('T')[0];
            if (!trendMap.has(date)) {
              trendMap.set(date, { date, opens: 0, clicks: 0, bounces: 0 });
            }
            
            const dayData = trendMap.get(date);
            switch (event.event_type) {
              case 'opened':
                dayData.opens++;
                break;
              case 'clicked':
                dayData.clicks++;
                break;
              case 'bounced':
                dayData.bounces++;
                break;
            }
          });

          aggregatedAnalytics.engagementTrend = Array.from(trendMap.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7); // Last 7 days
        }
      }

      setAnalytics(aggregatedAnalytics);
    } catch (err: any) {
      console.error('Error fetching platform analytics:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load platform analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshPlatformAnalytics = useCallback(async () => {
    await fetchPlatformAnalytics();
  }, [fetchPlatformAnalytics]);

  return {
    analytics,
    loading,
    error,
    fetchPlatformAnalytics,
    refreshPlatformAnalytics,
  };
}