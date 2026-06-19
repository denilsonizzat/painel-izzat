"use client";
import { useAppStore } from "@/lib/store";
import { LOJAS, calcNivel, semanaAtualKey } from "@/lib/data";
import { rotinasDoColaborador } from "@/lib/recorrencia";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Flame, Zap, Star, Plus, AlertTriangle, Clock, Trash2, X, Moon, Sun } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useState, useEffect } from "react";

function Particle({ style }: { style: React.CSSProperties }) {
  return <div className="absolute rounded-full pointer-events-none" style={{ width: 8, height: 8, ...style }} />;
}

export default function MeuDiaPage() {
  const { usuarioAtual, rotinas: rotinasStore, tarefas, entregasSemanais, marcarSubtarefa, concluirRotina, reabrirRotina, atualizarStatusTarefa, adicionarComentario, registrarCheckIn, criarEntregaSemanal, atualizarStatusEntrega, deletarEntregaSemanal, abrirPomodoro, registrarSono } = useAppStore();
  const [expandidas, setExpandidas] = useState<string[]>([]);
  const [comentandoId, setComentandoId] = useState<string | null>(null);
  const [textoComentario, setTextoComentario] = useState("");
  const [showAddEntrega, setShowAddEntrega] = useState(false);
  const [novaEntrega, setNovaEntrega] = useState("");
  const [travandoId, setTravandoId] = useState<string | null>(null);
  const [motivoTravado, setMotivoTravado] = useState("");
  const [celebrando, setCelebrando] = useState(false);
  const [xpFlash, setXpFlash] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSonoPopup, setShowSonoPopup] = useState(false);
  const [sonoDormir, setSonoDormir] = useState("23:00");
  const [sonoAcordar, setSonoAcordar] = useState("07:00");
  const [sonoSalvo, setSonoSalvo] = useState(false);
  const [sonoDismissed, setSonoDismissed] = useState(false);

  if (!usuarioAtual) return null;

  const hoje_ = new Date().toISOString().split("T")[0];
  const temSonoHoje = (usuarioAtual.registrosSono || []).some((r) => r.data === hoje_);

  const rotinas = rotinasDoColaborador(rotinasStore, usuarioAtual.id);
  const minhasTarefas = tarefas.filter((t) => t.atribuidoPara === usuarioAtual.id && t.status !== "concluida");
  const minhasEntregas = entregasSemanais.filter((e) => e.colaboradorId === usuarioAtual.id && e.semana === semanaAtualKey());

  const totalSubs = rotinas.reduce((acc, r) => acc + r.subtarefas.length, 0);
  const feitas = rotinas.reduce((acc, r) => acc + r.subtarefas.filter((s) => s.concluida).length, 0);
  const pct = totalSubs === 0 ? (rotinas.every((r) => r.concluida) ? 100 : 0) : Math.round((feitas / totalSubs) * 100);

  const nivelInfo = calcNivel(usuarioAtual.xp || 0);
  const streak = usuarioAtual.streak || 0;

  const todasConcluidas = rotinas.length > 0 && rotinas.every((r) => r.concluida);

  const toggle = (id: string) =>
    setExpandidas((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSubtarefa = (rotinaId: string, subId: string, concluida: boolean, valor: boolean) => {
    marcarSubtarefa(rotinaId, subId, valor);
    if (valor && !concluida) {
      setXpFlash(10);
      setTimeout(() => setXpFlash(null), 1500);
    }
  };

  const handleConcluirTarefa = (tarefaId: string) => {
    atualizarStatusTarefa(tarefaId, "concluida");
    setXpFlash(30);
    setTimeout(() => setXpFlash(null), 1500);
  };

  useEffect(() => {
    if (pct === 100 && !celebrando) {
      setCelebrando(true);
      registrarCheckIn(usuarioAtual.id);
    }
  }, [pct]);

  useEffect(() => {
    if (todasConcluidas) {
      const timer = setTimeout(() => setShowCelebration(true), 300);
      return () => clearTimeout(timer);
    }
  }, [todasConcluidas]);

  useEffect(() => {
    const dismissed = localStorage.getItem("sono-popup-dismissed");
    const hoje = new Date().toISOString().split("T")[0];
    setSonoDismissed(dismissed === hoje);
  }, []);

  const prioridadeCor: Record<string, string> = { alta: "#ef4444", media: "#f59e0b", baixa: "#64748b" };

  function calcMinutosSono(dormir: string, acordar: string): number {
    const [hd, md] = dormir.split(":").map(Number);
    const [ha, ma] = acordar.split(":").map(Number);
    let minD = hd * 60 + md;
    let minA = ha * 60 + ma;
    if (minA <= minD) minA += 1440;
    return minA - minD;
  }

  function fmtSono(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  function corSono(min: number): string {
    if (min >= 420 && min <= 540) return "#10b981";
    if (min >= 360) return "#f59e0b";
    return "#ef4444";
  }

  function handleSalvarSono() {
    if (!sonoDormir || !sonoAcordar) return;
    registrarSono(usuarioAtual!.id, { data: hoje_, horaDormir: sonoDormir, horaAcordar: sonoAcordar });
    setSonoSalvo(true);
    setSonoDismissed(true);
    localStorage.setItem("sono-popup-dismissed", hoje_);
    setTimeout(() => { setSonoSalvo(false); setShowSonoPopup(false); }, 1600);
  }

  function dispensarSonoPopup() {
    localStorage.setItem("sono-popup-dismissed", hoje_);
    setSonoDismissed(true);
    setShowSonoPopup(false);
  }

  const particulas = Array.from({ length: 18 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 60}%`,
    background: ["#c9a84c", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"][i % 5],
    animationDelay: `${Math.random() * 0.5}s`,
    animation: celebrando ? "particleFall 1.5s ease-out forwards" : "none",
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      <BackButton href="/dashboard" />
      <style>{`
        @keyframes particleFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(200px) rotate(720deg); opacity: 0; }
        }
        @keyframes xpPop {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
        }
        @keyframes pulse100 {
          0%, 100% { box-shadow: 0 0 0 0 #10b98140; }
          50% { box-shadow: 0 0 0 12px #10b98100; }
        }
      `}</style>

      {/* Particulas de celebracao */}
      {celebrando && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particulas.map((p, i) => <Particle key={i} style={p} />)}
        </div>
      )}

      {/* XP flash */}
      {xpFlash && (
        <div className="fixed top-20 right-6 z-50 pointer-events-none font-bold text-lg" style={{ color: "#c9a84c", animation: "xpPop 1.5s ease-out forwards" }}>
          +{xpFlash} XP
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite"}, {usuarioAtual.nome.split(" ")[0]} ☀️
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="text-xs mt-1" style={{ color: "#74859c" }}>
            Marque suas rotinas, registre atividades e acompanhe suas entregas
          </p>
        </div>
        {/* Streak + XP */}
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "#f59e0b15", border: "1px solid #f59e0b30" }} data-tip={"Streak: " + streak + " dias seguidos de check-in. Mantenha a sequencia!"}>
              <Flame size={14} style={{ color: "#f59e0b" }} />
              <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{streak}d</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: `${nivelInfo.cor}15`, border: `1px solid ${nivelInfo.cor}30` }} data-tip={"Nivel atual: " + nivelInfo.nome + " · " + (usuarioAtual.xp || 0) + " XP"}>
            <Zap size={14} style={{ color: nivelInfo.cor }} />
            <span className="text-sm font-bold" style={{ color: nivelInfo.cor }}>{nivelInfo.nome}</span>
          </div>
        </div>
      </div>

      {/* Sono banner — inline, nao invasivo */}
      {!temSonoHoje && !sonoDismissed && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#8b5cf615", border: "1px solid #8b5cf630" }}>
          <Moon size={14} style={{ color: "#8b5cf6" }} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-white">{"Como você dormiu?"}</span>
            <span className="text-xs ml-2" style={{ color: "#9aa7ba" }}>{"Registre seu sono de ontem"}</span>
          </div>
          <button
            onClick={() => setShowSonoPopup(true)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-semibold hover:opacity-80"
            style={{ background: "#8b5cf6", color: "white" }}
          >
            Registrar
          </button>
          <button onClick={dispensarSonoPopup} className="flex-shrink-0" style={{ color: "#74859c" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* XP e nivel */}
      <div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2" data-tip="XP = pontos de experiencia ganhos ao concluir rotinas, tarefas e check-ins diarios">
            <Zap size={16} style={{ color: nivelInfo.cor }} />
            <span className="text-sm font-semibold text-white">{nivelInfo.xp} XP</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: nivelInfo.cor + "20", color: nivelInfo.cor }}>{nivelInfo.nome}</span>
          </div>
          {nivelInfo.proximo ? (
            <span className="text-xs" style={{ color: "#9aa7ba" }}>
              {nivelInfo.proximo.xpMin - nivelInfo.xp} XP para {nivelInfo.proximo.nome}
            </span>
          ) : (
            <span className="text-xs" style={{ color: "#c9a84c" }}>Nível máximo!</span>
          )}
        </div>
        {nivelInfo.proximo && (
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${nivelInfo.progresso}%`, background: `linear-gradient(90deg, ${nivelInfo.cor}, ${nivelInfo.proximo.cor})` }} />
          </div>
        )}
      </div>

      {/* Progresso geral */}
      <div className="rounded-2xl p-5" style={{
        background: "#122039",
        border: "1px solid #1e3356",
        animation: pct === 100 ? "pulse100 2s ease-in-out 3" : "none",
      }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold">Rotinas de hoje</p>
            <p className="text-sm" style={{ color: "#9aa7ba" }}>{feitas} de {totalSubs} subtarefas concluidas</p>
          </div>
          <p className="text-3xl font-bold" style={{ color: pct === 100 ? "#10b981" : "#c9a84c" }}>{pct}%</p>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "linear-gradient(90deg, #c9a84c, #e0b85a)" }}
          />
        </div>
        {pct === 100 && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: "#10b98115" }}>
            <Star size={18} style={{ color: "#10b981" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#10b981" }}>Dia concluido! +50 XP bonus</p>
              <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>Streak mantido: {streak} dias consecutivos</p>
            </div>
          </div>
        )}
      </div>

      {/* Entregas da Semana */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#10b98110", border: "1px solid #10b98125", borderLeft: "3px solid #10b981" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>ENTREGAS DA SEMANA</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#10b98120", color: "#10b981" }}>Compromissos ate sexta</span>
            </div>
            <p className="text-xs" style={{ color: "#74859c" }}>
              O que voce se comprometeu a entregar esta semana. Registre e atualize o status.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {minhasEntregas.length > 0 && (
              <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: "#10b98120", color: "#10b981" }}>
                {minhasEntregas.filter(e => e.status === "entregue").length}/{minhasEntregas.length}
              </span>
            )}
            <button
              onClick={() => setShowAddEntrega(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: "#10b98120", color: "#10b981" }}
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>
        </div>

        {showAddEntrega && (
          <div className="rounded-xl p-3 flex gap-2" style={{ background: "#122039", border: "1px solid #1e3356" }}>
            <input
              autoFocus
              value={novaEntrega}
              onChange={(e) => setNovaEntrega(e.target.value)}
              placeholder="O que você vai entregar esta semana?"
              className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white outline-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && novaEntrega.trim()) {
                  criarEntregaSemanal(usuarioAtual.id, novaEntrega.trim());
                  setNovaEntrega("");
                  setShowAddEntrega(false);
                }
                if (e.key === "Escape") { setShowAddEntrega(false); setNovaEntrega(""); }
              }}
            />
            <button
              onClick={() => {
                if (novaEntrega.trim()) {
                  criarEntregaSemanal(usuarioAtual.id, novaEntrega.trim());
                  setNovaEntrega("");
                  setShowAddEntrega(false);
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#c9a84c", color: "#0b1624" }}
            >
              OK
            </button>
            <button onClick={() => { setShowAddEntrega(false); setNovaEntrega(""); }} className="px-2 py-1.5 rounded-lg" style={{ color: "#9aa7ba" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {minhasEntregas.length === 0 && !showAddEntrega && (
          <div className="rounded-2xl p-5 text-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
            <div className="text-2xl mb-2">📦</div>
            <p className="text-sm font-medium" style={{ color: "#74859c" }}>Nenhuma entrega desta semana ainda</p>
            <p className="text-xs mt-1 mb-3" style={{ color: "#334155" }}>
              Registre o que voce se compromete a entregar ate sexta-feira.
            </p>
            <button
              onClick={() => setShowAddEntrega(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
              style={{ background: "#c9a84c20", color: "#c9a84c" }}
            >
              + Adicionar entrega
            </button>
          </div>
        )}

        {minhasEntregas.map((e) => (
          <div key={e.id} className="rounded-2xl p-3" style={{ background: "#122039", border: `1px solid ${e.status === "travado" ? "#ef444440" : "#1e3356"}` }}>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                {e.status === "entregue" && <CheckCircle2 size={16} style={{ color: "#10b981" }} />}
                {e.status === "em_andamento" && <Clock size={16} style={{ color: "#3b82f6" }} />}
                {e.status === "travado" && <AlertTriangle size={16} style={{ color: "#ef4444" }} />}
                {e.status === "pendente" && <Circle size={16} style={{ color: "#9aa7ba" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: e.status === "entregue" ? "#64748b" : e.status === "travado" ? "#ef4444" : "#e8edf5", textDecoration: e.status === "entregue" ? "line-through" : "none" }}>
                  {e.titulo}
                </p>
                {e.status === "travado" && e.motivoTravado && (
                  <p className="text-xs mt-0.5" style={{ color: "#ef444480" }}>{e.motivoTravado}</p>
                )}
                {travandoId === e.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      autoFocus
                      value={motivoTravado}
                      onChange={(ev) => setMotivoTravado(ev.target.value)}
                      placeholder="Por que está travado? (opcional)"
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                      style={{ background: "#1e3356", border: "1px solid #ef444440" }}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") {
                          atualizarStatusEntrega(e.id, "travado", motivoTravado || undefined);
                          setTravandoId(null);
                          setMotivoTravado("");
                        }
                        if (ev.key === "Escape") { setTravandoId(null); setMotivoTravado(""); }
                      }}
                    />
                    <button
                      onClick={() => { atualizarStatusEntrega(e.id, "travado", motivoTravado || undefined); setTravandoId(null); setMotivoTravado(""); }}
                      className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ background: "#ef444420", color: "#ef4444" }}
                    >
                      Confirmar
                    </button>
                    <button onClick={() => { setTravandoId(null); setMotivoTravado(""); }} className="px-2 py-1 rounded-lg" style={{ color: "#9aa7ba" }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {e.status === "pendente" && (
                  <button onClick={() => atualizarStatusEntrega(e.id, "em_andamento")} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#3b82f615", color: "#3b82f6" }}>
                    Iniciar
                  </button>
                )}
                {e.status === "em_andamento" && travandoId !== e.id && (
                  <>
                    <button onClick={() => atualizarStatusEntrega(e.id, "entregue")} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#10b98115", color: "#10b981" }}>
                      Entregar
                    </button>
                    <button onClick={() => setTravandoId(e.id)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#ef444415", color: "#ef4444" }}>
                      Travado
                    </button>
                  </>
                )}
                {e.status === "travado" && travandoId !== e.id && (
                  <button onClick={() => atualizarStatusEntrega(e.id, "em_andamento")} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#3b82f615", color: "#3b82f6" }}>
                    Retomar
                  </button>
                )}
                <button onClick={() => deletarEntregaSemanal(e.id)} className="p-1 rounded-lg ml-0.5" style={{ color: "#334155" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rotinas */}
      {rotinas.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-white mb-1">Nenhuma rotina cadastrada ainda</p>
          <p className="text-sm leading-relaxed" style={{ color: "#9aa7ba" }}>
            Rotinas sao tarefas que voce repete todo dia — por exemplo: verificar pedidos, responder mensagens, atualizar planilha. Seu gestor vai cadastrar as suas.
          </p>
        </div>
      )}
      {rotinas.length > 0 && (
        <div className="space-y-3">
          {/* Header visual — ROTINAS */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#0ea5e910", border: "1px solid #0ea5e925", borderLeft: "3px solid #0ea5e9" }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0ea5e9" }}>ROTINAS</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#0ea5e920", color: "#0ea5e9" }}>O minimo de hoje</span>
              </div>
              <p className="text-xs" style={{ color: "#74859c" }}>
                Habitos diarios — o que se espera de voce todo dia. Complete todas para +50 XP bonus.
              </p>
            </div>
            <span className="text-sm font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: pct === 100 ? "#10b98120" : "#0ea5e915", color: pct === 100 ? "#10b981" : "#0ea5e9" }}>
              {feitas}/{totalSubs}
            </span>
          </div>
          {rotinas.map((rotina) => {
            const aberta = expandidas.includes(rotina.id);
            const loja = LOJAS.find((l) => l.id === rotina.lojaId);
            const subFeitas = rotina.subtarefas.filter((s) => s.concluida).length;
            return (
              <div key={rotina.id} className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: `1px solid ${rotina.concluida ? "#10b98140" : "#1e3356"}` }}>
                <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => toggle(rotina.id)}>
                  <span
                    role="button"
                    tabIndex={0}
                    className="flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); rotina.concluida ? reabrirRotina(rotina.id) : concluirRotina(rotina.id); }}
                    onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.stopPropagation(); rotina.concluida ? reabrirRotina(rotina.id) : concluirRotina(rotina.id); } }}
                  >
                    {rotina.concluida ? <CheckCircle2 size={22} style={{ color: "#10b981" }} /> : <Circle size={22} style={{ color: "#74859c" }} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm" style={{ textDecoration: rotina.concluida ? "line-through" : "none", opacity: rotina.concluida ? 0.5 : 1 }}>
                      {rotina.titulo}
                    </p>
                    {loja && <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>{loja.nome}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); abrirPomodoro(rotina.id, rotina.titulo); }}
                      className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                      style={{ background: "#ef444415", color: "#ef4444" }}
                      data-tip="Iniciar Pomodoro — sessao de foco cronometrada"
                    >
                      🍅 <span>Foco</span>
                    </button>
                    <span className="text-xs" style={{ color: "#9aa7ba" }}>{subFeitas}/{rotina.subtarefas.length}</span>
                    {aberta ? <ChevronUp size={16} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={16} style={{ color: "#9aa7ba" }} />}
                  </div>
                </button>
                {aberta && rotina.subtarefas.length > 0 && (
                  <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "#1e3356" }}>
                    <div className="pt-3 space-y-2">
                      {rotina.subtarefas.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleSubtarefa(rotina.id, sub.id, sub.concluida, !sub.concluida)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:opacity-80"
                          style={{ background: "#1e3356" }}
                        >
                          {sub.concluida ? <CheckCircle2 size={18} style={{ color: "#10b981" }} /> : <Circle size={18} style={{ color: "#74859c" }} />}
                          <span className="text-sm flex-1" style={{ color: sub.concluida ? "#64748b" : "#e2e8f0", textDecoration: sub.concluida ? "line-through" : "none" }}>
                            {sub.titulo}
                          </span>
                          {!sub.concluida && <span className="text-xs" style={{ color: "#74859c" }}>+10 XP</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tarefas delegadas */}
      {minhasTarefas.length > 0 && (
        <div className="space-y-3">
          {/* Header visual — TAREFAS */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#c9a84c10", border: "1px solid #c9a84c25", borderLeft: "3px solid #c9a84c" }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c9a84c" }}>TAREFAS DELEGADAS</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#c9a84c20", color: "#c9a84c" }}>O que te pediram</span>
              </div>
              <p className="text-xs" style={{ color: "#74859c" }}>
                Atividades avulsas atribuidas pelo gestor. Cada uma concluida vale +30 XP.
              </p>
            </div>
            <span className="text-sm font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#c9a84c20", color: "#c9a84c" }}>
              {minhasTarefas.length}
            </span>
          </div>
          {minhasTarefas.map((t) => {
            const loja = LOJAS.find((l) => l.id === t.lojaId);
            const cor = prioridadeCor[t.prioridade] || "#64748b";
            const comentandoEsta = comentandoId === t.id;
            return (
              <div key={t.id} className="rounded-2xl p-4" style={{ background: "#122039", border: `1px solid ${cor}40` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cor}20`, color: cor }}>
                        {t.prioridade === "alta" ? "Alta" : t.prioridade === "media" ? "Media" : "Baixa"}
                      </span>
                      {loja && <span className="text-xs" style={{ color: "#9aa7ba" }}>{loja.nome}</span>}
                    </div>
                    <p className="text-white font-medium text-sm">{t.titulo}</p>
                    {t.descricao && <p className="text-xs mt-1" style={{ color: "#9aa7ba" }}>{t.descricao}</p>}

                    {/* Comentarios */}
                    {(t.comentarios || []).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(t.comentarios || []).map((c) => (
                          <div key={c.id} className="text-xs p-2 rounded-lg" style={{ background: "#1e3356" }}>
                            <span style={{ color: "#9aa7ba" }}>{c.autorId}: </span>
                            <span style={{ color: "#94a3b8" }}>{c.texto}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input comentario */}
                    {comentandoEsta && (
                      <div className="mt-2 flex gap-2">
                        <input
                          autoFocus
                          value={textoComentario}
                          onChange={(e) => setTextoComentario(e.target.value)}
                          placeholder="Adicionar comentario..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                          style={{ background: "#1e3356", border: "1px solid #334155" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              adicionarComentario(t.id, textoComentario);
                              setTextoComentario("");
                              setComentandoId(null);
                            }
                            if (e.key === "Escape") setComentandoId(null);
                          }}
                        />
                        <button
                          onClick={() => { adicionarComentario(t.id, textoComentario); setTextoComentario(""); setComentandoId(null); }}
                          className="px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ background: "#c9a84c20", color: "#c9a84c" }}
                        >
                          Enviar
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => abrirPomodoro(t.id, t.titulo)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ background: "#ef444415", color: "#ef4444" }}
                      data-tip="Iniciar Pomodoro"
                    >
                      🍅 Iniciar
                    </button>
                    <button
                      onClick={() => handleConcluirTarefa(t.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ background: "#10b98115", color: "#10b981" }}
                    >
                      <CheckCircle2 size={12} /> Concluir
                    </button>
                    <button
                      onClick={() => setComentandoId(comentandoEsta ? null : t.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                      style={{ background: "#1e3356", color: "#9aa7ba" }}
                    >
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popup sono matinal */}
      {showSonoPopup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={dispensarSonoPopup}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#122039", border: "1px solid #8b5cf640" }}
            onClick={(e) => e.stopPropagation()}>
            {sonoSalvo ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#10b98122", border: "2px solid #10b981" }}>
                  <CheckCircle2 size={24} style={{ color: "#10b981" }} />
                </div>
                <p className="text-white font-bold">Sono registrado!</p>
                <p className="text-sm" style={{ color: "#9aa7ba" }}>
                  {fmtSono(calcMinutosSono(sonoDormir, sonoAcordar))} dormidas
                </p>
              </div>
            ) : (
              <>
                <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid #1e3356" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon size={16} style={{ color: "#8b5cf6" }} />
                      <h2 className="font-bold text-white">Como voce dormiu?</h2>
                    </div>
                    <button onClick={dispensarSonoPopup} style={{ color: "#74859c" }}>✕</button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#9aa7ba" }}>Registre agora para acompanhar seu sono ao longo do tempo.</p>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1 block" style={{ color: "#8b5cf6" }}>
                        <Moon size={11} /> Dormiu
                      </label>
                      <input type="time" value={sonoDormir} onChange={(e) => setSonoDormir(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: "#1e3356", border: "1px solid #8b5cf640" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1 block" style={{ color: "#f59e0b" }}>
                        <Sun size={11} /> Acordou
                      </label>
                      <input type="time" value={sonoAcordar} onChange={(e) => setSonoAcordar(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: "#1e3356", border: "1px solid #f59e0b40" }} />
                    </div>
                  </div>
                  {sonoDormir && sonoAcordar && (() => {
                    const m = calcMinutosSono(sonoDormir, sonoAcordar);
                    return (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "#0d1928" }}>
                        <span className="text-sm" style={{ color: "#9aa7ba" }}>Total</span>
                        <span className="text-lg font-black" style={{ color: corSono(m) }}>
                          {fmtSono(m)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="px-5 pb-5 flex gap-2">
                  <button onClick={dispensarSonoPopup}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium hover:opacity-80"
                    style={{ background: "#1e3356", color: "#9aa7ba" }}>
                    Agora nao
                  </button>
                  <button onClick={handleSalvarSono}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"
                    style={{ background: "#8b5cf6", color: "white" }}>
                    Salvar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showCelebration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "#0b162499" }}
          onClick={() => setShowCelebration(false)}
        >
          <div className="text-center space-y-4 px-8 py-10 rounded-3xl"
            style={{ background: "#122039", border: "2px solid #c9a84c40" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-7xl animate-bounce">🏆</div>
            <p className="text-3xl font-black text-white">100% concluído!</p>
            <p className="text-base" style={{ color: "#c9a84c" }}>
              Todas as rotinas do dia feitas!
            </p>
            <p className="text-sm" style={{ color: "#9aa7ba" }}>
              Faça o check-in para registrar e ganhar XP bônus.
            </p>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-2 px-8 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "#c9a84c", color: "#0b1624" }}
            >
              Continuar 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
