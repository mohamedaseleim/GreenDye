# GreenDye Academy - API Reference

Complete API documentation for GreenDye Academy platform.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

---

## Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User

```http
GET /api/auth/me
```

**Headers:** Authorization required

---

## Payment Endpoints

### Create Checkout Session

```http
POST /api/payments/checkout
```

**Headers:** Authorization required

**Request Body:**
```json
{
  "courseId": "course_id",
  "paymentMethod": "stripe",
  "currency": "USD",
  "country": "US",
  "region": "California"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment_id",
    "checkoutUrl": "https://checkout.stripe.com/...",
    "sessionId": "session_id",
    "publicKey": "pk_test_..."
  }
}
```

**Payment Methods:**
- `stripe` - International (Credit/Debit cards)
- `paypal` - International
- `fawry` - Egypt
- `paymob` - Egypt & MENA

### Verify Payment

```http
POST /api/payments/verify
```

**Request Body:**
```json
{
  "paymentId": "payment_id",
  "transactionId": "transaction_id",
  "status": "success",
  "gatewayResponse": {}
}
```

### Get Payment History

```http
GET /api/payments
```

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "payment_id",
      "course": {
        "title": "Course Name",
        "thumbnail": "image_url"
      },
      "amount": 99.99,
      "currency": "USD",
      "status": "completed",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Request Refund

```http
POST /api/payments/:id/refund
```

**Headers:** Authorization required

**Request Body:**
```json
{
  "reason": "Course not as expected"
}
```

### Get Invoice

```http
GET /api/payments/:id/invoice
```

**Headers:** Authorization required

---

## Analytics Endpoints

### Track Event

```http
POST /api/analytics/track
```

**Headers:** Authorization required

**Request Body:**
```json
{
  "eventType": "video_play",
  "courseId": "course_id",
  "lessonId": "lesson_id",
  "duration": 120,
  "metadata": {
    "videoPosition": 45
  }
}
```

**Event Types:**
- `course_view` - User viewed course
- `course_enroll` - User enrolled in course
- `lesson_start` - Started a lesson
- `lesson_complete` - Completed a lesson
- `quiz_attempt` - Started quiz
- `quiz_complete` - Completed quiz
- `video_play` - Played video
- `video_pause` - Paused video
- `video_complete` - Completed video
- `certificate_earn` - Earned certificate
- `course_complete` - Completed course

### Get Platform Statistics (Admin Only)

```http
GET /api/analytics/platform?startDate=2025-01-01&endDate=2025-12-31
```

**Headers:** Authorization required (Admin role)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1000,
      "totalCourses": 50,
      "totalEnrollments": 5000,
      "totalCertificates": 2000,
      "totalRevenue": 50000,
      "activeUsers": 500,
      "newUsers": 100
    },
    "popularCourses": [...],
    "userGrowth": [...]
  }
}
```

### Get Course Analytics (Trainer/Admin)

```http
GET /api/analytics/course/:courseId
```

**Headers:** Authorization required (Trainer/Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollments": {
      "total": 500,
      "active": 400,
      "completed": 100,
      "averageProgress": 65.5
    },
    "engagement": [...],
    "completionTrend": [...],
    "demographics": [...]
  }
}
```

### Get User Analytics

```http
GET /api/analytics/user
```

**Headers:** Authorization required

---

## Forum Endpoints

### Get Forum Posts

```http
GET /api/forums?courseId=course_id&category=question&search=term&page=1&limit=20
```

**Query Parameters:**
- `courseId` (optional) - Filter by course
- `category` (optional) - Filter by category (general, question, discussion, announcement, help, feedback)
- `search` (optional) - Search term
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)

### Get Single Forum Post

```http
GET /api/forums/:id
```

### Create Forum Post

```http
POST /api/forums
```

**Headers:** Authorization required

**Request Body:**
```json
{
  "title": "How to use this feature?",
  "content": "I need help with...",
  "courseId": "course_id",
  "lessonId": "lesson_id",
  "category": "question",
  "tags": ["help", "beginner"]
}
```

### Update Forum Post

```http
PUT /api/forums/:id
```

**Headers:** Authorization required

**Request Body:**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "category": "discussion"
}
```

### Delete Forum Post

```http
DELETE /api/forums/:id
```

**Headers:** Authorization required

### Add Reply

```http
POST /api/forums/:id/replies
```

**Headers:** Authorization required

**Request Body:**
```json
{
  "content": "This is my reply to the post"
}
```

### Like/Unlike Post

```http
POST /api/forums/:id/like
```

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": {
    "likes": 15,
    "isLiked": true
  }
}
```

### Mark Post as Resolved

```http
POST /api/forums/:id/resolve
```

**Headers:** Authorization required (Author/Trainer/Admin)

---

## Notification Endpoints

### Get Notifications

