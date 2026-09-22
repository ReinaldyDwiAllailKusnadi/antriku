"use client";

// Layar display antrian — dibuka di TV/monitor ruang tunggu.
//
// ============================================================
// CARA KERJA REAL-TIME-NYA (ini bagian yang paling penting)
// ============================================================
//
// Layar ini TIDAK memakai WebSocket, dan itu keputusan sadar.
//
// WebSocket butuh server yang menyimpan koneksi terbuka untuk setiap
// layar. Di VPS 1 vCPU / 961 MB yang sudah menjalankan 3 situs lain,
// itu berarti satu proses tambahan yang harus dijaga tetap hidup, plus
// cara menangani layar yang mati mendadak. Untuk data yang berubah
// beberapa kali per menit, itu terlalu mahal.
//
// Yang dipakai: polling ringan dengan PENANDA VERSI.
//
//   1. Tiap 2 detik, layar bertanya satu hal kecil: "versinya berapa?"
//      Jawabannya satu angka.
//   2. Kalau angkanya SAMA dengan yang dipegang layar, tidak terjadi
//      apa-apa. Tidak ada data yang diambil, tidak ada tampilan yang
//      digambar ulang.
//   3. Kalau angkanya BERBEDA, layar mengambil data lengkap dan
//      memperbarui tampilan.
//
// Artinya: saat kantor sepi dan tidak ada nomor baru, beban ke server
// hampir nol — padahal layar tetap menyala dan tetap reaktif begitu ada
// perubahan. Itu kompromi yang tepat untuk mesin sekecil ini.
//
// Kenapa tidak sekalian mengambil data lengkap tiap 2 detik? Karena
// dengan 3 layar display, itu 90 permintaan data lengkap per menit
// sepanjang hari — untuk data yang hampir selalu sama.

import { useCallback, useEffect, useRef, useState } from "react";

type DataDisplay = {
  versi: number;
  tanggal: string;
  sedangDipanggil: {
    kode: string;
    loket: string;
    layanan: string;
    dipanggilPada: string | null;
  }[];
  berikutnya: { layanan: string; kode: string; kodeLayanan: string }[];
  ringkasan: { total: number; menunggu: number; dilayani: number; dilewati: number };
};

const JEDA_POLLING_MS = 2000;

