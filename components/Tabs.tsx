"use client";
import { ReactNode } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.FC<{ size?: number }>;
  count?: number;
  dica?: string;
}

/**
 * Segmented control premium: pílula deslizante animada (spring) atrás da aba ativa.
 * Um só componente para padronizar todas as abas da plataforma.
 */
export default function Tabs<T extends string>({
  tabs, value, onChange, accent = "#c9a84c", className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  accent?: string;
  className?: string;
}) {
  const idx = Math.max(0, tabs.findIndex((t) => t.id === value));
  const pct = 100 / tabs.length;
  const escuro = accent === "#c9a84c" || accent === "#f59e0b" || accent === "#10b981";

  return (
    <div
      className={`relative flex p-1 rounded-2xl ${className ?? ""}`}
      style={{ background: "var(--surface-1, #0f1c30)", border: "1px solid var(--border, #1e3356)" }}
    >
      {/* Pílula deslizante */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 4, bottom: 4,
          left: `calc(${idx * pct}% + 4px)`,
          width: `calc(${pct}% - 8px)`,
          background: accent,
          borderRadius: 12,
          transition: "left 0.32s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1))",
          boxShadow: `0 4px 16px ${accent}40`,
        }}
      />
      {tabs.map((t) => {
        const ativo = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            data-tip={t.dica}
            className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-sm font-semibold"
            style={{ color: ativo ? (escuro ? "#0b1624" : "#fff") : "var(--text-dim, #94a3b8)" }}
          >
            {Icon && <Icon size={15} />}
            <span className="hidden sm:inline">{t.label}</span>
            {typeof t.count === "number" && t.count > 0 && (
              <span
                className="text-xs px-1.5 rounded-full font-bold"
                style={{ background: ativo ? "#00000022" : "var(--border, #1e3356)", color: ativo ? (escuro ? "#0b1624" : "#fff") : "var(--text-dim)" }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Pequeno helper para conteúdo de aba com entrada suave. */
export function TabPanel({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
