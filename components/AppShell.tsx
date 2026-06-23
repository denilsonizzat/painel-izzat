"use client";
import Sidebar from "./Sidebar";
import BreadcrumbNav from "./BreadcrumbNav";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 md:p-6 p-4 pt-16 md:pt-6 overflow-auto">
        <BreadcrumbNav />
        {/* key por rota → entrada suave a cada navegação (P0/P2) */}
        {/* max-w de leitura: em telas widescreen o conteúdo não estica de ponta a ponta */}
        <div key={pathname} className="page-enter mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
