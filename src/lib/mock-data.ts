import { Category, Transaction, Budget } from "@/types";

export const INITIAL_CATEGORIES: Category[] = [
  // Despesas
  { id: "cat-lazer", name: "Lazer", type: "expense", color: "#0d9488", created_at: new Date().toISOString() },
  { id: "cat-dev-pessoal", name: "Dev. Pessoal", type: "expense", color: "#6366f1", created_at: new Date().toISOString() },
  { id: "cat-transporte", name: "Transporte", type: "expense", color: "#f59e0b", created_at: new Date().toISOString() },
  { id: "cat-despesas", name: "Despesas", type: "expense", color: "#64748b", created_at: new Date().toISOString() },
  { id: "cat-ticket", name: "Ticket", type: "expense", color: "#8b5cf6", created_at: new Date().toISOString() },
  { id: "cat-oferta", name: "Oferta", type: "expense", color: "#14b8a6", created_at: new Date().toISOString() },
  { id: "cat-dizimo", name: "Dízimo", type: "expense", color: "#0f766e", created_at: new Date().toISOString() },
  { id: "cat-viagem", name: "Viagem", type: "expense", color: "#f43f5e", created_at: new Date().toISOString() },
  
  // Receitas
  { id: "cat-salario", name: "Salário", type: "income", color: "#0d9488", created_at: new Date().toISOString() },
  { id: "cat-renda-extra", name: "Renda Extra", type: "income", color: "#10b981", created_at: new Date().toISOString() },
  { id: "cat-beneficio-ticket", name: "Benefício Ticket", type: "income", color: "#8b5cf6", created_at: new Date().toISOString() },
];

function getCurrentAndPrevMonths() {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = String(now.getMonth() + 1).padStart(2, "0");
  const currentMonth = `${curY}-${curM}`;

  const prevDate = new Date(curY, now.getMonth() - 1, 1);
  const prevY = prevDate.getFullYear();
  const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");
  const prevMonth = `${prevY}-${prevM}`;

  return { currentMonth, prevMonth, curY, curM };
}

