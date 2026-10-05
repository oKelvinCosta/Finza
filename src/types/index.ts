export type TransactionType = "income" | "expense";
export type PaymentMethod = "credito" | "pix" | "ticket";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  user_id?: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  category?: Category | null;
  date: string; // ISO format 'YYYY-MM-DD'
  payment_method: PaymentMethod;
  is_paid: boolean;
  is_recurring: boolean;
  notes?: string | null;
  user_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  category?: Category;
  month_year: string; // 'YYYY-MM'
  target_amount: number;
  user_id?: string;
  created_at: string;
}

export interface MonthSummary {
  personal: {
    income: number;
    expense: number;
    balance: number;
  };
  ticket: {
    income: number;
    expense: number;
    balance: number;
  };
  totalBudgeted: number;
  totalActual: number;
  budgetPercentage: number;
}
