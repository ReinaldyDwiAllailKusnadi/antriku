"use server";

// Aksi antrian: ambil nomor, panggil, ubah status.
//
// ATURAN yang menentukan boleh/tidaknya ada di lib/antrian.ts. File ini
// hanya menjembatani form ke aturan itu — plus satu hal yang TIDAK boleh
// dititipkan ke lapisan tampilan: memastikan petugas hanya bisa
// mengendalikan loketnya sendiri.
//
// Kenapa? Karena `loketId` dikirim dari form, dan form ada di sisi
// pengguna. Tanpa pemeriksaan di sini, siapa pun yang sudah masuk bisa
// mengirim loketId loket lain dan menyelesaikan antrian orang lain.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ambilNomor,
  panggilBerikutnya,
  panggilUlang,
  mulaiLayani,
  selesaikan,
  lewati,
  JENIS,
} from "@/lib/antrian";
import { prisma } from "@/lib/prisma";
import { wajibMasuk } from "@/lib/sesi";

export type HasilAksi = {
  galat?: string;
  pesan?: string;
  /// Hanya diisi oleh `ambil`: nomor yang baru terbit.
  kode?: string;
};

/** Ubah galat teknis jadi kalimat yang bisa dibaca orang. */
function pesanRamah(e: unknown, cadangan: string): string {
  const t = e instanceof Error ? e.message : "";
  // Aturan di lib/antrian.ts sengaja melempar pesan yang sudah ramah.
  // Pesan lain (galat database, dsb.) diganti kalimat umum supaya
  // pengguna tidak melihat nama tabel atau kode Prisma.
  const dikenali = [
    "Loket tidak ditemukan",
    "sedang tidak aktif",
    "tidak ditemukan",
    "sudah",
    "belum",
    "Hanya",
    "Wajib",
    "tidak valid",
    "belum ada",
    "Tidak ada",
  ];
  if (t && dikenali.some((k) => t.includes(k))) return t;
  return cadangan;
}

// ---------------------------------------------------------------
// Warga: ambil nomor (tidak perlu masuk)
// ---------------------------------------------------------------

export async function ambil(
  _sebelumnya: HasilAksi,
  data: FormData,
): Promise<HasilAksi> {
  const layananId = String(data.get("layananId") ?? "").trim();
  const jenis = String(data.get("jenis") ?? "biasa");
  const nama = String(data.get("nama") ?? "").trim();
  const catatan = String(data.get("catatan") ?? "").trim();

  if (!layananId) return { galat: "Pilih layanan dulu." };
  if (!JENIS.includes(jenis as (typeof JENIS)[number])) {
    return { galat: "Jenis antrian tidak dikenal." };
  }
  // Prioritas tanpa alasan = pintu belakang untuk menyerobot antrian.
  // Karena itu alasannya WAJIB, dan tersimpan supaya bisa diperiksa.
  if (jenis === "prioritas" && catatan.length < 3) {
    return {
      galat:
        "Antrian prioritas wajib disertai alasan (contoh: lansia, ibu hamil, kursi roda).",
    };
  }

  const layanan = await prisma.layanan.findUnique({
    where: { id: layananId },
    select: { id: true, nama: true, aktif: true },
  });
  if (!layanan || !layanan.aktif) {
    return { galat: "Layanan itu sedang tidak dibuka." };
  }

  try {
    const hasil = await ambilNomor(
      layananId,
      jenis,
      nama || undefined,
      catatan || undefined,
    );

    // Pesan disusun di sini, bukan di tampilan, supaya jumlah orang di
    // depan selalu dari angka yang baru saja dihitung di dalam transaksi.
    const pesan =
      hasil.diDepan === 0
        ? `Kamu nomor berikutnya di ${layanan.nama}. Tunggu panggilan di ruang tunggu.`
        : `Ada ${hasil.diDepan} orang sebelum kamu di ${layanan.nama}.`;

    return { kode: hasil.kode, pesan };
  } catch (e) {
    return {
      galat: pesanRamah(e, "Nomor gagal diterbitkan. Coba lagi sebentar lagi."),
    };
  }
}

// ---------------------------------------------------------------
// Petugas: kendalikan loket sendiri
// ---------------------------------------------------------------

/**
 * Buka loket: catat di DATABASE bahwa petugas ini sedang menjaga loket
 * itu, lalu arahkan ke panelnya.
 *
 * Kenapa harus lewat database? Karena semua aksi lain memeriksa
 * `sesi.loketId`. Kalau buka loket hanya mengubah tampilan, pemeriksaan
 * itu akan selalu gagal — dan kalau pemeriksaannya dilonggarkan supaya
 * bisa jalan, pembatasan loketnya ikut hilang.
 */
