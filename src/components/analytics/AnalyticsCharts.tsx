import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { CampaignAnalytics, EmailEvent } from '@/hooks/useCampaignAnalytics';

interface EngagementOverTimeProps {
  events: EmailEvent[];
}

interface EngagementRatesProps {
  analytics: CampaignAnalytics;
}

interface LinkClicksChartProps {
  data: Array<{
    url: string;
    clicks: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const EngagementOverTime: React.FC<EngagementOverTimeProps> = ({ events }) => {
  // Process events into time series data
  const timeSeriesData = events.reduce((acc: any[], event) => {
    const date = new Date(event.created_at!).toLocaleDateString();
    const existingEntry = acc.find(entry => entry.date === date);

    if (existingEntry) {
      existingEntry[event.event_type] = (existingEntry[event.event_type] || 0) + 1;
    } else {
      acc.push({
        date,
        [event.event_type]: 1,
      });
    }

    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Engagement Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="opened" stroke="#0088FE" name="Opens" />
              <Line type="monotone" dataKey="clicked" stroke="#00C49F" name="Clicks" />
              <Line type="monotone" dataKey="bounced" stroke="#FF8042" name="Bounces" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const EngagementRates: React.FC<EngagementRatesProps> = ({ analytics }) => {
  const data = [
    {
      name: 'Open Rate',
      value: (analytics.opened_count / analytics.delivered_count) * 100,
    },
    {
      name: 'Click Rate',
      value: (analytics.clicked_count / analytics.delivered_count) * 100,
    },
    {
      name: 'Bounce Rate',
      value: (analytics.bounced_count / analytics.sent_count) * 100,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip formatter={(value: number) => value.toFixed(2) + '%'} />
              <Bar dataKey="value" fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const LinkClicksChart: React.FC<LinkClicksChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="clicks"
                nameKey="url"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.url}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value + ' clicks'} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}; 