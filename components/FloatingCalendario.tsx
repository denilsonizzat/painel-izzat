"use client";
import { useState, useEffect, useRef } from "react";
import { X, Minus, GripHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function calcEaster(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getFeriados(year: number): Map<string, string> {
  const easter = calcEaster(year);
  const toKey = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}`;
  const map = new Map<string, string>();

  // Fixos
  map.set(`1-1`, "Confraternização Universal");
  map.set(`4-21`, "Tiradentes");
  map.set(`5-1`, "Dia do Trabalho");
  map.set(`9-7`, "Independência");
  map.set(`10-12`, "N.Sra. Aparecida");
  map.set(`11-2`, "Finados");
  map.set(`11-15`, "Proclamação da República");
  map.set(`11-20`, "Consciência Negra");
  map.set(`12-25`, "Natal");

  // Móveis
  map.set(toKey(addDays(easter, -48)), "Carnaval");
  map.set(toKey(addDays(easter, -47)), "Carnaval");
  map.set(toKey(addDays(easter, -2)), "Sexta-feira Santa");
  map.set(toKey(easter), "Páscoa");
  map.set(toKey(addDays(easter, 60)), "Corpus Christi");

  return map;
}

export default function FloatingCalendario() {
  const { calendarioAberta, fecharCalendario } = useAppStore();
  const [aberto, setAberto] = useState(false);
  const [min, setMin] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ ox: number; oy: number } | null>(null);

  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth()); // 0-indexed

  useEffect(() => { if (calendarioAberta) { setAberto(true); setMin(false); } }, [calendarioAberta]);

  useEffect(() => {
    if (pos.x === 0 && pos.y === 0 && typeof window !== "undefined") {
      setPos({ x: Math.max(0, window.innerWidth - 320), y: Math.max(0, window.innerHeight - 420) });
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

  function navMes(delta: number) {
    let nm = mes + delta, na = ano;
    if (nm < 0) { nm = 11; na--; }
    if (nm > 11) { nm = 0; na++; }
    setMes(nm); setAno(na);
  }

  const feriados = getFeriados(ano);
  const primeiroDia = new Date(ano, mes, 1).getDay(); // 0=Dom
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  if (!aberto) return null;

  return (
    <div className="fixed z-50 select-none" style={{ left: pos.x, top: pos.y, width: 290 }}>
      <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#0e1d33", border: "1px solid #c9a44240", boxShadow: "0 16px 44px rgba(0,0,0,.55)" }}>
        {/* Header arrastável */}
        <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          className="flex items-center justify-between px-3 py-2 cursor-move" style={{ background: "#112239", borderBottom: "1px solid rgba(201,164,66,.16)", touchAction: "none" }}>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#e8c462" }}><GripHorizontal size={13} /> 📅 Calendário BR</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setMin(!min)} style={{ color: "#74859c" }}><Minus size={15} /></button>
            <button onClick={() => { setAberto(false); fecharCalendario(); }} style={{ color: "#74859c" }}><X size={15} /></button>
          </div>
        </div>

        {!min && (
          <div className="p-3">
            {/* Navegação mês */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => navMes(-1)} className="p-1 rounded-lg hover:bg-slate-800" style={{ color: "#74859c" }}><ChevronLeft size={16} /></button>
              <span className="text-sm font-bold" style={{ color: "#e8edf5" }}>{MESES[mes]} {ano}</span>
              <button onClick={() => navMes(1)} className="p-1 rounded-lg hover:bg-slate-800" style={{ color: "#74859c" }}><ChevronRight size={16} /></button>
            </div>

            {/* Grid dias da semana */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DIAS_SEMANA.map((d, i) => (
                <div key={i} className="text-center text-xs font-bold py-0.5" style={{ color: i === 0 ? "#ef4444" : "#475569" }}>{d}</div>
              ))}
            </div>

            {/* Grid dias */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((dia, i) => {
                if (!dia) return <div key={i} />;
                const isFeriado = feriados.has(`${mes + 1}-${dia}`);
                const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
                const isDom = (primeiroDia + dia - 1) % 7 === 0;
                const feriadoNome = isFeriado ? feriados.get(`${mes + 1}-${dia}`) : null;
                return (
                  <div key={i} title={feriadoNome || undefined}
                    className="flex items-center justify-center rounded-lg text-xs font-semibold"
                    style={{
                      height: 32,
                      background: isHoje ? "#c9a84c" : isFeriado ? "#ef444420" : "transparent",
                      color: isHoje ? "#0b1624" : isFeriado ? "#ef4444" : isDom ? "#f87171" : "#e8edf5",
                      border: isFeriado && !isHoje ? "1px solid #ef444430" : "none",
                      fontWeight: isHoje || isFeriado ? 800 : 400,
                      cursor: feriadoNome ? "help" : "default",
                    }}>
                    {dia}
                  </div>
                );
              })}
            </div>

            {/* Legenda feriados do mês */}
            {(() => {
              const feriadosMes = Array.from({ length: diasNoMes }, (_, i) => i + 1)
                .filter((d) => feriados.has(`${mes + 1}-${d}`))
                .map((d) => ({ dia: d, nome: feriados.get(`${mes + 1}-${d}`)! }));
              if (feriadosMes.length === 0) return null;
              return (
                <div className="mt-3 space-y-1 pt-2" style={{ borderTop: "1px solid #1e3356" }}>
                  {feriadosMes.map(({ dia, nome }) => (
                    <div key={dia} className="flex items-center gap-2">
                      <span className="text-xs font-black tabular-nums" style={{ color: "#ef4444", minWidth: 20 }}>{dia}</span>
                      <span className="text-xs" style={{ color: "#9aa7ba" }}>{nome}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
