"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Zap } from "lucide-react";

const HUMORES = [
  { emoji: "🔥", label: "Animado" },
  { emoji: "😊", label: "Bem" },
  { emoji: "😐", label: "Normal" },
  { emoji: "😩", label: "Cansado" },
  { emoji: "💪", label: "Focado" },
];

export default function CheckInDiario() {
  const { usuarioAtual, registrarCheckIn, adicionarAtividadeEntry } = useAppStore();
  const [visivel, setVisivel] = useState(false);
  const [humor, setHumor] = useState("");
  const [foco, setFoco] = useState("");
  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    if (!usuarioAtual) return;
    const hoje = new Date().toISOString().split("T")[0];
    if (usuarioAtual.ultimoCheckIn === hoje) return;
    const timer = setTimeout(() => setVisivel(true), 1200);
    return () => clearTimeout(timer);
  }, [usuarioAtual]);

  if (!visivel || !usuarioAtual) return null;

  const handleConfirmar = () => {
    if (!humor) return;
    setAnimando(true);
    registrarCheckIn(usuarioAtual.id);
    if (foco.trim()) {
      adicionarAtividadeEntry({
        colaboradorId: usuarioAtual.id,
        tipo: "check_in",
        descricao: "Foco de hoje: " + foco.trim(),
        hora: new Date().toTimeString().slice(0, 5),
        data: new Date().toISOString().split("T")[0],
      });
    }
    setTimeout(() => setVisivel(false), 400);
  };

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{
          background: "#112239",
          border: "1px solid #c9a84c30",
          boxShadow: "0 24px 64px #00000080",
          transform: animando ? "scale(0.96)" : "scale(1)",
          opacity: animando ? 0 : 1,
          transition: "all 0.3s ease",
        }}
      >
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">☀️</div>
          <h2 className="text-lg font-bold text-white">
            Bom dia, {usuarioAtual.nome.split(" ")[0]}!
          </h2>
          <p className="text-xs mt-0.5 capitalize" style={{ color: "#9aa7ba" }}>{hoje}</p>
        </div>

        {/* Humor */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9aa7ba" }}>
            Como voce esta chegando hoje?
          </p>
          <div className="flex gap-2 justify-between">
            {HUMORES.map((h) => (
              <button
                key={h.emoji}
                onClick={() => setHumor(h.emoji)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                style={{
                  background: humor === h.emoji ? "#c9a84c20" : "#1e3356",
                  border: `1px solid ${humor === h.emoji ? "#c9a84c" : "transparent"}`,
                  transform: humor === h.emoji ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span style={{ fontSize: 22 }}>{h.emoji}</span>
                <span className="text-xs" style={{ color: humor === h.emoji ? "#c9a84c" : "#64748b" }}>
                  {h.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Foco */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9aa7ba" }}>
            Qual sua prioridade #1 hoje? <span style={{ color: "#334155" }}>(opcional)</span>
          </p>
          <input
            type="text"
            value={foco}
            onChange={(e) => setFoco(e.target.value)}
            placeholder="Ex: Finalizar relatorio de vendas..."
            maxLength={80}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: "#1e3356", border: "1px solid #334155" }}
            onKeyDown={(e) => { if (e.key === "Enter" && humor) handleConfirmar(); }}
          />
        </div>

        {/* Streak */}
        {(usuarioAtual.streak || 0) > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#f59e0b10", border: "1px solid #f59e0b20" }}>
            <span>🔥</span>
            <p className="text-xs" style={{ color: "#f59e0b" }}>
              Voce esta em uma sequencia de <strong>{usuarioAtual.streak} dias</strong>! Mantenha!
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleConfirmar}
          disabled={!humor}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          style={{ background: humor ? "#c9a84c" : "#1e3356", color: humor ? "#0b1624" : "#64748b" }}
        >
          <Zap size={16} />
          Comecar o dia!
        </button>
      </div>
    </div>
  );
}
