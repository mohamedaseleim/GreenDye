const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');

// @desc    Get all enrollments with filters and pagination
// @route   GET /api/admin/enrollments
// @access  Private/Admin
exports.getAllEnrollments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      courseId,
      userId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (courseId) filter.course = courseId;
    if (userId) filter.user = userId;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    // Get enrollments with populated data
    const enrollments = await Enrollment.find(filter)
      .populate('user', 'name email avatar')
      .populate('course', 'title thumbnail price category')
      .populate('certificate', 'certificateId issueDate')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await Enrollment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: enrollments.length,
      totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      data: enrollments
    });
  } catch (error) {
    logger.error('Get all enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// @desc    Get enrollment analytics
// @route   GET /api/admin/enrollments/analytics
// @access  Private/Admin
exports.getEnrollmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, courseId } = req.query;

    // Build filter for date range
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (courseId) filter.course = courseId;

    // Total enrollments
    const totalEnrollments = await Enrollment.countDocuments(filter);

    // Enrollments by status
    const enrollmentsByStatus = await Enrollment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      ...filter,
      status: 'active'
    });

    // Completed enrollments
    const completedEnrollments = await Enrollment.countDocuments({
      ...filter,
      status: 'completed'
    });

    // Completion rate
    const completionRate = totalEnrollments > 0 
      ? (completedEnrollments / totalEnrollments * 100).toFixed(2)
      : 0;

    // Average progress
    const avgProgressResult = await Enrollment.aggregate([
      { $match: filter },
      { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
    ]);
    const avgProgress = avgProgressResult.length > 0 
      ? avgProgressResult[0].avgProgress.toFixed(2) 
      : 0;

    // Enrollments over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const enrollmentsOverTime = await Enrollment.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top courses by enrollment
    const topCourses = await Enrollment.aggregate([
      { $match: filter },
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          courseId: '$_id',
          courseName: '$courseInfo.title',
          enrollmentCount: '$count'
        }
      }
    ]);

    // Average time to completion
    const completionTimeResult = await Enrollment.aggregate([
      {
        $match: {
          ...filter,
          status: 'completed',
          completionDate: { $exists: true }
        }
      },
      {
        $project: {
          daysToComplete: {
            $divide: [
              { $subtract: ['$completionDate', '$startDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$daysToComplete' }
        }
      }
    ]);
    const avgCompletionDays = completionTimeResult.length > 0 
      ? completionTimeResult[0].avgDays.toFixed(2) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate: parseFloat(completionRate),
        avgProgress: parseFloat(avgProgress),
        avgCompletionDays: parseFloat(avgCompletionDays),
        enrollmentsByStatus: enrollmentsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        enrollmentsOverTime,
        topCourses
      }
    });
  } catch (error) {
    logger.error('Get enrollment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment analytics',
      error: error.message
    });
  }
};

// @desc    Manually enroll a user in a course
// @route   POST /api/admin/enrollments
// @access  Private/Admin
exports.manualEnrollment = async (req, res) => {
  try {
    const { userId, courseId, status = 'active', notes } = req.body;

    // Validate required fields
    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Course ID are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'User is already enrolled in this course',
        data: existingEnrollment
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      status,
      notes: notes ? [{ 
        content: `Admin enrollment: ${notes}`,
        createdAt: Date.now()
      }] : []
    });

    // Update course enrolled count
    course.enrolled = (course.enrolled || 0) + 1;
    await course.save();

    // Populate the enrollment data
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('user', 'name email avatar')
      .populate('course', 'title thumbnail price category');

    logger.info(`Manual enrollment created by admin ${req.user.id} for user ${userId} in course ${courseId}`);

    res.status(201).json({
      success: true,
      message: 'User enrolled successfully',
      data: populatedEnrollment
    });
  } catch (error) {
    logger.error('Manual enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating enrollment',
      error: error.message
    });
  }
};

// @desc    Manually unenroll a user from a course
// @route   DELETE /api/admin/enrollments/:id
// @access  Private/Admin
exports.manualUnenrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Find the enrollment
    const enrollment = await Enrollment.findById(id)
      .populate('user', 'name email')
      .populate('course', 'title');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if there's a payment associated
    const payment = await Payment.findOne({
      user: enrollment.user._id,
      course: enrollment.course._id,
      status: 'completed'
    });

    if (payment && payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot unenroll user with completed payment. Process a refund first.',
        paymentId: payment._id
      });
    }

    // Get course to update enrolled count
    const course = await Course.findById(enrollment.course._id);
    if (course && course.enrolled > 0) {
      course.enrolled -= 1;
      await course.save();
    }

    // Delete the enrollment
    await Enrollment.findByIdAndDelete(id);

    logger.info(`Manual unenrollment by admin ${req.user.id} for enrollment ${id}. Reason: ${reason || 'Not provided'}`);

    res.status(200).json({
      success: true,
      message: 'User unenrolled successfully',
      data: {
        enrollmentId: id,
        userId: enrollment.user._id,
        courseId: enrollment.course._id,
        reason
      }
    });
  } catch (error) {
    logger.error('Manual unenrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting enrollment',
      error: error.message
    });
  }
};

// @desc    Update enrollment status
// @route   PUT /api/admin/enrollments/:id/status
// @access  Private/Admin
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'completed', 'dropped', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update enrollment
    const enrollment = await Enrollment.findByIdAndUpdate(
      id,
      { 
        status,
        ...(status === 'completed' && { completionDate: Date.now() })
      },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('course', 'title');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    logger.info(`Enrollment ${id} status updated to ${status} by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Enrollment status updated successfully',
      data: enrollment
    });
  } catch (error) {
    logger.error('Update enrollment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment status',
      error: error.message
    });
  }
};

// @desc    Get single enrollment details
// @route   GET /api/admin/enrollments/:id
// @access  Private/Admin
exports.getEnrollmentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findById(id)
      .populate('user', 'name email avatar role')
      .populate('course', 'title description thumbnail price category instructor')
      .populate('completedLessons.lesson', 'title duration')
      .populate('quizScores.quiz', 'title')
      .populate('certificate', 'certificateId issueDate verificationUrl');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Get related payment if exists
    const payment = await Payment.findOne({
      user: enrollment.user._id,
      course: enrollment.course._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        enrollment,
        payment
      }
    });
  } catch (error) {
    logger.error('Get enrollment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment details',
      error: error.message
    });
  }
};
