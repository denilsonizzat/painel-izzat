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
