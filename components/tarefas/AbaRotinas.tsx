"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS, Frequencia } from "@/lib/data";
import { CheckCircle2, Circle, CalendarClock, Play, ChevronRight } from "lucide-react";
import {
  venceHoje, concluidaHoje, estaAtrasada, rotinasDoColaborador,
  LABEL_FREQUENCIA, ORDEM_FREQUENCIA, fmtDataCurta,
} from "@/lib/recorrencia";
import RotinaDetalheModal from "./RotinaDetalheModal";

const FREQ_COR: Record<Frequencia, string> = {
  diaria: "#36C98E",
  semanal: "#4D9DE0",
  quinzenal: "#0ea5e9",
  mensal: "#E8A33D",
  trimestral: "#7C6FE0",
  semestral: "#ec4899",
  anual: "#F2545B",
};

export default function AbaRotinas() {
  const { usuarioAtual, rotinas: todasRotinas, concluirRotina, reabrirRotina, abrirPomodoro } = useAppStore();
  const [subAba, setSubAba] = useState<Frequencia>("diaria");
  const [detalheId, setDetalheId] = useState<string | null>(null);

  if (!usuarioAtual) return null;
  const rotinas = rotinasDoColaborador(todasRotinas, usuarioAtual.id);

  const rotinasDaSubAba = rotinas.filter((r) => r.frequencia === subAba);
  const pendentes = rotinasDaSubAba.filter((r) => !concluidaHoje(r));
  const concluidas = rotinasDaSubAba.filter((r) => concluidaHoje(r));
  const contFreq = (f: Frequencia) => rotinas.filter((r) => r.frequencia === f).length;

  return (
    <div className="space-y-5">
      {/* Sub-abas por frequência */}
      <div className="flex gap-2 flex-wrap">
        {ORDEM_FREQUENCIA.map((f) => {
          const ativo = subAba === f;
          const n = contFreq(f);
          return (
            <button
              key={f}
              onClick={() => setSubAba(f)}
              data-tip={`Rotinas de frequência ${LABEL_FREQUENCIA[f].toLowerCase()}`}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: ativo ? FREQ_COR[f] + "20" : "#112239",
                border: `1px solid ${ativo ? FREQ_COR[f] : "#1e3356"}`,
                color: ativo ? FREQ_COR[f] : "#64748b",
              }}
            >
              {LABEL_FREQUENCIA[f]}{n > 0 ? ` (${n})` : ""}
            </button>
          );
        })}
      </div>

      {/* Cabeçalho contextual */}
      <div className="p-3 rounded-xl" style={{ background: FREQ_COR[subAba] + "10", border: `1px solid ${FREQ_COR[subAba]}25`, borderLeft: `3px solid ${FREQ_COR[subAba]}` }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: FREQ_COR[subAba] }}>
          Rotinas {LABEL_FREQUENCIA[subAba].toLowerCase()}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>
          {subAba === "diaria"
            ? "Feitas todo dia. Conclua e reiniciam amanhã automaticamente."
            : "Aparecem na aba 'Hoje' no dia em que vencem. Ao concluir, o próximo ciclo é agendado sozinho."}
        </p>
      </div>

      {/* Vazio */}
      {rotinasDaSubAba.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "linear-gradient(160deg, #14243f, #111e35)", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="text-5xl mb-3 empty-icon inline-block">📋</div>
          <p className="font-bold text-white mb-1 text-lg">Nenhuma rotina {LABEL_FREQUENCIA[subAba].toLowerCase()}</p>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Seu gestor cadastra as rotinas em Equipe › Rotinas ou na página da Loja.
          </p>
        </div>
      )}

      {/* Pendentes */}
      <div className="space-y-3">
        {pendentes.map((rotina) => {
          const loja = LOJAS.find((l) => l.id === rotina.lojaId);
          const subFeitas = rotina.subtarefas.filter((s) => s.concluida).length;
          const atrasada = estaAtrasada(rotina);
          const devida = venceHoje(rotina);
          const cor = FREQ_COR[rotina.frequencia];
          return (
            <div key={rotina.id} className="rounded-2xl flex items-center gap-3 p-4" style={{ background: "#112239", border: `1px solid ${atrasada ? "#F2545B50" : "#1e3356"}` }}>
              <span role="button" tabIndex={0} className="flex-shrink-0 cursor-pointer"
                onClick={() => concluirRotina(rotina.id)}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") concluirRotina(rotina.id); }}
                data-tip="Concluir rotina inteira">
                <Circle size={22} style={{ color: "#74859c" }} />
              </span>
              <button className="flex-1 min-w-0 text-left" onClick={() => setDetalheId(rotina.id)} data-tip="Abrir detalhes, subtarefas e descrição">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: cor + "20", color: cor }}>{LABEL_FREQUENCIA[rotina.frequencia]}</span>
                  {atrasada && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#F2545B20", color: "#F2545B" }}>Atrasada</span>}
                  {devida && !atrasada && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#E8A33D20", color: "#E8A33D" }}>Vence hoje</span>}
                  {!devida && rotina.proximaOcorrencia && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#9aa7ba" }} data-tip="Próxima vez que precisa ser feita"><CalendarClock size={11} /> {fmtDataCurta(rotina.proximaOcorrencia)}</span>
                  )}
                </div>
                <p className="text-white font-medium text-sm">{rotina.titulo}</p>
                {loja && <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>{loja.nome}</p>}
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => abrirPomodoro(rotina.id, rotina.titulo)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#4D9DE015", color: "#4D9DE0" }} data-tip="Iniciar um foco cronometrado de 25 min nesta tarefa">
                  <Play size={13} /> Iniciar
                </button>
                {rotina.subtarefas.length > 0 && <span className="text-xs" style={{ color: "#9aa7ba" }}>{subFeitas}/{rotina.subtarefas.length}</span>}
                <button onClick={() => setDetalheId(rotina.id)} data-tip="Abrir detalhes"><ChevronRight size={16} style={{ color: "#9aa7ba" }} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Concluídas hoje */}
      {concluidas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#74859c" }}>Concluídas hoje ({concluidas.length})</p>
          {concluidas.map((rotina) => (
            <div key={rotina.id} className="rounded-2xl flex items-center gap-3 p-3" style={{ background: "#0f1c30", border: "1px solid #36C98E30" }}>
              <button onClick={() => reabrirRotina(rotina.id)} data-tip="Reabrir (marcar como não feita)" className="flex-shrink-0">
                <CheckCircle2 size={20} style={{ color: "#36C98E" }} />
              </button>
              <button className="flex-1 min-w-0 text-left" onClick={() => setDetalheId(rotina.id)}>
                <p className="text-sm" style={{ color: "#9aa7ba", textDecoration: "line-through" }}>{rotina.titulo}</p>
              </button>
              {rotina.proximaOcorrencia && (
                <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: "#74859c" }} data-tip="Próxima ocorrência"><CalendarClock size={11} /> {fmtDataCurta(rotina.proximaOcorrencia)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {detalheId && <RotinaDetalheModal rotinaId={detalheId} onClose={() => setDetalheId(null)} />}
    </div>
  );
}
