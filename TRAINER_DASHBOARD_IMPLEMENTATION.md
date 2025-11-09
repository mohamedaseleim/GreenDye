# Trainer Dashboard Implementation

## Overview
This document describes the implementation of the Trainer Dashboard feature that provides trainers with a comprehensive interface to manage their courses, track student progress, and monitor their earnings.

## Features

### 1. Dashboard Overview
The Trainer Dashboard provides an at-a-glance view of:
- **Total Courses**: Number of courses created (published and draft)
- **Total Students**: Number of unique students enrolled across all courses
- **Total Earnings**: Calculated based on revenue and commission rate
- **Average Rating**: Aggregate rating from student reviews

### 2. Course Management
Trainers can view all their courses with detailed statistics:
- Course title, category, and thumbnail
- Published/Draft status
- Number of enrollments
- Revenue generated
- Average rating
- Quick access to view course details

### 3. Student Activity
Recent student enrollments are displayed showing:
- Student name and avatar
- Course enrolled in
- Enrollment status (active, completed, etc.)
- Progress percentage

### 4. Earnings Tracking
Comprehensive earnings information including:
- Total revenue from all courses
- Platform commission/fee deduction
- Net trainer earnings
- Pending payout amount
- Total paid out to date

### 5. Quick Actions
Easy access buttons for common tasks:
- Create new course
- View all students
- Access analytics
- Check earnings and payouts

## Backend API Endpoints

### GET /api/trainer/dashboard/stats
Returns comprehensive trainer statistics including course counts, student counts, earnings summary, and recent activity.

**Authentication**: Required (Trainer or Admin role)

**Response**:
```json
{
  "success": true,
  "data": {
    "trainer": {
      "id": "trainer_id",
      "trainerId": "TR-XXXXX",
      "fullName": "Trainer Name",
      "rating": 4.5,
      "isVerified": true,
      "commissionRate": 20
    },
    "stats": {
      "totalCourses": 10,
      "publishedCourses": 8,
      "draftCourses": 2,
      "totalStudents": 150,
      "activeStudents": 120,
      "completedStudents": 30,
      "averageRating": 4.5,
      "totalReviews": 75
    },
    "earnings": {
      "totalRevenue": 10000,
      "trainerEarnings": 8000,
      "platformFee": 2000,
      "pendingPayout": 500,
      "totalPaidOut": 7500
    },
    "recentActivity": [...]
  }
}
```

### GET /api/trainer/dashboard/courses
Returns paginated list of trainer's courses with enrollment and revenue statistics.

**Authentication**: Required (Trainer or Admin role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `status`: Filter by 'published' or 'draft'

**Response**:
```json
{
  "success": true,
  "count": 10,
  "total": 10,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "course_id",
      "title": {"en": "Course Title"},
      "thumbnail": "/uploads/...",
      "category": "technology",
      "level": "beginner",
      "price": 99.99,
      "currency": "USD",
      "isPublished": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "stats": {
        "totalEnrollments": 50,
        "activeEnrollments": 40,
        "completedEnrollments": 10,
        "revenue": 4999.50,
        "rating": 4.5,
        "reviewsCount": 25
      }
    }
  ]
}
```

### GET /api/trainer/dashboard/students
Returns paginated list of students enrolled in trainer's courses.

**Authentication**: Required (Trainer or Admin role)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `courseId`: Optional filter by specific course

### GET /api/trainer/dashboard/earnings
Returns detailed earnings breakdown including revenue by course and payout history.

**Authentication**: Required (Trainer or Admin role)

## Frontend Components

### TrainerDashboard.js
Main dashboard component located at `/frontend/src/pages/TrainerDashboard.js`

**Features**:
- Responsive grid layout with Material-UI components
- Real-time data fetching from backend APIs
- Error handling and loading states
- Navigation integration for quick actions

### TrainerRoute.js
Route protection component at `/frontend/src/components/TrainerRoute.js`

**Purpose**: Ensures only authenticated users with 'trainer' or 'admin' roles can access trainer-specific routes.

## Routes

### Frontend Route
- `/trainer/dashboard` - Main trainer dashboard page (protected route)

### Backend Routes
All routes are prefixed with `/api/trainer/dashboard/` and require authentication with trainer or admin role:
- `GET /stats` - Dashboard statistics
- `GET /courses` - Trainer courses with stats
- `GET /students` - Enrolled students
- `GET /earnings` - Earnings and payouts

## Navigation

The Trainer Dashboard link appears in the header navigation for users with the trainer role:
- Desktop: Shows "Trainer Dashboard" button in main navigation
- Mobile: Appears in mobile menu
- User Menu: Listed in account dropdown menu

## Database Models Used

- **Trainer**: Trainer profile information including commission rates and verification status
- **Course**: Course details with instructor reference
- **Enrollment**: Student enrollment data with progress tracking
- **Payment**: Payment records for calculating revenue
- **TrainerPayout**: Payout history and status

## Authorization

All trainer dashboard endpoints use middleware-based authorization:
```javascript
router.use(protect);
router.use(authorize('trainer', 'admin'));
```

This ensures:
1. User is authenticated (via JWT token)
2. User has either 'trainer' or 'admin' role
3. Trainers can only access their own data
4. Admins can access any trainer's data (for support/management)

## Error Handling

The implementation includes comprehensive error handling:
- **404**: Trainer profile not found
- **401**: Unauthorized access
- **500**: Server errors
- Frontend displays user-friendly error messages
- Backend logs errors for debugging

## Security Considerations

1. **Authorization**: Role-based access control prevents unauthorized access
2. **Data Isolation**: Trainers can only view their own courses and students
3. **Input Validation**: Query parameters validated and sanitized
4. **Error Messages**: Generic error messages to prevent information disclosure

## Future Enhancements

Potential improvements for future iterations:
- Real-time notifications for new enrollments
- Advanced analytics and reporting
- Course performance comparison
- Student engagement metrics
- Automated payout scheduling
- Multi-currency support for earnings
- Export functionality for financial records

## Testing

To test the Trainer Dashboard:

1. **Create a Trainer User**:
   - Register a new user
   - Update the user's role to 'trainer' in the database
   - Create a Trainer profile linked to the user

2. **Create Test Data**:
   - Create courses with the trainer as instructor
   - Add enrollments for those courses
   - Add payment records

3. **Access Dashboard**:
   - Login with trainer credentials
   - Navigate to `/trainer/dashboard`
   - Verify all statistics display correctly

4. **Test API Endpoints**:
   ```bash
   # Get trainer stats
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/trainer/dashboard/stats

   # Get trainer courses
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/trainer/dashboard/courses

   # Get trainer students
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/trainer/dashboard/students

   # Get trainer earnings
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/trainer/dashboard/earnings
   ```

## Support

For questions or issues related to the Trainer Dashboard:
- Check the backend logs for API errors
- Verify trainer profile exists and is properly linked to user
- Ensure user role is set to 'trainer'
- Check that courses have the correct instructor reference