export function generateInitialData() {
  const { currentMonth, prevMonth, curY, curM } = getCurrentAndPrevMonths();

  const transactions: Transaction[] = [
    // Mês Atual - Receitas Pessoais (Conta Corrente)
    {
      id: "tx-1",
      description: "Salário Mensal",
      amount: 6500.0,
      type: "income",
      category_id: "cat-salario",
      date: `${curY}-${curM}-05`,
      payment_method: "pix",
      is_paid: true,
      is_recurring: true,
      notes: "Salário creditado",
      created_at: new Date().toISOString(),
    },
    {
      id: "tx-2",
      description: "Projeto Freelance",
      amount: 1200.0,
      type: "income",
      category_id: "cat-renda-extra",
      date: `${curY}-${curM}-15`,
      payment_method: "pix",
      is_paid: true,
      is_recurring: false,
      notes: "Consultoria pontual",
      created_at: new Date().toISOString(),
    },

    // Mês Atual - Receita Ticket (Isolada)
    {
      id: "tx-3",
      description: "Recarga Benefício VR/VA",
      amount: 900.0,
      type: "income",
      category_id: "cat-beneficio-ticket",
      date: `${curY}-${curM}-01`,
      payment_method: "ticket",
      is_paid: true,
      is_recurring: true,
      notes: "Crédito corporativo",
      created_at: new Date().toISOString(),
    },

    // Mês Atual - Despesas Pessoais
    {
      id: "tx-4",
      description: "Dízimo",
      amount: 650.0,
      type: "expense",
      category_id: "cat-dizimo",
      date: `${curY}-${curM}-06`,
      payment_method: "pix",
      is_paid: true,
      is_recurring: true,
      notes: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "tx-5",
      description: "Internet & Contas Fixas",
      amount: 320.0,
      type: "expense",
      category_id: "cat-despesas",
      date: `${curY}-${curM}-10`,
      payment_method: "pix",
      is_paid: true,
      is_recurring: true,
      notes: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "tx-6",
      description: "Curso de Arquitetura de Software",
      amount: 250.0,
      type: "expense",
      category_id: "cat-dev-pessoal",
      date: `${curY}-${curM}-12`,
      payment_method: "credito",
      is_paid: true,
      is_recurring: false,
      notes: "Plataforma de cursos",
      created_at: new Date().toISOString(),
    },
    {
      id: "tx-7",
      description: "Combustível do Mês",
      amount: 280.0,
      type: "expense",
      category_id: "cat-transporte",
      date: `${curY}-${curM}-18`,
      payment_method: "credito",
      is_paid: true,
      is_recurring: false,
      notes: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "tx-8",
      description: "Jantar de Final de Semana",
      amount: 180.0,
      type: "expense",
      category_id: "cat-lazer",
      date: `${curY}-${curM}-20`,
      payment_method: "credito",
      is_paid: false, // Pendente para testar abatimento imediato no saldo
      is_recurring: false,
      notes: "Reserva de restaurante",
      created_at: new Date().toISOString(),
    },
    {
      id: "tx-9",
      description: "Oferta Solidária",
      amount: 150.0,
      type: "expense",
      category_id: "cat-oferta",
      date: `${curY}-${curM}-22`,
      payment_method: "pix",
      is_paid: true,
      is_recurring: false,
      notes: null,
      created_at: new Date().toISOString(),
    },

    // Mês Atual - Despesas Ticket (Isolada)
    {
      id: "tx-10",
      description: "Supermercado Semanal (VR)",
      amount: 320.0,
      type: "expense",
      category_id: "cat-ticket",
      date: `${curY}-${curM}-08`,
      payment_method: "ticket",
      is_paid: true,
      is_recurring: false,
      notes: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "tx-11",
      description: "Almoços no Trabalho",
      amount: 210.0,
      type: "expense",
      category_id: "cat-ticket",
      date: `${curY}-${curM}-16`,
      payment_method: "ticket",
      is_paid: true,
      is_recurring: false,
      notes: null,
      created_at: new Date().toISOString(),
    },
  ];

  const budgets: Budget[] = [
    // Metas do Mês Atual
    { id: `b-${currentMonth}-lazer`, category_id: "cat-lazer", month_year: currentMonth, target_amount: 400.0, created_at: new Date().toISOString() },
    { id: `b-${currentMonth}-dev-pessoal`, category_id: "cat-dev-pessoal", month_year: currentMonth, target_amount: 300.0, created_at: new Date().toISOString() },
    { id: `b-${currentMonth}-transporte`, category_id: "cat-transporte", month_year: currentMonth, target_amount: 350.0, created_at: new Date().toISOString() },
    { id: `b-${currentMonth}-despesas`, category_id: "cat-despesas", month_year: currentMonth, target_amount: 500.0, created_at: new Date().toISOString() },
    { id: `b-${currentMonth}-dizimo`, category_id: "cat-dizimo", month_year: currentMonth, target_amount: 650.0, created_at: new Date().toISOString() },
    { id: `b-${currentMonth}-oferta`, category_id: "cat-oferta", month_year: currentMonth, target_amount: 200.0, created_at: new Date().toISOString() },
    { id: `b-${currentMonth}-viagem`, category_id: "cat-viagem", month_year: currentMonth, target_amount: 500.0, created_at: new Date().toISOString() },
    { id: `b-${currentMonth}-ticket`, category_id: "cat-ticket", month_year: currentMonth, target_amount: 900.0, created_at: new Date().toISOString() },

    // Metas do Mês Anterior (Para testar o botão 'Copiar do Mês Anterior')
    { id: `b-${prevMonth}-lazer`, category_id: "cat-lazer", month_year: prevMonth, target_amount: 450.0, created_at: new Date().toISOString() },
    { id: `b-${prevMonth}-dev-pessoal`, category_id: "cat-dev-pessoal", month_year: prevMonth, target_amount: 300.0, created_at: new Date().toISOString() },
    { id: `b-${prevMonth}-transporte`, category_id: "cat-transporte", month_year: prevMonth, target_amount: 300.0, created_at: new Date().toISOString() },
    { id: `b-${prevMonth}-despesas`, category_id: "cat-despesas", month_year: prevMonth, target_amount: 480.0, created_at: new Date().toISOString() },
  ];

  return { transactions, budgets, categories: INITIAL_CATEGORIES };
}

// Helpers de Persistência no LocalStorage
const STORAGE_KEYS = {
  TRANSACTIONS: "finza_transactions_v1",
  BUDGETS: "finza_budgets_v1",
  CATEGORIES: "finza_categories_v1",
};

export function getStoredData() {
  if (typeof window === "undefined") {
    return generateInitialData();
  }

  const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  const storedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
  const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

  if (!storedTx || !storedBudgets || !storedCats) {
    const initial = generateInitialData();
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initial.transactions));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(initial.budgets));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initial.categories));
    return initial;
  }

  return {
    transactions: JSON.parse(storedTx) as Transaction[],
    budgets: JSON.parse(storedBudgets) as Budget[],
    categories: JSON.parse(storedCats) as Category[],
  };
}

export function saveTransactions(transactions: Transaction[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }
}

export function saveBudgets(budgets: Budget[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }
}

export function saveCategories(categories: Category[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }
}
