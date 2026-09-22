import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Antriku — Sistem Antrian Layanan",
  description:
    "Sistem antrian layanan publik dengan display panggilan real-time, dua deret nomor (biasa dan prioritas), dan penomoran yang tahan permintaan bersamaan.",
};

// Favicon dipasang lewat file, bukan metadata.icons, supaya Next.js yang
// menyisipkan <link rel="icon"> dengan sendirinya. Sebelum ini situs sama
// sekali tidak punya favicon — di tab browser ia tampil sebagai halaman
// kosong tanpa tanda pengenal, dan itu bagian dari kesan "belum jadi".
//
// viewport-fit=cover dipakai agar latar halaman masuk mengisi sampai tepi
// layar ponsel berponi, bukan berhenti di area aman.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#0f2c52",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
