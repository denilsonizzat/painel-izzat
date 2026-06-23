"use client";
import { useState, useRef, useEffect } from "react";
import { Wrench, X, Globe, TrendingUp, Calculator, CalendarDays, CalendarRange } from "lucide-react";
import { useAppStore } from "@/lib/store";

type FerramId = "pomodoro" | "calc" | "calendario" | "feriados" | "fuso" | "roas";

export default function FloatingToolsMenu() {
  const { usuarioAtual, abrirPomodoro, abrirCalc, abrirROAS, abrirCalendario } = useAppStore();
  const [aberto, setAberto] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("tools-fab-offset") || "{}");
      if (typeof s.x === "number") setOffset(s);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("tools-fab-offset", JSON.stringify(offset));
  }, [offset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!usuarioAtual) return null;

  function fechar() { setAberto(false); }

  const TOOLS: { id: FerramId; label: string; emoji?: string; icon?: React.ReactNode; tip: string; onClick: () => void }[] = [
    {
      id: "pomodoro", label: "Pomodoro", emoji: "🍅",
      tip: "Timer Pomodoro — ciclos de foco e descanso",
      onClick: () => { fechar(); abrirPomodoro(); },
    },
    {
      id: "calc", label: "Calculadora", icon: <Calculator size={20} />,
      tip: "Calculadora básica e de precificação",
      onClick: () => { fechar(); abrirCalc(); },
    },
    {
      id: "calendario", label: "Calendário BR", icon: <CalendarDays size={20} />,
      tip: "Mini calendário brasileiro com feriados nacionais",
      onClick: () => { fechar(); abrirCalendario(); },
    },
    {
      id: "feriados", label: "Datas E-comm", icon: <CalendarRange size={20} />,
      tip: "Calendário de datas comemorativas por país",
      onClick: () => { fechar(); window.open("/calendario", "_blank"); },
    },
    {
      id: "fuso", label: "Fuso Horário", icon: <Globe size={20} />,
      tip: "Relógio mundial por mercado e fuso para campanhas",
      onClick: () => { fechar(); window.open("/fuso-horario", "_blank"); },
    },
    {
      id: "roas", label: "ROAS & Lucro", icon: <TrendingUp size={20} />,
      tip: "Calculadora rápida de ROAS e margem",
      onClick: () => { fechar(); abrirROAS(); },
    },
  ];

  const GOLD = "linear-gradient(135deg, #c9a84c, #e8c462)";

  function onPointerDown(e: React.PointerEvent) {
    moved.current = false;
    drag.current = { ox: e.clientX, oy: e.clientY, sx: offset.x, sy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.ox;
    const dy = e.clientY - drag.current.oy;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved.current = true;
    if (moved.current) setOffset({ x: drag.current.sx + dx, y: drag.current.sy + dy });
  }
  function onPointerUp() {
    if (!moved.current) setAberto((v) => !v);
    drag.current = null;
  }

  return (
    <>
      <div
        className="fixed flex flex-col items-center gap-3 z-40"
        style={{ bottom: 90, right: 24, transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {/* Sub-buttons — fan out upward */}
        {TOOLS.map((tool, i) => (
          <div key={tool.id} className="flex items-center gap-2 transition-all"
            style={{
              opacity: aberto ? 1 : 0,
              transform: aberto ? "translateY(0) scale(1)" : "translateY(24px) scale(0.7)",
              transitionDelay: aberto ? `${i * 50}ms` : `${(TOOLS.length - 1 - i) * 35}ms`,
              transitionDuration: "200ms",
              pointerEvents: aberto ? "auto" : "none",
            }}>
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl whitespace-nowrap" style={{ background: "#112239", color: "#94a3b8", border: "1px solid #1e3356" }}>
              {tool.label}
            </span>
            <button onClick={tool.onClick}
              aria-label={tool.label}
              className="flex items-center justify-center rounded-full shadow-xl transition-all hover:scale-110 active:scale-95"
              style={{ width: 48, height: 48, background: GOLD, color: "#0b1624", flexShrink: 0 }}
              data-tip={tool.tip} data-tip-place="left">
              {tool.emoji ? <span style={{ fontSize: 20 }}>{tool.emoji}</span> : tool.icon}
            </button>
          </div>
        ))}

        {/* Botão principal — arrasta aqui */}
        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex items-center justify-center rounded-full shadow-2xl"
          aria-label={aberto ? "Fechar ferramentas" : "Abrir ferramentas"}
          style={{
            width: 56, height: 56,
            background: aberto ? "#1e3356" : GOLD,
            color: aberto ? "#94a3b8" : "#0b1624",
            border: aberto ? "2px solid #c9a84c40" : "none",
            touchAction: "none",
            cursor: "grab",
          }}
          data-tip={aberto ? "Fechar ferramentas" : "Ferramentas (arraste para mover)"}
          data-tip-place="left"
        >
          {aberto ? <X size={22} /> : <Wrench size={22} />}
        </button>
      </div>

      {aberto && <div className="fixed inset-0 z-30" onClick={() => setAberto(false)} />}
    </>
  );
}
