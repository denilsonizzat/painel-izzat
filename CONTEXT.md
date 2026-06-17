# Contexto: Painel Izzat Group — App de Gestão de Equipe

**Última atualização**: 2026-06-13  
**Projeto**: `C:\Users\denil\painel-izzat`  
**Stack**: Next.js 15 App Router + TypeScript + Zustand persist v17 + Tailwind + Lucide React + @dnd-kit/core

---

## O que é este app

Painel interno de gestão de equipe para o **Grupo Izzat** (e-commerce). Gerencia: colaboradores, tarefas, rotinas, desafios do time, lojas Shopify, catálogo de produtos com pipeline de validação, gastos de equipe.

---

## Design System

```
Fundo:      #0b1624
Card:       #122039
Borda:      #1e3356
Dourado:    #c9a84c  (ações principais, admin)
Verde:      #10b981  (sucesso, no ar)
Azul:       #3b82f6  (validado, links)
Roxo:       #8b5cf6  (distribuir, cópias)
Vermelho:   #ef4444  (erro, incompleto)
Laranja:    #f97316  (reprovado, atenção)
Texto 1:    #94a3b8
Texto 2:    #64748b
Texto 3:    #475569
```

---

## Store Zustand

**Nome**: `painel-izzat-store` | **Versão**: `17`

Quando adicionar novos campos ao store:
1. Incrementar `version`
2. Adicionar `if (version < N) return { ...s, novosCampos }` na migrate

**Assinaturas importantes:**
- `editarProduto(id: string, updates: Partial<Omit<Produto, "id" | "dataCriacao">>)` — NÃO passar objeto inteiro
- `criarRegra(dados: Omit<RegraEmpresa, "id" | "criadaEm" | "criadaPor" | "ativa">)`
- `criarDesafio(dados: Omit<Desafio, "id" | "criadoEm" | "criadoPor" | "ativo">)`

---

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/dashboard` | todos | KPIs + Acesso Rápido (7 ferramentas) |
| `/meu-dia` | todos | Rotinas, tarefas, sono do usuário logado |
| `/tarefas` | todos | Lista de tarefas com filtros |
| `/atividade` | todos | Histórico de atividades |
| `/equipe` | todos | Grid do time; admin vê "Adicionar Membro" |
| `/equipe/[id]` | admin=todos; colab=só próprio | Perfil completo com Google Chat link |
| `/regras` | todos | Regras da empresa; admin faz CRUD |
| `/desafios` | todos | Desafios do time; check-in, heatmap, ranking |
| `/lojas` | admin only | Lista de lojas com CRUD + aba Produtos |
| `/lojas/[id]` | admin only | Detalhe da loja: Visão Geral + aba Produtos |
| `/rotinas` | admin only | Rotinas da equipe |
| `/semana` | admin only | Semana do Time |
| `/catalogo` | admin only | Kanban de produtos (5 colunas, drag-and-drop) |
| `/gastos` | admin only | Gastos da equipe |

---

## Colaboradores (10)

| ID | Nome | Nível | Cor |
|---|---|---|---|
| `mohamed` | Mohamad | admin | #8B5CF6 |
| `denilson` | Denilson Bitencourt | admin | #10B981 |
| `leticia` | Leticia Martins | colaborador | #EC4899 |
| `amanda` | Amanda Clark | colaborador | #F59E0B |
| `ana` | Ana Borges | colaborador | #14B8A6 |
| `mauricio` | Mauricio Batista | colaborador | #6366F1 |
| `fagner` | Fagner Fernando | colaborador | #EF4444 |
| `julio` | Julio Victor | colaborador | #D946EF |
| `mateus` | Mateus Torres | colaborador | #0EA5E9 |
| `junior` | Junior | colaborador | #F97316 |

---

## Lojas (10 hardcoded + lojasCustom do store)

| ID | Nome | Grupo | Mercado |
|---|---|---|---|
| `izzat-express` | Izzat Express Global | izzat | global |
| `apex-global` | Apex Global | izzat | global |
| `apex-br` | Ah Men (Apex BR) | izzat | global |
| `alpha-men-hair` | Alpha Men Hair | izzat | brasil |
| `louvt` | Louvt | izzat | global |
| `injooy` | Injooy | partner | global |
| `liora` | Liora | partner | global |
| `hago` | Hago | partner | global |
| `huggypuppy` | HuggyPuppy | partner | global |
| `loja-da-marga` | Loja da Marga | partner | brasil |

**Izzat Express Global** é a loja de testes — produto testado aqui, validado quando vende, distribuído para lojas nichadas.

---

## Catálogo de Produtos — Feature Principal

### Interface Produto (lib/data.ts)

```typescript
interface FornecedorItem {
  nome?: string; link?: string;
  precoPorUnidade?: number; precoPorFrete?: number;
}

