const Section = require('../models/Section');
const Course = require('../models/Course');

// @desc    Get all sections for a course
// @route   GET /api/sections?courseId=xxx
// @access  Public
exports.getSections = async (req, res, next) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId'
      });
    }

    const sections = await Section.find({ course: courseId })
      .populate('lessons')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single section
// @route   GET /api/sections/:id
// @access  Public
exports.getSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id).populate('lessons');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create section
// @route   POST /api/sections
// @access  Private/Trainer/Admin
exports.createSection = async (req, res, next) => {
  try {
    const section = await Section.create(req.body);

    // Add section to course
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    course.sections.push(section._id);
    await course.save();

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update section
// @route   PUT /api/sections/:id
// @access  Private/Trainer/Admin
exports.updateSection = async (req, res, next) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete section
// @route   DELETE /api/sections/:id
// @access  Private/Trainer/Admin
exports.deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Remove section from course
    const course = await Course.findById(section.course);
    if (course) {
      course.sections = course.sections.filter(s => s.toString() !== section._id.toString());
      await course.save();
    }

    await section.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Section deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add lesson to section
// @route   PUT /api/sections/:id/lessons/:lessonId
// @access  Private/Trainer/Admin
exports.addLessonToSection = async (req, res, next) => {
  try {
    const { id, lessonId } = req.params;
    
    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Add lesson if not already present
    if (!section.lessons.includes(lessonId)) {
      section.lessons.push(lessonId);
      await section.save();
    }

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove lesson from section
// @route   DELETE /api/sections/:id/lessons/:lessonId
// @access  Private/Trainer/Admin
exports.removeLessonFromSection = async (req, res, next) => {
  try {
    const { id, lessonId } = req.params;
    
    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    section.lessons = section.lessons.filter(l => l.toString() !== lessonId);
    await section.save();

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    next(error);
  }
};
