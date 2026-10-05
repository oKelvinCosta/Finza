"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionFormSchema, TransactionFormValues } from "@/lib/validations/transaction";
import { useModalStore } from "@/stores/use-modal-store";
import { useMonthStore } from "@/stores/use-month-store";
import { useCategories } from "@/hooks/use-categories";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/use-transactions";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, QrCode, Tag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function getTodayFormatted(monthYear?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  if (monthYear && !monthYear.startsWith(`${year}-${month}`)) {
    return `${monthYear}-01`;
  }
  return `${year}-${month}-${day}`;
}

export function TransactionModal() {
  const { isOpen, closeModal, editingTransaction, defaultType } = useModalStore();
  const { selectedMonth } = useMonthStore();
  const { data: categories = [] } = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();

  const isEditing = Boolean(editingTransaction);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: defaultType,
      description: "",
      amount: "" as unknown as number,
      date: getTodayFormatted(selectedMonth),
      category_id: "",
      payment_method: "credito",
      is_paid: true,
      is_recurring: false,
      notes: "",
    },
  });

  const currentType = watch("type");
  const currentPaymentMethod = watch("payment_method");

  // Filtra as categorias disponíveis pelo tipo da transação
  const filteredCategories = categories.filter((c) => c.type === currentType);

  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        date: editingTransaction.date,
        category_id: editingTransaction.category_id || "",
        payment_method: editingTransaction.payment_method,
        is_paid: editingTransaction.is_paid,
        is_recurring: editingTransaction.is_recurring,
        notes: editingTransaction.notes || "",
      });
      const hasAdvanced =
        editingTransaction.is_paid === false ||
        editingTransaction.is_recurring === true ||
        Boolean(editingTransaction.notes && editingTransaction.notes.trim() !== "");
      setShowAdvanced(hasAdvanced);
    } else {
      reset({
        type: defaultType,
        description: "",
        amount: "" as unknown as number,
        date: getTodayFormatted(selectedMonth),
        category_id: "",
        payment_method: "credito",
        is_paid: true,
        is_recurring: false,
        notes: "",
      });
      setShowAdvanced(false);
    }
  }, [editingTransaction, defaultType, selectedMonth, reset, isOpen]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const sanitizedCategoryId =
        values.payment_method === "ticket"
          ? null
          : values.category_id && values.category_id.trim() !== ""
          ? values.category_id
          : null;

      if (isEditing && editingTransaction) {
        await updateTx.mutateAsync({
          ...editingTransaction,
          ...values,
          category_id: sanitizedCategoryId,
          notes: values.notes || null,
        });
        toast.success("Transação atualizada com sucesso!");
      } else {
        await createTx.mutateAsync({
          ...values,
          category_id: sanitizedCategoryId,
          notes: values.notes || null,
        });
        toast.success("Transação cadastrada com sucesso!");
      }
      closeModal();
    } catch {
      toast.error("Ocorreu um erro ao salvar a transação.");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <SheetContent side="right" className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-slate-900">
            {isEditing ? "Editar Transação" : "Nova Transação"}
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            {isEditing
              ? "Atualize os detalhes da transação selecionada."
              : "Preencha os dados abaixo para registrar uma nova movimentação."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Alternador de Tipo: Despesa vs Receita */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setValue("type", "expense");
                setValue("category_id", "");
              }}
              className={cn(
                "py-2 text-sm font-semibold rounded-md transition-all cursor-pointer",
                currentType === "expense"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("type", "income");
                setValue("category_id", "");
              }}
              className={cn(
                "py-2 text-sm font-semibold rounded-md transition-all cursor-pointer",
                currentType === "income"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Receita
            </button>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-slate-700">Valor (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                R$
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                className="pl-9 text-base font-semibold text-slate-900"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-slate-700">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Almoço, Salário, Internet..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-rose-600">{errors.description.message}</p>
            )}
          </div>

          {/* Método de Pagamento: Botões Rápidos */}
          <div className="space-y-1.5">
            <Label className="text-slate-700">Forma de Pagamento</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValue("payment_method", "credito")}
                className={cn(
                  "flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                  currentPaymentMethod === "credito"
                    ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <CreditCard className="h-4 w-4" />
                <span>Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setValue("payment_method", "pix")}
                className={cn(
                  "flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                  currentPaymentMethod === "pix"
                    ? "border-teal-700 bg-teal-600 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <QrCode className="h-4 w-4" />
                <span>Pix</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue("payment_method", "ticket");
                  setValue("category_id", "");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                  currentPaymentMethod === "ticket"
                    ? "border-orange-600 bg-orange-500 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <Tag className="h-4 w-4" />
                <span>Ticket</span>
              </button>
            </div>
          </div>

          {/* Data e Categoria (Categoria ocultada quando Método for Ticket) */}
          <div className={cn("grid gap-3", currentPaymentMethod === "ticket" ? "grid-cols-1" : "grid-cols-2")}>
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-slate-700">Data</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-rose-600">{errors.date.message}</p>
              )}
            </div>

            {currentPaymentMethod !== "ticket" && (
              <div className="space-y-1.5">
                <Label className="text-slate-700">Categoria</Label>
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: c.color }}
                              />
                              <span>{c.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category_id && (
                  <p className="text-xs text-rose-600">{errors.category_id.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Opções Avançadas (Colapsáveis) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <span>Opções avançadas</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-slate-400 transition-transform duration-200",
                  showAdvanced && "rotate-180 text-slate-700"
                )}
              />
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <Label htmlFor="is_paid" className="text-xs font-medium text-slate-800 cursor-pointer">
                      Transação já realizada
                    </Label>
                    <p className="text-[11px] text-slate-500">
                      Despesas pendentes também abatem do saldo do mês.
                    </p>
                  </div>
                  <Controller
                    name="is_paid"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="is_paid"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <Label htmlFor="is_recurring" className="text-xs font-medium text-slate-800 cursor-pointer">
                      Transação Recorrente
                    </Label>
                    <p className="text-[11px] text-slate-500">
                      Replicar automaticamente nos próximos meses.
                    </p>
                  </div>
                  <Controller
                    name="is_recurring"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="is_recurring"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs text-slate-700">Observações (opcional)</Label>
                  <Input id="notes" placeholder="Detalhes adicionais..." {...register("notes")} />
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-slate-900 text-white hover:bg-slate-800 min-w-[120px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Transação"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
