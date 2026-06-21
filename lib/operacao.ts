"use client";
// Camada de dados do módulo Operação — fala com o Supabase.
import { supabase, OpPedido, OpAds, OpConfig } from "./supabase";

export type { OpPedido, OpAds, OpConfig };

const CONFIG_PADRAO: Omit<OpConfig, "loja_id"> = {
  gateway_fee: 2.9, shopify_fee: 0.5, imposto: 6.0, ads_budget: 30, margem_alvo: 20,
};

// Intervalo [primeiro, último] dia do mês (último dia varia: 28/29/30/31)
function intervaloMes(mes: number, ano: number): [string, string] {
  const mm = String(mes).padStart(2, "0");
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return [`${ano}-${mm}-01`, `${ano}-${mm}-${String(ultimoDia).padStart(2, "0")}`];
}

// ─── PEDIDOS ───────────────────────────────────────────────
export async function listarPedidos(lojaId: string, mes: number, ano: number): Promise<OpPedido[]> {
  const [ini, fim] = intervaloMes(mes, ano);
  const { data, error } = await supabase
    .from("op_pedidos").select("*")
    .eq("loja_id", lojaId).gte("data", ini).lte("data", fim)
    .order("data", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function criarPedido(p: Omit<OpPedido, "id" | "criado_em">) {
  const { error } = await supabase.from("op_pedidos").insert(p);
  if (error) throw error;
}
export async function editarPedido(id: number, updates: Partial<OpPedido>) {
  const { error } = await supabase.from("op_pedidos").update(updates).eq("id", id);
  if (error) throw error;
}
export async function deletarPedido(id: number) {
  const { error } = await supabase.from("op_pedidos").delete().eq("id", id);
  if (error) throw error;
}

// ─── ADS ───────────────────────────────────────────────────
export async function listarAds(lojaId: string, mes: number, ano: number): Promise<OpAds[]> {
  const [ini, fim] = intervaloMes(mes, ano);
  const { data, error } = await supabase
    .from("op_ads").select("*")
    .eq("loja_id", lojaId).gte("data", ini).lte("data", fim)
    .order("data", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function criarAds(a: Omit<OpAds, "id" | "criado_em">) {
  const { error } = await supabase.from("op_ads").insert(a);
  if (error) throw error;
}
export async function editarAds(id: number, updates: Partial<OpAds>) {
  const { error } = await supabase.from("op_ads").update(updates).eq("id", id);
  if (error) throw error;
}
export async function deletarAds(id: number) {
  const { error } = await supabase.from("op_ads").delete().eq("id", id);
  if (error) throw error;
}

// ─── METAS ─────────────────────────────────────────────────
export interface OpMeta {
  loja_id: string; mes: number; ano: number;
  meta_faturamento: number; meta_lucro: number; meta_pedidos: number;
}
export async function obterMeta(lojaId: string, mes: number, ano: number): Promise<OpMeta> {
  const { data, error } = await supabase.from("op_metas").select("*")
    .eq("loja_id", lojaId).eq("mes", mes).eq("ano", ano).maybeSingle();
  if (error) throw error;
  return data || { loja_id: lojaId, mes, ano, meta_faturamento: 0, meta_lucro: 0, meta_pedidos: 0 };
}
export async function salvarMeta(m: OpMeta) {
  const { error } = await supabase.from("op_metas").upsert(m);
  if (error) throw error;
}

// ─── RESUMO ANUAL (12 meses) ───────────────────────────────
export interface MesResumo {
  mes: number; faturamento: number; custo: number; ads: number; lucro: number; pedidos: number; meta: number;
}
export async function listarAnoResumo(lojaId: string, ano: number): Promise<MesResumo[]> {
  const ini = `${ano}-01-01`, fim = `${ano}-12-31`;
  const [pRes, aRes, mRes] = await Promise.all([
    supabase.from("op_pedidos").select("data,custo_produto,frete,faturamento,status").eq("loja_id", lojaId).gte("data", ini).lte("data", fim),
    supabase.from("op_ads").select("data,valor").eq("loja_id", lojaId).gte("data", ini).lte("data", fim),
    supabase.from("op_metas").select("mes,meta_faturamento").eq("loja_id", lojaId).eq("ano", ano),
  ]);
  if (pRes.error) throw pRes.error;
  if (aRes.error) throw aRes.error;
  const metasMap: Record<number, number> = {};
  (mRes.data || []).forEach((m: { mes: number; meta_faturamento: number }) => { metasMap[m.mes] = m.meta_faturamento; });
  const meses: MesResumo[] = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1, faturamento: 0, custo: 0, ads: 0, lucro: 0, pedidos: 0, meta: metasMap[i + 1] || 0,
  }));
  (pRes.data || []).forEach((p: { data: string; custo_produto: number; frete: number; faturamento: number; status: string }) => {
    const m = parseInt(p.data.slice(5, 7), 10) - 1;
    if (m < 0 || m > 11) return;
    const c = (p.custo_produto || 0) + (p.frete || 0);
    meses[m].custo += c;
    meses[m].faturamento += p.status === "reembolso" ? 0 : (p.faturamento || 0);
    meses[m].pedidos += 1;
  });
  (aRes.data || []).forEach((a: { data: string; valor: number }) => {
    const m = parseInt(a.data.slice(5, 7), 10) - 1;
    if (m >= 0 && m <= 11) meses[m].ads += a.valor || 0;
  });
  meses.forEach((m) => { m.lucro = m.faturamento - m.custo - m.ads; });
  return meses;
}

// ─── CONFIG ────────────────────────────────────────────────
export async function obterConfig(lojaId: string): Promise<OpConfig> {
  const { data, error } = await supabase.from("op_config").select("*").eq("loja_id", lojaId).maybeSingle();
  if (error) throw error;
  return data || { loja_id: lojaId, ...CONFIG_PADRAO };
}
export async function salvarConfig(c: OpConfig) {
  const { error } = await supabase.from("op_config").upsert(c);
  if (error) throw error;
}

// ─── CÁLCULOS (KPIs + P&L) ─────────────────────────────────
export interface KpisOperacao {
  faturamento: number; custo: number; ads: number;
  lucroBruto: number; pedidos: number; ticketMedio: number;
  margem: number; roas: number; cac: number;
  // P&L real (após taxas)
  gateway: number; taxaShopify: number; imposto: number; taxasTotal: number;
  lucroReal: number; margemReal: number;
}

// ─── SÉRIES PARA GRÁFICOS ──────────────────────────────────
export interface DiaSerie {
  dia: number; rotulo: string; faturamento: number; custo: number; ads: number; lucro: number; pedidos: number;
}
export function serieDiaria(pedidos: OpPedido[], ads: OpAds[], mes: number, ano: number): DiaSerie[] {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dias: DiaSerie[] = [];
  for (let d = 1; d <= ultimoDia; d++) {
    dias.push({ dia: d, rotulo: String(d).padStart(2, "0"), faturamento: 0, custo: 0, ads: 0, lucro: 0, pedidos: 0 });
  }
  for (const p of pedidos) {
    const d = parseInt(p.data.slice(8, 10), 10);
    const slot = dias[d - 1];
    if (!slot) continue;
    const reembolso = p.status === "reembolso";
    const c = (p.custo_produto || 0) + (p.frete || 0);
    slot.custo += c;
    slot.faturamento += reembolso ? 0 : (p.faturamento || 0);
    slot.pedidos += 1;
  }
  for (const a of ads) {
    const d = parseInt(a.data.slice(8, 10), 10);
    const slot = dias[d - 1];
    if (slot) slot.ads += a.valor || 0;
  }
  for (const s of dias) s.lucro = s.faturamento - s.custo - s.ads;
  return dias;
}

export interface SemanaSerie {
  semana: number; periodo: string; faturamento: number; custo: number; ads: number; lucro: number; pedidos: number;
}
export function serieSemanal(dias: DiaSerie[]): SemanaSerie[] {
  const faixas = [[1, 7], [8, 14], [15, 21], [22, 31]];
  return faixas.map(([ini, fim], i) => {
    const ds = dias.filter((d) => d.dia >= ini && d.dia <= fim);
    return {
      semana: i + 1, periodo: `${ini}–${Math.min(fim, dias.length)}`,
      faturamento: ds.reduce((s, d) => s + d.faturamento, 0),
      custo: ds.reduce((s, d) => s + d.custo, 0),
      ads: ds.reduce((s, d) => s + d.ads, 0),
      lucro: ds.reduce((s, d) => s + d.lucro, 0),
      pedidos: ds.reduce((s, d) => s + d.pedidos, 0),
    };
  });
}

export interface FornecedorSerie {
  nome: string; faturamento: number; custo: number; lucro: number; pedidos: number; margem: number;
}
export function serieFornecedor(pedidos: OpPedido[]): FornecedorSerie[] {
  const mapa: Record<string, FornecedorSerie> = {};
  for (const p of pedidos) {
    const nome = p.fornecedor || "—";
    if (!mapa[nome]) mapa[nome] = { nome, faturamento: 0, custo: 0, lucro: 0, pedidos: 0, margem: 0 };
    const reembolso = p.status === "reembolso";
    const c = (p.custo_produto || 0) + (p.frete || 0);
    const rev = reembolso ? 0 : (p.faturamento || 0);
    mapa[nome].faturamento += rev;
    mapa[nome].custo += c;
    mapa[nome].lucro += rev - c;
    mapa[nome].pedidos += 1;
  }
  return Object.values(mapa)
    .map((s) => ({ ...s, margem: s.faturamento > 0 ? (s.lucro / s.faturamento) * 100 : 0 }))
    .sort((a, b) => b.faturamento - a.faturamento);
}

// ─── ABC DE PRODUTOS ───────────────────────────────────────
export interface ProdutoSerie {
  nome: string; faturamento: number; custo: number; lucro: number; pedidos: number; margem: number; abc: "A" | "B" | "C";
}
export function serieProduto(pedidos: OpPedido[]): ProdutoSerie[] {
  const mapa: Record<string, Omit<ProdutoSerie, "abc" | "margem">> = {};
  for (const p of pedidos) {
    const nome = (p.produto || "").trim() || "(sem nome)";
    if (!mapa[nome]) mapa[nome] = { nome, faturamento: 0, custo: 0, lucro: 0, pedidos: 0 };
    const reembolso = p.status === "reembolso";
    const c = (p.custo_produto || 0) + (p.frete || 0);
    const rev = reembolso ? 0 : (p.faturamento || 0);
    mapa[nome].faturamento += rev;
    mapa[nome].custo += c;
    mapa[nome].lucro += rev - c;
    mapa[nome].pedidos += 1;
  }
  const lista = Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento);
  const totalRev = lista.reduce((s, p) => s + p.faturamento, 0);
  let acc = 0;
  return lista.map((p) => {
    acc += p.faturamento;
    const cumPct = totalRev > 0 ? (acc / totalRev) * 100 : 0;
    const abc: "A" | "B" | "C" = cumPct <= 70 ? "A" : cumPct <= 90 ? "B" : "C";
    return { ...p, margem: p.faturamento > 0 ? (p.lucro / p.faturamento) * 100 : 0, abc };
  });
}

