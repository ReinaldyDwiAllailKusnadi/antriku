import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { wajibMasuk } from "@/lib/sesi";
import { tanggalHariIni, pilihBerikutnya } from "@/lib/antrian";
import { Chrome } from "../../components/Chrome";
import { PanelLoket } from "../PanelLoket";
import { TombolTutupLoket } from "../TombolTutupLoket";

// Panel kerja satu loket.
//
// Halaman ini menolak petugas yang membuka loket milik orang lain. Itu
// penting: tanpa pemeriksaan di sini, petugas A bisa membuka URL loket B
// dan menekan tombol di sana. Tombol di layar bukan pengaman — pengaman
// ada di sini dan di lapisan aksi.

export const dynamic = "force-dynamic";

export default async function HalamanLoket({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sesi = await wajibMasuk();
  const tanggal = tanggalHariIni();

  const loket = await prisma.loket.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      aktif: true,
      layananId: true,
      layanan: { select: { nama: true, kode: true } },
    },
  });
  if (!loket) notFound();

  // Belum membuka loket ini? Arahkan ke daftar loket, jangan tampilkan
  // panel yang tombolnya pasti ditolak server.
  if (sesi.loketId !== loket.id) redirect("/loket");

  const [aktif, daftarMenunggu, berikutnya, selesai] = await Promise.all([
    // Nomor yang sedang dipegang loket ini.
    prisma.antrian.findFirst({
      where: { loketId: loket.id, status: { in: ["dipanggil", "dilayani"] } },
      orderBy: { dipanggilPada: "desc" },
      select: {
        id: true,
        kode: true,
        jenis: true,
        nama: true,
        catatan: true,
        status: true,
      },
    }),
    prisma.antrian.findMany({
      where: { layananId: loket.layananId, tanggal, status: "menunggu" },
      orderBy: [{ jenis: "desc" }, { nomorUrut: "asc" }],
      take: 12,
      select: { id: true, kode: true, jenis: true, nama: true },
    }),
    // Kandidat berikutnya dihitung dengan aturan rasio yang SAMA dengan
    // yang dipakai `panggilBerikutnya` — bukan tebakan tampilan.
    pilihBerikutnya(loket.layananId, tanggal),
    prisma.antrian.count({
      where: { loketId: loket.id, tanggal, status: "selesai" },
    }),
  ]);

  const kandidat = berikutnya
    ? await prisma.antrian.findUnique({
        where: { id: berikutnya.id },
        select: { kode: true, jenis: true },
      })
    : null;

  return (
    <>
      <Chrome />
      <main className="bungkus">
        <p className="kecil samar mb-1">
          <Link href="/loket">← Ganti loket</Link>
        </p>

        <PanelLoket
          loketId={loket.id}
          loketNama={loket.nama}
          layananNama={loket.layanan.nama}
          aktif={aktif}
          daftarMenunggu={daftarMenunggu}
          berikutnya={kandidat}
          jumlahDilayani={selesai}
        />

        <div className="mt-2">
          <TombolTutupLoket />
        </div>
      </main>
    </>
  );
}
