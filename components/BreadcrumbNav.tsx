"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LOJAS } from "@/lib/data";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":        "Dashboard",
  "/meu-dia":          "Meu Dia",
  "/sono":             "Sono",
  "/atividade":        "Atividade",
  "/tarefas":          "Tarefas",
  "/regras":           "Regras",
  "/desafios":         "Desafios",
  "/rotinas":          "Rotinas",
  "/formulario":       "Formulário",
  "/equipe":           "Equipe",
  "/lojas":            "Lojas",
  "/catalogo":         "Produtos",
  "/semana":           "Semana do Time",
  "/gastos":           "Gastos Equipe",
  "/gastos-operacoes": "Custos Op.",
  "/custo-total":      "Custo Total",
};

const MAX_HISTORY = 5;
const KEY = "izzat-nav-hist";

export default function BreadcrumbNav() {
  const pathname = usePathname();
  const { colaboradores, lojasCustom } = useAppStore();
  const [crumbs, setCrumbs] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(KEY);
    let hist: string[] = raw ? JSON.parse(raw) : [];
    if (hist[hist.length - 1] !== pathname) {
      hist = [...hist, pathname].slice(-MAX_HISTORY);
      sessionStorage.setItem(KEY, JSON.stringify(hist));
    }
    setCrumbs(hist.slice(-3));
  }, [pathname]);

  function label(path: string): string {
    if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
    if (path.startsWith("/equipe/")) {
      const id = path.split("/")[2];
      const c = colaboradores.find((x) => x.id === id);
      return c ? c.nome.split(" ")[0] : "Perfil";
    }
    if (path.startsWith("/lojas/")) {
      const id = path.split("/")[2];
      const all = [...LOJAS, ...lojasCustom];
      const l = all.find((x) => x.id === id);
      return l ? l.nome : "Loja";
    }
    return path;
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 mb-5 flex-wrap animate-fade-in">
      {crumbs.map((path, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={path + i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={11} style={{ color: "#334155" }} />}
            {isLast ? (
              <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                {label(path)}
              </span>
            ) : (
              <Link
                href={path}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: "#475569" }}
              >
                {label(path)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
