"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Budget, Category } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface DbBudgetRow {
  id: string;
  category_id: string;
  category?: Category | Category[] | null;
  month_year: string;
  target_amount: number | string;
  user_id?: string;
  created_at: string;
}

function mapBudget(row: DbBudgetRow): Budget {
  const categoryRaw = Array.isArray(row.category)
    ? row.category[0] || null
    : row.category || null;

  return {
    id: row.id,
    category_id: row.category_id,
    category: categoryRaw
      ? {
          id: categoryRaw.id,
          name: categoryRaw.name,
          type: categoryRaw.type,
          color: categoryRaw.color,
          user_id: categoryRaw.user_id,
          created_at: categoryRaw.created_at,
        }
      : undefined,
    month_year: row.month_year,
    target_amount: Number(row.target_amount),
    user_id: row.user_id,
    created_at: row.created_at,
  };
}

export function useBudgets(selectedMonth: string) {
  return useQuery({
    queryKey: ["budgets", selectedMonth],
    queryFn: async (): Promise<Budget[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("budgets")
        .select("*, category:categories(*)")
        .eq("month_year", selectedMonth);

      if (error) {
        throw error;
      }

      return ((data as unknown as DbBudgetRow[]) || []).map(mapBudget);
    },
  });
}

export function useSetBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category_id,
      month_year,
      target_amount,
    }: {
      category_id: string;
      month_year: string;
      target_amount: number;
    }): Promise<Budget> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Verifica se já existe orçamento para a categoria e mês
      const { data: existing, error: findError } = await supabase
        .from("budgets")
        .select("id")
        .eq("category_id", category_id)
        .eq("month_year", month_year)
        .maybeSingle();

      if (findError) {
        throw findError;
      }

      if (existing) {
        const { data, error } = await supabase
          .from("budgets")
          .update({
            target_amount: Number(target_amount),
          })
          .eq("id", existing.id)
          .select("*, category:categories(*)")
          .single();

        if (error) throw error;
        return mapBudget(data as unknown as DbBudgetRow);
      } else {
        const { data, error } = await supabase
          .from("budgets")
          .insert({
            category_id,
            month_year,
            target_amount: Number(target_amount),
            ...(user ? { user_id: user.id } : {}),
          })
          .select("*, category:categories(*)")
          .single();

        if (error) throw error;
        return mapBudget(data as unknown as DbBudgetRow);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.month_year] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useCopyBudgetFromPreviousMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentMonth,
      mode,
    }: {
      currentMonth: string;
      mode: "overwrite" | "empty_only";
    }): Promise<{ copiedCount: number }> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [year, month] = currentMonth.split("-").map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const prevY = prevDate.getFullYear();
      const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");
      const previousMonth = `${prevY}-${prevM}`;

      const { data: prevBudgets, error: prevError } = await supabase
        .from("budgets")
        .select("*")
        .eq("month_year", previousMonth);

      if (prevError) throw prevError;

      const prevList = (prevBudgets as unknown as DbBudgetRow[]) || [];
      if (prevList.length === 0) {
        throw new Error("Não foram encontrados orçamentos no mês anterior.");
      }

      if (mode === "overwrite") {
        // Remove orçamentos atuais do mês e substitui pelos anteriores
        const { error: deleteError } = await supabase
          .from("budgets")
          .delete()
          .eq("month_year", currentMonth);

        if (deleteError) throw deleteError;

        const toInsert = prevList.map((pb: DbBudgetRow) => ({
          category_id: pb.category_id,
          month_year: currentMonth,
          target_amount: Number(pb.target_amount),
          ...(user ? { user_id: user.id } : {}),
        }));

        const { error: insertError } = await supabase.from("budgets").insert(toInsert);
        if (insertError) throw insertError;

        return { copiedCount: toInsert.length };
      } else {
        // Preenche apenas as categorias sem teto definido no mês atual
        const { data: currentBudgets, error: currentError } = await supabase
          .from("budgets")
          .select("category_id")
          .eq("month_year", currentMonth);

        if (currentError) throw currentError;

        const currentRows = (currentBudgets as unknown as { category_id: string }[]) || [];
        const currentCategoryIds = new Set(currentRows.map((b: { category_id: string }) => b.category_id));

        const toInsert = prevList
          .filter((pb: DbBudgetRow) => !currentCategoryIds.has(pb.category_id))
          .map((pb: DbBudgetRow) => ({
            category_id: pb.category_id,
            month_year: currentMonth,
            target_amount: Number(pb.target_amount),
            ...(user ? { user_id: user.id } : {}),
          }));

        if (toInsert.length > 0) {
          const { error: insertError } = await supabase.from("budgets").insert(toInsert);
          if (insertError) throw insertError;
        }

        return { copiedCount: toInsert.length };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.currentMonth] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
