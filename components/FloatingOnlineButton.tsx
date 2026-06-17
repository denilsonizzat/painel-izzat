"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Power } from "lucide-react";
import OnlineStatusModal from "./OnlineStatusModal";

export default function FloatingOnlineButton() {
  const { usuarioAtual } = useAppStore();
  const [aberto, setAberto] = useState(false);

  if (!usuarioAtual) return null;

  const isOnline = usuarioAtual.statusOnline?.ativo ?? false;
  const isFoco = usuarioAtual.statusOnline?.foco ?? false;
  const cor = isOnline ? (isFoco ? "#f97316" : "#10b981") : "#475569";
  const label = isOnline ? (isFoco ? "FOCO" : "ONLINE") : "OFFLINE";

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title={isOnline ? "Online — clique para gerenciar" : "Offline — clique para ativar"}
        className="hidden md:flex fixed top-4 right-4 z-40 items-center gap-2 px-3 py-2 rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: "#122039",
          border: `1px solid ${cor}50`,
          boxShadow: `0 0 16px ${cor}20`,
        }}
      >
        <Power size={14} style={{ color: cor }} />
        <span className="text-xs font-bold tracking-widest" style={{ color: cor }}>
          {label}
        </span>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: isOnline ? cor : "#334155",
            boxShadow: isOnline ? `0 0 6px ${cor}` : "none",
          }}
        />
      </button>

      <OnlineStatusModal aberto={aberto} onFechar={() => setAberto(false)} />
    </>
  );
}
