# Simple CRM Documentation

Welcome to the Simple CRM documentation. This guide covers setup, features, and development.

## 📚 Documentation Structure

### Setup Guides
- [Local Development Setup](./setup/local-development.md) - Get started with local development
- [Gmail Integration Setup](./setup/gmail-integration-setup.md) - Configure Gmail OAuth and permissions
- [Email Tracking Setup](./setup/email-tracking-setup.md) - Set up comprehensive email analytics
- [Supabase MCP Setup](./setup/supabase-mcp-setup.md) - Configure Supabase Model Context Protocol
- [UI Components](./setup/ui-components.md) - Component library and styling guide

### Feature Documentation
- [Campaigns](./features/campaigns.md) - Email campaign management
- [Contacts](./features/contacts.md) - Contact management system
- [Gmail Integration](./features/gmail-integration.md) - Gmail features and capabilities
- [Gmail Contact Import](./features/gmail-contact-import.md) - Import contacts from Gmail
- [Email Tracking](./features/email-tracking.md) - Advanced email analytics and tracking

### API Documentation
- [API Reference](./api/README.md) - Complete API endpoint documentation

### Testing
- [Campaign Testing Guide](./testing/campaign-testing-guide.md) - Test email campaigns

### Troubleshooting
- [Gmail Integration Issues](./troubleshooting/gmail-integration.md) - Common Gmail problems and solutions

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/simple-crm.git
   cd simple-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and Google credentials
   ```

4. **Run migrations**
   ```bash
   supabase db push
   ```

5. **Deploy edge functions**
   ```bash
   supabase functions deploy --no-verify-jwt
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 📧 Email Tracking Features

### Latest Updates (June 2025)

The email tracking system now supports:
- **Multi-pixel tracking** - Track opens, re-opens, and section views
- **Enhanced analytics** - Detailed engagement metrics per recipient
- **Privacy-compliant** - IP hashing and data minimization
- **Real-time updates** - Campaign analytics update instantly

### Key Components

1. **Edge Functions**
   - `email-tracker` - Processes tracking pixels
   - `send-email-enhanced` - Sends emails with advanced tracking
   - `link-tracker` - Handles click tracking

2. **Database Tables**
   - `email_events` - All email interactions
   - `campaign_analytics` - Aggregated campaign metrics
   - `campaign_engagement_details` - Detailed view of engagement

3. **Frontend Integration**
   - `useCampaigns` hook - Fetches campaigns with analytics
   - `useCampaignAnalytics` hook - Detailed analytics data
   - `EnhancedTemplateEditor` - Section-based email builder

## 🔧 Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│ Edge Functions│────▶│  Database   │
│   (React)   │     │   (Deno)     │     │ (PostgreSQL)│
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Gmail API │     │   Tracking   │     │   Analytics │
│             │     │   Pixels     │     │   Views     │
└─────────────┘     └──────────────┘     └─────────────┘
```

## 📊 Database Schema

Key tables:
- `contacts` - Contact information
- `companies` - Company data
- `campaigns` - Email campaigns
- `email_events` - Email tracking events
- `campaign_analytics` - Aggregated metrics
- `user_integrations` - OAuth tokens

## 🛠 Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Deploying
```bash
supabase db push
supabase functions deploy
npm run deploy
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🆘 Support

- Check the [troubleshooting guide](./troubleshooting/gmail-integration.md)
- Open an issue on GitHub
- Contact support at support@simplecrm.com