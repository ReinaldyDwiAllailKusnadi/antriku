import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Antriku — Sistem Antrian Layanan",
  description:
    "Sistem antrian layanan publik dengan display panggilan real-time, dua deret nomor (biasa dan prioritas), dan penomoran yang tahan permintaan bersamaan.",
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
