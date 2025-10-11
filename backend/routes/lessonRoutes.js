const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson
} = require('../controllers/lessonController');

router.route('/')
  .get(getLessons)
  .post(protect, authorize('trainer', 'admin'), createLesson);

router.route('/:id')
  .get(protect, getLesson)
  .put(protect, authorize('trainer', 'admin'), updateLesson)
  .delete(protect, authorize('trainer', 'admin'), deleteLesson);

module.exports = router;
