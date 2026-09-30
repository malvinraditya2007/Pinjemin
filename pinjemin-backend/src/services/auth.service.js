const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const SALT_ROUNDS = 10;

exports.registerUser = async ({ nama, username, password }) => {
  const existing = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  if (existing) {
    const error = new Error('Username sudah digunakan.');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      fullName: nama,
      passwordHash,
      role: 'USER',
    },
  });

  return user;
};

exports.loginUser = async ({ username, password }) => {
  const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  if (!user || !user.passwordHash) {
    const error = new Error('Username atau password salah.');
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Username atau password salah.');
    error.status = 401;
    throw error;
  }

  const payload = {
    id: user.id,
    username: user.username,
    nama: user.fullName,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return { token, user };
};

exports.getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      bio: true,
      trustScore: true,
      trustLevel: true,
      totalLends: true,
      totalBorrows: true,
      successfulReturns: true,
      address: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error('User tidak ditemukan.');
    error.status = 404;
    throw error;
  }

  return user;
};
