// Inti sistem antrian: pengambilan nomor, pemanggilan, dan penanda real-time.
//
// File ini sengaja tidak berisi UI apa pun. Semua aturan yang menentukan
// benar/salahnya ada di sini, supaya bisa diuji tanpa browser
// (lihat scripts/uji-antrian.ts).
//
// ============================================================
// DUA MASALAH YANG DISELESAIKAN DI SINI
// ============================================================
//
// A. NOMOR KEMBAR saat dua loket menekan tombol bersamaan.
//
//    Pendekatan yang SALAH dan kelihatannya benar:
//      const terakhir = await prisma.antrian.count({ where: { ... } });
//      const nomor = terakhir + 1;
//
//    Dua permintaan yang datang bersamaan sama-sama menghitung 7, lalu
//    sama-sama menyimpan 8. Hasilnya dua orang memegang nomor A-008.
//    Ini bukan teori — ini penyebab paling umum antrian berantakan.
//
//    Penyelesaiannya: penghitung disimpan sebagai SATU BARIS per deret
//    (layanan + tanggal + jenis), lalu baris itu DIKUNCI di dalam
//    transaksi. Permintaan kedua menunggu sampai yang pertama selesai,
//    jadi ia membaca angka yang sudah bertambah.
//
// B. PRIORITAS yang tidak boleh mendahului terus-menerus.
//
//    Kalau prioritas selalu diutamakan, orang biasa tidak pernah maju.
//    Kalau prioritas tidak diutamakan, prioritas jadi tidak berarti.
//    Aturannya di sini: DUA nomor biasa, lalu SATU nomor prioritas
//    (rasio 2:1), dihitung dari jumlah yang sudah dilayani.

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const JENIS = ["biasa", "prioritas"] as const;
export type Jenis = (typeof JENIS)[number];

/// Rasio pemanggilan: setiap 2 nomor biasa, 1 nomor prioritas.
export const RASIO_PRIORITAS = 2;

/// Tanggal "hari ini" menurut zona waktu kantor.
///
/// VPS ini berjalan di UTC, sementara kantor desa ada di WIB (UTC+7).
/// Kalau memakai UTC apa adanya, jam 07.00 WIB tanggal 2 masih terbaca
/// sebagai tanggal 1 — nomor antrian kembali ke 1 di tengah jam kerja.
///
/// Zona waktu dibuat tetap (bukan mengikuti jam server) supaya hasilnya
/// sama di laptop mana pun, dan supaya bisa diuji.
const ZONA_WAKTU = "Asia/Jakarta";

export function tanggalHariIni(saat: Date = new Date()): string {
  // en-CA menghasilkan format YYYY-MM-DD — persis yang dibutuhkan.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_WAKTU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(saat);
}

/** Nomor urut 3 digit dengan nol di depan: 7 -> "007". */
export function pad(nomor: number): string {
  return String(nomor).padStart(3, "0");
}

/**
 * Kode nomor yang dilihat orang.
 *   biasa    -> "A-001"
 *   prioritas -> "AP-001"   (A + P)
 */
export function buatKode(
  kodeLayanan: string,
  kodePrioritas: string,
  jenis: string,
  nomor: number,
): string {
  const awalan = jenis === "prioritas" ? `${kodeLayanan}${kodePrioritas}` : kodeLayanan;
  return `${awalan}-${pad(nomor)}`;
}

// ---------------------------------------------------------------
// A. MENGAMBIL NOMOR BARU
// ---------------------------------------------------------------

export type HasilAmbil = {
  id: string;
  kode: string;
  nomorUrut: number;
  jenis: string;
  tanggal: string;
  layanan: string;
  diDepan: number; // berapa orang yang menunggu di depannya
};

/**
 * Ambil nomor antrian baru.
 *
 * SELURUH operasi ini di dalam satu transaksi, dan baris penghitung
 * dikunci. Itu inti pertahanannya: selama transaksi berjalan, permintaan
 * lain untuk deret yang sama akan menunggu — bukan membaca angka lama.
 */
