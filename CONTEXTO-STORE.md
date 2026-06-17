# Contexto Store — Zustand Persist
> Store key: `painel-izzat-store` | Versão atual: **19** | Arquivo: `lib/store.ts`

## Como funciona
Zustand persist salva TUDO no `localStorage` do navegador. Sem banco de dados.
Quando a versão do código sobe, o `migrate()` atualiza o estado salvo.

## Histórico de versões (NUNCA pular versão)

| Versão | O que adicionou |
|---|---|
| 8 | `sidebarColapsada`, `onboardingConcluido` |
| 9 | sem campos novos |
| 10 | migra `telefone`/`email` frescos do COLABORADORES |
| 11 | `historicoAtividades: EntradaAtividade[]` (cap 500) |
| 12 | `lojasCustom: Loja[]`, `lojasArquivadas: string[]` |
| 13 | `ferramentas: Ferramenta[]` |
| 14 | `registrosSono` em cada Colaborador |
| 15 | `regrasEmpresa: RegraEmpresa[]` com 2 regras iniciais |
| 16 | `googleChatLink?: string` em Colaborador + `setGoogleChatLink` |
| 17 | `desafios: Desafio[]`, `checkInsDesafio: CheckInDesafio[]`, `produtos: Produto[]` |
| 18 | regra-003 Meta Ads injetada via migração |
| 19 | `gastosOperacionais: GastoOperacional[]` |

## Template de migração (sempre seguir este padrão)
```typescript
// Em lib/store.ts — seção persist:
version: 20,  // bumpar aqui
migrate: (persisted, version) => {
  const s = persisted as Record<string, unknown>;
  // ... blocos anteriores ...
  if (version < 20) {
    return { ...s, novosCampos: [] };
  }
  return s;
}
```

## Todo o estado (AppState interface)

### Autenticação
```typescript
usuarioAtual: Colaborador | null
login: (id: string) => void
logout: () => void
```

### Colaboradores
```typescript
colaboradores: Colaborador[]
atualizarColaborador: (id, updates: Partial<Colaborador>) => void
adicionarColaborador: (dados: Omit<Colaborador, "xp" | "nivelProgresso">) => void
setSalario: (colaboradorId, salario) => void
setGoogleChatLink: (colaboradorId, link) => void
```

### Interface Colaborador (lib/data.ts)
```typescript
interface Colaborador {
  id: string; nome: string; email: string; cargo?: string;
  avatar?: string; foto?: string; cor: string;
  nivelAcesso: "admin" | "colaborador";
  xp: number; nivelProgresso: number;
  salario?: number;
  telefone?: string;
  googleChatLink?: string;
  habilidades?: { nome: string; nivel: number }[];
  registrosSono: RegistroSono[];
  formulario?: Record<string, unknown>;
}
```

### Tarefas
```typescript
tarefas: Tarefa[]
criarTarefa: (dados: Omit<Tarefa, "id" | "criadoEm" | "status">) => void
atualizarTarefa: (id, updates: Partial<Tarefa>) => void
deletarTarefa: (id) => void
adicionarComentario: (tarefaId, texto, tipo?) => void
marcarLida: (tarefaId, colaboradorId) => void
// + subtarefas, aprovação, etc.
```

### Rotinas
```typescript
rotinas: Rotina[]
criarRotina: (dados) => void
marcarSubtarefa: (rotinaId, subtarefaId, colaboradorId, feito) => void
marcarRotina: (rotinaId, colaboradorId, feita) => void
```

### Desafios do Time
```typescript
desafios: Desafio[]
checkInsDesafio: CheckInDesafio[]
criarDesafio: (dados: Omit<Desafio, "id" | "criadoEm" | "criadoPor" | "ativo">) => void
editarDesafio: (id, updates: Partial<Desafio>) => void
deletarDesafio: (id) => void
fazerCheckIn: (desafioId, data, nota?) => void
desfazerCheckIn: (desafioId, data) => void
reagirCheckIn: (checkInId, emoji) => void
```

```typescript
interface Desafio {
  id: string; titulo: string; descricao: string; emoji: string;
  categoria: "movimento"|"hidratacao"|"estudo"|"sono"|"alimentacao"|"outro";
  meta: string; dataInicio: string; dataFim: string;
  criadoPor: string; criadoEm: string; ativo: boolean;
}
interface CheckInDesafio {
  id: string; desafioId: string; colaboradorId: string;
  data: string; hora: string; nota?: string;
  reacoes: { colaboradorId: string; emoji: string }[];
}
```

