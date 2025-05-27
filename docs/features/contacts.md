# Contacts

The contacts feature in Simple-CRM allows users to manage their contacts effectively, with support for various import methods and contact types.

## Overview

The contacts system supports:
- Manual contact entry
- CSV file import
- Gmail contacts import (both main and other contacts)
- Contact categorization (main/other)
- Duplicate detection and handling

## Contact Types

Contacts are categorized into two types:
- **Main Contacts**: Primary business contacts
- **Other Contacts**: Secondary or personal contacts from Gmail

## Gmail Import Feature

### Import Process
1. **Authentication**: Users authenticate with their Gmail account
2. **Contact Selection**: Users can:
   - Select individual contacts
   - Use "Select All" for bulk selection
   - Filter contacts based on preferences

### Import Options
- **Name Filter**: Only import contacts with names
- **Email Filter**: Exclude no-reply and automated emails
- **Duplicate Handling**: Automatically detects and skips existing contacts

### Progress Tracking
The import process provides real-time feedback:
- Progress percentage
- Number of contacts processed
- Success/skip/failure counts

## Contact Data Structure

Each contact contains the following information:
```typescript
interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  website: string;
  source: string;
  tags: string[];
  type: 'main' | 'other';
}
```

### Company Detection
For Gmail imports, company names are automatically extracted from email domains:
- Extracts domain from email address
- Excludes common email providers (Gmail, Outlook, etc.)
- Uses the domain name before the TLD as the company name

## UI Components

### Contact Review Table
- Responsive table layout
- Truncated fields with tooltips for long content
- Regular font weight for better readability
- Column width optimization for better display

### Import Progress
- Real-time progress bar
- Status indicators for:
  - Successfully imported contacts
  - Skipped duplicates
  - Failed imports

## Best Practices

1. **Duplicate Prevention**
   - Use email addresses as unique identifiers
   - Automatically skip existing contacts
   - Show skip count in import progress

2. **Data Validation**
   - Validate email formats
   - Ensure required fields are present
   - Handle missing data gracefully

3. **Performance**
   - Batch processing for large imports
   - Progress tracking for user feedback
   - Optimized table rendering for large datasets

## Future Enhancements

Planned improvements include:
- Advanced filtering options
- Bulk actions for contact management
- Enhanced company detection
- Custom field support
- Contact merging capabilities 