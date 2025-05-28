# Campaign Management Testing Guide

This guide outlines the testing procedures for the campaign management system. Follow these steps to verify all functionality is working as expected.

## Prerequisites

1. **Environment Setup**
   - Supabase project configured
   - Email service connected (Gmail/SMTP)
   - Test contact list available
   - Test email account for receiving emails

2. **Required Access**
   - Admin access to Supabase dashboard
   - Access to email service dashboard
   - Test user account in the application

## Test Cases

### 1. Email Templates

#### Template Creation
1. Navigate to Templates section
2. Click "New Template"
3. Test form validation:
   - [ ] Submit without required fields
   - [ ] Submit with minimal required fields
   - [ ] Submit with all fields

#### Rich Text Editor
1. Test formatting options:
   - [ ] Bold, italic, underline
   - [ ] Lists (ordered and unordered)
   - [ ] Text alignment
   - [ ] Links
   - [ ] Variable insertion

#### Variable Handling
1. Insert all available variables:
   - [ ] {{contact.first_name}}
   - [ ] {{contact.last_name}}
   - [ ] {{contact.email}}
   - [ ] {{contact.company}}
   - [ ] {{user.first_name}}
   - [ ] {{user.last_name}}
   - [ ] {{user.email}}
   - [ ] {{user.company}}

#### Preview Functionality
1. Test desktop preview:
   - [ ] Layout renders correctly
   - [ ] Variables are replaced with sample data
   - [ ] Links are clickable
   - [ ] Images load properly

2. Test mobile preview:
   - [ ] Responsive layout works
   - [ ] Content is readable
   - [ ] No horizontal scrolling
   - [ ] Touch targets are adequate size

3. Test spam score:
   - [ ] Score calculation works
   - [ ] Issues are listed
   - [ ] Different content affects score
   - [ ] Recommendations are provided

4. Test link validation:
   - [ ] Valid links are verified
   - [ ] Invalid links are detected
   - [ ] Error messages are clear
   - [ ] Multiple links handled correctly

5. Test email sending:
   - [ ] Test email can be sent
   - [ ] Variables are correctly replaced
   - [ ] Tracking pixels work
   - [ ] Link tracking works

### 2. Campaign Creation

#### Basic Campaign Setup
1. Create new campaign:
   - [ ] Name and description required
   - [ ] Template selection works
   - [ ] Recipient segment selection
   - [ ] Schedule setting functions

#### Campaign Preview
1. Test preview functionality:
   - [ ] Template renders correctly
   - [ ] Sample data shows properly
   - [ ] Mobile view available
   - [ ] Send test email works

#### Campaign Scheduling
1. Test scheduling options:
   - [ ] Immediate sending
   - [ ] Future scheduling
   - [ ] Timezone handling
   - [ ] Schedule modification

### 3. Analytics Testing

#### Dashboard Metrics
1. Verify metrics display:
   - [ ] Sent count
   - [ ] Delivered count
   - [ ] Open rate
   - [ ] Click rate
   - [ ] Bounce rate
   - [ ] Complaint rate

#### Engagement Charts
1. Test chart functionality:
   - [ ] Data loads correctly
   - [ ] Time periods filter works
   - [ ] Hover tooltips work
   - [ ] Legend is accurate

#### Recipient Analytics
1. Check recipient table:
   - [ ] All recipients listed
   - [ ] Status updates real-time
   - [ ] Filtering works
   - [ ] Search functions

#### Link Tracking
1. Verify link analytics:
   - [ ] Click counts accurate
   - [ ] Unique clicks tracked
   - [ ] Time of clicks recorded
   - [ ] Link destinations correct

### 4. Error Handling

#### Form Validation
1. Test input validation:
   - [ ] Required fields
   - [ ] Email format
   - [ ] Date format
   - [ ] Character limits

#### API Errors
1. Test error scenarios:
   - [ ] Network disconnection
   - [ ] Invalid API responses
   - [ ] Rate limiting
   - [ ] Authentication errors

#### Edge Cases
1. Test boundary conditions:
   - [ ] Large recipient lists
   - [ ] Long email content
   - [ ] Many variables
   - [ ] Multiple concurrent campaigns

### 5. Performance Testing

#### Load Testing
1. Test with varying loads:
   - [ ] Multiple templates
   - [ ] Large recipient lists
   - [ ] Concurrent preview requests
   - [ ] Bulk analytics loading

#### Response Times
1. Measure response times:
   - [ ] Template loading
   - [ ] Preview generation
   - [ ] Analytics updates
   - [ ] Search operations

## Bug Reporting Template

When reporting issues, use this format:

```markdown
### Bug Description
[Clear description of the issue]

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser:
- OS:
- Screen size:
- User role:

### Additional Context
[Screenshots, error messages, etc.]
```

## Testing Notes

1. **Cross-browser Testing**
   - Test in Chrome, Firefox, Safari
   - Test in mobile browsers
   - Check responsive behavior

2. **Performance Considerations**
   - Monitor memory usage
   - Check network requests
   - Verify caching behavior

3. **Security Testing**
   - Verify authentication
   - Check authorization
   - Test data validation
   - Monitor API access

4. **Accessibility Testing**
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast
   - ARIA attributes

## Common Issues

1. **Template Preview**
   - Cache clearing may be needed
   - Variable replacement might be delayed
   - Mobile preview might need refresh

2. **Analytics**
   - Real-time updates may have delay
   - Large datasets might need pagination
   - Export might timeout for big data

3. **Email Sending**
   - SMTP configuration issues
   - Rate limiting
   - Bounce handling
   - Spam folder delivery

## Test Environment Setup

```bash
# Clone repository
git clone [repository-url]
cd Simple-CRM

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your test credentials

# Start development server
npm run dev

# Run test suite
npm test
```

## Deployment Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] Performance metrics acceptable
- [ ] Security scan completed
- [ ] Accessibility requirements met
- [ ] Documentation updated
- [ ] Backup procedures verified
- [ ] Monitoring tools configured 