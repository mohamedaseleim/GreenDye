const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: { type: String }, // user’s answer or option ID
    isCorrect: { type: Boolean }
  }],
  score: { type: Number },
  submittedAt: { type: Date, default: Date.now },
  graded: { type: Boolean, default: false } // mark true after manual/auto grading
});

module.exports = mongoose.model('Submission', submissionSchema);
