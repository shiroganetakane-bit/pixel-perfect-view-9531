import type { AgreementStatus, DepositStatus } from "./types";

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const formatTanggal = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export const formatWaktu = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export const DEPOSIT_LABEL: Record<DepositStatus, string> = {
  ditahan: "Ditahan",
  diajukan: "Diajukan potongan",
  disetujui: "Potongan disetujui",
  dikembalikan: "Dikembalikan",
};

export const STATUS_LABEL: Record<AgreementStatus, string> = {
  menunggu: "Menunggu persetujuan penyewa",
  aktif: "Aktif",
  ditolak: "Ditolak",
  selesai: "Selesai",
};
