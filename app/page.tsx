import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { tanggalHariIni } from "@/lib/antrian";
import { Chrome } from "./components/Chrome";
import { FormAmbil } from "./FormAmbil";

// Halaman publik: siapa saja boleh mengambil nomor tanpa punya akun.
// Ini disengaja — orang yang datang ke kantor tidak seharusnya diminta
// mendaftar dulu hanya untuk mendapat nomor antrian.

export const dynamic = "force-dynamic";

export default async function HalamanAmbilNomor() {
  const tanggal = tanggalHariIni();

  const [layanan, hitung] = await Promise.all([
    prisma.layanan.findMany({
      where: { aktif: true },
      orderBy: { urutan: "asc" },
      select: { id: true, kode: true, nama: true, deskripsi: true },
    }),
    prisma.antrian.groupBy({
      by: ["status"],
      where: { tanggal },
      _count: { _all: true },
    }),
  ]);

  const ambil = (s: string) => hitung.find((h) => h.status === s)?._count._all ?? 0;
  const menunggu = ambil("menunggu");
  const dilayani = ambil("dilayani") + ambil("selesai");
  const total = hitung.reduce((n, h) => n + h._count._all, 0);

  return (
    <>
      <Chrome />
      <main className="bungkus bungkus--sempit">
        <h1 className="tengah">Ambil nomor antrian</h1>
        <p className="tengah samar mb-2">
          Pilih layanan yang kamu butuhkan. Nomor langsung terbit dan muncul di
          layar ruang tunggu.
        </p>

        {total > 0 && (
          <div className="pesan pesan--info" role="status">
            Hari ini sudah terbit <strong>{total}</strong> nomor —{" "}
            <strong>{menunggu}</strong> masih menunggu,{" "}
            <strong>{dilayani}</strong> sudah dilayani.
          </div>
        )}

        <div className="kartu kartu--tegas">
          <FormAmbil layanan={layanan} />
        </div>

        <p className="kecil samar tengah">
          Layar panggilan bisa dibuka di perangkat lain:{" "}
          <Link href="/display">/display</Link>
        </p>
      </main>
    </>
  );
}
