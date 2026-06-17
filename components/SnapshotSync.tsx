"use client";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

export default function SnapshotSync() {
  const store = useAppStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncRef = useRef<number>(0);

  const sync = () => {
    const agora = Date.now();
    if (agora - lastSyncRef.current < 10_000) return; // throttle 10s
    lastSyncRef.current = agora;

    const payload = {
      colaboradores: store.colaboradores,
      tarefas: store.tarefas,
      atividadesHoje: store.atividadesHoje,
      historico: store.historico,
      syncrAt: new Date().toISOString(),
    };

    fetch("/api/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };

  useEffect(() => {
    // sync on load
    const t = setTimeout(sync, 3000);
    // sync every 5 minutes
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // sync on store changes (debounced 8s)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(sync, 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [store.colaboradores, store.tarefas, store.atividadesHoje]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
