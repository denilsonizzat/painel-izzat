"use client";
// Módulo Precificação — camada de dados (Supabase) + motor de cálculo.
// Fórmulas validadas contra o gabarito: US 1un preço $82.50 / margem 35% / CPA $50.88 / BEROAS 1.62.
import { supabase } from "./supabase";

// ─── Tipos (espelham o schema prec_*) ──────────────────────
export interface PrecConfig {
  loja_id: string;
  markup: number; gateway_fee: number; shopify_fee: number;
  reembolso: number; mkt: number; margem_min: number; cambio_usd_brl: number;
}
export interface PrecPais {
  id?: number; loja_id: string; cod: string; nome: string;
  moeda: string; cambio: number; imposto: number; tier: string; markup_override?: number | null;
  duty?: number; // imposto de importação (% do custo)
}
export type StatusProduto = "avaliando" | "aprovado" | "lista_espera" | "enviado";
export interface PrecProduto {
  id?: number; loja_id: string; nome: string;
  nota_garimpo?: number | null; garimpo?: Record<string, number> | null;
  status: StatusProduto; criado_em?: string;
}
export interface PrecFornecedor {
  id?: number; produto_id: number; nome: string; link?: string;
  custo: number; frete: number; prazo: number; titular: boolean;
}
export interface PrecCusto {
  id?: number; produto_id: number; pais_cod: string; custo_produto: number; frete: number;
}

export const CONFIG_PADRAO: Omit<PrecConfig, "loja_id"> = {
  markup: 3.0, gateway_fee: 3.0, shopify_fee: 2.0, reembolso: 5.0, mkt: 25.0, margem_min: 20.0, cambio_usd_brl: 5.40,
};

// 10 mercados-semente (Tier A foco / Tier B possível)
export const PAISES_SEED: Omit<PrecPais, "id" | "loja_id">[] = [
  { cod: "US", nome: "Estados Unidos", moeda: "USD", cambio: 1.0, imposto: 0, tier: "A" },
  { cod: "CA", nome: "Canadá", moeda: "CAD", cambio: 1.40, imposto: 13, tier: "A" },
  { cod: "UK", nome: "Reino Unido", moeda: "GBP", cambio: 0.79, imposto: 20, tier: "A" },
  { cod: "AU", nome: "Austrália", moeda: "AUD", cambio: 1.55, imposto: 10, tier: "A" },
  { cod: "IE", nome: "Irlanda", moeda: "EUR", cambio: 0.92, imposto: 23, tier: "A" },
  { cod: "SG", nome: "Singapura", moeda: "SGD", cambio: 1.35, imposto: 9, tier: "B" },
  { cod: "HK", nome: "Hong Kong", moeda: "HKD", cambio: 7.80, imposto: 0, tier: "B" },
  { cod: "UAE", nome: "Emirados", moeda: "AED", cambio: 3.67, imposto: 5, tier: "B" },
  { cod: "SA", nome: "Arábia Saudita", moeda: "SAR", cambio: 3.75, imposto: 15, tier: "B" },
  { cod: "JP", nome: "Japão", moeda: "JPY", cambio: 155, imposto: 10, tier: "B" },
];

// ═══════════════ MOTOR DE CÁLCULO (puro, sem DB) ═══════════════
// margem real = 1 − taxas − mkt − imposto − (1 + reembolso)/markup   (frações)
export interface ResultadoPreco {
  custoTotal: number; markup: number; preco: number;
  margemReal: number; lucro: number; cpaMax: number; beroas: number;
  taxas: number; mkt: number; imposto: number; reembolso: number;
}

// opts: duty = imposto de importação (% do custo, absorvido por você); reembolso = % efetivo (override do prazo)
export interface OpcoesPreco { duty?: number; reembolso?: number }
export function calcularPreco(custoTotal: number, imposto: number, cfg: PrecConfig, markupForcado?: number, opts?: OpcoesPreco): ResultadoPreco {
  const taxas = (cfg.gateway_fee + cfg.shopify_fee) / 100;
  const mkt = cfg.mkt / 100;
  const imp = imposto / 100;
  const reemb = (opts?.reembolso ?? cfg.reembolso) / 100;
  const duty = (opts?.duty ?? 0) / 100;
  const markup = markupForcado ?? cfg.markup;
  const preco = custoTotal * markup;
  // duty e reembolso são % do custo → entram como (duty+reemb)/markup junto com o custo (1/markup)
  const margemReal = 1 - taxas - mkt - imp - (1 + reemb + duty) / markup;
  const lucro = preco * margemReal;
  const cpaMax = preco * (1 - taxas) - custoTotal * (1 + duty);
  const beroas = cpaMax > 0 ? preco / cpaMax : 0;
  return { custoTotal, markup, preco, margemReal, lucro, cpaMax, beroas, taxas, mkt, imposto: imp, reembolso: reemb };
}

