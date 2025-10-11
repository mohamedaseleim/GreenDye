const { Badge, UserAchievement, LeaderboardEntry } = require('../models/Gamification');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');

// @desc    Get all badges
// @route   GET /api/gamification/badges
// @access  Public
exports.getAllBadges = async (req, res, next) => {
  try {
    const badges = await Badge.find({ isActive: true });
    
    res.status(200).json({
      success: true,
      count: badges.length,
      data: badges
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new badge (Admin only)
// @route   POST /api/gamification/badges
// @access  Private/Admin
exports.createBadge = async (req, res, next) => {
  try {
    const badge = await Badge.create(req.body);
    
    res.status(201).json({
      success: true,
      data: badge
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's achievements
// @route   GET /api/gamification/achievements
// @access  Private
exports.getUserAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const achievements = await UserAchievement.find({ user: userId })
      .populate('badge')
      .sort('-earnedAt');
    
    res.status(200).json({
      success: true,
      count: achievements.length,
      data: achievements
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check and award badges to user
// @route   POST /api/gamification/check-badges
// @access  Private
exports.checkAndAwardBadges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user stats
    const enrollments = await Enrollment.find({ user: userId });
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const certificates = await Certificate.find({ user: userId });
    
    // Get user's leaderboard entry
    const leaderboardEntry = await LeaderboardEntry.findOne({ 
      user: userId, 
      period: 'all_time' 
    });
    
    const points = leaderboardEntry ? leaderboardEntry.points : 0;
    const streak = leaderboardEntry ? leaderboardEntry.streak.current : 0;
    
    // Get all active badges
    const badges = await Badge.find({ isActive: true });
    
    const newlyEarnedBadges = [];
    
    for (const badge of badges) {
      // Check if user already has this badge
      const existingAchievement = await UserAchievement.findOne({
        user: userId,
        badge: badge._id
      });
      
      if (existingAchievement) continue;
      
      let shouldAward = false;
      
      switch (badge.criteria.type) {
        case 'courses_completed':
          shouldAward = completedCourses >= badge.criteria.threshold;
          break;
        case 'points_earned':
          shouldAward = points >= badge.criteria.threshold;
          break;
        case 'streak_days':
          shouldAward = streak >= badge.criteria.threshold;
          break;
        case 'certificates_earned':
          shouldAward = certificates.length >= badge.criteria.threshold;
          break;
        default:
          shouldAward = false;
      }
      
      if (shouldAward) {
        const achievement = await UserAchievement.create({
          user: userId,
          badge: badge._id,
          progress: {
            current: badge.criteria.threshold,
            target: badge.criteria.threshold
          }
        });
        
        // Award points for badge
        if (leaderboardEntry) {
          leaderboardEntry.points += badge.points;
          await leaderboardEntry.save();
        }
        
        newlyEarnedBadges.push(await achievement.populate('badge'));
      }
    }
    
    res.status(200).json({
      success: true,
      newBadges: newlyEarnedBadges.length,
      data: newlyEarnedBadges
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'all_time', limit = 100 } = req.query;
    
    const leaderboard = await LeaderboardEntry.find({ period })
      .populate('user', 'name avatar country')
      .sort('-points')
      .limit(parseInt(limit));
    
    // Update ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    res.status(200).json({
      success: true,
      period,
      count: leaderboard.length,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user points
// @route   POST /api/gamification/points
// @access  Private
exports.updateUserPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { points, action } = req.body;
    
    let leaderboardEntry = await LeaderboardEntry.findOne({ 
      user: userId, 
      period: 'all_time' 
    });
    
    if (!leaderboardEntry) {
      leaderboardEntry = await LeaderboardEntry.create({
        user: userId,
        points: 0,
        period: 'all_time'
      });
    }
    
    leaderboardEntry.points += points;
    
    // Update activity streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (leaderboardEntry.streak.lastActivity) {
      const lastActivity = new Date(leaderboardEntry.streak.lastActivity);
      lastActivity.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        leaderboardEntry.streak.current += 1;
        if (leaderboardEntry.streak.current > leaderboardEntry.streak.longest) {
          leaderboardEntry.streak.longest = leaderboardEntry.streak.current;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        leaderboardEntry.streak.current = 1;
      }
    } else {
      leaderboardEntry.streak.current = 1;
      leaderboardEntry.streak.longest = 1;
    }
    
    leaderboardEntry.streak.lastActivity = new Date();
    leaderboardEntry.updatedAt = new Date();
    
    await leaderboardEntry.save();
    
    // Calculate level (100 points per level)
    leaderboardEntry.level = Math.floor(leaderboardEntry.points / 100) + 1;
    await leaderboardEntry.save();
    
    res.status(200).json({
      success: true,
      data: leaderboardEntry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user stats
// @route   GET /api/gamification/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const achievements = await UserAchievement.find({ user: userId });
    const leaderboardEntry = await LeaderboardEntry.findOne({ 
      user: userId, 
      period: 'all_time' 
    });
    
    const enrollments = await Enrollment.find({ user: userId });
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const certificates = await Certificate.find({ user: userId });
    
    const stats = {
      points: leaderboardEntry ? leaderboardEntry.points : 0,
      level: leaderboardEntry ? leaderboardEntry.level : 1,
      rank: leaderboardEntry ? leaderboardEntry.rank : null,
      badges: achievements.length,
      coursesCompleted: completedCourses,
      certificatesEarned: certificates.length,
      currentStreak: leaderboardEntry ? leaderboardEntry.streak.current : 0,
      longestStreak: leaderboardEntry ? leaderboardEntry.streak.longest : 0
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
