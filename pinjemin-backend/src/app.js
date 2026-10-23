const express = require('express');
require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { mockAuth } = require('./middleware/auth');

// Patch BigInt for JSON.stringify to prevent errors when returning BigInt from Prisma
BigInt.prototype.toJSON = function () {
  return Number(this);
};

// Routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const itemsRoutes = require('./routes/items.routes');
const requestsRoutes = require('./routes/requests.routes');
const ratingsRoutes = require('./routes/ratings.routes');
const notificationsRoutes = require('./routes/notifications.routes');

const app = express();

// ── Native CORS Middleware (zero-dependency) ─────────────────────────
// In dev, allow ANY localhost port (Live Server uses 5500/5501/5503, etc.)
// In production, lock to FRONTEND_URL env var (e.g. https://pinjemin.com)
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  let isAllowed = false;
  if (!origin) {
    isAllowed = true;
  } else if (origin === 'null') {
    isAllowed = true;
  } else if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    isAllowed = true;
  } else if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    isAllowed = true;
  }

  if (origin && isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    const reqHeaders = req.headers['access-control-request-headers'];
    res.setHeader('Access-Control-Allow-Headers', reqHeaders || 'Content-Type, Authorization, X-Requested-With, x-user-id, X-User-Id');
  }

  if (req.method === 'OPTIONS') {
    return isAllowed
      ? res.sendStatus(204)
      : res.status(403).json({ message: `CORS: origin '${origin}' not allowed` });
  }

  if (origin && !isAllowed) {
    return res.status(403).json({ message: `CORS: origin '${origin}' not allowed` });
  }

  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Minimal Request Logger (zero-dependency replacement for morgan) ───
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// ── Minimal In-Memory Rate Limiter (zero-dependency replacement for express-rate-limit)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, RATE_LIMIT_WINDOW).unref();

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  let client = rateLimitMap.get(ip);

  if (!client || now > client.resetTime) {
    client = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(ip, client);
  } else {
    client.count++;
  }

  if (client.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Too many requests, please try again later.' });
  }

  next();
};

app.use('/v1', rateLimiter);

// ── Auth routes (public — no mockAuth required) ──────────────
app.use('/v1/auth', authRoutes);

// Mock Auth Middleware (applied only to non-auth routes below)
app.use('/v1', mockAuth);

// Routes mounting
app.use('/v1/users', usersRoutes);
app.use('/v1/items', itemsRoutes);
app.use('/v1/requests', requestsRoutes);
app.use('/v1/ratings', ratingsRoutes);
app.use('/v1/notifications', notificationsRoutes);

// Health check & Root
app.get('/', (req, res) => res.send('🚀 Pinjemin Backend API is running! Access the frontend at http://localhost:5503'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Error handling
app.use(errorHandler);

module.exports = app;
