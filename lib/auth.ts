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
