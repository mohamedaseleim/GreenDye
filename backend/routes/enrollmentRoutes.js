const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  enrollCourse,
  getMyEnrollments,
  getEnrollment,
  updateProgress,
  completeLesson,
  addNote,
  rateAndReview
} = require('../controllers/enrollmentController');

router.use(protect);

router.post('/enroll', enrollCourse);
router.get('/my-courses', getMyEnrollments);
router.get('/:id', getEnrollment);
router.put('/:id/progress', updateProgress);
router.put('/:id/complete-lesson', completeLesson);
router.post('/:id/notes', addNote);
router.post('/:id/review', rateAndReview);

module.exports = router;
