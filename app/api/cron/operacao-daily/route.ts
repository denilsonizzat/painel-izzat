import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import { enviarEmail } from "@/lib/email";
import { LOJAS } from "@/lib/data";

function verificarSegredo(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const fmt$ = (n: number) => "$" + (n || 0).toFixed(2);

interface LinhaLoja {
  lojaId: string; nome: string; faturamento: number; custo: number; ads: number; lucro: number; pedidos: number; margem: number;
}

export async function GET(req: NextRequest) {
  if (!verificarSegredo(req)) return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ ok: false, erro: "Supabase nao configurado" });

  const sb = createClient(url, key);
  const agora = new Date();
  const mes = agora.getMonth() + 1, ano = agora.getFullYear();
  const mm = String(mes).padStart(2, "0");
  const ini = `${ano}-${mm}-01`;
  const fim = `${ano}-${mm}-${String(new Date(ano, mes, 0).getDate()).padStart(2, "0")}`;

  const [pRes, aRes] = await Promise.all([
    sb.from("op_pedidos").select("loja_id,custo_produto,frete,faturamento,status").gte("data", ini).lte("data", fim),
    sb.from("op_ads").select("loja_id,valor").gte("data", ini).lte("data", fim),
  ]);
  if (pRes.error || aRes.error) {
    return NextResponse.json({ ok: false, erro: pRes.error?.message || aRes.error?.message });
  }

  const nomeLoja: Record<string, string> = {};
  LOJAS.forEach((l) => { nomeLoja[l.id] = l.nome; });

  const mapa: Record<string, LinhaLoja> = {};
  function slot(id: string): LinhaLoja {
    if (!mapa[id]) mapa[id] = { lojaId: id, nome: nomeLoja[id] || id, faturamento: 0, custo: 0, ads: 0, lucro: 0, pedidos: 0, margem: 0 };
    return mapa[id];
  }
  (pRes.data || []).forEach((p: { loja_id: string; custo_produto: number; frete: number; faturamento: number; status: string }) => {
    const s = slot(p.loja_id);
    const c = (p.custo_produto || 0) + (p.frete || 0);
    s.custo += c;
    s.faturamento += p.status === "reembolso" ? 0 : (p.faturamento || 0);
    s.pedidos += 1;
  });
  (aRes.data || []).forEach((a: { loja_id: string; valor: number }) => { slot(a.loja_id).ads += a.valor || 0; });

  const linhas = Object.values(mapa).map((l) => {
    l.lucro = l.faturamento - l.custo - l.ads;
    l.margem = l.faturamento > 0 ? (l.lucro / l.faturamento) * 100 : 0;
    return l;
  }).sort((a, b) => b.faturamento - a.faturamento);

  const tot = linhas.reduce((t, l) => ({
    faturamento: t.faturamento + l.faturamento, custo: t.custo + l.custo,
    ads: t.ads + l.ads, lucro: t.lucro + l.lucro, pedidos: t.pedidos + l.pedidos,
  }), { faturamento: 0, custo: 0, ads: 0, lucro: 0, pedidos: 0 });
  const margemTot = tot.faturamento > 0 ? (tot.lucro / tot.faturamento) * 100 : 0;
  const roasTot = tot.ads > 0 ? tot.faturamento / tot.ads : 0;

  // Destinatários: admins do snapshot Redis; fallback GMAIL_USER
  let destinatarios: string[] = [];
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
      const raw = await redis.get<string>("painel-snapshot");
      if (raw) {
        const snap = typeof raw === "string" ? JSON.parse(raw) : raw;
        destinatarios = (snap.colaboradores || [])
          .filter((c: { nivelAcesso: string; email?: string }) => c.nivelAcesso === "admin" && c.email)
          .map((c: { email: string }) => c.email);
      }
    }
  } catch { /* ignora */ }
  if (!destinatarios.length && process.env.GMAIL_USER) destinatarios = [process.env.GMAIL_USER];
  if (!destinatarios.length) return NextResponse.json({ ok: false, erro: "Sem destinatarios" });

  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dataStr = `${MESES[mes - 1]} ${ano}`;
  const html = montarHtml(dataStr, tot, margemTot, roasTot, linhas);

  const enviados: string[] = [];
  for (const email of destinatarios) {
    const r = await enviarEmail(email, `Operação ${dataStr} — Fat. ${fmt$(tot.faturamento)} · Lucro ${fmt$(tot.lucro)}`, html);
    if (r.ok) enviados.push(email);
  }
  return NextResponse.json({ ok: true, enviados, lojas: linhas.length });
}

