const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification
} = require('../controllers/notificationController');

// Notification routes
router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/read', protect, deleteAllRead);
router.delete('/:id', protect, deleteNotification);
router.post('/', protect, authorize('admin'), createNotification);

module.exports = router;
