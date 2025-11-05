const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Payment = require('../models/Payment');
const posthog = require('../services/posthog');
const logger = require('../utils/logger');

// @desc    Track analytics event
// @route   POST /api/analytics/track
// @access  Private
exports.trackEvent = async (req, res, _next) => {
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
        logger.error('PostHog capture error:', phError);
      }
    }

    res.status(201).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking event',
      error: error.message
    });
  }
};

// @desc    Get platform statistics (Admin)
// @route   GET /api/analytics/platform
// @access  Private/Admin
exports.getPlatformStats = async (req, res, _next) => {
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
    logger.error('Get platform stats error:', error);
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
exports.getCourseAnalytics = async (req, res, _next) => {
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
    logger.error('Get course analytics error:', error);
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
exports.getUserAnalytics = async (req, res, _next) => {
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
    logger.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics',
      error: error.message
    });
  }
};

// Helper functions
function getCountryMatchFilter(fieldPath) {
  return {
    [fieldPath]: { $exists: true, $ne: null },
    $expr: { $ne: [`$${fieldPath}`, ''] }
  };
}

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

// @desc    Get user growth trends
// @route   GET /api/analytics/user-growth
// @access  Private/Admin
exports.getUserGrowthTrends = async (req, res, _next) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const matchFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    
    let groupBy = {};
    switch (period) {
      case 'hourly':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'daily':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'monthly':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }
    
    const userGrowth = await User.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          trainers: { $sum: { $cond: [{ $eq: ['$role', 'trainer'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.week': 1 } }
    ]);
    
    // Calculate cumulative growth
    let cumulative = 0;
    const growthWithCumulative = userGrowth.map(item => {
      cumulative += item.count;
      return { ...item, cumulative };
    });
    
    res.status(200).json({
      success: true,
      data: {
        period,
        growth: growthWithCumulative
      }
    });
  } catch (error) {
    logger.error('Get user growth trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user growth trends',
      error: error.message
    });
  }
};

// @desc    Get revenue trends
// @route   GET /api/analytics/revenue-trends
// @access  Private/Admin
exports.getRevenueTrends = async (req, res, _next) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const dateFilter = { status: 'completed' };
    
    if (startDate) dateFilter.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      dateFilter.createdAt = dateFilter.createdAt || {};
      dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    let groupBy = {};
    switch (period) {
      case 'daily':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'monthly':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
    }
    
    const revenueTrends = await Payment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgTransactionValue: { $avg: '$amount' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          _id: 1,
          revenue: 1,
          transactions: 1,
          avgTransactionValue: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);
    
    // Calculate cumulative revenue
    let cumulative = 0;
    const trendsWithCumulative = revenueTrends.map(item => {
      cumulative += item.revenue;
      return { ...item, cumulativeRevenue: cumulative };
    });
    
    res.status(200).json({
      success: true,
      data: {
        period,
        trends: trendsWithCumulative
      }
    });
  } catch (error) {
    logger.error('Get revenue trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue trends',
      error: error.message
    });
  }
};

