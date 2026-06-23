"use client";
import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { X, Play, Pause, SkipForward, Square, ChevronDown, CheckCircle2, Circle, RotateCcw, GripHorizontal } from "lucide-react";

type Fase = "trabalho" | "descanso";

interface Config {
  minutos: number;
  minutosDescanso: number;
  sessoes: number;
}

interface AtividadeSelecionada {
  tipo: "tarefa" | "rotina";
  id: string;
  titulo: string;
}

function Ampulheta({ pct, cor }: { pct: number; cor: string }) {
  const W = 100, H = 160, cx = 50;
  const topY1 = 8, topY2 = 70, botY1 = 90, botY2 = 152;
  const wide = 42, narrow = 7;
  const topPts = `${cx-wide},${topY1} ${cx+wide},${topY1} ${cx+narrow},${topY2} ${cx-narrow},${topY2}`;
  const botPts = `${cx-narrow},${botY1} ${cx+narrow},${botY1} ${cx+wide},${botY2} ${cx-wide},${botY2}`;
  const topH = topY2 - topY1, botH = botY2 - botY1;
  const topSandH = topH * (1 - pct), botSandH = botH * pct;
  const isFlowing = pct > 0.01 && pct < 0.99;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 86, height: 138 }}>
      <defs>
        <clipPath id="amp-top-c"><polygon points={topPts} /></clipPath>
        <clipPath id="amp-bot-c"><polygon points={botPts} /></clipPath>
      </defs>
      <polygon points={topPts} fill="#1e3356" stroke="#334155" strokeWidth="1.5" />
      <polygon points={botPts} fill="#1e3356" stroke="#334155" strokeWidth="1.5" />
      <rect x={cx-4} y={topY2} width={8} height={botY1-topY2} fill="#334155" />
      <rect x={0} y={topY2-topSandH} width={W} height={topSandH} fill={cor} opacity="0.72" clipPath="url(#amp-top-c)" />
      <rect x={0} y={botY2-botSandH} width={W} height={botSandH} fill={cor} opacity="0.72" clipPath="url(#amp-bot-c)" />
      {isFlowing && [0, 0.45, 0.9].map((delay, i) => (
        <circle key={i} cx={cx} cy={topY2} r={2} fill={cor} opacity={0}>
          <animate attributeName="cy" from={`${topY2+2}`} to={`${botY1-2}`} dur="1.35s" begin={`${delay}s`} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1" />
          <animate attributeName="opacity" values="0;0.95;0.85;0" keyTimes="0;0.08;0.82;1" dur="1.35s" begin={`${delay}s`} repeatCount="indefinite" />
          <animate attributeName="r" values="1.5;2.5;2;0.8" keyTimes="0;0.2;0.75;1" dur="1.35s" begin={`${delay}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function SessaoDots({ total, atual, fase }: { total: number; atual: number; fase: Fase }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="rounded-full transition-all" style={{
          width: i === atual-1 ? 10 : 7, height: i === atual-1 ? 10 : 7,
          background: i < atual-1 ? "#10b981" : i === atual-1 ? (fase === "trabalho" ? "#ef4444" : "#3b82f6") : "#334155",
        }} />
      ))}
    </div>
  );
}

export default function FloatingPomodoro() {
  const { pomodoroAberto, pomodoroTarefaTitulo, fecharPomodoro, adicionarAtividadeEntry, ganharXP, addToast, usuarioAtual, colaboradores, tarefas } = useAppStore();

  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<"config" | "ativo">("config");
  const [config, setConfig] = useState<Config>({ minutos: 25, minutosDescanso: 5, sessoes: 4 });
  const [fase, setFase] = useState<Fase>("trabalho");
  const [sessao, setSessao] = useState(1);
  const [segundos, setSegundos] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [iniciouEm, setIniciouEm] = useState("");
  const [titulo, setTitulo] = useState("");
  const [atividadeSel, setAtividadeSel] = useState<AtividadeSelecionada | null>(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ ox: number; oy: number } | null>(null);
  const configRef = useRef(config);
  const tituloRef = useRef(titulo);
  const iniciouEmRef = useRef(iniciouEm);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { tituloRef.current = titulo; }, [titulo]);
  useEffect(() => { iniciouEmRef.current = iniciouEm; }, [iniciouEm]);

  useEffect(() => {
    if (pos.x === 0 && pos.y === 0 && typeof window !== "undefined") {
      setPos({ x: Math.max(12, window.innerWidth - 320 - 144), y: Math.max(64, window.innerHeight - 600) });
    }
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos({ x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - drag.current.ox)), y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - drag.current.oy)) });
  }
  function onPointerUp() { drag.current = null; }

  function tocarSom(tipo: "fim" | "inicio") {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      if (tipo === "fim") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.18);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.36);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.9);
      } else {
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  }

  const totalSegundos = fase === "trabalho" ? config.minutos * 60 : config.minutosDescanso * 60;
  const pct = totalSegundos > 0 ? (totalSegundos - segundos) / totalSegundos : 0;
  const min = Math.floor(segundos / 60).toString().padStart(2, "0");
  const sec = (segundos % 60).toString().padStart(2, "0");
  const cor = fase === "trabalho" ? "#ef4444" : "#3b82f6";

  // Atividades do usuario atual
  const pessoa = colaboradores.find((c) => c.id === usuarioAtual?.id);
  const tarefasAbertas = tarefas.filter((t) =>
    (t.atribuidoPara === usuarioAtual?.id || (t.membros || []).some((m) => m.colaboradorId === usuarioAtual?.id)) &&
    t.status !== "concluida" && t.status !== "aguardando_revisao"
  );
  const rotinasAbertas = (pessoa?.rotinas || []).filter((r) => !r.concluida && r.ativa !== false);

  useEffect(() => {
    if (pomodoroAberto) {
      setAberto(true);
      if (pomodoroTarefaTitulo) {
        setTitulo(pomodoroTarefaTitulo);
        setAtividadeSel(null);
      }
      if (etapa !== "ativo") setEtapa("config");
    }
  }, [pomodoroAberto, pomodoroTarefaTitulo]);

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) { clearInterval(t); setRodando(false); handleFaseCompleta(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [rodando, fase, sessao]);

  function handleFaseCompleta() {
    const agora = new Date().toTimeString().slice(0, 5);
    const hoje = new Date().toISOString().split("T")[0];
    const cfg = configRef.current;
    const tit = tituloRef.current;
    const inicio = iniciouEmRef.current;

    if (fase === "trabalho") {
      tocarSom("fim");
      if (usuarioAtual) {
        ganharXP(usuarioAtual.id, 25);
        addToast("+25 XP · Pomodoro concluido!", "success", 25);
        adicionarAtividadeEntry({
          colaboradorId: usuarioAtual.id,
          tipo: "pomodoro",
          descricao: tit ? `Pomodoro · ${tit}` : `Pomodoro ${cfg.minutos} min`,
          hora: inicio, horaFim: agora, data: hoje, xp: 25,
        });
      }
      if (sessao >= cfg.sessoes) return;
      setFase("descanso"); setSegundos(cfg.minutosDescanso * 60); setIniciouEm(agora); setRodando(true);
    } else {
      tocarSom("inicio");
      setSessao((s) => s + 1); setFase("trabalho"); setSegundos(cfg.minutos * 60); setIniciouEm(agora); setRodando(true);
    }
  }

  function selecionarAtividade(a: AtividadeSelecionada) {
    setAtividadeSel(a);
    setTitulo(a.titulo);
  }

  function iniciar() {
    const agora = new Date().toTimeString().slice(0, 5);
    setSegundos(config.minutos * 60);
    setFase("trabalho"); setSessao(1); setRodando(true); setIniciouEm(agora); setEtapa("ativo");
  }

  function pularFase() { setRodando(false); handleFaseCompleta(); }

  function resetar() { setRodando(false); setFase("trabalho"); setSessao(1); setSegundos(0); setEtapa("config"); }

  function fechar() {
    setAberto(false); fecharPomodoro();
    if (etapa !== "ativo") resetar();
  }

  if (!aberto) return null;

  return (
    <div
      className="fixed z-50 select-none"
      style={{
        left: pos.x, top: pos.y, width: 320,
        background: "#0b1624",
        border: `1px solid ${etapa === "ativo" ? cor + "50" : "#1e3356"}`,
        borderRadius: 24,
        boxShadow: "0 16px 44px rgba(0,0,0,.55)",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header arrastável */}
      <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0 cursor-move"
        style={{ touchAction: "none" }}>
        <div className="flex items-center gap-2">
          <GripHorizontal size={13} style={{ color: "#334155" }} />
          <span style={{ fontSize: 16 }}>&#127813;</span>
          <p className="font-bold text-sm text-white">
            {etapa === "ativo"
              ? fase === "trabalho" ? `Foco ${sessao}/${config.sessoes}` : "Descanso"
              : "Pomodoro"}
          </p>
          {etapa === "ativo" && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: cor + "25", color: cor }}>
              {fase === "trabalho" ? "Foco" : "Descanso"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setAberto(false)} className="p-1.5 rounded-xl hover:bg-slate-800 transition-colors" style={{ color: "#9aa7ba" }} data-tip="Minimizar">
            <ChevronDown size={14} />
          </button>
          <button onClick={fechar} className="p-1.5 rounded-xl hover:bg-slate-800 transition-colors" style={{ color: "#9aa7ba" }} data-tip="Fechar">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* CONFIG SCREEN */}
      {etapa === "config" && (
        <div className="overflow-y-auto flex-1">
          <div className="px-4 pb-4 space-y-4">

            {/* Atividade selecionada ou lista */}
            {atividadeSel ? (
              <div className="rounded-xl p-2.5 flex items-center gap-2" style={{ background: "#10b98115", border: "1px solid #10b98140" }}>
                <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0 }} />
                <span className="text-xs font-semibold flex-1 text-white truncate">{atividadeSel.titulo}</span>
                <button onClick={() => { setAtividadeSel(null); setTitulo(""); }}
                  className="p-0.5 rounded-lg hover:bg-slate-800" style={{ color: "#9aa7ba" }}>
                  <RotateCcw size={11} />
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#9aa7ba" }}>
                  Selecionar atividade
                </p>

                {/* Tarefas abertas */}
                {tarefasAbertas.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs mb-1.5 font-semibold" style={{ color: "#74859c" }}>Tarefas</p>
                    <div className="space-y-1">
                      {tarefasAbertas.slice(0, 5).map((t) => (
                        <button key={t.id} onClick={() => selecionarAtividade({ tipo: "tarefa", id: t.id, titulo: t.titulo })}
                          className="w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2 transition-all hover:opacity-80"
                          style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                          <Circle size={12} style={{ color: "#ef4444", flexShrink: 0 }} />
                          <span className="text-xs text-white truncate flex-1">{t.titulo}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: "#74859c" }}>tarefa</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rotinas abertas */}
                {rotinasAbertas.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs mb-1.5 font-semibold" style={{ color: "#74859c" }}>Rotinas</p>
                    <div className="space-y-1">
                      {rotinasAbertas.slice(0, 5).map((r) => (
                        <button key={r.id} onClick={() => selecionarAtividade({ tipo: "rotina", id: r.id, titulo: r.titulo })}
                          className="w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2 transition-all hover:opacity-80"
                          style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                          <Circle size={12} style={{ color: "#c9a84c", flexShrink: 0 }} />
                          <span className="text-xs text-white truncate flex-1">{r.titulo}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: "#74859c" }}>rotina</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tarefasAbertas.length === 0 && rotinasAbertas.length === 0 && (
                  <p className="text-xs py-2" style={{ color: "#74859c" }}>Nenhuma atividade em aberto — pode digitar abaixo.</p>
                )}

                {/* Ou digitar */}
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ou descreva o que vai fazer..."
                  className="w-full px-3 py-2 rounded-xl text-xs text-white outline-none mt-1"
                  style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                />
              </div>
            )}

            {/* Duracao */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: "#9aa7ba" }}>Duracao</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[25, 45, 60].map((m) => (
                  <button key={m} onClick={() => setConfig({ ...config, minutos: m })}
                    className="py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: config.minutos === m ? "#ef444420" : "#112239",
                      color: config.minutos === m ? "#ef4444" : "#64748b",
                      border: `1px solid ${config.minutos === m ? "#ef444450" : "#1e3356"}`,
                    }}>
                    {m} min
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                <span className="text-xs flex-shrink-0" style={{ color: "#9aa7ba" }}>Outro:</span>
                <input type="number" min={1} max={120} value={config.minutos}
                  onChange={(e) => setConfig({ ...config, minutos: Math.max(1, Math.min(120, parseInt(e.target.value) || 1)) })}
                  className="flex-1 bg-transparent text-center text-sm font-bold outline-none"
                  style={{ color: "#e8edf5", width: 40 }} />
                <span className="text-xs flex-shrink-0" style={{ color: "#9aa7ba" }}>min</span>
              </div>
            </div>

            {/* Intervalo */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: "#9aa7ba" }}>Intervalo</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[5, 10, 15].map((m) => (
                  <button key={m} onClick={() => setConfig({ ...config, minutosDescanso: m })}
                    className="py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: config.minutosDescanso === m ? "#3b82f620" : "#112239",
                      color: config.minutosDescanso === m ? "#3b82f6" : "#64748b",
                      border: `1px solid ${config.minutosDescanso === m ? "#3b82f650" : "#1e3356"}`,
                    }}>
                    {m} min
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                <span className="text-xs flex-shrink-0" style={{ color: "#9aa7ba" }}>Outro:</span>
                <input type="number" min={1} max={60} value={config.minutosDescanso}
                  onChange={(e) => setConfig({ ...config, minutosDescanso: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)) })}
                  className="flex-1 bg-transparent text-center text-sm font-bold outline-none"
                  style={{ color: "#e8edf5", width: 40 }} />
                <span className="text-xs flex-shrink-0" style={{ color: "#9aa7ba" }}>min</span>
              </div>
            </div>

            {/* Sessoes */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: "#9aa7ba" }}>Sessoes</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[1, 2, 4, 6].map((n) => (
                  <button key={n} onClick={() => setConfig({ ...config, sessoes: n })}
                    className="py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: config.sessoes === n ? "#c9a84c20" : "#112239",
                      color: config.sessoes === n ? "#c9a84c" : "#64748b",
                      border: `1px solid ${config.sessoes === n ? "#c9a84c50" : "#1e3356"}`,
                    }}>
                    {n}x
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                <span className="text-xs flex-shrink-0" style={{ color: "#9aa7ba" }}>Outro:</span>
                <input type="number" min={1} max={20} value={config.sessoes}
                  onChange={(e) => setConfig({ ...config, sessoes: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
                  className="flex-1 bg-transparent text-center text-sm font-bold outline-none"
                  style={{ color: "#e8edf5", width: 40 }} />
                <span className="text-xs flex-shrink-0" style={{ color: "#9aa7ba" }}>sessoes</span>
              </div>
              <p className="text-xs mt-1 text-center" style={{ color: "#334155" }}>
                Total: {config.sessoes * config.minutos + (config.sessoes - 1) * config.minutosDescanso} min
              </p>
            </div>

            <button onClick={iniciar}
              disabled={!titulo.trim() && !atividadeSel}
              className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
              &#127813; Comecar
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE SCREEN */}
      {etapa === "ativo" && (
        <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1">
          {titulo && (
            <p className="text-xs text-center truncate px-2" style={{ color: "#9aa7ba" }}>{titulo}</p>
          )}
          <div className="flex flex-col items-center gap-1 py-1">
            <Ampulheta pct={pct} cor={cor} />
            <div className="font-mono font-black text-center transition-colors duration-300"
              style={{ fontSize: 38, color: rodando ? cor : "#475569", letterSpacing: "-2px", lineHeight: 1 }}>
              {min}:{sec}
            </div>
            <p className="text-xs" style={{ color: "#334155" }}>
              {fase === "trabalho" ? "foco" : "descanso"}
            </p>
          </div>
          <SessaoDots total={config.sessoes} atual={sessao} fase={fase} />
          <div className="flex items-center justify-center gap-2 pt-1">
            <button onClick={() => setRodando((v) => !v)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: cor, color: "white" }}>
              {rodando ? <Pause size={15} /> : <Play size={15} />}
              {rodando ? "Pausar" : "Continuar"}
            </button>
            <button onClick={pularFase} className="p-2.5 rounded-2xl transition-colors hover:bg-slate-800" style={{ background: "#1e3356", color: "#9aa7ba" }}>
              <SkipForward size={15} />
            </button>
            <button onClick={resetar} className="p-2.5 rounded-2xl transition-colors hover:bg-slate-800" style={{ background: "#1e3356", color: "#9aa7ba" }}>
              <Square size={15} />
            </button>
          </div>
          <p className="text-center text-xs" style={{ color: "#334155" }}>
            {fase === "trabalho"
              ? sessao < config.sessoes ? `Apos: ${config.minutosDescanso} min descanso` : "Ultima sessao!"
              : `Proxima: Sessao ${sessao + 1}/${config.sessoes}`}
          </p>
        </div>
      )}
    </div>
  );
}
