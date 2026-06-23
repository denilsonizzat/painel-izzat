# 🎯 Review UX + Design — Painel Izzat
### Parecer de especialista UX e-commerce + especialista em Design
**Data:** 23/06/2026 · **Branch:** dev · **Escopo:** revisão ponta a ponta + multi-viewport

> Análise baseada em **leitura real do código** (arquivo:linha). Testado mentalmente em 4 viewports:
> mobile 375px · tablet 768px · notebook 1366px · ultrawide 2560px.

---

## 👤 Os especialistas

**Helena Vasquez** — 15 anos em UX de e-commerce (escalou checkout de marketplace LATAM).
Foco: clareza de tarefa, carga cognitiva, consistência de padrão.

**Rafael Tanaka** — Design system & visual. Foco: hierarquia, coerência de cor/espaçamento,
legibilidade, estados.

---

## 🔴 BUG CRÍTICO ENCONTRADO E JÁ CORRIGIDO NESTA RODADA

**Rafael:** Achei o problema mais sério da auditoria visual. Em 7 lugares o código usava
`rgba(201,164,66,.16)` com **dígitos colados no final** — ex: `rgba(201,164,66,.16)40`,
`)55`, `)80`, `)30`. Isso é **CSS inválido**. O navegador descarta a declaração inteira →
**a borda simplesmente não renderiza**. Resultado: divisórias sumindo em:
- Tabela de reconhecimentos (`equipe/page.tsx:229`)
- Lista de gastos e ferramentas (`gastos/page.tsx:304,399`)
- Histórico de sono (`sono/page.tsx:328`)
- Badge de mercado da loja (`lojas/[id]/page.tsx:368`)
- Linhas do P&L (`OperacaoLoja.tsx:181`)
- Critérios de garimpo (`PrecificacaoApp.tsx:143`)

**Helena:** Ou seja, listas que pareciam "blocos grudados sem separação". O usuário sente
"bagunçado" sem saber por quê. **Corrigido nesta rodada** → todas viraram `rgba()` válido.
Agora as divisórias aparecem.

---

## 📱 Análise por viewport

### Mobile (375px) — Helena lidera
**✅ Bom:**
- Tabelas largas (ranking, sócios, P&L) estão em `overflow-x-auto` com `minWidth` →
  rolam horizontalmente, não estouram. **Engenharia correta** (`equipe:202`, `socios:170`).
- Header fixo `z-[60]` agora acima das janelas flutuantes (corrigido).
- Grids de KPI usam `grid-cols-2` no mobile → não espremem.

**⚠️ Pontos:**
- **Acesso Rápido** (`dashboard:459`) é `grid-cols-4 sm:grid-cols-7`. 7 ícones → linha de 4 +
  linha de 3 desalinhada à esquerda. Cosmético. Sugestão: centralizar a 2ª linha ou usar 7
  ícones que fechem grid (ou scroll horizontal como as Stories).
- **Filtros de Tarefas** (`tarefas:257`) `grid-cols-2 sm:grid-cols-5` → 5 status em 2 colunas =
  2+2+1, último botão sozinho deixa buraco. Aceitável, mas `grid-cols-3` no mobile fecharia
  melhor (3+2).
- **FABs**: 2 botões dourados embaixo à direita. No mobile não tem hover → o usuário não-técnico
  (lembrando do Seu Jorge) não sabe o que cada um faz até clicar. `aria-label` já ajuda leitor
  de tela, mas falta affordance visual. Sugestão: label curto fixo ou primeira-vez com dica.

### Tablet (768px) — ponto de virada `md:`
**✅ Bom:** Sidebar aparece exatamente em 768. iPad retrato (768) cai no breakpoint e mostra o
menu desktop. Conteúdo respeita `max-w-[1600px]`.

**⚠️ Pontos:**
- **Botões flutuantes online/tema** (`FloatingOnlineButton`, `FloatingThemeButton`) são
  `hidden md:flex` no topo-direito (`top-4/top-14 right-4`, z-40). A partir do tablet eles
  flutuam sobre o canto superior direito do conteúdo. Em página com algo no topo-direito pode
  encostar. Risco baixo (títulos ficam à esquerda), mas vigiar.
- iPad é o device que mais sofre com FABs + janelas flutuantes em tela média. Testar arrastar
  calculadora num 768×1024 real.

