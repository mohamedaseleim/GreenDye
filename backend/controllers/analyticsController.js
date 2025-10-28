const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Payment = require('../models/Payment');
const posthog = require('../services/posthog');

// @desc    Track analytics event
// @route   POST /api/analytics/track
// @access  Private
exports.trackEvent = async (req, res, next) => {
  try {
    const {
      eventType,
      courseId,
      lessonId,
      metadata,
      duration,
      score
    } = req.body;

    // Detect device and browser info
    const userAgent = req.get('user-agent') || '';
    const deviceType = detectDeviceType(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    const analyticsData = {
      user: req.user.id,
      eventType,
      course: courseId,
      lesson: lessonId,
      metadata,
    
      duration,
      score,
      ipAddress: req.ip,
      userAgent,
      deviceType,
      browser,
      os,
      language: req.user.preferredLanguage || 'en'
    };

    const analytics = await Analytics.create(analyticsData);
        // Send event to PostHog for analytics and A/B testing
    if (posthog) {
      try {
        posthog.capture({
          distinctId: req.user && req.user.id ? req.user.id.toString() : undefined,
          event: eventType,
          properties: {
            courseId: courseId || null,
            lessonId: lessonId || null,
            metadata,
            duration,
            score,
            ipAddress: req.ip,
            userAgent,
            deviceType,
            browser,
            os,
            language: req.user && req.user.preferredLanguage ? req.user.preferredLanguage : 'en'
          }
        });
      } catch (phError) {
        console.error('PostHog capture error:', phError);
      }
    }

    res.status(201).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({
      success: false,
     }
      message: 'Error tracking event',
      error: error.message
    });
  }
};

// @desc    Get platform statistics (Admin)
// @route   GET /api/analytics/platform
// @access  Private/Admin
exports.getPlatformStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Get counts
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalCertificates,
      totalRevenue,
      activeUsers,
      newUsers
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(filter),
      Certificate.countDocuments(filter),
      Payment.aggregate([
        { $match: { status: 'completed', ...filter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Analytics.distinct('user', {
        timestamp: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    // Get popular courses
    const popularCourses = await Analytics.aggregate([
      {
        $match: {
          eventType: 'course_view',
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      { $group: { _id: '$course', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          _id: 0,
          courseId: '$_id',
          title: '$course.title',
          views: 1
        }
      }
    ]);

    // Get user growth over time
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCourses,
          totalEnrollments,
          totalCertificates,
          totalRevenue: totalRevenue[0]?.total || 0,
          activeUsers: activeUsers.length,
          newUsers
        },
        popularCourses,
        userGrowth
      }
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platform statistics',
      error: error.message
    });
  }
};

// @desc    Get course analytics (Trainer/Admin)
// @route   GET /api/analytics/course/:courseId
// @access  Private/Trainer/Admin
exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Verify course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this course analytics'
      });
    }

    // Get enrollment stats
    const [
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      averageProgress
    ] = await Promise.all([
      Enrollment.countDocuments({ course: courseId }),
      Enrollment.countDocuments({ course: courseId, status: 'active' }),
      Enrollment.countDocuments({ course: courseId, status: 'completed' }),
      Enrollment.aggregate([
        { $match: { course: mongoose.Types.ObjectId(courseId) } },
        { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
      ])
    ]);

    // Get engagement metrics
    const engagementMetrics = await Analytics.aggregate([
      { $match: { course: mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Get completion rate over time
    const completionTrend = await Enrollment.aggregate([
      {
        $match: {
          course: mongoose.Types.ObjectId(courseId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completionDate' },
            month: { $month: '$completionDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get student demographics
    const demographics = await Enrollment.aggregate([
      { $match: { course: mongoose.Types.ObjectId(courseId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      {
        $group: {
          _id: '$userData.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        enrollments: {
          total: totalEnrollments,
          active: activeEnrollments,
          completed: completedEnrollments,
          averageProgress: averageProgress[0]?.avgProgress || 0
        },
        engagement: engagementMetrics,
        completionTrend,
        demographics
      }
    });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course analytics',
      error: error.message
    });
  }
};

// @desc    Get user learning analytics
// @route   GET /api/analytics/user
// @access  Private
exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user enrollments with progress
    const enrollments = await Enrollment.find({ user: userId })
      .populate('course', 'title thumbnail')
      .select('course progress status enrollmentDate completionDate');

    // Get certificates earned
    const certificates = await Certificate.countDocuments({ 
      user: userId,
      isValid: true
    });

    // Get learning time
    const learningTime = await Analytics.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          eventType: { $in: ['video_play', 'lesson_complete'] }
        }
      },
      {
        $group: {
          _id: null,
          totalTime: { $sum: '$duration' }
        }
      }
    ]);

    // Get quiz performance
    const quizPerformance = await Analytics.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          eventType: 'quiz_complete'
        }
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          totalQuizzes: { $sum: 1 }
        }
      }
    ]);

    // Get learning streak
    const learningStreak = await calculateLearningStreak(userId);

    res.status(200).json({
      success: true,
      data: {
        enrollments: {
          total: enrollments.length,
          active: enrollments.filter(e => e.status === 'active').length,
          completed: enrollments.filter(e => e.status === 'completed').length
        },
        certificates,
        learningTime: learningTime[0]?.totalTime || 0,
        quizPerformance: {
          averageScore: quizPerformance[0]?.avgScore || 0,
          totalQuizzes: quizPerformance[0]?.totalQuizzes || 0
        },
        learningStreak,
        recentActivity: enrollments.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics',
      error: error.message
    });
  }
};

// Helper functions
function detectDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/desktop|windows|macintosh|linux/i.test(userAgent)) return 'desktop';
  return 'unknown';
}

function detectBrowser(userAgent) {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opera/i.test(userAgent)) return 'Opera';
  return 'Unknown';
}

function detectOS(userAgent) {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Unknown';
}

async function calculateLearningStreak(userId) {
  const activities = await Analytics.find({
    user: userId,
    eventType: { $in: ['lesson_complete', 'video_complete', 'quiz_complete'] }
  })
    .select('timestamp')
    .sort('-timestamp')
    .limit(90);

  if (activities.length === 0) return 0;

  let streak = 1;
  const dates = activities.map(a => 
    new Date(a.timestamp).toDateString()
  );
  const uniqueDates = [...new Set(dates)];

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const nextDate = new Date(uniqueDates[i + 1]);
    const diffDays = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
