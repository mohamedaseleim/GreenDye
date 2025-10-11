const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reasons: [{
    type: {
      type: String,
      enum: ['similar_users', 'category_match', 'level_match', 'popular', 'instructor_match', 'completion_pattern', 'trending']
    },
    weight: {
      type: Number,
      min: 0,
      max: 1
    },
    description: {
      type: Map,
      of: String
    }
  }],
  metadata: {
    similarUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    userCategories: [String],
    userLevel: String,
    completionRate: Number
  },
  status: {
    type: String,
    enum: ['active', 'dismissed', 'enrolled', 'completed'],
    default: 'active'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days
  }
});

const UserPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  favoriteCategories: [{
    type: String
  }],
  preferredLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all']
  },
  favoriteInstructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  completedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  dismissedRecommendations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  interactionScore: {
    type: Map,
    of: Number // courseId -> score
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Indexes
RecommendationSchema.index({ user: 1, status: 1, score: -1 });
RecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
UserPreferenceSchema.index({ user: 1 });

const Recommendation = mongoose.model('Recommendation', RecommendationSchema);
const UserPreference = mongoose.model('UserPreference', UserPreferenceSchema);

module.exports = { Recommendation, UserPreference };
