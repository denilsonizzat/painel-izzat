"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  Bell, X, Check, ExternalLink, Trash2, Clock, Archive, RotateCcw,
  AlertTriangle, Trophy, Zap, Flame, Power, ListTodo, ChevronDown, ChevronUp, Calendar,
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

type Filtro = "todos" | "hoje" | "3dias" | "7dias" | "personalizado";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos",        label: "Todos" },
  { id: "hoje",         label: "Hoje" },
  { id: "3dias",        label: "3 dias" },
  { id: "7dias",        label: "7 dias" },
  { id: "personalizado", label: "📅" },
];

function filtrarPorData(lista: { criadaEm: string }[], filtro: Filtro, customDe: string, customAte: string) {
  const agora = Date.now();
  const ms = (d: number) => agora - d * 86400000;
  return lista.filter((n) => {
    const t = new Date(n.criadaEm).getTime();
    if (filtro === "hoje")  return t >= ms(1);
    if (filtro === "3dias") return t >= ms(3);
    if (filtro === "7dias") return t >= ms(7);
    if (filtro === "personalizado") {
      const de  = customDe  ? new Date(customDe).getTime()  : 0;
      const ate = customAte ? new Date(customAte).getTime() + 86399999 : Infinity;
      return t >= de && t <= ate;
    }
    return true;
  });
}

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

