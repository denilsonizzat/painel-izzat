// ─── Motor de recorrência de rotinas ──────────────────────────────────────────
// Calcula quando cada rotina vence com base na frequência + próxima ocorrência.
// Regra central: uma rotina "vence hoje" quando proximaOcorrencia <= hoje.
// Ao concluir, a proximaOcorrencia avança para o próximo ciclo automaticamente.

import { Rotina, Frequencia } from "./data";

/** Data de hoje no formato YYYY-MM-DD (fuso local). */
export function hojeStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Converte "YYYY-MM-DD" para Date no meio-dia local (evita bug de fuso). */
function parseData(data: string): Date {
  const [y, m, d] = data.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Formata Date para "YYYY-MM-DD". */
function fmtData(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Adiciona meses preservando fim de mês (ex: 31/jan +1 mês = 28/fev). */
function addMeses(d: Date, meses: number): Date {
  const r = new Date(d);
  const diaOriginal = r.getDate();
  r.setDate(1);
  r.setMonth(r.getMonth() + meses);
  const ultimoDiaDoMes = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(diaOriginal, ultimoDiaDoMes));
  return r;
}

/**
 * Calcula a próxima ocorrência a partir de uma data base.
 * @param frequencia frequência da rotina
 * @param base data base no formato "YYYY-MM-DD" (default: hoje)
 */
export function calcularProximaOcorrencia(frequencia: Frequencia, base: string = hojeStr()): string {
  const d = parseData(base);
  switch (frequencia) {
    case "diaria":     d.setDate(d.getDate() + 1); break;
    case "semanal":    d.setDate(d.getDate() + 7); break;
    case "quinzenal":  d.setDate(d.getDate() + 14); break;
    case "mensal":     return fmtData(addMeses(d, 1));
    case "trimestral": return fmtData(addMeses(d, 3));
    case "semestral":  return fmtData(addMeses(d, 6));
    case "anual":      return fmtData(addMeses(d, 12));
  }
  return fmtData(d);
}

/** Uma rotina vence hoje se está ativa e proximaOcorrencia <= hoje. */
export function venceHoje(rotina: Rotina): boolean {
  if (rotina.ativa === false) return false;
  const prox = rotina.proximaOcorrencia;
  if (!prox) return true; // rotina antiga sem data → considera devida
  return prox <= hojeStr();
}

/** Rotina está atrasada (deveria ter vencido antes de hoje). */
export function estaAtrasada(rotina: Rotina): boolean {
  if (rotina.ativa === false) return false;
  const prox = rotina.proximaOcorrencia;
  if (!prox) return false;
  return prox < hojeStr();
}

/** Foi concluída hoje? */
export function concluidaHoje(rotina: Rotina): boolean {
  return rotina.ultimaConclusao === hojeStr();
}

/** Filtra todas as rotinas que vencem hoje (qualquer frequência). */
export function rotinasQueVencemHoje(rotinas: Rotina[]): Rotina[] {
  return rotinas.filter(venceHoje);
}

/** Rotinas de um colaborador: onde ele é responsável OU dono de uma subtarefa. */
export function rotinasDoColaborador(rotinas: Rotina[], colaboradorId: string): Rotina[] {
  return rotinas.filter(
    (r) => r.ativa !== false &&
      (r.colaboradorId === colaboradorId || r.subtarefas.some((s) => s.colaboradorId === colaboradorId))
  );
}

/** Rotinas sem responsável definido (vão para o painel de Vagas & Pendências). */
export function rotinasSemResponsavel(rotinas: Rotina[]): Rotina[] {
  return rotinas.filter((r) => r.ativa !== false && !r.colaboradorId);
}

/** Rótulo legível da frequência. */
export const LABEL_FREQUENCIA: Record<Frequencia, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

/** Ordem das frequências para sub-abas. */
export const ORDEM_FREQUENCIA: Frequencia[] = [
  "diaria", "semanal", "quinzenal", "mensal", "trimestral", "semestral", "anual",
];

/** Formata "YYYY-MM-DD" para "DD/MM". */
export function fmtDataCurta(data: string): string {
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
}
