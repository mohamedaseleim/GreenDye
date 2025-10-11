const express = require('express');
const router = express.Router();
const {
  search,
  getSearchSuggestions,
  getPopularSearches,
  getSearchHistory,
  clearSearchHistory,
  indexCourse,
  getSearchFilters
} = require('../controllers/searchController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', search);
router.get('/suggestions', getSearchSuggestions);
router.get('/popular', getPopularSearches);
router.get('/filters', getSearchFilters);

// Protected routes
router.get('/history', protect, getSearchHistory);
router.delete('/history', protect, clearSearchHistory);

// Admin routes
router.post('/index/course/:id', protect, authorize('admin', 'trainer'), indexCourse);

module.exports = router;
