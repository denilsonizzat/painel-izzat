"use client";
import { useState, useRef, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";

type Place = "top" | "bottom" | "right" | "left";

interface TipProps {
  titulo?: string;
  texto: string;
  place?: Place;
  children: ReactNode;
  className?: string;
  /** Renderiza como <span> inline (default) ou bloco. */
  block?: boolean;
}

/**
 * Tooltip bonito (card escuro + borda dourada) que aparece por cima de tudo.
 * Usa portal para o <body>, então escapa de containers com overflow:hidden
 * (ex: sidebar). Fade-in + leve subida ao abrir, com setinha apontando.
 */
export default function Tip({ titulo, texto, place = "bottom", children, className, block }: TipProps) {
  const ref = useRef<HTMLElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      // Com display:contents o wrapper não tem caixa; mede o filho real.
      const alvo = (el.firstElementChild as HTMLElement) || el;
      const r = alvo.getBoundingClientRect();
      const gap = 9;
      let x = 0, y = 0;
      switch (place) {
        case "bottom": x = r.left + r.width / 2; y = r.bottom + gap; break;
        case "top":    x = r.left + r.width / 2; y = r.top - gap; break;
        case "right":  x = r.right + gap;        y = r.top + r.height / 2; break;
        case "left":   x = r.left - gap;         y = r.top + r.height / 2; break;
      }
      setCoords({ x, y });
    }, 120);
  }, [place]);

  const esconder = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setCoords(null);
  }, []);

  // Transform por posição: centraliza e desloca para o lado certo, com leve subida.
  const transform = (() => {
    switch (place) {
      case "bottom": return "translate(-50%, 6px)";
      case "top":    return "translate(-50%, calc(-100% - 6px))";
      case "right":  return "translate(6px, -50%)";
      case "left":   return "translate(calc(-100% - 6px), -50%)";
    }
  })();

  const Comp: keyof React.JSX.IntrinsicElements = block ? "div" : "span";

  return (
    <>
      <Comp
        ref={ref as React.Ref<HTMLSpanElement & HTMLDivElement>}
        onMouseEnter={mostrar}
        onMouseLeave={esconder}
        onFocus={mostrar}
        onBlur={esconder}
        className={className}
        style={{ display: block ? "block" : "contents" }}
      >
        {children}
      </Comp>

      {coords && typeof document !== "undefined" && createPortal(
        <div
          role="tooltip"
          style={{
            position: "fixed",
            left: coords.x,
            top: coords.y,
            transform,
            zIndex: 100000,
            maxWidth: 270,
            pointerEvents: "none",
            background: "linear-gradient(160deg, #0d1828, #0a111e)",
            border: "1px solid #c9a84c55",
            borderLeft: "3px solid #c9a84c",
            borderRadius: 12,
            padding: "9px 12px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px #c9a84c12",
            animation: "tipIn 0.16s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {titulo && (
            <p style={{ color: "#c9a84c", fontSize: 12, fontWeight: 700, marginBottom: 3, letterSpacing: "0.01em" }}>
              {titulo}
            </p>
          )}
          <p style={{ color: "#cbd5e1", fontSize: 12, lineHeight: 1.5 }}>{texto}</p>
        </div>,
        document.body
      )}
    </>
  );
}
