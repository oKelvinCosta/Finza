# Finza — Documento de Design e Arquitetura do Sistema (DESIGN.md)

Este documento especifica a arquitetura técnica, stack de desenvolvimento, estrutura de diretórios e rotas, especificações de telas, schemas de dados (SQL e Zod) e as regras de cálculo e isolamento do **Finza**.

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Função / Detalhes |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router, TypeScript) | Server & Client Components, roteamento baseado em pastas, performance nativa. |
| **Estilização** | Tailwind CSS v4 | Estilização utilitária moderna, layout responsivo. |
| **Biblioteca de UI** | shadcn/ui | Componentes acessíveis com Radix UI (Dialog, Sheet, Table, Badge, Form, Popover, Progress, Tabs, AlertDialog, Chart). |
| **Ícones** | Lucide Icons (`lucide-react`) | Conjunto consistente e moderno de iconografia vetorial. |
| **Formulários & Validação** | React Hook Form + Zod | Validação em runtime de schemas com formulários performáticos e controlados. |
| **Client Cache / Fetching** | TanStack Query v5 | Gerenciamento de cache do cliente, queries atreladas a `[selectedMonth]`, mutações e invalidação automática. |
| **Estado Global da UI** | Zustand | Controle do mês ativo (`selectedMonth: YYYY-MM`) e estado de abertura/edição do Sheet/Modal Global de transação. |
| **Fase 1 (Mock)** | LocalStorage / Mock InMemory | Camada de serviço mockada simulando latência e persistência local tipada. |
| **Fase 2 (Backend)** | Supabase (PostgreSQL) | Banco relacional, Row Level Security (RLS), Edge Functions ou pg_cron para transações recorrentes. |

---

## 2. Estrutura de Diretórios e Rotas

```text
src/
├── app/
│   ├── layout.tsx                # Shell da aplicação: Sidebar/Navbar global, seletor YYYY-MM e botão Nova Transação
│   ├── page.tsx                  # 1. Home / Dashboard do Mês Ativo
│   ├── transactions/
│   │   └── page.tsx              # 2. Tabela Geral do Mês (Extrato interativo, toggle rápido, busca)
│   ├── budget/
│   │   └── page.tsx              # 3. Orçamento do Mês (Planejado vs Realizado, semáforo)
│   └── report/
│       └── page.tsx              # 4. Relatórios Inteligentes e Métricas (Charts, CSV)
├── components/
│   ├── ui/                       # Componentes primitivos do shadcn/ui (button, table, dialog, etc.)
│   ├── layout/
│   │   ├── app-sidebar.tsx       # Navegação lateral responsiva
│   │   ├── app-header.tsx        # Cabeçalho com mês ativo e ações rápidas
│   │   └── month-selector.tsx    # Controle de navegação do mês/ano (Zustand)
│   ├── transactions/
│   │   ├── transaction-modal.tsx # Modal / Sheet global unificado de criação/edição
│   │   ├── transaction-table.tsx # Tabela interativa com ações e toggle rápido
│   │   └── transaction-filters.tsx # Filtros rápidos (tipo, categoria, método, busca)
│   ├── budget/
│   │   ├── budget-card.tsx       # Cards de progresso semafórico por categoria
│   │   └── copy-budget-dialog.tsx# Diálogo de confirmação para clonar mês anterior
│   └── reports/
│       ├── metric-cards.tsx      # Maior gasto, média diária, ritmo do ticket
│       └── charts/               # Gráficos em Recharts / shadcn/ui/chart
├── hooks/
│   ├── use-transactions.ts       # Queries e mutations de transações via TanStack Query
│   ├── use-budgets.ts            # Queries e mutations de orçamentos mensais
│   └── use-categories.ts         # Query de categorias disponíveis
├── lib/
│   ├── utils.ts                  # Helpers de classes (cn) e formatação monetária (Intl BRL)
│   └── mock-data.ts              # Dataset inicial da Fase 1
├── stores/
│   ├── use-month-store.ts        # Gerenciamento do selectedMonth ('YYYY-MM')
│   └── use-modal-store.ts        # Controle de visibilidade e dados do Modal de Transação
└── types/
    └── index.ts                  # Contratos e tipos TypeScript globais
```

