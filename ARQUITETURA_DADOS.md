# 🗄️ Arquitetura de Dados — Painel Izzat
### Diagnóstico + plano para rodar 100% na nuvem, de graça

---

## 🔍 DIAGNÓSTICO — por que os dados não salvam

O app hoje tem **duas realidades** misturadas:

### ❌ O que NÃO salva na nuvem (a maior parte)
Login, colaboradores, **salários**, tarefas, rotinas, XP, presença/status, notificações, sono,
desafios, lojas custom — **tudo isso vive no `localStorage` do navegador** (Zustand `persist`,
chave `painel-izzat-store`, em `lib/store.ts:1233`).

`localStorage` = uma gaveta dentro de **um navegador, num computador**. Consequências:
1. **Cada dispositivo/navegador/aba anônima começa vazio** → por isso o status de presença
   "reseta" e pede login toda vez. Não é bug de presença — é que não existe nuvem guardando.
2. **Salário que você cadastrou há 12 semanas sumiu** porque: ou foi noutro dispositivo, ou
   uma **atualização de versão** do app rodou uma "migração" que reconstrói a lista de
   colaboradores a partir do padrão (`lib/store.ts:1241` — `version < 10`). Quando a versão do
   store sobe (hoje está na **v22**), parte dos dados pode ser resetada. Salário é um campo do
   colaborador → migração que recria colaboradores apaga o que você digitou.
3. **Ninguém vê os dados do outro.** Cada pessoa tem a sua gaveta isolada. Não há time
   compartilhando o mesmo estado.

### ❌ O "backup" que existe e está quebrado
`SnapshotSync.tsx` tenta mandar um snapshot pro Redis (Upstash) a cada 5 min. MAS:
- O Redis **não está configurado** (`.env.local` só tem chaves do Supabase) → retorna 503, não faz nada.
- Mesmo que funcionasse: é **só escrita**, nada lê de volta pro app. Backup morto.
- É **uma chave global única** → o último a salvar apagaria os dados de todos. Inseguro pra time.

### ✅ O que JÁ salva na nuvem (e funciona)
O módulo **Operação** (pedidos, ADS, metas, config por loja) usa **Supabase de verdade**
(PostgreSQL). Testei agora: a tabela `op_pedidos` tem dados reais salvos (pedido de 20/06/2026).
Padrão em `lib/operacao.ts` → `supabase.from("op_pedidos").insert(...)`. **Isso persiste,
qualquer pessoa em qualquer device vê.** É o modelo certo — falta estender pro resto.

### ❌ Login
Não existe autenticação. `LoginPage.tsx:17` chama `login(colaboradorId)` — só **seleciona** uma
pessoa de uma lista fixa (`lib/data.ts`). Sem senha, sem e-mail, sem verificação. Qualquer um
escolhe qualquer perfil.

---

## 🎯 SOLUÇÃO — Supabase como backend único (tudo de graça)

### O que é o Supabase (responder sua dúvida)
Não é "tipo um Drive". É **melhor**: é uma plataforma com 4 peças, todas no plano free:

| Peça | O que faz | Analogia |
|------|-----------|----------|
| **Postgres (Database)** | Guarda dados estruturados em **tabelas** (salários, pedidos, tarefas). Consultável, relacional. | Planilha turbinada, mas de verdade |
| **Auth** | Login real: Google, e-mail/senha, magic link. Cada pessoa entra só com a conta dela. | Porteiro com crachá |
| **Storage** | Guarda **arquivos** (imagens de produto, PDFs, até planilhas). | **Esse é o "Drive"** |
| **Realtime** | Sincroniza ao vivo (presença, quem está online, mudanças na hora). | Google Docs colaborativo |

**Os dados estruturados (salário, pedido, tarefa) NÃO vão como planilha no "Drive"** — vão em
**tabelas Postgres**, que é o jeito certo (rápido, seguro, consultável). O Storage (a parte "Drive")
serve pra arquivos: criativos, imagens, anexos.

### Quando conectar as APIs de loja/ADS (sua pergunta)
Os dados que vierem da Shopify, Meta Ads, TikTok Ads etc. caem em **tabelas Postgres no Supabase**
(ex: `op_pedidos`, `op_ads` que já existem). Um job (cron) puxa da API → grava no Supabase →
o painel lê do Supabase. **Tudo num lugar só.** Já existe cron rodando (`/api/cron/operacao-daily`).

---

## 💰 CUSTO — dá pra ser 100% grátis? SIM.

Time de **≤15 pessoas**. Supabase **Free tier**:
- **Banco:** 500 MB Postgres → comporta anos de dados de 15 pessoas (texto/números ocupam quase nada)
- **Auth:** até **50.000 usuários ativos/mês** grátis · login Google **incluído sem custo**
- **Storage:** 1 GB de arquivos grátis
- **Realtime:** 200 conexões simultâneas (15 pessoas = folga enorme)
- **API:** ilimitado

⚠️ Única pegadinha: projeto free **pausa após 7 dias sem uso**. **Não é problema pra vocês** — o app
tem crons rodando a cada 30 min (`vercel.json`), que mantêm o projeto sempre ativo.

Google login: **grátis** (precisa criar credencial no Google Cloud Console — sem custo).
Vercel: **grátis** (já estão).

**Conclusão: R$ 0,00/mês é viável e realista pra 15 pessoas.**

---

## 🚧 PLANO DE EXECUÇÃO (em fases)

### Fase 1 — Banco: migrar dados pro Supabase
Criar tabelas Postgres pra: `colaboradores`, `tarefas`, `rotinas`, `atividades`, `notificacoes`,
`presenca`, `sono`, `desafios`, `lojas_custom`, etc. Trocar o `persist` (localStorage) por
leitura/escrita no Supabase (mesmo padrão do `lib/operacao.ts` que já funciona).
→ Resolve: salário sumindo, dados não compartilhados, reset por migração.

### Fase 2 — Auth: login real com Google
Ativar Supabase Auth + provider Google. Cada pessoa entra com a conta Google dela
(restrito ao domínio `@izzatexpress.com` ou allowlist). Liga o `usuarioAtual` ao usuário logado.
→ Resolve: login sem senha, qualquer um vira qualquer um.

### Fase 3 — Segurança: RLS (Row Level Security)
Políticas no Postgres: cada um lê/edita só o que pode (admin vê tudo, colaborador vê o seu).
→ Resolve: segurança real multi-usuário.

### Fase 4 — Realtime: presença ao vivo
Trocar o status de presença local por Supabase Realtime (presence channel).
→ Resolve: "online agora" de verdade, sincronizado.

### O que EU faço pelo terminal
- Schema SQL completo (tabelas + índices + RLS)
- Código do data-layer (funções Supabase) e troca do store
- Wiring do Auth no front
- Testes de conexão

### O que VOCÊ precisa fazer (consoles web — não dá pelo terminal)
- **Google Cloud Console:** criar credencial OAuth (Client ID + Secret) → me passar
- **Supabase Dashboard:** ativar provider Google, colar as credenciais, setar redirect URLs
- **Rodar o SQL** que eu gerar (ou eu rodo via Supabase CLI se você logar a CLI)
- **Vercel:** confirmar env vars (as do Supabase já estão)

---

## ⚡ Risco e ordem
Migração grande. Fazer **incremental** (uma fatia de dados por vez, validando), nunca tudo de uma
vez, pra não quebrar o app que já está no ar. Começar pelos dados que mais doem: **salários +
colaboradores** (Fase 1 parcial), depois auth.
