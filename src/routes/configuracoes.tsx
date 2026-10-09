import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/store";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/finance/ui";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/configuracoes")({
  head: pageHead("Configurações", "Exportar dados, restaurar exemplos ou começar o controle do zero."),
  component: Page,
});

function Page() {
  const { data, reset } = useFinance();
  function exportJson() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "reforma-backup.json"; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeader title="Configurações" subtitle="Os dados ficam salvos neste navegador." />
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Começar com dados reais">
          <p className="mb-4 text-sm text-muted-foreground">Apaga os exemplos e mantém as áreas Casa, Área do fundo e Paisagismo zeradas.</p>
          <Button variant="destructive" onClick={() => { if (confirm("Apagar todos os dados de exemplo?")) { reset(true); toast.success("Pronto para usar com dados reais"); } }}>Começar do zero</Button>
        </Section>
        <Section title="Backup">
          <p className="mb-4 text-sm text-muted-foreground">Baixe uma cópia de todos os lançamentos.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportJson}>Exportar backup</Button>
            <Button variant="outline" onClick={() => confirm("Restaurar os dados de exemplo?") && reset(false)}>Restaurar exemplos</Button>
          </div>
        </Section>
      </div>
    </>
  );
}
