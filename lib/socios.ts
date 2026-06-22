"use client";
// Remuneração variável dos sócios-gestores. Puxa o resultado da loja do módulo Operação.
import { SocioGestor } from "./data";
import { listarPedidos, listarAds, obterConfig, calcularKpis } from "./operacao";

export interface GanhoSocio {
  socio: SocioGestor;
  faturamento: number;
  lucroReal: number;
  baseValor: number;   // o valor sobre o qual incide a % (lucro ou faturamento)
  ganho: number;       // o que o sócio recebe no mês
}

// Calcula o ganho de um sócio num mês/ano, lendo a Operação da loja dele.
export async function calcularGanhoSocio(socio: SocioGestor, mes: number, ano: number): Promise<GanhoSocio> {
  try {
    const [pedidos, ads, cfg] = await Promise.all([
      listarPedidos(socio.lojaId, mes, ano),
      listarAds(socio.lojaId, mes, ano),
      obterConfig(socio.lojaId),
    ]);
    const k = calcularKpis(pedidos, ads, cfg);
    const faturamento = k.faturamento;
    const lucroReal = k.lucroReal;
    const baseValor = socio.base === "lucro" ? Math.max(0, lucroReal) : faturamento; // prejuízo => 0
    const ganho = baseValor * (socio.percentual / 100);
    return { socio, faturamento, lucroReal, baseValor, ganho };
  } catch {
    return { socio, faturamento: 0, lucroReal: 0, baseValor: 0, ganho: 0 };
  }
}

export async function calcularGanhosMes(socios: SocioGestor[], mes: number, ano: number): Promise<GanhoSocio[]> {
  return Promise.all(socios.filter((s) => s.ativo).map((s) => calcularGanhoSocio(s, mes, ano)));
}
