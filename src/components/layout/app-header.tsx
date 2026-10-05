"use client";

import { MonthSelector } from "./month-selector";
import { Button } from "@/components/ui/button";
import { Plus, Wallet } from "lucide-react";
import { useModalStore } from "@/stores/use-modal-store";
import Link from "next/link";

export function AppHeader() {
  const { openModal } = useModalStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 md:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        {/* Logo visível apenas no Mobile / Tablet */}
        <Link href="/" className="flex lg:hidden items-center gap-2 mr-1">
          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Wallet className="h-4 w-4 text-teal-400" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">Finza</span>
        </Link>

        <MonthSelector />
      </div>

      <div className="flex items-center gap-3">
        {/* Botão visível no Desktop */}
        <Button
          onClick={() => openModal()}
          className="hidden lg:flex bg-slate-900 text-white hover:bg-slate-800 shadow-sm items-center gap-2 font-medium cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Transação</span>
        </Button>
      </div>
    </header>
  );
}
