# Trainer Management Implementation

This document describes the implementation of the Trainer Management features for the GreenDye Academy admin dashboard.

## Overview

The trainer management system provides comprehensive tools for administrators to manage trainers, their applications, performance, and payouts.

## Features Implemented

### 1. Create and Edit Trainer Profiles
- **Backend**: `adminTrainerController.js` - `createTrainer`, `updateTrainer`, `deleteTrainer`
- **Frontend**: `AdminTrainers.js` - Trainer list with inline actions
- **Access**: Admin only
- Administrators can create trainer profiles for existing users
- Edit trainer information including commission rates, expertise, and qualifications
- Delete trainer profiles when necessary

### 2. Approve/Reject Trainer Applications
- **Backend**: `adminTrainerController.js` - `approveTrainer`, `rejectTrainer`, `getPendingApplications`
- **Frontend**: `AdminTrainers.js` - Application approval interface with notes
- **Access**: Admin only
- View all pending trainer applications
- Approve applications with optional review notes
- Reject applications with reason notes
- Automatically updates user role to 'trainer' upon approval

### 3. View Trainer Performance Metrics
- **Backend**: `adminTrainerController.js` - `getTrainerMetrics`
- **Frontend**: `AdminTrainers.js` - Performance metrics dialog
- **Access**: Admin only
- Metrics displayed:
  - Total courses (published/draft)
  - Total students and enrollments
  - Revenue and earnings
  - Average course rating
  - Completion rate
  - Commission details

### 4. Manage Trainer Payouts/Commissions
- **Backend**: 
  - `TrainerPayout.js` model - Tracks all payout transactions
  - `adminTrainerController.js` - `createPayout`, `getTrainerPayouts`, `getAllPayouts`, `updatePayoutStatus`
- **Frontend**: `AdminTrainers.js` - Payout management interface
- **Access**: Admin only
- Features:
  - Set commission rates per trainer
  - Track total earnings and pending payouts
  - Create new payouts with amount and method
  - View payout history
  - Multiple payout methods (bank transfer, PayPal, Stripe)
  - Automatic balance updates

### 5. Trainer Verification Status Management
- **Backend**: `adminTrainerController.js` - `updateVerificationStatus`
- **Frontend**: `AdminTrainers.js` - Verification status toggle
- **Access**: Admin only
- Manually verify or unverify trainers
- Add verification notes
- Track verification date and reviewer

## Database Schema Changes

### Trainer Model Enhancements
Added fields:
```javascript
{
  applicationStatus: String, // pending, approved, rejected, under_review
  applicationDate: Date,
  reviewedBy: ObjectId, // Admin who reviewed
  reviewDate: Date,
  reviewNotes: String,
  commissionRate: Number, // Default 20%
  totalEarnings: Number,
  pendingPayout: Number,
  totalPaidOut: Number,
  lastPayoutDate: Date,
  payoutMethod: String,
  payoutDetails: Mixed
}
```

### New TrainerPayout Model
```javascript
{
  trainer: ObjectId,
  amount: Number,
  currency: String,
  status: String, // pending, processing, completed, failed, cancelled
  payoutMethod: String,
  transactionId: String,
  period: { startDate, endDate },
  processedBy: ObjectId,
  processedAt: Date,
  notes: String,
  payoutDetails: Mixed
}
```

## API Endpoints

All endpoints are protected and require admin authentication.

