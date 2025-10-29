const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [
    {
      // Optional reference to a question in the bank; may be null for embedded questions
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        default: null
      },
      // The learner’s submitted answer or selected option text
      answer: {
        type: String
      },
      // Indicates whether the answer is correct (true/false) or requires manual grading (null)
      isCorrect: {
        type: Boolean,
        default: null
      },
      // Points awarded for this answer (supports manual grading)
      pointsAwarded: {
        type: Number,
        default: 0
      }
    }
  ],
  // Incremental attempt number (1, 2, 3, …) for each user/quiz
  attempt: {
    type: Number,
    default: 1
  },
  // Overall score as a percentage (0–100)
  score: {
    type: Number
  },
  // Maximum attainable points on the quiz (non‑adaptive)
  maxScore: {
    type: Number
  },
  // Raw points earned (non‑adaptive)
  earnedPoints: {
    type: Number
  },
  // Adaptive score percentage (if adaptive scoring enabled)
  adaptiveScore: {
    type: Number
  },
  // Whether the learner passed (based on quiz.passingScore)
  isPassed: {
    type: Boolean
  },
  // Submission timestamp
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Marks whether all manual grading has been completed
  graded: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Submission', submissionSchema);
