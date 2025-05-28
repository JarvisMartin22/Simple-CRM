import { supabase } from './supabaseClient';
import { CampaignAnalytics, RecipientAnalytics } from '../types/analytics';

export async function exportAnalyticsData(campaignId: string): Promise<void> {
  try {
    // Fetch all analytics data
    const [
      { data: analytics },
      { data: recipients },
      { data: events },
      { data: links }
    ] = await Promise.all([
      supabase
        .from('campaign_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .single(),
      supabase
        .from('recipient_analytics')
        .select('*')
        .eq('campaign_id', campaignId),
      supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaignId),
      supabase
        .from('link_clicks')
        .select('*')
        .eq('campaign_id', campaignId)
    ]);

    // Prepare the export data
    const exportData = {
      campaign_analytics: analytics,
      recipient_analytics: recipients,
      email_events: events,
      link_clicks: links,
      exported_at: new Date().toISOString(),
    };

    // Create a Blob with the JSON data
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    // Create a download link and trigger it
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-analytics-${campaignId}-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    throw new Error('Failed to export analytics data');
  }
} 