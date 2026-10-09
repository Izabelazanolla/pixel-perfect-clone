import { createFileRoute } from "@tanstack/react-router";
import { useFinance, uid } from "@/lib/finance/store";
import { areaTotals, brl } from "@/lib/finance/calc";
import type { Area } from "@/lib/finance/types";
import { Bar, PageHeader } from "@/components/finance/ui";
import { CrudList } from "@/components/finance/CrudList";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/areas")({
  head: pageHead("Áreas da reforma", "Casa, área do fundo, paisagismo e outras áreas com orçamento próprio."),
  component: Page,
});

function Page() {
  const { data, upsert, remove } = useFinance();
  return (
    <>
      <PageHeader title="Áreas da reforma" subtitle="Cada área tem seu próprio orçamento e gastos." />
      <CrudList<Area>
        items={data.areas} addLabel="Nova área" newId={uid}
        blank={() => ({ id: "", name: "", icon: "🏗️", budget: 0 })}
        onSave={(a) => upsert("areas", a)}
        onDelete={(id) => {
          if (data.expenses.some((e) => e.areaId === id) || data.contracts.some((c) => c.areaId === id)) return alert("Esta área possui lançamentos e não pode ser excluída.");
          remove("areas", id);
        }}
        fields={[{ key: "icon", label: "Ícone (emoji)" }, { key: "name", label: "Nome" }, { key: "budget", label: "Orçamento (R$)", type: "number", full: true }]}
        render={(a) => {
          const t = areaTotals(data, a.id);
          return (<>
            <div className="font-semibold">{a.icon} {a.name}</div>
            <div className="my-2"><Bar pct={t.pct} /></div>
            <div className="text-sm tabular">{brl(t.spent)} de {brl(t.budget)} · <span className="text-muted-foreground">{Math.round(t.pct)}%</span></div>
          </>);
        }}
      />
    </>
  );
}
