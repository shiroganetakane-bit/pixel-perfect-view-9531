import { Link } from "@tanstack/react-router";
import { FilePlus2, Home, LayoutDashboard, SearchCheck, ShieldCheck, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-kosproof";
import { shortKey } from "@/lib/kosproof/crypto";

type Item = { to: string; label: string; icon: typeof Home };

export function AppShell({ children }: { children: ReactNode }) {
  const { wallet, role } = useSession();
  const items: Item[] = [{ to: "/", label: "Beranda", icon: Home }];
  if (role === "pemilik") {
    items.push({ to: "/pemilik", label: "Dasbor", icon: LayoutDashboard });
    items.push({ to: "/pemilik/buat", label: "Buat", icon: FilePlus2 });
  }
  if (role === "penyewa") items.push({ to: "/penyewa", label: "Dasbor", icon: LayoutDashboard });
  items.push({ to: "/verifikasi", label: "Cek bukti", icon: SearchCheck });
  items.push({ to: "/masuk", label: wallet ? "Akun" : "Masuk", icon: Wallet });

  const linkCls = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground";
  const activeCls = "!bg-primary/10 !text-primary";

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-semibold">KosProof</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>
              <it.icon className="h-4 w-4" /> {it.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-muted p-3 text-xs">
          <p className="font-semibold">Jaringan uji (devnet)</p>
          <p className="text-muted-foreground">{wallet ? `Dompet ${shortKey(wallet)}` : "Belum terhubung"}</p>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold">KosProof</span>
        </Link>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{wallet ? shortKey(wallet) : "Devnet"}</span>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card md:hidden">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
            activeOptions={{ exact: true }}
          >
            <it.icon className="h-5 w-5" />
            {it.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
