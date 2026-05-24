const prisma = require('../config/prisma');

exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { fullName, bio, address, username } = req.body;

    // Validate username format if provided
    if (username !== undefined) {
      if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        return res.status(400).json({
          error: 'Username hanya boleh berisi huruf kecil, angka, dan underscore (3–30 karakter)'
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        bio,
        address,
        ...(username !== undefined && { username }),
      },
    });

    // Bust the auth middleware cache so next request sees updated user data
    if (global.__authUserCache) {
      global.__authUserCache.delete(req.user.id);
    }

    // If address changed, sync all user's items' neighborhood field
    if (address !== undefined && address !== req.user.address) {
      await prisma.item.updateMany({
        where: { ownerId: req.user.id },
        data: { neighborhood: address },
      });
    }

    res.json(updatedUser);
  } catch (err) {
    // Prisma unique constraint violation (P2002)
    if (err.code === 'P2002' && err.meta?.target?.includes('username')) {
      return res.status(409).json({ error: 'Username sudah dipakai, coba yang lain' });
    }
    next(err);
  }
};


exports.getTopLenders = async (req, res, next) => {
  try {
    const topLenders = await prisma.user.findMany({
      orderBy: { totalLends: 'desc' },
      take: 3,
      select: {
        id: true,
        fullName: true,
        totalLends: true,
        trustScore: true
      }
    });
    res.json(topLenders);
  } catch (err) {
    next(err);
  }
};

exports.getImpact = async (req, res, next) => {
  try {
    const user = req.user;
    const impact = {
      co2SavedKg: user.successfulReturns * 4,
      moneySavedIdr: user.successfulReturns * 83333,
      completedBorrows: user.successfulReturns
    };
    res.json(impact);
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};
