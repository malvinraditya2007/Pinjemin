const jwt = require('jsonwebtoken');

/**
 * JWT Auth Middleware
 * Validates the Bearer token in the Authorization header.
 * Populates req.user with the decoded payload { id, email, nama, role }.
 */
const jwtAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa.',
    });
  }
};

module.exports = { jwtAuth };
