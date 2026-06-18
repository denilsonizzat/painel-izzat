"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Camada global de tooltips. Qualquer elemento com atributo `data-tip="texto"`
 * (e opcionalmente `data-tip-title` e `data-tip-place`) ganha o card bonito
 * (escuro + borda dourada) ao passar o mouse. Montado uma vez no layout.
 *
 * Vantagem: não precisa envolver cada elemento em componente — basta o atributo.
 */
type Place = "top" | "bottom" | "right" | "left";
interface Estado { x: number; y: number; texto: string; titulo?: string; place: Place; }

export default function TipLayer() {
  const [tip, setTip] = useState<Estado | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alvoAtual = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function calc(el: HTMLElement): Estado {
      const r = el.getBoundingClientRect();
      const place = (el.getAttribute("data-tip-place") as Place) || "bottom";
      const gap = 9;
      let x = 0, y = 0;
      switch (place) {
        case "bottom": x = r.left + r.width / 2; y = r.bottom + gap; break;
        case "top":    x = r.left + r.width / 2; y = r.top - gap; break;
        case "right":  x = r.right + gap;        y = r.top + r.height / 2; break;
        case "left":   x = r.left - gap;         y = r.top + r.height / 2; break;
      }
      return { x, y, texto: el.getAttribute("data-tip") || "", titulo: el.getAttribute("data-tip-title") || undefined, place };
    }

    function onOver(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.("[data-tip]") as HTMLElement | null;
      if (!el) return;
      if (alvoAtual.current === el) return;
      alvoAtual.current = el;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { setTip(calc(el)); }, 130);
    }
    function onOut(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.("[data-tip]") as HTMLElement | null;
      if (!el) return;
      const para = e.relatedTarget as HTMLElement | null;
      if (para && el.contains(para)) return;
      alvoAtual.current = null;
      if (timer.current) clearTimeout(timer.current);
      setTip(null);
    }
    function onScroll() { alvoAtual.current = null; if (timer.current) clearTimeout(timer.current); setTip(null); }

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("scroll", onScroll, true);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!tip || !tip.texto || typeof document === "undefined") return null;

  const transform = tip.place === "bottom" ? "translate(-50%, 0)"
    : tip.place === "top" ? "translate(-50%, -100%)"
    : tip.place === "right" ? "translate(0, -50%)"
    : "translate(-100%, -50%)";

  return createPortal(
    <div
      role="tooltip"
      style={{
        position: "fixed",
        left: tip.x,
        top: tip.y,
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
      {tip.titulo && (
        <p style={{ color: "#c9a84c", fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{tip.titulo}</p>
      )}
      <p style={{ color: "#cbd5e1", fontSize: 12, lineHeight: 1.5 }}>{tip.texto}</p>
    </div>,
    document.body
  );
}
