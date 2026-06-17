import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { enviarEmail } from "@/lib/email";
import { emailTarde } from "@/lib/email-templates";

function verificarSegredo(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return auth === `Bearer ${secret}`;
}

function minutosDesde(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  const d = new Date();
  const totalMinutosAgora = d.getUTCHours() * 60 + d.getUTCMinutes();
  const totalMinutosAlvo = hh * 60 + mm;
  return Math.abs(totalMinutosAgora - totalMinutosAlvo);
}

function calcProgresso(rotinas: { concluida: boolean; subtarefas: { concluida: boolean }[] }[]): { pct: number; feitas: number; total: number } {
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
  const enviados: string[] = [];

  for (const colab of colaboradores) {
    if (!colab.email || !colab.formulario?.horarioFim) continue;

    if (minutosDesde(colab.formulario.horarioFim) > 30) continue;

    const jaEnviouKey = `evening-${colab.id}-${hoje}`;
    const jaEnviou = await redis.get(jaEnviouKey);
    if (jaEnviou) continue;

    const progresso = calcProgresso(colab.rotinas || []);
    const atividadesColab = (atividadesHoje || []).filter(
      (a: { colaboradorId: string; data: string }) => a.colaboradorId === colab.id && a.data === hoje
    );
    const xpHoje = atividadesColab.reduce((acc: number, a: { xp?: number }) => acc + (a.xp || 0), 0);

    const tarefasConcluidas = (tarefas || []).filter(
      (t: { atribuidoPara: string; status: string }) => t.atribuidoPara === colab.id && t.status === "concluida"
    ).map((t: { titulo: string }) => ({ titulo: t.titulo }));

    const tarefasPendentes = (tarefas || []).filter(
      (t: { atribuidoPara: string; status: string }) =>
        t.atribuidoPara === colab.id && t.status !== "concluida"
    ).map((t: { titulo: string; prioridade: string }) => ({ titulo: t.titulo, prioridade: t.prioridade }));

    const html = emailTarde({
      nome: colab.nome,
      cor: colab.cor,
      pctRotinas: progresso.pct,
      rotinasConcluidas: progresso.feitas,
      rotinasTotal: progresso.total,
      tarefasConcluidas,
      tarefasPendentes,
      xpGanhoHoje: xpHoje,
      streak: colab.streak || 0,
    });

    const data = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    const res = await enviarEmail(colab.email, `Resumo do dia ${data} — Painel Izzat`, html);
    if (res.ok) {
      await redis.set(jaEnviouKey, "1", { ex: 60 * 60 * 20 });
      enviados.push(colab.nome);
    }
  }

  return NextResponse.json({ ok: true, enviados });
}
