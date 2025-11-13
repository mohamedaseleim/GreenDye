const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCourseSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  addLessonToSection,
  removeLessonFromSection,
  reorderLessons
} = require('../controllers/sectionController');

// All routes require authentication
router.use(protect);
router.use(authorize('trainer', 'admin'));

// Get all sections for a course
router.get('/course/:courseId', getCourseSections);

// Reorder sections in a course
router.put('/course/:courseId/reorder', reorderSections);

// Section CRUD operations
router.route('/')
  .post(createSection);

router.route('/:id')
  .get(getSection)
  .put(updateSection)
  .delete(deleteSection);

// Lesson management within sections
router.put('/:id/lessons/:lessonId', addLessonToSection);
router.delete('/:id/lessons/:lessonId', removeLessonFromSection);
router.put('/:id/lessons/reorder', reorderLessons);

module.exports = router;
