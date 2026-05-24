const prisma = require('../config/prisma');
const { getIo } = require('../config/socket');

exports.getSentRequests = async (req, res, next) => {
  try {
    const requests = await prisma.request.findMany({
      where: { borrowerId: req.user.id },
      include: {
        item: true,
        lender: { select: { id: true, fullName: true, trustScore: true, trustLevel: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

exports.getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await prisma.request.findMany({
      where: { lenderId: req.user.id },
      include: {
        item: true,
        borrower: { select: { id: true, fullName: true, trustScore: true, trustLevel: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const { itemId, purpose, message, startDate, endDate } = req.body;

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!item.isAvailable) return res.status(400).json({ error: 'Item is currently not available' });
    if (item.ownerId === req.user.id) return res.status(400).json({ error: 'Cannot borrow your own item' });

    const newReq = await prisma.request.create({
      data: {
        purpose,
        message,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        itemId,
        borrowerId: req.user.id,
        lenderId: item.ownerId
      }
    });

    // Notify lender
    const notif = await prisma.notification.create({
      data: {
        type: 'BORROW_REQUEST_RECEIVED',
        title: 'Ada yang mau meminjam! 📦',
        body: `${req.user.fullName} ingin meminjam ${item.title}.`,
        userId: item.ownerId,
        data: JSON.stringify({ requestId: newReq.id })
      }
    });

    try {
      getIo().to(item.ownerId).emit('notification', notif);
    } catch(e) {} // Ignore socket errors

    res.status(201).json(newReq);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, rejectReason } = req.body; // status: APPROVED, REJECTED, CANCELLED, RETURNED
    
    const request = await prisma.request.findUnique({
      where: { id: req.params.id },
      include: { item: true }
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Permissions
    const isLender = request.lenderId === req.user.id;
    const isBorrower = request.borrowerId === req.user.id;

    if (!isLender && !isBorrower) return res.status(403).json({ error: 'Forbidden' });

    if (status === 'APPROVED' && !isLender) return res.status(403).json({ error: 'Only lender can approve' });
    if (status === 'REJECTED' && !isLender) return res.status(403).json({ error: 'Only lender can reject' });
    if (status === 'CANCELLED' && !isBorrower) return res.status(403).json({ error: 'Only borrower can cancel' });

    // Update Request
    const updated = await prisma.request.update({
      where: { id: req.params.id },
      data: { 
        status,
        ...(rejectReason && { rejectReason })
      }
    });

    // Side effects (Item availability)
    if (status === 'APPROVED') {
      await prisma.item.update({ where: { id: request.itemId }, data: { isAvailable: false } });
    } else if (status === 'RETURNED' || status === 'CANCELLED' || status === 'REJECTED') {
      await prisma.item.update({ where: { id: request.itemId }, data: { isAvailable: true } });
    }

    // Notifications
    let notifType, notifTitle, notifBody, targetUserId;

    if (status === 'APPROVED') {
      targetUserId = request.borrowerId;
      notifType = 'BORROW_REQUEST_APPROVED';
      notifTitle = 'Permintaan Disetujui! ✅';
      notifBody = `${req.user.fullName} menyetujui peminjaman ${request.item.title}.`;
    } else if (status === 'REJECTED') {
      targetUserId = request.borrowerId;
      notifType = 'BORROW_REQUEST_REJECTED';
      notifTitle = 'Permintaan Ditolak 😔';
      notifBody = `${req.user.fullName} tidak dapat meminjamkan ${request.item.title} saat ini.`;
    } else if (status === 'RETURNED') {
      targetUserId = request.lenderId;
      notifType = 'ITEM_RETURNED';
      notifTitle = 'Barang Dikembalikan 🎉';
      notifBody = `${req.user.fullName} telah mengembalikan ${request.item.title}. Silakan beri rating!`;
    }

    if (targetUserId) {
      const notif = await prisma.notification.create({
        data: { type: notifType, title: notifTitle, body: notifBody, userId: targetUserId, data: JSON.stringify({ requestId: request.id }) }
      });
      try {
        getIo().to(targetUserId).emit('notification', notif);
      } catch(e) {}
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};
