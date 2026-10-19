import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Building2, GraduationCap, LogOut, SearchCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button, Card, ErrorBox, PageTitle, Mono, errMsg } from "@/components/kosproof/ui";
import { useSession } from "@/hooks/use-kosproof";
import type { Role } from "@/lib/kosproof/types";

const T = "Masuk dengan Dompet — KosProof";
const D = "Hubungkan dompet Phantom atau Solflare di jaringan uji, lalu pilih peran sebagai pemilik kos, penyewa, atau pemeriksa.";

export const Route = createFileRoute("/masuk")({
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
  component: Masuk,
});

const ROLES: { r: Role; t: string; d: string; icon: typeof Building2 }[] = [
  { r: "pemilik", t: "Pemilik kos", d: "Membuat perjanjian dan mengelola jaminan.", icon: Building2 },
  { r: "penyewa", t: "Penyewa", d: "Menyetujui perjanjian dan mencatat kondisi kamar.", icon: GraduationCap },
  { r: "verifikator", t: "Pemeriksa", d: "Hanya mengecek keaslian bukti.", icon: SearchCheck },
];

const INSTALL: Record<string, string> = { Phantom: "https://phantom.app/download", Solflare: "https://solflare.com/download" };

function Masuk() {
  const { wallets, select, connecting } = useWallet();
  const { wallet, role, setRole, disconnect } = useSession();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  const installed = wallets.filter((w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable);
  const missing = Object.keys(INSTALL).filter((n) => !installed.some((w) => w.adapter.name === n));

  function pick(r: Role) {
    setRole(r);
    navigate({ to: r === "pemilik" ? "/pemilik" : r === "penyewa" ? "/penyewa" : "/verifikasi" });
  }

  if (!wallet) {
    return (
      <div className="mx-auto max-w-md">
        <PageTitle title="Hubungkan dompet" sub="Dompet dipakai sebagai identitas dan untuk menandatangani bukti." />
        <Card className="space-y-3">
          <div className="flex gap-2 rounded-lg bg-muted p-3 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
            KosProof tidak akan pernah meminta kata sandi rahasia (seed phrase) atau kunci pribadi dompet Anda.
          </div>
          {err && <ErrorBox message={err} />}
          {installed.length === 0 && <p className="text-sm text-muted-foreground">Belum ada dompet terpasang di browser ini.</p>}
          {installed.map((w) => (
            <Button
              key={w.adapter.name}
              variant="outline"
              className="w-full justify-start"
              loading={connecting}
              onClick={() => {
                setErr(null);
                try {
                  select(w.adapter.name);
                } catch (e) {
                  setErr(errMsg(e));
                }
              }}
            >
              <img src={w.adapter.icon} alt="" className="h-5 w-5" /> {w.adapter.name}
            </Button>
          ))}
          {missing.map((n) => (
            <a key={n} href={INSTALL[n]} target="_blank" rel="noreferrer" className="block text-sm text-primary underline">
              Pasang {n}
            </a>
          ))}
          <p className="text-xs text-muted-foreground">
            Pastikan dompet diatur ke jaringan uji (Devnet). Jika tombol tidak merespons di pratinjau, buka aplikasi di tab baru.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="Pilih peran" sub="Peran menentukan halaman dan aksi yang bisa Anda lakukan." />
      <Card className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="text-muted-foreground">Dompet terhubung</p>
          <Mono>{wallet}</Mono>
        </div>
        <Button variant="outline" onClick={() => disconnect()}>
          <LogOut className="h-4 w-4" /> Putuskan
        </Button>
      </Card>
      <div className="grid gap-3">
        {ROLES.map((x) => (
          <button
            key={x.r}
            onClick={() => pick(x.r)}
            className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors hover:border-primary ${role === x.r ? "border-primary bg-primary/5" : "border-border bg-card"}`}
          >
            <x.icon className="h-7 w-7 text-primary" />
            <div>
              <p className="font-semibold">{x.t}</p>
              <p className="text-sm text-muted-foreground">{x.d}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
