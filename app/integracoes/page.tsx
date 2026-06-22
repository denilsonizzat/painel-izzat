"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { LOJAS } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { PLATAFORMAS, listarTodasIntegracoes, Integracao } from "@/lib/integracoes";
import ConexoesModal from "@/components/integracoes/ConexoesModal";
import { Link2 } from "lucide-react";

const COR_STATUS: Record<string, string> = { nao_conectado: "#74859c", configurando: "#f59e0b", conectado: "#10b981" };

export default function IntegracoesPage() {
  const { lojasCustom } = useAppStore();
  const todasLojas = [...LOJAS, ...lojasCustom];
  const [integr, setIntegr] = useState<Integracao[]>([]);
  const [modal, setModal] = useState<{ id: string; nome: string } | null>(null);

  const carregar = () => { listarTodasIntegracoes().then(setIntegr).catch(() => {}); };
  useEffect(() => { carregar(); }, []);

  const statusDe = (lojaId: string, plat: string) => integr.find((i) => i.loja_id === lojaId && i.plataforma === plat)?.status || "nao_conectado";

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <BackButton href="/dashboard" />
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Link2 size={22} style={{ color: "#c9a84c" }} /> Integrações</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>Conexões de API por loja (Shopify, Meta, Google, TikTok). Clique numa loja pra configurar.</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#74859c", textAlign: "left" }}>
              <th className="p-3">Loja</th>
              {PLATAFORMAS.map((p) => <th key={p.id} className="p-3" style={{ color: p.cor }}>{p.nome}</th>)}
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {todasLojas.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>
                  <td className="p-3 text-white font-semibold">{l.nome}</td>
                  {PLATAFORMAS.map((p) => {
                    const st = statusDe(l.id, p.id);
                    return <td key={p.id} className="p-3"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COR_STATUS[st] }} title={st} /></td>;
                  })}
                  <td className="p-3">
                    <button onClick={() => setModal({ id: l.id, nome: l.nome })} className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: "#c9a84c", color: "#0b1624" }}>Configurar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 flex items-center gap-4 text-xs" style={{ color: "#74859c", borderTop: "1px solid rgba(201,164,66,.16)" }}>
          {(["conectado", "configurando", "nao_conectado"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COR_STATUS[s] }} /> {s === "nao_conectado" ? "não conectado" : s}</span>
          ))}
        </div>
      </div>

      {modal && <ConexoesModal lojaId={modal.id} lojaNome={modal.nome} aberto={true} onFechar={() => { setModal(null); carregar(); }} />}
    </div>
  );
}
