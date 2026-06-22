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

export interface DataEvento { md: string; nome: string; tipo: "global" | "pais"; movel?: boolean; nota?: string }

// Datas e-commerce globais (valem pra quase todo mercado)
export const DATAS_GLOBAIS: DataEvento[] = [
  { md: "01-01", nome: "Ano Novo", tipo: "global", nota: "Início do ano, liquidações de estoque." },
  { md: "02-14", nome: "Valentine's Day", tipo: "global", nota: "Dia dos namorados global. Forte em presentes, joias, beleza." },
  { md: "10-31", nome: "Halloween", tipo: "global", nota: "Fantasias, decoração, doces. Pico nos EUA/UK." },
  { md: "11-11", nome: "Singles Day (11.11)", tipo: "global", nota: "Maior data de e-commerce do mundo (origem China). Gigante na Ásia." },
  { md: "11-28", nome: "Black Friday", tipo: "global", movel: true, nota: "4ª sexta de novembro. O maior pico de vendas do ano no Ocidente." },
  { md: "12-01", nome: "Cyber Monday", tipo: "global", movel: true, nota: "Segunda após a Black Friday, foco em produtos online/tech." },
  { md: "12-25", nome: "Natal", tipo: "global", nota: "Pico de presentes. Prazo de entrega é crítico — antecipe." },
  { md: "12-26", nome: "Pós-Natal / liquidações", tipo: "global", nota: "Queima de estoque pós-feriado." },
];

// Datas específicas por país (cultura/feriados que movem venda)
export const DATAS_PAIS: Record<string, DataEvento[]> = {
  US: [
    { md: "02-02", nome: "Super Bowl", tipo: "pais", movel: true, nota: "Final do futebol americano; maior evento de TV/anúncios do ano nos EUA." },
    { md: "05-12", nome: "Mother's Day", tipo: "pais", movel: true, nota: "2º domingo de maio. Presentes, flores, beleza." },
    { md: "07-04", nome: "Independence Day", tipo: "pais", nota: "Feriado nacional; promoções de verão e itens patrióticos." },
    { md: "09-02", nome: "Labor Day", tipo: "pais", movel: true, nota: "1ª segunda de setembro; liquidações de fim de verão." },
    { md: "11-28", nome: "Thanksgiving", tipo: "pais", movel: true, nota: "4ª quinta de novembro; véspera da Black Friday." },
  ],
  CA: [
    { md: "07-01", nome: "Canada Day", tipo: "pais", nota: "Feriado nacional canadense." },
    { md: "10-14", nome: "Thanksgiving (CA)", tipo: "pais", movel: true, nota: "2ª segunda de outubro (diferente dos EUA)." },
    { md: "12-26", nome: "Boxing Day", tipo: "pais", nota: "Maior dia de descontos do Canadá/UK, equivalente à Black Friday local." },
  ],
  UK: [
    { md: "03-30", nome: "Mothering Sunday", tipo: "pais", movel: true, nota: "Dia das Mães britânico, em março (não em maio)." },
    { md: "11-05", nome: "Guy Fawkes Night", tipo: "pais", nota: "Noite das fogueiras; fogos e eventos. Cultural do Reino Unido." },
    { md: "12-26", nome: "Boxing Day", tipo: "pais", nota: "Dia de descontos pesados, um dos maiores do ano no UK." },
  ],
  AU: [
    { md: "01-26", nome: "Australia Day", tipo: "pais", nota: "Feriado nacional; promoções de verão (verão no hemisfério sul)." },
    { md: "06-09", nome: "EOFY Sales", tipo: "pais", movel: true, nota: "Fim do ano fiscal (junho); grande temporada de liquidação na Austrália." },
    { md: "12-26", nome: "Boxing Day", tipo: "pais", nota: "Maior dia de vendas do varejo australiano." },
  ],
  IE: [
    { md: "03-17", nome: "St. Patrick's Day", tipo: "pais", nota: "Maior data cultural irlandesa; verde, festas, temático." },
    { md: "12-26", nome: "St. Stephen's Day", tipo: "pais", nota: "Equivalente ao Boxing Day; descontos pós-Natal." },
  ],
  SG: [
    { md: "02-10", nome: "Ano Novo Chinês", tipo: "pais", movel: true, nota: "Maior feriado da Ásia; presentes, vermelho/dourado, gastos altos." },
    { md: "08-09", nome: "National Day", tipo: "pais", nota: "Feriado nacional de Singapura." },
    { md: "11-11", nome: "11.11", tipo: "pais", nota: "Singles Day, enorme no sudeste asiático." },
    { md: "12-12", nome: "12.12", tipo: "pais", nota: "Segunda maior data de e-commerce asiática, após o 11.11." },
  ],
  HK: [
    { md: "02-10", nome: "Ano Novo Chinês", tipo: "pais", movel: true, nota: "Principal feriado; lojas fecham, mas pré-venda é forte." },
    { md: "10-01", nome: "Golden Week", tipo: "pais", nota: "Semana de feriados; alto consumo e turismo." },
    { md: "11-11", nome: "11.11", tipo: "pais", nota: "Singles Day." },
  ],
  UAE: [
    { md: "03-11", nome: "Ramadã (início aprox.)", tipo: "pais", movel: true, nota: "Mês sagrado; compras à noite, gastos sobem. Data muda todo ano." },
    { md: "04-10", nome: "Eid al-Fitr (aprox.)", tipo: "pais", movel: true, nota: "Fim do Ramadã; presentes e roupas novas, pico de consumo." },
    { md: "11-29", nome: "White Friday", tipo: "pais", movel: true, nota: "Versão da Black Friday no mundo árabe ('branca' em vez de 'preta')." },
    { md: "12-02", nome: "National Day", tipo: "pais", nota: "Dia nacional dos Emirados; promoções e patriotismo." },
  ],
  SA: [
    { md: "03-11", nome: "Ramadã (início aprox.)", tipo: "pais", movel: true, nota: "Mês sagrado; maior temporada de consumo da Arábia. Data muda." },
    { md: "04-10", nome: "Eid al-Fitr (aprox.)", tipo: "pais", movel: true, nota: "Fim do Ramadã; presentes, roupas, pico de gastos." },
    { md: "09-23", nome: "Saudi National Day", tipo: "pais", nota: "Dia nacional; grandes promoções e itens verdes." },
    { md: "11-29", nome: "White Friday", tipo: "pais", movel: true, nota: "Black Friday do mundo árabe." },
  ],
  JP: [
    { md: "01-01", nome: "Oshogatsu", tipo: "pais", nota: "Ano Novo japonês; 'fukubukuro' (sacolas-surpresa) bombam." },
    { md: "04-29", nome: "Golden Week", tipo: "pais", movel: true, nota: "Sequência de feriados no fim de abril/início de maio; alto consumo." },
    { md: "11-11", nome: "Pocky Day / 11.11", tipo: "pais", nota: "Data divertida (Pocky) + Singles Day." },
  ],
  BR: [
    { md: "05-12", nome: "Dia das Mães", tipo: "pais", movel: true, nota: "2º domingo de maio; 2ª maior data do varejo brasileiro." },
    { md: "06-12", nome: "Dia dos Namorados (BR)", tipo: "pais", nota: "No Brasil é em junho, não em fevereiro." },
    { md: "08-11", nome: "Dia dos Pais", tipo: "pais", movel: true, nota: "2º domingo de agosto." },
    { md: "10-12", nome: "Dia das Crianças", tipo: "pais", nota: "Forte em brinquedos e eletrônicos." },
  ],
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
