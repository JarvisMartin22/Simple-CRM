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

**Quick Gmail Setup:**
1. Deploy functions: `supabase functions deploy gmail-auth --project-ref your-project-ref`
2. Set environment variables in Supabase dashboard
3. Run on port 8080: `npm run dev -- --port 8080`
4. Expected clean output: `✅ Gmail connected successfully: your-email@gmail.com`

## Initial Setup

1. Clone the repository:
```