const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const SALT_ROUNDS = 10;

/**
 * POST /v1/auth/register
 * Body: { nama, username, password }
 */
exports.register = async (req, res, next) => {
  try {
    const { nama, username, password } = req.body;

    // ── Basic field validation ──────────────────────────────
    if (!nama || !username || !password) {
      return res.status(400).json({ success: false, message: 'Nama, username, dan password wajib diisi.' });
    }

    // Validate username format: alphanumeric + underscore, 3-20 chars
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Username hanya boleh huruf kecil, angka, dan underscore (3-20 karakter).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
    }

    // ── Check for existing username ─────────────────────────
    const existing = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username sudah digunakan.' });
    }

    // ── Build a unique phone placeholder ────────────────────
    // phone field is @unique in the schema, so we need a value
    const phone = `+62${Date.now()}`;

    // ── Hash password & create user ──────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        fullName: nama,
        passwordHash,
        phone,
        role: 'user',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan login.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /v1/auth/login
 * Body: { username, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    // ── Find user by username ───────────────────────────────
    const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    // ── Compare password ────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    // ── Issue JWT ───────────────────────────────────────────
    const payload = {
      id: user.id,
      username: user.username,
      nama: user.fullName,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        nama: user.fullName,
        username: user.username,
        role: user.role,
        trustScore: user.trustScore,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /v1/auth/me
 * Requires: Authorization: Bearer <token>
 */
exports.getMe = async (req, res, next) => {
  try {
    // req.user is populated by jwtAuth middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        neighborhood: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
