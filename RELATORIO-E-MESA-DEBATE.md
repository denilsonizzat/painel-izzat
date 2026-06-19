# Painel Izzat — Relatório Minucioso + Mesa de Debate de Refinamento

> Documento de análise do estado atual e plano de refinamento visual/UX para nível "Apple Store".
> Gerado em 2026-06-18. Nenhuma funcionalidade deve ser removida — apenas refinada.

---

# PARTE 1 — RELATÓRIO MINUCIOSO DO ESTADO ATUAL

## 1. O conceito central

O Painel Izzat é um **sistema de gestão de operação de e-commerce** construído sobre uma ideia dupla:

> **Controlar PESSOAS e LOJAS ao mesmo tempo — porque a performance da loja passa pela performance do time.**

Não é um "to-do list". É um cockpit onde o gestor enxerga, num só lugar: o que cada pessoa precisa fazer (o mínimo do dia), o que cada loja exige para rodar, e quanto tudo isso custa. A gamificação (XP, níveis, streak, desafios) existe para tornar a execução do mínimo diário algo viciante e recompensador.

**Público:** o Grupo Izzat (lojas próprias) + lojas parceiras (Partners). Dois níveis de acesso: **Gestor (admin)** vê tudo; **Colaborador** vê só o que é seu.

---

## 2. Arquitetura técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + TypeScript |
| Estilo | Tailwind v4 + tokens CSS custom |
| Estado | Zustand com `persist` (localStorage), **versão 22** |
| Ícones | lucide-react |
| Drag & drop | @dnd-kit/core (Kanban de produtos) |
| Backup | Snapshot a cada 5 min → Upstash Redis |
| E-mail | Nodemailer + Gmail SMTP (crons) |
| PWA | manifest + service worker (offline + push) |

**Sem banco de dados** ainda: tudo vive no Zustand/localStorage de cada navegador, com snapshot no Redis. Próximo passo natural: Supabase. **Sem chart libraries**: todos os gráficos são SVG puro ou divs com cálculo inline.

**Store (`lib/store.ts`)**: um único store com todas as entidades (colaboradores, rotinas, tarefas, lojas, produtos, desafios, gastos, etc.) e todas as actions. Versionado com migrações sequenciais — a v22 tirou as rotinas de dentro de cada pessoa e as transformou em lista própria.

---

## 3. Design System atual (o que existe hoje)

**Paleta base (tema Izzat Dark — padrão):**
- Fundo `#0b1624` · Card `#122039` · Card hover `#162843` · Borda `#1e3356` / `#2a4a7a`
- Dourado (marca/ações) `#c9a84c` · Texto `#e8edf5` · Texto fraco `#94a3b8` · Cinza `#64748b`
- Semânticas: verde `#10b981` (sucesso), azul `#3b82f6` (info/validado), roxo `#8b5cf6` (distribuir), vermelho `#ef4444` (erro/urgente), laranja `#f59e0b` (atenção)

**Raios (regra estrita):** card 16px · UI 12px · pequeno 8px · badge 999px.

**Transições:** rápida 150ms, normal 250ms, lenta 400ms — todas `cubic-bezier(0.4,0,0.2,1)`. `button:active → scale(0.96)`.

**Sombras/glow:** card 0 2px 12px, hover 0 8px 32px, glows dourado/verde/azul.

**Tipografia:** Inter (300–900) com `-webkit-font-smoothing: antialiased`.

**9 temas** trocáveis (Izzat Dark, Amatista, Oceano, Floresta, Carmesim, Quente, Sépia, Rosa, Claro) — cada um redefine bg/card/borda/cor de acento via CSS vars em runtime.

**Tooltip global** (`TipLayer` + `data-tip`): card escuro com borda dourada, fade-in, portal por cima de tudo.

---

## 4. O modelo mental: dois mundos que se cruzam

```
        PESSOAS  ←──────────────────────→  LOJAS
           │                                  │
       rotinas próprias               rotinas da loja
       tarefas avulsas                produtos / pipeline
       XP, nível, sono                custos operacionais
           │                                  │
           └────────── ROTINA ────────────────┘
              (uma rotina liga pessoa + loja;
               sobrevive se a pessoa sair)
```

A **Rotina** é a peça que costura tudo: pertence a uma loja (opcional) e a um responsável (opcional). Subtarefas podem ter donos diferentes. Se a pessoa sai, a rotina não morre — vai para **Vagas & Pendências**.

---

## 5. Mapa de navegação (menu lateral)

