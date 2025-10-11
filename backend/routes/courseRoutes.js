const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getFeaturedCourses,
  getCoursesByCategory,
  searchCourses
} = require('../controllers/courseController');

router.route('/')
  .get(getCourses)
  .post(protect, authorize('trainer', 'admin'), createCourse);

router.get('/featured', getFeaturedCourses);
router.get('/category/:category', getCoursesByCategory);
router.get('/search', searchCourses);

router.route('/:id')
  .get(getCourse)
  .put(protect, authorize('trainer', 'admin'), updateCourse)
  .delete(protect, authorize('trainer', 'admin'), deleteCourse);

module.exports = router;
