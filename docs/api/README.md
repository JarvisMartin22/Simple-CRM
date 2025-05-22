# Golly CRM API Documentation

This directory contains detailed API documentation for Golly CRM's endpoints and integrations.

## API Endpoints

### Authentication

All API requests must include:
- `apikey` header with your Supabase anon key
- `Authorization` header with a valid JWT token

### Companies

```typescript
// List companies
GET /rest/v1/companies

// Create company
POST /rest/v1/companies
{
  "name": string,
  "industry": string,
  "domain": string,
  "website": string,
  "size": number,
  "description": string,
  "logo_url": string
}

// Update company
PATCH /rest/v1/companies?id=eq.{id}

// Delete company
DELETE /rest/v1/companies?id=eq.{id}
```

### Contacts

```typescript
// List contacts
GET /rest/v1/contacts

// Create contact
POST /rest/v1/contacts
{
  "first_name": string,
  "last_name": string,
  "email": string,
  "phone": string,
  "linkedin": string,
  "company_id": uuid
}

// Update contact
PATCH /rest/v1/contacts?id=eq.{id}

// Delete contact
DELETE /rest/v1/contacts?id=eq.{id}
```

### Deals

```typescript
// List deals
GET /rest/v1/deals

// Create deal
POST /rest/v1/deals
{
  "contact_id": uuid,
  "pipeline_id": uuid,
  "stage_id": uuid,
  "value": number,
  "status": string,
  "close_date": string,
  "probability": number,
  "notes": string
}

// Update deal
PATCH /rest/v1/deals?id=eq.{id}

// Delete deal
DELETE /rest/v1/deals?id=eq.{id}
```

## Gmail Integration

The Gmail integration uses OAuth2 for authentication and provides endpoints for:
- Contact syncing
- Email tracking
- Email campaign management

See [Gmail Integration Guide](../features/gmail-integration.md) for detailed setup instructions. 