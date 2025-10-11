const express = require('express');
const router = express.Router();
const {
  getAllBadges,
  createBadge,
  getUserAchievements,
  checkAndAwardBadges,
  getLeaderboard,
  updateUserPoints,
  getUserStats
} = require('../controllers/gamificationController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/badges', getAllBadges);
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.use(protect);

router.get('/achievements', getUserAchievements);
router.post('/check-badges', checkAndAwardBadges);
router.post('/points', updateUserPoints);
router.get('/stats', getUserStats);

// Admin routes
router.post('/badges', authorize('admin'), createBadge);

module.exports = router;
