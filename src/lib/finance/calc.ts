import type { Contract, Expense, FinanceData, Installment, PaymentMethod } from "./types";
import { LABOR_CATEGORY } from "./types";

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const todayISO = () => new Date().toISOString().slice(0, 10);

export type InstallmentStatus = "Pago" | "Pendente" | "Atrasado";
export function installmentStatus(i: Installment, today = todayISO()): InstallmentStatus {
  if (i.paidAt) return "Pago";
  return i.due < today ? "Atrasado" : "Pendente";
}

/** Split a total into N installments; the last absorbs rounding so the sum is exact. */
export function generateInstallments(total: number, count: number, firstDue: string, method: PaymentMethod, uid: () => string): Installment[] {
  const n = Math.max(1, Math.floor(count));
  const base = Math.floor((total / n) * 100) / 100;
  const out: Installment[] = [];
  const [y, m, d] = firstDue.split("-").map(Number);
  for (let k = 0; k < n; k++) {
    const dt = new Date(Date.UTC(y, m - 1 + k, 1));
    const lastDay = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
    dt.setUTCDate(Math.min(d, lastDay));
    const amount = k === n - 1 ? round2(total - base * (n - 1)) : base;
    out.push({ id: uid(), number: k + 1, due: dt.toISOString().slice(0, 10), amount, method });
  }
  return out;
}

export function expenseSummary(e: Expense) {
  const paid = round2(e.installments.filter((i) => i.paidAt).reduce((s, i) => s + i.amount, 0));
  const pending = round2(e.total - paid);
  const paidCount = e.installments.filter((i) => i.paidAt).length;
  const status = paid <= 0 ? "Pendente" : pending <= 0 ? "Pago" : "Parcialmente pago";
  return { paid, pending, paidCount, remainingCount: e.installments.length - paidCount, status };
}

export type FinancialStatus = "Não pago" | "Parcialmente pago" | "Pago integralmente";
export function contractSummary(c: Contract) {
  const paid = round2(c.payments.reduce((s, p) => s + p.amount, 0));
  const remaining = round2(Math.max(0, c.amount - paid));
  const pct = c.amount > 0 ? Math.min(100, (paid / c.amount) * 100) : 0;
  const financial: FinancialStatus = paid <= 0 ? "Não pago" : remaining <= 0 ? "Pago integralmente" : "Parcialmente pago";
  return { paid, remaining, pct, remainingPct: 100 - pct, financial };
}

/** Returns an error message if the new payment would exceed the contracted amount. */
export function validateLaborPayment(c: Contract, amount: number): string | null {
  if (!(amount > 0)) return "Informe um valor maior que zero.";
  const { remaining } = contractSummary(c);
  if (round2(amount) > remaining) return `Este pagamento ultrapassa o valor contratado. Valor restante: ${brl(remaining)}.`;
  return null;
}

const activeContracts = (d: FinanceData) => d.contracts.filter((c) => c.execStatus !== "Cancelada");

/** Cancelled contracts count only what was actually paid. */
const contractCommitted = (c: Contract) => (c.execStatus === "Cancelada" ? contractSummary(c).paid : c.amount);

export function areaTotals(d: FinanceData, areaId: string) {
  const exps = d.expenses.filter((e) => e.areaId === areaId);
  const cons = d.contracts.filter((c) => c.areaId === areaId);
  const spent = round2(exps.reduce((s, e) => s + e.total, 0) + cons.reduce((s, c) => s + contractCommitted(c), 0));
  const paid = round2(exps.reduce((s, e) => s + expenseSummary(e).paid, 0) + cons.reduce((s, c) => s + contractSummary(c).paid, 0));
  const area = d.areas.find((a) => a.id === areaId);
  const budget = area?.budget ?? 0;
  return { budget, spent, paid, pending: round2(spent - paid), pct: budget > 0 ? (spent / budget) * 100 : 0, available: round2(budget - spent) };
}

export function overallTotals(d: FinanceData, today = todayISO()) {
  const expensesTotal = d.expenses.reduce((s, e) => s + e.total, 0);
  const contracted = activeContracts(d).reduce((s, c) => s + c.amount, 0);
  const spent = round2(expensesTotal + d.contracts.reduce((s, c) => s + contractCommitted(c), 0));
  const paid = round2(
    d.expenses.reduce((s, e) => s + expenseSummary(e).paid, 0) + d.contracts.reduce((s, c) => s + contractSummary(c).paid, 0),
  );
  const month = today.slice(0, 7);
  const thisMonth = round2(paymentEvents(d).filter((p) => p.date.startsWith(month)).reduce((s, p) => s + p.amount, 0));
  return {
    budget: d.totalBudget, contracted: round2(contracted), spent, paid,
    pending: round2(spent - paid), available: round2(d.totalBudget - spent), thisMonth,
    laborPaid: round2(d.contracts.reduce((s, c) => s + contractSummary(c).paid, 0)),
  };
}

