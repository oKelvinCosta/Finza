# Finza — Especificação de Requisitos (REQUIREMENTS.md)

Este documento centraliza todas as regras de negócio, premissas de cálculo, requisitos funcionais (RF) e requisitos não-funcionais (RNF) do **Finza**, adaptados diretamente do briefing do produto no formato Spec-Driven Development (SDD).

---

## 1. Visão Geral do Produto

- **Nome do App**: Finza
- **Tema Padrão**: Light (Interface limpa, moderna, de alto contraste e legibilidade imediata)
- **Objetivo**: Painel financeiro pessoal simples, moderno e de alta performance construído para substituir o fluxo manual de Google Forms e Google Sheets, oferecendo entrada de dados sem fricção e controle em tempo real.

---

## 2. Premissas Centrais de Negócio

### 2.1. Premissa Central de Saldo (Isolamento Estrito Mensal)
- **Sem Rolagem de Saldo**: Cada mês opera de forma estritamente isolada. O saldo final do mês (positivo ou negativo) **não rola** para o mês seguinte.
- **Fórmula do Saldo do Mês**:
  $$\text{Saldo do Mês} = \text{Receitas do Mês} - \text{Despesas do Mês}$$
- **Impacto de Pendências**: Transações previstas/pendentes (`is_paid = false`) **já abatem/somam** no saldo atual do mês exibido. Não há separação que oculte despesas compromissadas do saldo projetado do mês corrente.
- **Cartão de Crédito e Ausência de Parcelamento**: Compras no método `credito` abatem exclusivamente no mês em que a despesa foi lançada (`date`). Não há conceito de fatura futura nem planejamento para suporte a compras parceladas, mantendo o controle financeiro simples, direto e de fluxo de caixa à vista.

### 2.2. Ecossistema de Carteiras (Isolamento do Ticket)
- **Isolamento de Métodos**: A carteira **Ticket** (benefícios corporativos de alimentação/refeição) é tratada como um método isolado.
- **Não-Contaminação**: Movimentações via Ticket **não se misturam** com as receitas e despesas da conta corrente pessoal (Crédito e Pix).
- **Desacoplamento Total de Categorias e Orçamento**: A carteira Ticket **não possui nenhum relacionamento com categorias** (`category_id: null`). Transações com método `ticket` são estritamente excluídas do cômputo de consumo de orçamento e **nunca entram nos gráficos de distribuição por categoria** (evitando o surgimento de categorias fantasmas como "Outros" ou "Sem categoria").
- **Sem Rolagem de Saldo no Ticket**: O saldo da carteira Ticket também obedece à regra de isolamento estrito mensal ($\text{Saldo Restante Ticket} = \text{Recargas do Mês} - \text{Gastos do Mês}$). Saldo remanescente de Ticket não passa para o mês seguinte.
- **Visão Separada**: O Dashboard e relatórios possuem cards, métricas e cálculos dedicados para a carteira Ticket e para a carteira Pessoal.

---

## 3. Requisitos Funcionais (RF)

### 3.1. Navegação e Estado Global (Shell & Layout)
- **[RF01] Navegação Global por Mês/Ano**: O sistema deve permitir ao usuário alternar o mês e ano ativo (`YYYY-MM`) no topo da aplicação, atualizando instantaneamente todas as visões (Dashboard, Transações, Orçamento e Relatório).
- **[RF02] Gatilho Rápido de Nova Transação**: O layout global (sidebar no desktop) deve disponibilizar um botão de destaque "Nova Transação" com acesso direto ao Modal/Sheet Global em qualquer rota.
- **[RF02b] Barra de Navegação Inferior Mobile & Tablet (MobileNavBar)**: Em telas menores que 1024px (mobile e tablet), o menu lateral (Sidebar) deve ser ocultado e substituído por uma barra de navegação inferior fixa com espaçamento equilibrado entre 4 abas (2 à esquerda: *Dashboard*, *Extrato*; 2 à direita: *Orçamento*, *Relatório*) e dois botões de ação circulares e flutuantes no centro:
  - Botão `+` (Verde/Teal): abre o modal diretamente configurado para **Nova Receita**.
  - Botão `-` (Vermelho/Rose): abre o modal diretamente configurado para **Nova Despesa**.
- **[RF03] Navegação entre Módulos**: O sistema deve prover rotas dedicadas para:
  - `/` — Dashboard do Mês
  - `/transactions` — Tabela Geral / Extrato do Mês
  - `/budget` — Orçamento do Mês
  - `/report` — Relatórios e Métricas

---

### 3.2. Dashboard do Mês (`/`)
- **[RF04] Card da Carteira Pessoal (Conta Corrente)**:
  - Calcular e exibir **Entradas do Mês**: soma de todas as receitas cujo método seja `pix` ou `credito`.
  - Calcular e exibir **Saídas do Mês**: soma de todas as despesas cujo método seja `pix` ou `credito`.
  - Calcular e exibir **Saldo Restante do Mês**: `Entradas do Mês - Saídas do Mês`.
