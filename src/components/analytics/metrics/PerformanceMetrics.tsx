import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { CampaignAnalytics } from '../../../types/analytics';

interface PerformanceMetricsProps {
  analytics: CampaignAnalytics;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ analytics }) => {
  const metrics = [
    {
      title: 'Delivery Rate',
      value: `${((analytics.delivered_count / analytics.sent_count) * 100).toFixed(1)}%`,
      description: `${analytics.delivered_count} of ${analytics.sent_count} delivered`,
    },
    {
      title: 'Open Rate',
      value: `${((analytics.opened_count / analytics.delivered_count) * 100).toFixed(1)}%`,
      description: `${analytics.opened_count} of ${analytics.delivered_count} opened`,
    },
    {
      title: 'Click Rate',
      value: `${((analytics.clicked_count / analytics.delivered_count) * 100).toFixed(1)}%`,
      description: `${analytics.clicked_count} of ${analytics.delivered_count} clicked`,
    },
    {
      title: 'Bounce Rate',
      value: `${((analytics.bounced_count / analytics.sent_count) * 100).toFixed(1)}%`,
      description: `${analytics.bounced_count} of ${analytics.sent_count} bounced`,
    },
    {
      title: 'Complaint Rate',
      value: `${((analytics.complained_count / analytics.delivered_count) * 100).toFixed(1)}%`,
      description: `${analytics.complained_count} complaints received`,
    },
    {
      title: 'Unsubscribe Rate',
      value: `${((analytics.unsubscribed_count / analytics.delivered_count) * 100).toFixed(1)}%`,
      description: `${analytics.unsubscribed_count} unsubscribed`,
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
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}; 