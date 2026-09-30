require('dotenv').config();

// ── Fail-Fast Env Validation ─────────────────────────────────────────
const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);
if (missingEnvs.length > 0) {
  console.error(`❌ FATAL ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// ── Graceful Shutdown ────────────────────────────────────────────────
// Properly releases the port on SIGINT (Ctrl+C) and SIGTERM (nodemon restart).
// Without this, nodemon hot-reloads can leave the port in TIME_WAIT and cause
// EADDRINUSE on the next start.
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed. Disconnecting Prisma...');
    await prisma.$disconnect().catch(() => {});
    console.log('Prisma disconnected. Bye! 👋');
    process.exit(0);
  });

  // Force-kill if graceful shutdown hangs for more than 5 seconds
  setTimeout(() => {
    console.error('Graceful shutdown timed out — forcing exit.');
    process.exit(1);
  }, 5000).unref(); // .unref() prevents the timer from keeping the process alive
}

process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ── Unhandled error events on server (e.g. EADDRINUSE) ───────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the process first:`);
    console.error(`   PowerShell: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// ── Start ────────────────────────────────────────────────────────────
// Warm up Prisma connection pool before accepting requests.
// This eliminates cold-start latency on the first API call.
prisma.user.findFirst()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Pinjemin Backend running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('⚠️  DB warm-up failed, starting anyway:', err.message);
    server.listen(PORT, () => {
      console.log(`🚀 Pinjemin Backend running on http://localhost:${PORT} (DB warm-up failed)`);
    });
  });
