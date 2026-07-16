"use client";
import { supabase } from "./supabase";

// Infra genérica de sincronização com o Supabase — reduz repetição entre os
// vários domínios (tarefas, produtos, gastos etc.) que seguem o mesmo padrão
// híbrido do schema: algumas colunas reais + resto no jsonb `dados`.

// Retorna null quando a busca falha (erro de rede/permissão) — diferente de
// "[]", que significa genuinamente vazio. Quem chama deve manter o estado
// local em caso de null, nunca sobrescrever com lista vazia por causa de erro.
export async function buscarTabela<T>(
  tabela: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowParaItem: (row: any) => T
): Promise<T[] | null> {
  const { data, error } = await supabase.from(tabela).select("*");
  if (error || !data) {
    if (error) console.error(`Erro ao buscar ${tabela}:`, error.message);
    return null;
  }
  return data.map(rowParaItem);
}

export async function upsertLinha(tabela: string, linha: Record<string, unknown>) {
  const { error } = await supabase.from(tabela).upsert(linha);
  if (error) console.error(`Erro ao salvar em ${tabela}:`, error.message);
}

export async function inserirLinha(tabela: string, linha: Record<string, unknown>) {
  const { error } = await supabase.from(tabela).insert(linha);
  if (error) console.error(`Erro ao inserir em ${tabela}:`, error.message);
}

export async function excluirLinha(tabela: string, valor: string | number, coluna = "id") {
  const { error } = await supabase.from(tabela).delete().eq(coluna, valor);
  if (error) console.error(`Erro ao excluir de ${tabela}:`, error.message);
}

export async function excluirPorFiltro(tabela: string, filtros: Record<string, string | number>) {
  let query = supabase.from(tabela).delete();
  for (const [coluna, valor] of Object.entries(filtros)) query = query.eq(coluna, valor);
  const { error } = await query;
  if (error) console.error(`Erro ao excluir de ${tabela}:`, error.message);
}

// Tempo real genérico: qualquer INSERT/UPDATE vira onUpsert(item mapeado);
// DELETE vira onDelete(id) — usa só payload.old.id (replica identity default
// do Postgres não garante o resto das colunas no DELETE). Retorna unsubscribe.
export function assinarTabelaRealtime<T>(
  tabela: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rowParaItem: (row: any) => T,
  handlers: { onUpsert: (item: T) => void; onDelete?: (id: string) => void }
): () => void {
  const canal = supabase
    .channel(`${tabela}-realtime`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tabela },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        if (payload.eventType === "DELETE") {
          const id = payload.old?.id;
          if (id && handlers.onDelete) handlers.onDelete(String(id));
        } else {
          handlers.onUpsert(rowParaItem(payload.new));
        }
      }
    )
    .subscribe();
  return () => { supabase.removeChannel(canal); };
}
