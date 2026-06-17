"use client";
import { useMemo, useState } from "react";
import { HistoricoEntry } from "@/lib/data";
import { TrendingUp, TrendingDown, Minus, BarChart2, Activity } from "lucide-react";

interface Props {
  historico: HistoricoEntry[];
  colaboradorId: string;
}

type Metrica = "xp" | "rotinas" | "tarefas";
type TipoGrafico = "barras" | "linha";

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  const wn = 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${wn.toString().padStart(2, "0")}`;
}

function isoWeekLabel(key: string): string {
  const [year, wPart] = key.split("-W");
  const w = parseInt(wPart);
  const jan4 = new Date(parseInt(year), 0, 4);
  const startDay = new Date(jan4);
  startDay.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (w - 1) * 7);
  const end = new Date(startDay);
  end.setDate(startDay.getDate() + 4);
  const fmt = (d: Date) => `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  return `${fmt(startDay)}–${fmt(end)}`;
}

const METRICAS: { id: Metrica; label: string; unidade: string; cor: string }[] = [
  { id: "xp", label: "XP Ganho", unidade: "XP", cor: "#8b5cf6" },
  { id: "rotinas", label: "Rotinas", unidade: "%", cor: "#10b981" },
  { id: "tarefas", label: "Tarefas", unidade: "", cor: "#3b82f6" },
];

