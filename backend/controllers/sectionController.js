const Section = require('../models/Section');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const logger = require('../utils/logger');

// @desc    Get all sections for a course
// @route   GET /api/sections/course/:courseId
// @access  Private (instructor/admin)
exports.getCourseSections = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const sections = await Section.find({ course: courseId })
      .populate('lessons')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    logger.error('Error fetching course sections:', error);
    next(error);
  }
};

// @desc    Get single section
// @route   GET /api/sections/:id
// @access  Private (instructor/admin)
exports.getSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('course')
      .populate('lessons');

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
    logger.error('Error fetching section:', error);
    next(error);
  }
};

// @desc    Create new section
// @route   POST /api/sections
// @access  Private (instructor/admin)
exports.createSection = async (req, res, next) => {
  try {
    const { course, title, description, order } = req.body;

    // Verify course exists
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && courseDoc.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add sections to this course'
      });
    }

    // If no order provided, set it to the next available order
    let sectionOrder = order;
    if (!sectionOrder && sectionOrder !== 0) {
      const sections = await Section.find({ course }).sort({ order: -1 }).limit(1);
      sectionOrder = sections.length > 0 ? sections[0].order + 1 : 0;
    }

    const section = await Section.create({
      course,
      title,
      description,
      order: sectionOrder,
      lessons: []
    });

    // Add section to course
    courseDoc.sections.push(section._id);
    await courseDoc.save();

    const populatedSection = await Section.findById(section._id).populate('lessons');

    res.status(201).json({
      success: true,
      data: populatedSection
    });
  } catch (error) {
    logger.error('Error creating section:', error);
    next(error);
  }
};

// @desc    Update section
// @route   PUT /api/sections/:id
// @access  Private (instructor/admin)
exports.updateSection = async (req, res, next) => {
  try {
    let section = await Section.findById(req.params.id).populate('course');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && section.course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this section'
      });
    }

    const { title, description, order } = req.body;
    
    if (title) section.title = title;
    if (description) section.description = description;
    if (order !== undefined) section.order = order;

    await section.save();

    section = await Section.findById(section._id).populate('lessons');

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    logger.error('Error updating section:', error);
    next(error);
  }
};

// @desc    Delete section
// @route   DELETE /api/sections/:id
// @access  Private (instructor/admin)
exports.deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id).populate('course');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && section.course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this section'
      });
    }

    // Remove section from course
    const course = await Course.findById(section.course._id);
    if (course) {
      course.sections = course.sections.filter(
        s => s.toString() !== section._id.toString()
      );
      await course.save();
    }

    await section.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Error deleting section:', error);
    next(error);
  }
};

// @desc    Reorder sections in a course
// @route   PUT /api/sections/course/:courseId/reorder
// @access  Private (instructor/admin)
exports.reorderSections = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { sectionOrders } = req.body; // Array of { sectionId, order }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reorder sections in this course'
      });
    }

    // Update section orders
    const updatePromises = sectionOrders.map(({ sectionId, order }) =>
      Section.findByIdAndUpdate(sectionId, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    const sections = await Section.find({ course: courseId })
      .populate('lessons')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    logger.error('Error reordering sections:', error);
    next(error);
  }
};

// @desc    Add lesson to section
// @route   PUT /api/sections/:id/lessons/:lessonId
// @access  Private (instructor/admin)
exports.addLessonToSection = async (req, res, next) => {
  try {
    const { id, lessonId } = req.params;

    const section = await Section.findById(id).populate('course');
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && section.course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this section'
      });
    }

    // Verify lesson belongs to same course
    if (lesson.course.toString() !== section.course._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Lesson does not belong to the same course'
      });
    }

    // Add lesson if not already in section
    if (!section.lessons.includes(lessonId)) {
      section.lessons.push(lessonId);
      await section.save();
    }

    const updatedSection = await Section.findById(id).populate('lessons');

    res.status(200).json({
      success: true,
      data: updatedSection
    });
  } catch (error) {
    logger.error('Error adding lesson to section:', error);
    next(error);
  }
};

// @desc    Remove lesson from section
// @route   DELETE /api/sections/:id/lessons/:lessonId
// @access  Private (instructor/admin)
exports.removeLessonFromSection = async (req, res, next) => {
  try {
    const { id, lessonId } = req.params;

    const section = await Section.findById(id).populate('course');
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && section.course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this section'
      });
    }

    section.lessons = section.lessons.filter(
      l => l.toString() !== lessonId
    );
    await section.save();

    const updatedSection = await Section.findById(id).populate('lessons');

    res.status(200).json({
      success: true,
      data: updatedSection
    });
  } catch (error) {
    logger.error('Error removing lesson from section:', error);
    next(error);
  }
};

// @desc    Reorder lessons within a section
// @route   PUT /api/sections/:id/lessons/reorder
// @access  Private (instructor/admin)
exports.reorderLessons = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lessonOrders } = req.body; // Array of { lessonId, order }

    const section = await Section.findById(id).populate('course');
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && section.course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reorder lessons in this section'
      });
    }

    // Update lesson orders
    const updatePromises = lessonOrders.map(({ lessonId, order }) =>
      Lesson.findByIdAndUpdate(lessonId, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    const updatedSection = await Section.findById(id).populate('lessons');

    res.status(200).json({
      success: true,
      data: updatedSection
    });
  } catch (error) {
    logger.error('Error reordering lessons:', error);
    next(error);
  }
};
