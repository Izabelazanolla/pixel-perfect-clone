export type PaymentMethod = "Pix" | "Dinheiro" | "Cartão de débito" | "Cartão de crédito" | "Transferência" | "Outro";
export const PAYMENT_METHODS: PaymentMethod[] = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Transferência", "Outro"];

export type ExpenseCategory = "Material" | "Ferramenta" | "Serviço" | "Transporte/Frete" | "Paisagismo" | "Outros";
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ["Material", "Ferramenta", "Serviço", "Transporte/Frete", "Paisagismo", "Outros"];
export const LABOR_CATEGORY = "Mão de obra";

export type ExecStatus = "Não iniciada" | "Em andamento" | "Concluída" | "Cancelada";
export const EXEC_STATUSES: ExecStatus[] = ["Não iniciada", "Em andamento", "Concluída", "Cancelada"];

export const PROFESSIONAL_TYPES = ["Pedreiro", "Eletricista", "Encanador", "Pintor", "Jardineiro", "Marceneiro", "Arquiteto", "Engenheiro", "Outro"];

export interface Area { id: string; name: string; icon: string; budget: number }
export interface Supplier { id: string; name: string; kind: "Pessoa" | "Empresa"; phone: string; category: string; notes: string }
export interface Professional { id: string; name: string; phone: string; type: string; service: string; notes: string }

/** A normal expense has 1 installment; a parceled purchase has N. Status is always derived. */
export interface Installment { id: string; number: number; due: string; amount: number; paidAt?: string; method: PaymentMethod }
export interface Expense {
  id: string; description: string; total: number; date: string; areaId: string;
  category: ExpenseCategory; supplierId?: string; method: PaymentMethod; notes: string;
  receipt?: string; installments: Installment[];
}

export interface LaborPayment { id: string; date: string; amount: number; method: PaymentMethod; notes: string; receipt?: string }
export interface AmountChange { id: string; date: string; previous: number; next: number; reason: string }
export interface Contract {
  id: string; professionalId: string; service: string; areaId: string; date: string;
  amount: number; execStatus: ExecStatus; notes: string;
  payments: LaborPayment[]; changes: AmountChange[];
}

export interface Material {
  id: string; name: string; category: string; quantity: number; unit: string; unitPrice: number;
  supplierId?: string; areaId: string; date: string; notes: string;
}

export interface FinanceData {
  totalBudget: number;
  areas: Area[]; suppliers: Supplier[]; professionals: Professional[];
  expenses: Expense[]; contracts: Contract[]; materials: Material[];
}
