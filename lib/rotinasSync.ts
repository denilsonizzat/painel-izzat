"use client";
import { supabase } from "./supabase";
import { assinarTabelaRealtime } from "./cloudSync";
import type { Rotina, Frequencia } from "./data";

interface RotinaRow {
  id: string;
  titulo: string;
  descricao: string | null;
  loja_id: string | null;
  colaborador_id: string | null;
  frequencia: string;
  criado_por: string | null;
  concluida: boolean;
  ativa: boolean;
  vaga_temporaria: boolean;
  motivo_vaga: string | null;
  data_inicio: string | null;
  proxima_ocorrencia: string | null;
  ultima_conclusao: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dados: Record<string, any>;
}

function rowParaRotina(row: RotinaRow): Rotina {
  const d = row.dados || {};
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao || undefined,
    subtarefas: d.subtarefas || [],
    concluida: row.concluida ?? false,
    lojaId: row.loja_id || undefined,
    colaboradorId: row.colaborador_id || undefined,
    frequencia: (row.frequencia as Frequencia) || "diaria",
    criadoPor: row.criado_por || undefined,
    ativa: row.ativa ?? true,
    dataInicio: row.data_inicio || undefined,
    proximaOcorrencia: row.proxima_ocorrencia || undefined,
    ultimaConclusao: row.ultima_conclusao || undefined,
    vagaTemporaria: row.vaga_temporaria ?? false,
    motivoVaga: row.motivo_vaga || undefined,
  };
}

function rotinaParaRow(r: Rotina) {
  return {
    id: r.id,
    titulo: r.titulo,
    descricao: r.descricao ?? null,
    loja_id: r.lojaId ?? null,
    colaborador_id: r.colaboradorId ?? null,
    frequencia: r.frequencia,
    criado_por: r.criadoPor ?? null,
    concluida: r.concluida,
    ativa: r.ativa ?? true,
    vaga_temporaria: r.vagaTemporaria ?? false,
    motivo_vaga: r.motivoVaga ?? null,
    data_inicio: r.dataInicio ?? null,
    proxima_ocorrencia: r.proximaOcorrencia ?? null,
    ultima_conclusao: r.ultimaConclusao ?? null,
    dados: { subtarefas: r.subtarefas || [] },
  };
}

// null = falha na busca (mantém estado local); [] = genuinamente sem rotinas.
export async function buscarRotinasSupabase(): Promise<Rotina[] | null> {
  const { data, error } = await supabase.from("rotinas").select("*");
  if (error || !data) {
    if (error) console.error("Erro ao buscar rotinas do Supabase:", error.message);
    return null;
  }
  return (data as RotinaRow[]).map(rowParaRotina);
}

export async function salvarRotinaSupabase(rotina: Rotina) {
  const { error } = await supabase.from("rotinas").upsert(rotinaParaRow(rotina));
  if (error) console.error("Erro ao salvar rotina no Supabase:", error.message);
}

export async function excluirRotinaSupabase(rotinaId: string) {
  const { error } = await supabase.from("rotinas").delete().eq("id", rotinaId);
  if (error) console.error("Erro ao excluir rotina no Supabase:", error.message);
}

export const assinarRotinasRealtime = (onUpsert: (r: Rotina) => void, onDelete: (id: string) => void) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assinarTabelaRealtime<Rotina>("rotinas", (row: any) => rowParaRotina(row as RotinaRow), { onUpsert, onDelete });
