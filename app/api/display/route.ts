import { NextResponse } from "next/server";
import { dataDisplay } from "@/lib/antrian";

// Endpoint data untuk layar display.
//
// Kenapa lewat rute ini dan bukan Server Action? Karena display memanggil
// berkala (tiap detik), dan Server Action selalu membawa serta seluruh
// muatan React Server Components-nya. Untuk data yang isinya angka dan
// daftar pendek, JSON biasa jauh lebih ringan — penting karena VPS ini
// hanya 1 vCPU dan layar display menyala sepanjang jam kerja.
//
// `no-store` wajib: tanpa itu, browser atau perantara bisa menyajikan
// jawaban lama, dan display akan tampak "macet" walaupun server sudah
// mengirim nomor baru.

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await dataDisplay();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    // Pesan galat teknis tidak dikirim ke layar. Display cukup tahu
    // bahwa pengambilan data gagal, lalu menampilkan penanda kecil.
    return NextResponse.json(
      { galat: "Gagal memuat data antrian." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
