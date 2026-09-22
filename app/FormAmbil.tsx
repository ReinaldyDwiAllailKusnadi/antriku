"use client";

import { useActionState, useState } from "react";
import { ambil, type HasilAksi } from "@/app/actions/antrian";
import { Ikon } from "./components/Ikon";

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
        <div className="kartu__judul">
          <h2 className="mb-0">Nomor antrianmu</h2>
        </div>
        <p className="nomor-besar mono">{hasil.kode}</p>
        <p className="mb-2">{hasil.pesan}</p>
        <p className="kecil samar mb-0">
          Nomor ini juga tampil di layar ruang tunggu. Simpan halaman ini atau
          catat nomormu.
        </p>
        <div className="baris-tombol mt-2" style={{ justifyContent: "center" }}>
          <a className="tombol tombol--putih" href="/display">
            <span className="ikon-teks">
              <Ikon nama="layar" ukuran={18} />
              Lihat layar antrian
            </span>
          </a>
          <a className="tombol tombol--putih" href="/">
            <span className="ikon-teks">
              <Ikon nama="tiket" ukuran={18} />
              Ambil nomor lagi
            </span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="kartu kartu--tegas">
      <div className="kartu__judul">
        <h2>Ambil nomor antrian</h2>
        <p className="kecil samar mb-0">
          Pilih layanan yang kamu butuhkan. Nomor langsung terbit dan muncul di
          layar ruang tunggu.
        </p>
      </div>
      <form action={kirim} noValidate>
      {hasil.galat && (
        <p className="pesan pesan--galat" role="alert">
          {hasil.galat}
        </p>
      )}

      <div className="isian">
        <label>
          <span className="ikon-teks">
            <Ikon nama="daftar" ukuran={16} />
            Pilih layanan
          </span>
        </label>
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
        <label>
          <span className="ikon-teks">
            <Ikon nama="orang" ukuran={16} />
            Jenis antrian
          </span>
        </label>
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
          <label htmlFor="catatan">
            <span className="ikon-teks">
              <Ikon nama="info" ukuran={16} />
              Alasan prioritas
            </span>
          </label>
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
        <label htmlFor="nama">
          <span className="ikon-teks">
            <Ikon nama="orang" ukuran={16} />
            Nama (boleh dikosongkan)
          </span>
        </label>
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
        <span className="ikon-teks">
          <Ikon nama="tiket" ukuran={19} />
          {sedang ? "Mengambil nomor…" : "Ambil nomor antrian"}
        </span>
      </button>
      </form>
    </div>
  );
}
