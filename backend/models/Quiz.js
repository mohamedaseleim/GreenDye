const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  // Multilingual title and description using a Map
  title: {
    type: Map,
    of: String,
    required: [true, 'Please provide quiz title']
  },
  description: {
    type: Map,
    of: String
  },
  // Array of embedded question objects
  questions: [{
    question: {
      type: Map,
      of: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
      default: 'multiple-choice'
    },
    // Each option contains multilingual text and a flag for correctness
    options: [{
      text: {
        type: Map,
        of: String
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    // For short-answer questions, you can specify a correct answer string
    correctAnswer: String,
    points: {
      type: Number,
      default: 1
    },
    explanation: {
      type: Map,
      of: String
    },
    // Additional metadata to support question banks and adaptive scoring
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    tags: [{
      type: String
    }],
    // Optional reference to a separate Question document (question bank)
    bankRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }
  }],
  // Quiz-level configuration fields
  totalPoints: {
    type: Number,
    default: 0
  },
  passingScore: {
    type: Number,
    default: 70 // percentage
  },
  timeLimit: {
    type: Number, // in minutes
    default: 0 // 0 means no time limit
  },
  attemptsAllowed: {
    type: Number,
    default: 1 // -1 means unlimited
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: String,
    enum: ['immediately', 'after-submission', 'never'],
    default: 'after-submission'
  },
  // Whether the quiz uses adaptive scoring (optional flag)
  isAdaptive: {
    type: Boolean,
    default: false
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total points and update timestamps before saving
QuizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce(
    (sum, q) => sum + (q.points || 1),
    0
  );
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Quiz', QuizSchema);
