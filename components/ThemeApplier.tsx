"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getTema } from "@/lib/themes";

export default function ThemeApplier() {
  const temaId = useAppStore((s) => s.temaId);
  const filtroLuzAzul = useAppStore((s) => s.filtroLuzAzul);
  const corAcentoCustom = useAppStore((s) => s.corAcentoCustom);

  useEffect(() => {
    const tema = getTema(temaId);
    const root = document.documentElement;
    root.style.setProperty("--bg", tema.bg);
    root.style.setProperty("--card", tema.card);
    root.style.setProperty("--border", tema.border);
    const gold = corAcentoCustom ?? tema.gold;
    root.style.setProperty("--gold", gold);
    root.style.setProperty("--gold-dim", gold + "22");
    root.style.setProperty("--gray", tema.gray);
    root.style.setProperty("--text", tema.text);
    root.style.setProperty("--text-dim", tema.textMuted);
    root.setAttribute("data-theme", temaId);
  }, [temaId, corAcentoCustom]);

  if (!filtroLuzAzul) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(255, 145, 20, 0.07)",
        pointerEvents: "none",
        zIndex: 99999,
      }}
    />
  );
}
