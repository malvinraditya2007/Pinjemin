# Pinjemin

> **Platform Web Komunitas Peminjaman Barang Peer-to-Peer Antar Tetangga.**
> Kurangi konsumsi berlebih, hemat biaya, dan bangun solidaritas lingkungan sekitar dengan saling meminjamkan barang yang jarang dipakai.

## Fitur Utama

- **Dashboard Interaktif**: Pantau metrik peminjaman, jumlah barang yang sedang dipinjam, permintaan yang perlu persetujuan, dan kalkulasi *Trust Score* secara *real-time*.
- **Tersedia di Sekitarmu**: Katalog pencarian barang berbasis jarak terdekat menggunakan *Haversine formula* dan filter kategori dinamis.
- **Peta Geolokasi Interaktif**: Integrasi *Leaflet.js* dan *OpenStreetMap* untuk penentuan titik lokasi (koordinat) pengguna melalui deteksi GPS *browser*.
- **Alur Persetujuan (Approval Workflow)**: Sistem manajemen peminjaman barang komprehensif (pengajuan, persetujuan, status aktif, dan pengembalian).
- **Sistem Reputasi (Trust Score)**: Pengguna dapat memberikan ulasan dan *rating* pasca-peminjaman untuk membangun kepercayaan komunitas.

##  Tech Stack

| Komponen | Teknologi |
| :--- | :--- |
| **Frontend** | HTML5 Semantik, CSS3 (Vanilla CSS), JavaScript (Vanilla JS), Leaflet.js |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (di-hosting via NeonDB), Prisma ORM |
| **Keamanan & Auth** | JSON Web Token (JWT), `bcrypt`, `dotenv` untuk isolasi rahasia |

## Struktur Direktori

```text
pinjemin/
├── .github/                  # Konfigurasi CI/CD (GitHub Actions)
├── pinjemin-backend/         # Direktori Backend (Node.js & Express)
│   ├── prisma/               # Skema Database & Migrasi (schema.prisma, seed.js)
│   ├── src/                  # Source Code Backend
│   │   ├── config/           # Setup Socket.io & Koneksi DB
│   │   ├── controllers/      # Logika Request/Response HTTP
│   │   ├── middleware/       # Autentikasi JWT & Error Handler
│   │   ├── routes/           # Definisi Endpoint API
│   │   └── services/         # Business Logic & Interaksi Database
│   ├── .env.example          # Contoh variabel environment
│   └── package.json          # Dependensi Backend
├── pinjemin-frontend/        # Direktori Frontend (Statik HTML, CSS, JS)
│   ├── css/                  # Styling per komponen dan halaman
│   ├── js/                   # Logika antarmuka Vanilla JS
│   └── pages/                # File HTML untuk tiap tampilan aplikasi
├── .gitignore                # Aturan pengecualian file git
└── README.md                 # Dokumentasi proyek
```

## Panduan Memulai (Getting Started)

### Prasyarat Sistem
- **Node.js**: Versi v18 atau lebih baru.
- **Database**: PostgreSQL (lokal atau cloud).

### 1. Clone Repository
```bash
git clone https://github.com/malvinraditya2007/pinjemin.git
cd pinjemin
```

### 2. Setup Environment Variables
Buka terminal dan arahkan ke folder backend. Gandakan file contoh konfigurasi dan sesuaikan isinya.
```bash
cd pinjemin-backend
cp .env.example .env
```
Buka file `.env` dan isi kredensial *database* Anda (`DATABASE_URL`) serta kunci `JWT_SECRET`.

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Setup Database
Pastikan *database* PostgreSQL Anda menyala, kemudian jalankan sinkronisasi skema Prisma dan *seeder* awal:
```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

## 🏃‍♂️ Cara Menjalankan (Running the App)

### 1. Menyalakan Backend Server
Dari dalam folder `pinjemin-backend`, jalankan perintah *development server*:
```bash
npm run dev
```
Server akan berjalan di `http://localhost:3000`.

### 2. Menjalankan Frontend
Karena *frontend* menggunakan Vanilla JS / HTML murni, Anda cukup menggunakan ekstensi **Live Server** (di VS Code) pada folder `pinjemin-frontend/` dan membukanya di `http://127.0.0.1:5500`.

*Catatan: Pastikan `FRONTEND_URL` di `.env` disetel sesuai dengan port Live Server Anda agar konfigurasi CORS backend berjalan dengan benar.*

## Keamanan & Best Practices

- **Isolasi Rahasia (.env)**: Seluruh kredensial rahasia disimpan di dalam `.env` dan diabaikan secara global melalui `.gitignore`. Kami menerapkan sistem *fail-fast validation* sehingga server otomatis gagal berjalan jika variabel penting kosong.
- **Anti-Orphan Data**: Relasi *database* antar pengguna dan riwayat ulasan dilindungi agar jika sebuah akun dihapus, riwayat *trust score* dan ulasan tidak akan hilang.
- **Tanpa Technical Debt**: Folder `node_modules` backend dioptimalkan untuk membuang seluruh pustaka (library) berat yang tidak digunakan, mengurangi paparan kerentanan keamanan dan mempercepat *build CI/CD*.

---
*Dibuat dengan ❤️ untuk lingkungan bertetangga yang lebih baik.*
