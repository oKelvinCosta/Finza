import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Endpoint de verificação de conexão com o Supabase (Healthcheck).
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project-id")) {
    return NextResponse.json(
      {
        connected: false,
        status: "missing_credentials",
        message:
          "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas em .env.local",
      },
      { status: 200 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    // Tenta uma consulta simples de verificação na API do Supabase
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          connected: false,
          status: "auth_error",
          message: error.message,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        connected: true,
        status: "healthy",
        message: "Conexão com o Supabase estabelecida com sucesso!",
        sessionActive: Boolean(data.session),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      {
        connected: false,
        status: "network_error",
        message,
      },
      { status: 500 }
    );
  }
}