| Seção | Itens (todos) | Itens (admin) |
|---|---|---|
| 🏠 **Principal** | Dashboard · Tarefas | — |
| 👥 **Equipe** | Atividade · Regras · Formulário | Equipe · Rotinas · Semana do Time |
| 🏪 **Lojas** | Lojas | Produtos |
| 🎛️ **Controle Geral** | — | Custos da Equipe · Custos Operacionais · Custo Total · Vagas & Pendências |
| 🌙 **Pessoal** | Sono · Desafios | — |

Sidebar recolhível (fixar ou abrir só no hover, estilo Notion). Topo: logo + sino de notificações + busca global (pessoas/lojas/tarefas). Rodapé: avatar + nível + streak + sair.

---

## 6. Cada seção em detalhe + como conversam

### Dashboard (`/dashboard`)
Cockpit de entrada. Stories da equipe (24h), 4 KPIs clicáveis (Progresso do time, Tarefas ativas, Concluídas, Urgentes), Acesso Rápido (Chat, Meet, Drive, Miro, WhatsApp, Claude, tldv), Desafio da semana, Pulso semanal, ranking de progresso por pessoa. **Conversa com:** Tarefas, Equipe, Desafios.

### Tarefas (`/tarefas`) — coração da execução
Três abas:
- **Hoje** — tudo que vence hoje: rotinas devidas (qualquer frequência) + avulsas pendentes. Atualiza sozinho.
- **Rotinas** — sub-abas por frequência (Diária→Anual). Recorrência automática: conclui → próximo ciclo agendado.
- **Avulsas** — delegadas pelo gestor ou criadas pela própria pessoa (estilo Todoist).

**Modal kanban** ao clicar numa rotina: descrição da macro + subtarefas, cada uma com descrição/observação e botão "Iniciar" (Pomodoro disfarçado). **Conversa com:** Rotinas (admin), Lojas (rotina de loja), Pessoal (XP ao concluir).

### Equipe
- **Atividade** — histórico (conclusões, check-ins, XP) com filtro por pessoa e período.
- **Regras** — diretrizes em 3 rigidezes (inegociável/recomendado/maleável) e 6 categorias.
- **Formulário** — acompanhamento que cada colaborador preenche.
- **Equipe** (admin) — perfil de cada pessoa: rotinas, nível, contato, salário, Google Chat.
- **Rotinas** (admin) — CRUD de todas as rotinas, agrupadas por pessoa, filtros por frequência/loja.
- **Semana do Time** (admin) — visão semanal: entregas, status, quem está em dia/travado.

### Lojas
- **Lojas** — lista com risco operacional calculado (tarefas atrasadas + rotinas não cumpridas). Filtros grupo/mercado/risco.
- **Loja [detalhe]** — abas Visão Geral (tarefas, rotinas da loja, links, gastos, métricas) + Produtos (pipeline). É aqui que rotinas de loja nascem e são delegadas.
- **Produtos / Catálogo** (admin) — Kanban 5 colunas (Cadastrando → Em Teste → Validado → Distribuído / Reprovado) com drag & drop. 13 campos obrigatórios para um produto "ir ao ar".

### Controle Geral (admin)
- **Custos da Equipe** — salários + ferramentas (abas Resumo/Pessoas/Ferramentas).
- **Custos Operacionais** — por loja, separando Grupo Izzat (custo da empresa) de Partners (custo do parceiro).
- **Custo Total** — Folha + Ferramentas + Operações Izzat = quanto custa manter o grupo.
- **Vagas & Pendências** — rotinas sem dono (abas: "Sem responsável" e "Vagas de contratação").

### Pessoal
- **Sono** — registro privado, consistência, média de horas, gráfico SVG.
- **Desafios** — gamificação: card "Meu Progresso" (nível/XP/streak/% do dia), desafios do time com check-in diário, heatmap estilo GitHub, ranking semanal, feed com reações.

---

## 7. Mecanismos transversais

- **Recorrência (`lib/recorrencia.ts`)** — calcula a próxima ocorrência por frequência; "vence hoje" quando `proximaOcorrencia ≤ hoje`.
- **Gamificação** — +10 subtarefa, +25 Pomodoro, +30 tarefa, +50 check-in 100%; níveis Iniciante→Lendário; streak de dias seguidos.
- **Notificações** — sino in-app (rotinas do dia + tarefas delegadas) + base de Web Push pronta (falta chave VAPID + deploy).
- **Tooltips** — `data-tip` global com card bonito.
- **PWA + temas + Pomodoro flutuante + snapshot Redis + crons de e-mail (manhã/noite/admin).**

---

## 8. Fluxo de dados (quem alimenta quem)

```
Admin cria rotina (Rotinas ou Loja) ─→ aparece em Tarefas>Hoje da pessoa
Pessoa conclui ─→ +XP ─→ sobe nível ─→ reflete em Dashboard, Equipe, Semana, Atividade
Rotina sem dono ─→ Vagas & Pendências ─→ delega ─→ volta ao fluxo
Produto testado ─→ valida ─→ distribui p/ lojas nichadas (Catálogo)
Tudo ─→ snapshot Redis a cada 5 min (backup)
```

