const Trainer = require('../models/Trainer');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const TrainerPayout = require('../models/TrainerPayout');
const Payment = require('../models/Payment');

// @desc    Get trainer dashboard statistics
// @route   GET /api/trainers/dashboard/stats
// @access  Private/Trainer
exports.getTrainerStats = async (req, res, next) => {
  try {
    // Find trainer profile for current user
    const trainer = await Trainer.findOne({ user: req.user.id });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer profile not found'
      });
    }

    // Get total courses (both published and draft)
    const totalCourses = await Course.countDocuments({ instructor: req.user.id });
    const publishedCourses = await Course.countDocuments({ 
      instructor: req.user.id, 
      isPublished: true 
    });

    // Get all courses for this trainer
    const courses = await Course.find({ instructor: req.user.id }).select('_id');
    const courseIds = courses.map(c => c._id);

    // Get total students (unique enrollments)
    const totalEnrollments = await Enrollment.countDocuments({
      course: { $in: courseIds },
      status: { $ne: 'dropped' }
    });

    // Get active students
    const activeEnrollments = await Enrollment.countDocuments({
      course: { $in: courseIds },
      status: 'active'
    });

    // Get completed enrollments
    const completedEnrollments = await Enrollment.countDocuments({
      course: { $in: courseIds },
      status: 'completed'
    });

    // Calculate average course rating from enrollments
    const enrollmentsWithRatings = await Enrollment.find({
      course: { $in: courseIds },
      rating: { $exists: true, $ne: null }
    }).select('rating');

    let averageRating = 0;
    if (enrollmentsWithRatings.length > 0) {
      const totalRating = enrollmentsWithRatings.reduce((sum, e) => sum + (e.rating || 0), 0);
      averageRating = totalRating / enrollmentsWithRatings.length;
    }

    // Get total earnings from payments
    const payments = await Payment.find({
      course: { $in: courseIds },
      status: 'completed'
    }).select('amount currency');

    let totalRevenue = 0;
    if (payments.length > 0) {
      // Sum all payments (simplified - assuming same currency or proper conversion needed)
      totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    // Calculate trainer earnings based on commission rate
    const trainerEarnings = totalRevenue * ((100 - trainer.commissionRate) / 100);

    // Get recent enrollments for activity tracking
    const recentEnrollments = await Enrollment.find({
      course: { $in: courseIds }
    })
      .sort({ startDate: -1 })
      .limit(5)
      .populate('user', 'name email avatar')
      .populate('course', 'title');

    res.status(200).json({
      success: true,
      data: {
        trainer: {
          id: trainer._id,
          trainerId: trainer.trainerId,
          fullName: trainer.fullName,
          rating: trainer.rating || averageRating,
          isVerified: trainer.isVerified,
          commissionRate: trainer.commissionRate
        },
        stats: {
          totalCourses,
          publishedCourses,
          draftCourses: totalCourses - publishedCourses,
          totalStudents: totalEnrollments,
          activeStudents: activeEnrollments,
          completedStudents: completedEnrollments,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: enrollmentsWithRatings.length
        },
        earnings: {
          totalRevenue,
          trainerEarnings: Math.round(trainerEarnings * 100) / 100,
          platformFee: Math.round((totalRevenue - trainerEarnings) * 100) / 100,
          pendingPayout: trainer.pendingPayout || 0,
          totalPaidOut: trainer.totalPaidOut || 0
        },
        recentActivity: recentEnrollments.map(e => ({
          _id: e._id,
          student: {
            name: e.user?.name,
            email: e.user?.email,
            avatar: e.user?.avatar
          },
          course: {
            title: typeof e.course?.title === 'object' && e.course?.title
              ? e.course.title.get('en') || e.course.title.get('ar') || e.course.title.get('fr')
              : e.course?.title || 'Unknown Course'
          },
          enrolledAt: e.startDate,
          status: e.status,
          progress: e.progress || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error in getTrainerStats:', error);
    next(error);
  }
};

// @desc    Get trainer courses with enrollment data
// @route   GET /api/trainers/dashboard/courses
// @access  Private/Trainer
exports.getTrainerCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Find trainer profile
    const trainer = await Trainer.findOne({ user: req.user.id });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer profile not found'
      });
    }

    // Build query
    const query = { instructor: req.user.id };
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    const courses = await Course.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Course.countDocuments(query);

    // Enhance each course with enrollment data
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.countDocuments({
          course: course._id,
          status: { $ne: 'dropped' }
        });

        const activeEnrollments = await Enrollment.countDocuments({
          course: course._id,
          status: 'active'
        });

        const completedEnrollments = await Enrollment.countDocuments({
          course: course._id,
          status: 'completed'
        });

        // Get course revenue
        const payments = await Payment.find({
          course: course._id,
          status: 'completed'
        }).select('amount');

        const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Get average rating for this course
        const ratingsData = await Enrollment.find({
          course: course._id,
          rating: { $exists: true, $ne: null }
        }).select('rating');

        let avgRating = 0;
        if (ratingsData.length > 0) {
          avgRating = ratingsData.reduce((sum, e) => sum + e.rating, 0) / ratingsData.length;
        }

        return {
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          category: course.category,
          level: course.level,
          price: course.price,
          currency: course.currency,
          isPublished: course.isPublished,
          createdAt: course.createdAt,
          stats: {
            totalEnrollments: enrollments,
            activeEnrollments,
            completedEnrollments,
            revenue: Math.round(revenue * 100) / 100,
            rating: Math.round(avgRating * 10) / 10,
            reviewsCount: ratingsData.length
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: coursesWithStats.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: coursesWithStats
    });
  } catch (error) {
    console.error('Error in getTrainerCourses:', error);
    next(error);
  }
};

