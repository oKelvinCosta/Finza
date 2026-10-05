"use client";

import { useMonthStore } from "@/stores/use-month-store";
import { formatMonthYear, formatMonthYearShort } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MonthSelector() {
  const { selectedMonth, nextMonth, previousMonth, setCurrentMonth } = useMonthStore();

  const isCurrentMonth = () => {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return selectedMonth === cur;
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1.5 bg-white border border-slate-200/80 rounded-lg p-0.5 sm:p-1 shadow-xs">
      <Button
        variant="ghost"
        size="icon"
        onClick={previousMonth}
        className="h-7 w-7 sm:h-8 sm:w-8 text-slate-600 hover:text-slate-900 cursor-pointer"
        title="Mês Anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2">
        <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 shrink-0" />
        <span className="text-xs sm:text-sm font-semibold text-slate-800 text-center select-none whitespace-nowrap">
          <span className="sm:hidden">{formatMonthYearShort(selectedMonth)}</span>
          <span className="hidden sm:inline">{formatMonthYear(selectedMonth)}</span>
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={nextMonth}
        className="h-7 w-7 sm:h-8 sm:w-8 text-slate-600 hover:text-slate-900 cursor-pointer"
        title="Próximo Mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth() && (
        <Button
          variant="outline"
          size="sm"
          onClick={setCurrentMonth}
          className="text-[11px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2.5 ml-0.5 sm:ml-1 text-teal-700 bg-teal-50/50 border-teal-200 hover:bg-teal-100/70 cursor-pointer flex items-center gap-1"
          title="Voltar para o Mês Atual"
        >
          <RotateCcw className="h-3 w-3 sm:hidden" />
          <span className="hidden sm:inline">Mês Atual</span>
        </Button>
      )}
    </div>
  );
}
