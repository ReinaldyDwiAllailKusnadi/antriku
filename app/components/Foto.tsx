/**
 * Foto.tsx — pembungkus <img> dengan dua hal yang wajib ada:
 * ukuran cadangan (supaya tata letak tidak melompat) dan nisbah sisi terkunci.
 *
 * KENAPA `next/image` TIDAK DIPAKAI:
 *   `next/image` memerlukan pengoptimal gambar saat berjalan (sharp) dan
 *   menambah beban memori di server. VPS ini 1 vCPU / 961 MB dan sudah
 *   menjalankan empat situs. Karena berkasnya sudah disiapkan sebagai WebP
 *   dengan tiga ukuran di scripts/siapkan-gambar.mjs, <img> biasa dengan
 *   srcSet memberi hasil yang sama tanpa biaya memori tambahan.
 *
 * KENAPA width/height WAJIB:
 *   Tanpa itu browser tidak tahu ruang yang harus disediakan sebelum gambar
 *   selesai diunduh, sehingga isi halaman melompat turun saat gambar muncul.
 *   Itu penyebab nomor satu keluhan "halaman ini terasa goyang".
 */

import { FOTO, berkasFoto, srcSetFoto } from "@/lib/foto";

type Props = {
  slug: string;
  /** Ukuran yang dipakai di tata letak; jadi petunjuk lebar tampil. */
  lebar: 1400 | 900 | 480;
  /** Kelas untuk <img> — penentu potongan dan efek visual. */
  className?: string;
  /** Muat lebih dulu hanya untuk gambar utama di layar pertama. */
  prioritas?: boolean;
};

export function Foto({ slug, lebar, className, prioritas = false }: Props) {
  const data = FOTO[slug];
  if (!data) {
    // Sengaja melempar, bukan diam-diam memakai gambar lain.
    throw new Error(
      `Foto "${slug}" tidak terdaftar di lib/foto.ts. Tambahkan dulu supaya kreditnya ikut tercatat.`
    );
  }

  const tinggi = Math.round(lebar / data.rasio);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={berkasFoto(slug, lebar)}
      srcSet={srcSetFoto(slug)}
      sizes={
        lebar === 1400
          ? "(max-width: 760px) 100vw, 1080px"
          : lebar === 900
            ? "(max-width: 760px) 100vw, 520px"
            : "(max-width: 760px) 100vw, 340px"
      }
      width={lebar}
      height={tinggi}
      alt={data.alt}
      className={className}
      loading={prioritas ? "eager" : "lazy"}
      fetchPriority={prioritas ? "high" : "auto"}
      decoding="async"
    />
  );
}
