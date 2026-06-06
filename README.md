# Pinjemin — Platform Berbagi Peralatan Komunitas

> **"Access Over Ownership. Community Over Consumption."**
> Platform berbagi barang berbasis komunitas yang memungkinkan warga saling meminjam peralatan secara mudah, aman, dan berkelanjutan.

---

## 1. Deskripsi Project

**Pinjemin** adalah platform peer-to-peer community sharing tool yang dirancang untuk mengurangi konsumsi berlebihan dengan memfasilitasi peminjaman barang antar anggota komunitas (tetangga, rekan kerja, teman). Alih-alih membeli barang yang hanya dipakai sekali, pengguna bisa meminjam dari orang-orang di sekitarnya.

### Tujuan Utama
- **Ekonomis**: Menghemat biaya pembelian barang sekali pakai
- **Lingkungan**: Mengurangi produksi barang baru → menghemat emisi CO₂
- **Sosial**: Mempererat hubungan antar anggota komunitas melalui kepercayaan (Trust System)

---

## 2. Tech Stack

### Backend
| Komponen | Teknologi |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js 4.18 |
| Database | PostgreSQL (NeonDB cloud) |
| ORM | Prisma 5.10 |
| Autentikasi | JWT (jsonwebtoken) + bcrypt |
| Real-time | Socket.io 4.7 |
| Upload Gambar | Multer + Cloudinary |
| Validasi | Joi 17 |
| Logging | Morgan + Winston |
| Rate Limiting | express-rate-limit |
| Cache | Redis (opsional) |
| Containerisasi | Docker + docker-compose |

### Frontend
| Komponen | Teknologi |
|---|---|
| Struktur | HTML5 Semantik |
| Logika | Vanilla JavaScript (ES Modules) |
| Styling | Vanilla CSS (Design Token System) |
| Ikon | Lucide Icons 0.469 |
| Real-time | Socket.io Client (CDN) |
| API | Fetch API dengan deduplication |

---

## 3. Struktur Folder

```
Pinjemin - Community Sharing Tools Platform/
├── pinjemin-backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Skema database (5 model utama)
│   │   ├── seed.js              # Data awal untuk development
│   │   └── migrations/          # Riwayat migrasi database
│   ├── src/
│   │   ├── app.js               # Express app setup, middleware, route mounting
│   │   ├── server.js            # HTTP server + Socket.io init + DB warm-up
│   │   ├── config/
│   │   │   ├── prisma.js        # Singleton Prisma client
│   │   │   └── socket.js        # Socket.io initialization & getter
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       # Register, Login, GetMe
│   │   │   ├── items.controller.js      # CRUD barang
│   │   │   ├── requests.controller.js   # Alur peminjaman
│   │   │   ├── users.controller.js      # Profil, impact, leaderboard
│   │   │   ├── ratings.controller.js    # Submit review + update trust score
│   │   │   └── notifications.controller.js  # Notifikasi
│   │   ├── middleware/
│   │   │   ├── auth.js          # mockAuth: JWT atau x-user-id header
│   │   │   ├── jwtAuth.js       # Strict JWT-only middleware
│   │   │   └── errorHandler.js  # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── items.routes.js
│   │   │   ├── requests.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── ratings.routes.js
│   │   │   └── notifications.routes.js
│   │   ├── services/            # (kosong, siap untuk service layer)
│   │   └── validators/          # (siap untuk Joi validators)
│   ├── .env.example             # Template variabel lingkungan
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
└── pinjemin-frontend/
    ├── index.html               # Landing page
    ├── css/
    │   ├── reset.css            # CSS Reset
    │   ├── tokens.css           # Design tokens (warna, spacing, tipografi)
    │   ├── base.css             # Style dasar global
    │   ├── layout.css           # Grid, container, app-shell layout
    │   └── components/
    │       ├── buttons.css
    │       ├── badges.css
    │       ├── cards.css
    │       ├── navbar.css
    │       ├── sidebar.css
    │       ├── bottomnav.css
    │       ├── item-card.css
    │       ├── forms.css
    │       ├── modals.css
    │       ├── toasts.css
    │       ├── avatars.css
    │       ├── rating-stars.css
    │       ├── request-card.css
    │       └── trust-score.css
    ├── js/
    │   ├── config.js            # API base URL, daftar kategori & kondisi
    │   ├── api.js               # Fetch wrapper dengan auth header & deduplication
    │   ├── auth.js              # JWT storage, isLoggedIn, requireLogin, logout
    │   ├── layout.js            # Render sidebar + bottom nav (app shell)
    │   ├── state.js             # Shared state management
    │   ├── utils.js             # Helper: formatIDR, formatDate, getInitials, dll.
    │   ├── mock.js              # Data mock untuk development offline
    │   ├── toast.js             # Toast notification UI
    │   └── pages/
    │       └── landing.js       # Logika landing page (scroll animations, counters)
    └── pages/
        ├── login.html           # Halaman login
        ├── register.html        # Halaman registrasi
        ├── dashboard.html       # Beranda pengguna
        ├── discover.html        # Jelajahi & cari barang
        ├── item-new.html        # Form tambah barang (multi-step)
        ├── item-detail.html     # Detail barang + form pinjam
        ├── requests.html        # Permintaan yang dikirim pengguna
        ├── approvals.html       # Permintaan masuk (lender view)
        ├── borrows-active.html  # Peminjaman aktif
        ├── rate-review.html     # Form rating & ulasan
        ├── profile.html         # Profil & edit akun
        └── notifications.html  # Semua notifikasi
```

