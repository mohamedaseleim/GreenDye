const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Analytics = require('../models/Analytics');
const logger = require('../utils/logger');
const mongoSanitize = require('mongo-sanitize');

// @desc    Get all courses (admin view with filters)
// @route   GET /api/admin/courses
// @access  Private/Admin
exports.getAdminCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      level,
      approvalStatus,
      isPublished,
      instructor,
      search
    } = req.query;

    const query = {};

    // Sanitize all query parameters to prevent NoSQL injection
    if (category) query.category = mongoSanitize(category);
    if (level) query.level = mongoSanitize(level);
    if (approvalStatus) query.approvalStatus = mongoSanitize(approvalStatus);
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (instructor) query.instructor = mongoSanitize(instructor);
    
    // Search functionality - sanitize search input to prevent NoSQL injection
    if (search) {
      const sanitizedSearch = mongoSanitize(search);
      // Escape regex special characters
      const escapedSearch = sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { 'title.en': { $regex: escapedSearch, $options: 'i' } },
        { 'title.ar': { $regex: escapedSearch, $options: 'i' } },
        { 'title.fr': { $regex: escapedSearch, $options: 'i' } },
        { 'description.en': { $regex: escapedSearch, $options: 'i' } },
        { 'description.ar': { $regex: escapedSearch, $options: 'i' } },
        { 'description.fr': { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      count: courses.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: courses
    });
  } catch (error) {
    logger.error('Error fetching admin courses:', error);
    next(error);
  }
};

// @desc    Get pending courses for approval
// @route   GET /api/admin/courses/pending
// @access  Private/Admin
exports.getPendingCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const courses = await Course.find({ approvalStatus: 'pending' })
      .populate('instructor', 'name email avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const count = await Course.countDocuments({ approvalStatus: 'pending' });

    res.status(200).json({
      success: true,
      count: courses.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: courses
    });
  } catch (error) {
    logger.error('Error fetching pending courses:', error);
    next(error);
  }
};

// @desc    Create course (admin-specific)
// @route   POST /api/admin/courses
// @access  Private/Admin
exports.createAdminCourse = async (req, res, next) => {
  try {
    // Sanitize input to prevent NoSQL injection
    const sanitizedData = mongoSanitize(req.body);
    
    // Allow admin to set instructor or leave empty
    // Set default approvalStatus to 'approved' for admin-created courses
    // Set isPublished based on admin's choice
    const courseData = {
      ...sanitizedData,
      approvalStatus: sanitizedData.approvalStatus || 'approved',
      isPublished: sanitizedData.isPublished ?? true
    };

    // If no instructor is provided, set to admin's ID
    if (!courseData.instructor) {
      courseData.instructor = req.user.id;
    }
    
    const course = await Course.create(courseData);
    
    // Populate instructor data for response
    await course.populate('instructor', 'name email avatar');

    logger.info(`Admin ${req.user.id} created course ${course._id}`);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    logger.error('Error creating admin course:', error);
    next(error);
  }
};

// @desc    Set course pricing and discounts
// @route   PUT /api/admin/courses/:id/pricing
// @access  Private/Admin
exports.setCoursePricing = async (req, res, next) => {
  try {
    const { price, currency, discount } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update pricing
    if (price !== undefined) course.price = price;
    if (currency) course.currency = currency;
    
    // Update discount information
    if (discount !== undefined) {
      course.discount = {
        percentage: discount.percentage || 0,
        startDate: discount.startDate,
        endDate: discount.endDate,
        isActive: discount.isActive !== undefined ? discount.isActive : true
      };
    }

    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    logger.error('Error setting course pricing:', error);
    next(error);
  }
};

// @desc    Get course analytics
// @route   GET /api/admin/courses/:id/analytics
// @access  Private/Admin
exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get enrollment statistics
    const totalEnrollments = await Enrollment.countDocuments({ course: courseId });
    const activeEnrollments = await Enrollment.countDocuments({ 
      course: courseId, 
      status: 'active' 
    });
    const completedEnrollments = await Enrollment.countDocuments({ 
      course: courseId, 
      status: 'completed' 
    });

    // Calculate completion rate
    const completionRate = totalEnrollments > 0 
      ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2) 
      : 0;

    // Get average progress
    const enrollments = await Enrollment.find({ course: courseId });
    const avgProgress = enrollments.length > 0
      ? (enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length).toFixed(2)
      : 0;

    // Get views from Analytics
    const views = await Analytics.countDocuments({ 
      course: courseId, 
      eventType: 'course_view' 
    });

    // Get enrollment trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEnrollments = await Enrollment.find({ 
      course: courseId,
      startDate: { $gte: thirtyDaysAgo }
    }).sort({ startDate: 1 });

    // Group enrollments by date
    const enrollmentTrend = recentEnrollments.reduce((acc, enrollment) => {
      const date = enrollment.startDate.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Calculate average rating from enrollments with ratings
    const ratedEnrollments = await Enrollment.find({ 
      course: courseId, 
      rating: { $exists: true, $ne: null } 
    });
    const avgRating = ratedEnrollments.length > 0
      ? (ratedEnrollments.reduce((sum, e) => sum + e.rating, 0) / ratedEnrollments.length).toFixed(2)
      : course.rating;

    // Calculate revenue (if course has price)
    const revenue = course.price * totalEnrollments;

    res.status(200).json({
      success: true,
      data: {
        courseId,
        courseName: course.title,
        enrollments: {
          total: totalEnrollments,
          active: activeEnrollments,
          completed: completedEnrollments,
          dropped: await Enrollment.countDocuments({ course: courseId, status: 'dropped' }),
          suspended: await Enrollment.countDocuments({ course: courseId, status: 'suspended' })
        },
        completionRate: parseFloat(completionRate),
        averageProgress: parseFloat(avgProgress),
        views,
        rating: {
          average: parseFloat(avgRating),
          count: ratedEnrollments.length
        },
        enrollmentTrend,
        revenue: {
          total: revenue,
          currency: course.currency || 'USD'
        },
        metadata: course.metadata
      }
    });
  } catch (error) {
    logger.error('Error fetching course analytics:', error);
    next(error);
  }
};

