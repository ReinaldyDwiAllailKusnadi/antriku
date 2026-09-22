/**
 * Kredit.tsx — daftar sumber foto.
 *
 * Foto berlisensi bebas bukan berarti bebas dari kewajiban: CC BY dan CC BY-SA
 * mewajibkan pencantuman nama pemilik karya dan lisensinya. Halaman ini yang
 * memenuhi kewajiban itu, dan dibangun langsung dari lib/foto.ts supaya tidak
 * mungkin ada foto yang terpakai tapi kreditnya kelewat.
 */

import { FOTO } from "@/lib/foto";

export function Kredit() {
  const daftar = Object.values(FOTO);

  return (
    <section className="kredit">
      <div className="kredit__judul">Sumber foto</div>
      <p className="mb-1">
        Semua foto di situs ini berasal dari Wikimedia Commons dan dipakai
        sesuai lisensinya masing-masing. Tidak ada foto yang dibuat oleh AI.
      </p>
      <ul>
        {daftar.map((f) => (
          <li key={f.slug}>
            {f.judul} — {f.lisensi},{" "}
            <a href={f.sumber} target="_blank" rel="noopener noreferrer">
              halaman sumber
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