// ─── ALERTAS INTELIGENTES ──────────────────────────────────
export interface Alerta { tipo: "danger" | "warn" | "success" | "info"; ico: string; msg: string; }
export function gerarAlertas(k: KpisOperacao, pedidos: OpPedido[], meta: OpMeta | null): Alerta[] {
  const a: Alerta[] = [];
  if (k.roas > 0 && k.roas < 1.5) a.push({ tipo: "danger", ico: "🚨", msg: `ROAS baixo (${k.roas.toFixed(1)}x) — cada $1 em ADS volta menos de $1,50` });
  if (k.margem < 0) a.push({ tipo: "danger", ico: "🔴", msg: `Margem negativa (${k.margem.toFixed(1)}%) — revise custos e ADS` });
  if (k.lucroReal < 0) a.push({ tipo: "danger", ico: "💸", msg: `Lucro real negativo (${fmtMoney(k.lucroReal)}) após taxas` });
  const reembolsos = pedidos.filter((p) => p.status === "reembolso");
  const taxaReemb = k.pedidos > 0 ? (reembolsos.length / k.pedidos) * 100 : 0;
  if (taxaReemb > 10) a.push({ tipo: "danger", ico: "↩️", msg: `Taxa de reembolso alta: ${taxaReemb.toFixed(1)}% (${reembolsos.length}/${k.pedidos})` });
  else if (taxaReemb > 5) a.push({ tipo: "warn", ico: "↩️", msg: `Reembolsos em atenção: ${taxaReemb.toFixed(1)}%` });
  const disputas = pedidos.filter((p) => p.status === "disputa").length;
  if (disputas > 0) a.push({ tipo: "warn", ico: "⚖️", msg: `${disputas} pedido(s) em disputa` });
  if (meta && meta.meta_faturamento > 0) {
    const pct = (k.faturamento / meta.meta_faturamento) * 100;
    if (pct >= 100) a.push({ tipo: "success", ico: "🏆", msg: `Meta de faturamento batida! ${pct.toFixed(0)}%` });
  }
  if (k.roas >= 3) a.push({ tipo: "success", ico: "🚀", msg: `ROAS excelente: ${k.roas.toFixed(1)}x` });
  return a;
}
function fmtMoney(n: number) { return "$" + (n || 0).toFixed(2); }

