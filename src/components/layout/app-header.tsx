"use client";

import { MonthSelector } from "./month-selector";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, LogOut } from "lucide-react";
import { useModalStore } from "@/stores/use-modal-store";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";

export function AppHeader() {
  const { openModal } = useModalStore();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-4 md:px-6 backdrop-blur-xs min-w-0 max-w-full">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Logo visível apenas no Mobile / Tablet */}
        <Link href="/" className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0" title="Finza">
          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Wallet className="h-4 w-4 text-teal-400" />
          </div>
          <span className="hidden sm:inline font-bold text-base text-slate-900 tracking-tight">Finza</span>
        </Link>

        <MonthSelector />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Botão de Nova Transação no Desktop */}
        <Button
          onClick={() => openModal()}
          className="hidden lg:flex bg-slate-900 text-white hover:bg-slate-800 shadow-sm items-center gap-2 font-medium cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Transação</span>
        </Button>

        {/* Botão de Logout no Mobile */}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            title={`Sair (${user.email})`}
            className="flex lg:hidden h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
