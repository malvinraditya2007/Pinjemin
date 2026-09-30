const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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

// Middleware
// In dev, allow ANY localhost port (Live Server uses 5500/5501/5503, etc.)
// In production, lock to FRONTEND_URL env var (e.g. https://pinjemin.com)
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    // In dev: allow any localhost or 127.0.0.1 regardless of port
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    // In prod (or if FRONTEND_URL set): check explicit allowlist
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 1000, // Increased for dev
});
app.use('/v1', limiter);

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
app.get('/', (req, res) => res.send('🚀 Pinjemin Backend API is running! Access the frontend at http://localhost:5500'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Error handling
app.use(errorHandler);

module.exports = app;
