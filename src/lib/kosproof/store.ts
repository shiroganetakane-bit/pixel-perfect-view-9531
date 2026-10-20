// Lapisan service. Saat ini memakai localStorage; nanti fungsi-fungsi ini bisa diganti
// dengan panggilan backend / program Solana tanpa mengubah halaman.
import { isSha256, isSolanaAddress, sha256Text, verifyWalletSignature } from "./crypto";
import type {
  Agreement,
  AuditEvent,
  CatatanKondisi,
  DepositStatus,
  Fase,
  FotoBukti,
  Potongan,
  Role,
} from "./types";

const KEY = "kosproof_v2_agreements";
const ROLE_KEY = "kosproof_v2_roles";
const EVT = "kosproof:change";

function read(): Agreement[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Agreement[];
  } catch {
    return [];
  }
}
function write(list: Agreement[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    throw new Error("Penyimpanan browser penuh. Coba pakai foto lebih sedikit.");
  }
  window.dispatchEvent(new Event(EVT));
}

export function subscribe(fn: () => void) {
  window.addEventListener(EVT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVT, fn);
    window.removeEventListener("storage", fn);
  };
}

export const listAgreements = () => read();
export const getAgreement = (id: string) => read().find((a) => a.id === id) ?? null;

function save(a: Agreement) {
  const list = read();
  const i = list.findIndex((x) => x.id === a.id);
  if (i >= 0) list[i] = a;
  else list.unshift(a);
  write(list);
  return a;
}

async function withEvent(a: Agreement, aksi: string, wallet: string, data: unknown) {
  const waktu = new Date().toISOString();
  const previousHash = a.events.at(-1)?.hash ?? "";
  const hash = await sha256Text(JSON.stringify({ id: a.id, aksi, wallet, waktu, data, previousHash }));
  const ev: AuditEvent = { id: crypto.randomUUID(), aksi, wallet, waktu, hash, data, previousHash };
  return save({ ...a, events: [...a.events, ev] });
}

function must(id: string) {
  const a = getAgreement(id);
  if (!a) throw new Error("Perjanjian tidak ditemukan.");
  return a;
}

// ---------- Peran ----------
export function getRole(wallet: string): Role | null {
  try {
    return (JSON.parse(localStorage.getItem(ROLE_KEY) || "{}")[wallet] as Role) ?? null;
  } catch {
    return null;
  }
}
export function setRole(wallet: string, role: Role) {
  const m = JSON.parse(localStorage.getItem(ROLE_KEY) || "{}");
  m[wallet] = role;
  localStorage.setItem(ROLE_KEY, JSON.stringify(m));
  window.dispatchEvent(new Event(EVT));
}

// ---------- Perjanjian ----------
export async function createAgreement(
  owner: string,
  input: Pick<Agreement, "tenantWallet" | "namaKos" | "nomorKamar" | "mulai" | "selesai" | "deposit">,
) {
  if (!Number.isSafeInteger(input.deposit) || !(input.deposit > 0)) throw new Error("Nominal deposit harus berupa Rupiah bulat lebih dari 0.");
  if (!isSolanaAddress(owner) || !isSolanaAddress(input.tenantWallet)) throw new Error("Alamat dompet Solana tidak valid.");
  if (!input.namaKos.trim() || !input.nomorKamar.trim()) throw new Error("Nama kos dan nomor kamar wajib diisi.");
  if (![input.mulai, input.selesai].every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d)) throw new Error("Tanggal sewa tidak valid.");
  if (input.tenantWallet === owner) throw new Error("Alamat penyewa tidak boleh sama dengan pemilik.");
  if (input.selesai <= input.mulai) throw new Error("Tanggal selesai harus setelah tanggal mulai.");
  const a: Agreement = {
    ...input,
    id: crypto.randomUUID().slice(0, 8),
    kode: `KP-${Math.floor(1000 + Math.random() * 9000)}`,
    ownerWallet: owner,
    dibuatPada: new Date().toISOString(),
    status: "menunggu",
    depositStatus: null,
    potongan: null,
    checkin: null,
    checkout: null,
    events: [],
  };
  return withEvent(a, "Perjanjian dibuat pemilik", owner, input);
}

export async function respondAgreement(id: string, wallet: string, setuju: boolean) {
  const a = must(id);
  if (a.tenantWallet !== wallet) throw new Error("Hanya penyewa yang bisa menanggapi.");
  if (a.status !== "menunggu") throw new Error("Perjanjian sudah ditanggapi.");
  const next: Agreement = setuju
    ? { ...a, status: "aktif", depositStatus: "ditahan" }
    : { ...a, status: "ditolak" };
  return withEvent(next, setuju ? "Penyewa menyetujui perjanjian · deposit ditahan" : "Penyewa menolak perjanjian", wallet, { setuju });
}

