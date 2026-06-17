import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  if (!redis) redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  return redis;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const r = getRedis();
    if (!r) return NextResponse.json({ ok: false, erro: "Redis nao configurado" }, { status: 503 });
    await r.set("painel-snapshot", JSON.stringify(body), { ex: 60 * 60 * 30 }); // 30h TTL
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const r = getRedis();
    if (!r) return NextResponse.json({ ok: false, erro: "Redis nao configurado" }, { status: 503 });
    const raw = await r.get<string>("painel-snapshot");
    if (!raw) return NextResponse.json({ ok: false, erro: "Sem snapshot" }, { status: 404 });
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, erro: String(err) }, { status: 500 });
  }
}