---

## 3. Especificação das Páginas

### 3.1. Shell Global (`src/app/layout.tsx`)
- **Desktop (>= 1024px)**:
  - Sidebar lateral (`src/components/layout/app-sidebar.tsx`) com logotipo, links de navegação (*Dashboard*, *Extrato*, *Orçamento*, *Relatórios*), MonthPicker global e botão de destaque "Nova Transação".
- **Mobile & Tablet (< 1024px)**:
  - Sidebar ocultado.
  - Header superior compacto com logotipo e MonthPicker global.
  - **Barra de Navegação Inferior Fixa (`src/components/layout/mobile-nav.tsx`)**:
    - 4 links principais igualmente espaçados (2 à esquerda: *Dashboard*, *Extrato*; 2 à direita: *Orçamento*, *Relatórios*).
    - Centro elevado com dois botões circulares flutuantes de alto contraste:
      - Botão `+` (Verde/Teal): abre modal com `defaultType: 'income'`.
      - Botão `-` (Vermelho/Rose): abre modal com `defaultType: 'expense'`.

---

### 3.2. Dashboard do Mês (`/`)
- **Cards da Carteira Pessoal (Conta Corrente)**:
  - **Entradas do Mês**: $\sum \text{Receitas (Pix, Crédito)}$
  - **Saídas do Mês**: $\sum \text{Despesas (Pix, Crédito)}$
  - **Saldo Restante do Mês**: $\text{Entradas} - \text{Saídas}$ (com destaque numérico e cor contextual).
- **Cards de Destaque da Carteira Ticket**:
  - **Recarga/Entradas de Ticket**: $\sum \text{Receitas (Ticket)}$
  - **Gastos de Ticket**: $\sum \text{Despesas (Ticket)}$
  - **Saldo Restante de Ticket**: $\text{Entradas Ticket} - \text{Gastos Ticket}$
- **Card Consumo do Orçamento Geral**:
  - Barra de progresso geral de $\frac{\text{Total Despesas Realizadas (sem Ticket)}}{\text{Teto Orçado Total}} \times 100$.
  - **Regra:** Transações de `Ticket` são estritamente excluídas do cálculo de consumo de orçamento.
- **Gráficos Rápidos**:
  - Gráfico de pizza / rosca via `shadcn/ui/chart` distribuindo **exclusivamente as despesas da Conta Pessoal** por categoria (somando exatamente o valor de 'Realizado no Mês'). O método Ticket não entra no gráfico e não gera agrupamento em 'Outros'.

---

### 3.3. Tabela Geral do Mês / Extrato (`/transactions`)
- **Barra de Ferramentas / Filtros**:
  - Input de busca textual em tempo real por descrição.
  - Select de Tipo (Todos, Receita, Despesa).
  - Select de Categorias.
  - Select de Método de Pagamento (`Crédito`, `Pix`, `Ticket`).
  - Select de Ordenação: "Mais recentes primeiro (Padrão)", "Mais antigas primeiro", "Maior valor", "Menor valor".
- **Visualização e Agrupamento**:
  - **Agrupamento Semanal (Padrão ao ordenar por data)**: Agrupa linhas em blocos de semana (segunda a domingo). Cada bloco tem um cabeçalho resumindo: período da semana e totais de gastos segregados (`Total: R$ X,XX • Ticket: R$ Y,YY`).
  - **Ranking Corrido (ao ordenar por valor)**: Lista todas as transações do mês do maior para o menor (ou vice-versa) em lista única.
- **Tabela de Dados (shadcn/ui `Table`)**:
  - **Data**: Formatada em `DD/MM/YYYY`.
  - **Descrição**: Texto com destaque visual.
  - **Categoria**: Nome da categoria com dot colorido. Para transações com método `Ticket`, exibe um traço neutro (`—`).
  - **Método**: Badge estilizado (Crédito, Pix, Ticket).
  - **Valor**: Formatado em BRL (`R$ 0,00`), verde para receitas e vermelho para despesas.
  - **Status (Toggle Rápido)**: 1 clique na célula alterna `Pago` $\leftrightarrow$ `Pendente` (executa mutação otimista).
  - **Menu de Ações (`DropdownMenu`)**:
    - *Editar*: Preenche o formulário do modal global com a transação selecionada.
    - *Duplicar*: Cria um novo rascunho baseado na transação.
    - *Excluir*: Dispara diálogo de confirmação via `AlertDialog`.

