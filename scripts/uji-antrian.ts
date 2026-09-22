// Uji aturan antrian — dijalankan langsung ke database, tanpa browser.
//
// Kenapa tanpa browser? Karena yang diuji di sini bukan tampilan, tapi
// aturan: apakah nomor bisa kembar, apakah prioritas menyerobot terus,
// apakah dua loket bisa memanggil orang yang sama. Semua itu bisa
// dibuktikan dengan angka, dan pembuktian lewat klik-klik di browser
// jauh lebih lemah — ia hanya menguji satu jalur, sekali.
//
// Jalankan: npx tsx scripts/uji-antrian.ts

import { prisma } from "../lib/prisma";
import {
  ambilNomor,
  panggilBerikutnya,
  mulaiLayani,
  selesaikan,
  lewati,
  dataDisplay,
  tanggalHariIni,
} from "../lib/antrian";

let lulus = 0;
let gagal = 0;

function cek(nama: string, benar: boolean, catatan = "") {
  if (benar) {
    lulus++;
    console.log(`  ✓ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
}

async function bersihkan() {
  const tanggal = tanggalHariIni();
  // Hanya hari ini yang dibersihkan supaya data seed hari lain tetap ada.
  await prisma.pemanggilan.deleteMany({
    where: { antrian: { tanggal } },
  });
  await prisma.antrian.deleteMany({ where: { tanggal } });
  await prisma.penghitungAntrian.deleteMany({ where: { tanggal } });
  await prisma.penanda.upsert({
    where: { id: "global" },
    create: { id: "global", versi: 1 },
    update: { versi: 1 },
  });
}

/**
 * Siapkan dua loket khusus uji pada satu layanan.
 *
 * Kenapa dibuat di sini dan bukan mengandalkan seed? Karena uji "dua loket
 * tidak boleh memanggil orang yang sama" hanya bermakna kalau dua loket itu
 * benar-benar melayani layanan yang SAMA. Kalau menumpang loket seed, uji
 * ini akan lulus atau gagal tergantung isi seed — bukan tergantung kode.
 */
async function siapkanLoketUji(layananId: string) {
  const nama = ["Uji Loket A", "Uji Loket B"];
  const hasil = [];
  for (const n of nama) {
    hasil.push(
      await prisma.loket.upsert({
        where: { nama: n },
        create: { nama: n, layananId, aktif: true },
        update: { layananId, aktif: true },
      }),
    );
  }
  return hasil;
}

async function hapusLoketUji() {
  // Loket uji tidak boleh tertinggal: kalau tertinggal, ia muncul di
  // halaman pemilihan loket dan membuat petugas bingung.
  await prisma.loket.deleteMany({
    where: { nama: { in: ["Uji Loket A", "Uji Loket B"] } },
  });
}

async function main() {
  console.log("Uji aturan antrian\n");
  await bersihkan();

  const layanan = await prisma.layanan.findFirst({
    where: { aktif: true },
    orderBy: { urutan: "asc" },
  });
  if (!layanan) throw new Error("Tidak ada layanan aktif. Jalankan seed dulu.");

  const loket = await siapkanLoketUji(layanan.id);
  const petugas = await prisma.petugas.findFirst({ where: { aktif: true } });
  if (!petugas) throw new Error("Tidak ada petugas aktif.");

  // ---------------------------------------------------------------
  console.log("1. Penomoran");
  // ---------------------------------------------------------------

  const nomor = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      ambilNomor(layanan.id, "biasa", `Uji ${i + 1}`),
    ),
  );
  const kode = nomor.map((n) => n.kode);
  const unik = new Set(kode);
  cek(
    "12 permintaan bersamaan menghasilkan 12 nomor unik",
    unik.size === 12,
    `${unik.size}/12 unik`,
  );

  // ---- Kenapa TIDAK menguji urutan hasil `Promise.all` ----
  // Promise.all mengembalikan hasil menurut urutan ARRAY, bukan urutan
  // selesai. Dengan 12 permintaan bersamaan, urutan array tidak ada
  // hubungannya dengan urutan nomor terbit — mengujinya hanya menghasilkan
  // kegagalan palsu. Yang benar-benar penting adalah: himpunan nomornya
  // tepat {A-001 ... A-012}, tanpa bolong dan tanpa kembar.
  const diharapkan = Array.from(
    { length: 12 },
    (_, i) => `A-${String(i + 1).padStart(3, "0")}`,
  ).sort();
  cek(
    "nomor yang terbit tepat A-001..A-012, tanpa bolong",
    [...unik].sort().join(",") === diharapkan.join(","),
    [...unik].sort().join(" "),
  );

  // `diDepan` hanya bermakna untuk nomor yang benar-benar terbit terakhir:
  // nomor urut terbesar yang ada di hasil.
  const terakhirTerbit = nomor.reduce((a, b) =>
    b.nomorUrut > a.nomorUrut ? b : a,
  );
  cek(
    "nomor urut terbesar melihat 11 orang di depan",
    terakhirTerbit.nomorUrut === 12 && terakhirTerbit.diDepan === 11,
    `nomorUrut=${terakhirTerbit.nomorUrut} diDepan=${terakhirTerbit.diDepan}`,
  );
  cek(
    "nomor urut terkecil melihat 0 orang di depan",
    nomor.reduce((a, b) => (b.nomorUrut < a.nomorUrut ? b : a)).diDepan === 0,
  );

  // ---------------------------------------------------------------
  console.log("\n2. Deret prioritas terpisah");
  // ---------------------------------------------------------------

  const p1 = await ambilNomor(layanan.id, "prioritas", "Ibu Ningsih", "lansia");
  cek("prioritas punya deret sendiri (AP-001)", p1.kode === "AP-001", p1.kode);
  cek(
    "prioritas tidak menghitung orang biasa sebagai orang di depan",
    p1.diDepan === 0,
    `diDepan=${p1.diDepan}`,
  );

  const p2 = await ambilNomor(layanan.id, "prioritas", "Bapak Tarno", "kursi roda");
  cek("prioritas kedua jadi AP-002", p2.kode === "AP-002", p2.kode);

  // ---------------------------------------------------------------
  console.log("\n3. Aturan rasio 2:1 (dua biasa, satu prioritas)");
  // ---------------------------------------------------------------

  // ---- Uji khusus keadaan NOL ----
  // Di titik ini belum ada satu pun nomor yang dilayani. Bug yang pernah
  // ada di sini: rumus `sudahPrioritas * 3 <= sudahBiasa` bernilai BENAR
  // saat keduanya 0, sehingga nomor pertama yang dipanggil justru
  // prioritas. Karena itu keadaan nol diuji secara eksplisit.
  const belumAdaYangDilayani = await prisma.antrian.count({
    where: {
      layananId: layanan.id,
      tanggal: tanggalHariIni(),
      jenis: { in: ["biasa", "prioritas"] },
      status: { in: ["dilayani", "selesai"] },
    },
  });
  cek(
    "prasyarat: belum ada nomor yang dilayani",
    belumAdaYangDilayani === 0,
    `${belumAdaYangDilayani} sudah dilayani`,
  );

  // Belum ada yang dilayani, jadi giliran pertama WAJIB antrian biasa.
  const a1 = await panggilBerikutnya(loket[0].id, petugas.id);
  cek(
    "panggilan pertama = nomor biasa (prioritas belum menyerobot)",
    a1?.jenis === "biasa",
    a1?.kode ?? "kosong",
  );

  // Setelah satu biasa dilayani, rasionya masih menguntungkan biasa.
  await mulaiLayani(a1!.id, loket[0].id, petugas.id);
  await selesaikan(a1!.id, loket[0].id, petugas.id);

  const a2 = await panggilBerikutnya(loket[0].id, petugas.id);
  cek("panggilan kedua = nomor biasa", a2?.jenis === "biasa", a2?.kode ?? "kosong");

  await mulaiLayani(a2!.id, loket[0].id, petugas.id);
  await selesaikan(a2!.id, loket[0].id, petugas.id);

  // Dua biasa sudah dilayani, nol prioritas -> sekarang giliran prioritas.
  const a3 = await panggilBerikutnya(loket[0].id, petugas.id);
  cek(
    "panggilan ketiga = prioritas (rasio 2:1 tercapai)",
    a3?.jenis === "prioritas",
    a3?.kode ?? "kosong",
  );

  await mulaiLayani(a3!.id, loket[0].id, petugas.id);
  await selesaikan(a3!.id, loket[0].id, petugas.id);

  // ---------------------------------------------------------------
  console.log("\n4. Dua loket tidak boleh memanggil orang yang sama");
  // ---------------------------------------------------------------

  const b1 = await panggilBerikutnya(loket[0].id, petugas.id);
  const b2 = await panggilBerikutnya(loket[1].id, petugas.id);
  cek("dua loket memanggil nomor berbeda", b1?.id !== b2?.id, `${b1?.kode} vs ${b2?.kode}`);

  // ---------------------------------------------------------------
  console.log("\n5. Status berpindah sesuai aturan");
  // ---------------------------------------------------------------

  // Nomor yang sudah dipanggil loket lain tidak bisa diselesaikan loket ini.
  let ditolak = false;
  try {
    await selesaikan(b1!.id, loket[1].id, petugas.id);
  } catch {
    ditolak = true;
  }
  cek("loket lain tidak bisa menyelesaikan nomor bukan miliknya", ditolak);

  await mulaiLayani(b1!.id, loket[0].id, petugas.id);
  await selesaikan(b1!.id, loket[0].id, petugas.id);
  const statusB1 = await prisma.antrian.findUnique({
    where: { id: b1!.id },
    select: { status: true },
  });
  cek("nomor selesai berstatus selesai", statusB1?.status === "selesai", statusB1?.status);

  // ---------------------------------------------------------------
  console.log("\n6. Tidak hadir & panggil ulang");
  // ---------------------------------------------------------------

  const c1 = await panggilBerikutnya(loket[0].id, petugas.id);
  await lewati(c1!.id, loket[0].id, petugas.id);
  const statusC1 = await prisma.antrian.findUnique({
    where: { id: c1!.id },
    select: { status: true },
  });
  cek("nomor yang tidak hadir berstatus dilewati", statusC1?.status === "dilewati", statusC1?.status);

  // Nomor yang dilewati tidak boleh muncul lagi sebagai kandidat.
  const lagi = await panggilBerikutnya(loket[1].id, petugas.id);
  cek("nomor yang dilewati tidak dipanggil ulang", lagi?.id !== c1!.id, lagi?.kode ?? "kosong");

  // ---------------------------------------------------------------
  console.log("\n7. Penanda real-time bergerak");
  // ---------------------------------------------------------------

  const versiA = (await dataDisplay()).versi;
  await ambilNomor(layanan.id, "biasa", "Pemicu penanda");
  const versiB = (await dataDisplay()).versi;
  cek("versi naik setiap ada nomor baru", versiB > versiA, `${versiA} → ${versiB}`);

  // ---------------------------------------------------------------
  console.log("\n8. Data display konsisten");
  // ---------------------------------------------------------------

  const d = await dataDisplay();
  const jumlahStatus = await prisma.antrian.groupBy({
    by: ["status"],
    where: { tanggal: d.tanggal },
    _count: { _all: true },
  });
  const hitung = (s: string) =>
    jumlahStatus.find((j) => j.status === s)?._count._all ?? 0;
  cek(
    "ringkasan menunggu sama dengan isi database",
    d.ringkasan.menunggu === hitung("menunggu"),
    `display=${d.ringkasan.menunggu} db=${hitung("menunggu")}`,
  );
  // Catatan: `ringkasan` di display sengaja TIDAK punya field `selesai`.
  // Ia punya `dilayani` = (sedang dilayani + selesai), karena dari sudut
  // pandang orang di ruang tunggu keduanya sama: nomornya sudah lewat.
  cek(
    "ringkasan 'dilayani' = dilayani + selesai di database",
    d.ringkasan.dilayani === hitung("dilayani") + hitung("selesai"),
    `display=${d.ringkasan.dilayani} db=${hitung("dilayani")}+${hitung("selesai")}`,
  );
  cek(
    "ringkasan 'dilewati' sama dengan isi database",
    d.ringkasan.dilewati === hitung("dilewati"),
    `display=${d.ringkasan.dilewati} db=${hitung("dilewati")}`,
  );
  cek(
    "ringkasan 'total' sama dengan jumlah seluruh baris hari ini",
    d.ringkasan.total ===
      hitung("menunggu") + hitung("dipanggil") + hitung("dilayani") + hitung("selesai") + hitung("dilewati"),
    `display=${d.ringkasan.total}`,
  );
  cek(
    "nomor yang ditampilkan besar adalah yang paling akhir dipanggil",
    d.sedangDipanggil.length === 0 ||
      d.sedangDipanggil[0].kode === lagi?.kode,
    d.sedangDipanggil[0]?.kode ?? "kosong",
  );

  // ---------------------------------------------------------------
  console.log(`\n${lulus} lulus, ${gagal} gagal`);
  // ---------------------------------------------------------------

  await bersihkan();
  await hapusLoketUji();
  await prisma.$disconnect();
  if (gagal > 0) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
