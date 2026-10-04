import { create } from "zustand";
import { Transaction } from "@/types";

interface ModalState {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  defaultType: "expense" | "income";
  openModal: (options?: { transaction?: Transaction; defaultType?: "expense" | "income" }) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  editingTransaction: null,
  defaultType: "expense",
  openModal: (options) =>
    set({
      isOpen: true,
      editingTransaction: options?.transaction || null,
      defaultType: options?.defaultType || (options?.transaction?.type ?? "expense"),
    }),
  closeModal: () =>
    set({
      isOpen: false,
      editingTransaction: null,
    }),
}));
