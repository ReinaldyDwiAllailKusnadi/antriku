"use client";

import { useActionState } from "react";
import { masuk, type HasilAksi } from "@/app/actions/auth";

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
        <label htmlFor="email">Email</label>
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
        <label htmlFor="kataSandi">Kata sandi</label>
        <input
          id="kataSandi"
          name="kataSandi"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="tombol tombol--penuh" disabled={sedang}>
        {sedang ? "Memeriksa…" : "Masuk"}
      </button>
    </form>
  );
}
