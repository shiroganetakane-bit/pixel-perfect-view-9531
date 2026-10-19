import { createFileRoute, Link } from "@tanstack/react-router";
import { AgreementList } from "@/components/kosproof/AgreementList";
import { Card, Empty, Loading, NeedWallet, PageTitle } from "@/components/kosproof/ui";
import { useAgreements, useSession } from "@/hooks/use-kosproof";

const T = "Dasbor Pemilik — KosProof";
const D = "Daftar kamar dan perjanjian sewa yang Anda kelola sebagai pemilik kos.";

export const Route = createFileRoute("/pemilik/")({
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
  component: DashPemilik,
});

function DashPemilik() {
  const { wallet, role, ready } = useSession();
  const all = useAgreements();
  if (!ready || all === undefined) return <Loading />;
  if (!wallet) return <NeedWallet />;
  if (role !== "pemilik") return <NeedWallet text="Halaman ini khusus pemilik kos. Ganti peran di halaman Akun." />;

  const mine = all.filter((a) => a.ownerWallet === wallet);
  const kamar = new Set(mine.map((a) => `${a.namaKos} · ${a.nomorKamar}`));
  const aktif = mine.filter((a) => a.status === "aktif");
  const perluTindak = mine.filter((a) => a.status === "aktif" && (!a.checkin?.tandaPemilik || (a.checkout && !a.checkout.tandaPemilik)));

  return (
    <div>
      <PageTitle
        title="Dasbor pemilik"
        sub="Kelola perjanjian sewa dan jaminan."
        action={
          <Link to="/pemilik/buat" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
            Buat perjanjian
          </Link>
        }
      />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          ["Kamar", kamar.size],
          ["Perjanjian aktif", aktif.length],
          ["Perlu tanda tangan", perluTindak.length],
        ].map(([l, n]) => (
          <Card key={l as string} className="p-4">
            <p className="font-display text-2xl font-semibold">{n}</p>
            <p className="text-xs text-muted-foreground">{l}</p>
          </Card>
        ))}
      </div>
      <h2 className="mb-3 font-display text-xl font-semibold">Semua perjanjian</h2>
      {mine.length === 0 ? <Empty title="Belum ada perjanjian">Mulai dengan membuat perjanjian untuk kamar Anda.</Empty> : <AgreementList items={mine} sisi="pemilik" />}
    </div>
  );
}
