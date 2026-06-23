"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  Bell, X, Check, ExternalLink, Trash2, Clock,
  AlertTriangle, Trophy, Zap, Flame, Power, ListTodo,
} from "lucide-react";

const TIPO_CFG: Record<string, { icon: typeof Bell; cor: string; label: string }> = {
  online:          { icon: Power,         cor: "#10b981", label: "Online" },
  tarefa_nova:     { icon: ListTodo,      cor: "#3b82f6", label: "Nova Tarefa" },
  tarefa_atrasada: { icon: AlertTriangle, cor: "#ef4444", label: "Tarefa Atrasada" },
  reconhecimento:  { icon: Trophy,        cor: "#c9a84c", label: "Reconhecimento" },
  nivel_up:        { icon: Zap,           cor: "#c9a84c", label: "Subiu de Nível" },
  streak_risco:    { icon: Flame,         cor: "#f59e0b", label: "Sequência em Risco" },
  default:         { icon: Bell,          cor: "#94a3b8", label: "Notificação" },
};

const SNOOZE_OPTS = [
  { label: "15 min",  min: 15 },
  { label: "1 hora",  min: 60 },
  { label: "3 horas", min: 180 },
  { label: "Amanhã",  min: 1440 },
];

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export default function NotificationCenter({ aberto, onFechar }: Props) {
  const router = useRouter();
  const {
    notificacoesInApp, usuarioAtual,
    marcarNotificacaoLida, excluirNotificacao, snoozeNotificacao, limparNotificacoesLidas,
  } = useAppStore();

  const [snoozeAberto, setSnoozeAberto] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState<Record<string, number>>({});
  const touchStartX = useRef<Record<string, number>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const minhas = notificacoesInApp
    .filter((n) => n.paraId === usuarioAtual?.id)
    .filter((n) => !n.snoozedUntil || new Date(n.snoozedUntil) <= new Date());

  const naoLidas = minhas.filter((n) => !n.lida).length;

  // Fechar ao clicar fora
  useEffect(() => {
    if (!aberto) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onFechar();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aberto, onFechar]);

  // Fechar com Escape
  useEffect(() => {
    if (!aberto) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [aberto, onFechar]);

  const handleAbrir = (notif: typeof minhas[0]) => {
    marcarNotificacaoLida(notif.id);
    onFechar();
    if (notif.href) router.push(notif.href);
  };

  const handleSwipeStart = (id: string, clientX: number) => {
    touchStartX.current[id] = clientX;
  };
  const handleSwipeMove = (id: string, clientX: number) => {
    const delta = touchStartX.current[id] - clientX;
    if (delta > 0) setSwipeX((p) => ({ ...p, [id]: Math.min(delta, 100) }));
  };
  const handleSwipeEnd = (id: string) => {
    if ((swipeX[id] ?? 0) > 60) excluirNotificacao(id);
    setSwipeX((p) => ({ ...p, [id]: 0 }));
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center" style={{ background: "#00000070" }}>
      <div
        ref={panelRef}
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "#0d1a2e",
          border: "1px solid rgba(201,164,66,.2)",
          marginTop: 64,
          maxHeight: "calc(100vh - 80px)",
          display: "flex",
          flexDirection: "column",
          animation: "slideDown 0.22s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(201,164,66,.12)", background: "linear-gradient(180deg,#162843,#0d1a2e)" }}>
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: "#c9a84c" }} />
            <span className="text-white font-bold text-sm">Notificações</span>
            {naoLidas > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "#ef4444", color: "white" }}>
                {naoLidas}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {minhas.some((n) => n.lida) && (
              <button onClick={limparNotificacoesLidas}
                className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "#74859c", border: "1px solid #1e3356" }}>
                Limpar lidas
              </button>
            )}
            {naoLidas > 0 && (
              <button
                onClick={() => minhas.filter((n) => !n.lida).forEach((n) => marcarNotificacaoLida(n.id))}
                className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "#c9a84c", border: "1px solid rgba(201,164,66,.2)" }}>
                Marcar todas
              </button>
            )}
            <button onClick={onFechar} className="p-1 rounded-lg hover:opacity-70" style={{ color: "#74859c" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: "contain" }}>
          {minhas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Bell size={32} style={{ color: "#1e3356" }} />
              <p className="text-sm" style={{ color: "#74859c" }}>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {minhas.map((n) => {
                const cfg = TIPO_CFG[n.tipo] ?? TIPO_CFG.default;
                const Icone = cfg.icon;
                const translateX = swipeX[n.id] ?? 0;
                return (
                  <div key={n.id} className="relative overflow-hidden rounded-xl">
                    {/* Fundo vermelho (swipe delete) */}
                    <div className="absolute inset-0 flex items-center justify-end pr-4 rounded-xl"
                      style={{ background: "#ef4444", opacity: translateX > 20 ? 1 : 0, transition: "opacity 0.1s" }}>
                      <Trash2 size={18} style={{ color: "white" }} />
                    </div>

                    {/* Notificação */}
                    <div
                      className="relative rounded-xl p-3"
                      style={{
                        background: n.lida ? "#0f1c30" : `${cfg.cor}10`,
                        border: `1px solid ${n.lida ? "#1e3356" : cfg.cor + "30"}`,
                        transform: `translateX(-${translateX}px)`,
                        transition: translateX === 0 ? "transform 0.2s ease" : "none",
                      }}
                      onTouchStart={(e) => handleSwipeStart(n.id, e.touches[0].clientX)}
                      onTouchMove={(e) => handleSwipeMove(n.id, e.touches[0].clientX)}
                      onTouchEnd={() => handleSwipeEnd(n.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Ícone */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: cfg.cor + "20" }}>
                          <Icone size={15} style={{ color: cfg.cor }} />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-wide"
                                  style={{ color: cfg.cor }}>{cfg.label}</span>
                                {!n.lida && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ background: cfg.cor }} />}
                              </div>
                              <p className="text-sm font-semibold mt-0.5"
                                style={{ color: n.lida ? "#9aa7ba" : "#e8edf5" }}>{n.titulo}</p>
                              <p className="text-xs mt-0.5 leading-relaxed"
                                style={{ color: "#74859c" }}>{n.corpo}</p>
                              <p className="text-xs mt-1" style={{ color: "#475569" }}>
                                {tempoRelativo(n.criadaEm)}
                              </p>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {n.href && (
                              <button onClick={() => handleAbrir(n)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                style={{ background: cfg.cor + "20", color: cfg.cor, border: `1px solid ${cfg.cor}40` }}>
                                <ExternalLink size={11} /> Abrir
                              </button>
                            )}
                            {!n.lida && (
                              <button onClick={() => marcarNotificacaoLida(n.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                style={{ background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }}>
                                <Check size={11} /> Lida
                              </button>
                            )}
                            {/* Snooze */}
                            <div className="relative">
                              <button onClick={() => setSnoozeAberto(snoozeAberto === n.id ? null : n.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                style={{ background: "#f59e0b15", color: "#f59e0b", border: "1px solid #f59e0b30" }}>
                                <Clock size={11} /> Lembrar
                              </button>
                              {snoozeAberto === n.id && (
                                <div className="absolute bottom-full left-0 mb-1 z-50 rounded-xl overflow-hidden shadow-2xl"
                                  style={{ background: "#112239", border: "1px solid rgba(201,164,66,.2)", minWidth: 140 }}>
                                  {SNOOZE_OPTS.map((opt) => (
                                    <button key={opt.min}
                                      onClick={() => { snoozeNotificacao(n.id, opt.min); setSnoozeAberto(null); }}
                                      className="w-full text-left px-3 py-2 text-xs hover:opacity-70 transition-opacity"
                                      style={{ color: "#e8edf5", borderBottom: "1px solid #1e3356" }}>
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={() => excluirNotificacao(n.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 ml-auto"
                              style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430" }}>
                              <Trash2 size={11} /> Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
