const mongoose = require('mongoose');

const SearchIndexSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['course', 'lesson', 'user', 'instructor'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  title: {
    type: Map,
    of: String
  },
  content: {
    type: Map,
    of: String
  },
  keywords: [String],
  category: String,
  level: String,
  tags: [String],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  popularity: {
    type: Number,
    default: 0
  },
  lastIndexed: {
    type: Date,
    default: Date.now
  }
});

const SearchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  query: {
    type: String,
    required: true
  },
  filters: {
    category: String,
    level: String,
    priceRange: {
      min: Number,
      max: Number
    },
    language: [String],
    rating: Number
  },
  results: {
    count: Number,
    clicked: [{
      entityId: mongoose.Schema.Types.ObjectId,
      entityType: String,
      position: Number
    }]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for search performance
SearchIndexSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
SearchIndexSchema.index({ keywords: 1 });
SearchIndexSchema.index({ category: 1, level: 1 });
SearchIndexSchema.index({ popularity: -1 });
SearchIndexSchema.index({ 'title.en': 'text', 'title.ar': 'text', 'title.fr': 'text', 'content.en': 'text', 'content.ar': 'text', 'content.fr': 'text' });

SearchHistorySchema.index({ user: 1, timestamp: -1 });
SearchHistorySchema.index({ query: 1 });
SearchHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const SearchIndex = mongoose.model('SearchIndex', SearchIndexSchema);
const SearchHistory = mongoose.model('SearchHistory', SearchHistorySchema);

module.exports = { SearchIndex, SearchHistory };
