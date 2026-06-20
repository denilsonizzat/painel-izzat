"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS } from "@/lib/data";
import BackButton from "@/components/BackButton";
import PrecificacaoApp from "@/components/precificacao/PrecificacaoApp";
import { Store } from "lucide-react";

export default function PrecificacaoPage() {
  const { lojasCustom } = useAppStore();
  const todasLojas = [...LOJAS, ...lojasCustom];
  const [lojaId, setLojaId] = useState<string>(todasLojas[0]?.id || "");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("loja");
    if (p && todasLojas.some((l) => l.id === p)) setLojaId(p);
  }, []);
  const loja = todasLojas.find((l) => l.id === lojaId);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <BackButton href="/dashboard" />
      <div>
        <h1 className="text-2xl font-bold text-white">Precificação</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>Avaliar produto → precificar por mercado → decidir → enviar pra esteira</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Store size={15} style={{ color: "#74859c" }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#74859c" }}>Loja:</span>
        {todasLojas.map((l) => {
          const ativo = l.id === lojaId;
          return (
            <button key={l.id} onClick={() => setLojaId(l.id)} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: ativo ? (l.cor || "#c9a84c") + "22" : "#122039", color: ativo ? (l.cor || "#c9a84c") : "#94a3b8", border: `1px solid ${ativo ? (l.cor || "#c9a84c") : "#1e3356"}` }}>
              {l.nome}
            </button>
          );
        })}
      </div>
      {loja && <PrecificacaoApp key={loja.id} lojaId={loja.id} lojaNome={loja.nome} />}
    </div>
  );
}
