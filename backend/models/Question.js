const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'true_false', 'essay'], required: true },
  options: [{ text: String, isCorrect: Boolean }], // only for MCQ
  marks: { type: Number, required: true },
  order: { type: Number }
});

module.exports = mongoose.model('Question', questionSchema);
