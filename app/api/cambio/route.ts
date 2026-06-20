import { NextResponse } from "next/server";

// Câmbio do dia (USD base) via API grátis sem chave. Cache de 6h.
// Fallback: o front usa o câmbio manual do prec_config se a API falhar.
export const revalidate = 21600;

export async function GET() {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 21600 } });
    if (!r.ok) throw new Error("fx http " + r.status);
    const j = await r.json();
    const rates = j.rates || {};
    return NextResponse.json({
      ok: true,
      base: "USD",
      atualizado: j.time_last_update_utc || null,
      rates: {
        BRL: rates.BRL ?? null, CAD: rates.CAD ?? null, GBP: rates.GBP ?? null,
        AUD: rates.AUD ?? null, EUR: rates.EUR ?? null, SGD: rates.SGD ?? null,
        HKD: rates.HKD ?? null, AED: rates.AED ?? null, SAR: rates.SAR ?? null,
        JPY: rates.JPY ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, erro: String((e as { message?: string })?.message || e) });
  }
}
