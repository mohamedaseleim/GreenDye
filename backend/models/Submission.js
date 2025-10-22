const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: { type: String },
    isCorrect: { type: Boolean },
    points: { type: Number }
  }],
  score: { type: Number },
  maxScore: { type: Number },
  attempt: { type: Number, default: 1 },
  submittedAt: { type: Date, default: Date.now },
  graded: { type: Boolean, default: false }
});

module.exports = mongoose.model('Submission', submissionSchema);
