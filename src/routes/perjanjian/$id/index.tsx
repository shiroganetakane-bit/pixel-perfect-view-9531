import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CheckCircle2, Copy } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Timeline } from "@/components/kosproof/Timeline";
import { Button, Card, DepositBadge, Empty, ErrorBox, Field, Loading, Mono, StatusBadge, errMsg, inputCls } from "@/components/kosproof/ui";
import { useAgreement, useSession } from "@/hooks/use-kosproof";
import { makePreview, sha256File, shortKey, validateImage } from "@/lib/kosproof/crypto";
import { formatRupiah, formatTanggal } from "@/lib/kosproof/format";
import { ajukanPotongan, canMove, kembalikanDeposit, respondAgreement, tanggapiPotongan } from "@/lib/kosproof/store";
import type { Agreement } from "@/lib/kosproof/types";

const T = "Detail Perjanjian Sewa — KosProof";
const D = "Isi perjanjian sewa, status jaminan, bukti kondisi kamar, dan riwayat lengkap setiap aksi.";

export const Route = createFileRoute("/perjanjian/$id/")({
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
  component: Detail,
});

function Row({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{l}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

function Detail() {
  const { id } = Route.useParams();
  const a = useAgreement(id);
  const { wallet, ready } = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!ready || a === undefined) return <Loading />;
  if (a === null) return <Empty title="Perjanjian tidak ditemukan">Periksa kembali tautan atau ID perjanjian.</Empty>;

  const isOwner = wallet === a.ownerWallet;
  const isTenant = wallet === a.tenantWallet;

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setErr(null);
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  const phase = (rec: Agreement["checkin"]) =>
    !rec ? "Belum dicatat" : rec.tandaPemilik && rec.tandaPenyewa ? "Ditandatangani kedua pihak" : "Menunggu tanda tangan";

  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{a.kode}</span>
          <StatusBadge status={a.status} />
          <DepositBadge status={a.depositStatus} />
        </div>
        <h1 className="font-display text-3xl font-semibold">
          {a.namaKos} · Kamar {a.nomorKamar}
        </h1>
        <button
          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigator.clipboard.writeText(a.id).then(() => toast.success("ID disalin"))}
        >
          ID perjanjian: <span className="font-mono">{a.id}</span> <Copy className="h-3 w-3" />
        </button>
      </div>

      {err && <div className="mb-4"><ErrorBox message={err} /></div>}

      {a.status === "menunggu" && isTenant && (
        <Card className="mb-4 border-primary/40">
          <p className="font-semibold">Periksa isi perjanjian di bawah, lalu berikan persetujuan.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button loading={busy === "ok"} onClick={() => run("ok", () => respondAgreement(a.id, wallet!, true), "Perjanjian disetujui")}>
              <CheckCircle2 className="h-4 w-4" /> Setujui perjanjian
            </Button>
            <Button variant="outline" loading={busy === "no"} onClick={() => run("no", () => respondAgreement(a.id, wallet!, false), "Perjanjian ditolak")}>
              Tolak
            </Button>
          </div>
        </Card>
      )}
      {a.status === "menunggu" && isOwner && <p className="mb-4 rounded-lg bg-muted p-3 text-sm">Menunggu penyewa {shortKey(a.tenantWallet)} menyetujui.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-display text-lg font-semibold">Isi perjanjian</h2>
          <Row l="Periode" v={`${formatTanggal(a.mulai)} – ${formatTanggal(a.selesai)}`} />
          <Row l="Uang jaminan" v={formatRupiah(a.deposit)} />
          <Row l="Pemilik" v={<span className="font-mono" title={a.ownerWallet}>{shortKey(a.ownerWallet)}{isOwner && " (Anda)"}</span>} />
          <Row l="Penyewa" v={<span className="font-mono" title={a.tenantWallet}>{shortKey(a.tenantWallet)}{isTenant && " (Anda)"}</span>} />
        </Card>

        <Card>
          <h2 className="mb-2 font-display text-lg font-semibold">Kondisi kamar</h2>
          <Row l="Check-in" v={phase(a.checkin)} />
          <Row l="Check-out" v={phase(a.checkout)} />
          {(isOwner || isTenant) && a.status !== "menunggu" && a.status !== "ditolak" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/perjanjian/$id/checkin" params={{ id: a.id }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">
                <Camera className="h-4 w-4" /> Check-in
              </Link>
              <Link to="/perjanjian/$id/checkout" params={{ id: a.id }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">
                <Camera className="h-4 w-4" /> Check-out
              </Link>
            </div>
          )}
        </Card>
      </div>

      {a.depositStatus && <DepositCard a={a} wallet={wallet} busy={busy} run={run} setErr={setErr} />}

      <Card className="mt-4">
        <h2 className="mb-4 font-display text-lg font-semibold">Riwayat</h2>
        <Timeline events={a.events} />
      </Card>
    </div>
  );
}

