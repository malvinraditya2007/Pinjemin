/**
 * Prisma Singleton
 * Ensures only ONE PrismaClient instance is created for the entire process.
 * Multiple instances each open their own connection pool → massive startup overhead.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = global.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

module.exports = prisma;
