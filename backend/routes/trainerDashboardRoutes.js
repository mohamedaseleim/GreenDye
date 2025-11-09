const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTrainerStats,
  getTrainerCourses,
  getTrainerStudents,
  getTrainerEarnings
} = require('../controllers/trainerDashboardController');

// All routes require authentication and trainer role
router.use(protect);
router.use(authorize('trainer', 'admin'));

// Dashboard routes
router.get('/stats', getTrainerStats);
router.get('/courses', getTrainerCourses);
router.get('/students', getTrainerStudents);
router.get('/earnings', getTrainerEarnings);

module.exports = router;
