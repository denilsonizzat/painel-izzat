"use client";
import { useState, useRef } from "react";

// Dicionário central de ajuda (resumo da lógica de cálculo). Fácil corrigir/traduzir num lugar só.
export const AJUDA: Record<string, { t: string; oque: string; calc?: string; ex?: string; sig?: string }> = {
  margem_real: { t: "Margem real", oque: "A margem que sobra após TUDO: custo, taxas, marketing, imposto e reembolso.", calc: "1 − taxas − marketing − imposto − (1+reembolso)/markup", ex: "EUA markup 3×, imposto 0 → 35%.", sig: "É a margem que decide. Abaixo de 20% o mercado fica arriscado." },
  cpa_max: { t: "CPA máximo", oque: "O máximo que dá pra pagar por venda em anúncio sem ter prejuízo.", calc: "preço × (1 − taxas) − custo", ex: "EUA: $82,50 × 0,95 − $27,50 = $50,88.", sig: "Anúncio acima disso por venda = prejuízo. Quanto maior, mais fácil escalar." },
  beroas: { t: "BEROAS", oque: "O ROAS mínimo pra empatar (ponto de equilíbrio).", calc: "preço ÷ CPA máximo", ex: "$82,50 ÷ $50,88 = 1,62.", sig: "Seu anúncio precisa dar ROAS acima disso. Abaixo, prejuízo." },
  markup: { t: "Markup", oque: "Quantas vezes você multiplica o custo pra achar o preço.", calc: "preço ÷ custo", ex: "Custo $27,50 × 3 = $82,50.", sig: "Padrão 3×. Países de imposto alto (UK, Irlanda) precisam de mais." },
  markup_regiao: { t: "Markup por região", oque: "Markup diferente por mercado, em vez de 3× fixo.", calc: "1,05 ÷ (0,70 − imposto − margem alvo)", ex: "UK (imposto 20%) precisa ~3,5×; Irlanda ~3,9×.", sig: "Resolve mercados que o 3× inviabiliza. Preço sobe — teste com cautela." },
  score: { t: "Score de viabilidade", oque: "Nota 0-100 que resume se vale lançar naquele mercado.", calc: "70% folga de CPA + 30% base; cai pela metade se margem < mínimo.", ex: "CPA folgado + margem ok = 100.", sig: "70+ com margem ok = pode lançar." },
  veredito: { t: "Veredito", oque: "Recomendação final: LANÇAR / TESTAR / NÃO LANÇAR.", calc: "LANÇAR = score ≥70, CPA ≥$25 e margem ≥mín. NÃO LANÇAR = CPA <$10 ou margem <mín.", sig: "Comece pelos verdes; teste os amarelos; evite/ajuste os vermelhos." },
  reembolso: { t: "Reembolso", oque: "Quanto você perde com devoluções, como % do custo.", ex: "5% no e-commerce pago no checkout (sem COD).", sig: "Configurável por loja. COD (contra-entrega) tem taxa bem maior." },
  tier: { t: "Tier de mercado", oque: "Classificação por prioridade estratégica.", ex: "A (foco): EUA/CA/UK/AU/IE. B (possível): SG/HK/UAE/SA/JP.", sig: "Foco no Tier A; Tier B quando fizer sentido." },
  nota_garimpo: { t: "Nota de Garimpo", oque: "Nota 0-100 que diz se vale testar o produto, ANTES de precificar.", calc: "Soma ponderada de 10 critérios (mercado, produto, viabilidade).", sig: "70+ vale testar; 45-69 com cautela; abaixo procure outro." },
  ofertas: { t: "Ofertas (bundles)", oque: "1un, 2un e Kit 3+1 (paga 3, leva 4).", sig: "O Kit tem markup menor (dá 1 grátis) mas costuma gerar mais lucro por venda." },
  duty: { t: "Duty (imposto de importação)", oque: "Taxa de importação por país sobre o custo do produto, absorvida por você.", calc: "desconta (duty% do custo) da margem", ex: "Duty 10% num custo $27,50 → ~$2,75 a menos de margem.", sig: "Configurável por país. Mercados com duty alto pedem markup maior." },
  prazo: { t: "Prazo → reembolso", oque: "Prazo de entrega longo gera mais devolução e chargeback.", calc: "≤10d: base · 11-20d: +3pts · 21-30d: +8 · >30d: +15", ex: "Reembolso base 5%, prazo 28d → 13% efetivo.", sig: "O reembolso efetivo do titular entra na margem. Fornecedor rápido protege o lucro." },
  cac: { t: "CAC", oque: "Custo de aquisição de cliente — quanto você gasta em anúncio por venda.", calc: "gasto ADS ÷ pedidos", ex: "$150 em ADS / 10 pedidos = $15 por cliente.", sig: "Se o CAC passa o lucro por compra, você subsidia a venda — só compensa se houver recompra." },
  ltv: { t: "LTV", oque: "Valor do cliente ao longo da vida (lucro total que ele gera).", calc: "lucro por compra × compras esperadas (1/(1−recompra))", ex: "Lucro $10, recompra 20% → 1,25 compras → LTV $12,50.", sig: "LTV alto justifica CAC maior. Recompra muda tudo." },
  payback: { t: "Payback", oque: "Quantas compras o cliente precisa fazer pra cobrir o CAC.", calc: "CAC ÷ lucro por compra", ex: "CAC $15, lucro $10/compra → 1,5 compras.", sig: "≤1 = lucra já na 1ª venda. >1 = depende de recompra pra pagar a aquisição." },
  chargeback: { t: "Chargeback (disputa)", oque: "Cliente contesta a cobrança no banco. Vem do status 'disputa' nos pedidos.", calc: "disputas ÷ total de pedidos", ex: "3 disputas em 200 pedidos = 1,5%.", sig: "Acima de ~1% o gateway pode BLOQUEAR sua conta — risco existencial. Cada disputa perde o produto + taxa do gateway." },
};

