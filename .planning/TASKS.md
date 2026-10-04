# Finza — Tarefas Atômicas de Implementação (TASKS.md)

Este documento decompõe o desenvolvimento do **Finza** em tarefas atômicas sequenciais, testáveis e verificáveis, divididas entre **Fase 1 (Frontend & Mock Local)** e **Fase 2 (Backend Supabase & Sincronização)**.

---

## Legenda de Status
- `[ ]` Tarefa pendente
- `[/]` Tarefa em andamento
- `[x]` Tarefa concluída

---

## FASE 1: Frontend, Arquitetura & Interface Mockada (Prioridade Imediata)

### 1.1. Inicialização do Projeto e Design System
- [x] **TASK-01: Setup do Projeto Next.js & TypeScript**
  - Inicializar Next.js 14+ com App Router, TypeScript estrito e ESLint.
  - Configurar estrutura de pastas em `src/` (`app/`, `components/`, `hooks/`, `lib/`, `stores/`, `types/`).
  - *Critério de Aceite:* Projeto compila com `npm run build` e roda dev server local.

- [x] **TASK-02: Configuração do Tailwind CSS v4 & Base de Estilos**
  - Instalar e configurar Tailwind CSS v4 com variáveis CSS limpas para tema Light mode nativo.
  - Configurar tipografia moderna (Inter ou Outfit) e paleta neutra Slate/Zinc de alto contraste.
  - *Critério de Aceite:* Classes utilitárias funcionam perfeitamente no tema Light.

- [x] **TASK-03: Instalação e Setup dos Primitivos shadcn/ui**
  - Instalar componentes base: `button`, `card`, `dialog`, `sheet`, `table`, `badge`, `form`, `input`, `select`, `popover`, `calendar`, `progress`, `tabs`, `alert-dialog`, `dropdown-menu`, `toast` (`sonner`).
  - Instalar `lucide-react` para iconografia unificada.
  - *Critério de Aceite:* Primitivos renderizam sem erros de hidratação ou estilos quebrados.

---

### 1.2. Tipagem, Schemas & Estado Global
- [x] **TASK-04: Definição dos Contratos TypeScript (`src/types/index.ts`)**
  - Criar tipos estritos: `Transaction`, `Category`, `Budget`, `PaymentMethod`, `TransactionType`, `MonthSummary`.
  - *Critério de Aceite:* Nenhuma tipagem `any` permitida; exportações prontas para consumo.

- [x] **TASK-05: Schemas de Validação Zod (`src/lib/validations/`)**
  - Implementar `transactionFormSchema` com validações de descrição, valor positivo, formato de data, métodos (`credito`, `pix`, `ticket`) e status.
  - Implementar `budgetFormSchema` com validação de valor monetário e formato `YYYY-MM`.
  - *Critério de Aceite:* Testar validação com valores inválidos e mensagens de erro amigáveis em português.

- [x] **TASK-06: Store Global Zustand para Navegação Mensal (`useMonthStore`)**
  - Criar store para gerenciar `selectedMonth` no formato `YYYY-MM` (iniciando com o mês atual).
  - Adicionar ações `setMonth`, `nextMonth`, `previousMonth`.
  - *Critério de Aceite:* Troca de mês atualiza reativamente qualquer componente inscrito.

- [x] **TASK-07: Store Global Zustand para Modal de Transação (`useModalStore`)**
  - Criar store para controlar estado de abertura (`isOpen`), modo (`create` ou `edit`), e payload inicial de transação.
  - *Critério de Aceite:* Capacidade de abrir o modal de qualquer ponto da aplicação passando ou não dados para edição.

---

### 1.3. Mock Data & Camada de Serviços (TanStack Query)
- [x] **TASK-08: Setup do TanStack Query Client (`QueryClientProvider`)**
  - Configurar provedor no root layout com políticas de cache adequadas (`staleTime: 5 min`).
  - *Critério de Aceite:* Hooks `useQuery` e `useMutation` funcionais no ambiente cliente.

