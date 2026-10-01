// KosProof — data & logika kesepakatan dua pihak (prototype, tersimpan di browser)

export type Party = {
  nama: string;
  telepon: string;
  nik: string;
};

export type AgreementStatus = "menunggu" | "aktif" | "ditolak";

export type Agreement = {
  id: string;
  kode: string;
  pemilik: Party;
  penyewa: Party;
  kamar: {
    namaKos: string;
    alamat: string;
    nomorKamar: string;
  };
  hargaPerBulan: number;
  deposit: number;
  tanggalMulai: string;
  durasiBulan: number;
  aturan: string;
  dibuatPada: string;
  hash: string;
  konfirmasiPemilik: string | null;
  konfirmasiPenyewa: string | null;
  status: AgreementStatus;
};

const KEY = "kosproof_agreements_v1";

export function loadAgreements(): Agreement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Agreement[]) : [];
  } catch {
    return [];
  }
}

export function saveAgreements(list: Agreement[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAgreement(id: string): Agreement | null {
  return loadAgreements().find((a) => a.id === id) ?? null;
}

export function upsertAgreement(a: Agreement) {
  const list = loadAgreements();
  const i = list.findIndex((x) => x.id === a.id);
  if (i >= 0) list[i] = a;
  else list.unshift(a);
  saveAgreements(list);
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function makeKode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `KP-${n}`;
}

// Sidik digital: SHA-256 dari seluruh isi kesepakatan (Web Crypto, aman di SSR)
export async function hashAgreement(a: Omit<Agreement, "hash" | "status" | "konfirmasiPemilik" | "konfirmasiPenyewa">): Promise<string> {
  const payload = JSON.stringify(a);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function statusLabel(s: AgreementStatus) {
  if (s === "aktif") return "Aktif — disepakati kedua pihak";
  if (s === "ditolak") return "Ditolak";
  return "Menunggu konfirmasi";
}
