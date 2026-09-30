const prisma = require('../config/prisma');
const { getIo } = require('../config/socket');

exports.getSentRequests = async (userId) => {
  const requests = await prisma.request.findMany({
    where: { borrowerId: userId },
    include: {
      item: true,
      lender: { select: { id: true, fullName: true, trustScore: true, trustLevel: true, avatarUrl: true } },
      review: { select: { id: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return requests;
};

exports.getReceivedRequests = async (userId) => {
  const requests = await prisma.request.findMany({
    where: { lenderId: userId },
    include: {
      item: true,
      borrower: { select: { id: true, fullName: true, trustScore: true, trustLevel: true, avatarUrl: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return requests;
};

exports.createRequest = async (userId, data) => {
  const { itemId, purpose, message, startDate, endDate } = data;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    const error = new Error('Item not found');
    error.status = 404;
    throw error;
  }
  if (!item.isAvailable) {
    const error = new Error('Item is currently not available');
    error.status = 400;
    throw error;
  }
  if (item.ownerId === userId) {
    const error = new Error('Cannot borrow your own item');
    error.status = 400;
    throw error;
  }

  const newReq = await prisma.request.create({
    data: {
      purpose,
      message,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      itemId,
      borrowerId: userId,
      lenderId: item.ownerId
    }
  });

  const borrower = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });

  // Notify lender
  const notif = await prisma.notification.create({
    data: {
      type: 'BORROW_REQUEST_RECEIVED',
      title: 'Ada yang mau meminjam! 📦',
      body: `${borrower.fullName} ingin meminjam ${item.title}.`,
      userId: item.ownerId,
      data: { requestId: newReq.id }
    }
  });

  try {
    getIo().to(item.ownerId).emit('notification', notif);
  } catch (e) {}

  return newReq;
};

exports.updateStatus = async (userId, requestId, status, rejectReason) => {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { item: true }
  });

  if (!request) {
    const error = new Error('Request not found');
    error.status = 404;
    throw error;
  }

  const isLender = request.lenderId === userId;
  const isBorrower = request.borrowerId === userId;

  if (!isLender && !isBorrower) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  if (status === 'APPROVED' && !isLender) {
    const error = new Error('Only lender can approve');
    error.status = 403;
    throw error;
  }
  if (status === 'REJECTED' && !isLender) {
    const error = new Error('Only lender can reject');
    error.status = 403;
    throw error;
  }
  if (status === 'CANCELLED' && !isBorrower) {
    const error = new Error('Only borrower can cancel');
    error.status = 403;
    throw error;
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { 
      status,
      ...(rejectReason && { rejectReason })
    }
  });

  // Side effects
  if (status === 'APPROVED') {
    await prisma.item.update({ where: { id: request.itemId }, data: { isAvailable: false } });
    await Promise.all([
      prisma.user.update({ where: { id: request.lenderId },   data: { totalLends: { increment: 1 } } }),
      prisma.user.update({ where: { id: request.borrowerId }, data: { totalBorrows: { increment: 1 } } }),
    ]);
    if (global.__authUserCache) {
      global.__authUserCache.delete(request.lenderId);
      global.__authUserCache.delete(request.borrowerId);
    }
  } else if (status === 'RETURNED') {
    await prisma.item.update({ where: { id: request.itemId }, data: { isAvailable: true } });
    await Promise.all([
      prisma.user.update({ where: { id: request.lenderId },   data: { successfulReturns: { increment: 1 } } }),
      prisma.user.update({ where: { id: request.borrowerId }, data: { successfulReturns: { increment: 1 } } }),
    ]);
    if (global.__authUserCache) {
      global.__authUserCache.delete(request.lenderId);
      global.__authUserCache.delete(request.borrowerId);
    }
  } else if (status === 'CANCELLED' || status === 'REJECTED') {
    await prisma.item.update({ where: { id: request.itemId }, data: { isAvailable: true } });
  }

  const actor = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });

  // Notifications
  let notifType, notifTitle, notifBody, targetUserId;

  if (status === 'APPROVED') {
    targetUserId = request.borrowerId;
    notifType = 'BORROW_REQUEST_APPROVED';
    notifTitle = 'Permintaan Disetujui! ✅';
    notifBody = `${actor.fullName} menyetujui peminjaman ${request.item.title}.`;
  } else if (status === 'REJECTED') {
    targetUserId = request.borrowerId;
    notifType = 'BORROW_REQUEST_REJECTED';
    notifTitle = 'Permintaan Ditolak 😔';
    notifBody = `${actor.fullName} tidak dapat meminjamkan ${request.item.title} saat ini.`;
  } else if (status === 'RETURNED') {
    targetUserId = request.lenderId;
    notifType = 'ITEM_RETURNED';
    notifTitle = 'Barang Dikembalikan 🎉';
    notifBody = `${actor.fullName} telah mengembalikan ${request.item.title}. Silakan beri rating!`;
  }

  if (targetUserId) {
    const notif = await prisma.notification.create({
      data: { type: notifType, title: notifTitle, body: notifBody, userId: targetUserId, data: { requestId: request.id } }
    });
    try {
      getIo().to(targetUserId).emit('notification', notif);
    } catch (e) {}
  }

  return updated;
};
