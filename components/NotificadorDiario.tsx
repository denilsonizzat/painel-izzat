"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { rotinasDoColaborador, venceHoje, concluidaHoje, hojeStr } from "@/lib/recorrencia";

/**
 * Ao entrar, gera UMA notificação-resumo no sino com as rotinas que vencem hoje.
 * Guarda flag por dia no localStorage para não duplicar a cada navegação.
 */
export default function NotificadorDiario() {
  const usuarioAtual = useAppStore((s) => s.usuarioAtual);
  const rotinas = useAppStore((s) => s.rotinas);
  const adicionarNotificacaoInApp = useAppStore((s) => s.adicionarNotificacaoInApp);

  useEffect(() => {
    if (!usuarioAtual) return;
    const chave = `notif-rotinas-${usuarioAtual.id}-${hojeStr()}`;
    // Marca a flag ANTES de adicionar — evita duplicar no double-invoke do React Strict Mode.
    if (localStorage.getItem(chave)) return;
    localStorage.setItem(chave, "1");

    const minhas = rotinasDoColaborador(rotinas, usuarioAtual.id);
    const pendentesHoje = minhas.filter((r) => venceHoje(r) && !concluidaHoje(r));
    if (pendentesHoje.length === 0) return;

    adicionarNotificacaoInApp({
      paraId: usuarioAtual.id,
      tipo: "tarefa_nova",
      titulo: `Você tem ${pendentesHoje.length} rotina${pendentesHoje.length > 1 ? "s" : ""} para hoje`,
      corpo: pendentesHoje.slice(0, 3).map((r) => r.titulo).join(" · ") + (pendentesHoje.length > 3 ? "…" : ""),
      href: "/tarefas",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioAtual?.id]);

  return null;
}
