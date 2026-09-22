# Antriku — Sistem Antrian Layanan Publik

Sistem antrian untuk kantor layanan publik: warga ambil nomor, petugas memanggil
dari meja (loket), dan **layar TV di ruang tunggu ikut berubah sendiri** tanpa
ada yang menekan refresh.

Proyek ini dibangun sebagai latihan ke-3 dari jalur belajar fullstack, setelah
**Batikku** (katalog + dashboard) dan **Desaku** (multi-tenant + penomoran surat).

## Kenapa proyek ini

Dari audit portofolio sebelumnya, ada tiga hal yang **belum pernah** disentuh:

| Kemampuan | Batikku | Desaku | Antriku |
|---|---|---|---|
| Data berubah sendiri di layar lain | — | — | **ya** |
| Penomoran aman dari tabrakan (race) | — | sebagian | **ya** |
| Aturan bisnis diuji tanpa browser | — | ya | **ya** |

Antriku menjawab ketiganya.

## Yang bisa dicoba

| Peran | Alamat | Masuk |
|---|---|---|
| Warga | `/` | tidak perlu masuk |
| Layar ruang tunggu | `/display` | tidak perlu masuk |
| Petugas | `/loket` | `loket1@antriku.test` / `loket2@antriku.test` |
| Admin | `/admin` | `admin@antriku.test` |

Kata sandi akun uji ada di `prisma/seed.ts`. Semua akun uji ini **hanya untuk
pengembangan**; jangan dipakai di server yang bisa diakses publik.

## Cara menjalankan

```bash
npm install
cp .env.example .env          # isi DATABASE_URL dan SESSION_SECRET
npx prisma db push
npx prisma db seed
npm run dev                   # http://127.0.0.1:3002
```

## Aturan yang ditegakkan server

Bukan disembunyikan di tampilan — server yang menolak.

- **Nomor tidak pernah kembar.** Penerbitan nomor berjalan di dalam satu
  transaksi dengan `SELECT … FOR UPDATE` pada baris layanan. Dua orang yang
  menekan tombol pada milidetik yang sama tetap dapat dua nomor berbeda.
- **Warga prioritas tidak menyerobot.** Aturan: nomor biasa dipanggil setelah
  **dua nomor biasa dilayani untuk setiap satu nomor prioritas**. Keadaan nol
  (belum ada yang dilayani) diperlakukan khusus — kalau tidak, prioritas akan
  menyerobot di panggilan pertama.
- **Loket yang dijaga disimpan di database, bukan di cookie.** Cookie bisa
  dipalsukan. Meja yang sedang dijaga harus tercatat di server.
- **Petugas hanya bisa mengendalikan loket yang sedang ia buka.** Mengirim
  `loketId` milik orang lain lewat form ditolak: *"Kamu hanya bisa
  mengendalikan loket yang sedang kamu buka."*
- **Satu loket tidak bisa dibuka dua petugas.** Yang kedua mendapat pesan
  siapa yang sedang memegangnya.

## Cara kerja layar ruang tunggu

`/display` mengambil data dari `/api/display` setiap 2 detik (bukan Server
Action — layar ini hanya membaca, tidak pernah menulis). Setiap kali ada nomor
yang dipanggil, kartunya **berkedip 2,6 detik** supaya mata orang di ruang
tunggu tertuju ke sana.

Catatan jujur soal pengujian: pada tab yang tidak terlihat, Chrome menahan
`setInterval`, jadi layar akan tampak "tertinggal". Begitu tabnya dibuka,
layar langsung mengejar keadaan terbaru. Ini perilaku browser, bukan bug
aplikasi.

## Menguji aturan tanpa browser

```bash
npx tsx --env-file=.env scripts/uji-antrian.ts
```

22 pemeriksaan: nomor tidak kembar pada 12 permintaan bersamaan, urutan
prioritas, keadaan nol, dan bentuk data untuk layar display.

`--env-file=.env` wajib — `tsx` tidak memuat `.env` sendiri, hanya Prisma CLI
yang memuatnya.

## Tampilan: foto nyata, bukan ilustrasi

