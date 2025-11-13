# Course Sections/Modules Management

This document describes the sections/modules management feature for organizing course content in GreenDye Academy.

## Overview

The sections/modules management feature allows course instructors and administrators to:
- Organize lessons into logical sections or modules
- Reorder sections using drag-and-drop
- Assign lessons to specific sections
- Reorder lessons within sections using drag-and-drop
- Support multilingual section titles and descriptions

## Backend API

### Section Model

The Section model includes:
- `course` - Reference to parent Course (required)
- `title` - Multilingual Map (en, ar, fr) for section title (required)
- `description` - Multilingual Map for section description (optional)
- `order` - Number for section ordering (required)
- `lessons` - Array of Lesson references
- `attachments` - Array of files attached to the section
- `createdAt` / `updatedAt` - Timestamps

### API Endpoints

All endpoints require authentication and authorization (trainer/admin).

#### Get Course Sections
```
GET /api/sections/course/:courseId
```
Returns all sections for a specific course, sorted by order.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "course": "...",
      "title": { "en": "Introduction", "ar": "مقدمة", "fr": "Introduction" },
      "description": { "en": "Getting started with...", ... },
      "order": 0,
      "lessons": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Get Single Section
```
GET /api/sections/:id
```

#### Create Section
```
POST /api/sections
```

**Request Body:**
```json
{
  "course": "courseId",
  "title": {
    "en": "Section Title",
    "ar": "عنوان القسم",
    "fr": "Titre de la section"
  },
  "description": {
    "en": "Section description",
    "ar": "وصف القسم",
    "fr": "Description de la section"
  },
  "order": 0
}
```

If `order` is not provided, it will be automatically set to the next available order.

#### Update Section
```
PUT /api/sections/:id
```

**Request Body:**
```json
{
  "title": { "en": "Updated Title" },
  "description": { "en": "Updated description" },
  "order": 1
}
```

#### Delete Section
```
DELETE /api/sections/:id
```

Removes the section from the course and deletes it.

#### Reorder Sections
```
PUT /api/sections/course/:courseId/reorder
```

**Request Body:**
```json
{
  "sectionOrders": [
    { "sectionId": "...", "order": 0 },
    { "sectionId": "...", "order": 1 },
    { "sectionId": "...", "order": 2 }
  ]
}
```

#### Add Lesson to Section
```
PUT /api/sections/:id/lessons/:lessonId
```

Assigns a lesson to a section.

#### Remove Lesson from Section
```
DELETE /api/sections/:id/lessons/:lessonId
```

Removes a lesson from a section.

#### Reorder Lessons in Section
```
PUT /api/sections/:id/lessons/reorder
```

**Request Body:**
```json
{
  "lessonOrders": [
    { "lessonId": "...", "order": 0 },
    { "lessonId": "...", "order": 1 }
  ]
}
```

## Frontend Components

### SectionManager Component

Located at: `frontend/src/components/SectionManager.jsx`

**Props:**
- `courseId` - ID of the course
- `onUpdate` - Callback function called when sections are updated

**Features:**
- Display all sections for a course
- Create new sections with multilingual support
- Edit existing sections
- Delete sections
- Drag-and-drop reordering of sections

**Usage:**
```jsx
<SectionManager 
  courseId={courseId} 
  onUpdate={() => refetchCourse()} 
/>
```

### LessonSectionManager Component

Located at: `frontend/src/components/LessonSectionManager.jsx`

**Props:**
- `courseId` - ID of the course
- `sections` - Array of section objects
- `onUpdate` - Callback function called when lessons are updated

**Features:**
- View lessons organized by sections
- Assign lessons to sections
- Remove lessons from sections
- Drag-and-drop reordering of lessons within sections
- Display unassigned lessons

**Usage:**
```jsx
<LessonSectionManager 
  courseId={courseId}
  sections={sections}
  onUpdate={() => refetchCourse()} 
/>
```

### CourseContentManager Page

Located at: `frontend/src/pages/CourseContentManager.js`

**Route:** `/admin/courses/:courseId/content`

This page integrates both SectionManager and LessonSectionManager components with tabs:
1. **Manage Sections** - Create, edit, delete, and reorder sections
2. **Organize Lessons** - Assign and organize lessons within sections

**Access:** Admin and Trainer roles only

## Usage Guide

### For Instructors/Admins

1. **Navigate to Course Management:**
   - Go to Admin Dashboard → Courses
   - Find the course you want to organize
   - Click the "Manage Sections/Modules" button (module icon)

