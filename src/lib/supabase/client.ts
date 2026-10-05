import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components do Next.js (browser).
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias para conectar ao Supabase."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