export function PrecTip({ k }: { k: string }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const h = AJUDA[k];
  if (!h) return null;
  return (
    <span ref={ref} className="relative inline-flex" style={{ marginLeft: 5 }}
      onMouseEnter={() => setAberto(true)} onMouseLeave={() => setAberto(false)}>
      <button onClick={(e) => { e.stopPropagation(); setAberto((v) => !v); }}
        className="inline-flex items-center justify-center rounded-full"
        style={{ width: 16, height: 16, fontSize: 10, fontWeight: 800, background: "#1e3356", color: "#94a3b8", border: "1px solid #334155" }}>i</button>
      {aberto && (
        <span className="absolute z-50 block text-left" style={{ bottom: "calc(100% + 6px)", left: 0, width: 250, background: "#0e2237", border: "1px solid #c9a84c40", borderRadius: 12, padding: "11px 13px", boxShadow: "0 12px 34px rgba(0,0,0,.55)", fontSize: 11.5, lineHeight: 1.5, color: "#e8edf5", fontWeight: 400 }}>
          <b style={{ color: "#e8c462", display: "block", marginBottom: 6, fontSize: 13 }}>{h.t}</b>
          <span style={{ display: "block", marginBottom: h.calc || h.ex || h.sig ? 6 : 0 }}>{h.oque}</span>
          {h.calc && <span style={{ display: "block", background: "#c9a84c12", borderLeft: "2px solid #c9a84c", padding: "5px 8px", borderRadius: 6, marginBottom: 6, fontFamily: "monospace", fontSize: 11 }}>{h.calc}</span>}
          {h.ex && <span style={{ display: "block", color: "#9aa7ba", marginBottom: 6 }}>Ex: {h.ex}</span>}
          {h.sig && <span style={{ display: "block", color: "#9aa7ba" }}>{h.sig}</span>}
        </span>
      )}
    </span>
  );
}