// Reembolso efetivo cresce com o prazo de entrega (prazo longo = mais devolução/chargeback)
export function reembolsoPorPrazo(base: number, prazoDias: number): number {
  if (!prazoDias || prazoDias <= 10) return base;
  if (prazoDias <= 20) return base + 3;
  if (prazoDias <= 30) return base + 8;
  return base + 15;
}

// Markup sugerido pra bater a margem mínima: markup = (1+reemb+duty)/((1−taxas−mkt) − imposto − margemAlvo)
export function markupSugerido(imposto: number, cfg: PrecConfig, opts?: OpcoesPreco): number {
  const taxas = (cfg.gateway_fee + cfg.shopify_fee) / 100;
  const mkt = cfg.mkt / 100;
  const reemb = (opts?.reembolso ?? cfg.reembolso) / 100;
  const duty = (opts?.duty ?? 0) / 100;
  const denom = (1 - taxas - mkt) - imposto / 100 - cfg.margem_min / 100;
  if (denom <= 0.01) return 0; // inviável
  return (1 + reemb + duty) / denom;
}

// Markup efetivo do país: override > sugerido (se base não bate a margem) > base
export function markupDoPais(pais: PrecPais, cfg: PrecConfig, opts?: OpcoesPreco): { markup: number; ajustado: boolean } {
  if (pais.markup_override && pais.markup_override > 0) return { markup: pais.markup_override, ajustado: true };
  const base = calcularPreco(1, pais.imposto, cfg, undefined, opts).margemReal;
  if (base >= cfg.margem_min / 100) return { markup: cfg.markup, ajustado: false };
  const sug = markupSugerido(pais.imposto, cfg, opts);
  return sug > 0 ? { markup: sug, ajustado: true } : { markup: cfg.markup, ajustado: false };
}

export function scorePreco(r: ResultadoPreco, cfg: PrecConfig): number {
  let s = Math.min(r.cpaMax / 50, 1) * 70 + 30;
  if (r.margemReal < cfg.margem_min / 100) s *= 0.5;
  return Math.round(s);
}
export type Veredito = "LANÇAR" | "TESTAR" | "NÃO LANÇAR";
export function veredito(r: ResultadoPreco, score: number, cfg: PrecConfig): Veredito {
  if (r.cpaMax < 10 || r.margemReal < cfg.margem_min / 100) return "NÃO LANÇAR";
  if (score >= 70 && r.cpaMax >= 25) return "LANÇAR";
  return "TESTAR";
}

// Ofertas: 1un (markup), 2un (markup), Kit 3+1 (paga 3 leva 4 → markup efetivo menor)
export interface Oferta { nome: string; preco: number; markupEfetivo: number; margemReal: number; lucro: number; }
export function calcularOfertas(custoUnit: number, imposto: number, cfg: PrecConfig, markup: number): Oferta[] {
  const um = calcularPreco(custoUnit, imposto, cfg, markup);
  const dois = calcularPreco(custoUnit * 2, imposto, cfg, markup);
  // Kit 3+1: preço = 3 × preço unitário; custo interno = 4 unidades
  const precoKit = um.preco * 3;
  const custoKit = custoUnit * 4;
  const markupKit = precoKit / custoKit;
  const kit = calcularPreco(custoKit, imposto, cfg, markupKit);
  return [
    { nome: "1 unidade", preco: um.preco, markupEfetivo: markup, margemReal: um.margemReal, lucro: um.lucro },
    { nome: "2 unidades", preco: dois.preco, markupEfetivo: markup, margemReal: dois.margemReal, lucro: dois.lucro },
    { nome: "Kit 3+1", preco: precoKit, markupEfetivo: markupKit, margemReal: kit.margemReal, lucro: kit.lucro },
  ];
}

