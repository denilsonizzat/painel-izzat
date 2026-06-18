"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { semanaAtualKey } from "@/lib/data";
import { CheckCircle2, Circle, Clock, AlertTriangle, Plus, Trash2, X } from "lucide-react";

export default function AbaEntregas() {
  const { usuarioAtual, entregasSemanais, criarEntregaSemanal, atualizarStatusEntrega, deletarEntregaSemanal } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [nova, setNova] = useState("");
  const [travandoId, setTravandoId] = useState<string | null>(null);
  const [motivoTravado, setMotivoTravado] = useState("");

  if (!usuarioAtual) return null;
  const minhasEntregas = entregasSemanais.filter((e) => e.colaboradorId === usuarioAtual.id && e.semana === semanaAtualKey());

  const adicionar = () => {
    if (!nova.trim()) return;
    criarEntregaSemanal(usuarioAtual.id, nova.trim());
    setNova("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#10b98110", border: "1px solid #10b98125", borderLeft: "3px solid #10b981" }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>ENTREGAS DA SEMANA</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#10b98120", color: "#10b981" }}>Compromissos até sexta</span>
          </div>
          <p className="text-xs" style={{ color: "#475569" }}>
            O que você se comprometeu a entregar esta semana. Registre e atualize o status.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {minhasEntregas.length > 0 && (
            <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ background: "#10b98120", color: "#10b981" }}>
              {minhasEntregas.filter(e => e.status === "entregue").length}/{minhasEntregas.length}
            </span>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ background: "#10b98120", color: "#10b981" }}
          >
            <Plus size={12} /> Adicionar
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-xl p-3 flex gap-2" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <input
            autoFocus
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            placeholder="O que você vai entregar esta semana?"
            className="flex-1 px-3 py-1.5 rounded-lg text-sm text-white outline-none"
            style={{ background: "#1e3356", border: "1px solid #334155" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") adicionar();
              if (e.key === "Escape") { setShowAdd(false); setNova(""); }
            }}
          />
          <button onClick={adicionar} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#c9a84c", color: "#0b1624" }}>OK</button>
          <button onClick={() => { setShowAdd(false); setNova(""); }} className="px-2 py-1.5 rounded-lg" style={{ color: "#64748b" }}><X size={14} /></button>
        </div>
      )}

      {minhasEntregas.length === 0 && !showAdd && (
        <div className="rounded-2xl p-5 text-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="text-2xl mb-2">📦</div>
          <p className="text-sm font-medium" style={{ color: "#475569" }}>Nenhuma entrega desta semana ainda</p>
          <p className="text-xs mt-1 mb-3" style={{ color: "#334155" }}>
            Registre o que você se compromete a entregar até sexta-feira.
          </p>
          <button
            onClick={() => setShowAdd(true)}
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
              {e.status === "pendente" && <Circle size={16} style={{ color: "#64748b" }} />}
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
                      if (ev.key === "Enter") { atualizarStatusEntrega(e.id, "travado", motivoTravado || undefined); setTravandoId(null); setMotivoTravado(""); }
                      if (ev.key === "Escape") { setTravandoId(null); setMotivoTravado(""); }
                    }}
                  />
                  <button onClick={() => { atualizarStatusEntrega(e.id, "travado", motivoTravado || undefined); setTravandoId(null); setMotivoTravado(""); }} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#ef444420", color: "#ef4444" }}>Confirmar</button>
                  <button onClick={() => { setTravandoId(null); setMotivoTravado(""); }} className="px-2 py-1 rounded-lg" style={{ color: "#64748b" }}><X size={12} /></button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {e.status === "pendente" && (
                <button onClick={() => atualizarStatusEntrega(e.id, "em_andamento")} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#3b82f615", color: "#3b82f6" }}>Iniciar</button>
              )}
              {e.status === "em_andamento" && travandoId !== e.id && (
                <>
                  <button onClick={() => atualizarStatusEntrega(e.id, "entregue")} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#10b98115", color: "#10b981" }}>Entregar</button>
                  <button onClick={() => setTravandoId(e.id)} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#ef444415", color: "#ef4444" }}>Travado</button>
                </>
              )}
              {e.status === "travado" && travandoId !== e.id && (
                <button onClick={() => atualizarStatusEntrega(e.id, "em_andamento")} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#3b82f615", color: "#3b82f6" }}>Retomar</button>
              )}
              <button onClick={() => deletarEntregaSemanal(e.id)} className="p-1 rounded-lg ml-0.5" style={{ color: "#334155" }}><Trash2 size={12} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
