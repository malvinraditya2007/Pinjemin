const notificationsService = require('../services/notifications.service');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationsService.getNotifications(req.user.id);
    res.json(notifications);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await notificationsService.markAllRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};
