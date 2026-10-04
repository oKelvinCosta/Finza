"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, PieChart, BarChart3, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Extrato", icon: ArrowLeftRight },
  { href: "/budget", label: "Orçamento", icon: PieChart },
  { href: "/report", label: "Relatórios", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-200/80">
        <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
          <Wallet className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-slate-900 tracking-tight">Finza</h1>
          <p className="text-[11px] font-medium text-slate-400">Controle Pessoal & Ticket</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-slate-900" : "text-slate-400"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
          <p className="text-xs font-semibold text-slate-700">Fase 1: Mock Local</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Isolamento mensal estrito e dados salvos no navegador.</p>
        </div>
      </div>
    </aside>
  );
}
