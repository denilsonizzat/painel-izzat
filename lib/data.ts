export type Prioridade = "alta" | "media" | "baixa";

// ─── DESAFIOS DO TIME ─────────────────────────────────────────────────────────

export type CategoriaDesafio = "movimento" | "hidratacao" | "estudo" | "sono" | "alimentacao" | "outro";

export interface Desafio {
  id: string;
  titulo: string;
  descricao: string;
  emoji: string;
  categoria: CategoriaDesafio;
  meta: string;
  dataInicio: string;
  dataFim: string;
  criadoPor: string;
  criadoEm: string;
  ativo: boolean;
}

export interface CheckInDesafio {
  id: string;
  desafioId: string;
  colaboradorId: string;
  data: string;
  hora: string;
  nota?: string;
  reacoes: { colaboradorId: string; emoji: string }[];
}

// ─── GASTOS OPERACIONAIS ──────────────────────────────────────────────────────

export type TipoCusto = "fixo" | "variavel";
export type CategoriaGastoOp =
  | "ia_tools"
  | "workspace"
  | "trafego_pago"
  | "plataforma"
  | "logistica"
  | "outro";

export const CATEGORIA_GASTO_LABEL: Record<CategoriaGastoOp, string> = {
  ia_tools: "IA & Ferramentas",
  workspace: "Workspace",
  trafego_pago: "Tráfego Pago",
  plataforma: "Plataforma",
  logistica: "Logística",
  outro: "Outro",
};

export interface GastoOperacional {
  id: string;
  lojaId: string;
  nome: string;
  tipo: TipoCusto;
  categoria: CategoriaGastoOp;
  valor: number;
  moeda: "BRL" | "USD";
  valorOriginal?: number;
  ativo: boolean;
  descricao?: string;
  criadoEm: string;
  mes?: string;
}

// ─── REGRAS DA EMPRESA ────────────────────────────────────────────────────────

export type RigidzRegraEmpresa = "inflexivel" | "recomendado" | "maleavel";
export type CategoriaRegraEmpresa = "operacional" | "arquivos" | "qualidade" | "comunicacao" | "seguranca" | "outro";

export interface RegraEmpresa {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaRegraEmpresa;
  rigidez: RigidzRegraEmpresa;
  icone: string;
  ativa: boolean;
  criadaEm: string;
  criadaPor: string;
}

export const REGRAS_INICIAIS: RegraEmpresa[] = [
  {
    id: "regra-001",
    titulo: "Shopify só manual",
    descricao: "Alterações na Shopify devem ser feitas manualmente. Não usar IA, Claude Code ou ferramentas automatizadas para executar comandos diretamente nas lojas. Toda mudança passa pela mão humana.",
    categoria: "operacional",
    rigidez: "inflexivel",
    icone: "🛒",
    ativa: true,
    criadaEm: "2026-06-10",
    criadaPor: "admin",
  },
  {
    id: "regra-002",
    titulo: "Subir arquivos no Drive",
    descricao: "Todo arquivo produzido (imagens, vídeos, docs, criativos, planilhas) deve ser salvo na pasta correta do Google Drive antes de qualquer outra ação. Não manter arquivos só localmente.",
    categoria: "arquivos",
    rigidez: "inflexivel",
    icone: "☁️",
    ativa: true,
    criadaEm: "2026-06-10",
    criadaPor: "admin",
  },
  {
    id: "regra-003",
    titulo: "Meta Ads: sempre usar post existente",
    descricao: "Nunca subir tráfego pago no Meta Ads a partir de arquivo do PC (upload direto). Sempre usar um post já publicado no Instagram ou Facebook para impulsionar — assim o anúncio aproveita o engajamento orgânico (curtidas, comentários, compartilhamentos) que o post já acumulou. Post sem engajamento = anúncio mais caro e menos eficaz.",
    categoria: "operacional",
    rigidez: "inflexivel",
    icone: "📣",
    ativa: true,
    criadaEm: "2026-06-15",
    criadaPor: "admin",
  },
];

export interface FornecedorItem {
  nome?: string;
  link?: string;
  precoPorUnidade?: number;
  precoPorFrete?: number;
}

export interface Produto {
  id: string;
  lojaId: string;
  nome: string;
  linkFornecedor?: string;
  fornecedorNome?: string;
  precoPorUnidade?: number;
  precoPorFrete?: number;
  fornecedores?: FornecedorItem[];
  taxaShopifyPct?: number;
  valorLiquido?: number;
  valorDeVenda?: number;
  margemLucro?: number;
  linkDriveImagem?: string;
  linkDriveVideo?: string;
  linkDriveGiff?: string;
  linkGoogleDocsCopy?: string;
  linkShopifyProduto?: string;
  valorDolarNoDia?: number;
  linkDocumentoProduto?: string;
  noAr: boolean;
  dataCriacao: string;
  validado?: boolean;
  reprovado?: boolean;
  emTeste?: boolean;           // movido manualmente para "Em Teste" (fixa mesmo incompleto)
  distribuidoPara?: string[];
  produtoOrigemId?: string;
  grupoId?: string;            // liga cópias do mesmo produto em lojas diferentes
}

export const CAMPOS_PRODUTO: { key: keyof Produto; label: string; tipo: "url" | "numero" | "moeda" | "pct" }[] = [
  { key: "linkFornecedor", label: "Link Fornecedor", tipo: "url" },
  { key: "precoPorUnidade", label: "Preco por Unidade", tipo: "moeda" },
  { key: "precoPorFrete", label: "Preco por Frete", tipo: "moeda" },
  { key: "taxaShopifyPct", label: "% Taxa Shopify", tipo: "pct" },
  { key: "valorLiquido", label: "Valor Liquido", tipo: "moeda" },
  { key: "valorDeVenda", label: "Valor de Venda", tipo: "moeda" },
  { key: "margemLucro", label: "Margem de Lucro", tipo: "pct" },
  { key: "linkDriveImagem", label: "Link Drive Imagem", tipo: "url" },
  { key: "linkDriveVideo", label: "Link Drive Video", tipo: "url" },
  { key: "linkDriveGiff", label: "Link Drive GIF", tipo: "url" },
  { key: "linkGoogleDocsCopy", label: "Link Google Docs Copy", tipo: "url" },
  { key: "linkShopifyProduto", label: "Link Shopify Produto", tipo: "url" },
  { key: "valorDolarNoDia", label: "Valor do Dolar no Dia (R$)", tipo: "moeda" },
];
export type NivelAcesso = "admin" | "colaborador";
export type StatusTarefa = "pendente" | "em_andamento" | "concluida" | "atrasada" | "travado" | "aguardando_revisao";
export type GrupoLoja = "izzat" | "partner";
export type MercadoLoja = "global" | "brasil";

