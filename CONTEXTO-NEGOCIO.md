# Contexto de Negócio — Izzat Group
> Entender o negócio é essencial para tomar boas decisões de produto

## O que é o Izzat Group
Empresa de e-commerce internacional fundada por Mohamad Izzat. Opera lojas próprias e lojas de parceiros (modelo de gestão terceirizada). Time de ~10 pessoas trabalhando remotamente no Brasil e internacionalmente.

---

## Modelo de Negócio — Grupo Izzat (lojas próprias)

**Lojas** (`grupo: "izzat"`):
- Izzat Express Global — loja principal, testa produtos novos
- Apex Global — marca Apex para mercado global
- Ah Men (Apex BR) — versão brasileira da Apex
- Alpha Men Hair — produtos masculinos para cabelo (Brasil)
- Louvt — marca do grupo para mercado global

**Custo**: Izzat arca com TODOS os custos operacionais dessas lojas.
- Salários do time
- Ferramentas (IA, workspace, software)
- Tráfego pago (Meta Ads, TikTok Ads)
- Plataformas (Shopify, etc.)

**Funil de produto** (catálogo):
1. Produto é testado na **Izzat Express Global**
2. Se vender → **Validado**
3. Se validado → **Distribuído** para lojas nichadas (Apex, Alpha, etc.)
4. Se não vender → **Reprovado**

---

## Modelo de Negócio — Partners (lojas de clientes)

**Lojas** (`grupo: "partner"`):
- Injooy, Liora, Hago, HuggyPuppy, Loja da Marga

**Como funciona:**
1. Parceiro investe **$50.000 USD** com a Izzat
2. Izzat usa esse dinheiro para **montar e gerir a loja** do parceiro
3. Izzat garante retorno dos **$50.000 USD de lucro em até 18 meses**
4. Os $50k são **exclusivamente pela gestão** (mão de obra do time Izzat)
5. Todos os custos operacionais (ads, IA, Shopify, etc.) são **PAGOS PELO PARCEIRO**

**Por que isso importa no painel:**
- Gastos Partners NÃO entram no custo do grupo Izzat (`/custo-total`)
- Registramos os gastos de cada Partner para acompanhar o investimento deles rumo ao ROI
- Separação visual: Partners = "custo do parceiro", Izzat = "custo da empresa"

**Responsáveis por loja Partner:**
- Injooy → Mateus Torres
- Liora → Amanda Clark
- Hago → Ana Borges
- HuggyPuppy → Mauricio Batista
- Loja da Marga → Ana Borges (donoParceiro: "Marga")

---

## Estrutura de Custos — Grupo Izzat

### 1. Folha Salarial
- Campo `salario?: number` em cada `Colaborador`
- Editável em `/equipe/[id]` e visualizável em `/gastos` e `/custo-total`
- Alguns colaboradores podem não ter salário cadastrado (freelancer, sócio)

### 2. Ferramentas do Time
- Tipo: `"individual"` (de um colaborador) ou `"compartilhada"` (do time todo)
- Exemplos individuais: Claude Pro do Denilson, Canva da Amanda
- Exemplos compartilhados: Google Workspace, Notion
- Gerenciado em `/gastos` (aba Ferramentas)

### 3. Custos Operacionais por Loja
- **Fixos**: mensais recorrentes — Shopify, ChatGPT da loja, ferramentas de IA com contexto da loja
- **Variáveis**: específicos de um mês — Meta Ads, TikTok Ads, campanhas pontuais

**Sobre IA das lojas vs IA do time:**
- IA **do time** (ex: Claude Pro do Denilson) → Ferramentas do time em `/gastos`
- IA **de contexto da loja** (ex: ChatGPT só da Apex com contexto de produto) → Gasto Operacional da loja
- Motivo: cada loja terá uma IA com contexto específico para que qualquer membro do time (ou o parceiro) consiga acessar e ter o histórico completo daquela operação

---

## Regras Operacionais Registradas no Painel

| ID | Regra | Rigidez | Por que existe |
|---|---|---|---|
| regra-001 | Shopify só manual | Inegociável | Decisão pós-incidente com automação via IA — risco alto de erro |
| regra-002 | Subir arquivos no Drive | Inegociável | Centralização — arquivos locais se perdem |
| regra-003 | Meta Ads usar post existente | Inegociável | Post com engajamento orgânico = anúncio mais barato e eficaz |

---

## Pipeline de Produto (catálogo)

```
[Cadastrando] → [Em Teste] → [Validado] → [Distribuído]
                    ↘ [Reprovado] ↗ (pode reativar)
```

**13 campos obrigatórios** para sair de "Cadastrando" para "Em Teste" (`CAMPOS_PRODUTO` em `lib/data.ts`):
```
linkFornecedor | precoPorUnidade | precoPorFrete | taxaShopifyPct
valorLiquido | valorDeVenda | margemLucro | linkDriveImagem
linkDriveVideo | linkDriveGiff | linkGoogleDocsCopy | linkShopifyProduto
valorDolarNoDia
```

**Distribuição**: produto validado pode ser clonado para múltiplas lojas.
Cada cópia herda todos os dados **exceto** `linkShopifyProduto` (precisa ser atualizado em cada loja).

---

## Sistema de XP e Níveis dos Colaboradores

| Ação | XP |
|---|---|
| Subtarefa de rotina concluída | +10 |
| Sessão Pomodoro completa | +25 |
| Tarefa concluída | +30 |
| Entrega semanal concluída | +40 |
| Check-in diário | +50 |
| Missão da semana | +100 |

| Nível | Nome | XP mínimo |
|---|---|---|
| 1 | Iniciante | 0 |
| 2 | Aprendiz | 150 |
| 3 | Praticante | 400 |
| 4 | Avançado | 800 |
| 5 | Expert | 1500 |
| 6 | Mestre | 3000 |
| 7 | Lendário | 5000 |

---

## Próximo horizonte (ainda não implementado)

1. **Banco de dados real** — Supabase (PostgreSQL + auth Google)
2. **Login Google** — OAuth via Supabase Auth
3. **Hosting** — Vercel (conecta direto ao GitHub)
4. **Receita por loja** — para completar o P&L do grupo
5. **P&L completo** — custo total vs receita total = lucro/prejuízo por loja e do grupo
6. **Integração com painel externo** — Denilson tem outro painel com dados de vendas/anúncios

O usuário (Denilson) está aprendendo a fazer tudo isso com ajuda de IA, sem depender de programador externo.
