# Admin Dashboard Features Documentation

This document describes the complete implementation of the admin dashboard features in GreenDye Academy.

## Overview

The admin dashboard provides comprehensive tools for managing content, moderating user-generated content, monitoring system activity, and controlling access. All features are protected by role-based access control and log actions for audit purposes.

## Features

### 1. Media Management

**Endpoints:**
- `POST /api/admin/cms/media/upload` - Upload one or multiple media files
- `GET /api/admin/cms/media` - Get all media with filtering and pagination
- `GET /api/admin/cms/media/:id` - Get specific media item
- `PUT /api/admin/cms/media/:id` - Update media metadata
- `DELETE /api/admin/cms/media/:id` - Delete media file

**Features:**
- **Upload**: Support for images, videos, and documents up to 50MB
- **Organization**: Media organized by categories (course, page, certificate, avatar, general)
- **Tag-Based Search**: Media can be tagged and searched by tags
- **Filtering**: Filter by type (image/video/document), category, and search by name or tags
- **Metadata**: Store and manage titles, descriptions, alt text in multiple languages
- **Usage Tracking**: Track how many times media is used

**Example Usage:**
```bash
# Upload media files
curl -X POST http://localhost:5000/api/admin/cms/media/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "category=course"

# Search media by tags
curl "http://localhost:5000/api/admin/cms/media?search=tutorial&type=video" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update media metadata
curl -X PUT http://localhost:5000/api/admin/cms/media/:id \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["tutorial", "beginner", "introduction"],
    "category": "course",
    "title": {"en": "Introduction Tutorial"},
    "description": {"en": "A beginner-friendly tutorial"}
  }'
```

### 2. Announcement Management

**Endpoints:**
- `POST /api/admin/cms/announcements` - Create new announcement
- `GET /api/admin/cms/announcements` - Get all announcements with filtering
- `PUT /api/admin/cms/announcements/:id` - Update announcement
- `DELETE /api/admin/cms/announcements/:id` - Delete announcement

**Features:**
- **Types**: Info, warning, success, error, maintenance
- **Priority Levels**: Low, medium, high, urgent
- **Target Audience**: All users, students, trainers, or admins
- **Status Management**: Draft, active, scheduled, expired
- **Scheduling**: Set start and end dates for announcements
- **Display Control**: Choose which pages to show announcements on
- **Multi-language**: Support for English, Arabic, and French content

**Example Usage:**
```bash
# Create announcement
curl -X POST http://localhost:5000/api/admin/cms/announcements \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": {
      "en": "System Maintenance",
      "ar": "صيانة النظام"
    },
    "content": {
      "en": "The system will be under maintenance on Sunday",
      "ar": "سيكون النظام قيد الصيانة يوم الأحد"
    },
    "type": "maintenance",
    "priority": "high",
    "status": "scheduled",
    "targetAudience": ["all"],
    "startDate": "2024-11-10T00:00:00Z",
    "endDate": "2024-11-10T06:00:00Z"
  }'

# Filter by status
curl "http://localhost:5000/api/admin/cms/announcements?status=active&priority=high" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Content Moderation (Forum Posts)

**Endpoints:**
- `GET /api/admin/cms/moderation/forums` - Get forum posts for moderation
- `PUT /api/admin/cms/moderation/forums/:id` - Approve/reject forum post

**Features:**
- **Status Management**: Pending, approved, rejected
- **Moderation Queue**: View all pending posts
- **Reason Tracking**: Add reason when rejecting content
- **Moderator Tracking**: Record who moderated and when
- **Audit Logging**: All moderation actions are logged

**Forum Post States:**
- `pending` - Awaiting moderation (if enabled)
- `approved` - Approved by moderator
- `rejected` - Rejected by moderator with reason

**Example Usage:**
```bash
# Get pending posts
curl "http://localhost:5000/api/admin/cms/moderation/forums?status=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Approve post
curl -X PUT http://localhost:5000/api/admin/cms/moderation/forums/:id \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'

# Reject post with reason
curl -X PUT http://localhost:5000/api/admin/cms/moderation/forums/:id \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "reason": "Contains inappropriate content"
  }'
