const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

/**
 * Mock Auth Middleware
 * Accepts either:
 *   1. A valid JWT Bearer token (Authorization header) — for real registered users
 *   2. An `x-user-id` header — for legacy/dev mock auth
 * Falls back to first DB user if neither is provided (for easy local dev).
 * Uses a short-lived in-memory cache to avoid a DB round-trip on every request.
 */

// Simple in-memory user cache exposed globally so controllers can bust it
if (!global.__authUserCache) global.__authUserCache = new Map();
if (!global.__authPromises) global.__authPromises = new Map(); // For in-flight deduplication
const userCache = global.__authUserCache;
const authPromises = global.__authPromises;
const CACHE_TTL_MS = 30_000; // 30 seconds

const mockAuth = async (req, res, next) => {
  try {
    let userId = req.headers['x-user-id'];

    // ── JWT token takes precedence over x-user-id ───────────
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ') && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Invalid token — fall through to x-user-id / default
      }
    }

    if (!userId) {
      // In production, unauthenticated requests must be rejected.
      // In development, fall back to the first DB user for convenience.
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
      }

      // Cache the default user ID so we don't query DB on every unauthenticated request.
      if (!global.__defaultUserId) {
        const defaultUser = await prisma.user.findFirst();
        if (!defaultUser) {
          return res.status(401).json({ error: 'Unauthorized: No users in database' });
        }
        global.__defaultUserId = defaultUser.id;
      }
      userId = global.__defaultUserId;
    }

    // Check cache
    const cached = userCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = cached.user;
      return next();
    }

    // Deduplicate concurrent auth queries
    let user;
    if (authPromises.has(userId)) {
      user = await authPromises.get(userId);
    } else {
      const fetchPromise = prisma.user.findUnique({ where: { id: userId } });
      authPromises.set(userId, fetchPromise);
      try {
        user = await fetchPromise;
      } finally {
        authPromises.delete(userId);
      }
      
      if (user) {
        // Populate cache
        userCache.set(userId, { user, expiresAt: Date.now() + CACHE_TTL_MS });
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user ID' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { mockAuth };
