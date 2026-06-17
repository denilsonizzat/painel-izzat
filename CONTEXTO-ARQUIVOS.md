# Contexto Arquivos — Mapa de Todos os Arquivos
> Onde está cada coisa no projeto

## Estrutura de pastas
```
painel-izzat/
├── app/                        ← Todas as páginas (Next.js App Router)
│   ├── layout.tsx              ← Root layout (Sidebar, Pomodoro, PWA, etc.)
│   ├── page.tsx                ← Login (/)
│   ├── dashboard/page.tsx      ← Dashboard (/dashboard)
│   ├── meu-dia/page.tsx        ← Meu Dia
│   ├── tarefas/page.tsx        ← Tarefas
│   ├── atividade/page.tsx      ← Histórico de Atividade
│   ├── formulario/page.tsx     ← Formulário de Perfil
│   ├── sono/page.tsx           ← Registro de Sono
│   ├── regras/page.tsx         ← Regras da Empresa
│   ├── desafios/page.tsx       ← Desafios do Time
│   ├── equipe/
│   │   ├── page.tsx            ← Lista da Equipe
│   │   └── [id]/page.tsx       ← Perfil do Colaborador
│   ├── lojas/
│   │   ├── layout.tsx          ← Guard admin
│   │   ├── page.tsx            ← Lista de Lojas
│   │   └── [id]/page.tsx       ← Perfil da Loja (com botão Custos)
│   ├── catalogo/
│   │   ├── layout.tsx          ← Guard admin
│   │   └── page.tsx            ← Kanban de Produtos (DnD)
│   ├── rotinas/                ← Rotinas (admin)
│   ├── semana/                 ← Semana do Time (admin)
│   ├── gastos/                 ← Gastos Equipe (admin) — folha + ferramentas
│   ├── gastos-operacoes/       ← Custos Operacionais por Loja (NOVO)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── custo-total/            ← Custo Total Izzat (NOVO)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/
│       ├── snapshot/route.ts   ← Redis snapshot
│       └── cron/               ← Crons de email
│
├── components/
│   ├── Sidebar.tsx             ← Navegação lateral
│   ├── Avatar.tsx              ← Foto ou initials colorido
│   ├── Onboarding.tsx          ← Tour de boas-vindas
│   ├── ProdutoFormModal.tsx    ← Form produto (compartilhado catálogo + loja)
│   ├── FloatingPomodoro.tsx    ← Timer Pomodoro flutuante
│   ├── SnapshotSync.tsx        ← Sync Redis 5min
│   ├── PWARegister.tsx         ← Service Worker
│   └── OnlineStatusModal.tsx   ← Modal de status online
│
├── lib/
│   ├── data.ts                 ← TODOS os tipos TypeScript + dados estáticos
│   └── store.ts                ← Zustand store (v19) — toda lógica de negócio
│
├── public/
│   ├── icons/                  ← SVGs de marca (Chat, Meet, Drive, Miro, WhatsApp, Claude, tldv)
│   ├── lojas/                  ← Logos das lojas
│   └── sw.js                   ← Service Worker
│
├── CONTEXTO.md                 ← Master index (este arquivo)
├── CONTEXTO-STORE.md           ← Estado Zustand detalhado
├── CONTEXTO-PAGINAS.md         ← Todas as rotas
├── CONTEXTO-NEGOCIO.md         ← Modelo de negócio
├── CONTEXTO-COMPONENTES.md     ← Componentes e padrões de UI
├── CONTEXTO-HISTORICO.md       ← Decisões e raciocínio
└── CONTEXTO-ARQUIVOS.md        ← Este arquivo
```

---

## Arquivos críticos — mexer com cuidado

### `lib/data.ts`
Fonte de verdade para tipos e dados estáticos. Contém:
- Todos os tipos/interfaces (Colaborador, Tarefa, Desafio, Produto, RegraEmpresa, GastoOperacional, Ferramenta, Loja...)
- `COLABORADORES` — array hardcoded com os 10 colaboradores
- `LOJAS` — array hardcoded com as 10 lojas
- `REGRAS_INICIAIS` — 3 regras pré-populadas
- `CAMPOS_PRODUTO` — 13 campos obrigatórios para produto ir ao ar
- `CATEGORIA_GASTO_LABEL` — labels de categorias de gasto

### `lib/store.ts`
Toda a lógica de negócio. Zustand persist v19. Contém:
- `AppState` interface completa
- Estado inicial de todos os campos
- Todas as actions (CRUD de tudo)
- Função `migrate()` com todos os blocos de migração
- Configuração `persist({ name: "painel-izzat-store", version: 19 })`

### `components/Sidebar.tsx`
Navegação. Quando adicionar nova rota, editar aqui.
Array `NAV_SECTIONS` com `items` (todos) e `adminItems` (só admin).

### `app/layout.tsx`
Root layout. Monta: ThemeApplier, FloatingOnlineButton, FloatingThemeButton, FloatingPomodoro, ToastContainer, SnapshotSync, PWARegister.

---

## Imports mais usados

### Em qualquer página
```typescript
"use client";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
```

### Tipos do data.ts
```typescript
import { Colaborador, Tarefa, Produto, RegraEmpresa, Desafio,
  GastoOperacional, TipoCusto, CategoriaGastoOp, CATEGORIA_GASTO_LABEL,
  LOJAS, CAMPOS_PRODUTO, Ferramenta } from "@/lib/data";
```

### Ícones Lucide mais usados
```typescript
import { Plus, X, Check, ChevronDown, ChevronUp, Pencil, Trash2,
  ExternalLink, AlertTriangle, Globe, Share2, Copy } from "lucide-react";
```

---

## Variáveis de ambiente necessárias

```env
# Email
GMAIL_USER=denilson@izzatexpress.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Segurança
CRON_SECRET=chave-secreta-para-crons

# URL pública
NEXT_PUBLIC_BASE_URL=https://painel.izzatexpress.com
```

---

## Como adicionar nova página (passo a passo)

1. Criar `app/[nome]/page.tsx` com `"use client"` no topo
2. Se admin only → criar `app/[nome]/layout.tsx` com guard
3. Adicionar ao `components/Sidebar.tsx`:
   ```typescript
   // Em adminItems do array correto:
   { href: "/nome", label: "Label", icon: IconeDoLucide },
   ```
4. Se tem dados novos → editar `lib/data.ts` (tipo) + `lib/store.ts` (estado + action + migração v+1)
5. Rodar `npx tsc --noEmit` para checar TypeScript

---

## Como adicionar novo tipo de dado ao store

1. `lib/data.ts`: definir interface + tipos auxiliares
2. `lib/store.ts`:
   a. Importar o tipo novo
   b. Adicionar campo na interface `AppState`
   c. Adicionar no estado inicial
   d. Implementar actions (CRUD)
   e. Bumpar `version: N+1`
   f. Adicionar bloco `if (version < N+1) { return { ...s, novosCampos: [] }; }`
3. `npx tsc --noEmit` → zero erros

---

## Checklist antes de fechar uma sessão

- [ ] `npx tsc --noEmit` → zero erros
- [ ] Store version está correta
- [ ] Migração adicionada para novo version
- [ ] Novos arquivos listados aqui em CONTEXTO-ARQUIVOS.md
- [ ] Memory em `~/.claude/projects/C--Users-denil/memory/` atualizada
