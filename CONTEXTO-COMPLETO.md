# CONTEXTO COMPLETO — Super Painel Izzat (handoff p/ novo chat)

> Cole este arquivo (ou peça pra ler) num chat novo pra continuar do zero sabendo tudo. Atualizado 2026-06-22.

## O que é
Super painel de gestão do Grupo Izzat. **Next.js** (versão custom — ver `AGENTS.md`: NÃO é o Next padrão, ler `node_modules/next/dist/docs/` antes de APIs novas), React, TypeScript, Tailwind v4. Deploy **Vercel** (branch `main` = produção auto-deploy; trabalho em `dev`, merge `dev→main` só quando validado). Local: `C:\Users\denil\painel-izzat`. Live: `painel-izzat-19n3.vercel.app`.

Unifica 3 painéis: (1) gestão de equipe (rotinas/tarefas/gamificação — já existia), (2) **Operação** (pedidos/ADS/P&L por loja — Supabase), (3) **Precificação** (avaliar→precificar→decidir→esteira — Supabase). Mais Integrações, Ferramentas, visual premium.

## Stacks de dados (IMPORTANTE — 2 mundos)
- **Zustand + localStorage** (`lib/store.ts`, version persist): equipe, colaboradores, lojas (LOJAS const em `lib/data.ts` + `lojasCustom`), produtos/catálogo (kanban esteira), rotinas, tarefas, gastos, links. `criarLoja`/`editarLoja` existem; `criarProdutoEmLojas` (usado no handoff da precificação).
- **Supabase** (`lib/supabase.ts`, anon key pública OK; tabelas `op_*`, `prec_*`, `loja_integracoes`): Operação e Precificação. RLS aberto (`using(true)`). Service role NUNCA no client/repo.
- Ponte: precificação (Supabase) → "enviar pra esteira" chama `criarProdutoEmLojas` (Zustand). Projetado×Real e sócios leem op_pedidos (Supabase).

## Segurança / regras de trabalho
- Commit/push só quando o usuário pede (ele pede direto). Sempre `dev` → merge `main`.
- `npx tsc --noEmit` + `npx next build` antes de cada commit. Build wrapper custom (saída "Time/Errors/Warnings"); `.next/BUILD_ID` existe = passou.
- PowerShell 5.1 corrompe acento UTF-8 → usar Edit/Write, não echo/Set-Content. Commits/código em PT mas sem acento nas msgs de commit (ASCII).
- DDL (CREATE/ALTER TABLE) o USUÁRIO roda no Supabase SQL Editor (anon não cria). Sempre entregar o SQL pra ele colar.
- Idioma: PT-BR. Modo caveman ativo (terso; código normal).

## Supabase — tabelas existentes (todas já criadas/rodadas)
- `op_pedidos` (loja_id, data, num_pedido, fornecedor, custo_produto, frete, faturamento, produto, status:""|reembolso|disputa, **canal**, **tipo_cliente**, notas)
- `op_ads` (loja_id, data, valor, plataforma)
- `op_config` (loja_id, gateway_fee, shopify_fee, imposto, ads_budget, margem_alvo)
- `op_metas` (loja_id, mes, ano, meta_faturamento, meta_lucro, meta_pedidos)
- `prec_config` (loja_id, markup, gateway_fee, shopify_fee, reembolso, mkt, margem_min, cambio_usd_brl)
- `prec_paises` (loja_id, cod, nome, moeda, cambio, imposto, tier, markup_override, **duty**)
- `prec_produtos` (loja_id, nome, nota_garimpo, garimpo jsonb, status: avaliando|aprovado|lista_espera|enviado)
- `prec_fornecedores_prod` (produto_id, nome, link, custo, frete, prazo, titular)
- `prec_custos` (produto_id, pais_cod, custo_produto, frete)
- `loja_integracoes` (loja_id, plataforma, status, conta, ultima_sync, obs) — UNIQUE(loja_id,plataforma)
- Arquivos SQL no repo: `supabase-precificacao.sql`, `supabase-integracoes.sql` (+ os antigos op).

## Módulos prontos (NÃO refazer)
### Operação (`/operacao`, `components/operacao/OperacaoLoja.tsx`, `lib/operacao.ts`) — admin
Sub-abas: Resumo (KPIs+P&L real+alertas), Gráficos (diária/semanal/fornecedor/ABC/heatmap/previsão), **Canais** (serieCanal: ROAS/CPA/recompra por canal — BarCard recuado), **Caixa** (fluxoCaixa: BRL, descasamento Shopify ~7d, toggle BRL/USD, /api/cambio), Metas, Anual (+LTV), Pedidos (CRUD+CSV, campos canal/tipo_cliente), ADS (CRUD+simulador), Taxas. Digest diário: `app/api/cron/operacao-daily`.

