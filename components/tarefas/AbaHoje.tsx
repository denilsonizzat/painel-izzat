"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS } from "@/lib/data";
import { Circle, RefreshCw, ListTodo, Clock, Play, ChevronRight } from "lucide-react";
import { rotinasDoColaborador, venceHoje, concluidaHoje, estaAtrasada, hojeStr, LABEL_FREQUENCIA } from "@/lib/recorrencia";
import RotinaDetalheModal from "./RotinaDetalheModal";

/** Aba "Hoje": tudo que a pessoa precisa fazer hoje — rotinas que vencem hoje + avulsas pendentes. */
export default function AbaHoje() {
  const { usuarioAtual, rotinas, tarefas, concluirRotina, abrirPomodoro, atualizarStatusTarefa } = useAppStore();
  const [detalheId, setDetalheId] = useState<string | null>(null);
  if (!usuarioAtual) return null;

  const hoje = hojeStr();
  const minhasRotinas = rotinasDoColaborador(rotinas, usuarioAtual.id);
  const rotinasHoje = minhasRotinas.filter((r) => venceHoje(r) && !concluidaHoje(r));

  const avulsasHoje = tarefas.filter((t) => {
    const minha = t.atribuidoPara === usuarioAtual.id || (t.membros || []).some((m) => m.colaboradorId === usuarioAtual.id);
    if (!minha || t.status === "concluida" || t.status === "aguardando_revisao") return false;
    return !t.dataLimite || t.dataLimite <= hoje;
  });

  const total = rotinasHoje.length + avulsasHoje.length;

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl" style={{ background: "#10b98110", border: "1px solid #10b98125", borderLeft: "3px solid #10b981" }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>O que você tem para hoje</p>
        <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
          Rotinas que vencem hoje (de qualquer frequência) + tarefas avulsas pendentes. Atualiza sozinho todo dia.
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-white mb-1">Tudo certo por hoje!</p>
          <p className="text-sm" style={{ color: "#64748b" }}>Nenhuma rotina ou tarefa pendente para hoje.</p>
        </div>
      )}

      {/* Rotinas de hoje */}
      {rotinasHoje.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#0ea5e9" }}>
            <RefreshCw size={12} /> Rotinas de hoje ({rotinasHoje.length})
          </p>
          {rotinasHoje.map((rotina) => {
            const loja = LOJAS.find((l) => l.id === rotina.lojaId);
            const subFeitas = rotina.subtarefas.filter((s) => s.concluida).length;
            const atrasada = estaAtrasada(rotina);
            return (
              <div key={rotina.id} className="rounded-2xl flex items-center gap-3 p-4" style={{ background: "#122039", border: `1px solid ${atrasada ? "#ef444450" : "#1e3356"}` }}>
                <span role="button" tabIndex={0} className="flex-shrink-0 cursor-pointer"
                  onClick={() => concluirRotina(rotina.id)}
                  onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") concluirRotina(rotina.id); }}
                  title="Concluir rotina inteira">
                  <Circle size={22} style={{ color: "#475569" }} />
                </span>
                <button className="flex-1 min-w-0 text-left" onClick={() => setDetalheId(rotina.id)} title="Abrir detalhes, subtarefas e descrição">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#0ea5e920", color: "#0ea5e9" }}>{LABEL_FREQUENCIA[rotina.frequencia]}</span>
                    {atrasada && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>Atrasada</span>}
                  </div>
                  <p className="text-white font-medium text-sm">{rotina.titulo}</p>
                  {loja && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{loja.nome}</p>}
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => abrirPomodoro(rotina.id, rotina.titulo)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#3b82f615", color: "#3b82f6" }} title="Iniciar um foco cronometrado de 25 min">
                    <Play size={13} /> Iniciar
                  </button>
                  {rotina.subtarefas.length > 0 && <span className="text-xs" style={{ color: "#64748b" }}>{subFeitas}/{rotina.subtarefas.length}</span>}
                  <button onClick={() => setDetalheId(rotina.id)} title="Abrir detalhes"><ChevronRight size={16} style={{ color: "#64748b" }} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Avulsas de hoje */}
      {avulsasHoje.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#c9a84c" }}>
            <ListTodo size={12} /> Tarefas avulsas ({avulsasHoje.length})
          </p>
          {avulsasHoje.map((t) => {
            const loja = LOJAS.find((l) => l.id === t.lojaId);
            const atrasada = t.status === "atrasada" || (t.dataLimite ? t.dataLimite < hoje : false);
            return (
              <div key={t.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#122039", border: `1px solid ${atrasada ? "#ef444450" : "#1e3356"}` }}>
                <button onClick={() => atualizarStatusTarefa(t.id, "concluida")} className="flex-shrink-0" title="Concluir tarefa">
                  <Circle size={22} style={{ color: "#475569" }} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#c9a84c20", color: "#c9a84c" }}>Avulsa</span>
                    {atrasada && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>Atrasada</span>}
                    {t.dataLimite === hoje && !atrasada && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#f59e0b20", color: "#f59e0b" }}>Vence hoje</span>}
                    {t.dataLimite && <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}><Clock size={11} /> {t.dataLimite}</span>}
                  </div>
                  <p className="text-white font-medium text-sm">{t.titulo}</p>
                  {t.descricao && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{t.descricao}</p>}
                  {loja && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{loja.nome}</p>}
                </div>
                <button onClick={() => abrirPomodoro(t.id, t.titulo)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0" style={{ background: "#3b82f615", color: "#3b82f6" }} title="Iniciar foco cronometrado de 25 min">
                  <Play size={13} /> Iniciar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {detalheId && <RotinaDetalheModal rotinaId={detalheId} onClose={() => setDetalheId(null)} />}
    </div>
  );
}
