const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { jwtAuth } = require('../middleware/jwtAuth');

// POST /v1/auth/register
router.post('/register', authController.register);

// POST /v1/auth/login
router.post('/login', authController.login);

// GET /v1/auth/me — protected
router.get('/me', jwtAuth, authController.getMe);

module.exports = router;
