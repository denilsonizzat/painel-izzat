# Contexto Histórico — Decisões e Raciocínio
> Por que cada coisa foi feita assim. Essencial para não refazer erros ou perder contexto.

---

## Decisões de Arquitetura

### Por que sem banco de dados?
Time pequeno (~10 pessoas). LocalStorage + Zustand persist é suficiente para o tamanho atual.
Zustand snapshot vai pra Redis como backup a cada 5 min.
**Próximo passo quando escalar**: Supabase (PostgreSQL + Google Auth + free tier).

### Por que Next.js App Router?
Escolha original do projeto. Todas as rotas usam `"use client"` no topo porque o app é 100% interativo.
Nenhuma page usa Server Components — tudo roda no cliente via Zustand.

### Por que Zustand persist (e não Context API ou Redux)?
Simplicidade. Um store, um arquivo (`lib/store.ts`), zero boilerplate.
O persist middleware salva automaticamente no localStorage.

### Por que versionar o store?
Usuários com dados antigos no localStorage precisam de migração.
Sem versão, campos novos não aparecem para quem já tem dados salvos.
**Regra**: sempre bumpar versão + sempre adicionar bloco `if (version < N)`.

### Por que sem chart libraries?
Recharts/Chart.js adicionam dependências pesadas. Para o que precisamos (barras simples, heatmap, linhas), SVG puro ou divs com % funcionam perfeitamente e ficam com visual customizado no tema escuro.

---

## Decisões de Features

### Desafios do Time — por que com data de fim obrigatória?
Pesquisa com YuMuuv, HeiaHeia, Habitica, Cohorty mostrou: desafios sem prazo perdem urgência em 2 semanas. Data de fim cria "tiro curto" que gera dopamina mais rápido. Ranking semanal (reseta segunda) dá chance recorrente de vencer sem excluir quem ficou atrás.

### Google Chat — por que link direto e não integração completa?
Google Chat API requer OAuth 2.0 por usuário. Cada pessoa precisaria autenticar.
Para abrir conversas rapidamente, link direto é suficiente.
Admin cola o link da conversa DM: `https://mail.google.com/chat/u/0/#chat/dm/...`

### Kanban drag-and-drop — por que card inteiro arrastável?
Usuário pediu comportamento igual Todoist. O grip handle (⠿) estava limitando a área de drag.
Solução: mover `{...listeners} {...attributes}` do handle para o card inteiro.
`activationConstraint: { distance: 8 }` no PointerSensor garante que cliques em botões internos não ativam drag.

### Regras da Empresa — por que 3 níveis de rigidez?
Empresa tem regras absolutas (nunca violar), recomendações (seguir mas pode adaptar) e flexíveis (guia).
Inegociável / Recomendado / Maleável traduz isso sem linguagem corporativa pesada.

### Meta Ads — por que regra de "post existente"?
Regra criada depois de aprendizado operacional: subir anúncio de arquivo do PC ignora o engajamento orgânico que o post acumulou. Post com likes/comentários → anúncio mais barato no leilão do Meta. É uma regra não-óbvia que precisa estar documentada.

### Custo Total — por que Partners ficam fora?
Partners pagam os próprios custos operacionais. O $50k que pagaram foi pela mão de obra de gestão da Izzat. Misturar custo de Partner no total do grupo Izzat distorceria a visão financeira da empresa. Izzat precisa saber quanto CUSTA manter o grupo próprio — Partners têm sua própria visão em `/gastos-operacoes`.

### IA das lojas vs IA do time — por que separar?
Cada loja vai ter uma IA com contexto específico (histórico de produto, clientes, campanhas) que qualquer membro do time pode acessar. Essa IA é um custo da operação da loja, não do colaborador.
Já a IA individual do colaborador (ex: Claude Pro do Denilson para trabalho geral) é custo do time.
Isso permite saber exatamente quanto cada operação custa em IA.

---

## Erros que JÁ aconteceram (não repetir)

### criadaPor vs criadoPor
Na interface `Desafio` o campo é `criadoPor`. Em algum momento foi digitado `criadaPor` — TypeScript acusou erro. Sempre verificar o nome exato do campo na interface antes de usar.

### SVG spotlight no Onboarding
A primeira versão do Onboarding usava SVG de recorte para fazer "spotlight" nos elementos. Causava tela totalmente escura sem interação possível quando o elemento alvo não estava visível. Reescrito como backdrop simples + card centralizado.

### Migração sem bump de versão
`produtos` foi adicionado ao store v17 sem bump de versão — usuários com v17 precisam limpar localStorage se der erro. Sempre bumpar versão ao adicionar campos.

### Edit tool "file not read" error
Ao tentar editar arquivo sem ter lido antes na sessão, Edit tool rejeita. Sempre `Read` antes de `Edit` em nova sessão.

### PowerShell + acentos
PowerShell 5.1 no Windows corrompe UTF-8. Nunca usar `echo` ou `Set-Content` do PowerShell para escrever código com acentos. Usar sempre Edit ou Write tool do Claude.

---

## Roadmap futuro (conversado com usuário)

### Fase imediata — já pode começar
1. **GitHub**: subir código para repositório — código existe só no HD agora
2. **Supabase**: banco de dados + login Google
3. **Vercel**: hospedar o app online (conecta com GitHub)

### Fase seguinte
4. **Receita por loja**: campo de faturamento mensal por loja
5. **P&L completo**: receita - custo = lucro por loja e do grupo
6. **Integração painel externo**: Denilson tem outro painel com dados de vendas/anúncios

### Fase futura
7. **Notificação de streak em risco** (Desafios — às 21h)
8. **Foto de evidência** no check-in de desafios
9. **Radar chart** de consistência por categoria nos Desafios
10. **Webhook Google Chat** — enviar ranking semanal para grupo do time
11. **UI de visualização** das respostas do Formulário dentro do perfil

---

## Sobre o usuário (Denilson)
- CEO/gestor do Izzat Group
- Aprendendo desenvolvimento com ajuda de IA (sem programador externo)
- Quer entender o PORQUÊ de cada ação, não só executar cegamente
- Objetivo: eventualmente fazer isso sozinho sem IA
- Prefere respostas objetivas e diretas (modo caveman)
- Usa AskUserQuestion com opções clicáveis — nunca perguntas abertas

---

## Como iniciar uma nova sessão do zero

1. Abrir terminal na pasta `C:\Users\denil\painel-izzat`
2. `npm run dev` → acessa em `http://localhost:3000`
3. Pedir para Claude ler os arquivos CONTEXTO*.md
4. Dizer o que quer implementar ou corrigir
5. Claude já sabe tudo — pode continuar de onde parou

**Frase mágica para nova sessão:**
> "Leia todos os arquivos CONTEXTO*.md na raiz do projeto e retome como se a conversa nunca tivesse sido interrompida"
