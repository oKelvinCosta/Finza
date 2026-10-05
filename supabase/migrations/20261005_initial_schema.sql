-- 1. Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#64748b',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Transações (category_id NULL para carteira Ticket)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'credito' CHECK (payment_method IN ('credito', 'pix', 'ticket')),
  is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, month_year)
);

-- 5. Índices de Busca
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month_year);

-- 6. Seed Inicial de Categorias
INSERT INTO categories (name, type, color) VALUES
  ('Alimentação', 'expense', '#f59e0b'),
  ('Lazer', 'expense', '#0d9488'),
  ('Dev. Pessoal', 'expense', '#6366f1'),
  ('Transporte', 'expense', '#3b82f6'),
  ('Despesas', 'expense', '#64748b'),
  ('Oferta', 'expense', '#14b8a6'),
  ('Dízimo', 'expense', '#0f766e'),
  ('Viagem', 'expense', '#f43f5e'),
  ('Salário', 'income', '#0d9488'),
  ('Renda Extra', 'income', '#10b981')
ON CONFLICT DO NOTHING;
