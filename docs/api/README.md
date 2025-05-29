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
  "company_id": uuid,
  "domain": string
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

The Gmail integration uses OAuth2 for authentication and provides comprehensive email and contact management.

### Gmail OAuth Authentication

```typescript
// Initiate Gmail OAuth flow
GET /functions/v1/gmail-auth
// Returns auth URL for user authorization

// Exchange authorization code for tokens
POST /functions/v1/gmail-auth
{
  "code": string
}
// Response: { provider, provider_user_id, email, access_token, refresh_token, expires_at, scope }

// Refresh access token
POST /functions/v1/gmail-auth
{
  "refresh_token": string
}
// Response: { access_token, expires_at }
```

**Required Scopes:**
- `gmail.readonly` - Read email messages and metadata
- `gmail.send` - Send emails on behalf of user
- `contacts.readonly` - Read user's contacts
- `contacts.other.readonly` - Read "Other contacts"
- `userinfo.email` - Access user's email address
- `userinfo.profile` - Access user's profile information

### Email Sending

```typescript
// Send email through Gmail
POST /functions/v1/send-email
{
  "userId": uuid,
  "to": string,
  "subject": string,
  "body": string,          // HTML email body
  "trackOpens": boolean,   // Enable open tracking
  "trackClicks": boolean   // Enable click tracking
}
// Response: { emailId, trackingPixelId?, trackedLinks? }
```

**Features:**
- HTML email composition
- Automatic tracking pixel insertion
- Link click tracking with URL replacement
- Token refresh handling
- Email delivery confirmation

### Contacts Import

```typescript
// Import contacts from Gmail
POST /functions/v1/gmail-contacts
Headers: {
  "X-Gmail-Token": string,
  "Authorization": "Bearer {token}",
  "apikey": string
}
{
  "integration_id": uuid,
  "access_token": string,
  "refresh_token": string,
  "include_no_email": boolean
}
// Response: { contacts: Contact[], stats: ImportStats }

// Preview contacts before import
POST /functions/v1/gmail-contacts-preview
{
  "userId": uuid
}
// Response: { contacts: Contact[], total: number }
```

**Contact Sources:**
- Main contacts (saved contacts)
- Other contacts (people you've emailed)
- Directory contacts
- Domain contacts

**Contact Fields:**
- `firstName`, `lastName`
- `email`, `phone`
- `company`, `domain`
- `source` (gmail_contacts, gmail_other, etc.)
- `type` (person, organization)

### Email Sync and Metadata

```typescript
// Sync emails with Gmail
POST /functions/v1/gmail-sync
{
  "userId": uuid,
  "syncType": "pull" | "push",
  "forceSync": boolean
}
// Response: { syncedCount, errors?, lastSyncTime }

// Get email metadata (Direct Gmail API)
GET https://gmail.googleapis.com/gmail/v1/users/me/messages
Headers: {
  "Authorization": "Bearer {access_token}"
}
Query: {
  "maxResults": number,
  "q": string  // Gmail search query
}
```

### Email Tracking

```typescript
// Track email opens (pixel tracking)
GET /functions/v1/email-tracker?id={tracking_id}
// Returns 1x1 transparent pixel, records open event

// Track link clicks
GET /functions/v1/link-tracker?id={link_id}&url={original_url}
// Redirects to original URL, records click event

// Get tracking statistics
GET /rest/v1/email_tracking?user_id=eq.{userId}
// Returns: sent count, open count, click count, timestamps
```

### Potential Gmail Features (Available Scopes)

#### Gmail Labels Management
```typescript
// List Gmail labels (Direct Gmail API)
GET https://gmail.googleapis.com/gmail/v1/users/me/labels
Headers: { "Authorization": "Bearer {access_token}" }

// Create custom label
POST https://gmail.googleapis.com/gmail/v1/users/me/labels
{
  "name": string,
  "labelListVisibility": "labelShow" | "labelHide",
  "messageListVisibility": "show" | "hide"
}
```
**Scope:** `gmail.labels`

#### Enhanced Contact Data
```typescript
// Get user's phone numbers (Direct People API)
GET https://people.googleapis.com/v1/people/me?personFields=phoneNumbers,emailAddresses,names
Headers: { "Authorization": "Bearer {access_token}" }
```
**Scope:** `user.phonenumbers.read`

#### Email Modification
```typescript
// Modify email labels, archive, etc.
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}/modify
{
  "addLabelIds": string[],
  "removeLabelIds": string[]
}
```
**Scope:** `gmail.modify`

## Database Schema

### User Integrations
```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Email Tracking
```sql
CREATE TABLE email_tracking (
  id UUID PRIMARY KEY,
  email_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  recipient TEXT,
  subject TEXT,
  sent_at TIMESTAMPTZ,
  provider TEXT,
  tracking_pixel_id TEXT,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Recommended Schema Enhancements

1. **Enhanced Contact Data:**
```sql
ALTER TABLE contacts ADD COLUMN phone_numbers JSONB;
-- Store multiple phone numbers from Google People API
```

2. **Gmail Label Support:**
```sql
CREATE TABLE gmail_labels (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  gmail_label_id TEXT,
  name TEXT,
  color TEXT,
  created_at TIMESTAMPTZ
);

ALTER TABLE email_tracking ADD COLUMN gmail_label_ids TEXT[];
ALTER TABLE email_tracking ADD COLUMN gmail_thread_id TEXT;
```

3. **Sync Optimization:**
```sql
ALTER TABLE user_integrations ADD COLUMN last_sync_timestamp TIMESTAMPTZ;
ALTER TABLE user_integrations ADD COLUMN sync_settings JSONB;
```

## Testing

Use the `gmail-api-tester.html` file to comprehensively test all Gmail functionality:

1. Configure your Supabase URL and API key
2. Verify Gmail connection status
3. Test each endpoint individually
4. Run full integration tests
5. Analyze database schema compatibility
6. Export test results for troubleshooting

See [Gmail Integration Guide](../features/gmail-integration.md) for detailed setup instructions. 