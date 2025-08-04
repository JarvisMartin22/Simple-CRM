# Golly CRM - The Simplest CRM Ever <3

## About Golly

Golly is a modern, lightweight CRM system built for growing businesses. It provides essential features for managing contacts, companies, and deals while maintaining simplicity and ease of use.

**Live Site**: https://www.trygolly.com/

## Core Features

- Contact Management with Gmail Integration
- Company Tracking
- Deal Pipeline Management
- Email Tracking & Campaigns
- Task & Note Management
- Custom Fields & Tags

## Project Structure

```
├── app/                  # Main application code
├── supabase/            # Database and backend configuration
│   ├── functions/       # Edge Functions (Gmail integration, etc.)
│   └── migrations/      # Database migrations
├── Landing_Page/        # Marketing site components
└── docs/               # Additional documentation
```

## Documentation

### Core Documentation
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Database Setup](supabase/README.md) - Supabase configuration and schema
- [Function Documentation](supabase/functions/README.md) - Edge Functions documentation

### Gmail Integration
- [Gmail Integration Index](docs/GMAIL_INTEGRATION_INDEX.md) - Complete guide to Gmail integration docs
- [Setup Guide](docs/setup/gmail-integration-setup.md) - Step-by-step setup instructions
- [Troubleshooting](docs/troubleshooting/gmail-integration.md) - Common issues and solutions

## Local Development

1. Clone the repository
```bash
git clone <repository-url>
cd golly-crm
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Start the development server
```bash
npm run dev
```

## License

MIT