export async function ambilNomor(
  layananId: string,
  jenisInput: string = "biasa",
  nama?: string,
  catatan?: string,
): Promise<HasilAmbil> {
  const jenis: Jenis = jenisInput === "prioritas" ? "prioritas" : "biasa";
  const tanggal = tanggalHariIni();

  const layanan = await prisma.layanan.findUnique({ where: { id: layananId } });
  if (!layanan) throw new Error("Layanan tidak ditemukan.");
  if (!layanan.aktif) throw new Error("Layanan ini sedang tidak dibuka.");

  // Kalau jenis prioritas tidak masuk akal tanpa alasan, catatan wajib.
  // Ini bukan basa-basi administratif: tanpa alasan tercatat, penyalahgunaan
  // prioritas tidak bisa ditelusuri belakangan.
  if (jenis === "prioritas" && !catatan?.trim()) {
    throw new Error("Antrian prioritas wajib mencantumkan alasan.");
  }

  return await prisma.$transaction(async (tx) => {
    // ---- Langkah 1: pastikan baris penghitung ada, lalu KUNCI ----
    //
    // PENTING — jangan diganti dengan cara yang "kelihatan benar":
    //
    //   await tx.penghitungAntrian.updateMany({ where, data: { id: undefined } })
    //
    // Itu TIDAK mengirim UPDATE apa pun ke database (Prisma mengabaikan
    // kolom yang nilainya undefined), jadi tidak ada baris yang terkunci.
    // Sudah diuji: hasilnya `{ count: 1 }` padahal SQL-nya kosong — angka
    // itu menyesatkan. Penguncian harus lewat SQL mentah.
    //
    // Baris dibuat kalau belum ada. ON CONFLICT DO NOTHING dipakai supaya
    // dua permintaan pertama di pagi hari tidak saling menabrak: yang
    // kalah tidak error, hanya tidak membuat baris kedua.
    await tx.$executeRaw`
      INSERT INTO "PenghitungAntrian" (id, "layananId", tanggal, jenis, terakhir)
      VALUES (gen_random_uuid()::text, ${layananId}, ${tanggal}, ${jenis}, 0)
      ON CONFLICT ("layananId", tanggal, jenis) DO NOTHING
    `;

    // FOR UPDATE = kunci baris ini sampai transaksi selesai.
    // Permintaan lain untuk deret yang sama akan MENUNGGU di baris ini,
    // bukan lanjut membaca angka yang sudah basi. Inilah inti pertahanan
    // terhadap nomor kembar.
    const terkunci = await tx.$queryRaw<{ id: string; terakhir: number }[]>`
      SELECT id, terakhir FROM "PenghitungAntrian"
      WHERE "layananId" = ${layananId} AND tanggal = ${tanggal} AND jenis = ${jenis}
      FOR UPDATE
    `;
    const baris = terkunci[0];
    if (!baris) throw new Error("Gagal menyiapkan penghitung antrian.");

    // ---- Langkah 2: tambah nomor ----
    const nomorBaru = baris.terakhir + 1;
    await tx.penghitungAntrian.update({
      where: { id: baris.id },
      data: { terakhir: nomorBaru },
    });

    const kode = buatKode(layanan.kode, layanan.kodePrioritas, jenis, nomorBaru);

    // ---- Langkah 3: simpan antriannya ----
    const antrian = await tx.antrian.create({
      data: {
        layananId,
        jenis,
        nomorUrut: nomorBaru,
        tanggal,
        kode,
        nama: nama?.trim() || null,
        catatan: catatan?.trim() || null,
        status: "menunggu",
      },
    });

    // ---- Langkah 4: tandai ada perubahan (untuk display) ----
    await naikkanVersi(tx);

    // Berapa orang di depan? Hanya yang berjenis sama dan masih menunggu.
    // Prioritas tidak dihitung sebagai "di depan" orang biasa karena
    // keduanya deret terpisah.
    const diDepan = await tx.antrian.count({
      where: {
        layananId,
        tanggal,
        jenis,
        status: "menunggu",
        nomorUrut: { lt: nomorBaru },
      },
    });

    return {
      id: antrian.id,
      kode,
      nomorUrut: nomorBaru,
      jenis,
      tanggal,
      layanan: layanan.nama,
      diDepan,
    };
  });
}

// ---------------------------------------------------------------
// B. MENENTUKAN SIAPA YANG DIPANGGIL BERIKUTNYA (rasio 2:1)
// ---------------------------------------------------------------

