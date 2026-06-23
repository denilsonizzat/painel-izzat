"use client";
import { useState, useEffect } from "react";
import { Wrench, X, Globe, TrendingUp, Calculator } from "lucide-react";
import { useAppStore } from "@/lib/store";

const FUSOS = [
  { label: "SP", zone: "America/Sao_Paulo", flag: "🇧🇷" },
  { label: "NY", zone: "America/New_York", flag: "🇺🇸" },
  { label: "LON", zone: "Europe/London", flag: "🇬🇧" },
  { label: "DXB", zone: "Asia/Dubai", flag: "🇦🇪" },
  { label: "SHA", zone: "Asia/Shanghai", flag: "🇨🇳" },
];

function useRelogio() {
  const [hora, setHora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return hora;
}

function WorldClock({ onFechar }: { onFechar: () => void }) {
  const hora = useRelogio();
  return (
    <div className="fixed z-50 rounded-2xl shadow-2xl overflow-hidden" style={{ bottom: 170, right: 24, width: 220, background: "#0e1d33", border: "1px solid #c9a44240" }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ background: "#112239", borderBottom: "1px solid rgba(201,164,66,.16)" }}>
        <span className="text-xs font-bold" style={{ color: "#e8c462" }}>🌍 Fuso Horários</span>
        <button onClick={onFechar} style={{ color: "#74859c" }}><X size={14} /></button>
      </div>
      <div className="p-3 space-y-2">
        {FUSOS.map((f) => {
          const hStr = hora.toLocaleTimeString("pt-BR", { timeZone: f.zone, hour: "2-digit", minute: "2-digit", hour12: false });
          const dia = hora.toLocaleDateString("pt-BR", { timeZone: f.zone, weekday: "short" });
          return (
            <div key={f.zone} className="flex items-center justify-between px-2 py-1.5 rounded-xl" style={{ background: "#112239" }}>
              <span className="text-sm">{f.flag} <span className="font-bold text-xs" style={{ color: "#94a3b8" }}>{f.label}</span></span>
              <div className="text-right">
                <span className="font-mono font-black text-sm" style={{ color: "#e8edf5" }}>{hStr}</span>
                <span className="text-xs ml-1 capitalize" style={{ color: "#475569" }}>{dia}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ROASCalc({ onFechar }: { onFechar: () => void }) {
  const [receita, setReceita] = useState("");
  const [ads, setAds] = useState("");
  const [custo, setCusto] = useState("");
  const rv = parseFloat(receita) || 0;
  const av = parseFloat(ads) || 0;
  const cv = parseFloat(custo) || 0;
  const roas = av > 0 ? rv / av : 0;
  const lucro = rv - av - cv;
  const margem = rv > 0 ? (lucro / rv) * 100 : 0;

  return (
    <div className="fixed z-50 rounded-2xl shadow-2xl overflow-hidden" style={{ bottom: 170, right: 24, width: 240, background: "#0e1d33", border: "1px solid #c9a44240" }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ background: "#112239", borderBottom: "1px solid rgba(201,164,66,.16)" }}>
        <span className="text-xs font-bold" style={{ color: "#e8c462" }}>📊 ROAS & Lucro</span>
        <button onClick={onFechar} style={{ color: "#74859c" }}><X size={14} /></button>
      </div>
      <div className="p-3 space-y-2">
        {([["Receita $", receita, setReceita], ["Gasto ADS $", ads, setAds], ["Custo produto $", custo, setCusto]] as const).map(([lbl, val, set]) => (
          <div key={lbl} className="flex items-center justify-between gap-2">
            <span className="text-xs" style={{ color: "#9aa7ba" }}>{lbl}</span>
            <input type="number" value={val} onChange={(e) => set(e.target.value)} className="text-right" style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)", color: "#e8edf5", borderRadius: 8, padding: "4px 8px", width: 90, fontSize: 13, outline: "none" }} />
          </div>
        ))}
        <div className="rounded-xl p-2.5 space-y-1.5 mt-1" style={{ background: "#0b1624", border: "1px solid #c9a44230" }}>
          <div className="flex justify-between"><span className="text-xs" style={{ color: "#9aa7ba" }}>ROAS</span><span className="font-black text-sm" style={{ color: roas >= 3 ? "#46d69b" : roas > 0 ? "#e8c462" : "#475569" }}>{roas.toFixed(2)}×</span></div>
          <div className="flex justify-between"><span className="text-xs" style={{ color: "#9aa7ba" }}>Lucro</span><span className="font-bold text-sm" style={{ color: lucro >= 0 ? "#46d69b" : "#f2545b" }}>${lucro.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-xs" style={{ color: "#9aa7ba" }}>Margem</span><span className="font-bold text-sm" style={{ color: margem >= 20 ? "#46d69b" : margem > 0 ? "#e8c462" : "#f2545b" }}>{margem.toFixed(1)}%</span></div>
        </div>
      </div>
    </div>
  );
}

type Ferramenta = "calc" | "pomodoro" | "fusos" | "roas" | null;

export default function FloatingToolsMenu() {
  const { usuarioAtual, abrirPomodoro, abrirCalc, pomodoroAberto } = useAppStore();
  const [aberto, setAberto] = useState(false);
  const [painel, setPainel] = useState<Ferramenta>(null);

  if (!usuarioAtual) return null;

  const TOOLS = [
    {
      id: "pomodoro" as Ferramenta,
      label: "Pomodoro",
      emoji: "🍅",
      tip: "Timer Pomodoro — ciclos de foco e descanso",
      onClick: () => { setAberto(false); setPainel(null); abrirPomodoro(); },
    },
    {
      id: "calc" as Ferramenta,
      label: "Calculadora",
      icon: <Calculator size={20} />,
      tip: "Calculadora básica e de precificação",
      onClick: () => { setAberto(false); setPainel(null); abrirCalc(); },
    },
    {
      id: "fusos" as Ferramenta,
      label: "Fuso Horários",
      icon: <Globe size={20} />,
      tip: "Relógio mundial — SP, NY, Londres, Dubai, Xangai",
      onClick: () => { setAberto(false); setPainel((p) => p === "fusos" ? null : "fusos"); },
    },
    {
      id: "roas" as Ferramenta,
      label: "ROAS & Lucro",
      icon: <TrendingUp size={20} />,
      tip: "Calculadora rápida de ROAS e margem de ADS",
      onClick: () => { setAberto(false); setPainel((p) => p === "roas" ? null : "roas"); },
    },
  ];

  const GOLD = "linear-gradient(135deg, #c9a84c, #e8c462)";

  return (
    <>
      {/* Painéis flutuantes */}
      {painel === "fusos" && <WorldClock onFechar={() => setPainel(null)} />}
      {painel === "roas" && <ROASCalc onFechar={() => setPainel(null)} />}

      {/* FAB container */}
      <div className="fixed hidden md:flex flex-col items-center gap-3 z-40" style={{ bottom: 90, right: 24 }}>
        {/* Sub-buttons — fan out upward */}
        {TOOLS.map((tool, i) => (
          <div
            key={tool.id}
            className="flex items-center gap-2 transition-all"
            style={{
              opacity: aberto ? 1 : 0,
              transform: aberto ? "translateY(0) scale(1)" : "translateY(24px) scale(0.7)",
              transitionDelay: aberto ? `${i * 55}ms` : `${(TOOLS.length - 1 - i) * 40}ms`,
              transitionDuration: "200ms",
              pointerEvents: aberto ? "auto" : "none",
            }}
          >
            {/* Label */}
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl whitespace-nowrap" style={{ background: "#112239", color: "#94a3b8", border: "1px solid #1e3356" }}>
              {tool.label}
            </span>
            {/* Button */}
            <button
              onClick={tool.onClick}
              className="flex items-center justify-center rounded-full shadow-xl transition-all hover:scale-110 active:scale-95"
              style={{ width: 48, height: 48, background: GOLD, color: "#0b1624", flexShrink: 0 }}
              data-tip={tool.tip}
              data-tip-place="left"
            >
              {tool.emoji ? <span style={{ fontSize: 20 }}>{tool.emoji}</span> : tool.icon}
            </button>
          </div>
        ))}

        {/* Main Ferramentas button */}
        <button
          onClick={() => setAberto((v) => !v)}
          className="flex items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
          style={{
            width: 56, height: 56,
            background: aberto ? "#1e3356" : GOLD,
            color: aberto ? "#94a3b8" : "#0b1624",
            border: aberto ? "2px solid #c9a84c40" : "none",
          }}
          data-tip={aberto ? "Fechar ferramentas" : "Ferramentas"}
          data-tip-place="left"
        >
          {aberto ? <X size={22} /> : <Wrench size={22} />}
        </button>
      </div>

      {/* Overlay para fechar ao clicar fora */}
      {aberto && (
        <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />
      )}
    </>
  );
}
