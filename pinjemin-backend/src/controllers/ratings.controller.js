const prisma = require('../config/prisma');
const { getIo } = require('../config/socket');

exports.submitRating = async (req, res, next) => {
  try {
    const { requestId, rating, itemCond, comment } = req.body;
    
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Prevent duplicate reviews — schema has @unique on requestId
    const existingReview = await prisma.review.findUnique({ where: { requestId } });
    if (existingReview) return res.status(409).json({ error: 'Review already submitted for this request' });
    
    // Simplification: borrower rates lender
    const targetId = request.lenderId;

    const review = await prisma.review.create({
      data: {
        rating,
        itemCond,
        comment,
        authorId: req.user.id,
        targetId,
        itemId: request.itemId,
        requestId
      }
    });

    // Simple Trust Score update logic (blueprint §8.7)
    // +2 for 5 star, +1 for 4 star, -1 for 3 star, -5 for 1-2 star
    let scoreChange = 0;
    if (rating === 5) scoreChange = 2;
    else if (rating === 4) scoreChange = 1;
    else if (rating === 3) scoreChange = -1;
    else if (rating < 3) scoreChange = -5;

    if (scoreChange !== 0) {
      const targetUser = await prisma.user.findUnique({ where: { id: targetId }});
      const newScore = Math.max(0, Math.min(100, targetUser.trustScore + scoreChange));

      // Derive TrustLevel enum from score brackets (matches utils.js getTrustLevel)
      let newTrustLevel = 'NEW';
      if (newScore > 89) newTrustLevel = 'VERIFIED';
      else if (newScore > 70) newTrustLevel = 'TRUSTED';
      else if (newScore > 40) newTrustLevel = 'MEMBER';
      
      await prisma.user.update({
        where: { id: targetId },
        data: { trustScore: newScore, trustLevel: newTrustLevel }
      });

      // Notify target user about score change
      const notif = await prisma.notification.create({
        data: {
          type: 'TRUST_SCORE_CHANGED',
          title: 'Trust Score Update! 🚀',
          body: `Seseorang baru saja memberikan rating. Trust score kamu sekarang ${newScore}.`,
          userId: targetId
        }
      });
      try { getIo().to(targetId).emit('notification', notif); } catch(e) {}
    }

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};
