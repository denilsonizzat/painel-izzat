"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { supabaseConfigurado } from "@/lib/supabase";
import { PrecTip, AJUDA } from "./PrecTip";
import {
  PrecConfig, PrecPais, PrecProduto, PrecFornecedor, PrecCusto,
  obterConfig, salvarConfig, listarPaises, seedPaises, salvarPais, deletarPais,
  listarProdutos, criarProduto, editarProduto, deletarProduto,
  listarFornecedores, salvarFornecedores, listarCustos, salvarCustos,
  calcularPreco, markupDoPais, scorePreco, veredito, calcularOfertas,
  CRITERIOS_GARIMPO, notaGarimpo, CONFIG_PADRAO,
  realPorProduto, margemBrutaProjetada, RealProduto, reembolsoPorPrazo,
  unitEconomics, ancoraReal, AncoraReal,
  riscoChargeback, RiscoChargeback,
} from "@/lib/precificacao";
import { Target, Calculator, ListChecks, Clock, Globe, Settings, Plus, Trash2, Send, GitCompare, Repeat, ShieldAlert, Compass, HelpCircle, ArrowRight } from "lucide-react";

const fmt$ = (n: number) => "$" + (n || 0).toFixed(2);
const pct = (n: number) => (n * 100).toFixed(1) + "%";
const COR_VEREDITO: Record<string, string> = { "LANÇAR": "#10b981", "TESTAR": "#f59e0b", "NÃO LANÇAR": "#ef4444" };
const inp = { background: "#1e3356", border: "1px solid #334155", color: "#e8edf5", borderRadius: 9, padding: "8px 10px", width: "100%", outline: "none", fontSize: 13 } as React.CSSProperties;

