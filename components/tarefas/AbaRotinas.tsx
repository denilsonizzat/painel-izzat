"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS, Frequencia } from "@/lib/data";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, CalendarClock, Sparkles } from "lucide-react";
import {
  venceHoje, concluidaHoje, estaAtrasada, rotinasDoColaborador,
  LABEL_FREQUENCIA, ORDEM_FREQUENCIA, fmtDataCurta,
} from "@/lib/recorrencia";

const FREQ_COR: Record<Frequencia, string> = {
  diaria: "#10b981",
  semanal: "#3b82f6",
  quinzenal: "#0ea5e9",
  mensal: "#f59e0b",
  trimestral: "#8b5cf6",
  semestral: "#ec4899",
  anual: "#ef4444",
};

type SubAba = "diaria" | Frequencia;

export default function AbaRotinas() {
  const { usuarioAtual, rotinas: todasRotinas, marcarSubtarefa, concluirRotina, reabrirRotina, abrirPomodoro } = useAppStore();
  const [subAba, setSubAba] = useState<SubAba>("diaria");
  const [expandidas, setExpandidas] = useState<string[]>([]);

  if (!usuarioAtual) return null;
  const rotinas = rotinasDoColaborador(todasRotinas, usuarioAtual.id);

  const toggle = (id: string) =>
    setExpandidas((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // Conjunto exibido conforme sub-aba
  const rotinasDiaria = rotinas.filter(venceHoje);
  const rotinasDaSubAba = subAba === "diaria"
    ? rotinasDiaria
    : rotinas.filter((r) => r.frequencia === subAba);

  // Pendentes primeiro, concluídas de hoje no fim
  const pendentes = rotinasDaSubAba.filter((r) => !concluidaHoje(r));
  const concluidas = rotinasDaSubAba.filter((r) => concluidaHoje(r));

  const contagemDiaria = rotinasDiaria.filter((r) => !concluidaHoje(r)).length;

  function contFreq(f: Frequencia): number {
    return rotinas.filter((r) => r.frequencia === f).length;
  }

  return (
    <div className="space-y-5">
      {/* Sub-abas de frequência */}
      <div className="flex gap-2 flex-wrap">
        {/* Diária em destaque */}
        <button
          onClick={() => setSubAba("diaria")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: subAba === "diaria" ? "#10b98120" : "#122039",
            border: `1px solid ${subAba === "diaria" ? "#10b981" : "#1e3356"}`,
            color: subAba === "diaria" ? "#10b981" : "#94a3b8",
          }}
        >
          <Sparkles size={13} /> Hoje
          {contagemDiaria > 0 && (
            <span className="px-1.5 rounded-full text-xs font-bold" style={{ background: "#10b981", color: "#0b1624" }}>
              {contagemDiaria}
            </span>
          )}
        </button>
        {ORDEM_FREQUENCIA.map((f) => {
          const ativo = subAba === f;
          const n = contFreq(f);
          return (
            <button
              key={f}
              onClick={() => setSubAba(f)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: ativo ? FREQ_COR[f] + "20" : "#122039",
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
      <div className="p-3 rounded-xl" style={{ background: "#0ea5e910", border: "1px solid #0ea5e925", borderLeft: "3px solid #0ea5e9" }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0ea5e9" }}>
          {subAba === "diaria" ? "O que vence hoje" : LABEL_FREQUENCIA[subAba] + " — todas as rotinas dessa frequência"}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
          {subAba === "diaria"
            ? "Tudo que precisa ser feito hoje, de qualquer frequência. Conclua e o próximo ciclo é agendado sozinho."
            : "Estas rotinas aparecem automaticamente em 'Hoje' no dia em que vencem."}
        </p>
      </div>

      {/* Vazio */}
      {rotinasDaSubAba.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="text-4xl mb-3">{subAba === "diaria" ? "✅" : "📋"}</div>
          <p className="font-semibold text-white mb-1">
            {subAba === "diaria" ? "Nada pendente para hoje!" : "Nenhuma rotina " + LABEL_FREQUENCIA[subAba].toLowerCase()}
          </p>
          <p className="text-sm" style={{ color: "#64748b" }}>
            {subAba === "diaria"
              ? "Todas as rotinas de hoje foram concluídas. Bom trabalho!"
              : "Seu gestor cadastra as rotinas em Equipe › Rotinas."}
          </p>
        </div>
      )}

      {/* Lista de pendentes */}
      <div className="space-y-3">
        {pendentes.map((rotina) => {
          const aberta = expandidas.includes(rotina.id);
          const loja = LOJAS.find((l) => l.id === rotina.lojaId);
          const subFeitas = rotina.subtarefas.filter((s) => s.concluida).length;
          const atrasada = estaAtrasada(rotina);
          const devida = venceHoje(rotina);
          const cor = FREQ_COR[rotina.frequencia];
          return (
            <div key={rotina.id} className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: `1px solid ${atrasada ? "#ef444450" : "#1e3356"}` }}>
              <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => toggle(rotina.id)}>
                <span
                  role="button"
                  tabIndex={0}
                  className="flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); concluirRotina(rotina.id); }}
                  onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.stopPropagation(); concluirRotina(rotina.id); } }}
                  title="Concluir rotina"
                >
                  <Circle size={22} style={{ color: "#475569" }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: cor + "20", color: cor }}>
                      {LABEL_FREQUENCIA[rotina.frequencia]}
                    </span>
                    {atrasada && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>
                        Atrasada
                      </span>
                    )}
                    {devida && !atrasada && subAba !== "diaria" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#f59e0b20", color: "#f59e0b" }}>
                        Vence hoje
                      </span>
                    )}
                    {!devida && rotina.proximaOcorrencia && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                        <CalendarClock size={11} /> Próxima: {fmtDataCurta(rotina.proximaOcorrencia)}
                      </span>
                    )}
                  </div>
                  <p className="text-white font-medium text-sm">{rotina.titulo}</p>
                  {loja && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{loja.nome}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); abrirPomodoro(rotina.id, rotina.titulo); }}
                    className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                    style={{ background: "#ef444415", color: "#ef4444" }}
                    title="Iniciar Pomodoro — foco cronometrado"
                  >
                    🍅 <span>Foco</span>
                  </button>
                  {rotina.subtarefas.length > 0 && (
                    <span className="text-xs" style={{ color: "#64748b" }}>{subFeitas}/{rotina.subtarefas.length}</span>
                  )}
                  {rotina.subtarefas.length > 0 && (aberta ? <ChevronUp size={16} style={{ color: "#64748b" }} /> : <ChevronDown size={16} style={{ color: "#64748b" }} />)}
                </div>
              </button>
              {aberta && rotina.subtarefas.length > 0 && (
                <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "#1e3356" }}>
                  <div className="pt-3 space-y-2">
                    {rotina.subtarefas.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => marcarSubtarefa(rotina.id, sub.id, !sub.concluida)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:opacity-80"
                        style={{ background: "#1e3356" }}
                      >
                        {sub.concluida ? <CheckCircle2 size={18} style={{ color: "#10b981" }} /> : <Circle size={18} style={{ color: "#475569" }} />}
                        <span className="text-sm flex-1" style={{ color: sub.concluida ? "#64748b" : "#e2e8f0", textDecoration: sub.concluida ? "line-through" : "none" }}>
                          {sub.titulo}
                        </span>
                        {!sub.concluida && <span className="text-xs" style={{ color: "#475569" }}>+10 XP</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Concluídas hoje */}
      {concluidas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
            Concluídas hoje ({concluidas.length})
          </p>
          {concluidas.map((rotina) => (
            <div key={rotina.id} className="rounded-2xl flex items-center gap-3 p-3" style={{ background: "#0f1c30", border: "1px solid #10b98130" }}>
              <button onClick={() => reabrirRotina(rotina.id)} title="Reabrir (marcar como não feita)" className="flex-shrink-0">
                <CheckCircle2 size={20} style={{ color: "#10b981" }} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#64748b", textDecoration: "line-through" }}>{rotina.titulo}</p>
              </div>
              {rotina.proximaOcorrencia && (
                <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: "#475569" }}>
                  <CalendarClock size={11} /> {fmtDataCurta(rotina.proximaOcorrencia)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
