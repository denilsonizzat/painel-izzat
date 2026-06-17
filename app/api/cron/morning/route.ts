import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { enviarEmail } from "@/lib/email";
import { emailManha } from "@/lib/email-templates";

function verificarSegredo(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sem segredo configurado, permite (dev)
  return auth === `Bearer ${secret}`;
}

function horaAtualUTC(): string {
  const d = new Date();
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function minutosDesde(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  const d = new Date();
  const totalMinutosAgora = d.getUTCHours() * 60 + d.getUTCMinutes();
  const totalMinutosAlvo = hh * 60 + mm;
  return Math.abs(totalMinutosAgora - totalMinutosAlvo);
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
  const { colaboradores, tarefas } = snapshot;

  const hoje = new Date().toISOString().split("T")[0];
  const enviados: string[] = [];

  for (const colab of colaboradores) {
    if (!colab.email || !colab.formulario?.horarioInicio) continue;

    // calcula hora alvo = 1h antes do inicio
    const [hh, mm] = (colab.formulario.horarioInicio as string).split(":").map(Number);
    const alvoMin = hh * 60 + mm - 60; // 1h antes
    const alvoH = Math.floor(alvoMin / 60);
    const alvoM = alvoMin % 60;
    const horarioAlvo = `${String(alvoH).padStart(2, "0")}:${String(alvoM < 0 ? 0 : alvoM).padStart(2, "0")}`;

    if (minutosDesde(horarioAlvo) > 30) continue; // janela de 30 min

    // evita reenvio no mesmo dia
    const jaEnviouKey = `morning-${colab.id}-${hoje}`;
    const jaEnviou = await redis.get(jaEnviouKey);
    if (jaEnviou) continue;

    const rotinas = (colab.rotinas || []).filter((r: { ativa?: boolean }) => r.ativa !== false);
    const tarefasColab = (tarefas || []).filter(
      (t: { atribuidoPara: string; status: string }) =>
        t.atribuidoPara === colab.id && t.status !== "concluida" && t.status !== "atrasada"
    );

    const html = emailManha({
      nome: colab.nome,
      rotinas: rotinas.map((r: { titulo: string; subtarefas: { id: string }[] }) => ({ titulo: r.titulo, subtarefas: r.subtarefas?.length || 0 })),
      tarefas: tarefasColab.map((t: { titulo: string; prioridade: string }) => ({ titulo: t.titulo, prioridade: t.prioridade })),
      streak: colab.streak || 0,
      xp: colab.xp || 0,
      horarioInicio: colab.formulario.horarioInicio,
    });

    const res = await enviarEmail(colab.email, "Bom dia! Suas rotinas de hoje — Painel Izzat", html);
    if (res.ok) {
      await redis.set(jaEnviouKey, "1", { ex: 60 * 60 * 20 }); // 20h TTL
      enviados.push(colab.nome);
    }
  }

  return NextResponse.json({ ok: true, enviados, hora: horaAtualUTC() });
}
