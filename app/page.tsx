import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { tanggalHariIni } from "@/lib/antrian";
import { Chrome } from "./components/Chrome";
import { FormAmbil } from "./FormAmbil";
import { Foto } from "./components/Foto";
import { Ikon } from "./components/Ikon";
import { Kredit } from "./components/Kredit";

// Halaman publik: siapa saja boleh mengambil nomor tanpa punya akun.
// Ini disengaja — orang yang datang ke kantor tidak seharusnya diminta
// mendaftar dulu hanya untuk mendapat nomor antrian.
//
// Halaman ini dirombak setelah diukur: versi pertamanya 85 elemen dan 788
// karakter dengan NOL gambar. Halaman yang seluruhnya teks itulah yang
// terasa murah. Sekarang foto dan ikon yang mengisi ruang, bukan paragraf.

export const dynamic = "force-dynamic";

export default async function HalamanAmbilNomor() {
  const tanggal = tanggalHariIni();

  const [layanan, hitung] = await Promise.all([
    prisma.layanan.findMany({
      where: { aktif: true },
      orderBy: { urutan: "asc" },
      select: { id: true, kode: true, nama: true, deskripsi: true },
    }),
    prisma.antrian.groupBy({
      by: ["status"],
      where: { tanggal },
      _count: { _all: true },
    }),
  ]);

  const ambil = (s: string) => hitung.find((h) => h.status === s)?._count._all ?? 0;
  const menunggu = ambil("menunggu");
  const dilayani = ambil("dilayani") + ambil("selesai");
  const total = hitung.reduce((n, h) => n + h._count._all, 0);

  return (
    <>
      <Chrome />
      <main className="bungkus">
        {/* Hero: foto nyata meja layanan. Teks di atasnya diberi selubung
            gelap supaya kontrasnya tetap lolos, karena foto bisa punya
            bagian yang sangat terang. */}
        <section className="hero">
          <Foto slug="meja-layanan" lebar={1400} className="hero__gambar" prioritas />
          <div className="hero__selubung" aria-hidden="true" />
          <div className="hero__isi">
            <span className="hero__label">
              <Ikon nama="lonceng" ukuran={15} />
              Layanan antrian digital
            </span>
            <h1 className="hero__judul">
              Ambil nomor, lalu duduk menunggu dipanggil
            </h1>
            <p className="hero__ket">
              Nomor terbit seketika dan muncul sendiri di layar ruang tunggu.
              Tidak perlu berdiri mengantre di depan loket.
            </p>
          </div>
        </section>

        {total > 0 && (
          <div className="statistik">
            <div className="statistik__sel">
              <div className="statistik__nilai">{total}</div>
              <div className="statistik__label">nomor terbit hari ini</div>
            </div>
            <div className="statistik__sel">
              <div className="statistik__nilai">{menunggu}</div>
              <div className="statistik__label">sedang menunggu</div>
            </div>
            <div className="statistik__sel">
              <div className="statistik__nilai">{dilayani}</div>
              <div className="statistik__label">sudah dilayani</div>
            </div>
          </div>
        )}

        {/* Kartu pembungkus sengaja TIDAK di sini. Sebelumnya judul "Ambil
            nomor antrian" duduk di halaman ini dan FormAmbil mengembalikan
            kartunya sendiri — akibatnya, begitu nomor terbit, halaman masih
            menampilkan "Pilih layanan yang kamu butuhkan" di atas kartu
            nomor. Terlihat dari pengukuran teks halaman, bukan dari dugaan.
            Sekarang FormAmbil yang memiliki seluruh kartunya, sehingga ia
            bisa mengganti judul dan isinya sekaligus. */}
        <FormAmbil layanan={layanan} />

        <section className="bagian">
          <div className="bagian__judul">
            <span className="bagian__nomor">1</span>
            <h2>Begini alurnya</h2>
          </div>
          <p className="bagian__ket">
            Tiga langkah, tidak ada yang perlu dihafal.
          </p>

          <div className="kisi kisi--3">
            <div className="fitur">
              <Foto slug="ruang-tunggu" lebar={900} className="fitur__gambar" />
              <div className="fitur__isi">
                <span className="fitur__ikon">
                  <Ikon nama="tiket" ukuran={19} />
                </span>
                <h3 className="fitur__judul">Ambil nomor di sini</h3>
                <p className="fitur__ket">
                  Pilih layanan, tekan tombol, nomor langsung terbit. Tidak perlu
                  mendaftar akun.
                </p>
              </div>
            </div>

            <div className="fitur">
              <Foto slug="layar-peron" lebar={900} className="fitur__gambar" />
              <div className="fitur__isi">
                <span className="fitur__ikon">
                  <Ikon nama="layar" ukuran={19} />
                </span>
                <h3 className="fitur__judul">Pantau layar ruang tunggu</h3>
                <p className="fitur__ket">
                  Layar menampilkan nomor yang sedang dipanggil dan nomor
                  berikutnya, dan berubah sendiri setiap 2 detik.
                </p>
              </div>
            </div>

            <div className="fitur">
              <Foto slug="resepsionis" lebar={900} className="fitur__gambar" />
              <div className="fitur__isi">
                <span className="fitur__ikon">
                  <Ikon nama="meja" ukuran={19} />
                </span>
                <h3 className="fitur__judul">Menuju loket yang dipanggil</h3>
                <p className="fitur__ket">
                  Nomor yang dipanggil disertai nomor loketnya, jadi tidak ada
                  yang salah meja.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bagian">
          <div className="bagian__judul">
            <span className="bagian__nomor">2</span>
            <h2>Yang membedakan sistem ini</h2>
          </div>
          <p className="bagian__ket">
            Bukan sekadar nomor urut berjalan — ada dua hal yang biasanya
            terlewat.
          </p>

          <div className="kisi kisi--2">
            <div className="fitur">
              <Foto slug="layar-loket" lebar={900} className="fitur__gambar" />
              <div className="fitur__isi">
                <span className="fitur__ikon">
                  <Ikon nama="lonceng" ukuran={19} />
                </span>
                <h3 className="fitur__judul">Layar berubah sendiri</h3>
                <p className="fitur__ket">
                  Petugas menekan panggil di loket, dan layar ruang tunggu
                  bergerak tanpa ada yang menyentuhnya. Nomor yang baru
                  dipanggil berkedip supaya mata langsung tertuju ke sana.
                </p>
              </div>
            </div>

            <div className="fitur">
              <Foto slug="layar-stasiun" lebar={900} className="fitur__gambar" />
              <div className="fitur__isi">
                <span className="fitur__ikon">
                  <Ikon nama="prioritas" ukuran={19} />
                </span>
                <h3 className="fitur__judul">Jalur prioritas yang adil</h3>
                <p className="fitur__ket">
                  Nomor prioritas — lansia, ibu hamil, penyandang disabilitas —
                  dipanggil lebih dahulu, tapi tidak menghabiskan antrean orang
                  lain. Aturannya: dua nomor biasa dilayani untuk setiap satu
                  nomor prioritas.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bagian">
          <div className="bagian__judul">
            <span className="bagian__nomor">3</span>
            <h2>Untuk petugas loket</h2>
          </div>
          <p className="bagian__ket">
            Halaman ini hanya untuk petugas dan admin. Warga tidak perlu masuk.
          </p>

          <div className="langkah">
            <div className="langkah__butir">
              <span className="langkah__nomor">1</span>
              <div className="langkah__teks">
                <strong>Masuk</strong> dengan akun petugas.
              </div>
            </div>
            <div className="langkah__butir">
              <span className="langkah__nomor">2</span>
              <div className="langkah__teks">
                <strong>Buka loket</strong> yang kamu jaga hari ini.
              </div>
            </div>
            <div className="langkah__butir">
              <span className="langkah__nomor">3</span>
              <div className="langkah__teks">
                <strong>Panggil nomor</strong> berikutnya, lalu tandai selesai.
              </div>
            </div>
          </div>

          <p className="mt-2">
            <Link href="/masuk" className="tombol">
              <span className="ikon-teks">
                <Ikon nama="masuk" ukuran={18} />
                Masuk sebagai petugas
              </span>
            </Link>
          </p>
        </section>

        <Kredit />
      </main>
    </>
  );
}
