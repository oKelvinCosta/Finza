import { create } from "zustand";

interface MonthState {
  selectedMonth: string; // 'YYYY-MM'
  setMonth: (month: string) => void;
  nextMonth: () => void;
  previousMonth: () => void;
  setCurrentMonth: () => void;
}

function getInitialMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export const useMonthStore = create<MonthState>((set) => ({
  selectedMonth: getInitialMonth(),
  setMonth: (month) => set({ selectedMonth: month }),
  nextMonth: () =>
    set((state) => {
      const [year, month] = state.selectedMonth.split("-").map(Number);
      const nextDate = new Date(year, month, 1); // month is 0-indexed, so month is next month
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, "0");
      return { selectedMonth: `${y}-${m}` };
    }),
  previousMonth: () =>
    set((state) => {
      const [year, month] = state.selectedMonth.split("-").map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, "0");
      return { selectedMonth: `${y}-${m}` };
    }),
  setCurrentMonth: () => set({ selectedMonth: getInitialMonth() }),
}));
