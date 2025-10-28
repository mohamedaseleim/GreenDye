const Lesson = require('../models/Lesson');

// PUT /api/lessons/reorder  body: { orderedIds: [lessonId1, lessonId2, ...] }
exports.reorderLessons = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || !orderedIds.length) {
      return res.status(400).json({ success: false, message: 'orderedIds is required' });
    }

    const ops = orderedIds.map((id, idx) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: idx } } }
    }));
    await Lesson.bulkWrite(ops);

    return res.status(200).json({ success: true, message: 'Order updated' });
  } catch (err) {
    next(err);
  }
};
