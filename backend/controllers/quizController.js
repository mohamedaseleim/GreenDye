const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');

// @desc    Get all quizzes for a course
// @route   GET /api/quizzes?courseId=xxx
// @access  Private
exports.getQuizzes = async (req, res, next) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId'
      });
    }

    const quizzes = await Quiz.find({ course: courseId, isPublished: true });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Hide correct answers from students
    if (req.user.role === 'student') {
      const sanitizedQuiz = quiz.toObject();
      sanitizedQuiz.questions = sanitizedQuiz.questions.map(q => {
        const sanitizedQuestion = { ...q };
        if (q.options) {
          sanitizedQuestion.options = q.options.map(opt => ({
            text: opt.text
          }));
        }
        delete sanitizedQuestion.correctAnswer;
        delete sanitizedQuestion.explanation;
        return sanitizedQuestion;
      });

      return res.status(200).json({
        success: true,
        data: sanitizedQuiz
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create quiz
// @route   POST /api/quizzes
// @access  Private/Trainer/Admin
exports.createQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.create(req.body);

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Trainer/Admin
exports.updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Trainer/Admin
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz
// @route   POST /api/quizzes/:id/submit
// @access  Private
exports.submitQuiz = async (req, res, next) => {
  try {
    const { answers, courseId } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;

      if (question.type === 'multiple-choice') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = userAnswer === correctOption.text.get('en'); // Simplified
      } else if (question.type === 'true-false') {
        isCorrect = userAnswer === question.correctAnswer;
      } else if (question.type === 'short-answer') {
        isCorrect = userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
      }

      totalPoints += question.points;
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points;
      }

      return {
        questionIndex: index,
        isCorrect,
        userAnswer,
        explanation: isCorrect ? null : question.explanation
      };
    });

    const score = (earnedPoints / totalPoints) * 100;
    const passed = score >= quiz.passingScore;

    // Save score to enrollment
    if (courseId) {
      const enrollment = await Enrollment.findOne({
        user: req.user.id,
        course: courseId
      });

      if (enrollment) {
        const existingQuizScore = enrollment.quizScores.find(
          qs => qs.quiz.toString() === quiz._id.toString()
        );

        if (existingQuizScore) {
          existingQuizScore.attempt += 1;
          existingQuizScore.score = earnedPoints;
          existingQuizScore.maxScore = totalPoints;
          existingQuizScore.completedAt = Date.now();
        } else {
          enrollment.quizScores.push({
            quiz: quiz._id,
            score: earnedPoints,
            maxScore: totalPoints,
            attempt: 1,
            completedAt: Date.now()
          });
        }

        await enrollment.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        score,
        passed,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        earnedPoints,
        totalPoints,
        results: quiz.showResults !== 'never' ? results : null
      }
    });
  } catch (error) {
    next(error);
  }
};
