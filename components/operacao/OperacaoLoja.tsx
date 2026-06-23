"use client";
import { useState, useEffect, useCallback } from "react";
import {
  listarPedidos, criarPedido, editarPedido, deletarPedido,
  listarAds, criarAds, deletarAds,
  obterConfig, salvarConfig, calcularKpis,
  serieDiaria, serieSemanal, serieFornecedor,
  obterMeta, salvarMeta, listarAnoResumo,
  serieProduto, gerarAlertas, precoIdeal,
  preverFechamento, simularAds, calcularLtv, gerarCSV,
  serieCanal, fluxoCaixa,
  OpPedido, OpAds, OpConfig, KpisOperacao, OpMeta, MesResumo, Alerta, Ltv, CanalSerie, FluxoCaixa,
} from "@/lib/operacao";
import { supabaseConfigurado } from "@/lib/supabase";
import { Plus, Trash2, Pencil, X, TrendingUp, ListOrdered, Megaphone, Settings, DollarSign, BarChart3, Target, CalendarRange, Download, Share2, Wallet } from "lucide-react";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const FORNECEDORES = ["AliExpress", "Wiio", "DV", "3Cliques"];
const PLATAFORMAS = ["Meta", "Google", "TikTok", "Outro"];
const CANAIS = ["Meta", "TikTok", "Google", "Organico", "Direto", "Email", "Outro"];
const fmt$ = (n: number) => "$" + (n || 0).toFixed(2);
const fmtPct = (n: number) => (n || 0).toFixed(1) + "%";
const hoje = () => new Date().toISOString().slice(0, 10);

type SubAba = "kpis" | "graficos" | "canais" | "caixa" | "metas" | "anual" | "pedidos" | "ads" | "config";

