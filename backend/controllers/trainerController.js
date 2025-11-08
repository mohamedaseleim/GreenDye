const Trainer = require('../models/Trainer');
const Course = require('../models/Course');

// @desc    Get all trainers
// @route   GET /api/trainers
// @access  Public
exports.getTrainers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const trainers = await Trainer.find({ 
      isActive: true, 
      $or: [
        { isVerified: true },
        { applicationStatus: 'approved' }
      ]
    })
      .populate('user', 'name email avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });

    const count = await Trainer.countDocuments({ 
      isActive: true, 
      $or: [
        { isVerified: true },
        { applicationStatus: 'approved' }
      ]
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

// @desc    Get single trainer
// @route   GET /api/trainers/:id
// @access  Public
exports.getTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id)
      .populate('user', 'name email avatar');

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

// @desc    Create trainer profile
// @route   POST /api/trainers
// @access  Private
exports.createTrainer = async (req, res, next) => {
  try {
    // Check if trainer profile already exists
    const existingTrainer = await Trainer.findOne({ user: req.user.id });

    if (existingTrainer) {
      return res.status(400).json({
        success: false,
        message: 'Trainer profile already exists'
      });
    }

    req.body.user = req.user.id;
    req.body.fullName = req.user.name;

    const trainer = await Trainer.create(req.body);

    res.status(201).json({
      success: true,
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trainer
// @route   PUT /api/trainers/:id
// @access  Private
exports.updateTrainer = async (req, res, next) => {
  try {
    let trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Make sure user owns trainer profile or is admin
    if (trainer.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this trainer profile'
      });
    }

    trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trainer
// @route   DELETE /api/trainers/:id
// @access  Private/Admin
exports.deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trainer deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify trainer
// @route   PUT /api/trainers/:id/verify
// @access  Private/Admin
exports.verifyTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    trainer.isVerified = true;
    trainer.verificationDate = Date.now();

    await trainer.save();

    res.status(200).json({
      success: true,
      message: 'Trainer verified successfully',
      data: trainer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trainer courses
// @route   GET /api/trainers/:id/courses
// @access  Public
exports.getTrainerCourses = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    const courses = await Course.find({
      instructor: trainer.user,
      isPublished: true
    });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};