---

## 4. Fitur yang Sudah Diimplementasikan

### Autentikasi & Akun
- Registrasi dengan nama, username (alphanumeric + underscore, 3–20 karakter), password (min. 6 karakter)
- Login berbasis username → issue JWT (expires 7 hari)
- Endpoint `GET /v1/auth/me` untuk verifikasi sesi aktif
- Session management di frontend via `localStorage` (`pinjemin_token`, `pinjemin_user`)
- Route guard `requireLogin()` yang redirect ke login.html jika belum login
- Logout dengan clear session

### Manajemen Barang (Items)
- Tambah barang baru dengan form multi-step (judul, kategori, kondisi, deposit, lokasi, foto)
- Jelajahi barang dengan filter kategori dan pencarian teks
- Halaman detail barang: foto, deskripsi, kondisi, panduan penggunaan, profil pemilik
- Update dan hapus barang (hanya pemilik)
- Auto-increment view count saat barang dilihat (fire-and-forget)
- Status ketersediaan (tersedia / sedang dipinjam)

### Sistem Peminjaman (Requests)
- Ajukan permintaan pinjam: pilih tanggal, tulis tujuan & pesan
- Validasi: tidak bisa meminjam barang sendiri, barang harus tersedia
- Status lifecycle: `PENDING → APPROVED → RETURNED` atau `PENDING → REJECTED` / `PENDING → CANCELLED`
- Lender bisa approve/reject; borrower bisa cancel
- Item otomatis berubah status `isAvailable` saat approved/returned/rejected

### Trust System
- Setiap pengguna punya **Trust Score** (0–100) dan **Trust Level**:
  - 🔘 **NEW** (0–39): pengguna baru
  - 🔵 **MEMBER** (40–59): mulai aktif
  - 🟢 **TRUSTED** (60–84): terpercaya
  - 💜 **VERIFIED** (85–100): terverifikasi
- Skor berubah berdasarkan rating yang diterima: +2 (⭐⭐⭐⭐⭐), +1 (⭐⭐⭐⭐), -1 (⭐⭐⭐), -5 (⭐/⭐⭐)
- Ditampilkan di sidebar, profil, dan kartu item

### Rating & Review
- Borrower dapat memberikan rating (1–5 bintang) ke lender setelah barang dikembalikan
- Opsional: rating kondisi barang dan komentar
- Trust score lender diperbarui otomatis setelah rating diterima

### Notifikasi Real-time
- Notifikasi dikirim melalui Socket.io saat:
  - Ada permintaan pinjam masuk (`BORROW_REQUEST_RECEIVED`)
  - Permintaan disetujui (`BORROW_REQUEST_APPROVED`)
  - Permintaan ditolak (`BORROW_REQUEST_REJECTED`)
  - Barang dikembalikan (`ITEM_RETURNED`)
  - Trust score berubah (`TRUST_SCORE_CHANGED`)
- Badge notifikasi di sidebar dan bottom nav diperbarui real-time
- Toast notification muncul saat notifikasi baru diterima

### Dashboard
- Greeting personal + lokasi pengguna
- Quick stats: dipinjam aktif, perlu persetujuan, trust score
- Grid barang tersedia dengan filter kategori
- Activity feed (notifikasi terbaru)
- Leaderboard Top 3 Peminjam
- Panel dampak lingkungan: CO₂ dihemat, uang dihemat, pinjaman selesai

### Dampak Lingkungan (Impact)
- Kalkulasi otomatis per pengguna: `successfulReturns × 4 kg CO₂`, `successfulReturns × Rp83.333`
- Ditampilkan di dashboard dan profil

