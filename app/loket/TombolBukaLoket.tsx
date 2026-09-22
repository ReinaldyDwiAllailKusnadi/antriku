"use client";

// Tombol "Buka loket".
//
// Ini form + Server Action, bukan tautan ke /loket/[id]. Kenapa? Karena
// membuka loket mengubah data (mencatat di database bahwa petugas ini
// menjaga loket itu). Kalau hanya tautan, halaman panel bisa dibuka tanpa
// pernah mencatatnya — dan pemeriksaan loket di sisi server akan menolak
// setiap tindakan dengan pesan yang membingungkan.

import { useActionState } from "react";
import { bukaLoket, type HasilAksi } from "@/app/actions/antrian";
import { Ikon } from "@/app/components/Ikon";

const AWAL: HasilAksi = {};

export function TombolBukaLoket({
  loketId,
  nama,
  layanan,
  menunggu,
  selesai,
  sedangDipakai,
}: {
  loketId: string;
  nama: string;
  layanan: string;
  menunggu: number;
  selesai: number;
  sedangDipakai: boolean;
}) {
  const [hasil, kirim, sedang] = useActionState(bukaLoket, AWAL);

  return (
    <div className="kartu kartu--tegas">
      <div className="kartu__judul">
        <h2 className="mb-0">{nama}</h2>
        {sedangDipakai && (
          <span className="lencana lencana--dilayani">Sedang dibuka</span>
        )}
      </div>
      <p className="samar kecil mb-2">{layanan}</p>
      <p className="kecil mb-2">
        <strong>{menunggu}</strong> menunggu · <strong>{selesai}</strong> selesai
      </p>

      {hasil.galat && (
        <p className="pesan pesan--galat" role="alert">
          {hasil.galat}
        </p>
      )}

      <form action={kirim}>
        <input type="hidden" name="loketId" value={loketId} />
        <button className="tombol tombol--penuh" disabled={sedang}>
          <span className="ikon-teks">
            <Ikon nama="masuk" ukuran={18} />
            {sedang ? "Membuka…" : "Buka loket ini"}
          </span>
        </button>
      </form>
    </div>
  );
}
