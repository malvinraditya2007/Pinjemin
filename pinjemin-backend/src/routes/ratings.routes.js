const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratings.controller');

router.post('/', ratingController.submitRating);

module.exports = router;