### Regras da Empresa
```typescript
regrasEmpresa: RegraEmpresa[]
criarRegra: (dados: Omit<RegraEmpresa, "id" | "criadaEm" | "criadaPor" | "ativa">) => void
editarRegra: (id, updates) => void
deletarRegra: (id) => void
toggleRegra: (id) => void
```

```typescript
interface RegraEmpresa {
  id: string; titulo: string; descricao: string; icone: string;
  categoria: "operacional"|"arquivos"|"qualidade"|"comunicacao"|"seguranca"|"outro";
  rigidez: "inflexivel"|"recomendado"|"maleavel";
  ativa: boolean; criadaEm: string; criadaPor: string;
}
// 3 regras iniciais em REGRAS_INICIAIS (lib/data.ts):
// regra-001: Shopify só manual (inflexível, operacional)
// regra-002: Subir arquivos no Drive (inflexível, arquivos)
// regra-003: Meta Ads usar post existente (inflexível, operacional)
```

### Produtos / Catálogo
```typescript
produtos: Produto[]
criarProduto: (dados) => void
editarProduto: (id, updates: Partial<Omit<Produto, "id" | "dataCriacao">>) => void
deletarProduto: (id) => void
toggleProdutoNoAr: (id) => void
validarProduto: (id) => void
reprovarProduto: (id) => void
distribuirProduto: (id, lojaIds: string[]) => void
```

```typescript
interface Produto {
  id: string; lojaId: string; nome: string;
  linkFornecedor?: string; fornecedorNome?: string;
  precoPorUnidade?: number; precoPorFrete?: number;
  fornecedores?: FornecedorItem[];
  taxaShopifyPct?: number; valorLiquido?: number;
  valorDeVenda?: number; margemLucro?: number;
  linkDriveImagem?: string; linkDriveVideo?: string; linkDriveGiff?: string;
  linkGoogleDocsCopy?: string; linkShopifyProduto?: string;
  valorDolarNoDia?: number; linkDocumentoProduto?: string;
  noAr: boolean; dataCriacao: string;
  validado?: boolean; reprovado?: boolean;
  distribuidoPara?: string[]; produtoOrigemId?: string;
}
// CAMPOS_PRODUTO em lib/data.ts = 13 campos obrigatórios para ir ao ar
```

### Gastos Operacionais (v19 — NOVO)
```typescript
gastosOperacionais: GastoOperacional[]
criarGastoOp: (dados: Omit<GastoOperacional, "id" | "criadoEm">) => void
editarGastoOp: (id, updates: Partial<Omit<GastoOperacional, "id" | "criadoEm">>) => void
deletarGastoOp: (id) => void
toggleGastoOp: (id) => void   // ativa/desativa sem deletar
```

```typescript
type TipoCusto = "fixo" | "variavel";
type CategoriaGastoOp = "ia_tools"|"workspace"|"trafego_pago"|"plataforma"|"logistica"|"outro";

interface GastoOperacional {
  id: string; lojaId: string; nome: string;
  tipo: TipoCusto; categoria: CategoriaGastoOp;
  valor: number; moeda: "BRL" | "USD";
  valorOriginal?: number; ativo: boolean;
  descricao?: string; criadoEm: string;
  mes?: string;  // YYYY-MM — só para tipo "variavel"
}
// Fixo: recorrente todo mês (sem campo mes)
// Variável: específico de um mês (com campo mes = "2026-06")
```

### Ferramentas do Time
```typescript
ferramentas: Ferramenta[]
criarFerramenta: (dados: Omit<Ferramenta, "id">) => void
editarFerramenta: (id, updates: Partial<Omit<Ferramenta, "id">>) => void
deletarFerramenta: (id) => void
vincularFerramenta: (ferramentaId, colaboradorId) => void
desvincularFerramenta: (ferramentaId, colaboradorId) => void
```

```typescript
interface Ferramenta {
  id: string; nome: string; descricao?: string;
  preco: number; tipo: "individual"|"compartilhada";
  colaboradoresIds: string[]; cor?: string;
}
```

### Outros estados importantes
```typescript
sidebarColapsada: boolean
onboardingConcluido: boolean
pomodoroAberto: boolean
// Stories (24h), Reconhecimentos, Histórico de Atividades, Entregas Semanais
// Lojas Custom (além das hardcoded), Lojas Arquivadas
// Notificações in-app, Pulso Semanal
```

## Como debugar o store
No browser: `localStorage.getItem("painel-izzat-store")` mostra o estado completo serializado.
Para resetar: `localStorage.removeItem("painel-izzat-store")` e recarregar.
