import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Finza — Painel Financeiro Pessoal",
  description: "Controle financeiro pessoal simples, moderno e de alta performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <QueryProvider>
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AppHeader />
              <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
          <TransactionModal />
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
