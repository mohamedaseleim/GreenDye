const { SearchIndex, SearchHistory } = require('../models/SearchIndex');
const Course = require('../models/Course');
// const User = require('../models/User'); // Unused import

// @desc    Advanced search with filters
// @route   GET /api/search
// @access  Public
exports.search = async (req, res, next) => {
  try {
    const {
      q,
      category,
      level,
      minPrice,
      maxPrice,
      language,
      rating,
      page = 1,
      limit = 20,
      sort = 'relevance'
    } = req.query;
    
    // Build search query
    const searchQuery = {};
    
    if (q) {
      // Text search on multiple language fields
      const searchRegex = new RegExp(q, 'i');
      searchQuery.$or = [
        { 'title.en': searchRegex },
        { 'title.ar': searchRegex },
        { 'title.fr': searchRegex },
        { 'description.en': searchRegex },
        { 'description.ar': searchRegex },
        { 'description.fr': searchRegex }
      ];
    }
    
    // Apply filters
    if (category) searchQuery.category = category;
    if (level) searchQuery.level = level;
    if (language) searchQuery.language = { $in: Array.isArray(language) ? language : [language] };
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }
    if (rating) searchQuery.rating = { $gte: parseFloat(rating) };
    
    searchQuery.isPublished = true;
    
    // Sort options
    let sortQuery = {};
    switch (sort) {
      case 'price_asc':
        sortQuery = { price: 1 };
        break;
      case 'price_desc':
        sortQuery = { price: -1 };
        break;
      case 'rating':
        sortQuery = { rating: -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'popular':
        sortQuery = { enrolled: -1 };
        break;
      default:
        sortQuery = { enrolled: -1, rating: -1 }; // relevance
    }
    
    // Execute search
    const courses = await Course.find(searchQuery)
      .populate('instructor', 'name avatar')
      .sort(sortQuery)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Course.countDocuments(searchQuery);
    
    // Log search history if user is authenticated
    if (req.user) {
      await SearchHistory.create({
        user: req.user.id,
        query: q || '',
        filters: {
          category,
          level,
          priceRange: { min: minPrice, max: maxPrice },
          language: language ? (Array.isArray(language) ? language : [language]) : undefined,
          rating
        },
        results: {
          count: total
        }
      });
    }
    
    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Public
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    const searchRegex = new RegExp(q, 'i');
    
    // Get course title suggestions
    const courses = await Course.find({
      $or: [
        { 'title.en': searchRegex },
        { 'title.ar': searchRegex },
        { 'title.fr': searchRegex }
      ],
      isPublished: true
    })
      .select('title slug')
      .limit(parseInt(limit));
    
    const suggestions = courses.map(course => ({
      title: course.title,
      slug: course.slug,
      type: 'course'
    }));
    
    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular searches
// @route   GET /api/search/popular
// @access  Public
exports.getPopularSearches = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get most frequent search queries from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const popularSearches = await SearchHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo },
          query: { $ne: '' }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          query: '$_id',
          count: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: popularSearches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's search history
// @route   GET /api/search/history
// @access  Private
exports.getSearchHistory = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    const history = await SearchHistory.find({
      user: req.user.id,
      query: { $ne: '' }
    })
      .sort('-timestamp')
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear search history
// @route   DELETE /api/search/history
// @access  Private
exports.clearSearchHistory = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      message: 'Search history cleared'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Index a course for search
// @route   POST /api/search/index/course/:id
// @access  Private/Admin
exports.indexCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Extract keywords from title and description
    const keywords = new Set();
    
    ['en', 'ar', 'fr'].forEach(lang => {
      if (course.title.get(lang)) {
        course.title.get(lang).split(/\s+/).forEach(word => {
          if (word.length > 2) keywords.add(word.toLowerCase());
        });
      }
      if (course.description.get(lang)) {
        course.description.get(lang).split(/\s+/).forEach(word => {
          if (word.length > 3) keywords.add(word.toLowerCase());
        });
      }
    });
    
    // Create or update search index
    await SearchIndex.findOneAndUpdate(
      { entityType: 'course', entityId: course._id },
      {
        entityType: 'course',
        entityId: course._id,
        title: course.title,
        content: course.description,
        keywords: Array.from(keywords),
        category: course.category,
        level: course.level,
        metadata: {
          price: course.price,
          rating: course.rating,
          enrolled: course.enrolled
        },
        popularity: course.enrolled || 0,
        lastIndexed: new Date()
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Course indexed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get search filters/facets
// @route   GET /api/search/filters
// @access  Public
exports.getSearchFilters = async (req, res, next) => {
  try {
    const categories = await Course.distinct('category', { isPublished: true });
    const levels = await Course.distinct('level', { isPublished: true });
    const languages = await Course.distinct('language', { isPublished: true });
    
    // Get price range
    const priceStats = await Course.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);
    
    const filters = {
      categories,
      levels,
      languages: languages.flat(),
      priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 }
    };
    
    res.status(200).json({
      success: true,
      data: filters
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