---
---

# PARTE 2 — MESA DE DEBATE: REFINAMENTO NÍVEL APPLE

> **Cenário:** mesa redonda. No centro, um iPhone com o Painel aberto e este relatório impresso. Cinco especialistas de altíssimo padrão analisam cada pixel. Objetivo: transformar este painel no "terceiro produto que a Apple venderia ao lado do iPhone" — dopamina visual, prazer tátil em cada clique, hierarquia impecável. **Nada de funcionalidade é removido.**

## Os 5 convidados

1. **Marcus Aurélio** — Designer Sênior de Human Interface (ex-Apple, time do macOS/iOS). Foco: hierarquia visual, espaçamento, tipografia, "calma" da interface.
2. **Lena Kovač** — Diretora de UX/Pesquisa (ex-Linear, ex-Stripe). Foco: carga cognitiva, fluxo, clareza, redução de fricção.
3. **Tom Iwasaki** — Interaction/Motion Designer (ex-Family, ex-Apple "Dynamic Island"). Foco: animação, microinterações, física, a "dopamina do clique".
4. **Priya Raman** — Especialista em Cor & Design Systems (ex-Figma, ex-Airbnb DLS). Foco: paleta, contraste, consistência de tokens, profundidade.
5. **David Okonkwo** — Especialista em Acessibilidade & Tipografia (WCAG, type setting). Foco: legibilidade, contraste AA/AAA, ritmo tipográfico.

---

## 🍎 Marcus Aurélio — Human Interface

**Diagnóstico:** "A base é séria — tokens definidos, raios consistentes. Mas falta o silêncio da Apple. Tudo tem borda de 1px sólida competindo por atenção. A Apple usa profundidade (sombra + leve diferença de luminância), não traço."

Pontos:
- **M1.** Trocar bordas sólidas `1px #1e3356` por separação via **elevação** (fundo levemente mais claro + sombra suave). Borda só onde há foco/seleção. Reduz "ruído de grade".
- **M2.** **Respiro (espaçamento).** Aumentar padding interno dos cards (16→20/24px) e o gap vertical entre seções. A Apple deixa o conteúdo respirar; hoje está apertado.
- **M3.** **Hierarquia tipográfica em escala.** Definir escala clara (ex: 28/20/15/13/11) e usar peso, não cor, para hierarquia. Números grandes (KPIs) podem ir a 34–40px com `letter-spacing` negativo (-0.03em) — vira "hero".
- **M4.** **Um só dourado de marca.** O dourado aparece em texto pequeno, badges, ícones, hover — está diluído. Reservar dourado para a **ação principal** de cada tela; o resto em neutros. Ouro vira evento, não ruído.
- **M5.** **Ícones com peso consistente** (stroke 1.5) e tamanho padronizado por contexto.

---

## 🧭 Lena Kovač — UX / Pesquisa

**Diagnóstico:** "Densidade de informação alta. O usuário premium quer sentir que o sistema pensou por ele. Há boas decisões (aba Hoje primeiro), mas a leitura ainda exige esforço."

Pontos:
- **L1.** **Estado vazio com alma.** Telas vazias ("nada para hoje") devem celebrar/orientar com ilustração leve e um próximo passo claro — não só um emoji.
- **L2.** **Foco em uma ação por tela.** Cada página deve ter UMA ação dourada óbvia. Hoje várias competem (vários botões dourados).
- **L3.** **Skeletons em vez de "pop".** Ao carregar, mostrar skeleton suave (shimmer) em vez do conteúdo aparecer seco. Sensação de fluidez.
- **L4.** **Consistência de padrões de aba.** Existem 3 estilos de "abas" diferentes (Tarefas, Loja, Vagas, Gastos). Unificar num único componente `Tabs` (pílula deslizante animada).
- **L5.** **Feedback de conclusão memorável.** Concluir rotina deveria ter um micro-momento de recompensa (check animado + leve haptic-like). Já existe celebração 100% — estender o prazer ao ato individual.

---

## ✨ Tom Iwasaki — Motion / Interação

**Diagnóstico:** "Aqui mora a dopamina. Hoje as transições são corretas (150ms ease) mas 'lineares de produtividade'. Falta **física** — spring, overshoot sutil, continuidade."

