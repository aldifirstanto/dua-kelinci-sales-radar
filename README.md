# Radar Penjualan Area — PT Dua Kelinci

Aplikasi web berbahasa Indonesia yang dirancang untuk **Area Sales Manager (ASM) PT Dua Kelinci** agar dapat memantau performa penjualan per region dan brand, mengidentifikasi **5 outlet terlemah**, dan langsung menyalin **ringkasan satu paragraf siap kirim ke Telegram**.

Dibangun sebagai jawaban **Build Test — AI Builder (Vibe Coder) PT Dua Kelinci**.

## Fitur Utama

1. **Penjualan per Region / Cabang & Brand**
   - Grafik perbandingan Net Sales September vs Oktober 2026 lengkap dengan toggle **Region (6)** vs **Cabang (13)** beserta kontribusi (%) dan pertumbuhan MoM.
   - Grafik performa 8 brand (Kacang Dua Kelinci, Tos Tos, Sukro, Tic Tac, Deka, Pilus, Usagi, Roni) berdasarkan Net Sales dan volume karton.
   - Matriks heatmap **Region × Brand** dan **Cabang × Brand** interaktif; klik nama region atau cabang untuk langsung memfilter seluruh dashboard ke wilayah tersebut.
2. **5 Outlet Terlemah & Rekomendasi Tindak Lanjut**
   - Menandai 5 outlet dengan Net Sales terendah secara akurat berdasarkan `outlet_id` unik (mencegah tabrakan nama outlet yang sama di kota berbeda, seperti *Toko Sinar Abadi* Jakarta Barat `OUT1003` vs Medan `OUT1040`).
   - Menampilkan salesman PIC, cabang, tren Sep → Okt, frekuensi invoice, tanggal order terakhir, diagnosis kelemahan, dan saran tindak lanjut lapangan.
   - Dilengkapi tab sekunder **Penurunan Terbesar (MoM)** agar ASM juga cepat menangkap outlet besar yang omzetnya anjlok di Oktober.
3. **Ringkasan 1 Paragraf Siap Kirim ke Telegram**
   - Menghasilkan satu paragraf ringkas dalam Bahasa Indonesia yang dinamis mengikuti filter Region, Periode, atau Tipe Outlet yang dipilih ASM.
   - Dilengkapi tombol **Salin Teks Telegram** dan tautan **Buka Telegram** tanpa perlu API key tambahan.
4. **Pembersihan & Audit Data ERP (QAD) Otomatis**
   - Secara otomatis mendeteksi dan memperbaiki anomali pada `sales.csv` (1.891 baris mentah → 1.888 baris valid):
     - Menghapus **3 baris duplikat persis** (`INV500201`, `INV500386`, `INV500791`).
     - Menormalisasi **10 baris** dengan **4 variasi penulisan region** (`JABODETABEK`, `JAWA BARAT`, `Jabar`, `JAWA TIMUR`) ke 6 region standar.
     - Membersihkan **4 spasi berlebih** pada nama outlet.
     - Melengkapi **5 baris tanpa nama salesman** dari riwayat PIC outlet terkait.
     - Mempertahankan **1 transaksi retur** (`RTR900001`, -Rp 528.000) agar Net Sales tetap akurat sesuai pembukuan.
   - Mendukung fitur **Unggah CSV Baru** untuk langsung menganalisis export penjualan periode berikutnya di browser.
5. **Filter Multi-Select Lengkap & Mode Gelap (Dark Mode)**
   - Slicer multi-select di bagian atas untuk **Region**, **Periode**, **Tipe Outlet**, **Brand**, dan **SKU** (dengan kolom pencarian di slicer SKU dan relasi cascading dari Brand).
   - Tombol **Mode Gelap / Mode Terang** di header yang tersimpan otomatis di browser (`localStorage`).

## Cara Menjalankan di Komputer Lokal (How to Run)

### Prasyarat
- Node.js v18+ (disarankan v20 atau lebih baru) dan `npm`.

### Langkah Menjalankan
```bash
# 1. Masuk ke folder proyek
cd dua-kelinci-sales-radar

# 2. Install dependensi
npm install

# 3. Jalankan aplikasi (mode development)
npm run dev
```

Buka alamat yang muncul di terminal (biasanya `http://localhost:5173`). File `public/sales.csv` otomatis termuat saat aplikasi dibuka.

### Menjalankan Unit Test & Production Build
```bash
# Jalankan pengujian pembersihan data, agregasi, dan ringkasan Telegram
npm test

# Build versi produksi
npm run build
npm run preview
```

## Struktur Proyek

```text
dua-kelinci-sales-radar/
├── public/
│   └── sales.csv                      # Contoh data penjualan Sep–Okt 2026 (1.891 baris)
├── src/
│   ├── components/
│   │   ├── DataQualityDrawer.tsx      # Panel audit & pembersihan data ERP
│   │   ├── RegionBrandCharts.tsx      # Grafik Region, Brand, dan Matriks Heatmap
│   │   ├── TelegramDigestCard.tsx     # Ringkasan 1 paragraf + tombol salin Telegram
│   │   └── WeakestOutletsSection.tsx  # Tabel 5 Outlet Terlemah & Penurunan MoM
│   ├── lib/
│   │   ├── format.ts                  # Formatter Rupiah, angka, persen, tanggal (id-ID)
│   │   ├── salesAnalytics.ts          # Parser CSV, cleaning, agregasi, generator Telegram
│   │   └── salesAnalytics.test.ts     # Unit test (Vitest) pada data sales.csv
│   ├── types/
│   │   └── sales.ts                   # Definisi tipe TypeScript
│   ├── App.tsx                        # Layout utama & state filter ASM
│   └── main.tsx
├── package.json
└── README.md
```
