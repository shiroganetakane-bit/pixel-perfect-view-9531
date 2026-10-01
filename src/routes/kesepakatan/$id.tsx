import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  formatRupiah,
  formatTanggal,
  getAgreement,
  hashAgreement,
  statusLabel,
  upsertAgreement,
  type Agreement,
} from "@/lib/agreements";

export const Route = createFileRoute("/kesepakatan/$id")({
  head: () => ({
    meta: [
      { title: "Detail Kesepakatan — KosProof" },
      {
        name: "description",
        content:
          "Periksa isi kesepakatan sewa kos, verifikasi sidik digital, dan konfirmasi sebagai penyewa.",
      },
      { property: "og:title", content: "Detail Kesepakatan — KosProof" },
      {
        property: "og:description",
        content:
          "Periksa isi kesepakatan sewa kos, verifikasi sidik digital, dan konfirmasi sebagai penyewa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detail,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function Detail() {
  const { id } = useParams({ from: "/kesepakatan/$id" });
  const [a, setA] = useState<Agreement | null | undefined>(undefined);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const found = getAgreement(id);
    setA(found);
    if (found) {
      const { hash, status, konfirmasiPemilik, konfirmasiPenyewa, ...base } =
        found;
      hashAgreement(base).then((h) => setVerified(h === hash));
    }
  }, [id]);

  if (a === undefined) return null;
  if (a === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="font-display text-xl font-semibold">
            Kesepakatan tidak ditemukan
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  function confirmPenyewa() {
    if (!a) return;
    const updated: Agreement = {
      ...a,
      konfirmasiPenyewa: new Date().toISOString(),
      status: "aktif",
    };
    upsertAgreement(updated);
    setA(updated);
  }

  function rejectPenyewa() {
    if (!a) return;
    const updated: Agreement = { ...a, status: "ditolak" };
    upsertAgreement(updated);
    setA(updated);
  }

  async function copyHash() {
    if (!a) return;
    await navigator.clipboard.writeText(a.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-display text-lg font-semibold">
            Kesepakatan {a.kode}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        {/* Status */}
        <section
          className={`flex items-center gap-3 rounded-xl border p-4 ${
            a.status === "aktif"
              ? "border-primary/40 bg-primary/5"
              : a.status === "ditolak"
                ? "border-destructive/40 bg-destructive/5"
                : "border-border bg-card"
          }`}
        >
          {a.status === "aktif" ? (
            <CheckCircle2 className="h-6 w-6 text-primary" />
          ) : a.status === "ditolak" ? (
            <XCircle className="h-6 w-6 text-destructive" />
          ) : (
            <Clock className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">{statusLabel(a.status)}</p>
            <p className="text-sm text-muted-foreground">
              Dibuat {formatTanggal(a.dibuatPada)} · Pemilik sudah menyetujui
              {a.konfirmasiPenyewa &&
                ` · Penyewa mengonfirmasi ${formatTanggal(a.konfirmasiPenyewa)}`}
            </p>
          </div>
        </section>

        {/* Isi kesepakatan */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 font-display text-lg font-semibold">
            Isi kesepakatan
          </h2>
          <div className="divide-y divide-border">
            <Row label="Kos / kamar" value={`${a.kamar.namaKos} — ${a.kamar.nomorKamar}`} />
            <Row label="Alamat" value={a.kamar.alamat} />
            <Row label="Pemilik" value={`${a.pemilik.nama} (${a.pemilik.telepon})`} />
            <Row label="Penyewa" value={`${a.penyewa.nama} (${a.penyewa.telepon})`} />
            <Row label="Harga" value={`${formatRupiah(a.hargaPerBulan)} / bulan`} />
            {a.deposit > 0 && <Row label="Deposit" value={formatRupiah(a.deposit)} />}
            <Row
              label="Periode"
              value={`${formatTanggal(a.tanggalMulai)} · ${a.durasiBulan} bulan`}
            />
          </div>
          {a.aturan && (
            <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
              <p className="mb-1 font-medium">Aturan & catatan</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{a.aturan}</p>
            </div>
          )}
        </section>

        {/* Sidik digital */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Sidik digital</h2>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Hash SHA-256 dari seluruh isi kesepakatan. Jika satu huruf pun
            diubah, sidik ini berubah total — inilah bukti bahwa isi tidak
            dimanipulasi.
          </p>
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
            <code className="break-all font-mono text-xs leading-relaxed">
              {a.hash}
            </code>
            <button
              onClick={copyHash}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Salin sidik"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && <p className="mt-1 text-xs text-primary">Tersalin.</p>}
          {verified !== null && (
            <p
              className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${
                verified ? "text-primary" : "text-destructive"
              }`}
            >
              {verified ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Terverifikasi — isi
                  kesepakatan cocok dengan sidik digital.
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" /> Peringatan — isi tidak cocok
                  dengan sidik digital. Ada yang berubah!
                </>
              )}
            </p>
          )}
        </section>

        {/* Aksi penyewa */}
        {a.status === "menunggu" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 font-display text-lg font-semibold">
              Konfirmasi penyewa
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Simulasi: halaman ini dibuka oleh penyewa ({a.penyewa.nama}).
              Periksa isi di atas, lalu setujui atau tolak.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmPenyewa}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Saya setuju
              </button>
              <button
                onClick={rejectPenyewa}
                className="rounded-full border border-destructive/40 px-5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5"
              >
                Tolak
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
