"use client";
// Ferramentas: fuso horário + calendário de datas e-commerce por país.
// Países e tiers vêm da Precificação (prec_paises). Aqui ficam o fuso (IANA) e as datas.

// Fuso IANA por código de país (os dos tiers + BR de referência)
export const TZ_PAIS: Record<string, string> = {
  US: "America/New_York", CA: "America/Toronto", UK: "Europe/London", AU: "Australia/Sydney",
  IE: "Europe/Dublin", SG: "Asia/Singapore", HK: "Asia/Hong_Kong", UAE: "Asia/Dubai",
  SA: "Asia/Riyadh", JP: "Asia/Tokyo", BR: "America/Sao_Paulo",
};
export const TZ_BR = "America/Sao_Paulo";

export interface DataEvento { md: string; nome: string; tipo: "global" | "pais"; movel?: boolean }

// Datas e-commerce globais (valem pra quase todo mercado)
export const DATAS_GLOBAIS: DataEvento[] = [
  { md: "01-01", nome: "Ano Novo", tipo: "global" },
  { md: "02-14", nome: "Dia dos Namorados (Valentine's)", tipo: "global" },
  { md: "10-31", nome: "Halloween", tipo: "global" },
  { md: "11-11", nome: "Singles Day (11.11)", tipo: "global" },
  { md: "11-28", nome: "Black Friday (~4ª sex de nov)", tipo: "global", movel: true },
  { md: "12-01", nome: "Cyber Monday", tipo: "global", movel: true },
  { md: "12-25", nome: "Natal", tipo: "global" },
  { md: "12-26", nome: "Pós-Natal / liquidações", tipo: "global" },
];

// Datas específicas por país (cultura/feriados que movem venda)
export const DATAS_PAIS: Record<string, DataEvento[]> = {
  US: [{ md: "07-04", nome: "Independence Day", tipo: "pais" }, { md: "11-28", nome: "Thanksgiving", tipo: "pais", movel: true }, { md: "05-12", nome: "Mother's Day", tipo: "pais", movel: true }, { md: "09-02", nome: "Labor Day", tipo: "pais", movel: true }, { md: "02-02", nome: "Super Bowl", tipo: "pais", movel: true }],
  CA: [{ md: "07-01", nome: "Canada Day", tipo: "pais" }, { md: "10-14", nome: "Thanksgiving (CA)", tipo: "pais", movel: true }, { md: "12-26", nome: "Boxing Day", tipo: "pais" }],
  UK: [{ md: "12-26", nome: "Boxing Day", tipo: "pais" }, { md: "03-30", nome: "Mother's Day (UK)", tipo: "pais", movel: true }, { md: "11-05", nome: "Guy Fawkes", tipo: "pais" }],
  AU: [{ md: "01-26", nome: "Australia Day", tipo: "pais" }, { md: "12-26", nome: "Boxing Day", tipo: "pais" }, { md: "06-09", nome: "EOFY sales (fim ano fiscal)", tipo: "pais", movel: true }],
  IE: [{ md: "03-17", nome: "St. Patrick's Day", tipo: "pais" }, { md: "12-26", nome: "St. Stephen's Day", tipo: "pais" }],
  SG: [{ md: "08-09", nome: "National Day", tipo: "pais" }, { md: "02-10", nome: "Ano Novo Chinês", tipo: "pais", movel: true }, { md: "11-11", nome: "11.11 (forte na Ásia)", tipo: "pais" }, { md: "12-12", nome: "12.12", tipo: "pais" }],
  HK: [{ md: "02-10", nome: "Ano Novo Chinês", tipo: "pais", movel: true }, { md: "10-01", nome: "Golden Week", tipo: "pais" }, { md: "11-11", nome: "11.11", tipo: "pais" }],
  UAE: [{ md: "12-02", nome: "National Day", tipo: "pais" }, { md: "03-11", nome: "Ramadã (início aprox.)", tipo: "pais", movel: true }, { md: "04-10", nome: "Eid al-Fitr (aprox.)", tipo: "pais", movel: true } , { md: "11-29", nome: "White Friday", tipo: "pais", movel: true }],
  SA: [{ md: "09-23", nome: "Saudi National Day", tipo: "pais" }, { md: "03-11", nome: "Ramadã (início aprox.)", tipo: "pais", movel: true }, { md: "04-10", nome: "Eid al-Fitr (aprox.)", tipo: "pais", movel: true }, { md: "11-29", nome: "White Friday", tipo: "pais", movel: true }],
  JP: [{ md: "04-29", nome: "Golden Week", tipo: "pais", movel: true }, { md: "11-11", nome: "Pocky Day / 11.11", tipo: "pais" }, { md: "01-01", nome: "Oshogatsu (Ano Novo JP)", tipo: "pais" }],
  BR: [{ md: "08-11", nome: "Dia dos Pais", tipo: "pais", movel: true }, { md: "05-12", nome: "Dia das Mães", tipo: "pais", movel: true }, { md: "06-12", nome: "Dia dos Namorados (BR)", tipo: "pais" }, { md: "10-12", nome: "Dia das Crianças", tipo: "pais" }],
};

export function datasDoPais(cod: string): DataEvento[] {
  const especificas = DATAS_PAIS[cod] || [];
  return [...DATAS_GLOBAIS, ...especificas].sort((a, b) => a.md.localeCompare(b.md));
}

// Hora atual num fuso
export function horaEm(tz: string): string {
  try { return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()); }
  catch { return "—"; }
}
export function dataEm(tz: string): string {
  try { return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "short", day: "2-digit", month: "2-digit" }).format(new Date()); }
  catch { return "—"; }
}

// Quando é meia-noite no país-alvo, que horas é no Brasil?
// Calcula o offset entre o fuso alvo e o BR usando a hora atual (lida o DST automático).
export function meiaNoiteAlvoEmBR(tzAlvo: string): string {
  try {
    const agora = new Date();
    const fmt = (tz: string) => {
      const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hour12: false, minute: "2-digit" }).formatToParts(agora);
      const h = Number(p.find((x) => x.type === "hour")?.value || 0);
      const m = Number(p.find((x) => x.type === "minute")?.value || 0);
      return h * 60 + m;
    };
    const diffMin = fmt(TZ_BR) - fmt(tzAlvo); // BR está à frente(+) ou atrás(−) do alvo
    let br = (0 + diffMin) % (24 * 60); // meia-noite (0) no alvo + diff
    if (br < 0) br += 24 * 60;
    const h = Math.floor(br / 60), m = br % 60;
    const diaSeguinte = (0 + diffMin) >= 24 * 60 || (0 + diffMin) < 0 && br > 12 * 60 ? "" : "";
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}${diaSeguinte}`;
  } catch { return "—"; }
}
