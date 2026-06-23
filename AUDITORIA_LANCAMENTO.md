# 🔍 Auditoria de Lançamento — Painel Izzat
### Mesa de debate técnico · "Como se lançasse amanhã"
**Data:** 23/06/2026 · **Branch:** dev · **Status:** pré-produção (Vercel)

> Formato: 12 especialistas de áreas distintas + 2 testadores reais. Cada um traz pontos
> baseados em **leitura real do código** (arquivo:linha citados). Ao final, backlog priorizado P0/P1/P2.

---

## 👥 A mesa

| # | Especialista | Área |
|---|--------------|------|
| 1 | **Renata** | UX / Usabilidade |
| 2 | **Caio** | Engenharia Mobile / Responsivo |
| 3 | **Bruno** | Arquitetura Frontend (estado, z-index) |
| 4 | **Letícia** | QA / Testes |
| 5 | **Diego** | Copy / Revisão PT-BR |
| 6 | **Aline** | Acessibilidade |
| 7 | **Marcos** | Product Manager |
| 8 | **Fernanda** | Performance |
| 9 | **Thiago** | Onboarding / Ativação |
| 10 | **Paula** | Design Visual / Marca |
| 11 | **Seu Jorge** | Testador real — colaborador (não-técnico) |
| 12 | **Dra. Sônia** | Testadora real — gestora/admin |

---

## 🗣️ O debate

### Rodada 1 — "O que está QUEBRADO agora"

**Caio (Mobile):** Acho o bug mais grave. O tour novo coloca `data-tour="sidebar"` no
`<aside className="hidden md:flex">` (`Sidebar.tsx:650-652`). No celular esse elemento é
`display:none`. Quando o tour chama `getBoundingClientRect()`, vem tudo **zero**. O spotlight
colapsa num quadradinho 0×0 no canto superior esquerdo. **No mobile o passo 2 do tour quebra
inteiro.** E a maioria da equipe abre no celular.

**Bruno (Arquitetura):** Pior: não é só o sidebar. O tour assume que todo `data-tour` existe e
é visível na rota atual. Não tem fallback. Se `querySelector` acha `null` ou rect zero, devia
**pular para o card centralizado** — hoje não pula direito.

**Letícia (QA):** Confirmo. Cenário de teste: abrir em viewport 375px → passo "Menu Lateral" →
borda dourada some / fica no canto. Reproduzível 100%.

**Renata (UX):** E no mobile o menu lateral nem é um `aside` — é um header `md:hidden`
(`Sidebar.tsx:666`) com hambúrguer. Então o passo do tour deveria apontar pro **botão de menu**,
não pra sidebar desktop. São dois alvos diferentes por viewport.

---

### Rodada 2 — "Sobreposição e empilhamento"

**Bruno:** Olhem a zona inferior-direita. Temos empilhados:
- `FloatingToolsMenu` → `bottom:90, right:24, z-40`
- `AdminFAB` → `bottom:24, right:24, z-30`
- `FloatingPomodoro/Calculator/ROAS/Calendario` → todos iniciam em
  `window.innerWidth-W, innerHeight-H` (mesmo canto)

Se o admin abre 2 janelas flutuantes, elas nascem **exatamente sobrepostas** no mesmo pixel
(`FloatingCalculator.tsx:49`). Ninguém escalona a posição inicial.

**Caio:** No mobile o `FloatingToolsMenu` (56px) fica a `bottom:90` e o `AdminFAB` (56px) a
`bottom:24`. Sobra ~10px entre eles. Quando o ToolsMenu abre o leque de 6 botões pra cima, os
balões de label podem encostar no conteúdo. Apertado, mas não cobre. **Aceitável, vigiar.**

**Bruno:** O problema sério é **z-index sem escala**. Janelas flutuantes são `z-50`, o header
mobile também é `z-50` (`Sidebar.tsx:666`). Uma janela arrastada pra cima **cobre o header**.
Notificações são `z-[9999]`, onboarding `9998–10001`. Não existe um sistema. Precisa de uma
tabela central de camadas.

