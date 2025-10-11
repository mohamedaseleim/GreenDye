const { Recommendation, UserPreference } = require('../models/Recommendation');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// @desc    Get personalized course recommendations
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 10, refresh = false } = req.query;
    
    // Check if we have recent recommendations
    if (!refresh) {
      const existingRecommendations = await Recommendation.find({
        user: userId,
        status: 'active',
        expiresAt: { $gt: new Date() }
      })
        .populate('course')
        .sort('-score')
        .limit(parseInt(limit));
      
      if (existingRecommendations.length > 0) {
        return res.status(200).json({
          success: true,
          cached: true,
          count: existingRecommendations.length,
          data: existingRecommendations
        });
      }
    }
    
    // Generate new recommendations
    const recommendations = await generateRecommendations(userId);
    
    // Save recommendations
    const savedRecommendations = [];
    for (const rec of recommendations.slice(0, parseInt(limit))) {
      const recommendation = await Recommendation.create(rec);
      const populated = await recommendation.populate('course');
      savedRecommendations.push(populated);
    }
    
    res.status(200).json({
      success: true,
      cached: false,
      count: savedRecommendations.length,
      data: savedRecommendations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user preferences
// @route   PUT /api/recommendations/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { favoriteCategories, preferredLevel, favoriteInstructors } = req.body;
    
    let preferences = await UserPreference.findOne({ user: userId });
    
    if (!preferences) {
      preferences = await UserPreference.create({
        user: userId,
        favoriteCategories,
        preferredLevel,
        favoriteInstructors
      });
    } else {
      if (favoriteCategories) preferences.favoriteCategories = favoriteCategories;
      if (preferredLevel) preferences.preferredLevel = preferredLevel;
      if (favoriteInstructors) preferences.favoriteInstructors = favoriteInstructors;
      preferences.lastUpdated = new Date();
      await preferences.save();
    }
    
    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dismiss a recommendation
// @route   PUT /api/recommendations/:id/dismiss
// @access  Private
exports.dismissRecommendation = async (req, res, next) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);
    
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }
    
    if (recommendation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to dismiss this recommendation'
      });
    }
    
    recommendation.status = 'dismissed';
    await recommendation.save();
    
    // Update user preferences
    let preferences = await UserPreference.findOne({ user: req.user.id });
    if (preferences) {
      if (!preferences.dismissedRecommendations.includes(recommendation.course)) {
        preferences.dismissedRecommendations.push(recommendation.course);
        await preferences.save();
      }
    }
    
    res.status(200).json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending courses
// @route   GET /api/recommendations/trending
// @access  Public
exports.getTrendingCourses = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get courses with most enrollments in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const courses = await Course.aggregate([
      { $match: { isPublished: true } },
      {
        $lookup: {
          from: 'enrollments',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course', '$$courseId'] },
                    { $gte: ['$enrolledAt', thirtyDaysAgo] }
                  ]
                }
              }
            }
          ],
          as: 'recentEnrollments'
        }
      },
      {
        $addFields: {
          trendingScore: { $size: '$recentEnrollments' }
        }
      },
      { $sort: { trendingScore: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate recommendations
async function generateRecommendations(userId) {
  const recommendations = [];
  
  // Get user's enrollments and preferences
  const enrollments = await Enrollment.find({ user: userId }).populate('course');
  const preferences = await UserPreference.findOne({ user: userId });
  
  const enrolledCourseIds = enrollments.map(e => e.course._id.toString());
  const completedCourses = enrollments.filter(e => e.progress === 100).map(e => e.course);
  
  // Get user's categories from completed courses
  const userCategories = [...new Set(completedCourses.map(c => c.category))];
  const userLevel = preferences?.preferredLevel || 'intermediate';
  
  // Get all published courses not enrolled by user
  const availableCourses = await Course.find({
    _id: { $nin: enrolledCourseIds },
    isPublished: true
  }).populate('instructor');
  
  // Calculate recommendation scores
  for (const course of availableCourses) {
    let score = 0;
    const reasons = [];
    
    // Category match (30% weight)
    if (userCategories.includes(course.category)) {
      score += 30;
      reasons.push({
        type: 'category_match',
        weight: 0.3,
        description: {
          en: `Matches your interest in ${course.category}`,
          ar: `يتناسب مع اهتمامك في ${course.category}`,
          fr: `Correspond à votre intérêt pour ${course.category}`
        }
      });
    }
    
    // Level match (20% weight)
    if (course.level === userLevel || course.level === 'all') {
      score += 20;
      reasons.push({
        type: 'level_match',
        weight: 0.2,
        description: {
          en: `Appropriate for your ${userLevel} level`,
          ar: `مناسب لمستواك ${userLevel}`,
          fr: `Adapté à votre niveau ${userLevel}`
        }
      });
    }
    
    // Popularity (20% weight)
    const popularityScore = Math.min((course.enrolled || 0) / 100, 1) * 20;
    score += popularityScore;
    if (popularityScore > 10) {
      reasons.push({
        type: 'popular',
        weight: 0.2,
        description: {
          en: 'Popular among students',
          ar: 'شائع بين الطلاب',
          fr: 'Populaire parmi les étudiants'
        }
      });
    }
    
    // Instructor match (15% weight)
    if (preferences?.favoriteInstructors?.includes(course.instructor._id)) {
      score += 15;
      reasons.push({
        type: 'instructor_match',
        weight: 0.15,
        description: {
          en: 'From your favorite instructor',
          ar: 'من مدربك المفضل',
          fr: 'De votre instructeur préféré'
        }
      });
    }
    
    // High rating (15% weight)
    if (course.rating && course.rating >= 4.5) {
      score += 15;
      reasons.push({
        type: 'popular',
        weight: 0.15,
        description: {
          en: `Highly rated (${course.rating}/5)`,
          ar: `تقييم عالي (${course.rating}/5)`,
          fr: `Très bien noté (${course.rating}/5)`
        }
      });
    }
    
    if (score > 0) {
      recommendations.push({
        user: userId,
        course: course._id,
        score,
        reasons,
        metadata: {
          userCategories,
          userLevel
        }
      });
    }
  }
  
  // Sort by score and return
  return recommendations.sort((a, b) => b.score - a.score);
}

module.exports = exports;
