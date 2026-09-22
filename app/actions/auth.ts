"use server";

// Aksi untuk masuk dan keluar.

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cocokKataSandi } from "@/lib/sandi";
import { buatSesi, hapusSesi } from "@/lib/sesi";

export type HasilAksi = {
  galat?: string;
  pesan?: string;
};

export async function masuk(
  _sebelumnya: HasilAksi,
  data: FormData,
): Promise<HasilAksi> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const kataSandi = String(data.get("kataSandi") ?? "");

  if (!email || !kataSandi) {
    return { galat: "Email dan kata sandi wajib diisi." };
  }

  const petugas = await prisma.petugas.findUnique({ where: { email } });

  // ---- Kenapa pesannya sama untuk dua kasus berbeda ----
  //
  // Kalau email tidak terdaftar dijawab "email tidak ditemukan", dan
  // email terdaftar tapi sandinya salah dijawab "kata sandi salah",
  // maka siapa pun bisa memakai halaman ini untuk mencari tahu email
  // mana yang terdaftar. Satu pesan untuk keduanya menutup kebocoran itu.
  //
  // Perhatikan juga: kalau petugas tidak ada, kita TIDAK langsung
  // menjawab. Pembandingan sandi tetap dijalankan terhadap hash palsu
  // supaya lama waktunya mirip. Tanpa itu, "email tidak ada" terasa
  // lebih cepat daripada "sandi salah", dan selisih waktu itu sendiri
  // sudah membocorkan jawabannya.
  const hashPalsu =
    "00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

  const cocok = await cocokKataSandi(kataSandi, petugas?.sandiHash ?? hashPalsu);

  if (!petugas || !petugas.aktif || !cocok) {
    return { galat: "Email atau kata sandi salah." };
  }

  await buatSesi(petugas.id);
  redirect("/loket");
}

export async function keluar(): Promise<void> {
  await hapusSesi();
  redirect("/masuk");
}
