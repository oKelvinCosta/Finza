"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Budget } from "@/types";
import { getStoredData, saveBudgets } from "@/lib/mock-data";

export function useBudgets(selectedMonth: string) {
  return useQuery({
    queryKey: ["budgets", selectedMonth],
    queryFn: async (): Promise<Budget[]> => {
      await new Promise((r) => setTimeout(r, 50));
      const { budgets, categories } = getStoredData();

      const enriched = budgets.map((b) => ({
        ...b,
        category: categories.find((c) => c.id === b.category_id),
      }));

      return enriched.filter((b) => b.month_year === selectedMonth);
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
    }) => {
      const { budgets } = getStoredData();
      const existingIndex = budgets.findIndex(
        (b) => b.category_id === category_id && b.month_year === month_year
      );

      const updated = [...budgets];
      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          target_amount,
        };
      } else {
        updated.push({
          id: `b-${month_year}-${category_id}`,
          category_id,
          month_year,
          target_amount,
          created_at: new Date().toISOString(),
        });
      }

      saveBudgets(updated);
      return { category_id, month_year, target_amount };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.month_year] });
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
    }) => {
      const [year, month] = currentMonth.split("-").map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const prevY = prevDate.getFullYear();
      const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");
      const previousMonth = `${prevY}-${prevM}`;

      const { budgets } = getStoredData();
      const prevBudgets = budgets.filter((b) => b.month_year === previousMonth);
      if (prevBudgets.length === 0) {
        throw new Error("Não foram encontrados orçamentos no mês anterior.");
      }

      let updatedBudgets = [...budgets];

      if (mode === "overwrite") {
        // Remove orçamentos atuais do mês e substitui pelos anteriores
        updatedBudgets = updatedBudgets.filter((b) => b.month_year !== currentMonth);
        prevBudgets.forEach((pb) => {
          updatedBudgets.push({
            id: `b-${currentMonth}-${pb.category_id}`,
            category_id: pb.category_id,
            month_year: currentMonth,
            target_amount: pb.target_amount,
            created_at: new Date().toISOString(),
          });
        });
      } else {
        // Preenche apenas as categorias sem teto definido no mês atual
        const currentMonthCategoryIds = new Set(
          updatedBudgets.filter((b) => b.month_year === currentMonth).map((b) => b.category_id)
        );

        prevBudgets.forEach((pb) => {
          if (!currentMonthCategoryIds.has(pb.category_id)) {
            updatedBudgets.push({
              id: `b-${currentMonth}-${pb.category_id}`,
              category_id: pb.category_id,
              month_year: currentMonth,
              target_amount: pb.target_amount,
              created_at: new Date().toISOString(),
            });
          }
        });
      }

      saveBudgets(updatedBudgets);
      return { copiedCount: prevBudgets.length };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.currentMonth] });
    },
  });
}
