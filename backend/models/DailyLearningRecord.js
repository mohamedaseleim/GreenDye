const mongoose = require('mongoose');

/**
 * DailyLearningRecord Schema
 *
 * This schema records a user's learning activity on a per‑day basis.
 * Each record corresponds to a single calendar day and may optionally
 * include a list of activity types (e.g. 'lesson', 'quiz', etc.) to
 * support future analytics. For the current learning streak feature,
 * storing the date alone is sufficient to calculate consecutive days
 * of activity.
 */
const DailyLearningRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The calendar date on which the user recorded learning activity.
  // Time components are normalised to 00:00:00 when logging to
  // simplify streak calculations.
  date: {
    type: Date,
    required: true,
  },
  // Optional list of activity types undertaken on this date.
  // This can be extended in the future to store additional
  // information about the nature of the user's learning.
  activities: [
    {
      type: String,
    },
  ],
});

// Ensure one record per user per date
DailyLearningRecordSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLearningRecord', DailyLearningRecordSchema);
