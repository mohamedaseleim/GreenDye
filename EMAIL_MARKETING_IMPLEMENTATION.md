# Email Marketing Feature Implementation

## Overview
This document describes the email marketing feature added to the GreenDye Academy admin dashboard, providing comprehensive email campaign and newsletter management capabilities.

## Features Implemented

### 1. Email Campaigns
- **Bulk Email to Users**: Send targeted emails to specific user groups
- **Recipient Filtering**: Select recipients by role (all users, students only, trainers only, admins only, or custom selection)
- **Campaign Management**: Create, edit, delete, and track email campaigns
- **Campaign Status Tracking**: Monitor campaigns through different states (draft, scheduled, sending, sent, failed)
- **Campaign Analytics**: Track total recipients, successful sends, failed sends, and success rates

### 2. Newsletter Management
- **Newsletter Creation**: Create and manage newsletters for regular updates
- **Publishing Workflow**: Draft, edit, and publish newsletters to all active users
- **Subscriber Management**: Automatically sends to all active users in the system
- **Newsletter Analytics**: Track total subscribers, sent count, open rates, and click rates

### 3. Campaign Tracking
- **Success/Failure Tracking**: Monitor which emails were successfully delivered and which failed
- **Statistics Dashboard**: View comprehensive statistics including:
  - Total campaigns created
  - Campaigns sent, in draft, or failed
  - Total newsletters published
  - Total emails sent (campaigns + newsletters)
  - Failed email count

## Technical Implementation

### Backend Components

#### Models
1. **EmailCampaign** (`backend/models/EmailCampaign.js`)
   - Stores campaign details (name, subject, content)
   - Recipient type and custom recipient list
   - Status tracking (draft, scheduled, sending, sent, failed)
   - Analytics fields (totalRecipients, successfulSends, failedSends, openRate, clickRate)

2. **EmailNewsletter** (`backend/models/EmailNewsletter.js`)
   - Newsletter metadata (title, subject, content)
   - Publishing workflow status
   - Subscriber and delivery tracking
   - Performance metrics

#### Services
**emailService** (`backend/services/emailService.js`)
- `sendEmail()`: Send individual emails
- `sendBulkEmails()`: Send emails to multiple recipients with error handling
- `sendNewsletter()`: Specialized newsletter sending function
- `createEmailTemplate()`: Generate HTML email templates with branding

#### Controllers
**adminEmailMarketingController** (`backend/controllers/adminEmailMarketingController.js`)
- Campaign CRUD operations
- Newsletter CRUD operations
- Campaign sending logic
- Newsletter publishing logic
- Statistics aggregation

#### Routes
**adminEmailMarketingRoutes** (`backend/routes/adminEmailMarketingRoutes.js`)
- `/api/admin/email-marketing/stats` - Get dashboard statistics
- `/api/admin/email-marketing/campaigns` - Campaign management endpoints
- `/api/admin/email-marketing/campaigns/:id/send` - Send campaign
- `/api/admin/email-marketing/campaigns/:id/stats` - Campaign statistics
- `/api/admin/email-marketing/newsletters` - Newsletter management endpoints
- `/api/admin/email-marketing/newsletters/:id/publish` - Publish newsletter

### Frontend Components

#### Pages
**AdminEmailMarketing** (`frontend/src/pages/AdminEmailMarketing.js`)
- Three-tab interface: Overview, Campaigns, Newsletters
- Statistics dashboard showing key metrics
- Campaign table with create, edit, delete, and send actions
- Newsletter table with create, edit, delete, and publish actions
- Dialog forms for creating/editing campaigns and newsletters
- View dialogs to preview email content
- Delete confirmation dialogs

#### Services
**adminService** (`frontend/src/services/adminService.js`)
- Extended with email marketing API methods:
  - `getEmailMarketingStats()`
  - Campaign methods: `getAllCampaigns()`, `getCampaign()`, `createCampaign()`, `updateCampaign()`, `deleteCampaign()`, `sendCampaign()`, `getCampaignStats()`
  - Newsletter methods: `getAllNewsletters()`, `getNewsletter()`, `createNewsletter()`, `updateNewsletter()`, `deleteNewsletter()`, `publishNewsletter()`

