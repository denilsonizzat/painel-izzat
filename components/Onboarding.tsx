"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { X, ChevronRight, ChevronLeft, Zap } from "lucide-react";

interface TourStep {
  titulo: string;
  descricao: string;
  dica?: string;
  emoji: string;
  href: string;
  selector: string | null;
  selectorMobile?: string | null;
  place: "top" | "bottom" | "left" | "right" | "center";
}

const STEPS: TourStep[] = [
  {
    emoji: "🎯", titulo: "Bem-vindo ao Painel Izzat",
    descricao: "Seu centro de operações do Grupo Izzat. Gerencie equipe, lojas, rotinas e produtos em um só lugar. Vamos fazer um tour rápido — menos de 2 minutos!",
    href: "/dashboard", selector: null, place: "center",
  },
  {
    emoji: "🧭", titulo: "Menu de Navegação",
    descricao: "Sua central de navegação. Aqui ficam todas as seções: Dashboard, Tarefas, Equipe, Lojas, Operação e muito mais. No celular, toque no menu (☰) para abrir.",
    href: "/dashboard", selector: "[data-tour='sidebar']", selectorMobile: "[data-tour='menu-mobile']", place: "right",
  },
  {
    emoji: "📊", titulo: "Dashboard — Visão Geral",
    descricao: "KPIs do time em tempo real: progresso de rotinas, tarefas abertas, urgentes. Acompanhe o time antes de começar o dia.",
    href: "/dashboard", selector: "[data-tour='kpis']", place: "bottom",
  },
  {
    emoji: "⚡", titulo: "Acesso Rápido",
    descricao: "Atalhos diretos para Google Drive, Meet, Chat, WhatsApp, Claude e tl;dv. Um clique e abre o app correto no celular ou desktop.",
    href: "/dashboard", selector: "[data-tour='acesso-rapido']", place: "top",
  },
  {
    emoji: "✅", titulo: "Tarefas e Rotinas",
    descricao: "A aba 'Hoje' mostra tudo que precisa ser feito agora: rotinas diárias + avulsas. Rotinas se repetem automaticamente. Use o 🍅 Pomodoro para focar em qualquer item.",
    dica: "Cada ação gera XP: +25 Pomodoro, +30 tarefa concluída, +50 check-in diário.",
    href: "/tarefas", selector: "[data-tour='tarefas-main']", place: "top",
  },
  {
    emoji: "👥", titulo: "Equipe",
    descricao: "Perfil de cada colaborador: rotinas, nível de XP, histórico de atividades e contato direto. Clique em qualquer pessoa para ver detalhes e progresso.",
    href: "/equipe", selector: "[data-tour='equipe-main']", place: "top",
  },
  {
    emoji: "🏪", titulo: "Lojas",
    descricao: "Todas as lojas do Grupo Izzat e parceiras. Acesso rápido ao Drive de cada loja, status operacional, rotinas específicas e métricas de performance.",
    href: "/lojas", selector: "[data-tour='lojas-main']", place: "top",
  },
  {
    emoji: "🚀", titulo: "Tudo pronto!",
    descricao: "Você já conhece o essencial. Explore as outras seções (Operação, Precificação, Guia) pelo menu lateral. Dúvidas? Acesse Guia do App para tutoriais detalhados.",
    href: "/dashboard", selector: null, place: "center",
  },
];

const PADDING = 10;
const CARD_W = 340;
const CARD_H = 300; // fallback até medir altura real do card
const OV_BG = "rgba(0,0,0,0.30)";

function selByViewport(s: TourStep): string | null {
  if (typeof window !== "undefined" && window.innerWidth < 768 && s.selectorMobile !== undefined) {
    return s.selectorMobile;
  }
  return s.selector;
}

interface SpRect { top: number; left: number; right: number; bottom: number }

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

