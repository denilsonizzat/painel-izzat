"use client";
import { useEffect } from "react";

export function useNotifications() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  function notificar(titulo: string, corpo: string) {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    new Notification(titulo, {
      body: corpo,
      icon: "/lojas/izzat-group.png",
      badge: "/lojas/izzat-group.png",
    });
  }

  function notificarStreakRisco(streakDias: number) {
    const hora = new Date().getHours();
    if (hora >= 20) {
      notificar(
        "Seu streak esta em risco!",
        `Voce tem ${streakDias} dias consecutivos. Faca pelo menos 1 tarefa hoje para nao perder.`
      );
    }
  }

  function notificarTarefaAtrasada(titulo: string) {
    notificar("Tarefa atrasada", `"${titulo}" passou do prazo.`);
  }

  function notificarNovaTarefa(titulo: string, dePessoa: string) {
    notificar("Nova tarefa delegada", `${dePessoa} delegou: "${titulo}"`);
  }

  function notificarDiaCompleto() {
    notificar("Dia concluido! +50 XP", "Voce completou todas as rotinas e ganhou bonus de streak.");
  }

  return { notificar, notificarStreakRisco, notificarTarefaAtrasada, notificarNovaTarefa, notificarDiaCompleto };
}
