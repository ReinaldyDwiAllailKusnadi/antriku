/**
 * foto.ts — daftar foto yang dipakai di situs, lengkap dengan kreditnya.
 *
 * KENAPA DIJADIKAN DATA, BUKAN DITULIS LANGSUNG DI TSX:
 *   Foto berlisensi bebas tetap WAJIB dicantumkan sumber dan pemiliknya.
 *   Kalau kreditnya ditulis terpisah di tiap halaman, cepat atau lambat ada
 *   yang kelewat. Di sini kredit dan nama berkasnya berdampingan, jadi
 *   mustahil memakai foto tanpa membawa kreditnya.
 *
 * ATURAN PEMILIHAN (diukur, bukan ditebak):
 *   1. Hanya foto dari Wikimedia Commons — lisensinya jelas dan bisa
 *      diverifikasi publik.
 *   2. Judul berkas aslinya HARUS menyebut isi fotonya. Foto bernama
 *      "IMG_2043.jpg" tidak dipakai, karena tidak ada cara memastikan isinya
 *      tanpa melihatnya.
 *   3. Setiap foto diukur sebelum dipakai: dimensi, kecerahan, dan warna.
 *      Foto hitam-putih (saturasi ~0) dan foto gelap (luminansi < 60) ditolak
 *      karena tidak menyatu dengan tema terang situs ini.
 *
 * Ukuran berkas WebP dibuat oleh scripts/siapkan-gambar.mjs.
 */

export type Foto = {
  slug: string;
  /** Keterangan untuk atribut alt — dibaca pembaca layar, jadi harus berarti. */
  alt: string;
  /** Judul berkas asli di Wikimedia Commons. */
  judul: string;
  /** Nama pemilik karya. */
  penulis: string;
  /** Kode lisensi, mis. "CC BY-SA 4.0". */
  lisensi: string;
  /** Halaman sumber di Commons. */
  sumber: string;
  /** Nisbah sisi (lebar/tinggi) — dipakai untuk mencegah tata letak melompat. */
  rasio: number;
};

export const FOTO: Record<string, Foto> = {
  "meja-layanan": {
    slug: "meja-layanan",
    alt: "Meja resepsionis layanan dengan meja panjang dan kursi tunggu di depannya",
    judul: "Admin Reception.jpg",
    penulis: "N/A",
    lisensi: "CC BY-SA 4.0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:Admin_Reception.jpg",
    rasio: 1.78,
  },
  resepsionis: {
    slug: "resepsionis",
    alt: "Ruang resepsionis dengan meja layanan dan pencahayaan alami dari jendela",
    judul: "Reception - panoramio (8).jpg",
    penulis: "Panoramio",
    lisensi: "CC BY 3.0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:Reception_-_panoramio_(8).jpg",
    rasio: 1.5,
  },
  "ruang-tunggu": {
    slug: "ruang-tunggu",
    alt: "Ruang tunggu kantor dengan deretan kursi menghadap meja layanan",
    judul: "Doctor office waiting room.jpg",
    penulis: "N/A",
    lisensi: "CC0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:Doctor_office_waiting_room.jpg",
    rasio: 1.33,
  },
  "ruang-tunggu-klinik": {
    slug: "ruang-tunggu-klinik",
    alt: "Ruang tunggu layanan kesehatan dengan kursi tersusun rapi",
    judul:
      "A waiting room at a medical healthcare clinic, doctor's office, hospital.jpg",
    penulis: "N/A",
    lisensi: "CC BY 4.0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:A_waiting_room_at_a_medical_healthcare_clinic,_doctor%27s_office,_hospital.jpg",
    rasio: 1.33,
  },
  "ruang-tunggu-2": {
    slug: "ruang-tunggu-2",
    alt: "Sudut ruang tunggu dengan kursi dan meja kecil",
    judul: "Touro Waiting Room 5W.JPG",
    penulis: "N/A",
    lisensi: "CC BY-SA 3.0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:Touro_Waiting_Room_5W.JPG",
    rasio: 1.33,
  },
  "layar-real-time": {
    slug: "layar-real-time",
    alt: "Layar informasi digital di stasiun yang menampilkan jadwal secara langsung",
    judul: "LED real-time information display at a Rimini Metromare station.jpg",
    penulis: "N/A",
    lisensi: "CC BY-SA 4.0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:LED_real-time_information_display_at_a_Rimini_Metromare_station.jpg",
    rasio: 1.42,
  },
  "layar-peron": {
    slug: "layar-peron",
    alt: "Layar informasi penumpang di peron yang menampilkan keberangkatan berikutnya",
    judul:
      "Passenger information display on platform at Anzac Station, Melbourne.jpg",
    penulis: "N/A",
    lisensi: "CC BY-SA 2.0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:Passenger_information_display_on_platform_at_Anzac_Station,_Melbourne.jpg",
    rasio: 1.78,
  },
  "layar-stasiun": {
    slug: "layar-stasiun",
    alt: "Layar informasi elektronik besar di aula stasiun",
    judul: "Electronic signage of Huanggang West Station.jpg",
    penulis: "N/A",
    lisensi: "CC BY-SA 4.0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:Electronic_signage_of_Huanggang_West_Station.jpg",
    rasio: 1.33,
  },
  "layar-loket": {
    slug: "layar-loket",
    alt: "Layar informasi pelanggan yang menggantung di atas area layanan",
    judul: "Customer information display Liverpool L St.jpg",
    penulis: "N/A",
    lisensi: "CC BY-SA 3.0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:Customer_information_display_Liverpool_L_St.jpg",
    rasio: 1.33,
  },
  "layar-bandara": {
    slug: "layar-bandara",
    alt: "Layar informasi penerbangan dengan daftar keberangkatan berwarna",
    judul: "Flight information display system (FCO) in 2025.01.jpg",
    penulis: "N/A",
    lisensi: "CC0",
    sumber:
      "https://commons.wikimedia.org/wiki/File:Flight_information_display_system_(FCO)_in_2025.01.jpg",
    rasio: 1.33,
  },
};

/**
 * Ambil nama berkas WebP pada lebar tertentu.
 * Kalau berkasnya belum dibuat, ini akan gagal terlihat jelas di browser —
 * itu disengaja: lebih baik ketahuan daripada diam-diam memakai foto lain.
 */
export function berkasFoto(slug: string, lebar: 1400 | 900 | 480): string {
  return `/img/${slug}-${lebar}.webp`;
}

/** srcSet untuk <img>, supaya browser memilih ukuran paling hemat. */
export function srcSetFoto(slug: string): string {
  return [1400, 900, 480]
    .map((l) => `${berkasFoto(slug, l as 1400 | 900 | 480)} ${l}w`)
    .join(", ");
}
