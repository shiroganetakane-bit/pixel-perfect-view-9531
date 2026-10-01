import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  hashAgreement,
  makeId,
  makeKode,
  upsertAgreement,
  type Agreement,
} from "@/lib/agreements";

export const Route = createFileRoute("/buat")({
  head: () => ({
    meta: [
      { title: "Buat Kesepakatan — KosProof" },
      {
        name: "description",
        content:
          "Isi detail sewa kos: data pemilik, penyewa, kamar, harga, dan aturan. Kesepakatan lalu dikonfirmasi kedua pihak.",
      },
      { property: "og:title", content: "Buat Kesepakatan — KosProof" },
      {
        property: "og:description",
        content: "Isi detail sewa kos dan kirim untuk dikonfirmasi penyewa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Buat,
});

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";
const labelCls = "mb-1 block text-sm font-medium";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Buat() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();

    const base = {
      id: makeId(),
      kode: makeKode(),
      pemilik: { nama: s("pNama"), telepon: s("pTelp"), nik: s("pNik") },
      penyewa: { nama: s("sNama"), telepon: s("sTelp"), nik: s("sNik") },
      kamar: {
        namaKos: s("namaKos"),
        alamat: s("alamat"),
        nomorKamar: s("nomorKamar"),
      },
      hargaPerBulan: Number(s("harga") || 0),
      deposit: Number(s("deposit") || 0),
      tanggalMulai: s("mulai"),
      durasiBulan: Number(s("durasi") || 1),
      aturan: s("aturan"),
      dibuatPada: new Date().toISOString(),
    };

    const hash = await hashAgreement(base);
    const agreement: Agreement = {
      ...base,
      hash,
      konfirmasiPemilik: new Date().toISOString(), // pemilik mengonfirmasi saat membuat
      konfirmasiPenyewa: null,
      status: "menunggu",
    };
    upsertAgreement(agreement);
    navigate({ to: "/kesepakatan/$id", params: { id: agreement.id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-display text-lg font-semibold">
            Buat Kesepakatan Baru
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <form onSubmit={onSubmit} className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">
              Pemilik kos
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nama lengkap">
                <input name="pNama" required className={inputCls} placeholder="Ibu Ratna" />
              </Field>
              <Field label="No. HP / WhatsApp">
                <input name="pTelp" required className={inputCls} placeholder="0812…" />
              </Field>
              <Field label="NIK (opsional)">
                <input name="pNik" className={inputCls} placeholder="32…" />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">Penyewa</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nama lengkap">
                <input name="sNama" required className={inputCls} placeholder="Andi Pratama" />
              </Field>
              <Field label="No. HP / WhatsApp">
                <input name="sTelp" required className={inputCls} placeholder="0857…" />
              </Field>
              <Field label="NIK (opsional)">
                <input name="sNik" className={inputCls} placeholder="32…" />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">
              Kamar & biaya
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama kos">
                <input name="namaKos" required className={inputCls} placeholder="Kos Melati" />
              </Field>
              <Field label="Nomor / nama kamar">
                <input name="nomorKamar" required className={inputCls} placeholder="A-3" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Alamat kos">
                  <input name="alamat" required className={inputCls} placeholder="Jl. Cendana No. 12, Bandung" />
                </Field>
              </div>
              <Field label="Harga per bulan (Rp)">
                <input name="harga" type="number" min={0} required className={inputCls} placeholder="850000" />
              </Field>
              <Field label="Deposit (Rp, opsional)">
                <input name="deposit" type="number" min={0} className={inputCls} placeholder="0" />
              </Field>
              <Field label="Tanggal mulai sewa">
                <input name="mulai" type="date" required className={inputCls} />
              </Field>
              <Field label="Durasi (bulan)">
                <input name="durasi" type="number" min={1} required defaultValue={6} className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Aturan & catatan (opsional)">
                  <textarea
                    name="aturan"
                    rows={3}
                    className={inputCls}
                    placeholder="Contoh: listrik token ditanggung penyewa, tamu maksimal sampai pukul 21.00…"
                  />
                </Field>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Dengan menekan tombol ini, Anda (pemilik) menyetujui isi
              kesepakatan. Penyewa lalu diminta memeriksa dan mengonfirmasi.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Buat & setujui"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
