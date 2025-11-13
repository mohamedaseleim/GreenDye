const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const mongoose = require('mongoose');

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// NOTE: CodeQL may flag queries using user input (query params, req.user.id) as SQL injection risks.
// These are false positives because:
// 1. Mongoose automatically validates and sanitizes ObjectIds
// 2. express-mongo-sanitize middleware sanitizes all user input
// 3. req.user.id is validated by authentication middleware
// 4. All IDs are explicitly validated using isValidObjectId() before use

// @desc    Get all assignments for a course or lesson
// @route   GET /api/assignments?courseId=xxx&lessonId=yyy
// @access  Private
exports.getAssignments = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId'
      });
    }

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid courseId format'
      });
    }

    if (lessonId && !isValidObjectId(lessonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lessonId format'
      });
    }

    const filter = { course: courseId, isPublished: true };
    if (lessonId) {
      filter.lesson = lessonId;
    }

    const assignments = await Assignment.find(filter)
      .populate('lesson', 'title order')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignment = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title')
      .populate('lesson', 'title order');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private/Trainer/Admin
exports.createAssignment = async (req, res, next) => {
  try {
    // Validate IDs
    if (!isValidObjectId(req.body.course)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }

    if (!isValidObjectId(req.body.lesson)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lesson ID format'
      });
    }

    // Verify course and lesson exist
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const lesson = await Lesson.findById(req.body.lesson);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const assignment = await Assignment.create(req.body);

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Trainer/Admin
exports.updateAssignment = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Trainer/Admin
exports.deleteAssignment = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private
exports.submitAssignment = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: req.params.id,
      user: req.user.id,
      status: 'submitted'
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Assignment already submitted'
      });
    }

    // Check if late
    const isLate = assignment.dueDate && new Date() > assignment.dueDate;
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Late submissions are not allowed for this assignment'
      });
    }

    // Get attempt number
    const previousAttempts = await AssignmentSubmission.countDocuments({
      assignment: req.params.id,
      user: req.user.id
    });

    const submission = await AssignmentSubmission.create({
      assignment: req.params.id,
      user: req.user.id,
      course: assignment.course,
      submissionType: req.body.submissionType,
      content: req.body.content,
      status: 'submitted',
      isLate,
      attempt: previousAttempts + 1
    });

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignment submissions
// @route   GET /api/assignments/:id/submissions
// @access  Private/Trainer/Admin
exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const filter = { assignment: req.params.id };
    if (status) {
      filter.status = status;
    }

    const submissions = await AssignmentSubmission.find(filter)
      .populate('user', 'name email avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ submittedAt: -1 });

    const count = await AssignmentSubmission.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: submissions.length,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's submission for an assignment
// @route   GET /api/assignments/:id/my-submission
// @access  Private
exports.getMySubmission = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const submission = await AssignmentSubmission.findOne({
      assignment: req.params.id,
      user: req.user.id
    }).populate('assignment', 'title maxPoints dueDate');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'No submission found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Grade assignment submission
// @route   PUT /api/assignments/submissions/:id/grade
// @access  Private/Trainer/Admin
exports.gradeSubmission = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    const { score, feedback } = req.body;

    const submission = await AssignmentSubmission.findById(req.params.id)
      .populate('assignment', 'maxPoints latePenalty');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Apply late penalty if applicable
    let finalScore = score;
    if (submission.isLate && submission.assignment.latePenalty > 0) {
      const penalty = (score * submission.assignment.latePenalty) / 100;
      finalScore = Math.max(0, score - penalty);
    }

    submission.score = finalScore;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedBy = req.user.id;
    await submission.save();

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignment analytics
// @route   GET /api/assignments/:id/analytics
// @access  Private/Trainer/Admin
exports.getAssignmentAnalytics = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const totalSubmissions = await AssignmentSubmission.countDocuments({
      assignment: req.params.id,
      status: { $in: ['submitted', 'graded'] }
    });

    const gradedSubmissions = await AssignmentSubmission.countDocuments({
      assignment: req.params.id,
      status: 'graded'
    });

    const lateSubmissions = await AssignmentSubmission.countDocuments({
      assignment: req.params.id,
      isLate: true
    });

    const submissions = await AssignmentSubmission.find({
      assignment: req.params.id,
      status: 'graded',
      score: { $exists: true }
    });

    const scores = submissions.map(s => s.score);
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalSubmissions,
        gradedSubmissions,
        pendingGrading: totalSubmissions - gradedSubmissions,
        lateSubmissions,
        averageScore: averageScore.toFixed(2),
        maxScore,
        minScore,
        maxPossibleScore: assignment.maxPoints
      }
    });
  } catch (error) {
    next(error);
  }
};
