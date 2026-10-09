import { createFileRoute } from "@tanstack/react-router";
import { useFinance, uid } from "@/lib/finance/store";
import { brl } from "@/lib/finance/calc";
import type { Supplier } from "@/lib/finance/types";
import { PageHeader } from "@/components/finance/ui";
import { CrudList } from "@/components/finance/CrudList";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/fornecedores")({
  head: pageHead("Fornecedores", "Lojas e pessoas de quem compramos, com o total gasto em cada uma."),
  component: Page,
});

function Page() {
  const { data, upsert, remove } = useFinance();
  return (
    <>
      <PageHeader title="Fornecedores" subtitle="Lojas, depósitos e pessoas de quem compramos." />
      <CrudList<Supplier>
        items={data.suppliers} addLabel="Novo fornecedor" newId={uid}
        blank={() => ({ id: "", name: "", kind: "Empresa", phone: "", category: "", notes: "" })}
        onSave={(s) => upsert("suppliers", s)} onDelete={(id) => remove("suppliers", id)}
        fields={[
          { key: "name", label: "Nome", full: true },
          { key: "kind", label: "Tipo", type: "select", options: [{ v: "Empresa", l: "Empresa" }, { v: "Pessoa", l: "Pessoa" }] },
          { key: "phone", label: "Telefone" }, { key: "category", label: "Categoria", full: true }, { key: "notes", label: "Observações", type: "textarea" },
        ]}
        render={(s) => {
          const total = data.expenses.filter((e) => e.supplierId === s.id).reduce((a, e) => a + e.total, 0);
          return (<>
            <div className="font-semibold">{s.name} <span className="text-xs font-medium text-muted-foreground">· {s.kind}</span></div>
            <div className="text-xs text-muted-foreground">{s.category} · {s.phone}</div>
            <div className="mt-2 text-sm">Total comprado <b className="tabular">{brl(total)}</b></div>
          </>);
        }}
      />
    </>
  );
}
