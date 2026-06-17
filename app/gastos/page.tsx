"use client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import {
  DollarSign, Users, TrendingUp, AlertCircle, Wrench, BarChart3,
  Plus, Edit2, Check, X, Trash2, UserPlus, UserMinus,
} from "lucide-react";
import { Ferramenta } from "@/lib/data";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BarPct({ pct, cor }: { pct: number; cor: string }) {
  return (
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#1e3356", minWidth: 40 }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: cor }} />
    </div>
  );
}

const CORES = ["#c9a84c", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#f97316"];

type Aba = "pessoas" | "ferramentas" | "resumo";

const FORM_VAZIO = { nome: "", descricao: "", preco: "", tipo: "individual" as Ferramenta["tipo"], cor: "#c9a84c" };

export default function GastosPage() {
  const router = useRouter();
  const {
    usuarioAtual, colaboradores, setSalario, ferramentas,
    criarFerramenta, editarFerramenta, deletarFerramenta,
    vincularFerramenta, desvincularFerramenta,
  } = useAppStore();

  const [aba, setAba] = useState<Aba>("resumo");
  const [filtroArea, setFiltroArea] = useState("todas");
  const [ordenacao, setOrdenacao] = useState<"salario_desc" | "salario_asc" | "nome">("salario_desc");
  const [editandoSalId, setEditandoSalId] = useState<string | null>(null);
  const [salInput, setSalInput] = useState("");
  const [modalFerr, setModalFerr] = useState(false);
  const [editFerr, setEditFerr] = useState<Ferramenta | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [formPessoas, setFormPessoas] = useState<string[]>([]);
  const [vincularForrId, setVincularForrId] = useState<string | null>(null);
  const [confirmarDelete, setConfirmarDelete] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setModalFerr(false); };
    if (modalFerr) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modalFerr]);

  useEffect(() => {
    if (!usuarioAtual) { router.push("/"); return; }
    if (usuarioAtual.nivelAcesso !== "admin") router.push("/dashboard");
  }, [usuarioAtual, router]);

  if (!usuarioAtual || usuarioAtual.nivelAcesso !== "admin") return null;

  // ── Cálculos salários ──
  const comSalario = colaboradores.filter((c) => c.salario != null && c.salario > 0);
  const semSalario = colaboradores.filter((c) => !c.salario || c.salario === 0);
  const totalSalarios = comSalario.reduce((s, c) => s + (c.salario || 0), 0);
  const mediaSalario = comSalario.length > 0 ? totalSalarios / comSalario.length : 0;

  // ── Cálculos ferramentas ──
  function custoFerramenta(f: Ferramenta): number {
    if (f.tipo === "individual") return f.preco * f.colaboradoresIds.length;
    return f.preco;
  }
  const totalFerramentas = ferramentas.reduce((s, f) => s + custoFerramenta(f), 0);
  const totalGeral = totalSalarios + totalFerramentas;

  // Custo de ferramentas por colaborador
  function custoPessoaFerramentas(colaboradorId: string): number {
    return ferramentas.reduce((acc, f) => {
      if (!f.colaboradoresIds.includes(colaboradorId)) return acc;
      if (f.tipo === "individual") return acc + f.preco;
      const n = f.colaboradoresIds.length;
      return acc + (n > 0 ? f.preco / n : 0);
    }, 0);
  }

  // Áreas
  const areas: Record<string, { colabs: typeof colaboradores; total: number }> = {};
  for (const c of colaboradores) {
    const a = c.cargo || "Sem cargo";
    if (!areas[a]) areas[a] = { colabs: [], total: 0 };
    areas[a].colabs.push(c);
    areas[a].total += c.salario || 0;
  }
  const areasOrdenadas = Object.entries(areas).sort((a, b) => b[1].total - a[1].total);
  const todasAreas = areasOrdenadas.map(([n]) => n);

  const colabFiltrados = colaboradores
    .filter((c) => filtroArea === "todas" || c.cargo === filtroArea)
    .sort((a, b) => {
      if (ordenacao === "salario_desc") return (b.salario || 0) - (a.salario || 0);
      if (ordenacao === "salario_asc") return (a.salario || 0) - (b.salario || 0);
      return a.nome.localeCompare(b.nome);
    });
  const totalFiltrado = colabFiltrados.reduce((s, c) => s + (c.salario || 0), 0);

  const salvarSalario = (id: string) => {
    const val = parseFloat(salInput.replace(",", "."));
    if (!isNaN(val) && val >= 0) setSalario(id, val);
    setEditandoSalId(null);
  };

  const abrirNovaFerr = () => {
    setEditFerr(null);
    setForm(FORM_VAZIO);
    setFormPessoas([]);
    setModalFerr(true);
  };
  const abrirEditFerr = (f: Ferramenta) => {
    setEditFerr(f);
    setForm({ nome: f.nome, descricao: f.descricao || "", preco: String(f.preco), tipo: f.tipo, cor: f.cor || "#c9a84c" });
    setFormPessoas(f.colaboradoresIds);
    setModalFerr(true);
  };
  const togglePessoaModal = (id: string) => {
    setFormPessoas((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const salvarFerr = () => {
    const preco = parseFloat(form.preco.replace(",", "."));
    if (!form.nome.trim() || isNaN(preco) || preco < 0) return;
    if (editFerr) {
      editarFerramenta(editFerr.id, { nome: form.nome.trim(), descricao: form.descricao.trim() || undefined, preco, tipo: form.tipo, cor: form.cor, colaboradoresIds: formPessoas });
    } else {
      criarFerramenta({ nome: form.nome.trim(), descricao: form.descricao.trim() || undefined, preco, tipo: form.tipo, cor: form.cor, colaboradoresIds: formPessoas });
    }
    setModalFerr(false);
    setSavedFeedback(form.nome.trim());
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  // ── RENDER ABAS ──
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <BackButton href="/dashboard" />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Controle de Custos</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Folha salarial, ferramentas e custo total por pessoa — somente administradores
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5" style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430" }}>
          <AlertCircle size={13} /> Confidencial
        </div>
      </div>

      {/* Feedback de sucesso */}
      {savedFeedback && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#10b98115", border: "1px solid #10b98140" }}>
          <Check size={15} style={{ color: "#10b981" }} />
          <span className="text-sm font-semibold" style={{ color: "#10b981" }}>
            Ferramenta &quot;{savedFeedback}&quot; salva com sucesso
          </span>
        </div>
      )}

      {/* Hero — Custo Total Mensal */}
      <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #0d1f35 0%, #0b1624 100%)", border: "2px solid #c9a84c40" }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>Custo Total Mensal</p>
        <p className="font-black leading-none" style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)", color: "#c9a84c" }}>
          R$ {fmt(totalGeral)}
        </p>
        {totalGeral > 0 && (
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} />
              <span className="text-sm" style={{ color: "#94a3b8" }}>
                Salarios <strong style={{ color: "#10b981" }}>R$ {fmt(totalSalarios)}</strong>
                <span className="text-xs ml-1.5" style={{ color: "#475569" }}>({((totalSalarios / totalGeral) * 100).toFixed(0)}%)</span>
              </span>
            </div>
            <div className="w-px" style={{ background: "#1e3356" }} />
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#3b82f6" }} />
              <span className="text-sm" style={{ color: "#94a3b8" }}>
                Ferramentas <strong style={{ color: "#3b82f6" }}>R$ {fmt(totalFerramentas)}</strong>
                <span className="text-xs ml-1.5" style={{ color: "#475569" }}>({((totalFerramentas / totalGeral) * 100).toFixed(0)}%)</span>
              </span>
            </div>
          </div>
        )}
        {totalGeral > 0 && (
          <div className="mt-4 flex rounded-full overflow-hidden h-2" style={{ background: "#1e3356" }}>
            <div style={{ width: `${(totalSalarios / totalGeral) * 100}%`, background: "#10b981", transition: "width 0.7s" }} />
            <div style={{ width: `${(totalFerramentas / totalGeral) * 100}%`, background: "#3b82f6", transition: "width 0.7s" }} />
          </div>
        )}
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-3.5" style={{ background: "#122039", border: "1px solid #10b98125" }}>
          <p className="text-xs" style={{ color: "#64748b" }}>Folha Salarial</p>
          <p className="text-lg font-black mt-0.5" style={{ color: "#10b981" }}>R$ {fmt(totalSalarios)}</p>
          <p className="text-xs mt-0.5" style={{ color: "#334155" }}>{comSalario.length}/{colaboradores.length} cadastrados</p>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "#122039", border: "1px solid #3b82f625" }}>
          <p className="text-xs" style={{ color: "#64748b" }}>Ferramentas</p>
          <p className="text-lg font-black mt-0.5" style={{ color: "#3b82f6" }}>R$ {fmt(totalFerramentas)}</p>
          <p className="text-xs mt-0.5" style={{ color: "#334155" }}>{ferramentas.length} ferramentas</p>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: "#122039", border: "1px solid #8b5cf625" }}>
          <p className="text-xs" style={{ color: "#64748b" }}>Media Salarial</p>
          <p className="text-lg font-black mt-0.5" style={{ color: "#8b5cf6" }}>R$ {fmt(mediaSalario)}</p>
          <p className="text-xs mt-0.5" style={{ color: "#334155" }}>{comSalario.length} pessoas</p>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: semSalario.length > 0 ? "#122039" : "#0d1928", border: semSalario.length > 0 ? "1px solid #f59e0b25" : "1px solid #1e3356" }}>
          <p className="text-xs" style={{ color: "#64748b" }}>Sem Salario</p>
          <p className="text-lg font-black mt-0.5" style={{ color: semSalario.length > 0 ? "#f59e0b" : "#334155" }}>{semSalario.length}</p>
          <p className="text-xs mt-0.5" style={{ color: "#334155" }}>colaboradores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#0d1928", border: "1px solid #1e3356" }}>
        {([
          { id: "resumo", label: "Resumo Geral", icon: BarChart3 },
          { id: "pessoas", label: "Pessoas", icon: Users },
          { id: "ferramentas", label: "Ferramentas", icon: Wrench },
        ] as { id: Aba; label: string; icon: React.FC<{ size?: number }> }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: aba === id ? "#c9a84c" : "transparent",
              color: aba === id ? "#0b1624" : "#64748b",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── ABA RESUMO ─── */}
      {aba === "resumo" && (
        <div className="space-y-5">
          {/* Custo por área */}
          <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} style={{ color: "#c9a84c" }} />
              <h2 className="text-white font-semibold">Custo Salarial por Area</h2>
            </div>
            {totalSalarios === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "#475569" }}>Nenhum salario cadastrado ainda.</p>
            ) : (
              <div className="space-y-4">
                {areasOrdenadas.map(([area, dados], idx) => {
                  const cor = CORES[idx % CORES.length];
                  const pct = totalSalarios > 0 ? (dados.total / totalSalarios) * 100 : 0;
                  const sem = dados.colabs.filter((c) => !c.salario || c.salario === 0).length;
                  return (
                    <div key={area}>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cor }} />
                        <span className="text-sm font-medium text-white flex-1 truncate">{area}</span>
                        <span className="text-xs flex-shrink-0" style={{ color: "#64748b" }}>{dados.colabs.length}p</span>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: cor }}>{pct.toFixed(1)}%</span>
                        <span className="text-sm font-bold flex-shrink-0 w-32 text-right" style={{ color: dados.total > 0 ? "#e8edf5" : "#475569" }}>
                          {dados.total > 0 ? "R$ " + fmt(dados.total) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 flex-shrink-0" />
                        <BarPct pct={pct} cor={cor} />
                        {sem > 0 && <span className="text-xs flex-shrink-0" style={{ color: "#f59e0b" }}>{sem} sem salario</span>}
                        <div className="w-32" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custo por pessoa (salário + ferramentas) */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #1e3356" }}>
              <div className="flex items-center gap-2">
                <Users size={15} style={{ color: "#c9a84c" }} />
                <h2 className="text-white font-semibold text-sm">Custo Total por Pessoa</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e3356", color: "#64748b" }}>salario + ferramentas</span>
              </div>
            </div>
            <div>
              {[...colaboradores]
                .sort((a, b) => {
                  const ca = (a.salario || 0) + custoPessoaFerramentas(a.id);
                  const cb = (b.salario || 0) + custoPessoaFerramentas(b.id);
                  return cb - ca;
                })
                .map((c, idx) => {
                  const custoFerr = custoPessoaFerramentas(c.id);
                  const total = (c.salario || 0) + custoFerr;
                  const pct = totalGeral > 0 ? (total / totalGeral) * 100 : 0;
                  const ferrsPessoa = ferramentas.filter((f) => f.colaboradoresIds.includes(c.id));
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: idx === 0 ? "none" : "1px solid #1e335640" }}>
                      <Link href={`/equipe/${c.id}#custo`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80">
                        <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={32} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{c.nome.split(" ")[0]}</p>
                          <p className="text-xs truncate" style={{ color: "#64748b" }}>{c.cargo}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {ferrsPessoa.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Wrench size={11} style={{ color: "#3b82f6" }} />
                            <span className="text-xs" style={{ color: "#3b82f6" }}>+R$ {fmt(custoFerr)}</span>
                          </div>
                        )}
                        <span className="text-sm font-bold w-28 text-right" style={{ color: total > 0 ? "#e8edf5" : "#334155" }}>
                          {total > 0 ? "R$ " + fmt(total) : "—"}
                        </span>
                        <span className="text-xs w-10 text-right" style={{ color: "#475569" }}>
                          {totalGeral > 0 && total > 0 ? pct.toFixed(1) + "%" : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #1e3356", background: "#0d1928" }}>
              <span className="text-sm font-bold text-white">Total Geral</span>
              <span className="text-base font-black" style={{ color: "#c9a84c" }}>R$ {fmt(totalGeral)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── ABA PESSOAS ─── */}
      {aba === "pessoas" && (
        <div className="space-y-5">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
            {/* Controles */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #1e3356" }}>
              <div className="flex items-center gap-2">
                <Users size={15} style={{ color: "#c9a84c" }} />
                <span className="text-white font-semibold text-sm">Salarios</span>
              </div>
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <span className="text-xs" style={{ color: "#64748b" }}>Area:</span>
                <button onClick={() => setFiltroArea("todas")} className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{ background: filtroArea === "todas" ? "#c9a84c" : "#1e3356", color: filtroArea === "todas" ? "#0b1624" : "#64748b" }}>
                  Todas
                </button>
                {todasAreas.map((area, idx) => (
                  <button key={area} onClick={() => setFiltroArea(area)} className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{ background: filtroArea === area ? CORES[idx % CORES.length] : "#1e3356", color: filtroArea === area ? "#0b1624" : "#64748b" }}>
                    {area}
                  </button>
                ))}
              </div>
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as typeof ordenacao)}
                className="text-xs px-2 py-1 rounded-lg outline-none"
                style={{ background: "#1e3356", color: "#94a3b8", border: "1px solid #334155" }}>
                <option value="salario_desc">Maior salario</option>
                <option value="salario_asc">Menor salario</option>
                <option value="nome">Nome A-Z</option>
              </select>
            </div>

            {filtroArea !== "todas" && (
              <div className="px-5 py-2.5 flex items-center gap-3" style={{ background: "#0d1928", borderBottom: "1px solid #1e3356" }}>
                <span className="text-xs font-semibold text-white">{filtroArea}</span>
                <span style={{ color: "#334155" }}>·</span>
                <span className="text-xs font-bold" style={{ color: "#10b981" }}>R$ {fmt(totalFiltrado)}</span>
                {totalSalarios > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#10b98115", color: "#10b981" }}>
                    {((totalFiltrado / totalSalarios) * 100).toFixed(1)}% da folha
                  </span>
                )}
              </div>
            )}

            <div className="grid px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
              style={{ gridTemplateColumns: "1fr auto auto auto", color: "#475569", borderBottom: "1px solid #1e3356" }}>
              <span>Colaborador</span>
              <span className="w-32 text-center">Area</span>
              <span className="w-36 text-right">Salario Mensal</span>
              <span className="w-14 text-right">% Total</span>
            </div>

            <div>
              {colabFiltrados.map((c, idx) => {
                const pct = totalSalarios > 0 && c.salario ? (c.salario / totalSalarios) * 100 : 0;
                const areaIdx = todasAreas.indexOf(c.cargo || "Sem cargo");
                const cor = CORES[areaIdx % CORES.length] || "#64748b";
                const editando = editandoSalId === c.id;
                return (
                  <div key={c.id} className="grid items-center px-5 py-3"
                    style={{ gridTemplateColumns: "1fr auto auto auto", borderTop: idx === 0 ? "none" : "1px solid #1e335640", background: editando ? "#0d1f35" : "transparent" }}>
                    <Link href={`/equipe/${c.id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80">
                      <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={32} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.nome}</p>
                        <p className="text-xs truncate" style={{ color: "#64748b" }}>{c.cargo}</p>
                      </div>
                    </Link>
                    <div className="w-32 flex justify-center">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cor + "20", color: cor }}>
                        {(c.cargo || "Sem cargo").split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>
                    <div className="w-36 flex items-center justify-end gap-1.5">
                      {editando ? (
                        <>
                          <input autoFocus value={salInput} onChange={(e) => setSalInput(e.target.value)} type="number" placeholder="0.00"
                            className="px-2 py-1 rounded-lg text-sm text-white outline-none text-right"
                            style={{ background: "#1e3356", border: "1px solid #334155", width: 100 }}
                            onKeyDown={(e) => { if (e.key === "Enter") salvarSalario(c.id); if (e.key === "Escape") setEditandoSalId(null); }} />
                          <button onClick={() => salvarSalario(c.id)} className="p-1.5 rounded-lg" style={{ background: "#10b98120", color: "#10b981" }}><Check size={13} /></button>
                          <button onClick={() => setEditandoSalId(null)} className="p-1.5 rounded-lg" style={{ color: "#64748b" }}><X size={13} /></button>
                        </>
                      ) : (
                        <>
                          {c.salario
                            ? <span className="text-sm font-bold" style={{ color: "#e8edf5" }}>R$ {fmt(c.salario)}</span>
                            : <span className="text-xs italic" style={{ color: "#334155" }}>nao cadastrado</span>}
                          <button onClick={() => { setEditandoSalId(c.id); setSalInput(c.salario ? String(c.salario) : ""); }}
                            className="p-1 rounded-lg hover:opacity-80" style={{ color: "#475569" }} title="Editar salario">
                            <Edit2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="w-14 flex justify-end">
                      {c.salario && totalSalarios > 0
                        ? <span className="text-xs font-semibold" style={{ color: pct > 20 ? "#ef4444" : pct > 10 ? "#f59e0b" : "#64748b" }}>{pct.toFixed(1)}%</span>
                        : <span className="text-xs" style={{ color: "#334155" }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid items-center px-5 py-4" style={{ gridTemplateColumns: "1fr auto auto auto", borderTop: "1px solid #1e3356", background: "#0d1928" }}>
              <span className="text-sm font-bold text-white">Total {filtroArea !== "todas" ? `— ${filtroArea}` : ""}</span>
              <div className="w-32" />
              <div className="w-36 text-right">
                <span className="text-base font-black" style={{ color: "#10b981" }}>R$ {fmt(filtroArea !== "todas" ? totalFiltrado : totalSalarios)}</span>
              </div>
              <div className="w-14" />
            </div>
          </div>

          {semSalario.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #f59e0b30" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={15} style={{ color: "#f59e0b" }} />
                <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
                  {semSalario.length} {semSalario.length === 1 ? "colaborador" : "colaboradores"} sem salario
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {semSalario.map((c) => (
                  <Link key={c.id} href={`/equipe/${c.id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:opacity-80" style={{ background: "#1e3356", border: "1px solid #334155" }}>
                    <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={22} />
                    <span className="text-xs text-white">{c.nome.split(" ")[0]}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── ABA FERRAMENTAS ─── */}
      {aba === "ferramentas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "#64748b" }}>
              Ferramentas individuais cobram por usuario vinculado. Compartilhadas tem custo fixo independente de usuarios.
            </p>
            <button onClick={abrirNovaFerr} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: "#c9a84c", color: "#0b1624" }}>
              <Plus size={15} /> Nova Ferramenta
            </button>
          </div>

          {ferramentas.length === 0 && (
            <div className="rounded-2xl p-10 text-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
              <div className="text-4xl mb-3">🔧</div>
              <p className="font-semibold text-white mb-1">Nenhuma ferramenta cadastrada</p>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Adicione ferramentas como ChatGPT, Claude, Notion, etc. e vincule as pessoas que as usam.
              </p>
              <button onClick={abrirNovaFerr} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80" style={{ background: "#c9a84c", color: "#0b1624" }}>
                + Adicionar primeira ferramenta
              </button>
            </div>
          )}

          {ferramentas.map((f, idx) => {
            const custo = custoFerramenta(f);
            const cor = f.cor || CORES[idx % CORES.length];
            const vinculando = vincularForrId === f.id;
            const naoVinculados = colaboradores.filter((c) => !f.colaboradoresIds.includes(c.id));
            const vinculados = colaboradores.filter((c) => f.colaboradoresIds.includes(c.id));
            return (
              <div key={f.id} className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: `1px solid ${cor}30` }}>
                {/* Header da ferramenta */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cor + "20", border: `1px solid ${cor}40` }}>
                        <Wrench size={18} style={{ color: cor }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold">{f.nome}</p>
                        {f.descricao && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{f.descricao}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: f.tipo === "individual" ? "#8b5cf620" : "#10b98120", color: f.tipo === "individual" ? "#8b5cf6" : "#10b981" }}>
                            {f.tipo === "individual" ? "Individual" : "Compartilhada"}
                          </span>
                          <span className="text-xs" style={{ color: "#64748b" }}>
                            R$ {fmt(f.preco)}{f.tipo === "individual" ? "/pessoa" : "/mes (fixo)"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black" style={{ color: cor }}>R$ {fmt(custo)}</p>
                        <p className="text-xs" style={{ color: "#475569" }}>
                          {f.tipo === "individual"
                            ? `${f.colaboradoresIds.length} usuario${f.colaboradoresIds.length !== 1 ? "s" : ""}`
                            : "custo fixo"}
                        </p>
                      </div>
                      <button onClick={() => abrirEditFerr(f)} className="p-2 rounded-xl hover:opacity-80 transition-opacity" style={{ color: "#64748b" }} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      {confirmarDelete === f.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { deletarFerramenta(f.id); setConfirmarDelete(null); }}
                            className="p-1.5 rounded-lg text-xs font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>
                            Confirmar
                          </button>
                          <button onClick={() => setConfirmarDelete(null)} className="p-1.5 rounded-lg" style={{ color: "#64748b" }}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmarDelete(f.id)} className="p-2 rounded-xl hover:opacity-80" style={{ color: "#475569" }} title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Usuarios vinculados */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {vinculados.length === 0 ? (
                      <span className="text-xs italic" style={{ color: "#334155" }}>Nenhum usuario vinculado</span>
                    ) : (
                      vinculados.map((c) => (
                        <div key={c.id} className="flex items-center gap-1.5 px-2 py-1 rounded-xl" style={{ background: "#1e3356" }}>
                          <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={20} />
                          <span className="text-xs text-white">{c.nome.split(" ")[0]}</span>
                          <button onClick={() => desvincularFerramenta(f.id, c.id)} className="ml-0.5 p-0.5 rounded hover:opacity-70 transition-opacity"
                            style={{ color: "#475569" }} title="Desvincular">
                            <X size={11} />
                          </button>
                        </div>
                      ))
                    )}
                    <button onClick={() => setVincularForrId(vinculando ? null : f.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: cor + "20", color: cor, border: `1px solid ${cor}30` }}>
                      <UserPlus size={12} /> Vincular
                    </button>
                  </div>

                  {/* Dropdown para vincular */}
                  {vinculando && naoVinculados.length > 0 && (
                    <div className="mt-2 p-2 rounded-xl flex flex-wrap gap-1.5" style={{ background: "#0d1928", border: "1px solid #1e3356" }}>
                      <span className="text-xs w-full mb-1" style={{ color: "#64748b" }}>Clique para vincular:</span>
                      {naoVinculados.map((c) => (
                        <button key={c.id} onClick={() => vincularFerramenta(f.id, c.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-all hover:opacity-80"
                          style={{ background: "#1e3356", color: "#e8edf5" }}>
                          <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={18} />
                          {c.nome.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  )}
                  {vinculando && naoVinculados.length === 0 && (
                    <p className="mt-2 text-xs" style={{ color: "#64748b" }}>Todos os colaboradores ja estao vinculados.</p>
                  )}
                </div>
              </div>
            );
          })}

          {ferramentas.length > 0 && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "#0d1928", border: "1px solid #1e3356" }}>
              <span className="text-sm font-bold text-white">Total Ferramentas</span>
              <span className="text-base font-black" style={{ color: "#3b82f6" }}>R$ {fmt(totalFerramentas)}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL FERRAMENTA ─── */}
      {modalFerr && (() => {
        const precoNum = parseFloat(form.preco.replace(",", ".")) || 0;
        const custoPreview = form.tipo === "individual"
          ? precoNum * formPessoas.length
          : precoNum;
        const custoPorPessoa = form.tipo === "compartilhada" && formPessoas.length > 0
          ? precoNum / formPessoas.length
          : precoNum;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
            <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356", maxHeight: "90vh", overflowY: "auto" }}>
              {/* Header modal */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1e3356" }}>
                <h2 className="text-white font-bold">{editFerr ? "Editar Ferramenta" : "Nova Ferramenta"}</h2>
                <button onClick={() => setModalFerr(false)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "#64748b" }}><X size={18} /></button>
              </div>

              <div className="p-6 space-y-4">
                {/* Nome + Desc */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#64748b" }}>Nome *</label>
                    <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="ex: ChatGPT Plus"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "#1e3356", border: "1px solid #334155" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#64748b" }}>Descricao</label>
                    <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="ex: IA para criacao de conteudo"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "#1e3356", border: "1px solid #334155" }} />
                  </div>
                </div>

                {/* Preco + Cor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#64748b" }}>Preco Mensal (R$) *</label>
                    <input value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} placeholder="0.00" type="number"
                      className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: "#1e3356", border: "1px solid #334155" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: "#64748b" }}>Cor</label>
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {CORES.slice(0, 8).map((c) => (
                        <button key={c} onClick={() => setForm({ ...form, cor: c })}
                          className="w-7 h-7 rounded-lg transition-all"
                          style={{ background: c, border: form.cor === c ? "3px solid white" : "2px solid transparent" }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "#64748b" }}>Tipo de Licenca</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["individual", "compartilhada"] as const).map((t) => (
                      <button key={t} onClick={() => setForm({ ...form, tipo: t })}
                        className="px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
                        style={{ background: form.tipo === t ? "#c9a84c" : "#1e3356", color: form.tipo === t ? "#0b1624" : "#64748b", border: `1px solid ${form.tipo === t ? "#c9a84c" : "#334155"}` }}>
                        <div className="font-bold">{t === "individual" ? "Individual" : "Compartilhada"}</div>
                        <div className="text-xs mt-0.5 opacity-80">
                          {t === "individual" ? "Cobra por usuario vinculado" : "Preco fixo, dividido entre todos"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vincular pessoas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
                      Quem usa essa ferramenta
                    </label>
                    {formPessoas.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#3b82f620", color: "#3b82f6" }}>
                        {formPessoas.length} selecionado{formPessoas.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {colaboradores.map((c) => {
                      const sel = formPessoas.includes(c.id);
                      return (
                        <button key={c.id} onClick={() => togglePessoaModal(c.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left"
                          style={{
                            background: sel ? (form.cor || "#3b82f6") + "20" : "#1e3356",
                            border: `1px solid ${sel ? (form.cor || "#3b82f6") + "60" : "transparent"}`,
                          }}>
                          <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={24} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white truncate">{c.nome.split(" ")[0]}</p>
                            <p className="text-xs truncate" style={{ color: "#475569" }}>{c.cargo?.split(" ")[0]}</p>
                          </div>
                          {sel && <Check size={13} style={{ color: form.cor || "#3b82f6", flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview de custo dinâmico */}
                {precoNum > 0 && (
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: "#0d1928", border: "1px solid #1e3356" }}>
                    <div>
                      <p className="text-xs" style={{ color: "#64748b" }}>Custo mensal estimado</p>
                      {form.tipo === "compartilhada" && formPessoas.length > 1 && (
                        <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                          R$ {fmt(custoPorPessoa)}/pessoa ({formPessoas.length} usuarios)
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-black" style={{ color: form.cor || "#c9a84c" }}>
                      R$ {fmt(custoPreview)}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setModalFerr(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#1e3356", color: "#64748b" }}>
                  Cancelar
                </button>
                <button onClick={salvarFerr} disabled={!form.nome.trim() || !form.preco}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#c9a84c", color: "#0b1624" }}>
                  {editFerr ? "Salvar alteracoes" : "Criar Ferramenta"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
