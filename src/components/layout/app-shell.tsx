"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNavBar } from "@/components/layout/mobile-nav";
import { TransactionModal } from "@/components/transactions/transaction-modal";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuthRoute) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <>
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
    </>
  );
}
