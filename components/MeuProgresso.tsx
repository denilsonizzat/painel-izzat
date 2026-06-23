"use client";
import { useAppStore } from "@/lib/store";
import { calcNivel } from "@/lib/data";
import { rotinasDoColaborador, venceHoje, concluidaHoje } from "@/lib/recorrencia";
import { Zap, Flame, Star } from "lucide-react";

/** Resumo de gamificação do usuário logado: nível, XP, streak e progresso do dia. */
export default function MeuProgresso() {
  const { usuarioAtual, rotinas } = useAppStore();
  if (!usuarioAtual) return null;

  const nivelInfo = calcNivel(usuarioAtual.xp || 0);
  const streak = usuarioAtual.streak || 0;

  const minhas = rotinasDoColaborador(rotinas, usuarioAtual.id);
  const doDia = minhas.filter(venceHoje);
  const feitasDia = doDia.filter(concluidaHoje).length;
  const pctDia = doDia.length === 0 ? 100 : Math.round((feitasDia / doDia.length) * 100);

  return (
    <div className="rounded-2xl p-5" style={{ background: "linear-gradient(145deg, #112239, #0d1a2e)", border: "1px solid rgba(201,164,66,.16)" }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: nivelInfo.cor + "20" }}>
            <Zap size={18} style={{ color: nivelInfo.cor }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">{nivelInfo.nome}</p>
            <p className="text-xs" style={{ color: "#9aa7ba" }}>{usuarioAtual.xp || 0} XP acumulado</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "#E8A33D15", border: "1px solid #E8A33D30" }} data-tip={streak + " dias seguidos de check-in"}>
              <Flame size={14} style={{ color: "#E8A33D" }} />
              <span className="text-sm font-bold" style={{ color: "#E8A33D" }}>{streak}d</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: pctDia === 100 ? "#36C98E15" : "#c9a84c15", border: `1px solid ${pctDia === 100 ? "#36C98E30" : "#c9a84c30"}` }}>
            {pctDia === 100 ? <Star size={14} style={{ color: "#36C98E" }} /> : <Zap size={14} style={{ color: "#c9a84c" }} />}
            <span className="text-sm font-bold" style={{ color: pctDia === 100 ? "#36C98E" : "#c9a84c" }}>{pctDia}%</span>
            <span className="text-xs" style={{ color: "#9aa7ba" }}>do dia</span>
          </div>
        </div>
      </div>

      {/* Barra de XP para o próximo nível */}
      {nivelInfo.proximo && (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: "#9aa7ba" }}>Progresso para {nivelInfo.proximo.nome}</span>
            <span className="text-xs" style={{ color: "#9aa7ba" }}>{nivelInfo.proximo.xpMin - nivelInfo.xp} XP restantes</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${nivelInfo.progresso}%`, background: `linear-gradient(90deg, ${nivelInfo.cor}, ${nivelInfo.proximo.cor})` }} />
          </div>
        </>
      )}
    </div>
  );
}
