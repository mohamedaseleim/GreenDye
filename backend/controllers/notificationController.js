const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { user: req.user.id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total: count,
      unreadCount,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }

    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify notification belongs to user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
exports.deleteAllRead = async (req, res, next) => {
  try {
    await Notification.deleteMany({
      user: req.user.id,
      isRead: true
    });

    res.status(200).json({
      success: true,
      message: 'All read notifications deleted successfully'
    });
  } catch (error) {
    console.error('Delete all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notifications',
      error: error.message
    });
  }
};

// @desc    Create and send notification
// @route   POST /api/notifications
// @access  Private (Admin only)
exports.createNotification = async (req, res, next) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      data,
      link,
      priority,
      sendEmail,
      sendPush
    } = req.body;

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      link,
      priority
    });

    // Send email notification if requested
    if (sendEmail) {
      await sendEmailNotification(notification);
    }

    // Send push notification if requested
    if (sendPush) {
      await sendPushNotification(notification);
    }

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

// Helper function to send email notification
async function sendEmailNotification(notification) {
  try {
    const user = await require('../models/User').findById(notification.user);
    if (!user || !user.email) return;

    const language = user.preferredLanguage || 'en';
    const emailTitle = notification.title.get(language) || notification.title.get('en');
    const emailMessage = notification.message.get(language) || notification.message.get('en');

    const mailOptions = {
      from: `"GreenDye Academy" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: emailTitle,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">${emailTitle}</h2>
          <p>${emailMessage}</p>
          ${notification.link ? `
            <a href="${notification.link}" 
               style="display: inline-block; padding: 10px 20px; background-color: #2e7d32; 
                      color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              View Details
            </a>
          ` : ''}
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from GreenDye Academy. Please do not reply to this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    notification.emailSent = true;
    notification.emailSentAt = Date.now();
    await notification.save();
  } catch (error) {
    console.error('Send email notification error:', error);
  }
}

// Helper function to send push notification
async function sendPushNotification(notification) {
  try {
    // TODO: Implement push notification using Firebase Cloud Messaging or similar
    // For now, just mark as sent
    notification.pushSent = true;
    notification.pushSentAt = Date.now();
    await notification.save();
  } catch (error) {
    console.error('Send push notification error:', error);
  }
}

// Utility function to create notification (used by other controllers)
exports.createNotificationUtil = async (userId, type, titleObj, messageObj, data = {}, link = null) => {
  try {
    await Notification.create({
      user: userId,
      type,
      title: titleObj,
      message: messageObj,
      data,
      link
    });
  } catch (error) {
    console.error('Create notification util error:', error);
  }
};
