"use client";

import { useActionState } from "react";
import { masuk, type HasilAksi } from "@/app/actions/auth";
import { Ikon } from "@/app/components/Ikon";

const AWAL: HasilAksi = {};

export function FormMasuk() {
  const [hasil, kirim, sedang] = useActionState(masuk, AWAL);

  return (
    <form action={kirim} noValidate>
      {hasil.galat && (
        <p className="pesan pesan--galat" role="alert">
          {hasil.galat}
        </p>
      )}

      <div className="isian">
        <label htmlFor="email">
          <span className="ikon-teks">
            <Ikon nama="orang" ukuran={16} />
            Email
          </span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
        />
      </div>

      <div className="isian">
        <label htmlFor="kataSandi">
          <span className="ikon-teks">
            <Ikon nama="perisai" ukuran={16} />
            Kata sandi
          </span>
        </label>
        <input
          id="kataSandi"
          name="kataSandi"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="tombol tombol--penuh" disabled={sedang}>
        <span className="ikon-teks">
          <Ikon nama="masuk" ukuran={18} />
          {sedang ? "Memeriksa…" : "Masuk"}
        </span>
      </button>
    </form>
  );
}