function dataFormatada(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export default function NotificationCenter({ aberto, onFechar }: Props) {
  const router = useRouter();
  const {
    notificacoesInApp, usuarioAtual,
    marcarNotificacaoLida, marcarNotificacaoNaoLida,
    arquivarNotificacao, excluirNotificacao,
    snoozeNotificacao, limparNotificacoesLidas,
  } = useAppStore();

  const [aba, setAba] = useState<"ativas" | "arquivadas">("ativas");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [customDe, setCustomDe] = useState("");
  const [customAte, setCustomAte] = useState("");
  const [snoozeAberto, setSnoozeAberto] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState<Record<string, number>>({});
  const touchStartX = useRef<Record<string, number>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const todas = notificacoesInApp.filter((n) => n.paraId === usuarioAtual?.id);
  const ativas = todas
    .filter((n) => !n.arquivada)
    .filter((n) => !n.snoozedUntil || new Date(n.snoozedUntil) <= new Date());
  const arquivadas = todas.filter((n) => n.arquivada === true);
  const listaBase = aba === "ativas" ? ativas : arquivadas;
  const lista = filtrarPorData(listaBase, filtro, customDe, customAte) as typeof listaBase;
  const naoLidas = ativas.filter((n) => !n.lida).length;

  useEffect(() => {
    if (!aberto) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onFechar();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aberto, onFechar]);

  useEffect(() => {
    if (!aberto) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [aberto, onFechar]);

  const handleAbrir = (notif: typeof lista[0]) => {
    marcarNotificacaoLida(notif.id);
    onFechar();
    if (notif.href) router.push(notif.href);
  };

  const handleSwipeStart = (id: string, clientX: number) => { touchStartX.current[id] = clientX; };
  const handleSwipeMove = (id: string, clientX: number) => {
    const delta = touchStartX.current[id] - clientX;
    if (delta > 0) setSwipeX((p) => ({ ...p, [id]: Math.min(delta, 100) }));
  };
  const handleSwipeEnd = (id: string) => {
    if ((swipeX[id] ?? 0) > 60) {
      aba === "ativas" ? arquivarNotificacao(id) : excluirNotificacao(id);
    }
    setSwipeX((p) => ({ ...p, [id]: 0 }));
  };

  if (!aberto) return null;

  const Pílula = ({ id, label }: { id: Filtro; label: string }) => (
    <button
      onClick={() => setFiltro(id)}
      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
      style={{
        background: filtro === id ? "#c9a84c25" : "transparent",
        color: filtro === id ? "#c9a84c" : "#74859c",
        border: filtro === id ? "1px solid #c9a84c40" : "1px solid #1e3356",
      }}
    >
      {label}
    </button>
  );

  const AbaBtn = ({ id, label, count }: { id: typeof aba; label: string; count?: number }) => (
    <button
      onClick={() => setAba(id)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: aba === id ? "#c9a84c20" : "transparent",
        color: aba === id ? "#c9a84c" : "#74859c",
        border: aba === id ? "1px solid #c9a84c30" : "1px solid transparent",
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: aba === id ? "#c9a84c" : "#ef4444", color: "white", fontSize: 9 }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center" style={{ background: "#00000070" }}>
      <div
        ref={panelRef}
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "#0d1a2e",
          border: "1px solid rgba(201,164,66,.2)",
          marginTop: 60,
          maxHeight: "calc(100vh - 76px)",
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
                style={{ background: "#ef4444", color: "white" }}>{naoLidas}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {aba === "ativas" && ativas.some((n) => n.lida) && (
              <button onClick={limparNotificacoesLidas}
                className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "#74859c", border: "1px solid #1e3356" }}>
                Limpar lidas
              </button>
            )}
            {aba === "ativas" && naoLidas > 0 && (
              <button
                onClick={() => ativas.filter((n) => !n.lida).forEach((n) => marcarNotificacaoLida(n.id))}
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

        {/* Abas */}
        <div className="flex items-center gap-1 px-3 py-2 flex-shrink-0"
          style={{ borderBottom: "1px solid #1e3356" }}>
          <AbaBtn id="ativas" label="Ativas" count={naoLidas} />
          <AbaBtn id="arquivadas" label="Arquivadas" count={arquivadas.length > 0 ? arquivadas.length : undefined} />
        </div>

        {/* Filtro por data */}
        <div className="flex-shrink-0 px-3 py-2" style={{ borderBottom: "1px solid #1e3356" }}>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {FILTROS.map((f) => <Pílula key={f.id} id={f.id} label={f.label} />)}
          </div>
          {filtro === "personalizado" && (
            <div className="flex items-center gap-2 mt-2">
              <Calendar size={12} style={{ color: "#74859c", flexShrink: 0 }} />
              <input type="date" value={customDe} onChange={(e) => setCustomDe(e.target.value)}
                className="flex-1 text-xs rounded-lg px-2 py-1 outline-none"
                style={{ background: "#112239", border: "1px solid #1e3356", color: "#e8edf5" }} />
              <span className="text-xs" style={{ color: "#475569" }}>até</span>
              <input type="date" value={customAte} onChange={(e) => setCustomAte(e.target.value)}
                className="flex-1 text-xs rounded-lg px-2 py-1 outline-none"
                style={{ background: "#112239", border: "1px solid #1e3356", color: "#e8edf5" }} />
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: "contain" }}>
          {lista.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              {aba === "arquivadas"
                ? <Archive size={32} style={{ color: "#1e3356" }} />
                : <Bell size={32} style={{ color: "#1e3356" }} />}
              <p className="text-sm" style={{ color: "#74859c" }}>
                {aba === "arquivadas" ? "Nenhuma notificação arquivada" : filtro !== "todos" ? "Nenhuma notificação neste período" : "Nenhuma notificação"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {lista.map((n) => {
                const cfg = TIPO_CFG[n.tipo] ?? TIPO_CFG.default;
                const Icone = cfg.icon;
                const translateX = swipeX[n.id] ?? 0;
                const estaExpandido = expandido === n.id;
                const corpoLongo = n.corpo.length > 80;

                return (
                  <div key={n.id} className="relative overflow-hidden rounded-xl">
                    {/* Fundo swipe */}
                    <div className="absolute inset-0 flex items-center justify-end pr-4 rounded-xl"
                      style={{
                        background: aba === "ativas" ? "#475569" : "#ef4444",
                        opacity: translateX > 20 ? 1 : 0,
                        transition: "opacity 0.1s",
                      }}>
                      {aba === "ativas"
                        ? <Archive size={18} style={{ color: "white" }} />
                        : <Trash2 size={18} style={{ color: "white" }} />}
                    </div>

                    {/* Card */}
                    <div
                      className="relative rounded-xl p-3"
                      style={{
                        background: n.lida ? "#0f1c30" : `${cfg.cor}10`,
                        border: `1px solid ${n.lida ? "#1e3356" : cfg.cor + "30"}`,
                        opacity: n.arquivada ? 0.75 : 1,
                        transform: `translateX(-${translateX}px)`,
                        transition: translateX === 0 ? "transform 0.2s ease" : "none",
                      }}
                      onTouchStart={(e) => handleSwipeStart(n.id, e.touches[0].clientX)}
                      onTouchMove={(e) => handleSwipeMove(n.id, e.touches[0].clientX)}
                      onTouchEnd={() => handleSwipeEnd(n.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: cfg.cor + "20" }}>
                          <Icone size={15} style={{ color: cfg.cor }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Tipo + badge não lida */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wide"
                              style={{ color: cfg.cor }}>{cfg.label}</span>
                            {!n.lida && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: cfg.cor }} />}
                          </div>

                          {/* Título — clicável para expandir */}
                          <button
                            className="w-full text-left mt-0.5"
                            onClick={() => setExpandido(estaExpandido ? null : n.id)}
                          >
                            <p className="text-sm font-semibold"
                              style={{ color: n.lida ? "#9aa7ba" : "#e8edf5" }}>{n.titulo}</p>
                          </button>

                          {/* Corpo — truncado por padrão, expandido ao clicar */}
                          <button
                            className="w-full text-left"
                            onClick={() => setExpandido(estaExpandido ? null : n.id)}
                          >
                            <p className={`text-xs mt-0.5 leading-relaxed ${!estaExpandido && corpoLongo ? "line-clamp-2" : ""}`}
                              style={{ color: "#74859c" }}>
                              {n.corpo}
                            </p>
                            {corpoLongo && (
                              <span className="flex items-center gap-0.5 text-xs mt-1 transition-opacity hover:opacity-70"
                                style={{ color: "#c9a84c" }}>
                                {estaExpandido
                                  ? <><ChevronUp size={11} /> Ver menos</>
                                  : <><ChevronDown size={11} /> Ver tudo</>}
                              </span>
                            )}
                          </button>

                          {/* Data completa quando expandido */}
                          {estaExpandido && (
                            <p className="text-xs mt-1.5 font-medium" style={{ color: "#475569" }}>
                              {dataFormatada(n.criadaEm)}
                            </p>
                          )}

                          {/* Tempo relativo quando não expandido */}
                          {!estaExpandido && (
                            <p className="text-xs mt-1" style={{ color: "#475569" }}>
                              {tempoRelativo(n.criadaEm)}
                            </p>
                          )}

                          {/* Ações */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {n.href && (
                              <button onClick={() => handleAbrir(n)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                style={{ background: cfg.cor + "20", color: cfg.cor, border: `1px solid ${cfg.cor}40` }}>
                                <ExternalLink size={11} /> Abrir
                              </button>
                            )}

                            {aba === "ativas" && (
                              n.lida ? (
                                <button onClick={() => marcarNotificacaoNaoLida(n.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                  style={{ background: "#1e335630", color: "#74859c", border: "1px solid #1e3356" }}>
                                  <RotateCcw size={11} /> Não lida
                                </button>
                              ) : (
                                <button onClick={() => marcarNotificacaoLida(n.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                  style={{ background: "#10b98115", color: "#10b981", border: "1px solid #10b98130" }}>
                                  <Check size={11} /> Lida
                                </button>
                              )
                            )}

                            {aba === "ativas" && !n.lida && (
                              <button onClick={() => setSnoozeAberto(snoozeAberto === n.id ? null : n.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                style={{ background: "#f59e0b15", color: "#f59e0b", border: "1px solid #f59e0b30" }}>
                                <Clock size={11} /> Lembrar-me mais tarde
                              </button>
                            )}

                            {aba === "ativas" ? (
                              <button onClick={() => arquivarNotificacao(n.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 ml-auto"
                                style={{ background: "#47556915", color: "#64748b", border: "1px solid #47556930" }}>
                                <Archive size={11} /> Arquivar
                              </button>
                            ) : (
                              <>
                                <button onClick={() => marcarNotificacaoNaoLida(n.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                  style={{ background: "#3b82f615", color: "#3b82f6", border: "1px solid #3b82f630" }}>
                                  <RotateCcw size={11} /> Restaurar
                                </button>
                                <button onClick={() => excluirNotificacao(n.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 ml-auto"
                                  style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430" }}>
                                  <Trash2 size={11} /> Excluir
                                </button>
                              </>
                            )}
                          </div>

                          {/* Snooze expandido inline */}
                          {snoozeAberto === n.id && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <span className="text-xs mr-1" style={{ color: "#74859c" }}>Lembrar em:</span>
                              {SNOOZE_OPTS.map((opt) => (
                                <button key={opt.min}
                                  onClick={() => { snoozeNotificacao(n.id, opt.min); setSnoozeAberto(null); }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                                  style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
