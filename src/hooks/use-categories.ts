"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category } from "@/types";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_SEEDS = [
  { name: "Alimentação", type: "expense" as const, color: "#f59e0b" },
  { name: "Lazer", type: "expense" as const, color: "#0d9488" },
  { name: "Dev. Pessoal", type: "expense" as const, color: "#6366f1" },
  { name: "Transporte", type: "expense" as const, color: "#3b82f6" },
  { name: "Despesas", type: "expense" as const, color: "#64748b" },
  { name: "Oferta", type: "expense" as const, color: "#14b8a6" },
  { name: "Dízimo", type: "expense" as const, color: "#0f766e" },
  { name: "Viagem", type: "expense" as const, color: "#f43f5e" },
  { name: "Salário", type: "income" as const, color: "#0d9488" },
  { name: "Renda Extra", type: "income" as const, color: "#10b981" },
];

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      // Se a tabela estiver vazia para o usuário, auto-sementeia as categorias padrão
      if (!data || data.length === 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const seeds = DEFAULT_SEEDS.map((s) => ({
            name: s.name,
            type: s.type,
            color: s.color,
            user_id: user.id,
          }));

          const { data: inserted, error: insertError } = await supabase
            .from("categories")
            .insert(seeds)
            .select();

          if (!insertError && inserted && inserted.length > 0) {
            return inserted as Category[];
          }
        }
      }

      return (data || []) as Category[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newCategory: Omit<Category, "id" | "created_at">
    ): Promise<Category> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategory.name,
          type: newCategory.type,
          color: newCategory.color,
          user_id: user ? user.id : null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