**Fernanda (Performance):** São **8 componentes `Floating*` montados no layout raiz** em toda
página (`layout.tsx:63-70`). Cada um com `useEffect`, listener, localStorage. Não é fatal, mas
é peso morto em rota que não usa nenhum. Dá pra lazy-load.

---

### Rodada 3 — "Português e escrita"

**Diego (Copy):** Achei erros **visíveis ao usuário** (não comentário de código):
- `meu-dia/page.tsx:336` → "Registre o que **voce** se compromete a entregar **ate** sexta-feira" → *você / até*
- `meu-dia/page.tsx:431` → "tarefas que **voce** repete todo dia" → *você*
- `meu-dia/page.tsx:645` → "Como **voce** dormiu?" → *você*
- `sono/page.tsx:218` → "**Media** acordar" → *Média*
- `gastos/page.tsx:219` → "**Media** Salarial" → *Média*
- `gastos/page.tsx:426` → "**nao** cadastrado" → *não*

São poucos, mas "Como voce dormiu?" sem acento numa tela de destaque passa amadorismo.
**30 min de trabalho, alto impacto de percepção.**

**Paula (Marca):** Concordo. Marca premium dourado/navy com "voce" sem acento é dissonância
total. Faz um sweep de acentuação em tudo que é string renderizada.

---

### Rodada 4 — "Onboarding / primeira impressão"

**Thiago (Ativação):** O tour é a primeira coisa que o usuário novo vê. Hoje:
1. Quebra no mobile (já dito) — **P0**.
2. `CARD_H` é fixo em 300px (`Onboarding.tsx:63`) mas o card real cresce com a dica. O cálculo
   de posição usa altura falsa → em tela curta o card pode sair pra fora ou cobrir o alvo.
3. Não tem como **reabrir** o tour depois. Se eu pulo sem querer, era bom ter "Refazer tour" no
   Guia ou perfil.

**Renata:** E o passo 0/7 ("Bem-vindo") tem overlay clicável que **conclui** o tour
(`Onboarding.tsx:203` `onClick={concluir}`). Usuário clica no escuro achando que avança e
**fecha o tour sem querer**. Clicar fora não deveria encerrar — só o "Pular".

**Thiago:** Boa pegada. Clique no backdrop = avançar, ou nada. Nunca encerrar silencioso.

---

### Rodada 5 — "Acessibilidade"

**Aline (A11y):** Vários pontos:
- FABs e botões de ícone sem `aria-label`. Leitor de tela lê "botão" sem contexto.
- Tour não prende foco (focus trap). Tab vaza pra trás do overlay.
- Contraste: textos em `#334155` sobre `#112239` (ex: dica do tour, "Pular tour") ficam
  **abaixo de 4.5:1**. Cinza escuro demais. Reprova WCAG AA.
- `Esc` não fecha modais/janelas flutuantes. Esperado por qualquer usuário desktop.

---

### Rodada 6 — Testadores reais

**Seu Jorge (colaborador, no celular):** Eu só quero ver minhas tarefas do dia. Abri no
celular e apareceu uma caixa de boas-vindas, aí veio o check-in de humor junto, fiquei
confuso de qual fechar primeiro. *(Nota da mesa: o check-in agora espera o tour terminar —
`CheckInDiario.tsx` — mas só se `onboardingConcluido` virou true. Validar que não aparecem
juntos em sessão nova.)* Também: os botões redondos dourados embaixo, não sei o que cada um
faz. Não tem nome até eu clicar.

**Dra. Sônia (gestora, desktop):** Eu gerencio várias lojas. No dashboard a estatística de
admin melhorou (os dois cards). Mas quando arrasto a calculadora pra cima ela **passa por cima
da barra de cima** e eu perco o menu. E abri a calculadora e o ROAS juntos, **nasceram em cima
um do outro**, tive que arrastar no susto. Outra: em tela widescreen o conteúdo **estica de
ponta a ponta**, as linhas de texto ficam enormes, cansa ler.

**Marcos (PM):** Resumindo a dor da Sônia — falta **max-width de leitura** em telas grandes e
**escalonamento** das janelas. E o Jorge mostra que falta **rótulo permanente** ou tooltip
imediato nos FABs no mobile (onde não tem hover).

