"use client";
import { useState, useMemo } from "react";
import { ARTIGOS_GUIA, CATEGORIAS_GUIA, Artigo } from "@/lib/guia";
import { Search, BookOpen, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";

export default function GuiaPage() {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");
  const [artigoAtivo, setArtigoAtivo] = useState<string>(ARTIGOS_GUIA[0].id);
  const [secoesAbertas, setSecoesAbertas] = useState<Record<string, boolean>>({});

  const artigosFiltrados = useMemo(() => {
    return ARTIGOS_GUIA.filter((a) => {
      const matchCat = categoriaAtiva === "todos" || a.categoria === categoriaAtiva;
      if (!busca.trim()) return matchCat;
      const q = busca.toLowerCase();
      return matchCat && (
        a.titulo.toLowerCase().includes(q) ||
        a.secoes.some((s) => s.titulo.toLowerCase().includes(q) || s.conteudo.toLowerCase().includes(q))
      );
    });
  }, [busca, categoriaAtiva]);

  const artigo = ARTIGOS_GUIA.find((a) => a.id === artigoAtivo) ?? ARTIGOS_GUIA[0];

  function toggleSecao(id: string) {
    setSecoesAbertas((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function abrirArtigo(id: string) {
    setArtigoAtivo(id);
    setSecoesAbertas({});
  }

  return (
    <div className="flex gap-0 h-[calc(100vh-88px)] md:h-[calc(100vh-48px)] rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>

      {/* ── Sidebar de tópicos ── */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 overflow-hidden" style={{ background: "var(--card)", borderRight: "1px solid var(--border)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} style={{ color: "#c9a84c" }} />
            <span className="font-bold text-sm" style={{ color: "#c9a84c" }}>Guia do App</span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "#112239", color: "#e2e8f0", border: "1px solid #1e3356" }}
            />
          </div>
        </div>

        {/* Categorias */}
        <div className="flex flex-wrap gap-1 p-3 border-b" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setCategoriaAtiva("todos")}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background: categoriaAtiva === "todos" ? "#c9a84c20" : "transparent",
              color: categoriaAtiva === "todos" ? "#c9a84c" : "#64748b",
              border: categoriaAtiva === "todos" ? "1px solid #c9a84c40" : "1px solid transparent",
            }}
          >
            Todos
          </button>
          {CATEGORIAS_GUIA.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: categoriaAtiva === cat.id ? "#c9a84c20" : "transparent",
                color: categoriaAtiva === cat.id ? "#c9a84c" : "#64748b",
                border: categoriaAtiva === cat.id ? "1px solid #c9a84c40" : "1px solid transparent",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de artigos */}
        <nav className="flex-1 overflow-y-auto p-2">
          {artigosFiltrados.length === 0 ? (
            <p className="text-center text-xs py-8" style={{ color: "#475569" }}>Nenhum artigo encontrado</p>
          ) : (
            artigosFiltrados.map((a) => (
              <button
                key={a.id}
                onClick={() => abrirArtigo(a.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5"
                style={{
                  background: artigoAtivo === a.id ? "#c9a84c15" : "transparent",
                  borderLeft: artigoAtivo === a.id ? "3px solid #c9a84c" : "3px solid transparent",
                }}
              >
                <span className="text-base flex-shrink-0">{a.emoji}</span>
                <span className="text-sm font-medium truncate" style={{ color: artigoAtivo === a.id ? "#c9a84c" : "#94a3b8" }}>
                  {a.titulo}
                </span>
                {artigoAtivo === a.id && <ChevronRight size={12} style={{ color: "#c9a84c", flexShrink: 0, marginLeft: "auto" }} />}
              </button>
            ))
          )}
        </nav>
      </aside>

      {/* ── Conteúdo do artigo ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile: seletor de artigo */}
        <div className="md:hidden p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <select
            value={artigoAtivo}
            onChange={(e) => abrirArtigo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: "#112239", color: "#e2e8f0", border: "1px solid #1e3356" }}
          >
            {ARTIGOS_GUIA.map((a) => (
              <option key={a.id} value={a.id}>{a.emoji} {a.titulo}</option>
            ))}
          </select>
        </div>

        <div className="p-6 md:p-8 max-w-3xl">
          {/* Cabeçalho do artigo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{artigo.emoji}</span>
              <h1 className="text-2xl font-black" style={{ color: "#e2e8f0", fontFamily: "var(--font-display)" }}>
                {artigo.titulo}
              </h1>
            </div>
            <div className="h-0.5 w-16 rounded-full mt-3" style={{ background: "linear-gradient(90deg, #c9a84c, transparent)" }} />
          </div>

          {/* Seções accordion */}
          <div className="flex flex-col gap-3">
            {artigo.secoes.map((sec, i) => {
              const key = `${artigo.id}-${i}`;
              const aberta = secoesAbertas[key] !== false && (i === 0 || secoesAbertas[key]);
              const isFirst = i === 0;
              const open = isFirst ? (secoesAbertas[key] !== false) : (secoesAbertas[key] === true);

              return (
                <div
                  key={key}
                  className="rounded-2xl overflow-hidden transition-all"
                  style={{ border: "1px solid var(--border)", background: "var(--card)" }}
                >
                  <button
                    onClick={() => toggleSecao(key)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-90 transition-opacity"
                  >
                    <span className="font-bold text-sm" style={{ color: "#e2e8f0" }}>{sec.titulo}</span>
                    {open
                      ? <ChevronUp size={15} style={{ color: "#c9a84c", flexShrink: 0 }} />
                      : <ChevronDown size={15} style={{ color: "#475569", flexShrink: 0 }} />
                    }
                  </button>
                  {open && (
                    <div
                      className="px-5 pb-5 text-sm guia-conteudo"
                      style={{ color: "#94a3b8", lineHeight: 1.75, borderTop: "1px solid var(--border)" }}
                      dangerouslySetInnerHTML={{ __html: sec.conteudo }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Navegação entre artigos */}
          <div className="flex justify-between mt-10 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            {(() => {
              const idx = ARTIGOS_GUIA.findIndex((a) => a.id === artigoAtivo);
              const prev = ARTIGOS_GUIA[idx - 1];
              const next = ARTIGOS_GUIA[idx + 1];
              return (
                <>
                  {prev ? (
                    <button onClick={() => abrirArtigo(prev.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:opacity-80" style={{ background: "#112239", color: "#94a3b8", border: "1px solid #1e3356" }}>
                      ← {prev.emoji} {prev.titulo}
                    </button>
                  ) : <div />}
                  {next && (
                    <button onClick={() => abrirArtigo(next.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:opacity-80" style={{ background: "#112239", color: "#94a3b8", border: "1px solid #1e3356" }}>
                      {next.emoji} {next.titulo} →
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
