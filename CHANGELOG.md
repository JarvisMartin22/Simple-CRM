# Changelog

All notable changes to Golly CRM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-06-02 - Enhanced Email Tracking

### Added
- **Multi-pixel email tracking system**
  - Track email opens with re-open detection
  - Section-level tracking to see which parts of emails are viewed
  - Forward detection based on IP/location changes
  - Privacy-compliant IP hashing and metadata collection
- **New Edge Functions**
  - `send-email-enhanced` - Advanced email sending with multi-pixel tracking
  - Enhanced `email-tracker` - Supports multiple event types (open, reopen, section)
- **Database Enhancements**
  - `track_email_event` function for flexible event tracking
  - `campaign_engagement_details` view for detailed analytics
  - New columns: `tracking_type`, `section_id`, `interaction_sequence`
- **Frontend Components**
  - `EnhancedTemplateEditor` - Section-based email template builder
  - Real-time campaign analytics from database
- **Comprehensive Documentation**
  - Email tracking feature guide
  - Setup instructions for tracking system
  - Updated API documentation

### Changed
- Email sending now uses `send-email-enhanced` function
- Campaign fetching properly joins analytics data
- Tracking pixels no longer use `display:none` for better compatibility
- Improved error handling in edge functions
- Updated documentation structure

### Fixed
- Campaign analytics now display correct sent, opened, and clicked counts
- Email tracking pixel correctly records open events
- Fixed type mismatch in tracking function (UUID to text conversion)
- Fixed relationship error between campaigns and campaign_analytics tables
- Gmail contacts preview function handling of different contact categories
- OAuth2 flow for Gmail integration

## [0.2.0] - 2024-03-20

### Added
- Deal pipeline management
- Custom fields for contacts
- Tag system for contacts and companies
- Basic email tracking

### Changed
- Improved contact management UI
- Enhanced company profile pages
- Updated database schema for better performance

### Fixed
- Contact import validation
- Company domain uniqueness checks
- Deal stage ordering issues

## [0.1.0] - 2024-02-15

### Added
- Initial release
- Basic contact management
- Company tracking
- Simple email integration
- User authentication
- Basic dashboard

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)

[Unreleased]: https://github.com/yourusername/golly-crm/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/yourusername/golly-crm/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/golly-crm/releases/tag/v0.1.0 