---

### Rodada 7 — Fechamento

**Bruno:** Minha lista curta de P0 (impede lançar): tour quebrado no mobile, z-index janela vs
header, janelas nascendo sobrepostas.

**Diego:** P0 também o sweep de PT-BR. É barato e é cara do produto.

**Letícia:** Adiciono: precisa de uma passada de QA em **3 viewports** (375 / 768 / 1440) clicando
tudo. Não temos teste automatizado, então checklist manual mínimo.

**Marcos:** Fechado. Vamos transformar em backlog priorizado.

---

## ✅ BACKLOG PRIORIZADO

### 🔴 P0 — Bloqueia lançamento (fazer hoje)

- [ ] **Tour quebra no mobile** — `data-tour="sidebar"` está em `aside hidden md:flex`. Adicionar
  `data-tour="menu-mobile"` no botão hambúrguer (`Sidebar.tsx:669`) e o tour escolher o alvo por
  viewport. Fallback: se rect for 0×0 ou elemento `null`, renderizar como card centralizado.
- [ ] **Janela flutuante cobre header** — definir escala de z-index central. Header mobile acima
  das janelas, ou janelas abaixo do header. (`Sidebar.tsx:666` z-50 vs `Floating*` z-50)
- [ ] **Janelas nascem sobrepostas** — escalonar posição inicial (offset +24/+24 por janela já
  aberta) em Pomodoro/Calculator/ROAS/Calendario.
- [ ] **Sweep PT-BR** — corrigir: `meu-dia:336,431,645` (voce/ate), `sono:218` (Media),
  `gastos:219,426` (Media/nao). Grep geral por strings sem acento renderizadas.
- [ ] **Clique no backdrop do tour encerra sem querer** (`Onboarding.tsx:203`) — backdrop não deve
  concluir; só o botão "Pular".

### 🟡 P1 — Importante (antes de abrir pra todos)

- [ ] **CARD_H dinâmico no tour** — medir altura real do card (ref + `getBoundingClientRect`) em
  vez de constante 300, pra não vazar em tela curta.
- [ ] **Validar tour + check-in não aparecem juntos** em sessão nova (confirmar gate
  `onboardingConcluido` em `CheckInDiario.tsx`).
- [ ] **Rótulo/tooltip imediato nos FABs no mobile** — mostrar label sem depender de hover.
- [ ] **max-width de leitura** no conteúdo em telas grandes (ex: `max-w-screen-xl` no `<main>`),
  mantendo dashboards largos onde fizer sentido.
- [ ] **`aria-label` em todos os botões de ícone** (FABs, header, notificações).
- [ ] **Contraste** — subir `#334155` em textos pequenos (dica do tour, "Pular tour") pra ≥4.5:1.
- [ ] **`Esc` fecha** modais e janelas flutuantes.

### 🟢 P2 — Polimento (pós-lançamento)

- [ ] **Lazy-load dos `Floating*`** — montar sob demanda em vez de 8 sempre no layout raiz.
- [ ] **Focus trap** no tour e modais.
- [ ] **"Refazer tour"** no Guia ou perfil (resetar `onboardingConcluido`).
- [ ] **Tabela de z-index documentada** em `globals.css` (comentário) ou constante TS.
- [ ] **Checklist QA manual** em 375 / 768 / 1440 antes de cada deploy.

---

## 📋 Plano de execução sugerido (ordem)

1. PT-BR sweep (rápido, isolado, zero risco)
2. z-index: criar escala e aplicar (header > janelas)
3. Tour mobile: alvo por viewport + fallback rect-zero
4. Tour backdrop: não encerrar no clique
5. Escalonar posição inicial das janelas
6. QA manual nos 3 viewports → corrigir o que aparecer
7. Deploy → testar em aba anônima na URL de produção

> **Veredito da mesa:** App **funcional, não quebra navegação**, mas o **tour quebra no mobile** e
> há **empilhamento de z-index** que envergonha numa demo. Com os 5 P0 resolvidos (estimativa
> ~meio dia), está apresentável pra lançar. P1 na mesma semana.
