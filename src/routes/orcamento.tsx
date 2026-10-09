import { createFileRoute } from "@tanstack/react-router";
import { useFinance } from "@/lib/finance/store";
import { areaTotals, brl, overallTotals } from "@/lib/finance/calc";
import { Bar, PageHeader, Section } from "@/components/finance/ui";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/orcamento")({
  head: pageHead("Orçamento", "Orçamento geral e por área, com quanto foi gasto e quanto ainda resta."),
  component: Page,
});

function Row({ name, budget, spent, onBudget }: { name: string; budget: number; spent: number; onBudget: (n: number) => void }) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">{name}</div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Orçamento R$
          <input className="field h-8 w-32 tabular" inputMode="decimal" defaultValue={budget} onBlur={(e) => onBudget(Number(e.target.value.replace(",", ".")) || 0)} />
        </label>
      </div>
      <div className="my-2"><Bar pct={pct} /></div>
      <div className="flex flex-wrap justify-between gap-2 text-sm tabular">
        <span>Gasto <b>{brl(spent)}</b></span>
        <span className={budget - spent < 0 ? "font-semibold text-destructive" : ""}>{budget - spent < 0 ? `Excedido em ${brl(spent - budget)}` : `Restante ${brl(budget - spent)}`}</span>
        <span className={pct > 100 ? "text-destructive" : pct >= 85 ? "text-warning" : "text-muted-foreground"}>{Math.round(pct)}% utilizado</span>
      </div>
    </div>
  );
}

function Page() {
  const { data, setBudget, upsert } = useFinance();
  const t = overallTotals(data);
  const sumAreas = data.areas.reduce((s, a) => s + a.budget, 0);
  return (
    <>
      <PageHeader title="Orçamento" subtitle="Defina quanto pode ser gasto e acompanhe o uso." />
      <Section title="Geral"><Row name="Reforma completa" budget={t.budget} spent={t.spent} onBudget={setBudget} /></Section>
      <Section title="Por área" className="mt-4">
        <div className="divide-y">
          {data.areas.map((a) => <Row key={a.id} name={`${a.icon} ${a.name}`} budget={a.budget} spent={areaTotals(data, a.id).spent} onBudget={(n) => upsert("areas", { ...a, budget: n })} />)}
        </div>
        {sumAreas !== t.budget && <p className="mt-2 text-xs text-warning">A soma das áreas ({brl(sumAreas)}) é diferente do orçamento geral ({brl(t.budget)}).</p>}
      </Section>
    </>
  );
}
