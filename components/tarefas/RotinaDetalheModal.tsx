"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS, Subtarefa } from "@/lib/data";
import { LABEL_FREQUENCIA } from "@/lib/recorrencia";
import { X, CheckCircle2, Circle, Play, Plus, Trash2, AlignLeft } from "lucide-react";

const uid = () => `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/** Detalhe de uma rotina (estilo kanban): macro + subtarefas, cada uma com descrição editável. */
export default function RotinaDetalheModal({ rotinaId, onClose }: { rotinaId: string; onClose: () => void }) {
  const { rotinas, marcarSubtarefa, concluirRotina, editarRotina, abrirPomodoro } = useAppStore();
  const rotina = rotinas.find((r) => r.id === rotinaId);
  const [novaSub, setNovaSub] = useState("");
  const [subAberta, setSubAberta] = useState<string | null>(null);

  if (!rotina) return null;
  const loja = LOJAS.find((l) => l.id === rotina.lojaId);
  const subs = rotina.subtarefas;
  const subFeitas = subs.filter((s) => s.concluida).length;

  function salvarDescMacro(texto: string) {
    editarRotina(rotina!.id, { descricao: texto });
  }
  function addSub() {
    const t = novaSub.trim();
    if (!t) return;
    const nova: Subtarefa = { id: uid(), titulo: t, concluida: false };
    editarRotina(rotina!.id, { subtarefas: [...subs, nova] });
    setNovaSub("");
  }
  function updateSub(subId: string, campo: Partial<Subtarefa>) {
    editarRotina(rotina!.id, { subtarefas: subs.map((s) => s.id === subId ? { ...s, ...campo } : s) });
  }
  function removeSub(subId: string) {
    editarRotina(rotina!.id, { subtarefas: subs.filter((s) => s.id !== subId) });
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000090", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="modal-card w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#0ea5e920", color: "#0ea5e9" }}>
                  {LABEL_FREQUENCIA[rotina.frequencia]}
                </span>
                {loja && <span className="text-xs" style={{ color: "#9aa7ba" }}>{loja.nome}</span>}
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">{rotina.titulo}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl flex-shrink-0" style={{ color: "#9aa7ba" }}><X size={18} /></button>
          </div>

          {/* Ações principais */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => concluirRotina(rotina.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
              style={{ background: "#10b98120", color: "#10b981" }}
            >
              <CheckCircle2 size={15} /> Concluir
            </button>
            <button
              onClick={() => abrirPomodoro(rotina.id, rotina.titulo)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
              style={{ background: "#3b82f620", color: "#3b82f6" }}
              data-tip="Inicia um cronômetro de foco de 25 min para você fazer esta tarefa sem distração"
            >
              <Play size={15} /> Iniciar tarefa
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5" style={{ maxHeight: "calc(90vh - 150px)" }}>
          {/* Descrição da macro */}
          <div>
            <label className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={{ color: "#94a3b8" }}>
              <AlignLeft size={12} /> Descrição / observações
            </label>
            <textarea
              defaultValue={rotina.descricao || ""}
              onBlur={(e) => salvarDescMacro(e.target.value)}
              placeholder="Detalhe a tarefa, passo a passo, links, onde clicar..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
              style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
            />
          </div>

          {/* Subtarefas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
                Subtarefas {subs.length > 0 && <span style={{ color: "#74859c" }}>({subFeitas}/{subs.length})</span>}
              </label>
            </div>

            <div className="space-y-2">
              {subs.map((sub) => {
                const aberta = subAberta === sub.id;
                return (
                  <div key={sub.id} className="rounded-xl" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                    <div className="flex items-center gap-2 p-2.5">
                      <button onClick={() => marcarSubtarefa(rotina.id, sub.id, !sub.concluida)} className="flex-shrink-0" data-tip="Marcar como feita">
                        {sub.concluida ? <CheckCircle2 size={18} style={{ color: "#10b981" }} /> : <Circle size={18} style={{ color: "#74859c" }} />}
                      </button>
                      <input
                        defaultValue={sub.titulo}
                        onBlur={(e) => { if (e.target.value.trim() && e.target.value !== sub.titulo) updateSub(sub.id, { titulo: e.target.value.trim() }); }}
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: sub.concluida ? "#64748b" : "#e2e8f0", textDecoration: sub.concluida ? "line-through" : "none" }}
                      />
                      <button onClick={() => setSubAberta(aberta ? null : sub.id)} className="flex-shrink-0 p-1 rounded-lg" style={{ color: sub.descricao ? "#3b82f6" : "#475569" }} data-tip="Adicionar descrição / observação">
                        <AlignLeft size={14} />
                      </button>
                      <button onClick={() => abrirPomodoro(rotina.id, `${rotina.titulo} — ${sub.titulo}`)} className="flex-shrink-0 p-1 rounded-lg" style={{ color: "#3b82f6" }} data-tip="Iniciar foco só nesta subtarefa">
                        <Play size={14} />
                      </button>
                      <button onClick={() => removeSub(sub.id)} className="flex-shrink-0 p-1 rounded-lg" style={{ color: "#74859c" }} data-tip="Remover subtarefa">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {(aberta || sub.descricao) && (
                      <div className="px-2.5 pb-2.5">
                        <textarea
                          defaultValue={sub.descricao || ""}
                          onBlur={(e) => updateSub(sub.id, { descricao: e.target.value })}
                          placeholder="Observação ou passo a passo desta subtarefa..."
                          rows={2}
                          className="w-full px-2.5 py-2 rounded-lg text-xs text-white outline-none resize-none"
                          style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add subtarefa */}
            <div className="flex gap-2 mt-2">
              <input
                value={novaSub}
                onChange={(e) => setNovaSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addSub(); }}
                placeholder="Adicionar subtarefa..."
                className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
              />
              <button onClick={addSub} disabled={!novaSub.trim()} className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40" style={{ background: "#c9a84c20", color: "#c9a84c" }}>
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
