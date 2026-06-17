"use client";
import { useAppStore } from "@/lib/store";
import { TEMAS } from "@/lib/themes";
import { X, Palette, Sun, Moon, Check, Eye } from "lucide-react";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export default function ThemePicker({ aberto, onFechar }: Props) {
  const { temaId, setTema, filtroLuzAzul, setFiltroLuzAzul, corAcentoCustom, setCorAcentoCustom } = useAppStore();

  if (!aberto) return null;

  const temaAtual = TEMAS.find((t) => t.id === temaId) ?? TEMAS[0];
  const isDark = temaAtual.dark;

  const toggleModo = () => {
    if (isDark) setTema("light");
    else setTema("izzat");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "#00000090" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Palette size={18} style={{ color: "var(--gold)" }} />
            <h2 className="font-bold" style={{ color: "var(--text)" }}>Aparencia</h2>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-xl" style={{ color: "var(--gray)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Dark / Light toggle */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            {isDark ? <Moon size={16} style={{ color: "var(--gold)" }} /> : <Sun size={16} style={{ color: "var(--gold)" }} />}
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {isDark ? "Modo Escuro" : "Modo Claro"}
            </span>
          </div>
          <button onClick={toggleModo} className="relative transition-all" style={{ width: 44, height: 24 }}>
            <div className="w-full h-full rounded-full transition-all duration-300" style={{ background: isDark ? "var(--gold)" : "#94a3b8" }} />
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300" style={{ left: isDark ? "calc(100% - 22px)" : "2px" }} />
          </button>
        </div>

        {/* Blue light filter */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <Eye size={16} style={{ color: filtroLuzAzul ? "#f59e0b" : "var(--gray)" }} />
            <div>
              <span className="text-sm font-semibold block" style={{ color: "var(--text)" }}>Filtro Quente</span>
              <span className="text-xs" style={{ color: "var(--gray)" }}>Reduz luz azul, protege os olhos</span>
            </div>
          </div>
          <button onClick={() => setFiltroLuzAzul(!filtroLuzAzul)} className="relative transition-all" style={{ width: 44, height: 24 }}>
            <div className="w-full h-full rounded-full transition-all duration-300" style={{ background: filtroLuzAzul ? "#f59e0b" : "#334155" }} />
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300" style={{ left: filtroLuzAzul ? "calc(100% - 22px)" : "2px" }} />
          </button>
        </div>

        {/* Custom accent color */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gray)" }}>
          Cor de Destaque
        </p>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex-shrink-0"
            style={{ background: corAcentoCustom ?? temaAtual.gold, border: "2px solid #ffffff20" }}
          />
          <div className="flex-1">
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text)" }}>
              {corAcentoCustom ? "Personalizada" : "Padrao do tema"}
            </p>
            <p className="text-xs font-mono" style={{ color: "var(--gray)" }}>
              {corAcentoCustom ?? temaAtual.gold}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={corAcentoCustom ?? temaAtual.gold}
                onChange={(e) => setCorAcentoCustom(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
              >
                Escolher
              </div>
            </label>
            {corAcentoCustom && (
              <button
                onClick={() => setCorAcentoCustom(null)}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--gray)" }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Paleta de temas */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gray)" }}>
          Paleta de Cores
        </p>
        <div className="grid grid-cols-3 gap-3">
          {TEMAS.filter((t) => t.id !== "light").map((tema) => {
            const ativo = temaId === tema.id;
            return (
              <button
                key={tema.id}
                onClick={() => setTema(tema.id)}
                className="relative rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95"
                style={{
                  border: `2px solid ${ativo ? tema.gold : "transparent"}`,
                  outline: ativo ? `1px solid ${tema.gold}40` : "none",
                }}
                title={tema.nome}
              >
                <div className="h-14 flex">
                  <div className="w-1/3 h-full" style={{ background: tema.preview[0] }} />
                  <div className="w-1/3 h-full" style={{ background: tema.preview[1] }} />
                  <div className="w-1/3 h-full" style={{ background: tema.preview[2] }} />
                </div>
                <div className="px-2 py-1.5 text-left" style={{ background: tema.card }}>
                  <p className="text-xs font-semibold truncate" style={{ color: tema.text }}>{tema.nome}</p>
                </div>
                {ativo && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: tema.gold }}>
                    <Check size={11} strokeWidth={3} style={{ color: "#000" }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: "var(--gray)" }}>
          {temaAtual.nome} — {temaAtual.descricao}
        </p>
      </div>
    </div>
  );
}
