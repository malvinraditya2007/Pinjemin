const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notifications.controller');

// Get all notifications for current user
router.get('/', notificationController.getNotifications);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllRead);

module.exports = router;