- **[RF05] Card Destaque da Carteira Ticket**:
  - Calcular e exibir **Recargas/Entradas de Ticket**: soma de receitas com método `ticket`.
  - Calcular e exibir **Gastos de Ticket**: soma de despesas com método `ticket`.
  - Calcular e exibir **Saldo Restante de Ticket**: `Recargas - Gastos`.
- **[RF06] Consumo Geral do Orçamento**: Exibir barra de progresso visual indicando a porcentagem consumida do teto mensal total orçado em relação ao total realizado no mês. **Transações com método Ticket são estritamente ignoradas no cálculo de consumo de orçamento**, refletindo 100% o consumo da conta pessoal.
- **[RF07] Gráficos Rápidos de Distribuição**: Exibir gráfico de distribuição visual de despesas por categoria (`shadcn/ui/chart` com Recharts) considerando **exclusivamente despesas da Conta Pessoal** que possuam categoria vinculada. Transações via Ticket são totalmente omitidas desse gráfico.

---

### 3.3. Tabela Geral do Mês / Extrato (`/transactions`)
- **[RF08] Extrato Completo e Agrupamento Semanal**:
  - Listar transações pertencentes ao mês ativo selecionado, com ordenação padrão **decrescente por data** (`date DESC`).
  - Agrupar visualmente as linhas por semanas (de segunda-feira a domingo).
  - Cada cabeçalho semanal deve exibir o período e o totalizador da semana segregando gastos pessoais e Ticket (`Total: R$ X,XX • Ticket: R$ Y,YY`).
- **[RF09] Toggle Rápido de Status**: Permitir ao usuário alternar o status da transação entre `Pago` (`is_paid = true`) e `Pendente` (`is_paid = false`) com 1 único clique diretamente na linha da tabela.
- **[RF10] Ações em Linha (Menu de Contexto)**:
  - **Editar**: Abrir modal/sheet com os dados pré-carregados para alteração rápida de descrição, valor, categoria, data e método.
  - **Duplicar**: Clonar a transação atual para criar um novo registro facilitado.
  - **Excluir**: Excluir a transação mediante confirmação obrigatória via `AlertDialog`.
- **[RF11] Filtros, Busca e Ordenação por Valor**:
  - Busca textual em tempo real por descrição.
  - Filtro por tipo: Todos, Receita (`income`), Despesa (`expense`).
  - Filtro por categoria (select dinâmico).
  - Filtro por método de pagamento (`credito`, `pix`, `ticket`).
  - Seletor de ordenação: "Mais recentes primeiro (Padrão)", "Mais antigas primeiro", "Maior valor" e "Menor valor". Ao ordenar por Maior/Menor valor, exibir a listagem contínua do ranking do mês.
- **[RF12] Badges Visuais de Identificação**:
  - Verde: Receitas (`income`).
  - Vermelho: Despesas (`expense`).
  - Laranja: Movimentações do método `ticket`.
  - Na coluna Categoria, transações de `ticket` exibem um traço neutro (`—`) por não possuírem categoria vinculada.
  - Indicador visual claro para Pago vs Pendente.

---

### 3.4. Cadastro Unificado de Transações (Modal / Sheet Global)
- **[RF13] Abertura Centralizada**: O modal/sheet deve poder ser acionado de qualquer página via botão da sidebar, botões `+` e `-` da barra inferior mobile ou atalho.
- **[RF14] Campos do Formulário**:
  - **Tipo**: Toggle/Tabs com opções `Despesa` (selecionado por padrão) e `Receita`.
  - **Valor**: Input com máscara monetária formatada em BRL (R$).
  - **Descrição**: Campo textual descritivo.
  - **Data**: Datepicker com a data atual pré-selecionada.
  - **Forma de Pagamento / Destino (Dinâmico por Tipo)**:
    - **Para Despesas**: Botões de seleção com o rótulo "Forma de Pagamento": `Crédito` (padrão), `Pix` e `Ticket`.
    - **Para Receitas**: Botões de seleção com o rótulo "Destino": `Conta Pessoal` (padrão, com ícone de carteira e armazenado no banco como `pix`) e `Ticket` (recarga de benefício corporativo, armazenado como `ticket`). A opção "Crédito" é omitida em receitas por inconsistência conceitual.
  - **Categoria**: Dropdown/Select alimentado pelas categorias cadastradas (categorias padrão da Fase 1: **Alimentação**, **Lazer**, **Dev. Pessoal**, **Transporte**, **Despesas**, **Oferta**, **Dízimo**, **Viagem**, além de **Salário** e **Renda Extra**).
    - **Regra de Ocultação do Ticket**: Ao selecionar o método de pagamento/destino `Ticket`, o campo de Categoria é completamente ocultado do formulário e o registro é salvo sem categoria (`category_id: null`).
  - **Opções Avançadas (Colapsáveis)**: Os campos abaixo ficam recolhidos dentro de um acordeão/dropdown "Opções avançadas":
    - **Status de Pagamento**: Switch "Transação já realizada" (`is_paid`, padrão `true`).
    - **Recorrência**: Toggle opcional "Despesa/Receita Recorrente" (`is_recurring`).
    - **Observações**: Campo opcional de texto para notas adicionais.
    - *Comportamento*: Inicia recolhido na criação de novas transações; ao abrir para edição, auto-expande caso a transação seja pendente, recorrente ou possua notas preenchidas.
