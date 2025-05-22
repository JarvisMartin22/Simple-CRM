# Golly CRM - The Simplest CRM Ever

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

- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Database Setup](supabase/README.md) - Supabase configuration and schema
- [Function Documentation](supabase/functions/README.md) - Edge Functions documentation

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

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

MIT
