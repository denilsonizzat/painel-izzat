"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Zap, X, Moon } from "lucide-react";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

function horaAtual() {
  return new Date().toTimeString().slice(0, 5);
}

export default function OnlineStatusModal({ aberto, onFechar }: Props) {
  const { usuarioAtual, setStatusOnline, setTrabalhando: setTrabalhando_store } = useAppStore();

  const [inicioHora, setInicioHora] = useState(horaAtual);
  const [ateHora, setAteHora] = useState("18:00");
  const [proximoDia, setProximoDia] = useState(false);
  const [foco, setFoco] = useState(false);
  const [trabalhando, setTrabalhando] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setInicioHora(horaAtual());
    if (usuarioAtual?.statusOnline?.ate) {
      setAteHora(usuarioAtual.statusOnline.ate);
      setProximoDia(usuarioAtual.statusOnline.proximoDia ?? false);
    } else if (usuarioAtual?.horarioFim) {
      setAteHora(usuarioAtual.horarioFim);
      setProximoDia(false);
    }
    setFoco(usuarioAtual?.statusOnline?.foco ?? false);
    setTrabalhando(usuarioAtual?.statusOnline?.trabalhando ?? "");
  }, [aberto, usuarioAtual?.id]);

  // Auto-suggest próximo dia when "até" is before "início"
  useEffect(() => {
    if (ateHora && inicioHora && ateHora < inicioHora) {
      setProximoDia(true);
    }
  }, [ateHora, inicioHora]);

  if (!aberto || !usuarioAtual) return null;

  const isOnline = usuarioAtual.statusOnline?.ativo ?? false;

  const handleToggle = () => {
    if (isOnline) {
      setStatusOnline(usuarioAtual.id, false);
    } else {
      setStatusOnline(usuarioAtual.id, true, ateHora, proximoDia);
    }
  };

  const handleAtivar = () => {
    setStatusOnline(usuarioAtual.id, true, ateHora, proximoDia);
    setTrabalhando_store(usuarioAtual.id, trabalhando, foco);
  };

  const handleNaoMostrarHoje = () => {
    const hoje = new Date().toISOString().split("T")[0];
    localStorage.setItem("online-popup-hidden", hoje);
    onFechar();
  };

  const handleAteChange = (val: string) => {
    setAteHora(val);
    if (isOnline && usuarioAtual) {
      setStatusOnline(usuarioAtual.id, true, val, proximoDia);
    }
  };

  const handleProximoDiaChange = (val: boolean) => {
    setProximoDia(val);
    if (isOnline && usuarioAtual) {
      setStatusOnline(usuarioAtual.id, true, ateHora, val);
    }
  };

  const duracaoLabel = (() => {
    if (!inicioHora || !ateHora) return null;
    const [ih, im] = inicioHora.split(":").map(Number);
    const [ah, am] = ateHora.split(":").map(Number);
    let mins = (ah * 60 + am) - (ih * 60 + im);
    if (proximoDia || mins < 0) mins += 24 * 60;
    if (mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "#00000090" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#122039", border: `1px solid ${isOnline ? "#10b98140" : "#1e3356"}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Status de Presença</h2>
            <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>
              {isOnline ? "Sua equipe sabe que você está disponível" : "Ative para avisar sua equipe"}
            </p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-xl" style={{ color: "#9aa7ba" }}>
            <X size={18} />
          </button>
        </div>

        {/* Status label */}
        <div className="text-center mb-5">
          <p
            className="text-4xl font-black tracking-widest"
            style={{ color: isOnline ? (foco ? "#f97316" : "#10b981") : "#334155" }}
          >
            {isOnline ? (foco ? "NO FOCO" : "ONLINE") : "OFFLINE"}
          </p>
          {isOnline && usuarioAtual.statusOnline?.desde && (
            <p className="text-sm mt-1" style={{ color: "#9aa7ba" }}>
              Desde {usuarioAtual.statusOnline.desde}
              {usuarioAtual.statusOnline.ate
                ? " · até " + usuarioAtual.statusOnline.ate + (usuarioAtual.statusOnline.proximoDia ? " (+1 dia)" : "")
                : ""}
            </p>
          )}
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-5">
          <button
            onClick={handleToggle}
            className="relative transition-all hover:opacity-90 active:scale-95"
            style={{ width: 96, height: 52 }}
          >
            <div
              className="w-full h-full rounded-full transition-all duration-300 shadow-lg"
              style={{ background: isOnline ? "#10b981" : "#334155" }}
            >
              <div
                className="absolute top-2 w-11 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-300"
                style={{ left: isOnline ? "calc(100% - 48px)" : "4px", background: "white" }}
              >
                <Zap size={18} style={{ color: isOnline ? "#10b981" : "#64748b" }} />
              </div>
            </div>
          </button>
        </div>

        {/* Modo Foco toggle */}
        {isOnline && (
          <button
            onClick={() => {
              const novoFoco = !foco;
              setFoco(novoFoco);
              setTrabalhando_store(usuarioAtual.id, trabalhando, novoFoco);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all mb-4"
            style={{
              background: foco ? "#f9731620" : "#0b1624",
              border: `1px solid ${foco ? "#f97316" : "#1e3356"}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>🎯</span>
              <span className="text-sm font-semibold" style={{ color: foco ? "#f97316" : "#94a3b8" }}>
                Modo Foco — Não interromper
              </span>
            </div>
            <div
              className="w-9 h-5 rounded-full relative transition-all"
              style={{ background: foco ? "#f97316" : "#334155" }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ left: foco ? "calc(100% - 18px)" : "2px" }}
              />
            </div>
          </button>
        )}

        {/* Trabalhando em */}
        {isOnline && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#9aa7ba" }}>
              Trabalhando em
            </p>
            <input
              type="text"
              value={trabalhando}
              onChange={(e) => {
                const val = e.target.value.slice(0, 60);
                setTrabalhando(val);
                setTrabalhando_store(usuarioAtual.id, val, foco);
              }}
              placeholder="Ex: Criativos para Liora..."
              maxLength={60}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "#0b1624",
                border: "1px solid #1e3356",
                color: "#e8edf5",
              }}
            />
          </div>
        )}

        {/* Time inputs */}
        <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: "#0b1624", border: "1px solid #1e3356" }}>
          {/* Row: De / Até */}
          <div className="grid grid-cols-2 gap-3">
            {/* Início */}
            <div>
              <p className="text-xs mb-1.5 font-semibold uppercase tracking-wider" style={{ color: "#9aa7ba" }}>
                Início
              </p>
              <input
                type="time"
                value={inicioHora}
                onChange={(e) => setInicioHora(e.target.value)}
                className="w-full text-center text-lg font-bold px-2 py-2.5 rounded-xl outline-none"
                style={{
                  background: "#122039",
                  color: "#e8edf5",
                  border: "1px solid #334155",
                  colorScheme: "dark",
                }}
              />
            </div>
            {/* Até */}
            <div>
              <p className="text-xs mb-1.5 font-semibold uppercase tracking-wider" style={{ color: "#9aa7ba" }}>
                Até
              </p>
              <input
                type="time"
                value={ateHora}
                onChange={(e) => handleAteChange(e.target.value)}
                className="w-full text-center text-lg font-bold px-2 py-2.5 rounded-xl outline-none"
                style={{
                  background: "#122039",
                  color: isOnline ? "#10b981" : "#e8edf5",
                  border: `1px solid ${isOnline ? "#10b98130" : "#334155"}`,
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>

          {/* Próximo dia toggle */}
          <div className="space-y-1.5">
            <button
              onClick={() => handleProximoDiaChange(!proximoDia)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
              style={{
                background: proximoDia ? "#8b5cf620" : "transparent",
                border: `1px solid ${proximoDia ? "#8b5cf640" : "#1e3356"}`,
              }}
            >
              <div className="flex items-center gap-2">
                <Moon size={14} style={{ color: proximoDia ? "#8b5cf6" : "#64748b" }} />
                <span className="text-sm font-medium" style={{ color: proximoDia ? "#8b5cf6" : "#64748b" }}>
                  Termina no dia seguinte
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#8b5cf620", color: "#8b5cf6" }}>
                  +1 dia
                </span>
              </div>
              <div
                className="w-9 h-5 rounded-full relative transition-all"
                style={{ background: proximoDia ? "#8b5cf6" : "#334155" }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: proximoDia ? "calc(100% - 18px)" : "2px" }}
                />
              </div>
            </button>
            <p className="text-xs px-1 leading-snug" style={{ color: "#74859c" }}>
              Ative quando seu horario de trabalho passa da meia-noite — ex: entrada 22:00, saida 03:00 do dia seguinte.
            </p>
          </div>

          {/* Duração calculada */}
          {duracaoLabel && (
            <div className="flex items-center justify-center gap-1.5">
              <div className="h-px flex-1" style={{ background: "#1e3356" }} />
              <span className="text-xs font-medium px-2" style={{ color: "#c9a84c" }}>
                {duracaoLabel} de trabalho
              </span>
              <div className="h-px flex-1" style={{ background: "#1e3356" }} />
            </div>
          )}
        </div>

        {/* Activate / Save button */}
        {!isOnline ? (
          <button
            onClick={handleAtivar}
            className="w-full py-3 rounded-xl font-bold text-white mb-4 transition-opacity hover:opacity-90"
            style={{ background: "#10b981" }}
          >
            Ativar Presenca
          </button>
        ) : (
          <button
            onClick={() => { handleAtivar(); onFechar(); }}
            className="w-full py-3 rounded-xl font-bold text-white mb-4 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "#10b981" }}
          >
            ✓ Salvar alteracoes
          </button>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: "1px solid #1e3356" }}
        >
          <p className="text-xs" style={{ color: "#334155" }}>
            {isOnline ? "Equipe notificada" : "Equipe nao te ve online"}
          </p>
          <button
            onClick={handleNaoMostrarHoje}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: "#334155" }}
          >
            Nao exibir mais hoje
          </button>
        </div>
      </div>
    </div>
  );
}