// ---------- Kondisi kamar ----------
export function ringkasanText(a: Agreement, fase: Fase, ringkasanHash: string) {
  return `KosProof ${a.kode}\nID: ${a.id}\nBukti ${fase === "checkin" ? "check-in" : "check-out"}\nSidik bukti: ${ringkasanHash}`;
}

export const hashKondisi = (fotos: FotoBukti[]) => sha256Text(fotos.map((f) => `${f.area}:${f.hash}:${f.catatan}`).join("|"));

export async function submitKondisi(id: string, wallet: string, fase: Fase, fotos: FotoBukti[]) {
  const a = must(id);
  if (wallet !== a.ownerWallet && wallet !== a.tenantWallet) throw new Error("Anda bukan pihak perjanjian ini.");
  if (a.status !== "aktif") throw new Error("Perjanjian belum aktif.");
  if (fotos.length === 0) throw new Error("Unggah minimal satu foto.");
  if (a[fase]) throw new Error("Bukti sudah dicatat dan tidak boleh ditimpa.");
  if (new Set(fotos.map((f) => f.area)).size !== fotos.length || fotos.some((f) => !["kasur", "lemari", "kamar_mandi", "dinding"].includes(f.area) || !isSha256(f.hash) || !f.preview.startsWith("data:image/") || f.catatan.length > 300)) throw new Error("Data foto bukti tidak valid.");
  if (fase === "checkout" && (!a.checkin?.tandaPemilik || !a.checkin?.tandaPenyewa)) throw new Error("Check-in harus ditandatangani kedua pihak dulu.");
  const ringkasanHash = await hashKondisi(fotos);
  const rec: CatatanKondisi = {
    fotos,
    ringkasanHash,
    dibuatOleh: wallet,
    waktu: new Date().toISOString(),
    tandaPemilik: null,
    tandaPenyewa: null,
  };
  return withEvent({ ...a, [fase]: rec }, `Foto ${fase === "checkin" ? "check-in" : "check-out"} dicatat (${fotos.length} foto)`, wallet, { ringkasanHash });
}

export async function signKondisi(id: string, wallet: string, fase: Fase, signature: string) {
  const a = must(id);
  const rec = a[fase];
  if (!rec) throw new Error("Belum ada foto untuk ditandatangani.");
  if (a.status !== "aktif") throw new Error("Perjanjian tidak aktif.");
  if (wallet !== a.ownerWallet && wallet !== a.tenantWallet) throw new Error("Anda bukan pihak perjanjian ini.");
  if (wallet === a.ownerWallet ? rec.tandaPemilik : rec.tandaPenyewa) throw new Error("Anda sudah menandatangani bukti ini.");
  if (await hashKondisi(rec.fotos) !== rec.ringkasanHash) throw new Error("Isi bukti berubah; tanda tangan dibatalkan.");
  if (!verifyWalletSignature(wallet, ringkasanText(a, fase, rec.ringkasanHash), signature)) throw new Error("Tanda tangan dompet tidak valid untuk bukti ini.");
  const current = must(id);
  if (current[fase]?.ringkasanHash !== rec.ringkasanHash || current.events.at(-1)?.hash !== a.events.at(-1)?.hash) throw new Error("Bukti berubah. Muat ulang sebelum menandatangani.");
  const t = { wallet, signature, waktu: new Date().toISOString() };
  let next: CatatanKondisi;
  if (wallet === a.ownerWallet) next = { ...rec, tandaPemilik: t };
  else if (wallet === a.tenantWallet) next = { ...rec, tandaPenyewa: t };
  else throw new Error("Anda bukan pihak perjanjian ini.");
  const label = wallet === a.ownerWallet ? "Pemilik" : "Penyewa";
  return withEvent({ ...a, [fase]: next }, `${label} menandatangani bukti ${fase === "checkin" ? "check-in" : "check-out"}`, wallet, { ringkasanHash: rec.ringkasanHash, signature });
}

// ---------- Deposit ----------
const NEXT: Record<DepositStatus, DepositStatus[]> = {
  ditahan: ["diajukan", "dikembalikan"],
  diajukan: ["disetujui", "ditahan"],
  disetujui: ["dikembalikan"],
  dikembalikan: [],
};
export const canMove = (from: DepositStatus | null, to: DepositStatus) => !!from && NEXT[from].includes(to);

