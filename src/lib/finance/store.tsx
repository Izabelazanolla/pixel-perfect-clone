import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Area, Contract, Expense, FinanceData, LaborPayment, Material, Professional, Supplier } from "./types";
import { seedData } from "./seed";
import { round2, todayISO, validateLaborPayment } from "./calc";

const KEY = "reforma-financas-v1";
export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

type Coll = "areas" | "suppliers" | "professionals" | "expenses" | "contracts" | "materials";
type ItemOf<K extends Coll> = FinanceData[K][number];

interface Store {
  data: FinanceData;
  upsert: <K extends Coll>(k: K, item: ItemOf<K>) => void;
  remove: (k: Coll, id: string) => void;
  setBudget: (n: number) => void;
  toggleInstallment: (expenseId: string, installmentId: string) => void;
  addLaborPayment: (contractId: string, p: Omit<LaborPayment, "id">) => string | null;
  removeLaborPayment: (contractId: string, paymentId: string) => void;
  changeContractAmount: (contractId: string, next: number, reason: string) => void;
  reset: (empty: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinanceData>(seedData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(JSON.parse(raw));
    } catch { /* ignore corrupted storage */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(data)); }, [data, loaded]);

  const upsert = useCallback(<K extends Coll>(k: K, item: ItemOf<K>) => {
    setData((d) => {
      const list = d[k] as ItemOf<K>[];
      const exists = list.some((x) => x.id === item.id);
      return { ...d, [k]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list] };
    });
  }, []);
  const remove = useCallback((k: Coll, id: string) => setData((d) => ({ ...d, [k]: (d[k] as { id: string }[]).filter((x) => x.id !== id) })), []);

  const store = useMemo<Store>(() => ({
    data, upsert, remove,
    setBudget: (n) => setData((d) => ({ ...d, totalBudget: n })),
    toggleInstallment: (eid, iid) => setData((d): FinanceData => ({
      ...d, expenses: d.expenses.map((e: Expense) => e.id !== eid ? e : {
        ...e, installments: e.installments.map((i) => i.id !== iid ? i : { ...i, paidAt: i.paidAt ? undefined : todayISO() }),
      }),
    })),
    addLaborPayment: (cid, p) => {
      const c = data.contracts.find((x) => x.id === cid);
      if (!c) return "Contratação não encontrada.";
      const err = validateLaborPayment(c, p.amount);
      if (err) return err;
      setData((d) => ({ ...d, contracts: d.contracts.map((x: Contract) => x.id === cid ? { ...x, payments: [...x.payments, { ...p, amount: round2(p.amount), id: uid() }] } : x) }));
      return null;
    },
    removeLaborPayment: (cid, pid) => setData((d) => ({ ...d, contracts: d.contracts.map((x) => x.id === cid ? { ...x, payments: x.payments.filter((p) => p.id !== pid) } : x) })),
    changeContractAmount: (cid, next, reason) => setData((d) => ({
      ...d, contracts: d.contracts.map((x) => x.id !== cid ? x : {
        ...x, amount: next, changes: [...x.changes, { id: uid(), date: todayISO(), previous: x.amount, next, reason }],
      }),
    })),
    reset: (empty) => setData(empty ? { totalBudget: 0, areas: seedData().areas.map((a) => ({ ...a, budget: 0 })), suppliers: [], professionals: [], expenses: [], contracts: [], materials: [] } : seedData()),
  }), [data, upsert, remove]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useFinance() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useFinance must be used inside FinanceProvider");
  return s;
}

export type { Area, Supplier, Professional, Material };
