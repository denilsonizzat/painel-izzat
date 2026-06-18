"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Palette } from "lucide-react";
import ThemePicker from "./ThemePicker";

export default function FloatingThemeButton() {
  const { usuarioAtual } = useAppStore();
  const [aberto, setAberto] = useState(false);

  if (!usuarioAtual) return null;

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        data-tip="Aparência e tema"
        className="hidden md:flex fixed top-14 right-4 z-40 items-center justify-center w-10 h-10 rounded-xl shadow-xl transition-all hover:scale-110 active:scale-95"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--gray)",
        }}
      >
        <Palette size={16} />
      </button>

      <ThemePicker aberto={aberto} onFechar={() => setAberto(false)} />
    </>
  );
}