export default function GraficoSemanal({ historico, colaboradorId }: Props) {
  const [metrica, setMetrica] = useState<Metrica>("xp");
  const [tipo, setTipo] = useState<TipoGrafico>("barras");

  const semanaAtual = useMemo(() => isoWeekKey(new Date().toISOString().split("T")[0]), []);

  const dadosSemanas = useMemo(() => {
    const meus = historico.filter((h) => h.colaboradorId === colaboradorId);
    const porSemana: Record<string, HistoricoEntry[]> = {};
    meus.forEach((h) => {
      const k = isoWeekKey(h.data);
      if (!porSemana[k]) porSemana[k] = [];
      porSemana[k].push(h);
    });

    const chaves = Object.keys(porSemana).sort().slice(-6);
    if (!chaves.includes(semanaAtual)) {
      chaves.push(semanaAtual);
      chaves.sort();
      if (chaves.length > 6) chaves.shift();
    }

    return chaves.map((k) => {
      const dias = porSemana[k] || [];
      const xp = dias.reduce((s, d) => s + d.xpGanho, 0);
      const rotinas = dias.length > 0 ? Math.round(dias.reduce((s, d) => s + d.pctRotinas, 0) / dias.length) : 0;
      const tarefas = dias.reduce((s, d) => s + d.tarefasConcluidas, 0);
      const isAtual = k === semanaAtual;
      return { key: k, label: isoWeekLabel(k), isAtual, xp, rotinas, tarefas };
    });
  }, [historico, colaboradorId, semanaAtual]);

  const cfg = METRICAS.find((m) => m.id === metrica)!;

  const valores = dadosSemanas.map((s) => s[metrica] as number);
  const maxValor = Math.max(...valores, 1);
  const penultimo = dadosSemanas.length >= 2 ? (dadosSemanas[dadosSemanas.length - 2][metrica] as number) : null;
  const atual = dadosSemanas.length >= 1 ? (dadosSemanas[dadosSemanas.length - 1][metrica] as number) : null;
  const delta = (penultimo != null && atual != null && penultimo > 0) ? Math.round(((atual - penultimo) / penultimo) * 100) : null;

  // SVG geometry
  const W = 400, H = 180;
  const PAD = { top: 24, right: 8, bottom: 44, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const n = dadosSemanas.length;
  const barW = Math.min(40, (chartW / n) * 0.6);
  const gap = chartW / n;

  const xOf = (i: number) => PAD.left + gap * i + gap / 2;
  const yOf = (v: number) => PAD.top + chartH - (v / maxValor) * chartH;

  const yGridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: PAD.top + chartH - pct * chartH,
    label: metrica === "rotinas"
      ? `${Math.round(pct * maxValor)}%`
      : metrica === "xp"
      ? `${Math.round(pct * maxValor)}`
      : `${Math.round(pct * maxValor)}`,
  }));

  const points = dadosSemanas.map((_, i) => `${xOf(i)},${yOf(valores[i])}`).join(" ");

  const areaPath = dadosSemanas.length > 1
    ? `M ${xOf(0)} ${PAD.top + chartH} L ${dadosSemanas.map((_, i) => `${xOf(i)} ${yOf(valores[i])}`).join(" L ")} L ${xOf(n - 1)} ${PAD.top + chartH} Z`
    : "";

  return (
    <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-white">Comparativo Semanal</p>
          {delta !== null && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: delta > 0 ? "#10b98118" : delta < 0 ? "#ef444418" : "#64748b18",
                color: delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "#64748b",
              }}
            >
              {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
              {delta > 0 ? "+" : ""}{delta}% vs semana anterior
            </div>
          )}
        </div>
        {/* Chart type toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#1e3356" }}>
          <button
            onClick={() => setTipo("barras")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: tipo === "barras" ? cfg.cor + "25" : "transparent", color: tipo === "barras" ? cfg.cor : "#64748b" }}
          >
            <BarChart2 size={13} /> Barras
          </button>
          <button
            onClick={() => setTipo("linha")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: tipo === "linha" ? cfg.cor + "25" : "transparent", color: tipo === "linha" ? cfg.cor : "#64748b" }}
          >
            <Activity size={13} /> Evolução
          </button>
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {METRICAS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMetrica(m.id)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: metrica === m.id ? m.cor + "20" : "#1e3356",
              color: metrica === m.id ? m.cor : "#64748b",
              border: `1px solid ${metrica === m.id ? m.cor + "50" : "transparent"}`,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
        {/* Grid lines */}
        {yGridLines.map(({ y, label }) => (
          <g key={y}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e3356" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#334155">{label}</text>
          </g>
        ))}

        {/* Bars */}
        {tipo === "barras" && dadosSemanas.map((s, i) => {
          const x = xOf(i);
          const v = valores[i];
          const bh = (v / maxValor) * chartH;
          const isAtual = s.isAtual;
          return (
            <g key={s.key}>
              <rect
                x={x - barW / 2}
                y={PAD.top + chartH - bh}
                width={barW}
                height={bh}
                rx={4}
                fill={isAtual ? cfg.cor : cfg.cor + "50"}
                style={{ transition: "height 0.4s ease, y 0.4s ease" }}
              />
              {v > 0 && (
                <text
                  x={x}
                  y={PAD.top + chartH - bh - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={isAtual ? "bold" : "normal"}
                  fill={isAtual ? cfg.cor : "#64748b"}
                >
                  {v}{cfg.unidade}
                </text>
              )}
            </g>
          );
        })}

        {/* Line + Area */}
        {tipo === "linha" && dadosSemanas.length > 1 && (
          <>
            <defs>
              <linearGradient id={`area-${metrica}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.cor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={cfg.cor} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#area-${metrica})`} />
            <polyline
              points={points}
              fill="none"
              stroke={cfg.cor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {dadosSemanas.map((s, i) => {
              const x = xOf(i);
              const v = valores[i];
              const isAtual = s.isAtual;
              return (
                <g key={s.key}>
                  <circle
                    cx={x}
                    cy={yOf(v)}
                    r={isAtual ? 5 : 3.5}
                    fill={isAtual ? cfg.cor : "#122039"}
                    stroke={cfg.cor}
                    strokeWidth={isAtual ? 0 : 1.5}
                  />
                  {(isAtual || i === 0) && (
                    <text
                      x={x}
                      y={yOf(v) - 9}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={isAtual ? "bold" : "normal"}
                      fill={isAtual ? cfg.cor : "#64748b"}
                    >
                      {v}{cfg.unidade}
                    </text>
                  )}
                </g>
              );
            })}
          </>
        )}

        {/* X-axis labels */}
        {dadosSemanas.map((s, i) => (
          <text
            key={s.key}
            x={xOf(i)}
            y={H - 28}
            textAnchor="middle"
            fontSize={8}
            fill={s.isAtual ? cfg.cor : "#475569"}
            fontWeight={s.isAtual ? "bold" : "normal"}
          >
            {s.isAtual ? "Esta sem." : `S-${n - 1 - i}`}
          </text>
        ))}
        {dadosSemanas.map((s, i) => (
          <text
            key={`lbl2-${s.key}`}
            x={xOf(i)}
            y={H - 16}
            textAnchor="middle"
            fontSize={7.5}
            fill="#334155"
          >
            {s.label}
          </text>
        ))}

        {/* X axis line */}
        <line x1={PAD.left} y1={PAD.top + chartH} x2={W - PAD.right} y2={PAD.top + chartH} stroke="#1e3356" strokeWidth={1} />
      </svg>

      {/* Summary row */}
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        {dadosSemanas.slice(-3).map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: s.isAtual ? cfg.cor : cfg.cor + "60" }} />
            <span className="text-xs" style={{ color: s.isAtual ? cfg.cor : "#64748b" }}>
              {s.isAtual ? "Esta" : s.label}: <span style={{ fontWeight: s.isAtual ? 700 : 400 }}>{s[metrica] as number}{cfg.unidade}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
