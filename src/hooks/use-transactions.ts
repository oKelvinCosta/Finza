"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction, Category } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface DbTransactionRow {
  id: string;
  description: string;
  amount: number | string;
  type: "income" | "expense";
  category_id: string | null;
  category?: Category | Category[] | null;
  date: string;
  payment_method: "credito" | "pix" | "ticket";
  is_paid: boolean;
  is_recurring: boolean;
  recurrence_source_id?: string | null;
  notes: string | null;
  user_id?: string;
  created_at: string;
}

function mapTransaction(row: DbTransactionRow): Transaction {
  const categoryRaw = Array.isArray(row.category)
    ? row.category[0] || null
    : row.category || null;

  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category_id: row.payment_method === "ticket" ? null : row.category_id,
    category:
      row.payment_method === "ticket"
        ? null
        : categoryRaw
        ? {
            id: categoryRaw.id,
            name: categoryRaw.name,
            type: categoryRaw.type,
            color: categoryRaw.color,
            user_id: categoryRaw.user_id,
            created_at: categoryRaw.created_at,
          }
        : null,
    date: row.date,
    payment_method: row.payment_method,
    is_paid: Boolean(row.is_paid),
    is_recurring: Boolean(row.is_recurring),
    recurrence_source_id: row.recurrence_source_id || null,
    notes: row.notes,
    user_id: row.user_id,
    created_at: row.created_at,
  };
}

function getMonthRange(monthYear: string): { start: string; end: string } {
  const [yearStr, monthStr] = monthYear.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const start = `${monthYear}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return { start, end };
}

/**
 * Sincroniza automaticamente transações recorrentes da virada de mês (idempotente).
 * Tenta via Stored Procedure RPC do PostgreSQL e, em caso de ausência, executa fallback direto.
 */
async function syncUserRecurringTransactions(
  supabase: ReturnType<typeof createClient>,
  selectedMonth: string
): Promise<void> {
  try {
    const { error: rpcError } = await supabase.rpc(
      "sync_user_recurring_transactions",
      { target_month_year: selectedMonth }
    );

    if (!rpcError) {
      return;
    }
  } catch {
    // Ignora para executar o fallback
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [year, month] = selectedMonth.split("-").map(Number);
    const targetMonthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonthYear = month === 12 ? year + 1 : year;
    const nextMonthVal = month === 12 ? 1 : month + 1;
    const targetMonthEnd = `${nextMonthYear}-${String(nextMonthVal).padStart(2, "0")}-01`;

    const prevMonthYear = month === 1 ? year - 1 : year;
    const prevMonthVal = month === 1 ? 12 : month - 1;
    const prevMonthStart = `${prevMonthYear}-${String(prevMonthVal).padStart(2, "0")}-01`;
    const prevMonthEnd = targetMonthStart;

    // Buscar transações recorrentes do mês anterior
    let prevQuery = supabase
      .from("transactions")
      .select("*")
      .eq("is_recurring", true)
      .gte("date", prevMonthStart)
      .lt("date", prevMonthEnd);

    if (user) {
      prevQuery = prevQuery.eq("user_id", user.id);
    }

    const { data: prevRecurrings, error: prevError } = await prevQuery;
    if (prevError || !prevRecurrings || prevRecurrings.length === 0) {
      return;
    }

    // Buscar lançamentos existentes no mês alvo para evitar duplicações
    let currentQuery = supabase
      .from("transactions")
      .select("id, description, amount, type, payment_method, recurrence_source_id, is_recurring, user_id")
      .gte("date", targetMonthStart)
      .lt("date", targetMonthEnd);

    if (user) {
      currentQuery = currentQuery.eq("user_id", user.id);
    }

    const { data: currentRows, error: curError } = await currentQuery;
    if (curError) return;

    const existing = (currentRows as unknown as DbTransactionRow[]) || [];
    const lastDayOfTargetMonth = new Date(year, month, 0).getDate();

    for (const prev of prevRecurrings as unknown as DbTransactionRow[]) {
      const rootId = prev.recurrence_source_id || prev.id;

      const alreadyExists = existing.some((c) => {
        if (c.recurrence_source_id && c.recurrence_source_id === rootId) return true;
        if (c.id === prev.id) return true;
        return (
          c.description === prev.description &&
          Number(c.amount) === Number(prev.amount) &&
          c.type === prev.type &&
          c.payment_method === prev.payment_method &&
          c.is_recurring === true
        );
      });

      if (!alreadyExists) {
        const origDay = parseInt(prev.date.split("-")[2], 10);
        const targetDay = Math.min(origDay, lastDayOfTargetMonth);
        const newDate = `${year}-${String(month).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
        const isTicket = prev.payment_method === "ticket";

        await supabase.from("transactions").insert({
          description: prev.description,
          amount: Number(prev.amount),
          type: prev.type,
          category_id: isTicket ? null : prev.category_id,
          date: newDate,
          payment_method: prev.payment_method,
          is_paid: false, // Transação inicia pendente no novo mês
          is_recurring: true, // Permanece recorrente
          recurrence_source_id: rootId,
          notes: prev.notes,
          ...(user ? { user_id: user.id } : {}),
        });
      }
    }
  } catch {
    // Falha silenciosa para não quebrar a consulta de leitura
  }
}

