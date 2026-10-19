import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button, Card, ErrorBox, Field, Loading, NeedWallet, PageTitle, errMsg, inputCls } from "@/components/kosproof/ui";
import { useSession } from "@/hooks/use-kosproof";
import { isSolanaAddress } from "@/lib/kosproof/crypto";
import { createAgreement } from "@/lib/kosproof/store";

const T = "Buat Perjanjian Sewa — KosProof";
const D = "Isi kamar, periode sewa, nominal jaminan, dan alamat dompet penyewa untuk membuat perjanjian.";

export const Route = createFileRoute("/pemilik/buat")({
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
  component: Buat,
});

function Buat() {
  const { wallet, role, ready } = useSession();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!ready) return <Loading />;
  if (!wallet) return <NeedWallet />;
  if (role !== "pemilik") return <NeedWallet text="Hanya pemilik kos yang bisa membuat perjanjian." />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const tenant = s("tenant");
    if (!isSolanaAddress(tenant)) return setErr("Alamat dompet penyewa tidak valid.");
    if (!s("namaKos") || !s("nomor")) return setErr("Nama kos dan nomor kamar wajib diisi.");
    setSaving(true);
    try {
      const a = await createAgreement(wallet!, {
        tenantWallet: tenant,
        namaKos: s("namaKos").slice(0, 80),
        nomorKamar: s("nomor").slice(0, 20),
        mulai: s("mulai"),
        selesai: s("selesai"),
        deposit: Number(s("deposit")),
      });
      navigate({ to: "/perjanjian/$id", params: { id: a.id } });
    } catch (e) {
      setErr(errMsg(e));
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="Buat perjanjian sewa" sub="Penyewa akan menyetujui perjanjian ini dari dompetnya." />
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nama kos">
            <input name="namaKos" required maxLength={80} className={inputCls} placeholder="Kos Melati" />
          </Field>
          <Field label="Nomor kamar">
            <input name="nomor" required maxLength={20} className={inputCls} placeholder="A3" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mulai">
              <input name="mulai" type="date" required className={inputCls} />
            </Field>
            <Field label="Selesai">
              <input name="selesai" type="date" required className={inputCls} />
            </Field>
          </div>
          <Field label="Uang jaminan (Rp, contoh)" hint="Nominal contoh saja — tidak ada uang yang dipindahkan.">
            <input name="deposit" type="number" min={1} step={1} required className={inputCls} placeholder="500000" />
          </Field>
          <Field label="Alamat dompet penyewa" hint="Minta penyewa menyalin alamat dari halaman Akun miliknya.">
            <input name="tenant" required className={`${inputCls} font-mono`} placeholder="7xKX…" />
          </Field>
          {err && <ErrorBox message={err} />}
          <Button type="submit" loading={saving} className="w-full">
            Simpan perjanjian
          </Button>
        </form>
      </Card>
    </div>
  );
}