// ─── CALCULADORA DE PREÇO IDEAL ────────────────────────────
export function precoIdeal(custoTotal: number, margemDesejada: number, cfg: OpConfig): { preco: number; taxas: number; lucro: number; margemReal: number; inviavel: boolean } {
  const taxaTotal = (cfg.gateway_fee + cfg.shopify_fee + cfg.imposto) / 100;
  const margem = margemDesejada / 100;
  const denom = 1 - taxaTotal - margem;
  if (denom <= 0.01) return { preco: 0, taxas: 0, lucro: 0, margemReal: 0, inviavel: true };
  const preco = custoTotal / denom;
  const taxas = preco * taxaTotal;
  const lucro = preco - custoTotal - taxas;
  return { preco, taxas, lucro, margemReal: preco > 0 ? (lucro / preco) * 100 : 0, inviavel: false };
}

// ─── PREVISÃO DE FECHAMENTO (3 cenários) ───────────────────
export interface Previsao { pessimista: number; realista: number; otimista: number; mediaDia: number; diasRestantes: number; atual: number; }
export function preverFechamento(dias: DiaSerie[], mes: number, ano: number): Previsao | null {
  const agora = new Date();
  if (agora.getMonth() + 1 !== mes || agora.getFullYear() !== ano) return null;
  const diaAtual = agora.getDate();
  const ativos = dias.filter((d) => d.dia <= diaAtual && d.pedidos > 0);
  if (ativos.length < 2) return null;
  const ult7 = ativos.slice(-7);
  const mediaDia = ult7.reduce((s, d) => s + d.faturamento, 0) / ult7.length;
  const atual = dias.filter((d) => d.dia <= diaAtual).reduce((s, d) => s + d.faturamento, 0);
  const restantes = new Date(ano, mes, 0).getDate() - diaAtual;
  return {
    pessimista: atual + mediaDia * 0.8 * restantes,
    realista: atual + mediaDia * restantes,
    otimista: atual + mediaDia * 1.2 * restantes,
    mediaDia, diasRestantes: restantes, atual,
  };
}

