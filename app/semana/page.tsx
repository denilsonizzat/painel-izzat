"use client";
import { useAppStore } from "@/lib/store";
import { semanaAtualKey, labelSemana, calcNivel } from "@/lib/data";
import { rotinasDoColaborador } from "@/lib/recorrencia";
import { Flame, Zap, AlertTriangle, CheckCircle2, Circle, Clock, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUS_ENTREGA_COR: Record<string, string> = {
  pendente: "#64748b",
  em_andamento: "#3b82f6",
  travado: "#ef4444",
  entregue: "#10b981",
};

const STATUS_ENTREGA_ICONE = {
  pendente: <Circle size={14} style={{ color: "#9aa7ba" }} />,
  em_andamento: <Clock size={14} style={{ color: "#3b82f6" }} />,
  travado: <AlertTriangle size={14} style={{ color: "#ef4444" }} />,
  entregue: <CheckCircle2 size={14} style={{ color: "#10b981" }} />,
};

function statusGeral(
  rotinasPct: number,
  entregas: ReturnType<typeof useAppStore.getState>["entregasSemanais"],
  tarefasColabTravadas: number
): { label: string; cor: string; bg: string } {
  const temTravado =
    entregas.some((e) => e.status === "travado") || tarefasColabTravadas > 0;
  if (temTravado) return { label: "Travado", cor: "#ef4444", bg: "#ef444418" };
  if (rotinasPct < 40) return { label: "Atenção", cor: "#f59e0b", bg: "#f59e0b18" };
  return { label: "Em dia", cor: "#10b981", bg: "#10b98118" };
}

export default function SemanaPage() {
  const router = useRouter();
  const { colaboradores, rotinas, tarefas, entregasSemanais, usuarioAtual } = useAppStore();
  const semana = semanaAtualKey();

  useEffect(() => {
    if (!usuarioAtual) { router.push("/"); return; }
    if (usuarioAtual.nivelAcesso !== "admin") router.push("/dashboard");
  }, [usuarioAtual, router]);

  if (!usuarioAtual || usuarioAtual.nivelAcesso !== "admin") return null;

  const totalTravados = colaboradores.filter((c) => {
    const entregas = entregasSemanais.filter((e) => e.colaboradorId === c.id && e.semana === semana);
    const tarefasTravadas = tarefas.filter((t) => t.atribuidoPara === c.id && t.status === "travado").length;
    return entregas.some((e) => e.status === "travado") || tarefasTravadas > 0;
  }).length;

  const totalEmDia = colaboradores.filter((c) => {
    const entregas = entregasSemanais.filter((e) => e.colaboradorId === c.id && e.semana === semana);
    const tarefasTravadas = tarefas.filter((t) => t.atribuidoPara === c.id && t.status === "travado").length;
    const rotC = rotinasDoColaborador(rotinas, c.id);
    const totalSubs = rotC.reduce((a, r) => a + r.subtarefas.length, 0);
    const feitas = rotC.reduce((a, r) => a + r.subtarefas.filter((s) => s.concluida).length, 0);
    const pct = totalSubs === 0 ? (rotC.every((r) => r.concluida) ? 100 : 0) : Math.round((feitas / totalSubs) * 100);
    const st = statusGeral(pct, entregas, tarefasTravadas);
    return st.label === "Em dia";
  }).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Semana do Time</h1>
          <p className="text-sm mt-1" style={{ color: "#9aa7ba" }}>
            {"Visão geral de tudo que a equipe tem para fazer nesta semana"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>
            {labelSemana()} · {semana}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalTravados > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "#ef444418", border: "1px solid #ef444430" }} data-tip="Pessoas com alguma entrega ou tarefa travada (bloqueada por impedimento) esta semana">
              <AlertTriangle size={14} style={{ color: "#ef4444" }} />
              <span className="text-sm font-bold" style={{ color: "#ef4444" }}>{totalTravados} travado{totalTravados > 1 ? "s" : ""}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "#10b98118", border: "1px solid #10b98130" }} data-tip="Pessoas com rotinas em dia e sem nada travado">
            <Users size={14} style={{ color: "#10b981" }} />
            <span className="text-sm font-bold" style={{ color: "#10b981" }}>{totalEmDia} em dia</span>
          </div>
        </div>
      </div>

      {/* Legenda de status */}
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#9aa7ba" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
          <span><strong style={{ color: "#10b981" }}>Em dia</strong> — rotinas e entregas ok</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
          <span><strong style={{ color: "#f59e0b" }}>{"Atenção"}</strong>{" — rotinas com menos de 40%"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
          <span><strong style={{ color: "#ef4444" }}>Travado</strong> — tarefa ou entrega bloqueada</span>
        </div>
      </div>

      {/* Grid de colaboradores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colaboradores.map((colab) => {
          const entregas = entregasSemanais.filter((e) => e.colaboradorId === colab.id && e.semana === semana);
          const tarefasTravadas = tarefas.filter((t) => t.atribuidoPara === colab.id && t.status === "travado").length;

          const rotColab = rotinasDoColaborador(rotinas, colab.id);
          const totalSubs = rotColab.reduce((a, r) => a + r.subtarefas.length, 0);
          const feitas = rotColab.reduce((a, r) => a + r.subtarefas.filter((s) => s.concluida).length, 0);
          const rotinasPct = totalSubs === 0
            ? (rotColab.every((r) => r.concluida) ? 100 : 0)
            : Math.round((feitas / totalSubs) * 100);

          const st = statusGeral(rotinasPct, entregas, tarefasTravadas);
          const nivelInfo = calcNivel(colab.xp || 0);
          const isOnline = colab.statusOnline?.ativo ?? false;
          const isFoco = colab.statusOnline?.foco ?? false;
          const dotCor = isOnline ? (isFoco ? "#f97316" : "#10b981") : "#334155";

          const tarefasColab = tarefas.filter((t) => t.atribuidoPara === colab.id && t.status !== "concluida");
          const travTarefa = tarefasColab.filter((t) => t.status === "travado");

          return (
            <div
              key={colab.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#122039",
                border: `1px solid ${st.label === "Travado" ? "#ef444440" : st.label === "Atenção" ? "#f59e0b30" : "#1e3356"}`,
              }}
            >
              {/* Card header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar nome={colab.nome} avatar={colab.avatar} foto={colab.foto} cor={colab.cor} size={40} />
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{ background: dotCor, borderColor: "#122039" }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{colab.nome.split(" ")[0]}</p>
                      <p className="text-xs truncate" style={{ color: "#9aa7ba" }}>{colab.cargo || "Sem cargo"}</p>
                    </div>
                  </div>
                  <div
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: st.bg, color: st.cor }}
                  >
                    {st.label === "Travado" && "⛔ "}
                    {st.label === "Atenção" && "⚠️ "}
                    {st.label === "Em dia" && "✓ "}
                    {st.label}
                  </div>
                </div>

                {/* Streak + Nível */}
                <div className="flex items-center gap-3 mt-3">
                  {(colab.streak || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame size={12} style={{ color: "#f59e0b" }} />
                      <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>{colab.streak} dias</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Zap size={12} style={{ color: nivelInfo.cor }} />
                    <span className="text-xs font-semibold" style={{ color: nivelInfo.cor }}>{nivelInfo.nome}</span>
                  </div>
                  {isOnline && colab.statusOnline?.trabalhando && (
                    <p className="text-xs truncate" style={{ color: "#9aa7ba" }}>
                      ↳ {colab.statusOnline.trabalhando}
                    </p>
                  )}
                </div>
              </div>

              {/* Rotinas da semana */}
              <div className="px-4 pb-3" style={{ borderTop: "1px solid #1e3356" }}>
                <div className="flex items-center justify-between mt-3 mb-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#74859c" }}>Rotinas</p>
                  <span className="text-xs font-bold" style={{ color: rotinasPct === 100 ? "#10b981" : rotinasPct < 40 ? "#f59e0b" : "#c9a84c" }}>
                    {rotinasPct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${rotinasPct}%`,
                      background: rotinasPct === 100 ? "#10b981" : rotinasPct < 40 ? "#f59e0b" : "linear-gradient(90deg, #c9a84c, #e0b85a)",
                    }}
                  />
                </div>
              </div>

              {/* Tarefas travadas */}
              {travTarefa.length > 0 && (
                <div className="px-4 pb-2">
                  {travTarefa.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 py-1">
                      <AlertTriangle size={12} style={{ color: "#ef4444" }} />
                      <span className="text-xs truncate" style={{ color: "#ef4444" }}>Tarefa travada: {t.titulo}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Entregas da semana */}
              <div className="px-4 pb-4" style={{ borderTop: "1px solid #1e3356" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: "#74859c" }}>
                  Entregas da Semana
                </p>
                {entregas.length === 0 ? (
                  <p className="text-xs leading-relaxed" style={{ color: "#334155" }}>
                    Nenhum compromisso registrado.<br />
                    <span style={{ color: "#74859c" }}>Vá em Meu Dia → seção &quot;Entregas da Semana&quot; para adicionar.</span>
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {entregas.map((e) => (
                      <div key={e.id} className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {STATUS_ENTREGA_ICONE[e.status]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs"
                            style={{
                              color: e.status === "entregue" ? "#64748b" : e.status === "travado" ? "#ef4444" : "#e8edf5",
                              textDecoration: e.status === "entregue" ? "line-through" : "none",
                            }}
                          >
                            {e.titulo}
                          </p>
                          {e.status === "travado" && e.motivoTravado && (
                            <p className="text-xs mt-0.5" style={{ color: "#ef444480" }}>{e.motivoTravado}</p>
                          )}
                        </div>
                        <span
                          className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded-full"
                          style={{ background: `${STATUS_ENTREGA_COR[e.status]}18`, color: STATUS_ENTREGA_COR[e.status] }}
                        >
                          {e.status === "em_andamento" ? "Em andamento" : e.status === "travado" ? "Travado" : e.status === "entregue" ? "Entregue" : "Pendente"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer link */}
              <div style={{ borderTop: "1px solid #1e3356" }}>
                <Link
                  href={`/equipe/${colab.id}`}
                  className="block w-full px-4 py-2 text-xs text-center transition-opacity hover:opacity-70"
                  style={{ color: "#74859c" }}
                >
                  Ver perfil completo →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