export interface Loja {
  id: string;
  nome: string;
  grupo: GrupoLoja;
  mercado: MercadoLoja;
  responsavel: string;
  cor: string;
  logo?: string;
  corFundo?: string;
  descricao?: string;
  donoParceiro?: string;
  whatsappParceiro?: string;
  driveUrl?: string;
}

// Sócio-administrador: remuneração VARIÁVEL (% do lucro ou faturamento de uma loja).
// Entidade separada dos colaboradores. Vínculo opcional a um colaborador existente.
export interface SocioGestor {
  id: string;
  nome: string;
  contato?: string;
  colaboradorId?: string;        // mesma pessoa que tb é colaborador fixo (opcional)
  lojaId: string;
  base: "lucro" | "faturamento";
  percentual: number;            // ex: 30 (= 30%)
  ativo: boolean;
  criadoEm: string;
}

export const DRIVE_GERAL = "https://drive.google.com/drive/folders/1OCbJdICPKt4TA9TGta1nqzJPQJcTMBA3";

export interface LinkRapido {
  id: string;
  lojaId: string;
  nome: string;
  url: string;
  emoji: string;
  criadoEm: string;
}

export function semanaAtualKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function labelSemana(): string {
  const hoje = new Date();
  const dow = hoje.getDay();
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - (dow === 0 ? 6 : dow - 1));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  return `${fmt(seg)} — ${fmt(dom)}`;
}

export interface EntregaSemanal {
  id: string;
  colaboradorId: string;
  semana: string;
  titulo: string;
  status: "pendente" | "em_andamento" | "travado" | "entregue";
  motivoTravado?: string;
  criadoEm: string;
  concluidoEm?: string;
}

export const PERGUNTAS_PULSO = [
  "Quanto você se sentiu apoiado pela equipe esta semana?",
  "Quão clara estava sua prioridade principal esta semana?",
  "Quão bem você conseguiu se concentrar no trabalho?",
  "Quanto você se sentiu reconhecido pelo seu trabalho?",
  "Quão conectado você se sentiu com os objetivos da empresa?",
  "Com que frequência você precisou parar para resolver urgências?",
  "Quão satisfeito você está com o ritmo de trabalho desta semana?",
];

export interface Subtarefa {
  id: string;
  titulo: string;
  concluida: boolean;
  colaboradorId?: string; // sub-responsável (rotina que envolve várias pessoas)
  descricao?: string;     // observação / passo a passo da subtarefa
}

export interface RegistroSono {
  id: string;
  data: string;
  horaDormir: string;
  horaAcordar: string;
  horasDormidas: number;
}

export type Frequencia =
  | "diaria"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "trimestral"
  | "semestral"
  | "anual";

export interface Rotina {
  id: string;
  titulo: string;
  descricao?: string;
  subtarefas: Subtarefa[];
  concluida: boolean;
  lojaId?: string;              // loja dona da rotina (vazio = grupo/sem loja)
  colaboradorId?: string;       // responsável principal (vazio = sem responsável → Vagas)
  frequencia: Frequencia;
  criadoPor?: string;
  ativa?: boolean;
  // Recorrência automática (adicionado v21)
  dataInicio?: string;          // "YYYY-MM-DD" — âncora da recorrência
  proximaOcorrencia?: string;   // "YYYY-MM-DD" — quando vence o próximo ciclo
  ultimaConclusao?: string;     // "YYYY-MM-DD" — última vez concluída
  // Vaga temporária (adicionado v22): rotina sem pessoa, lembrete para contratar/delegar
  vagaTemporaria?: boolean;     // true = é uma necessidade de contratação/delegação
  motivoVaga?: string;          // ex: "Preciso de editor de vídeo"
}

export interface SubtarefaTarefa {
  id: string;
  titulo: string;
  concluida: boolean;
}

export interface MiniTarefaPessoal {
  id: string;
  colaboradorId: string;
  titulo: string;
  concluida: boolean;
  criadaEm: string;
}

export interface MembroTarefa {
  colaboradorId: string;
  subtarefas: SubtarefaTarefa[];
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  tipo?: "rapida" | "elaborada";
  prioridade: Prioridade;
  status: StatusTarefa;
  atribuidoPara: string;
  membros?: MembroTarefa[];
  criadoPor: string;
  lojaId?: string;
  dataCriacao: string;
  dataLimite?: string;
  concluidaEm?: string;
  comentarios?: ComentarioTarefa[];
  visualizacoes?: Record<string, string>;
  miniTarefas?: MiniTarefaPessoal[];
}

export interface Habilidade {
  nome: string;
  nivel: number;
}

export interface Expectativa {
  id: string;
  descricao: string;
  tipo: "diaria" | "semanal";
  peso: 1 | 2 | 3;
  cumprida: boolean;
}

export interface ComentarioTarefa {
  id: string;
  autorId: string;
  texto: string;
  criadoEm: string;
}

export interface Reconhecimento {
  id: string;
  deId: string;
  paraId: string;
  mensagem: string;
  emoji: string;
  data: string;
}

export interface HistoricoEntry {
  data: string;
  colaboradorId: string;
  pctRotinas: number;
  pctExpectativas: number;
  xpGanho: number;
  tarefasConcluidas: number;
}

export interface StatusOnline {
  ativo: boolean;
  ate?: string;
  desde?: string;
  proximoDia?: boolean;
  foco?: boolean;
  trabalhando?: string;
}

export interface BlocoHorario {
  inicio: string;
  fim: string;
}

export interface EntradaAtividade {
  id: string;
  colaboradorId: string;
  tipo: "tarefa_concluida" | "rotina_concluida" | "expectativa_cumprida" | "xp_ganho" | "check_in" | "pomodoro";
  descricao: string;
  hora: string;
  horaFim?: string;
  data: string;
  xp?: number;
}

export interface Story {
  id: string;
  autorId: string;
  conteudo: string;
  emoji: string;
  tipo: "conquista" | "update" | "reconhecimento";
  criadoEm: string;
  vistoPor: string[];
}

export interface NotificacaoInApp {
  id: string;
  paraId: string;
  tipo: "reconhecimento" | "tarefa_nova" | "tarefa_atrasada" | "nivel_up" | "streak_risco" | "online";
  titulo: string;
  corpo: string;
  lida: boolean;
  arquivada?: boolean;
  criadaEm: string;
  href?: string;
  snoozedUntil?: string;
}

