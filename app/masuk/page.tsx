import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { Chrome } from "../components/Chrome";
import { FormMasuk } from "./FormMasuk";

export const dynamic = "force-dynamic";

export default async function HalamanMasuk() {
  // Sudah masuk? Tidak perlu melihat form lagi.
  const sesi = await sesiSekarang();
  if (sesi) redirect("/loket");

  return (
    <>
      <Chrome />
      <main className="bungkus bungkus--sempit">
        <h1>Masuk petugas</h1>
        <p className="samar mb-2">
          Halaman ini untuk petugas loket dan admin. Warga tidak perlu masuk
          untuk mengambil nomor antrian.
        </p>

        <div className="kartu kartu--tegas">
          <FormMasuk />
        </div>
      </main>
    </>
  );
}
