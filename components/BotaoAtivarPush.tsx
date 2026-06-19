"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ativarPush, pushSuportado, vapidConfigurado } from "@/lib/push";
import { BellRing, Check } from "lucide-react";

/** Botão para o colaborador ativar push no próprio dispositivo. */
export default function BotaoAtivarPush() {
  const usuarioAtual = useAppStore((s) => s.usuarioAtual);
  const [estado, setEstado] = useState<"idle" | "ativando" | "ok" | "erro">("idle");
  const [msg, setMsg] = useState("");

  if (!usuarioAtual || !pushSuportado()) return null;

  async function ativar() {
    setEstado("ativando");
    const r = await ativarPush(usuarioAtual!.id);
    if (r.ok) { setEstado("ok"); setMsg("Notificações ativadas neste dispositivo!"); }
    else { setEstado("erro"); setMsg(r.motivo || "Não foi possível ativar"); }
  }

  if (estado === "ok") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ color: "#10b981" }}>
        <Check size={13} /> {msg}
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <button
        onClick={ativar}
        disabled={estado === "ativando"}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: "#c9a84c20", color: "#c9a84c", border: "1px solid #c9a84c30" }}
      >
        <BellRing size={13} />
        {estado === "ativando" ? "Ativando..." : "Ativar notificações no dispositivo"}
      </button>
      {estado === "erro" && (
        <p className="text-xs mt-1.5 text-center" style={{ color: "#9aa7ba" }}>
          {msg}{!vapidConfigurado() ? " (será ativado após publicar online)" : ""}
        </p>
      )}
    </div>
  );
}
