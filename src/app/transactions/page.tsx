"use client";

import { useState, useMemo } from "react";
import { useMonthStore } from "@/stores/use-month-store";
import {
  useTransactions,
  useToggleTransactionPaid,
  useDeleteTransaction,
  useCreateTransaction,
} from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { useModalStore } from "@/stores/use-modal-store";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils";
import { Transaction } from "@/types";
import { toast } from "sonner";

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  FilterX,
  Calendar,
  Layers,
} from "lucide-react";

type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

interface WeekGroup {
  weekKey: string;
  label: string;
  transactions: Transaction[];
  personalTotal: number;
  ticketTotal: number;
}

// Helper para calcular início (segunda-feira) e fim (domingo) da semana de uma data
function getWeekRange(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0 é domingo, 1 é segunda
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShort = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

  const mondayIso = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

  return {
    mondayIso,
    label: `Semana ${formatShort(monday)} a ${formatShort(sunday)}`,
  };
}

export default function TransactionsPage() {
  const { selectedMonth } = useMonthStore();
  const { openModal } = useModalStore();
  const { data: transactions = [], isLoading } = useTransactions(selectedMonth);
  const { data: categories = [] } = useCategories();

  const togglePaid = useToggleTransactionPaid();
  const deleteTx = useDeleteTransaction();
  const createTx = useCreateTransaction();

  // Estados de Filtro e Ordenação
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");

  // Estado para exclusão com confirmação
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Filtragem e Ordenação dos dados
  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter((tx) => {
      // Busca textual
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(query);
        const matchCat = tx.category?.name.toLowerCase().includes(query);
        if (!matchDesc && !matchCat) return false;
      }

      // Tipo
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;

      // Categoria (para transações de Ticket sem categoria, só exibe se o filtro for 'all')
      if (categoryFilter !== "all" && tx.category_id !== categoryFilter) return false;

      // Método de Pagamento
      if (paymentFilter !== "all" && tx.payment_method !== paymentFilter) return false;

      return true;
    });

    // Ordenação
    return [...filtered].sort((a, b) => {
      if (sortBy === "date_desc") {
        return b.date.localeCompare(a.date);
      }
      if (sortBy === "date_asc") {
        return a.date.localeCompare(b.date);
      }
      if (sortBy === "amount_desc") {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === "amount_asc") {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });
  }, [transactions, search, typeFilter, categoryFilter, paymentFilter, sortBy]);

  // Agrupamento por Semanas (ativo quando ordenado por Data)
  const isWeeklyGrouped = sortBy === "date_desc" || sortBy === "date_asc";

  const weekGroups = useMemo<WeekGroup[]>(() => {
    if (!isWeeklyGrouped) return [];

    const map = new Map<string, WeekGroup>();

    filteredAndSortedTransactions.forEach((tx) => {
      const { mondayIso, label } = getWeekRange(tx.date);

      if (!map.has(mondayIso)) {
        map.set(mondayIso, {
          weekKey: mondayIso,
          label,
          transactions: [],
          personalTotal: 0,
          ticketTotal: 0,
        });
      }

      const group = map.get(mondayIso)!;
      group.transactions.push(tx);

      if (tx.type === "expense") {
        if (tx.payment_method === "ticket") {
          group.ticketTotal += Number(tx.amount);
        } else {
          group.personalTotal += Number(tx.amount);
        }
      }
    });

    // Ordena os grupos pela data da segunda-feira
    const groups = Array.from(map.values());
    if (sortBy === "date_desc") {
      groups.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
    } else {
      groups.sort((a, b) => a.weekKey.localeCompare(b.weekKey));
    }

    return groups;
  }, [filteredAndSortedTransactions, isWeeklyGrouped, sortBy]);

  // Ação de Toggle Rápido de Status (Pago <-> Pendente)
  const handleTogglePaid = async (tx: Transaction) => {
    try {
      await togglePaid.mutateAsync({ id: tx.id, is_paid: !tx.is_paid });
      toast.success(
        !tx.is_paid ? "Transação marcada como paga!" : "Transação marcada como pendente!"
      );
    } catch {
      toast.error("Erro ao alterar status da transação.");
    }
  };

  // Ação de Duplicar
  const handleDuplicate = async (tx: Transaction) => {
    try {
      await createTx.mutateAsync({
        description: `${tx.description} (Cópia)`,
        amount: tx.amount,
        type: tx.type,
        category_id: tx.category_id,
        date: tx.date,
        payment_method: tx.payment_method,
        is_paid: tx.is_paid,
        is_recurring: false,
        notes: tx.notes || null,
      });
      toast.success("Transação duplicada com sucesso!");
    } catch {
      toast.error("Erro ao duplicar transação.");
    }
  };

  // Ação de Confirmar Exclusão
  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    try {
      await deleteTx.mutateAsync(txToDelete.id);
      toast.success("Transação excluída com sucesso!");
      setTxToDelete(null);
    } catch {
      toast.error("Erro ao excluir transação.");
    }
  };

  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    paymentFilter !== "all" ||
    sortBy !== "date_desc";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setPaymentFilter("all");
    setSortBy("date_desc");
  };

  // Renderizador de linha individual de transação
  const renderTransactionRow = (tx: Transaction) => (
    <TableRow key={tx.id} className="group hover:bg-slate-50/70 transition-colors">
      {/* Data */}
      <TableCell className="font-medium text-slate-600 whitespace-nowrap text-xs">
        {formatDate(tx.date)}
      </TableCell>

      {/* Descrição */}
      <TableCell>
        <div className="font-semibold text-slate-900 text-sm">{tx.description}</div>
        {tx.notes && (
          <p className="text-xs text-slate-400 truncate max-w-xs">{tx.notes}</p>
        )}
      </TableCell>

      {/* Categoria (traço para Ticket) */}
      <TableCell>
        {tx.payment_method === "ticket" ? (
          <span className="text-slate-400 font-medium text-sm" title="Ticket não possui categoria vinculada">
            —
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: tx.category?.color || "#94a3b8" }}
            />
            <span className="text-sm font-medium text-slate-700">
              {tx.category?.name || "Sem categoria"}
            </span>
          </div>
        )}
      </TableCell>

      {/* Forma de Pagamento */}
      <TableCell>
        <Badge
          variant={tx.payment_method === "ticket" ? "ticket" : "secondary"}
          className="capitalize text-xs font-medium"
        >
          {tx.payment_method}
        </Badge>
      </TableCell>

      {/* Toggle Rápido de Status (1 clique) */}
      <TableCell>
        <button
          type="button"
          onClick={() => handleTogglePaid(tx)}
          title="Clique para alternar entre Pago e Pendente"
          className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
        >
          <Badge variant={tx.is_paid ? "paid" : "pending"} className="gap-1 cursor-pointer">
            {tx.is_paid ? (
              <CheckCircle2 className="h-3 w-3 text-teal-600" />
            ) : (
              <Clock className="h-3 w-3 text-amber-600" />
            )}
            <span>{tx.is_paid ? "Pago" : "Pendente"}</span>
          </Badge>
        </button>
      </TableCell>

      {/* Valor */}
      <TableCell className="text-right whitespace-nowrap font-bold text-sm">
        <span
          className={
            tx.type === "income" ? "text-teal-700" : "text-rose-700"
          }
        >
          {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
        </span>
      </TableCell>

      {/* Menu de Ações (Dropdown) */}
      <TableCell className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => openModal({ transaction: tx })}
              className="gap-2 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDuplicate(tx)}
              className="gap-2 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicar</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTxToDelete(tx)}
              className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Topo da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Extrato de {formatMonthYear(selectedMonth)}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerenciamento completo das movimentações com agrupamento semanal e ordenação dinâmica.
          </p>
        </div>

        <Button
          onClick={() => openModal()}
          className="hidden lg:flex bg-slate-900 text-white hover:bg-slate-800 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Transação
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Busca textual */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50"
            />
          </div>

          {/* Filtro por Tipo */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-slate-50/50">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por Categoria */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-slate-50/50">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por Método */}
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="bg-slate-50/50">
              <SelectValue placeholder="Forma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Formas</SelectItem>
              <SelectItem value="credito">Crédito</SelectItem>
              <SelectItem value="pix">Pix</SelectItem>
              <SelectItem value="ticket">Ticket</SelectItem>
            </SelectContent>
          </Select>

          {/* Seletor de Ordenação */}
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
            <SelectTrigger className="bg-slate-50/50">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <SelectValue placeholder="Ordenar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Mais recentes (Padrão)</SelectItem>
              <SelectItem value="date_asc">Mais antigas primeiro</SelectItem>
              <SelectItem value="amount_desc">Maior valor</SelectItem>
              <SelectItem value="amount_asc">Menor valor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Barra Informativa de Filtro / Status de Ordenação */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>
              Exibindo <strong>{filteredAndSortedTransactions.length}</strong> de{" "}
              <strong>{transactions.length}</strong> transações
            </span>
            {!isWeeklyGrouped && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                <Layers className="h-3 w-3" />
                Ranking corrido por valor
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isWeeklyGrouped && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy("date_desc")}
                className="h-7 text-xs text-slate-700 gap-1 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" />
                Ver agrupado por semanas
              </Button>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-slate-600 hover:text-slate-900 gap-1.5 cursor-pointer"
              >
                <FilterX className="h-3.5 w-3.5" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Carregando transações do mês...
          </div>
        ) : filteredAndSortedTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 font-medium text-base">
              Nenhuma transação encontrada.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Tente ajustar os filtros acima para visualizar seus registros."
                : "Clique no botão '+' ou 'Nova Transação' para registrar a primeira movimentação deste mês."}
            </p>
          </div>
        ) : isWeeklyGrouped ? (
          /* Visão Agrupada por Semanas (Segunda a Domingo) */
          <div className="divide-y divide-slate-200">
            {weekGroups.map((group) => (
              <div key={group.weekKey} className="overflow-x-auto">
                {/* Cabeçalho da Semana com Totais Segregados */}
                <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span className="font-bold text-slate-800 text-sm">{group.label}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({group.transactions.length}{" "}
                      {group.transactions.length === 1 ? "lançamento" : "lançamentos"})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-700 font-medium">
                      Gasto pessoal:{" "}
                      <strong className="text-slate-900 font-semibold">
                        {formatCurrency(group.personalTotal)}
                      </strong>
                    </span>

                    {group.ticketTotal > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                        Ticket: {formatCurrency(group.ticketTotal)}
                      </span>
                    )}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 text-[11px] uppercase tracking-wider text-slate-500">
                      <TableHead className="w-[120px]">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Forma</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[60px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.transactions.map((tx) => renderTransactionRow(tx))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        ) : (
          /* Visão em Ranking Corrido (quando ordenado por Maior/Menor Valor) */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500">
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[60px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTransactions.map((tx) => renderTransactionRow(tx))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Diálogo de Confirmação de Exclusão (AlertDialog) */}
      <AlertDialog
        open={Boolean(txToDelete)}
        onOpenChange={(open) => !open && setTxToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar a transação{" "}
              <strong>&ldquo;{txToDelete?.description}&rdquo;</strong> de{" "}
              <strong>{txToDelete ? formatCurrency(txToDelete.amount) : ""}</strong>?
              Esta ação removerá o registro e atualizará os saldos do mês.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
