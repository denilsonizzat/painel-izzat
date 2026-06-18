"use client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { Moon, Sun, Clock, TrendingUp, Calendar, Plus, Check } from "lucide-react";
import { RegistroSono } from "@/lib/data";

function calcMinutos(dormir: string, acordar: string): number {
  const [hd, md] = dormir.split(":").map(Number);
  const [ha, ma] = acordar.split(":").map(Number);
  let minD = hd * 60 + md;
  let minA = ha * 60 + ma;
  if (minA <= minD) minA += 1440;
  return minA - minD;
}

function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function hToStr(h: number): string {
  const hrs = Math.floor(h);
  const min = Math.round((h - hrs) * 60);
  return min > 0 ? `${hrs}h ${min}min` : `${hrs}h`;
}

function corHoras(h: number): string {
  if (h >= 7 && h <= 9) return "#10b981";
  if (h >= 6 || h <= 10) return "#f59e0b";
  return "#ef4444";
}

function corMin(min: number): string {
  return corHoras(min / 60);
}

function hoje(): string {
  return new Date().toISOString().split("T")[0];
}

function diasAtras(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function fmtData(data: string): string {
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
}

function fmtDia(data: string): string {
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  return dias[new Date(data + "T12:00:00").getDay()];
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / vals.length);
}