// ─── SIMULADOR DE ADS ──────────────────────────────────────
export function simularAds(budget: number, roas: number, ticket: number, margem: number) {
  const faturamento = budget * roas;
  const pedidos = ticket > 0 ? Math.round(faturamento / ticket) : 0;
  const lucro = faturamento * (margem / 100) - budget;
  const roi = budget > 0 ? lucro / budget : 0;
  const beRoas = margem > 0 ? 100 / margem : 0;
  return { faturamento, pedidos, lucro, roi, beRoas };
}

// ─── LTV (acumulado de todos os meses) ─────────────────────
export interface Ltv {
  totalPedidos: number; totalFaturamento: number; totalLucro: number;
  mesesAtivos: number; ticketMedio: number; lucroMes: number; pedidosMes: number; ltv12: number;
}
export async function calcularLtv(lojaId: string): Promise<Ltv> {
  const { data, error } = await supabase.from("op_pedidos")
    .select("data,custo_produto,frete,faturamento,status").eq("loja_id", lojaId);
  if (error) throw error;
  const ped = data || [];
  let fat = 0, lucro = 0;
  const meses = new Set<string>();
  ped.forEach((p: { data: string; custo_produto: number; frete: number; faturamento: number; status: string }) => {
    const reemb = p.status === "reembolso";
    const c = (p.custo_produto || 0) + (p.frete || 0);
    const rev = reemb ? 0 : (p.faturamento || 0);
    fat += rev; lucro += rev - c;
    if (rev > 0) meses.add(p.data.slice(0, 7));
  });
  const mesesAtivos = meses.size;
  const totalPedidos = ped.length;
  const ticketMedio = totalPedidos > 0 ? fat / totalPedidos : 0;
  const pedidosMes = mesesAtivos > 0 ? totalPedidos / mesesAtivos : 0;
  return {
    totalPedidos, totalFaturamento: fat, totalLucro: lucro, mesesAtivos,
    ticketMedio, lucroMes: mesesAtivos > 0 ? lucro / mesesAtivos : 0, pedidosMes,
    ltv12: ticketMedio * pedidosMes * 12,
  };
}