export function DisplayAntrian({ awal }: { awal: DataDisplay }) {
  const [data, setData] = useState<DataDisplay>(awal);
  const [tersambung, setTersambung] = useState(true);
  const [berkedip, setBerkedip] = useState(false);
  const [jam, setJam] = useState("");

  // Versi yang sedang dipegang layar. Disimpan di ref (bukan state)
  // supaya perubahan nilainya tidak memicu render ulang — nilai ini
  // hanya dipakai untuk membandingkan, tidak untuk ditampilkan.
  const versiRef = useRef(awal.versi);

  // Nomor yang terakhir terlihat, untuk mendeteksi nomor BARU supaya
  // bisa diberi animasi. Tanpa ini, seluruh kartu akan berkedip tiap
  // ada perubahan apa pun (termasuk perubahan yang tidak terlihat).
  const nomorSebelumnya = useRef<string>(
    awal.sedangDipanggil[0]?.kode ?? "",
  );

  const ambilData = useCallback(async () => {
    try {
      const res = await fetch("/api/display", { cache: "no-store" });
      if (!res.ok) throw new Error("gagal");
      const baru: DataDisplay = await res.json();

      // Hanya sentuh state kalau versinya memang berubah. Ini yang
      // membuat polling ini murah: tanpa perubahan, tidak ada render.
      if (baru.versi !== versiRef.current) {
        versiRef.current = baru.versi;

        const terdepan = baru.sedangDipanggil[0]?.kode ?? "";
        if (terdepan && terdepan !== nomorSebelumnya.current) {
          nomorSebelumnya.current = terdepan;
          setBerkedip(true);
          // Berkedip sebentar supaya mata di ruang tunggu tertuju ke
          // nomor baru. Durasinya sengaja pendek agar tidak mengganggu.
          window.setTimeout(() => setBerkedip(false), 2600);
        }

        setData(baru);
      }
      setTersambung(true);
    } catch {
      setTersambung(false);
    }
  }, []);

  // ---- Polling penanda versi ----
  useEffect(() => {
    const timer = window.setInterval(ambilData, JEDA_POLLING_MS);
    return () => window.clearInterval(timer);
  }, [ambilData]);

  // ---- Jam besar di sudut layar ----
  useEffect(() => {
    const tick = () =>
      setJam(
        new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        }).format(new Date()),
      );
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // ---- Bangunkan layar kalau sempat tertidur ----
  //
  // TV ruang tunggu sering masuk mode hemat daya dan berhenti menjalankan
  // timer. Begitu ada sentuhan atau layar kembali aktif, data langsung
  // diambil ulang supaya nomor yang tampil tidak tertinggal jauh.
  useEffect(() => {
    const saatAktif = () => {
      if (document.visibilityState === "visible") void ambilData();
    };
    document.addEventListener("visibilitychange", saatAktif);
    window.addEventListener("focus", saatAktif);
    return () => {
      document.removeEventListener("visibilitychange", saatAktif);
      window.removeEventListener("focus", saatAktif);
    };
  }, [ambilData]);

  const utama = data.sedangDipanggil[0];

  // Kelompokkan nomor yang menunggu per layanan, supaya orang bisa
  // melihat "nomor saya kira-kira kapan" tanpa harus bertanya ke petugas.
  const perLayanan = data.berikutnya.reduce<
    Record<string, { kode: string; kodeLayanan: string }[]>
  >((acc, b) => {
    (acc[b.layanan] ??= []).push({ kode: b.kode, kodeLayanan: b.kodeLayanan });
    return acc;
  }, {});

  return (
    <div className="display">
      <header className="display__kepala">
        <div>
          <p className="display__instansi">Kantor Pelayanan Terpadu</p>
          <h1 className="display__judul">Antrian Layanan</h1>
        </div>
        <div className="display__kanan">
          <p className="display__jam">{jam}</p>
          <p className="display__tanggal">{data.tanggal}</p>
          {!tersambung && (
            <p className="display__putus" role="status">
              Menyambung ulang…
            </p>
          )}
        </div>
      </header>

      <div className="display__utama">
        <div className={`display__panggilan ${berkedip ? "display__panggilan--baru" : ""}`}>
          {utama ? (
            <>
              <p className="display__label">Nomor dipanggil</p>
              <p className="display__nomor">{utama.kode}</p>
              <p className="display__loket">Silakan menuju {utama.loket}</p>
              <p className="display__layanan">{utama.layanan}</p>
            </>
          ) : (
            <>
              <p className="display__label">Nomor dipanggil</p>
              <p className="display__nomor display__nomor--kosong">—</p>
              <p className="display__loket">Belum ada panggilan</p>
            </>
          )}
        </div>

        <aside className="display__samping">
          <h2 className="display__subjudul">Sudah dipanggil</h2>
          <ul className="display__riwayat">
            {data.sedangDipanggil.slice(1).map((a) => (
              <li key={a.kode}>
                <span className="display__riwayat-kode">{a.kode}</span>
                <span className="display__riwayat-loket">{a.loket}</span>
              </li>
            ))}
            {data.sedangDipanggil.length <= 1 && (
              <li className="display__riwayat-kosong">—</li>
            )}
          </ul>

          <div className="display__statistik">
            <div>
              <span className="display__angka">{data.ringkasan.menunggu}</span>
              <span className="display__ket">menunggu</span>
            </div>
            <div>
              <span className="display__angka">{data.ringkasan.dilayani}</span>
              <span className="display__ket">dilayani</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="display__berikutnya">
        <h2 className="display__subjudul">Menunggu giliran</h2>
        <div className="display__kolom">
          {Object.entries(perLayanan).map(([layanan, daftar]) => (
            <div key={layanan} className="display__grup">
              <p className="display__grup-nama">{layanan}</p>
              <div className="display__deret">
                {daftar.slice(0, 6).map((b) => (
                  <span key={b.kode} className="display__kotak">
                    {b.kode}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(perLayanan).length === 0 && (
            <p className="display__riwayat-kosong">Tidak ada yang menunggu.</p>
          )}
        </div>
      </section>

      <footer className="display__kaki">
        <p>
          Mohon menunggu nomor dipanggil. Nomor yang terlewat silakan lapor ke
          petugas.
        </p>
      </footer>
    </div>
  );
}