export const NIVEIS = [
  { nivel: 1, nome: "Iniciante", xpMin: 0, cor: "#64748b" },
  { nivel: 2, nome: "Aprendiz", xpMin: 150, cor: "#3b82f6" },
  { nivel: 3, nome: "Praticante", xpMin: 400, cor: "#10b981" },
  { nivel: 4, nome: "Avançado", xpMin: 800, cor: "#f59e0b" },
  { nivel: 5, nome: "Expert", xpMin: 1500, cor: "#c9a84c" },
  { nivel: 6, nome: "Mestre", xpMin: 3000, cor: "#8b5cf6" },
  { nivel: 7, nome: "Lendário", xpMin: 5000, cor: "#ef4444" },
] as const;

export function calcNivel(xp: number) {
  const nivelAtual = [...NIVEIS].reverse().find((n) => xp >= n.xpMin) ?? NIVEIS[0];
  const proxIdx = NIVEIS.findIndex((n) => n.nivel === nivelAtual.nivel) + 1;
  const proximo = proxIdx < NIVEIS.length ? NIVEIS[proxIdx] : null;
  const progresso = proximo
    ? Math.round(((xp - nivelAtual.xpMin) / (proximo.xpMin - nivelAtual.xpMin)) * 100)
    : 100;
  return { ...nivelAtual, proximo, progresso, xp };
}

export interface SobreMim {
  motivacao: string;
  estiloTrabalho: string;
  desafioAtual: string;
}

export interface RespostaFormulario {
  // Etapa 1 — Identidade e Contexto
  dataNascimento?: string;
  casado: boolean | null;
  temFilhos: boolean | null;
  temOutroEmprego: boolean | null;
  escolaridade?: string;
  bairro?: string;

  // Etapa 2 — Sonhos e Objetivos
  sonho3anos?: string;
  sonho5anos?: string;
  oQueImpede?: string;

  // Etapa 3 — Como a empresa se encaixa
  porQueQuerTrabalhar?: string;
  comoEmpresaAjuda?: string;
  areaAprender?: string;

  // Etapa 4 — Rotina Real
  horasDisponiveis: number;
  horarioFoco: string;
  horarioInicio?: string;
  horarioFim?: string;
  diasDisponiveis?: string[];
  distracoes?: string;
  ambienteTrabalho?: string;
  blocos?: BlocoHorario[];

  // Etapa 5 — Estilo de Trabalho e Comunicacao
  reacaoFeedback?: string;
  motivadores?: string;
  desmotivadores?: string;
  prefereComunicacao?: string;

  // Etapa 6 — Autoconhecimento
  maiorForca?: string;
  aDesenvolver?: string;
  desafioSuperado?: string;

  // Etapa 7 — Bem-estar
  nivelEnergia?: number;
  praticaAtividade?: boolean | null;
  ansiedadeNivel?: number;
  oQueDeveSaber?: string;
  mensagemParaLider?: string;

  // Legacy / outros
  sobreMim?: SobreMim;
  pontosFortesLivre: string;
  dificuldades: string;
  preenchidoEm?: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone?: string;
  googleChatLink?: string;
  dataNascimento?: string;
  nivelAcesso: NivelAcesso;
  avatar: string;
  foto?: string;
  horasDisponiveis: number;
  habilidades: Habilidade[];
  lojas: string[];
  rotinas: Rotina[];
  expectativas: Expectativa[];
  reconhecimentos: Reconhecimento[];
  xp: number;
  streak: number;
  ultimoCheckIn?: string;
  horarioInicio?: string;
  horarioFim?: string;
  salario?: number;
  estado?: string;
  cor: string;
  formulario?: RespostaFormulario;
  statusOnline?: StatusOnline;
  ferramentasIds?: string[];
  registrosSono?: RegistroSono[];
}

// ─── FERRAMENTAS ──────────────────────────────────────────────────────────────

export interface Ferramenta {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  tipo: "individual" | "compartilhada";
  colaboradoresIds: string[];
  cor?: string;
}

// ─── LOJAS ────────────────────────────────────────────────────────────────────

export const LOJAS: Loja[] = [
  {
    id: "izzat-express",
    nome: "Izzat Express Global",
    grupo: "izzat",
    mercado: "global",
    responsavel: "denilson",
    cor: "#c9a84c",
    logo: "/lojas/izzat-express.svg",
    corFundo: "#0b1624",
    descricao: "Loja principal do Grupo Izzat, operações globais.",
  },
  {
    id: "apex-global",
    nome: "Apex Global",
    grupo: "izzat",
    mercado: "global",
    responsavel: "julio",
    cor: "#ffffff",
    logo: "/lojas/apex.png",
    corFundo: "#000000",
    descricao: "Marca Apex para mercado global.",
  },
  {
    id: "apex-br",
    nome: "Ah Men (Apex BR)",
    grupo: "izzat",
    mercado: "global",
    responsavel: "julio",
    cor: "#ffffff",
    logo: "/lojas/apex.png",
    corFundo: "#000000",
    descricao: "Versão brasileira da marca Apex.",
  },
  {
    id: "alpha-men-hair",
    nome: "Alpha Men Hair",
    grupo: "izzat",
    mercado: "brasil",
    responsavel: "julio",
    cor: "#ffffff",
    logo: "/lojas/alpha-men-hair.png",
    corFundo: "#000000",
    descricao: "Produtos masculinos para cabelo. Mercado brasileiro.",
  },
  {
    id: "louvt",
    nome: "Louvt",
    grupo: "izzat",
    mercado: "global",
    responsavel: "",
    cor: "#ffffff",
    logo: "/lojas/louvt.png",
    corFundo: "#f06b7a",
    descricao: "Marca Louvt do Grupo Izzat.",
  },
  {
    id: "injooy",
    nome: "Injooy",
    grupo: "partner",
    mercado: "global",
    responsavel: "mateus",
    cor: "#ffffff",
    logo: "/lojas/injooy.png",
    corFundo: "#5b3dde",
    descricao: "Loja partner, gestão Izzat, retorno garantido 18 meses.",
    donoParceiro: "A definir",
    whatsappParceiro: "",
  },
  {
    id: "liora",
    nome: "Liora",
    grupo: "partner",
    mercado: "global",
    responsavel: "amanda",
    cor: "#ffffff",
    logo: "/lojas/liora.png",
    corFundo: "#d4695a",
    descricao: "Loja partner, gestão Izzat, retorno garantido 18 meses.",
    donoParceiro: "A definir",
    whatsappParceiro: "",
  },
  {
    id: "hago",
    nome: "Hago",
    grupo: "partner",
    mercado: "global",
    responsavel: "ana",
    cor: "#ffffff",
    logo: "/lojas/hago.png",
    corFundo: "#2b4fff",
    descricao: "Loja partner, gestão Izzat, retorno garantido 18 meses.",
    donoParceiro: "A definir",
    whatsappParceiro: "",
  },
  {
    id: "huggypuppy",
    nome: "HuggyPuppy",
    grupo: "partner",
    mercado: "global",
    responsavel: "mauricio",
    cor: "#ffffff",
    logo: "/lojas/huggypuppy.png",
    corFundo: "#e8622a",
    descricao: "Loja partner, gestão Izzat, retorno garantido 18 meses.",
    donoParceiro: "A definir",
    whatsappParceiro: "",
  },
  {
    id: "loja-da-marga",
    nome: "Loja da Marga",
    grupo: "partner",
    mercado: "brasil",
    responsavel: "ana",
    cor: "#ffffff",
    logo: "/lojas/loja-da-marga.png",
    corFundo: "#111111",
    descricao: "Loja partner focada no mercado brasileiro.",
    donoParceiro: "Marga",
    whatsappParceiro: "+55 11 99999-0000",
  },
];

