"use client";

import { useMonthStore } from "@/stores/use-month-store";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { useModalStore } from "@/stores/use-modal-store";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Tag,
  Target,
  Plus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function DashboardPage() {
  const { selectedMonth } = useMonthStore();
  const { openModal } = useModalStore();
  const { data: transactions = [], isLoading: loadingTx } = useTransactions(selectedMonth);
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets(selectedMonth);

  // 1. Isolamento da Carteira Pessoal (Crédito / Pix)
  const personalTransactions = transactions.filter((t) => t.payment_method !== "ticket");
  const totalReceitas = personalTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalDespesas = personalTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const saldoLivre = totalReceitas - totalDespesas;

  // 2. Isolamento da Carteira Ticket
  const ticketTransactions = transactions.filter((t) => t.payment_method === "ticket");
  const ticketEntradas = ticketTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const ticketGastos = ticketTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const saldoRestanteTicket = ticketEntradas - ticketGastos;

  // 3. Orçamento Geral (ignora Ticket categoricamente)
  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.target_amount), 0);
  const totalActualExpenses = personalTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const budgetProgress =
    totalBudgeted > 0 ? Math.round((totalActualExpenses / totalBudgeted) * 100) : 0;

  // 4. Dados para o Gráfico de Distribuição por Categoria (apenas despesas pessoais com categoria)
  const categoryExpensesMap = new Map<string, { name: string; value: number; color: string }>();

  personalTransactions
    .filter((t) => t.type === "expense" && Boolean(t.category_id))
    .forEach((t) => {
      const catName = t.category?.name || "Sem categoria";
      const catColor = t.category?.color || "#64748b";
      const current = categoryExpensesMap.get(catName) || { name: catName, value: 0, color: catColor };
      categoryExpensesMap.set(catName, {
        ...current,
        value: current.value + Number(t.amount),
      });
    });

  const chartData = Array.from(categoryExpensesMap.values()).sort((a, b) => b.value - a.value);

  // Transações recentes
  const recentTransactions = [...transactions].slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel do Mês — {formatMonthYear(selectedMonth)}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Visão isolada e instantânea da sua saúde financeira mensal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => openModal({ defaultType: "expense" })}
            className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Despesa
          </Button>
          <Button
            onClick={() => openModal({ defaultType: "income" })}
            variant="outline"
            className="border-slate-200 text-teal-700 hover:bg-teal-50"
          >
            <Plus className="h-4 w-4 mr-1.5 text-teal-600" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* BLOCO 1: CARTEIRA PESSOAL (Conta Corrente: Pix e Crédito) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-slate-700" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Carteira Pessoal (Conta Corrente)
          </h3>
          <span className="text-xs text-slate-400 font-normal">Pix e Crédito</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card Entradas */}
          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Entradas do Mês
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalReceitas)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Receitas em Pix ou Crédito</p>
            </CardContent>
          </Card>

          {/* Card Saídas */}
          <Card className="border-slate-200/80 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Saídas do Mês
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalDespesas)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Despesas pagas e pendentes</p>
            </CardContent>
          </Card>

          {/* Card Saldo Restante */}
          <Card className={saldoLivre >= 0 ? "border-teal-200/60 bg-teal-50/20" : "border-rose-200/60 bg-rose-50/20"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Saldo Restante do Mês
              </CardTitle>
              <div className={saldoLivre >= 0 ? "h-8 w-8 rounded-full bg-teal-100/70 flex items-center justify-center text-teal-700" : "h-8 w-8 rounded-full bg-rose-100/70 flex items-center justify-center text-rose-700"}>
                {saldoLivre >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldoLivre >= 0 ? "text-teal-700" : "text-rose-700"}`}>
                {formatCurrency(saldoLivre)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {saldoLivre >= 0 ? "Saldo livre disponível" : "Despesas superaram as receitas"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOCO 2: CARTEIRA TICKET (VR/VA Isolado) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Carteira Ticket
          </h3>
          <span className="text-xs text-indigo-600 font-medium">Benefício Corporativo Isolado</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card Recarga */}
          <Card className="border-indigo-100 bg-indigo-50/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Recargas de Ticket
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(ticketEntradas)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Crédito de alimentação/refeição</p>
            </CardContent>
          </Card>

          {/* Card Gastos */}
          <Card className="border-indigo-100 bg-indigo-50/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Gastos de Ticket
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(ticketGastos)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total consumido no mês</p>
            </CardContent>
          </Card>

          {/* Card Saldo Ticket */}
          <Card className="border-indigo-200/80 bg-indigo-50/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-600 tracking-wider">
                Saldo Restante de Ticket
              </CardTitle>
              <Badge variant="ticket">Isolado</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">
                {formatCurrency(saldoRestanteTicket)}
              </div>
              <p className="text-xs text-indigo-700/80 mt-1">Não mistura com conta corrente</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOCO 3: ORÇAMENTO & GRÁFICO DE CATEGORIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consumo do Orçamento Geral */}
        <Card className="lg:col-span-1 border-slate-200/80 bg-white flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-700" />
                Consumo do Orçamento
              </CardTitle>
              <Link
                href="/budget"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                Gerenciar
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-bold text-slate-900">
                  {budgetProgress}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {formatCurrency(totalActualExpenses)} de {formatCurrency(totalBudgeted)}
                </span>
              </div>
              <Progress
                value={budgetProgress}
                autoSemanticColor
                className="h-2.5 bg-slate-100"
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Teto Total Orçado:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalBudgeted)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Realizado no Mês:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totalActualExpenses)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-1.5 text-slate-700 font-medium">
                <span>Disponível para Gastar:</span>
                <span className={totalBudgeted - totalActualExpenses >= 0 ? "text-teal-700 font-bold" : "text-rose-700 font-bold"}>
                  {formatCurrency(Math.max(totalBudgeted - totalActualExpenses, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Categoria */}
        <Card className="lg:col-span-2 border-slate-200/80 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                Distribuição de Despesas por Categoria
              </CardTitle>
              <span className="text-xs text-slate-500">Mês Selecionado</span>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Nenhuma despesa cadastrada neste mês.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => [formatCurrency(Number(val)), "Valor"]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                  {chartData.map((item) => {
                    const pct = totalActualExpenses > 0 ? Math.round((item.value / totalActualExpenses) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-slate-700">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
                          <span className="text-slate-400 ml-1.5">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BLOCO 4: ÚLTIMAS TRANSAÇÕES DO MÊS */}
      <Card className="border-slate-200/80 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Movimentações Recentes do Mês
            </CardTitle>
            <p className="text-xs text-slate-500">Últimos lançamentos registrados no período</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            Ver Extrato Completo
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Nenhuma transação registrada neste mês.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tx.category?.color || "#94a3b8" }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                      <p className="text-xs text-slate-400">
                        {tx.date} • {tx.category?.name || "Sem categoria"} •{" "}
                        <span className="capitalize">{tx.payment_method}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={tx.is_paid ? "paid" : "pending"}>
                      {tx.is_paid ? "Pago" : "Pendente"}
                    </Badge>
                    <span
                      className={`text-sm font-bold ${
                        tx.type === "income" ? "text-teal-700" : "text-rose-700"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
