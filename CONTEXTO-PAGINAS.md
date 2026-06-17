# Contexto Páginas — Todas as Rotas
> Todas as páginas do painel, o que fazem e quem acessa

## Controle de acesso
- **Admin**: Mohamad + Denilson — acesso total
- **Colaborador**: todos os outros — acesso restrito
- Guard pattern: `const isAdmin = usuarioAtual?.nivelAcesso === "admin"`
- Redirect para `/` se não logado; redirect para `/dashboard` se colaborador tenta rota admin

---

## Rotas e páginas

### `/` — Login
Todos acessam. Seletor de colaborador (sem senha — sistema interno).
Após login → `/dashboard`.

---

### `/dashboard` — Dashboard
**Todos acessam.** Render diferente para admin vs colaborador.

**Admin vê:**
- KPIs: tarefas abertas, rotinas hoje, equipe online, urgentes
- Acesso Rápido (7 atalhos com ícones reais SVG de marca)
- Alertas de risco por loja
- Stories do time
- Resumo geral da equipe

**Colaborador vê:**
- Suas tarefas do dia
- Seu progresso de rotinas
- Stories do time

**Acesso Rápido** (hardcoded em `app/dashboard/page.tsx`):
```
Chat (chat.google.com) | Meet | Drive | Miro | WhatsApp Web | Claude AI | tldv.io
```
Ícones SVG em `public/icons/`: `googlechat.svg`, `googlemeet.svg`, `googledrive.svg`,
`miro.svg`, `whatsapp.svg`, `anthropic.svg`, `tldv.svg`

---

### `/meu-dia` — Meu Dia
**Todos acessam.** Dados do próprio usuário.
- Rotinas do dia com subtarefas (check-in)
- Check-in diário com humor
- Banner de sono (inline, dispensável, lembra 1x por dia via localStorage)
- Entregas semanais
- XP ganho no dia

---

### `/tarefas` — Tarefas
**Todos acessam.** Colaborador vê só as dele; admin vê todas com filtro.
- 2 tipos: Rápida (simples) e Elaborada (com membros, subtarefas, contexto)
- Botões diretos "Nova Rápida" e "Nova Elaborada" — sem modal de seleção
- Fluxo de aprovação: `pendente → em_andamento → aguardando_revisao → concluida`
- Admin: botões Aprovar/Rejeitar
- Colaborador: pode marcar como "Travado" com motivo
- Read receipts: quem visualizou cada tarefa

---

### `/atividade` — Histórico de Atividade
**Todos acessam.** Admin pode filtrar por qualquer colaborador + período.
- Log de tudo que foi feito: tarefas, check-ins, rotinas, XP, sono

---

### `/formulario` — Formulário de Perfil
**Todos acessam.** Desaparece do menu após preenchido.
- 7 etapas psicológicas profundas
- Etapa 4: registro de horário de sono (opcional)
- Dados salvos em `colaborador.formulario`

---

### `/sono` — Registro de Sono
**Todos acessam.**
- Histórico de registros de sono com gráficos
- Streak de dias com registro
- Médias e insights

---

### `/equipe` — Lista da Equipe
**Todos acessam.** Admin vê botão "Adicionar Membro"; colaborador só lê o grid.
- Grid com todos os colaboradores
- Card: avatar, nome, cargo, XP, nível

---

### `/equipe/[id]` — Perfil do Colaborador
**Admin**: pode ver qualquer perfil. **Colaborador**: só o próprio.
- Foto, cargo, salário, habilidades (radar chart)
- WhatsApp: botão verde com link direto
- Google Chat: botão verde com link direto (admin adiciona link por colaborador)
- Histórico de reconhecimentos
- Pomodoro rápido

**Google Chat**: campo `googleChatLink?: string` em Colaborador.
URL de conversa direta: `https://mail.google.com/chat/u/0/#chat/dm/...`
Admin cola → aparece botão verde no perfil.

---

### `/regras` — Regras da Empresa
**Todos acessam.** Admin faz CRUD; colaborador só lê.
- 3 níveis de rigidez: Inegociável 🔴 / Recomendado 🟡 / Maleável 🟢
- 6 categorias: operacional / arquivos / qualidade / comunicação / segurança / outro
- Filtros por categoria e rigidez
- 3 regras pré-populadas (REGRAS_INICIAIS em `lib/data.ts`)

---

### `/desafios` — Desafios do Time
**Todos acessam.** Admin cria/edita/deleta; todos fazem check-in.
- Desafios com data início + fim obrigatória (nunca infinitos)
- Labels: "Tiro curto ⚡" (≤7d) / "Sprint 🏃" (≤14d) / "Formação de hábito 💪" (≤21d) / "Hábito sólido 👑" (30d+)
- 1 clique para check-in (toggle — pode desfazer)
- Status automático por datas: Em andamento / Próximo / Encerrado
- Por desafio: heatmap calendário + barra 7 dias + streak + milestones + leaderboard
- Feed do time: últimas 48h com reações emoji (👏🔥💪⭐🎯)
- Ranking semanal (reseta toda segunda-feira)

