// Tipe data KosProof. Hanya hash, public key, status, dan waktu yang kelak dikirim ke blockchain;
// foto & catatan tetap off-chain.

export type Role = "pemilik" | "penyewa" | "verifikator";

export type AgreementStatus = "menunggu" | "aktif" | "ditolak" | "selesai";

export type DepositStatus = "ditahan" | "diajukan" | "disetujui" | "dikembalikan";

export const AREAS = ["kasur", "lemari", "kamar_mandi", "dinding"] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABEL: Record<Area, string> = {
  kasur: "Kasur",
  lemari: "Lemari",
  kamar_mandi: "Kamar mandi",
  dinding: "Dinding",
};

export type Fase = "checkin" | "checkout";

export type FotoBukti = {
  area: Area;
  hash: string; // SHA-256 dari file asli
  preview: string; // gambar terkompresi untuk tampilan (off-chain)
  catatan: string;
};

export type TandaTangan = { wallet: string; signature: string; waktu: string };

export type CatatanKondisi = {
  fotos: FotoBukti[];
  ringkasanHash: string; // hash dari gabungan hash foto
  dibuatOleh: string;
  waktu: string;
  tandaPemilik: TandaTangan | null;
  tandaPenyewa: TandaTangan | null;
};

export type Potongan = {
  jumlah: number;
  alasan: string;
  fotoHash: string;
  fotoPreview: string;
  diajukanPada: string;
};

export type AuditEvent = {
  id: string;
  aksi: string;
  wallet: string;
  waktu: string;
  hash: string;
  previousHash?: string;
  data?: unknown;
};

export type Agreement = {
  id: string;
  kode: string;
  ownerWallet: string;
  tenantWallet: string;
  namaKos: string;
  nomorKamar: string;
  mulai: string;
  selesai: string;
  deposit: number; // nominal dummy (Rupiah)
  dibuatPada: string;
  status: AgreementStatus;
  depositStatus: DepositStatus | null;
  potongan: Potongan | null;
  checkin: CatatanKondisi | null;
  checkout: CatatanKondisi | null;
  events: AuditEvent[];
};