- [x] **TASK-09: Dataset Mock Realista e Persistência LocalStorage (`src/lib/mock-data.ts`)**
  - Implementar seed de categorias padrão: *Lazer*, *Dev. Pessoal*, *Transporte*, *Despesas*, *Ticket*, *Oferta*, *Dízimo*, *Viagem*, *Salário*, *Renda Extra*, *Benefício Ticket*.
  - Criar transações de exemplo cobrindo Pix, Crédito e Ticket para múltiplos meses (com estados pago e pendente).
  - Criar orçamentos mockados para testar faixas semafóricas (<75%, 75-100%, >100%).
  - Implementar persistência em LocalStorage para que novos lançamentos e edições persistam entre reloads.
  - *Critério de Aceite:* Dados mockados realistas cobrem todos os cenários da regra de negócio com as categorias oficiais.

- [x] **TASK-10: Custom Hooks de Dados com TanStack Query**
  - `useTransactions(monthYear)`: lista transações filtradas pelo mês selecionado.
  - `useCreateTransaction()`: adiciona transação e invalida queries.
  - `useUpdateTransaction()`: atualiza transação (incluindo toggle rápido de `is_paid`).
  - `useDeleteTransaction()`: remove transação e invalida queries.
  - `useBudgets(monthYear)` e `useCopyBudgetFromPreviousMonth()`: gerencia orçamentos do mês.
  - `useCategories()`: busca categorias disponíveis.
  - *Critério de Aceite:* Operações refletem instantaneamente no estado local.

---

### 1.4. Construção dos Componentes e Telas

- [ ] **TASK-11: Layout Global Shell (`src/app/layout.tsx`)**
  - Desenvolver Sidebar/Navbar com navegação limpa entre as páginas (`/`, `/transactions`, `/budget`, `/report`).
  - Integrar seletor global de Mês/Ano com botões prev/next e popover de seleção.
  - Inserir botão de destaque "Nova Transação" que dispara o Sheet/Modal Global.
  - *Critério de Aceite:* Barra fixa ou responsiva permitindo alternar rotas e meses de forma fluida.

- [ ] **TASK-12: Modal / Sheet Global de Cadastro e Edição de Transação**
  - Construir formulário controlado com `react-hook-form` integrado ao `transactionFormSchema`.
  - Alternador de abas: `Despesa` (padrão) vs `Receita`.
  - Input monetário em BRL (`R$`).
  - Datepicker popover iniciando no dia corrente.
  - Dropdown dinâmico de categorias.
  - Botões de seleção rápida do método de pagamento: `[ Crédito | Pix | Ticket ]`.
  - Switches para "Transação já realizada" (`is_paid`) e "Recorrente" (`is_recurring`).
  - Campo de observações.
  - *Critério de Aceite:* Submissão válida adiciona a transação, fecha o modal, emite Toast e invalida o cache.

- [ ] **TASK-13: Tela Dashboard do Mês (`src/app/page.tsx`)**
  - Implementar bloco **Carteira Pessoal (Conta Corrente)**:
    - Card Entradas (Pix + Crédito).
    - Card Saídas (Pix + Crédito).
    - Card Saldo Restante (Entradas - Saídas).
  - Implementar bloco **Carteira Ticket**:
    - Card Recarga/Entradas de Ticket.
    - Card Gastos de Ticket.
    - Card Saldo Restante de Ticket.
  - Implementar card de **Consumo Geral do Orçamento** (barra de progresso).
  - Implementar gráfico rápido de distribuição de despesas por categoria via `shadcn/ui/chart`.
  - *Critério de Aceite:* Os cálculos de isolamento de saldos batem 100% com a regra canônica.

- [ ] **TASK-14: Tela Tabela Geral / Extrato do Mês (`src/app/transactions/page.tsx`)**
  - Construir tabela completa das transações do mês ativo.
  - Implementar toggle rápido de status (`Pago` $\leftrightarrow$ `Pendente`) com 1 clique direto na célula.
  - Implementar menu de ações por linha com `DropdownMenu` (Editar, Duplicar, Excluir).
  - Adicionar diálogo de confirmação via `AlertDialog` para exclusão.
  - Implementar barra de filtros: busca textual por descrição, filtro por tipo (Receita/Despesa), filtro por categoria e por método (`Crédito`, `Pix`, `Ticket`).
  - Badges visuais coloridos para status, tipo e método.
  - *Critério de Aceite:* Filtros e buscas funcionam instantaneamente; ações de toggle e exclusão atualizam a tabela.