export function useTransactions(selectedMonth: string) {
  return useQuery({
    queryKey: ["transactions", selectedMonth],
    queryFn: async (): Promise<Transaction[]> => {
      const supabase = createClient();

      // Sincroniza automaticamente transações recorrentes da virada de mês
      await syncUserRecurringTransactions(supabase, selectedMonth);

      const { start, end } = getMonthRange(selectedMonth);

      const { data, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .gte("date", start)
        .lt("date", end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return ((data as unknown as DbTransactionRow[]) || []).map(mapTransaction);
    },
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: ["transactions", "all"],
    queryFn: async (): Promise<Transaction[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return ((data as unknown as DbTransactionRow[]) || []).map(mapTransaction);
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newTx: Omit<Transaction, "id" | "created_at">
    ): Promise<Transaction> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const isTicket = newTx.payment_method === "ticket";

      const payload = {
        description: newTx.description.trim(),
        amount: Number(newTx.amount),
        type: newTx.type,
        category_id: isTicket ? null : newTx.category_id || null,
        date: newTx.date,
        payment_method: newTx.payment_method,
        is_paid: Boolean(newTx.is_paid),
        is_recurring: Boolean(newTx.is_recurring),
        recurrence_source_id: newTx.recurrence_source_id || null,
        notes: newTx.notes?.trim() || null,
        ...(user ? { user_id: user.id } : {}),
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert(payload)
        .select("*, category:categories(*)")
        .single();

      if (error) {
        throw error;
      }

      return mapTransaction(data as unknown as DbTransactionRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedTx: Transaction): Promise<Transaction> => {
      const supabase = createClient();
      const isTicket = updatedTx.payment_method === "ticket";

      const payload = {
        description: updatedTx.description.trim(),
        amount: Number(updatedTx.amount),
        type: updatedTx.type,
        category_id: isTicket ? null : updatedTx.category_id || null,
        date: updatedTx.date,
        payment_method: updatedTx.payment_method,
        is_paid: Boolean(updatedTx.is_paid),
        is_recurring: Boolean(updatedTx.is_recurring),
        recurrence_source_id: updatedTx.recurrence_source_id || null,
        notes: updatedTx.notes?.trim() || null,
      };

      const { data, error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", updatedTx.id)
        .select("*, category:categories(*)")
        .single();

      if (error) {
        throw error;
      }

      return mapTransaction(data as unknown as DbTransactionRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useToggleTransactionPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      is_paid,
    }: {
      id: string;
      is_paid: boolean;
    }): Promise<Transaction> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("transactions")
        .update({ is_paid })
        .eq("id", id)
        .select("*, category:categories(*)")
        .single();

      if (error) {
        throw error;
      }

      return mapTransaction(data as unknown as DbTransactionRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const supabase = createClient();

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useSyncRecurringTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetMonth: string) => {
      const supabase = createClient();
      await syncUserRecurringTransactions(supabase, targetMonth);
    },
    onSuccess: (_, targetMonth) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", targetMonth] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
