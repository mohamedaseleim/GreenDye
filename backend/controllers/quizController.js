const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');

/**
 * Helper to shuffle an array in place.
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// @desc    Get all published quizzes for a course (and optional lesson)
// @route   GET /api/quizzes?courseId=xxx&lessonId=yyy
// @access  Private
exports.getQuizzes = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId'
      });
    }

    const filter = { course: courseId, isPublished: true };
    if (lessonId) {
      filter.lesson = lessonId;
    }

    const quizzes = await Quiz.find(filter);

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

    // Hide correct answers and optionally shuffle for students
    if (req.user.role === 'student') {
      const sanitizedQuiz = quiz.toObject();

      // Shuffle questions if enabled
      if (sanitizedQuiz.shuffleQuestions) {
        sanitizedQuiz.questions = shuffleArray(
          sanitizedQuiz.questions.slice()
        );
      }

      sanitizedQuiz.questions = sanitizedQuiz.questions.map((q) => {
        const sanitizedQuestion = {
          question: q.question,
          type: q.type,
          points: q.points,
          // Only send the option text
          options: q.options
            ? q.options.map((opt) => ({
                text: opt.text
              }))
            : undefined,
          explanation: null
        };

        // Shuffle options if enabled
        if (
          sanitizedQuiz.shuffleOptions &&
          sanitizedQuestion.options &&
          sanitizedQuestion.options.length > 1
        ) {
          sanitizedQuestion.options = shuffleArray(
            sanitizedQuestion.options.slice()
          );
        }

        return sanitizedQuestion;
      });

      return res.status(200).json({
        success: true,
        data: sanitizedQuiz
      });
    }

    // Trainers/admins get the full quiz, including correct answers
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

    // Enforce attempt limits if tied to a course
    let enrollment;
    if (courseId) {
      enrollment = await Enrollment.findOne({
        user: req.user.id,
        course: courseId
      });

      if (enrollment) {
        const existing = enrollment.quizScores.find(
          (qs) => qs.quiz.toString() === quiz._id.toString()
        );
        // Check attemptsAllowed (-1 means unlimited)
        if (
          existing &&
          quiz.attemptsAllowed !== -1 &&
          existing.attempt >= quiz.attemptsAllowed
        ) {
          return res.status(400).json({
            success: false,
            message: 'Maximum attempts reached for this quiz'
          });
        }
      }
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;

      switch (question.type) {
        case 'multiple-choice': {
          const correctOption = question.options.find((opt) => opt.isCorrect);
          // Compare by text; adjust this if you instead use option IDs
          const expected = correctOption
            ? correctOption.text.get('en') || correctOption.text
            : undefined;
          isCorrect = userAnswer === expected;
          break;
        }
        case 'true-false':
          isCorrect = userAnswer === question.correctAnswer;
          break;
        case 'short-answer':
          isCorrect =
            userAnswer &&
            userAnswer.toString().trim().toLowerCase() ===
              question.correctAnswer?.trim().toLowerCase();
          break;
        case 'essay':
          // Essay questions must be graded manually
          isCorrect = null;
          break;
        default:
          break;
      }

      // Add up total possible points
      totalPoints += question.points || 1;
      // Only award points for auto-gradable question types
      if (isCorrect === true) {
        correctAnswers++;
        earnedPoints += question.points || 1;
      }

      return {
        questionIndex: index,
        isCorrect,
        userAnswer,
        // Only return explanation if the quiz permits showing results
        explanation:
          isCorrect || quiz.showResults === 'never'
            ? null
            : question.explanation
      };
    });

    const score = (earnedPoints / totalPoints) * 100;
    const passed = score >= quiz.passingScore;

    // Save score to enrollment record (quizScores) if applicable
    if (courseId && enrollment) {
      let record = enrollment.quizScores.find(
        (qs) => qs.quiz.toString() === quiz._id.toString()
      );
      if (record) {
        record.attempt += 1;
        record.score = earnedPoints;
        record.maxScore = totalPoints;
        record.completedAt = Date.now();
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
