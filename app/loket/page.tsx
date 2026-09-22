import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { wajibPeran } from "@/lib/sesi";
import { tanggalHariIni } from "@/lib/antrian";
import { Chrome } from "../components/Chrome";
import { TombolBukaLoket } from "./TombolBukaLoket";

// Halaman pemilihan loket.
//
// Kenapa petugas memilih loketnya sendiri, bukan langsung terhubung ke
// satu loket dari akunnya? Karena di kantor nyata orang bergantian jaga
// meja. Kalau loket diikat mati ke akun, setiap pergantian jaga harus
// minta admin mengubah data — dan itu bikin sistem ini ditinggalkan.
//
// Yang dipilih di sini bukan sekadar tampilan: aksi `bukaLoket` mencatat
// pilihan itu ke database, dan seluruh aksi lain memeriksanya.

export const dynamic = "force-dynamic";

export default async function HalamanPilihLoket() {
  const sesi = await wajibPeran("petugas", "admin");
  const tanggal = tanggalHariIni();

  const [loket, menunggu, selesai, penjaga] = await Promise.all([
    prisma.loket.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        layananId: true,
        layanan: { select: { nama: true, kode: true } },
      },
    }),
    // Berapa yang menunggu per layanan, supaya petugas bisa memilih meja
    // yang paling ramai lebih dulu.
    prisma.antrian.groupBy({
      by: ["layananId"],
      where: { tanggal, status: "menunggu" },
      _count: { _all: true },
    }),
    prisma.antrian.groupBy({
      by: ["loketId"],
      where: { tanggal, status: "selesai" },
      _count: { _all: true },
    }),
    // Siapa yang sedang menjaga loket mana — supaya tidak ada dua orang
    // mengira-ngira memegang meja yang sama.
    prisma.petugas.findMany({
      where: { loketId: { not: null }, aktif: true },
      select: { loketId: true, nama: true },
    }),
  ]);

  const hitungMenunggu = (layananId: string) =>
    menunggu.find((m) => m.layananId === layananId)?._count._all ?? 0;
  const hitungSelesai = (loketId: string) =>
    selesai.find((s) => s.loketId === loketId)?._count._all ?? 0;
  const namaPenjaga = (loketId: string) =>
    penjaga.find((p) => p.loketId === loketId)?.nama ?? null;

  return (
    <>
      <Chrome />
      <main className="bungkus">
        <h1>Pilih loket</h1>
        <p className="samar mb-2">
          Masuk sebagai <strong>{sesi.nama}</strong> ({sesi.peran}). Buka meja
          yang kamu jaga hari ini — pilihanmu tercatat, jadi antrian tidak
          tertukar antar meja.
        </p>

        {sesi.loketId && (
          <div className="pesan pesan--info" role="status">
            Kamu sedang membuka sebuah loket.{" "}
            <Link href={`/loket/${sesi.loketId}`}>Lanjut ke panel loket</Link> —
            atau buka loket lain di bawah (loket lama otomatis dilepas).
          </div>
        )}

        {loket.length === 0 ? (
          <div className="kartu">
            <p className="kosong__judul">Belum ada loket aktif</p>
            <p className="samar mb-0">
              Minta admin menambahkan loket di halaman Admin.
            </p>
          </div>
        ) : (
          <div className="kisi kisi--3">
            {loket.map((l) => (
              <TombolBukaLoket
                key={l.id}
                loketId={l.id}
                nama={l.nama}
                layanan={`${l.layanan.kode} — ${l.layanan.nama}`}
                menunggu={hitungMenunggu(l.layananId)}
                selesai={hitungSelesai(l.id)}
                sedangDipakai={
                  namaPenjaga(l.id) !== null && namaPenjaga(l.id) !== sesi.nama
                }
              />
            ))}
          </div>
        )}

        {loket.some((l) => namaPenjaga(l.id) && namaPenjaga(l.id) !== sesi.nama) && (
          <div className="pesan pesan--info mt-2">
            Loket bertanda <strong>sedang dibuka</strong> dipegang petugas lain.
            Kamu tetap bisa membukanya, tapi yang bersangkutan akan kehilangan
            mejanya — jadi lebih baik bicarakan dulu.
          </div>
        )}

        <p className="kecil samar mt-2">
          Layar display ruang tunggu: <Link href="/display">/display</Link>
        </p>
      </main>
    </>
  );
}
