import Link from "next/link";
import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { Foto } from "../components/Foto";
import { Ikon } from "../components/Ikon";
import { FormMasuk } from "./FormMasuk";

export const dynamic = "force-dynamic";

// Halaman masuk dibuat tanpa kepala navigasi, dengan latar foto ruang
// tunggu. Alasannya: ini satu-satunya halaman yang tujuannya cuma satu —
// membuat orang masuk. Menu navigasi di atasnya justru mengundang orang
// keluar dari halaman ini sebelum sempat masuk.
//
// Latar fotonya sengaja diredupkan (opacity 0.32) dan kartunya dibuat pekat.
// Kartu setengah transparan di atas foto adalah cara paling umum membuat
// form jadi sulit dibaca: teks beradu dengan detail foto di belakangnya.
export default async function HalamanMasuk() {
  // Sudah masuk? Tidak perlu melihat form lagi.
  const sesi = await sesiSekarang();
  if (sesi) redirect("/loket");

  return (
    <main className="masuk-latar">
      <Foto slug="ruang-tunggu-klinik" lebar={1400} className="masuk-latar__gambar" prioritas />
      <div className="masuk-latar__isi">
        <div className="masuk-latar__kepala">
          <Link href="/" className="masuk-latar__merek">
            <Ikon nama="antre" ukuran={26} />
            Antri<span>ku</span>
          </Link>
          <p className="masuk-latar__ket">Panel petugas loket dan admin</p>
        </div>

        <div className="kartu kartu--tegas">
          <div className="kartu__judul">
            <h1>Masuk</h1>
            <p className="kecil samar mb-0">
              Khusus petugas loket dan admin.
            </p>
          </div>

          <div className="pita">
            <span className="pita__ikon">
              <Ikon nama="info" ukuran={18} />
            </span>
            <div>
              <p className="pita__judul">Warga tidak perlu masuk</p>
              <p className="pita__ket">
                Untuk mengambil nomor antrian, cukup buka halaman utama — tanpa
                akun.
              </p>
            </div>
          </div>

          <FormMasuk />
        </div>

        <p className="masuk-latar__ket mt-2">
          <Link href="/" style={{ color: "#c3d2e8" }}>
            ← Kembali ke halaman ambil nomor
          </Link>
        </p>
      </div>
    </main>
  );
}
