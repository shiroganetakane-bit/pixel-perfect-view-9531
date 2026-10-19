import { Link } from "@tanstack/react-router";
import { ArrowLeft, Camera, CheckCircle2, Circle, PenLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAgreement, useSession } from "@/hooks/use-kosproof";
import { makePreview, sha256File, shortKey, validateImage } from "@/lib/kosproof/crypto";
import { formatWaktu } from "@/lib/kosproof/format";
import { ringkasanText, signKondisi, submitKondisi } from "@/lib/kosproof/store";
import { AREAS, AREA_LABEL, type Area, type Fase, type FotoBukti, type TandaTangan } from "@/lib/kosproof/types";
import { Button, Card, Empty, ErrorBox, Loading, Mono, NeedWallet, PageTitle, errMsg, inputCls } from "./ui";

type Draft = Partial<Record<Area, { hash: string; preview: string; catatan: string }>>;

export function KondisiPage({ id, fase }: { id: string; fase: Fase }) {
  const a = useAgreement(id);
  const { wallet, ready, signText } = useSession();
  const [draft, setDraft] = useState<Draft>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const label = fase === "checkin" ? "Check-in" : "Check-out";

  if (!ready || a === undefined) return <Loading />;
  if (a === null) return <Empty title="Perjanjian tidak ditemukan" />;
  if (!wallet) return <NeedWallet />;
  const isOwner = wallet === a.ownerWallet;
  const isTenant = wallet === a.tenantWallet;
  if (!isOwner && !isTenant) return <Empty title="Anda bukan pihak dalam perjanjian ini" />;

  const rec = a[fase];
  const back = (
    <Link to="/perjanjian/$id" params={{ id }} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Kembali ke {a.kode}
    </Link>
  );

  if (a.status !== "aktif" && !rec) return <>{back}<Empty title="Perjanjian belum aktif">Penyewa perlu menyetujui perjanjian terlebih dahulu.</Empty></>;
  if (fase === "checkout" && !a.checkin?.tandaPemilik && !rec)
    return <>{back}<Empty title="Check-in belum selesai">Foto check-in harus ditandatangani kedua pihak dulu.</Empty></>;

  async function onFile(area: Area, file: File | undefined) {
    if (!file) return;
    setErr(null);
    const v = validateImage(file);
    if (v) return setErr(`${AREA_LABEL[area]}: ${v}`);
    setBusy(area);
    try {
      const [hash, preview] = await Promise.all([sha256File(file), makePreview(file)]);
      setDraft((d) => ({ ...d, [area]: { hash, preview, catatan: d[area]?.catatan ?? "" } }));
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function onSubmit() {
    setErr(null);
    const fotos: FotoBukti[] = AREAS.filter((ar) => draft[ar]).map((ar) => ({ area: ar, ...draft[ar]!, catatan: draft[ar]!.catatan.slice(0, 300) }));
    setBusy("submit");
    try {
      await submitKondisi(id, wallet!, fase, fotos);
      toast.success("Foto tersimpan. Sekarang tanda tangani buktinya.");
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  async function onSign() {
    if (!rec) return;
    setErr(null);
    setBusy("sign");
    try {
      const sig = await signText(ringkasanText(a!, fase, rec.ringkasanHash));
      await signKondisi(id, wallet!, fase, sig);
      toast.success("Bukti berhasil ditandatangani.");
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  const before = fase === "checkout" ? a.checkin : null;
  const mySig = isOwner ? rec?.tandaPemilik : rec?.tandaPenyewa;

  return (
    <div>
      {back}
      <PageTitle title={`${label} kamar ${a.nomorKamar}`} sub={`${a.namaKos} · ${a.kode}`} />
      {err && <div className="mb-4"><ErrorBox message={err} /></div>}

      {!rec ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Foto setiap area kamar. Setiap foto diberi sidik unik di perangkat Anda — fotonya sendiri tidak dikirim ke blockchain. Maks 5 MB per foto.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {AREAS.map((ar) => {
              const d = draft[ar];
              const prev = before?.fotos.find((f) => f.area === ar);
              return (
                <Card key={ar} className="p-4">
                  <p className="mb-2 font-semibold">{AREA_LABEL[ar]}</p>
                  {prev && (
                    <p className="mb-2 text-xs text-muted-foreground">Foto check-in tersedia untuk dibandingkan setelah disimpan.</p>
                  )}
                  <label className="flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted">
                    {d ? <img src={d.preview} alt={AREA_LABEL[ar]} className="h-full w-full object-cover" /> : (
                      <span className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                        <Camera className="h-6 w-6" /> {busy === ar ? "Memproses…" : "Ambil / pilih foto"}
                      </span>
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(ar, e.target.files?.[0])} />
                  </label>
                  {d && <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">Sidik: {d.hash}</p>}
                  <textarea
                    className={`${inputCls} mt-2 min-h-16`}
                    placeholder="Catatan kondisi (mis. noda kecil di sudut)"
                    maxLength={300}
                    value={d?.catatan ?? ""}
                    disabled={!d}
                    onChange={(e) => setDraft((x) => ({ ...x, [ar]: { ...x[ar]!, catatan: e.target.value } }))}
                  />
                </Card>
              );
            })}
          </div>
          <Button className="mt-6 w-full sm:w-auto" loading={busy === "submit"} disabled={Object.keys(draft).length === 0} onClick={onSubmit}>
            Simpan foto {label.toLowerCase()}
          </Button>
        </>
      ) : (
        <>
          <Card className="mb-6">
            <p className="text-xs text-muted-foreground">Sidik ringkasan bukti</p>
            <Mono>{rec.ringkasanHash}</Mono>
            <p className="mt-2 text-xs text-muted-foreground">Dicatat {formatWaktu(rec.waktu)} oleh {shortKey(rec.dibuatOleh)}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <SigRow label="Pemilik" t={rec.tandaPemilik} />
              <SigRow label="Penyewa" t={rec.tandaPenyewa} />
            </div>
            {!mySig && (
              <Button className="mt-4 w-full sm:w-auto" loading={busy === "sign"} onClick={onSign}>
                <PenLine className="h-4 w-4" /> Tanda tangani bukti
              </Button>
            )}
          </Card>

          <div className="space-y-4">
            {rec.fotos.map((f) => {
              const prev = before?.fotos.find((p) => p.area === f.area);
              return (
                <Card key={f.area} className="p-4">
                  <p className="mb-3 font-semibold">{AREA_LABEL[f.area]}</p>
                  <div className={`grid gap-3 ${before ? "grid-cols-2" : ""}`}>
                    {before && <Foto title="Saat check-in" f={prev} />}
                    <Foto title={before ? "Saat check-out" : "Foto"} f={f} />
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SigRow({ label, t }: { label: string; t: TandaTangan | null }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
      {t ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> : <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />}
      <div className="min-w-0">
        <p className="font-medium">{label} {t ? "sudah menandatangani" : "belum menandatangani"}</p>
        {t && <p className="truncate font-mono text-[11px] text-muted-foreground" title={t.signature}>{formatWaktu(t.waktu)} · {t.signature.slice(0, 16)}…</p>}
      </div>
    </div>
  );
}

function Foto({ title, f }: { title: string; f?: FotoBukti }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{title}</p>
      {f ? (
        <>
          <img src={f.preview} alt={title} className="aspect-video w-full rounded-lg object-cover" />
          {f.catatan && <p className="mt-1 text-sm">{f.catatan}</p>}
          <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{f.hash}</p>
        </>
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">Tidak ada foto</div>
      )}
    </div>
  );
}
