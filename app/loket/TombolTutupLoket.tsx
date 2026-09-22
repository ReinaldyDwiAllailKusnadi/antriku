"use client";

import { useFormStatus } from "react-dom";
import { tutupLoket } from "@/app/actions/antrian";
import { Ikon } from "@/app/components/Ikon";

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button className="tombol tombol--putih tombol--penuh" disabled={pending}>
      <span className="ikon-teks">
        <Ikon nama="keluar" ukuran={18} />
        {pending ? "Menutup…" : "Tutup loket & ganti meja"}
      </span>
    </button>
  );
}

export function TombolTutupLoket() {
  // Form + Server Action, bukan tautan — menutup loket mengubah data
  // (melepas loket dari petugas di database).
  return (
    <form action={tutupLoket}>
      <Tombol />
    </form>
  );
}
