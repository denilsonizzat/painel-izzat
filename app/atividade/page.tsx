"use client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { Zap, Activity, Search, X } from "lucide-react";
import BackButton from "@/components/BackButton";
import GraficoSemanal from "@/components/GraficoSemanal";
import RelogioWidget from "@/components/RelogioWidget";

const TIPO_CONFIG = {
  tarefa_concluida: { label: "Tarefa concluída", cor: "#10b981", icon: "✅" },
  rotina_concluida: { label: "Rotina concluída", cor: "#3b82f6", icon: "📋" },
  expectativa_cumprida: { label: "Expectativa cumprida", cor: "#c9a84c", icon: "🎯" },
  xp_ganho: { label: "XP ganho", cor: "#8b5cf6", icon: "⚡" },
  check_in: { label: "Check-in", cor: "#f59e0b", icon: "📍" },
  pomodoro: { label: "Pomodoro", cor: "#ef4444", icon: "🍅" },
} as const;

type FiltroHistorico = "hoje" | "3d" | "7d" | "15d" | "30d" | "90d" | "1a";

const FILTROS_HISTORICO: { id: FiltroHistorico; label: string; dias: number }[] = [
  { id: "hoje", label: "Hoje", dias: 0 },
  { id: "3d", label: "3 dias", dias: 3 },
  { id: "7d", label: "7 dias", dias: 7 },
  { id: "15d", label: "15 dias", dias: 15 },
  { id: "30d", label: "30 dias", dias: 30 },
  { id: "90d", label: "90 dias", dias: 90 },
  { id: "1a", label: "1 ano", dias: 365 },
];

