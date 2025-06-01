import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { CampaignAnalytics } from '../../../types/analytics';

interface PerformanceMetricsProps {
  analytics: CampaignAnalytics;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ analytics }) => {
  // Safe division function to handle division by zero
  const safePercentage = (numerator: number, denominator: number): string => {
    if (denominator === 0) return '0.0';
    return ((numerator / denominator) * 100).toFixed(1);
  };

  const metrics = [
    {
      title: 'Delivery Rate',
      value: `${safePercentage(analytics.delivered_count, analytics.sent_count)}%`,
      description: `${analytics.delivered_count} of ${analytics.sent_count} delivered`,
      testId: 'delivery-rate',
    },
    {
      title: 'Open Rate',
      value: `${safePercentage(analytics.opened_count, analytics.delivered_count)}%`,
      description: `${analytics.opened_count} of ${analytics.delivered_count} opened`,
      testId: 'opens-count',
      count: analytics.opened_count,
    },
    {
      title: 'Click Rate',
      value: `${safePercentage(analytics.clicked_count, analytics.delivered_count)}%`,
      description: `${analytics.clicked_count} of ${analytics.delivered_count} clicked`,
      testId: 'clicks-count',
      count: analytics.clicked_count,
    },
    {
      title: 'Bounce Rate',
      value: `${safePercentage(analytics.bounced_count, analytics.sent_count)}%`,
      description: `${analytics.bounced_count} of ${analytics.sent_count} bounced`,
      testId: 'bounce-rate',
    },
    {
      title: 'Complaint Rate',
      value: `${safePercentage(analytics.complained_count, analytics.delivered_count)}%`,
      description: `${analytics.complained_count} complaints received`,
      testId: 'complaint-rate',
    },
    {
      title: 'Unsubscribe Rate',
      value: `${safePercentage(analytics.unsubscribed_count, analytics.delivered_count)}%`,
      description: `${analytics.unsubscribed_count} unsubscribed`,
      testId: 'unsubscribe-rate',
    },
  ];

  return (
    <>
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={metric.testId}>
              {metric.value}
              {metric.count !== undefined && (
                <span className="ml-2 text-lg text-muted-foreground">({metric.count})</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}; 