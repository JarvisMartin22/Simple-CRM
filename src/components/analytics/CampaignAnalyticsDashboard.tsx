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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EngagementChart } from './charts/EngagementChart';
import { PerformanceMetrics } from './metrics/PerformanceMetrics';
import { RecipientTable } from './tables/RecipientTable';

interface CampaignAnalyticsDashboardProps {
  campaignId: string;
}

const CampaignAnalyticsDashboard: React.FC<CampaignAnalyticsDashboardProps> = ({ campaignId }) => {
  const {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Campaign Analytics</h2>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportAnalytics} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
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
              <div className="flex items-center gap-4 mt-2">
                <Input
                  placeholder="Search recipients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Recipients</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="clicked">Clicked</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <RecipientTable recipients={filteredRecipients} />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link URL</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead>First Click</TableHead>
                    <TableHead>Last Click</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkClicks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.link_url}</TableCell>
                      <TableCell className="text-right">{link.click_count}</TableCell>
                      <TableCell>
                        {link.first_clicked_at
                          ? format(new Date(link.first_clicked_at), 'PPp')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {link.last_clicked_at
                          ? format(new Date(link.last_clicked_at), 'PPp')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {linkClicks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No link clicks recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignAnalyticsDashboard; 