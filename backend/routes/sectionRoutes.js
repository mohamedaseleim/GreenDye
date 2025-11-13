const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  addLessonToSection,
  removeLessonFromSection
} = require('../controllers/sectionController');

router.route('/')
  .get(getSections)
  .post(protect, authorize('trainer', 'admin'), createSection);

router.route('/:id')
  .get(getSection)
  .put(protect, authorize('trainer', 'admin'), updateSection)
  .delete(protect, authorize('trainer', 'admin'), deleteSection);

router.route('/:id/lessons/:lessonId')
  .put(protect, authorize('trainer', 'admin'), addLessonToSection)
  .delete(protect, authorize('trainer', 'admin'), removeLessonFromSection);

module.exports = router;
