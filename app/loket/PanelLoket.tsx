"use client";

// Panel kendali satu loket.
//
// Perhatikan pola state di bawah: `hasil` dari useActionState dipakai
// untuk MENAMPILKAN pesan, bukan untuk menyimpan nomor yang sedang
// dilayani. Nomor yang sedang dilayani selalu datang dari data server
// (prop), supaya tidak mungkin tampilan dan database berbeda.

import { useActionState, useEffect, useRef } from "react";
import {
  panggil,
  ubahStatus,
  type HasilAksi,
} from "@/app/actions/antrian";
import { Lencana, LencanaPrioritas } from "@/app/components/Lencana";
import { Ikon } from "@/app/components/Ikon";

const AWAL: HasilAksi = {};

type AntrianAktif = {
  id: string;
  kode: string;
  jenis: string;
  nama: string | null;
  catatan: string | null;
  status: string;
};

type Menunggu = {
  id: string;
  kode: string;
  jenis: string;
  nama: string | null;
};

export function PanelLoket({
  loketId,
  loketNama,
  layananNama,
  aktif,
  daftarMenunggu,
  berikutnya,
  jumlahDilayani,
}: {
  loketId: string;
  loketNama: string;
  layananNama: string;
  aktif: AntrianAktif | null;
  daftarMenunggu: Menunggu[];
  berikutnya: { kode: string; jenis: string } | null;
  jumlahDilayani: number;
}) {
  const [hasilPanggil, kirimPanggil, sedangPanggil] = useActionState(panggil, AWAL);
  const [hasilStatus, kirimStatus, sedangStatus] = useActionState(ubahStatus, AWAL);

  // Kotak nomor diberi sorotan sebentar setiap kali nomor yang dilayani
  // berubah. Petugas sering mengalihkan pandangan ke orang di depannya,
  // jadi perubahan nomor harus terlihat tanpa harus dicari.
  const kodeAktif = aktif?.kode ?? "";
  const sebelumnya = useRef(kodeAktif);
  const kotak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sebelumnya.current !== kodeAktif && kotak.current) {
      kotak.current.animate(
        [
          { backgroundColor: "rgba(251, 191, 36, 0.35)" },
          { backgroundColor: "transparent" },
        ],
        { duration: 1400, easing: "ease-out" },
      );
    }
    sebelumnya.current = kodeAktif;
  }, [kodeAktif]);

  const galat = hasilPanggil.galat ?? hasilStatus.galat;
  const pesan = hasilPanggil.pesan ?? hasilStatus.pesan;

  return (
    <>
      <div className="kartu__judul">
        <div>
          <h1 className="mb-0">{loketNama}</h1>
          <p className="samar mb-0">
            Melayani <strong>{layananNama}</strong> · {jumlahDilayani} nomor
            selesai hari ini
          </p>
        </div>
      </div>

      {galat && (
        <p className="pesan pesan--galat" role="alert">
          {galat}
        </p>
      )}
      {pesan && !galat && (
        <p className="pesan pesan--berhasil" role="status">
          {pesan}
        </p>
      )}

      <div className="loket-sekarang" ref={kotak}>
        {aktif ? (
          <>
            <p className="samar kecil mb-0">Sedang ditangani</p>
            <p className="loket-sekarang__kode mono">{aktif.kode}</p>
            <p className="loket-sekarang__nama">
              {aktif.nama ?? "Tanpa nama"}
              {aktif.jenis === "prioritas" && " · "}
              {aktif.jenis === "prioritas" && <LencanaPrioritas />}
            </p>
            {aktif.catatan && (
              <p className="kecil samar mb-0">Catatan: {aktif.catatan}</p>
            )}
            <p className="mb-1">
              <Lencana status={aktif.status} />
            </p>

            <div className="baris-tombol" style={{ justifyContent: "center" }}>
              {aktif.status === "dipanggil" && (
                <>
                  <form action={kirimStatus}>
                    <input type="hidden" name="antrianId" value={aktif.id} />
                    <input type="hidden" name="loketId" value={loketId} />
                    <input type="hidden" name="aksi" value="mulai" />
                    <button className="tombol" disabled={sedangStatus}>
                      <span className="ikon-teks">
                        <Ikon nama="centang" ukuran={17} />
                        Mulai layani
                      </span>
                    </button>
                  </form>
                  <form action={kirimStatus}>
                    <input type="hidden" name="antrianId" value={aktif.id} />
                    <input type="hidden" name="loketId" value={loketId} />
                    <input type="hidden" name="aksi" value="panggil_ulang" />
                    <button className="tombol tombol--putih" disabled={sedangStatus}>
                      <span className="ikon-teks">
                        <Ikon nama="lonceng" ukuran={17} />
                        Panggil ulang
                      </span>
                    </button>
                  </form>
                  <form action={kirimStatus}>
                    <input type="hidden" name="antrianId" value={aktif.id} />
                    <input type="hidden" name="loketId" value={loketId} />
                    <input type="hidden" name="aksi" value="lewati" />
                    <button className="tombol tombol--putih" disabled={sedangStatus}>
                      <span className="ikon-teks">
                        <Ikon nama="keluar" ukuran={17} />
                        Tidak hadir
                      </span>
                    </button>
                  </form>
                </>
              )}
              {aktif.status === "dilayani" && (
                <form action={kirimStatus}>
                  <input type="hidden" name="antrianId" value={aktif.id} />
                  <input type="hidden" name="loketId" value={loketId} />
                  <input type="hidden" name="aksi" value="selesai" />
                  <button className="tombol tombol--hijau" disabled={sedangStatus}>
                    <span className="ikon-teks">
                      <Ikon nama="centang" ukuran={17} />
                      Selesai
                    </span>
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="loket-sekarang__kosong">
              Belum ada nomor yang ditangani
            </p>
            <p className="kecil samar mb-0">
              {berikutnya
                ? `Berikutnya: ${berikutnya.kode}`
                : "Tidak ada antrian yang menunggu."}
            </p>
          </>
        )}
      </div>

      <form action={kirimPanggil}>
        <input type="hidden" name="loketId" value={loketId} />
        <button
          className="tombol tombol--penuh tombol--besar"
          disabled={sedangPanggil || Boolean(aktif)}
        >
          <span className="ikon-teks">
            <Ikon nama="lonceng" ukuran={19} />
            {sedangPanggil ? "Memanggil…" : "Panggil nomor berikutnya"}
          </span>
        </button>
      </form>

      {aktif && (
        <p className="kecil samar tengah mt-2">
          Selesaikan nomor yang sedang ditangani sebelum memanggil berikutnya.
        </p>
      )}

      <div className="kartu mt-2">
        <div className="kartu__judul">
          <h2 className="mb-0">Menunggu giliran ({daftarMenunggu.length})</h2>
        </div>
        {daftarMenunggu.length === 0 ? (
          <p className="samar mb-0">Tidak ada yang menunggu.</p>
        ) : (
          <div className="tabel-bungkus">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Nama</th>
                  <th>Jenis</th>
                </tr>
              </thead>
              <tbody>
                {daftarMenunggu.map((m) => (
                  <tr key={m.id}>
                    <td className="mono tebal">{m.kode}</td>
                    <td>{m.nama ?? "—"}</td>
                    <td>
                      {m.jenis === "prioritas" ? <LencanaPrioritas /> : "Biasa"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