```http
GET /api/notifications?page=1&limit=20&unreadOnly=false
```

**Headers:** Authorization required

**Query Parameters:**
- `page` (optional) - Page number
- `limit` (optional) - Items per page
- `unreadOnly` (optional) - Show only unread (true/false)

**Response:**
```json
{
  "success": true,
  "count": 20,
  "total": 50,
  "unreadCount": 10,
  "totalPages": 3,
  "currentPage": 1,
  "data": [
    {
      "_id": "notification_id",
      "type": "course_completed",
      "title": {
        "en": "Congratulations!",
        "ar": "تهانينا!"
      },
      "message": {
        "en": "You completed the course",
        "ar": "لقد أكملت الدورة"
      },
      "link": "/courses/course_id",
      "isRead": false,
      "priority": "high",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Mark Notification as Read

```http
PUT /api/notifications/:id/read
```

**Headers:** Authorization required

### Mark All as Read

```http
PUT /api/notifications/read-all
```

**Headers:** Authorization required

### Delete Notification

```http
DELETE /api/notifications/:id
```

**Headers:** Authorization required

### Delete All Read Notifications

```http
DELETE /api/notifications/read
```

**Headers:** Authorization required

### Create Notification (Admin Only)

```http
POST /api/notifications
```

**Headers:** Authorization required (Admin role)

**Request Body:**
```json
{
  "userId": "user_id",
  "type": "announcement",
  "title": {
    "en": "New Feature Released",
    "ar": "ميزة جديدة",
    "fr": "Nouvelle fonctionnalité"
  },
  "message": {
    "en": "Check out our new feature",
    "ar": "اطلع على ميزتنا الجديدة",
    "fr": "Découvrez notre nouvelle fonctionnalité"
  },
  "link": "/features/new",
  "priority": "high",
  "sendEmail": true,
  "sendPush": true
}
```

---

## Course Endpoints

### Get All Courses

```http
GET /api/courses?page=1&limit=10&category=programming&level=beginner
```

### Get Course by ID

```http
GET /api/courses/:id
```

### Create Course (Trainer/Admin)

```http
POST /api/courses
```

**Headers:** Authorization required

### Update Course (Trainer/Admin)

```http
PUT /api/courses/:id
```

**Headers:** Authorization required

### Delete Course (Admin)

```http
DELETE /api/courses/:id
```

**Headers:** Authorization required (Admin)

---

## Certificate Endpoints

### Get User Certificates

```http
GET /api/certificates
```

**Headers:** Authorization required

### Verify Certificate (Public)

```http
GET /api/verify/certificate/:certificateId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificateId": "CERT-ABC123",
    "userName": "John Doe",
    "courseName": "Web Development",
    "completionDate": "2025-01-01",
    "grade": "A+",
    "isValid": true
  }
}
```

---

## Trainer Endpoints

### Get All Trainers

```http
GET /api/trainers
```

### Get Trainer by ID

```http
GET /api/trainers/:id
```

### Verify Trainer (Public)

```http
GET /api/verify/trainer/:trainerId
```

---

## Enrollment Endpoints

### Enroll in Course

```http
POST /api/enrollments
```

**Headers:** Authorization required

**Request Body:**
```json
{
  "courseId": "course_id"
}
```

### Get User Enrollments

```http
GET /api/enrollments
```

**Headers:** Authorization required

### Update Progress

```http
PUT /api/enrollments/:id/progress
```

**Headers:** Authorization required

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per window per IP

Exceeded rate limit response:
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

## Pagination

Paginated endpoints return:

```json
{
  "success": true,
  "count": 20,
  "total": 100,
  "totalPages": 5,
  "currentPage": 1,
  "data": [...]
}
```

## Multi-language Support

The API supports multiple languages. Set your preferred language:

**In Request Headers:**
```
Accept-Language: ar
```

**Supported Languages:**
- `en` - English (default)
- `ar` - Arabic
- `fr` - French

Content with multi-language support returns:
```json
{
  "title": {
    "en": "English Title",
    "ar": "العنوان بالعربية",
    "fr": "Titre en français"
  }
}
```

## WebSocket Events (Real-time)

Connect to: `ws://localhost:5000`

### Events

**Client → Server:**
- `join_course` - Join course room
- `leave_course` - Leave course room
- `message` - Send chat message

**Server → Client:**
- `notification` - New notification
- `message` - New chat message
- `course_update` - Course updated
- `user_online` - User came online

## Postman Collection

Import our Postman collection for easy API testing:

[Download Collection](link-to-postman-collection.json)

## SDK & Libraries

Coming soon:
- JavaScript SDK
- Python SDK
- Mobile SDK (React Native)

## Support

For API support:
- Documentation: https://docs.greendye-academy.com
- Email: api@greendye-academy.com
- Community Forum: https://forum.greendye-academy.com
