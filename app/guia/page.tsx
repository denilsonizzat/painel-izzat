"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ARTIGOS_GUIA, CATEGORIAS_GUIA, CHANGELOG, DESENVOLVEDOR } from "@/lib/guia";
import { Search, BookOpen, ChevronDown, ChevronUp, ChevronRight, Code2, Calendar, Zap, Wrench, Bug, Compass } from "lucide-react";

export default function GuiaPage() {
  const router = useRouter();
  const { setOnboardingConcluido } = useAppStore();
  const refazerTour = () => { setOnboardingConcluido(false); router.push("/dashboard"); };
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");
  const [artigoAtivo, setArtigoAtivo] = useState<string>(ARTIGOS_GUIA[0].id);
  const [secoesAbertas, setSecoesAbertas] = useState<Record<string, boolean>>({});

  const MODO_ESPECIAL = artigoAtivo === "__changelog__" || artigoAtivo === "__sobre__";

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

  const artigo = ARTIGOS_GUIA.find((a) => a.id === artigoAtivo);

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
          {/* Links especiais — sempre visíveis */}
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            {[{ id: "__changelog__", emoji: "📋", label: "Changelog / Versões" }, { id: "__sobre__", emoji: "👤", label: "Sobre o App" }].map((item) => (
              <button
                key={item.id}
                onClick={() => { setArtigoAtivo(item.id); setSecoesAbertas({}); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5"
                style={{
                  background: artigoAtivo === item.id ? "#c9a84c15" : "transparent",
                  borderLeft: artigoAtivo === item.id ? "3px solid #c9a84c" : "3px solid transparent",
                }}
              >
                <span className="text-base flex-shrink-0">{item.emoji}</span>
                <span className="text-sm font-medium" style={{ color: artigoAtivo === item.id ? "#c9a84c" : "#64748b" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
        {/* Refazer tour de boas-vindas */}
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={refazerTour}
            className="w-full flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#c9a84c18", color: "#c9a84c", border: "1px solid #c9a84c40" }}>
            <Compass size={14} /> Refazer tour de boas-vindas
          </button>
        </div>
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
          <button onClick={refazerTour}
            className="w-full mt-2 flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#c9a84c18", color: "#c9a84c", border: "1px solid #c9a84c40" }}>
            <Compass size={14} /> Refazer tour de boas-vindas
          </button>
        </div>

        <div className="p-6 md:p-8 max-w-3xl">

          {/* ── Changelog ── */}
          {artigoAtivo === "__changelog__" && (
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">📋</span>
                  <h1 className="text-2xl font-black" style={{ color: "#e2e8f0", fontFamily: "var(--font-display)" }}>Changelog — Histórico de Versões</h1>
                </div>
                <div className="h-0.5 w-16 rounded-full mt-3" style={{ background: "linear-gradient(90deg, #c9a84c, transparent)" }} />
              </div>
              <div className="flex flex-col gap-6">
                {CHANGELOG.map((v, vi) => (
                  <div key={v.versao} className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
                    <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: vi === 0 ? "#c9a84c12" : "transparent" }}>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black" style={{ background: vi === 0 ? "#c9a84c" : "#112239", color: vi === 0 ? "#0b1624" : "#94a3b8" }}>v{v.versao}</span>
                      <div>
                        <p className="font-bold text-sm" style={{ color: "#e2e8f0" }}>{v.titulo}</p>
                        <p className="text-xs flex items-center gap-1" style={{ color: "#475569" }}>
                          <Calendar size={11} /> {v.data}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {v.mudancas.map((m, mi) => {
                        const icon = m.tipo === "novo" ? <Zap size={12} style={{ color: "#c9a84c", flexShrink: 0 }} /> : m.tipo === "melhoria" ? <Wrench size={12} style={{ color: "#3b82f6", flexShrink: 0 }} /> : <Bug size={12} style={{ color: "#10b981", flexShrink: 0 }} />;
                        const cor = m.tipo === "novo" ? "#c9a84c20" : m.tipo === "melhoria" ? "#3b82f620" : "#10b98120";
                        const corLabel = m.tipo === "novo" ? "#c9a84c" : m.tipo === "melhoria" ? "#3b82f6" : "#10b981";
                        return (
                          <div key={mi} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: cor }}>
                            <div className="mt-0.5">{icon}</div>
                            <div className="flex-1">
                              <p className="text-sm" style={{ color: "#cbd5e1" }}>{m.descricao}</p>
                              {m.onde && <p className="text-xs mt-0.5" style={{ color: corLabel }}>📍 {m.onde}</p>}
                            </div>
                            <span className="text-xs px-1.5 py-0.5 rounded-md font-bold flex-shrink-0" style={{ background: cor, color: corLabel }}>
                              {m.tipo === "novo" ? "NOVO" : m.tipo === "melhoria" ? "MELHORIA" : "FIX"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sobre o App ── */}
          {artigoAtivo === "__sobre__" && (
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">👤</span>
                  <h1 className="text-2xl font-black" style={{ color: "#e2e8f0", fontFamily: "var(--font-display)" }}>Sobre o App</h1>
                </div>
                <div className="h-0.5 w-16 rounded-full mt-3" style={{ background: "linear-gradient(90deg, #c9a84c, transparent)" }} />
              </div>
              <div className="space-y-5">
                <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "#c9a84c20", border: "1px solid #c9a84c40" }}>👨‍💻</div>
                    <div>
                      <p className="font-black text-lg" style={{ color: "#e2e8f0" }}>{DESENVOLVEDOR.nome}</p>
                      <p className="text-sm" style={{ color: "#c9a84c" }}>{DESENVOLVEDOR.cargo}</p>
                      <p className="text-xs" style={{ color: "#475569" }}>{DESENVOLVEDOR.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="rounded-xl p-3" style={{ background: "#112239" }}>
                      <p className="text-xs" style={{ color: "#475569" }}>Primeiro deploy</p>
                      <p className="font-bold text-sm mt-0.5" style={{ color: "#e2e8f0" }}>{DESENVOLVEDOR.primeiroDeploy}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "#112239" }}>
                      <p className="text-xs" style={{ color: "#475569" }}>Versão atual</p>
                      <p className="font-bold text-sm mt-0.5" style={{ color: "#c9a84c" }}>v{CHANGELOG[0].versao} — {CHANGELOG[0].data}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 size={15} style={{ color: "#c9a84c" }} />
                    <p className="font-bold text-sm" style={{ color: "#e2e8f0" }}>Stack técnica</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Next.js App Router", "TypeScript", "Tailwind CSS v4", "Zustand", "Supabase", "Vercel", "PWA", "Shopify API"].map((tech) => (
                      <span key={tech} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "#112239", color: "#94a3b8", border: "1px solid #1e3356" }}>{tech}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="font-bold text-sm mb-2" style={{ color: "#e2e8f0" }}>📊 Estatísticas do projeto</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Versões lançadas", val: CHANGELOG.length },
                      { label: "Páginas no app", val: "24+" },
                      { label: "Módulos ativos", val: "12+" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#112239" }}>
                        <p className="font-black text-xl" style={{ color: "#c9a84c" }}>{s.val}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Artigo normal ── */}
          {!MODO_ESPECIAL && artigo && <>
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
          </>}
        </div>
      </main>
    </div>
  );
}