export default function AtividadePage() {
  const router = useRouter();
  const { usuarioAtual, colaboradores, atividadesHoje, historico, historicoAtividades, setStatusOnline } = useAppStore();
  const [ateHora, setAteHora] = useState("18:00");
  const [filtroPessoa, setFiltroPessoa] = useState<string>("eu");
  const [filtroHistorico, setFiltroHistorico] = useState<FiltroHistorico>("7d");
  const [buscaHistorico, setBuscaHistorico] = useState("");

  useEffect(() => {
    if (!usuarioAtual) router.push("/");
  }, [usuarioAtual, router]);

  useEffect(() => {
    const pessoa = colaboradores.find((c) => c.id === usuarioAtual?.id);
    if (pessoa?.statusOnline?.ate) setAteHora(pessoa.statusOnline.ate);
    else if (pessoa?.horarioFim) setAteHora(pessoa.horarioFim);
  }, []);

  if (!usuarioAtual) return null;

  const isAdmin = usuarioAtual.nivelAcesso === "admin";
  const colabSelecionadoId = filtroPessoa === "eu" ? usuarioAtual.id : filtroPessoa;
  const pessoa = colaboradores.find((c) => c.id === colabSelecionadoId) ?? usuarioAtual;
  const isOnline = (colaboradores.find((c) => c.id === usuarioAtual.id) ?? usuarioAtual).statusOnline?.ativo ?? false;
  const hoje = new Date().toISOString().split("T")[0];
  const hojeLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const horaAtual = new Date().toTimeString().slice(0, 5);

  const startH = parseInt((pessoa.horarioInicio ?? "09:00").split(":")[0]);
  const endH = parseInt((pessoa.horarioFim ?? "18:00").split(":")[0]);

  const atividadesDaPessoa = atividadesHoje.filter((a) => a.colaboradorId === colabSelecionadoId && a.data === hoje);

  const slots: { hora: string; atividades: typeof atividadesHoje }[] = [];
  for (let h = startH; h <= endH; h++) {
    const horaStr = h.toString().padStart(2, "0") + ":00";
    const horaFimStr = (h + 1).toString().padStart(2, "0") + ":00";
    const ativs = atividadesHoje.filter(
      (a) => a.colaboradorId === colabSelecionadoId && a.data === hoje && a.hora >= horaStr && a.hora < horaFimStr
    );
    slots.push({ hora: horaStr, atividades: ativs });
  }

  const totalXPHoje = atividadesDaPessoa.reduce((sum, a) => sum + (a.xp ?? 0), 0);

  const filtroSelecionado = FILTROS_HISTORICO.find((f) => f.id === filtroHistorico)!;
  const hoje2 = new Date().toISOString().split("T")[0];
  const limiteData = (() => {
    if (filtroHistorico === "hoje") return hoje2;
    const d = new Date();
    d.setDate(d.getDate() - filtroSelecionado.dias);
    return d.toISOString().split("T")[0];
  })();
  const atividadesHistorico = historicoAtividades
    .filter((a) => a.colaboradorId === colabSelecionadoId)
    .filter((a) => filtroHistorico === "hoje" ? a.data === hoje2 : a.data >= limiteData)
    .filter((a) => !buscaHistorico.trim() || a.descricao.toLowerCase().includes(buscaHistorico.toLowerCase()) || (TIPO_CONFIG[a.tipo]?.label || "").toLowerCase().includes(buscaHistorico.toLowerCase()))
    .sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora));
  const totalXPHistorico = atividadesHistorico.reduce((s, a) => s + (a.xp ?? 0), 0);

  const handleToggle = () => {
    if (isOnline) {
      setStatusOnline(usuarioAtual.id, false);
    } else {
      setStatusOnline(usuarioAtual.id, true, ateHora);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton href="/dashboard" />

      <RelogioWidget />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Minha Atividade</h1>
          <p className="text-sm mt-1" style={{ color: "#9aa7ba" }}>
            {"Tudo que você fez hoje — tarefas, rotinas, check-ins e pontos ganhos"}
          </p>
          <p className="text-xs mt-0.5 capitalize" style={{ color: "#74859c" }}>{hojeLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {totalXPHoje > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "#8b5cf620", border: "1px solid #8b5cf630" }}>
              <Zap size={14} style={{ color: "#8b5cf6" }} />
              <span className="text-sm font-bold" style={{ color: "#8b5cf6" }}>+{totalXPHoje} XP hoje</span>
            </div>
          )}
          {isAdmin && (
            <div className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "#c9a84c20", color: "#c9a84c", border: "1px solid #c9a84c30" }}>
              GESTOR
            </div>
          )}
        </div>
      </div>

      {/* Guia rapido */}
      {atividadesDaPessoa.length === 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-start gap-3">
            <div className="text-2xl">📊</div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Nenhuma atividade registrada hoje</p>
              <p className="text-xs" style={{ color: "#9aa7ba" }}>
                {"Suas ações aparecem aqui automaticamente: ao concluir tarefas, marcar rotinas, fazer check-in ou completar um Pomodoro. Comece por qualquer uma dessas ações!"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Online — Circuit Breaker */}
      <div className="rounded-2xl p-6" style={{ background: "#112239", border: `1px solid ${isOnline ? "#10b98130" : "#1e3356"}` }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9aa7ba" }}>
              Status de Presença
            </p>
            <h2 className="text-xl font-bold" style={{ color: isOnline ? "#10b981" : "#94a3b8" }}>
              {isOnline ? "Online Agora" : "Offline"}
            </h2>
            {isOnline && (colaboradores.find((c) => c.id === usuarioAtual.id) ?? usuarioAtual).statusOnline?.desde && (
              <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>
                Desde {(colaboradores.find((c) => c.id === usuarioAtual.id) ?? usuarioAtual).statusOnline!.desde}
                {(colaboradores.find((c) => c.id === usuarioAtual.id) ?? usuarioAtual).statusOnline?.ate
                  ? " · até " + (colaboradores.find((c) => c.id === usuarioAtual.id) ?? usuarioAtual).statusOnline!.ate
                  : ""}
              </p>
            )}
          </div>

          {/* Toggle button — circuit breaker style */}
          <button
            onClick={handleToggle}
            className="relative flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
            style={{ width: 72, height: 38 }}
            data-tip={isOnline ? "Clique para ficar offline" : "Clique para ficar online"}
          >
            <div
              className="w-full h-full rounded-full transition-all duration-300"
              style={{ background: isOnline ? "#10b981" : "#334155" }}
            >
              <div
                className="absolute top-1 w-8 h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
                style={{ left: isOnline ? "calc(100% - 36px)" : "4px", background: "white" }}
              >
                <Zap size={14} style={{ color: isOnline ? "#10b981" : "#64748b" }} />
              </div>
            </div>
          </button>
        </div>

        {isOnline ? (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "#10b98110" }}>
            <p className="text-sm" style={{ color: "#9aa7ba" }}>Disponível até:</p>
            <input
              type="time"
              value={ateHora}
              onChange={(e) => {
                setAteHora(e.target.value);
                setStatusOnline(usuarioAtual.id, true, e.target.value);
              }}
              className="text-sm font-bold px-3 py-1.5 rounded-xl outline-none"
              style={{ background: "#112239", color: "#10b981", border: "1px solid #10b98130", colorScheme: "dark" }}
            />
            <p className="text-xs" style={{ color: "#74859c" }}>Sua equipe verá que você está disponível</p>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <p className="text-sm" style={{ color: "#9aa7ba" }}>Ficarei online até:</p>
            <input
              type="time"
              value={ateHora}
              onChange={(e) => setAteHora(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-xl outline-none"
              style={{ background: "#1e3356", color: "#e8edf5", border: "1px solid #334155", colorScheme: "dark" }}
            />
            <button
              onClick={handleToggle}
              className="text-sm px-4 py-1.5 rounded-xl font-bold transition-opacity hover:opacity-80"
              style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98130" }}
            >
              Ativar
            </button>
          </div>
        )}
      </div>

      {/* Equipe — status online com horário */}
      <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9aa7ba" }}>
            Equipe &mdash;{" "}
            {colaboradores.filter((c) => c.statusOnline?.ativo && c.id !== usuarioAtual.id).length} online agora
          </p>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#74859c" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#10b981" }} /> Online</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#f97316" }} /> Foco</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "#334155" }} /> Offline</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-5">
          {colaboradores
            .filter((c) => c.id !== usuarioAtual.id)
            .sort((a, b) => (b.statusOnline?.ativo ? 1 : 0) - (a.statusOnline?.ativo ? 1 : 0))
            .map((c) => {
              const online = c.statusOnline?.ativo ?? false;
              const emFoco = online && (c.statusOnline?.foco ?? false);
              const dotColor = online ? (emFoco ? "#f97316" : "#10b981") : "#334155";
              const sinceColor = emFoco ? "#f97316" : "#10b981";
              return (
                <Link key={c.id} href={`/equipe/${c.id}`} className="flex flex-col items-center gap-1 hover:opacity-80">
                  <div className="relative">
                    <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={44} />
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                      style={{ background: dotColor, borderColor: "#112239" }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: online ? "#e8edf5" : "#475569" }}>
                    {c.nome.split(" ")[0]}{emFoco ? " 🎯" : ""}
                  </span>
                  {online && c.statusOnline?.trabalhando && (
                    <p className="text-xs mt-0.5 text-center" style={{ color: "#9aa7ba" }}>
                      {c.statusOnline.trabalhando}
                    </p>
                  )}
                  {online && c.statusOnline?.desde && (
                    <span className="text-xs font-medium" style={{ color: sinceColor }}>
                      desde {c.statusOnline.desde}
                    </span>
                  )}
                  {online && c.statusOnline?.ate && (
                    <span className="text-xs" style={{ color: "#9aa7ba" }}>
                      até {c.statusOnline.ate}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>
      </div>

      {/* Gráfico comparativo semanal */}
      <GraficoSemanal historico={historico} colaboradorId={colabSelecionadoId} />

      {/* Filtro de pessoa (admin pode ver qualquer um) */}
      {isAdmin && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9aa7ba" }}>Ver atividade de:</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroPessoa("eu")}
              data-tip="Ver só a sua atividade"
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: filtroPessoa === "eu" ? "#c9a84c" : "#112239",
                color: filtroPessoa === "eu" ? "#0b1624" : "#64748b",
                border: `1px solid ${filtroPessoa === "eu" ? "#c9a84c" : "#1e3356"}`,
              }}
            >
              Minha
            </button>
            {colaboradores
              .filter((c) => c.id !== usuarioAtual.id)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFiltroPessoa(c.id)}
                  data-tip={`Ver a atividade de ${c.nome.split(" ")[0]}`}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: filtroPessoa === c.id ? c.cor : "#112239",
                    color: filtroPessoa === c.id ? "#0b1624" : "#64748b",
                    border: `1px solid ${filtroPessoa === c.id ? c.cor : "#1e3356"}`,
                  }}
                >
                  {c.nome.split(" ")[0]}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Historico de Atividades */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} style={{ color: "#c9a84c" }} />
            <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>{"Histórico de Atividades"}</p>
            {totalXPHistorico > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#8b5cf620", color: "#8b5cf6" }}>
                +{totalXPHistorico} XP
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: "#74859c" }}>{atividadesHistorico.length} registros</span>
        </div>

        {/* Filtros periodo */}
        <div className="flex gap-2 flex-wrap">
          {FILTROS_HISTORICO.map((f) => (
            <button key={f.id} onClick={() => setFiltroHistorico(f.id)}
              data-tip={`Filtrar atividades: ${f.label}`}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: filtroHistorico === f.id ? "#c9a84c" : "#1e3356",
                color: filtroHistorico === f.id ? "#0b1624" : "#64748b",
                border: `1px solid ${filtroHistorico === f.id ? "#c9a84c" : "#334155"}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#1e3356", border: "1px solid #334155" }}>
          <Search size={13} style={{ color: "#9aa7ba" }} />
          <input
            value={buscaHistorico}
            onChange={(e) => setBuscaHistorico(e.target.value)}
            placeholder="Buscar atividades..."
            className="bg-transparent text-sm outline-none flex-1"
            style={{ color: "#e8edf5" }}
          />
          {buscaHistorico && (
            <button onClick={() => setBuscaHistorico("")}><X size={12} style={{ color: "#9aa7ba" }} /></button>
          )}
        </div>

        {/* Lista */}
        {atividadesHistorico.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm font-medium text-white mb-1">Nenhuma atividade no periodo</p>
            <p className="text-xs" style={{ color: "#9aa7ba" }}>
              {buscaHistorico.trim()
                ? "Tente outro termo de busca ou mude o filtro de periodo"
                : "Atividades aparecem aqui conforme a pessoa completa acoes na plataforma"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(() => {
              let ultimaData = "";
              return atividadesHistorico.map((a) => {
                const cfg = TIPO_CONFIG[a.tipo] ?? { label: a.tipo, cor: "#64748b", icon: "•" };
                const mostrarData = a.data !== ultimaData;
                ultimaData = a.data;
                return (
                  <div key={a.id}>
                    {mostrarData && (
                      <p className="text-xs font-semibold mt-3 mb-1 px-1" style={{ color: "#74859c" }}>
                        {a.data === hoje2 ? "Hoje" : new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    )}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "#1e3356" }}>
                      <span className="text-base flex-shrink-0">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold" style={{ color: cfg.cor }}>{cfg.label}</span>
                          <span className="text-xs font-mono" style={{ color: "#74859c" }}>{a.hora}</span>
                        </div>
                        <p className="text-xs leading-snug truncate" style={{ color: "#94a3b8" }}>{a.descricao}</p>
                      </div>
                      {a.xp != null && a.xp > 0 && (
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: "#8b5cf6" }}>+{a.xp}</span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Activity size={16} style={{ color: "#c9a84c" }} />
          <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>
            Linha do Tempo — {pessoa.horarioInicio ?? "09:00"} até {pessoa.horarioFim ?? "18:00"}
            {filtroPessoa !== "eu" && (
              <span style={{ color: "#9aa7ba" }}> · {pessoa.nome.split(" ")[0]}</span>
            )}
          </p>
        </div>

        {atividadesDaPessoa.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
          >
            <p className="text-3xl mb-3">⚡</p>
            <p className="font-semibold text-white mb-1">Nenhuma atividade hoje ainda</p>
            <p className="text-sm" style={{ color: "#9aa7ba" }}>
              Complete rotinas, tarefas ou expectativas para registrar atividades.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {slots.map(({ hora, atividades }) => {
              const h = parseInt(hora.split(":")[0]);
              const horaFimSlot = (h + 1).toString().padStart(2, "0") + ":00";
              const isNow = filtroPessoa === "eu" && horaAtual >= hora && horaAtual < horaFimSlot;
              const isPast = horaAtual >= horaFimSlot;
              return (
                <div key={hora} className="flex gap-4 min-h-12">
                  <div className="w-14 text-right flex-shrink-0 pt-3">
                    <span
                      className="text-xs font-mono"
                      style={{ color: isNow ? "#c9a84c" : atividades.length > 0 ? "#94a3b8" : "#1e3356" }}
                    >
                      {hora}
                    </span>
                  </div>
                  <div className="flex-1 relative pb-3">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-px"
                      style={{ background: isNow ? "#c9a84c40" : atividades.length > 0 ? "#1e3356" : "#112239" }}
                    />
                    <div className="ml-5">
                      {isNow && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: "#c9a84c", boxShadow: "0 0 6px #c9a84c80" }} />
                          <span className="text-xs font-medium" style={{ color: "#c9a84c" }}>Agora — {horaAtual}</span>
                        </div>
                      )}
                      {atividades.map((a) => {
                        const cfg = TIPO_CONFIG[a.tipo] ?? { label: a.tipo, cor: "#64748b", icon: "•" };
                        return (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 p-3 rounded-xl mb-2"
                            style={{ background: cfg.cor + "15", border: `1px solid ${cfg.cor}25` }}
                          >
                            <span className="text-lg flex-shrink-0 leading-none mt-0.5">{cfg.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-semibold" style={{ color: cfg.cor }}>{cfg.label}</p>
                                <span className="text-xs font-mono" style={{ color: "#9aa7ba" }}>
                                  {a.hora}{a.horaFim ? ` → ${a.horaFim}` : ""}
                                </span>
                                {a.xp != null && a.xp > 0 && (
                                  <span className="text-xs font-bold" style={{ color: "#8b5cf6" }}>+{a.xp} XP</span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5 leading-snug" style={{ color: "#94a3b8" }}>{a.descricao}</p>
                            </div>
                          </div>
                        );
                      })}
                      {!isNow && atividades.length === 0 && isPast && (
                        <div className="h-8 flex items-center">
                          <span className="text-xs" style={{ color: "#1e3356" }}>—</span>
                        </div>
                      )}
                      {!isNow && atividades.length === 0 && !isPast && (
                        <div className="h-8" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
