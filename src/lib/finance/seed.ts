import type { FinanceData } from "./types";
import { generateInstallments } from "./calc";

let n = 0;
const sid = () => `seed-${++n}`;

/** Fictional demo data. Replace via Configurações → "Começar do zero". */
export function seedData(): FinanceData {
  n = 0;
  const parcelado = generateInstallments(4800, 6, "2026-08-15", "Cartão de crédito", sid);
  parcelado.slice(0, 2).forEach((i) => (i.paidAt = i.due));
  const pisos = generateInstallments(3600, 4, "2026-09-05", "Cartão de crédito", sid);
  pisos[0]!.paidAt = "2026-09-05";
  return {
    totalBudget: 100000,
    areas: [
      { id: "casa", name: "Casa", icon: "🏠", budget: 50000 },
      { id: "fundo", name: "Área do fundo", icon: "🔨", budget: 30000 },
      { id: "paisagismo", name: "Paisagismo", icon: "🌳", budget: 20000 },
    ],
    suppliers: [
      { id: "f1", name: "Depósito Bom Preço", kind: "Empresa", phone: "(65) 3322-1100", category: "Materiais de construção", notes: "" },
      { id: "f2", name: "Elétrica Central", kind: "Empresa", phone: "(65) 3344-5566", category: "Materiais elétricos", notes: "" },
      { id: "f3", name: "Viveiro Flor do Cerrado", kind: "Empresa", phone: "(65) 99876-1234", category: "Plantas e paisagismo", notes: "" },
      { id: "f4", name: "Seu Zé do Frete", kind: "Pessoa", phone: "(65) 99111-2233", category: "Transporte", notes: "" },
    ],
    professionals: [
      { id: "p1", name: "João Silva", phone: "(65) 99900-1111", type: "Pedreiro", service: "Alvenaria e reboco", notes: "" },
      { id: "p2", name: "Carlos Souza", phone: "(65) 99900-2222", type: "Eletricista", service: "Instalação elétrica", notes: "" },
      { id: "p3", name: "Marta Lima", phone: "(65) 99900-3333", type: "Jardineiro", service: "Projeto e plantio", notes: "" },
      { id: "p4", name: "Paulo Reis", phone: "(65) 99900-4444", type: "Pintor", service: "Pintura interna", notes: "" },
    ],
    expenses: [
      { id: "e1", description: "Cimento, areia e tijolos", total: 4800, date: "2026-08-15", areaId: "fundo", category: "Material", supplierId: "f1", method: "Cartão de crédito", notes: "6x sem juros", installments: parcelado },
      { id: "e2", description: "Fios e disjuntores", total: 1350, date: "2026-08-22", areaId: "casa", category: "Material", supplierId: "f2", method: "Pix", notes: "", installments: [{ id: sid(), number: 1, due: "2026-08-22", amount: 1350, paidAt: "2026-08-22", method: "Pix" }] },
      { id: "e3", description: "Pisos porcelanato", total: 3600, date: "2026-09-05", areaId: "casa", category: "Material", supplierId: "f1", method: "Cartão de crédito", notes: "", installments: pisos },
      { id: "e4", description: "Furadeira e esmerilhadeira", total: 690, date: "2026-09-10", areaId: "fundo", category: "Ferramenta", supplierId: "f1", method: "Cartão de débito", notes: "", installments: [{ id: sid(), number: 1, due: "2026-09-10", amount: 690, paidAt: "2026-09-10", method: "Cartão de débito" }] },
      { id: "e5", description: "Frete de entulho", total: 380, date: "2026-09-18", areaId: "fundo", category: "Transporte/Frete", supplierId: "f4", method: "Dinheiro", notes: "", installments: [{ id: sid(), number: 1, due: "2026-09-18", amount: 380, paidAt: "2026-09-18", method: "Dinheiro" }] },
      { id: "e6", description: "Mudas, vasos e terra vegetal", total: 2150, date: "2026-10-02", areaId: "paisagismo", category: "Paisagismo", supplierId: "f3", method: "Pix", notes: "", installments: [{ id: sid(), number: 1, due: "2026-10-02", amount: 2150, paidAt: "2026-10-02", method: "Pix" }] },
      { id: "e7", description: "Tinta acrílica 18L", total: 450, date: "2026-10-06", areaId: "casa", category: "Material", supplierId: "f1", method: "Pix", notes: "Pagar na entrega", installments: [{ id: sid(), number: 1, due: "2026-10-12", amount: 450, method: "Pix" }] },
      { id: "e8", description: "Pedras decorativas", total: 980, date: "2026-10-07", areaId: "paisagismo", category: "Paisagismo", supplierId: "f3", method: "Transferência", notes: "", installments: [{ id: sid(), number: 1, due: "2026-10-20", amount: 980, method: "Transferência" }] },
    ],
    contracts: [
      {
        id: "c1", professionalId: "p1", service: "Reforma da área do fundo", areaId: "fundo", date: "2026-08-01", amount: 12000, execStatus: "Em andamento", notes: "",
        payments: [
          { id: sid(), date: "2026-08-01", amount: 2000, method: "Pix", notes: "Início" },
          { id: sid(), date: "2026-08-10", amount: 1500, method: "Pix", notes: "Continuação" },
          { id: sid(), date: "2026-09-25", amount: 3000, method: "Dinheiro", notes: "Etapa da obra" },
          { id: sid(), date: "2026-10-05", amount: 1000, method: "Pix", notes: "" },
        ],
        changes: [{ id: sid(), date: "2026-09-01", previous: 10000, next: 12000, reason: "Acréscimo: muro lateral" }],
      },
      {
        id: "c2", professionalId: "p2", service: "Elétrica completa da casa", areaId: "casa", date: "2026-08-20", amount: 6000, execStatus: "Em andamento", notes: "",
        payments: [{ id: sid(), date: "2026-08-20", amount: 2000, method: "Pix", notes: "Entrada" }, { id: sid(), date: "2026-09-20", amount: 1500, method: "Pix", notes: "" }],
        changes: [],
      },
      {
        id: "c3", professionalId: "p3", service: "Plantio e projeto do jardim", areaId: "paisagismo", date: "2026-09-15", amount: 4500, execStatus: "Não iniciada", notes: "", payments: [], changes: [],
      },
      {
        id: "c4", professionalId: "p4", service: "Pintura dos quartos", areaId: "casa", date: "2026-07-20", amount: 3200, execStatus: "Concluída", notes: "",
        payments: [{ id: sid(), date: "2026-07-25", amount: 1600, method: "Pix", notes: "" }, { id: sid(), date: "2026-08-05", amount: 1600, method: "Pix", notes: "Quitado" }],
        changes: [],
      },
    ],
    materials: [
      { id: "m1", name: "Cimento CP-II", category: "Construção", quantity: 40, unit: "saco", unitPrice: 38, supplierId: "f1", areaId: "fundo", date: "2026-08-15", notes: "" },
      { id: "m2", name: "Tijolo 8 furos", category: "Construção", quantity: 2000, unit: "un", unitPrice: 1.2, supplierId: "f1", areaId: "fundo", date: "2026-08-15", notes: "" },
      { id: "m3", name: "Fio 2,5mm", category: "Elétrico", quantity: 5, unit: "rolo", unitPrice: 180, supplierId: "f2", areaId: "casa", date: "2026-08-22", notes: "" },
      { id: "m4", name: "Muda de palmeira", category: "Plantas", quantity: 6, unit: "un", unitPrice: 120, supplierId: "f3", areaId: "paisagismo", date: "2026-10-02", notes: "" },
    ],
  };
}
