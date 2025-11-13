const Section = require('../models/Section');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const logger = require('../utils/logger');

// @desc    Get all sections for a course
// @route   GET /api/sections/course/:courseId
// @access  Private
exports.getSectionsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const sections = await Section.find({ course: courseId })
      .populate('lessons')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections,
    });
  } catch (error) {
    logger.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sections',
    });
  }
};

// @desc    Get single section
// @route   GET /api/sections/:id
// @access  Private
exports.getSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('lessons')
      .populate('course', 'title');

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    res.status(200).json({
      success: true,
      data: section,
    });
  } catch (error) {
    logger.error('Error fetching section:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching section',
    });
  }
};

// @desc    Create new section
// @route   POST /api/sections
// @access  Private (Instructor/Admin)
exports.createSection = async (req, res, next) => {
  try {
    const { course, title, description, order } = req.body;

    // Verify course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check authorization
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'trainer' &&
      courseExists.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create sections for this course',
      });
    }

    // If order not provided, set it to be at the end
    let sectionOrder = order;
    if (sectionOrder === undefined || sectionOrder === null) {
      const sectionsCount = await Section.countDocuments({ course });
      sectionOrder = sectionsCount;
    }

    const section = await Section.create({
      course,
      title,
      description,
      order: sectionOrder,
    });

    // Add section to course
    await Course.findByIdAndUpdate(course, {
      $push: { sections: section._id },
    });

    res.status(201).json({
      success: true,
      data: section,
    });
  } catch (error) {
    logger.error('Error creating section:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating section',
    });
  }
};

// @desc    Update section
// @route   PUT /api/sections/:id
// @access  Private (Instructor/Admin)
exports.updateSection = async (req, res, next) => {
  try {
    let section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // Check authorization
    const course = await Course.findById(section.course);
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'trainer' &&
      course.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this section',
      });
    }

    section = await Section.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: section,
    });
  } catch (error) {
    logger.error('Error updating section:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating section',
    });
  }
};

// @desc    Delete section
// @route   DELETE /api/sections/:id
// @access  Private (Instructor/Admin)
exports.deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // Check authorization
    const course = await Course.findById(section.course);
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'trainer' &&
      course.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this section',
      });
    }

    // Remove section from course
    await Course.findByIdAndUpdate(section.course, {
      $pull: { sections: section._id },
    });

    // Optionally, you might want to handle lessons in this section
    // Either delete them or move them to a default section/unassigned
    // For now, we'll just clear the section reference from lessons
    await Lesson.updateMany(
      { _id: { $in: section.lessons } },
      { $unset: { section: 1 } }
    );

    await section.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Error deleting section:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting section',
    });
  }
};

// @desc    Reorder sections
// @route   PUT /api/sections/reorder
// @access  Private (Instructor/Admin)
exports.reorderSections = async (req, res, next) => {
  try {
    const { courseId, sections } = req.body;

    // Verify course exists and authorization
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'trainer' &&
      course.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reorder sections for this course',
      });
    }

    // Update order for each section
    const updatePromises = sections.map((section, index) =>
      Section.findByIdAndUpdate(section.id || section._id, { order: index })
    );

    await Promise.all(updatePromises);

    // Fetch updated sections
    const updatedSections = await Section.find({ course: courseId })
      .populate('lessons')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: updatedSections,
    });
  } catch (error) {
    logger.error('Error reordering sections:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering sections',
    });
  }
};

// @desc    Add lesson to section
// @route   PUT /api/sections/:id/lessons/:lessonId
// @access  Private (Instructor/Admin)
exports.addLessonToSection = async (req, res, next) => {
  try {
    const { id, lessonId } = req.params;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    // Check authorization
    const course = await Course.findById(section.course);
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'trainer' &&
      course.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this section',
      });
    }

    // Add lesson to section if not already there
    if (!section.lessons.includes(lessonId)) {
      section.lessons.push(lessonId);
      await section.save();
    }

    // Update lesson with section reference
    lesson.section = id;
    await lesson.save();

    res.status(200).json({
      success: true,
      data: section,
    });
  } catch (error) {
    logger.error('Error adding lesson to section:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding lesson to section',
    });
  }
};

// @desc    Remove lesson from section
// @route   DELETE /api/sections/:id/lessons/:lessonId
// @access  Private (Instructor/Admin)
exports.removeLessonFromSection = async (req, res, next) => {
  try {
    const { id, lessonId } = req.params;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // Check authorization
    const course = await Course.findById(section.course);
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'trainer' &&
      course.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this section',
      });
    }

    // Remove lesson from section
    section.lessons = section.lessons.filter(
      (l) => l.toString() !== lessonId.toString()
    );
    await section.save();

    // Remove section reference from lesson
    await Lesson.findByIdAndUpdate(lessonId, { $unset: { section: 1 } });

    res.status(200).json({
      success: true,
      data: section,
    });
  } catch (error) {
    logger.error('Error removing lesson from section:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing lesson from section',
    });
  }
};

// @desc    Reorder lessons within a section
// @route   PUT /api/sections/:id/reorder-lessons
// @access  Private (Instructor/Admin)
exports.reorderLessons = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lessons } = req.body;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found',
      });
    }

    // Check authorization
    const course = await Course.findById(section.course);
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'trainer' &&
      course.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reorder lessons in this section',
      });
    }

    // Update order for each lesson
    const updatePromises = lessons.map((lesson, index) =>
      Lesson.findByIdAndUpdate(lesson.id || lesson._id, { order: index })
    );

    await Promise.all(updatePromises);

    // Update section's lessons array
    section.lessons = lessons.map((lesson) => lesson.id || lesson._id);
    await section.save();

    // Fetch updated section
    const updatedSection = await Section.findById(id).populate('lessons');

    res.status(200).json({
      success: true,
      data: updatedSection,
    });
  } catch (error) {
    logger.error('Error reordering lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering lessons',
    });
  }
};
