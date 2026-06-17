# Contexto Master — Painel Izzat Group
> Atualizado: 2026-06-15 | Store v19 | Next.js App Router

## O que é esse projeto
Painel de gestão de equipe interno do **Izzat Group** — empresa de e-commerce internacional.
Desenvolvido com Claude Code ao longo de múltiplas sessões. Aplicação web interna, não pública.

**Localização local**: `C:\Users\denil\painel-izzat`
**URL dev**: `http://localhost:3000`
**Comando para rodar**: `npm run dev`

## Stack
```
Next.js 15 (App Router)  +  TypeScript  +  Zustand persist  +  Tailwind CSS
Lucide React (ícones)    +  @dnd-kit/core (drag-and-drop Kanban)
```

## Arquivos de contexto (leia nesta ordem para retomar)
| Arquivo | O que contém |
|---|---|
| `CONTEXTO.md` | Este arquivo — visão geral e índice |
| `CONTEXTO-STORE.md` | Todo o estado Zustand, versões, migrações, actions |
| `CONTEXTO-PAGINAS.md` | Cada rota, o que faz, quem acessa |
| `CONTEXTO-NEGOCIO.md` | Modelo de negócio, Izzat vs Partners, estrutura de custos |
| `CONTEXTO-COMPONENTES.md` | Componentes chave, props, comportamento |
| `CONTEXTO-HISTORICO.md` | Por que cada decisão foi tomada |

## Regras de código que NUNCA podem ser violadas
1. **Sem chart libraries** — gráficos são SVG puro ou divs com cálculos inline
2. **Store versão**: sempre incrementar; sempre adicionar `if (version < N)` no `migrate()`
3. **criarRegra**: `Omit<RegraEmpresa, "id" | "criadaEm" | "criadaPor" | "ativa">`
4. **criarDesafio**: `Omit<Desafio, "id" | "criadoEm" | "criadoPor" | "ativo">` — campo é `criadoPor` (não `criadaPor`)
5. **criarGastoOp**: `Omit<GastoOperacional, "id" | "criadoEm">`
6. **editarProduto**: `(id: string, updates: Partial<Omit<Produto, "id" | "dataCriacao">>)`
7. **Modal reset**: usar conditional render `{condition && <Modal />}` — não prop `open`
8. **Kanban DnD**: `PointerSensor` com `activationConstraint: { distance: 8 }`
9. **Acentos em código**: usar Edit tool, NUNCA PowerShell direto (corrompe UTF-8)
10. **Sem comentários** exceto quando o WHY é não-óbvio

## Paleta de cores (imutável)
```
Fundo página:  #0b1624    Card:       #122039    Card escuro: #0a1a2e
Borda:         #1e3356    Dourado:    #c9a84c    Verde:       #10b981
Azul:          #3b82f6    Roxo:       #8b5cf6    Vermelho:    #ef4444
Âmbar:         #f59e0b    Texto:      #94a3b8    Texto fraco: #64748b
```

## Equipe (10 colaboradores hardcoded em lib/data.ts)
| ID | Nome | Cor | Nível |
|---|---|---|---|
| `mohamed` | Mohamad Izzat | #8B5CF6 | **admin** |
| `denilson` | Denilson Bitencourt | #10B981 | **admin** |
| `leticia` | Leticia Martins | #EC4899 | colaborador |
| `amanda` | Amanda Clark | #F59E0B | colaborador |
| `ana` | Ana Borges | #14B8A6 | colaborador |
| `mauricio` | Mauricio Batista | #6366F1 | colaborador |
| `fagner` | Fagner Fernando | #EF4444 | colaborador |
| `julio` | Julio Victor | #D946EF | colaborador |
| `mateus` | Mateus Torres | #0EA5E9 | colaborador |
| `junior` | Junior | #F97316 | colaborador |

## Lojas
**Grupo Izzat** (`grupo: "izzat"`): Izzat Express Global, Apex Global, Ah Men (Apex BR), Alpha Men Hair, Louvt
**Partners** (`grupo: "partner"`): Injooy, Liora, Hago, HuggyPuppy, Loja da Marga

## Infraestrutura extra
- Email: Nodemailer + Gmail SMTP (`GMAIL_USER`, `GMAIL_APP_PASSWORD`)
- Redis: Upstash (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- Crons: `app/api/cron/` — morning, evening, admin-daily, admin-weekly
- PWA: `app/manifest.ts`, `public/sw.js`, `components/PWARegister.tsx`
- Env: `CRON_SECRET`, `NEXT_PUBLIC_BASE_URL`
