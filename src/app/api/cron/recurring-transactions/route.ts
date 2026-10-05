import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Endpoint para automação de virada de mês das transações recorrentes.
 * Pode ser acionado por:
 * 1. Vercel Cron (via vercel.json)
 * 2. Supabase Webhook / Edge Function
 * 3. Serviços externos como GitHub Actions, EasyCron, etc.
 * 4. Chamada manual/administrativa com ?secret=CRON_SECRET
 */
export async function GET(request: NextRequest) {
  return handleRecurringSync(request);
}

export async function POST(request: NextRequest) {
  return handleRecurringSync(request);
}

async function handleRecurringSync(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");

  // Validação de segurança se CRON_SECRET estiver configurado
  if (cronSecret) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isParamValid = secretParam === cronSecret;

    if (!isBearerValid && !isParamValid) {
      return NextResponse.json(
        { error: "Acesso não autorizado. Chave de cron inválida." },
        { status: 401 }
      );
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Credenciais do Supabase não configuradas no servidor." },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    let targetDate = url.searchParams.get("targetDate");
    const targetMonth = url.searchParams.get("targetMonth");

    if (!targetDate && targetMonth) {
      targetDate = `${targetMonth}-01`;
    }
    if (!targetDate) {
      targetDate = new Date().toISOString().split("T")[0];
    }

    // 1. Tentar executar via RPC PostgreSQL
    const { data: rpcCount, error: rpcError } = await supabase.rpc(
      "process_recurring_transactions",
      { target_date: targetDate }
    );

    if (!rpcError) {
      return NextResponse.json({
        success: true,
        method: "rpc",
        targetDate,
        processedCount: rpcCount,
        message: `${rpcCount} transações recorrentes processadas com sucesso via RPC.`,
        executedAt: new Date().toISOString(),
      });
    }

    // 2. Fallback via queries Supabase
    const [year, month] = targetDate.split("-").map(Number);
    const targetMonthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonthYear = month === 12 ? year + 1 : year;
    const nextMonthVal = month === 12 ? 1 : month + 1;
    const targetMonthEnd = `${nextMonthYear}-${String(nextMonthVal).padStart(2, "0")}-01`;

    const prevMonthYear = month === 1 ? year - 1 : year;
    const prevMonthVal = month === 1 ? 12 : month - 1;
    const prevMonthStart = `${prevMonthYear}-${String(prevMonthVal).padStart(2, "0")}-01`;
    const prevMonthEnd = targetMonthStart;

    const { data: prevRecurrings, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("is_recurring", true)
      .gte("date", prevMonthStart)
      .lt("date", prevMonthEnd);

    if (fetchError) {
      throw fetchError;
    }

    const { data: currentMonthTxs, error: currentError } = await supabase
      .from("transactions")
      .select("id, description, amount, type, payment_method, is_recurring, user_id")
      .gte("date", targetMonthStart)
      .lt("date", targetMonthEnd);

    if (currentError) {
      throw currentError;
    }

    const currentRows = currentMonthTxs || [];
    let insertedCount = 0;
    const lastDayOfTargetMonth = new Date(year, month, 0).getDate();

    for (const prev of prevRecurrings || []) {
      const alreadyExists = currentRows.some((c) => {
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
          is_paid: false,
          is_recurring: true,
          notes: prev.notes,
          user_id: prev.user_id,
        });

        if (!insertError) {
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      method: "fallback_ts",
      targetDate,
      processedCount: insertedCount,
      message: `${insertedCount} transações recorrentes processadas com sucesso via fallback.`,
      executedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
