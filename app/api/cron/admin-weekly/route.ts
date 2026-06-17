import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { enviarEmail } from "@/lib/email";
import { emailAdminSemanal, DadosPessoaSemanal } from "@/lib/email-templates";
import { NIVEIS } from "@/lib/data";

function verificarSegredo(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return auth === `Bearer ${secret}`;
}

function calcNivel(xp: number) {
  return [...NIVEIS].reverse().find((n) => xp >= n.xpMin) ?? NIVEIS[0];
}

function semanaAtual(): string {
  const d = new Date();
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function datasSemanais(): { inicio: string; fim: string } {
  const hoje = new Date();
  const dow = hoje.getDay();
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - (dow === 0 ? 6 : dow - 1));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  return { inicio: fmt(seg), fim: fmt(dom) };
}

function calcProgresso(rotinas: { concluida: boolean; subtarefas: { concluida: boolean }[] }[]) {
  if (!rotinas.length) return 100;
  const total = rotinas.reduce((a, r) => a + r.subtarefas.length, 0);
  if (total === 0) return rotinas.every((r) => r.concluida) ? 100 : 0;
  const feitas = rotinas.reduce((a, r) => a + r.subtarefas.filter((s) => s.concluida).length, 0);
  return Math.round((feitas / total) * 100);
}

export async function GET(req: NextRequest) {
  if (!verificarSegredo(req)) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return NextResponse.json({ ok: false, erro: "Redis nao configurado" });
  }

  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  const raw = await redis.get<string>("painel-snapshot");
  if (!raw) return NextResponse.json({ ok: false, erro: "Sem snapshot disponivel" });

  const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
  const { colaboradores, tarefas, historico } = snapshot;

  const semana = semanaAtual();
  const datas = datasSemanais();
  const admins = (colaboradores || []).filter((c: { nivelAcesso: string; email: string }) => c.nivelAcesso === "admin" && c.email);
  const colaboradoresAtivos = (colaboradores || []).filter((c: { nivelAcesso: string }) => c.nivelAcesso !== "admin");

  if (!admins.length) return NextResponse.json({ ok: false, erro: "Nenhum admin com email" });

  // XP ganho na semana = historico da semana
  function xpSemana(colaboradorId: string): number {
    return (historico || [])
      .filter((h: { colaboradorId: string; data: string }) => {
        if (h.colaboradorId !== colaboradorId) return false;
        const hDate = new Date(h.data);
        const hoje = new Date();
        const dow = hoje.getDay();
        const seg = new Date(hoje);
        seg.setDate(hoje.getDate() - (dow === 0 ? 6 : dow - 1));
        return hDate >= seg;
      })
      .reduce((a: number, h: { xpGanho?: number }) => a + (h.xpGanho || 0), 0);
  }

  function checkInsSemana(colaboradorId: string): number {
    return (historico || []).filter((h: { colaboradorId: string; data: string }) => {
      if (h.colaboradorId !== colaboradorId) return false;
      const hDate = new Date(h.data);
      const hoje = new Date();
      const dow = hoje.getDay();
      const seg = new Date(hoje);
      seg.setDate(hoje.getDate() - (dow === 0 ? 6 : dow - 1));
      return hDate >= seg;
    }).length;
  }

  const equipe: DadosPessoaSemanal[] = colaboradoresAtivos.map((c: {
    id: string; nome: string; cargo: string; cor: string;
    rotinas: { concluida: boolean; subtarefas: { concluida: boolean }[] }[];
    xp: number; streak: number;
  }) => {
    const nivelInfo = calcNivel(c.xp || 0);
    const tarefasConcluidas = (tarefas || []).filter(
      (t: { atribuidoPara: string; status: string }) => t.atribuidoPara === c.id && t.status === "concluida"
    ).length;
    const tarefasAbertas = (tarefas || []).filter(
      (t: { atribuidoPara: string; status: string }) => t.atribuidoPara === c.id && t.status !== "concluida"
    ).length;

    return {
      nome: c.nome,
      cargo: c.cargo || "",
      cor: c.cor,
      mediaPctRotinas: calcProgresso(c.rotinas || []),
      tarefasConcluidas,
      tarefasAbertas,
      xpGanhoSemana: xpSemana(c.id),
      xpTotal: c.xp || 0,
      streakAtual: c.streak || 0,
      nivel: nivelInfo.nome,
      corNivel: nivelInfo.cor,
      checkInsCount: checkInsSemana(c.id),
      diasTrabalhados: checkInsSemana(c.id),
    };
  });

  const topPerformers = [...equipe]
    .sort((a, b) => b.xpGanhoSemana - a.xpGanhoSemana)
    .slice(0, 3)
    .map((p, i) => ({ nome: p.nome, cor: p.cor, xp: p.xpGanhoSemana, posicao: i + 1 }));

  const totalTarefasSemana = (tarefas || []).length;
  const totalConcluidas = (tarefas || []).filter((t: { status: string }) => t.status === "concluida").length;
  const taxaConclusao = totalTarefasSemana > 0 ? Math.round((totalConcluidas / totalTarefasSemana) * 100) : 0;

  const html = emailAdminSemanal({
    semana,
    dataInicio: datas.inicio,
    dataFim: datas.fim,
    equipe,
    topPerformers,
    totalTarefasSemana,
    totalConcluidas,
    taxaConclusao,
  });

  const resultados: string[] = [];
  for (const admin of admins) {
    const res = await enviarEmail(admin.email, `Relatorio Semanal ${semana} — Painel Izzat`, html);
    if (res.ok) resultados.push(admin.email);
  }

  return NextResponse.json({ ok: true, enviados: resultados, semana });
}