/**
 * Pilih antrian berikutnya untuk sebuah loket.
 *
 * Aturannya: hitung berapa nomor biasa dan prioritas yang sudah dilayani
 * loket ini hari ini. Kalau yang biasa sudah 2x lipat prioritas (atau
 * lebih), panggil prioritas. Kalau tidak, panggil biasa.
 *
 * Kenapa dihitung dari yang SUDAH dilayani, bukan dari urutan kedatangan?
 * Karena yang perlu dijaga adalah keadilan sepanjang hari, bukan urutan
 * sesaat. Cara ini juga otomatis menyesuaikan diri: kalau hari itu tidak
 * ada satu pun prioritas, semua nomor biasa dilayani tanpa jeda.
 */
export async function pilihBerikutnya(
  layananId: string,
  tanggal: string = tanggalHariIni(),
): Promise<{ id: string; jenis: string } | null> {
  const [sudahBiasa, sudahPrioritas] = await Promise.all([
    prisma.antrian.count({
      where: { layananId, tanggal, jenis: "biasa", status: { in: ["dilayani", "selesai"] } },
    }),
    prisma.antrian.count({
      where: { layananId, tanggal, jenis: "prioritas", status: { in: ["dilayani", "selesai"] } },
    }),
  ]);

  // Prioritas didahulukan hanya kalau memang tertinggal jauh.
  //
  // Aturannya: dua nomor biasa, lalu satu prioritas. Ditulis sebagai
  // "biasa sudah dilayani >= 2 x (prioritas sudah dilayani + 1)".
  //
  // ---- Kenapa TIDAK boleh ditulis seperti ini ----
  //   sudahPrioritas * (RASIO_PRIORITAS + 1) <= sudahBiasa
  // Saat antrian masih kosong (0 biasa, 0 prioritas), bentuk itu menjadi
  // 0 <= 0 = BENAR — jadi nomor PERTAMA yang dipanggil adalah prioritas,
  // padahal belum ada satu pun nomor biasa dilayani. Ini jenis kesalahan
  // yang lolos dari pemeriksaan mata: rumusnya terlihat rapi, dan hanya
  // ketahuan lewat uji dengan angka nol. Lihat scripts/uji-antrian.ts.
  const giliranPrioritas =
    sudahBiasa >= RASIO_PRIORITAS * (sudahPrioritas + 1);

  const urutanJenis = giliranPrioritas ? ["prioritas", "biasa"] : ["biasa", "prioritas"];

  for (const jenis of urutanJenis) {
    const kandidat = await prisma.antrian.findFirst({
      where: { layananId, tanggal, jenis, status: "menunggu" },
      orderBy: { nomorUrut: "asc" },
      select: { id: true, jenis: true },
    });
    if (kandidat) return kandidat;
  }

  // Tidak ada yang menunggu di deret mana pun.
  return null;
}

/**
 * Panggil antrian berikutnya di sebuah loket.
 *
 * Mengembalikan antrian yang dipanggil, atau null kalau tidak ada yang
 * menunggu. Setiap pemanggilan menulis baris Pemanggilan (append-only)
 * sebagai bukti — kalau ada sengketa "saya tidak dipanggil", itu buktinya.
 */
export async function panggilBerikutnya(
  loketId: string,
  petugasId: string,
): Promise<{ kode: string; id: string; jenis: string } | null> {
  const loket = await prisma.loket.findUnique({ where: { id: loketId } });
  if (!loket) throw new Error("Loket tidak ditemukan.");
  if (!loket.aktif) throw new Error("Loket ini sedang tidak aktif.");

  const tanggal = tanggalHariIni();

  return await prisma.$transaction(async (tx) => {
    // Cari kandidat dengan aturan rasio. Dihitung di dalam transaksi
    // supaya dua loket tidak memanggil orang yang sama: setelah satu
    // loket mengubah statusnya jadi "dipanggil", ia tidak lagi "menunggu"
    // dan tidak akan terpilih oleh loket kedua.
    const pilihan = await pilihBerikutnya(loket.layananId, tanggal);
    if (!pilihan) return null;

    const diubah = await tx.antrian.updateMany({
      where: { id: pilihan.id, status: "menunggu" }, // syarat status: cegah panggilan ganda
      data: {
        status: "dipanggil",
        dipanggilPada: new Date(),
        loketId,
        petugasId,
      },
    });

    // count 0 berarti loket lain sudah lebih dulu memanggil orang ini.
    // Bukan galat — cukup laporkan tidak ada yang dipanggil.
    if (diubah.count === 0) return null;

    await tx.pemanggilan.create({
      data: { antrianId: pilihan.id, loketId, petugasId, aksi: "panggil" },
    });

    await naikkanVersi(tx);

    const a = await tx.antrian.findUniqueOrThrow({
      where: { id: pilihan.id },
      select: { id: true, kode: true, jenis: true },
    });
    return a;
  });
}