// Medidor de arco (semicírculo) — igual BIG APP
function GaugeArc({ valor, cor }: { valor: number; cor: string }) {
  const pct = Math.max(0, Math.min(100, valor));
  const d = "M16 92 A 74 74 0 0 1 164 92";
  return (
    <div style={{ position: "relative", width: 180, margin: "0 auto" }}>
      <svg viewBox="0 0 180 104" style={{ width: "100%", display: "block" }}>
        <path d={d} fill="none" stroke="#1e3356" strokeWidth="13" strokeLinecap="round" pathLength={100} />
        <path d={d} fill="none" stroke={cor} strokeWidth="13" strokeLinecap="round" pathLength={100} strokeDasharray={`${pct} 100`} style={{ transition: "stroke-dasharray .6s cubic-bezier(.34,1.56,.64,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 4 }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: cor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{valor}</span>
        <span style={{ fontSize: 11, color: "#74859c" }}>de 100</span>
      </div>
    </div>
  );
}

type Aba = "guia" | "avaliar" | "motor" | "decisao" | "projreal" | "unit" | "risco" | "lista" | "paises" | "taxas" | "ajuda";

export default function PrecificacaoApp({ lojaId, lojaNome }: { lojaId: string; lojaNome: string }) {
  const [aba, setAba] = useState<Aba>("guia");
  const [config, setConfig] = useState<PrecConfig | null>(null);
  const [paises, setPaises] = useState<PrecPais[]>([]);
  const [produtos, setProdutos] = useState<PrecProduto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try {
      const [cf, ps, pr] = await Promise.all([obterConfig(lojaId), listarPaises(lojaId), listarProdutos(lojaId)]);
      if (ps.length === 0) { await seedPaises(lojaId); setPaises(await listarPaises(lojaId)); }
      else setPaises(ps);
      setConfig(cf); setProdutos(pr);
    } catch (e) { setErro(String((e as { message?: string })?.message || e)); }
    finally { setCarregando(false); }
  }, [lojaId]);
  useEffect(() => { carregar(); }, [carregar]);

  if (!supabaseConfigurado()) return <div className="rounded-2xl p-6 text-center" style={{ background: "#122039", color: "#ef4444" }}>Supabase não configurado.</div>;

  const TABS: { id: Aba; label: string; icon: typeof Target }[] = [
    { id: "guia", label: "Comece aqui", icon: Compass },
    { id: "avaliar", label: "Avaliar", icon: Target },
    { id: "motor", label: "Motor de Preços", icon: Calculator },
    { id: "decisao", label: "Decisão", icon: ListChecks },
    { id: "projreal", label: "Projetado × Real", icon: GitCompare },
    { id: "unit", label: "Unit Economics", icon: Repeat },
    { id: "risco", label: "Risco", icon: ShieldAlert },
    { id: "lista", label: "Lista de espera", icon: Clock },
    { id: "paises", label: "Países", icon: Globe },
    { id: "taxas", label: "Taxas", icon: Settings },
    { id: "ajuda", label: "Ajuda", icon: HelpCircle },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "#0f1c30", border: "1px solid #1e3356" }}>
        {TABS.map((t) => {
          const Icon = t.icon; const ativo = aba === t.id;
          return (
            <button key={t.id} onClick={() => setAba(t.id)} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{ background: ativo ? "#c9a84c" : "transparent", color: ativo ? "#0b1624" : "#94a3b8" }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {erro && <div className="rounded-xl p-3 text-sm" style={{ background: "#ef444415", color: "#ef4444" }}>Erro: {erro}</div>}
      {carregando && <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Carregando...</div>}

      {!carregando && config && (
        <>
          {aba === "guia" && <AbaGuia onIr={setAba} produtos={produtos} />}
          {aba === "ajuda" && <AbaAjuda />}
          {aba === "avaliar" && <AbaAvaliar lojaId={lojaId} onCriou={() => { carregar(); setAba("motor"); }} />}
          {aba === "motor" && <AbaMotor lojaId={lojaId} config={config} paises={paises} produtos={produtos} onMudou={carregar} />}
          {aba === "decisao" && <AbaDecisao config={config} paises={paises} produtos={produtos} onMudou={carregar} />}
          {aba === "projreal" && <AbaProjReal lojaId={lojaId} config={config} produtos={produtos} />}
          {aba === "unit" && <AbaUnit lojaId={lojaId} config={config} />}
          {aba === "risco" && <AbaRisco lojaId={lojaId} />}
          {aba === "lista" && <AbaLista lojaId={lojaId} produtos={produtos} config={config} paises={paises} onMudou={carregar} />}
          {aba === "paises" && <AbaPaises lojaId={lojaId} paises={paises} onMudou={carregar} />}
          {aba === "taxas" && <AbaTaxas config={config} onSalvar={async (c) => { await salvarConfig(c); carregar(); }} />}
        </>
      )}
    </div>
  );
}

// ─── AVALIAR (Nota de Garimpo) ─────────────────────────────
function AbaAvaliar({ lojaId, onCriou }: { lojaId: string; onCriou: () => void }) {
  const [nome, setNome] = useState("");
  const [resp, setResp] = useState<Record<string, number>>(() => Object.fromEntries(CRITERIOS_GARIMPO.map((c) => [c.key, 6])));
  const [salvando, setSalvando] = useState(false);
  const { nota, subgrupos, veredito: vd } = notaGarimpo(resp);
  const cor = nota >= 70 ? "#10b981" : nota >= 45 ? "#f59e0b" : "#ef4444";
  const GRUPOS = { m: "Mercado & demanda", p: "O produto", v: "Viabilidade" };

  async function aprovar() {
    if (!nome.trim()) return;
    setSalvando(true);
    try { await criarProduto({ loja_id: lojaId, nome: nome.trim(), nota_garimpo: nota, garimpo: resp, status: "avaliando" }); onCriou(); }
    finally { setSalvando(false); }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div>
          <label className="text-xs" style={{ color: "#9aa7ba" }}>Nome do produto</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Massageador Cervical" style={inp} />
        </div>
        {(["m", "p", "v"] as const).map((g) => (
          <div key={g}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c9a84c" }}>{GRUPOS[g]}</p>
            {CRITERIOS_GARIMPO.filter((c) => c.grupo === g).map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-2 py-2" style={{ borderBottom: "1px solid #1e335655" }}>
                <div className="min-w-0">
                  <p className="text-sm text-white flex items-center">{c.label}<PrecTip k={c.key === "saturacao" || c.key === "tendencia" || c.key === "wow" ? c.key === "saturacao" ? "nota_garimpo" : c.key : ""} /></p>
                  <p className="text-xs truncate" style={{ color: "#74859c" }}>{c.sub}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {c.opcoes.map((o) => (
                    <button key={o.v} onClick={() => setResp({ ...resp, [c.key]: o.v })}
                      className="px-2 py-1.5 rounded-md text-xs font-semibold"
                      style={{ background: resp[c.key] === o.v ? "#c9a84c" : "#1e3356", color: resp[c.key] === o.v ? "#0b1624" : "#94a3b8" }}>{o.txt}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 space-y-4 self-start" style={{ background: "linear-gradient(160deg,#14243f,#111e35)", border: "1px solid #1e3356" }}>
        <p className="text-xs text-center font-bold uppercase tracking-wider flex items-center justify-center" style={{ color: "#9aa7ba" }}>Nota de Garimpo<PrecTip k="nota_garimpo" /></p>
        <GaugeArc valor={nota} cor={cor} />
        <p className="text-center" style={{ marginTop: -6 }}><span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: cor + "20", color: cor }}>{vd}</span></p>
        <div className="space-y-2.5">
          {([["m", "Mercado", subgrupos.m], ["p", "Produto", subgrupos.p], ["v", "Viabilidade", subgrupos.v]] as const).map(([k, lbl, v]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "#9aa7ba", width: 78, flexShrink: 0 }}>{lbl}</span>
              <div className="hbar-track" style={{ flex: 1, height: 16 }}>
                <div style={{ width: `${v}%`, height: "100%", borderRadius: 8, background: v >= 70 ? "var(--grad-green)" : v >= 45 ? "var(--grad-gold)" : "var(--grad-red)" }} />
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: "#e8edf5", width: 24, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={aprovar} disabled={salvando || !nome.trim()} className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>
          {salvando ? "Salvando..." : "Aprovar e precificar →"}
        </button>
        <p className="text-xs text-center" style={{ color: "#74859c" }}>70+ vale testar · 45-69 com cautela · abaixo, procure outro</p>
      </div>
    </div>
  );
}

// ─── MOTOR DE PREÇOS ───────────────────────────────────────
function AbaMotor({ lojaId, config, paises, produtos, onMudou }: { lojaId: string; config: PrecConfig; paises: PrecPais[]; produtos: PrecProduto[]; onMudou: () => void }) {
  const [prodId, setProdId] = useState<number | null>(produtos[0]?.id ?? null);
  const [forns, setForns] = useState<Omit<PrecFornecedor, "id" | "produto_id">[]>([]);
  const [custos, setCustos] = useState<Record<string, { custo: string; frete: string }>>({});
  const [salvando, setSalvando] = useState(false);
  const prod = produtos.find((p) => p.id === prodId);

  const carregarProd = useCallback(async (id: number) => {
    const [fs, cs] = await Promise.all([listarFornecedores(id), listarCustos(id)]);
    setForns(fs.length ? fs.map(({ nome, link, custo, frete, prazo, titular }) => ({ nome, link, custo, frete, prazo, titular }))
      : [{ nome: "AliExpress", link: "", custo: 0, frete: 0, prazo: 9, titular: true }]);
    const cm: Record<string, { custo: string; frete: string }> = {};
    cs.forEach((c) => { cm[c.pais_cod] = { custo: String(c.custo_produto), frete: String(c.frete) }; });
    setCustos(cm);
  }, []);
  useEffect(() => { if (prodId) carregarProd(prodId); }, [prodId, carregarProd]);

  if (!prod) return <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Nenhum produto avaliado ainda. Vá em <b>Avaliar</b> primeiro.</div>;

  const titular = forns.find((f) => f.titular) || forns[0];
  const custoTitular = titular ? titular.custo + titular.frete : 0;
  function custoPais(cod: string): number {
    const c = custos[cod];
    if (c && (c.custo !== "" || c.frete !== "")) return (parseFloat(c.custo) || 0) + (parseFloat(c.frete) || 0);
    return custoTitular; // fallback: usa o custo do titular
  }

  async function salvar() {
    if (!prodId) return;
    setSalvando(true);
    try {
      await salvarFornecedores(prodId, forns);
      const cs = Object.entries(custos).filter(([, v]) => v.custo !== "" || v.frete !== "")
        .map(([pais_cod, v]) => ({ pais_cod, custo_produto: parseFloat(v.custo) || 0, frete: parseFloat(v.frete) || 0 }));
      await salvarCustos(prodId, cs);
      onMudou();
    } finally { setSalvando(false); }
  }

  function setForn(i: number, patch: Partial<typeof forns[number]>) { setForns(forns.map((f, j) => j === i ? { ...f, ...patch } : f)); }
  function setTitular(i: number) { setForns(forns.map((f, j) => ({ ...f, titular: j === i }))); }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs" style={{ color: "#74859c" }}>Produto:</span>
        <select value={prodId ?? ""} onChange={(e) => setProdId(Number(e.target.value))} style={{ ...inp, width: "auto" }}>
          {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}{p.nota_garimpo ? ` (garimpo ${p.nota_garimpo})` : ""}</option>)}
        </select>
        <button onClick={salvar} disabled={salvando} className="ml-auto px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>{salvando ? "Salvando..." : "Salvar"}</button>
      </div>

      {/* Fornecedores */}
      <div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <p className="text-sm font-bold text-white mb-2">Fornecedores <span style={{ color: "#74859c", fontWeight: 400, fontSize: 12 }}>(titular entra na precificação)</span></p>
        <div className="space-y-2">
          {forns.map((f, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "#0f1c30", border: `1px solid ${f.titular ? "#c9a84c66" : "#1e3356"}` }}>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setTitular(i)} className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: f.titular ? "#c9a84c22" : "#1e3356", color: f.titular ? "#c9a84c" : "#74859c" }}>{f.titular ? "★ Titular" : "definir titular"}</button>
                <input value={f.link || ""} onChange={(e) => setForn(i, { link: e.target.value })} placeholder="link AliExpress" style={{ ...inp, flex: 1 }} />
                {forns.length > 1 && <button onClick={() => setForns(forns.filter((_, j) => j !== i))} style={{ color: "#74859c" }}><Trash2 size={14} /></button>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Custo $</label><input type="number" value={f.custo || ""} onChange={(e) => setForn(i, { custo: parseFloat(e.target.value) || 0 })} style={inp} /></div>
                <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Frete $</label><input type="number" value={f.frete || ""} onChange={(e) => setForn(i, { frete: parseFloat(e.target.value) || 0 })} style={inp} /></div>
                <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Prazo dias</label><input type="number" value={f.prazo || ""} onChange={(e) => setForn(i, { prazo: parseInt(e.target.value) || 0 })} style={inp} /></div>
              </div>
            </div>
          ))}
        </div>
        {forns.length < 3 && <button onClick={() => setForns([...forns, { nome: "AliExpress", link: "", custo: 0, frete: 0, prazo: 15, titular: false }])} className="mt-2 flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#c9a84c" }}><Plus size={14} /> Adicionar fornecedor</button>}
      </div>

      {/* Ofertas (usa custo do titular, imposto 0 de referência US) */}
      {custoTitular > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-sm font-bold text-white mb-2 flex items-center">Ofertas (EUA, ref.)<PrecTip k="ofertas" /></p>
          <div className="grid grid-cols-3 gap-2">
            {calcularOfertas(custoTitular, 0, config, config.markup).map((o) => (
              <div key={o.nome} className="rounded-xl p-3 text-center" style={{ background: "#0f1c30" }}>
                <p className="text-xs" style={{ color: "#74859c" }}>{o.nome}</p>
                <p className="font-extrabold my-1" style={{ fontSize: 18, color: "#e8edf5" }}>{fmt$(o.preco)}</p>
                <p className="text-xs" style={{ color: "#10b981" }}>{pct(o.margemReal)} · {fmt$(o.lucro)}</p>
                <p className="text-xs" style={{ color: "#74859c" }}>{o.markupEfetivo.toFixed(2)}×</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela por país */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div className="p-3">
          <p className="text-sm font-bold text-white">Preço por mercado <span style={{ color: "#74859c", fontWeight: 400, fontSize: 11 }}>(custo vazio usa o titular)</span></p>
          <p className="text-xs mt-0.5 flex items-center flex-wrap" style={{ color: "#74859c" }}>Reembolso efetivo: {reembolsoPorPrazo(config.reembolso, titular?.prazo ?? 0)}% (prazo do titular {titular?.prazo ?? 0}d)<PrecTip k="prazo" /> · duty por país desconta da margem<PrecTip k="duty" /></p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#74859c", textAlign: "left" }}>
                <th className="p-2">Mercado</th><th className="p-2">Tier</th>
                <th className="p-2">Custo $</th><th className="p-2">Frete $</th>
                <th className="p-2">Markup</th><th className="p-2">Preço</th>
                <th className="p-2 flex items-center">Margem<PrecTip k="margem_real" /></th>
                <th className="p-2">CPA máx</th><th className="p-2">Veredito</th>
              </tr>
            </thead>
            <tbody>
              {paises.map((pa) => {
                const ct = custoPais(pa.cod);
                const opts = { duty: pa.duty ?? 0, reembolso: reembolsoPorPrazo(config.reembolso, titular?.prazo ?? 0) };
                const { markup, ajustado } = markupDoPais(pa, config, opts);
                const r = calcularPreco(ct, pa.imposto, config, markup, opts);
                const sc = scorePreco(r, config);
                const vd = veredito(r, sc, config);
                const c = custos[pa.cod] || { custo: "", frete: "" };
                return (
                  <tr key={pa.cod} style={{ borderTop: "1px solid #1e3356" }}>
                    <td className="p-2 text-white font-semibold">{pa.nome}</td>
                    <td className="p-2"><span className="px-1.5 rounded" style={{ background: pa.tier === "A" ? "#3b82f620" : "#74859c20", color: pa.tier === "A" ? "#3b82f6" : "#94a3b8" }}>{pa.tier}</span></td>
                    <td className="p-2"><input type="number" value={c.custo} onChange={(e) => setCustos({ ...custos, [pa.cod]: { ...c, custo: e.target.value } })} placeholder={String(titular?.custo ?? 0)} style={{ ...inp, padding: "4px 6px", width: 64 }} /></td>
                    <td className="p-2"><input type="number" value={c.frete} onChange={(e) => setCustos({ ...custos, [pa.cod]: { ...c, frete: e.target.value } })} placeholder={String(titular?.frete ?? 0)} style={{ ...inp, padding: "4px 6px", width: 56 }} /></td>
                    <td className="p-2" style={{ color: ajustado ? "#c9a84c" : "#9aa7ba" }}>{markup.toFixed(2)}×</td>
                    <td className="p-2 text-white font-semibold">{fmt$(r.preco)}</td>
                    <td className="p-2" style={{ color: r.margemReal >= config.margem_min / 100 ? "#10b981" : "#ef4444", fontWeight: 700 }}>{pct(r.margemReal)}</td>
                    <td className="p-2" style={{ color: "#c9a84c" }}>{fmt$(r.cpaMax)}</td>
                    <td className="p-2"><span className="px-1.5 py-0.5 rounded-full font-bold" style={{ background: COR_VEREDITO[vd] + "20", color: COR_VEREDITO[vd] }}>{vd}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── DECISÃO / RANKING ─────────────────────────────────────
function AbaDecisao({ config, paises, produtos, onMudou }: { config: PrecConfig; paises: PrecPais[]; produtos: PrecProduto[]; onMudou: () => void }) {
  const [linhas, setLinhas] = useState<{ prod: PrecProduto; pais: PrecPais; preco: number; margem: number; cpa: number; score: number; vd: string }[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      const out: typeof linhas = [];
      for (const prod of produtos) {
        if (!prod.id) continue;
        const [forns, custos] = await Promise.all([listarFornecedores(prod.id), listarCustos(prod.id)]);
        const tit = forns.find((f) => f.titular) || forns[0];
        if (!tit) continue;
        const custoTit = tit.custo + tit.frete;
        const opts = { reembolso: reembolsoPorPrazo(config.reembolso, tit.prazo ?? 0) };
        for (const pa of paises) {
          const cu = custos.find((c) => c.pais_cod === pa.cod);
          const ct = cu ? cu.custo_produto + cu.frete : custoTit;
          if (ct <= 0) continue;
          const o = { ...opts, duty: pa.duty ?? 0 };
          const { markup } = markupDoPais(pa, config, o);
          const r = calcularPreco(ct, pa.imposto, config, markup, o);
          const sc = scorePreco(r, config);
          out.push({ prod, pais: pa, preco: r.preco, margem: r.margemReal, cpa: r.cpaMax, score: sc, vd: veredito(r, sc, config) });
        }
      }
      out.sort((a, b) => b.score - a.score);
      setLinhas(out); setCarregando(false);
    })();
  }, [produtos, paises, config]);

  if (carregando) return <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Calculando ranking...</div>;
  if (!linhas.length) return <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Sem custos cadastrados. Use o <b>Motor de Preços</b>.</div>;

  async function aprovar(id: number) { await editarProduto(id, { status: "aprovado" }); onMudou(); }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
      <div className="p-3 text-sm font-bold text-white flex items-center">Ranking produto × mercado<PrecTip k="score" /></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr style={{ color: "#74859c", textAlign: "left" }}>
            <th className="p-2">Produto</th><th className="p-2">Mercado</th><th className="p-2">Margem</th><th className="p-2">CPA máx</th>
            <th className="p-2 flex items-center">Score<PrecTip k="score" /></th><th className="p-2">Veredito</th><th className="p-2"></th>
          </tr></thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} style={{ borderTop: "1px solid #1e3356" }}>
                <td className="p-2 text-white font-semibold">{l.prod.nome}</td>
                <td className="p-2" style={{ color: "#9aa7ba" }}>{l.pais.nome}</td>
                <td className="p-2" style={{ color: l.margem >= config.margem_min / 100 ? "#10b981" : "#ef4444" }}>{pct(l.margem)}</td>
                <td className="p-2" style={{ color: "#c9a84c" }}>{fmt$(l.cpa)}</td>
                <td className="p-2"><b style={{ color: l.score >= 70 ? "#10b981" : l.score >= 40 ? "#f59e0b" : "#ef4444" }}>{l.score}</b></td>
                <td className="p-2"><span className="px-1.5 py-0.5 rounded-full font-bold" style={{ background: COR_VEREDITO[l.vd] + "20", color: COR_VEREDITO[l.vd] }}>{l.vd}</span></td>
                <td className="p-2">{l.prod.status === "avaliando" && <button onClick={() => aprovar(l.prod.id!)} className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: "#10b98120", color: "#10b981" }}>Aprovar</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── COMECE AQUI (trilha guiada) ───────────────────────────
function AbaGuia({ onIr, produtos }: { onIr: (a: Aba) => void; produtos: PrecProduto[] }) {
  const passos = [
    { n: 1, ir: "avaliar" as Aba, t: "Avaliar o produto", d: "Responda 10 perguntas e veja a Nota de Garimpo. Decide se vale testar ANTES de gastar tempo precificando.", cta: "Avaliar produto" },
    { n: 2, ir: "motor" as Aba, t: "Precificar por mercado", d: "Coloque os fornecedores (titular + reservas) e o custo. Veja preço, margem e veredito em cada país.", cta: "Abrir motor" },
    { n: 3, ir: "decisao" as Aba, t: "Decidir", d: "Veja o ranking produto × mercado por score e aprove os que valem a pena.", cta: "Ver decisão" },
    { n: 4, ir: "lista" as Aba, t: "Enviar pra esteira", d: "Os aprovados vão pro catálogo de produtos da loja pra começar os testes.", cta: "Lista de espera" },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#1a2c4a,#111e35)", border: "1px solid #c9a84c30" }}>
        <h2 className="text-lg font-bold text-white">Bem-vindo à Precificação 👋</h2>
        <p className="text-sm mt-1" style={{ color: "#9aa7ba" }}>O caminho pra decidir se um produto vale a pena, em 4 passos. {produtos.length > 0 ? `Você já tem ${produtos.length} produto(s) em andamento.` : "Comece avaliando seu primeiro produto."}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {passos.map((p) => (
          <div key={p.n} className="rounded-2xl p-4 flex flex-col" style={{ background: "#122039", border: "1px solid #1e3356" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center rounded-full font-extrabold" style={{ width: 28, height: 28, background: "#c9a84c", color: "#0b1624", fontSize: 14 }}>{p.n}</span>
              <h3 className="text-white font-bold">{p.t}</h3>
            </div>
            <p className="text-sm flex-1" style={{ color: "#9aa7ba" }}>{p.d}</p>
            <button onClick={() => onIr(p.ir)} className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold" style={{ background: "#1e3356", color: "#c9a84c" }}>
              {p.cta} <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-center" style={{ color: "#74859c" }}>Dúvida em algum termo? Toque no ícone <b>(i)</b> em qualquer tela, ou abra a aba <b>Ajuda</b>.</p>
    </div>
  );
}

// ─── CENTRAL DE AJUDA (glossário completo) ─────────────────
function AbaAjuda() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#1a2c4a,#111e35)", border: "1px solid #c9a84c30" }}>
        <h2 className="text-lg font-bold text-white">Central de Ajuda</h2>
        <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>Todos os termos da precificação explicados. Os mesmos aparecem no ícone (i) de cada tela.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {Object.values(AJUDA).map((h) => (
          <div key={h.t} className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
            <h3 className="font-bold" style={{ color: "#e8c462" }}>{h.t}</h3>
            <p className="text-sm mt-1" style={{ color: "#e8edf5" }}>{h.oque}</p>
            {h.calc && <p className="text-xs mt-2 font-mono" style={{ background: "#c9a84c12", borderLeft: "2px solid #c9a84c", padding: "5px 8px", borderRadius: 6, color: "#9aa7ba" }}>{h.calc}</p>}
            {h.ex && <p className="text-xs mt-1.5" style={{ color: "#9aa7ba" }}>Ex: {h.ex}</p>}
            {h.sig && <p className="text-xs mt-1.5" style={{ color: "#74859c" }}>{h.sig}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROJETADO × REAL (real vem do op_pedidos do operacional) ─
function AbaProjReal({ lojaId, config, produtos }: { lojaId: string; config: PrecConfig; produtos: PrecProduto[] }) {
  const [real, setReal] = useState<Record<string, RealProduto>>({});
  const [carregando, setCarregando] = useState(true);
  useEffect(() => { realPorProduto(lojaId).then(setReal).catch(() => {}).finally(() => setCarregando(false)); }, [lojaId]);

  if (carregando) return <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Carregando vendas reais...</div>;

  const projGross = margemBrutaProjetada(config.markup); // base markup, país-independente
  const linhas = produtos.map((p) => {
    const r = real[p.nome.trim().toLowerCase()];
    return { prod: p, real: r };
  });
  const comVenda = linhas.filter((l) => l.real && l.real.pedidos > 0);

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-3 text-xs" style={{ background: "#3b82f615", border: "1px solid #3b82f630", color: "#9aa7ba" }}>
        Comparação em <b style={{ color: "#e8edf5" }}>margem bruta</b> (faturamento − custo), por produto, casando pelo nome com os pedidos reais do módulo <b style={{ color: "#e8edf5" }}>Operação</b>. ADS/taxas por produto exigem atribuição (fase futura) — aqui o real não desconta anúncio.
      </div>
      {comVenda.length === 0 && <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Nenhum produto da precificação tem venda real registrada na Operação (casamento por nome). Lance pedidos no módulo Operação com o mesmo nome do produto.</div>}
      {comVenda.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: "#74859c", textAlign: "left" }}>
                <th className="p-2">Produto</th><th className="p-2">Pedidos</th><th className="p-2">Faturamento</th>
                <th className="p-2">Margem bruta projetada</th><th className="p-2">Margem bruta real</th><th className="p-2">Gap</th>
              </tr></thead>
              <tbody>
                {comVenda.map((l) => {
                  const realGross = l.real!.margemBruta;
                  const gap = realGross - projGross;
                  const cor = gap >= -0.05 ? "#10b981" : gap >= -0.15 ? "#f59e0b" : "#ef4444";
                  return (
                    <tr key={l.prod.id} style={{ borderTop: "1px solid #1e3356" }}>
                      <td className="p-2 text-white font-semibold">{l.prod.nome}</td>
                      <td className="p-2" style={{ color: "#9aa7ba" }}>{l.real!.pedidos}</td>
                      <td className="p-2" style={{ color: "#9aa7ba" }}>{fmt$(l.real!.faturamento)}</td>
                      <td className="p-2" style={{ color: "#9aa7ba" }}>{pct(projGross)}</td>
                      <td className="p-2 font-bold" style={{ color: cor }}>{pct(realGross)}</td>
                      <td className="p-2 font-bold" style={{ color: cor }}>{gap >= 0 ? "+" : ""}{(gap * 100).toFixed(1)} pts</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="p-3 text-xs" style={{ color: "#74859c" }}>Verde = real perto/acima do projetado · Vermelho = real bem abaixo (custo subiu, vendeu mais barato, ou reembolso).</p>
        </div>
      )}
    </div>
  );
}

// ─── UNIT ECONOMICS (CAC / LTV / Payback) ─────────────────
function AbaUnit({ lojaId, config }: { lojaId: string; config: PrecConfig }) {
  const [anc, setAnc] = useState<AncoraReal | null>(null);
  const [f, setF] = useState({ ticket: "", margem: String(config.margem_min), cac: "", recompra: "15" });
  useEffect(() => {
    ancoraReal(lojaId).then((a) => {
      setAnc(a);
      setF((cur) => ({ ...cur, ticket: a.ticketMedio > 0 ? a.ticketMedio.toFixed(2) : "", cac: a.cacReal > 0 ? a.cacReal.toFixed(2) : "" }));
    }).catch(() => {});
  }, [lojaId]);

  const ticket = parseFloat(f.ticket) || 0, margem = parseFloat(f.margem) || 0, cac = parseFloat(f.cac) || 0, recompra = parseFloat(f.recompra) || 0;
  const u = unitEconomics(ticket, margem, cac, recompra);
  const cor = (b: boolean) => (b ? "#10b981" : "#ef4444");

  const Card = ({ label, valor, c, sub, tip }: { label: string; valor: string; c: string; sub?: string; tip?: string }) => (
    <div className="rounded-2xl p-4" style={{ background: "linear-gradient(160deg,#14243f,#111e35)", border: `1px solid ${c}30` }}>
      <p className="text-xs flex items-center" style={{ color: "#9aa7ba" }}>{label}{tip && <PrecTip k={tip} />}</p>
      <p className="font-extrabold mt-1" style={{ fontSize: 22, color: c }}>{valor}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {anc && (
        <div className="rounded-xl p-3 text-xs flex items-center flex-wrap gap-x-4 gap-y-1" style={{ background: "#3b82f615", border: "1px solid #3b82f630", color: "#9aa7ba" }}>
          <span>Âncora real (Operação): <b style={{ color: "#e8edf5" }}>{anc.pedidos}</b> pedidos · ticket <b style={{ color: "#e8edf5" }}>{fmt$(anc.ticketMedio)}</b> · CAC real <b style={{ color: "#e8edf5" }}>{fmt$(anc.cacReal)}</b> (ADS÷pedidos)</span>
          <span style={{ color: "#74859c" }}>Sem ID de cliente, recompra é estimativa — ajuste abaixo.</span>
        </div>
      )}
      <div className="rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Ticket médio $</label><input type="number" value={f.ticket} onChange={(e) => setF({ ...f, ticket: e.target.value })} style={inp} /></div>
        <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Margem líquida %</label><input type="number" value={f.margem} onChange={(e) => setF({ ...f, margem: e.target.value })} style={inp} /></div>
        <div><label className="text-xs flex items-center" style={{ color: "#9aa7ba" }}>CAC $<PrecTip k="cac" /></label><input type="number" value={f.cac} onChange={(e) => setF({ ...f, cac: e.target.value })} style={inp} /></div>
        <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Recompra %</label><input type="number" value={f.recompra} onChange={(e) => setF({ ...f, recompra: e.target.value })} style={inp} /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card label="Lucro por compra" valor={fmt$(u.lucroPorCompra)} c="#3b82f6" sub={`${margem}% de ${fmt$(ticket)}`} />
        <Card label="LTV" valor={fmt$(u.ltv)} c="#10b981" sub={`~${u.comprasEsperadas.toFixed(1)} compras/cliente`} tip="ltv" />
        <Card label="Payback" valor={u.lucroPorCompra > 0 ? u.paybackCompras.toFixed(2) + " compras" : "—"} c={cor(u.paybackCompras <= 1 && u.lucroPorCompra > 0)} sub={u.paybackCompras <= 1 ? "recupera na 1ª venda" : "precisa de recompra"} tip="payback" />
        <Card label="Lucro na 1ª compra" valor={fmt$(u.lucro1aCompra)} c={cor(u.lucro1aCompra >= 0)} sub={u.lucro1aCompra >= 0 ? "lucra já na aquisição" : "subsidia a aquisição"} />
        <Card label="LTV : CAC" valor={cac > 0 ? u.ltvCac.toFixed(2) + "×" : "—"} c={cor(u.ltvCac >= 3)} sub={u.ltvCac >= 3 ? "saudável (≥3×)" : u.ltvCac >= 1 ? "ok, espaço pra melhorar" : "ruim (<1×)"} />
        <Card label="CAC" valor={fmt$(cac)} c="#f59e0b" sub="custo por cliente" />
      </div>
      <p className="text-xs" style={{ color: "#74859c" }}>LTV = lucro/compra × compras esperadas (1/(1−recompra)). Payback em nº de compras pra cobrir o CAC. LTV:CAC ≥3 é o alvo saudável.</p>
    </div>
  );
}

// ─── RISCO / CHARGEBACK (do op_pedidos status "disputa") ──
function AbaRisco({ lojaId }: { lojaId: string }) {
  const [r, setR] = useState<RiscoChargeback | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [fee, setFee] = useState("15");
  useEffect(() => { riscoChargeback(lojaId).then(setR).catch(() => {}).finally(() => setCarregando(false)); }, [lojaId]);
  if (carregando) return <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Carregando risco...</div>;
  if (!r || r.total === 0) return <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Sem pedidos na Operação ainda. Marque pedidos com status <b>disputa</b> no operacional pra acompanhar o risco.</div>;

  const taxa = r.taxaDisputa * 100;
  const nivel = taxa < 0.5 ? { c: "#10b981", t: "Saudável", d: "bem abaixo do limite de bloqueio (1%)" } : taxa < 1 ? { c: "#f59e0b", t: "Atenção", d: "aproximando do limite de 1%" } : { c: "#ef4444", t: "Crítico", d: "acima de 1% — risco de bloqueio do gateway!" };
  const feeN = parseFloat(fee) || 0;
  const impactoTotal = r.custoPerdidoDisputa + r.disputas * feeN;

  const Card = ({ label, valor, c, sub }: { label: string; valor: string; c: string; sub?: string }) => (
    <div className="rounded-2xl p-4" style={{ background: "linear-gradient(160deg,#14243f,#111e35)", border: `1px solid ${c}30` }}>
      <p className="text-xs" style={{ color: "#9aa7ba" }}>{label}</p>
      <p className="font-extrabold mt-1" style={{ fontSize: 20, color: c }}>{valor}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Medidor de risco */}
      <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${nivel.c}10, ${nivel.c}03)`, border: `1px solid ${nivel.c}30` }}>
        <p className="text-xs font-bold uppercase tracking-wider flex items-center" style={{ color: "#9aa7ba" }}>Taxa de disputa (chargeback)<PrecTip k="chargeback" /></p>
        <p className="font-extrabold my-1" style={{ fontSize: 40, color: nivel.c, lineHeight: 1 }}>{taxa.toFixed(2)}%</p>
        <p className="text-sm font-bold" style={{ color: nivel.c }}>{nivel.t}</p>
        <p className="text-xs" style={{ color: "#74859c" }}>{nivel.d}</p>
        <div className="mt-3" style={{ height: 8, background: "#1e3356", borderRadius: 99, overflow: "hidden", position: "relative" }}>
          <div style={{ width: `${Math.min(taxa / 2 * 100, 100)}%`, height: "100%", background: nivel.c, borderRadius: 99 }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#ef4444" }} title="limite 1%" />
        </div>
        <p className="text-xs mt-1" style={{ color: "#74859c" }}>Linha vermelha = 1% (limite que bloqueia o gateway)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Pedidos" valor={String(r.total)} c="#3b82f6" />
        <Card label="Disputas" valor={String(r.disputas)} c={nivel.c} sub={`${(r.taxaDisputa * 100).toFixed(2)}%`} />
        <Card label="Reembolsos" valor={String(r.reembolsos)} c="#f59e0b" sub={`${(r.taxaReembolso * 100).toFixed(2)}%`} />
        <Card label="Impacto $" valor={fmt$(impactoTotal)} c="#ef4444" sub="custo perdido + taxas" />
      </div>

      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <span className="text-sm" style={{ color: "#9aa7ba" }}>Taxa do gateway por chargeback ($)</span>
        <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} style={{ ...inp, width: 90 }} />
        <span className="text-xs" style={{ color: "#74859c" }}>cada disputa = custo do produto perdido + esta taxa</span>
      </div>

      {r.porProduto.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="p-3 text-sm font-bold text-white">Disputas por produto</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: "#74859c", textAlign: "left" }}><th className="p-2">Produto</th><th className="p-2">Pedidos</th><th className="p-2">Disputas</th><th className="p-2">Taxa</th></tr></thead>
              <tbody>
                {r.porProduto.map((p, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #1e3356" }}>
                    <td className="p-2 text-white font-semibold">{p.nome}</td>
                    <td className="p-2" style={{ color: "#9aa7ba" }}>{p.pedidos}</td>
                    <td className="p-2" style={{ color: "#9aa7ba" }}>{p.disputas}</td>
                    <td className="p-2 font-bold" style={{ color: p.taxa >= 0.01 ? "#ef4444" : "#f59e0b" }}>{(p.taxa * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="p-3 text-xs" style={{ color: "#74859c" }}>Priorize investigar os produtos no topo — alta disputa pode derrubar a conta toda.</p>
        </div>
      )}
    </div>
  );
}

// ─── LISTA DE ESPERA + handoff pra esteira (catálogo Zustand) ─
function AbaLista({ lojaId, produtos, config, paises, onMudou }: { lojaId: string; produtos: PrecProduto[]; config: PrecConfig; paises: PrecPais[]; onMudou: () => void }) {
  const { criarProdutoEmLojas } = useAppStore();
  const aprovados = produtos.filter((p) => p.status === "aprovado");
  const enviados = produtos.filter((p) => p.status === "enviado");
  const [enviando, setEnviando] = useState<number | null>(null);

  async function enviar(prod: PrecProduto) {
    if (!prod.id) return;
    setEnviando(prod.id);
    try {
      const forns = await listarFornecedores(prod.id);
      const tit = forns.find((f) => f.titular) || forns[0];
      const usPais = paises.find((p) => p.cod === "US") || paises[0];
      const r = tit && usPais ? calcularPreco(tit.custo + tit.frete, usPais.imposto, config, markupDoPais(usPais, config).markup) : null;
      criarProdutoEmLojas({
        nome: prod.nome,
        fornecedorNome: tit?.nome,
        linkFornecedor: tit?.link,
        precoPorUnidade: tit?.custo,
        precoPorFrete: tit?.frete,
        fornecedores: forns.map((f) => ({ nome: f.nome, link: f.link, precoPorUnidade: f.custo, precoPorFrete: f.frete })),
        valorDeVenda: r?.preco,
        margemLucro: r ? +(r.margemReal * 100).toFixed(1) : undefined,
        valorDolarNoDia: config.cambio_usd_brl,
      }, [lojaId]);
      await editarProduto(prod.id, { status: "enviado" });
      onMudou();
    } finally { setEnviando(null); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <p className="text-sm font-bold text-white mb-3">Aprovados — aguardando ir pra esteira ({aprovados.length})</p>
        {aprovados.length === 0 && <p className="text-sm" style={{ color: "#74859c" }}>Nenhum produto aprovado. Aprove na aba <b>Decisão</b>.</p>}
        <div className="space-y-2">
          {aprovados.map((p) => (
            <div key={p.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#0f1c30", border: "1px solid #1e3356" }}>
              <div className="flex-1">
                <p className="text-sm text-white font-semibold">{p.nome}</p>
                <p className="text-xs" style={{ color: "#74859c" }}>Garimpo {p.nota_garimpo ?? "—"} · aprovado</p>
              </div>
              <button onClick={() => enviar(p)} disabled={enviando === p.id} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>
                <Send size={13} /> {enviando === p.id ? "Enviando..." : "Enviar pra esteira"}
              </button>
            </div>
          ))}
        </div>
      </div>
      {enviados.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-sm font-bold text-white mb-2">Enviados pro catálogo ({enviados.length})</p>
          {enviados.map((p) => <p key={p.id} className="text-sm py-1" style={{ color: "#9aa7ba" }}>✓ {p.nome}</p>)}
          <p className="text-xs mt-2" style={{ color: "#74859c" }}>Esses produtos já entraram no catálogo/kanban da loja pra começar os testes.</p>
        </div>
      )}
    </div>
  );
}

// ─── PAÍSES ────────────────────────────────────────────────
function AbaPaises({ lojaId, paises, onMudou }: { lojaId: string; paises: PrecPais[]; onMudou: () => void }) {
  const [edit, setEdit] = useState<Record<number, PrecPais>>({});
  async function salvar(p: PrecPais) { await salvarPais(p); onMudou(); }
  async function excluir(id: number) { await deletarPais(id); onMudou(); }
  async function adicionar() { await salvarPais({ loja_id: lojaId, cod: "XX", nome: "Novo país", moeda: "USD", cambio: 1, imposto: 0, tier: "B" }); onMudou(); }

  return (
    <div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-white flex items-center">Mercados<PrecTip k="tier" /></p>
        <button onClick={adicionar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "#c9a84c", color: "#0b1624" }}><Plus size={12} /> País</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr style={{ color: "#74859c", textAlign: "left" }}><th className="p-2">Cód</th><th className="p-2">Nome</th><th className="p-2">Moeda</th><th className="p-2">Câmbio</th><th className="p-2">Imposto %</th><th className="p-2">Duty %</th><th className="p-2">Tier</th><th className="p-2"></th></tr></thead>
          <tbody>
            {paises.map((pa) => {
              const e = edit[pa.id!] || pa;
              const set = (patch: Partial<PrecPais>) => setEdit({ ...edit, [pa.id!]: { ...e, ...patch } });
              const mudou = JSON.stringify(e) !== JSON.stringify(pa);
              return (
                <tr key={pa.id} style={{ borderTop: "1px solid #1e3356" }}>
                  <td className="p-1"><input value={e.cod} onChange={(ev) => set({ cod: ev.target.value })} style={{ ...inp, width: 52, padding: "4px 6px" }} /></td>
                  <td className="p-1"><input value={e.nome} onChange={(ev) => set({ nome: ev.target.value })} style={{ ...inp, padding: "4px 6px" }} /></td>
                  <td className="p-1"><input value={e.moeda} onChange={(ev) => set({ moeda: ev.target.value })} style={{ ...inp, width: 60, padding: "4px 6px" }} /></td>
                  <td className="p-1"><input type="number" value={e.cambio} onChange={(ev) => set({ cambio: parseFloat(ev.target.value) || 0 })} style={{ ...inp, width: 70, padding: "4px 6px" }} /></td>
                  <td className="p-1"><input type="number" value={e.imposto} onChange={(ev) => set({ imposto: parseFloat(ev.target.value) || 0 })} style={{ ...inp, width: 56, padding: "4px 6px" }} /></td>
                  <td className="p-1"><input type="number" value={e.duty ?? 0} onChange={(ev) => set({ duty: parseFloat(ev.target.value) || 0 })} style={{ ...inp, width: 56, padding: "4px 6px" }} /></td>
                  <td className="p-1"><select value={e.tier} onChange={(ev) => set({ tier: ev.target.value })} style={{ ...inp, width: 54, padding: "4px 6px" }}><option>A</option><option>B</option></select></td>
                  <td className="p-1 flex gap-1">
                    {mudou && <button onClick={() => salvar(e)} className="px-2 py-1 rounded text-xs font-bold" style={{ background: "#10b98120", color: "#10b981" }}>Salvar</button>}
                    <button onClick={() => excluir(pa.id!)} style={{ color: "#74859c" }}><Trash2 size={13} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAXAS (config) ────────────────────────────────────────
function AbaTaxas({ config, onSalvar }: { config: PrecConfig; onSalvar: (c: PrecConfig) => Promise<void> }) {
  const [c, setC] = useState<PrecConfig>(config);
  const [salvando, setSalvando] = useState(false);
  const num = { ...inp, width: 90, textAlign: "right" as const, fontWeight: 700 };
  const Row = ({ label, campo, un, tip }: { label: string; campo: keyof PrecConfig; un: string; tip?: string }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #1e3356" }}>
      <span className="text-sm text-white flex items-center">{label}{tip && <PrecTip k={tip} />}</span>
      <div className="flex items-center gap-1"><input type="number" step="0.1" value={String(c[campo])} onChange={(e) => setC({ ...c, [campo]: parseFloat(e.target.value) || 0 })} style={num} /><span style={{ color: "#74859c", fontSize: 13 }}>{un}</span></div>
    </div>
  );
  return (
    <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
      <p className="text-sm font-bold text-white mb-2">Taxas e parâmetros desta loja</p>
      <Row label="Markup padrão" campo="markup" un="×" tip="markup" />
      <Row label="Gateway de pagamento" campo="gateway_fee" un="%" />
      <Row label="Taxa Shopify" campo="shopify_fee" un="%" />
      <Row label="Reembolso" campo="reembolso" un="%" tip="reembolso" />
      <Row label="Verba de marketing" campo="mkt" un="%" />
      <Row label="Margem mínima" campo="margem_min" un="%" tip="margem_real" />
      <Row label="Câmbio USD→BRL (fallback)" campo="cambio_usd_brl" un="R$" />
      <button onClick={async () => { setSalvando(true); try { await onSalvar(c); } finally { setSalvando(false); } }} disabled={salvando} className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>{salvando ? "Salvando..." : "Salvar"}</button>
    </div>
  );
}
