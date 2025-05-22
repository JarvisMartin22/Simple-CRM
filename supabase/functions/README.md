# Supabase Edge Functions

This directory contains all Edge Functions used in the Golly CRM system.

## Available Functions

### Gmail Contacts Preview
- **Location**: `/deploy-functions`
- **Purpose**: Fetches and syncs Gmail contacts
- **Documentation**: [Gmail Contacts README](deploy-functions/README.md)

## Development

### Prerequisites
- Supabase CLI
- Deno runtime

### Local Development

1. Start the Supabase local development environment:
```bash
supabase start
```

2. Deploy functions locally:
```bash
supabase functions serve
```

### Deployment

Deploy a specific function:
```bash
supabase functions deploy <function-name>
```

Deploy all functions:
```bash
supabase functions deploy
```

### Environment Variables

Required environment variables for functions:

```bash
# Gmail Integration
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=https://your-domain.com/auth-callback.html

# Add other function-specific variables here
```

## Security

- All functions use JWT authentication
- OAuth2 flow is implemented for Gmail integration
- Sensitive data is handled securely through environment variables

## Testing

Test functions locally:
```bash
supabase functions serve --env-file ./supabase/.env.local
```

## Monitoring

View function logs:
```bash
supabase functions logs
``` 