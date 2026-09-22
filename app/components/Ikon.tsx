/**
 * Ikon.tsx — satu set ikon garis, satu gaya.
 *
 * KENAPA TIDAK EMOJI:
 *   Emoji digambar oleh font sistem, jadi tampilannya beda-beda di tiap
 *   perangkat (Windows, Android, iOS, Linux semuanya beda), ukurannya tidak
 *   bisa disejajarkan dengan teks, dan warnanya tidak bisa diwarisi.
 *   Akibatnya baris menu terlihat berantakan tanpa alasan yang jelas.
 *
 *   Ikon di bawah ini semuanya:
 *     - viewBox 24x24, ketebalan garis 1.75, ujung membulat
 *     - memakai `currentColor`, jadi otomatis ikut warna teks di sekitarnya
 *     - `aria-hidden` karena teks di sebelahnya sudah menjelaskan maksudnya;
 *       pembaca layar tidak perlu mendengar "gambar ikon tiket".
 *
 * Komponen ini server component: tidak ada state, tidak perlu "use client".
 */

type Props = {
  nama: NamaIkon;
  ukuran?: number;
  className?: string;
};

export type NamaIkon =
  | "tiket"
  | "layar"
  | "meja"
  | "perisai"
  | "masuk"
  | "keluar"
  | "panah"
  | "centang"
  | "jam"
  | "orang"
  | "lonceng"
  | "daftar"
  | "info"
  | "antre"
  | "prioritas";

const JALUR: Record<NamaIkon, React.ReactNode> = {
  // Tiket berobek — lambang "ambil nomor"
  tiket: (
    <>
      <path d="M4 8.5V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3.5a2.5 2.5 0 0 0 0-5Z" />
      <path d="M12 9.5v5" strokeDasharray="2 2.5" />
    </>
  ),
  // Layar TV / monitor
  layar: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M9 21h6M12 17v4" />
    </>
  ),
  // Meja layanan dengan petugas di baliknya
  meja: (
    <>
      <path d="M3 10h18" />
      <path d="M4 10v9M20 10v9" />
      <path d="M12 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
      <path d="M7.5 10a4.5 4.5 0 0 1 9 0" />
    </>
  ),
  // Perisai — kewenangan admin
  perisai: (
    <>
      <path d="M12 3 5 6v6c0 4 3 7.2 7 9 4-1.8 7-5 7-9V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8L15 10" />
    </>
  ),
  masuk: (
    <>
      <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </>
  ),
  keluar: (
    <>
      <path d="M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  panah: <path d="M5 12h14m-6-6 6 6-6 6" />,
  centang: <path d="m5 13 4.5 4.5L19 7" />,
  jam: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  orang: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  // Lonceng panggilan
  lonceng: (
    <>
      <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" />
      <path d="M10.5 20a2 2 0 0 0 3 0" />
    </>
  ),
  daftar: (
    <>
      <path d="M8 6h11M8 12h11M8 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  // Dua orang berbaris — lambang antrean
  antre: (
    <>
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="7" cy="16" r="2.5" />
      <path d="M12 7h8M12 16h8" />
    </>
  ),
  // Bintang — jalur prioritas
  prioritas: (
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8L12 3.5Z" />
  ),
};

export function Ikon({ nama, ukuran = 20, className }: Props) {
  return (
    <svg
      className={className}
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {JALUR[nama]}
    </svg>
  );
}
