import { createFileRoute } from "@tanstack/react-router";
import { useFinance, uid } from "@/lib/finance/store";
import { brl, fmtDate, todayISO } from "@/lib/finance/calc";
import type { Material } from "@/lib/finance/types";
import { PageHeader } from "@/components/finance/ui";
import { CrudList } from "@/components/finance/CrudList";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/materiais")({
  head: pageHead("Materiais", "Lista de materiais comprados para a reforma: quantidades, preços e fornecedores."),
  component: Page,
});

function Page() {
  const { data, upsert, remove } = useFinance();
  return (
    <>
      <PageHeader title="Materiais" subtitle="Lista de itens comprados. Os valores pagos são controlados em Gastos, para não contar em dobro." />
      <CrudList<Material>
        items={data.materials} addLabel="Novo material" newId={uid}
        blank={() => ({ id: "", name: "", category: "", quantity: 1, unit: "un", unitPrice: 0, supplierId: data.suppliers[0]?.id, areaId: data.areas[0]?.id ?? "", date: todayISO(), notes: "" })}
        onSave={(m) => upsert("materials", m)} onDelete={(id) => remove("materials", id)}
        fields={[
          { key: "name", label: "Nome", full: true }, { key: "category", label: "Categoria" },
          { key: "date", label: "Data da compra", type: "date" },
          { key: "quantity", label: "Quantidade", type: "number" }, { key: "unit", label: "Unidade" },
          { key: "unitPrice", label: "Valor unitário (R$)", type: "number" },
          { key: "supplierId", label: "Fornecedor", type: "select", options: data.suppliers.map((s) => ({ v: s.id, l: s.name })) },
          { key: "areaId", label: "Área", type: "select", options: data.areas.map((a) => ({ v: a.id, l: a.name })) },
          { key: "notes", label: "Observações", type: "textarea" },
        ]}
        render={(m) => (<>
          <div className="font-semibold">{m.name}</div>
          <div className="text-xs text-muted-foreground">{m.quantity} {m.unit} × {brl(m.unitPrice)} · {data.areas.find((a) => a.id === m.areaId)?.name} · {fmtDate(m.date)}</div>
          <div className="mt-2 text-sm">Total <b className="tabular">{brl(m.quantity * m.unitPrice)}</b> · {data.suppliers.find((s) => s.id === m.supplierId)?.name ?? "—"}</div>
        </>)}
      />
    </>
  );
}