export async function ajukanPotongan(id: string, wallet: string, p: Omit<Potongan, "diajukanPada">) {
  const a = must(id);
  if (wallet !== a.ownerWallet) throw new Error("Hanya pemilik yang bisa mengajukan potongan.");
  if (!canMove(a.depositStatus, "diajukan")) throw new Error("Status deposit tidak memungkinkan.");
  if (!Number.isSafeInteger(p.jumlah) || !(p.jumlah > 0) || p.jumlah > a.deposit) throw new Error("Jumlah potongan harus antara 1 dan nilai deposit.");
  if (!isSha256(p.fotoHash) || !p.fotoPreview.startsWith("data:image/")) throw new Error("Lampirkan foto bukti kerusakan yang valid.");
  if (!p.alasan.trim()) throw new Error("Alasan potongan wajib diisi.");
  const potongan = { ...p, diajukanPada: new Date().toISOString() };
  return withEvent({ ...a, depositStatus: "diajukan", potongan }, `Pemilik mengajukan potongan deposit`, wallet, { jumlah: p.jumlah, alasan: p.alasan, fotoHash: p.fotoHash });
}

export async function tanggapiPotongan(id: string, wallet: string, setuju: boolean) {
  const a = must(id);
  if (wallet !== a.tenantWallet) throw new Error("Hanya penyewa yang bisa menanggapi potongan.");
  if (a.depositStatus !== "diajukan") throw new Error("Tidak ada potongan yang diajukan.");
  return withEvent(
    { ...a, depositStatus: setuju ? "disetujui" : "ditahan", potongan: setuju ? a.potongan : null },
    setuju ? "Penyewa menyetujui potongan" : "Penyewa menolak potongan · deposit kembali ditahan",
    wallet,
    { setuju },
  );
}

export async function kembalikanDeposit(id: string, wallet: string) {
  const a = must(id);
  if (wallet !== a.ownerWallet) throw new Error("Hanya pemilik yang bisa mengembalikan deposit.");
  if (!canMove(a.depositStatus, "dikembalikan")) throw new Error("Status deposit tidak memungkinkan.");
  const jumlah = a.deposit - (a.depositStatus === "disetujui" && a.potongan ? a.potongan.jumlah : 0);
  return withEvent({ ...a, depositStatus: "dikembalikan", status: "selesai" }, `Deposit dikembalikan (${jumlah})`, wallet, { jumlah });
}

// ---------- Verifikasi ----------
export function findByHash(hash: string) {
  const out: { agreement: Agreement; konteks: string }[] = [];
  for (const a of read()) {
    for (const fase of ["checkin", "checkout"] as const) {
      const rec = a[fase];
      if (!rec) continue;
      if (rec.ringkasanHash === hash) out.push({ agreement: a, konteks: `Sidik ringkasan ${fase}` });
      for (const f of rec.fotos)
        if (f.hash === hash) out.push({ agreement: a, konteks: `Foto ${f.area} saat ${fase === "checkin" ? "check-in" : "check-out"}` });
    }
    if (a.potongan?.fotoHash === hash) out.push({ agreement: a, konteks: "Foto bukti potongan deposit" });
    for (const e of a.events) if (e.hash === hash) out.push({ agreement: a, konteks: `Catatan riwayat: ${e.aksi}` });
  }
  return out;
}

export function findByIdOrKode(q: string) {
  const s = q.trim().toLowerCase();
  return read().find((a) => a.id.toLowerCase() === s || a.kode.toLowerCase() === s) ?? null;
}

export async function verifyAgreement(a: Agreement) {
  const conditions = await Promise.all((["checkin", "checkout"] as const).map(async (fase) => {
    const rec = a[fase];
    if (!rec) return { fase, summary: null, owner: null, tenant: null };
    const message = ringkasanText(a, fase, rec.ringkasanHash);
    const summary = await hashKondisi(rec.fotos) === rec.ringkasanHash;
    const owner = rec.tandaPemilik ? rec.tandaPemilik.wallet === a.ownerWallet && verifyWalletSignature(a.ownerWallet, message, rec.tandaPemilik.signature) : null;
    const tenant = rec.tandaPenyewa ? rec.tandaPenyewa.wallet === a.tenantWallet && verifyWalletSignature(a.tenantWallet, message, rec.tandaPenyewa.signature) : null;
    return { fase, summary, owner, tenant };
  }));
  let audit: "valid" | "invalid" | "legacy" = "valid";
  for (let i = 0; i < a.events.length; i++) {
    const e = a.events[i];
    if (e.previousHash === undefined) { if (audit !== "invalid") audit = "legacy"; continue; }
    const expected = await sha256Text(JSON.stringify({ id: a.id, aksi: e.aksi, wallet: e.wallet, waktu: e.waktu, data: e.data, previousHash: e.previousHash }));
    if (expected !== e.hash || e.previousHash !== (a.events[i - 1]?.hash ?? "")) audit = "invalid";
  }
  return { conditions, audit };
}
