import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, FileSignature, PenLine, SearchCheck } from "lucide-react";
import { useSession } from "@/hooks/use-kosproof";

const T = "KosProof — Bukti Kondisi Kamar Kos";
const D = "Catat kondisi kamar saat check-in dan check-out, ditandatangani penyewa dan pemilik, agar urusan uang jaminan selesai berdasarkan bukti.";

export const Route = createFileRoute("/")({
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
  component: Landing,
});

const STEPS = [
  { icon: FileSignature, t: "Buat perjanjian", d: "Pemilik membuat perjanjian sewa, penyewa memeriksa dan menyetujuinya dari dompetnya." },
  { icon: Camera, t: "Foto kondisi kamar", d: "Saat masuk dan keluar, foto kasur, lemari, kamar mandi, dan dinding. Setiap foto diberi sidik unik." },
  { icon: PenLine, t: "Tanda tangani bersama", d: "Kedua pihak menandatangani bukti. Jika ada potongan jaminan, alasannya tercatat dan bisa dicek siapa saja." },
];

function Landing() {
  const { wallet, role } = useSession();
  const dash = role === "pemilik" ? "/pemilik" : role === "penyewa" ? "/penyewa" : "/masuk";
  return (
    <div>
      <section className="py-6 md:py-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">Uang jaminan kos, tanpa ribut</p>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Bukti kondisi kamar
          <br /> yang disepakati berdua.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Sering terjadi: saat keluar kos, jaminan dipotong karena "kerusakan" yang sebenarnya sudah ada sejak awal. Tanpa foto
          bersama, tidak ada yang bisa membuktikan. KosProof mencatat kondisi kamar sebagai bukti yang ditandatangani kedua pihak.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={wallet ? dash : "/masuk"} className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">
            {wallet ? "Buka dasbor" : "Hubungkan dompet"}
          </Link>
          <Link to="/verifikasi" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-6 text-sm font-semibold">
            <SearchCheck className="h-4 w-4" /> Cek keaslian bukti
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-4 font-display text-2xl font-semibold">Cara kerja</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <s.icon className="h-6 w-6 text-primary" />
                <span className="font-display text-3xl font-semibold text-muted-foreground/40">{i + 1}</span>
              </div>
              <p className="font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Prototype memakai jaringan uji Solana (devnet) dan data contoh — tidak ada uang sungguhan. Foto dan nama tidak pernah
          dikirim ke blockchain; yang dicatat hanya sidik foto, alamat dompet, status, dan waktu.
        </p>
      </section>
    </div>
  );
}
