"use client";
import { useState, useEffect } from "react";
import { X, Link2, Check } from "lucide-react";
import { PLATAFORMAS, listarIntegracoes, salvarIntegracao, Integracao, StatusIntegracao } from "@/lib/integracoes";

const COR_STATUS: Record<StatusIntegracao, string> = { nao_conectado: "#74859c", configurando: "#f59e0b", conectado: "#10b981" };
const LBL_STATUS: Record<StatusIntegracao, string> = { nao_conectado: "Não conectado", configurando: "Configurando", conectado: "Conectado" };
const COR_DIF: Record<string, string> = { "fácil": "#10b981", "médio": "#f59e0b", "burocrático": "#ef4444" };
const inp = { background: "#1e3356", border: "1px solid #334155", color: "#e8edf5", borderRadius: 9, padding: "7px 9px", outline: "none", fontSize: 13 } as React.CSSProperties;

export default function ConexoesModal({ lojaId, lojaNome, aberto, onFechar }: { lojaId: string; lojaNome: string; aberto: boolean; onFechar: () => void }) {
  const [integr, setIntegr] = useState<Record<string, Integracao>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    listarIntegracoes(lojaId).then((rows) => {
      const m: Record<string, Integracao> = {};
      rows.forEach((r) => { m[r.plataforma] = r; });
      setIntegr(m);
    }).catch(() => {}).finally(() => setCarregando(false));
  }, [aberto, lojaId]);

  if (!aberto) return null;

  const get = (p: string): Integracao => integr[p] || { loja_id: lojaId, plataforma: p, status: "nao_conectado", conta: "" };
  const set = (p: string, patch: Partial<Integracao>) => setIntegr({ ...integr, [p]: { ...get(p), ...patch } });
  async function salvar(p: string) {
    setSalvando(p);
    try { await salvarIntegracao(get(p)); } finally { setSalvando(null); }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#00000090", backdropFilter: "blur(2px)" }} onClick={onFechar}>
      <div className="modal-card w-full max-w-lg rounded-2xl p-4 overflow-y-auto" style={{ background: "#122039", border: "1px solid #1e3356", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-white font-bold text-lg flex items-center gap-2"><Link2 size={18} style={{ color: "#c9a84c" }} /> Conexões — {lojaNome}</h2>
          <button onClick={onFechar} style={{ color: "#74859c" }}><X size={18} /></button>
        </div>
        <p className="text-xs mb-3" style={{ color: "#9aa7ba" }}>Conecte esta loja às plataformas. O token de API entra na fase de sincronização (guardado no servidor, com segurança).</p>

        {carregando ? <div className="p-6 text-center text-sm" style={{ color: "#74859c" }}>Carregando...</div> : (
          <div className="space-y-2.5">
            {PLATAFORMAS.map((pl) => {
              const it = get(pl.id);
              return (
                <div key={pl.id} className="rounded-xl p-3" style={{ background: "#0f1c30", border: `1px solid ${COR_STATUS[it.status]}30` }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: pl.cor }}>{pl.nome}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: COR_DIF[pl.dificuldade] + "20", color: COR_DIF[pl.dificuldade] }}>{pl.dificuldade}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: COR_STATUS[it.status] + "20", color: COR_STATUS[it.status] }}>{LBL_STATUS[it.status]}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "#74859c" }}>Precisa: {pl.precisa} · <span style={{ color: "#9aa7ba" }}>{pl.valor}</span></p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select value={it.status} onChange={(e) => set(pl.id, { status: e.target.value as StatusIntegracao })} style={{ ...inp, width: "auto" }}>
                      <option value="nao_conectado">Não conectado</option>
                      <option value="configurando">Configurando</option>
                      <option value="conectado">Conectado</option>
                    </select>
                    <input value={it.conta || ""} onChange={(e) => set(pl.id, { conta: e.target.value })} placeholder="conta / domínio (opcional)" style={{ ...inp, flex: 1, minWidth: 120 }} />
                    <button onClick={() => salvar(pl.id)} disabled={salvando === pl.id} className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 flex items-center gap-1" style={{ background: "#c9a84c", color: "#0b1624" }}>
                      <Check size={12} /> {salvando === pl.id ? "..." : "Salvar"}
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="rounded-xl p-3 text-xs" style={{ background: "#ef444410", border: "1px solid #ef444425", color: "#9aa7ba" }}>
              <b style={{ color: "#e8edf5" }}>Twitter/X Ads:</b> API paga e restrita — não recomendado, fora do escopo.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
