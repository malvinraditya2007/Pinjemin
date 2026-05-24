const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.request.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      id: 'user-001',
      username: 'budi_santoso',
      fullName: 'Budi Santoso',
      phone: '+62811234567',
      bio: 'Senang berbagi dan membantu komunitas sekitar. Mari jaga lingkungan bersama! 🌱',
      trustScore: 87,
      trustLevel: 'TRUSTED',
      totalLends: 24,
      totalBorrows: 18,
      successfulReturns: 17,
      neighborhood: 'Menteng',
      address: 'Menteng, Jakarta Pusat',
    }
  });

  const user2 = await prisma.user.create({
    data: {
      id: 'user-002',
      username: 'andi_p',
      fullName: 'Andi Pratama',
      phone: '+62822345678',
      trustScore: 92,
      trustLevel: 'VERIFIED',
      neighborhood: 'Gondangdia',
    }
  });

  const user3 = await prisma.user.create({
    data: {
      id: 'user-003',
      username: 'sari_d',
      fullName: 'Sari Dewi',
      phone: '+62833456789',
      trustScore: 78,
      trustLevel: 'TRUSTED',
      neighborhood: 'Cikini',
    }
  });

  const user5 = await prisma.user.create({
    data: {
      id: 'user-005',
      username: 'fajar_n',
      fullName: 'Fajar Nugroho',
      phone: '+62855678901',
      trustScore: 55,
      trustLevel: 'MEMBER',
      neighborhood: 'Pegangsaan',
    }
  });

  // Create Items
  const item1 = await prisma.item.create({
    data: {
      id: 'item-001',
      title: 'Mesin Bor Bosch GSB 550',
      description: 'Mesin bor listrik Bosch serbaguna, cocok untuk kayu dan tembok ringan. Dilengkapi mata bor berbagai ukuran.',
      category: 'TOOLS',
      condition: 'EXCELLENT',
      images: '',
      depositAmount: 50000,
      isAvailable: true,
      viewCount: 124,
      neighborhood: 'Menteng',
      distance: 1.2,
      tags: 'bor,listrik,bosch',
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
      images: '',
      depositAmount: 100000,
      isAvailable: true,
      viewCount: 89,
      neighborhood: 'Gondangdia',
      distance: 2.5,
      tags: 'camping,tenda,outdoor',
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
      images: '',
      depositAmount: 200000,
      isAvailable: false,
      viewCount: 210,
      neighborhood: 'Menteng',
      distance: 0.8,
      tags: 'proyektor,presentasi,epson',
      usageGuidelines: 'Handle with care. Jangan sentuh lensa. Kembalikan dengan kabel lengkap.',
      ownerId: user1.id,
    }
  });

  // Create Requests
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

  // Create Notifications
  await prisma.notification.create({
    data: {
      type: 'BORROW_REQUEST_RECEIVED',
      title: 'Ada yang mau meminjam! 📦',
      body: 'Fajar Nugroho ingin meminjam Proyektor Epson EB-X41 dari 13 Mei – 13 Mei.',
      isRead: false,
      userId: user1.id,
      data: JSON.stringify({ requestId: req3.id }),
    }
  });

  await prisma.notification.create({
    data: {
      type: 'BORROW_REQUEST_APPROVED',
      title: 'Permintaan Disetujui! ✅',
      body: 'Andi Pratama menyetujui peminjaman Mesin Bor Bosch GSB 550.',
      isRead: false,
      userId: user1.id,
      data: JSON.stringify({ requestId: req1.id }),
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
