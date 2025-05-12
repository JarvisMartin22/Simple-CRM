
import React from 'react';
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MetricCardProps {
  title: string;
  value: string | number;
  changeValue?: string;
  changeText?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  onClick: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  changeValue, 
  changeText, 
  changeType = 'neutral',
  onClick 
}) => {
  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        {changeValue && (
          <div className="text-sm text-gray-500 flex items-center">
            <Badge variant="outline" className={
              changeType === 'positive' ? 'text-green-600 bg-green-50' : 
              changeType === 'negative' ? 'text-red-600 bg-red-50' : 
              'text-blue-600 bg-blue-50'
            }>
              {changeValue}
            </Badge>
            {changeText && <span className="ml-2">{changeText}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface KeyMetricsProps {
  onMetricClick: (title: string, value: string | number, changeValue?: string, change?: string, changeType?: 'positive' | 'negative' | 'neutral') => void;
}

const KeyMetrics: React.FC<KeyMetricsProps> = ({ onMetricClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard 
        title="Total Contacts"
        value="1,234"
        changeValue="+5.2%"
        changeText="vs last month"
        changeType="positive"
        onClick={() => onMetricClick("Total Contacts", "1,234", "+5.2%", "vs last month", "positive")}
      />

      <MetricCard 
        title="Open Deals"
        value="34"
        changeValue="$291,100"
        changeText="total value"
        changeType="neutral"
        onClick={() => onMetricClick("Open Deals", "34", "$291,100", "total value", "neutral")}
      />

      <MetricCard 
        title="This Month's Revenue"
        value="$67,500"
        changeValue="-2.3%"
        changeText="vs last month"
        changeType="negative"
        onClick={() => onMetricClick("This Month's Revenue", "$67,500", "-2.3%", "vs last month", "negative")}
      />

      <MetricCard 
        title="Active Campaigns"
        value="8"
        changeValue="22.5%"
        changeText="open rate"
        changeType="positive"
        onClick={() => onMetricClick("Active Campaigns", "8", "22.5%", "open rate", "positive")}
      />
    </div>
  );
};

export default KeyMetrics;
