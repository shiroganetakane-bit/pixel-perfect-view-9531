import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";
import { sha256Text, verifyWalletSignature } from "./crypto";
import { ajukanPotongan, createAgreement, getAgreement, respondAgreement, ringkasanText, signKondisi, submitKondisi, verifyAgreement } from "./store";
import type { Agreement, FotoBukti } from "./types";

const ownerSecret = new Uint8Array(32).fill(7);
const tenantSecret = new Uint8Array(32).fill(8);
const owner = bs58.encode(ed25519.getPublicKey(ownerSecret));
const tenant = bs58.encode(ed25519.getPublicKey(tenantSecret));
const sign = (message: string, secret = ownerSecret) => bs58.encode(ed25519.sign(new TextEncoder().encode(message), secret));
let photo: FotoBukti;

beforeEach(async () => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v) });
  vi.stubGlobal("window", new EventTarget());
  photo = { area: "kasur", hash: await sha256Text("foto asli"), preview: "data:image/jpeg;base64,AA==", catatan: "Utuh" };
});
afterEach(() => vi.unstubAllGlobals());

async function active() {
  const a = await createAgreement(owner, { tenantWallet: tenant, namaKos: "Kos Uji", nomorKamar: "1", mulai: "2026-10-20", selesai: "2026-11-20", deposit: 500000 });
  return respondAgreement(a.id, tenant, true);
}
function latest(id: string): Agreement {
  const a = getAgreement(id);
  if (!a) throw new Error("Missing test agreement");
  return a;
}

describe("integritas bukti KosProof", () => {
  it("SHA-256 dihitung dari isi asli", async () => {
    expect(await sha256Text("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("signature harus berasal dari dompet dan pesan yang benar", () => {
    expect(verifyWalletSignature(owner, "bukti", sign("bukti"))).toBe(true);
    expect(verifyWalletSignature(tenant, "bukti", sign("bukti"))).toBe(false);
    expect(verifyWalletSignature(owner, "diubah", sign("bukti"))).toBe(false);
  });
  it("hanya penyewa perjanjian dapat menyetujui", async () => {
    const a = await active();
    await expect(respondAgreement(a.id, owner, true)).rejects.toThrow("Hanya penyewa");
  });
  it("check-out menunggu tanda tangan kedua pihak", async () => {
    let a = await active();
    a = await submitKondisi(a.id, owner, "checkin", [photo]);
    if (!a.checkin) throw new Error("Missing checkin");
    a = await signKondisi(a.id, owner, "checkin", sign(ringkasanText(a, "checkin", a.checkin.ringkasanHash)));
    await expect(submitKondisi(a.id, tenant, "checkout", [photo])).rejects.toThrow("kedua pihak");
    if (!a.checkin) throw new Error("Missing checkin");
    await signKondisi(a.id, tenant, "checkin", sign(ringkasanText(a, "checkin", a.checkin.ringkasanHash), tenantSecret));
    expect((await submitKondisi(a.id, tenant, "checkout", [photo])).checkout).not.toBeNull();
  });
  it("bukti tidak dapat ditimpa dan tanda tangan tidak dapat diganti", async () => {
    let a = await active();
    a = await submitKondisi(a.id, owner, "checkin", [photo]);
    await expect(submitKondisi(a.id, owner, "checkin", [photo])).rejects.toThrow("tidak boleh ditimpa");
    await expect(signKondisi(a.id, owner, "checkin", "palsu")).rejects.toThrow("tidak valid");
    if (!a.checkin) throw new Error("Missing checkin");
    const signature = sign(ringkasanText(a, "checkin", a.checkin.ringkasanHash));
    await signKondisi(a.id, owner, "checkin", signature);
    await expect(signKondisi(a.id, owner, "checkin", signature)).rejects.toThrow("sudah menandatangani");
  });
  it("verifikasi mendeteksi perubahan catatan foto dan riwayat", async () => {
    const a = await active();
    await submitKondisi(a.id, owner, "checkin", [photo]);
    const original = latest(a.id);
    expect((await verifyAgreement(original)).audit).toBe("valid");
    const modified = structuredClone(original);
    if (!modified.checkin) throw new Error("Missing checkin");
    modified.checkin.fotos[0].catatan = "Berubah";
    modified.events[0].aksi = "Dipalsukan";
    const result = await verifyAgreement(modified);
    expect(result.audit).toBe("invalid");
    expect(result.conditions[0].summary).toBe(false);
  });
  it("potongan wajib memiliki foto bukti valid", async () => {
    const a = await active();
    await expect(ajukanPotongan(a.id, owner, { jumlah: 1000, alasan: "Rusak", fotoHash: "", fotoPreview: "" })).rejects.toThrow("foto bukti");
  });
  it("deposit menolak angka tak terbatas dan tanggal tidak nyata", async () => {
    const input = { tenantWallet: tenant, namaKos: "Kos", nomorKamar: "1", mulai: "2026-02-30", selesai: "2026-04-01", deposit: 500000 };
    await expect(createAgreement(owner, { ...input, deposit: Infinity })).rejects.toThrow("Rupiah bulat");
    await expect(createAgreement(owner, input)).rejects.toThrow("Tanggal sewa tidak valid");
  });
});