export async function bukaLoket(
  _sebelumnya: HasilAksi,
  data: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibMasuk();
  const loketId = String(data.get("loketId") ?? "");

  const loket = await prisma.loket.findUnique({
    where: { id: loketId },
    select: { id: true, aktif: true },
  });
  if (!loket) return { galat: "Loket tidak ditemukan." };
  if (!loket.aktif) return { galat: "Loket ini sedang ditutup admin." };

  // Satu petugas = satu loket. Petugas lain yang sedang menjaga loket
  // yang sama diberi tahu, bukan diam-diam digeser.
  const terisi = await prisma.petugas.findFirst({
    where: { loketId, NOT: { id: sesi.id } },
    select: { nama: true },
  });
  if (terisi) {
    return {
      galat: `Loket ini sedang dibuka oleh ${terisi.nama}. Pilih loket lain, atau minta ia menutup loketnya.`,
    };
  }

  await prisma.petugas.update({
    where: { id: sesi.id },
    data: { loketId },
  });

  redirect(`/loket/${loketId}`);
}

/** Tutup loket: lepaskan loket dari petugas, kembali ke daftar loket. */
export async function tutupLoket(): Promise<void> {
  const sesi = await wajibMasuk();
  await prisma.petugas.update({
    where: { id: sesi.id },
    data: { loketId: null },
  });
  redirect("/loket");
}

/**
 * Pastikan loket ini memang loket yang aktif dipakai petugas yang masuk.
 *
 * `sesi.loketId` diisi saat petugas membuka loket. Kalau kosong, artinya
 * petugas belum membuka loket — dan aksi apa pun yang menyebut loket
 * harus ditolak, bukan diam-diam diizinkan.
 */
async function pastikanLoketSendiri(
  loketId: string,
  sesiLoketId: string | null,
): Promise<string | null> {
  if (!loketId) return "Loket tidak dikenali.";
  if (sesiLoketId !== loketId) {
    return "Kamu hanya bisa mengendalikan loket yang sedang kamu buka.";
  }
  const loket = await prisma.loket.findUnique({
    where: { id: loketId },
    select: { id: true, aktif: true },
  });
  if (!loket) return "Loket tidak ditemukan.";
  if (!loket.aktif) return "Loket ini sudah ditutup.";
  return null;
}

export async function panggil(
  _sebelumnya: HasilAksi,
  data: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibMasuk();
  const loketId = String(data.get("loketId") ?? "");

  const tolak = await pastikanLoketSendiri(loketId, sesi.loketId);
  if (tolak) return { galat: tolak };

  try {
    const hasil = await panggilBerikutnya(loketId, sesi.id);
    revalidatePath(`/loket/${loketId}`);
    revalidatePath("/display");
    if (!hasil) {
      return { pesan: "Tidak ada antrian yang menunggu saat ini." };
    }
    return { pesan: `${hasil.kode} sedang dipanggil ke loket ini.` };
  } catch (e) {
    return { galat: pesanRamah(e, "Gagal memanggil nomor. Coba lagi.") };
  }
}

export async function ubahStatus(
  _sebelumnya: HasilAksi,
  data: FormData,
): Promise<HasilAksi> {
  const sesi = await wajibMasuk();
  const loketId = String(data.get("loketId") ?? "");
  const antrianId = String(data.get("antrianId") ?? "");
  const aksi = String(data.get("aksi") ?? "");

  const tolak = await pastikanLoketSendiri(loketId, sesi.loketId);
  if (tolak) return { galat: tolak };
  if (!antrianId) return { galat: "Nomor antrian tidak dikenali." };

  try {
    let pesan = "";
    switch (aksi) {
      case "mulai":
        await mulaiLayani(antrianId, loketId, sesi.id);
        pesan = "Nomor mulai dilayani.";
        break;
      case "selesai":
        await selesaikan(antrianId, loketId, sesi.id);
        pesan = "Nomor selesai dilayani.";
        break;
      case "lewati":
        await lewati(antrianId, loketId, sesi.id);
        pesan = "Nomor ditandai tidak hadir. Ia bisa dipanggil lagi oleh petugas lain.";
        break;
      case "panggil_ulang":
        await panggilUlang(antrianId, loketId, sesi.id);
        pesan = "Nomor dipanggil ulang.";
        break;
      default:
        return { galat: "Tindakan tidak dikenal." };
    }

    revalidatePath(`/loket/${loketId}`);
    revalidatePath("/display");
    return { pesan };
  } catch (e) {
    return {
      galat: pesanRamah(e, "Perubahan gagal disimpan. Muat ulang halaman."),
    };
  }
}
