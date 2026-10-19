import { createFileRoute } from "@tanstack/react-router";
import { AgreementList } from "@/components/kosproof/AgreementList";
import { Card, DepositBadge, Empty, Loading, Mono, NeedWallet, PageTitle } from "@/components/kosproof/ui";
import { useAgreements, useSession } from "@/hooks/use-kosproof";
import { formatRupiah } from "@/lib/kosproof/format";

const T = "Dasbor Penyewa — KosProof";
const D = "Lihat perjanjian sewa aktif, status uang jaminan, dan riwayat kos Anda.";

export const Route = createFileRoute("/penyewa")({
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
  component: DashPenyewa,
});

function DashPenyewa() {
  const { wallet, role, ready } = useSession();
  const all = useAgreements();
  if (!ready || all === undefined) return <Loading />;
  if (!wallet) return <NeedWallet />;
  if (role !== "penyewa") return <NeedWallet text="Halaman ini khusus penyewa. Ganti peran di halaman Akun." />;

  const mine = all.filter((a) => a.tenantWallet === wallet);
  const berjalan = mine.filter((a) => a.status === "menunggu" || a.status === "aktif");
  const riwayat = mine.filter((a) => a.status === "selesai" || a.status === "ditolak");
  const aktif = mine.find((a) => a.status === "aktif");

  return (
    <div>
      <PageTitle title="Dasbor penyewa" sub="Perjanjian, jaminan, dan riwayat Anda." />
      <Card className="mb-6">
        <p className="text-xs text-muted-foreground">Alamat dompet Anda (bagikan ke pemilik kos)</p>
        <Mono>{wallet}</Mono>
        {aktif && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Jaminan {aktif.kode}</p>
              <p className="font-display text-xl font-semibold">{formatRupiah(aktif.deposit)}</p>
            </div>
            <DepositBadge status={aktif.depositStatus} />
          </div>
        )}
      </Card>
      <h2 className="mb-3 font-display text-xl font-semibold">Perjanjian berjalan</h2>
      {berjalan.length === 0 ? <Empty title="Belum ada perjanjian">Perjanjian dari pemilik kos akan muncul di sini.</Empty> : <AgreementList items={berjalan} sisi="penyewa" />}
      {riwayat.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-display text-xl font-semibold">Riwayat</h2>
          <AgreementList items={riwayat} sisi="penyewa" />
        </>
      )}
    </div>
  );
}
