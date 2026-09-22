import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Batas ukuran untuk server action. Surat kadang perlu lampiran
  // (KK, KTP) yang difoto pakai HP dan bisa besar.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  // Jangan tampilkan "X-Powered-By: Next.js" — mengurangi informasi
  // yang bisa dipakai penyerang untuk menebak versi.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
