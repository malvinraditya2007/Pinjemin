const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const SEED_PASSWORD = 'pinjemin123'; // All seed users share this password

async function main() {
  // Clear existing data (order respects FK constraints)
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.request.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // Hash the shared seed password once
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // ── Users ──────────────────────────────────────────────────────────
  // Schema changes: neighborhood dropped from User (use address instead)
  const user1 = await prisma.user.create({
    data: {
      id: 'user-001',
      username: 'budi_santoso',
      fullName: 'Budi Santoso',
      phone: '+62811234567',
      passwordHash,
      bio: 'Senang berbagi dan membantu komunitas sekitar. Mari jaga lingkungan bersama! 🌱',
      trustScore: 87,
      trustLevel: 'TRUSTED',
      totalLends: 24,
      totalBorrows: 18,
      successfulReturns: 17,
      address: 'Menteng, Jakarta Pusat',
      lat: -6.1965,
      lng: 106.8325,
      role: 'USER',
    }
  });

  const user2 = await prisma.user.create({
    data: {
      id: 'user-002',
      username: 'andi_p',
      fullName: 'Andi Pratama',
      phone: '+62822345678',
      passwordHash,
      trustScore: 92,
      trustLevel: 'VERIFIED',
      totalLends: 31,
      totalBorrows: 5,
      successfulReturns: 28,
      address: 'Gondangdia, Jakarta Pusat',
      lat: -6.1888,
      lng: 106.8322,
      role: 'USER',
    }
  });

  const user3 = await prisma.user.create({
    data: {
      id: 'user-003',
      username: 'sari_d',
      fullName: 'Sari Dewi',
      phone: '+62833456789',
      passwordHash,
      trustScore: 78,
      trustLevel: 'TRUSTED',
      totalLends: 12,
      totalBorrows: 9,
      successfulReturns: 9,
      address: 'Cikini, Jakarta Pusat',
      lat: -6.1900,
      lng: 106.8400,
      role: 'USER',
    }
  });

  const user5 = await prisma.user.create({
    data: {
      id: 'user-005',
      username: 'fajar_n',
      fullName: 'Fajar Nugroho',
      phone: '+62855678901',
      passwordHash,
      trustScore: 55,
      trustLevel: 'MEMBER',
      address: 'Pegangsaan, Jakarta Pusat',
      lat: -6.1983,
      lng: 106.8450,
      role: 'USER',
    }
  });

  // ── Items ──────────────────────────────────────────────────────────
  const item1 = await prisma.item.create({
    data: {
      id: 'item-001',
      title: 'Mesin Bor Bosch GSB 550',
      description: 'Mesin bor listrik Bosch serbaguna, cocok untuk kayu dan tembok ringan. Dilengkapi mata bor berbagai ukuran.',
      category: 'TOOLS',
      condition: 'EXCELLENT',
      images: [],
      depositAmount: 50000,
      isAvailable: true,
      viewCount: 124,
      neighborhood: 'Menteng',
      lat: -6.1965,
      lng: 106.8325,
      tags: ['bor', 'listrik', 'bosch'],
      usageGuidelines: 'Harap kembalikan dalam kondisi bersih. Jangan gunakan untuk material yang terlalu keras.',
      ownerId: user2.id,
    }
  });

  const item2 = await prisma.item.create({
    data: {
      id: 'item-002',
      title: 'Tenda Camping Coleman 4 Orang',
      description: 'Tenda kapasitas 4 orang, waterproof, mudah dipasang. Cocok untuk camping weekend.',
      category: 'OUTDOOR',
      condition: 'GOOD',
      images: [],
      depositAmount: 100000,
      isAvailable: true,
      viewCount: 89,
      neighborhood: 'Gondangdia',
      lat: -6.1888,
      lng: 106.8322,
      tags: ['camping', 'tenda', 'outdoor'],
      usageGuidelines: 'Keringkan sebelum dikembalikan. Cek tiang dan pasak lengkap.',
      ownerId: user3.id,
    }
  });

  const item3 = await prisma.item.create({
    data: {
      id: 'item-003',
      title: 'Proyektor Epson EB-X41',
      description: 'Proyektor portabel 3600 lumen. Cocok untuk presentasi dan nonton bareng.',
      category: 'ELECTRONICS',
      condition: 'EXCELLENT',
      images: [],
      depositAmount: 200000,
      isAvailable: false,
      viewCount: 210,
      neighborhood: 'Menteng',
      lat: -6.1965,
      lng: 106.8325,
      tags: ['proyektor', 'presentasi', 'epson'],
      usageGuidelines: 'Handle with care. Jangan sentuh lensa. Kembalikan dengan kabel lengkap.',
      ownerId: user1.id,
    }
  });

  // ── Requests ───────────────────────────────────────────────────────
  const req1 = await prisma.request.create({
    data: {
      id: 'req-001',
      status: 'APPROVED',
      purpose: 'Mau pasang rak di ruang tamu, butuh bor sekitar 2 jam',
      startDate: new Date('2026-05-15T00:00:00Z'),
      endDate: new Date('2026-05-15T23:59:00Z'),
      message: 'Halo, boleh saya pinjam bornya?',
      itemId: item1.id,
      borrowerId: user1.id,
      lenderId: user2.id,
    }
  });

  const req2 = await prisma.request.create({
    data: {
      id: 'req-002',
      status: 'PENDING',
      purpose: 'Camping di Sentul minggu ini bareng keluarga',
      startDate: new Date('2026-05-17T00:00:00Z'),
      endDate: new Date('2026-05-19T23:59:00Z'),
      itemId: item2.id,
      borrowerId: user1.id,
      lenderId: user3.id,
    }
  });

  const req3 = await prisma.request.create({
    data: {
      id: 'req-003',
      status: 'PENDING',
      purpose: 'Presentasi bisnis di kantor, butuh proyektor 1 hari',
      startDate: new Date('2026-05-13T00:00:00Z'),
      endDate: new Date('2026-05-13T23:59:00Z'),
      message: 'Halo kak, boleh pinjam proyektornya untuk presentasi besok?',
      itemId: item3.id,
      borrowerId: user5.id,
      lenderId: user1.id,
    }
  });

  // ── Notifications ──────────────────────────────────────────────────
  // Schema change: data is now native Json — pass plain objects, NOT JSON.stringify
  await prisma.notification.create({
    data: {
      type: 'BORROW_REQUEST_RECEIVED',
      title: 'Ada yang mau meminjam! 📦',
      body: 'Fajar Nugroho ingin meminjam Proyektor Epson EB-X41 dari 13 Mei – 13 Mei.',
      isRead: false,
      userId: user1.id,
      data: { requestId: req3.id },
    }
  });

  await prisma.notification.create({
    data: {
      type: 'BORROW_REQUEST_APPROVED',
      title: 'Permintaan Disetujui! ✅',
      body: 'Andi Pratama menyetujui peminjaman Mesin Bor Bosch GSB 550.',
      isRead: false,
      userId: user1.id,
      data: { requestId: req1.id },
    }
  });

  await prisma.notification.create({
    data: {
      type: 'WELCOME',
      title: 'Selamat datang di Pinjemin! 👋',
      body: 'Temukan dan pinjam barang dari tetanggamu. Mulai dengan menelusuri barang tersedia.',
      isRead: true,
      userId: user1.id,
    }
  });

  console.log('✅ Seeding completed successfully!');
  console.log(`   Users: 4 | Items: 3 | Requests: 3 | Notifications: 3`);
  console.log(`\n🔑 Login credentials for all seed users: password = "${SEED_PASSWORD}"`);
  console.log(`   budi_santoso | andi_p | sari_d | fajar_n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
