import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useFinance, uid } from "@/lib/finance/store";
import { brl, contractSummary, round2, todayISO } from "@/lib/finance/calc";
import { EXEC_STATUSES, type ExecStatus } from "@/lib/finance/types";
import { Bar, Empty, Field, Modal, PageHeader, Stat, StatusBadge } from "@/components/finance/ui";
import { PaymentDialog } from "@/components/finance/PaymentDialog";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/finance/meta";
import { toast } from "sonner";

export const Route = createFileRoute("/mao-de-obra/")({
  head: pageHead("Mão de obra", "Contratações de profissionais, pagamentos variáveis e saldo a pagar."),
  component: Page,
});

function Page() {
  const { data, upsert } = useFinance();
  const [pay, setPay] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [f, setF] = useState({ professionalId: data.professionals[0]?.id ?? "", service: "", areaId: data.areas[0]?.id ?? "", date: todayISO(), amount: "", execStatus: "Não iniciada" as ExecStatus, notes: "" });
  const all = data.contracts.map((c) => ({ c, s: contractSummary(c), p: data.professionals.find((p) => p.id === c.professionalId) }));
  const active = all.filter((x) => x.c.execStatus !== "Cancelada");
  const totC = active.reduce((a, x) => a + x.c.amount, 0), totP = all.reduce((a, x) => a + x.s.paid, 0);

  function create(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(f.amount.replace(",", ".")) || 0;
    if (!f.professionalId || !f.service || amount <= 0) return toast.error("Preencha profissional, serviço e valor.");
    upsert("contracts", { id: uid(), ...f, amount: round2(amount), payments: [], changes: [] });
    setNewOpen(false); toast.success("Contratação criada");
  }

  return (
    <>
      <PageHeader title="Mão de obra" subtitle="Valor combinado com pagamentos livres, até quitar." actions={<Button onClick={() => setNewOpen(true)}><Plus /> Nova contratação</Button>} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Contratado" value={brl(totC)} /><Stat label="Pago" value={brl(totP)} tone="success" /><Stat label="Falta pagar" value={brl(active.reduce((a, x) => a + x.s.remaining, 0))} tone="warning" />
      </div>
      {all.length === 0 ? <Empty>Nenhuma contratação ainda.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {all.map(({ c, s, p }) => (
            <div key={c.id} className="card-soft p-5">
              <div className="flex items-start justify-between gap-2">
                <Link to="/mao-de-obra/$id" params={{ id: c.id }} className="min-w-0 hover:underline">
                  <div className="font-semibold">{p?.name} <span className="text-xs text-muted-foreground">· {p?.type}</span></div>
                  <div className="text-sm text-muted-foreground">{c.service} · {data.areas.find((a) => a.id === c.areaId)?.name}</div>
                </Link>
                <StatusBadge status={c.execStatus} />
              </div>
              <div className="mt-4 flex items-baseline justify-between text-sm tabular"><span><b className="text-base">{brl(s.paid)}</b> / {brl(c.amount)}</span><span className="font-semibold">{Math.round(s.pct)}%</span></div>
              <div className="my-2"><Bar pct={s.pct} tone="success" /></div>
              <div className="flex items-center justify-between">
                <div className="text-sm">{s.remaining > 0 ? <>Falta pagar: <b className="text-warning tabular">{brl(s.remaining)}</b></> : <StatusBadge status="Pago integralmente" />}</div>
                {s.remaining > 0 && c.execStatus !== "Cancelada" && <Button size="sm" onClick={() => setPay(c.id)}><Plus /> Pagamento</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <PaymentDialog contractId={pay} open={!!pay} onOpenChange={(o) => !o && setPay(null)} />
      <Modal open={newOpen} onOpenChange={setNewOpen} title="Nova contratação">
        {data.professionals.length === 0 ? <p className="text-sm">Cadastre um profissional primeiro em <Link to="/profissionais" className="font-semibold text-primary">Profissionais</Link>.</p> : (
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
            <Field label="Profissional"><select className="field" value={f.professionalId} onChange={(e) => setF({ ...f, professionalId: e.target.value })}>{data.professionals.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}</select></Field>
            <Field label="Área"><select className="field" value={f.areaId} onChange={(e) => setF({ ...f, areaId: e.target.value })}>{data.areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            <Field label="Serviço" className="sm:col-span-2"><input className="field" value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })} /></Field>
            <Field label="Valor contratado (R$)"><input className="field" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Data de contratação"><input type="date" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            <Field label="Status da execução"><select className="field" value={f.execStatus} onChange={(e) => setF({ ...f, execStatus: e.target.value as ExecStatus })}>{EXEC_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Observações" className="sm:col-span-2"><textarea className="field h-16 py-2" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
            <div className="flex justify-end sm:col-span-2"><Button type="submit">Criar contratação</Button></div>
          </form>
        )}
      </Modal>
    </>
  );
}
