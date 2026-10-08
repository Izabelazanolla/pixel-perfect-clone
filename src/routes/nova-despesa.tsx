import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useFinance, uid } from "@/lib/finance/store";
import { brl, generateInstallments, round2, todayISO } from "@/lib/finance/calc";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type ExpenseCategory, type PaymentMethod } from "@/lib/finance/types";
import { Field, PageHeader } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/finance/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nova-despesa")({
  head: pageHead("Nova despesa", "Registre rapidamente um gasto da reforma, à vista ou parcelado."),
  component: NewExpense,
});

function NewExpense() {
  const { data, upsert } = useFinance();
  const nav = useNavigate();
  const [f, setF] = useState({
    description: "", total: "", date: todayISO(), areaId: data.areas[0]?.id ?? "", category: "Material" as ExpenseCategory,
    supplierId: "", method: "Pix" as PaymentMethod, status: "Pago", notes: "", receipt: "",
    parcelado: false, count: "2", firstDue: todayISO(), paidCount: "0",
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));
  const total = Number(f.total.replace(",", ".")) || 0;
  const count = Math.max(2, Number(f.count) || 2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.description.trim() || total <= 0 || !f.areaId) return toast.error("Preencha descrição, valor e área.");
    const installments = f.parcelado
      ? generateInstallments(total, count, f.firstDue, f.method, uid).map((i, k) => (k < Number(f.paidCount) ? { ...i, paidAt: i.due } : i))
      : [{ id: uid(), number: 1, due: f.date, amount: round2(total), method: f.method, paidAt: f.status === "Pago" ? f.date : undefined }];
    upsert("expenses", {
      id: uid(), description: f.description.trim(), total: round2(total), date: f.date, areaId: f.areaId, category: f.category,
      supplierId: f.supplierId || undefined, method: f.method, notes: f.notes, receipt: f.receipt || undefined, installments,
    });
    toast.success("Despesa registrada");
    nav({ to: "/gastos" });
  }

  return (
    <>
      <PageHeader title="Nova despesa" subtitle="Compras de material, ferramentas, frete e serviços. Mão de obra fica em “Mão de obra”." />
      <form onSubmit={submit} className="card-soft grid gap-4 p-5 md:grid-cols-2">
        <Field label="Descrição" className="md:col-span-2"><input className="field" autoFocus value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Ex.: Cimento e areia" /></Field>
        <Field label="Valor total (R$)"><input className="field tabular" inputMode="decimal" value={f.total} onChange={(e) => set("total", e.target.value)} placeholder="0,00" /></Field>
        <Field label="Data"><input type="date" className="field" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Área da reforma">
          <select className="field" value={f.areaId} onChange={(e) => set("areaId", e.target.value)}>{data.areas.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}</select>
        </Field>
        <Field label="Categoria">
          <select className="field" value={f.category} onChange={(e) => set("category", e.target.value)}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Fornecedor">
          <select className="field" value={f.supplierId} onChange={(e) => set("supplierId", e.target.value)}>
            <option value="">— Nenhum —</option>{data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Forma de pagamento">
          <select className="field" value={f.method} onChange={(e) => set("method", e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
        </Field>

        <div className="md:col-span-2">
          <div className="inline-flex rounded-lg bg-muted p-1 text-sm">
            {[["À vista", false], ["Parcelado", true]].map(([l, v]) => (
              <button type="button" key={String(l)} onClick={() => set("parcelado", v as boolean)} className={cn("rounded-md px-4 py-1.5 font-semibold", f.parcelado === v ? "bg-card shadow-sm" : "text-muted-foreground")}>{l as string}</button>
            ))}
          </div>
        </div>

        {f.parcelado ? (
          <div className="grid gap-4 rounded-xl bg-muted/60 p-4 md:col-span-2 md:grid-cols-3">
            <Field label="Nº de parcelas"><input type="number" min={2} className="field" value={f.count} onChange={(e) => set("count", e.target.value)} /></Field>
            <Field label="1º vencimento"><input type="date" className="field" value={f.firstDue} onChange={(e) => set("firstDue", e.target.value)} /></Field>
            <Field label="Parcelas já pagas"><input type="number" min={0} max={count} className="field" value={f.paidCount} onChange={(e) => set("paidCount", e.target.value)} /></Field>
            <p className="text-sm text-muted-foreground md:col-span-3">{count}x de <b className="text-foreground tabular">{brl(total / count)}</b> — vencimentos mensais gerados automaticamente.</p>
          </div>
        ) : (
          <Field label="Status">
            <select className="field" value={f.status} onChange={(e) => set("status", e.target.value)}><option>Pago</option><option>Pendente</option></select>
          </Field>
        )}

        <Field label="Comprovante / foto">
          <input type="file" accept="image/*,application/pdf" className="field pt-2 text-xs" onChange={(e) => set("receipt", e.target.files?.[0]?.name ?? "")} />
        </Field>
        <Field label="Observação" className="md:col-span-2"><textarea className="field h-20 py-2" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="ghost" onClick={() => nav({ to: "/gastos" })}>Cancelar</Button>
          <Button type="submit" size="lg">Salvar despesa</Button>
        </div>
      </form>
    </>
  );
}
