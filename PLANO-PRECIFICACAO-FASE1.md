# Plano de execução — Módulo Precificação (Fase 1)

Objetivo: integrar o painel de Precificação no super painel (Next + Supabase), **sem quebrar nada existente** (operacional, store/Zustand, lojas, catálogo). Sequência respeitando dependências. Cada etapa valida antes da próxima.

## Regras de segurança (não quebrar o que existe)
1. Trabalhar na branch `dev`. Só merge `dev → main` no fim de cada fase validada.
2. Tabelas novas com prefixo `prec_` → zero colisão com `op_*` ou com o store.
3. **Só adicionar arquivos novos** (`lib/precificacao.ts`, `components/precificacao/*`, `app/precificacao/*`). Editar arquivos existentes só de forma ADITIVA (1 item no Sidebar, 1 botão na página da Loja).
4. NÃO tocar em `lib/store.ts`, `lib/data.ts`, módulo operacional — exceto adicionar (nunca alterar/remover) e só quando a etapa exigir.
5. `npx tsc --noEmit` + `npx next build` ao fim de cada etapa. Commit por etapa.
6. Cálculo validado contra o GABARITO antes de confiar (UAE 1un = preço $32.55 / margem 36.7%; US markup 3× → 35%; UK 3.6× → ~21%; IE 4.0×).
7. Câmbio/segredos: chave de API (se houver) em env var, nunca no client.

## Sequência (cada nº depende dos anteriores)

### Etapa 0 — Mapeamento (PRÉ-REQUISITO, sem editar nada)
- Ler `app/catalogo/page.tsx`, `lib/data.ts` (tipo `Produto`, `LOJAS`), `lib/store.ts` (ações `criarProdutoEmLojas`/`distribuirProduto`, `grupoId`) e `components/Sidebar.tsx`.
- Por quê primeiro: o passo "enviar pra esteira" (Etapa 10) cria um produto no catálogo que JÁ EXISTE. Sem entender o tipo Produto e a ação de criação, eu duplicaria/quebraria. Mapear campos: o que um `prec_produto` aprovado vira num `Produto`.
- Entrega: nota de mapeamento (quais campos, qual ação reusar). Zero edição.

### Etapa 1 — Schema Supabase (fundação de dados)
- SQL: `prec_config` (loja_id PK; markup, gateway%, shopify%, imposto_padrao%, reembolso%, mkt%, margem_min, cambio_usd_brl). `prec_paises` (loja_id, cod, nome, moeda, cambio, imposto, tier). `prec_produtos` (id, loja_id, nome, nota_garimpo, status: avaliando|aprovado|lista_espera|enviado). `prec_fornecedores_prod` (id, produto_id, nome, link, custo, frete, prazo, titular bool). `prec_custos` (produto_id, pais_cod, custo_produto, frete). RLS aberto (policy using(true)).
- Usuário roda no SQL Editor (como no operacional). Eu entrego o arquivo `supabase-precificacao.sql`.
- Depende de: nada. Valida: tabelas criadas (teste node CRUD).

### Etapa 2 — Camada de dados + motor de cálculo (`lib/precificacao.ts`)
- Tipos (espelham as tabelas) + CRUD Supabase + funções puras: `precoVenda`, `margemReal`, `cpaMax`, `beroas`, `markupRegiao`, `notaGarimpo`, `veredito`, `score`. `intervaloMes` não se aplica aqui.
- Depende de: Etapa 1 (runtime). Valida: `tsc` + script node compara saídas com o gabarito (UAE/US/UK).

### Etapa 3 — Câmbio do dia
- Rota `app/api/cambio/route.ts`: puxa cotação (API grátis), retorna USD→BRL e moedas locais; fallback manual de `prec_config`. Cache diário.
- Depende de: nada estrutural. Valida: rota retorna número; fallback funciona sem chave.

### Etapa 4 — Tela Config (taxas por loja, editável)
- `components/precificacao/ConfigPrec.tsx`: edita markup/taxas/margem_min/câmbio. Salva em `prec_config`.
- Depende de: 2. Valida: salva e relê.

### Etapa 5 — Editor de Países (10 tiers, editável por loja)
- Adiciona/remove/edita país (moeda, imposto, câmbio, tier). Seed dos 10 na 1ª vez.
- Depende de: 2. Valida: CRUD países.

### Etapa 6 — Avaliar Produto (Nota de Garimpo)
- `components/precificacao/AvaliarProduto.tsx`: 10 critérios ponderados, gauge ao vivo, veredito GARIMPAR/TALVEZ/DESCARTAR. Salva `prec_produtos` (status=avaliando, nota).
- Depende de: 1, 2. Valida: cria produto com nota.

### Etapa 7 — Motor de Preços (núcleo)
- `components/precificacao/MotorPrecos.tsx`: multi-fornecedor (1 obrigatório + 2 opcionais, titular), custo por país, cálculo ao vivo, ofertas 1un/2un/Kit, tabela 10 países com tier + markup por região + semáforo. Decomposição visual do preço.
- Depende de: 2, 4, 5, 6 (+ `prec_fornecedores_prod`, `prec_custos`). Valida: números batem com gabarito.

### Etapa 8 — Decisão / Ranking
- Score + veredito por produto×país, ordenado, com coluna "Por quê". Botão "Aprovar" muda status→aprovado.
- Depende de: 7. Valida: ranking coerente.

### Etapa 9 — Lista de espera (kanban)
- Produtos status=aprovado num kanban "aguardando". Botão "Enviar pra esteira".
- Depende de: 8. Valida: produto move de coluna.

### Etapa 10 — Handoff pra esteira (catálogo existente) ⚠️ etapa de maior risco
- Botão cria um `Produto` no catálogo que já existe, reusando a ação do store mapeada na Etapa 0. Marca `prec_produtos.status=enviado`.
- Depende de: 0 (mapeamento), 9. Valida: produto aparece no catálogo/kanban existente sem duplicar nem quebrar o fluxo atual.

### Etapa 11 — Menu + atalho na loja (aditivo)
- Sidebar: 1 item "Precificação" (seção própria, visível ao time). Página da Loja: 1 botão "Precificar produto" que abre o fluxo com a loja pré-selecionada.
- Depende de: telas prontas (4-9). Valida: navegação.

### Etapa 12 — Sistema de ajuda (tooltips + glossário)
- Dicionário central + ícone (i) hover/toque nos termos (margem real, CPA, BEROAS, markup, score, garimpo, tier...). Só no módulo Precificação.
- Depende de: telas. Valida: abre/fecha, não vaza.

### Etapa 13 — Validação final + deploy
- `tsc` + `build` + teste cálculo vs gabarito + smoke manual. Env vars já na Vercel. Merge `dev → main`. Usuário confirma live.

## Fora da Fase 1 (registrado em project_precificacao_panel.md)
Loop projetado×real, CAC/LTV/payback, duty/imposto importação, prazo→reembolso, chargeback, trilha guiada iniciantes, ajuda no painel inteiro, integrações Shopify/Meta, visual premium global.