---

## 5. Alur Kerja Sistem (User Flow)

```
[1] LANDING PAGE
    ↓ (Mulai Sekarang)
[2] REGISTER / LOGIN
    ↓ (JWT disimpan di localStorage)
[3] DASHBOARD
    ├── Lihat barang tersedia di sekitar
    ├── Filter per kategori
    └── Klik barang → ITEM DETAIL
            ↓ (Ajukan Pinjaman)
[4] FORM PINJAM (di item-detail.html)
    → POST /v1/requests
    → Notifikasi dikirim ke Lender (Socket.io)
            ↓
[5] LENDER: APPROVALS PAGE
    ├── APPROVE → Item jadi tidak tersedia → Notifikasi ke Borrower
    └── REJECT  → Item tetap tersedia → Notifikasi ke Borrower
            ↓ (Jika APPROVED)
[6] BORROWER: BORROWS ACTIVE PAGE
    → PUT /v1/requests/:id/status {status: "RETURNED"}
    → Item jadi tersedia kembali
    → Notifikasi ke Lender
            ↓
[7] RATE & REVIEW PAGE
    → POST /v1/ratings
    → Trust Score Lender diperbarui
    → Notifikasi Trust Score ke Lender

[LENDER FLOW]
[3] DASHBOARD
    └── Tambah Barang → ITEM NEW (multi-step form)
        → POST /v1/items
        ↓
    → Terima permintaan di APPROVALS PAGE
    → Kelola di BORROWS ACTIVE PAGE
```

---

## 6. Arsitektur Sistem

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND (Browser)              │
│  HTML + Vanilla JS + CSS                         │
│                                                  │
│  js/auth.js ──── localStorage (JWT + user)       │
│  js/api.js  ──── fetch() + Authorization header  │
│  js/layout.js ── App Shell (sidebar + bottomnav) │
└───────────────┬─────────────────────┬────────────┘
                │ REST API (HTTP)      │ WebSocket
                │ http://localhost:3000/v1           
                ▼                     ▼            
