"use client";

import { useMonthStore } from "@/stores/use-month-store";
import { formatMonthYear } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MonthSelector() {
  const { selectedMonth, nextMonth, previousMonth, setCurrentMonth } = useMonthStore();

  const isCurrentMonth = () => {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return selectedMonth === cur;
  };

  return (
    <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-lg p-1 shadow-xs">
      <Button
        variant="ghost"
        size="icon"
        onClick={previousMonth}
        className="h-8 w-8 text-slate-600 hover:text-slate-900"
        title="Mês Anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 px-2">
        <CalendarIcon className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-800 min-w-[130px] text-center select-none">
          {formatMonthYear(selectedMonth)}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={nextMonth}
        className="h-8 w-8 text-slate-600 hover:text-slate-900"
        title="Próximo Mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth() && (
        <Button
          variant="outline"
          size="sm"
          onClick={setCurrentMonth}
          className="text-xs h-7 ml-1 text-slate-600 border-slate-200 hover:bg-slate-50"
        >
          Mês Atual
        </Button>
      )}
    </div>
  );
}
