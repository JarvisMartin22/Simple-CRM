export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  sequence_id?: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  unique_opened_count: number;
  clicked_count: number;
  unique_clicked_count: number;
  bounced_count: number;
  complained_count: number;
  unsubscribed_count: number;
  last_event_at?: string;
  created_at?: string;
  updated_at?: string;
  engagementData: EngagementDataPoint[];
  recipientData: RecipientAnalytics[];
}

export interface RecipientAnalytics {
  id: string;
  campaign_id: string;
  sequence_id?: string;
  recipient_id: string;
  sent_at?: string;
  delivered_at?: string;
  first_opened_at?: string;
  last_opened_at?: string;
  open_count: number;
  first_clicked_at?: string;
  last_clicked_at?: string;
  click_count: number;
  bounced_at?: string;
  bounce_reason?: string;
  unsubscribed_at?: string;
}

export interface LinkClick {
  id: string;
  campaign_id: string;
  sequence_id?: string;
  recipient_id: string;
  link_url: string;
  click_count: number;
  first_clicked_at?: string;
  last_clicked_at?: string;
}

export interface EmailEvent {
  id: string;
  campaign_id: string;
  sequence_id?: string;
  recipient_id: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  event_data?: any;
  ip_address?: string;
  user_agent?: string;
  link_url?: string;
  created_at?: string;
}

export interface EngagementDataPoint {
  timestamp: string;
  opens: number;
  clicks: number;
  bounces: number;
  complaints: number;
}

export interface AnalyticsPeriod {
  start_date: Date;
  end_date: Date;
} 