Base URL: `/api/admin/trainers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all trainers with filtering |
| POST | `/` | Create new trainer profile |
| GET | `/applications/pending` | Get pending applications |
| GET | `/payouts` | Get all payouts |
| PUT | `/payouts/:payoutId` | Update payout status |
| GET | `/:id` | Get trainer by ID |
| PUT | `/:id` | Update trainer profile |
| DELETE | `/:id` | Delete trainer profile |
| PUT | `/:id/approve` | Approve trainer application |
| PUT | `/:id/reject` | Reject trainer application |
| PUT | `/:id/verification` | Update verification status |
| GET | `/:id/metrics` | Get performance metrics |
| GET | `/:id/payouts` | Get trainer payout history |
| POST | `/:id/payouts` | Create new payout |

## Frontend Components

### AdminTrainers.js
Main component located at `/admin/trainers`

Features:
- **Tabs**: All Trainers / Pending Applications
- **Filters**: Status, Verified, Application Status, Search
- **Table**: Displays trainer list with key information
- **Actions**: 
  - View Details
  - View Metrics
  - Manage Payouts
  - Approve/Reject
  - Delete
- **Dialogs**:
  - Trainer Details with verification management
  - Performance Metrics dashboard
  - Payout Management with history

### AdminService Updates
Added 13 new methods:
- `getAllTrainers`
- `getTrainerById`
- `createTrainer`
- `updateTrainer`
- `deleteTrainer`
- `approveTrainer`
- `rejectTrainer`
- `getPendingApplications`
- `updateVerificationStatus`
- `getTrainerMetrics`
- `getTrainerPayouts`
- `createPayout`
- `getAllPayouts`
- `updatePayoutStatus`

## Security Considerations

### Authentication & Authorization
- All endpoints require authentication (JWT token)
- All endpoints require admin role authorization
- Implemented via `protect` and `authorize('admin')` middleware

### Input Validation
- Server-level protection via `express-mongo-sanitize`
- Mongoose schema validation
- Controlled enum values for status fields
- Numeric validation for amounts and rates

### NoSQL Injection Protection
- All user inputs pass through `mongo-sanitize` middleware
- Query objects built from controlled parameters
- Regex patterns are safe and controlled
- Mongoose parameterized queries

## Testing

### Test Coverage
Created `adminTrainer.test.js` with 15+ test cases covering:
- Get all trainers (with filters)
- Get single trainer
- Approve/Reject applications
- Verification status management
- Performance metrics
- Payout creation and tracking
- Profile updates and deletion
- Authorization checks

### Validation
- All new code passes ESLint
- Frontend builds successfully without warnings
- Backend server starts without errors
- Routes load correctly (12 handlers verified)

## Usage Examples

### Approve a Trainer Application
```javascript
// Frontend
await adminService.approveTrainer(trainerId, 'Great qualifications');

// Backend processes:
// 1. Updates applicationStatus to 'approved'
// 2. Sets isVerified to true
// 3. Records review date and reviewer
// 4. Updates user role to 'trainer'
```

### Create a Payout
```javascript
// Frontend
await adminService.createPayout(trainerId, {
  amount: 100.00,
  payoutMethod: 'bank_transfer',
  notes: 'Monthly payout for January 2024'
});

// Backend processes:
// 1. Validates amount against pending balance
// 2. Creates payout record
// 3. Updates trainer pendingPayout (-100)
// 4. Updates trainer totalPaidOut (+100)
// 5. Records lastPayoutDate
```

### View Performance Metrics
The metrics endpoint calculates:
- Courses: Count by status (published/draft)
- Students: Unique enrollments and completion status
- Revenue: Total from course sales with commission calculation
- Performance: Average ratings and completion rates

## Navigation

Trainer management is accessible via:
1. Admin Dashboard → Trainers tab
2. Direct URL: `/admin/trainers`

## Future Enhancements

Potential improvements for future iterations:
- Automated payout scheduling
- Bulk trainer imports
- Advanced analytics and reporting
- Trainer performance comparisons
- Email notifications for application status
- Document upload for verification
- Multi-currency payout support
- Tax document management

## File Changes

### New Files
- `backend/models/TrainerPayout.js`
- `backend/controllers/adminTrainerController.js`
- `backend/routes/adminTrainerRoutes.js`
- `backend/__tests__/adminTrainer.test.js`
- `frontend/src/pages/AdminTrainers.js`

### Modified Files
- `backend/models/Trainer.js` - Added payout and application fields
- `backend/server.js` - Added admin trainer routes
- `frontend/src/services/adminService.js` - Added trainer methods
- `frontend/src/App.js` - Added AdminTrainers route and import
- `frontend/src/pages/AdminDashboard.js` - Added Trainers tab

## Conclusion

The trainer management implementation provides a complete, secure, and user-friendly system for administrators to manage all aspects of trainer lifecycle from application to payout. All requirements from the original issue have been fully addressed.