export interface PaymentEvent { date: string; amount: number; label: string; areaId: string; category: string; method: PaymentMethod; kind: "despesa" | "mao-de-obra"; refId: string }
/** Every real money movement (paid installments + labor payments). */
export function paymentEvents(d: FinanceData): PaymentEvent[] {
  const ev: PaymentEvent[] = [];
  for (const e of d.expenses) for (const i of e.installments) if (i.paidAt)
    ev.push({ date: i.paidAt, amount: i.amount, label: e.installments.length > 1 ? `${e.description} (${i.number}/${e.installments.length})` : e.description, areaId: e.areaId, category: e.category, method: i.method, kind: "despesa", refId: e.id });
  for (const c of d.contracts) {
    const p = d.professionals.find((x) => x.id === c.professionalId);
    for (const pay of c.payments)
      ev.push({ date: pay.date, amount: pay.amount, label: `${p?.name ?? "Profissional"} — ${c.service}`, areaId: c.areaId, category: LABOR_CATEGORY, method: pay.method, kind: "mao-de-obra", refId: c.id });
  }
  return ev.sort((a, b) => b.date.localeCompare(a.date));
}

/** Spent per category (commitment basis). */
export function byCategory(d: FinanceData) {
  const m = new Map<string, number>();
  for (const e of d.expenses) m.set(e.category, (m.get(e.category) ?? 0) + e.total);
  const labor = d.contracts.reduce((s, c) => s + contractCommitted(c), 0);
  if (labor) m.set(LABOR_CATEGORY, labor);
  return [...m.entries()].map(([name, value]) => ({ name, value: round2(value) })).sort((a, b) => b.value - a.value);
}

export function byMonth(d: FinanceData) {
  const m = new Map<string, number>();
  for (const p of paymentEvents(d)) m.set(p.date.slice(0, 7), (m.get(p.date.slice(0, 7)) ?? 0) + p.amount);
  return [...m.entries()].sort().map(([month, value]) => ({ month, value: round2(value) }));
}

export interface UpcomingItem { date?: string; amount: number; label: string; kind: "parcela" | "mao-de-obra"; status: InstallmentStatus | "Saldo pendente"; refId: string; installmentId?: string }
export function upcoming(d: FinanceData, today = todayISO()): UpcomingItem[] {
  const out: UpcomingItem[] = [];
  for (const e of d.expenses) for (const i of e.installments) if (!i.paidAt)
    out.push({ date: i.due, amount: i.amount, label: e.installments.length > 1 ? `${e.description} (${i.number}/${e.installments.length})` : e.description, kind: "parcela", status: installmentStatus(i, today), refId: e.id, installmentId: i.id });
  for (const c of activeContracts(d)) {
    const s = contractSummary(c);
    if (s.remaining > 0) {
      const p = d.professionals.find((x) => x.id === c.professionalId);
      out.push({ amount: s.remaining, label: `${p?.name ?? "Profissional"} — ${c.service}`, kind: "mao-de-obra", status: "Saldo pendente", refId: c.id });
    }
  }
  return out.sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
}

export interface Alert { level: "warning" | "danger" | "info"; message: string }
export function alerts(d: FinanceData, today = todayISO()): Alert[] {
  const out: Alert[] = [];
  const soon = new Date(today); soon.setDate(soon.getDate() + 7);
  const soonISO = soon.toISOString().slice(0, 10);
  for (const u of upcoming(d, today)) {
    if (u.status === "Atrasado") out.push({ level: "danger", message: `Parcela atrasada: ${u.label} — ${brl(u.amount)}` });
    else if (u.kind === "parcela" && u.date && u.date <= soonISO) out.push({ level: "warning", message: `Vence em breve (${fmtDate(u.date)}): ${u.label} — ${brl(u.amount)}` });
  }
  const check = (name: string, spent: number, budget: number) => {
    if (budget <= 0) return;
    if (spent > budget) out.push({ level: "danger", message: `Orçamento excedido em ${name}: ${brl(spent - budget)} acima` });
    else if (spent / budget >= 0.85) out.push({ level: "warning", message: `${name} já usou ${Math.round((spent / budget) * 100)}% do orçamento` });
  };
  const t = overallTotals(d, today);
  check("Reforma (total)", t.spent, t.budget);
  for (const a of d.areas) { const at = areaTotals(d, a.id); check(a.name, at.spent, at.budget); }
  const pendingContracts = activeContracts(d).filter((c) => contractSummary(c).remaining > 0).length;
  if (pendingContracts) out.push({ level: "info", message: `${pendingContracts} contratação(ões) de mão de obra com saldo pendente` });
  for (const c of d.contracts) if (contractSummary(c).paid > c.amount) out.push({ level: "danger", message: `Pagamentos acima do valor contratado: ${c.service}` });
  return out;
}

const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const brl = (n: number) => brlFmt.format(n);
export const fmtDate = (iso?: string) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
export const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(m) - 1]}/${y.slice(2)}`;
};