/** Panggil ulang antrian yang sedang dilayani loket ini (orang tidak hadir). */
export async function panggilUlang(
  antrianId: string,
  loketId: string,
  petugasId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const a = await tx.antrian.findUnique({ where: { id: antrianId } });
    if (!a) throw new Error("Antrian tidak ditemukan.");
    if (a.status !== "dipanggil") {
      throw new Error("Hanya antrian yang sedang dipanggil bisa dipanggil ulang.");
    }
    await tx.pemanggilan.create({
      data: { antrianId, loketId, petugasId, aksi: "panggil_ulang" },
    });
    await naikkanVersi(tx);
  });
}

/** Tandai antrian mulai dilayani. */
export async function mulaiLayani(
  antrianId: string,
  loketId: string,
  petugasId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const diubah = await tx.antrian.updateMany({
      where: { id: antrianId, status: "dipanggil", loketId },
      data: { status: "dilayani", dilayaniPada: new Date() },
    });
    if (diubah.count === 0) {
      throw new Error("Antrian ini tidak sedang dipanggil di loketmu.");
    }
    await naikkanVersi(tx);
  });
}

/** Selesaikan pelayanan. Setelah ini nomor berikutnya bisa dipanggil. */
export async function selesaikan(
  antrianId: string,
  loketId: string,
  petugasId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const diubah = await tx.antrian.updateMany({
      where: { id: antrianId, status: { in: ["dipanggil", "dilayani"] }, loketId },
      data: { status: "selesai", selesaiPada: new Date() },
    });
    if (diubah.count === 0) {
      throw new Error("Antrian ini tidak sedang ditangani loketmu.");
    }
    await naikkanVersi(tx);
  });
}

/**
 * Lewati antrian yang tidak hadir setelah dipanggil beberapa kali.
 *
 * Tidak dihapus, hanya berstatus "dilewati". Nomornya tetap tercatat di
 * riwayat supaya jumlah orang yang dijanjikan layanan bisa dipertanggungjawabkan.
 */
export async function lewati(
  antrianId: string,
  loketId: string,
  petugasId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const diubah = await tx.antrian.updateMany({
      where: { id: antrianId, status: "dipanggil", loketId },
      data: { status: "dilewati" },
    });
    if (diubah.count === 0) {
      throw new Error("Hanya antrian yang sedang dipanggil bisa dilewati.");
    }
    await tx.pemanggilan.create({
      data: { antrianId, loketId, petugasId, aksi: "lewati" },
    });
    await naikkanVersi(tx);
  });
}

/** Batalkan antrian yang masih menunggu (orang berubah pikiran / salah ambil). */
export async function batalkan(antrianId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const diubah = await tx.antrian.updateMany({
      where: { id: antrianId, status: "menunggu" },
      data: { status: "batal" },
    });
    if (diubah.count === 0) {
      throw new Error("Hanya antrian yang masih menunggu bisa dibatalkan.");
    }
    await naikkanVersi(tx);
  });
}

// ---------------------------------------------------------------
// C. PENANDA PERUBAHAN (jantung tampilan real-time)
// ---------------------------------------------------------------

/// Tipe transaksi Prisma.
///
/// Jangan diturunkan sendiri lewat `Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]`
/// — di Prisma 7 hasilnya `never`, dan galatnya baru muncul saat build
/// ("Argument of type ... is not assignable to parameter of type 'never'"),
/// bukan saat file ini ditulis. Pakai tipe resmi dari Prisma.
type Tx = Prisma.TransactionClient;

/**
 * Naikkan versi penanda global.
 *
 * WAJIB dipanggil di dalam transaksi yang sama dengan perubahan datanya.
 * Kalau dipanggil terpisah, ada celah waktu di mana data sudah berubah
 * tapi penanda belum — display akan menampilkan keadaan lama dan tidak
 * pernah tahu ada yang perlu diperbarui.
 */