2. **Create Sections:**
   - Click "Add Section" button
   - Enter section title in English (required)
   - Optionally add Arabic and French translations
   - Add description (optional)
   - Click "Create"

3. **Reorder Sections:**
   - Drag sections by the drag handle icon
   - Drop them in the desired position
   - Changes are saved automatically

4. **Edit Sections:**
   - Click the edit icon on a section
   - Modify title or description
   - Click "Update"

5. **Delete Sections:**
   - Click the delete icon on a section
   - Confirm deletion

6. **Organize Lessons:**
   - Switch to "Organize Lessons" tab
   - Click "Add Lesson to Section"
   - Select a section and lesson
   - Click "Add Lesson"

7. **Reorder Lessons:**
   - Within each section, drag lessons by the drag handle
   - Drop them in the desired position
   - Changes are saved automatically

8. **Remove Lessons:**
   - Click the delete icon next to a lesson in a section
   - Confirm removal

## Security

### Input Validation

All user inputs are validated to prevent security vulnerabilities:

- **MongoDB ObjectId Validation:** All IDs are validated against the pattern `/^[0-9a-fA-F]{24}$/` before use in queries
- **Array Validation:** Arrays for reordering operations are validated before processing
- **Integer Validation:** Order values are parsed as integers to prevent injection

### Authorization

- All endpoints require authentication
- Only course instructors and admins can manage sections for a course
- Authorization is checked at both the route level and controller level

## Best Practices

1. **Section Organization:**
   - Group related lessons into logical sections
   - Use clear, descriptive section titles
   - Keep sections balanced in length

2. **Lesson Assignment:**
   - Assign all lessons to sections for better organization
   - Check for unassigned lessons regularly (shown at the bottom)
   - Reorder lessons to create a logical learning path

3. **Multilingual Support:**
   - Provide translations for all supported languages when possible
   - English is required, Arabic and French are optional
   - Consistent terminology across languages

4. **Performance:**
   - Sections are loaded with populated lessons for efficient rendering
   - Reordering operations update multiple documents efficiently
   - UI updates optimistically for better user experience

## Testing

### Unit Tests

Located at: `backend/__tests__/sectionController.test.js`

Tests cover:
- Section model validation
- Required field validation
- Multilingual support
- Order management
- Attachments support

Run tests:
```bash
cd backend
npm test
```

### Manual Testing Checklist

- [ ] Create a new section
- [ ] Edit section title and description
- [ ] Delete a section
- [ ] Drag and drop to reorder sections
- [ ] Assign a lesson to a section
- [ ] Remove a lesson from a section
- [ ] Drag and drop to reorder lessons within a section
- [ ] Test with multilingual input
- [ ] Verify unassigned lessons are shown
- [ ] Test authorization (non-instructor should not access)

## Future Enhancements

Potential improvements for future versions:

1. **Bulk Operations:**
   - Assign multiple lessons at once
   - Move multiple lessons between sections

2. **Section Templates:**
   - Create reusable section templates
   - Import section structure from another course

3. **Advanced Features:**
   - Conditional section visibility
   - Section prerequisites
   - Section completion tracking
   - Section-level quizzes

4. **UI Improvements:**
   - Search and filter lessons
   - Preview section structure
   - Keyboard shortcuts for reordering

## Troubleshooting

### Common Issues

**Sections not loading:**
- Check if course ID is valid
- Verify authentication token
- Check browser console for errors

**Drag and drop not working:**
- Ensure react-beautiful-dnd is installed
- Check if sections have valid IDs
- Try refreshing the page

**Lessons not appearing:**
- Verify lessons are created for the course
- Check if lessons are already assigned
- Refresh the lesson list

**Authorization errors:**
- Confirm user is course instructor or admin
- Check if course exists
- Verify authentication token is valid

## Related Files

### Backend
- `backend/controllers/sectionController.js` - Section controller
- `backend/routes/sectionRoutes.js` - Section routes
- `backend/models/Section.js` - Section model
- `backend/server.js` - Route registration

### Frontend
- `frontend/src/components/SectionManager.jsx` - Section management component
- `frontend/src/components/LessonSectionManager.jsx` - Lesson organization component
- `frontend/src/pages/CourseContentManager.js` - Main page
- `frontend/src/services/sectionService.js` - API service
- `frontend/src/App.js` - Route configuration
- `frontend/src/pages/AdminCourses.js` - Integration point

## Support

For issues or questions:
- Check this documentation first
- Review the code comments
- Check the GitHub repository issues
- Contact the development team
