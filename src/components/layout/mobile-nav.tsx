"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, PieChart, BarChart3, Plus, Minus } from "lucide-react";
import { useModalStore } from "@/stores/use-modal-store";
import { cn } from "@/lib/utils";

const LEFT_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Extrato", icon: ArrowLeftRight },
];

const RIGHT_NAV_ITEMS = [
  { href: "/budget", label: "Orçamento", icon: PieChart },
  { href: "/report", label: "Relatórios", icon: BarChart3 },
];

export function MobileNavBar() {
  const pathname = usePathname();
  const { openModal } = useModalStore();

  return (
    <nav
      aria-label="Navegação Inferior Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
        {/* Itens da Esquerda (Dashboard, Extrato) */}
        <div className="flex items-center justify-around flex-1">
          {LEFT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2 min-w-[56px] text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-slate-900 font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 mb-0.5 transition-colors",
                    isActive ? "text-slate-900" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Botões Centrais Flutuantes (+ Receita e - Despesa) */}
        <div className="flex items-center gap-2 px-1 shrink-0 -translate-y-3.5">
          {/* Botão Nova Receita (+) */}
          <button
            type="button"
            onClick={() => openModal({ defaultType: "income" })}
            title="Nova Receita (+)"
            aria-label="Nova Receita"
            className="h-11 w-11 rounded-full bg-teal-600 hover:bg-teal-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-teal-600/30 border-2 border-white transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </button>

          {/* Botão Nova Despesa (-) */}
          <button
            type="button"
            onClick={() => openModal({ defaultType: "expense" })}
            title="Nova Despesa (-)"
            aria-label="Nova Despesa"
            className="h-11 w-11 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-rose-500/30 border-2 border-white transition-all cursor-pointer"
          >
            <Minus className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Itens da Direita (Orçamento, Relatórios) */}
        <div className="flex items-center justify-around flex-1">
          {RIGHT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2 min-w-[56px] text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-slate-900 font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 mb-0.5 transition-colors",
                    isActive ? "text-slate-900" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