function DepositCard({
  a,
  wallet,
  busy,
  run,
  setErr,
}: {
  a: Agreement;
  wallet: string | null;
  busy: string | null;
  run: (k: string, fn: () => Promise<unknown>, ok: string) => Promise<void>;
  setErr: (s: string | null) => void;
}) {
  const isOwner = wallet === a.ownerWallet;
  const isTenant = wallet === a.tenantWallet;
  const [open, setOpen] = useState(false);
  const [foto, setFoto] = useState<{ hash: string; preview: string } | null>(null);
  const kembali = a.deposit - (a.depositStatus !== "ditahan" && a.potongan ? a.potongan.jumlah : 0);

  async function onFoto(file?: File) {
    if (!file) return;
    const v = validateImage(file);
    if (v) return setErr(v);
    const [hash, preview] = await Promise.all([sha256File(file), makePreview(file)]);
    setFoto({ hash, preview });
  }

  function onAjukan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!foto) return setErr("Lampirkan foto bukti kerusakan.");
    run(
      "ajukan",
      () => ajukanPotongan(a.id, wallet!, { jumlah: Number(f.get("jumlah")), alasan: String(f.get("alasan") ?? "").trim().slice(0, 300), fotoHash: foto.hash, fotoPreview: foto.preview }),
      "Potongan diajukan ke penyewa",
    ).then(() => setOpen(false));
  }

  return (
    <Card className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Uang jaminan</h2>
        <DepositBadge status={a.depositStatus} />
      </div>
      <p className="text-sm text-muted-foreground">
        Jaminan {formatRupiah(a.deposit)}
        {a.depositStatus !== "ditahan" && ` · dikembalikan ${formatRupiah(kembali)}`}
      </p>

      {a.potongan && a.depositStatus !== "ditahan" && (
        <div className="mt-4 grid gap-3 rounded-lg bg-muted p-3 sm:grid-cols-[160px_1fr]">
          <img src={a.potongan.fotoPreview} alt="Foto bukti potongan" className="aspect-video w-full rounded object-cover" />
          <div className="text-sm">
            <p className="font-semibold">Potongan {formatRupiah(a.potongan.jumlah)}</p>
            <p>{a.potongan.alasan}</p>
            <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{a.potongan.fotoHash}</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isOwner && canMove(a.depositStatus, "diajukan") && !open && (
          <Button variant="outline" onClick={() => setOpen(true)}>Ajukan potongan</Button>
        )}
        {isOwner && canMove(a.depositStatus, "dikembalikan") && (
          <Button loading={busy === "kembali"} onClick={() => run("kembali", () => kembalikanDeposit(a.id, wallet!), "Jaminan ditandai dikembalikan")}>
            Tandai dikembalikan ({formatRupiah(kembali)})
          </Button>
        )}
        {isTenant && a.depositStatus === "diajukan" && (
          <>
            <Button loading={busy === "setuju"} onClick={() => run("setuju", () => tanggapiPotongan(a.id, wallet!, true), "Potongan disetujui")}>Setujui potongan</Button>
            <Button variant="outline" loading={busy === "tolak"} onClick={() => run("tolak", () => tanggapiPotongan(a.id, wallet!, false), "Potongan ditolak")}>Tolak potongan</Button>
          </>
        )}
      </div>

      {open && (
        <form onSubmit={onAjukan} className="mt-4 space-y-3 border-t border-border pt-4">
          <Field label="Jumlah potongan (Rp)">
            <input name="jumlah" type="number" min={1} max={a.deposit} required className={inputCls} />
          </Field>
          <Field label="Alasan">
            <textarea name="alasan" required maxLength={300} className={`${inputCls} min-h-20`} placeholder="Contoh: kaca lemari retak" />
          </Field>
          <Field label="Foto bukti" hint="Gambar, maks 5 MB.">
            <input type="file" accept="image/*" onChange={(e) => onFoto(e.target.files?.[0])} className="text-sm" />
          </Field>
          {foto && <Mono>{foto.hash}</Mono>}
          <div className="flex gap-2">
            <Button type="submit" loading={busy === "ajukan"}>Kirim pengajuan</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