### Precificação (`/precificacao`, `components/precificacao/PrecificacaoApp.tsx`, `lib/precificacao.ts`) — time todo
9+ sub-abas: **Comece aqui** (trilha guiada, default), Avaliar (Nota de Garimpo, GaugeArc SVG + sub-barras), Motor de Preços (multi-fornecedor titular+2, custo por país, ofertas 1un/2un/Kit, tabela 10 países c/ markup região+duty+veredito), Decisão/Ranking, **Projetado×Real** (margem bruta proj vs real do op_pedidos, casa por nome), **Unit Economics** (CAC/LTV/payback, âncora real op_pedidos/op_ads), **Risco** (chargeback: taxa disputa vs 1%), Lista de espera (→ "Enviar pra esteira" = criarProdutoEmLojas), Países (editor 10 tiers, seed), Taxas, Ajuda (glossário). Tooltips `PrecTip` + dict `AJUDA`.
- Motor de cálculo validado vs gabarito: US markup3 → preço $82.50/margem 35%/CPA $50.88; margem = 1−taxas−mkt−imposto−(1+reembolso+duty)/markup. markupSugerido p/ bater margem_min. reembolsoPorPrazo (≤10 base/11-20+3/21-30+8/>30+15). Tiers/impostos: US/HK 0%, UAE 5%, AU/JP 10%, CA 13%, SA 15%, UK 20%, IE 23%. UK/IE precisam markup 3.5×/3.9×.
- Atalho "Precificar produto" + "Conexões" na página da loja.

### Integrações (`/integracoes`, `components/integracoes/ConexoesModal.tsx`, `lib/integracoes.ts`) — ESQUELETO
Status only (sem API ligada). PLATAFORMAS: shopify(fácil)/meta(médio)/google(burocrático)/tiktok(médio). Twitter fora. Botão "Conexões" por loja + página matriz lojas×plataformas. **Próximo real:** ligar Shopify (token server-side, rota Next) → puxa pedidos pra op_pedidos.

### Ferramentas (`/ferramentas`, `lib/ferramentas.ts`) — time todo
- **Calculadora flutuante GLOBAL** (`components/FloatingCalculator.tsx`, montada no RootLayout → persiste entre páginas + localStorage). Arrastável/minimizável. Básica + Precificação.
- **Calendário** kanban 12 meses (Tier→país→eventos com dia+nome+nota cultural; 🌐global/📍local/~móvel).
- **Fuso**: relógio mundial dos mercados + conversor "meia-noite local→horário BR".

## Visual premium (BIG APP) — aplicado
Fonte: **Manrope** (corpo) + **Bricolage Grotesque** (títulos h1/h2/h3/.text-kpi) via next/font em `app/layout.tsx` + `globals.css` (var --font-head). Paleta exata: --bg #0A1626, --card #112239, --gold #C9A442 + --gold-br #E8C462, --text #EDF1F6. Botão `.btn-primary` gradiente dourado. **Retint global (46 arquivos)**: borda `#1e3356`→`rgba(201,164,66,.16)` (hairline dourada), card `#122039`→`#112239`. Classes: `.hbar-track`/`.hbar-fill` (barra recuada c/ valor dentro), `.num-gold` (número ouro vivo), `--grad-gold/green/blue/red`. GaugeArc (arco SVG). BarCard (Canais). Sidebar: fonte 14.5px, ícone ativo em gold-br, botão recolher maior. Animações/layout/auditoria Apple INTACTOS — só cor/fonte/acento.

## Menu (Sidebar `components/Sidebar.tsx`)
Seções: Principal (Dashboard/Tarefas) · Equipe (Atividade/Regras/Equipe/Rotinas/Semana — adminItems) · Lojas (Lojas + Produtos) · **Precificação** (visível a todos) · **Ferramentas** (todos) · Controle Geral (admin: Operação/Integrações/Custos Equipe/Custos Operacionais/Custo Total/Vagas) · Pessoal (Sono/Desafios).

## FEITO (2026-06-22) — Remuneração Variável / Sócios-gestores ✅ no ar
**Conceito:** além do salário FIXO (colaborador), modelo VARIÁVEL: pessoa experiente vira "sócio-administrador" de UMA loja (cuida como dona: Insta, campanhas, otimização) sem ônus (não investe/não banca prejuízo). Ganha **% do lucro OU do faturamento** (configurável por pessoa/loja), fixa na %, varia com resultado. Ex: 30% do lucro; loja R$100k→R$30k.

