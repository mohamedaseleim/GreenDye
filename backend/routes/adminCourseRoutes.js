const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

// Protect all routes and authorize only admin
router.use(protect);
router.use(authorize('admin'));

// Admin course management routes
router.route('/')
  .get(getCourses)
  .post(createCourse);

router.route('/:id')
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

module.exports = router;
