"use client";
import { supabase } from "./supabase";
import { buscarTabela, upsertLinha, inserirLinha, excluirLinha, excluirPorFiltro } from "./cloudSync";
import type {
  Tarefa, NotificacaoInApp, EntradaAtividade, EntregaSemanal, Desafio, CheckInDesafio,
  Produto, Ferramenta, GastoOperacional, Loja, SocioGestor,
} from "./data";

// Estratégia uniforme: o objeto do app inteiro vai pro jsonb `dados`, e as
// colunas reais (id + as que o schema já reserva pra indexação/filtro) são
// espelhadas por cima na leitura, garantindo que elas sejam a fonte de
// verdade quando divergirem do snapshot salvo em `dados`.

// ─── Tarefas ───
export const buscarTarefasSupabase = () =>
  buscarTabela<Tarefa>("tarefas", (row) => ({
    ...row.dados, id: row.id, titulo: row.titulo, descricao: row.descricao ?? undefined,
    tipo: row.tipo ?? undefined, prioridade: row.prioridade, status: row.status,
    atribuidoPara: row.atribuido_para, criadoPor: row.criado_por, lojaId: row.loja_id ?? undefined,
    dataCriacao: (row.data_criacao || "").slice(0, 10),
    dataLimite: row.data_limite ? String(row.data_limite).slice(0, 10) : undefined,
    concluidaEm: row.concluida_em ?? undefined,
  }));

export const salvarTarefaSupabase = (t: Tarefa) => upsertLinha("tarefas", {
  id: t.id, titulo: t.titulo, descricao: t.descricao ?? null, tipo: t.tipo ?? null,
  prioridade: t.prioridade, status: t.status, atribuido_para: t.atribuidoPara,
  criado_por: t.criadoPor, loja_id: t.lojaId ?? null, data_criacao: t.dataCriacao,
  data_limite: t.dataLimite ?? null, concluida_em: t.concluidaEm ?? null, dados: t,
});

export const excluirTarefaSupabase = (id: string) => excluirLinha("tarefas", id);

// ─── Notificações ───
export const buscarNotificacoesSupabase = () =>
  buscarTabela<NotificacaoInApp>("notificacoes", (row) => ({
    ...row.dados, id: row.id, paraId: row.para_id, tipo: row.tipo,
    lida: row.lida, arquivada: row.arquivada, criadaEm: row.dados?.criadaEm ?? row.criado_em,
  }));

export const salvarNotificacaoSupabase = (n: NotificacaoInApp) => upsertLinha("notificacoes", {
  id: n.id, para_id: n.paraId, tipo: n.tipo, lida: n.lida, arquivada: n.arquivada ?? false, dados: n,
});

export const excluirNotificacaoSupabase = (id: string) => excluirLinha("notificacoes", id);

// ─── Atividades (append-only; id é gerado pelo banco) ───
export const registrarAtividadeSupabase = (entry: EntradaAtividade) => inserirLinha("atividades", {
  colaborador_id: entry.colaboradorId, data: entry.data, tipo: entry.tipo, dados: entry,
});

// ─── Entregas semanais ───
export const buscarEntregasSupabase = () =>
  buscarTabela<EntregaSemanal>("entregas_semanais", (row) => ({
    ...row.dados, id: row.id, colaboradorId: row.colaborador_id, semana: row.semana,
  }));

export const salvarEntregaSupabase = (e: EntregaSemanal) => upsertLinha("entregas_semanais", {
  id: e.id, colaborador_id: e.colaboradorId, semana: e.semana, dados: e,
});

export const excluirEntregaSupabase = (id: string) => excluirLinha("entregas_semanais", id);

// ─── Desafios ───
export const buscarDesafiosSupabase = () =>
  buscarTabela<Desafio>("desafios", (row) => ({ ...row.dados, id: row.id, titulo: row.titulo, ativo: row.ativo }));

export const salvarDesafioSupabase = (d: Desafio) => upsertLinha("desafios", {
  id: d.id, titulo: d.titulo, ativo: d.ativo, dados: d,
});

export const excluirDesafioSupabase = (id: string) => excluirLinha("desafios", id);

// ─── Check-ins de desafio (id gerado pelo banco; localiza por desafio+pessoa+data) ───
export const buscarCheckInsSupabase = () =>
  buscarTabela<CheckInDesafio>("check_ins_desafio", (row) => ({
    id: `${row.desafio_id}-${row.colaborador_id}-${row.data}`,
    desafioId: row.desafio_id, colaboradorId: row.colaborador_id, data: row.data,
    hora: row.dados?.hora ?? "", nota: row.dados?.nota ?? undefined, reacoes: row.dados?.reacoes ?? [],
  }));

