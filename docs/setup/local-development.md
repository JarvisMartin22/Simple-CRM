# Local Development Guide

## Prerequisites

- Node.js 16+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Docker Desktop
- Supabase CLI (`brew install supabase/tap/supabase`)
- Git

## ⚠️ Known Limitations

### Gmail Integration
The Gmail integration **cannot** be tested with local Supabase instances due to OAuth2 requirements. For Gmail integration development:
- Use a deployed Supabase instance
- Configure OAuth2 with public URLs
- See [Gmail Integration Guide](../features/gmail-integration.md) for details

## Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/golly-crm.git
cd golly-crm
```

2. Install dependencies:
```bash
npm install
```

3. Start Supabase locally:
```bash
supabase start
```

This will start:
- PostgreSQL database
- Supabase services
- GoTrue (auth)
- PostgREST (REST API)
- Storage API
- Edge Functions

## Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with local Supabase credentials:
```bash
VITE_SITE_URL=http://localhost:8080
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

## Database Setup

1. Apply migrations:
```bash
supabase db reset
```

2. Seed test data (optional):
```bash
npm run seed
```

## Development Workflow

1. Start the development server:
```bash
npm run dev
```

2. Access the application:
- Frontend: http://localhost:8080
- Supabase Studio: http://127.0.0.1:54323
- Email testing: http://127.0.0.1:54324

## Working with Edge Functions

1. Create a new function:
```bash
supabase functions new my-function
```

2. Develop and test locally:
```bash
supabase functions serve
```

3. Deploy to Supabase:
```bash
supabase functions deploy my-function
```

## Testing

Run the test suite:
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## Code Quality

1. Lint code:
```bash
npm run lint
```

2. Format code:
```bash
npm run format
```

## Common Issues

### Database Connection Issues

If you can't connect to the local database:
1. Stop Supabase: `supabase stop`
2. Remove volumes: `docker volume prune`
3. Start fresh: `supabase start`

### Edge Function Errors

If functions fail to deploy:
1. Check Deno compatibility
2. Verify function naming
3. Check environment variables

### Auth Problems

For local auth issues:
1. Clear browser cookies/storage
2. Verify GoTrue is running
3. Check auth settings in Supabase Studio

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin
- Supabase

### Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```