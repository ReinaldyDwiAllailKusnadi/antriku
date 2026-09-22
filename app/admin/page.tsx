import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { wajibPeran } from "@/lib/sesi";
import { tanggalHariIni } from "@/lib/antrian";
import { Chrome } from "../components/Chrome";

// Ringkasan operasional hari ini.
//
// Halaman ini menjawab satu pertanyaan yang tidak bisa dijawab layar
// display: "antrian hari ini sehat atau tidak?" Display hanya menunjukkan
// nomor yang sedang dipanggil — ia tidak akan pernah menunjukkan bahwa
// 40% orang tidak hadir, atau bahwa satu layanan menumpuk sementara
// loketnya kosong.

export const dynamic = "force-dynamic";

export default async function HalamanAdmin() {
  await wajibPeran("admin");
  const tanggal = tanggalHariIni();

  const [hitung, perLayanan, perLoket, terlama] = await Promise.all([
    prisma.antrian.groupBy({
      by: ["status"],
      where: { tanggal },
      _count: { _all: true },
    }),
    prisma.layanan.findMany({
      where: { aktif: true },
      orderBy: { urutan: "asc" },
      select: { id: true, kode: true, nama: true },
    }),
    prisma.loket.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, layanan: { select: { nama: true } } },
    }),
    // Nomor yang paling lama menunggu — inilah yang sering luput
    // diperhatikan, padahal dari sini keluhan berasal.
    prisma.antrian.findFirst({
      where: { tanggal, status: "menunggu" },
      orderBy: { dibuatPada: "asc" },
      select: { kode: true, dibuatPada: true, layanan: { select: { nama: true } } },
    }),
  ]);

  const ambil = (s: string) => hitung.find((h) => h.status === s)?._count._all ?? 0;
  const total = hitung.reduce((n, h) => n + h._count._all, 0);
  const selesai = ambil("selesai");
  const dilewati = ambil("dilewati");

  const perLayananHitung = await prisma.antrian.groupBy({
    by: ["layananId", "status"],
    where: { tanggal },
    _count: { _all: true },
  });
  const hitungLayanan = (layananId: string, status: string) =>
    perLayananHitung.find(
      (p) => p.layananId === layananId && p.status === status,
    )?._count._all ?? 0;

  const perLoketHitung = await prisma.antrian.groupBy({
    by: ["loketId"],
    where: { tanggal, status: { in: ["selesai", "dilewati"] } },
    _count: { _all: true },
  });
  const hitungLoket = (loketId: string) =>
    perLoketHitung.find((p) => p.loketId === loketId)?._count._all ?? 0;

  const persenHadir = total > 0 ? Math.round((selesai / total) * 100) : 0;
  const menitTunggu = terlama
    ? Math.round((Date.now() - terlama.dibuatPada.getTime()) / 60000)
    : 0;

  return (
    <>
      <Chrome />
      <main className="bungkus">
        <h1>Ringkasan hari ini</h1>
        <p className="samar mb-2">
          Tanggal {tanggal}. Angka di bawah dihitung dari data antrian, bukan
          dari catatan terpisah.
        </p>

        <div className="kisi kisi--4 mb-2">
          <div className="angka">
            <div className="angka__nilai">{total}</div>
            <div className="angka__label">Nomor terbit</div>
          </div>
          <div className="angka">
            <div className="angka__nilai">{selesai}</div>
            <div className="angka__label">Selesai dilayani</div>
          </div>
          <div className="angka">
            <div className="angka__nilai">{ambil("menunggu")}</div>
            <div className="angka__label">Masih menunggu</div>
          </div>
          <div className="angka">
            <div className="angka__nilai">{persenHadir}%</div>
            <div className="angka__label">Tingkat penyelesaian</div>
          </div>
        </div>

        {(dilewati > 0 || menitTunggu > 45) && (
          <div className="pesan pesan--info" role="status">
            {dilewati > 0 && (
              <>
                <strong>{dilewati}</strong> nomor tidak hadir saat dipanggil.{" "}
              </>
            )}
            {menitTunggu > 45 && terlama && (
              <>
                Nomor <strong>{terlama.kode}</strong> ({terlama.layanan.nama})
                sudah menunggu <strong>{menitTunggu} menit</strong> — pertimbangkan
                menambah loket untuk layanan itu.
              </>
            )}
          </div>
        )}

        <div className="kartu">
          <div className="kartu__judul">
            <h2 className="mb-0">Per layanan</h2>
          </div>
          <div className="tabel-bungkus">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Layanan</th>
                  <th>Menunggu</th>
                  <th>Dipanggil</th>
                  <th>Selesai</th>
                  <th>Tidak hadir</th>
                </tr>
              </thead>
              <tbody>
                {perLayanan.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="mono">{l.kode}</span> — {l.nama}
                    </td>
                    <td className="mono">{hitungLayanan(l.id, "menunggu")}</td>
                    <td className="mono">
                      {hitungLayanan(l.id, "dipanggil") +
                        hitungLayanan(l.id, "dilayani")}
                    </td>
                    <td className="mono">{hitungLayanan(l.id, "selesai")}</td>
                    <td className="mono">{hitungLayanan(l.id, "dilewati")}</td>
                  </tr>
                ))}
                {perLayanan.length === 0 && (
                  <tr>
                    <td colSpan={5} className="samar">
                      Belum ada layanan aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="kartu">
          <div className="kartu__judul">
            <h2 className="mb-0">Per loket</h2>
          </div>
          <div className="tabel-bungkus">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Loket</th>
                  <th>Layanan</th>
                  <th>Nomor tuntas</th>
                </tr>
              </thead>
              <tbody>
                {perLoket.map((l) => (
                  <tr key={l.id}>
                    <td className="tebal">{l.nama}</td>
                    <td>{l.layanan.nama}</td>
                    <td className="mono">{hitungLoket(l.id)}</td>
                  </tr>
                ))}
                {perLoket.length === 0 && (
                  <tr>
                    <td colSpan={3} className="samar">
                      Belum ada loket aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="kecil samar">
          <Link href="/display">Buka layar display</Link> ·{" "}
          <Link href="/loket">Panel loket</Link>
        </p>
      </main>
    </>
  );
}
