const authService = require('../services/auth.service');

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

    await authService.registerUser({ nama, username, password });

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan login.',
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
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

    const { token, user } = await authService.loginUser({ username, password });

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
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
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
    const user = await authService.getUserProfile(req.user.id);

    return res.json({ success: true, user });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};
