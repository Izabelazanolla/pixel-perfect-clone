import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar as RBar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area as RArea, AreaChart } from "recharts";
import { AlertTriangle, Info, OctagonAlert, Plus } from "lucide-react";
import { useFinance } from "@/lib/finance/store";
import { alerts, areaTotals, brl, byCategory, byMonth, fmtDate, fmtMonth, overallTotals, paymentEvents, upcoming } from "@/lib/finance/calc";
import { Bar, PageHeader, Section, Stat, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/finance/meta";

export const Route = createFileRoute("/")({
  head: pageHead("Dashboard", "Resumo financeiro da reforma: orçamento, gastos, pagos e pendentes por área."),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)", "var(--primary)"];
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }, formatter: (v: number) => brl(v) };

function Dashboard() {
  const { data } = useFinance();
  const t = overallTotals(data);
  const al = alerts(data);
  const cats = byCategory(data);
  const months = byMonth(data).map((m) => ({ ...m, label: fmtMonth(m.month) }));
  const areas = data.areas.map((a) => ({ ...a, ...areaTotals(data, a.id) }));
  const next = upcoming(data).slice(0, 6);
  const recent = paymentEvents(data).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Visão geral da reforma"
        subtitle={`${Math.round(t.budget ? (t.spent / t.budget) * 100 : 0)}% do orçamento comprometido`}
        actions={<>
          <Button asChild><Link to="/nova-despesa"><Plus /> Nova despesa</Link></Button>
          <Button asChild variant="outline"><Link to="/mao-de-obra"><Plus /> Novo pagamento</Link></Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Orçamento total" value={brl(t.budget)} />
        <Stat label="Total gasto" value={brl(t.spent)} hint="Despesas + mão de obra contratada" />
        <Stat label="Total pago" value={brl(t.paid)} tone="success" />
        <Stat label="Pendente" value={brl(t.pending)} tone="warning" />
        <Stat label="Saldo disponível" value={brl(t.available)} tone={t.available < 0 ? "danger" : "info"} />
        <Stat label="Mão de obra contratada" value={brl(t.contracted)} />
        <Stat label="Pago este mês" value={brl(t.thisMonth)} />
        <Stat label="Pago em mão de obra" value={brl(t.laborPaid)} />
      </div>

      {al.length > 0 && (
        <div className="mt-6 space-y-2">
          {al.slice(0, 5).map((a, i) => {
            const Icon = a.level === "danger" ? OctagonAlert : a.level === "warning" ? AlertTriangle : Info;
            const cls = a.level === "danger" ? "border-destructive/30 bg-destructive/5 text-destructive" : a.level === "warning" ? "border-warning/40 bg-warning/10 text-warning-foreground" : "border-info/30 bg-info/5 text-info";
            return <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${cls}`}><Icon className="size-4 shrink-0" />{a.message}</div>;
          })}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-xl font-semibold">Gastos por área</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {areas.map((a) => (
          <div key={a.id} className="card-soft p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{a.icon} {a.name}</div>
              <span className="text-xs text-muted-foreground tabular">{Math.round(a.pct)}%</span>
            </div>
            <div className="mt-2 font-display text-3xl font-semibold tabular">{brl(a.spent)}</div>
            <div className="my-3"><Bar pct={a.pct} /></div>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <div><dt className="text-muted-foreground">Orçamento</dt><dd className="font-semibold tabular">{brl(a.budget)}</dd></div>
              <div><dt className="text-muted-foreground">Pago</dt><dd className="font-semibold text-success tabular">{brl(a.paid)}</dd></div>
              <div><dt className="text-muted-foreground">Pendente</dt><dd className="font-semibold text-warning tabular">{brl(a.pending)}</dd></div>
            </dl>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Section title="Gastos por área">
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={areas}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...tip} />
                <RBar dataKey="paid" name="Pago" stackId="a" fill="var(--chart-3)" radius={[0, 0, 0, 0]} />
                <RBar dataKey="pending" name="Pendente" stackId="a" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Gastos por categoria">
          <div className="flex h-60 items-center gap-4">
            <ResponsiveContainer width="55%">
              <PieChart>
                <Pie data={cats} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-1.5 text-xs">
              {cats.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{c.name}</span>
                  <span className="font-semibold tabular">{brl(c.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
        <Section title="Pagamentos por mês">
          <div className="h-60">
            <ResponsiveContainer>
              <AreaChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...tip} />
                <RArea dataKey="value" name="Pago" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Próximos pagamentos" action={<Link to="/pagamentos" className="text-sm font-semibold text-primary">Ver todos</Link>}>
          <ul className="divide-y">
            {next.map((u, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.label}</div>
                  <div className="text-xs text-muted-foreground">{u.date ? fmtDate(u.date) : "Sem data definida"}</div>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={u.status} /><span className="font-semibold tabular">{brl(u.amount)}</span></div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Últimos pagamentos" className="mt-4" action={<Link to="/gastos" className="text-sm font-semibold text-primary">Histórico</Link>}>
        <ul className="divide-y">
          {recent.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{fmtDate(r.date)} · {r.category} · {r.method}</div>
              </div>
              <span className="font-semibold tabular">{brl(r.amount)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