```

### 4. Role-Based Access Control (RBAC)

**Implementation:**
- Middleware: `protect` (authentication) + `authorize('admin')` (authorization)
- All admin routes are protected with both middleware layers
- Non-admin users receive 403 Forbidden responses
- Unauthenticated users receive 401 Unauthorized responses

**User Roles:**
- `student` - Regular learners (no admin access)
- `trainer` - Course instructors (no admin access)
- `admin` - Full system administration access

**Protected Routes:**
All routes under `/api/admin/*` are protected:
- `/api/admin/cms/*` - Content management
- `/api/admin/certificates/*` - Certificate management
- `/api/admin/courses/*` - Course administration
- `/api/admin/trainers/*` - Trainer management
- `/api/admin/payments/*` - Payment management
- `/api/admin/enrollments/*` - Enrollment management
- `/api/admin/reviews/*` - Review management
- `/api/admin/settings/*` - System settings
- `/api/admin/security/*` - Security management

**Example:**
```javascript
// In route file
router.use(protect);           // Require authentication
router.use(authorize('admin')); // Require admin role

// This applies to all routes defined after these middleware
router.get('/stats', getDashboardStats);
```

### 5. Audit Trail Logging

**Endpoints:**
- `GET /api/admin/cms/audit-trail` - View all audit logs with filtering
- `GET /api/admin/cms/audit-trail/resource/:resourceType/:resourceId` - View audit logs for specific resource

**Features:**
- **Comprehensive Logging**: All admin actions are automatically logged
- **Filtering**: Filter by action, resource type, user, and date range
- **Pagination**: Paginated results for large audit logs
- **Resource Tracking**: View complete history for any resource
- **Metadata**: Store additional context with each log entry
- **IP Tracking**: Record IP address of each action

**Logged Actions:**
- `create` - Resource creation
- `update` - Resource modification
- `delete` - Resource deletion
- `upload` - File upload
- `publish` - Content publishing
- `moderate` - Content moderation

**Example Usage:**
```bash
# View all audit logs
curl "http://localhost:5000/api/admin/cms/audit-trail?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by action
curl "http://localhost:5000/api/admin/cms/audit-trail?action=delete" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by date range
curl "http://localhost:5000/api/admin/cms/audit-trail?startDate=2024-11-01&endDate=2024-11-30" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# View audit trail for specific media
curl "http://localhost:5000/api/admin/cms/audit-trail/resource/Media/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 6. Dashboard Statistics

**Endpoint:**
- `GET /api/admin/cms/stats` - Get comprehensive dashboard statistics

**Metrics Provided:**
- **Pages**: Total, published, draft counts
- **Media**: Total media count
- **Announcements**: Active announcement count
- **Courses**: Total course count
- **Moderation**: Pending forum posts count
- **Users**: Total, students, trainers, admins counts

**Example Response:**
```json
{
  "success": true,
  "data": {
    "pages": {
      "total": 45,
      "published": 38,
      "draft": 7
    },
    "media": {
      "total": 523
    },
    "announcements": {
      "active": 3
    },
    "courses": {
      "total": 28
    },
    "moderation": {
      "pendingForums": 12
    },
    "users": {
      "total": 1247,
      "students": 1180,
      "trainers": 65,
      "admins": 2
    }
  }
}
```

## Security Features

### Input Sanitization
All user inputs are sanitized using `mongo-sanitize` to prevent:
- MongoDB injection attacks
- NoSQL operator injection
- Malicious query manipulation

### Regex Injection Prevention
Search queries escape special regex characters to prevent regex injection attacks.

### File Upload Security
- File type validation (only allowed types)
- File size limits (50MB maximum)
- Secure file naming with UUIDs
- Organized storage in category-specific directories

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Token expiration
- Inactive user account protection

### Audit Logging
- All admin actions are logged
- IP address tracking
- Timestamp recording
- User identification

## Database Indexes

Optimized queries with indexes on:

**Media Model:**
- `type` and `category` (compound)
- `uploadedBy`
- `tags`
- `createdAt`

**Announcement Model:**
- `status`, `startDate`, `endDate` (compound)
- `targetAudience`
- `priority`

**Forum Model:**
- `course` and `createdAt` (compound)
- `author` and `createdAt` (compound)
- `category` and `createdAt` (compound)
- `isPinned` and `lastActivityAt` (compound)
- `status` and `createdAt` (compound)

**AuditTrail Model:**
- `user` and `timestamp` (compound)
- `resourceType` and `resourceId` (compound)
- `action` and `timestamp` (compound)
- Individual indexes on `user`, `action`, `resourceType`, `resourceId`, `timestamp`

## Testing

Comprehensive test suite in `__tests__/adminDashboard.test.js` covering:
- Media management (upload, organize, tag-based search)
- Announcement CRUD operations
- Content moderation workflow
- Role-based access control
- Audit trail logging and retrieval
- Dashboard statistics

Run tests with:
```bash
cd backend
npm test -- adminDashboard.test.js
```

## API Response Format

All endpoints follow a consistent response format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [ /* array of items */ ]
}
```

## Configuration

Required environment variables:
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRE` - Token expiration time (e.g., '30d')
- `MONGO_URI` - MongoDB connection string
- `FRONTEND_URL` - Frontend application URL for CORS

## Future Enhancements

Potential improvements:
1. Bulk operations for media and announcements
2. Advanced search with multiple filters
3. Export audit logs to CSV/PDF
4. Real-time moderation notifications
5. Automated content moderation using ML
6. Media CDN integration
7. Announcement templates
8. Scheduled media deletion for unused files
9. Advanced analytics dashboard
10. Multi-admin approval workflow

## Support

For issues or questions regarding admin dashboard features:
1. Check this documentation
2. Review the test suite for usage examples
3. Check audit logs for action history
4. Contact system administrators