---

### `/lojas` — Lista de Lojas *(admin only)*
Grid de todas as lojas com indicador de risco.
Score de risco: tarefas atrasadas + rotinas não feitas.

---

### `/lojas/[id]` — Perfil da Loja *(admin only)*
- Header com logo da loja + cor da marca
- Botões: Nova Rotina | Nova Tarefa | Drive Geral | **Custos** ← NOVO
- **Botão Custos**: dropdown inline com 2 seções expansíveis:
  - **FIXOS** (verde): Claude AI, Workspace, plataformas recorrentes
  - **VARIÁVEIS** (âmbar): Meta Ads, TikTok, campanhas — por mês específico
  - Admin CRUD inline: adicionar/editar/remover/toggle ativo
- Tabs: **Visão Geral** | **Produtos (N)**
- Visão Geral: KPIs, rotinas, tarefas, membros
- Produtos: pipeline com 5 status + validar/reprovar/distribuir

---

### `/catalogo` — Catálogo Kanban *(admin only)*
Kanban com 5 colunas + drag-and-drop (`@dnd-kit/core`):
1. **Cadastrando** — campos incompletos
2. **Em Teste** — completo, sendo testado na Izzat Express Global
3. **Validado** — vendeu → pronto para distribuir
4. **Distribuído** — clonado para lojas nichadas
5. **Reprovado** — não funcionou

**DnD**: card inteiro é arrastável (não só o grip handle). `distance: 8` evita conflito com cliques.
Arrastar para Validado/Reprovado/Distribuído → dispara ação. Modal de distribuição para escolher lojas.
Filtros: Tipo (Todos/★ Originais/↗ Cópias) + Loja.

---

### `/rotinas` — Rotinas *(admin only)*
Admin cria rotinas que aparecem para colaboradores no Meu Dia.

---

### `/semana` — Semana do Time *(admin only)*
Entregas semanais de cada colaborador. Visão do progresso da semana.

---

### `/gastos` — Gastos Equipe *(admin only)*
Controle de custos do time:
- Folha salarial (salário de cada colaborador)
- Ferramentas (por colaborador ou compartilhadas)
- Tabs: Resumo Geral | Pessoas | Ferramentas
- "Confidencial" badge no header

---

### `/gastos-operacoes` — Custos Operacionais *(admin only)* — NOVO
Custos por loja separados em dois grupos:

**Aba Grupo Izzat** (`grupo: "izzat"`):
- Banner: "Custo da empresa Izzat — sai do caixa próprio"
- Lojas: Izzat Express Global, Apex Global, Ah Men, Alpha Men Hair, Louvt
- Cada loja expansível: seção FIXOS (verde) + VARIÁVEIS (âmbar) por mês

**Aba Partners** (`grupo: "partner"`):
- Banner: "Custo do parceiro — não da Izzat. Parceiro investiu $50k USD pela gestão."
- Lojas: Injooy, Liora, Hago, HuggyPuppy, Loja da Marga
- Mesma estrutura de custos fixos/variáveis

Tudo interconectado com `/lojas/[id]` via Zustand — adicionar em qualquer lugar reflete em todos.

---

### `/custo-total` — Custo Total Izzat *(admin only)* — NOVO
Hub financeiro consolidado do Grupo Izzat. **Partners NÃO entram aqui.**

**Total = Folha Salarial + Ferramentas Time + Custos Op. Lojas Izzat**

Layout:
- Hero: valor total em dourado grande + barra proporcional 3 cores
- 3 cards: Folha Salarial | Ferramentas Time | Custos Op. Izzat
- 3 seções expansíveis:
  - **Time**: cada colaborador com salário + alerta vermelho se sem salário → link para `/equipe/[id]`
  - **Ferramentas**: lista com edição inline de valor → link para `/gastos`
  - **Operações Izzat**: cada loja expansível com gastos → edição inline → link para `/lojas/[id]`
- Footer: nota explicando que Partners não entram + link para `/gastos-operacoes`
- Seletor de mês (últimos 12 meses) — afeta gastos variáveis

**Edição híbrida**: valores simples editam diretamente (click lápis → input inline → Enter salva).
Coisas complexas (adicionar colaborador, criar nova ferramenta) → link para página certa.

---

### `/gastos` — Gastos Equipe *(admin only)*
Existia antes. Complementa o /custo-total.

---

## Sidebar — estrutura de navegação

```
PESSOAL
  Dashboard | Meu Dia | Sono

TRABALHO
  Atividade | Tarefas | Regras | Desafios
  [adminOnly] Rotinas

TIME
  Formulário
  [adminOnly] Equipe | Lojas | Catálogo | Semana do Time
               Gastos Equipe | Custos Op. | Custo Total
```

Sidebar colapsável: hover para expandir quando colapsada (Notion-style).
