import Link from "next/link";
import { sesiSekarang } from "@/lib/sesi";
import { TombolKeluar } from "./TombolKeluar";
import { Ikon } from "./Ikon";

// Kepala halaman. Komponen SERVER karena ia membaca sesi dari database —
// jadi kewenangan yang ditampilkan selalu yang berlaku saat itu, bukan
// yang tersimpan di cookie.
//
// Ikon ditulis sebelum teksnya, dan sengaja dibuat aria-hidden di dalam
// komponen Ikon: yang dibaca pembaca layar cukup "Ambil nomor", bukan
// "gambar tiket Ambil nomor".
export async function Chrome() {
  const sesi = await sesiSekarang();

  return (
    <header className="kepala">
      <Link href="/" className="kepala__merek">
        <Ikon nama="antre" ukuran={22} />
        Antri<span>ku</span>
      </Link>

      <nav className="kepala__nav">
        <Link href="/">
          <span className="ikon-teks">
            <Ikon nama="tiket" ukuran={17} />
            Ambil nomor
          </span>
        </Link>
        <Link href="/display">
          <span className="ikon-teks">
            <Ikon nama="layar" ukuran={17} />
            Display
          </span>
        </Link>
        {sesi ? (
          <>
            <Link href="/loket">
              <span className="ikon-teks">
                <Ikon nama="meja" ukuran={17} />
                Loket
              </span>
            </Link>
            {sesi.peran === "admin" && (
              <Link href="/admin">
                <span className="ikon-teks">
                  <Ikon nama="perisai" ukuran={17} />
                  Admin
                </span>
              </Link>
            )}
            <TombolKeluar />
          </>
        ) : (
          <Link href="/masuk">
            <span className="ikon-teks">
              <Ikon nama="masuk" ukuran={17} />
              Masuk petugas
            </span>
          </Link>
        )}
      </nav>
    </header>
  );
}
