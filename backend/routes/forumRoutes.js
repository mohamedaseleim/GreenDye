const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder for forum functionality
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Forum routes - Coming soon',
    data: []
  });
});

module.exports = router;
