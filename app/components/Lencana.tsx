// Lencana status. Satu tempat untuk semua label status, supaya tidak ada
// halaman yang menulis "Dipanggil" dan halaman lain menulis "dipanggil".
//
// Warna diambil dari kelas di globals.css yang sudah dihitung rasio
// kontrasnya, bukan ditentukan di sini.

const LABEL: Record<string, string> = {
  menunggu: "Menunggu",
  dipanggil: "Dipanggil",
  dilayani: "Sedang dilayani",
  selesai: "Selesai",
  dilewati: "Dilewati",
  batal: "Dibatalkan",
};

export function Lencana({ status }: { status: string }) {
  const kelas = LABEL[status] ? status : "menunggu";
  return (
    <span className={`lencana lencana--${kelas}`}>
      {LABEL[status] ?? status}
    </span>
  );
}

export function LencanaPrioritas() {
  return <span className="lencana lencana--prioritas">Prioritas</span>;
}