---

### 3.4. Modal Global de Transação (Sheet / Dialog)
- **Tipo de Registro**: Tabs estilizadas `[ Despesa | Receita ]`.
- **Valor**: Input com máscara monetária BRL.
- **Descrição**: Input de texto curto.
- **Data**: Datepicker pré-selecionado na data atual.
- **Forma de Pagamento / Destino (Dinâmico por Tipo)**:
  - **Aba Despesa**: Rótulo "Forma de Pagamento" com botões `[ Crédito (Default) | Pix | Ticket ]`.
  - **Aba Receita**: Rótulo "Destino" com botões `[ Conta Pessoal (Default, armazenado como 'pix') | Ticket ]`. A opção "Crédito" é omitida em receitas.
- **Categoria (Condicional)**:
  - Se `payment_method === 'ticket'`: o campo de categoria é **completamente ocultado** e o valor gravado é `null`.
  - Se `payment_method !== 'ticket'`: dropdown dinâmico com seleção obrigatória de categoria.
- **Opções Avançadas (Acordeão / Colapsável)**:
  - Botão gatilho: "Opções avançadas" com ícone de Chevron.
  - Conteúdo recolhido:
    - **Status da Transação**: Switch "Transação já realizada" (`is_paid`, default `true`).
    - **Recorrência**: Switch "Despesa/Receita Recorrente" (`is_recurring`, default `false`).
    - **Observações**: Input de texto opcional.
  - *Comportamento*: Inicia recolhido ao criar nova transação; expande automaticamente na edição caso a transação seja pendente, recorrente ou tenha observações.
- **Ação de Salvar**: Validação com Zod, mutação assíncrona, toast de sucesso e `queryClient.invalidateQueries`.

---

### 3.5. Orçamento do Mês (`/budget`)
- **Ações de Topo**:
  - Indicador do mês ativo.
  - Botão de ação rápida: `"Copiar do Mês Anterior"` com diálogo (`copy-budget-dialog.tsx`) oferecendo:
    1. *Sobrescrever tudo*: Clona integralmente o orçamento do mês anterior, substituindo os valores existentes.
    2. *Preencher apenas vazias*: Clona somente as metas de categorias que ainda não foram preenchidas no mês ativo.
- **Grade / Tabela de Categorias**:
  - Lista todas as categorias de despesa disponíveis.
  - Input editável em linha ou em card para o valor planejado (`target_amount`).
  - Barra de progresso semafórica com graduação percentual:
    - **Verde**: `< 75%`
    - **Amarelo**: `75% - 100%`
    - **Vermelho**: `> 100%` (orçamento excedido).
  - Comparativo: Valor Orçado vs Valor Realizado vs Saldo Restante da Categoria.

---

### 3.6. Relatório Inteligente (`/report`)
- **Tabs de Visualização**:
  1. `Visão Geral`
  2. `Por Categoria`
  3. `Histórico Multimeses`
- **Métricas em Destaque**:
  - **Maior Categoria**: Categoria que acumulou maior volume de gastos no mês.
  - **Média Diária**: Total de gastos dividido pelos dias decorridos do mês.
  - **Ritmo de Ticket**: Saldo restante de Ticket dividido pelos dias restantes do mês.
- **Gráficos**:
  - Histórico de 3 a 6 meses: Gráfico de barras comparando Entradas vs Saídas.
  - Composição de Despesas: Gráfico de rosca/radar.
- **Exportação**:
  - Botão "Exportar CSV" que gera arquivo do extrato do mês ativo.
  - Estilos de `@media print` para salvar relatório em PDF.

---

## 4. Schemas de Dados

### 4.1. TypeScript Contracts (`src/types/index.ts`)

