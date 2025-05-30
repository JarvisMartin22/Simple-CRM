import React from 'react';
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

interface EngagementDataPoint {
  timestamp: string;
  opens: number;
  clicks: number;
  bounces: number;
  complaints: number;
}

interface EngagementChartProps {
  data: EngagementDataPoint[];
}

export const EngagementChart: React.FC<EngagementChartProps> = ({ data }) => {
  // Add null/undefined checking for data
  const chartData = data && Array.isArray(data) ? data : [];
  
  const formattedData = chartData.map(point => ({
    ...point,
    timestamp: format(new Date(point.timestamp), 'MMM d, h:mm a'),
  }));

  // Show a message if no data is available
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No engagement data available yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
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
        <Line
          type="monotone"
          dataKey="complaints"
          stroke="#ea580c"
          name="Complaints"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}; 