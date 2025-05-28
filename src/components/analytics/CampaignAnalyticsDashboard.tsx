import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useCampaignAnalytics } from '@/hooks/useCampaignAnalytics';
import { EngagementOverTime, EngagementRates, LinkClicksChart } from './AnalyticsCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EngagementChart } from './charts/EngagementChart';
import { PerformanceMetrics } from './metrics/PerformanceMetrics';
import { RecipientTable } from './tables/RecipientTable';
import { useParams } from 'react-router-dom';
import { exportAnalyticsData } from '../../lib/analytics';

export const CampaignAnalyticsDashboard: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const {
    analytics,
    recipientAnalytics,
    linkClicks,
    events,
    loading,
    fetchAnalytics,
    fetchRecipientAnalytics,
    fetchLinkClicks,
    fetchEvents,
    exportAnalytics,
  } = useCampaignAnalytics(campaignId);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAnalytics();
    fetchRecipientAnalytics();
    fetchLinkClicks();
    fetchEvents();
  }, [fetchAnalytics, fetchRecipientAnalytics, fetchLinkClicks, fetchEvents]);

  const refreshData = () => {
    fetchAnalytics();
    fetchRecipientAnalytics();
    fetchLinkClicks();
    fetchEvents();
  };

  const filteredRecipients = recipientAnalytics.filter(recipient => {
    const matchesSearch = searchTerm
      ? recipient.recipient_id.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesStatus = filterStatus === 'all'
      ? true
      : filterStatus === 'opened'
      ? recipient.open_count > 0
      : filterStatus === 'clicked'
      ? recipient.click_count > 0
      : filterStatus === 'bounced'
      ? !!recipient.bounced_at
      : true;

    return matchesSearch && matchesStatus;
  });

  const linkClicksData = linkClicks.map(click => ({
    url: click.link_url,
    clicks: click.click_count,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const handleExport = async () => {
    if (!campaignId) return;
    await exportAnalyticsData(campaignId);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Campaign Analytics</h2>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PerformanceMetrics analytics={analytics} />
      </div>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement Over Time</TabsTrigger>
          <TabsTrigger value="recipients">Recipient Activity</TabsTrigger>
          <TabsTrigger value="links">Link Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>
                Track opens, clicks, and other engagement metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <EngagementChart data={analytics.engagementData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Recipient Activity</CardTitle>
              <CardDescription>
                Detailed breakdown of individual recipient engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecipientTable recipients={analytics.recipientData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Link Performance</CardTitle>
              <CardDescription>
                Track which links are getting the most engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Link performance table/chart will go here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 