import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNavBar } from "@/components/layout/mobile-nav";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="overflow-x-hidden">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900 overflow-x-hidden min-h-screen`}>
        <QueryProvider>
          <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
              <AppHeader />
              <main className="flex-1 p-3 sm:p-5 md:p-8 pb-24 lg:pb-8 min-w-0 max-w-full overflow-x-hidden">
                {children}
              </main>
            </div>
          </div>
          <MobileNavBar />
          <TransactionModal />
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
