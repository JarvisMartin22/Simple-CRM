import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Mail, MousePointer, AlertTriangle } from 'lucide-react';
import { usePlatformAnalytics } from '@/hooks/usePlatformAnalytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export const PlatformAnalyticsDashboard: React.FC = () => {
  const {
    analytics,
    loading,
    error,
    fetchPlatformAnalytics,
    refreshPlatformAnalytics,
  } = usePlatformAnalytics();

  useEffect(() => {
    fetchPlatformAnalytics();

    // Set up automatic refresh every 60 seconds for real-time updates
    const interval = setInterval(() => {
      fetchPlatformAnalytics();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchPlatformAnalytics]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const safePercentage = (numerator: number, denominator: number): string => {
    if (denominator === 0) return '0.0';
    return ((numerator / denominator) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading platform analytics...</p>
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
        <p className="text-muted-foreground">No platform analytics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="platform-analytics">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Platform Analytics</h2>
        <Button onClick={refreshPlatformAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="total-campaigns">
              {formatNumber(analytics.totalCampaigns)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalSent} emails sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="avg-open-rate">
              {analytics.averageOpenRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics.totalOpened)} total opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="avg-click-rate">
              {analytics.averageClickRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics.totalClicked)} total clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="avg-bounce-rate">
              {analytics.averageBounceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics.totalBounced)} bounces
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {analytics.engagementTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="opens"
                  stroke="#2563eb"
                  name="Opens"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#16a34a"
                  name="Clicks"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="bounces"
                  stroke="#dc2626"
                  name="Bounces"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No engagement data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topPerformingCampaigns.length > 0 ? (
            <div className="space-y-3">
              {analytics.topPerformingCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.sent} sent • {campaign.opened} opened • {campaign.clicked} clicked
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{campaign.openRate.toFixed(1)}% open</p>
                    <p className="text-sm text-muted-foreground">{campaign.clickRate.toFixed(1)}% click</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No campaigns found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.recentActivity.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      event.event_type === 'opened' ? 'bg-blue-500' :
                      event.event_type === 'clicked' ? 'bg-green-500' :
                      event.event_type === 'bounced' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">{event.event_type}</span>
                    <span className="text-sm text-muted-foreground">
                      from {event.campaigns?.name || 'Unknown Campaign'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};