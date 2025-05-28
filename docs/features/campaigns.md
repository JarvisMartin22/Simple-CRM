# Campaign Management

The campaign management system allows you to create, manage, and track email campaigns efficiently. This document covers all aspects of the campaign functionality.

## Features Overview

### 1. Campaign Creation and Management
- Create new email campaigns
- Schedule campaigns for future sending
- Target specific contact segments
- Support for A/B testing
- Campaign templates management
- Draft saving and preview

### 2. Email Templates
- Rich text editor with formatting options
- Variable support for personalization
- Mobile-responsive templates
- Template duplication and versioning
- Preview functionality with sample data

### 3. Analytics and Tracking
- Real-time engagement metrics
- Open and click tracking
- Bounce rate monitoring
- Link click analytics
- Recipient-level tracking
- Export functionality for data analysis

### 4. Preview and Testing
- Desktop and mobile preview
- Variable replacement preview
- Spam score checking
- Link validation
- Test email sending
- Preview with actual recipient data

## Technical Components

### Campaign Database Schema

```sql
-- Main campaign table
campaign_sequences
  - id: uuid (primary key)
  - user_id: uuid (foreign key)
  - name: string
  - description: text
  - status: enum
  - schedule_type: enum
  - scheduled_at: timestamp
  - created_at: timestamp
  - updated_at: timestamp

-- Campaign analytics
campaign_analytics
  - id: uuid (primary key)
  - campaign_id: uuid (foreign key)
  - total_recipients: integer
  - sent_count: integer
  - delivered_count: integer
  - opened_count: integer
  - clicked_count: integer
  - bounced_count: integer
  - complained_count: integer
  - unsubscribed_count: integer
  - last_event_at: timestamp

-- Email events tracking
email_events
  - id: uuid (primary key)
  - campaign_id: uuid (foreign key)
  - recipient_id: uuid (foreign key)
  - event_type: enum
  - event_data: jsonb
  - created_at: timestamp

-- Recipient analytics
recipient_analytics
  - id: uuid (primary key)
  - campaign_id: uuid (foreign key)
  - recipient_id: uuid (foreign key)
  - email: string
  - sent_at: timestamp
  - delivered_at: timestamp
  - opened_at: timestamp
  - clicked_at: timestamp
  - bounced_at: timestamp
  - unsubscribed_at: timestamp

-- Link tracking
link_clicks
  - id: uuid (primary key)
  - campaign_id: uuid (foreign key)
  - recipient_id: uuid (foreign key)
  - link_url: string
  - click_count: integer
  - first_clicked_at: timestamp
  - last_clicked_at: timestamp
```

### Key Components

1. **CampaignAnalyticsDashboard**
   - Main analytics visualization component
   - Displays key metrics and charts
   - Handles data export functionality

2. **TemplateEditor**
   - Rich text editing capabilities
   - Variable insertion
   - Preview functionality
   - Mobile responsiveness

3. **EmailPreview**
   - Desktop/mobile preview modes
   - Variable replacement preview
   - Spam score checking
   - Link validation
   - Test email sending

4. **Analytics Components**
   - EngagementChart: Time-series visualization
   - PerformanceMetrics: Key statistics display
   - RecipientTable: Detailed recipient tracking

### Edge Functions

1. **check-spam-score**
   - Analyzes email content for spam indicators
   - Provides spam score and detailed issues
   - Checks common spam triggers
   - Returns normalized score (0-10)

## Usage Guide

### Creating a Campaign

1. Navigate to Campaigns section
2. Click "New Campaign"
3. Fill in campaign details:
   - Name and description
   - Select or create template
   - Choose recipient segment
   - Set schedule (immediate/scheduled)
4. Preview and test campaign
5. Launch campaign

### Managing Templates

1. Access Templates section
2. Create new or edit existing templates
3. Use variable placeholders:
   - `{{contact.first_name}}`
   - `{{contact.last_name}}`
   - `{{contact.email}}`
   - `{{contact.company}}`
4. Preview and test templates
5. Save and manage versions

### Tracking Results

1. View campaign dashboard
2. Monitor real-time metrics:
   - Delivery rate
   - Open rate
   - Click rate
   - Bounce rate
   - Unsubscribe rate
3. Export analytics data
4. View recipient-level engagement

## Best Practices

1. **Template Design**
   - Use mobile-responsive layouts
   - Keep content concise
   - Include clear call-to-action
   - Test across email clients

2. **Campaign Setup**
   - Verify recipient segments
   - Test with sample data
   - Check spam score
   - Validate all links
   - Send test emails

3. **Analytics**
   - Regular monitoring
   - Export data for analysis
   - Track engagement patterns
   - Analyze bounce reasons

4. **Maintenance**
   - Update templates regularly
   - Clean contact lists
   - Monitor deliverability
   - Update tracking parameters

## Troubleshooting

Common issues and solutions:

1. **Template Variables Not Working**
   - Verify variable syntax
   - Check recipient data
   - Test preview functionality

2. **Analytics Not Updating**
   - Check tracking pixels
   - Verify event triggers
   - Clear cache if needed

3. **Email Delivery Issues**
   - Check spam score
   - Verify sender authentication
   - Monitor bounce reports

4. **Preview Problems**
   - Clear browser cache
   - Check template formatting
   - Verify mobile responsiveness 