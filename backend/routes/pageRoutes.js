const express = require('express');
const router = express.Router();
const { getPublicPage } = require('../controllers/pageController');

// Public route to fetch published pages by slug
router.get('/:slug', getPublicPage);

module.exports = router;
