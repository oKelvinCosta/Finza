"use client";

import { useMemo } from "react";
import { useMonthStore } from "@/stores/use-month-store";
import { useTransactions, useAllTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Download,
  TrendingDown,
  Calendar,
  UtensilsCrossed,
  Printer,
  BarChart2,
  PieChart as PieIcon,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function ReportsPage() {
  const { selectedMonth } = useMonthStore();
  const { data: monthTransactions = [] } = useTransactions(selectedMonth);
  const { data: allTransactions = [] } = useAllTransactions();

  // 1. Categoria onde mais gastou no mês (estritamente despesas pessoais com categoria)
  const categoryExpenses = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; color: string }>();
    monthTransactions
      .filter((t) => t.type === "expense" && t.payment_method !== "ticket" && Boolean(t.category_id))
      .forEach((t) => {
        const name = t.category?.name || "Sem categoria";
        const color = t.category?.color || "#64748b";
        const cur = map.get(name) || { name, amount: 0, color };
        map.set(name, { ...cur, amount: cur.amount + Number(t.amount) });
      });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [monthTransactions]);

  const topCategory = categoryExpenses[0] || null;

  // 2. Média diária de gastos (conta pessoal)
  const totalDespesasMes = monthTransactions
    .filter((t) => t.type === "expense" && t.payment_method !== "ticket")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const daysElapsed = isCurrentMonth ? Math.max(today.getDate(), 1) : daysInMonth;
  const daysRemaining = isCurrentMonth ? Math.max(daysInMonth - today.getDate(), 1) : 0;

  const mediaDiariaGastos = daysElapsed > 0 ? totalDespesasMes / daysElapsed : 0;

  // 3. Consumo específico de Ticket (ritmo diário de gasto do benefício até acabar o mês)
  const ticketTransactions = monthTransactions.filter((t) => t.payment_method === "ticket");
  const ticketEntradas = ticketTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const ticketGastos = ticketTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const ticketSaldoRestante = ticketEntradas - ticketGastos;

  const ritmoDiarioTicket =
    daysRemaining > 0 && ticketSaldoRestante > 0
      ? ticketSaldoRestante / daysRemaining
      : ticketSaldoRestante > 0
      ? ticketSaldoRestante
      : 0;

  // 4. Histórico Multimeses (últimos 6 meses da conta pessoal)
  const historyData = useMemo(() => {
    const monthsMap = new Map<string, { month: string; income: number; expense: number }>();

    allTransactions
      .filter((t) => t.payment_method !== "ticket")
      .forEach((t) => {
        const m = t.date.substring(0, 7); // 'YYYY-MM'
        const cur = monthsMap.get(m) || { month: m, income: 0, expense: 0 };
        if (t.type === "income") {
          cur.income += Number(t.amount);
        } else {
          cur.expense += Number(t.amount);
        }
        monthsMap.set(m, cur);
      });

    return Array.from(monthsMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [allTransactions]);

  // Exportar para CSV
  const handleExportCSV = () => {
    if (monthTransactions.length === 0) return;

    const headers = ["ID", "Data", "Descricao", "Tipo", "Categoria", "Forma_Pagamento", "Valor", "Status"];
    const rows = monthTransactions.map((t) => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.type === "income" ? "Receita" : "Despesa",
      `"${t.category?.name || "Geral"}"`,
      t.payment_method,
      t.amount.toFixed(2),
      t.is_paid ? "Pago" : "Pendente",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_finza_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Topo da Página com Ações de Exportação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Relatórios Financeiros — {formatMonthYear(selectedMonth)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Métricas inteligentes, comparativos históricos e exportação dos dados.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-9 text-xs sm:text-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-9 text-xs sm:text-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS INTELIGENTES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Maior Gasto */}
        <Card className="border-slate-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Categoria de Maior Gasto
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900">
              {topCategory ? topCategory.name : "Nenhuma"}
            </div>
            <p className="text-xs text-rose-700 font-semibold mt-1">
              {topCategory ? formatCurrency(topCategory.amount) : "R$ 0,00"}
            </p>
          </CardContent>
        </Card>

        {/* Média Diária de Gastos */}
        <Card className="border-slate-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Média Diária de Gastos
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-slate-900">
              {formatCurrency(mediaDiariaGastos)}
              <span className="text-xs font-normal text-slate-400"> / dia</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Baseado em {daysElapsed} dias decorridos
            </p>
          </CardContent>
        </Card>

        {/* Ritmo do Benefício Ticket */}
        <Card className="border-indigo-100 bg-indigo-50/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-600 tracking-wider">
              Ritmo de Consumo Ticket
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl font-bold text-indigo-950">
              {formatCurrency(ritmoDiarioTicket)}
              <span className="text-xs font-normal text-indigo-700"> / dia</span>
            </div>
            <p className="text-xs text-indigo-700/80 mt-1">
              {daysRemaining > 0
                ? `${daysRemaining} dias restantes até o fim do mês`
                : "Período concluído"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ABAS COM GRÁFICOS DETALHADOS */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="w-full">
          <TabsList className="bg-white border border-slate-200/80 p-1 w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="gap-1.5 py-2 text-xs">
              <BarChart2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="sm:hidden">Geral</span>
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="category" className="gap-1.5 py-2 text-xs">
              <PieIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="sm:hidden">Categorias</span>
              <span className="hidden sm:inline">Por Categoria</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 py-2 text-xs">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="sm:hidden">Histórico</span>
              <span className="hidden sm:inline">Histórico Multimeses</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Aba 1: Visão Geral */}
        <TabsContent value="overview">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Resumo Geral das Movimentações
              </CardTitle>
              <CardDescription>
                Entradas e saídas registradas no mês ativo ({formatMonthYear(selectedMonth)}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Conta Pessoal",
                        Receitas: monthTransactions
                          .filter((t) => t.type === "income" && t.payment_method !== "ticket")
                          .reduce((acc, t) => acc + Number(t.amount), 0),
                        Despesas: monthTransactions
                          .filter((t) => t.type === "expense" && t.payment_method !== "ticket")
                          .reduce((acc, t) => acc + Number(t.amount), 0),
                      },
                      {
                        name: "Carteira Ticket",
                        Receitas: ticketEntradas,
                        Despesas: ticketGastos,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis
                      stroke="#64748b"
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [formatCurrency(Number(val)), ""]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Receitas" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Despesas" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 2: Por Categoria */}
        <TabsContent value="category">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Detalhamento dos Gastos por Categoria
              </CardTitle>
              <CardDescription>Ranking completo de despesas por centro de custo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryExpenses.map((cat, idx) => {
                  const pct = totalDespesasMes > 0 ? Math.round((cat.amount / totalDespesasMes) * 100) : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-semibold text-slate-900">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(cat.amount)}</span>
                        <span className="text-xs text-slate-500 ml-2">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Histórico Multimeses */}
        <TabsContent value="history">
          <Card className="border-slate-200/80 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Evolução Temporal (Últimos Meses)
              </CardTitle>
              <CardDescription>Comparativo de Receitas vs Despesas ao longo do tempo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" tickFormatter={(val) => `R$ ${val}`} />
                    <Tooltip
                      formatter={(val: unknown) => [formatCurrency(Number(val)), ""]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Receitas" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Despesas" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
