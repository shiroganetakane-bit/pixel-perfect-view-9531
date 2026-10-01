import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, FileText, ShieldCheck, Users } from "lucide-react";
import {
  loadAgreements,
  formatRupiah,
  statusLabel,
  type Agreement,
} from "@/lib/agreements";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KosProof — Kesepakatan Sewa Kos Dua Pihak" },
      {
        name: "description",
        content:
          "Buat kesepakatan sewa kos yang dikonfirmasi pemilik dan penyewa, dengan sidik digital sebagai bukti isi tidak berubah.",
      },
      { property: "og:title", content: "KosProof — Kesepakatan Sewa Kos Dua Pihak" },
      {
        property: "og:description",
        content:
          "Buat kesepakatan sewa kos yang dikonfirmasi pemilik dan penyewa, dengan sidik digital sebagai bukti isi tidak berubah.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [items, setItems] = useState<Agreement[]>([]);

  useEffect(() => {
    setItems(loadAgreements());
  }, []);

  const aktif = items.filter((a) => a.status === "aktif").length;
  const menunggu = items.filter((a) => a.status === "menunggu").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-semibold tracking-tight">
              KosProof
            </span>
          </div>
          <Link
            to="/buat"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Buat Kesepakatan
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <section className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-accent-foreground/70">
            Prototype MVP-B
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Kesepakatan sewa kos,
            <br />
            disepakati dua pihak.
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Pemilik kos membuat kesepakatan, penyewa memeriksa dan
            mengonfirmasi. Setiap kesepakatan punya sidik digital (hash
            SHA-256) — kalau isinya diubah diam-diam, sidiknya berubah.
          </p>
        </section>

        <section className="mb-10 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <FileText className="mb-2 h-5 w-5 text-muted-foreground" />
            <p className="font-display text-2xl font-semibold">{items.length}</p>
            <p className="text-xs text-muted-foreground">Total kesepakatan</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
            <p className="font-display text-2xl font-semibold">{aktif}</p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Users className="mb-2 h-5 w-5 text-muted-foreground" />
            <p className="font-display text-2xl font-semibold">{menunggu}</p>
            <p className="text-xs text-muted-foreground">Menunggu konfirmasi</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-semibold">
            Daftar kesepakatan
          </h2>
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="text-muted-foreground">
                Belum ada kesepakatan. Mulai dengan membuat yang pertama.
              </p>
              <Link
                to="/buat"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Buat kesepakatan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/kesepakatan/$id"
                    params={{ id: a.id }}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {a.kode}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.status === "aktif"
                              ? "bg-primary/10 text-primary"
                              : a.status === "ditolak"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {statusLabel(a.status)}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-medium">
                        {a.kamar.namaKos} — Kamar {a.kamar.nomorKamar}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {a.pemilik.nama} ↔ {a.penyewa.nama} ·{" "}
                        {formatRupiah(a.hargaPerBulan)}/bulan
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-16 border-t border-border pt-6 text-xs text-muted-foreground">
          Prototype — data tersimpan di browser ini saja. Sidik digital
          dihitung dengan SHA-256 di perangkat Anda.
        </footer>
      </main>
    </div>
  );
}
