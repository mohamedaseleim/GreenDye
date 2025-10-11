# GreenDye Academy API Documentation

Base URL: `http://localhost:5000/api` (Development)

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication (`/api/auth`)

#### Register
- **POST** `/api/auth/register`
- Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "language": "en"
}
```

#### Login
- **POST** `/api/auth/login`
- Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`

### Courses (`/api/courses`)

#### Get All Courses
- **GET** `/api/courses?page=1&limit=10&category=technology`

#### Get Single Course
- **GET** `/api/courses/:id`

#### Create Course (Trainer/Admin)
- **POST** `/api/courses`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "title": {
    "en": "Introduction to Web Development",
    "ar": "مقدمة في تطوير الويب",
    "fr": "Introduction au développement Web"
  },
  "description": {
    "en": "Learn web development basics",
    "ar": "تعلم أساسيات تطوير الويب",
    "fr": "Apprenez les bases du développement Web"
  },
  "category": "technology",
  "level": "beginner",
  "duration": 40,
  "price": 99
}
```

### Certificates (`/api/certificates`)

#### Get My Certificates
- **GET** `/api/certificates`
- Headers: `Authorization: Bearer <token>`

#### Generate Certificate (Admin/Trainer)
- **POST** `/api/certificates/generate`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "userId": "user_id",
  "courseId": "course_id",
  "grade": "A",
  "score": 95
}
```

### Verification (`/api/verify`)

#### Verify Certificate
- **GET** `/api/verify/certificate/:certificateId`
- Public endpoint

#### Verify Trainer
- **GET** `/api/verify/trainer/:trainerId`
- Public endpoint

### Trainers (`/api/trainers`)

#### Get All Trainers
- **GET** `/api/trainers?page=1&limit=10`

#### Create Trainer Profile
- **POST** `/api/trainers`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "title": {
    "en": "Senior Developer",
    "ar": "مطور أول",
    "fr": "Développeur Senior"
  },
  "expertise": ["Web Development", "Mobile Development"],
  "experience": 10
}
```

### Enrollments (`/api/enrollments`)

#### Enroll in Course
- **POST** `/api/enrollments/enroll`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "courseId": "course_id"
}
```

#### Get My Courses
- **GET** `/api/enrollments/my-courses`
- Headers: `Authorization: Bearer <token>`

#### Update Progress
- **PUT** `/api/enrollments/:id/progress`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "progress": 75
}
```

### Quizzes (`/api/quizzes`)

#### Get Course Quizzes
- **GET** `/api/quizzes?courseId=xxx`
- Headers: `Authorization: Bearer <token>`

#### Submit Quiz
- **POST** `/api/quizzes/:id/submit`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "courseId": "course_id",
  "answers": ["answer1", "answer2", "answer3"]
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Rate Limiting

API requests are limited to 100 requests per 15 minutes per IP address.

## Pagination

List endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Response includes:
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "pages": 10,
  "data": [ ... ]
}
```
