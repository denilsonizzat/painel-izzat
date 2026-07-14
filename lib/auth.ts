"use client";
import { supabase, type ColaboradorRow } from "./supabase";
import type { Colaborador, NivelAcesso } from "./data";

function rowParaColaborador(row: ColaboradorRow): Colaborador {
  const d = row.dados || {};
  return {
    id: row.id,
    nome: row.nome,
    cargo: row.cargo || "",
    email: row.email || "",
    telefone: row.telefone || undefined,
    googleChatLink: d.googleChatLink,
    dataNascimento: d.dataNascimento,
    nivelAcesso: (row.nivel_acesso as NivelAcesso) || "colaborador",
    avatar: row.avatar || "",
    foto: row.foto || undefined,
    horasDisponiveis: row.horas_disponiveis ?? 8,
    habilidades: d.habilidades || [],
    lojas: d.lojas || [],
    rotinas: d.rotinas || [],
    expectativas: d.expectativas || [],
    reconhecimentos: d.reconhecimentos || [],
    xp: row.xp ?? 0,
    streak: row.streak ?? 0,
    ultimoCheckIn: row.ultimo_checkin || undefined,
    horarioInicio: row.horario_inicio || undefined,
    horarioFim: row.horario_fim || undefined,
    salario: row.salario ?? undefined,
    estado: row.estado || undefined,
    cor: row.cor || "#c9a84c",
    formulario: d.formulario,
    statusOnline: d.statusOnline,
    ferramentasIds: d.ferramentasIds,
    registrosSono: d.registrosSono || [],
  };
}

export async function loginComEmailSenha(
  email: string,
  senha: string
): Promise<{ colaborador?: Colaborador; erro?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error || !data.session) {
    return { erro: "E-mail ou senha inválidos." };
  }

  const { data: row, error: erroColab } = await supabase
    .from("colaboradores")
    .select("*")
    .eq("auth_id", data.session.user.id)
    .maybeSingle();

  if (erroColab || !row) {
    await supabase.auth.signOut();
    return { erro: "Login válido, mas seu perfil ainda não foi liberado no painel. Fala com o admin." };
  }

  return { colaborador: rowParaColaborador(row as ColaboradorRow) };
}

export async function restaurarSessaoSupabase(): Promise<Colaborador | null> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;

  const { data: row } = await supabase
    .from("colaboradores")
    .select("*")
    .eq("auth_id", userId)
    .maybeSingle();

  return row ? rowParaColaborador(row as ColaboradorRow) : null;
}

export async function logoutSupabase() {
  await supabase.auth.signOut();
}

function colaboradorParaRow(c: Colaborador) {
  return {
    id: c.id,
    nome: c.nome,
    cargo: c.cargo || null,
    email: c.email || null,
    telefone: c.telefone ?? null,
    nivel_acesso: c.nivelAcesso,
    avatar: c.avatar || null,
    foto: c.foto ?? null,
    cor: c.cor || null,
    xp: c.xp ?? 0,
    streak: c.streak ?? 0,
    salario: c.salario ?? null,
    estado: c.estado ?? null,
    ultimo_checkin: c.ultimoCheckIn ?? null,
    horario_inicio: c.horarioInicio ?? null,
    horario_fim: c.horarioFim ?? null,
    horas_disponiveis: c.horasDisponiveis ?? null,
    dados: {
      habilidades: c.habilidades,
      lojas: c.lojas,
      rotinas: c.rotinas,
      expectativas: c.expectativas,
      reconhecimentos: c.reconhecimentos,
      formulario: c.formulario,
      statusOnline: c.statusOnline,
      ferramentasIds: c.ferramentasIds,
      registrosSono: c.registrosSono,
      googleChatLink: c.googleChatLink,
      dataNascimento: c.dataNascimento,
    },
  };
}

export async function buscarColaboradoresSupabase(): Promise<Colaborador[]> {
  const { data, error } = await supabase.from("colaboradores").select("*");
  if (error || !data) {
    if (error) console.error("Erro ao buscar colaboradores:", error.message);
    return [];
  }
  return (data as ColaboradorRow[]).map(rowParaColaborador);
}

export async function salvarColaboradorSupabase(colaborador: Colaborador) {
  const { error } = await supabase.from("colaboradores").upsert(colaboradorParaRow(colaborador));
  if (error) console.error("Erro ao salvar colaborador:", error.message);
}

export async function excluirColaboradorSupabase(id: string) {
  const { error } = await supabase.from("colaboradores").delete().eq("id", id);
  if (error) console.error("Erro ao excluir colaborador:", error.message);
}
