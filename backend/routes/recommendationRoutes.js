const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  updatePreferences,
  dismissRecommendation,
  getTrendingCourses
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/trending', getTrendingCourses);

// Protected routes
router.use(protect);

router.get('/', getRecommendations);
router.put('/preferences', updatePreferences);
router.put('/:id/dismiss', dismissRecommendation);

module.exports = router;
