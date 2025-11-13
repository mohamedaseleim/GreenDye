const express = require('express');
const router = express.Router();
const {
  getSectionsByCourse,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  addLessonToSection,
  removeLessonFromSection,
  reorderLessons,
} = require('../controllers/sectionController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (for viewing)
router.get('/course/:courseId', getSectionsByCourse);
router.get('/:id', getSection);

// Protected routes (for creating/editing)
router.post('/', protect, authorize('admin', 'trainer', 'instructor'), createSection);
router.put('/:id', protect, authorize('admin', 'trainer', 'instructor'), updateSection);
router.delete('/:id', protect, authorize('admin', 'trainer', 'instructor'), deleteSection);

// Reordering routes
router.put('/reorder', protect, authorize('admin', 'trainer', 'instructor'), reorderSections);
router.put('/:id/reorder-lessons', protect, authorize('admin', 'trainer', 'instructor'), reorderLessons);

// Lesson management within sections
router.put('/:id/lessons/:lessonId', protect, authorize('admin', 'trainer', 'instructor'), addLessonToSection);
router.delete('/:id/lessons/:lessonId', protect, authorize('admin', 'trainer', 'instructor'), removeLessonFromSection);

module.exports = router;
