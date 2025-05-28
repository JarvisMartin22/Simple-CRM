export interface CampaignAnalytics {
  campaign_id: string;
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
  last_event_at: string;
  engagementData: EngagementDataPoint[];
  recipientData: RecipientAnalytics[];
}

export interface EngagementDataPoint {
  timestamp: string;
  opens: number;
  clicks: number;
  bounces: number;
  complaints: number;
}

export interface RecipientAnalytics {
  id: string;
  campaign_id: string;
  email: string;
  sent_at: string | null;
  delivered_at: string | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  first_clicked_at: string | null;
  last_clicked_at: string | null;
  click_count: number;
  bounced_at: string | null;
  bounce_reason: string | null;
  unsubscribed_at: string | null;
  links_clicked: LinkClick[];
}

export interface LinkClick {
  url: string;
  clicks: number;
  first_clicked: string;
  last_clicked: string;
} 