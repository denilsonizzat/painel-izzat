"use client";
import { useAppStore } from "@/lib/store";
import { LOJAS, CATEGORIA_GASTO_LABEL, CategoriaGastoOp, GastoOperacional, TipoCusto } from "@/lib/data";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Receipt, ChevronDown, ChevronUp, Plus, X, Check, Pencil,
  Building2, Users2, ArrowLeft,
} from "lucide-react";

type GrupoTab = "izzat" | "partner";

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function mesLabel(mes: string) {
  const [y, m] = mes.split("-");
  return `${MESES_PT[parseInt(m) - 1]} ${y}`;
}

export default function GastosOperacoesPage() {
  const router = useRouter();
  const {
    usuarioAtual, lojasCustom,
    gastosOperacionais, criarGastoOp, editarGastoOp, deletarGastoOp, toggleGastoOp,
  } = useAppStore();

  const mesAtual = new Date().toISOString().slice(0, 7);
  const [grupoTab, setGrupoTab] = useState<GrupoTab>("izzat");
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const [lojaExpandida, setLojaExpandida] = useState<string | null>(null);
  const [secaoAberta, setSecaoAberta] = useState<Record<string, "fixo" | "variavel" | null>>({});
  const [adicionandoCusto, setAdicionandoCusto] = useState<{ lojaId: string; tipo: TipoCusto } | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [custoForm, setCustoForm] = useState({
    nome: "", categoria: "outro" as CategoriaGastoOp,
    valor: "", moeda: "BRL" as "BRL" | "USD", descricao: "",
  });

  if (!usuarioAtual) return null;

  const todasLojas = [...LOJAS, ...lojasCustom];
  const lojasGrupo = todasLojas.filter((l) => l.grupo === "izzat");
  const lojasPartner = todasLojas.filter((l) => l.grupo === "partner");
  const lojasFiltradas = grupoTab === "izzat" ? lojasGrupo : lojasPartner;

  function gastosDeLojaFixos(lojaId: string) {
    return gastosOperacionais.filter((g) => g.lojaId === lojaId && g.tipo === "fixo" && g.ativo);
  }
  function gastosDeLojaVariaveis(lojaId: string) {
    return gastosOperacionais.filter((g) => g.lojaId === lojaId && g.tipo === "variavel" && g.mes === mesSelecionado && g.ativo);
  }
  function totalFixoLoja(lojaId: string) {
    return gastosDeLojaFixos(lojaId).reduce((s, g) => s + g.valor, 0);
  }
  function totalVariavelLoja(lojaId: string) {
    return gastosDeLojaVariaveis(lojaId).reduce((s, g) => s + g.valor, 0);
  }

  const totalFixoGrupo = lojasFiltradas.reduce((s, l) => s + totalFixoLoja(l.id), 0);
  const totalVariavelGrupo = lojasFiltradas.reduce((s, l) => s + totalVariavelLoja(l.id), 0);

  const totalFixoGeral = todasLojas.reduce((s, l) => s + totalFixoLoja(l.id), 0);
  const totalVariavelGeral = todasLojas.reduce((s, l) => s + totalVariavelLoja(l.id), 0);

  function toggleSecao(lojaId: string, tipo: "fixo" | "variavel") {
    setSecaoAberta((prev) => ({
      ...prev,
      [lojaId]: prev[lojaId] === tipo ? null : tipo,
    }));
  }

  function iniciarAdicao(lojaId: string, tipo: TipoCusto) {
    setAdicionandoCusto({ lojaId, tipo });
    setEditandoId(null);
    setCustoForm({ nome: "", categoria: tipo === "fixo" ? "ia_tools" : "trafego_pago", valor: "", moeda: "BRL", descricao: "" });
    setLojaExpandida(lojaId);
    setSecaoAberta((prev) => ({ ...prev, [lojaId]: tipo }));
  }

  function iniciarEdicao(g: GastoOperacional) {
    setEditandoId(g.id);
    setCustoForm({ nome: g.nome, categoria: g.categoria, valor: g.valor.toString(), moeda: g.moeda, descricao: g.descricao ?? "" });
    setAdicionandoCusto({ lojaId: g.lojaId, tipo: g.tipo });
    setLojaExpandida(g.lojaId);
    setSecaoAberta((prev) => ({ ...prev, [g.lojaId]: g.tipo }));
  }

  function salvarCusto(lojaId: string, tipo: TipoCusto) {
    const valor = parseFloat(custoForm.valor.replace(",", "."));
    if (!custoForm.nome.trim() || isNaN(valor) || valor <= 0) return;
    const base = {
      lojaId,
      nome: custoForm.nome.trim(),
      tipo,
      categoria: custoForm.categoria,
      valor,
      moeda: custoForm.moeda,
      ativo: true,
      descricao: custoForm.descricao.trim() || undefined,
      mes: tipo === "variavel" ? mesSelecionado : undefined,
    };
    if (editandoId) {
      editarGastoOp(editandoId, base);
      setEditandoId(null);
    } else {
      criarGastoOp(base);
    }
    setCustoForm({ nome: "", categoria: "outro", valor: "", moeda: "BRL", descricao: "" });
    setAdicionandoCusto(null);
  }

  function cancelarForm() {
    setAdicionandoCusto(null);
    setEditandoId(null);
    setCustoForm({ nome: "", categoria: "outro", valor: "", moeda: "BRL", descricao: "" });
  }

  // Gera últimos 12 meses para o seletor
  const ultimos12Meses: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    ultimos12Meses.push(d.toISOString().slice(0, 7));
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <Link href="/lojas" className="inline-flex items-center gap-1.5 text-xs mb-3 hover:opacity-80 transition-opacity" style={{ color: "#9aa7ba" }}>
          <ArrowLeft size={12} /> Lojas
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-white flex items-center gap-2.5" style={{ fontSize: 26, letterSpacing: "-0.3px" }}>
              <Receipt size={22} style={{ color: "#36C98E" }} />
              Gastos Operacionais
            </h1>
            <p className="text-xs mt-1.5" style={{ color: "#9aa7ba" }}>
              Custos fixos e variáveis por loja — separado por grupo Izzat e parceiros
            </p>
          </div>

          {/* Seletor de mês */}
          <select
            className="px-3 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
          >
            {ultimos12Meses.map((m) => (
              <option key={m} value={m}>{mesLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards resumo geral */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Fixo Izzat/mês", valor: lojasGrupo.reduce((s, l) => s + totalFixoLoja(l.id), 0), cor: "#c9a84c", dica: "Soma dos custos fixos mensais das lojas do grupo Izzat (pagos pela empresa)" },
          { label: "Variável Izzat", valor: lojasGrupo.reduce((s, l) => s + totalVariavelLoja(l.id), 0), cor: "#E8A33D", dica: "Custos variáveis das lojas do grupo Izzat (ex: ads, que mudam mês a mês)" },
          { label: "Fixo Partners/mês", valor: lojasPartner.reduce((s, l) => s + totalFixoLoja(l.id), 0), cor: "#4D9DE0", dica: "Custos fixos mensais das lojas parceiras (pagos pelo parceiro, não pela Izzat)" },
          { label: "Variável Partners", valor: lojasPartner.reduce((s, l) => s + totalVariavelLoja(l.id), 0), cor: "#7C6FE0", dica: "Custos variáveis das lojas parceiras (pagos pelo parceiro)" },
        ].map((card) => (
          <div
            key={card.label}
            data-tip={card.dica}
            className="rounded-2xl p-4"
            style={{
              background: "#112239",
              border: `1px solid ${card.valor > 0 ? card.cor + "30" : "#1e3356"}`,
              transition: "all 150ms cubic-bezier(0.4,0,0.2,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${card.cor}18`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
            }}
          >
            <p className="text-section-label mb-2">{card.label}</p>
            <p className="font-extrabold" style={{ fontSize: 22, letterSpacing: "-0.5px", color: card.valor > 0 ? card.cor : "#334155" }}>
              R$ {card.valor.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs Grupo */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        {([
          { v: "izzat" as GrupoTab, label: "Grupo Izzat", icon: Building2, cor: "#c9a84c", dica: "Lojas próprias da Izzat. Estes custos são pagos pela empresa." },
          { v: "partner" as GrupoTab, label: "Partners", icon: Users2, cor: "#4D9DE0", dica: "Lojas de parceiros. Os custos são pagos pelo parceiro — registramos para acompanhar o investimento dele." },
        ]).map((tab) => (
          <button
            key={tab.v}
            onClick={() => setGrupoTab(tab.v)}
            data-tip={tab.dica}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: grupoTab === tab.v ? tab.cor + "22" : "transparent",
              color: grupoTab === tab.v ? tab.cor : "#64748b",
              border: grupoTab === tab.v ? `1px solid ${tab.cor}50` : "1px solid transparent",
            }}
          >
            <tab.icon size={14} /> {tab.label}
            <span className="text-xs px-1.5 rounded-full" style={{ background: grupoTab === tab.v ? tab.cor + "30" : "#1e3356", color: grupoTab === tab.v ? tab.cor : "#475569" }}>
              {(grupoTab === tab.v ? lojasFiltradas : (tab.v === "izzat" ? lojasGrupo : lojasPartner)).length}
            </span>
          </button>
        ))}
      </div>

      {/* Banner contextual por grupo */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{
        background: grupoTab === "izzat" ? "#c9a84c12" : "#4D9DE012",
        border: `1px solid ${grupoTab === "izzat" ? "#c9a84c30" : "#4D9DE030"}`,
      }}>
        {grupoTab === "izzat" ? (
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            <span className="font-bold" style={{ color: "#c9a84c" }}>Custo da empresa Izzat.</span>{" "}
            Esses gastos saem do caixa próprio do grupo.
          </p>
        ) : (
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            <span className="font-bold" style={{ color: "#4D9DE0" }}>Custo do parceiro</span> — não da Izzat.{" "}
            Cada parceiro investiu $50k USD pela gestão e arca com ads, IA tools e plataforma.
            Registre aqui para acompanhar o investimento deles rumo ao retorno em 18 meses.
          </p>
        )}
        {(totalFixoGrupo > 0 || totalVariavelGrupo > 0) && (
          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            {totalFixoGrupo > 0 && <span className="text-xs" style={{ color: "#9aa7ba" }}>Fixo: <span className="font-bold" style={{ color: "#36C98E" }}>R$ {totalFixoGrupo.toFixed(2)}</span></span>}
            {totalVariavelGrupo > 0 && <span className="text-xs" style={{ color: "#9aa7ba" }}>Var: <span className="font-bold" style={{ color: "#E8A33D" }}>R$ {totalVariavelGrupo.toFixed(2)}</span></span>}
            <span className="text-xs font-bold text-white">= R$ {(totalFixoGrupo + totalVariavelGrupo).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Lista de lojas */}
      <div className="space-y-3">
        {lojasFiltradas.map((loja) => {
          const fixoLoja = totalFixoLoja(loja.id);
          const variLoja = totalVariavelLoja(loja.id);
          const totalLoja = fixoLoja + variLoja;
          const todosGastosLoja = gastosOperacionais.filter((g) => g.lojaId === loja.id);
          const expandida = lojaExpandida === loja.id;

          return (
            <div key={loja.id} className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
              {/* Header da loja */}
              <button
                onClick={() => setLojaExpandida(expandida ? null : loja.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: loja.cor || "#64748b" }} />
                <span className="text-sm font-bold text-white flex-1">{loja.nome}</span>

                <div className="flex items-center gap-3">
                  {fixoLoja > 0 && (
                    <span className="text-xs" style={{ color: "#9aa7ba" }}>
                      Fixo: <span style={{ color: "#36C98E" }}>R$ {fixoLoja.toFixed(2)}</span>
                    </span>
                  )}
                  {variLoja > 0 && (
                    <span className="text-xs" style={{ color: "#9aa7ba" }}>
                      Var: <span style={{ color: "#E8A33D" }}>R$ {variLoja.toFixed(2)}</span>
                    </span>
                  )}
                  {totalLoja > 0 && (
                    <span className="text-xs font-bold text-white">
                      = R$ {totalLoja.toFixed(2)}
                    </span>
                  )}
                  {todosGastosLoja.length === 0 && (
                    <span className="text-xs" style={{ color: "#334155" }}>Sem custos cadastrados</span>
                  )}
                  {expandida ? <ChevronUp size={14} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={14} style={{ color: "#9aa7ba" }} />}
                </div>
              </button>

              {/* Detalhes expandidos */}
              {expandida && (
                <div style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>

                  {/* Seção Fixos */}
                  <div style={{ borderBottom: "1px solid #0a1a2e" }}>
                    <button
                      onClick={() => toggleSecao(loja.id, "fixo")}
                      className="w-full flex items-center justify-between px-5 py-2 hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: "#36C98E" }}>FIXOS</span>
                        <span className="text-xs px-1.5 rounded-full" style={{ background: "#36C98E15", color: "#36C98E" }}>
                          {todosGastosLoja.filter((g) => g.tipo === "fixo").length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fixoLoja > 0 && <span className="text-xs font-bold" style={{ color: "#36C98E" }}>R$ {fixoLoja.toFixed(2)}/mês</span>}
                        {secaoAberta[loja.id] === "fixo" ? <ChevronUp size={12} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={12} style={{ color: "#9aa7ba" }} />}
                      </div>
                    </button>

                    {secaoAberta[loja.id] === "fixo" && (
                      <div className="px-5 pb-3 space-y-1.5">
                        {todosGastosLoja.filter((g) => g.tipo === "fixo").map((g) => (
                          <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#0a1a2e", border: "1px solid rgba(201,164,66,.16)" }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold" style={{ color: g.ativo ? "#fff" : "#475569", textDecoration: g.ativo ? "none" : "line-through" }}>{g.nome}</span>
                                <span className="text-xs px-1.5 rounded-full" style={{ background: "#112239", color: "#9aa7ba" }}>
                                  {CATEGORIA_GASTO_LABEL[g.categoria]}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold" style={{ color: g.ativo ? "#36C98E" : "#475569" }}>
                              {g.moeda} {g.valor.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1">
                              {confirmDeleteId === g.id ? (
                                <>
                                  <span className="text-xs" style={{ color: "#F2545B" }}>Apagar?</span>
                                  <button onClick={() => { deletarGastoOp(g.id); setConfirmDeleteId(null); }} className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "#F2545B30", color: "#F2545B" }}>Sim</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1e3356", color: "#9aa7ba" }}>Não</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => iniciarEdicao(g)} className="p-1 rounded hover:bg-white/10" style={{ color: "#9aa7ba" }}>
                                    <Pencil size={10} />
                                  </button>
                                  <button onClick={() => toggleGastoOp(g.id)} className="p-1 rounded hover:bg-white/10" style={{ color: g.ativo ? "#64748b" : "#36C98E" }}>
                                    <Check size={10} />
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(g.id)} className="p-1 rounded hover:bg-white/10" style={{ color: "#F2545B" }}>
                                    <X size={10} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {todosGastosLoja.filter((g) => g.tipo === "fixo").length === 0 && (
                          <p className="text-xs py-1" style={{ color: "#334155" }}>Nenhum custo fixo ainda.</p>
                        )}

                        {adicionandoCusto?.lojaId === loja.id && adicionandoCusto.tipo === "fixo" ? (
                          <div className="rounded-xl p-3 space-y-2" style={{ background: "#0a1a2e", border: "1px solid #36C98E40" }}>
                            <div className="flex gap-2">
                              <input
                                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                                placeholder="Nome (ex: Claude AI)"
                                value={custoForm.nome}
                                onChange={(e) => setCustoForm((f) => ({ ...f, nome: e.target.value }))}
                              />
                              <input
                                className="w-20 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                                placeholder="Valor"
                                value={custoForm.valor}
                                onChange={(e) => setCustoForm((f) => ({ ...f, valor: e.target.value }))}
                              />
                              <select
                                className="px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                                value={custoForm.moeda}
                                onChange={(e) => setCustoForm((f) => ({ ...f, moeda: e.target.value as "BRL" | "USD" }))}
                              >
                                <option value="BRL">BRL</option>
                                <option value="USD">USD</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <select
                                className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                                value={custoForm.categoria}
                                onChange={(e) => setCustoForm((f) => ({ ...f, categoria: e.target.value as CategoriaGastoOp }))}
                              >
                                {(Object.entries(CATEGORIA_GASTO_LABEL) as [CategoriaGastoOp, string][]).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                              <button onClick={() => salvarCusto(loja.id, "fixo")} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "#36C98E", color: "#fff" }}>
                                {editandoId ? "Salvar" : "Adicionar"}
                              </button>
                              <button onClick={cancelarForm} className="px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1e3356", color: "#9aa7ba" }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => iniciarAdicao(loja.id, "fixo")}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-80"
                            style={{ color: "#36C98E", background: "#36C98E10", border: "1px dashed #36C98E40" }}
                          >
                            <Plus size={11} /> Adicionar custo fixo
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Seção Variáveis */}
                  <div>
                    <button
                      onClick={() => toggleSecao(loja.id, "variavel")}
                      className="w-full flex items-center justify-between px-5 py-2 hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: "#E8A33D" }}>VARIÁVEIS</span>
                        <span className="text-xs px-1.5 rounded-full" style={{ background: "#E8A33D15", color: "#E8A33D" }}>
                          {todosGastosLoja.filter((g) => g.tipo === "variavel" && g.mes === mesSelecionado).length}
                        </span>
                        <span className="text-xs" style={{ color: "#74859c" }}>{mesLabel(mesSelecionado)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {variLoja > 0 && <span className="text-xs font-bold" style={{ color: "#E8A33D" }}>R$ {variLoja.toFixed(2)}</span>}
                        {secaoAberta[loja.id] === "variavel" ? <ChevronUp size={12} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={12} style={{ color: "#9aa7ba" }} />}
                      </div>
                    </button>

                    {secaoAberta[loja.id] === "variavel" && (
                      <div className="px-5 pb-3 space-y-1.5">
                        {todosGastosLoja.filter((g) => g.tipo === "variavel" && g.mes === mesSelecionado).map((g) => (
                          <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#0a1a2e", border: "1px solid rgba(201,164,66,.16)" }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white">{g.nome}</span>
                                <span className="text-xs px-1.5 rounded-full" style={{ background: "#112239", color: "#9aa7ba" }}>
                                  {CATEGORIA_GASTO_LABEL[g.categoria]}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold" style={{ color: "#E8A33D" }}>
                              {g.moeda} {g.valor.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1">
                              {confirmDeleteId === g.id ? (
                                <>
                                  <span className="text-xs" style={{ color: "#F2545B" }}>Apagar?</span>
                                  <button onClick={() => { deletarGastoOp(g.id); setConfirmDeleteId(null); }} className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "#F2545B30", color: "#F2545B" }}>Sim</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1e3356", color: "#9aa7ba" }}>Não</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => iniciarEdicao(g)} className="p-1 rounded hover:bg-white/10" style={{ color: "#9aa7ba" }}>
                                    <Pencil size={10} />
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(g.id)} className="p-1 rounded hover:bg-white/10" style={{ color: "#F2545B" }}>
                                    <X size={10} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {todosGastosLoja.filter((g) => g.tipo === "variavel" && g.mes === mesSelecionado).length === 0 && (
                          <p className="text-xs py-1" style={{ color: "#334155" }}>Nenhum gasto variável em {mesLabel(mesSelecionado)}.</p>
                        )}

                        {adicionandoCusto?.lojaId === loja.id && adicionandoCusto.tipo === "variavel" ? (
                          <div className="rounded-xl p-3 space-y-2" style={{ background: "#0a1a2e", border: "1px solid #E8A33D40" }}>
                            <div className="flex gap-2">
                              <input
                                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                                placeholder="Nome (ex: Meta Ads)"
                                value={custoForm.nome}
                                onChange={(e) => setCustoForm((f) => ({ ...f, nome: e.target.value }))}
                              />
                              <input
                                className="w-20 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                                placeholder="Valor"
                                value={custoForm.valor}
                                onChange={(e) => setCustoForm((f) => ({ ...f, valor: e.target.value }))}
                              />
                              <select
                                className="px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                                value={custoForm.moeda}
                                onChange={(e) => setCustoForm((f) => ({ ...f, moeda: e.target.value as "BRL" | "USD" }))}
                              >
                                <option value="BRL">BRL</option>
                                <option value="USD">USD</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <select
                                className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                                value={custoForm.categoria}
                                onChange={(e) => setCustoForm((f) => ({ ...f, categoria: e.target.value as CategoriaGastoOp }))}
                              >
                                {(Object.entries(CATEGORIA_GASTO_LABEL) as [CategoriaGastoOp, string][]).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                              <button onClick={() => salvarCusto(loja.id, "variavel")} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "#E8A33D", color: "#000" }}>
                                {editandoId ? "Salvar" : "Adicionar"}
                              </button>
                              <button onClick={cancelarForm} className="px-2 py-1.5 rounded-lg text-xs" style={{ background: "#1e3356", color: "#9aa7ba" }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => iniciarAdicao(loja.id, "variavel")}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-80"
                            style={{ color: "#E8A33D", background: "#E8A33D10", border: "1px dashed #E8A33D40" }}
                          >
                            <Plus size={11} /> Adicionar gasto variável
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
