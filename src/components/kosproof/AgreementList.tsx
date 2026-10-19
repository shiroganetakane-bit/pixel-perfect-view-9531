import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { shortKey } from "@/lib/kosproof/crypto";
import { formatRupiah, formatTanggal } from "@/lib/kosproof/format";
import type { Agreement } from "@/lib/kosproof/types";
import { DepositBadge, StatusBadge } from "./ui";

export function AgreementList({ items, sisi }: { items: Agreement[]; sisi: "pemilik" | "penyewa" }) {
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id}>
          <Link
            to="/perjanjian/$id"
            params={{ id: a.id }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{a.kode}</span>
                <StatusBadge status={a.status} />
                <DepositBadge status={a.depositStatus} />
              </div>
              <p className="font-semibold">
                {a.namaKos} · Kamar {a.nomorKamar}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTanggal(a.mulai)} – {formatTanggal(a.selesai)} · Jaminan {formatRupiah(a.deposit)} ·{" "}
                {sisi === "pemilik" ? "Penyewa" : "Pemilik"} {shortKey(sisi === "pemilik" ? a.tenantWallet : a.ownerWallet)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
