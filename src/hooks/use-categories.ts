"use client";

import { useQuery } from "@tanstack/react-query";
import { Category } from "@/types";
import { getStoredData } from "@/lib/mock-data";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { categories } = getStoredData();
      return categories;
    },
  });
}
