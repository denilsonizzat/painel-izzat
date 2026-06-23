"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { X, ChevronRight, ChevronLeft, Zap } from "lucide-react";

const STEPS = [
  {
    emoji: "🎯",
    titulo: "Bem-vindo ao Painel Izzat",
    descricao: "Seu espaço de gestão de equipe. Complete rotinas, acumule XP e suba de nível. Vamos fazer um tour rápido.",
    dica: null,
  },
  {
    emoji: "🧭",
    titulo: "Menu Lateral",
    descricao: "O menu à esquerda é sua central de navegação: Dashboard, Tarefas, Equipe, Lojas e mais. Passe o mouse em qualquer item para ver o que ele faz.",
    dica: "No desktop, você pode recolher o menu clicando na seta para ter mais espaço de trabalho.",
  },
  {
    emoji: "✅",
    titulo: "Tarefas — seu dia a dia",
    descricao: "Abra Tarefas e comece pela aba 'Hoje': tudo que você precisa fazer hoje (rotinas do dia + tarefas avulsas). As outras abas separam Rotinas (por frequência) e Avulsas.",
    dica: "Rotinas se repetem (diária, semanal, mensal...) e reaparecem sozinhas no dia que vencem. Avulsas são pontuais.",
  },
  {
    emoji: "🍅",
    titulo: "Foco com Pomodoro",
    descricao: "Clique no botão 🍅 'Foco' em qualquer tarefa, rotina ou subtarefa para iniciar uma sessão de 25 minutos focado naquele item.",
    dica: "Ótimo para não se perder: escolhe o que fazer, aperta Foco, e trabalha sem distração até o tempo acabar.",
  },
  {
    emoji: "⚡",
    titulo: "XP, Níveis e Desafios",
    descricao: "Cada ação gera XP: +10 subtarefa, +25 Pomodoro, +30 tarefa, +50 check-in diário. Veja seu progresso e os desafios do time na seção Desafios.",
    dica: "Mantenha um streak de dias consecutivos com check-in para bônus extras.",
  },
  {
    emoji: "✅",
    titulo: "Tudo certo!",
    descricao: "Agora você já conhece o básico. Explore as seções, complete suas metas e faça parte do time Izzat.",
    dica: null,
  },
];

export default function Onboarding() {
  const { onboardingConcluido, setOnboardingConcluido, usuarioAtual } = useAppStore();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (usuarioAtual && !onboardingConcluido) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, [usuarioAtual?.id, onboardingConcluido]);

  if (!visible) return null;

  const concluir = () => { setOnboardingConcluido(true); setVisible(false); };
  const avancar = () => { if (step < STEPS.length - 1) setStep((s) => s + 1); else concluir(); };
  const voltar = () => { if (step > 0) setStep((s) => s - 1); };

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Overlay — semi-transparente para o usuário ver o app por baixo */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998, background: "rgba(7,12,22,0.60)", backdropFilter: "blur(3px)" }}
        onClick={concluir}
      />

      {/* Card centralizado */}
      <div
        className="fixed"
        style={{
          zIndex: 9999,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(420px, calc(100vw - 32px))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl p-7"
          style={{
            background: "linear-gradient(145deg, #112239, #0d1a2e)",
            border: "1px solid #c9a84c30",
            boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px #c9a84c18",
          }}
        >
          {/* Dots de progresso + fechar na mesma linha */}
          <div className="flex items-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all flex-shrink-0" style={{
                width: i === step ? 20 : 6,
                height: 6,
                background: i === step ? "#c9a84c" : i < step ? "#c9a84c60" : "#1e3356",
              }} />
            ))}
            <span className="mx-2 text-xs whitespace-nowrap" style={{ color: "#74859c" }}>{step + 1} / {STEPS.length}</span>
            <button
              onClick={concluir}
              className="ml-auto w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
              style={{ background: "#1e3356", color: "#9aa7ba" }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Emoji */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-3xl"
            style={{ background: "#1e3356" }}
          >
            {current.emoji}
          </div>

          {/* Título */}
          <h2 className="font-black mb-2 leading-tight" style={{ fontSize: 20, color: "#e8edf5", letterSpacing: "-0.02em" }}>
            {current.titulo}
          </h2>

          {/* Descrição */}
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>
            {current.descricao}
          </p>

          {/* Dica */}
          {current.dica && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl mb-4"
              style={{ background: "#c9a84c12", border: "1px solid #c9a84c25" }}
            >
              <Zap size={13} style={{ color: "#c9a84c", flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs leading-relaxed" style={{ color: "#c9a84c99" }}>{current.dica}</p>
            </div>
          )}

          {/* Navegação */}
          <div className="flex items-center gap-3 mt-5">
            {!isFirst && (
              <button
                onClick={voltar}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "#1e3356", color: "#94a3b8" }}
              >
                <ChevronLeft size={15} />
                Voltar
              </button>
            )}
            <button
              onClick={avancar}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ background: isLast ? "#10b981" : "#c9a84c", color: isLast ? "white" : "#0b1624" }}
            >
              {isLast ? "Começar agora!" : "Próximo"}
              {!isLast && <ChevronRight size={15} />}
            </button>
          </div>

          {!isLast && (
            <button
              onClick={concluir}
              className="w-full text-center mt-3 text-xs transition-opacity hover:opacity-80"
              style={{ color: "#334155" }}
            >
              Pular tour
            </button>
          )}
        </div>
      </div>
    </>
  );
}