- **[RF15] Validação e Feedback**:
  - Validação estrita via Zod antes do envio.
  - Fechamento do modal e feedback com `Toast` de sucesso após criação/edição.
  - Invalidação automática dos caches do TanStack Query (`queryKey: ['transactions']`, `queryKey: ['budgets']`).

---

### 3.5. Orçamento do Mês (`/budget`)
- **[RF16] Definição de Metas por Categoria**: Listar todas as categorias de despesa e permitir inserção/edição do valor planejado (`target_amount`) para o mês ativo.
- **[RF17] Ação "Copiar do Mês Anterior"**: Diálogo de ação com 1 clique que permite clonar as metas do mês anterior (`selectedMonth - 1`) para o mês ativo com duas opções selecionáveis:
  - *Sobrescrever tudo*: substitui todas as metas do mês atual pelas do mês anterior (com confirmação).
  - *Preencher apenas vazias*: preserva os valores já editados no mês atual e importa apenas as categorias sem teto definido.
- **[RF18] Indicadores Visuais de Consumo (Status Semafórico)**:
  - **Verde**: Consumo realizado abaixo de 75% da meta.
  - **Amarelo**: Consumo realizado entre 75% e 100% da meta.
  - **Vermelho**: Orçamento estourado (consumo > 100%).
- **[RF19] Comparativo Planejado vs Realizado**: Exibir valores absolutos do que foi planejado, do que já foi gasto e do saldo disponível por categoria. O total gasto consolidado no topo da página exclui categoricamente qualquer despesa via Ticket.

---

### 3.6. Relatório Inteligente (`/report`)
- **[RF20] Métricas Automáticas do Mês**:
  - Identificar e destacar a **Categoria de Maior Gasto** (considerando apenas despesas da Conta Pessoal).
  - Calcular a **Média Diária de Gastos** no mês corrente para a Conta Pessoal.
  - Calcular o **Ritmo de Consumo do Ticket**: estimativa diária de consumo do saldo restante de Ticket até o final dos dias úteis/corridos do mês em card isolado.
- **[RF21] Comparativo Histórico Multimeses**: Gráfico de evolução de receitas vs despesas nos últimos 3 a 6 meses da Conta Pessoal.
- **[RF22] Navegação em Abas no Relatório**: Tabs organizadas em:
  - `Visão Geral`
  - `Por Categoria`
  - `Histórico Multimeses`
- **[RF23] Exportação de Dados**: Permitir exportar os dados do extrato/resumo em formato CSV e preparar estilização para impressão / geração de PDF limpo.

---

## 4. Requisitos Não-Funcionais (RNF)

- **[RNF01] Arquitetura e Framework**: Aplicação construída com Next.js (App Router) e TypeScript estrito, garantindo type-safety de ponta a ponta.
- **[RNF02] Design System e UI**:
  - Estilização com Tailwind CSS v4 e componentes shadcn/ui.
  - Ícones padronizados via `lucide-react`.
  - Tema padrão: Light Mode com paleta refinada, evitando cores primárias cruas.
- **[RNF03] Performance e Resposta Visual**:
  - Abertura de modais e transições de abas sem atrasos perceptíveis (< 100ms).
  - Tabela com rendering otimizado.
- **[RNF04] Camada de Cache e Sincronização**: TanStack Query (React Query) para orquestrar cache, optimistic updates e invalidação inteligente.
- **[RNF05] Persistência em Fases**:
  - **Fase 1**: Mocks tipados em memória / Zustand / LocalStorage para teste e validação de UX.
  - **Fase 2**: PostgreSQL via Supabase com Row-Level Security e Edge Functions/pg_cron para tarefas agendadas.
- **[RNF06] Compatibilidade de Hospedagem Vercel**: Construção estritamente aderente ao Next.js App Router, sem rotas de build bloqueantes ou dependências de runtime incompatíveis, permitindo deploy contínuo (CI/CD) com compilação `next build` limpa.
- **[RNF07] Segurança e Autenticação Obrigatória**: Proteção de rotas privadas via Next.js Proxy (`src/proxy.ts`), redirecionando acessos não autenticados para `/login`. Mutações executam validação explícita de `auth.uid()` em conformidade com as políticas de RLS e emitem feedback de sessão amigável.

---

## 5. Matriz de Entregáveis por Fase

| Fase | Escopo | Status |
| :--- | :--- | :--- |
| **Fase 1: Frontend & Interface Mockada** | Setup Next.js, shadcn/ui, Zod Schemas, Zustand Stores, TanStack Query mocks, Dashboard, Tabela, Modal Global, Orçamento, Relatórios | **Concluído** |
| **Fase 2: Backend & Sincronização Supabase** | Schema SQL Supabase, RLS, Auth simplificado, substituição dos mocks pelos clients reais, rotina de recorrência via pg_cron/Edge Function/Fallback | **Concluído** |
