import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface CampaignAnalyticsDashboardProps {
  campaignId: string;
}

const CampaignAnalyticsDashboard: React.FC<CampaignAnalyticsDashboardProps> = ({
  campaignId,
}) => {
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

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Analytics</h2>
          <p className="text-muted-foreground">
            Track and analyze your campaign performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analytics.opened_count / analytics.delivered_count) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.opened_count} of {analytics.delivered_count} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analytics.clicked_count / analytics.delivered_count) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.clicked_count} of {analytics.delivered_count} clicked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analytics.bounced_count / analytics.sent_count) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.bounced_count} of {analytics.sent_count} bounced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unsubscribe Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analytics.unsubscribed_count / analytics.delivered_count) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.unsubscribed_count} unsubscribed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <EngagementOverTime events={events} />
        <EngagementRates analytics={analytics} />
      </div>

      <LinkClicksChart data={linkClicksData} />

      <Card>
        <CardHeader>
          <CardTitle>Recipient Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opens</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>First Opened</TableHead>
                  <TableHead>Last Clicked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell>{recipient.recipient_id}</TableCell>
                    <TableCell>
                      {recipient.bounced_at
                        ? 'Bounced'
                        : recipient.click_count > 0
                        ? 'Clicked'
                        : recipient.open_count > 0
                        ? 'Opened'
                        : 'Sent'}
                    </TableCell>
                    <TableCell>{recipient.open_count}</TableCell>
                    <TableCell>{recipient.click_count}</TableCell>
                    <TableCell>
                      {recipient.first_opened_at
                        ? format(new Date(recipient.first_opened_at), 'PPp')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {recipient.last_clicked_at
                        ? format(new Date(recipient.last_clicked_at), 'PPp')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignAnalyticsDashboard; 