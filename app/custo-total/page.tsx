"use client";
import { useAppStore } from "@/lib/store";
import { LOJAS, CATEGORIA_GASTO_LABEL, CategoriaGastoOp, GastoOperacional } from "@/lib/data";
import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import {
  Wallet, Users, Wrench, Building2, ChevronDown, ChevronUp,
  ExternalLink, Pencil, Check, X, TrendingDown, AlertCircle,
} from "lucide-react";

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
function mesLabel(mes: string) {
  const [y, m] = mes.split("-");
  return `${MESES_PT[parseInt(m) - 1]} ${y}`;
}

const LOJAS_IZZAT = LOJAS.filter((l) => l.grupo === "izzat");

export default function CustoTotalPage() {
  const {
    colaboradores, ferramentas, gastosOperacionais, lojasCustom,
    editarGastoOp, deletarGastoOp, toggleGastoOp,
    editarFerramenta,
  } = useAppStore();

  const mesAtual = new Date().toISOString().slice(0, 7);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [secaoAberta, setSecaoAberta] = useState<"time" | "ferramentas" | "operacoes" | null>("time");
  const [lojaExpandida, setLojaExpandida] = useState<string | null>(null);
  const [editandoGastoId, setEditandoGastoId] = useState<string | null>(null);
  const [editandoFerrId, setEditandoFerrId] = useState<string | null>(null);
  const [valorEdit, setValorEdit] = useState("");

  // ── Cálculos ──────────────────────────────────────────────────
  const totalFolha = colaboradores.reduce((s, c) => s + (c.salario ?? 0), 0);
  const semSalario = colaboradores.filter((c) => !c.salario || c.salario === 0).length;

  const totalFerramentas = ferramentas.reduce((s, f) => s + f.preco, 0);

  const lojasIzzatTodas = [...LOJAS_IZZAT, ...lojasCustom.filter((l) => l.grupo === "izzat")];
  const gastosIzzat = gastosOperacionais.filter((g) =>
    lojasIzzatTodas.some((l) => l.id === g.lojaId) && g.ativo
  );
  const gastosFixosIzzat = gastosIzzat.filter((g) => g.tipo === "fixo");
  const gastosVarIzzat = gastosIzzat.filter((g) => g.tipo === "variavel" && g.mes === mesSelecionado);
  const totalOpFixo = gastosFixosIzzat.reduce((s, g) => s + g.valor, 0);
  const totalOpVar = gastosVarIzzat.reduce((s, g) => s + g.valor, 0);
  const totalOperacoes = totalOpFixo + totalOpVar;

  const totalGeral = totalFolha + totalFerramentas + totalOperacoes;

  const pctTime = totalGeral > 0 ? (totalFolha / totalGeral) * 100 : 0;
  const pctFerr = totalGeral > 0 ? (totalFerramentas / totalGeral) * 100 : 0;
  const pctOp = totalGeral > 0 ? (totalOperacoes / totalGeral) * 100 : 0;

  // ── Meses seletor ─────────────────────────────────────────────
  const ultimos12: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    ultimos12.push(d.toISOString().slice(0, 7));
  }

  function iniciarEditGasto(g: GastoOperacional) {
    setEditandoGastoId(g.id);
    setValorEdit(g.valor.toString());
  }
  function salvarEditGasto(id: string) {
    const v = parseFloat(valorEdit.replace(",", "."));
    if (!isNaN(v) && v > 0) editarGastoOp(id, { valor: v });
    setEditandoGastoId(null);
  }
  function iniciarEditFerr(id: string, preco: number) {
    setEditandoFerrId(id);
    setValorEdit(preco.toString());
  }
  function salvarEditFerr(id: string) {
    const v = parseFloat(valorEdit.replace(",", "."));
    if (!isNaN(v) && v > 0) editarFerramenta(id, { preco: v });
    setEditandoFerrId(null);
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="font-extrabold text-white flex items-center gap-2.5" style={{ fontSize: 26, letterSpacing: "-0.3px" }}>
            <Wallet size={22} style={{ color: "#c9a84c" }} />
            Custo Total — Grupo Izzat
          </h1>
          <p className="text-xs mt-1.5" style={{ color: "#9aa7ba" }}>
            Folha salarial + ferramentas do time + custos operacionais das lojas Izzat
          </p>
        </div>
        <select
          className="px-3 py-2 rounded-xl text-sm text-white outline-none flex-shrink-0"
          style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
        >
          {ultimos12.map((m) => (
            <option key={m} value={m}>{mesLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* Hero — total */}
      <div className="rounded-2xl p-5 sm:p-8 text-center gradient-hero-gold" style={{ background: "#112239", border: "1px solid #c9a84c25" }} data-tip="Quanto custa manter o grupo Izzat por mês. Fórmula: Folha Salarial + Ferramentas do Time + Custos Operacionais das lojas Izzat. Não inclui lojas Partners.">
        <p className="text-section-label mb-3">CUSTO TOTAL MENSAL</p>
        <p className="text-shimmer font-black mb-1" style={{ fontSize: "clamp(2rem, 8vw, 3.25rem)", letterSpacing: "-2px", lineHeight: 1 }}>
          R$ {fmt(totalGeral)}
        </p>
        <p className="text-xs mb-6" style={{ color: "#74859c" }}>{mesLabel(mesSelecionado)}</p>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-6 flex-wrap mb-5">
          <span className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} />
            <span style={{ color: "#9aa7ba" }}>Time</span>
            <span className="font-bold" style={{ color: "#10b981" }}>R$ {fmt(totalFolha + totalFerramentas)}</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: "#10b98115", color: "#10b981" }}>{Math.round(pctTime + pctFerr)}%</span>
          </span>
          <span className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#3b82f6" }} />
            <span style={{ color: "#9aa7ba" }}>Operações</span>
            <span className="font-bold" style={{ color: "#3b82f6" }}>R$ {fmt(totalOperacoes)}</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: "#3b82f615", color: "#3b82f6" }}>{Math.round(pctOp)}%</span>
          </span>
        </div>

        {/* Barra proporcional */}
        <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "#1e3356" }}>
          <div style={{ width: `${pctTime}%`, background: "#10b981" }} />
          <div style={{ width: `${pctFerr}%`, background: "#8b5cf6" }} />
          <div style={{ width: `${pctOp}%`, background: "#3b82f6" }} />
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#10b981" }} /> Salários</span>
          <span className="text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#8b5cf6" }} /> Ferramentas time</span>
          <span className="text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#3b82f6" }} /> Operações lojas</span>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Folha Salarial", valor: totalFolha, sub: `${colaboradores.filter(c => c.salario).length}/${colaboradores.length} cadastrados`, cor: "#10b981", icon: Users, dica: "Soma dos salários cadastrados de todo o time" },
          { label: "Ferramentas Time", valor: totalFerramentas, sub: `${ferramentas.length} ferramentas`, cor: "#8b5cf6", icon: Wrench, dica: "Custo mensal das ferramentas e assinaturas do time" },
          { label: "Custos Op. Izzat", valor: totalOperacoes, sub: `${gastosIzzat.length} lançamentos`, cor: "#3b82f6", icon: Building2, dica: "Custos operacionais das lojas do grupo Izzat (não inclui Partners)" },
        ].map((card) => (
          <div key={card.label} data-tip={card.dica} className="rounded-2xl p-3 sm:p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={13} style={{ color: card.cor }} />
              <p className="text-xs" style={{ color: "#9aa7ba" }}>{card.label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color: card.valor > 0 ? card.cor : "#334155" }}>
              R$ {fmt(card.valor)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── SEÇÃO TIME ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <button
          onClick={() => setSecaoAberta((v) => v === "time" ? null : "time")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#10b98118" }}>
              <Users size={15} style={{ color: "#10b981" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Time — Folha Salarial</p>
              <p className="text-xs" style={{ color: "#9aa7ba" }}>{colaboradores.length} colaboradores · {semSalario > 0 ? `${semSalario} sem salário cadastrado` : "todos cadastrados"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-lg font-bold" style={{ color: "#10b981" }}>R$ {fmt(totalFolha)}</p>
            {secaoAberta === "time" ? <ChevronUp size={16} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={16} style={{ color: "#9aa7ba" }} />}
          </div>
        </button>

        {secaoAberta === "time" && (
          <div style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>
            <div className="px-5 py-3 space-y-1.5">
              {colaboradores.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#0a1a2e", border: "1px solid rgba(201,164,66,.16)" }}>
                  <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-tight">{c.nome}</p>
                    <p className="text-xs" style={{ color: "#74859c" }}>{c.cargo || "Sem cargo"}</p>
                  </div>
                  {c.salario ? (
                    <span className="text-sm font-bold" style={{ color: "#10b981" }}>R$ {fmt(c.salario)}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#ef4444" }}>
                      <AlertCircle size={11} /> Sem salário
                    </span>
                  )}
                  <Link href={`/equipe/${c.id}`} className="p-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: "#74859c" }} data-tip="Editar no perfil">
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-2.5" style={{ borderTop: "1px solid rgba(201,164,66,.16)", background: "#0a1a2e" }}>
              <Link href="/gastos" className="text-xs flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: "#c9a84c" }}>
                <ExternalLink size={11} /> Gerenciar em Gastos Equipe
              </Link>
              <span className="text-xs font-bold" style={{ color: "#10b981" }}>Total: R$ {fmt(totalFolha)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── SEÇÃO FERRAMENTAS ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <button
          onClick={() => setSecaoAberta((v) => v === "ferramentas" ? null : "ferramentas")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#8b5cf618" }}>
              <Wrench size={15} style={{ color: "#8b5cf6" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Ferramentas do Time</p>
              <p className="text-xs" style={{ color: "#9aa7ba" }}>{ferramentas.length} ferramentas cadastradas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-lg font-bold" style={{ color: "#8b5cf6" }}>R$ {fmt(totalFerramentas)}</p>
            {secaoAberta === "ferramentas" ? <ChevronUp size={16} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={16} style={{ color: "#9aa7ba" }} />}
          </div>
        </button>

        {secaoAberta === "ferramentas" && (
          <div style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>
            <div className="px-5 py-3 space-y-1.5">
              {ferramentas.length === 0 && (
                <p className="text-xs py-2" style={{ color: "#334155" }}>Nenhuma ferramenta cadastrada.</p>
              )}
              {ferramentas.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "#0a1a2e", border: "1px solid rgba(201,164,66,.16)" }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.cor || "#8b5cf6" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{f.nome}</p>
                    <p className="text-xs" style={{ color: "#74859c" }}>
                      {f.tipo === "individual" ? "Individual" : "Compartilhada"} · {f.colaboradoresIds.length} {f.colaboradoresIds.length === 1 ? "pessoa" : "pessoas"}
                    </p>
                  </div>
                  {editandoFerrId === f.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        className="w-24 px-2 py-1 rounded-lg text-xs text-white outline-none"
                        style={{ background: "#112239", border: "1px solid #8b5cf660" }}
                        value={valorEdit}
                        onChange={(e) => setValorEdit(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") salvarEditFerr(f.id); if (e.key === "Escape") setEditandoFerrId(null); }}
                      />
                      <button onClick={() => salvarEditFerr(f.id)} className="p-1 rounded" style={{ color: "#10b981" }}><Check size={12} /></button>
                      <button onClick={() => setEditandoFerrId(null)} className="p-1 rounded" style={{ color: "#9aa7ba" }}><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "#8b5cf6" }}>R$ {fmt(f.preco)}</span>
                      <button onClick={() => iniciarEditFerr(f.id, f.preco)} className="p-1 rounded hover:bg-white/10" style={{ color: "#74859c" }}>
                        <Pencil size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-5 py-2.5" style={{ borderTop: "1px solid rgba(201,164,66,.16)", background: "#0a1a2e" }}>
              <Link href="/gastos" className="text-xs flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: "#c9a84c" }}>
                <ExternalLink size={11} /> Gerenciar em Gastos Equipe
              </Link>
              <span className="text-xs font-bold" style={{ color: "#8b5cf6" }}>Total: R$ {fmt(totalFerramentas)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── SEÇÃO OPERAÇÕES IZZAT ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <button
          onClick={() => setSecaoAberta((v) => v === "operacoes" ? null : "operacoes")}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#3b82f618" }}>
              <Building2 size={15} style={{ color: "#3b82f6" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Operações — Lojas Izzat</p>
              <p className="text-xs" style={{ color: "#9aa7ba" }}>
                {lojasIzzatTodas.length} lojas · fixo R$ {fmt(totalOpFixo)} + variável {mesLabel(mesSelecionado)} R$ {fmt(totalOpVar)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-lg font-bold" style={{ color: "#3b82f6" }}>R$ {fmt(totalOperacoes)}</p>
            {secaoAberta === "operacoes" ? <ChevronUp size={16} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={16} style={{ color: "#9aa7ba" }} />}
          </div>
        </button>

        {secaoAberta === "operacoes" && (
          <div style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>
            <div className="px-5 py-3 space-y-2">
              {lojasIzzatTodas.map((loja) => {
                const gastosLoja = gastosOperacionais.filter((g) => g.lojaId === loja.id && g.ativo);
                const fixosLoja = gastosLoja.filter((g) => g.tipo === "fixo");
                const varLoja = gastosLoja.filter((g) => g.tipo === "variavel" && g.mes === mesSelecionado);
                const totalLoja = fixosLoja.reduce((s, g) => s + g.valor, 0) + varLoja.reduce((s, g) => s + g.valor, 0);
                const expandida = lojaExpandida === loja.id;

                return (
                  <div key={loja.id} className="rounded-xl overflow-hidden" style={{ background: "#0a1a2e", border: "1px solid rgba(201,164,66,.16)" }}>
                    <button
                      onClick={() => setLojaExpandida(expandida ? null : loja.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-all"
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: loja.cor || "#64748b" }} />
                      <span className="text-sm font-semibold text-white flex-1 text-left">{loja.nome}</span>
                      <span className="text-xs" style={{ color: "#74859c" }}>
                        {gastosLoja.length === 0 ? "sem custos" : `${gastosLoja.length} lançamentos`}
                      </span>
                      <span className="text-sm font-bold ml-2" style={{ color: totalLoja > 0 ? "#3b82f6" : "#334155" }}>
                        R$ {fmt(totalLoja)}
                      </span>
                      {expandida ? <ChevronUp size={12} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={12} style={{ color: "#9aa7ba" }} />}
                    </button>

                    {expandida && (
                      <div className="px-3 pb-3 pt-1 space-y-1.5" style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>
                        {gastosLoja.length === 0 && (
                          <p className="text-xs py-2 text-center" style={{ color: "#334155" }}>
                            Nenhum custo cadastrado.{" "}
                            <Link href={`/lojas/${loja.id}`} className="hover:underline" style={{ color: "#c9a84c" }}>
                              Adicionar na página da loja →
                            </Link>
                          </p>
                        )}
                        {[...fixosLoja, ...varLoja].map((g) => (
                          <div key={g.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: "#112239" }}>
                            <span className="text-xs px-1.5 py-0 rounded-full font-bold flex-shrink-0" style={{
                              background: g.tipo === "fixo" ? "#10b98118" : "#f59e0b18",
                              color: g.tipo === "fixo" ? "#10b981" : "#f59e0b",
                            }}>
                              {g.tipo === "fixo" ? "F" : "V"}
                            </span>
                            <span className="text-xs text-white flex-1">{g.nome}</span>
                            <span className="text-xs px-1.5 rounded-full" style={{ background: "#1e3356", color: "#9aa7ba" }}>
                              {CATEGORIA_GASTO_LABEL[g.categoria as CategoriaGastoOp]}
                            </span>
                            {editandoGastoId === g.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  autoFocus
                                  className="w-20 px-2 py-0.5 rounded-lg text-xs text-white outline-none"
                                  style={{ background: "#0b1624", border: "1px solid #3b82f660" }}
                                  value={valorEdit}
                                  onChange={(e) => setValorEdit(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") salvarEditGasto(g.id); if (e.key === "Escape") setEditandoGastoId(null); }}
                                />
                                <button onClick={() => salvarEditGasto(g.id)} className="p-0.5 rounded" style={{ color: "#10b981" }}><Check size={11} /></button>
                                <button onClick={() => setEditandoGastoId(null)} className="p-0.5 rounded" style={{ color: "#9aa7ba" }}><X size={11} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold" style={{ color: g.tipo === "fixo" ? "#10b981" : "#f59e0b" }}>
                                  R$ {fmt(g.valor)}
                                </span>
                                <button onClick={() => iniciarEditGasto(g)} className="p-0.5 rounded hover:bg-white/10" style={{ color: "#74859c" }}>
                                  <Pencil size={10} />
                                </button>
                                <button onClick={() => toggleGastoOp(g.id)} className="p-0.5 rounded hover:bg-white/10" style={{ color: "#74859c" }} data-tip="Desativar">
                                  <X size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex justify-end pt-1">
                          <Link
                            href={`/lojas/${loja.id}`}
                            className="text-xs flex items-center gap-1 hover:opacity-80"
                            style={{ color: "#c9a84c" }}
                          >
                            <ExternalLink size={10} /> Gerenciar custos desta loja
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-5 py-2.5" style={{ borderTop: "1px solid rgba(201,164,66,.16)", background: "#0a1a2e" }}>
              <Link href="/gastos-operacoes" className="text-xs flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: "#c9a84c" }}>
                <ExternalLink size={11} /> Ver em Custos Operacionais
              </Link>
              <span className="text-xs font-bold" style={{ color: "#3b82f6" }}>Total: R$ {fmt(totalOperacoes)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer contexto */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#0a1a2e", border: "1px solid rgba(201,164,66,.16)" }}>
        <TrendingDown size={13} style={{ color: "#74859c" }} />
        <p className="text-xs" style={{ color: "#74859c" }}>
          Partners não entram neste total — os custos operacionais deles são pagos pelos próprios parceiros.
          Ver em{" "}
          <Link href="/gastos-operacoes" className="hover:underline" style={{ color: "#3b82f6" }}>
            Custos Operacionais → aba Partners
          </Link>.
        </p>
      </div>
    </div>
  );
}
