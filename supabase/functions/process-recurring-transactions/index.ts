// Supabase Edge Function: process-recurring-transactions
// Executada via Supabase Cron, Webhook ou chamada HTTP POST/GET autorizada

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  targetDate?: string;  // YYYY-MM-DD
  targetMonth?: string; // YYYY-MM
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let targetDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD hoje

    if (req.method === "POST") {
      try {
        const body: RequestPayload = await req.json();
        if (body.targetDate) {
          targetDate = body.targetDate;
        } else if (body.targetMonth) {
          targetDate = `${body.targetMonth}-01`;
        }
      } catch {
        // Ignora caso não tenha corpo JSON
      }
    }

    // 1. Tenta executar via stored procedure no PostgreSQL (melhor performance)
    const { data: rpcCount, error: rpcError } = await supabase.rpc(
      "process_recurring_transactions",
      { target_date: targetDate }
    );

    if (!rpcError) {
      return new Response(
        JSON.stringify({
          success: true,
          method: "rpc",
          targetDate,
          processedCount: rpcCount,
          message: `${rpcCount} transações recorrentes processadas com sucesso.`,
          executedAt: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Fallback caso a procedure SQL ainda não tenha sido aplicada no banco
    console.warn("RPC falhou, executando fallback em TypeScript:", rpcError.message);

    const [year, month] = targetDate.split("-").map(Number);
    const targetMonthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonthYear = month === 12 ? year + 1 : year;
    const nextMonthVal = month === 12 ? 1 : month + 1;
    const targetMonthEnd = `${nextMonthYear}-${String(nextMonthVal).padStart(2, "0")}-01`;

    const prevMonthYear = month === 1 ? year - 1 : year;
    const prevMonthVal = month === 1 ? 12 : month - 1;
    const prevMonthStart = `${prevMonthYear}-${String(prevMonthVal).padStart(2, "0")}-01`;
    const prevMonthEnd = targetMonthStart;

    // Buscar recorrentes do mês anterior
    const { data: prevRecurrings, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("is_recurring", true)
      .gte("date", prevMonthStart)
      .lt("date", prevMonthEnd);

    if (fetchError) {
      throw fetchError;
    }

    // Buscar transações existentes no mês alvo para checagem de duplicidade
    const { data: currentMonthTxs, error: currentError } = await supabase
      .from("transactions")
      .select("id, description, amount, type, payment_method, recurrence_source_id, is_recurring, user_id")
      .gte("date", targetMonthStart)
      .lt("date", targetMonthEnd);

    if (currentError) {
      throw currentError;
    }

    const currentRows = currentMonthTxs || [];
    let insertedCount = 0;

    // Descobrir quantos dias tem o mês alvo
    const lastDayOfTargetMonth = new Date(year, month, 0).getDate();

    for (const prev of prevRecurrings || []) {
      const rootId = prev.recurrence_source_id || prev.id;

      // Verificar se já existe no mês alvo
      const alreadyExists = currentRows.some((c: Record<string, unknown>) => {
        if (c.recurrence_source_id && c.recurrence_source_id === rootId) return true;
        if (c.id === prev.id) return true;
        return (
          c.user_id === prev.user_id &&
          c.description === prev.description &&
          Number(c.amount) === Number(prev.amount) &&
          c.type === prev.type &&
          c.payment_method === prev.payment_method &&
          c.is_recurring === true
        );
      });

      if (!alreadyExists) {
        const origDay = parseInt(prev.date.split("-")[2], 10);
        const targetDay = Math.min(origDay, lastDayOfTargetMonth);
        const newDate = `${year}-${String(month).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

        const isTicket = prev.payment_method === "ticket";

        const { error: insertError } = await supabase.from("transactions").insert({
          description: prev.description,
          amount: Number(prev.amount),
          type: prev.type,
          category_id: isTicket ? null : prev.category_id,
          date: newDate,
          payment_method: prev.payment_method,
          is_paid: false, // Inicia pendente
          is_recurring: true, // Permanece recorrente
          recurrence_source_id: rootId,
          notes: prev.notes,
          user_id: prev.user_id,
        });

        if (!insertError) {
          insertedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        method: "fallback_ts",
        targetDate,
        processedCount: insertedCount,
        message: `${insertedCount} transações recorrentes replicadas via fallback.`,
        executedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