// ─── EXPORT CSV ────────────────────────────────────────────
export function gerarCSV(pedidos: OpPedido[]): string {
  const head = "Data,NumPedido,Fornecedor,Produto,CustoProduto,Frete,Faturamento,Lucro,Status,Notas";
  const esc = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const linhas = pedidos.map((p) => {
    const rev = p.status === "reembolso" ? 0 : p.faturamento;
    const lucro = rev - (p.custo_produto + p.frete);
    return [p.data, esc(p.num_pedido), esc(p.fornecedor), esc(p.produto),
      p.custo_produto.toFixed(2), p.frete.toFixed(2), p.faturamento.toFixed(2),
      lucro.toFixed(2), esc(p.status || "completo"), esc(p.notas)].join(",");
  });
  return [head, ...linhas].join("\n");
}

// ─── ANÁLISE DE CANAIS (marketing) ─────────────────────────
export interface CanalSerie {
  canal: string; gasto: number; receita: number; pedidos: number;
  novos: number; recorrentes: number; recompraPct: number;
  roas: number; cpa: number; ticket: number; pctReceita: number;
}
const MAP_PLATAFORMA_CANAL: Record<string, string> = { Meta: "Meta", Google: "Google", TikTok: "TikTok" };
export function serieCanal(pedidos: OpPedido[], ads: OpAds[]): CanalSerie[] {
  const mapa: Record<string, CanalSerie> = {};
  const novo = (c: string) => (mapa[c] ??= { canal: c, gasto: 0, receita: 0, pedidos: 0, novos: 0, recorrentes: 0, recompraPct: 0, roas: 0, cpa: 0, ticket: 0, pctReceita: 0 });
  for (const p of pedidos) {
    const canal = (p.canal || "").trim() || "Não atribuído";
    const m = novo(canal);
    const reembolso = p.status === "reembolso";
    m.receita += reembolso ? 0 : (p.faturamento || 0);
    m.pedidos += 1;
    if (p.tipo_cliente === "recorrente") m.recorrentes += 1; else m.novos += 1;
  }
  for (const a of ads) {
    const canal = MAP_PLATAFORMA_CANAL[a.plataforma || ""] || (a.plataforma || "Outro");
    novo(canal).gasto += a.valor || 0;
  }
  const totalReceita = Object.values(mapa).reduce((s, c) => s + c.receita, 0);
  return Object.values(mapa).map((c) => ({
    ...c,
    roas: c.gasto > 0 ? c.receita / c.gasto : 0,
    cpa: c.pedidos > 0 && c.gasto > 0 ? c.gasto / c.pedidos : 0,
    ticket: c.pedidos > 0 ? c.receita / c.pedidos : 0,
    recompraPct: c.pedidos > 0 ? (c.recorrentes / c.pedidos) * 100 : 0,
    pctReceita: totalReceita > 0 ? (c.receita / totalReceita) * 100 : 0,
  })).sort((a, b) => b.receita - a.receita);
}

