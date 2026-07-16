"use client";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import BreadcrumbNav from "./BreadcrumbNav";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { assinarColaboradoresRealtime } from "@/lib/auth";
import { assinarRotinasRealtime } from "@/lib/rotinasSync";
import { assinarTarefasRealtime, assinarNotificacoesRealtime } from "@/lib/cloudMappers";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const carregarDadosSupabase = useAppStore((s) => s.carregarDadosSupabase);
  const aplicarColaboradorRealtime = useAppStore((s) => s.aplicarColaboradorRealtime);
  const aplicarRotinaRealtime = useAppStore((s) => s.aplicarRotinaRealtime);
  const removerRotinaRealtime = useAppStore((s) => s.removerRotinaRealtime);
  const aplicarTarefaRealtime = useAppStore((s) => s.aplicarTarefaRealtime);
  const removerTarefaRealtime = useAppStore((s) => s.removerTarefaRealtime);
  const aplicarNotificacaoRealtime = useAppStore((s) => s.aplicarNotificacaoRealtime);
  const removerNotificacaoRealtime = useAppStore((s) => s.removerNotificacaoRealtime);

  // Busca os dados reais do Supabase uma vez por sessão de página (cobre o F5,
  // já que o login só dispara essa busca no momento de entrar).
  useEffect(() => {
    carregarDadosSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tempo real: presença, rotinas, tarefas e notificações de outro device
  // chegam sem precisar de F5 ou trocar de página.
  useEffect(() => {
    const cancelarColab = assinarColaboradoresRealtime(aplicarColaboradorRealtime);
    const cancelarRotinas = assinarRotinasRealtime(aplicarRotinaRealtime, removerRotinaRealtime);
    const cancelarTarefas = assinarTarefasRealtime(aplicarTarefaRealtime, removerTarefaRealtime);
    const cancelarNotifs = assinarNotificacoesRealtime(aplicarNotificacaoRealtime, removerNotificacaoRealtime);
    return () => {
      cancelarColab();
      cancelarRotinas();
      cancelarTarefas();
      cancelarNotifs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
