const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

// @desc    Get all lessons for a course
// @route   GET /api/lessons?courseId=xxx
// @access  Public
exports.getLessons = async (req, res, next) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId'
      });
    }

    const lessons = await Lesson.find({ course: courseId, isPublished: true })
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Private
exports.getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create lesson
// @route   POST /api/lessons
// @access  Private/Trainer/Admin
exports.createLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.create(req.body);

    // Add lesson to course
    const course = await Course.findById(req.body.course);
    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private/Trainer/Admin
exports.updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private/Trainer/Admin
exports.deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Remove lesson from course
    const course = await Course.findById(lesson.course);
    course.lessons = course.lessons.filter(l => l.toString() !== lesson._id.toString());
    await course.save();

    await lesson.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
