const prisma = require('../config/prisma');

exports.getMe = async (userId) => {
  const freshUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      bio: true,
      address: true,
      trustScore: true,
      trustLevel: true,
      totalLends: true,
      totalBorrows: true,
      successfulReturns: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!freshUser) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return freshUser;
};

exports.updateMe = async (userId, userAddress, data) => {
  const { fullName, bio, address, username } = data;

  if (username !== undefined) {
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      const error = new Error('Username hanya boleh berisi huruf kecil, angka, dan underscore (3–30 karakter)');
      error.status = 400;
      throw error;
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(bio !== undefined && { bio }),
        ...(address !== undefined && { address }),
        ...(username !== undefined && { username: username.toLowerCase() }),
      },
    });

    if (global.__authUserCache) {
      global.__authUserCache.delete(userId);
    }

    if (address !== undefined && address !== userAddress) {
      await prisma.item.updateMany({
        where: { ownerId: userId },
        data: { neighborhood: address },
      });
    }

    return updatedUser;
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('username')) {
      const error = new Error('Username sudah dipakai, coba yang lain');
      error.status = 409;
      throw error;
    }
    throw err;
  }
};

exports.getTopLenders = async () => {
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
  return topLenders;
};

exports.getImpact = async (successfulReturns) => {
  return {
    co2SavedKg: successfulReturns * 4,
    moneySavedIdr: successfulReturns * 83333,
    completedBorrows: successfulReturns
  };
};

exports.getUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      avatarUrl: true,
      bio: true,
      trustScore: true,
      trustLevel: true,
      totalLends: true,
      totalBorrows: true,
      successfulReturns: true,
      address: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          condition: true,
          isAvailable: true,
          images: true,
          neighborhood: true,
          depositAmount: true,
          tags: true,
          createdAt: true,
        }
      },
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return user;
};
