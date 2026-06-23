"use client";
import { useState, useEffect, useRef } from "react";
import { X, Minus, GripHorizontal } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function FloatingROAS() {
  const { roasAberta, fecharROAS } = useAppStore();
  const [aberto, setAberto] = useState(false);
  const [min, setMin] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [receita, setReceita] = useState("");
  const [ads, setAds] = useState("");
  const [custo, setCusto] = useState("");
  const drag = useRef<{ ox: number; oy: number } | null>(null);

  useEffect(() => { if (roasAberta) { setAberto(true); setMin(false); } }, [roasAberta]);

  useEffect(() => {
    if (pos.x === 0 && pos.y === 0 && typeof window !== "undefined") {
      setPos({ x: window.innerWidth - 280, y: window.innerHeight - 340 });
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

  const rv = parseFloat(receita) || 0;
  const av = parseFloat(ads) || 0;
  const cv = parseFloat(custo) || 0;
  const roas = av > 0 ? rv / av : 0;
  const lucro = rv - av - cv;
  const margem = rv > 0 ? (lucro / rv) * 100 : 0;

  if (!aberto) return null;

  return (
    <div className="fixed z-50 select-none" style={{ left: pos.x, top: pos.y, width: 260 }}>
      <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#0e1d33", border: "1px solid #c9a44240", boxShadow: "0 16px 44px rgba(0,0,0,.55)" }}>
        <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          className="flex items-center justify-between px-3 py-2 cursor-move" style={{ background: "#112239", borderBottom: "1px solid rgba(201,164,66,.16)", touchAction: "none" }}>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#e8c462" }}><GripHorizontal size={13} /> 📊 ROAS & Lucro</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setMin(!min)} style={{ color: "#74859c" }}><Minus size={15} /></button>
            <button onClick={() => { setAberto(false); fecharROAS(); }} style={{ color: "#74859c" }}><X size={15} /></button>
          </div>
        </div>

        {!min && (
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
        )}
      </div>
    </div>
  );
}