interface Produto {
  id: string; lojaId: string; nome: string;
  // Fornecedor principal (flat — usado no checklist)
  linkFornecedor?: string; fornecedorNome?: string;
  precoPorUnidade?: number; precoPorFrete?: number;
  // Fornecedores 2 e 3
  fornecedores?: FornecedorItem[];
  // Precificação
  taxaShopifyPct?: number; valorLiquido?: number;
  valorDeVenda?: number; margemLucro?: number;
  // Mídia/Links
  linkDriveImagem?: string; linkDriveVideo?: string; linkDriveGiff?: string;
  linkGoogleDocsCopy?: string; linkShopifyProduto?: string;
  valorDolarNoDia?: number;
  // Documento de pesquisa (Google Docs)
  linkDocumentoProduto?: string;
  // Status
  noAr: boolean; dataCriacao: string;
  validado?: boolean; reprovado?: boolean;
  distribuidoPara?: string[];    // lojaIds que receberam cópia
  produtoOrigemId?: string;      // se é cópia
}
```

### 13 Campos Obrigatórios (CAMPOS_PRODUTO)
Produto SÓ pode ir ao ar se todos os 13 estiverem preenchidos:
`linkFornecedor | precoPorUnidade | precoPorFrete | taxaShopifyPct | valorLiquido | valorDeVenda | margemLucro | linkDriveImagem | linkDriveVideo | linkDriveGiff | linkGoogleDocsCopy | linkShopifyProduto | valorDolarNoDia`

### Pipeline de 5 etapas (= colunas do Kanban)

| Coluna | Condição | Cor |
|---|---|---|
| Cadastrando | campos incompletos | vermelho |
| Em Teste | completo + `!validado + !reprovado` | cinza |
| Validado | `validado: true` + `distribuidoPara` vazio | azul |
| Distribuído | `distribuidoPara.length > 0` | verde |
| Reprovado | `reprovado: true` | laranja |

### Ações de drag-and-drop
- → Validado: `validarProduto(id)`
- → Reprovado: `reprovarProduto(id)`
- → Distribuído: abre modal de distribuição (escolher lojas)
- Reprovado → Em Teste: `editarProduto(id, { reprovado: false, validado: false, noAr: false })`

### distribuirProduto
Clona produto para cada lojaId selecionada. Cópia tem `produtoOrigemId` set, `linkShopifyProduto` limpo. Original tem `distribuidoPara` atualizado.

---

## Componentes chave

### ProdutoFormModal (components/ProdutoFormModal.tsx)
Componente compartilhado — usado em `/catalogo` E em `/lojas/[id]`.

```typescript
// Props
{ onClose: () => void; lojaIdInicial?: string; produtoParaEditar?: Produto; todasLojas: Loja[]; }
```

- Seções: Nome + Loja | Documento do Produto (Google Docs) | 3 fornecedores | Precificação | Mídia + Links Catálogo
- Quick-fill buttons: AliExpress / Wiio / 3Cliques / DV
- Preview de progresso no rodapé
- **Pattern de uso**: parent usa `{condition && <ProdutoFormModal />}` — React desmonta/remonta, reset automático

---

## Regras de código

1. **Sem chart libraries** — gráficos são SVG puro ou divs inline.
2. **Store**: sempre incrementar versão + adicionar migrate quando adicionar campos.
3. **Modal reset**: sempre `{condition && <Modal />}`, NUNCA prop `open` + useEffect reset.
4. **editarProduto**: `editarProduto(id, { campo: valor })` — NÃO `editarProduto({ ...produto, campo: valor })`.
5. **CAMPOS_PRODUTO**: fonte de verdade para checklist de completude — não duplicar lógica.
6. **DnD ativation**: `PointerSensor` com `distance: 8` para não conflitar cliques nos botões do card.
7. **Sem mocks de banco** — estado persiste no Zustand/localStorage, sem API routes de dados.

---

## Regras da Empresa (/regras)
- 3 rigidezes: `inflexivel` | `recomendado` | `maleavel`
- 6 categorias: `operacional | arquivos | qualidade | comunicacao | seguranca | outro`
- 2 regras pré-populadas: "Shopify só manual" + "Subir arquivos no Drive"

## Desafios do Time (/desafios)
- Check-in diário por desafio; streak; heatmap estilo GitHub
- Feed 48h com reações (👏🔥💪⭐🎯); ranking semanal
- Labels de duração: "Tiro curto ⚡" (≤7d) | "Sprint 🏃" (≤14d) | "Formação de hábito 💪" (≤21d) | "Hábito sólido 👑" (30d+)

---

## Infraestrutura
- Email: Nodemailer + Gmail SMTP → env: `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- Redis: Upstash → env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- PWA: `app/manifest.ts`, `public/sw.js`
- Crons em `app/api/cron/`: morning, evening, admin-daily, admin-weekly
- Env: `CRON_SECRET`, `NEXT_PUBLIC_BASE_URL`

---

## Arquivos principais

```
lib/data.ts                    — todos os tipos + COLABORADORES + LOJAS + CAMPOS_PRODUTO
lib/store.ts                   — Zustand v17 com todas as actions
components/Sidebar.tsx         — navegação admin/colab
components/ProdutoFormModal.tsx — form compartilhado de produto
app/catalogo/page.tsx          — Kanban 5 colunas com DnD
app/catalogo/layout.tsx        — layout simples
app/lojas/[id]/page.tsx        — detalhe loja: abas Visão Geral + Produtos
app/desafios/page.tsx          — desafios do time completo
app/regras/page.tsx            — CRUD regras empresa
app/equipe/[id]/page.tsx       — perfil com Google Chat
app/dashboard/page.tsx         — KPIs + Acesso Rápido
app/layout.tsx                 — ThemeApplier + FloatingPomodoro + ToastContainer
```

---

## Bugs conhecidos
- Pomodoro não persiste entre reloads (useState local)
- `produtos` adicionado ao store v17 sem bump de versão — usuários com v17 antiga podem precisar limpar localStorage