#### Integration
- Added "Email Marketing" tab to Admin Dashboard
- Added route `/admin/email-marketing` in App.js
- Integrated with existing authentication and authorization middleware

## Usage

### Creating a Campaign
1. Navigate to Admin Dashboard → Email Marketing tab
2. Click "Create Campaign" or "New Campaign" button
3. Fill in campaign details:
   - Campaign Name
   - Email Subject
   - Email Content (supports {name} and {email} placeholders)
   - Recipient Type (all users, students, trainers, admins)
4. Save as draft or send immediately

### Sending a Campaign
1. Find the campaign in the campaigns list
2. Click the "Send" icon (paper plane)
3. Confirm the action
4. System will send emails to all recipients matching the criteria
5. View results showing successful and failed sends

### Creating and Publishing a Newsletter
1. Navigate to Email Marketing → Newsletters tab
2. Click "New Newsletter" button
3. Fill in newsletter details:
   - Newsletter Title
   - Email Subject
   - Newsletter Content (supports {name} and {email} placeholders)
4. Save as draft or publish immediately
5. Publishing sends to all active users

### Viewing Statistics
- Overview tab shows comprehensive statistics
- Campaign statistics include success rate
- Newsletter statistics show subscriber and delivery metrics

## Email Template
All emails are sent using a professional HTML template with:
- GreenDye Academy branding
- Responsive design
- Consistent header and footer
- Professional styling

## Security Considerations
- All email marketing routes are protected by admin authentication
- Only admins can access email marketing features
- Email sending is rate-limited through SMTP configuration
- User data is sanitized before sending
- Recipient selection is validated server-side

## Environment Variables Required
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
FROM_NAME=GreenDye Academy
FROM_EMAIL=noreply@greendye.com
```

## Future Enhancements
Potential improvements for future versions:
1. Email template builder with drag-and-drop interface
2. A/B testing for campaigns
3. Advanced analytics (open tracking, click tracking)
4. Scheduled campaigns (send at specific date/time)
5. Email preview before sending
6. Subscriber list management
7. Unsubscribe functionality
8. Campaign cloning
9. Email attachment support
10. Rich text editor with image upload

## API Endpoints Summary

### Campaign Endpoints
- `GET /api/admin/email-marketing/campaigns` - List all campaigns
- `GET /api/admin/email-marketing/campaigns/:id` - Get single campaign
- `POST /api/admin/email-marketing/campaigns` - Create campaign
- `PUT /api/admin/email-marketing/campaigns/:id` - Update campaign
- `DELETE /api/admin/email-marketing/campaigns/:id` - Delete campaign
- `POST /api/admin/email-marketing/campaigns/:id/send` - Send campaign
- `GET /api/admin/email-marketing/campaigns/:id/stats` - Get campaign stats

### Newsletter Endpoints
- `GET /api/admin/email-marketing/newsletters` - List all newsletters
- `GET /api/admin/email-marketing/newsletters/:id` - Get single newsletter
- `POST /api/admin/email-marketing/newsletters` - Create newsletter
- `PUT /api/admin/email-marketing/newsletters/:id` - Update newsletter
- `DELETE /api/admin/email-marketing/newsletters/:id` - Delete newsletter
- `POST /api/admin/email-marketing/newsletters/:id/publish` - Publish newsletter

### Statistics Endpoint
- `GET /api/admin/email-marketing/stats` - Get email marketing dashboard statistics

## Testing
To test the email marketing feature:
1. Ensure SMTP configuration is set up in environment variables
2. Log in as an admin user
3. Navigate to Admin Dashboard → Email Marketing
4. Create a test campaign targeting yourself
5. Send the campaign and verify email delivery
6. Check campaign statistics for delivery confirmation

## Support
For issues or questions regarding the email marketing feature, please refer to the main project documentation or contact the development team.
