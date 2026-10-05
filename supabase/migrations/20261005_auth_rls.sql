-- ==============================================================================
-- Migration: TASK-20 - Suporte a Autenticação e Row Level Security (RLS) Estrito
-- ==============================================================================

-- 1. Adicionar coluna user_id nas tabelas com padrão auth.uid()
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE budgets 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NULL;

-- 2. Criar índices para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- 3. Atualizar restrição única de orçamentos (por usuário, categoria e mês)
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_id_month_year_key;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_category_month_key;
ALTER TABLE budgets ADD CONSTRAINT budgets_user_category_month_key UNIQUE(user_id, category_id, month_year);

-- 4. Limpar políticas temporárias anteriores
DROP POLICY IF EXISTS "Permitir leitura e escrita em categories" ON categories;
DROP POLICY IF EXISTS "Permitir leitura e escrita em transactions" ON transactions;
DROP POLICY IF EXISTS "Permitir leitura e escrita em budgets" ON budgets;
DROP POLICY IF EXISTS "Acesso público categorias" ON categories;
DROP POLICY IF EXISTS "Acesso público transações" ON transactions;
DROP POLICY IF EXISTS "Acesso público orçamentos" ON budgets;

-- 5. Garantir RLS habilitado em todas as tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para CATEGORIAS
-- Usuários autenticados podem consultar categorias padrão do sistema (user_id NULL) e suas próprias
CREATE POLICY "Categorias visíveis para autenticados" 
  ON categories FOR SELECT 
  TO authenticated 
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Criar categorias próprias" 
  ON categories FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- 7. Políticas para TRANSAÇÕES (Isolamento total: apenas o próprio usuário)
CREATE POLICY "Transações: Apenas próprias (SELECT)" 
  ON transactions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Transações: Apenas próprias (INSERT)" 
  ON transactions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Transações: Apenas próprias (UPDATE)" 
  ON transactions FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Transações: Apenas próprias (DELETE)" 
  ON transactions FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 8. Políticas para ORÇAMENTOS (Isolamento total: apenas o próprio usuário)
CREATE POLICY "Orçamentos: Apenas próprios (SELECT)" 
  ON budgets FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Orçamentos: Apenas próprios (INSERT)" 
  ON budgets FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orçamentos: Apenas próprios (UPDATE)" 
  ON budgets FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orçamentos: Apenas próprios (DELETE)" 
  ON budgets FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);
