# Supabase Setup and Documentation

This directory contains the Supabase configuration and database migrations for the Simple CRM system.

## Table of Contents
- [Local Development Setup](#local-development-setup)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Row Level Security](#row-level-security)
- [Migrations](#migrations)

## Local Development Setup

### Prerequisites
- Docker Desktop
- Supabase CLI (`brew install supabase/tap/supabase`)
- Node.js 16+

### Getting Started

1. Start Supabase locally:
```bash
supabase start
```

2. Access local endpoints:
- Studio Dashboard: http://127.0.0.1:54323
- API URL: http://127.0.0.1:54321
- DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Email Testing: http://127.0.0.1:54324 (Inbucket)

### Environment Variables
Add these to your `.env` file:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Schema

### Core Tables

#### Companies
- Primary business entities
- Fields: name, industry, domain, website, size, description, logo_url
- Unique constraint on (user_id, domain)

#### Contacts
- Individual contacts associated with companies
- Fields: first_name, last_name, email, phone, linkedin, company_id
- Unique constraint on (user_id, email)

#### Tags
- Categorization for contacts and companies
- Fields: name, color, entity_type
- Unique constraint on (user_id, name, entity_type)

#### Custom Fields
- Dynamic fields for contacts
- Types: text, number, date, boolean

### Email Integration Tables

#### Email Tracking
- Track email interactions
- Fields: email_id, recipient, subject, sent_at, opened_at, replied_at

#### Email Events
- Detailed email interaction events
- Fields: event_type, recipient, subject, url, user_agent, ip_address

#### Email Stats
- Aggregated email statistics
- Fields: total_sent, replies, response_rate, linked_deals, revenue

### Activity Tables

#### Contact Activities
- Timeline of contact interactions
- Fields: activity_type, title, description, email_id

#### Contact Employment History
- Track contact job history
- Fields: company_id, title, start_date, end_date, is_current

## Authentication

### User Management
- Built-in auth system via Supabase Auth
- JWT-based authentication
- Email verification enabled

### Example Authentication Flow

1. Sign Up:
```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
-H "apikey: your_anon_key" \
-H "Content-Type: application/json" \
-d '{"email": "user@example.com", "password": "password"}'
```

2. Sign In:
```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
-H "apikey: your_anon_key" \
-H "Content-Type: application/json" \
-d '{"email": "user@example.com", "password": "password"}'
```

## API Endpoints

### Companies
- GET `/rest/v1/companies` - List companies
- POST `/rest/v1/companies` - Create company
- PATCH `/rest/v1/companies?id=eq.{id}` - Update company
- DELETE `/rest/v1/companies?id=eq.{id}` - Delete company

### Contacts
- GET `/rest/v1/contacts` - List contacts
- POST `/rest/v1/contacts` - Create contact
- PATCH `/rest/v1/contacts?id=eq.{id}` - Update contact
- DELETE `/rest/v1/contacts?id=eq.{id}` - Delete contact

### Example API Request:
```bash
# Create a company
curl -X POST 'http://127.0.0.1:54321/rest/v1/companies' \
-H "apikey: your_anon_key" \
-H "Authorization: Bearer user_jwt_token" \
-H "Content-Type: application/json" \
-d '{"name": "Test Company", "industry": "Technology"}'
```

## Row Level Security

All tables are protected by Row Level Security (RLS) policies:

### Policy Pattern
- SELECT: Users can only view their own data
- INSERT: Users can only create data they own
- UPDATE: Users can only modify their own data
- DELETE: Users can only delete their own data

Example policy:
```sql
CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);
```

## Migrations

### Migration Files
- `20240325000000_contacts_companies_schema.sql` - Core tables
- `20240326000000_create_crm_tables.sql` - Additional tables
- `20240517000000_gmail_tracking_tables.sql` - Email tracking
- `20240530000001_add_full_name_to_contacts.sql` - Schema updates
- `20240530000002_create_user_integrations_table.sql` - Integrations

### Running Migrations
```bash
# Reset database and run all migrations
supabase db reset

# Apply new migrations
supabase db push
```

## Performance Optimizations

### Indexes
- Foreign key indexes
- Search indexes on frequently queried fields
- Composite indexes for unique constraints

### Example Indexes:
```sql
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_companies_domain ON companies(domain);
```

## Troubleshooting

### Common Issues

1. Container startup issues:
```bash
# Stop all containers
supabase stop

# Remove existing volumes
docker volume prune

# Start fresh
supabase start
```

2. Migration conflicts:
```bash
# Reset database
supabase db reset

# Check migration status
supabase db status
```

3. Authentication issues:
- Verify JWT token expiration
- Check RLS policies
- Confirm user_id in requests

### Logs
```bash
# View service logs
supabase logs

# View specific service logs
supabase logs storage
supabase logs auth
supabase logs database
``` 