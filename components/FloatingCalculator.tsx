"use client";
import { useState, useEffect, useRef } from "react";
import { Calculator, X, Minus, GripHorizontal } from "lucide-react";

// Calculadora flutuante GLOBAL. Mora no RootLayout → persiste entre páginas (não remonta).
// Estado salvo em localStorage (sobrevive a reload). Básica + modo Precificação.

type Modo = "basica" | "prec";

export default function FloatingCalculator() {
  const [aberto, setAberto] = useState(false);
  const [min, setMin] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [modo, setModo] = useState<Modo>("basica");
  // básica
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  // precificação
  const [pCusto, setPCusto] = useState("");
  const [pMarkup, setPMarkup] = useState("3");
  const [pTaxas, setPTaxas] = useState("5");
  const [pImposto, setPImposto] = useState("0");
  const drag = useRef<{ ox: number; oy: number } | null>(null);

  // restaura estado
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("calc-state") || "{}");
      if (s.display) setDisplay(s.display);
      if (s.pos) setPos(s.pos);
      if (s.modo) setModo(s.modo);
      if (s.pCusto !== undefined) setPCusto(s.pCusto);
      if (s.pMarkup) setPMarkup(s.pMarkup);
      if (typeof s.aberto === "boolean") setAberto(s.aberto);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("calc-state", JSON.stringify({ display, pos, modo, pCusto, pMarkup, aberto }));
  }, [display, pos, modo, pCusto, pMarkup, aberto]);

  // posição inicial (canto inferior direito)
  useEffect(() => {
    if (pos.x === 0 && pos.y === 0 && typeof window !== "undefined") {
      setPos({ x: window.innerWidth - 320, y: window.innerHeight - 480 });
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

  // ── lógica básica ──
  function digito(d: string) {
    if (resetNext) { setDisplay(d === "." ? "0." : d); setResetNext(false); return; }
    if (d === "." && display.includes(".")) return;
    setDisplay(display === "0" && d !== "." ? d : display + d);
  }
  function aplicarOp(novoOp: string) {
    const atual = parseFloat(display);
    if (acc === null) setAcc(atual);
    else if (op && !resetNext) { const r = calcula(acc, atual, op); setAcc(r); setDisplay(String(r)); }
    setOp(novoOp); setResetNext(true);
  }
  function calcula(a: number, b: number, o: string) {
    if (o === "+") return a + b; if (o === "−") return a - b;
    if (o === "×") return a * b; if (o === "÷") return b !== 0 ? a / b : 0;
    return b;
  }
  function igual() {
    if (op === null || acc === null) return;
    const r = calcula(acc, parseFloat(display), op);
    setDisplay(String(Math.round(r * 1e6) / 1e6)); setAcc(null); setOp(null); setResetNext(true);
  }
  function limpar() { setDisplay("0"); setAcc(null); setOp(null); setResetNext(false); }
  function pct() { setDisplay(String(parseFloat(display) / 100)); }
  function sinal() { setDisplay(String(parseFloat(display) * -1)); }

  // ── precificação ──
  const custo = parseFloat(pCusto) || 0, mk = parseFloat(pMarkup) || 0, tx = (parseFloat(pTaxas) || 0) / 100, imp = (parseFloat(pImposto) || 0) / 100;
  const preco = custo * mk;
  const margem = mk > 0 ? 1 - tx - imp - 1 / mk : 0;
  const cpaMax = preco * (1 - tx) - custo;
  const beroas = cpaMax > 0 ? preco / cpaMax : 0;

  const btn = (label: string, onClick: () => void, tipo: "num" | "op" | "fn" = "num") => (
    <button onClick={onClick} className="rounded-xl font-bold transition-all active:scale-95" style={{
      height: 44, fontSize: 16,
      background: tipo === "op" ? "var(--grad-btn-gold)" : tipo === "fn" ? "#1e3356" : "#152741",
      color: tipo === "op" ? "#0b1624" : tipo === "fn" ? "#9aa7ba" : "#e8edf5",
    }}>{label}</button>
  );

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} title="Calculadora"
        className="fixed z-40 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ right: 18, bottom: 150, width: 46, height: 46, background: "var(--grad-btn-gold)", color: "#0b1624" }}>
        <Calculator size={20} />
      </button>
    );
  }

  return (
    <div className="fixed z-50 select-none" style={{ left: pos.x, top: pos.y, width: 300 }}>
      <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#0e1d33", border: "1px solid #c9a44240", boxShadow: "0 16px 44px rgba(0,0,0,.55)" }}>
        {/* barra de título (arrastar) */}
        <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          className="flex items-center justify-between px-3 py-2 cursor-move" style={{ background: "#112239", borderBottom: "1px solid #1e3356", touchAction: "none" }}>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#e8c462" }}><GripHorizontal size={13} /> Calculadora</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setMin(!min)} style={{ color: "#74859c" }}><Minus size={15} /></button>
            <button onClick={() => setAberto(false)} style={{ color: "#74859c" }}><X size={15} /></button>
          </div>
        </div>

        {!min && (
          <div className="p-3">
            <div className="flex gap-1 p-0.5 rounded-lg mb-3" style={{ background: "#0b1624" }}>
              {(["basica", "prec"] as const).map((m) => (
                <button key={m} onClick={() => setModo(m)} className="flex-1 py-1.5 rounded-md text-xs font-bold" style={{ background: modo === m ? "#c9a442" : "transparent", color: modo === m ? "#0b1624" : "#94a3b8" }}>{m === "basica" ? "Básica" : "Precificação"}</button>
              ))}
            </div>

            {modo === "basica" ? (
              <>
                <div className="rounded-xl px-3 py-3 mb-3 text-right" style={{ background: "#0b1624", border: "1px solid #1e3356" }}>
                  <p className="text-2xl font-extrabold tabular-nums truncate" style={{ color: "#e8edf5" }}>{display}</p>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {btn("C", limpar, "fn")}{btn("±", sinal, "fn")}{btn("%", pct, "fn")}{btn("÷", () => aplicarOp("÷"), "op")}
                  {btn("7", () => digito("7"))}{btn("8", () => digito("8"))}{btn("9", () => digito("9"))}{btn("×", () => aplicarOp("×"), "op")}
                  {btn("4", () => digito("4"))}{btn("5", () => digito("5"))}{btn("6", () => digito("6"))}{btn("−", () => aplicarOp("−"), "op")}
                  {btn("1", () => digito("1"))}{btn("2", () => digito("2"))}{btn("3", () => digito("3"))}{btn("+", () => aplicarOp("+"), "op")}
                  {btn("0", () => digito("0"))}{btn(".", () => digito("."))}
                  <button onClick={igual} className="col-span-2 rounded-xl font-bold active:scale-95" style={{ height: 44, fontSize: 16, background: "var(--grad-green)", color: "#0b1624" }}>=</button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {([["Custo $", pCusto, setPCusto], ["Markup ×", pMarkup, setPMarkup], ["Taxas %", pTaxas, setPTaxas], ["Imposto %", pImposto, setPImposto]] as const).map(([lbl, val, set]) => (
                  <div key={lbl} className="flex items-center justify-between gap-2">
                    <span className="text-xs" style={{ color: "#9aa7ba" }}>{lbl}</span>
                    <input type="number" value={val} onChange={(e) => set(e.target.value)} className="text-right" style={{ background: "#0b1624", border: "1px solid #1e3356", color: "#e8edf5", borderRadius: 8, padding: "5px 8px", width: 100, fontSize: 13, outline: "none" }} />
                  </div>
                ))}
                <div className="rounded-xl p-3 mt-2 space-y-1.5" style={{ background: "#0b1624", border: "1px solid #c9a44230" }}>
                  <Linha lbl="Preço de venda" val={"$" + preco.toFixed(2)} cor="#e8c462" forte />
                  <Linha lbl="Margem real" val={(margem * 100).toFixed(1) + "%"} cor={margem >= 0.2 ? "#46d69b" : "#f2545b"} />
                  <Linha lbl="CPA máximo" val={"$" + cpaMax.toFixed(2)} cor="#9aa7ba" />
                  <Linha lbl="BEROAS" val={beroas.toFixed(2) + "×"} cor="#9aa7ba" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Linha({ lbl, val, cor, forte }: { lbl: string; val: string; cor: string; forte?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "#9aa7ba" }}>{lbl}</span>
      <span className="tabular-nums" style={{ color: cor, fontWeight: forte ? 800 : 700, fontSize: forte ? 17 : 13 }}>{val}</span>
    </div>
  );
}
