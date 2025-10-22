const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'true_false', 'short-answer', 'essay'], required: true },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: { type: String }, // for short-answer or true/false
  marks: { type: Number, required: true },
  order: { type: Number },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String }],
  bankRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }
});

module.exports = mongoose.model('Question', questionSchema);
