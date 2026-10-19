import { shortKey } from "@/lib/kosproof/crypto";
import { formatWaktu } from "@/lib/kosproof/format";
import type { AuditEvent } from "@/lib/kosproof/types";

export function Timeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>;
  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-card bg-primary" />
          <p className="text-sm font-semibold">{e.aksi}</p>
          <p className="text-xs text-muted-foreground">
            {formatWaktu(e.waktu)} · dompet <span className="font-mono" title={e.wallet}>{shortKey(e.wallet)}</span>
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground" title="Sidik catatan">
            {e.hash}
          </p>
        </li>
      ))}
    </ol>
  );
}
