// Sesi login petugas.
//
// Pola ini disalin dari proyek desaku yang sudah terbukti jalan — termasuk
// satu perbaikan penting soal cookie yang butuh waktu lama untuk ketemu.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const NAMA_COOKIE = "antriku_sesi";

export type Sesi = {
  id: string;
  nama: string;
  email: string;
  peran: string;
  /// Loket yang sedang dibuka petugas ini, dibaca dari database — bukan
  /// dari cookie. Lihat penjelasan di skema, model Petugas.
  loketId: string | null;
};

export async function buatSesi(petugasId: string): Promise<void> {
  const jar = await cookies();
  jar.set(NAMA_COOKIE, petugasId, {
    httpOnly: true, // tidak bisa dibaca JavaScript -> sesi tidak bisa dicuri lewat XSS
    sameSite: "lax",
    // ---- Kenapa TIDAK "secure: true" ----
    // Kalau ditandai Secure, browser HANYA menyimpan cookie itu di situs
    // HTTPS. Situs ini masih diakses lewat http:// (port 8082, belum ada
    // domain + sertifikat). Kalau dipaksa Secure di sini, browser membuang
    // cookienya TANPA pesan galat apa pun — login tampak berhasil, lalu
    // sesi hilang begitu halaman dimuat ulang.
    //
    // Jadi syaratnya diukur dari kenyataan (apakah permintaan ini memang
    // sudah HTTPS), bukan dari NODE_ENV. Begitu nanti sertifikat dipasang,
    // cookie Secure menyala sendiri tanpa perubahan kode.
    secure: await permintaanSudahHttps(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Apakah permintaan ini datang lewat HTTPS?
 * Dibaca dari X-Forwarded-Proto karena aplikasi berdiri di belakang nginx.
 */
async function permintaanSudahHttps(): Promise<boolean> {
  try {
    const h = await headers();
    return h.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  } catch {
    return false;
  }
}

export async function hapusSesi(): Promise<void> {
  const jar = await cookies();
  jar.delete(NAMA_COOKIE);
}

/**
 * Sesi aktif, atau null kalau belum masuk.
 *
 * Setiap panggilan menanyakan ulang ke database. Itu disengaja: kalau
 * petugas dinonaktifkan atau perannya diturunkan, perubahan itu langsung
 * berlaku. Cookie hanya menyimpan id — kewenangan selalu dibaca dari
 * database, bukan dari isi cookie.
 */
export async function sesiSekarang(): Promise<Sesi | null> {
  const jar = await cookies();
  const id = jar.get(NAMA_COOKIE)?.value;
  if (!id) return null;

  const p = await prisma.petugas.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      email: true,
      peran: true,
      aktif: true,
      loketId: true,
    },
  });

  if (!p || !p.aktif) return null;
  return {
    id: p.id,
    nama: p.nama,
    email: p.email,
    peran: p.peran,
    loketId: p.loketId,
  };
}

/** Sesi wajib ada, kalau tidak dialihkan ke halaman masuk. */
export async function wajibMasuk(): Promise<Sesi> {
  const s = await sesiSekarang();
  if (!s) redirect("/masuk");
  return s;
}

/** Sesi wajib ada DAN perannya termasuk yang diizinkan. */
export async function wajibPeran(...peran: string[]): Promise<Sesi> {
  const s = await wajibMasuk();
  if (!peran.includes(s.peran)) redirect("/loket");
  return s;
}

/**
 * Cek peran untuk AKSI (bukan halaman). Mengembalikan pesan galat, bukan
 * melakukan redirect — karena aksi mengembalikan nilai ke form, bukan
 * mengganti halaman.
 *
 * Ini yang membuat pembatasan peran benar-benar berlaku: menyembunyikan
 * tombol di tampilan tidak menghentikan siapa pun yang mengirim
 * permintaannya langsung.
 */
export function peranCukup(peran: string, diizinkan: string[]): string | null {
  if (!diizinkan.includes(peran)) {
    return "Peranmu tidak punya wewenang untuk tindakan ini.";
  }
  return null;
}
