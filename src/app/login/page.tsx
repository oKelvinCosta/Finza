"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);

  // Campos do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.session) {
        toast.success("Login realizado com sucesso!");
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao realizar login.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success("Conta criada e conectada com sucesso!");
        router.push("/");
        router.refresh();
      } else if (data.user) {
        toast.success(
          "Conta criada com sucesso! Verifique seu e-mail caso a confirmação seja necessária.",
          { duration: 6000 }
        );
        setActiveTab("login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao cadastrar usuário.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-slate-50">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md mb-3">
          <Wallet className="h-6 w-6 text-teal-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Finza
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          Controle financeiro pessoal moderno com isolamento de Ticket e metas mensais.
        </p>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md shadow-sm border border-slate-200/80 bg-white">
        <CardHeader className="pb-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "login" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger
                value="login"
                className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
              >
                Criar Conta
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold text-slate-700">
                  E-mail
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="login-password"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Senha
                  </Label>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800 font-medium transition-all mt-2 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <span>Entrar no Finza</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-email"
                  className="text-xs font-semibold text-slate-700"
                >
                  E-mail
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="h-10 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-password"
                  className="text-xs font-semibold text-slate-700"
                >
                  Senha
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="h-10 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="signup-confirm-password"
                  className="text-xs font-semibold text-slate-700"
                >
                  Confirmar Senha
                </Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="h-10 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800 font-medium transition-all mt-2 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <span>Criar Minha Conta</span>
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 mt-6 text-center">
        Finza &bull; Isolamento mensal e segurança com Supabase Auth
      </p>
    </div>
  );
}
