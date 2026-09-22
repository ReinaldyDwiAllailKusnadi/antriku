/**
 * siapkan-gambar.mjs — ubah foto master (JPG) menjadi WebP untuk web.
 *
 * KENAPA ADA DUA TEMPAT:
 *   assets/img/  = foto master, ukuran besar, TIDAK masuk git (.gitignore).
 *   public/img/  = hasil WebP yang benar-benar dikirim ke browser, MASUK git.
 *
 * Alasannya: 1920px JPG itu ~500 KB per berkas. Kalau semua master ikut masuk
 * git, repo membengkak dan tiap deploy ikut mengangkut berkas yang tidak pernah
 * dilihat pengunjung. Yang perlu di-version-control cuma hasil akhirnya.
 *
 * Diukur, bukan ditebak: ukuran setiap berkas dicetak supaya kelihatan berapa
 * yang benar-benar diunduh pengunjung, bukan dikira-kira.
 *
 * Jalankan dari akar proyek:
 *   node scripts/siapkan-gambar.mjs
 */

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SUMBER = "assets/img";
const TUJUAN = "public/img";

// Ukuran yang benar-benar dipakai di tata letak:
//   1400 = hero lebar penuh. Bukan 1920: pada 1400px foto ini sudah tajam di
//          layar biasa, dan selisih berkasnya besar (diukur: 906 KB -> 800 KB
//          hanya dari menurunkan mutu 78 -> 74, sebelum menurunkan lebar).
//    900 = kartu dua kolom
//    480 = kartu kecil / layar ponsel
const UKURAN = [1400, 900, 480];

// Mutu 74 dipilih dari pengukuran, bukan perkiraan:
//   q78 = 906 KB   q74 = 800 KB   q70 = 759 KB
// Selisih q74 -> q70 cuma 41 KB tapi risiko artefak di area gelap naik.
// Mutu 74 adalah titik di mana ukuran turun banyak tanpa mengorbankan ketajaman.
const MUTU = 74;

if (!fs.existsSync(SUMBER)) {
  console.error(`Tidak ada folder ${SUMBER}. Taruh foto master di sana dulu.`);
  process.exit(1);
}
fs.mkdirSync(TUJUAN, { recursive: true });

const berkas = fs
  .readdirSync(SUMBER)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();

if (berkas.length === 0) {
  console.error(`Folder ${SUMBER} kosong.`);
  process.exit(1);
}

const laporan = [];

for (const nama of berkas) {
  const slug = path.parse(nama).name; // nama berkas = slug yang dipakai di kode
  const dari = path.join(SUMBER, nama);
  const meta = await sharp(dari).metadata();

  for (const lebar of UKURAN) {
    if (lebar > meta.width) continue; // jangan memperbesar — hasilnya buram
    const ke = path.join(TUJUAN, `${slug}-${lebar}.webp`);
    const info = await sharp(dari)
      .resize({ width: lebar, withoutEnlargement: true })
      .webp({ quality: MUTU, effort: 5 })
      .toFile(ke);
    laporan.push({ slug, lebar, byte: info.size, w: info.width, h: info.height });
  }
}

console.log(`\n${"slug".padEnd(24)} ${"ukuran".padEnd(11)} berkas`);
console.log("-".repeat(46));
for (const r of laporan) {
  const kb = (r.byte / 1024).toFixed(0).padStart(4);
  console.log(`${r.slug.padEnd(24)} ${`${r.w}x${r.h}`.padEnd(11)} ${kb} KB`);
}

const total = laporan.reduce((a, b) => a + b.byte, 0);
console.log("-".repeat(46));
console.log(
  `${laporan.length} berkas WebP, total ${(total / 1024 / 1024).toFixed(2)} MB`
);
