const Course = require('../models/Course');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, level, language } = req.query;

    const query = { isPublished: true };

    if (category) query.category = category;
    if (level) query.level = level;
    if (language) query.language = language;

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar')
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
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio')
      .populate('lessons');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment views
    course.metadata.views += 1;
    await course.save();

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Trainer/Admin
exports.createCourse = async (req, res, next) => {
  try {
    req.body.instructor = req.user.id;

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Trainer/Admin
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Trainer/Admin
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Make sure user is course owner or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured courses
// @route   GET /api/courses/featured
// @access  Public
exports.getFeaturedCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ isFeatured: true, isPublished: true })
      .populate('instructor', 'name avatar')
      .limit(6);

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses by category
// @route   GET /api/courses/category/:category
// @access  Public
exports.getCoursesByCategory = async (req, res, next) => {
  try {
    const courses = await Course.find({
      category: req.params.category,
      isPublished: true
    }).populate('instructor', 'name avatar');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search courses
// @route   GET /api/courses/search
// @access  Public
exports.searchCourses = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide search query'
      });
    }

    const courses = await Course.find({
      $or: [
        { 'title.en': { $regex: q, $options: 'i' } },
        { 'title.ar': { $regex: q, $options: 'i' } },
        { 'title.fr': { $regex: q, $options: 'i' } },
        { 'description.en': { $regex: q, $options: 'i' } },
        { 'description.ar': { $regex: q, $options: 'i' } },
        { 'description.fr': { $regex: q, $options: 'i' } }
      ],
      isPublished: true
    }).populate('instructor', 'name avatar');

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};
