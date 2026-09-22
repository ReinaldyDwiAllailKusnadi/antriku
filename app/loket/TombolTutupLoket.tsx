"use client";

import { useFormStatus } from "react-dom";
import { tutupLoket } from "@/app/actions/antrian";

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <button className="tombol tombol--putih tombol--penuh" disabled={pending}>
      {pending ? "Menutup…" : "Tutup loket & ganti meja"}
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