async function naikkanVersi(tx: Tx): Promise<void> {
  await tx.penanda.upsert({
    where: { id: "global" },
    create: { id: "global", versi: 1 },
    update: { versi: { increment: 1 }, diubahPada: new Date() },
  });
}

/** Baca versi penanda saat ini. Dipanggil display tiap detik — harus ringan. */
export async function versiSekarang(): Promise<number> {
  const p = await prisma.penanda.findUnique({
    where: { id: "global" },
    select: { versi: true },
  });
  return p?.versi ?? 0;
}

/** Naikkan versi dari luar transaksi (untuk perubahan seperti buka/tutup loket). */
export async function naikkanVersiSendiri(): Promise<void> {
  await prisma.penanda.upsert({
    where: { id: "global" },
    create: { id: "global", versi: 1 },
    update: { versi: { increment: 1 }, diubahPada: new Date() },
  });
}

// ---------------------------------------------------------------
// D. DATA UNTUK DISPLAY
// ---------------------------------------------------------------

export type DataDisplay = {
  versi: number;
  tanggal: string;
  /// Nomor yang sedang dipanggil, per loket. Ini yang dibacakan pengeras suara.
  sedangDipanggil: {
    kode: string;
    loket: string;
    layanan: string;
    pada: string | null;
    dipanggilPada: string | null;
  }[];
  /// Beberapa nomor berikutnya yang menunggu, per layanan.
  berikutnya: {
    layanan: string;
    kode: string;
    kodeLayanan: string;
  }[];
  /// Statistik ringkas hari ini.
  ringkasan: {
    total: number;
    menunggu: number;
    dilayani: number;
    dilewati: number;
  };
};

/**
 * Ambil semua data yang dibutuhkan layar display dalam SATU panggilan.
 *
 * Ini disengaja: display yang menonton sendiri (tanpa operator) tidak
 * boleh menembak 5 query terpisah tiap detik. Satu panggilan = satu
 * round-trip, dan hanya dilakukan saat versi berubah.
 */
export async function dataDisplay(): Promise<DataDisplay> {
  const tanggal = tanggalHariIni();

  const [versi, sedangDipanggil, menunggu, hitung] = await Promise.all([
    versiSekarang(),

    // Nomor yang sedang dipanggil atau dilayani — inilah yang tampil besar.
    prisma.antrian.findMany({
      where: { tanggal, status: { in: ["dipanggil", "dilayani"] } },
      orderBy: { dipanggilPada: "desc" },
      take: 4,
      select: {
        kode: true,
        dipanggilPada: true,
        loket: { select: { nama: true } },
        layanan: { select: { nama: true } },
      },
    }),

    // Yang menunggu, dikelompokkan per layanan di sisi tampilan.
    prisma.antrian.findMany({
      where: { tanggal, status: "menunggu" },
      orderBy: [{ layananId: "asc" }, { jenis: "asc" }, { nomorUrut: "asc" }],
      take: 12,
      select: {
        kode: true,
        layanan: { select: { nama: true, kode: true } },
      },
    }),

    prisma.antrian.groupBy({
      by: ["status"],
      where: { tanggal },
      _count: { _all: true },
    }),
  ]);

  const hitungStatus = (s: string) =>
    hitung.find((h) => h.status === s)?._count._all ?? 0;

  const total = hitung.reduce((n, h) => n + h._count._all, 0);

  return {
    versi,
    tanggal,
    sedangDipanggil: sedangDipanggil.map((a) => ({
      kode: a.kode,
      loket: a.loket?.nama ?? "—",
      layanan: a.layanan.nama,
      pada: null,
      dipanggilPada: a.dipanggilPada?.toISOString() ?? null,
    })),
    berikutnya: menunggu.map((a) => ({
      layanan: a.layanan.nama,
      kode: a.kode,
      kodeLayanan: a.layanan.kode,
    })),
    ringkasan: {
      total,
      menunggu: hitungStatus("menunggu"),
      dilayani: hitungStatus("dilayani") + hitungStatus("selesai"),
      dilewati: hitungStatus("dilewati"),
    },
  };
}
