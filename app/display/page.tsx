import { dataDisplay } from "@/lib/antrian";
import { DisplayAntrian } from "./DisplayAntrian";

// Halaman display untuk TV ruang tunggu.
//
// Data pertama diambil di server supaya layar tidak pernah tampil kosong
// saat pertama dibuka — kalau menunggu polling pertama, akan ada jeda
// 2 detik dengan layar kosong yang terlihat seperti rusak.
export const dynamic = "force-dynamic";

export default async function HalamanDisplay() {
  const awal = await dataDisplay();
  return <DisplayAntrian awal={awal} />;
}
