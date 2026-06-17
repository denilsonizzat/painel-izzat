import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { enviarEmail } from "@/lib/email";
import { emailAdminDiario, DadosPessoa } from "@/lib/email-templates";

function verificarSegredo(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return auth === `Bearer ${secret}`;
}

function calcProgresso(rotinas: { concluida: boolean; subtarefas: { concluida: boolean }[] }[]) {
  if (!rotinas.length) return { pct: 100, feitas: 0, total: 0 };
  const total = rotinas.reduce((a, r) => a + r.subtarefas.length, 0);
  if (total === 0) return { pct: rotinas.every((r) => r.concluida) ? 100 : 0, feitas: 0, total: 0 };
  const feitas = rotinas.reduce((a, r) => a + r.subtarefas.filter((s) => s.concluida).length, 0);
  return { pct: Math.round((feitas / total) * 100), feitas, total };
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
  const { colaboradores, tarefas, atividadesHoje } = snapshot;

  const hoje = new Date().toISOString().split("T")[0];
  const data = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const admins = (colaboradores || []).filter((c: { nivelAcesso: string; email: string }) => c.nivelAcesso === "admin" && c.email);
  const colaboradoresAtivos = (colaboradores || []).filter((c: { nivelAcesso: string }) => c.nivelAcesso !== "admin");

  if (!admins.length) return NextResponse.json({ ok: false, erro: "Nenhum admin com email" });

  const equipe: DadosPessoa[] = colaboradoresAtivos.map((c: {
    id: string; nome: string; cargo: string; cor: string;
    rotinas: { concluida: boolean; subtarefas: { concluida: boolean }[] }[];
    ultimoCheckIn?: string;
  }) => {
    const progresso = calcProgresso(c.rotinas || []);
    const atividadesColab = (atividadesHoje || []).filter(
      (a: { colaboradorId: string; data: string }) => a.colaboradorId === c.id && a.data === hoje
    );
    const xpHoje = atividadesColab.reduce((acc: number, a: { xp?: number }) => acc + (a.xp || 0), 0);

    const tarefasConcluidas = (tarefas || [])
      .filter((t: { atribuidoPara: string; status: string }) => t.atribuidoPara === c.id && t.status === "concluida")
      .map((t: { titulo: string }) => t.titulo);
    const tarefasAbertas = (tarefas || [])
      .filter((t: { atribuidoPara: string; status: string }) => t.atribuidoPara === c.id && ["pendente", "em_andamento"].includes(t.status))
      .map((t: { titulo: string }) => t.titulo);
    const tarefasAtrasadas = (tarefas || [])
      .filter((t: { atribuidoPara: string; status: string }) => t.atribuidoPara === c.id && t.status === "atrasada")
      .map((t: { titulo: string }) => t.titulo);
    const tarefasAguardando = (tarefas || [])
      .filter((t: { atribuidoPara: string; status: string }) => t.atribuidoPara === c.id && t.status === "aguardando_revisao")
      .map((t: { titulo: string }) => t.titulo);

    return {
      nome: c.nome,
      cargo: c.cargo || "",
      cor: c.cor,
      pctRotinas: progresso.pct,
      rotinasConcluidas: progresso.feitas,
      rotinasTotal: progresso.total,
      checkIn: c.ultimoCheckIn === hoje,
      tarefasConcluidas,
      tarefasAbertas,
      tarefasAtrasadas,
      tarefasAguardando,
      xpGanhoHoje: xpHoje,
    };
  });

  const totalTarefasConcluidas = equipe.reduce((a, p) => a + p.tarefasConcluidas.length, 0);
  const totalUrgentes = (tarefas || []).filter(
    (t: { prioridade: string; status: string }) => t.prioridade === "alta" && !["concluida", "aguardando_revisao"].includes(t.status)
  ).length;
  const mediaProgresso = equipe.length
    ? Math.round(equipe.reduce((a, p) => a + p.pctRotinas, 0) / equipe.length)
    : 0;

  const html = emailAdminDiario({ data, equipe, totalTarefasConcluidas, totalUrgentes, mediaProgresso });

  const resultados: string[] = [];
  for (const admin of admins) {
    const res = await enviarEmail(admin.email, `Relatorio Diario ${new Date().toLocaleDateString("pt-BR")} — Painel Izzat`, html);
    if (res.ok) resultados.push(admin.email);
  }

  return NextResponse.json({ ok: true, enviados: resultados });
}
