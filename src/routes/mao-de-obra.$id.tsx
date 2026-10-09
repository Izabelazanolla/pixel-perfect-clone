import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/store";
import { brl, contractSummary, fmtDate } from "@/lib/finance/calc";
import { EXEC_STATUSES, type ExecStatus } from "@/lib/finance/types";
import { Bar, Empty, Field, Modal, Section, Stat, StatusBadge } from "@/components/finance/ui";
import { PaymentDialog } from "@/components/finance/PaymentDialog";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/mao-de-obra/$id")({
  head: pageHead("Contratação", "Resumo, histórico de pagamentos e alterações de uma contratação de mão de obra."),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data, upsert, remove, removeLaborPayment, changeContractAmount } = useFinance();
  const c = data.contracts.find((x) => x.id === id);
  const [pay, setPay] = useState(false);
  const [chg, setChg] = useState(false);
  const [nv, setNv] = useState({ value: "", reason: "" });
  if (!c) return <Empty>Contratação não encontrada. <Link to="/mao-de-obra" className="font-semibold text-primary">Voltar</Link></Empty>;
  const s = contractSummary(c);
  const p = data.professionals.find((x) => x.id === c.professionalId);

  return (
    <>
      <Link to="/mao-de-obra" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Mão de obra</Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{p?.name} — {c.service}</h1>
          <p className="text-sm text-muted-foreground">{p?.type} · {data.areas.find((a) => a.id === c.areaId)?.name} · contratado em {fmtDate(c.date)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="field w-auto" value={c.execStatus} onChange={(e) => upsert("contracts", { ...c, execStatus: e.target.value as ExecStatus })}>{EXEC_STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
          <Button variant="outline" onClick={() => setChg(true)}>Alterar valor</Button>
          {s.remaining > 0 && <Button onClick={() => setPay(true)}><Plus /> Adicionar pagamento</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Contratado" value={brl(c.amount)} />
        <Stat label="Total pago" value={brl(s.paid)} tone="success" hint={`${Math.round(s.pct)}%`} />
        <Stat label="Restante" value={brl(s.remaining)} tone="warning" hint={`${Math.round(s.remainingPct)}%`} />
        <div className="card-soft flex flex-col justify-center gap-2 p-4"><span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Financeiro</span><StatusBadge status={s.financial} /></div>
      </div>
      <div className="card-soft mt-3 p-4"><Bar pct={s.pct} tone="success" /></div>

      <Section title="Histórico de pagamentos" className="mt-6">
        {c.payments.length === 0 ? <Empty>Nenhum pagamento ainda.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Data</th><th className="text-right">Valor</th><th className="pl-4">Forma</th><th>Observação</th><th /></tr></thead>
              <tbody className="divide-y">
                {[...c.payments].sort((a, b) => a.date.localeCompare(b.date)).map((pm) => (
                  <tr key={pm.id}>
                    <td className="py-2.5">{fmtDate(pm.date)}</td><td className="text-right font-semibold tabular">{brl(pm.amount)}</td>
                    <td className="pl-4">{pm.method}</td><td className="text-muted-foreground">{pm.notes}{pm.receipt && ` · 📎 ${pm.receipt}`}</td>
                    <td className="text-right"><button aria-label="Excluir pagamento" onClick={() => confirm("Excluir pagamento?") && removeLaborPayment(c.id, pm.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {c.changes.length > 0 && (
        <Section title="Alterações do valor contratado" className="mt-4">
          <ul className="divide-y text-sm">
            {c.changes.map((ch) => (
              <li key={ch.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{fmtDate(ch.date)} — {ch.reason}</span>
                <span className="tabular">{brl(ch.previous)} → <b>{brl(ch.next)}</b> <span className={ch.next >= ch.previous ? "text-warning" : "text-success"}>({ch.next >= ch.previous ? "+" : ""}{brl(ch.next - ch.previous)})</span></span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <div className="mt-6 text-right"><Button variant="ghost" className="text-destructive" onClick={() => { if (confirm("Excluir contratação e seus pagamentos?")) { remove("contracts", c.id); history.back(); } }}>Excluir contratação</Button></div>

      <PaymentDialog contractId={c.id} open={pay} onOpenChange={setPay} />
      <Modal open={chg} onOpenChange={setChg} title="Alterar valor contratado">
        <form className="grid gap-3" onSubmit={(e) => {
          e.preventDefault();
          const v = Number(nv.value.replace(",", "."));
          if (!(v > 0) || !nv.reason.trim()) return toast.error("Informe novo valor e motivo.");
          if (v < s.paid) return toast.error(`O novo valor não pode ser menor que o já pago (${brl(s.paid)}).`);
          changeContractAmount(c.id, v, nv.reason.trim()); setChg(false); setNv({ value: "", reason: "" }); toast.success("Valor atualizado");
        }}>
          <p className="text-sm text-muted-foreground">Valor atual: <b className="text-foreground">{brl(c.amount)}</b></p>
          <Field label="Novo valor (R$)"><input className="field" inputMode="decimal" value={nv.value} onChange={(e) => setNv({ ...nv, value: e.target.value })} /></Field>
          <Field label="Motivo"><input className="field" value={nv.reason} onChange={(e) => setNv({ ...nv, reason: e.target.value })} placeholder="Ex.: acréscimo de serviço" /></Field>
          <div className="flex justify-end"><Button type="submit">Salvar alteração</Button></div>
        </form>
      </Modal>
    </>
  );
}
