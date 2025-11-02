const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const Question = require('../models/Question');

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

/**
 * Return a weight multiplier based on question difficulty.
 * If adaptive scoring is disabled, this helper returns 1.
 */
function getDifficultyWeight(difficulty) {
  switch (difficulty) {
    case 'easy':
      return 1;
    case 'hard':
      return 2;
    // default to medium if unknown
    case 'medium':
    default:
      return 1.5;
  }
}

/**
 * Resolve an embedded quiz question. If the quiz question has a bankRef,
 * fetch the Question document and convert it to the same structure used in Quiz.
 * Bank questions are assumed to be in English only.
 *
 * @param {Object} quizQuestion The question object embedded in the quiz.
 * @returns {Object} An object with fields matching Quiz.questions entries.
 */
async function resolveQuestion(quizQuestion) {
  // If the question points to the Question bank, pull that document.
  if (quizQuestion.bankRef) {
    const qDoc = await Question.findById(quizQuestion.bankRef);
    if (qDoc) {
      // Map types from the bank (mcq, true_false, essay) to quiz types
      const typeMapping = {
        mcq: 'multiple-choice',
        true_false: 'true-false',
        essay: 'essay'
      };
      const convertedType = typeMapping[qDoc.type] || quizQuestion.type;

      // Build the expected object structure.
      const bankOptions = qDoc.options
        ? qDoc.options.map((opt) => ({
            text: new Map([['en', opt.text]]),
            isCorrect: opt.isCorrect
          }))
        : undefined;

      // Determine the correct answer for true/false or short-answer types.
      let correctAnswer;
      if (convertedType === 'true-false' && bankOptions) {
        const correct = bankOptions.find((opt) => opt.isCorrect);
        correctAnswer = correct ? correct.text.get('en') : undefined;
      }

      return {
        question: new Map([['en', qDoc.text]]),
        type: convertedType,
        options: bankOptions,
        correctAnswer: correctAnswer,
        points: qDoc.marks,
        // bank questions do not store difficulty by default; assume medium
        difficulty: quizQuestion.difficulty || 'medium',
        explanation: null
      };
    }
  }
  // If no bankRef, return the quiz's embedded question as is
  return quizQuestion;
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

    // Determine attempt number by counting prior submissions from this user
    const priorCount = await Submission.countDocuments({
      quiz: quiz._id,
      user: req.user.id
    });
    const attemptNumber = priorCount + 1;

    // Resolve embedded and bank questions up front
    const resolvedQuestions = await Promise.all(
      quiz.questions.map((q) => resolveQuestion(q))
    );

    let totalPoints = 0;
    let earnedPoints = 0;
    let adaptiveTotal = 0;
    let adaptiveEarned = 0;
    let correctAnswers = 0;

    const answersDocs = [];
    const results = [];

    // Loop through each question and user answer
    resolvedQuestions.forEach((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;

      // Default basePoints and difficulty
      const basePoints = question.points || 1;
      const difficulty = question.difficulty || 'medium';
      const weight = quiz.isAdaptive ? getDifficultyWeight(difficulty) : 1;

      // Total points add up regardless of adaptive flag
      totalPoints += basePoints;
      adaptiveTotal += basePoints * weight;

      switch (question.type) {
        case 'multiple-choice': {
          // find the correct option text
          const correctOption = question.options
            ? question.options.find((opt) => opt.isCorrect)
            : undefined;
          const expected =
            correctOption && correctOption.text
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
            question.correctAnswer &&
            userAnswer.toString().trim().toLowerCase() ===
              question.correctAnswer.toString().trim().toLowerCase();
          break;
        case 'essay':
          // Essay questions require manual grading; mark null
          isCorrect = null;
          break;
        default:
          break;
      }

      // Accumulate points only for auto‑gradable questions
      let pointsAwarded = 0;
      if (isCorrect === true) {
        correctAnswers++;
        pointsAwarded = basePoints;
        earnedPoints += basePoints;
        adaptiveEarned += basePoints * weight;
      }

      // Build answer document
      answersDocs.push({
        question: quiz.questions[index].bankRef || undefined,
        answer: userAnswer,
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded
      });

      // Build results object for student
      results.push({
        questionIndex: index,
        isCorrect,
        userAnswer,
        explanation:
          isCorrect === true || quiz.showResults === 'never'
            ? null
            : question.explanation
      });
    });

    const scorePercentage = (earnedPoints / totalPoints) * 100;
    const adaptivePercentage = quiz.isAdaptive
      ? (adaptiveEarned / adaptiveTotal) * 100
      : undefined;
    const passed = scorePercentage >= quiz.passingScore;

    // Create the submission document
    const submission = await Submission.create({
      quiz: quiz._id,
      user: req.user.id,
      answers: answersDocs,
      attempt: attemptNumber,
      score: scorePercentage,
      maxScore: totalPoints,
      earnedPoints: earnedPoints,
      adaptiveScore: adaptivePercentage,
      isPassed: passed,
      graded: !answersDocs.some((ans) => ans.isCorrect === null)
    });

    // Update enrollment quizScores if courseId provided
    if (courseId && enrollment) {
      const record = enrollment.quizScores.find(
        (qs) => qs.quiz.toString() === quiz._id.toString()
      );
      if (record) {
        record.attempt = submission.attempt;
        record.score = earnedPoints;
        record.maxScore = totalPoints;
        record.completedAt = submission.submittedAt;
      } else {
        enrollment.quizScores.push({
          quiz: quiz._id,
          score: earnedPoints,
          maxScore: totalPoints,
          attempt: submission.attempt,
          completedAt: submission.submittedAt
        });
      }
      await enrollment.save();
    }

    // Response to the client
    return res.status(200).json({
      success: true,
      data: {
        score: scorePercentage,
        passed,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        earnedPoints,
        totalPoints,
        adaptiveScore: adaptivePercentage,
        results: quiz.showResults !== 'never' ? results : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve quiz attempts for a quiz
// @route   GET /api/quizzes/:id/attempts
// @access  Private
exports.getQuizAttempts = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    const filter = { quiz: quizId };

    // Students see only their own attempts
    if (req.user.role === 'student') {
      filter.user = req.user.id;
    }

    const submissions = await Submission.find(filter).sort({
      submittedAt: 1
    });

    if (req.user.role === 'student') {
      const attempts = submissions.map((sub) => ({
        attempt: sub.attempt,
        score: sub.earnedPoints,
        maxScore: sub.maxScore,
        completedAt: sub.submittedAt
      }));
      return res.status(200).json({
        success: true,
        data: attempts
      });
    }

    // Trainers/admins see additional info
    const attempts = await Promise.all(
      submissions.map(async (sub) => {
        return {
          submissionId: sub._id,
          user: sub.user,
          attempt: sub.attempt,
          score: sub.score,
          earnedPoints: sub.earnedPoints,
          maxScore: sub.maxScore,
          isPassed: sub.isPassed,
          graded: sub.graded,
          submittedAt: sub.submittedAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: attempts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz analytics (average scores, pass rates, per question stats)
// @route   GET /api/quizzes/:id/analytics
// @access  Private/Trainer/Admin
exports.getQuizAnalytics = async (req, res, next) => {
  try {
    const quizId = req.params.id;

    // Retrieve all submissions (including ungraded ones)
    const submissions = await Submission.find({ quiz: quizId });

    if (!submissions || submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No submissions found for this quiz'
      });
    }

    const totalAttempts = submissions.length;
    const totalScoreSum = submissions.reduce(
      (sum, sub) => sum + (sub.score || 0),
      0
    );
    const averageScore = totalScoreSum / totalAttempts;
    const passedCount = submissions.filter((sub) => sub.isPassed).length;
    const passRate = (passedCount / totalAttempts) * 100;
    const uniqueUsers = new Set(submissions.map((sub) => sub.user.toString()));
    const participants = uniqueUsers.size;

    // Fetch quiz questions to compute per-question statistics
    const quiz = await Quiz.findById(quizId);
    const questionStats = quiz.questions.map((_, idx) => {
      let correct = 0;
      let incorrect = 0;
      let pending = 0;

      submissions.forEach((sub) => {
        const answer = sub.answers[idx];
        if (!answer || answer.isCorrect === null) {
          pending++;
        } else if (answer.isCorrect === true) {
          correct++;
        } else {
          incorrect++;
        }
      });

      return {
        questionIndex: idx,
        correct,
        incorrect,
        pending,
        correctRate: (correct / totalAttempts) * 100
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalAttempts,
        participants,
        averageScore,
        passRate,
        questionStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually grade a quiz submission (for essay questions)
// @route   POST /api/quizzes/:id/grade
// @access  Private/Trainer/Admin
exports.gradeQuizSubmission = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    const { submissionId, grades } = req.body;

    if (!submissionId || !grades || !Array.isArray(grades)) {
      return res.status(400).json({
        success: false,
        message: 'submissionId and grades array are required'
      });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    if (submission.quiz.toString() !== quizId) {
      return res.status(400).json({
        success: false,
        message: 'Submission does not belong to this quiz'
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    let earnedPoints = submission.earnedPoints || 0;

    grades.forEach((grade) => {
      const idx = grade.questionIndex;
      const ans = submission.answers[idx];
      const question = quiz.questions[idx];

      if (!ans || !question) {
        return;
      }

      // Only adjust essay (or manually graded) questions
      // Overwrite existing grade if any
      const basePoints = question.points || 1;
      // Remove previous manual points if there were any
      earnedPoints -= ans.pointsAwarded || 0;

      const isCorrect = grade.isCorrect;
      let awarded;
      if (typeof grade.pointsAwarded === 'number') {
        awarded = grade.pointsAwarded;
      } else {
        // If points not specified, award basePoints on correct, else 0
        awarded = isCorrect ? basePoints : 0;
      }

      ans.isCorrect = isCorrect;
      ans.pointsAwarded = awarded;
      earnedPoints += awarded;
    });

    // Recalculate overall scores
    const totalPoints = submission.maxScore || quiz.questions.reduce(
      (sum, q) => sum + (q.points || 1),
      0
    );
    const scorePercentage = (earnedPoints / totalPoints) * 100;
    const passed = scorePercentage >= quiz.passingScore;

    submission.earnedPoints = earnedPoints;
    submission.score = scorePercentage;
    submission.isPassed = passed;
    submission.graded = !submission.answers.some(
      (ans) => ans.isCorrect === null
    );

    await submission.save();

    // Update enrollment record if it matches this attempt
    const enrollment = await Enrollment.findOne({
      user: submission.user,
      course: quiz.course
    });
    if (enrollment) {
      const record = enrollment.quizScores.find(
        (qs) =>
          qs.quiz.toString() === quizId && qs.attempt === submission.attempt
      );
      if (record) {
        record.score = earnedPoints;
        record.maxScore = totalPoints;
        record.completedAt = submission.submittedAt;
        await enrollment.save();
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        submissionId: submission._id,
        score: submission.score,
        earnedPoints: submission.earnedPoints,
        maxScore: submission.maxScore,
        isPassed: submission.isPassed,
        graded: submission.graded
      }
    });
  } catch (error) {
    next(error);
  }
};