Pontos:
- **T1.** **Springs, não ease.** Migrar microinterações para curvas com leve overshoot (cubic-bezier(0.34,1.56,0.64,1)). Botão que "assenta" no lugar = prazer tátil.
- **T2.** **Hover com profundidade.** Cards: hover sobe 2px + sombra cresce + brilho de acento sutil. Ícone do card pode dar um micro-scale (1.0→1.08). Já existe parcialmente — padronizar e suavizar.
- **T3.** **Transição entre abas.** Conteúdo entra com fade + 8px de slide na direção da troca; a pílula da aba ativa desliza (layout animation), não pisca.
- **T4.** **Check de tarefa.** Círculo → preenche com spring + risca o texto em 200ms + +XP sobe e some. Vira o "som de moeda" visual.
- **T5.** **Tooltip premium.** O atual já é bom; adicionar leve subida (4–6px) + blur de fundo (backdrop) + arrow. Aparecer com 120ms de delay e curva spring.
- **T6.** **Page transitions.** Trocar de página com fade rápido (120ms) em vez de troca seca.
- **T7.** **Respeitar `prefers-reduced-motion`** (acessibilidade + classe).

---

## 🎨 Priya Raman — Cor & Design System

**Diagnóstico:** "Paleta bonita e coesa, mas usada de forma plana. Falta **profundidade tonal** e disciplina de uso semântico."

Pontos:
- **P1.** **Escala de superfície em 4 níveis** (bg → surface → card → elevated) com degraus de luminância sutis, em vez de bg+card+borda. Cria profundidade sem traço.
- **P2.** **Gradientes sutis nos cards** (ex: 160deg, +2% luminância no topo). Quase imperceptível, mas dá "vidro Apple".
- **P3.** **Acento com função fixa:** dourado = marca/ação; verde = sucesso; azul = info; vermelho = risco. Banir uso decorativo das cores semânticas.
- **P4.** **Cor com opacidade consistente** para fundos de badge (sempre `cor + 18`) e bordas (`cor + 30`). Hoje varia (15, 20, 22, 30, 40).
- **P5.** **Glow comedido.** Glow de acento só em foco/estado ativo, nunca permanente.
- **P6.** **Modo Claro precisa de carinho** — hoje é funcional, mas não no mesmo nível do dark.

---

## 🔤 David Okonkwo — Acessibilidade & Tipografia

**Diagnóstico:** "Premium também é legível por todos. Alguns textos em dourado/cinza sobre escuro estão no limite do contraste."

Pontos:
- **D1.** **Contraste.** Texto secundário `#64748b` sobre `#122039` fica ~3:1 — abaixo de AA para texto pequeno. Subir para `#94a3b8`+ em textos informativos. Dourado pequeno idem.
- **D2.** **Ritmo tipográfico.** Definir `line-height` por tamanho (corpo 1.5, títulos 1.15) e limitar larguras de leitura (~65ch) em descrições.
- **D3.** **Foco visível** (teclado): anel de foco dourado consistente em todos os interativos.
- **D4.** **Tamanho mínimo de toque** 44×44px nos alvos clicáveis (mobile/PWA).
- **D5.** **Hierarquia por peso** (já citado): reduzir uso de MAIÚSCULAS+tracking para labels; usar peso 600 + tamanho.

---

## 🧩 Síntese da mesa — Roadmap de refinamento priorizado

> Tudo é **refinamento visual/interação**. Nenhuma funcionalidade muda.

### P0 — Fundação visual (maior impacto, mexe em todas as telas via tokens)
1. **Sistema de superfícies em 4 níveis + gradientes sutis** (P1, P2, M1) — profundidade no lugar de bordas.
2. **Escala tipográfica + line-heights + contraste AA** (M3, D1, D2).
3. **Disciplina do dourado e cores semânticas** (M4, P3, P4).
4. **Curvas de animação spring globais + hover padronizado** (T1, T2).

### P1 — Microinterações de prazer
5. **Componente `Tabs` único com pílula deslizante animada** (L4, T3).
6. **Check de tarefa com spring + XP flutuante** (T4, L5).
7. **Tooltip premium (subida + backdrop + arrow)** (T5).
8. **Hover de card com elevação + micro-scale do ícone** (T2).

### P2 — Polimento de percepção
9. **Skeletons com shimmer no carregamento** (L3).
10. **Estados vazios com alma** (L1).
11. **Page transitions suaves + `prefers-reduced-motion`** (T6, T7).
12. **Foco de teclado + alvos de toque 44px** (D3, D4).
13. **Modo Claro no mesmo nível do Dark** (P6).

### Resultado esperado
Uma interface "silenciosa e profunda": menos traço, mais luz; um único ouro que guia o olho; cada clique com física que dá prazer; cada conclusão com uma pequena recompensa. O painel que dá vontade de mexer — dopamina visual.

---

## Próximo passo
Implementar na ordem P0 → P1 → P2, validando visualmente a cada bloco. Começar pela **fundação de tokens (P0)** porque ela refina todas as telas de uma vez.
