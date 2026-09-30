const prisma = require('../config/prisma');

exports.getNotifications = async (userId) => {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  return notifications;
};

exports.markAllRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
};