// ─── NOTA DE GARIMPO (10 critérios ponderados) ─────────────
export interface CriterioGarimpo { key: string; grupo: "m" | "p" | "v"; label: string; peso: number; sub: string; opcoes: { txt: string; v: number }[]; }
export const CRITERIOS_GARIMPO: CriterioGarimpo[] = [
  { key: "saturacao", grupo: "m", peso: 1.5, label: "Saturação / concorrência", sub: "quantas lojas já vendem?", opcoes: [{ txt: "Muitas", v: 2 }, { txt: "Algumas", v: 6 }, { txt: "Poucas", v: 10 }] },
  { key: "tendencia", grupo: "m", peso: 1.5, label: "Tendência de demanda", sub: "subindo ou caindo?", opcoes: [{ txt: "Caindo", v: 2 }, { txt: "Estável", v: 6 }, { txt: "Subindo", v: 10 }] },
  { key: "sazonalidade", grupo: "m", peso: 0.5, label: "Sazonalidade", sub: "ano todo ou época?", opcoes: [{ txt: "Sazonal", v: 4 }, { txt: "Picos", v: 7 }, { txt: "Ano todo", v: 10 }] },
  { key: "wow", grupo: "p", peso: 1.5, label: "Fator wow", sub: "para o dedo no feed?", opcoes: [{ txt: "Comum", v: 2 }, { txt: "Interessante", v: 6 }, { txt: "Para o dedo", v: 10 }] },
  { key: "problema", grupo: "p", peso: 1.2, label: "Resolve um problema", sub: "dor ou desejo real?", opcoes: [{ txt: "Não muito", v: 3 }, { txt: "Mais ou menos", v: 6 }, { txt: "Dor real", v: 10 }] },
  { key: "lojafisica", grupo: "p", peso: 0.8, label: "Acha em loja física?", sub: "fácil = guerra de preço", opcoes: [{ txt: "Fácil", v: 3 }, { txt: "Às vezes", v: 6 }, { txt: "Difícil", v: 10 }] },
  { key: "margem", grupo: "v", peso: 1.5, label: "Margem potencial", sub: "custo baixo vs preço percebido?", opcoes: [{ txt: "Apertada", v: 2 }, { txt: "Ok", v: 6 }, { txt: "Folgada 3×+", v: 10 }] },
  { key: "criativo", grupo: "v", peso: 1.0, label: "Potencial de criativo", sub: "dá vídeo chamativo?", opcoes: [{ txt: "Difícil", v: 3 }, { txt: "Médio", v: 6 }, { txt: "Ótimo", v: 10 }] },
  { key: "frete", grupo: "v", peso: 0.8, label: "Frete (tamanho/peso)", sub: "leve e pequeno é melhor", opcoes: [{ txt: "Grande/frágil", v: 3 }, { txt: "Médio", v: 6 }, { txt: "Leve", v: 10 }] },
  { key: "risco", grupo: "v", peso: 0.7, label: "Restrições / risco", sub: "bateria, líquido, marca?", opcoes: [{ txt: "Tem risco", v: 2 }, { txt: "Algum", v: 6 }, { txt: "Sem risco", v: 10 }] },
];
export function notaGarimpo(respostas: Record<string, number>): { nota: number; subgrupos: Record<string, number>; veredito: string } {
  let raw = 0, wmax = 0;
  const grp: Record<string, [number, number]> = { m: [0, 0], p: [0, 0], v: [0, 0] };
  for (const c of CRITERIOS_GARIMPO) {
    const v = respostas[c.key] ?? 6;
    raw += v * c.peso; wmax += c.peso * 10;
    grp[c.grupo][0] += v * c.peso; grp[c.grupo][1] += c.peso * 10;
  }
  const nota = Math.round((raw / wmax) * 100);
  const subgrupos = { m: Math.round(grp.m[0] / grp.m[1] * 100), p: Math.round(grp.p[0] / grp.p[1] * 100), v: Math.round(grp.v[0] / grp.v[1] * 100) };
  const vd = nota >= 70 ? "GARIMPAR" : nota >= 45 ? "TALVEZ" : "DESCARTAR";
  return { nota, subgrupos, veredito: vd };
}

