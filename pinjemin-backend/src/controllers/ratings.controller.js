const ratingsService = require('../services/ratings.service');

exports.submitRating = async (req, res, next) => {
  try {
    const review = await ratingsService.submitRating(req.user.id, req.body);
    res.status(201).json(review);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};
