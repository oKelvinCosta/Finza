"use client";

import { MonthSelector } from "./month-selector";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModalStore } from "@/stores/use-modal-store";

export function AppHeader() {
  const { openModal } = useModalStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-xs">
      <div className="flex items-center gap-4">
        <MonthSelector />
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => openModal()}
          className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm flex items-center gap-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Transação</span>
        </Button>
      </div>
    </header>
  );
}