function montarHtml(dataStr: string, tot: { faturamento: number; custo: number; ads: number; lucro: number; pedidos: number }, margem: number, roas: number, linhas: LinhaLoja[]): string {
  const cor = (n: number) => (n >= 0 ? "#16a34a" : "#dc2626");
  const linhasHtml = linhas.length
    ? linhas.map((l) => `
      <tr>
        <td style="padding:8px 10px;border-top:1px solid #eee;font-weight:600">${l.nome}</td>
        <td style="padding:8px 10px;border-top:1px solid #eee;text-align:right">${fmt$(l.faturamento)}</td>
        <td style="padding:8px 10px;border-top:1px solid #eee;text-align:right">${fmt$(l.ads)}</td>
        <td style="padding:8px 10px;border-top:1px solid #eee;text-align:right;color:${cor(l.lucro)};font-weight:700">${fmt$(l.lucro)}</td>
        <td style="padding:8px 10px;border-top:1px solid #eee;text-align:right">${l.pedidos}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" style="padding:16px;text-align:center;color:#888">Sem movimento neste mês ainda.</td></tr>`;

  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f5f7;font-family:Segoe UI,Arial,sans-serif;color:#1a1a2e">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="background:#12102a;border-radius:16px 16px 0 0;padding:20px 22px">
      <div style="font-size:18px;font-weight:800;color:#fff">📊 Operação — Digest Diário</div>
      <div style="font-size:12px;color:#a8b4e8;margin-top:2px">${dataStr} · consolidado de todas as lojas</div>
    </div>
    <div style="background:#fff;padding:20px 22px">
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px">
        ${kpiBox("Faturamento", fmt$(tot.faturamento), "#2563eb")}
        ${kpiBox("Lucro", fmt$(tot.lucro), cor(tot.lucro))}
        ${kpiBox("ADS", fmt$(tot.ads), "#d97706")}
        ${kpiBox("Pedidos", String(tot.pedidos), "#7c3aed")}
        ${kpiBox("Margem", margem.toFixed(1) + "%", "#0891b2")}
        ${kpiBox("ROAS", roas.toFixed(1) + "x", "#16a34a")}
      </div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#888;margin-bottom:6px">Por loja</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="color:#888;font-size:11px;text-transform:uppercase">
          <th style="text-align:left;padding:0 10px 4px">Loja</th>
          <th style="text-align:right;padding:0 10px 4px">Fat.</th>
          <th style="text-align:right;padding:0 10px 4px">ADS</th>
          <th style="text-align:right;padding:0 10px 4px">Lucro</th>
          <th style="text-align:right;padding:0 10px 4px">Ped.</th>
        </tr></thead>
        <tbody>${linhasHtml}</tbody>
      </table>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:14px 22px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#999">
      Izzat Express · Painel de Operação · digest automático
    </div>
  </div></body></html>`;
}
function kpiBox(label: string, valor: string, cor: string): string {
  return `<div style="flex:1;min-width:90px;background:#f8f9fb;border:1px solid #eef0f4;border-radius:12px;padding:12px 10px">
    <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.4px">${label}</div>
    <div style="font-size:18px;font-weight:800;color:${cor};margin-top:3px">${valor}</div>
  </div>`;
}
