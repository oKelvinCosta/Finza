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

export function useTransactions(selectedMonth: string) {
  return useQuery({
    queryKey: ["transactions", selectedMonth],
    queryFn: async (): Promise<Transaction[]> => {
      const supabase = createClient();
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
