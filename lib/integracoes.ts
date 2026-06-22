"use client";
// Integrações por loja — ESQUELETO (status only, sem segredos).
// Token de API entra depois, server-side. Aqui só rastreia o que está conectado.
import { supabase } from "./supabase";

export type StatusIntegracao = "nao_conectado" | "configurando" | "conectado";
export interface Integracao {
  id?: number; loja_id: string; plataforma: string;
  status: StatusIntegracao; conta?: string | null; ultima_sync?: string | null; obs?: string | null;
}

export interface PlataformaInfo {
  id: string; nome: string; cor: string; dificuldade: "fácil" | "médio" | "burocrático";
  precisa: string; valor: string; disponivel: boolean;
}
export const PLATAFORMAS: PlataformaInfo[] = [
  { id: "shopify", nome: "Shopify", cor: "#95bf47", dificuldade: "fácil", precisa: "App personalizado no admin da loja → token", valor: "Puxa pedidos reais automaticamente", disponivel: true },
  { id: "meta", nome: "Meta Ads", cor: "#1877f2", dificuldade: "médio", precisa: "App no Meta for Developers + ad account + token", valor: "Gasto e ROAS por campanha", disponivel: true },
  { id: "google", nome: "Google Ads", cor: "#ea4335", dificuldade: "burocrático", precisa: "Developer token (aprovação) + OAuth + customer ID", valor: "Gasto por campanha", disponivel: true },
  { id: "tiktok", nome: "TikTok Ads", cor: "#ec4899", dificuldade: "médio", precisa: "App aprovado + token", valor: "Gasto por campanha", disponivel: true },
];

export async function listarIntegracoes(lojaId: string): Promise<Integracao[]> {
  const { data, error } = await supabase.from("loja_integracoes").select("*").eq("loja_id", lojaId);
  if (error) throw error;
  return data || [];
}
export async function listarTodasIntegracoes(): Promise<Integracao[]> {
  const { data, error } = await supabase.from("loja_integracoes").select("*");
  if (error) throw error;
  return data || [];
}
export async function salvarIntegracao(i: Integracao) {
  const { error } = await supabase.from("loja_integracoes").upsert(i, { onConflict: "loja_id,plataforma" });
  if (error) throw error;
}