export default function SonoPage() {
  const router = useRouter();
  const { usuarioAtual, registrarSono } = useAppStore();
  const [periodo, setPeriodo] = useState<7 | 14 | 21 | 30>(7);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(hoje());
  const [formDormir, setFormDormir] = useState("23:00");
  const [formAcordar, setFormAcordar] = useState("07:00");
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (!usuarioAtual) router.push("/");
  }, [usuarioAtual, router]);

  if (!usuarioAtual) return null;

  const registros: RegistroSono[] = usuarioAtual.registrosSono || [];
  const hoje_ = hoje();

  // Filtrar pelo periodo selecionado
  const dataInicio = diasAtras(periodo - 1);
  const registrosPeriodo = registros.filter((r) => r.data >= dataInicio && r.data <= hoje_);

  // Preencher dias sem registro com null para o grafico
  const diasDoGrafico: { data: string; registro: RegistroSono | null }[] = [];
  for (let i = periodo - 1; i >= 0; i--) {
    const d = diasAtras(i);
    diasDoGrafico.push({ data: d, registro: registros.find((r) => r.data === d) || null });
  }

  // Stats
  const comDados = registrosPeriodo.filter((r) => r.horasDormidas > 0);
  const mediaHoras = comDados.length > 0 ? comDados.reduce((s, r) => s + r.horasDormidas, 0) / comDados.length : 0;
  const mediaDormir = comDados.length > 0
    ? (() => {
        const mins = comDados.map((r) => timeToMin(r.horaDormir));
        const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
        const h = Math.floor(avg / 60) % 24;
        const m = Math.round(avg % 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      })()
    : "--:--";
  const mediaAcordar = comDados.length > 0
    ? (() => {
        const mins = comDados.map((r) => timeToMin(r.horaAcordar));
        const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
        const h = Math.floor(avg / 60) % 24;
        const m = Math.round(avg % 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      })()
    : "--:--";

  // Consistencia: desvio padrao dos horarios de dormir (em minutos)
  // Menor desvio = mais consistente. 0 min = 100%, 120 min = 0%
  const desvio = comDados.length >= 2
    ? stdDev(comDados.map((r) => {
        const m = timeToMin(r.horaDormir);
        return m < 300 ? m + 1440 : m; // normaliza madrugada
      }))
    : 0;
  const consistencia = comDados.length >= 2 ? Math.max(0, Math.round(100 - (desvio / 90) * 100)) : 0;
  const corConsistencia = consistencia >= 75 ? "#10b981" : consistencia >= 50 ? "#f59e0b" : "#ef4444";

  // SVG Grafico
  const svgW = 600;
  const svgH = 160;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 28;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;

  const maxH = 12;
  const minH = 0;
  const scaleY = (h: number) => padTop + plotH - ((h - minH) / (maxH - minH)) * plotH;
  const scaleX = (i: number) => padLeft + (i / (diasDoGrafico.length - 1)) * plotW;

  const pontos = diasDoGrafico.map((d, i) => ({
    x: scaleX(i),
    y: d.registro ? scaleY(d.registro.horasDormidas) : null,
    h: d.registro?.horasDormidas || 0,
    data: d.data,
    registro: d.registro,
  }));

  const polyline = pontos.filter((p) => p.y !== null).map((p) => `${p.x},${p.y}`).join(" ");

  function handleSalvar() {
    if (!formDormir || !formAcordar) return;
    registrarSono(usuarioAtual!.id, { data: formData, horaDormir: formDormir, horaAcordar: formAcordar });
    setSavedFeedback(true);
    setTimeout(() => { setSavedFeedback(false); setShowForm(false); }, 1200);
  }

  const temHoje = registros.some((r) => r.data === hoje_);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <BackButton href="/dashboard" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Moon size={20} style={{ color: "#8b5cf6" }} />
            <h1 className="text-2xl font-bold text-white">Sono</h1>
          </div>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Consistencia do horario de sono e horas dormidas
          </p>
        </div>
        <button onClick={() => { setFormData(hoje_); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
          style={{ background: "#8b5cf6", color: "white" }}>
          <Plus size={14} /> Registrar
        </button>
      </div>

      {/* Alerta hoje sem registro */}
      {!temHoje && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#8b5cf615", border: "1px solid #8b5cf630" }}>
          <Moon size={15} style={{ color: "#8b5cf6" }} />
          <p className="text-sm" style={{ color: "#8b5cf6" }}>Voce ainda nao registrou o sono de hoje</p>
          <button onClick={() => { setFormData(hoje_); setShowForm(true); }}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg font-bold hover:opacity-80"
            style={{ background: "#8b5cf6", color: "white" }}>
            Registrar agora
          </button>
        </div>
      )}

      {/* Cards de stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-3.5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-xs" style={{ color: "#64748b" }}>Media de sono</p>
          <p className="text-lg font-black mt-0.5" style={{ color: corHoras(mediaHoras) }}>
            {comDados.length > 0 ? hToStr(mediaHoras) : "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#334155" }}>ultimos {periodo} dias</p>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-xs" style={{ color: "#64748b" }}>Media dormir</p>
          <p className="text-lg font-black mt-0.5" style={{ color: "#8b5cf6" }}>{mediaDormir}</p>
          <p className="text-xs mt-0.5" style={{ color: "#334155" }}>horario medio</p>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-xs" style={{ color: "#64748b" }}>Media acordar</p>
          <p className="text-lg font-black mt-0.5" style={{ color: "#f59e0b" }}>{mediaAcordar}</p>
          <p className="text-xs mt-0.5" style={{ color: "#334155" }}>horario medio</p>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "#122039", border: `1px solid ${corConsistencia}25` }}>
          <p className="text-xs" style={{ color: "#64748b" }}>Consistencia</p>
          <p className="text-lg font-black mt-0.5" style={{ color: corConsistencia }}>
            {comDados.length >= 2 ? `${consistencia}%` : "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#334155" }}>regularidade</p>
        </div>
      </div>

      {/* Selector de periodo + Grafico */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e3356" }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={15} style={{ color: "#8b5cf6" }} />
            <p className="text-sm font-semibold text-white">Evolucao do Sono</p>
          </div>
          <div className="flex gap-1">
            {([7, 14, 21, 30] as const).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                style={{ background: periodo === p ? "#8b5cf6" : "#1e3356", color: periodo === p ? "white" : "#64748b" }}>
                {p}d
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {comDados.length === 0 ? (
            <div className="text-center py-8">
              <Moon size={32} className="mx-auto mb-2" style={{ color: "#1e3356" }} />
              <p className="text-sm" style={{ color: "#475569" }}>Sem registros nos ultimos {periodo} dias</p>
            </div>
          ) : (
            <>
              {/* Legenda */}
              <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: "#475569" }}>
                <span className="flex items-center gap-1"><span style={{ background: "#10b981", width: 8, height: 8, borderRadius: 4, display: "inline-block" }} /> 7-9h (ideal)</span>
                <span className="flex items-center gap-1"><span style={{ background: "#f59e0b", width: 8, height: 8, borderRadius: 4, display: "inline-block" }} /> 6-7h / 9-10h</span>
                <span className="flex items-center gap-1"><span style={{ background: "#ef4444", width: 8, height: 8, borderRadius: 4, display: "inline-block" }} /> {"<6h ou >10h"}</span>
              </div>

              {/* SVG */}
              <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: "visible" }}>
                {/* Zona ideal 7-9h */}
                <rect
                  x={padLeft} y={scaleY(9)}
                  width={plotW} height={scaleY(7) - scaleY(9)}
                  fill="#10b98108" rx="2"
                />

                {/* Grid lines H */}
                {[4, 6, 7, 8, 9, 10].map((h) => (
                  <g key={h}>
                    <line x1={padLeft} x2={svgW - padRight} y1={scaleY(h)} y2={scaleY(h)}
                      stroke="#1e3356" strokeWidth="1" strokeDasharray={h === 7 || h === 9 ? "none" : "3,4"} />
                    <text x={padLeft - 4} y={scaleY(h) + 4} textAnchor="end" fontSize="9" fill="#334155">{h}h</text>
                  </g>
                ))}

                {/* Polyline */}
                {polyline && (
                  <polyline points={polyline} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                )}

                {/* Pontos */}
                {pontos.map((p, i) => p.y !== null && (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y!} r="5" fill={corHoras(p.h)} stroke="#122039" strokeWidth="1.5" />
                    <text x={p.x} y={svgH - 6} textAnchor="middle" fontSize="9" fill="#475569">
                      {periodo <= 14 ? fmtDia(p.data) : fmtData(p.data)}
                    </text>
                  </g>
                ))}

                {/* Dias sem registro — ponto vazio */}
                {pontos.map((p, i) => p.y === null && (
                  <g key={`empty-${i}`}>
                    <text x={p.x} y={svgH - 6} textAnchor="middle" fontSize="9" fill="#1e3356">
                      {periodo <= 14 ? fmtDia(p.data) : fmtData(p.data)}
                    </text>
                  </g>
                ))}
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Historico */}
      {registros.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #1e3356" }}>
            <Calendar size={14} style={{ color: "#64748b" }} />
            <p className="text-sm font-semibold text-white">Historico</p>
            <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: "#1e3356", color: "#64748b" }}>
              {registros.length} registros
            </span>
          </div>
          <div>
            {registros.slice(0, 21).map((r, idx) => {
              const min = calcMinutos(r.horaDormir, r.horaAcordar);
              const cor = corMin(min);
              return (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3"
                  style={{ borderTop: idx > 0 ? "1px solid #1e335640" : "none" }}>
                  <div className="text-center flex-shrink-0" style={{ minWidth: 44 }}>
                    <p className="text-xs font-bold" style={{ color: "#64748b" }}>{fmtDia(r.data)}</p>
                    <p className="text-xs" style={{ color: "#475569" }}>{fmtData(r.data)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Moon size={13} style={{ color: "#8b5cf6" }} />
                    <span className="text-sm text-white">{r.horaDormir}</span>
                    <span style={{ color: "#334155" }}>→</span>
                    <Sun size={13} style={{ color: "#f59e0b" }} />
                    <span className="text-sm text-white">{r.horaAcordar}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356", width: 60 }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min((min / 600) * 100, 100)}%`, background: cor }} />
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: cor }}>{fmtMin(min)}</span>
                  </div>
                  <button onClick={() => { setFormData(r.data); setFormDormir(r.horaDormir); setFormAcordar(r.horaAcordar); setShowForm(true); }}
                    className="text-xs px-2 py-1 rounded-lg hover:opacity-80 flex-shrink-0" style={{ color: "#334155" }}>
                    editar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {registros.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="text-5xl mb-3">🌙</div>
          <p className="font-semibold text-white mb-1">Nenhum registro ainda</p>
          <p className="text-sm mb-4" style={{ color: "#64748b" }}>
            Registre seu primeiro sono para comecar a acompanhar sua consistencia.
          </p>
          <button onClick={() => { setFormData(hoje_); setShowForm(true); }}
            className="px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90" style={{ background: "#8b5cf6", color: "white" }}>
            Registrar primeiro sono
          </button>
        </div>
      )}

      {/* Modal registrar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !savedFeedback && setShowForm(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#122039", border: "1px solid #8b5cf640" }}
            onClick={(e) => e.stopPropagation()}>

            {savedFeedback ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#10b98122", border: "2px solid #10b981" }}>
                  <Check size={24} style={{ color: "#10b981" }} />
                </div>
                <p className="text-white font-bold">Sono registrado!</p>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {fmtMin(calcMinutos(formDormir, formAcordar))} dormidas
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid #1e3356" }}>
                  <div className="flex items-center gap-2">
                    <Moon size={16} style={{ color: "#8b5cf6" }} />
                    <h2 className="font-bold text-white">Registrar Sono</h2>
                  </div>
                  <button onClick={() => setShowForm(false)} style={{ color: "#64748b" }}>✕</button>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#64748b" }}>Data (acordou em)</label>
                    <input type="date" value={formData} onChange={(e) => setFormData(e.target.value)}
                      max={hoje_}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: "#1e3356", border: "1px solid #334155" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 block" style={{ color: "#8b5cf6" }}>
                        <Moon size={11} /> Dormiu
                      </label>
                      <input type="time" value={formDormir} onChange={(e) => setFormDormir(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: "#1e3356", border: "1px solid #8b5cf640" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 block" style={{ color: "#f59e0b" }}>
                        <Sun size={11} /> Acordou
                      </label>
                      <input type="time" value={formAcordar} onChange={(e) => setFormAcordar(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: "#1e3356", border: "1px solid #f59e0b40" }} />
                    </div>
                  </div>

                  {/* Preview */}
                  {formDormir && formAcordar && (() => {
                    const m = calcMinutos(formDormir, formAcordar);
                    return (
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "#0d1928" }}>
                        <span className="text-sm" style={{ color: "#64748b" }}>Total de sono</span>
                        <span className="text-lg font-black" style={{ color: corMin(m) }}>
                          {fmtMin(m)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="px-5 pb-5">
                  <button onClick={handleSalvar}
                    disabled={!formDormir || !formAcordar}
                    className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 hover:opacity-90"
                    style={{ background: "#8b5cf6", color: "white" }}>
                    Salvar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