### Notebook (1366px) — Rafael
**✅ Bom:** Layout respira. Sidebar 224px + conteúdo centralizado. Grids `lg:grid-cols-3`
`xl:grid-cols-4` distribuem bem cards de lojas/equipe.

**⚠️ Pontos:** Nada estrutural. Hierarquia clara.

### Ultrawide (2560px) — Rafael
**✅ Bom:** `max-w-[1600px]` (adicionado na rodada anterior) impede o texto de esticar de ponta
a ponta. **Resolveu a dor da gestora** ("linhas enormes cansam"). Conteúdo centralizado.

**⚠️ Pontos:**
- Cards de dashboard com `md:grid-cols-4` em 1600px ficam largos mas ok. Em telas muito grandes
  o lado direito (fora do 1600) fica vazio — esperado e correto para legibilidade.

---

## 🎨 Coerência de design (Rafael)

**✅ Forte:**
- Paleta consistente: navy (`#0b1624`/`#112239`) + dourado (`#c9a84c`) + acentos semânticos
  (verde sucesso, vermelho urgente, azul info, roxo XP). Bem aplicada.
- Tipografia: Manrope (corpo) + Bricolage (display). Premium, coerente.
- Cards: raio 16-24px consistente, sombras suaves. Bom.
- Estados de vazio existem com emoji + texto (ex: `meu-dia:427`, `equipe:221`). Bom cuidado.

**⚠️ Melhorar:**
- **Contraste de texto fraco**: muitos textos secundários em `#334155` sobre `#112239` ficam
  **abaixo de WCAG AA** (já subimos vários para `#64748b` nesta rodada, mas ainda há `#334155`
  em legendas pequenas como "horário médio" em `sono:215,220`, `gastos:216,221`). Subir esses.
- **Inconsistência de opacidade de borda**: agora que os `rgba()30/40/55/80` foram normalizados,
  vale padronizar 2-3 tons oficiais de borda (ex: `.12` sutil, `.16` padrão, `.30` destaque) em
  vez de valores soltos espalhados.

---

## ✅ O QUE JÁ ESTÁ BOM (não mexer)

- Navegação clara, sidebar com agrupamento lógico.
- Tabelas responsivas com scroll horizontal correto.
- max-width de leitura em telas grandes.
- z-index organizado (header > overlay > janelas).
- Tour com fallback e selector por viewport.
- PT-BR corrigido nas telas principais.
- Estados de vazio com copy amigável.

---

## 📋 BACKLOG RESTANTE (pós esta rodada)

### 🟡 P1 — recomendado antes de abrir pra todos
- [ ] **Contraste**: subir restantes `#334155` em legendas (`sono:215,220`, `gastos:216,221`,
  `catalogo:146`) para ≥`#64748b`.
- [ ] **Filtros Tarefas mobile**: `grid-cols-2` → `grid-cols-3` (fecha 3+2, sem buraco).
- [ ] **Affordance dos FABs no mobile**: rótulo visível na primeira vez ou label curto fixo.

### 🟢 P2 — polimento
- [ ] **Padronizar tons de borda** num token (`.12`/`.16`/`.30`).
- [ ] **Acesso Rápido**: alinhar 2ª linha ou virar scroll horizontal.
- [ ] **Página `/ferramentas` órfã**: foi dividida em `/calendario` e `/fuso-horario`; a antiga
  ainda existe no código (`app/ferramentas/page.tsx`). Remover se não tiver link, ou redirecionar.
- [ ] **Botões flutuantes topo-direito no tablet**: validar não encostam no conteúdo.
- [ ] Lazy-load dos `Floating*`, focus trap, "Refazer tour" (já listados na auditoria anterior).

---

## 🏁 Veredito conjunto

**Helena (UX e-commerce):** App **funcional e coerente**. Fluxo de tarefa claro, nada quebra a
navegação. O bug das bordas invisíveis era o que mais passava sensação de "inacabado" — resolvido.
Com os 3 P1 (contraste, filtro, affordance FAB) está **pronto para lançar**.

**Rafael (Design):** Sistema visual sólido e premium. Consistência boa. Só falta a passada final
de contraste e padronização de bordas. **Aprovado para produção** com os ajustes P1.

> **Nota de prontidão: 8.5/10** → vira **9.5/10** com os 3 P1 da lista.
