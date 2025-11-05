# User Management Features - Admin Dashboard

## Overview
This document describes the comprehensive user management features added to the GreenDye Academy admin dashboard.

## Features

### 1. View and Manage All Users
- **Endpoint**: `GET /api/users`
- **Features**:
  - Paginated list of all users (students, trainers, admins)
  - Advanced filtering by role, status, and active state
  - Search by name or email
  - Sortable columns
  - Displays user information: name, email, role, status, creation date

### 2. Edit User Profiles and Roles
- **Endpoint**: `PUT /api/users/:id`
- **Features**:
  - Update user information (name, email, role, status)
  - Change user roles (student, trainer, admin)
  - Modify user status (active, inactive, suspended)
  - Input validation to ensure data integrity

### 3. Suspend/Ban Users
- **Endpoint**: `PUT /api/users/:id/suspend`
- **Features**:
  - Suspend user accounts with reason tracking
  - Automatically sets user status to 'suspended' and isActive to false
  - Records suspension reason in audit trail
  - Can be reversed using the activate endpoint

### 4. Activate Users
- **Endpoint**: `PUT /api/users/:id/activate`
- **Features**:
  - Reactivate suspended users
  - Sets user status to 'active' and isActive to true
  - Records activation in audit trail

### 5. View User Activity Logs
- **Endpoint**: `GET /api/users/:id/activity`
- **Features**:
  - View complete history of user actions
  - Paginated activity logs
  - Shows action type, details, timestamp, and IP address
  - Useful for compliance and debugging

### 6. Reset User Passwords
- **Endpoint**: `POST /api/users/:id/reset-password`
- **Features**:
  - Admin can reset any user's password
  - Enforces minimum password length (6 characters)
  - Records password reset in audit trail
  - Automatically hashes new password before saving

### 7. Bulk User Operations
#### Bulk Update
- **Endpoint**: `POST /api/users/bulk-update`
- **Features**:
  - Update multiple users simultaneously
  - Supports updating status, role, and other non-sensitive fields
  - Prevents updating sensitive fields (password, email) in bulk
  - Records bulk operation in audit trail

#### Bulk Delete
- **Endpoint**: `POST /api/users/bulk-delete`
- **Features**:
  - Delete multiple users at once
  - Safety measure: prevents bulk deletion of admin users
  - Records bulk deletion in audit trail
  - Requires explicit user ID list

### 8. User Statistics
- **Endpoint**: `GET /api/admin/cms/stats`
- **Enhanced with**:
  - Total user count
  - Breakdown by role (students, trainers, admins)
  - Displayed on admin dashboard overview

## User Interface

### Admin Users Page (`/admin/users`)
The frontend provides a comprehensive user management interface:

#### Filters
- Search by name or email
- Filter by role (student, trainer, admin)
- Filter by status (active, inactive, suspended)
- Filter by active state

#### Actions Per User
- **Edit**: Modify user details and role
- **Suspend**: Suspend user account
- **Activate**: Reactivate suspended user
- **Reset Password**: Set new password for user
- **View Activity**: See user's activity history
- **Delete**: Remove user from system

#### Bulk Actions
- Select multiple users with checkboxes
- Bulk delete selected users
- Bulk suspend selected users
- Bulk update user properties

#### Dialogs
- **Edit Dialog**: Form to update user information
- **Reset Password Dialog**: Secure password reset form
- **Activity Dialog**: Table showing user activity logs
- **Bulk Action Dialog**: Confirmation for bulk operations

## Security Features

### Authentication & Authorization
- All endpoints require authentication (JWT token)
- All endpoints require admin role
- Non-admin users receive 403 Forbidden

### Audit Trail
- All admin actions are logged to AuditTrail collection
- Logs include: user ID, action type, target user, details, IP address, timestamp
- Provides accountability and compliance trail

### Input Validation
- Password minimum length: 6 characters
- Email format validation
- Role validation (student, trainer, admin only)
- Status validation (active, inactive, suspended only)

### NoSQL Injection Prevention
- Input sanitization on all endpoints
- Query parameter validation
- Protection against MongoDB operator injection

### Safety Measures
- Cannot bulk delete admin users
- Cannot update sensitive fields (password, email) in bulk operations
- Confirmation dialogs for destructive actions

## Database Models

### User Model Fields Used
- `name`: User's full name
- `email`: User's email address
- `role`: User role (student, trainer, admin)
- `status`: Account status (active, inactive, suspended)
- `isActive`: Boolean flag for account state
- `createdAt`: Account creation timestamp
- `updatedAt`: Last modification timestamp

### AuditTrail Model
- `user`: Reference to admin who performed action
- `action`: Type of action (e.g., SUSPEND_USER, RESET_PASSWORD)
- `targetType`: Type of target resource (e.g., User)
- `targetId`: ID of affected user
- `details`: Human-readable description
- `metadata`: Additional structured data
- `ipAddress`: IP address of admin
- `timestamp`: When action occurred

## API Response Format

All endpoints follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

### Paginated Response
```json
{
  "success": true,
  "count": 10,
  "total": 156,
  "page": 1,
  "pages": 16,
  "data": [ /* array of items */ ]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing

Comprehensive test suite included in `backend/__tests__/userManagement.test.js`:

### Test Coverage
- User listing with filters and pagination
- Role-based filtering
- Search functionality
- User suspension and activation
- Password reset
- Activity log retrieval
- Bulk update operations
- Bulk delete operations
- Security: unauthorized access prevention
- Security: NoSQL injection prevention
- Admin user protection in bulk delete

### Running Tests
```bash
cd backend
npm test -- userManagement.test.js
```

## Navigation

### Access User Management
1. Log in as admin
2. Navigate to Admin Dashboard
3. Click on "Users" tab in navigation
4. Or directly access: `/admin/users`

## Future Enhancements

Potential improvements for future versions:
- Export user list to CSV/Excel
- Advanced search with multiple criteria
- User import from CSV
- Email notifications for user actions
- Two-factor authentication management
- Session management (view/terminate active sessions)
- User merge functionality
- Scheduled bulk operations
- Custom user fields
- User groups/teams management

## Support

For issues or questions about user management features:
1. Check this documentation
2. Review the API endpoints in the backend
3. Check the test suite for examples
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-05  
**Author**: GreenDye Academy Development Team
