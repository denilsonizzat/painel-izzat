"use client";
import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LOJAS, Prioridade } from "@/lib/data";

export default function AdminFAB() {
  const { usuarioAtual, colaboradores, criarTarefa } = useAppStore();
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ titulo: "", prioridade: "alta" as Prioridade, atribuidoPara: "", lojaId: "" });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("admin-fab-offset") || "{}");
      if (typeof s.x === "number") setOffset(s);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-fab-offset", JSON.stringify(offset));
  }, [offset]);

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
    if (!moved.current) setModalAberto(true);
    drag.current = null;
  }

  const handleCriar = () => {
    if (!form.titulo || !form.atribuidoPara) return;
    criarTarefa({ ...form, descricao: "", status: "pendente", criadoPor: usuarioAtual?.id || "" });
    setForm({ titulo: "", prioridade: "alta", atribuidoPara: "", lojaId: "" });
    setModalAberto(false);
  };

  if (!usuarioAtual || usuarioAtual.nivelAcesso !== "admin") return null;

  return (
    <>
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="fixed z-30 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
        style={{
          bottom: 24, right: 24,
          background: "#c9a84c", color: "#0b1624",
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          touchAction: "none",
          cursor: moved.current ? "grabbing" : "grab",
        }}
        data-tip="Nova Tarefa Rápida (arraste para mover)"
        data-tip-place="left"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000090" }} onClick={() => setModalAberto(false)}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Nova Tarefa</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#9aa7ba" }}><X size={20} /></button>
            </div>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="O que precisa ser feito?" autoFocus
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}
              onKeyDown={(e) => e.key === "Enter" && handleCriar()} />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as Prioridade })}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "#1e3356", border: "1px solid #334155" }}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baixa">Baixa</option>
              </select>
              <select value={form.atribuidoPara} onChange={(e) => setForm({ ...form, atribuidoPara: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "#1e3356", border: "1px solid #334155" }}>
                <option value="">Para quem?</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome.split(" ")[0]}</option>
                ))}
              </select>
            </div>
            <select value={form.lojaId} onChange={(e) => setForm({ ...form, lojaId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}>
              <option value="">Sem loja</option>
              <option value="grupo-izzat">Grupo Izzat (geral)</option>
              {LOJAS.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            <button onClick={handleCriar} disabled={!form.titulo || !form.atribuidoPara}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "#c9a84c" }}>
              Criar Tarefa
            </button>
          </div>
        </div>
      )}
    </>
  );
}