// @desc    Get trainer students
// @route   GET /api/trainers/dashboard/students
// @access  Private/Trainer
exports.getTrainerStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, courseId } = req.query;

    // Find trainer profile
    const trainer = await Trainer.findOne({ user: req.user.id });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer profile not found'
      });
    }

    // Build query for enrollments
    let enrollmentQuery = {};
    
    if (courseId) {
      // Verify the course belongs to this trainer
      const course = await Course.findOne({ 
        _id: courseId, 
        instructor: req.user.id 
      });
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found or does not belong to this trainer'
        });
      }
      
      enrollmentQuery.course = courseId;
    } else {
      // Get all courses for this trainer
      const courses = await Course.find({ instructor: req.user.id }).select('_id');
      enrollmentQuery.course = { $in: courses.map(c => c._id) };
    }

    enrollmentQuery.status = { $ne: 'dropped' };

    const enrollments = await Enrollment.find(enrollmentQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startDate: -1 })
      .populate('user', 'name email avatar country')
      .populate('course', 'title thumbnail category');

    const count = await Enrollment.countDocuments(enrollmentQuery);

    res.status(200).json({
      success: true,
      count: enrollments.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: enrollments
    });
  } catch (error) {
    console.error('Error in getTrainerStudents:', error);
    next(error);
  }
};

// @desc    Get trainer earnings and payout history
// @route   GET /api/trainers/dashboard/earnings
// @access  Private/Trainer
exports.getTrainerEarnings = async (req, res, next) => {
  try {
    // Find trainer profile
    const trainer = await Trainer.findOne({ user: req.user.id });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer profile not found'
      });
    }

    // Get all courses for this trainer
    const courses = await Course.find({ instructor: req.user.id }).select('_id title');
    const courseIds = courses.map(c => c._id);

    // Get all completed payments
    const payments = await Payment.find({
      course: { $in: courseIds },
      status: 'completed'
    })
      .populate('course', 'title')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const trainerEarnings = totalRevenue * ((100 - trainer.commissionRate) / 100);

    // Get payout history
    const payouts = await TrainerPayout.find({ trainer: trainer._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('processedBy', 'name email');

    // Calculate earnings by course
    const earningsByCourse = courses.map(course => {
      const coursePayments = payments.filter(
        p => p.course?._id?.toString() === course._id.toString()
      );
      const courseRevenue = coursePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const courseEarnings = courseRevenue * ((100 - trainer.commissionRate) / 100);

      return {
        courseId: course._id,
        courseTitle: course.title,
        revenue: Math.round(courseRevenue * 100) / 100,
        earnings: Math.round(courseEarnings * 100) / 100,
        enrollments: coursePayments.length
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          trainerEarnings: Math.round(trainerEarnings * 100) / 100,
          platformFee: Math.round((totalRevenue - trainerEarnings) * 100) / 100,
          commissionRate: trainer.commissionRate,
          pendingPayout: trainer.pendingPayout || 0,
          totalPaidOut: trainer.totalPaidOut || 0,
          lastPayoutDate: trainer.lastPayoutDate
        },
        earningsByCourse,
        recentPayments: payments.slice(0, 10).map(p => ({
          _id: p._id,
          amount: p.amount,
          currency: p.currency,
          course: p.course,
          user: p.user,
          date: p.createdAt
        })),
        payoutHistory: payouts.map(p => ({
          _id: p._id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          payoutMethod: p.payoutMethod,
          processedAt: p.processedAt,
          processedBy: p.processedBy,
          notes: p.notes
        }))
      }
    });
  } catch (error) {
    console.error('Error in getTrainerEarnings:', error);
    next(error);
  }
};