```typescript
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'credito' | 'pix' | 'ticket';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  category?: Category | null;
  date: string; // ISO date 'YYYY-MM-DD'
  payment_method: PaymentMethod;
  is_paid: boolean;
  is_recurring: boolean;
  notes?: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  category?: Category;
  month_year: string; // 'YYYY-MM'
  target_amount: number;
  created_at: string;
}

export interface MonthSummary {
  personal: {
    income: number;
    expense: number;
    balance: number;
  };
  ticket: {
    income: number;
    expense: number;
    balance: number;
  };
  totalBudgeted: number;
  totalActual: number;
}
```

---

### 4.2. Schema de Validação Zod (`src/lib/validations/transaction.ts`)

```typescript
import { z } from "zod";

export const transactionFormSchema = z
  .object({
    description: z.string().min(2, "A descrição deve ter pelo menos 2 caracteres"),
    amount: z.coerce.number().positive("O valor deve ser maior que zero"),
    type: z.enum(["income", "expense"], {
      required_error: "Selecione o tipo da transação",
    }),
    category_id: z.string().optional().nullable(),
    date: z.string().min(1, "Selecione uma data"),
    payment_method: z.enum(["credito", "pix", "ticket"], {
      required_error: "Selecione a forma de pagamento",
    }),
    is_paid: z.boolean().default(true),
    is_recurring: z.boolean().default(false),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Se não for Ticket, categoria é obrigatória
    if (data.payment_method !== "ticket" && (!data.category_id || data.category_id.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione uma categoria válida",
        path: ["category_id"],
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const budgetFormSchema = z.object({
  category_id: z.string().min(1, "Categoria obrigatória"),
  month_year: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido (YYYY-MM)"),
  target_amount: z.coerce.number().min(0, "O teto de gastos não pode ser negativo"),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
```

---

### 4.3. Schema SQL no Supabase (PostgreSQL)

```sql
-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#64748b',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Transações (category_id é NULLABLE para suportar Ticket)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'credito' CHECK (payment_method IN ('credito', 'pix', 'ticket')),
  is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Orçamentos Mensais
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
  target_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, month_year)
);

-- Índices de Performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX idx_budgets_month_year ON budgets(month_year);
```

### 4.4. Categorias Padrão Pré-Cadastradas (Fase 1)

As seguintes categorias compõem o seed inicial de dados da aplicação:
- **Despesas**:
  - `Alimentação` (Mercado, delivery e refeições pessoais, cor Amber `#f59e0b`)
  - `Lazer` (Cor Slate/Teal suave `#0d9488`)
  - `Dev. Pessoal` (Cor Slate/Indigo `#6366f1`)
  - `Transporte` (Cor Slate/Amber `#eab308`)
  - `Despesas` (Despesas gerais / fixas, cor Slate `#64748b`)
  - `Oferta` (Doações/ofertas, cor Teal `#14b8a6`)
  - `Dízimo` (Contribuição, cor Teal `#0f766e`)
  - `Viagem` (Férias/deslocamento, cor Sky/Rose `#f43f5e`)
- **Receitas**:
  - `Salário` (Renda principal, cor Teal `#0d9488`)
  - `Renda Extra` (Freelances/investimentos, cor Emerald `#10b981`)

*(Nota: Ticket não é uma categoria; é exclusivamente uma forma de pagamento/carteira independente).*

---

## 5. Lógica de Negócio e Isolamento de Saldos

### 5.1. Regras de Isolamento Mensal
1. **Sem Rolagem**: O saldo não é transportado entre os meses. Todas as consultas agregam exclusivamente pelo predicado `date >= 'YYYY-MM-01' AND date <= 'YYYY-MM-LastDay'`.
2. **Impacto de Pendências**:
   - `is_paid = false` representa compromissos previstos.
   - Tanto despesas pagas quanto pendentes entram no cômputo de `totalDespesas` do mês, garantindo que o saldo restante reflita o saldo real já abatido dos compromissos assumidos.

### 5.2. Código Canônico de Agregação por Carteira

