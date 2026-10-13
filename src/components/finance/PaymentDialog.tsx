import { useState } from "react";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/store";
import { brl, contractSummary, todayISO, validateLaborPayment } from "@/lib/finance/calc";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/finance/types";
import { Field, Modal } from "./ui";
import { Button } from "@/components/ui/button";

export function PaymentDialog({ contractId, open, onOpenChange }: { contractId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, addLaborPayment } = useFinance();
  const c = data.contracts.find((x) => x.id === contractId);
  const [f, setF] = useState({ date: todayISO(), amount: "", method: "Pix" as PaymentMethod, notes: "", receipt: "" });
  const amount = Number(f.amount.replace(",", ".")) || 0;
  const err = c && f.amount ? validateLaborPayment(c, amount) : null;
  const s = c ? contractSummary(c) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!c) return;
    const res = addLaborPayment(c.id, { date: f.date, amount, method: f.method, notes: f.notes, receipt: f.receipt || undefined });
    if (res) { toast.error(res); return; }
    toast.success(`Pagamento registrado. Restante: ${brl(s!.remaining - amount)}`);
    setF({ date: todayISO(), amount: "", method: "Pix", notes: "", receipt: "" });
    onOpenChange(false);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Adicionar pagamento">
      {c && s && (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted p-3 text-sm sm:col-span-2">
            {c.service} — contratado <b className="tabular">{brl(c.amount)}</b>, pago <b className="tabular">{brl(s.paid)}</b>, falta <b className="text-warning tabular">{brl(s.remaining)}</b>
          </div>
          <Field label="Valor (R$)"><input className="field tabular" inputMode="decimal" autoFocus value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Data"><input type="date" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Forma de pagamento">
            <select className="field" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as PaymentMethod })}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
          </Field>
          <Field label="Comprovante"><input type="file" className="field pt-2 text-xs" onChange={(e) => setF({ ...f, receipt: e.target.files?.[0]?.name ?? "" })} /></Field>
          <Field label="Observação" className="sm:col-span-2"><input className="field" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          {err && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive sm:col-span-2">{err}</div>}
          {!err && amount > 0 && <div className="text-sm text-muted-foreground sm:col-span-2">Depois deste pagamento faltará <b className="text-foreground tabular">{brl(s.remaining - amount)}</b>.</div>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!!err || amount <= 0}>Registrar pagamento</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
