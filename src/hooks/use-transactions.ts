"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@/types";
import { getStoredData, saveTransactions } from "@/lib/mock-data";

export function useTransactions(selectedMonth: string) {
  return useQuery({
    queryKey: ["transactions", selectedMonth],
    queryFn: async (): Promise<Transaction[]> => {
      // Simula pequena latência de I/O
      await new Promise((r) => setTimeout(r, 50));
      const { transactions, categories } = getStoredData();

      // Associa a categoria populada
      const enriched = transactions.map((t) => ({
        ...t,
        category: categories.find((c) => c.id === t.category_id),
      }));

      // Filtra estritamente pelo mês ativo (YYYY-MM)
      return enriched.filter((t) => t.date.startsWith(selectedMonth));
    },
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: ["transactions", "all"],
    queryFn: async (): Promise<Transaction[]> => {
      await new Promise((r) => setTimeout(r, 50));
      const { transactions, categories } = getStoredData();
      return transactions.map((t) => ({
        ...t,
        category: categories.find((c) => c.id === t.category_id),
      }));
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTx: Omit<Transaction, "id" | "created_at">) => {
      const { transactions } = getStoredData();
      const transaction: Transaction = {
        ...newTx,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString(),
      };
      const updated = [transaction, ...transactions];
      saveTransactions(updated);
      return transaction;
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
    mutationFn: async (updatedTx: Transaction) => {
      const { transactions } = getStoredData();
      const index = transactions.findIndex((t) => t.id === updatedTx.id);
      if (index === -1) throw new Error("Transação não encontrada");
      
      const updatedList = [...transactions];
      updatedList[index] = updatedTx;
      saveTransactions(updatedList);
      return updatedTx;
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
    mutationFn: async ({ id, is_paid }: { id: string; is_paid: boolean }) => {
      const { transactions } = getStoredData();
      const index = transactions.findIndex((t) => t.id === id);
      if (index === -1) throw new Error("Transação não encontrada");

      const updatedList = [...transactions];
      updatedList[index] = { ...updatedList[index], is_paid };
      saveTransactions(updatedList);
      return updatedList[index];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { transactions } = getStoredData();
      const filtered = transactions.filter((t) => t.id !== id);
      saveTransactions(filtered);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