export const registrarCheckInSupabase = (ci: CheckInDesafio) => inserirLinha("check_ins_desafio", {
  desafio_id: ci.desafioId, colaborador_id: ci.colaboradorId, data: ci.data,
  dados: { hora: ci.hora, nota: ci.nota ?? null, reacoes: ci.reacoes ?? [] },
});

export const atualizarCheckInSupabase = async (ci: CheckInDesafio) => {
  const { error } = await supabase.from("check_ins_desafio")
    .update({ dados: { hora: ci.hora, nota: ci.nota ?? null, reacoes: ci.reacoes ?? [] } })
    .match({ desafio_id: ci.desafioId, colaborador_id: ci.colaboradorId, data: ci.data });
  if (error) console.error("Erro ao atualizar check-in:", error.message);
};

export const excluirCheckInSupabase = (desafioId: string, colaboradorId: string, data: string) =>
  excluirPorFiltro("check_ins_desafio", { desafio_id: desafioId, colaborador_id: colaboradorId, data });

// ─── Produtos ───
export const buscarProdutosSupabase = () =>
  buscarTabela<Produto>("produtos", (row) => ({ ...row.dados, id: row.id, lojaId: row.loja_id, nome: row.nome }));

export const salvarProdutoSupabase = (p: Produto) => upsertLinha("produtos", {
  id: p.id, loja_id: p.lojaId, nome: p.nome, dados: p,
});

export const excluirProdutoSupabase = (id: string) => excluirLinha("produtos", id);

// ─── Ferramentas ───
export const buscarFerramentasSupabase = () =>
  buscarTabela<Ferramenta>("ferramentas", (row) => ({
    ...row.dados, id: row.id, nome: row.nome, descricao: row.descricao ?? undefined,
    preco: row.preco, tipo: row.tipo, cor: row.cor ?? undefined,
  }));

export const salvarFerramentaSupabase = (f: Ferramenta) => upsertLinha("ferramentas", {
  id: f.id, nome: f.nome, descricao: f.descricao ?? null, preco: f.preco, tipo: f.tipo, cor: f.cor ?? null, dados: f,
});

export const excluirFerramentaSupabase = (id: string) => excluirLinha("ferramentas", id);

// ─── Gastos operacionais ───
export const buscarGastosSupabase = () =>
  buscarTabela<GastoOperacional>("gastos_operacionais", (row) => ({ ...row.dados, id: row.id }));

export const salvarGastoSupabase = (g: GastoOperacional) => upsertLinha("gastos_operacionais", { id: g.id, dados: g });

export const excluirGastoSupabase = (id: string) => excluirLinha("gastos_operacionais", id);

// ─── Lojas customizadas ───
export const buscarLojasCustomSupabase = () =>
  buscarTabela<Loja>("lojas_custom", (row) => ({ ...row.dados, id: row.id, nome: row.nome }));

export const salvarLojaCustomSupabase = (l: Loja) => upsertLinha("lojas_custom", { id: l.id, nome: l.nome, dados: l });

export const excluirLojaCustomSupabase = (id: string) => excluirLinha("lojas_custom", id);

// ─── Sócios ───
export const buscarSociosSupabase = () =>
  buscarTabela<SocioGestor>("socios", (row) => ({ ...row.dados, id: row.id }));

export const salvarSocioSupabase = (so: SocioGestor) => upsertLinha("socios", { id: so.id, dados: so });

export const excluirSocioSupabase = (id: string) => excluirLinha("socios", id);

// ─── app_estado: baldinho chave/valor pra globais sem tabela própria ───
// (regrasEmpresa, linksRapidos, pulsoAtual, missoesSemana, fichasReconhecimento,
//  ultimaResetaFichas, lojasArquivadas)
export async function buscarEstadoSupabase<T>(chave: string): Promise<T | null> {
  const { data, error } = await supabase.from("app_estado").select("valor").eq("chave", chave).maybeSingle();
  if (error || !data) {
    if (error) console.error(`Erro ao buscar app_estado.${chave}:`, error.message);
    return null;
  }
  return data.valor as T;
}

export async function salvarEstadoSupabase(chave: string, valor: unknown) {
  const { error } = await supabase.from("app_estado").upsert({ chave, valor });
  if (error) console.error(`Erro ao salvar app_estado.${chave}:`, error.message);
}
