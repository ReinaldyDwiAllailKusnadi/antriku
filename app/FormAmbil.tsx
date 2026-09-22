"use client";

import { useActionState, useState } from "react";
import { ambil, type HasilAksi } from "@/app/actions/antrian";

const AWAL: HasilAksi = {};

type Layanan = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
};

export function FormAmbil({ layanan }: { layanan: Layanan[] }) {
  const [hasil, kirim, sedang] = useActionState(ambil, AWAL);
  const [jenis, setJenis] = useState("biasa");

  // Kalau nomor sudah didapat, form diganti kartu nomor. Orang yang
  // memegang nomornya tidak perlu mengisi form lagi — dan tidak sengaja
  // mengambil nomor kedua karena menekan tombol dua kali.
  if (hasil.kode) {
    return (
      <div className="kartu kartu--tegas tengah">
        <p className="samar kecil mb-0">Nomor antrianmu</p>
        <p className="nomor-besar mono">{hasil.kode}</p>
        <p className="mb-2">{hasil.pesan}</p>
        <p className="kecil samar mb-0">
          Nomor ini juga tampil di layar ruang tunggu. Simpan halaman ini atau
          catat nomormu.
        </p>
        <div className="baris-tombol mt-2" style={{ justifyContent: "center" }}>
          <a className="tombol tombol--putih" href="/display">
            Lihat layar antrian
          </a>
          <a className="tombol tombol--putih" href="/">
            Ambil nomor lagi
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={kirim} noValidate>
      {hasil.galat && (
        <p className="pesan pesan--galat" role="alert">
          {hasil.galat}
        </p>
      )}

      <div className="isian">
        <label>Pilih layanan</label>
        <div className="pilihan-layanan">
          {layanan.map((l) => (
            <label key={l.id} className="pilihan">
              <input
                type="radio"
                name="layananId"
                value={l.id}
                required
                defaultChecked={layanan.length === 1}
              />
              <span>
                <span className="pilihan__nama">
                  <span className="mono">{l.kode}</span> — {l.nama}
                </span>
                {l.deskripsi && (
                  <span className="pilihan__ket" style={{ display: "block" }}>
                    {l.deskripsi}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
        {layanan.length === 0 && (
          <p className="isian__petunjuk isian__petunjuk--galat">
            Belum ada layanan yang dibuka hari ini.
          </p>
        )}
      </div>

      <div className="isian">
        <label>Jenis antrian</label>
        <div className="pilihan-layanan">
          <label className="pilihan">
            <input
              type="radio"
              name="jenis"
              value="biasa"
              checked={jenis === "biasa"}
              onChange={() => setJenis("biasa")}
            />
            <span>
              <span className="pilihan__nama">Biasa</span>
              <span className="pilihan__ket" style={{ display: "block" }}>
                Untuk keperluan umum.
              </span>
            </span>
          </label>
          <label className="pilihan">
            <input
              type="radio"
              name="jenis"
              value="prioritas"
              checked={jenis === "prioritas"}
              onChange={() => setJenis("prioritas")}
            />
            <span>
              <span className="pilihan__nama">Prioritas</span>
              <span className="pilihan__ket" style={{ display: "block" }}>
                Lansia, ibu hamil, penyandang disabilitas, atau kondisi darurat.
                Dilayani lebih cepat, tetapi tetap bergantian dengan antrian biasa.
              </span>
            </span>
          </label>
        </div>
      </div>

      {jenis === "prioritas" && (
        <div className="isian">
          <label htmlFor="catatan">Alasan prioritas</label>
          <input
            id="catatan"
            name="catatan"
            type="text"
            required
            maxLength={80}
            placeholder="Contoh: lansia, memakai kursi roda"
          />
          <p className="isian__petunjuk">
            Wajib diisi. Antrian prioritas tanpa alasan tercatat tidak bisa
            dipertanggungjawabkan.
          </p>
        </div>
      )}

      <div className="isian">
        <label htmlFor="nama">Nama (boleh dikosongkan)</label>
        <input id="nama" name="nama" type="text" maxLength={60} />
        <p className="isian__petunjuk">
          Dipakai petugas untuk memanggil kalau nomor terlewat.
        </p>
      </div>

      <button
        type="submit"
        className="tombol tombol--penuh tombol--besar"
        disabled={sedang || layanan.length === 0}
      >
        {sedang ? "Mengambil nomor…" : "Ambil nomor antrian"}
      </button>
    </form>
  );
}
