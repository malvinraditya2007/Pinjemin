const express = require('express');
const router = express.Router();
const userController = require('../controllers/users.controller');

// Get current logged-in user
router.get('/me', userController.getMe);

// Update current logged-in user
router.put('/me', userController.updateMe);

// Get top lenders
router.get('/top', userController.getTopLenders);

// Get current logged-in user impact
router.get('/me/impact', userController.getImpact);

// Get a specific user by ID
router.get('/:id', userController.getUser);

module.exports = router;
