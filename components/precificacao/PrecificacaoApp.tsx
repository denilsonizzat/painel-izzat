"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { supabaseConfigurado } from "@/lib/supabase";
import { PrecTip } from "./PrecTip";
import {
  PrecConfig, PrecPais, PrecProduto, PrecFornecedor, PrecCusto,
  obterConfig, salvarConfig, listarPaises, seedPaises, salvarPais, deletarPais,
  listarProdutos, criarProduto, editarProduto, deletarProduto,
  listarFornecedores, salvarFornecedores, listarCustos, salvarCustos,
  calcularPreco, markupDoPais, scorePreco, veredito, calcularOfertas,
  CRITERIOS_GARIMPO, notaGarimpo, CONFIG_PADRAO,
} from "@/lib/precificacao";
import { Target, Calculator, ListChecks, Clock, Globe, Settings, Plus, Trash2, Send } from "lucide-react";

const fmt$ = (n: number) => "$" + (n || 0).toFixed(2);
const pct = (n: number) => (n * 100).toFixed(1) + "%";
const COR_VEREDITO: Record<string, string> = { "LANÇAR": "#10b981", "TESTAR": "#f59e0b", "NÃO LANÇAR": "#ef4444" };
const inp = { background: "#1e3356", border: "1px solid #334155", color: "#e8edf5", borderRadius: 9, padding: "8px 10px", width: "100%", outline: "none", fontSize: 13 } as React.CSSProperties;

type Aba = "avaliar" | "motor" | "decisao" | "lista" | "paises" | "taxas";

export default function PrecificacaoApp({ lojaId, lojaNome }: { lojaId: string; lojaNome: string }) {
  const [aba, setAba] = useState<Aba>("avaliar");
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
    { id: "avaliar", label: "Avaliar", icon: Target },
    { id: "motor", label: "Motor de Preços", icon: Calculator },
    { id: "decisao", label: "Decisão", icon: ListChecks },
    { id: "lista", label: "Lista de espera", icon: Clock },
    { id: "paises", label: "Países", icon: Globe },
    { id: "taxas", label: "Taxas", icon: Settings },
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
          {aba === "avaliar" && <AbaAvaliar lojaId={lojaId} onCriou={() => { carregar(); setAba("motor"); }} />}
          {aba === "motor" && <AbaMotor lojaId={lojaId} config={config} paises={paises} produtos={produtos} onMudou={carregar} />}
          {aba === "decisao" && <AbaDecisao config={config} paises={paises} produtos={produtos} onMudou={carregar} />}
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
        <p className="text-center font-extrabold" style={{ fontSize: 56, color: cor, lineHeight: 1 }}>{nota}</p>
        <p className="text-center"><span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: cor + "20", color: cor }}>{vd}</span></p>
        <div className="space-y-2">
          {([["m", "Mercado", subgrupos.m], ["p", "Produto", subgrupos.p], ["v", "Viabilidade", subgrupos.v]] as const).map(([k, lbl, v]) => (
            <div key={k}>
              <div className="flex justify-between text-xs mb-1"><span style={{ color: "#9aa7ba" }}>{lbl}</span><span style={{ color: "#e8edf5", fontWeight: 700 }}>{v}</span></div>
              <div style={{ height: 6, background: "#1e3356", borderRadius: 99 }}><div style={{ width: `${v}%`, height: "100%", background: v >= 70 ? "#10b981" : v >= 45 ? "#f59e0b" : "#ef4444", borderRadius: 99 }} /></div>
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
        <div className="p-3 text-sm font-bold text-white">Preço por mercado (custo por país; vazio usa o titular)</div>
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
                const { markup, ajustado } = markupDoPais(pa, config);
                const r = calcularPreco(ct, pa.imposto, config, markup);
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
        for (const pa of paises) {
          const cu = custos.find((c) => c.pais_cod === pa.cod);
          const ct = cu ? cu.custo_produto + cu.frete : custoTit;
          if (ct <= 0) continue;
          const { markup } = markupDoPais(pa, config);
          const r = calcularPreco(ct, pa.imposto, config, markup);
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
          <thead><tr style={{ color: "#74859c", textAlign: "left" }}><th className="p-2">Cód</th><th className="p-2">Nome</th><th className="p-2">Moeda</th><th className="p-2">Câmbio</th><th className="p-2">Imposto %</th><th className="p-2">Tier</th><th className="p-2"></th></tr></thead>
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
                  <td className="p-1"><input type="number" value={e.imposto} onChange={(ev) => set({ imposto: parseFloat(ev.target.value) || 0 })} style={{ ...inp, width: 60, padding: "4px 6px" }} /></td>
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
