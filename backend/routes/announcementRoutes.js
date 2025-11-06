const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Priority order mapping for sorting
const priorityOrder = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

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
    }).sort({ startDate: -1 });

    // Sort by priority (urgent > high > medium > low) then by startDate
    announcements.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.startDate) - new Date(a.startDate);
    });

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