export default function OperacaoLoja({ lojaId, lojaNome }: { lojaId: string; lojaNome: string }) {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano] = useState(agora.getFullYear());
  const [sub, setSub] = useState<SubAba>("kpis");
  const [pedidos, setPedidos] = useState<OpPedido[]>([]);
  const [ads, setAds] = useState<OpAds[]>([]);
  const [cfg, setCfg] = useState<OpConfig | null>(null);
  const [kpis, setKpis] = useState<KpisOperacao | null>(null);
  const [meta, setMeta] = useState<OpMeta | null>(null);
  const [anual, setAnual] = useState<MesResumo[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try {
      const [ps, as, cf, mt] = await Promise.all([
        listarPedidos(lojaId, mes, ano),
        listarAds(lojaId, mes, ano),
        obterConfig(lojaId),
        obterMeta(lojaId, mes, ano).catch(() => null),
      ]);
      setPedidos(ps); setAds(as); setCfg(cf); setMeta(mt);
      setKpis(calcularKpis(ps, as, cf));
    } catch (e) {
      setErro(String((e as { message?: string })?.message || e));
    } finally {
      setCarregando(false);
    }
  }, [lojaId, mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);
  // Anual: carrega só quando abre a aba (1x por loja/ano)
  useEffect(() => {
    if (sub === "anual" && !anual) {
      listarAnoResumo(lojaId, ano).then(setAnual).catch((e) => setErro(String(e?.message || e)));
    }
  }, [sub, anual, lojaId, ano]);
  // Reset anual ao trocar de loja
  useEffect(() => { setAnual(null); }, [lojaId]);

  if (!supabaseConfigurado()) {
    return <div className="rounded-2xl p-6 text-center" style={{ background: "#112239", border: "1px solid #ef444440", color: "#ef4444" }}>
      Supabase não configurado (faltam as variáveis de ambiente).
    </div>;
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho: mês + sub-abas */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setMes((m) => m > 1 ? m - 1 : 12)} className="w-8 h-8 rounded-lg" style={{ background: "#1e3356", color: "#94a3b8" }}>‹</button>
          <span className="text-sm font-bold text-white" style={{ minWidth: 90, textAlign: "center" }}>{MESES[mes - 1]} {ano}</span>
          <button onClick={() => setMes((m) => m < 12 ? m + 1 : 1)} className="w-8 h-8 rounded-lg" style={{ background: "#1e3356", color: "#94a3b8" }}>›</button>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "#0f1c30", border: "1px solid rgba(201,164,66,.16)" }}>
        {([
          { id: "kpis" as const, label: "Resumo", icon: TrendingUp },
          { id: "graficos" as const, label: "Gráficos", icon: BarChart3 },
          { id: "canais" as const, label: "Canais", icon: Share2 },
          { id: "caixa" as const, label: "Caixa", icon: Wallet },
          { id: "metas" as const, label: "Metas", icon: Target },
          { id: "anual" as const, label: "Anual", icon: CalendarRange },
          { id: "pedidos" as const, label: `Pedidos${pedidos.length ? ` (${pedidos.length})` : ""}`, icon: ListOrdered },
          { id: "ads" as const, label: "ADS", icon: Megaphone },
          { id: "config" as const, label: "Taxas", icon: Settings },
        ]).map((t) => {
          const Icon = t.icon; const ativo = sub === t.id;
          return (
            <button key={t.id} onClick={() => setSub(t.id)}
              className="flex-shrink-0 sm:flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={{ background: ativo ? "#c9a84c" : "transparent", color: ativo ? "#0b1624" : "#94a3b8" }}>
              <Icon size={14} /> <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {erro && <div className="rounded-xl p-3 text-sm" style={{ background: "#ef444415", color: "#ef4444" }}>Erro: {erro}</div>}
      {carregando && <div className="rounded-2xl p-8 text-center" style={{ background: "#112239", color: "#74859c" }}>Carregando...</div>}

      {!carregando && kpis && cfg && (
        <>
          {sub === "kpis" && <AbaKpis kpis={kpis} cfg={cfg} alertas={gerarAlertas(kpis, pedidos, meta)} />}
          {sub === "graficos" && <AbaGraficos pedidos={pedidos} ads={ads} mes={mes} ano={ano} />}
          {sub === "canais" && <AbaCanais pedidos={pedidos} ads={ads} />}
          {sub === "caixa" && <AbaCaixa pedidos={pedidos} ads={ads} />}
          {sub === "metas" && <AbaMetas kpis={kpis} meta={meta} lojaId={lojaId} mes={mes} ano={ano} onSalvar={carregar} />}
          {sub === "anual" && <AbaAnual anual={anual} ano={ano} lojaId={lojaId} />}
          {sub === "pedidos" && <AbaPedidos lojaId={lojaId} pedidos={pedidos} onMudou={carregar} />}
          {sub === "ads" && <AbaAds lojaId={lojaId} ads={ads} onMudou={carregar} />}
          {sub === "config" && <AbaConfig cfg={cfg} onSalvar={async (c) => { await salvarConfig(c); carregar(); }} />}
        </>
      )}
    </div>
  );
}

// ─── RESUMO (KPIs + P&L) ───────────────────────────────────
const COR_ALERTA = { danger: "#ef4444", warn: "#f59e0b", success: "#10b981", info: "#3b82f6" };
function AbaKpis({ kpis: k, cfg, alertas }: { kpis: KpisOperacao; cfg: OpConfig; alertas: Alerta[] }) {
  const Card = ({ label, valor, cor, sub }: { label: string; valor: string; cor: string; sub?: string }) => (
    <div className="rounded-2xl p-4" style={{ background: "linear-gradient(160deg, #14243f, #111e35)", border: `1px solid ${cor}30` }}>
      <p className="text-xs" style={{ color: "#9aa7ba" }}>{label}</p>
      <p className="font-extrabold mt-1" style={{ fontSize: 22, color: cor, letterSpacing: "-0.5px" }}>{valor}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>{sub}</p>}
    </div>
  );
  return (
    <div className="space-y-4">
      {alertas.length > 0 && (
        <div className="space-y-1.5">
          {alertas.map((al, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ background: COR_ALERTA[al.tipo] + "15", border: `1px solid ${COR_ALERTA[al.tipo]}30`, color: COR_ALERTA[al.tipo] }}>
              <span style={{ fontSize: 15 }}>{al.ico}</span><span>{al.msg}</span>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card label="Faturamento" valor={fmt$(k.faturamento)} cor="#3b82f6" sub={`${k.pedidos} pedidos`} />
        <Card label="Lucro Bruto" valor={fmt$(k.lucroBruto)} cor={k.lucroBruto >= 0 ? "#10b981" : "#ef4444"} sub={`Margem ${fmtPct(k.margem)}`} />
        <Card label="ADS" valor={fmt$(k.ads)} cor="#f59e0b" sub={`ROAS ${k.roas.toFixed(1)}x`} />
        <Card label="Custo (produto+frete)" valor={fmt$(k.custo)} cor="#8b5cf6" />
        <Card label="Ticket Médio" valor={fmt$(k.ticketMedio)} cor="#3b82f6" />
        <Card label="CAC" valor={fmt$(k.cac)} cor="#0ea5e9" sub="custo por pedido" />
      </div>

      {/* P&L real */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(16,185,129,.06), rgba(16,185,129,.02))", border: "1px solid #10b98125" }}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={15} style={{ color: "#10b981" }} />
          <p className="text-sm font-bold text-white">Lucro Real (após taxas)</p>
        </div>
        <p className="font-extrabold mb-1" style={{ fontSize: 32, color: k.lucroReal >= 0 ? "#10b981" : "#ef4444", letterSpacing: "-1px", lineHeight: 1 }}>{fmt$(k.lucroReal)}</p>
        <p className="text-xs mb-3" style={{ color: "#74859c" }}>Margem real: {fmtPct(k.margemReal)} · Meta: {fmtPct(cfg.margem_alvo)}{k.margemReal >= cfg.margem_alvo ? " ✅" : " ⚠️"}</p>
        <div className="space-y-1.5 text-xs" style={{ color: "#9aa7ba" }}>
          <Linha label="Faturamento" valor={fmt$(k.faturamento)} />
          <Linha label={`Custo + Frete`} valor={"-" + fmt$(k.custo)} negativo />
          <Linha label="ADS" valor={"-" + fmt$(k.ads)} negativo />
          <Linha label={`Gateway (${cfg.gateway_fee}%)`} valor={"-" + fmt$(k.gateway)} negativo />
          <Linha label={`Shopify (${cfg.shopify_fee}%)`} valor={"-" + fmt$(k.taxaShopify)} negativo />
          <Linha label={`Imposto (${cfg.imposto}%)`} valor={"-" + fmt$(k.imposto)} negativo />
        </div>
      </div>
    </div>
  );
}
function Linha({ label, valor, negativo }: { label: string; valor: string; negativo?: boolean }) {
  return (
    <div className="flex justify-between py-1" style={{ borderBottom: "1px solid rgba(201,164,66,.20)" }}>
      <span>{label}</span>
      <span style={{ color: negativo ? "#ef4444" : "#e8edf5", fontWeight: 600 }}>{valor}</span>
    </div>
  );
}

// ─── GRÁFICOS ──────────────────────────────────────────────
function AbaGraficos({ pedidos, ads, mes, ano }: { pedidos: OpPedido[]; ads: OpAds[]; mes: number; ano: number }) {
  const dias = serieDiaria(pedidos, ads, mes, ano);
  const semanas = serieSemanal(dias);
  const fornecedores = serieFornecedor(pedidos);
  const produtos = serieProduto(pedidos).filter((p) => p.nome !== "(sem nome)");
  const temDado = pedidos.length > 0 || ads.length > 0;
  const corABC = { A: "#10b981", B: "#3b82f6", C: "#74859c" };
  const prev = preverFechamento(dias, mes, ano);
  const primDiaSemana = new Date(ano, mes - 1, 1).getDay(); // 0=Dom
  const maxLucroDia = Math.max(1, ...dias.filter((d) => d.lucro > 0).map((d) => d.lucro));

  if (!temDado) {
    return <div className="rounded-2xl p-8 text-center" style={{ background: "#112239", color: "#74859c" }}>Sem dados para gráficos neste mês. Adicione pedidos/ADS.</div>;
  }

  const maxDia = Math.max(1, ...dias.map((d) => Math.max(d.faturamento, d.lucro, d.ads)));
  const maxSem = Math.max(1, ...semanas.map((s) => Math.max(s.faturamento, s.lucro)));
  const maxForn = Math.max(1, ...fornecedores.map((f) => f.faturamento));

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#9aa7ba" }}>{title}</p>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Legenda */}
      <div className="flex gap-4 text-xs" style={{ color: "#9aa7ba" }}>
        <span className="flex items-center gap-1.5"><i style={{ width: 10, height: 10, borderRadius: 2, background: "#3b82f6", display: "inline-block" }} /> Faturamento</span>
        <span className="flex items-center gap-1.5"><i style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981", display: "inline-block" }} /> Lucro</span>
        <span className="flex items-center gap-1.5"><i style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b", display: "inline-block" }} /> ADS</span>
      </div>

      {/* Previsão de fechamento */}
      {prev && (
        <Card title="Previsão de fechamento do mês">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded-xl p-3" style={{ background: "#0f1c30" }}>
              <p className="text-xs" style={{ color: "#74859c" }}>Pessimista</p>
              <p className="font-extrabold mt-1" style={{ fontSize: 16, color: "#f59e0b" }}>{fmt$(prev.pessimista)}</p>
            </div>
            <div className="text-center rounded-xl p-3" style={{ background: "#0f1c30", border: "1px solid #3b82f640" }}>
              <p className="text-xs" style={{ color: "#74859c" }}>Realista</p>
              <p className="font-extrabold mt-1" style={{ fontSize: 16, color: "#3b82f6" }}>{fmt$(prev.realista)}</p>
            </div>
            <div className="text-center rounded-xl p-3" style={{ background: "#0f1c30" }}>
              <p className="text-xs" style={{ color: "#74859c" }}>Otimista</p>
              <p className="font-extrabold mt-1" style={{ fontSize: 16, color: "#10b981" }}>{fmt$(prev.otimista)}</p>
            </div>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: "#74859c" }}>Média/dia {fmt$(prev.mediaDia)} · {prev.diasRestantes} dias restantes · atual {fmt$(prev.atual)}</p>
        </Card>
      )}

      {/* Evolução diária */}
      <Card title={`Evolução diária — ${MESES[mes - 1]}`}>
        <div className="flex items-end gap-0.5" style={{ height: 160 }}>
          {dias.map((d) => {
            const temD = d.faturamento > 0 || d.ads > 0;
            return (
              <div key={d.dia} className="flex-1 flex flex-col items-center justify-end gap-px group relative" style={{ height: "100%" }} title={`${d.rotulo}: Fat ${fmt$(d.faturamento)} · Lucro ${fmt$(d.lucro)} · ADS ${fmt$(d.ads)}`}>
                <div className="w-full flex items-end justify-center gap-px" style={{ height: "100%" }}>
                  <div style={{ width: "32%", height: `${(d.faturamento / maxDia) * 100}%`, background: "#3b82f6", borderRadius: "2px 2px 0 0", minHeight: d.faturamento > 0 ? 2 : 0 }} />
                  <div style={{ width: "32%", height: `${(Math.max(d.lucro, 0) / maxDia) * 100}%`, background: d.lucro >= 0 ? "#10b981" : "#ef4444", borderRadius: "2px 2px 0 0", minHeight: d.lucro > 0 ? 2 : 0 }} />
                  <div style={{ width: "32%", height: `${(d.ads / maxDia) * 100}%`, background: "#f59e0b", borderRadius: "2px 2px 0 0", minHeight: d.ads > 0 ? 2 : 0 }} />
                </div>
                {temD && d.dia % 5 === 0 && <span style={{ fontSize: 8, color: "#74859c" }}>{d.dia}</span>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Calendário heatmap */}
      <Card title="Calendário de lucro (heatmap)">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((w, i) => <div key={i} className="text-center" style={{ fontSize: 9, color: "#74859c" }}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primDiaSemana }).map((_, i) => <div key={`e${i}`} />)}
          {dias.map((d) => {
            const temD = d.faturamento > 0 || d.ads > 0;
            let bg = "#0f1c30";
            if (temD) {
              if (d.lucro > maxLucroDia * 0.5) bg = "#10b981";
              else if (d.lucro > 0) bg = "rgba(16,185,129,.35)";
              else bg = "rgba(239,68,68,.3)";
            }
            return (
              <div key={d.dia} title={`${d.rotulo}: lucro ${fmt$(d.lucro)} · ${d.pedidos}p`}
                className="rounded-md flex items-center justify-center" style={{ aspectRatio: "1", background: bg, fontSize: 9, color: temD ? "#fff" : "#475569" }}>
                {d.dia}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-2" style={{ fontSize: 9, color: "#74859c" }}>
          <span className="flex items-center gap-1"><i style={{ width: 9, height: 9, borderRadius: 2, background: "#10b981", display: "inline-block" }} /> lucro alto</span>
          <span className="flex items-center gap-1"><i style={{ width: 9, height: 9, borderRadius: 2, background: "rgba(16,185,129,.35)", display: "inline-block" }} /> lucro</span>
          <span className="flex items-center gap-1"><i style={{ width: 9, height: 9, borderRadius: 2, background: "rgba(239,68,68,.3)", display: "inline-block" }} /> prejuízo</span>
        </div>
      </Card>

      {/* Semanal */}
      <Card title="Resultado por semana">
        <div className="space-y-2.5">
          {semanas.map((s) => (
            <div key={s.semana}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "#9aa7ba" }}>Sem {s.semana} <span style={{ color: "#74859c" }}>({s.periodo}) · {s.pedidos}p</span></span>
                <span style={{ color: s.lucro >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>{fmt$(s.lucro)}</span>
              </div>
              <div style={{ height: 6, background: "#1e3356", borderRadius: 99, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(s.faturamento / maxSem) * 100}%`, background: "#3b82f6", height: "100%" }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Fornecedores */}
      {fornecedores.length > 0 && (
        <Card title="Por fornecedor">
          <div className="space-y-3">
            {fornecedores.map((f) => (
              <div key={f.nome}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white font-semibold">{f.nome} <span style={{ color: "#74859c", fontWeight: 400 }}>· {f.pedidos}p · margem {fmtPct(f.margem)}</span></span>
                  <span style={{ color: "#e8edf5", fontWeight: 700 }}>{fmt$(f.faturamento)}</span>
                </div>
                <div style={{ height: 6, background: "#1e3356", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${(f.faturamento / maxForn) * 100}%`, background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", height: "100%", borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ABC de produtos */}
      {produtos.length > 0 && (
        <Card title="Curva ABC de produtos">
          <div className="flex gap-3 mb-3 text-xs flex-wrap" style={{ color: "#9aa7ba" }}>
            <span><b style={{ color: corABC.A }}>A</b> = 70% do fat. (escalar)</span>
            <span><b style={{ color: corABC.B }}>B</b> = 20% (manter)</span>
            <span><b style={{ color: corABC.C }}>C</b> = 10% (avaliar)</span>
          </div>
          <div className="space-y-2">
            {produtos.slice(0, 12).map((p) => (
              <div key={p.nome} className="flex items-center gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center rounded-md font-extrabold" style={{ width: 22, height: 22, fontSize: 11, background: corABC[p.abc] + "25", color: corABC[p.abc] }}>{p.abc}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-semibold truncate">{p.nome}</span>
                    <span style={{ color: p.lucro >= 0 ? "#10b981" : "#ef4444", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{fmt$(p.faturamento)}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#74859c" }}>{p.pedidos}p · margem {fmtPct(p.margem)} · lucro {fmt$(p.lucro)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── METAS ─────────────────────────────────────────────────
function AbaMetas({ kpis: k, meta, lojaId, mes, ano, onSalvar }: { kpis: KpisOperacao; meta: OpMeta | null; lojaId: string; mes: number; ano: number; onSalvar: () => void }) {
  const m = meta || { loja_id: lojaId, mes, ano, meta_faturamento: 0, meta_lucro: 0, meta_pedidos: 0 };
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ fat: String(m.meta_faturamento || ""), lucro: String(m.meta_lucro || ""), peds: String(m.meta_pedidos || "") });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const inp = { background: "#1e3356", border: "1px solid #334155", color: "#e8edf5", borderRadius: 10, padding: "8px 10px", width: "100%", outline: "none", fontSize: 14, fontWeight: 700, textAlign: "right" } as React.CSSProperties;

  async function salvar() {
    setSalvando(true); setErro("");
    try {
      await salvarMeta({ loja_id: lojaId, mes, ano, meta_faturamento: parseFloat(f.fat) || 0, meta_lucro: parseFloat(f.lucro) || 0, meta_pedidos: parseInt(f.peds) || 0 });
      setEdit(false); onSalvar();
    } catch (e) { setErro(String((e as { message?: string })?.message || e)); }
    finally { setSalvando(false); }
  }

  const Barra = ({ label, atual, alvo, fmt }: { label: string; atual: number; alvo: number; fmt: (n: number) => string }) => {
    const pct = alvo > 0 ? Math.min((atual / alvo) * 100, 100) : 0;
    const cor = pct >= 100 ? "#10b981" : pct >= 60 ? "#3b82f6" : pct >= 30 ? "#f59e0b" : "#ef4444";
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span style={{ color: "#9aa7ba" }}>{label}</span>
          <span style={{ color: alvo > 0 ? cor : "#74859c", fontWeight: 700 }}>{alvo > 0 ? `${fmt(atual)} / ${fmt(alvo)} · ${pct.toFixed(0)}%` : "sem meta"}</span>
        </div>
        <div style={{ height: 8, background: "#1e3356", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 99, transition: "width .6s" }} />
        </div>
      </div>
    );
  };

  if (edit) {
    return (
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <p className="text-sm font-bold text-white">Definir metas — {MESES[mes - 1]} {ano}</p>
        <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Meta faturamento ($)</label><input type="number" value={f.fat} onChange={(e) => setF({ ...f, fat: e.target.value })} style={inp} /></div>
        <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Meta lucro ($)</label><input type="number" value={f.lucro} onChange={(e) => setF({ ...f, lucro: e.target.value })} style={inp} /></div>
        <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Meta pedidos</label><input type="number" value={f.peds} onChange={(e) => setF({ ...f, peds: e.target.value })} style={inp} /></div>
        {erro && <p className="text-xs" style={{ color: "#ef4444" }}>Erro: {erro} {erro.includes("op_metas") && "→ rode supabase-metas.sql"}</p>}
        <div className="flex gap-2">
          <button onClick={() => setEdit(false)} className="flex-1 py-2.5 rounded-xl font-bold text-sm" style={{ background: "#1e3356", color: "#94a3b8" }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="flex-1 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>{salvando ? "Salvando..." : "Salvar metas"}</button>
        </div>
      </div>
    );
  }

  const semMeta = !m.meta_faturamento && !m.meta_lucro && !m.meta_pedidos;
  return (
    <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-white">Metas — {MESES[mes - 1]} {ano}</p>
        <button onClick={() => { setF({ fat: String(m.meta_faturamento || ""), lucro: String(m.meta_lucro || ""), peds: String(m.meta_pedidos || "") }); setEdit(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "#c9a84c", color: "#0b1624" }}><Pencil size={12} /> {semMeta ? "Definir" : "Editar"}</button>
      </div>
      {semMeta ? (
        <p className="text-sm text-center py-6" style={{ color: "#74859c" }}>Nenhuma meta definida para este mês.</p>
      ) : (
        <>
          <Barra label="Faturamento" atual={k.faturamento} alvo={m.meta_faturamento} fmt={fmt$} />
          <Barra label="Lucro bruto" atual={k.lucroBruto} alvo={m.meta_lucro} fmt={fmt$} />
          <Barra label="Pedidos" atual={k.pedidos} alvo={m.meta_pedidos} fmt={(n) => String(Math.round(n))} />
        </>
      )}
    </div>
  );
}

// ─── ANUAL (12 meses) ──────────────────────────────────────
function AbaAnual({ anual, ano, lojaId }: { anual: MesResumo[] | null; ano: number; lojaId: string }) {
  const [ltv, setLtv] = useState<Ltv | null>(null);
  useEffect(() => { setLtv(null); calcularLtv(lojaId).then(setLtv).catch(() => {}); }, [lojaId]);
  if (!anual) return <div className="rounded-2xl p-8 text-center" style={{ background: "#112239", color: "#74859c" }}>Carregando ano...</div>;
  const tot = anual.reduce((a, m) => ({ fat: a.fat + m.faturamento, lucro: a.lucro + m.lucro, ads: a.ads + m.ads, peds: a.peds + m.pedidos }), { fat: 0, lucro: 0, ads: 0, peds: 0 });
  const maxFat = Math.max(1, ...anual.map((m) => Math.max(m.faturamento, m.meta)));
  return (
    <div className="space-y-4">
      {ltv && ltv.totalPedidos > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(168,180,232,.06), rgba(168,180,232,.02))", border: "1px solid #a8b4e825" }}>
          <p className="text-sm font-bold text-white mb-1">LTV — visão de todos os meses</p>
          <p className="text-xs mb-3" style={{ color: "#74859c" }}>{ltv.totalPedidos} pedidos em {ltv.mesesAtivos} mês(es) ativos</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MiniCard label="Ticket médio" valor={fmt$(ltv.ticketMedio)} cor="#3b82f6" />
            <MiniCard label="Lucro/mês" valor={fmt$(ltv.lucroMes)} cor={ltv.lucroMes >= 0 ? "#10b981" : "#ef4444"} />
            <MiniCard label="Pedidos/mês" valor={ltv.pedidosMes.toFixed(1)} cor="#8b5cf6" />
            <MiniCard label="LTV 12m proj." valor={fmt$(ltv.ltv12)} cor="#a8b4e8" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard label="Faturamento ano" valor={fmt$(tot.fat)} cor="#3b82f6" />
        <MiniCard label="Lucro ano" valor={fmt$(tot.lucro)} cor={tot.lucro >= 0 ? "#10b981" : "#ef4444"} />
        <MiniCard label="ADS ano" valor={fmt$(tot.ads)} cor="#f59e0b" />
        <MiniCard label="Pedidos ano" valor={String(tot.peds)} cor="#8b5cf6" />
      </div>
      <div className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#9aa7ba" }}>Faturamento por mês — {ano}</p>
        <div className="space-y-2">
          {anual.map((m) => {
            const pctMeta = m.meta > 0 ? (m.faturamento / m.meta) * 100 : 0;
            const bateu = m.meta > 0 && m.faturamento >= m.meta;
            return (
              <div key={m.mes}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#9aa7ba", width: 32 }}>{MESES[m.mes - 1]}{bateu ? " 🏆" : ""}</span>
                  <span style={{ color: m.lucro >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>{m.faturamento > 0 ? fmt$(m.faturamento) : "—"}{m.meta > 0 ? ` · ${pctMeta.toFixed(0)}% meta` : ""}</span>
                </div>
                <div style={{ height: 6, background: "#1e3356", borderRadius: 99, overflow: "hidden", position: "relative" }}>
                  <div style={{ width: `${Math.min((m.faturamento / maxFat) * 100, 100)}%`, height: "100%", background: bateu ? "#10b981" : "#3b82f6", borderRadius: 99 }} />
                  {m.meta > 0 && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${Math.min((m.meta / maxFat) * 100, 100)}%`, width: 2, background: "#d4b896" }} />}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs mt-3" style={{ color: "#74859c" }}>Linha dourada = meta do mês</p>
      </div>
    </div>
  );
}
function MiniCard({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "linear-gradient(160deg, #14243f, #111e35)", border: `1px solid ${cor}30` }}>
      <p className="text-xs" style={{ color: "#9aa7ba" }}>{label}</p>
      <p className="font-extrabold mt-1" style={{ fontSize: 17, color: cor }}>{valor}</p>
    </div>
  );
}

// ─── PEDIDOS ───────────────────────────────────────────────
// ─── ANÁLISE DE CANAIS ─────────────────────────────────────
function AbaCanais({ pedidos, ads }: { pedidos: OpPedido[]; ads: OpAds[] }) {
  const canais = serieCanal(pedidos, ads);
  if (canais.length === 0) return <div className="rounded-2xl p-8 text-center" style={{ background: "#112239", color: "#74859c" }}>Sem dados. Lance pedidos com canal e gastos de ADS no mês.</div>;
  const corCanal: Record<string, string> = { Meta: "#3b82f6", TikTok: "#ec4899", Google: "#10b981", Organico: "#c9a84c", Direto: "#94a3b8", Email: "#8b5cf6" };
  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 text-xs" style={{ background: "#3b82f615", border: "1px solid #3b82f630", color: "#9aa7ba" }}>
        ROAS e recompra por canal de venda. Gasto vem do ADS (plataforma); receita e recompra vêm do canal marcado em cada pedido.
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ color: "#74859c", textAlign: "left" }}>
              <th className="p-2">Canal</th><th className="p-2">Gasto</th><th className="p-2">Receita</th><th className="p-2">Pedidos</th>
              <th className="p-2">ROAS</th><th className="p-2">CPA</th><th className="p-2">Ticket</th><th className="p-2">Recompra</th><th className="p-2">% receita</th>
            </tr></thead>
            <tbody>
              {canais.map((c) => (
                <tr key={c.canal} style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>
                  <td className="p-2 font-semibold" style={{ color: corCanal[c.canal] || "#e8edf5" }}>{c.canal}</td>
                  <td className="p-2" style={{ color: "#9aa7ba" }}>{c.gasto > 0 ? fmt$(c.gasto) : "—"}</td>
                  <td className="p-2 text-white">{fmt$(c.receita)}</td>
                  <td className="p-2" style={{ color: "#9aa7ba" }}>{c.pedidos}</td>
                  <td className="p-2 font-bold" style={{ color: c.gasto === 0 ? "#74859c" : c.roas >= 3 ? "#10b981" : c.roas >= 1.5 ? "#f59e0b" : "#ef4444" }}>{c.gasto > 0 ? c.roas.toFixed(2) + "×" : "—"}</td>
                  <td className="p-2" style={{ color: "#c9a84c" }}>{c.cpa > 0 ? fmt$(c.cpa) : "—"}</td>
                  <td className="p-2" style={{ color: "#9aa7ba" }}>{fmt$(c.ticket)}</td>
                  <td className="p-2" style={{ color: c.recompraPct >= 20 ? "#10b981" : "#9aa7ba" }}>{fmtPct(c.recompraPct)}</td>
                  <td className="p-2" style={{ color: "#9aa7ba" }}>{fmtPct(c.pctReceita)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BarCard titulo="ROAS por canal" sub="retorno do anúncio"
          linhas={canais.filter((c) => c.gasto > 0).sort((a, b) => b.roas - a.roas).map((c) => ({ lbl: c.canal, val: c.roas, txt: c.roas.toFixed(2) }))} />
        <BarCard titulo="Recompra por canal" sub="quem traz clientes fiéis"
          linhas={[...canais].sort((a, b) => b.recompraPct - a.recompraPct).map((c) => ({ lbl: c.canal, val: c.recompraPct, txt: c.recompraPct.toFixed(0) + "%" }))} />
      </div>
    </div>
  );
}

// Card de barras horizontais — trilho recuado + gradiente (BIG APP). Maior = verde, resto = ouro.
function BarCard({ titulo, sub, linhas }: { titulo: string; sub: string; linhas: { lbl: string; val: number; txt: string }[] }) {
  const max = Math.max(...linhas.map((l) => l.val), 0.0001);
  return (
    <div className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
      <p className="text-sm font-bold text-white">{titulo}</p>
      <p className="text-xs mb-3" style={{ color: "#74859c" }}>{sub}</p>
      <div className="space-y-3">
        {linhas.map((l, i) => (
          <div key={l.lbl} className="flex items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: "#9aa7ba", width: 64, flexShrink: 0 }}>{l.lbl}</span>
            <div className="hbar-track" style={{ flex: 1, height: 28 }}>
              <div className="hbar-fill" style={{ width: `${Math.max((l.val / max) * 100, 14)}%`, background: i === 0 ? "var(--grad-green)" : "var(--grad-gold)" }}>{l.txt}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FLUXO DE CAIXA (BRL) ──────────────────────────────────
function AbaCaixa({ pedidos, ads }: { pedidos: OpPedido[]; ads: OpAds[] }) {
  const [cambio, setCambio] = useState(5.4);
  const [moeda, setMoeda] = useState<"BRL" | "USD">("BRL");
  useEffect(() => {
    fetch("/api/cambio").then((r) => r.json()).then((j) => { if (j.ok && j.rates?.BRL) setCambio(j.rates.BRL); }).catch(() => {});
  }, []);
  const fx = fluxoCaixa(pedidos, ads, cambio);
  const m = (usd: number, brl: number) => moeda === "BRL" ? "R$ " + brl.toFixed(2) : "$" + usd.toFixed(2);
  const Card = ({ label, usd, brl, c, sub }: { label: string; usd: number; brl: number; c: string; sub?: string }) => (
    <div className="rounded-2xl p-4" style={{ background: "linear-gradient(160deg,#14243f,#111e35)", border: `1px solid ${c}30` }}>
      <p className="text-xs" style={{ color: "#9aa7ba" }}>{label}</p>
      <p className="font-extrabold mt-1" style={{ fontSize: 20, color: c }}>{m(usd, brl)}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>{sub}</p>}
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="rounded-xl p-3 text-xs flex-1" style={{ background: "#3b82f615", border: "1px solid #3b82f630", color: "#9aa7ba" }}>
          Descasamento: você paga fornecedor + ADS à vista, mas a Shopify libera o faturamento em ~7 dias. Câmbio do dia: R$ {cambio.toFixed(2)}/US$.
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#0f1c30" }}>
          {(["BRL", "USD"] as const).map((x) => (
            <button key={x} onClick={() => setMoeda(x)} className="px-3 py-1.5 rounded-md text-xs font-bold" style={{ background: moeda === x ? "#c9a84c" : "transparent", color: moeda === x ? "#0b1624" : "#94a3b8" }}>{x}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Saldo em caixa" usd={fx.saldoUSD} brl={fx.saldoBRL} c={fx.saldoUSD >= 0 ? "#10b981" : "#ef4444"} sub="recebido − pago" />
        <Card label="Já recebido" usd={fx.recebidoUSD} brl={fx.recebidoBRL} c="#3b82f6" sub="liberado (>7d)" />
        <Card label="A receber (retido)" usd={fx.aReceberUSD} brl={fx.aReceberBRL} c="#f59e0b" sub="Shopify libera em ~7d" />
        <Card label="Pago à vista" usd={fx.pagoUSD} brl={fx.pagoBRL} c="#ef4444" sub="fornecedor + ADS" />
      </div>
      <div className="rounded-2xl p-4 grid grid-cols-2 gap-3" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div><p className="text-xs" style={{ color: "#74859c" }}>Custo de produto/frete</p><p className="text-sm font-bold text-white">{m(fx.custoUSD, fx.custoUSD * cambio)}</p></div>
        <div><p className="text-xs" style={{ color: "#74859c" }}>Gasto com ADS</p><p className="text-sm font-bold text-white">{m(fx.adsUSD, fx.adsUSD * cambio)}</p></div>
      </div>
    </div>
  );
}

function AbaPedidos({ lojaId, pedidos, onMudou }: { lojaId: string; pedidos: OpPedido[]; onMudou: () => void }) {
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const vazio = { data: hoje(), num_pedido: "", fornecedor: "AliExpress", custo_produto: "", frete: "", faturamento: "", produto: "", status: "", canal: "", tipo_cliente: "novo", notas: "" };
  const [f, setF] = useState<Record<string, string>>(vazio);
  const [salvando, setSalvando] = useState(false);

  function abrirNovo() { setEditId(null); setF(vazio); setForm(true); }
  function abrirEdit(p: OpPedido) {
    setEditId(p.id!);
    setF({ data: p.data, num_pedido: p.num_pedido || "", fornecedor: p.fornecedor || "AliExpress",
      custo_produto: String(p.custo_produto), frete: String(p.frete), faturamento: String(p.faturamento),
      produto: p.produto || "", status: p.status || "", canal: p.canal || "", tipo_cliente: p.tipo_cliente || "novo", notas: p.notas || "" });
    setForm(true);
  }
  async function salvar() {
    if (!f.data || !f.faturamento) return;
    setSalvando(true);
    const dados = {
      loja_id: lojaId, data: f.data, num_pedido: f.num_pedido, fornecedor: f.fornecedor,
      custo_produto: parseFloat(f.custo_produto) || 0, frete: parseFloat(f.frete) || 0,
      faturamento: parseFloat(f.faturamento) || 0, produto: f.produto, status: f.status,
      canal: f.canal, tipo_cliente: f.tipo_cliente, notas: f.notas,
    };
    try {
      if (editId) await editarPedido(editId, dados); else await criarPedido(dados);
      setForm(false); onMudou();
    } finally { setSalvando(false); }
  }
  async function excluir(id: number) { await deletarPedido(id); onMudou(); }

  const inp = { background: "#1e3356", border: "1px solid #334155", color: "#e8edf5", borderRadius: 10, padding: "8px 10px", width: "100%", outline: "none", fontSize: 13 } as React.CSSProperties;

  function exportarCSV() {
    const csv = gerarCSV(pedidos);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pedidos_${lojaId}.csv`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={abrirNovo} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold" style={{ background: "#c9a84c", color: "#0b1624" }}>
          <Plus size={14} /> Novo pedido
        </button>
        {pedidos.length > 0 && (
          <button onClick={exportarCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "#1e3356", color: "#94a3b8" }}>
            <Download size={14} /> CSV
          </button>
        )}
      </div>

      {pedidos.length === 0 && <div className="rounded-2xl p-8 text-center" style={{ background: "#112239", color: "#74859c" }}>Nenhum pedido neste mês.</div>}

      <div className="space-y-2">
        {pedidos.map((p) => {
          const lucro = (p.status === "reembolso" ? 0 : p.faturamento) - (p.custo_produto + p.frete);
          return (
            <div key={p.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#3b82f620", color: "#3b82f6" }}>{p.fornecedor}</span>
                  {p.status === "reembolso" && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#ef444420", color: "#ef4444" }}>Reembolso</span>}
                  {p.status === "disputa" && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#f59e0b20", color: "#f59e0b" }}>Disputa</span>}
                  <span className="text-xs" style={{ color: "#74859c" }}>{p.data.slice(8, 10)}/{p.data.slice(5, 7)}</span>
                </div>
                <p className="text-sm text-white mt-0.5">{p.produto || p.num_pedido || "—"}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: "#e8edf5" }}>{fmt$(p.faturamento)}</p>
                <p className="text-xs" style={{ color: lucro >= 0 ? "#10b981" : "#ef4444" }}>{fmt$(lucro)}</p>
              </div>
              <button onClick={() => abrirEdit(p)} className="p-1.5 rounded-lg" style={{ color: "#74859c" }}><Pencil size={13} /></button>
              <button onClick={() => excluir(p.id!)} className="p-1.5 rounded-lg" style={{ color: "#74859c" }}><Trash2 size={13} /></button>
            </div>
          );
        })}
      </div>

      {form && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000090", backdropFilter: "blur(2px)" }} onClick={() => setForm(false)}>
          <div className="modal-card w-full max-w-md rounded-2xl p-5 space-y-3 overflow-y-auto" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)", maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">{editId ? "Editar pedido" : "Novo pedido"}</h3>
              <button onClick={() => setForm(false)} style={{ color: "#74859c" }}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Data</label><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} style={{ ...inp, colorScheme: "dark" }} /></div>
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Nº pedido</label><input value={f.num_pedido} onChange={(e) => setF({ ...f, num_pedido: e.target.value })} placeholder="Opcional" style={inp} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Fornecedor</label><select value={f.fornecedor} onChange={(e) => setF({ ...f, fornecedor: e.target.value })} style={inp}>{FORNECEDORES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Produto</label><input value={f.produto} onChange={(e) => setF({ ...f, produto: e.target.value })} placeholder="Nome/SKU" style={inp} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Custo prod.</label><input type="number" value={f.custo_produto} onChange={(e) => setF({ ...f, custo_produto: e.target.value })} placeholder="0.00" style={inp} /></div>
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Frete</label><input type="number" value={f.frete} onChange={(e) => setF({ ...f, frete: e.target.value })} placeholder="0.00" style={inp} /></div>
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Faturamento *</label><input type="number" value={f.faturamento} onChange={(e) => setF({ ...f, faturamento: e.target.value })} placeholder="0.00" style={inp} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Canal da venda</label><select value={f.canal} onChange={(e) => setF({ ...f, canal: e.target.value })} style={inp}><option value="">—</option>{CANAIS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Cliente</label><select value={f.tipo_cliente} onChange={(e) => setF({ ...f, tipo_cliente: e.target.value })} style={inp}><option value="novo">Novo</option><option value="recorrente">Recorrente</option></select></div>
            </div>
            <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Status</label><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} style={inp}><option value="">Completo</option><option value="reembolso">Reembolso</option><option value="disputa">Disputa</option></select></div>
            <button onClick={salvar} disabled={salvando || !f.data || !f.faturamento} className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>{salvando ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADS ───────────────────────────────────────────────────
function AbaAds({ lojaId, ads, onMudou }: { lojaId: string; ads: OpAds[]; onMudou: () => void }) {
  const [form, setForm] = useState(false);
  const [f, setF] = useState({ data: hoje(), valor: "", plataforma: "Meta" });
  const [salvando, setSalvando] = useState(false);
  const [sim, setSim] = useState({ budget: "", roas: "3", ticket: "", margem: "" });
  const total = ads.reduce((s, a) => s + a.valor, 0);
  const inp = { background: "#1e3356", border: "1px solid #334155", color: "#e8edf5", borderRadius: 10, padding: "8px 10px", width: "100%", outline: "none", fontSize: 13 } as React.CSSProperties;
  const simR = (parseFloat(sim.budget) || 0) > 0 ? simularAds(parseFloat(sim.budget) || 0, parseFloat(sim.roas) || 0, parseFloat(sim.ticket) || 0, parseFloat(sim.margem) || 0) : null;

  async function salvar() {
    if (!f.data || !f.valor) return;
    setSalvando(true);
    try { await criarAds({ loja_id: lojaId, data: f.data, valor: parseFloat(f.valor) || 0, plataforma: f.plataforma }); setForm(false); setF({ data: hoje(), valor: "", plataforma: "Meta" }); onMudou(); }
    finally { setSalvando(false); }
  }
  async function excluir(id: number) { await deletarAds(id); onMudou(); }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#9aa7ba" }}>Total no mês: <b style={{ color: "#f59e0b" }}>{fmt$(total)}</b></p>
        <button onClick={() => setForm(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold" style={{ background: "#c9a84c", color: "#0b1624" }}><Plus size={14} /> Novo gasto</button>
      </div>
      {/* Simulador ADS */}
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(139,92,246,.06), rgba(139,92,246,.02))", border: "1px solid #8b5cf625" }}>
        <p className="text-sm font-bold text-white mb-1">Simulador de ADS</p>
        <p className="text-xs mb-3" style={{ color: "#74859c" }}>E se eu investir X em ADS?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Budget ($)</label><input type="number" value={sim.budget} onChange={(e) => setSim({ ...sim, budget: e.target.value })} placeholder="0" style={inp} /></div>
          <div><label className="text-xs" style={{ color: "#9aa7ba" }}>ROAS alvo</label><input type="number" value={sim.roas} onChange={(e) => setSim({ ...sim, roas: e.target.value })} placeholder="3" style={inp} /></div>
          <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Ticket ($)</label><input type="number" value={sim.ticket} onChange={(e) => setSim({ ...sim, ticket: e.target.value })} placeholder="0" style={inp} /></div>
          <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Margem %</label><input type="number" value={sim.margem} onChange={(e) => setSim({ ...sim, margem: e.target.value })} placeholder="0" style={inp} /></div>
        </div>
        {simR && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <div className="text-center rounded-lg p-2" style={{ background: "#0f1c30" }}><p className="text-xs" style={{ color: "#74859c" }}>Faturamento</p><p className="font-bold" style={{ color: "#3b82f6" }}>{fmt$(simR.faturamento)}</p></div>
            <div className="text-center rounded-lg p-2" style={{ background: "#0f1c30" }}><p className="text-xs" style={{ color: "#74859c" }}>Pedidos</p><p className="font-bold text-white">{simR.pedidos}</p></div>
            <div className="text-center rounded-lg p-2" style={{ background: "#0f1c30" }}><p className="text-xs" style={{ color: "#74859c" }}>Lucro</p><p className="font-bold" style={{ color: simR.lucro >= 0 ? "#10b981" : "#ef4444" }}>{fmt$(simR.lucro)}</p></div>
            <div className="text-center rounded-lg p-2" style={{ background: "#0f1c30" }}><p className="text-xs" style={{ color: "#74859c" }}>ROI</p><p className="font-bold" style={{ color: simR.roi >= 0 ? "#10b981" : "#ef4444" }}>{(simR.roi * 100).toFixed(0)}%</p></div>
          </div>
        )}
        {simR && <p className="text-xs mt-2" style={{ color: "#74859c" }}>Break-even ROAS: {simR.beRoas > 0 ? simR.beRoas.toFixed(1) + "x" : "—"} · {simR.lucro >= 0 ? "rentável ✅" : "prejuízo ⚠️"}</p>}
      </div>

      {ads.length === 0 && <div className="rounded-2xl p-8 text-center" style={{ background: "#112239", color: "#74859c" }}>Nenhum gasto de ADS neste mês.</div>}
      <div className="space-y-2">
        {ads.map((a) => (
          <div key={a.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
            <div className="flex-1">
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#8b5cf620", color: "#8b5cf6" }}>{a.plataforma}</span>
              <span className="text-xs ml-2" style={{ color: "#74859c" }}>{a.data.slice(8, 10)}/{a.data.slice(5, 7)}</span>
            </div>
            <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>{fmt$(a.valor)}</p>
            <button onClick={() => excluir(a.id!)} className="p-1.5 rounded-lg" style={{ color: "#74859c" }}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      {form && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000090", backdropFilter: "blur(2px)" }} onClick={() => setForm(false)}>
          <div className="modal-card w-full max-w-sm rounded-2xl p-5 space-y-3 overflow-y-auto" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-white font-bold">Novo gasto ADS</h3><button onClick={() => setForm(false)} style={{ color: "#74859c" }}><X size={18} /></button></div>
            <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Valor *</label><input type="number" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder="0.00" style={{ ...inp, fontSize: 22, fontWeight: 800, textAlign: "center" }} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Data</label><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} style={{ ...inp, colorScheme: "dark" }} /></div>
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Plataforma</label><select value={f.plataforma} onChange={(e) => setF({ ...f, plataforma: e.target.value })} style={inp}>{PLATAFORMAS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>
            <button onClick={salvar} disabled={salvando || !f.valor} className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>{salvando ? "Salvando..." : "Salvar"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONFIG (taxas) ────────────────────────────────────────
function AbaConfig({ cfg, onSalvar }: { cfg: OpConfig; onSalvar: (c: OpConfig) => Promise<void> }) {
  const [c, setC] = useState<OpConfig>(cfg);
  const [salvando, setSalvando] = useState(false);
  const [calc, setCalc] = useState({ custo: "", frete: "", margem: "" });
  const inp = { background: "#1e3356", border: "1px solid #334155", color: "#e8edf5", borderRadius: 10, padding: "8px 10px", width: 90, outline: "none", fontSize: 14, fontWeight: 700, textAlign: "right" } as React.CSSProperties;
  const inpFull = { ...inp, width: "100%" } as React.CSSProperties;
  const custoTotal = (parseFloat(calc.custo) || 0) + (parseFloat(calc.frete) || 0);
  const margemUsada = parseFloat(calc.margem) || c.margem_alvo;
  const pc = custoTotal > 0 ? precoIdeal(custoTotal, margemUsada, c) : null;
  const Row = ({ label, sub, campo, unidade }: { label: string; sub: string; campo: keyof OpConfig; unidade: string }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
      <div><p className="text-sm text-white">{label}</p><p className="text-xs" style={{ color: "#74859c" }}>{sub}</p></div>
      <div className="flex items-center gap-1">
        <input type="number" step="0.1" value={String(c[campo])} onChange={(e) => setC({ ...c, [campo]: parseFloat(e.target.value) || 0 })} style={inp} />
        <span style={{ color: "#74859c", fontSize: 13 }}>{unidade}</span>
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <p className="text-sm font-bold text-white mb-2">Taxas desta loja</p>
        <Row label="Gateway de pagamento" sub="Stripe/PayPal sobre o faturamento" campo="gateway_fee" unidade="%" />
        <Row label="Taxa Shopify" sub="Transação do plano" campo="shopify_fee" unidade="%" />
        <Row label="Imposto" sub="Reserva fiscal sobre faturamento" campo="imposto" unidade="%" />
        <Row label="Orçamento ADS/dia" sub="Meta de gasto diário" campo="ads_budget" unidade="$" />
        <Row label="Margem alvo" sub="Margem líquida mínima desejada" campo="margem_alvo" unidade="%" />
        <button onClick={async () => { setSalvando(true); try { await onSalvar(c); } finally { setSalvando(false); } }} disabled={salvando} className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>{salvando ? "Salvando..." : "Salvar taxas"}</button>
      </div>

      {/* Calculadora de preço ideal */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(16,185,129,.06), rgba(16,185,129,.02))", border: "1px solid #10b98125" }}>
        <p className="text-sm font-bold text-white mb-1">Calculadora de preço de venda</p>
        <p className="text-xs mb-3" style={{ color: "#74859c" }}>Informe custo e margem desejada → preço ideal já com as taxas acima</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Custo prod.</label><input type="number" value={calc.custo} onChange={(e) => setCalc({ ...calc, custo: e.target.value })} placeholder="0.00" style={inpFull} /></div>
          <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Frete</label><input type="number" value={calc.frete} onChange={(e) => setCalc({ ...calc, frete: e.target.value })} placeholder="0.00" style={inpFull} /></div>
          <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Margem %</label><input type="number" value={calc.margem} onChange={(e) => setCalc({ ...calc, margem: e.target.value })} placeholder={String(c.margem_alvo)} style={inpFull} /></div>
        </div>
        {pc && (pc.inviavel ? (
          <p className="text-sm rounded-xl p-3" style={{ background: "#ef444415", color: "#ef4444" }}>Taxas + margem passam de 100% — impossível com esse custo.</p>
        ) : (
          <div className="rounded-xl p-4 text-center" style={{ background: "#0f1c30", border: "1px solid #10b98120" }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: "#9aa7ba" }}>Preço de venda ideal</p>
            <p className="font-extrabold my-1" style={{ fontSize: 34, color: "#10b981", letterSpacing: "-1px" }}>{fmt$(pc.preco)}</p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div><p style={{ color: "#74859c" }}>Custo</p><p className="font-bold text-white">{fmt$(custoTotal)}</p></div>
              <div><p style={{ color: "#74859c" }}>Taxas</p><p className="font-bold text-white">{fmt$(pc.taxas)}</p></div>
              <div><p style={{ color: "#74859c" }}>Lucro</p><p className="font-bold" style={{ color: "#10b981" }}>{fmt$(pc.lucro)}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
