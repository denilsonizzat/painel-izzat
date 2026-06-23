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
  const [foco, setFoco] = useState(false);
  const [trabalhando, setTrabalhando] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setInicioHora(horaAtual());
    if (usuarioAtual?.statusOnline?.ate) {
      setAteHora(usuarioAtual.statusOnline.ate);
    } else if (usuarioAtual?.horarioFim) {
      setAteHora(usuarioAtual.horarioFim);
    }
    setFoco(usuarioAtual?.statusOnline?.foco ?? false);
    setTrabalhando(usuarioAtual?.statusOnline?.trabalhando ?? "");
  }, [aberto, usuarioAtual?.id]);

  if (!aberto || !usuarioAtual) return null;

  // "Termina no dia seguinte" é AUTOMÁTICO: se a saída é igual/antes da entrada,
  // o turno cruza a meia-noite (ex: 22:00 → 03:00). Sem toggle, sem fricção.
  const proximoDia = !!ateHora && !!inicioHora && ateHora < inicioHora;

  // Datas legíveis (hoje → amanhã quando cruza meia-noite)
  const fmtDataDia = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  };

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
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "#00000090", backdropFilter: "blur(2px)" }}
      onClick={onFechar}
    >
      <div
        className="modal-card w-full max-w-sm rounded-2xl p-4 overflow-y-auto"
        style={{ background: "#112239", border: `1px solid ${isOnline ? "#36C98E40" : "#1e3356"}`, maxHeight: "94vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
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
        <div className="text-center mb-3">
          <p
            className="text-2xl font-black tracking-widest"
            style={{ color: isOnline ? (foco ? "#E8733D" : "#36C98E") : "#334155" }}
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
        <div className="flex justify-center mb-3">
          <button
            onClick={handleToggle}
            className="relative transition-all hover:opacity-90 active:scale-95"
            style={{ width: 84, height: 44 }}
          >
            <div
              className="w-full h-full rounded-full transition-all duration-300 shadow-lg"
              style={{ background: isOnline ? "#36C98E" : "#334155" }}
            >
              <div
                className="absolute top-1.5 w-9 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-300"
                style={{ left: isOnline ? "calc(100% - 40px)" : "4px", background: "white" }}
              >
                <Zap size={18} style={{ color: isOnline ? "#36C98E" : "#64748b" }} />
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
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all mb-3"
            style={{
              background: foco ? "#E8733D20" : "#0b1624",
              border: `1px solid ${foco ? "#E8733D" : "#1e3356"}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>🎯</span>
              <span className="text-sm font-semibold" style={{ color: foco ? "#E8733D" : "#94a3b8" }}>
                Modo Foco — Não interromper
              </span>
            </div>
            <div
              className="w-9 h-5 rounded-full relative transition-all"
              style={{ background: foco ? "#E8733D" : "#334155" }}
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
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9aa7ba" }}>
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
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                background: "#0b1624",
                border: "1px solid rgba(201,164,66,.16)",
                color: "#e8edf5",
              }}
            />
          </div>
        )}

        {/* Time inputs */}
        <div className="rounded-xl p-3 mb-3 space-y-2" style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}>
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
                className="w-full text-center text-base font-bold px-2 py-2 rounded-xl outline-none"
                style={{
                  background: "#112239",
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
                className="w-full text-center text-base font-bold px-2 py-2 rounded-xl outline-none"
                style={{
                  background: "#112239",
                  color: isOnline ? "#36C98E" : "#e8edf5",
                  border: `1px solid ${isOnline ? "#36C98E30" : "#334155"}`,
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>

          {/* Indicador automático: vira o dia sozinho quando cruza a meia-noite */}
          {proximoDia && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#7C6FE015", border: "1px solid #7C6FE030" }}>
              <Moon size={14} style={{ color: "#7C6FE0", flexShrink: 0 }} />
              <span className="text-xs" style={{ color: "#c4b5fd" }}>
                Vira a madrugada — <strong style={{ color: "#7C6FE0" }}>{fmtDataDia(0)}</strong> → <strong style={{ color: "#7C6FE0" }}>{fmtDataDia(1)}</strong>
              </span>
            </div>
          )}

          {/* Duração calculada (automática) */}
          {duracaoLabel && (
            <div className="flex items-center justify-center gap-1.5">
              <div className="h-px flex-1" style={{ background: "#1e3356" }} />
              <span className="text-xs font-bold px-2" style={{ color: "#c9a84c" }}>
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
            className="w-full py-2.5 rounded-xl font-bold text-white mb-3 transition-opacity hover:opacity-90"
            style={{ background: "#36C98E" }}
          >
            Ativar Presenca
          </button>
        ) : (
          <button
            onClick={() => { handleAtivar(); onFechar(); }}
            className="w-full py-2.5 rounded-xl font-bold text-white mb-3 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "#36C98E" }}
          >
            ✓ Salvar alteracoes
          </button>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}
        >
          <p className="text-xs" style={{ color: "#9aa7ba" }}>
            {isOnline ? "Equipe notificada" : "Equipe não te vê online"}
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
