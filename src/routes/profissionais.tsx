import { createFileRoute } from "@tanstack/react-router";
import { useFinance, uid } from "@/lib/finance/store";
import { brl, contractSummary } from "@/lib/finance/calc";
import { PROFESSIONAL_TYPES, type Professional } from "@/lib/finance/types";
import { PageHeader } from "@/components/finance/ui";
import { CrudList } from "@/components/finance/CrudList";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/profissionais")({
  head: pageHead("Profissionais", "Cadastro de pedreiros, eletricistas, jardineiros e outros profissionais da obra."),
  component: Page,
});

function Page() {
  const { data, upsert, remove } = useFinance();
  return (
    <>
      <PageHeader title="Profissionais" subtitle="Quem trabalha na reforma e quanto ainda devemos a cada um." />
      <CrudList<Professional>
        items={data.professionals} addLabel="Novo profissional" newId={uid}
        blank={() => ({ id: "", name: "", phone: "", type: "Pedreiro", service: "", notes: "" })}
        onSave={(p) => upsert("professionals", p)} onDelete={(id) => remove("professionals", id)}
        fields={[
          { key: "name", label: "Nome", full: true }, { key: "phone", label: "Telefone" },
          { key: "type", label: "Tipo", type: "select", options: PROFESSIONAL_TYPES.map((t) => ({ v: t, l: t })) },
          { key: "service", label: "Serviço", full: true }, { key: "notes", label: "Observações", type: "textarea" },
        ]}
        render={(p) => {
          const cs = data.contracts.filter((c) => c.professionalId === p.id && c.execStatus !== "Cancelada");
          const owed = cs.reduce((s, c) => s + contractSummary(c).remaining, 0);
          const paid = cs.reduce((s, c) => s + contractSummary(c).paid, 0);
          return (<>
            <div className="font-semibold">{p.name} <span className="text-xs font-medium text-muted-foreground">· {p.type}</span></div>
            <div className="text-xs text-muted-foreground">{p.service} · {p.phone}</div>
            <div className="mt-2 text-sm">Pago <b className="text-success tabular">{brl(paid)}</b> · Falta <b className="text-warning tabular">{brl(owed)}</b></div>
          </>);
        }}
      />
    </>
  );
}