- [ ] **TASK-15: Tela de Orçamento do Mês (`src/app/budget/page.tsx`)**
  - Listar todas as categorias de despesa disponíveis.
  - Campo editável de valor planejado (`target_amount`) por categoria.
  - Diálogo de ação "Copiar do Mês Anterior" com duas opções:
    - *Sobrescrever tudo*: clona todas as metas substituindo o mês atual.
    - *Preencher apenas vazias*: clona apenas categorias que ainda não possuem teto definido.
  - Barra de progresso semafórica por categoria:
    - Família Teal: `< 75%`
    - Amarelo/Âmbar: `75% - 100%`
    - Família Rose: `> 100%` (estourado)
  - Comparativo visual: Orçado vs Realizado vs Saldo Disponível.
  - *Critério de Aceite:* Atualização de orçamentos e as duas opções de cópia do mês anterior funcionam sem erros.

- [ ] **TASK-16: Tela de Relatórios e Métricas (`src/app/report/page.tsx`)**
  - Abas: `Visão Geral`, `Por Categoria`, `Histórico Multimeses`.
  - Métricas inteligentes calculadas automaticamente:
    - Categoria onde mais gastou no mês.
    - Média diária de gastos no mês.
    - Ritmo de consumo diário do saldo de Ticket até o fim do mês.
  - Gráficos visuais (barras empilhadas de evolução temporal de 3 a 6 meses, gráfico de rosca de categorias).
  - Botão "Exportar CSV" que gera download dos dados do mês ativo.
  - Estilização para impressão em PDF limpo.
  - *Critério de Aceite:* Gráficos renderizam corretamente e exportação CSV gera arquivo formatado.

- [ ] **TASK-17: Validação e Polimento Geral da Fase 1**
  - Verificar responsividade (desktop, tablet, mobile).
  - Validar todos os fluxos de navegação sem quebras ou travamentos de hidratação.
  - Garantir consistência estética refinada no padrão Light.
  - *Critério de Aceite:* Aplicação mockada 100% funcional e pronta para homologação de UX.

---

## FASE 2: Backend Supabase, Banco de Dados & Sincronização

- [ ] **TASK-18: Criação e Configuração do Projeto Supabase**
  - Configurar variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - Instalar `@supabase/supabase-js` e `@supabase/ssr`.
  - *Critério de Aceite:* Conexão bem-sucedida com o Supabase.

- [ ] **TASK-19: Execução dos Scripts SQL DDL e Índices no Supabase**
  - Rodar migrations para criação das tabelas `categories`, `transactions` e `budgets`.
  - Criar índices: `idx_transactions_date`, `idx_transactions_payment_method`, `idx_budgets_month_year`.
  - Inserir seeds iniciais de categorias.
  - *Critério de Aceite:* Tabelas e restrições criadas e validadas no console do Supabase.

- [ ] **TASK-20: Autenticação Simples & Row Level Security (RLS)**
  - Adicionar suporte a autenticação de usuário (login simplificado / Supabase Auth).
  - Adicionar coluna `user_id` nas tabelas com políticas RLS restritas ao usuário logado.
  - *Critério de Aceite:* Usuário só enxerga e manipula suas próprias transações e orçamentos.

- [ ] **TASK-21: Substituição da Camada de Serviços para Supabase**
  - Adaptar os hooks do TanStack Query (`useTransactions`, `useCreateTransaction`, `useBudgets`, etc.) para consultar a API do Supabase ao invés de dados mockados.
  - *Critério de Aceite:* Todas as operações de CRUD refletem diretamente no banco de dados PostgreSQL.

- [ ] **TASK-22: Automação de Transações Recorrentes (Virada de Mês)**
  - Implementar Edge Function ou job `pg_cron` no Supabase para identificar registros com `is_recurring = true` no último mês e replicá-los automaticamente no novo mês com `is_paid = false`.
  - *Critério de Aceite:* Transações recorrentes aparecem no novo mês sem intervenção manual.