```typescript
// Filtros por Carteira
const personalTransactions = transactions.filter(t => t.payment_method !== 'ticket');
const ticketTransactions = transactions.filter(t => t.payment_method === 'ticket');

// 1. Saldo Pessoal (Crédito / Pix)
const totalReceitas = personalTransactions
  .filter(t => t.type === 'income')
  .reduce((acc, t) => acc + Number(t.amount), 0);

const totalDespesas = personalTransactions
  .filter(t => t.type === 'expense')
  .reduce((acc, t) => acc + Number(t.amount), 0);

const saldoLivre = totalReceitas - totalDespesas;

// 2. Saldo da Carteira Ticket
const ticketEntradas = ticketTransactions
  .filter(t => t.type === 'income')
  .reduce((acc, t) => acc + Number(t.amount), 0);

const ticketGastos = ticketTransactions
  .filter(t => t.type === 'expense')
  .reduce((acc, t) => acc + Number(t.amount), 0);

const saldoRestanteTicket = ticketEntradas - ticketGastos;

// 3. Orçamento e Gráficos de Categorias (Desacoplamento Estrito de Ticket)
const totalRealizadoOrcamento = personalTransactions
  .filter(t => t.type === 'expense')
  .reduce((acc, t) => acc + Number(t.amount), 0);

const despesasPorCategoria = personalTransactions
  .filter(t => t.type === 'expense' && Boolean(t.category_id));
// Nota: Movimentações via Ticket NUNCA entram no consumo do orçamento nem no gráfico de categorias.
```

### 5.3. Automação de Transações Recorrentes (Virada de Mês)
1. **Regra de Replicação**:
   - Transações com `is_recurring = true` no mês anterior são identificadas e replicadas para o novo mês.
   - Toda transação replicada nasce com `is_paid = false` (pendente no novo mês) e preserva `is_recurring = true`.
   - Se `payment_method === 'ticket'`, garante-se `category_id = null` mantendo o isolamento de Ticket.
2. **Idempotência e Desduplicação Segura**:
   - Para evitar duplicatas e não depender de alterações rígidas no schema remoto do Supabase, a verificação no mês alvo utiliza a assinatura única da movimentação: `(user_id, description, amount, type, payment_method, mes_alvo)`.
3. **Mecanismos de Disparo**:
   - **pg_cron**: Agendado para as 00:05 UTC do 1º dia de cada mês no PostgreSQL.
   - **Edge Function & API Route**: Disponíveis para chamadas via webhook ou Vercel Cron.
   - **Navegação Transparente**: Hook `useTransactions(selectedMonth)` executa a checagem e replicação em background no carregamento do mês, garantindo visualização imediata sem intervenção manual.

---

## 6. Sistema de Design e Identidade Visual

- **Paleta de Cores (Diretriz Estrita)**:
  - **Tons Neutros Principais**: Cores sóbrias da paleta **Slate** do Tailwind (`slate-50`, `slate-100`, `slate-200`, `slate-700`, `slate-900`).
  - **Superfícies**: Fundo geral em `bg-slate-50`, cards e modais em branco puro (`#ffffff`) com bordas sutis `border-slate-200` e sombras suaves `shadow-sm`.
  - **Receitas (Income) & Positivos**: Família **Teal** (`teal-50` para fundos suaves, `teal-700` para textos, `teal-500`/`teal-600` para destaques e gráficos).
  - **Despesas (Expense) & Alertas**: Família **Rose** (`rose-50` para fundos suaves, `rose-700` para textos, `rose-500`/`rose-600` para destaques e indicadores de estouro).
  - **Carteira Ticket**: Destaque sobrio e elegante em **orange / Indigo** suave (`orange-50 text-orange-700 border-orange-200`).
- **Semáforo do Orçamento**:
  - `< 75%`: Família **Teal** (`bg-teal-500`)
  - `75% - 100%`: Âmbar / Amarelo suave (`bg-amber-500`)
  - `> 100%`: Família **Rose** (`bg-rose-500`, orçamento excedido)
- **Badges de Pagamento e Status**:
  - `credito` e `pix`: Badges neutros em `slate-100` com texto `slate-700`.
  - `ticket`: Badge temático `orange-50` / `orange-700`.
  - `is_paid = true`: Badge sutil em `teal-50` / `teal-700` ("Pago").
  - `is_paid = false`: Badge sutil em `amber-50` / `amber-700` ("Pendente").
