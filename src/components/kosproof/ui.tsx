import { Link } from "@tanstack/react-router";
import { AlertTriangle, Inbox, Loader2, Wallet } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DEPOSIT_LABEL, STATUS_LABEL } from "@/lib/kosproof/format";
import type { AgreementStatus, DepositStatus } from "@/lib/kosproof/types";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("min-w-0 rounded-2xl border border-border bg-card p-5", className)}>{children}</div>;
}

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger"; loading?: boolean }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-background hover:bg-muted",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  }[variant];
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-50",
        v,
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const inputCls =
  "w-full min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const DEPOSIT_TONE: Record<DepositStatus, string> = {
  ditahan: "bg-info/15 text-info border-info/30",
  diajukan: "bg-warning/25 text-warning-foreground border-warning/50",
  disetujui: "bg-accent/15 text-accent border-accent/30",
  dikembalikan: "bg-success/15 text-success border-success/30",
};

export function DepositBadge({ status }: { status: DepositStatus | null }) {
  if (!status) return <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">Belum berlaku</span>;
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", DEPOSIT_TONE[status])}>{DEPOSIT_LABEL[status]}</span>;
}

const STATUS_TONE: Record<AgreementStatus, string> = {
  menunggu: "bg-warning/25 text-warning-foreground border-warning/50",
  aktif: "bg-success/15 text-success border-success/30",
  ditolak: "bg-destructive/10 text-destructive border-destructive/30",
  selesai: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: AgreementStatus }) {
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", STATUS_TONE[status])}>{STATUS_LABEL[status]}</span>;
}

export function Loading({ text = "Memuat…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {message}
    </div>
  );
}

export function NeedWallet({ text = "Hubungkan dompet untuk melanjutkan." }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <Wallet className="mx-auto mb-3 h-8 w-8 text-primary" />
      <p className="font-display text-lg font-semibold">{text}</p>
      <Link to="/masuk" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
        Hubungkan dompet
      </Link>
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{children}</code>;
}

export function errMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/reject|denied|cancel/i.test(m)) return "Permintaan dibatalkan di dompet.";
  return m;
}
