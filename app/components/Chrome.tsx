import Link from "next/link";
import { sesiSekarang } from "@/lib/sesi";
import { TombolKeluar } from "./TombolKeluar";

// Kepala halaman. Komponen SERVER karena ia membaca sesi dari database —
// jadi kewenangan yang ditampilkan selalu yang berlaku saat itu, bukan
// yang tersimpan di cookie.
export async function Chrome() {
  const sesi = await sesiSekarang();

  return (
    <header className="kepala">
      <Link href="/" className="kepala__merek">
        Antri<span>ku</span>
      </Link>

      <nav className="kepala__nav">
        <Link href="/">Ambil nomor</Link>
        <Link href="/display">Display</Link>
        {sesi ? (
          <>
            <Link href="/loket">Loket</Link>
            {sesi.peran === "admin" && <Link href="/admin">Admin</Link>}
            <TombolKeluar />
          </>
        ) : (
          <Link href="/masuk">Masuk petugas</Link>
        )}
      </nav>
    </header>
  );
}
