# Contexto Componentes — Componentes Chave
> Arquivo: `components/` | Padrões de UI e comportamento

## Avatar (`components/Avatar.tsx`)
```tsx
<Avatar nome="Denilson" avatar="🦊" foto="/fotos/denilson.jpg" cor="#10b981" size={32} />
```
Prioridade: `foto` → `avatar` (emoji) → initials com fundo `cor`.

---

## Sidebar (`components/Sidebar.tsx`)

**Estrutura de navegação:**
```typescript
const NAV_SECTIONS = [
  { label: "Pessoal", items: [...], adminItems: [...] },
  { label: "Trabalho", items: [...], adminItems: [...] },
  { label: "Time", items: [...], adminItems: [...] },
];
```

**Items atuais (completo):**
```
Pessoal: Dashboard, Meu Dia, Sono
Trabalho: Atividade, Tarefas, Regras, Desafios
Trabalho [admin]: Rotinas
Time: Formulário
Time [admin]: Equipe, Lojas, Catálogo, Semana do Time,
              Gastos Equipe, Custos Op., Custo Total
```

**Comportamento colapsável**: hover expande quando `sidebarColapsada: true`.
`setSidebarColapsada` no store. Persiste entre sessões.

**Imports Lucide necessários** (atualizado):
```typescript
LayoutDashboard, CheckSquare, Users, Store, ListTodo, LogOut, Menu, X,
ClipboardList, Plus, Zap, Flame, Bell, Search, Activity, Power, RefreshCw,
CalendarDays, ChevronLeft, ChevronRight, PanelLeftClose, DollarSign, Moon,
PackageSearch, BookMarked, Trophy, Receipt, Wallet
```

---

## Onboarding (`components/Onboarding.tsx`)
Tour de 6 passos para novos usuários. Backdrop simples + card centralizado.
**IMPORTANTE**: NÃO usa SVG spotlight (causa tela travada). É backdrop puro + card.
Ativado quando `onboardingConcluido === false` no store.

---

## ProdutoFormModal (`components/ProdutoFormModal.tsx`)
Form compartilhado usado em `/catalogo` e `/lojas/[id]`.

```typescript
interface Props {
  onClose: () => void;
  lojaIdInicial?: string;      // pré-seleciona loja
  produtoParaEditar?: Produto; // se passado, modo edição
  todasLojas: LojaItem[];
}
```

**Seções do form:**
1. Nome + Loja
2. Fornecedor principal (campos flat: linkFornecedor, nome, preço, frete)
3. Fornecedores 2 e 3 (array `fornecedores[]`)
4. Precificação (taxa Shopify, valor líquido, valor de venda, margem, dólar do dia)
5. Mídia (links Drive: imagem, vídeo, gif, Google Docs copy)
6. Shopify (link do produto na Shopify)
7. Documento do Produto (Google Docs de pesquisa — destacado com fundo azul Google)

**Reset automático**: parent usa `{condition && <ProdutoFormModal />}` — não prop `open`.

**Quick-fill buttons**: AliExpress / Wiio / 3Cliques / DV (preenche nome do fornecedor)

**Barra de progresso** no rodapé mostra campos preenchidos / 13 total.

---

## KanbanCard — dentro de `app/catalogo/page.tsx`
Card draggable do Kanban. **Card inteiro é draggável** (não só o grip handle).

```typescript
// Listeners no div externo:
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: p.id });

<div ref={setNodeRef} {...listeners} {...attributes}
  style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}>
```

`distance: 8` no PointerSensor → cliques em botões internos funcionam normalmente.

---

## FloatingPomodoro (`components/FloatingPomodoro.tsx`)
Timer Pomodoro flutuante. Abre via `abrirPomodoro(tarefaId?, titulo?)` no store.
Ampulheta SVG animada. Estado local (não persiste entre reloads).

---

## SnapshotSync (`components/SnapshotSync.tsx`)
Sincroniza estado Zustand → Redis (Upstash) a cada 5 minutos.
`POST /api/snapshot` com o estado serializado.

---

## Padrões de UI recorrentes

### Cards
```tsx
<div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #1e3356" }}>
```

### Cards escuros (dentro de cards)
```tsx
<div className="rounded-xl p-3" style={{ background: "#0a1a2e", border: "1px solid #1e3356" }}>
```

### Botão primário dourado
```tsx
<button style={{ background: "#c9a84c", color: "#0b1624" }}>
```

### Botão secundário
```tsx
<button style={{ background: "#1e3356", border: "1px solid #334155", color: "#94a3b8" }}>
```

### Badge/chip colorido
```tsx
<span style={{ background: cor + "20", color: cor }} className="px-1.5 py-0 rounded-full text-xs">
```

### Input
```tsx
<input className="px-3 py-2 rounded-xl text-sm text-white outline-none"
  style={{ background: "#0b1624", border: "1px solid #1e3356" }} />
```

### Select
```tsx
<select className="px-3 py-2 rounded-xl text-sm text-white outline-none"
  style={{ background: "#122039", border: "1px solid #1e3356" }}>
```

### Seção expansível (accordion)
```tsx
<button onClick={() => setAberto(v => !v)} className="w-full flex items-center justify-between px-4 py-3">
  <span>Título</span>
  {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
</button>
{aberto && <div>conteúdo</div>}
```

### Edição inline de valor
```tsx
{editandoId === item.id ? (
  <div className="flex gap-1.5">
    <input autoFocus value={valorEdit} onChange={e => setValorEdit(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter") salvar(); if (e.key === "Escape") cancelar(); }} />
    <button onClick={salvar}><Check size={12} /></button>
    <button onClick={cancelar}><X size={12} /></button>
  </div>
) : (
  <div className="flex items-center gap-2">
    <span>{valor}</span>
    <button onClick={() => iniciarEdicao()}><Pencil size={11} /></button>
  </div>
)}
```

### Link externo (abre nova aba)
```tsx
<Link href="/outra-pagina">texto</Link>              // interno
<a href={url} target="_blank" rel="noopener noreferrer">texto</a>  // externo
```

---

## Ícones de marca (public/icons/)
Todos são SVGs do Simple Icons (cdn.jsdelivr.net/npm/simple-icons).
São paths pretos → CSS `filter: brightness(0) invert(1)` os torna brancos.
Exceção: Miro (fundo amarelo) usa `filter: brightness(0)` para ficar preto.

```
public/icons/googlechat.svg
public/icons/googlemeet.svg
public/icons/googledrive.svg
public/icons/miro.svg
public/icons/whatsapp.svg
public/icons/anthropic.svg
public/icons/tldv.svg   ← custom (não está no simple-icons)
```

---

## Heatmap e gráficos (sem biblioteca)

### Heatmap estilo GitHub (em /desafios)
```tsx
// Semanas como colunas, dias como linhas
// Cor: verde se check-in existe, #1e3356 se não
const semanas = agruparPorSemana(todasAsDatas);
semanas.map(semana => (
  <div className="flex flex-col gap-0.5">
    {semana.map(dia => (
      <div style={{ width: 10, height: 10, background: temCheckIn(dia) ? "#10b981" : "#1e3356" }} />
    ))}
  </div>
))
```

### Barra proporcional (em /custo-total)
```tsx
<div className="h-2 rounded-full overflow-hidden flex" style={{ background: "#1e3356" }}>
  <div style={{ width: `${pctA}%`, background: "#10b981" }} />
  <div style={{ width: `${pctB}%`, background: "#8b5cf6" }} />
  <div style={{ width: `${pctC}%`, background: "#3b82f6" }} />
</div>
```