**Implementado:** `lib/data.ts` tipo `SocioGestor` (id, nome, contato?, colaboradorId?(vínculo opcional), lojaId, base:'lucro'|'faturamento', percentual, ativo, criadoEm). Store: `socios[]` + `criarSocio`/`editarSocio`/`deletarSocio` + `deletarLoja` (remove sócios órfãos). `lib/socios.ts`: `calcularGanhoSocio`/`calcularGanhosMes` puxam P&L da Operação (`calcularKpis` → lucroReal/faturamento do mês); prejuízo→ganho 0. Página `/socios` (Sidebar Controle Geral "Sócios & Variável"): aba **Sócios** (CRUD + ganho do mês + total variável, mês selecionável) + aba **Remuneração** (consolida fixo+variável por pessoa; vínculo na mesma linha; sócio externo linha própria; SEPARADA do Custo Total atual). Valores rotulados R$ (caveat: op_pedidos pode estar em USD — usuário pensa em BRL; não há conversão; revisar moeda quando definir).

### DECISÕES fechadas (do conceito original):
**Decisões fechadas (perguntas respondidas):**
1. Base % = **configurável por pessoa/loja** (lucro OU faturamento).
2. Valor (lucro/faturamento) **puxa do módulo Operação** (P&L já existe por loja/mês); auto quando API entrar.
3. Prejuízo (lucro negativo) → gestor ganha **R$0** (nunca negativo).
4. Sócio = **entidade SEPARADA** dos colaboradores no painel (formulário próprio, sempre separado visualmente). MAS a mesma pessoa pode ser colaborador (fixo) E sócio (variável) — **vínculo opcional a colaborador**, amarrado mas em abas distintas. Ex: ganho R$1000 fixo (aba fixos) + % da loja Y (aba sócios), mesma pessoa ligada.
5. Cadastro em **vários lugares** (personalizável): na Equipe (aba separada sócios), na página da Loja (bloco "sócio-administrador", SEPARADO do "responsável" atual que é fixo), e em Custos.
6. Aba Sócios/Variável: **mês selecionável** (igual Operação), puxa resultado do mês.
7. Nova aba **"Remuneração"** = soma fixo + variável por pessoa, SEPARADA do "Custo Total" atual (que fica intacto).
8. Também quer **CRUD de lojas** na aba Lojas (adicionar/editar/remover) — `criarLoja`/`editarLoja` já existem no store; falta `deletarLoja` + UI.

**Modelo de dados proposto (Zustand store):**
```ts
interface SocioGestor {
  id: string; nome: string; contato?: string;
  colaboradorId?: string;      // vínculo opcional a colaborador existente
  lojaId: string;
  base: "lucro" | "faturamento";
  percentual: number;          // ex 30
  ativo: boolean; criadoEm: string;
}
// store: socios: SocioGestor[]; criarSocio/editarSocio/deletarSocio
```
Cálculo do ganho do mês = base==="lucro" ? max(0, lucroReal) : faturamento — do op_pedidos/op_ads daquela loja/mês (reusar calcularKpis de lib/operacao: kpis.lucroReal e kpis.faturamento). × percentual/100.

**Feito:** store `socios`+CRUD+`deletarLoja`; lib/socios.ts; página `/socios` (abas Sócios + Remuneração); item no Sidebar.

**Falta (pequeno, próximo passo):**
1. Bloco "Sócio-administrador" INLINE na página da Loja (`app/lojas/[id]/page.tsx`) — hoje cadastra via select de loja no `/socios`. Separar visualmente do "responsável" (que é fixo). Header da loja já tem botões "Precificar produto"+"Conexões" (estado `conexoesAberto`).
2. Equipe: marcar/separar sócios dos colaboradores (seção própria na aba Equipe).
3. Aba Lojas: UI add/editar/REMOVER loja (store já tem `criarLoja`/`editarLoja`/`deletarLoja`; falta só a tela).
4. Moeda: definir se variável é BRL ou USD (op_pedidos vs salário BRL) — sem conversão hoje.

## Pendências gerais (Fase futura)
- Ligar API Shopify (pull pedidos→op_pedidos, token server-side) depois Meta (CSV primeiro). 
- Bordas douradas já aplicadas; se algum azul destoar, ajustar.
- Trilho recuado só nas barras principais (Canais/garimpo); Motor/Risco/Unit são tabelas.
- Datas calendário: móveis são aproximadas, editável v2.
- Memórias em `~/.claude/projects/C--Users-denil/memory/` (project_precificacao_panel, project_unificacao_paineis, project_painel_izzat, feedback_visual_premium, etc).