// @desc    Get all course categories
// @route   GET /api/admin/courses/categories
// @access  Private/Admin
exports.getCourseCategories = async (req, res, next) => {
  try {
    // Get distinct categories from courses
    const categories = await Course.distinct('category');
    
    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => ({
        name: category,
        count: await Course.countDocuments({ category })
      }))
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    logger.error('Error fetching course categories:', error);
    next(error);
  }
};

// @desc    Update course category
// @route   PUT /api/admin/courses/:id/category
// @access  Private/Admin
exports.updateCourseCategory = async (req, res, next) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a category'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.category = category;
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    logger.error('Error updating course category:', error);
    next(error);
  }
};

// @desc    Get all course tags
// @route   GET /api/admin/courses/tags
// @access  Private/Admin
exports.getCourseTags = async (req, res, next) => {
  try {
    // Get all tags from all courses
    const courses = await Course.find({}, 'tags');
    const allTags = courses.reduce((acc, course) => {
      if (course.tags && course.tags.length > 0) {
        return [...acc, ...course.tags];
      }
      return acc;
    }, []);

    // Get unique tags with counts
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    const tagsWithCount = Object.entries(tagCounts).map(([tag, count]) => ({
      name: tag,
      count
    })).sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      count: tagsWithCount.length,
      data: tagsWithCount
    });
  } catch (error) {
    logger.error('Error fetching course tags:', error);
    next(error);
  }
};

// @desc    Update course tags
// @route   PUT /api/admin/courses/:id/tags
// @access  Private/Admin
exports.updateCourseTags = async (req, res, next) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array'
      });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.tags = tags;
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    logger.error('Error updating course tags:', error);
    next(error);
  }
};

// @desc    Bulk update courses
// @route   PUT /api/admin/courses/bulk-update
// @access  Private/Admin
exports.bulkUpdateCourses = async (req, res, next) => {
  try {
    const { courseIds, updates } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of course IDs'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Please provide updates object'
      });
    }

    // Sanitize inputs to prevent NoSQL injection
    const sanitizedUpdates = mongoSanitize(updates);
    
    // Prevent updating certain protected fields
    delete sanitizedUpdates._id;
    delete sanitizedUpdates.instructor;
    delete sanitizedUpdates.createdAt;

    const result = await Course.updateMany(
      { _id: { $in: courseIds } },
      { $set: sanitizedUpdates }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} courses updated`,
      data: result
    });
  } catch (error) {
    logger.error('Error bulk updating courses:', error);
    next(error);
  }
};

// @desc    Get course statistics
// @route   GET /api/admin/courses/statistics
// @access  Private/Admin
exports.getCourseStatistics = async (req, res, next) => {
  try {
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const pendingApproval = await Course.countDocuments({ approvalStatus: 'pending' });
    const approvedCourses = await Course.countDocuments({ approvalStatus: 'approved' });
    const rejectedCourses = await Course.countDocuments({ approvalStatus: 'rejected' });
    const draftCourses = await Course.countDocuments({ approvalStatus: 'draft' });

    // Category breakdown
    const categoryStats = await Course.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Level breakdown
    const levelStats = await Course.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top courses by enrollment
    const topCourses = await Course.find({ isPublished: true })
      .select('title enrolled rating category')
      .sort({ enrolled: -1 })
      .limit(10);

    // Total enrollments across all courses
    const totalEnrollments = await Enrollment.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: totalCourses,
          published: publishedCourses,
          pendingApproval,
          approved: approvedCourses,
          rejected: rejectedCourses,
          draft: draftCourses
        },
        categoryBreakdown: categoryStats,
        levelBreakdown: levelStats,
        topCourses,
        totalEnrollments
      }
    });
  } catch (error) {
    logger.error('Error fetching course statistics:', error);
    next(error);
  }
};
