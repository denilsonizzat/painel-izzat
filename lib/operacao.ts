"use client";
// Camada de dados do módulo Operação — fala com o Supabase.
import { supabase, OpPedido, OpAds, OpConfig } from "./supabase";

export type { OpPedido, OpAds, OpConfig };

const CONFIG_PADRAO: Omit<OpConfig, "loja_id"> = {
  gateway_fee: 2.9, shopify_fee: 0.5, imposto: 6.0, ads_budget: 30, margem_alvo: 20,
};

// ─── PEDIDOS ───────────────────────────────────────────────
export async function listarPedidos(lojaId: string, mes: number, ano: number): Promise<OpPedido[]> {
  const ini = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const fim = `${ano}-${String(mes).padStart(2, "0")}-31`;
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
  const ini = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const fim = `${ano}-${String(mes).padStart(2, "0")}-31`;
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
