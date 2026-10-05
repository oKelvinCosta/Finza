"use client";

import { useState } from "react";
import { useMonthStore } from "@/stores/use-month-store";
import { useBudgets, useSetBudget, useCopyBudgetFromPreviousMonth } from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Target, AlertTriangle, CheckCircle, Save } from "lucide-react";

export default function BudgetPage() {
  const { selectedMonth } = useMonthStore();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets(selectedMonth);
  const { data: transactions = [] } = useTransactions(selectedMonth);

  const setBudget = useSetBudget();
  const copyBudget = useCopyBudgetFromPreviousMonth();

  // Estado para diálogo de cópia do mês anterior
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyMode, setCopyMode] = useState<"overwrite" | "empty_only">("empty_only");

  // Estado local para valores de input de teto
  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});

  // Filtra apenas categorias de despesa
  const expenseCategories = categories.filter((c) => c.type === "expense");

  // Mapeamento dos gastos realizados no mês por categoria (ignora Ticket)
  const actualByCategory = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense" && t.payment_method !== "ticket" && Boolean(t.category_id))
    .forEach((t) => {
      if (t.category_id) {
        const cur = actualByCategory.get(t.category_id) || 0;
        actualByCategory.set(t.category_id, cur + Number(t.amount));
      }
    });

  // Salvar alteração de orçamento individual
  const handleSaveBudget = async (categoryId: string) => {
    const rawVal = editingAmounts[categoryId];
    const targetAmount = rawVal !== undefined ? parseFloat(rawVal) : undefined;

    if (targetAmount === undefined || isNaN(targetAmount) || targetAmount < 0) {
      toast.error("Informe um valor de orçamento válido (maior ou igual a zero).");
      return;
    }

    try {
      await setBudget.mutateAsync({
        category_id: categoryId,
        month_year: selectedMonth,
        target_amount: targetAmount,
      });
      toast.success("Teto de gastos atualizado!");
    } catch {
      toast.error("Erro ao salvar orçamento.");
    }
  };

  // Executar cópia do mês anterior com a opção selecionada
  const handleConfirmCopy = async () => {
    try {
      const result = await copyBudget.mutateAsync({
        currentMonth: selectedMonth,
        mode: copyMode,
      });
      toast.success(
        copyMode === "overwrite"
          ? "Orçamentos do mês anterior clonados (substituição completa)!"
          : "Categorias vazias preenchidas com as metas do mês anterior!"
      );
      setCopyModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao copiar orçamentos.";
      toast.error(msg);
    }
  };

  // Totais consolidados (ignora Ticket categoricamente)
  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.target_amount), 0);
  const totalSpent = transactions
    .filter((t) => t.type === "expense" && t.payment_method !== "ticket")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const overallProgress = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Topo da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Orçamento de {formatMonthYear(selectedMonth)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Definição e acompanhamento dos tetos de gastos por categoria para o período.
          </p>
        </div>

        <Button
          onClick={() => setCopyModalOpen(true)}
          variant="outline"
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto h-9 text-xs sm:text-sm"
        >
          <Copy className="h-4 w-4" />
          <span>Copiar do Mês Anterior</span>
        </Button>
      </div>

      {/* Card Resumo do Orçamento Geral */}
      <Card className="border-slate-200/80 bg-white shadow-xs">
        <CardContent className="p-4 sm:pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-center">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Planejado
              </p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">
                {formatCurrency(totalBudgeted)}
              </p>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Gasto
              </p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">
                {formatCurrency(totalSpent)}
              </p>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Saldo Orçado
              </p>
              <p
                className={`text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 ${
                  totalBudgeted - totalSpent >= 0 ? "text-teal-700" : "text-rose-700"
                }`}
              >
                {formatCurrency(totalBudgeted - totalSpent)}
              </p>
            </div>

            <div className="col-span-2 md:col-span-1 space-y-1.5 sm:space-y-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600">Consumo Geral:</span>
                <span className="font-bold text-slate-900">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} autoSemanticColor className="h-2 sm:h-2.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade de Categorias com Semáforo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenseCategories.map((cat) => {
          const budget = budgets.find((b) => b.category_id === cat.id);
          const target = budget ? Number(budget.target_amount) : 0;
          const actual = actualByCategory.get(cat.id) || 0;
          const remaining = target - actual;
          const percent = target > 0 ? Math.round((actual / target) * 100) : actual > 0 ? 100 : 0;

          // Semáforo: <75% Verde/Teal, 75-100% Amarelo/Âmbar, >100% Vermelho/Rose
          let statusBadge = (
            <Badge variant="income" className="text-[10px]">
              No teto (&lt;75%)
            </Badge>
          );
          if (percent >= 75 && percent <= 100) {
            statusBadge = (
              <Badge variant="pending" className="text-[10px]">
                Atenção (75-100%)
              </Badge>
            );
          } else if (percent > 100) {
            statusBadge = (
              <Badge variant="destructive" className="text-[10px]">
                Estourado (&gt;100%)
              </Badge>
            );
          }

          const currentInputValue =
            editingAmounts[cat.id] !== undefined
              ? editingAmounts[cat.id]
              : target > 0
              ? target.toString()
              : "";

          return (
            <Card key={cat.id} className="border-slate-200/80 bg-white flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <CardTitle className="text-base font-bold text-slate-900">{cat.name}</CardTitle>
                  </div>
                  {statusBadge}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progresso Semafórico */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Gasto: {formatCurrency(actual)}</span>
                    <span className="font-bold text-slate-900">{percent}%</span>
                  </div>
                  <Progress value={percent} autoSemanticColor className="h-2" />
                </div>

                {/* Detalhes de Saldo */}
                <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Restante para gastar:</span>
                  <span
                    className={`font-semibold ${
                      remaining >= 0 ? "text-teal-700" : "text-rose-700"
                    }`}
                  >
                    {formatCurrency(remaining)}
                  </span>
                </div>

                {/* Input de Meta Editável */}
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Meta de Teto Orçado (R$)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="10"
                      placeholder="Ex: 500"
                      value={currentInputValue}
                      onChange={(e) =>
                        setEditingAmounts({ ...editingAmounts, [cat.id]: e.target.value })
                      }
                      className="h-9 text-xs sm:text-sm font-semibold"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveBudget(cat.id)}
                      className="h-9 px-3 bg-slate-900 text-white hover:bg-slate-800 text-xs cursor-pointer"
                      title="Salvar Teto"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Diálogo de Clonagem com 2 Opções (Sobrescrever tudo ou Apenas vazias) */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="w-[94vw] max-w-[450px] rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>Copiar Orçamento do Mês Anterior</DialogTitle>
            <DialogDescription>
              Importe as metas do mês anterior para o mês ativo selecionado ({formatMonthYear(selectedMonth)}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <label className="text-sm font-semibold text-slate-800">
              Escolha a forma de importação:
            </label>

            {/* Opção 1: Sobrescrever Tudo */}
            <div
              onClick={() => setCopyMode("overwrite")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                copyMode === "overwrite"
                  ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                  : "border-slate-200 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="copyMode"
                  checked={copyMode === "overwrite"}
                  onChange={() => setCopyMode("overwrite")}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Sobrescrever todas as metas
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Substitui integralmente os tetos do mês atual pelas metas definidas no mês anterior.
                  </p>
                </div>
              </div>
            </div>

            {/* Opção 2: Preencher Apenas Categorias Vazias */}
            <div
              onClick={() => setCopyMode("empty_only")}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                copyMode === "empty_only"
                  ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                  : "border-slate-200 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="copyMode"
                  checked={copyMode === "empty_only"}
                  onChange={() => setCopyMode("empty_only")}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Preencher apenas categorias vazias
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mantém os valores que você já ajustou no mês atual e importa apenas as categorias sem teto definido.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCopy}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
