const Trainer = require('../models/Trainer');
const TrainerPayout = require('../models/TrainerPayout');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');

// @desc    Get all trainers with filtering and pagination
// @route   GET /api/admin/trainers
// @access  Private/Admin
exports.getAllTrainers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      verified,
      applicationStatus,
      search
    } = req.query;

    const query = {};

    // Filter by verification status
    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    // Filter by active status
    if (status !== undefined) {
      query.isActive = status === 'active';
    }

    // Filter by application status
    if (applicationStatus) {
      query.applicationStatus = applicationStatus;
    }

    // Search by name or email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    const trainers = await Trainer.find(query)
      .populate('user', 'name email avatar role status')
      .populate('reviewedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Trainer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: trainers.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: trainers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trainer with detailed info
// @route   GET /api/admin/trainers/:id
// @access  Private/Admin
exports.getTrainerById = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id)
      .populate('user', 'name email avatar phone country language status')
      .populate('reviewedBy', 'name email');

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create trainer profile (admin can create for any user)
// @route   POST /api/admin/trainers
// @access  Private/Admin
exports.createTrainer = async (req, res, next) => {
  try {
    const { userId, ...trainerData } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if trainer profile already exists
    const existingTrainer = await Trainer.findOne({ user: userId });
    if (existingTrainer) {
      return res.status(400).json({
        success: false,
        message: 'Trainer profile already exists for this user'
      });
    }

    // Create trainer profile
    const trainer = await Trainer.create({
      ...trainerData,
      user: userId,
      fullName: user.name,
      applicationStatus: 'approved' // Admin-created trainers are auto-approved
    });

    // Update user role to trainer if not already
    if (user.role === 'student') {
      user.role = 'trainer';
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Trainer profile created successfully',
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trainer profile
// @route   PUT /api/admin/trainers/:id
// @access  Private/Admin
exports.updateTrainer = async (req, res, next) => {
  try {
    let trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    trainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Trainer profile updated successfully',
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trainer profile
// @route   DELETE /api/admin/trainers/:id
// @access  Private/Admin
exports.deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    await Trainer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Trainer profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve trainer application
// @route   PUT /api/admin/trainers/:id/approve
// @access  Private/Admin
exports.approveTrainer = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    trainer.applicationStatus = 'approved';
    trainer.isVerified = true;
    trainer.verificationDate = Date.now();
    trainer.reviewedBy = req.user.id;
    trainer.reviewDate = Date.now();
    trainer.reviewNotes = notes || 'Application approved';

    await trainer.save();

    // Update user role to trainer
    const user = await User.findById(trainer.user);
    if (user && user.role === 'student') {
      user.role = 'trainer';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Trainer application approved successfully',
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject trainer application
// @route   PUT /api/admin/trainers/:id/reject
// @access  Private/Admin
exports.rejectTrainer = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    trainer.applicationStatus = 'rejected';
    trainer.isVerified = false;
    trainer.reviewedBy = req.user.id;
    trainer.reviewDate = Date.now();
    trainer.reviewNotes = notes || 'Application rejected';

    await trainer.save();

    res.status(200).json({
      success: true,
      message: 'Trainer application rejected',
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending trainer applications
// @route   GET /api/admin/trainers/applications/pending
// @access  Private/Admin
exports.getPendingApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const trainers = await Trainer.find({
      applicationStatus: { $in: ['pending', 'under_review'] }
    })
      .populate('user', 'name email avatar createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ applicationDate: 1 });

    const count = await Trainer.countDocuments({
      applicationStatus: { $in: ['pending', 'under_review'] }
    });

    res.status(200).json({
      success: true,
      count: trainers.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: trainers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update verification status
// @route   PUT /api/admin/trainers/:id/verification
// @access  Private/Admin
exports.updateVerificationStatus = async (req, res, next) => {
  try {
    const { isVerified, notes } = req.body;
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    trainer.isVerified = isVerified;
    if (isVerified) {
      trainer.verificationDate = Date.now();
    }
    trainer.reviewedBy = req.user.id;
    trainer.reviewDate = Date.now();
    if (notes) {
      trainer.reviewNotes = notes;
    }

    await trainer.save();

    res.status(200).json({
      success: true,
      message: `Trainer verification status updated to ${isVerified ? 'verified' : 'unverified'}`,
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trainer performance metrics
// @route   GET /api/admin/trainers/:id/metrics
// @access  Private/Admin
exports.getTrainerMetrics = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Get courses created by trainer
    const courses = await Course.find({ instructor: trainer.user });
    const courseIds = courses.map(c => c._id);

    // Get total students enrolled
    const enrollments = await Enrollment.find({ course: { $in: courseIds } });
    const uniqueStudents = [...new Set(enrollments.map(e => e.user.toString()))];

    // Get total revenue from trainer's courses
    const payments = await Payment.find({
      course: { $in: courseIds },
      status: 'completed'
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const trainerEarnings = totalRevenue * (trainer.commissionRate / 100);

    // Calculate completion rate
    const completedEnrollments = enrollments.filter(e => e.progress === 100);
    const completionRate = enrollments.length > 0
      ? ((completedEnrollments.length / enrollments.length) * 100).toFixed(2)
      : 0;

    // Calculate average course rating
    const avgRating = courses.length > 0
      ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(2)
      : 0;

    const metrics = {
      trainer: {
        id: trainer._id,
        name: trainer.fullName,
        rating: trainer.rating,
        commissionRate: trainer.commissionRate
      },
      courses: {
        total: courses.length,
        published: courses.filter(c => c.isPublished).length,
        draft: courses.filter(c => !c.isPublished).length
      },
      students: {
        total: uniqueStudents.length,
        activeEnrollments: enrollments.filter(e => e.progress < 100).length,
        completedEnrollments: completedEnrollments.length
      },
      revenue: {
        totalRevenue,
        trainerEarnings,
        pendingPayout: trainer.pendingPayout,
        totalPaidOut: trainer.totalPaidOut,
        currency: 'USD'
      },
      performance: {
        averageCourseRating: parseFloat(avgRating),
        completionRate: parseFloat(completionRate),
        totalReviews: trainer.reviewsCount
      }
    };

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trainer payouts
// @route   GET /api/admin/trainers/:id/payouts
// @access  Private/Admin
exports.getTrainerPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    const payouts = await TrainerPayout.find({ trainer: req.params.id })
      .populate('processedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await TrainerPayout.countDocuments({ trainer: req.params.id });

    res.status(200).json({
      success: true,
      count: payouts.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: payouts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create trainer payout
// @route   POST /api/admin/trainers/:id/payouts
// @access  Private/Admin
exports.createPayout = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    const {
      amount,
      payoutMethod,
      notes,
      period,
      transactionId
    } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payout amount is required'
      });
    }

    if (amount > trainer.pendingPayout) {
      return res.status(400).json({
        success: false,
        message: 'Payout amount exceeds pending payout balance'
      });
    }

    // Create payout record
    const payout = await TrainerPayout.create({
      trainer: req.params.id,
      amount,
      payoutMethod: payoutMethod || trainer.payoutMethod,
      notes,
      period,
      transactionId,
      processedBy: req.user.id,
      processedAt: Date.now(),
      status: 'completed'
    });

    // Update trainer balances
    trainer.pendingPayout -= amount;
    trainer.totalPaidOut += amount;
    trainer.lastPayoutDate = Date.now();
    await trainer.save();

    res.status(201).json({
      success: true,
      message: 'Payout created successfully',
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payout status
// @route   PUT /api/admin/trainers/payouts/:payoutId
// @access  Private/Admin
exports.updatePayoutStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const payout = await TrainerPayout.findById(req.params.payoutId);

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    payout.status = status;
    if (notes) {
      payout.notes = notes;
    }
    payout.processedBy = req.user.id;
    payout.processedAt = Date.now();

    await payout.save();

    res.status(200).json({
      success: true,
      message: 'Payout status updated successfully',
      data: payout
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payouts (for all trainers)
// @route   GET /api/admin/trainers/payouts
// @access  Private/Admin
exports.getAllPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const payouts = await TrainerPayout.find(query)
      .populate({
        path: 'trainer',
        select: 'fullName trainerId',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('processedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await TrainerPayout.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payouts.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: payouts
    });
  } catch (error) {
    next(error);
  }
};