┌─────────────────────────────────────────────────┐
│              BACKEND (Node.js / Express)         │
│                                                  │
│  src/app.js                                      │
│  ├── CORS, morgan, rate-limit                    │
│  ├── /v1/auth  ← jwtAuth middleware              │
│  └── /v1/*     ← mockAuth middleware             │
│       (supports JWT Bearer OR x-user-id header)  │
│                                                  │
│  Controllers → Prisma ORM → PostgreSQL (NeonDB)  │
│  Socket.io → real-time notifications             │
└───────────────┬─────────────────────────────────┘
                │ Prisma Client
                ▼
┌─────────────────────────────────────────────────┐
│           DATABASE (PostgreSQL / NeonDB)         │
│   User, Item, Request, Review, Notification      │
└─────────────────────────────────────────────────┘
```

### Komunikasi Frontend ↔ Backend
1. **REST API**: Semua operasi CRUD via `fetchAPI()` di `js/api.js`
2. **Header Auth**: JWT Bearer token (login penuh) atau `x-user-id` (dev/mock)
3. **In-flight Deduplication**: GET request yang identik dan concurrent di-deduplikasi di frontend (Map `_inflight`) dan backend (Map `authPromises`)
4. **WebSocket**: Socket.io untuk push notification real-time; client bergabung ke room berdasarkan user ID

---

## 7. Schema Database

### Model User
```
User {
  id                String   @id (UUID)
  username          String   @unique
  fullName          String
  email             String?  @unique
  passwordHash      String?  (bcrypt)
  phone             String   @unique
  avatarUrl         String?
  bio               String?
  trustScore        Int      default(40)
  trustLevel        String   default("NEW") // NEW|MEMBER|TRUSTED|VERIFIED
  totalLends        Int      default(0)
  totalBorrows      Int      default(0)
  successfulReturns Int      default(0)
  neighborhood      String?
  address           String?
  role              String   default("user") // user|admin
  createdAt         DateTime
  updatedAt         DateTime
}
```

### Model Item
```
Item {
  id              String   @id (UUID)
  title           String
  description     String
  category        String   // TOOLS|ELECTRONICS|SPORTS|KITCHEN|GARDEN|VEHICLE|BABY_KIDS|BOOKS_MEDIA|FASHION|OUTDOOR|OTHER
  condition       String   // EXCELLENT|GOOD|FAIR|NEEDS_CARE
  images          String   // JSON array string ["url1","url2"]
  depositAmount   Int      default(0)
  isAvailable     Boolean  default(true)
  viewCount       Int      default(0)
  neighborhood    String
  distance        Float?
  tags            String   // comma-separated
  usageGuidelines String?
  ownerId         String   → User
}
```

### Model Request
```
Request {
  id           String   @id (UUID)
  status       String   // PENDING|APPROVED|REJECTED|ACTIVE|RETURNED|OVERDUE|CANCELLED
  purpose      String
  message      String?
  startDate    DateTime
  endDate      DateTime
  rejectReason String?
  itemId       String   → Item
  borrowerId   String   → User
  lenderId     String   → User
}
```

### Model Review
```
Review {
  id       String  @id (UUID)
  rating   Int     // 1-5
  itemCond Int?    // 1-5 (kondisi barang saat dikembalikan)
  comment  String?
  authorId String  → User
  targetId String  → User
  itemId   String? → Item
}
```

### Model Notification
```
Notification {
  id        String   @id (UUID)
  type      String   // BORROW_REQUEST_RECEIVED|BORROW_REQUEST_APPROVED|...
  title     String
  body      String
  isRead    Boolean  default(false)
  data      String?  // JSON string (misal: {requestId})
  userId    String   → User
}
```

---

## 8. Cara Instalasi & Menjalankan

### Prasyarat
- Node.js v20+
- npm
- PostgreSQL (atau akun NeonDB)
- Redis (opsional)

### Backend

```bash
cd pinjemin-backend

# 1. Install dependencies
npm install

# 2. Salin dan isi variabel lingkungan
cp .env.example .env
# Edit .env: isi DATABASE_URL, DIRECT_URL, JWT_SECRET

# 3. Generate Prisma client
npm run db:generate

# 4. Jalankan migrasi database
npm run db:migrate

# 5. (Opsional) Seed data awal
npm run db:seed

# 6. Jalankan server development
npm run dev
# Server berjalan di http://localhost:3000
```

### Frontend

```bash
cd pinjemin-frontend

# Tidak perlu build tool — buka langsung dengan Live Server
# Rekomendasi: VS Code extension "Live Server"
# Klik kanan index.html → "Open with Live Server"
# Frontend berjalan di http://localhost:5500
```

### Menggunakan Docker

```bash
cd pinjemin-backend
docker-compose up --build
```

### Variabel Lingkungan (`.env`)

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5500

# Database (NeonDB / PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@host-direct/dbname?sslmode=require

# Redis (opsional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRES_IN=7d

# Cloudinary (untuk upload gambar)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Perintah Database

```bash
npm run db:generate  # Generate Prisma client setelah schema berubah
npm run db:migrate   # Jalankan migrasi ke database
npm run db:seed      # Isi data awal (seed users, items, requests)
npm run db:studio    # Buka Prisma Studio (GUI database)
```

---

## 9. API Endpoints

Base URL: `http://localhost:3000/v1`

### Auth (tidak butuh token)
| Method | Endpoint | Deskripsi | Body |
|---|---|---|---|
| POST | `/auth/register` | Daftar akun baru | `{nama, username, password}` |
| POST | `/auth/login` | Login → dapat JWT | `{username, password}` |
| GET | `/auth/me` | Info user aktif | — (Bearer token) |

### Users (butuh auth)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/users/me` | Profil user aktif |
| PUT | `/users/me` | Update profil (fullName, bio, address) |
| GET | `/users/me/impact` | Dampak lingkungan user |
| GET | `/users/top` | Top 3 lender (by totalLends) |
| GET | `/users/:id` | Profil user by ID (beserta items) |

### Items
| Method | Endpoint | Deskripsi | Query |
|---|---|---|---|
| GET | `/items` | Semua barang | `?category=&condition=&search=` |
| GET | `/items/:id` | Detail barang (+ increment viewCount) | — |
| POST | `/items` | Tambah barang baru | `{title, description, category, condition, ...}` |
| PUT | `/items/:id` | Update barang (hanya owner) | fields yang diubah |
| DELETE | `/items/:id` | Hapus barang (hanya owner) | — |

### Requests (Peminjaman)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/requests/sent` | Permintaan yang dikirim user (sebagai borrower) |
| GET | `/requests/received` | Permintaan yang diterima user (sebagai lender) |
| POST | `/requests` | Buat permintaan pinjam |
| PUT | `/requests/:id/status` | Update status: `{status, rejectReason?}` |

Status yang valid: `APPROVED`, `REJECTED`, `CANCELLED`, `RETURNED`

### Ratings
| Method | Endpoint | Deskripsi | Body |
|---|---|---|---|
| POST | `/ratings` | Submit rating setelah peminjaman selesai | `{requestId, rating, itemCond?, comment?}` |

### Notifications
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/notifications` | Semua notifikasi user aktif |
| PUT | `/notifications/read-all` | Tandai semua notifikasi sebagai dibaca |

### Utilitas
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/` | Info server |
| GET | `/health` | Health check → `{status: "ok"}` |

---

## 10. Deskripsi Halaman Frontend

### `index.html` — Landing Page
- Hero section dengan tagline dan mockup phone animasi
- Section "Cara Kerja" (3 langkah)
- Grid kategori barang (11 kategori)
- Trust System explanation dengan animated trust meter
- Impact counters (pinjaman, CO₂, penghematan, komunitas)
- Testimonial komunitas
- CTA banner + footer

### `pages/login.html` — Login
- Form username + password
- Link ke register
- Setelah login: JWT & user disimpan ke localStorage, redirect ke dashboard

### `pages/register.html` — Registrasi
- Form nama lengkap, username, password
- Validasi format username real-time
- Setelah sukses: redirect ke login

### `pages/dashboard.html` — Beranda
- Greeting personal dengan nama & lokasi
- Quick stats: peminjaman aktif, menunggu persetujuan, trust score
- Grid barang tersedia dengan filter kategori chips
- Activity feed (3 notifikasi terbaru)
- Sidebar: Top Lenders leaderboard + panel dampak lingkungan

### `pages/discover.html` — Jelajahi Barang
- Search bar + filter kategori + filter kondisi
- Grid semua barang dari database
- Mendukung query parameter `?category=` dari landing page

### `pages/item-new.html` — Tambah Barang (Multi-step)
- Step 1: Informasi dasar (judul, kategori, kondisi)
- Step 2: Deskripsi & panduan penggunaan
- Step 3: Upload foto
- Step 4: Lokasi & deposit
- Preview sebelum submit

### `pages/item-detail.html` — Detail Barang
- Galeri foto barang
- Informasi lengkap: judul, kategori, kondisi, deskripsi, tags, panduan
- Profil pemilik dengan trust score
- Form ajukan pinjaman: tanggal mulai & selesai, tujuan, pesan

### `pages/approvals.html` — Persetujuan (Lender)
- Daftar permintaan masuk dengan status PENDING
- Tombol Approve / Reject per permintaan
- Info borrower: nama, trust score

### `pages/requests.html` — Permintaanku (Borrower)
- Riwayat semua permintaan yang pernah dikirim
- Status badge per permintaan
- Tombol Cancel untuk permintaan PENDING

### `pages/borrows-active.html` — Dipinjam Aktif
- Daftar peminjaman yang sedang berjalan (status APPROVED)
- Tombol "Kembalikan" untuk update status ke RETURNED

### `pages/rate-review.html` — Rating & Ulasan
- Form rating bintang (1–5)
- Rating kondisi barang saat kembali
- Kolom komentar opsional

### `pages/profile.html` — Profil
- Info lengkap pengguna: nama, username, bio, lokasi
- Edit profil (username dikunci, tidak bisa diubah sembarangan)
- Statistik: total pinjam, total lend, successful returns
- Trust score dengan visual meter

### `pages/notifications.html` — Notifikasi
- Daftar semua notifikasi dengan timestamp
- Tombol "Tandai Semua Dibaca"
- Badge unread count di sidebar & bottom nav

---

## 11. Catatan Teknis

### Middleware Auth (Dual Mode)
Backend mendukung dua mode autentikasi secara bersamaan:
1. **JWT Bearer Token** (produksi): dikirim via header `Authorization: Bearer <token>`
2. **x-user-id Header** (development/mock): header `x-user-id: user-001`

Mode JWT akan selalu diprioritaskan jika tersedia.

### In-memory User Cache
Auth middleware menggunakan cache 30 detik (`global.__authUserCache`) dan deduplication in-flight (`global.__authPromises`) untuk menghindari round-trip database berulang pada setiap request.

### Database Warm-up
Server melakukan satu query sederhana ke database saat startup (`prisma.user.findFirst()`) sebelum mulai menerima koneksi, untuk menghilangkan cold-start latency pada request pertama.

### Real-time dengan Socket.io
Setiap user bergabung ke room Socket.io berdasarkan user ID mereka. Notifikasi dikirim langsung ke room target user, bukan broadcast ke semua client.

---

## 12. Kredit & Lisensi

© 2026 Pinjemin. Dibuat dengan 💚 untuk komunitas Indonesia.  
*Stop buying, start Pinjemin.*
