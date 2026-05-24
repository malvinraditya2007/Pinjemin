require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Warm up Prisma connection pool before accepting requests
// This eliminates cold-start latency on the first API call
prisma.user.findFirst().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Pinjemin Backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to warm up database:', err);
  // Start anyway even if warm-up fails
  server.listen(PORT, () => {
    console.log(`🚀 Pinjemin Backend running on http://localhost:${PORT} (DB warm-up failed)`);
  });
});
