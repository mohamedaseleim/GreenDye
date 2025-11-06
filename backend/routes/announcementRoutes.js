const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// @desc    Get active announcements (public)
// @route   GET /api/announcements/active
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    
    const announcements = await Announcement.find({
      status: 'active',
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: now } }
      ]
    }).sort({ priority: -1, startDate: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements'
    });
  }
});

module.exports = router;
