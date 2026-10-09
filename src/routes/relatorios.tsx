import { createFileRoute } from "@tanstack/react-router";
import { useFinance } from "@/lib/finance/store";
import { areaTotals, brl, byCategory, byMonth, contractSummary, expenseSummary, fmtMonth, overallTotals } from "@/lib/finance/calc";
import { PageHeader, Section } from "@/components/finance/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/relatorios")({
  head: pageHead("Relatórios", "Relatórios da reforma por área, categoria, profissional, fornecedor e mês."),
  component: Page,
});

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-muted-foreground">{head.map((h, i) => <th key={h} className={`py-2 ${i ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
        <tbody className="divide-y">{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`py-2.5 ${j ? "text-right tabular" : "font-medium"}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Page() {
  const { data } = useFinance();
  const t = overallTotals(data);
  return (
    <>
      <PageHeader title="Relatórios" subtitle="Respostas rápidas sobre o dinheiro da reforma." />
      <Tabs defaultValue="geral">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
          {[["geral", "Geral"], ["area", "Por área"], ["cat", "Por categoria"], ["prof", "Por profissional"], ["forn", "Por fornecedor"], ["mes", "Mensal"]].map(([v, l]) => <TabsTrigger key={v} value={v}>{l}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="geral"><Section title="Resumo financeiro">
          <Table head={["Indicador", "Valor"]} rows={[["Orçamento total", brl(t.budget)], ["Total gasto (comprometido)", brl(t.spent)], ["Total pago", brl(t.paid)], ["Ainda a pagar", brl(t.pending)], ["Disponível do orçamento", brl(t.available)], ["Mão de obra contratada", brl(t.contracted)], ["Mão de obra paga", brl(t.laborPaid)]]} />
        </Section></TabsContent>
        <TabsContent value="area"><Section title="Por área">
          <Table head={["Área", "Orçamento", "Gasto", "Pago", "Pendente", "%"]} rows={data.areas.map((a) => { const x = areaTotals(data, a.id); return [`${a.icon} ${a.name}`, brl(x.budget), brl(x.spent), brl(x.paid), brl(x.pending), `${Math.round(x.pct)}%`]; })} />
        </Section></TabsContent>
        <TabsContent value="cat"><Section title="Por categoria">
          <Table head={["Categoria", "Total", "% do gasto"]} rows={byCategory(data).map((c) => [c.name, brl(c.value), `${t.spent ? Math.round((c.value / t.spent) * 100) : 0}%`])} />
        </Section></TabsContent>
        <TabsContent value="prof"><Section title="Por profissional">
          <Table head={["Profissional", "Contratado", "Pago", "Falta"]} rows={data.professionals.map((p) => {
            const cs = data.contracts.filter((c) => c.professionalId === p.id && c.execStatus !== "Cancelada");
            const sum = (f: (s: ReturnType<typeof contractSummary>) => number) => brl(cs.reduce((a, c) => a + f(contractSummary(c)), 0));
            return [`${p.name} (${p.type})`, brl(cs.reduce((a, c) => a + c.amount, 0)), sum((s) => s.paid), sum((s) => s.remaining)];
          })} />
        </Section></TabsContent>
        <TabsContent value="forn"><Section title="Por fornecedor">
          <Table head={["Fornecedor", "Comprado", "Pago", "Pendente"]} rows={data.suppliers.map((s) => {
            const es = data.expenses.filter((e) => e.supplierId === s.id);
            const paid = es.reduce((a, e) => a + expenseSummary(e).paid, 0), tot = es.reduce((a, e) => a + e.total, 0);
            return [s.name, brl(tot), brl(paid), brl(tot - paid)];
          })} />
        </Section></TabsContent>
        <TabsContent value="mes"><Section title="Pagamentos por mês">
          <Table head={["Mês", "Pago no mês"]} rows={byMonth(data).map((m) => [fmtMonth(m.month), brl(m.value)])} />
        </Section></TabsContent>
      </Tabs>
    </>
  );
}
