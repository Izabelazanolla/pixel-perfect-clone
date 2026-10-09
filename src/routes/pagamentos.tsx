import { createFileRoute, Link } from "@tanstack/react-router";
import { useFinance } from "@/lib/finance/store";
import { brl, fmtDate, upcoming } from "@/lib/finance/calc";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader, Stat, StatusBadge } from "@/components/finance/ui";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/pagamentos")({
  head: pageHead("Pagamentos", "Próximas parcelas, despesas pendentes e saldos de mão de obra a pagar."),
  component: Page,
});

function Page() {
  const { data, toggleInstallment } = useFinance();
  const list = upcoming(data);
  const late = list.filter((u) => u.status === "Atrasado");
  const inst = list.filter((u) => u.kind === "parcela");
  return (
    <>
      <PageHeader title="Próximos pagamentos" subtitle="Tudo o que ainda precisa ser pago." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total previsto" value={brl(list.reduce((s, u) => s + u.amount, 0))} tone="warning" />
        <Stat label="Parcelas e despesas" value={brl(inst.reduce((s, u) => s + u.amount, 0))} hint={`${inst.length} em aberto`} />
        <Stat label="Mão de obra pendente" value={brl(list.filter((u) => u.kind === "mao-de-obra").reduce((s, u) => s + u.amount, 0))} />
        <Stat label="Atrasados" value={brl(late.reduce((s, u) => s + u.amount, 0))} tone={late.length ? "danger" : "default"} hint={`${late.length} item(s)`} />
      </div>
      {list.length === 0 ? <Empty>Nada pendente. Tudo pago!</Empty> : (
        <div className="card-soft divide-y">
          {list.map((u, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="w-24 text-sm font-semibold">{u.date ? fmtDate(u.date) : "—"}</div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{u.label}</div>
                <div className="text-xs text-muted-foreground">{u.kind === "parcela" ? "Parcela / despesa" : "Saldo de mão de obra"}</div>
              </div>
              <StatusBadge status={u.status} />
              <div className="w-28 text-right font-semibold tabular">{brl(u.amount)}</div>
              {u.kind === "parcela"
                ? <Button size="sm" variant="outline" onClick={() => toggleInstallment(u.refId, u.installmentId!)}>Marcar pago</Button>
                : <Button size="sm" variant="outline" asChild><Link to="/mao-de-obra/$id" params={{ id: u.refId }}>Pagar</Link></Button>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
