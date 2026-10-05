-- ==============================================================================
-- Migration: TASK-22 - Automação de Transações Recorrentes (Virada de Mês)
-- ==============================================================================

-- 1. Adicionar rastreador de recorrência na tabela transactions
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS recurrence_source_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- 2. Índices para performance nas consultas de recorrência
CREATE INDEX IF NOT EXISTS idx_transactions_recurrence_source ON transactions(recurrence_source_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_recurring ON transactions(is_recurring) WHERE is_recurring = TRUE;

-- 3. Função Principal: Processar Transações Recorrentes Globalmente (para pg_cron ou Edge Function)
CREATE OR REPLACE FUNCTION process_recurring_transactions(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_start DATE;
  v_target_end DATE;
  v_prev_start DATE;
  v_prev_end DATE;
  v_last_day_target INT;
  v_orig_day INT;
  v_target_day INT;
  v_new_date DATE;
  v_root_id UUID;
  v_count INT := 0;
  r RECORD;
BEGIN
  -- Delimitar o mês alvo e o mês anterior
  v_target_start := date_trunc('month', target_date)::DATE;
  v_target_end := (v_target_start + INTERVAL '1 month')::DATE;
  v_prev_start := (v_target_start - INTERVAL '1 month')::DATE;
  v_prev_end := v_target_start;

  -- Último dia válido do mês alvo (ex: 28/29 em Fev, 30 em Abr, 31 em Jan)
  v_last_day_target := EXTRACT(DAY FROM (v_target_end - INTERVAL '1 day'))::INT;

  -- Buscar todas as transações marcadas como recorrentes no mês anterior
  FOR r IN 
    SELECT * 
    FROM transactions 
    WHERE is_recurring = TRUE 
      AND date >= v_prev_start 
      AND date < v_prev_end
  LOOP
    -- Calcular o dia no mês novo mantendo o dia original ou ajustando ao teto do mês
    v_orig_day := EXTRACT(DAY FROM r.date)::INT;
    v_target_day := LEAST(v_orig_day, v_last_day_target);
    v_new_date := (v_target_start + ((v_target_day - 1) || ' days')::INTERVAL)::DATE;
    
    -- Definir o id de origem raiz para rastreamento
    v_root_id := COALESCE(r.recurrence_source_id, r.id);

    -- Verificar se já existe réplica criada para este lançamento no mês alvo (idempotência)
    IF NOT EXISTS (
      SELECT 1 FROM transactions t
      WHERE (
        t.recurrence_source_id = v_root_id
        OR t.id = r.id
        OR (
          t.user_id IS NOT DISTINCT FROM r.user_id
          AND t.description = r.description
          AND t.amount = r.amount
          AND t.type = r.type
          AND t.payment_method = r.payment_method
          AND t.is_recurring = TRUE
        )
      )
      AND t.date >= v_target_start
      AND t.date < v_target_end
    ) THEN
      -- Inserir nova transação no mês com is_paid = FALSE e isolamento Ticket garantido
      INSERT INTO transactions (
        description,
        amount,
        type,
        category_id,
        date,
        payment_method,
        is_paid,
        is_recurring,
        recurrence_source_id,
        notes,
        user_id
      ) VALUES (
        r.description,
        r.amount,
        r.type,
        CASE WHEN r.payment_method = 'ticket' THEN NULL ELSE r.category_id END,
        v_new_date,
        r.payment_method,
        FALSE, -- Transação nasce pendente no novo mês
        TRUE,  -- Continua recorrente para os meses seguintes
        v_root_id,
        r.notes,
        r.user_id
      );

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 4. Função Escopada ao Usuário Autenticado (para chamada direta via RPC na navegação do App)
CREATE OR REPLACE FUNCTION sync_user_recurring_transactions(target_month_year TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_target_date DATE;
  v_target_start DATE;
  v_target_end DATE;
  v_prev_start DATE;
  v_prev_end DATE;
  v_last_day_target INT;
  v_orig_day INT;
  v_target_day INT;
  v_new_date DATE;
  v_root_id UUID;
  v_count INT := 0;
  r RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  v_target_date := to_date(target_month_year || '-01', 'YYYY-MM-DD');
  v_target_start := date_trunc('month', v_target_date)::DATE;
  v_target_end := (v_target_start + INTERVAL '1 month')::DATE;
  v_prev_start := (v_target_start - INTERVAL '1 month')::DATE;
  v_prev_end := v_target_start;

  v_last_day_target := EXTRACT(DAY FROM (v_target_end - INTERVAL '1 day'))::INT;

  FOR r IN 
    SELECT * 
    FROM transactions 
    WHERE user_id = v_uid
      AND is_recurring = TRUE 
      AND date >= v_prev_start 
      AND date < v_prev_end
  LOOP
    v_orig_day := EXTRACT(DAY FROM r.date)::INT;
    v_target_day := LEAST(v_orig_day, v_last_day_target);
    v_new_date := (v_target_start + ((v_target_day - 1) || ' days')::INTERVAL)::DATE;
    v_root_id := COALESCE(r.recurrence_source_id, r.id);

    IF NOT EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.user_id = v_uid
        AND (
          t.recurrence_source_id = v_root_id
          OR t.id = r.id
          OR (
            t.description = r.description
            AND t.amount = r.amount
            AND t.type = r.type
            AND t.payment_method = r.payment_method
            AND t.is_recurring = TRUE
          )
        )
        AND t.date >= v_target_start
        AND t.date < v_target_end
    ) THEN
      INSERT INTO transactions (
        description,
        amount,
        type,
        category_id,
        date,
        payment_method,
        is_paid,
        is_recurring,
        recurrence_source_id,
        notes,
        user_id
      ) VALUES (
        r.description,
        r.amount,
        r.type,
        CASE WHEN r.payment_method = 'ticket' THEN NULL ELSE r.category_id END,
        v_new_date,
        r.payment_method,
        FALSE,
        TRUE,
        v_root_id,
        r.notes,
        v_uid
      );

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 5. Conceder permissões de execução
GRANT EXECUTE ON FUNCTION process_recurring_transactions TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sync_user_recurring_transactions TO authenticated, service_role;

-- 6. Configuração condicional do pg_cron (se disponível no ambiente Supabase)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron não disponível ou requer ativação no painel do Supabase: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('process_recurring_transactions_monthly') 
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process_recurring_transactions_monthly');

    PERFORM cron.schedule(
      'process_recurring_transactions_monthly',
      '5 0 1 * *', -- Minuto 5 das 00:00 UTC no 1º dia de cada mês
      'SELECT process_recurring_transactions(CURRENT_DATE);'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Não foi possível agendar job pg_cron: %', SQLERRM;
END $$;
