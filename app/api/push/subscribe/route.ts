import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Base para Web Push. Guarda as inscrições (PushSubscription) por colaborador
// no Upstash Redis. O ENVIO real será feito por um cron usando web-push +
// chaves VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) após o deploy.

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!redis) redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  return redis;
}

// Salva/atualiza inscrição de push de um colaborador.
export async function POST(req: NextRequest) {
  try {
    const { colaboradorId, subscription } = await req.json();
    if (!colaboradorId || !subscription) {
      return NextResponse.json({ ok: false, erro: "Faltam dados" }, { status: 400 });
    }
    const r = getRedis();
    if (!r) return NextResponse.json({ ok: false, erro: "Redis nao configurado" }, { status: 503 });
    // Hash: campo = colaboradorId, valor = subscription serializada
    await r.hset("push-subscriptions", { [colaboradorId]: JSON.stringify(subscription) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

// Remove inscrição (ao desativar notificações).
export async function DELETE(req: NextRequest) {
  try {
    const { colaboradorId } = await req.json();
    if (!colaboradorId) return NextResponse.json({ ok: false, erro: "Faltam dados" }, { status: 400 });
    const r = getRedis();
    if (!r) return NextResponse.json({ ok: false, erro: "Redis nao configurado" }, { status: 503 });
    await r.hdel("push-subscriptions", colaboradorId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
