import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Timeline } from "@/components/kosproof/Timeline";
import { Button, Card, DepositBadge, ErrorBox, Field, Mono, PageTitle, StatusBadge, inputCls, errMsg } from "@/components/kosproof/ui";
import { sha256File, validateImage } from "@/lib/kosproof/crypto";
import { findByHash, findByIdOrKode, verifyAgreement } from "@/lib/kosproof/store";
import type { Agreement } from "@/lib/kosproof/types";

const T = "Cek Keaslian Bukti — KosProof";
const D = "Masukkan ID perjanjian atau unggah foto untuk memeriksa apakah sidiknya cocok dengan bukti yang tercatat.";

export const Route = createFileRoute("/verifikasi")({
  head: () => ({
    meta: [
      { title: T },
      { name: "description", content: D },
      { property: "og:title", content: T },
      { property: "og:description", content: D },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Verifikasi,
});

type Hasil =
  | { kind: "id"; a: Agreement | null; q: string }
  | { kind: "foto"; hash: string; matches: { agreement: Agreement; konteks: string }[] };

function Verifikasi() {
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [integrity, setIntegrity] = useState<Awaited<ReturnType<typeof verifyAgreement>> | null>(null);

  async function onId(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    if (!q) return setErr("Masukkan ID, kode, atau sidik bukti.");
    setBusy(true);
    setHasil(null);
    setIntegrity(null);
    try {
      if (/^[a-f0-9]{64}$/i.test(q)) {
        setHasil({ kind: "foto", hash: q.toLowerCase(), matches: findByHash(q.toLowerCase()) });
      } else {
        const a = findByIdOrKode(q);
        if (a) setIntegrity(await verifyAgreement(a));
        setHasil({ kind: "id", a, q });
      }
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }

  async function onFile(file?: File) {
    if (!file) return;
    setErr(null);
    const v = validateImage(file);
    if (v) return setErr(v);
    setBusy(true);
    setHasil(null);
    setIntegrity(null);
    try {
      const hash = await sha256File(file);
      setHasil({ kind: "foto", hash, matches: findByHash(hash) });
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Cek keaslian bukti" sub="Tanpa dompet · catatan tersimpan di browser ini" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <form onSubmit={onId} className="space-y-3">
            <Field label="ID, kode perjanjian, atau sidik bukti">
              <input name="q" className={`${inputCls} font-mono`} placeholder="KP-1234" />
            </Field>
            <Button type="submit" loading={busy} className="w-full">Cari</Button>
          </form>
        </Card>
        <Card>
          <Field label="Atau unggah foto" hint="Sidik foto dihitung di perangkat Anda.">
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} className="mt-2 text-sm" />
          </Field>
        </Card>
      </div>

      {err && <div className="mt-4"><ErrorBox message={err} /></div>}

      {hasil?.kind === "foto" && (
        <Card className="mt-6">
          <p className="mb-1 text-xs text-muted-foreground">Sidik foto</p>
          <Mono>{hasil.hash}</Mono>
          {hasil.matches.length > 0 ? (
            <div className="mt-4">
              <p className="flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="h-5 w-5" /> Cocok dengan bukti yang tercatat</p>
              <ul className="mt-3 space-y-2">
                {hasil.matches.map((m, i) => (
                  <li key={i} className="rounded-lg bg-muted p-3 text-sm">
                    {m.konteks} · <Link to="/perjanjian/$id" params={{ id: m.agreement.id }} className="font-mono text-primary underline">{m.agreement.kode}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-2 font-semibold text-destructive"><XCircle className="h-5 w-5" /> Tidak cocok — foto ini tidak ada di bukti mana pun, atau sudah diubah.</p>
          )}
        </Card>
      )}

      {hasil?.kind === "id" && (
        <Card className="mt-6">
          {hasil.a ? (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm">{hasil.a.kode}</span>
                <StatusBadge status={hasil.a.status} />
                <DepositBadge status={hasil.a.depositStatus} />
              </div>
              <p className="mb-1 text-sm">Sidik check-in: {hasil.a.checkin ? <Mono>{hasil.a.checkin.ringkasanHash}</Mono> : "—"}</p>
              <p className="mb-4 text-sm">Sidik check-out: {hasil.a.checkout ? <Mono>{hasil.a.checkout.ringkasanHash}</Mono> : "—"}</p>
              {integrity && <div className="mb-4 space-y-2 border-y border-border py-3 text-sm">
                <p className="font-semibold">Pemeriksaan bukti dan tanda tangan</p>
                {integrity.conditions.map((r) => <div key={r.fase}>
                  <p className="font-medium">{r.fase === "checkin" ? "Check-in" : "Check-out"}</p>
                  <p>Ringkasan: {r.summary === null ? "Belum dicatat" : r.summary ? "Cocok" : "Isi bukti berubah"}</p>
                  <p>Pemilik: {r.owner === null ? "Belum ditandatangani" : r.owner ? "Tanda tangan valid" : "Tanda tangan tidak valid"}</p>
                  <p>Penyewa: {r.tenant === null ? "Belum ditandatangani" : r.tenant ? "Tanda tangan valid" : "Tanda tangan tidak valid"}</p>
                </div>)}
                <p>Riwayat: {integrity.audit === "valid" ? "Rangkaian hash cocok" : integrity.audit === "legacy" ? "Catatan lama belum memiliki pemeriksaan lengkap" : "Rangkaian hash berubah"}</p>
                <p className="text-xs text-muted-foreground">Pemeriksaan terhadap catatan browser ini, bukan bukti pencatatan blockchain.</p>
              </div>}
              <Timeline events={hasil.a.events} />
            </>
          ) : (
            <p className="flex items-center gap-2 font-semibold text-destructive"><XCircle className="h-5 w-5" /> Perjanjian "{hasil.q}" tidak ditemukan.</p>
          )}
        </Card>
      )}
    </div>
  );
}
