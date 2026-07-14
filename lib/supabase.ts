"use client";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase — banco real (PostgreSQL) do módulo Operação.
// A anon/publishable key é segura para o front (acesso controlado por RLS depois).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(url, anonKey);

export function supabaseConfigurado(): boolean {
  return url.length > 0 && anonKey.length > 0;
}

// ─── Tipos das tabelas operacionais (espelham o schema SQL) ───
export interface OpPedido {
  id?: number;
  loja_id: string;
  data: string;            // YYYY-MM-DD
  num_pedido?: string;
  fornecedor?: string;
  custo_produto: number;
  frete: number;
  faturamento: number;
  produto?: string;
  status?: string;         // "" | "reembolso" | "disputa"
  canal?: string;          // Meta | TikTok | Google | Organico | Direto | Email | Outro
  tipo_cliente?: string;   // novo | recorrente
  notas?: string;
  criado_em?: string;
}

export interface OpAds {
  id?: number;
  loja_id: string;
  data: string;
  valor: number;
  plataforma?: string;     // Meta | Google | TikTok | Outro
  criado_em?: string;
}

export interface OpConfig {
  loja_id: string;         // PK
  gateway_fee: number;     // %
  shopify_fee: number;     // %
  imposto: number;         // %
  ads_budget: number;      // $/dia
  margem_alvo: number;     // %
}

// ─── Tabela colaboradores (Fase 2 — schema híbrido) ───
export interface ColaboradorRow {
  id: string;
  auth_id: string | null;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  nivel_acesso: string;
  avatar: string | null;
  foto: string | null;
  cor: string | null;
  xp: number;
  streak: number;
  salario: number | null;
  estado: string | null;
  ultimo_checkin: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  horas_disponiveis: number | null;
  status_online: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
  updated_at: string;
}