// @desc    Get course popularity metrics
// @route   GET /api/analytics/course-popularity
// @access  Private/Admin
exports.getCoursePopularityMetrics = async (req, res, _next) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const enrollmentFilter = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter } 
      : {};
    
    // Get course metrics
    const courseMetrics = await Enrollment.aggregate([
      { $match: enrollmentFilter },
      {
        $group: {
          _id: '$course',
          totalEnrollments: { $sum: 1 },
          completedEnrollments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          activeEnrollments: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          avgProgress: { $avg: '$progress' }
        }
      },
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
          courseId: '$_id',
          title: '$course.title',
          instructor: '$course.instructor',
          totalEnrollments: 1,
          completedEnrollments: 1,
          activeEnrollments: 1,
          avgProgress: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalEnrollments', 0] },
              0,
              { $multiply: [{ $divide: ['$completedEnrollments', '$totalEnrollments'] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalEnrollments: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    // Get enrollment trends for top courses
    const topCourseIds = courseMetrics.slice(0, 5).map(c => c.courseId);
    const enrollmentTrends = await Enrollment.aggregate([
      { $match: { course: { $in: topCourseIds } } },
      {
        $group: {
          _id: {
            course: '$course',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $lookup: {
          from: 'courses',
          localField: '_id.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          courseId: '$_id.course',
          courseTitle: '$course.title',
          year: '$_id.year',
          month: '$_id.month',
          enrollments: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        courseMetrics,
        enrollmentTrends
      }
    });
  } catch (error) {
    logger.error('Get course popularity metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course popularity metrics',
      error: error.message
    });
  }
};

// @desc    Get geographic distribution
// @route   GET /api/analytics/geographic-distribution
// @access  Private/Admin
exports.getGeographicDistribution = async (req, res, _next) => {
  try {
    // Get user distribution by country
    const userDistribution = await User.aggregate([
      { $match: getCountryMatchFilter('country') },
      {
        $group: {
          _id: '$country',
          totalUsers: { $sum: 1 },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          trainers: { $sum: { $cond: [{ $eq: ['$role', 'trainer'] }, 1, 0] } },
          activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      },
      { $sort: { totalUsers: -1 } },
      { $limit: 20 }
    ]);
    
    // Get revenue distribution by country
    const revenueDistribution = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          ...getCountryMatchFilter('metadata.country')
        } 
      },
      {
        $group: {
          _id: '$metadata.country',
          totalRevenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgTransactionValue: { $avg: '$amount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 }
    ]);
    
    // Get enrollment distribution
    const enrollmentDistribution = await Enrollment.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      { $match: getCountryMatchFilter('userData.country') },
      {
        $group: {
          _id: '$userData.country',
          totalEnrollments: { $sum: 1 },
          completedEnrollments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { totalEnrollments: -1 } },
      { $limit: 20 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        userDistribution,
        revenueDistribution,
        enrollmentDistribution
      }
    });
  } catch (error) {
    logger.error('Get geographic distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching geographic distribution',
      error: error.message
    });
  }
};

// @desc    Get peak usage times
// @route   GET /api/analytics/peak-usage-times
// @access  Private/Admin
exports.getPeakUsageTimes = async (req, res, _next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const timestampFilter = Object.keys(dateFilter).length > 0 
      ? { timestamp: dateFilter } 
      : {};
    
    // Get hourly activity distribution
    const hourlyActivity = await Analytics.aggregate([
      { $match: timestampFilter },
      {
        $group: {
          _id: { hour: { $hour: '$timestamp' } },
          totalEvents: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          eventTypes: { $push: '$eventType' }
        }
      },
      {
        $project: {
          hour: '$_id.hour',
          totalEvents: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          _id: 0
        }
      },
      { $sort: { hour: 1 } }
    ]);
    
    // Get daily activity distribution (day of week)
    const dailyActivity = await Analytics.aggregate([
      { $match: timestampFilter },
      {
        $group: {
          _id: { dayOfWeek: { $dayOfWeek: '$timestamp' } },
          totalEvents: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id.dayOfWeek',
          totalEvents: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          _id: 0
        }
      },
      { $sort: { dayOfWeek: 1 } }
    ]);
    
    // Get peak activity by event type
    const eventTypeActivity = await Analytics.aggregate([
      { $match: timestampFilter },
      {
        $group: {
          _id: {
            eventType: '$eventType',
            hour: { $hour: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    
    // Day of week mapping
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyWithNames = dailyActivity.map(item => ({
      ...item,
      dayName: dayNames[item.dayOfWeek - 1]
    }));
    
    res.status(200).json({
      success: true,
      data: {
        hourlyActivity,
        dailyActivity: dailyWithNames,
        eventTypeActivity
      }
    });
  } catch (error) {
    logger.error('Get peak usage times error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching peak usage times',
      error: error.message
    });
  }
};

// @desc    Get conversion funnel
// @route   GET /api/analytics/conversion-funnel
// @access  Private/Admin
exports.getConversionFunnel = async (req, res, _next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const userFilter = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter } 
      : {};
    
    // Stage 1: Total visitors (unique page views)
    const visitorsResult = await Analytics.aggregate([
      { 
        $match: {
          eventType: 'page_view',
          ...(Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {})
        }
      },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);
    const visitors = visitorsResult[0]?.total || 0;
    
    // Stage 2: Signups (registered users)
    const signups = await User.countDocuments(userFilter);
    
    // Stage 3: Course viewers (users who viewed at least one course)
    const courseViewersResult = await Analytics.aggregate([
      { 
        $match: {
          eventType: 'course_view',
          ...(Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {})
        }
      },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);
    const courseViewers = courseViewersResult[0]?.total || 0;
    
    // Stage 4: Enrolled users
    const enrolledUsersResult = await Enrollment.aggregate([
      { 
        $match: {
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        }
      },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);
    const enrolledUsers = enrolledUsersResult[0]?.total || 0;
    
    // Stage 5: Active learners (users with lesson completion)
    const activeLearnersResult = await Analytics.aggregate([
      { 
        $match: {
          eventType: { $in: ['lesson_complete', 'video_complete'] },
          ...(Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {})
        }
      },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);
    const activeLearners = activeLearnersResult[0]?.total || 0;
    
    // Stage 6: Course completers
    const courseCompletersResult = await Enrollment.aggregate([
      { 
        $match: {
          status: 'completed',
          ...(Object.keys(dateFilter).length > 0 ? { completionDate: dateFilter } : {})
        }
      },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);
    const courseCompleters = courseCompletersResult[0]?.total || 0;
    
    // Stage 7: Certificate earners
    const certificateEarnersResult = await Certificate.aggregate([
      { 
        $match: {
          isValid: true,
          ...(Object.keys(dateFilter).length > 0 ? { issuedAt: dateFilter } : {})
        }
      },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);
    const certificateEarners = certificateEarnersResult[0]?.total || 0;
    
    // Calculate conversion rates
    const funnelData = [
      { stage: 'Visitors', count: visitors, percentage: 100 },
      { 
        stage: 'Signups', 
        count: signups, 
        percentage: visitors > 0 ? (signups / visitors * 100).toFixed(2) : 0 
      },
      { 
        stage: 'Course Viewers', 
        count: courseViewers, 
        percentage: signups > 0 ? (courseViewers / signups * 100).toFixed(2) : 0 
      },
      { 
        stage: 'Enrollments', 
        count: enrolledUsers, 
        percentage: courseViewers > 0 ? (enrolledUsers / courseViewers * 100).toFixed(2) : 0 
      },
      { 
        stage: 'Active Learners', 
        count: activeLearners, 
        percentage: enrolledUsers > 0 ? (activeLearners / enrolledUsers * 100).toFixed(2) : 0 
      },
      { 
        stage: 'Course Completers', 
        count: courseCompleters, 
        percentage: activeLearners > 0 ? (courseCompleters / activeLearners * 100).toFixed(2) : 0 
      },
      { 
        stage: 'Certificate Earners', 
        count: certificateEarners, 
        percentage: courseCompleters > 0 ? (certificateEarners / courseCompleters * 100).toFixed(2) : 0 
      }
    ];
    
    // Calculate drop-off rates
    const dropOffRates = funnelData.map((stage, index) => {
      if (index === 0) return { ...stage, dropOff: 0 };
      const previousCount = funnelData[index - 1].count;
      const dropOff = previousCount > 0 ? ((previousCount - stage.count) / previousCount * 100).toFixed(2) : 0;
      return { ...stage, dropOff };
    });
    
    res.status(200).json({
      success: true,
      data: {
        funnel: dropOffRates,
        overallConversionRate: visitors > 0 
          ? ((certificateEarners / visitors) * 100).toFixed(2) 
          : 0
      }
    });
  } catch (error) {
    logger.error('Get conversion funnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversion funnel',
      error: error.message
    });
  }
};
