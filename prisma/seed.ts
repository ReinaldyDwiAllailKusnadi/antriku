// Data contoh untuk Antriku.
//
// Sengaja memakai fungsi `ambilNomor` yang sama dengan yang dipakai
// aplikasi, bukan menulis baris antrian langsung ke database. Kalau
// seed menulis sendiri, ia bisa "berhasil" walaupun logika penomoran
// sebenarnya rusak — dan kita tidak akan pernah tahu.

import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashKataSandi } from "../lib/sandi";
import { ambilNomor, naikkanVersiSendiri, tanggalHariIni } from "../lib/antrian";

const SANDI_UJI = "rahasiauji123";

async function main() {
  console.log("Membersihkan data lama…");
  // Urutan penting: tabel yang menunjuk ke tabel lain dihapus lebih dulu.
  await prisma.pemanggilan.deleteMany();
  await prisma.antrian.deleteMany();
  await prisma.penghitungAntrian.deleteMany();
  await prisma.loket.deleteMany();
  await prisma.layanan.deleteMany();
  await prisma.petugas.deleteMany();
  await prisma.penanda.deleteMany();

  console.log("Membuat petugas…");
  const sandiHash = await hashKataSandi(SANDI_UJI);

  const admin = await prisma.petugas.create({
    data: {
      nama: "Wulan (Kepala Kantor)",
      email: "admin@antriku.test",
      sandiHash,
      peran: "admin",
    },
  });

  const loket1Petugas = await prisma.petugas.create({
    data: {
      nama: "Dedi (Petugas Loket 1)",
      email: "loket1@antriku.test",
      sandiHash,
      peran: "petugas",
    },
  });

  await prisma.petugas.create({
    data: {
      nama: "Sari (Petugas Loket 2)",
      email: "loket2@antriku.test",
      sandiHash,
      peran: "petugas",
    },
  });

  console.log("Membuat layanan…");
  const umum = await prisma.layanan.create({
    data: {
      kode: "A",
      nama: "Layanan Umum",
      deskripsi: "Informasi, pengaduan, dan keperluan umum lainnya.",
      kodePrioritas: "P",
      urutan: 1,
    },
  });

  const ktp = await prisma.layanan.create({
    data: {
      kode: "B",
      nama: "KTP & Kartu Keluarga",
      deskripsi: "Pengurusan KTP, KK, dan dokumen kependudukan.",
      kodePrioritas: "P",
      urutan: 2,
    },
  });

  await prisma.layanan.create({
    data: {
      kode: "C",
      nama: "Surat Keterangan",
      deskripsi: "Surat keterangan domisili, usaha, dan sejenisnya.",
      kodePrioritas: "P",
      urutan: 3,
    },
  });

  console.log("Membuat loket…");
  const loket1 = await prisma.loket.create({
    data: { nama: "Loket 1", layananId: umum.id },
  });
  await prisma.loket.create({
    data: { nama: "Loket 2", layananId: ktp.id },
  });

  console.log("Membuat penanda real-time…");
  await prisma.penanda.create({ data: { id: "global", versi: 0 } });

  // ------------------------------------------------------------------
  // Antrian contoh hari ini.
  //
  // Dibuat lewat ambilNomor supaya penomoran di seed pun melewati jalur
  // yang sama dengan aplikasi. Kalau ada yang salah di lib/antrian.ts,
  // seed akan gagal — bukan diam-diam menyimpan data yang tampak wajar.
  // ------------------------------------------------------------------
  console.log("Mengambil nomor contoh hari ini…");
  const contoh = [
    { layananId: umum.id, jenis: "biasa", nama: "Bapak Suryo" },
    { layananId: umum.id, jenis: "biasa", nama: null },
    {
      layananId: umum.id,
      jenis: "prioritas",
      nama: "Ibu Ningsih",
      catatan: "Lansia, memakai kursi roda",
    },
    { layananId: ktp.id, jenis: "biasa", nama: "Rani" },
    { layananId: ktp.id, jenis: "biasa", nama: null },
  ];

  for (const c of contoh) {
    const h = await ambilNomor(c.layananId, c.jenis, c.nama ?? undefined, c.catatan);
    console.log(`  ${h.kode}  (${h.jenis})  ${c.nama ?? "tanpa nama"}`);
  }

  // Satu orang sudah dilayani sampai selesai, supaya rasio 2:1 punya
  // bahan nyata dan tampilan tidak kosong saat pertama dibuka.
  const pertama = await prisma.antrian.findFirst({
    where: { layananId: umum.id, jenis: "biasa" },
    orderBy: { nomorUrut: "asc" },
  });
  if (pertama) {
    await prisma.antrian.update({
      where: { id: pertama.id },
      data: {
        status: "selesai",
        dipanggilPada: new Date(),
        dilayaniPada: new Date(),
        selesaiPada: new Date(),
        loketId: loket1.id,
        petugasId: loket1Petugas.id,
      },
    });
    await prisma.pemanggilan.create({
      data: {
        antrianId: pertama.id,
        loketId: loket1.id,
        petugasId: loket1Petugas.id,
        aksi: "panggil",
      },
    });
  }

  await naikkanVersiSendiri();

  const jumlah = await prisma.antrian.count();
  console.log("");
  console.log("Selesai.");
  console.log(`  Tanggal         : ${tanggalHariIni()}`);
  console.log(`  Petugas         : 3 (admin + 2 petugas loket)`);
  console.log(`  Layanan         : 3 (A, B, C)`);
  console.log(`  Loket           : 2`);
  console.log(`  Antrian hari ini: ${jumlah}`);
  console.log("");
  console.log("Masuk dengan salah satu akun ini (kata sandi: rahasiauji123):");
  console.log("  admin@antriku.test   — admin");
  console.log("  loket1@antriku.test  — petugas (Loket 1)");
  console.log("  loket2@antriku.test  — petugas (Loket 2)");
  console.log("");
  console.log(`(catatan: admin ${admin.nama})`);
}

main()
  .catch((e) => {
    console.error("Seed gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