export default function Onboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const { onboardingConcluido, setOnboardingConcluido, usuarioAtual } = useAppStore();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [sp, setSp] = useState<SpRect | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [cardH, setCardH] = useState(CARD_H);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  // Mede altura real do card (evita vazar em tela curta)
  useEffect(() => {
    if (cardRef.current) {
      const h = cardRef.current.getBoundingClientRect().height;
      if (h > 0 && Math.abs(h - cardH) > 4) setCardH(h);
    }
  });

  // Esc encerra o tour
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOnboardingConcluido(true); setVisible(false); router.push("/dashboard"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, setOnboardingConcluido, router]);

  useEffect(() => {
    if (usuarioAtual && !onboardingConcluido) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [usuarioAtual?.id, onboardingConcluido]);

  const localizarElemento = useCallback((sel: string | null) => {
    if (!sel) { setSp(null); setNavigating(false); return; }
    const el = document.querySelector(sel) as HTMLElement | null;
    // Elemento ausente OU oculto (display:none → offsetParent null) → card centralizado
    if (!el || (el.offsetParent === null && el.getClientRects().length === 0)) {
      setSp(null); setNavigating(false); return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      // Rect colapsado (0×0) = elemento não renderizado de fato → fallback centralizado
      if (r.width < 2 || r.height < 2) { setSp(null); setNavigating(false); return; }
      setSp({
        top: Math.max(0, r.top - PADDING),
        left: Math.max(0, r.left - PADDING),
        right: Math.min(window.innerWidth, r.right + PADDING),
        bottom: Math.min(window.innerHeight, r.bottom + PADDING),
      });
      setNavigating(false);
    }, 350);
  }, []);

  // After pathname changes, locate element for current step
  useEffect(() => {
    if (!visible) return;
    const current = STEPS[stepRef.current];
    if (!current) return;
    // Only act if we're on the right page
    if (pathname !== current.href) return;
    const t = setTimeout(() => localizarElemento(selByViewport(current)), 500);
    return () => clearTimeout(t);
  }, [pathname, visible, localizarElemento]);

  const irParaStep = useCallback((novoStep: number) => {
    if (novoStep < 0 || novoStep >= STEPS.length) return;
    const next = STEPS[novoStep];
    setSp(null);
    setStep(novoStep);
    if (next.href !== pathname) {
      setNavigating(true);
      router.push(next.href);
      // pathname effect will handle locating element after navigation
    } else {
      // Same page
      localizarElemento(selByViewport(next));
    }
  }, [pathname, router, localizarElemento]);

  if (!visible) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const isCenter = !current.selector || !sp;

  const concluir = () => { setOnboardingConcluido(true); setVisible(false); router.push("/dashboard"); };
  const avancar = () => { if (isLast) concluir(); else irParaStep(step + 1); };
  const voltar = () => { if (!isFirst) irParaStep(step - 1); };

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {};
  if (isCenter || !sp) {
    tooltipStyle = { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10000, width: Math.min(CARD_W, window.innerWidth - 24) };
  } else {
    const ww = typeof window !== "undefined" ? window.innerWidth : 800;
    const wh = typeof window !== "undefined" ? window.innerHeight : 600;
    const cx = (sp.left + sp.right) / 2;
    const cy = (sp.top + sp.bottom) / 2;

    if (current.place === "right" || (current.place === "left" && sp.left < CARD_W + 20)) {
      tooltipStyle = {
        position: "fixed", zIndex: 10000,
        top: clamp(cy - cardH / 2, 12, wh - cardH - 12),
        left: Math.min(sp.right + 14, ww - Math.min(CARD_W, ww - 24) - 12),
        width: Math.min(CARD_W, ww - 24),
      };
    } else if (current.place === "left") {
      tooltipStyle = {
        position: "fixed", zIndex: 10000,
        top: clamp(cy - cardH / 2, 12, wh - cardH - 12),
        left: Math.max(12, sp.left - CARD_W - 14),
        width: Math.min(CARD_W, ww - 24),
      };
    } else if (current.place === "bottom" || (current.place === "top" && sp.top < cardH + 20)) {
      tooltipStyle = {
        position: "fixed", zIndex: 10000,
        top: clamp(sp.bottom + 14, 12, wh - cardH - 12),
        left: clamp(cx - CARD_W / 2, 12, ww - Math.min(CARD_W, ww - 24) - 12),
        width: Math.min(CARD_W, ww - 24),
      };
    } else {
      // top (default)
      tooltipStyle = {
        position: "fixed", zIndex: 10000,
        top: Math.max(12, sp.top - cardH - 14),
        left: clamp(cx - CARD_W / 2, 12, ww - Math.min(CARD_W, ww - 24) - 12),
        width: Math.min(CARD_W, ww - 24),
      };
    }
  }

  return (
    <>
      {/* Overlay */}
      {sp && !isCenter ? (
        <>
          <div style={{ position: "fixed", zIndex: 9998, top: 0, left: 0, right: 0, height: sp.top, background: OV_BG, pointerEvents: "auto" }} />
          <div style={{ position: "fixed", zIndex: 9998, top: sp.bottom, left: 0, right: 0, bottom: 0, background: OV_BG, pointerEvents: "auto" }} />
          <div style={{ position: "fixed", zIndex: 9998, top: sp.top, left: 0, width: sp.left, height: sp.bottom - sp.top, background: OV_BG, pointerEvents: "auto" }} />
          <div style={{ position: "fixed", zIndex: 9998, top: sp.top, left: sp.right, right: 0, height: sp.bottom - sp.top, background: OV_BG, pointerEvents: "auto" }} />
          {/* Glow border ao redor do elemento */}
          <div style={{
            position: "fixed", zIndex: 9999, pointerEvents: "none",
            top: sp.top, left: sp.left, width: sp.right - sp.left, height: sp.bottom - sp.top,
            border: "2px solid #c9a84c", borderRadius: 12,
            boxShadow: "0 0 0 4px #c9a84c18, 0 0 24px #c9a84c30",
            animation: "pulse-border 2s infinite",
          }} />
        </>
      ) : (
        // Backdrop NÃO encerra o tour (evita fechar sem querer). Só "Pular" ou X.
        <div style={{ position: "fixed", zIndex: 9998, inset: 0, background: OV_BG }} />
      )}

      {/* Loading */}
      {navigating && (
        <div style={{ position: "fixed", zIndex: 10001, top: 20, left: "50%", transform: "translateX(-50%)", background: "#112239", borderRadius: 12, padding: "8px 20px", border: "1px solid #c9a84c30" }}>
          <p style={{ color: "#c9a84c", fontSize: 12, fontWeight: 600 }}>Navegando...</p>
        </div>
      )}

      {/* Tour card */}
      {!navigating && (
        <div style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
          <div ref={cardRef} className="rounded-2xl p-5" style={{
            background: "linear-gradient(145deg,#112239,#0d1a2e)",
            border: "1px solid #c9a84c30",
            boxShadow: "0 24px 64px rgba(0,0,0,.8), 0 0 0 1px #c9a84c18",
          }}>
            {/* Dots + fechar */}
            <div className="flex items-center gap-1 mb-4">
              {STEPS.map((_, i) => (
                <div key={i} className="rounded-full transition-all flex-shrink-0"
                  style={{ width: i === step ? 18 : 5, height: 5, background: i === step ? "#c9a84c" : i < step ? "#c9a84c60" : "#1e3356" }} />
              ))}
              <span className="mx-2 text-xs whitespace-nowrap" style={{ color: "#74859c" }}>{step + 1}/{STEPS.length}</span>
              <button onClick={concluir}
                className="ml-auto w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-80"
                style={{ background: "#1e3356", color: "#9aa7ba" }}>
                <X size={13} />
              </button>
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: "#1e3356" }}>
                {current.emoji}
              </div>
              <h2 className="font-black leading-tight" style={{ fontSize: 16, color: "#e8edf5", letterSpacing: "-0.02em" }}>
                {current.titulo}
              </h2>
            </div>

            <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>{current.descricao}</p>

            {current.dica && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl mb-3" style={{ background: "#c9a84c10", border: "1px solid #c9a84c22" }}>
                <Zap size={12} style={{ color: "#c9a84c", flexShrink: 0, marginTop: 2 }} />
                <p className="text-xs leading-relaxed" style={{ color: "#c9a84c90" }}>{current.dica}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              {!isFirst && (
                <button onClick={voltar}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80"
                  style={{ background: "#1e3356", color: "#94a3b8" }}>
                  <ChevronLeft size={14} /> Voltar
                </button>
              )}
              <button onClick={avancar}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95"
                style={{ background: isLast ? "#36C98E" : "#c9a84c", color: isLast ? "white" : "#0b1624" }}>
                {isLast ? "Começar!" : "Próximo"}
                {!isLast && <ChevronRight size={14} />}
              </button>
            </div>

            {!isLast && (
              <button onClick={concluir} className="w-full text-center mt-2.5 text-xs hover:opacity-80" style={{ color: "#64748b" }}>
                Pular tour
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
