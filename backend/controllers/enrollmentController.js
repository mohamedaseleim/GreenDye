const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Review = require('../models/Review');

// @desc    Enroll in a course
// @route   POST /api/enrollments/enroll
// @access  Private
exports.enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;

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
      user: req.user.id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      user: req.user.id,
      course: courseId
    });

    // Update course enrolled count
    course.enrolled += 1;
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my enrollments
// @route   GET /api/enrollments/my-courses
// @access  Private
exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate('course', 'title thumbnail duration instructor')
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name avatar'
        }
      })
      .populate('quizScores.quiz', 'title description')
      .sort({ lastAccessDate: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
exports.getEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('completedLessons.lesson');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if user owns this enrollment
    if (enrollment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this enrollment'
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
exports.updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    enrollment.progress = progress;

    // If course is completed
    if (progress >= 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completionDate = Date.now();
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete lesson
// @route   PUT /api/enrollments/:id/complete-lesson
// @access  Private
exports.completeLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if lesson already completed
    const alreadyCompleted = enrollment.completedLessons.some(
      cl => cl.lesson.toString() === lessonId
    );

    if (!alreadyCompleted) {
      enrollment.completedLessons.push({
        lesson: lessonId,
        completedAt: Date.now()
      });

      await enrollment.save();
    }

    res.status(200).json({
      success: true,
      message: 'Lesson completed',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add note
// @route   POST /api/enrollments/:id/notes
// @access  Private
exports.addNote = async (req, res, next) => {
  try {
    const { lessonId, content, timestamp } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    enrollment.notes.push({
      lesson: lessonId,
      content,
      timestamp
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate and review course
// @route   POST /api/enrollments/:id/review
// @access  Private
exports.rateAndReview = async (req, res, next) => {
  try {
    const { rating, review } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check authorization
    if (enrollment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Validate rating and review
    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating between 0 and 5'
      });
    }

    if (!review || review.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a review text'
      });
    }

    // Update enrollment
    enrollment.rating = rating;
    enrollment.review = {
      text: review,
      date: Date.now()
    };

    await enrollment.save();

    // Create or update Review record for moderation
    let reviewRecord = await Review.findOne({ enrollment: enrollment._id });
    
    if (reviewRecord) {
      // Update existing review
      reviewRecord.rating = rating;
      reviewRecord.reviewText = review;
      reviewRecord.status = 'pending';
      reviewRecord.isVisible = false;
      await reviewRecord.save();
    } else {
      // Create new review record
      reviewRecord = await Review.create({
        enrollment: enrollment._id,
        user: enrollment.user,
        course: enrollment.course,
        rating,
        reviewText: review,
        status: 'pending',
        isVisible: false
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review submitted successfully and is pending moderation',
      data: {
        enrollment,
        review: reviewRecord
      }
    });
  } catch (error) {
    next(error);
  }
};
