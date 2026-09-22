"use client";

// Tombol keluar.
//
// Kenapa file terpisah dan bukan langsung di Chrome.tsx? Karena
// Chrome.tsx adalah komponen SERVER (ia membaca sesi dari database),
// sementara useFormStatus hanya bisa dipakai di komponen KLIEN.
// Menyatukannya membuat build gagal dengan galat yang membingungkan.

import { useFormStatus } from "react-dom";
import { keluar } from "@/app/actions/auth";

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Keluar…" : "Keluar"}
    </button>
  );
}

export function TombolKeluar() {
  // Keluar adalah TINDAKAN yang mengubah keadaan (menghapus sesi), bukan
  // sekadar pindah halaman. Karena itu ia <form> + Server Action, bukan
  // <a href="/keluar">. Kalau berupa tautan, ia bisa terpicu oleh apa pun
  // yang bisa memuat URL — termasuk tag gambar di halaman lain.
  return (
    <form action={keluar}>
      <Tombol />
    </form>
  );
}