// ─── PROJETADO × REAL ──────────────────────────────────────
// Real vem do op_pedidos (módulo Operação). Match por nome do produto (texto).
// Comparação em MARGEM BRUTA (faturamento − custo) — base justa, sem ADS (ADS é por loja, não por produto).
export interface RealProduto {
  nome: string; pedidos: number; faturamento: number; custo: number;
  ticketMedio: number; margemBruta: number; lucroBruto: number;
}
export async function realPorProduto(lojaId: string): Promise<Record<string, RealProduto>> {
  const { data, error } = await supabase.from("op_pedidos")
    .select("produto,faturamento,custo_produto,frete,status").eq("loja_id", lojaId);
  if (error) throw error;
  const mapa: Record<string, RealProduto> = {};
  (data || []).forEach((p: { produto?: string; faturamento: number; custo_produto: number; frete: number; status: string }) => {
    const nome = (p.produto || "").trim();
    if (!nome) return;
    const chave = nome.toLowerCase();
    if (!mapa[chave]) mapa[chave] = { nome, pedidos: 0, faturamento: 0, custo: 0, ticketMedio: 0, margemBruta: 0, lucroBruto: 0 };
    const reemb = p.status === "reembolso";
    mapa[chave].pedidos += 1;
    mapa[chave].faturamento += reemb ? 0 : (p.faturamento || 0);
    mapa[chave].custo += (p.custo_produto || 0) + (p.frete || 0);
  });
  Object.values(mapa).forEach((r) => {
    r.ticketMedio = r.pedidos > 0 ? r.faturamento / r.pedidos : 0;
    r.lucroBruto = r.faturamento - r.custo;
    r.margemBruta = r.faturamento > 0 ? r.lucroBruto / r.faturamento : 0;
  });
  return mapa;
}
// Margem bruta projetada (país-independente): (markup − 1) / markup
export function margemBrutaProjetada(markup: number): number {
  return markup > 0 ? (markup - 1) / markup : 0;
}

// ═══════════════ CRUD Supabase ═══════════════
export async function obterConfig(lojaId: string): Promise<PrecConfig> {
  const { data, error } = await supabase.from("prec_config").select("*").eq("loja_id", lojaId).maybeSingle();
  if (error) throw error;
  return data || { loja_id: lojaId, ...CONFIG_PADRAO };
}
export async function salvarConfig(c: PrecConfig) {
  const { error } = await supabase.from("prec_config").upsert(c); if (error) throw error;
}
export async function listarPaises(lojaId: string): Promise<PrecPais[]> {
  const { data, error } = await supabase.from("prec_paises").select("*").eq("loja_id", lojaId).order("tier").order("nome");
  if (error) throw error;
  return data || [];
}
export async function seedPaises(lojaId: string) {
  const linhas = PAISES_SEED.map((p) => ({ ...p, loja_id: lojaId }));
  const { error } = await supabase.from("prec_paises").insert(linhas); if (error) throw error;
}
export async function salvarPais(p: PrecPais) {
  const { error } = await supabase.from("prec_paises").upsert(p); if (error) throw error;
}
export async function deletarPais(id: number) {
  const { error } = await supabase.from("prec_paises").delete().eq("id", id); if (error) throw error;
}
export async function listarProdutos(lojaId: string): Promise<PrecProduto[]> {
  const { data, error } = await supabase.from("prec_produtos").select("*").eq("loja_id", lojaId).order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function criarProduto(p: Omit<PrecProduto, "id" | "criado_em">): Promise<PrecProduto> {
  const { data, error } = await supabase.from("prec_produtos").insert(p).select().single(); if (error) throw error; return data;
}
export async function editarProduto(id: number, updates: Partial<PrecProduto>) {
  const { error } = await supabase.from("prec_produtos").update(updates).eq("id", id); if (error) throw error;
}
export async function deletarProduto(id: number) {
  const { error } = await supabase.from("prec_produtos").delete().eq("id", id); if (error) throw error;
}
export async function listarFornecedores(produtoId: number): Promise<PrecFornecedor[]> {
  const { data, error } = await supabase.from("prec_fornecedores_prod").select("*").eq("produto_id", produtoId).order("id");
  if (error) throw error; return data || [];
}
export async function salvarFornecedores(produtoId: number, forns: Omit<PrecFornecedor, "id" | "produto_id">[]) {
  await supabase.from("prec_fornecedores_prod").delete().eq("produto_id", produtoId);
  if (forns.length) {
    const { error } = await supabase.from("prec_fornecedores_prod").insert(forns.map((f) => ({ ...f, produto_id: produtoId })));
    if (error) throw error;
  }
}
export async function listarCustos(produtoId: number): Promise<PrecCusto[]> {
  const { data, error } = await supabase.from("prec_custos").select("*").eq("produto_id", produtoId);
  if (error) throw error; return data || [];
}
export async function salvarCustos(produtoId: number, custos: Omit<PrecCusto, "id" | "produto_id">[]) {
  await supabase.from("prec_custos").delete().eq("produto_id", produtoId);
  if (custos.length) {
    const { error } = await supabase.from("prec_custos").insert(custos.map((c) => ({ ...c, produto_id: produtoId })));
    if (error) throw error;
  }
}