Versi pertama halaman publiknya diukur dan hasilnya: 85 elemen, 788 karakter,
**nol gambar dan nol ikon** — seluruh halaman hanya teks. Itu penyebabnya
terasa murah, bukan pilihan warnanya.

Sekarang halaman itu memakai foto sungguhan dan ikon SVG satu gaya.

**Foto** diambil dari Wikimedia Commons, hanya yang lisensinya jelas
(CC0 / CC BY / CC BY-SA). Pemilihannya dilakukan dengan angka, bukan selera —
karena foto tidak bisa dilihat langsung di lingkungan pengembangan ini:

| Diukur | Ditolak | Dipakai |
|---|---|---|
| Kecerahan 0–255 | Warteschlange Baumarkt (46 — gelap) | Admin Reception (153) |
| Saturasi | Waiting room chair glass brick (0.0 — hitam-putih) | Reception panoramio (paling berwarna) |
| Dimensi | Long line exchange money (1024×681 — kecil) | sisanya ≥1920 px |

Satu aturan lagi: **judul berkas aslinya harus menyebutkan subjek fotonya**.
Berkas bernama `IMG_2043.jpg` tidak dipakai — tanpa bisa melihatnya, tidak ada
cara memastikan isinya, dan memakainya berarti menebak.

Semua kredit dan lisensi ada di `lib/foto.ts` sebagai data, dan halaman kredit
di situs dibangun dari data itu — jadi mustahil ada foto terpakai tanpa
kreditnya. Tidak ada satu pun gambar buatan AI di proyek ini.

**Ikon** digambar sebagai SVG (`app/components/Ikon.tsx`), bukan emoji. Emoji
dirender berbeda oleh tiap sistem operasi dan tidak bisa diberi warna merek.

**Kontras di atas foto** dihitung, bukan dikira-kira. Dua cacat ditemukan dan
diperbaiki:

- Foto hero punya piksel putih penuh (255) tepat di zona tempat teks duduk.
  Pada alpha 0.38, putih di atasnya hanya mencapai **2.5:1** — di bawah ambang
  WCAG AA. Selubung gradien dinaikkan ke 0.93/0.78/0.62 → **6.6:1**.
- Foto latar halaman masuk pada opacity 0.32 membuat teks keterangan mencapai
  **4.25:1**. Diturunkan ke 0.22 → **6.17:1**.

### Foto dan git

Foto master (JPG resolusi penuh, 5.1 MB) **tidak** masuk git — `assets/img/`
ada di `.gitignore`. Yang masuk git hanya hasil olahannya di `public/img/`
(WebP, 2.0 MB), supaya `git clone` + `npm run build` langsung jalan tanpa
langkah manual.

```bash
node scripts/siapkan-gambar.mjs   # assets/img/*.jpg → public/img/*.webp
```

Ukuran WebP ditentukan dari pengukuran: `quality 74` memangkas ~12% berat
dengan mutu yang masih baik, dan hero dibatasi 1400 px (dari 2.53 MB menjadi
2.0 MB untuk seluruh `public/img`).

## Tumpukan

Next.js 15 (App Router, Server Actions) · Prisma 7.10.0 · PostgreSQL 16 ·
TypeScript. Tanpa pustaka antrian/WebSocket: polling 2 detik sudah cukup untuk
ruang tunggu, dan jauh lebih sederhana untuk dirawat.

## Catatan teknis yang mahal dipelajari

- `type Tx = Prisma.TransactionClient` — jangan diturunkan sendiri dari
  `Parameters<...>`. Di Prisma 7 hasilnya `never`, dan galatnya **baru muncul
  saat build**, bukan saat menulis.
- Cookie `secure` diukur dari header `X-Forwarded-Proto`, bukan `NODE_ENV`.
  Di balik nginx, `NODE_ENV=production` dengan HTTP tetap membuat cookie tidak
  pernah terkirim.
- `updateMany({ data: { id: undefined } })` **tidak mengirim SQL apa pun** —
  jadi tidak mengunci baris. Penguncian harus lewat `SELECT … FOR UPDATE`.
