import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/lib/finance/store";
import { brl, expenseSummary, fmtDate, installmentStatus, contractSummary } from "@/lib/finance/calc";
import { EXPENSE_CATEGORIES, LABOR_CATEGORY, PAYMENT_METHODS } from "@/lib/finance/types";
import { Empty, PageHeader, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/gastos")({
  head: pageHead("Gastos", "Histórico de todos os lançamentos da reforma com filtros e busca."),
  component: Gastos,
});

interface Row { id: string; kind: "despesa" | "mao"; date: string; description: string; areaId: string; category: string; who: string; whoId?: string | undefined; method: string; total: number; paid: number; status: string }

function Gastos() {
  const { data, remove, toggleInstallment } = useFinance();
  const [q, setQ] = useState("");
  const [flt, setFlt] = useState({ area: "", cat: "", who: "", method: "", status: "", from: "", to: "" });
  const [sort, setSort] = useState("recent");
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo<Row[]>(() => {
    const r: Row[] = data.expenses.map((e) => {
      const s = expenseSummary(e);
      const sup = data.suppliers.find((x) => x.id === e.supplierId);
      return { id: e.id, kind: "despesa", date: e.date, description: e.description, areaId: e.areaId, category: e.category, who: sup?.name ?? "—", whoId: e.supplierId, method: e.method, total: e.total, paid: s.paid, status: s.status };
    });
    for (const c of data.contracts) {
      const s = contractSummary(c);
      const p = data.professionals.find((x) => x.id === c.professionalId);
      r.push({ id: c.id, kind: "mao", date: c.date, description: c.service, areaId: c.areaId, category: LABOR_CATEGORY, who: p?.name ?? "—", whoId: c.professionalId, method: c.payments.at(-1)?.method ?? "—", total: c.amount, paid: s.paid, status: s.financial === "Pago integralmente" ? "Pago" : s.financial === "Não pago" ? "Pendente" : s.financial });
    }
    return r
      .filter((x) => !q || x.description.toLowerCase().includes(q.toLowerCase()))
      .filter((x) => (!flt.area || x.areaId === flt.area) && (!flt.cat || x.category === flt.cat) && (!flt.who || x.whoId === flt.who) && (!flt.method || x.method === flt.method) && (!flt.status || x.status === flt.status) && (!flt.from || x.date >= flt.from) && (!flt.to || x.date <= flt.to))
      .sort((a, b) => sort === "recent" ? b.date.localeCompare(a.date) : sort === "old" ? a.date.localeCompare(b.date) : sort === "high" ? b.total - a.total : a.total - b.total);
  }, [data, q, flt, sort]);

  const sel = (k: keyof typeof flt, label: string, opts: { v: string; l: string }[]) => (
    <select className="field" value={flt[k]} onChange={(e) => setFlt((s) => ({ ...s, [k]: e.target.value }))}>
      <option value="">{label}</option>{opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
  const sum = rows.reduce((s, r) => s + r.total, 0);

  return (
    <>
      <PageHeader title="Gastos" subtitle={`${rows.length} lançamentos · ${brl(sum)}`} actions={<Button asChild><Link to="/nova-despesa"><Plus /> Nova despesa</Link></Button>} />
      <div className="card-soft mb-4 grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input className="field sm:col-span-2" placeholder="Buscar por descrição…" value={q} onChange={(e) => setQ(e.target.value)} />
        {sel("area", "Todas as áreas", data.areas.map((a) => ({ v: a.id, l: a.name })))}
        {sel("cat", "Todas as categorias", [...EXPENSE_CATEGORIES, LABOR_CATEGORY].map((c) => ({ v: c, l: c })))}
        {sel("who", "Fornecedor/profissional", [...data.suppliers.map((s) => ({ v: s.id, l: s.name })), ...data.professionals.map((p) => ({ v: p.id, l: `${p.name} (${p.type})` }))])}
        {sel("method", "Forma de pagamento", PAYMENT_METHODS.map((m) => ({ v: m, l: m })))}
        {sel("status", "Todos os status", ["Pago", "Pendente", "Parcialmente pago"].map((m) => ({ v: m, l: m })))}
        <select className="field" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Mais recente</option><option value="old">Mais antigo</option><option value="high">Maior valor</option><option value="low">Menor valor</option>
        </select>
        <input type="date" className="field" value={flt.from} onChange={(e) => setFlt((s) => ({ ...s, from: e.target.value }))} aria-label="De" />
        <input type="date" className="field" value={flt.to} onChange={(e) => setFlt((s) => ({ ...s, to: e.target.value }))} aria-label="Até" />
      </div>

      {rows.length === 0 ? <Empty>Nenhum lançamento encontrado.</Empty> : (
        <div className="card-soft divide-y overflow-hidden">
          {rows.map((r) => {
            const exp = r.kind === "despesa" ? data.expenses.find((e) => e.id === r.id) : undefined;
            const area = data.areas.find((a) => a.id === r.areaId);
            return (
              <div key={r.kind + r.id}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      {r.kind === "mao" ? <Link to="/mao-de-obra/$id" params={{ id: r.id }} className="hover:underline">{r.who} — {r.description}</Link> : r.description}
                      {exp && exp.installments.length > 1 && <span className="ml-2 text-xs font-medium text-info">{exp.installments.length}x</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{fmtDate(r.date)} · {area?.icon} {area?.name} · {r.category}{r.kind === "despesa" && ` · ${r.who}`} · {r.method}</div>
                  </div>
                  <StatusBadge status={r.status} />
                  <div className="w-32 text-right">
                    <div className="font-semibold tabular">{brl(r.total)}</div>
                    {r.paid < r.total && <div className="text-xs text-muted-foreground tabular">pago {brl(r.paid)}</div>}
                  </div>
                  {exp && (
                    <div className="flex">
                      <button aria-label="Detalhes" onClick={() => setOpen(open === r.id ? null : r.id)} className="rounded p-1.5 hover:bg-accent"><ChevronDown className="size-4" /></button>
                      <button aria-label="Excluir" onClick={() => confirm("Excluir esta despesa?") && remove("expenses", r.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /></button>
                    </div>
                  )}
                </div>
                {exp && open === r.id && (
                  <div className="bg-muted/50 px-4 py-3">
                    {exp.notes && <p className="mb-2 text-sm text-muted-foreground">{exp.notes}</p>}
                    {exp.receipt && <p className="mb-2 text-xs text-muted-foreground">Comprovante: {exp.receipt}</p>}
                    <div className="space-y-1.5">
                      {exp.installments.map((i) => (
                        <div key={i.id} className="flex items-center gap-3 text-sm">
                          <span className="w-12 text-muted-foreground">{i.number}/{exp.installments.length}</span>
                          <span className="w-24">{fmtDate(i.due)}</span>
                          <span className="w-24 font-semibold tabular">{brl(i.amount)}</span>
                          <StatusBadge status={installmentStatus(i)} />
                          {i.paidAt && <span className="text-xs text-muted-foreground">pago em {fmtDate(i.paidAt)}</span>}
                          <Button size="sm" variant="outline" className="ml-auto" onClick={() => toggleInstallment(exp.id, i.id)}>{i.paidAt ? "Desfazer" : "Marcar pago"}</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
