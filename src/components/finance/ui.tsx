import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  default: "text-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
} as const;
export type Tone = keyof typeof tones;

export function Stat({ label, value, hint, tone = "default", className }: { label: string; value: string; hint?: string; tone?: Tone; className?: string }) {
  return (
    <div className={cn("card-soft p-4", className)}>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-2xl font-semibold tabular", tones[tone])}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Bar({ pct, tone }: { pct: number; tone?: "auto" | "success" | "info" }) {
  const p = Math.max(0, pct);
  const t = tone && tone !== "auto" ? tone : p > 100 ? "destructive" : p >= 85 ? "warning" : "primary";
  const bg = { destructive: "bg-destructive", warning: "bg-warning", primary: "bg-primary", success: "bg-success", info: "bg-info" }[t];
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand/60">
      <div className={cn("h-full rounded-full transition-all duration-500", bg)} style={{ width: `${Math.min(100, p)}%` }} />
    </div>
  );
}

const badge: Record<string, string> = {
  Pago: "bg-success/15 text-success", "Pago integralmente": "bg-success/15 text-success", Concluída: "bg-success/15 text-success",
  Pendente: "bg-info/15 text-info", "Não pago": "bg-info/15 text-info", "Não iniciada": "bg-muted text-muted-foreground",
  "Parcialmente pago": "bg-warning/20 text-warning-foreground", "Em andamento": "bg-warning/20 text-warning-foreground", "Saldo pendente": "bg-warning/20 text-warning-foreground",
  Atrasado: "bg-destructive/15 text-destructive", Cancelada: "bg-destructive/10 text-destructive",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", badge[status] ?? "bg-muted text-muted-foreground")}>{status}</span>;
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-xl">{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Section({ title, children, action, className }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cn("card-soft p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