// ─── FLUXO DE CAIXA (BRL, descasamento Shopify ~7d) ─────────
export interface FluxoCaixa {
  cambio: number;
  recebidoUSD: number; aReceberUSD: number; pagoUSD: number; saldoUSD: number;
  recebidoBRL: number; aReceberBRL: number; pagoBRL: number; saldoBRL: number;
  custoUSD: number; adsUSD: number;
}
// recebido = faturamento já liberado (pedido com >= diasRepasse dias); aReceber = retido pela Shopify
export function fluxoCaixa(pedidos: OpPedido[], ads: OpAds[], cambioBRL: number, diasRepasse = 7): FluxoCaixa {
  const limite = new Date(); limite.setDate(limite.getDate() - diasRepasse);
  const limiteStr = limite.toISOString().slice(0, 10);
  let recebido = 0, aReceber = 0, custo = 0;
  for (const p of pedidos) {
    const reembolso = p.status === "reembolso";
    const rev = reembolso ? 0 : (p.faturamento || 0);
    custo += (p.custo_produto || 0) + (p.frete || 0);
    if (p.data <= limiteStr) recebido += rev; else aReceber += rev;
  }
  const adsTotal = ads.reduce((s, a) => s + (a.valor || 0), 0);
  const pago = custo + adsTotal;            // pago à vista
  const saldo = recebido - pago;            // caixa hoje (sem contar o retido)
  const c = cambioBRL || 1;
  return {
    cambio: c,
    recebidoUSD: recebido, aReceberUSD: aReceber, pagoUSD: pago, saldoUSD: saldo,
    recebidoBRL: recebido * c, aReceberBRL: aReceber * c, pagoBRL: pago * c, saldoBRL: saldo * c,
    custoUSD: custo, adsUSD: adsTotal,
  };
}

export function calcularKpis(pedidos: OpPedido[], ads: OpAds[], cfg: OpConfig): KpisOperacao {
  let faturamento = 0, custo = 0;
  for (const p of pedidos) {
    const reembolso = p.status === "reembolso";
    const c = (p.custo_produto || 0) + (p.frete || 0);
    custo += c;
    faturamento += reembolso ? 0 : (p.faturamento || 0);
  }
  const adsTotal = ads.reduce((s, a) => s + (a.valor || 0), 0);
  const pedidosCount = pedidos.length;
  const lucroBruto = faturamento - custo - adsTotal;
  const ticketMedio = pedidosCount > 0 ? faturamento / pedidosCount : 0;
  const margem = faturamento > 0 ? (lucroBruto / faturamento) * 100 : 0;
  const roas = adsTotal > 0 ? faturamento / adsTotal : 0;
  const cac = pedidosCount > 0 ? adsTotal / pedidosCount : 0;

  const gateway = faturamento * (cfg.gateway_fee / 100);
  const taxaShopify = faturamento * (cfg.shopify_fee / 100);
  const imposto = faturamento * (cfg.imposto / 100);
  const taxasTotal = gateway + taxaShopify + imposto;
  const lucroReal = faturamento - custo - adsTotal - taxasTotal;
  const margemReal = faturamento > 0 ? (lucroReal / faturamento) * 100 : 0;

  return {
    faturamento, custo, ads: adsTotal, lucroBruto, pedidos: pedidosCount,
    ticketMedio, margem, roas, cac,
    gateway, taxaShopify, imposto, taxasTotal, lucroReal, margemReal,
  };
}