// ─── COLABORADORES ────────────────────────────────────────────────────────────

export const COLABORADORES: Colaborador[] = [
  {
    id: "mohamed",
    nome: "Mohamad",
    cargo: "Dono / Gestor",
    email: "mohamad@izzatglobal.com",
    telefone: "+55 11 91623-7916",
    nivelAcesso: "admin",
    avatar: "MO",
    foto: "/fotos/mohamad.png",
    horasDisponiveis: 10,
    cor: "#8B5CF6",
    estado: "SP",
    habilidades: [
      { nome: "Gestão", nivel: 95 },
      { nome: "Estratégia", nivel: 90 },
      { nome: "Vendas", nivel: 85 },
      { nome: "Tráfego", nivel: 60 },
      { nome: "Design", nivel: 30 },
    ],
    xp: 320,
    streak: 4,
    reconhecimentos: [],
    horarioInicio: "09:00",
    horarioFim: "19:00",
    lojas: [],
    rotinas: [
      {
        id: "rot-moh-1",
        titulo: "Revisão diária da equipe",
        descricao: "Revisar tarefas e rotinas de todos os colaboradores, desbloquear impedimentos",
        frequencia: "diaria",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-moh-1", titulo: "Verificar tarefas atrasadas", concluida: false },
          { id: "sub-moh-2", titulo: "Responder mensagens urgentes", concluida: false },
          { id: "sub-moh-3", titulo: "Tomar decisões pendentes", concluida: false },
        ],
      },
      {
        id: "rot-moh-2",
        titulo: "Reunião semanal de gestão",
        descricao: "Reunião com toda a equipe para alinhamento de objetivos e resultados da semana",
        frequencia: "semanal",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-moh-4", titulo: "Preparar pauta da reunião", concluida: false },
          { id: "sub-moh-5", titulo: "Conduzir reunião com equipe", concluida: false },
          { id: "sub-moh-6", titulo: "Registrar ações e responsáveis", concluida: false },
        ],
      },
      {
        id: "rot-moh-3",
        titulo: "Review mensal com diretoria",
        descricao: "Apresentar resultados consolidados do grupo para diretoria e definir prioridades",
        frequencia: "mensal",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-moh-7", titulo: "Compilar resultados de todas as lojas", concluida: false },
          { id: "sub-moh-8", titulo: "Reunião com diretoria", concluida: false },
          { id: "sub-moh-9", titulo: "Definir metas do próximo mês", concluida: false },
        ],
      },
      {
        id: "rot-moh-4",
        titulo: "Planejamento estratégico anual",
        descricao: "Definir visão, metas OKR, budget e roadmap do Grupo Izzat para o próximo ano",
        frequencia: "anual",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-moh-10", titulo: "Análise dos resultados do ano", concluida: false },
          { id: "sub-moh-11", titulo: "Workshop de planejamento estratégico", concluida: false },
          { id: "sub-moh-12", titulo: "Definir OKRs e budget do próximo ano", concluida: false },
          { id: "sub-moh-13", titulo: "Comunicar plano para toda a equipe", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-moh-1", descricao: "Revisar tarefas e rotinas da equipe", tipo: "diaria", peso: 3, cumprida: false },
      { id: "exp-moh-2", descricao: "Responder mensagens urgentes em até 2h", tipo: "diaria", peso: 3, cumprida: false },
      { id: "exp-moh-3", descricao: "Tomada de decisão sem travar processos", tipo: "diaria", peso: 2, cumprida: false },
    ],
  },
  {
    id: "denilson",
    nome: "Denilson Bitencourt",
    cargo: "",
    email: "denilson@izzatexpress.com",
    telefone: "+55 51 982074359",
    nivelAcesso: "admin",
    avatar: "DB",
    horasDisponiveis: 8,
    cor: "#10B981",
    estado: "RS",
    habilidades: [
      { nome: "Gestão", nivel: 80 },
      { nome: "Estratégia", nivel: 75 },
      { nome: "Análise", nivel: 70 },
      { nome: "Tráfego", nivel: 50 },
      { nome: "Design", nivel: 40 },
    ],
    xp: 540,
    streak: 7,
    reconhecimentos: [],
    horarioInicio: "09:00",
    horarioFim: "18:00",
    lojas: ["izzat-express"],
    rotinas: [
      {
        id: "rot-den-1",
        titulo: "Análise do App Vitals",
        descricao: "Analisar gravações de sessões e heatmaps da Izzat Express Global",
        lojaId: "izzat-express",
        concluida: false,
        frequencia: "diaria",
        subtarefas: [
          { id: "sub-den-1", titulo: "Verificar gravações do dia", concluida: false },
          { id: "sub-den-2", titulo: "Analisar heatmap das páginas principais", concluida: false },
          { id: "sub-den-3", titulo: "Registrar pontos de melhoria", concluida: false },
        ],
      },
      {
        id: "rot-den-2",
        titulo: "Relatório semanal Izzat Express",
        descricao: "Compilar métricas da semana: conversões, ROAS, pedidos, ticket médio",
        frequencia: "semanal",
        lojaId: "izzat-express",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-den-4", titulo: "Puxar dados do painel de anúncios", concluida: false },
          { id: "sub-den-5", titulo: "Registrar pedidos e receita da semana", concluida: false },
          { id: "sub-den-6", titulo: "Enviar relatório para diretoria", concluida: false },
        ],
      },
      {
        id: "rot-den-3",
        titulo: "Prestação de contas mensal",
        descricao: "Reunião com a diretoria apresentando valores, métricas e projeções da Izzat Express",
        frequencia: "mensal",
        lojaId: "izzat-express",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-den-7", titulo: "Preparar apresentação com dados do mês", concluida: false },
          { id: "sub-den-8", titulo: "Reunião com diretoria", concluida: false },
          { id: "sub-den-9", titulo: "Registrar ações definidas", concluida: false },
        ],
      },
      {
        id: "rot-den-4",
        titulo: "Planejamento anual Izzat Express",
        descricao: "Definir metas OKR, orçamento e roadmap para o próximo ano",
        frequencia: "anual",
        lojaId: "izzat-express",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-den-10", titulo: "Levantamento de resultados do ano", concluida: false },
          { id: "sub-den-11", titulo: "Definir OKRs do próximo ano", concluida: false },
          { id: "sub-den-12", titulo: "Aprovação com diretoria", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-den-1", descricao: "Analisar App Vitals da Izzat Express", tipo: "diaria", peso: 2, cumprida: false },
      { id: "exp-den-2", descricao: "Relatório de melhorias implementadas", tipo: "semanal", peso: 2, cumprida: false },
      { id: "exp-den-3", descricao: "Projetos entregues dentro do prazo", tipo: "semanal", peso: 3, cumprida: false },
    ],
  },
  {
    id: "leticia",
    nome: "Leticia Martins",
    cargo: "Financeiro",
    email: "finance@izzatglobal.com",
    telefone: "+55 11 97293-9657",
    nivelAcesso: "colaborador",
    avatar: "LM",
    foto: "/fotos/leticia.png",
    horasDisponiveis: 8,
    cor: "#EC4899",
    estado: "SP",
    habilidades: [
      { nome: "Financeiro", nivel: 90 },
      { nome: "Organização", nivel: 85 },
      { nome: "Pedidos", nivel: 80 },
      { nome: "Análise", nivel: 70 },
      { nome: "Gestão", nivel: 50 },
    ],
    xp: 890,
    streak: 12,
    reconhecimentos: [],
    horarioInicio: "08:00",
    horarioFim: "17:00",
    lojas: [],
    rotinas: [
      {
        id: "rot-let-1",
        titulo: "Processar Pedidos",
        descricao: "Processar todos os pedidos pendentes de todas as lojas",
        concluida: false,
        frequencia: "diaria",
        subtarefas: [
          { id: "sub-let-1", titulo: "Processamento da manhã (1ª vez)", concluida: false },
          { id: "sub-let-2", titulo: "Processamento do final do expediente (2ª vez)", concluida: false },
        ],
      },
      {
        id: "rot-let-2",
        titulo: "Relatório financeiro semanal",
        descricao: "Compilar receita, despesas e margem de todas as lojas do grupo na semana",
        frequencia: "semanal",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-let-3", titulo: "Consolidar receita de todas as lojas", concluida: false },
          { id: "sub-let-4", titulo: "Verificar despesas operacionais", concluida: false },
          { id: "sub-let-5", titulo: "Enviar planilha atualizada para diretoria", concluida: false },
        ],
      },
      {
        id: "rot-let-3",
        titulo: "Fechamento contábil mensal",
        descricao: "Fechamento de contas, conciliação bancária e relatório para contador",
        frequencia: "mensal",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-let-6", titulo: "Conciliação bancária de todas as contas", concluida: false },
          { id: "sub-let-7", titulo: "Relatório de DRE do mês", concluida: false },
          { id: "sub-let-8", titulo: "Enviar documentos para contador", concluida: false },
        ],
      },
      {
        id: "rot-let-4",
        titulo: "Balanço anual e planejamento financeiro",
        descricao: "Fechamento do ano fiscal, pagamento de impostos e planejamento financeiro para o próximo ano",
        frequencia: "anual",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-let-9", titulo: "Balanço geral do ano", concluida: false },
          { id: "sub-let-10", titulo: "Cálculo e pagamento de impostos anuais", concluida: false },
          { id: "sub-let-11", titulo: "Planejamento orçamentário do próximo ano", concluida: false },
          { id: "sub-let-12", titulo: "Renovação de contratos de fornecedores", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-let-1", descricao: "Processar pedidos antes das 10h", tipo: "diaria", peso: 3, cumprida: false },
      { id: "exp-let-2", descricao: "Processar pedidos ao final do expediente", tipo: "diaria", peso: 3, cumprida: false },
      { id: "exp-let-3", descricao: "Zero erros de pagamento na semana", tipo: "semanal", peso: 2, cumprida: false },
    ],
  },
  {
    id: "amanda",
    nome: "Amanda Clark",
    cargo: "Gestora de Tráfego",
    email: "amandaclark@izzatexpress.com",
    telefone: "+55 14 98160-0546",
    nivelAcesso: "colaborador",
    avatar: "AC",
    foto: "/fotos/amanda.png",
    horasDisponiveis: 8,
    cor: "#F59E0B",
    estado: "SP",
    habilidades: [
      { nome: "Meta Ads", nivel: 92 },
      { nome: "Tráfego Pago", nivel: 90 },
      { nome: "Análise", nivel: 80 },
      { nome: "Estratégia", nivel: 70 },
      { nome: "Design", nivel: 35 },
    ],
    xp: 650,
    streak: 5,
    reconhecimentos: [],
    horarioInicio: "10:00",
    horarioFim: "19:00",
    lojas: ["liora"],
    rotinas: [
      {
        id: "rot-am-1",
        titulo: "Análise do App Vitals",
        descricao: "Analisar gravações de sessões da Liora",
        lojaId: "liora",
        concluida: false,
        frequencia: "diaria",
        subtarefas: [
          { id: "sub-am-1", titulo: "Verificar gravações do dia", concluida: false },
          { id: "sub-am-2", titulo: "Analisar heatmap das páginas principais", concluida: false },
          { id: "sub-am-3", titulo: "Registrar pontos de melhoria", concluida: false },
        ],
      },
      {
        id: "rot-am-2",
        titulo: "Relatório de performance Liora",
        descricao: "Análise semanal de ROAS, CPA, CTR e budget gasto nos anúncios da Liora",
        frequencia: "semanal",
        lojaId: "liora",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-am-4", titulo: "Exportar dados do Meta Ads Manager", concluida: false },
          { id: "sub-am-5", titulo: "Calcular ROAS e CPA da semana", concluida: false },
          { id: "sub-am-6", titulo: "Ajustar budget e criativos conforme resultado", concluida: false },
        ],
      },
      {
        id: "rot-am-3",
        titulo: "Prestação de contas Liora",
        descricao: "Reunião mensal apresentando performance de tráfego pago da Liora para diretoria",
        frequencia: "mensal",
        lojaId: "liora",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-am-7", titulo: "Montar relatório de anúncios do mês", concluida: false },
          { id: "sub-am-8", titulo: "Reunião de alinhamento com diretoria", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-am-1", descricao: "Analisar performance dos anúncios diariamente", tipo: "diaria", peso: 2, cumprida: false },
      { id: "exp-am-2", descricao: "ROAS acima de 2.5x na semana", tipo: "semanal", peso: 3, cumprida: false },
      { id: "exp-am-3", descricao: "Entregar novos criativos testados", tipo: "semanal", peso: 2, cumprida: false },
    ],
  },
  {
    id: "ana",
    nome: "Ana Borges",
    cargo: "Operacional",
    email: "anaborges@izzatexpress.com",
    telefone: "+55 16 98132-6745",
    nivelAcesso: "colaborador",
    avatar: "AB",
    foto: "/fotos/ana.png",
    horasDisponiveis: 6,
    cor: "#14B8A6",
    estado: "SP",
    habilidades: [
      { nome: "Pedidos", nivel: 75 },
      { nome: "Organização", nivel: 70 },
      { nome: "Suporte", nivel: 65 },
      { nome: "Análise", nivel: 50 },
      { nome: "Gestão", nivel: 40 },
    ],
    xp: 410,
    streak: 3,
    reconhecimentos: [],
    horarioInicio: "09:00",
    horarioFim: "15:00",
    lojas: ["hago", "loja-da-marga"],
    rotinas: [
      {
        id: "rot-ana-1",
        titulo: "Análise do App Vitals",
        descricao: "Analisar gravações da Hago e Loja da Marga",
        concluida: false,
        frequencia: "diaria",
        subtarefas: [
          { id: "sub-ana-1", titulo: "Vitals - Hago", concluida: false },
          { id: "sub-ana-2", titulo: "Vitals - Loja da Marga", concluida: false },
        ],
      },
      {
        id: "rot-ana-2",
        titulo: "Relatório operacional semanal",
        descricao: "Relatório de pedidos, suporte e ocorrências da semana para Hago e Loja da Marga",
        frequencia: "semanal",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-ana-3", titulo: "Compilar pedidos da semana - Hago", concluida: false },
          { id: "sub-ana-4", titulo: "Compilar pedidos da semana - Loja da Marga", concluida: false },
          { id: "sub-ana-5", titulo: "Enviar relatório operacional", concluida: false },
        ],
      },
      {
        id: "rot-ana-3",
        titulo: "Reunião mensal com Marga",
        descricao: "Reunião de alinhamento com a dona parceira Marga sobre resultados e planos da loja",
        frequencia: "mensal",
        lojaId: "loja-da-marga",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-ana-6", titulo: "Preparar dados do mês da Loja da Marga", concluida: false },
          { id: "sub-ana-7", titulo: "Reunião com Marga via WhatsApp/videochamada", concluida: false },
          { id: "sub-ana-8", titulo: "Registrar decisões e próximos passos", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-ana-1", descricao: "Verificar status de pedidos pendentes", tipo: "diaria", peso: 2, cumprida: false },
      { id: "exp-ana-2", descricao: "Responder suporte em até 24h", tipo: "diaria", peso: 3, cumprida: false },
      { id: "exp-ana-3", descricao: "Relatório das lojas ao final da semana", tipo: "semanal", peso: 1, cumprida: false },
    ],
  },
  {
    id: "mauricio",
    nome: "Mauricio Batista",
    cargo: "Suporte ao Cliente",
    email: "mauricio@izzat.com",
    telefone: "+55 11 94986-3025",
    nivelAcesso: "colaborador",
    avatar: "MB",
    foto: "/fotos/mauricio.png",
    horasDisponiveis: 8,
    cor: "#6366F1",
    estado: "SP",
    habilidades: [
      { nome: "Suporte", nivel: 88 },
      { nome: "Comunicação", nivel: 85 },
      { nome: "Reembolsos", nivel: 80 },
      { nome: "Redes Sociais", nivel: 70 },
      { nome: "Vendas", nivel: 55 },
    ],
    xp: 720,
    streak: 9,
    reconhecimentos: [],
    horarioInicio: "08:00",
    horarioFim: "17:00",
    lojas: ["huggypuppy"],
    rotinas: [
      {
        id: "rot-mau-1",
        titulo: "Análise do App Vitals",
        descricao: "Analisar gravações da HuggyPuppy",
        lojaId: "huggypuppy",
        concluida: false,
        frequencia: "diaria",
        subtarefas: [
          { id: "sub-mau-1", titulo: "Verificar gravações do dia", concluida: false },
          { id: "sub-mau-2", titulo: "Analisar heatmap das páginas principais", concluida: false },
          { id: "sub-mau-3", titulo: "Registrar pontos de melhoria", concluida: false },
        ],
      },
      {
        id: "rot-mau-2",
        titulo: "Suporte e tickets do dia",
        descricao: "Responder todos os tickets abertos de suporte da HuggyPuppy e garantir zero pendências",
        frequencia: "diaria",
        lojaId: "huggypuppy",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-mau-4", titulo: "Verificar novos tickets desde ontem", concluida: false },
          { id: "sub-mau-5", titulo: "Responder tickets pendentes", concluida: false },
          { id: "sub-mau-6", titulo: "Resolver reembolsos pendentes há mais de 24h", concluida: false },
        ],
      },
      {
        id: "rot-mau-3",
        titulo: "Relatório de suporte semanal",
        descricao: "Compilar tickets resolvidos, tempo médio de resposta e satisfação do cliente",
        frequencia: "semanal",
        lojaId: "huggypuppy",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-mau-7", titulo: "Contar tickets resolvidos na semana", concluida: false },
          { id: "sub-mau-8", titulo: "Verificar reembolsos pendentes", concluida: false },
        ],
      },
      {
        id: "rot-mau-4",
        titulo: "Prestação de contas HuggyPuppy",
        descricao: "Reunião mensal com diretoria apresentando métricas de suporte e satisfação do cliente",
        frequencia: "mensal",
        lojaId: "huggypuppy",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-mau-9", titulo: "Compilar métricas de suporte do mês", concluida: false },
          { id: "sub-mau-10", titulo: "Reunião com diretoria", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-mau-1", descricao: "Responder todos os tickets abertos", tipo: "diaria", peso: 3, cumprida: false },
      { id: "exp-mau-2", descricao: "Zero ticket sem resposta há mais de 24h", tipo: "diaria", peso: 2, cumprida: false },
      { id: "exp-mau-3", descricao: "Reembolsos resolvidos em até 48h", tipo: "semanal", peso: 3, cumprida: false },
    ],
  },
  {
    id: "fagner",
    nome: "Fagner Fernando",
    cargo: "Designer / Social",
    email: "fagner@izzat.com",
    telefone: "+55 82 9149-7576",
    nivelAcesso: "colaborador",
    avatar: "FA",
    foto: "/fotos/fagner.png",
    horasDisponiveis: 8,
    cor: "#EF4444",
    estado: "AL",
    habilidades: [
      { nome: "Design", nivel: 82 },
      { nome: "Redes Sociais", nivel: 85 },
      { nome: "IA Imagens", nivel: 78 },
      { nome: "Vídeo", nivel: 72 },
      { nome: "Estratégia", nivel: 40 },
    ],
    xp: 180,
    streak: 2,
    reconhecimentos: [],
    horarioInicio: "10:00",
    horarioFim: "18:00",
    lojas: [],
    rotinas: [
      {
        id: "rot-fag-1",
        titulo: "Post diário nas redes sociais",
        descricao: "Publicar 1 post de qualidade nas redes do Grupo Izzat",
        frequencia: "diaria",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-fag-1", titulo: "Criar ou selecionar conteúdo do dia", concluida: false },
          { id: "sub-fag-2", titulo: "Publicar no Instagram e TikTok", concluida: false },
        ],
      },
      {
        id: "rot-fag-2",
        titulo: "Entrega semanal de criativos",
        descricao: "Entregar 5 criativos aprovados para as campanhas da semana",
        frequencia: "semanal",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-fag-3", titulo: "Produzir 5 criativos conforme briefing", concluida: false },
          { id: "sub-fag-4", titulo: "Revisar e enviar para aprovação", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-fag-1", descricao: "Publicar post diário nas redes sociais", tipo: "diaria", peso: 2, cumprida: false },
      { id: "exp-fag-2", descricao: "Entregar 5 criativos aprovados por semana", tipo: "semanal", peso: 3, cumprida: false },
      { id: "exp-fag-3", descricao: "Criativos entregues dentro do briefing", tipo: "semanal", peso: 2, cumprida: false },
    ],
  },
  {
    id: "julio",
    nome: "Julio Victor",
    cargo: "Designer Premium",
    email: "julio@izzatglobal.com",
    telefone: "+55 81 9951-9977",
    nivelAcesso: "colaborador",
    avatar: "JV",
    foto: "/fotos/julio.png",
    horasDisponiveis: 8,
    cor: "#D946EF",
    estado: "SP",
    habilidades: [
      { nome: "Design Premium", nivel: 95 },
      { nome: "UX/UI", nivel: 88 },
      { nome: "Identidade Visual", nivel: 90 },
      { nome: "Otimização", nivel: 75 },
      { nome: "Copy", nivel: 45 },
    ],
    xp: 1240,
    streak: 15,
    reconhecimentos: [{ id: "rec-0", deId: "mohamed", paraId: "julio", mensagem: "Identidade visual da Apex ficou incrível esta semana", emoji: "🏆", data: "2026-06-04" }],
    horarioInicio: "09:00",
    horarioFim: "18:00",
    lojas: ["apex-global", "apex-br", "alpha-men-hair"],
    rotinas: [
      {
        id: "rot-jul-1",
        titulo: "Análise do App Vitals",
        descricao: "Analisar Apex Global, Apex BR e Alpha Men Hair",
        concluida: false,
        frequencia: "diaria",
        subtarefas: [
          { id: "sub-jul-1", titulo: "Vitals - Apex Global", concluida: false },
          { id: "sub-jul-2", titulo: "Vitals - Apex BR", concluida: false },
          { id: "sub-jul-3", titulo: "Vitals - Alpha Men Hair", concluida: false },
        ],
      },
      {
        id: "rot-jul-2",
        titulo: "Entrega de criativos premium",
        descricao: "Entregar criativos aprovados para todas as lojas Apex e Alpha Men Hair",
        frequencia: "semanal",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-jul-4", titulo: "Finalizar criativos para Apex Global", concluida: false },
          { id: "sub-jul-5", titulo: "Finalizar criativos para Apex BR", concluida: false },
          { id: "sub-jul-6", titulo: "Otimizar 1 página de produto", concluida: false },
        ],
      },
      {
        id: "rot-jul-3",
        titulo: "Prestação de contas lojas Apex",
        descricao: "Reunião mensal apresentando performance visual e de conversão das lojas Apex",
        frequencia: "mensal",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-jul-7", titulo: "Montar relatório de criativos e resultados", concluida: false },
          { id: "sub-jul-8", titulo: "Reunião com diretoria", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-jul-1", descricao: "Analisar App Vitals das lojas Apex", tipo: "diaria", peso: 2, cumprida: false },
      { id: "exp-jul-2", descricao: "Entregar criativos premium aprovados", tipo: "semanal", peso: 3, cumprida: false },
      { id: "exp-jul-3", descricao: "Otimizar 1 página de produto por semana", tipo: "semanal", peso: 2, cumprida: false },
    ],
  },
  {
    id: "mateus",
    nome: "Mateus Torres",
    cargo: "Copy & Otimização",
    email: "matheustorres@izzatexpress.com",
    nivelAcesso: "colaborador",
    avatar: "MT",
    foto: "/fotos/mateus.png",
    horasDisponiveis: 7,
    cor: "#0EA5E9",
    estado: "GO",
    habilidades: [
      { nome: "Copywriting", nivel: 88 },
      { nome: "Otimização", nivel: 82 },
      { nome: "Vídeo", nivel: 75 },
      { nome: "Lançamentos", nivel: 70 },
      { nome: "Tráfego", nivel: 50 },
    ],
    xp: 960,
    streak: 11,
    reconhecimentos: [],
    horarioInicio: "08:00",
    horarioFim: "15:00",
    lojas: ["injooy"],
    rotinas: [
      {
        id: "rot-mat-1",
        titulo: "Análise do App Vitals",
        descricao: "Analisar gravações da Injooy",
        lojaId: "injooy",
        concluida: false,
        frequencia: "diaria",
        subtarefas: [
          { id: "sub-mat-1", titulo: "Verificar gravações do dia", concluida: false },
          { id: "sub-mat-2", titulo: "Analisar heatmap das páginas principais", concluida: false },
          { id: "sub-mat-3", titulo: "Registrar pontos de melhoria", concluida: false },
        ],
      },
      {
        id: "rot-mat-2",
        titulo: "Entrega de vídeos e copy Injooy",
        descricao: "Entregar 2 vídeos de produto e revisar copy das páginas da Injooy",
        frequencia: "semanal",
        lojaId: "injooy",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-mat-4", titulo: "Gravar e editar 2 vídeos de produto", concluida: false },
          { id: "sub-mat-5", titulo: "Revisar copy da home e PDPs", concluida: false },
        ],
      },
      {
        id: "rot-mat-3",
        titulo: "Prestação de contas Injooy",
        descricao: "Reunião mensal com diretoria apresentando métricas de copy, conversão e vídeos",
        frequencia: "mensal",
        lojaId: "injooy",
        concluida: false,
        ativa: true,
        subtarefas: [
          { id: "sub-mat-6", titulo: "Compilar métricas de conversão do mês", concluida: false },
          { id: "sub-mat-7", titulo: "Reunião com diretoria", concluida: false },
        ],
      },
    ],
    expectativas: [
      { id: "exp-mat-1", descricao: "Analisar App Vitals da Injooy", tipo: "diaria", peso: 2, cumprida: false },
      { id: "exp-mat-2", descricao: "Entregar 2 vídeos de produto por semana", tipo: "semanal", peso: 3, cumprida: false },
      { id: "exp-mat-3", descricao: "Revisar copy das lojas designadas", tipo: "semanal", peso: 2, cumprida: false },
    ],
  },
  {
    id: "junior",
    nome: "Junior",
    cargo: "Desenvolvedor",
    email: "junior@izzatexpress.com",
    telefone: "+55 87 9922-7401",
    nivelAcesso: "colaborador",
    avatar: "JR",
    foto: "/fotos/junior.jpg",
    horasDisponiveis: 8,
    cor: "#F97316",
    estado: "PE",
    habilidades: [
      { nome: "Dev Web", nivel: 90 },
      { nome: "Next.js", nivel: 85 },
      { nome: "TypeScript", nivel: 80 },
      { nome: "Design", nivel: 50 },
      { nome: "SEO", nivel: 40 },
    ],
    xp: 0,
    streak: 0,
    reconhecimentos: [],
    horarioInicio: "09:00",
    horarioFim: "18:00",
    lojas: [],
    rotinas: [],
    expectativas: [],
  },
];

// ─── ROTINAS (lista independente — v22) ───────────────────────────────────────
// Achata as rotinas que vinham embutidas em cada colaborador para uma lista
// própria, ligando cada uma ao seu colaborador (colaboradorId) e à loja (lojaId).
// Assim a rotina sobrevive à exclusão da pessoa e pode ser gerida pela loja.
const _hojeSeed = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

export const ROTINAS_MOCK: Rotina[] = COLABORADORES.flatMap((c) =>
  (c.rotinas || []).map((r) => ({
    ...r,
    colaboradorId: c.id,
    dataInicio: r.dataInicio || _hojeSeed,
    proximaOcorrencia: r.proximaOcorrencia || _hojeSeed,
  }))
);

// ─── TAREFAS MOCK ─────────────────────────────────────────────────────────────

export const TAREFAS_MOCK: Tarefa[] = [
  {
    id: "t1",
    titulo: "Otimizar página de produto - HuggyPuppy",
    descricao: "Melhorar imagens principais e descrição do produto estrela",
    prioridade: "alta",
    status: "pendente",
    atribuidoPara: "julio",
    criadoPor: "denilson",
    lojaId: "huggypuppy",
    dataCriacao: "2026-06-04",
  },
  {
    id: "t2",
    titulo: "Criar 5 criativos para Meta Ads - Liora",
    descricao: "Fotos de produto para campanha de conversão",
    prioridade: "alta",
    status: "em_andamento",
    atribuidoPara: "fagner",
    criadoPor: "denilson",
    lojaId: "liora",
    dataCriacao: "2026-06-04",
  },
  {
    id: "t3",
    titulo: "Revisar copy da home - Injooy",
    descricao: "Reescrever headline e subheadline da página inicial",
    prioridade: "media",
    status: "pendente",
    atribuidoPara: "mateus",
    criadoPor: "denilson",
    lojaId: "injooy",
    dataCriacao: "2026-06-04",
  },
  {
    id: "t4",
    titulo: "Verificar reembolsos pendentes",
    descricao: "Responder tickets de reembolso com mais de 48h",
    prioridade: "alta",
    status: "pendente",
    atribuidoPara: "mauricio",
    criadoPor: "denilson",
    dataCriacao: "2026-06-04",
  },
  {
    id: "t5",
    titulo: "Atualizar planilha de pedidos - semana",
    descricao: "Consolidar pedidos da semana em planilha",
    prioridade: "baixa",
    status: "concluida",
    atribuidoPara: "leticia",
    criadoPor: "denilson",
    dataCriacao: "2026-06-03",
  },
];

// ─── HISTORICO MOCK ───────────────────────────────────────────────────────────

function _sr(n: number): number {
  const x = Math.sin(n + 1.7) * 10000;
  return x - Math.floor(x);
}

function _gerarHistorico(): HistoricoEntry[] {
  const ids = ["denilson", "leticia", "amanda", "ana", "mauricio", "fagner", "julio", "mateus", "mohamed"];
  const base = new Date();
  const entries: HistoricoEntry[] = [];
  for (let ci = 0; ci < ids.length; ci++) {
    for (let d = 42; d >= 1; d--) {
      const dt = new Date(base);
      dt.setDate(dt.getDate() - d);
      if (dt.getDay() === 0 || dt.getDay() === 6) continue;
      const s = ci * 500 + d * 7;
      entries.push({
        data: dt.toISOString().split("T")[0],
        colaboradorId: ids[ci],
        pctRotinas: Math.round(55 + _sr(s + 1) * 45),
        pctExpectativas: Math.round(45 + _sr(s + 2) * 55),
        xpGanho: Math.round(20 + _sr(s + 3) * 140),
        tarefasConcluidas: Math.floor(_sr(s + 4) * 4),
      });
    }
  }
  return entries;
}

export const HISTORICO_MOCK: HistoricoEntry[] = _gerarHistorico();
