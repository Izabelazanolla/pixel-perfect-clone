import { describe, expect, it } from "vitest";
import { contractSummary, generateInstallments, validateLaborPayment, expenseSummary, installmentStatus } from "./calc";
import type { Contract } from "./types";

const contract = (amount: number, paid: number[]): Contract => ({
  id: "c", professionalId: "p", service: "s", areaId: "a", date: "2026-10-01", amount, execStatus: "Em andamento", notes: "", changes: [],
  payments: paid.map((v, i) => ({ id: String(i), date: "2026-10-01", amount: v, method: "Pix", notes: "" })),
});

describe("mão de obra", () => {
  it("soma pagamentos variáveis e calcula saldo e percentual", () => {
    const s = contractSummary(contract(10000, [2000, 1500, 3000, 1000]));
    expect(s.paid).toBe(7500);
    expect(s.remaining).toBe(2500);
    expect(s.pct).toBe(75);
  });
  it("bloqueia pagamento acima do valor contratado", () => {
    expect(validateLaborPayment(contract(10000, [9000]), 2000)).toContain("Valor restante: R$");
    expect(validateLaborPayment(contract(10000, [9000]), 1000)).toBeNull();
  });
  it("status financeiro é automático", () => {
    expect(contractSummary(contract(1000, [])).financial).toBe("Não pago");
    expect(contractSummary(contract(1000, [400])).financial).toBe("Parcialmente pago");
    expect(contractSummary(contract(1000, [1000])).financial).toBe("Pago integralmente");
  });
});

describe("compra parcelada", () => {
  it("gera 6 parcelas de 800 para 4800 com vencimentos mensais", () => {
    let i = 0;
    const p = generateInstallments(4800, 6, "2026-01-31", "Pix", () => String(i++));
    expect(p.map((x) => x.amount)).toEqual([800, 800, 800, 800, 800, 800]);
    expect(p[1]!.due).toBe("2026-02-28");
  });
  it("parcelas somam exatamente o total", () => {
    const p = generateInstallments(1000, 3, "2026-01-10", "Pix", () => "x");
    expect(p.reduce((s, x) => s + x.amount, 0)).toBeCloseTo(1000, 2);
  });
  it("parcela vencida e não paga fica atrasada", () => {
    expect(installmentStatus({ id: "1", number: 1, due: "2026-01-01", amount: 1, method: "Pix" }, "2026-02-01")).toBe("Atrasado");
  });
  it("calcula pagas e restantes", () => {
    const inst = generateInstallments(4800, 6, "2026-01-10", "Pix", () => "x");
    inst[0]!.paidAt = "2026-01-10"; inst[1]!.paidAt = "2026-02-10";
    const s = expenseSummary({ id: "e", description: "", total: 4800, date: "", areaId: "", category: "Material", method: "Pix", notes: "", installments: inst });
    expect([s.paid, s.pending, s.paidCount, s.remainingCount, s.status]).toEqual([1600, 3200, 2, 4, "Parcialmente pago"]);
  });
});
