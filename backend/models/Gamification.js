const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  name: {
    type: Map,
    of: String,
    required: true
    // Example: { en: 'Course Master', ar: 'سيد الدورات', fr: 'Maître des cours' }
  },
  description: {
    type: Map,
    of: String
  },
  icon: {
    type: String,
    default: '/uploads/badges/default.png'
  },
  criteria: {
    type: {
      type: String,
      enum: ['courses_completed', 'points_earned', 'streak_days', 'quiz_perfect', 'certificates_earned', 'lessons_completed'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    }
  },
  points: {
    type: Number,
    default: 0
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const UserAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    }
  }
});

const LeaderboardEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  coursesCompleted: {
    type: Number,
    default: 0
  },
  certificatesEarned: {
    type: Number,
    default: 0
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date
    }
  },
  level: {
    type: Number,
    default: 1
  },
  rank: {
    type: Number
  },
  period: {
    type: String,
    enum: ['all_time', 'monthly', 'weekly'],
    default: 'all_time'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
BadgeSchema.index({ 'criteria.type': 1, 'criteria.threshold': 1 });
UserAchievementSchema.index({ user: 1, badge: 1 }, { unique: true });
LeaderboardEntrySchema.index({ period: 1, points: -1 });
LeaderboardEntrySchema.index({ user: 1, period: 1 }, { unique: true });

const Badge = mongoose.model('Badge', BadgeSchema);
const UserAchievement = mongoose.model('UserAchievement', UserAchievementSchema);
const LeaderboardEntry = mongoose.model('LeaderboardEntry', LeaderboardEntrySchema);

module.exports = { Badge, UserAchievement, LeaderboardEntry };
