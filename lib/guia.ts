export interface Artigo {
  id: string;
  titulo: string;
  categoria: string;
  emoji: string;
  secoes: SecaoArtigo[];
}

export interface SecaoArtigo {
  titulo: string;
  conteudo: string; // HTML seguro (sem scripts)
}

export const CATEGORIAS_GUIA = [
  { id: "inicio", label: "Início" },
  { id: "lojas", label: "Lojas & Produtos" },
  { id: "equipe", label: "Equipe" },
  { id: "controle", label: "Controle & Custos" },
  { id: "ferramentas", label: "Ferramentas" },
  { id: "meta", label: "Sobre o App" },
];

export interface Versao {
  versao: string;
  data: string;
  titulo: string;
  mudancas: { tipo: "novo" | "melhoria" | "fix"; descricao: string; onde?: string }[];
}

export const DESENVOLVEDOR = {
  nome: "Denilson Bitencourt",
  cargo: "Fundador & Dev — Izzat Group",
  email: "denilson@izzatexpress.com",
  primeiroDeploy: "2025-01",
};

export const CHANGELOG: Versao[] = [
  {
    versao: "2.5",
    data: "23/06/2026",
    titulo: "Menu Ferramentas + Guia do App",
    mudancas: [
      { tipo: "novo", descricao: "Menu flutuante Ferramentas — botão único que abre Pomodoro, Calculadora, Fuso Horários e ROAS", onde: "Canto inferior direito" },
      { tipo: "novo", descricao: "Fuso Horários — relógio mundial com SP, NY, Londres, Dubai e Xangai em tempo real" },
      { tipo: "novo", descricao: "ROAS & Lucro — calculadora rápida de desempenho de ADS (receita, gasto, custo, margem)", onde: "Menu Ferramentas" },
      { tipo: "novo", descricao: "Campo Tráfego/Marketing % na Calculadora de Precificação — padrão 25%, editável", onde: "Calculadora → Precificação" },
      { tipo: "novo", descricao: "Guia do App com 12 artigos tutoriais e changelog", onde: "Menu lateral → Ajuda" },
      { tipo: "melhoria", descricao: "Todas as páginas agora ocupam 100% da tela ao recolher o menu lateral" },
      { tipo: "melhoria", descricao: "Sidebar: scroll do menu preservado ao navegar entre sub-páginas (ex: Custos)" },
      { tipo: "fix", descricao: "Badge do sino de notificações não é mais cortado quando menu lateral está expandido" },
      { tipo: "fix", descricao: "Tooltip OFFLINE não quebra linha — aparece à esquerda do botão" },
    ],
  },
  {
    versao: "2.4",
    data: "22/06/2026",
    titulo: "Notificações + Sidebar Custos + Branding",
    mudancas: [
      { tipo: "novo", descricao: "Central de Notificações — drawer no topo com abas Ativas/Arquivadas, swipe, snooze e filtro de data" },
      { tipo: "novo", descricao: "Submenu Custos no sidebar — Custo Total, Custo de Equipe, Custo Variável, Custo Operacional agrupados" },
      { tipo: "melhoria", descricao: "Nome do app: Grupo Izzat (era Izzat Group), favicon Z+, título da aba atualizado" },
      { tipo: "melhoria", descricao: "Botões na página de Lojas reorganizados em grupos Criar e Ferramentas" },
      { tipo: "melhoria", descricao: "Cache PWA forçado a atualizar (versão izzat-v3)" },
      { tipo: "fix", descricao: "Toast de notificações movido para topo para não cobrir botões FAB" },
    ],
  },
  {
    versao: "2.3",
    data: "01/06/2026",
    titulo: "Módulo Operação + Supabase",
    mudancas: [
      { tipo: "novo", descricao: "Banco de dados real com Supabase — dados persistem entre dispositivos" },
      { tipo: "novo", descricao: "Módulo Operação completo — pedidos, ADS e P&L real por loja" },
      { tipo: "novo", descricao: "Vagas & Pendências — rotinas sem responsável e necessidades de contratação" },
      { tipo: "melhoria", descricao: "Precificação: suporte a 19 países, 3 bundles, fornecedores AliExpress/Wiio/3Cliques/DV" },
    ],
  },
  {
    versao: "2.0",
    data: "15/04/2026",
    titulo: "VisionGlow PDP + Lojas v2",
    mudancas: [
      { tipo: "novo", descricao: "Página de produto Shopify VisionGlow com 12 seções, reviews Facebook-style" },
      { tipo: "novo", descricao: "Lojas: organização por grupo (Izzat / Partners / Arquivadas)" },
      { tipo: "melhoria", descricao: "Desempenho geral: carregamento inicial 40% mais rápido" },
    ],
  },
  {
    versao: "1.0",
    data: "01/2025",
    titulo: "Lançamento inicial",
    mudancas: [
      { tipo: "novo", descricao: "Dashboard com progresso do time, stories e KPIs" },
      { tipo: "novo", descricao: "Sistema de tarefas e rotinas com XP e nível" },
      { tipo: "novo", descricao: "Gestão de equipe — perfis, salários, Google Chat" },
      { tipo: "novo", descricao: "Módulo de Custos — folha salarial e ferramentas" },
      { tipo: "novo", descricao: "Pomodoro timer com registro de atividade" },
      { tipo: "novo", descricao: "PWA installável no celular e desktop" },
    ],
  },
];

export const ARTIGOS_GUIA: Artigo[] = [
  {
    id: "visao-geral",
    titulo: "Visão Geral do Painel",
    categoria: "inicio",
    emoji: "🏠",
    secoes: [
      {
        titulo: "O que é o Painel Izzat?",
        conteudo: `<p>O Painel Izzat é o sistema central de gestão do Grupo Izzat. Ele reúne em um único lugar:</p>
<ul>
  <li><strong>Gestão de equipe</strong> — rotinas, tarefas, nível de XP, check-in diário</li>
  <li><strong>Gestão de lojas</strong> — desempenho, conexões de API, custos por loja</li>
  <li><strong>Controle financeiro</strong> — P&L, custos de time, custos operacionais</li>
  <li><strong>Produtos</strong> — pipeline de validação, precificação por mercado</li>
</ul>`,
      },
      {
        titulo: "Menu lateral",
        conteudo: `<p>O menu lateral esquerdo tem <strong>6 seções</strong>:</p>
<ul>
  <li>🏠 <strong>Principal</strong> — Dashboard, Meu Dia, Tarefas</li>
  <li>🏪 <strong>Lojas & Produtos</strong> — Lojas, Produtos, Precificação</li>
  <li>👥 <strong>Equipe</strong> — Atividade, Formulário, Equipe, Rotinas, Semana</li>
  <li>🎛️ <strong>Controle</strong> — Operação, Vagas, Integrações, Custos (submenu)</li>
  <li>🌟 <strong>Crescimento</strong> — Desafios, Regras</li>
  <li>🌙 <strong>Pessoal</strong> — Sono, Ferramentas</li>
</ul>
<p>Clique no <strong>botão de seta</strong> no topo do menu para recolhê-lo e ganhar mais espaço na tela. No modo recolhido, apenas os ícones aparecem. Passe o mouse sobre eles para expandir temporariamente.</p>`,
      },
      {
        titulo: "Botões flutuantes",
        conteudo: `<p>Há 4 botões fixos no canto da tela (visíveis em qualquer página):</p>
<ul>
  <li><strong>ONLINE/OFFLINE</strong> (topo direito) — define seu status no sistema. Quando offline, suas rotinas não são cobradas.</li>
  <li><strong>🌙/☀️ Tema</strong> — alterna entre modo escuro e claro.</li>
  <li><strong>🍅 Pomodoro</strong> — timer de foco integrado ao sistema de tarefas.</li>
  <li><strong>🧮 Calculadora</strong> — calculadora flutuante sempre disponível.</li>
</ul>`,
      },
    ],
  },
  {
    id: "dashboard",
    titulo: "Dashboard",
    categoria: "inicio",
    emoji: "📊",
    secoes: [
      {
        titulo: "O que mostra o Dashboard?",
        conteudo: `<p>O Dashboard é a tela inicial e mostra um resumo do estado atual do grupo:</p>
<ul>
  <li><strong>Progresso do time</strong> — % de rotinas concluídas hoje, streak ativo e colaboradores online</li>
  <li><strong>Minhas tarefas do dia</strong> — rotinas e tarefas avulsas que vencem hoje</li>
  <li><strong>Stories da equipe</strong> — atividade recente de cada colaborador (como stories do Instagram)</li>
  <li><strong>Acesso rápido</strong> — atalhos para as seções mais usadas</li>
</ul>`,
      },
      {
        titulo: "Stories da equipe",
        conteudo: `<p>Cada membro do time tem um círculo no topo. A cor indica o status:</p>
<ul>
  <li>🟢 <strong>Verde</strong> — online e com progresso hoje</li>
  <li>🟡 <strong>Amarelo</strong> — online mas sem atividade ainda</li>
  <li>⚫ <strong>Cinza</strong> — offline</li>
</ul>
<p>Clique no círculo para ver o resumo do dia da pessoa: rotinas concluídas, tarefas feitas e XP ganho.</p>`,
      },
    ],
  },
  {
    id: "meu-dia",
    titulo: "Meu Dia",
    categoria: "inicio",
    emoji: "☀️",
    secoes: [
      {
        titulo: "Como funciona o Meu Dia?",
        conteudo: `<p><strong>Meu Dia</strong> é onde você gerencia seu dia a dia no painel. É dividido em:</p>
<ul>
  <li><strong>Check-in diário</strong> — como você está chegando hoje (energia, foco, humor). Aparece um pop-up automático ao abrir o app.</li>
  <li><strong>Rotinas de hoje</strong> — lista das suas rotinas com frequência diária, semanal ou mensal que vencem hoje</li>
  <li><strong>Tarefas avulsas</strong> — tarefas com prazo para hoje</li>
</ul>`,
      },
      {
        titulo: "Marcar rotina como concluída",
        conteudo: `<p>Clique no <strong>círculo</strong> ao lado da rotina para marcá-la como feita. Isso:</p>
<ul>
  <li>Soma XP ao seu perfil</li>
  <li>Atualiza seu streak (dias consecutivos com 100% do dia)</li>
  <li>Aparece no histórico de atividade da equipe</li>
</ul>
<p>⚠️ Se você estiver <strong>OFFLINE</strong> no sistema, suas rotinas não contam para o progresso do grupo mesmo que estejam marcadas.</p>`,
      },
    ],
  },
  {
    id: "lojas",
    titulo: "Lojas",
    categoria: "lojas",
    emoji: "🏪",
    secoes: [
      {
        titulo: "Lista de lojas",
        conteudo: `<p>A página de Lojas exibe todas as lojas do grupo organizadas em abas:</p>
<ul>
  <li><strong>Grupo Izzat</strong> — lojas principais do grupo</li>
  <li><strong>Partners</strong> — lojas parceiras</li>
  <li><strong>Arquivadas</strong> — lojas inativas</li>
</ul>
<p>Cada card mostra: nome, plataforma (Shopify, WooCommerce, etc.), status operacional e risco.</p>`,
      },
      {
        titulo: "Dentro de uma loja",
        conteudo: `<p>Ao entrar em uma loja específica, você encontra:</p>
<ul>
  <li><strong>Criar</strong> (admin) — botões para criar Nova Tarefa e Nova Rotina vinculadas à loja</li>
  <li><strong>Ferramentas</strong> — Precificar produto, Conexões API, Links rápidos, Custos da loja</li>
  <li><strong>Rotinas da loja</strong> — checklist de operações recorrentes</li>
  <li><strong>Tarefas da loja</strong> — pendências e projetos ativos</li>
</ul>`,
      },
      {
        titulo: "Conexões API",
        conteudo: `<p>O botão <strong>Conexões API</strong> abre um painel com todas as chaves de integração da loja:</p>
<ul>
  <li>Shopify Admin Token</li>
  <li>Meta (Facebook/Instagram) — pixel e token de anúncios</li>
  <li>Google Ads / Analytics</li>
  <li>TikTok Pixel</li>
</ul>
<p>Essas chaves são usadas pelo módulo de Operação para puxar dados de pedidos, gastos com ADS e calcular o P&L automaticamente.</p>`,
      },
    ],
  },
  {
    id: "precificacao",
    titulo: "Precificação",
    categoria: "lojas",
    emoji: "🧮",
    secoes: [
      {
        titulo: "O que é a Precificação?",
        conteudo: `<p>O módulo de Precificação calcula o preço de venda ideal para um produto considerando todos os custos e a margem desejada. Funciona para venda internacional (19+ países) e nacional.</p>`,
      },
      {
        titulo: "Como precificar um produto",
        conteudo: `<ol>
  <li>Acesse <strong>Precificação</strong> no menu ou clique em "🧮 Precificar" dentro de uma loja</li>
  <li>Informe o <strong>custo do produto</strong> (fornecedor: AliExpress, Wiio, 3Cliques ou DV)</li>
  <li>Informe o <strong>custo de frete</strong> para o país destino</li>
  <li>Defina a <strong>margem desejada</strong> (%)</li>
  <li>O sistema calcula automaticamente: impostos, taxas da plataforma, processamento e o preço final em BRL e na moeda local</li>
</ol>
<p>Você pode comparar até 3 bundles (ex: 1 unidade, 2 unidades, kit especial) lado a lado.</p>`,
      },
    ],
  },
  {
    id: "operacao",
    titulo: "Operação (P&L)",
    categoria: "controle",
    emoji: "📈",
    secoes: [
      {
        titulo: "O que é o módulo de Operação?",
        conteudo: `<p>O módulo de Operação mostra o resultado financeiro real de cada loja. Para cada período você vê:</p>
<ul>
  <li><strong>Pedidos</strong> — quantidade, ticket médio, taxa de aprovação</li>
  <li><strong>ADS</strong> — gasto com anúncios por plataforma (Meta, Google, TikTok)</li>
  <li><strong>P&L</strong> — Receita bruta → devoluções → custos de produto → frete → ADS → taxas → <strong>Lucro líquido</strong></li>
</ul>`,
      },
      {
        titulo: "Como os dados chegam?",
        conteudo: `<p>Os dados são puxados automaticamente via API usando as chaves configuradas em <strong>Conexões API</strong> de cada loja. Para configurar:</p>
<ol>
  <li>Entre na loja → clique em <strong>Conexões API</strong></li>
  <li>Preencha os tokens de Shopify, Meta, Google e TikTok</li>
  <li>Salve — os dados começam a aparecer na Operação no próximo ciclo de sincronização</li>
</ol>`,
      },
    ],
  },
  {
    id: "custos",
    titulo: "Módulo de Custos",
    categoria: "controle",
    emoji: "💰",
    secoes: [
      {
        titulo: "4 visões de custo",
        conteudo: `<p>O menu <strong>Custos</strong> tem 4 sub-páginas:</p>
<ul>
  <li><strong>Custo Total</strong> — soma de tudo: equipe + ferramentas + operações. "Quanto custa manter o grupo por mês?"</li>
  <li><strong>Custo de Equipe</strong> — salários de cada colaborador (folha salarial)</li>
  <li><strong>Custo Variável</strong> — sócios-gestores que recebem % do resultado</li>
  <li><strong>Custo Operacional</strong> — gastos fixos por loja: ADS fixo, ferramentas SaaS, taxas de plataforma</li>
</ul>`,
      },
      {
        titulo: "Como registrar um custo operacional",
        conteudo: `<ol>
  <li>Acesse <strong>Custo Operacional</strong> no submenu Custos</li>
  <li>Clique em <strong>+ Adicionar</strong></li>
  <li>Selecione a loja, a categoria (ADS, Ferramenta, Taxa, etc.), o valor e o mês de referência</li>
  <li>Salve — o custo já aparece no Custo Total do mesmo mês</li>
</ol>`,
      },
    ],
  },
  {
    id: "integracoes",
    titulo: "Integrações",
    categoria: "controle",
    emoji: "🔌",
    secoes: [
      {
        titulo: "O que são as Integrações?",
        conteudo: `<p>As Integrações conectam o Painel Izzat com as plataformas externas de cada loja. Sem as chaves configuradas, os módulos de Operação e Precificação não puxam dados automaticamente.</p>`,
      },
      {
        titulo: "Plataformas suportadas",
        conteudo: `<ul>
  <li><strong>Shopify</strong> — pedidos, produtos, estoque, clientes</li>
  <li><strong>Meta (Facebook/Instagram)</strong> — campanhas, gastos com ADS, pixel de conversão</li>
  <li><strong>Google Ads / GA4</strong> — campanhas, sessões, conversões</li>
  <li><strong>TikTok</strong> — campanhas e pixel</li>
  <li><strong>N8N</strong> — automações internas do grupo</li>
</ul>`,
      },
      {
        titulo: "Como adicionar uma chave de API",
        conteudo: `<ol>
  <li>Vá em <strong>Integrações</strong> no menu ou em <strong>Conexões API</strong> dentro de uma loja</li>
  <li>Selecione a plataforma que quer conectar</li>
  <li>Cole a chave/token — você encontra essa chave no painel administrativo da plataforma (Shopify Admin → Configurações → Apps e canais)</li>
  <li>Clique em <strong>Salvar</strong></li>
</ol>
<p>⚠️ Nunca compartilhe tokens de API com pessoas fora do grupo. Eles dão acesso total à conta.</p>`,
      },
    ],
  },
  {
    id: "tarefas",
    titulo: "Tarefas",
    categoria: "inicio",
    emoji: "✅",
    secoes: [
      {
        titulo: "Tipos de tarefa",
        conteudo: `<p>Há dois tipos de tarefa no sistema:</p>
<ul>
  <li><strong>Rotinas</strong> — tarefas recorrentes com frequência definida (diária, semanal, mensal). São geradas automaticamente no dia certo.</li>
  <li><strong>Avulsas</strong> — tarefas únicas com prazo, criadas manualmente pelo admin ou por você mesmo.</li>
</ul>`,
      },
      {
        titulo: "Criar uma tarefa",
        conteudo: `<ol>
  <li>Clique no botão <strong>+</strong> flutuante (canto inferior direito) — disponível apenas para admins</li>
  <li>Preencha: título, prioridade (alta/média/baixa), responsável e loja (opcional)</li>
  <li>Defina a data de vencimento</li>
  <li>Clique em <strong>Criar</strong></li>
</ol>
<p>A tarefa aparece automaticamente no <strong>Meu Dia</strong> do responsável na data de vencimento.</p>`,
      },
      {
        titulo: "Prioridades e XP",
        conteudo: `<ul>
  <li>🔴 <strong>Alta</strong> — 30 XP ao concluir</li>
  <li>🟡 <strong>Média</strong> — 20 XP</li>
  <li>🟢 <strong>Baixa</strong> — 10 XP</li>
</ul>
<p>XP acumula no perfil e é usado para calcular o nível e os desafios.</p>`,
      },
    ],
  },
  {
    id: "notificacoes",
    titulo: "Notificações",
    categoria: "inicio",
    emoji: "🔔",
    secoes: [
      {
        titulo: "Como abrir as notificações",
        conteudo: `<p>Clique no <strong>ícone de sino</strong> no canto superior do menu lateral (desktop) ou no cabeçalho (mobile). O painel de notificações desliza do topo com todas as notificações ativas.</p>`,
      },
      {
        titulo: "Ações disponíveis",
        conteudo: `<ul>
  <li><strong>Marcar como lida/não lida</strong> — clique no botão "Lida" para alternar o status</li>
  <li><strong>Lembrar mais tarde</strong> — adia a notificação por 15 min, 1h, 3h ou até amanhã</li>
  <li><strong>Abrir</strong> — vai direto para a página relacionada à notificação</li>
  <li><strong>Arrastar para o lado</strong> — deslize a notificação para arquivá-la rapidamente</li>
</ul>`,
      },
      {
        titulo: "Aba Arquivadas",
        conteudo: `<p>Notificações concluídas ou arquivadas ficam na aba <strong>Arquivadas</strong>. Você pode reativar qualquer uma clicando em "Não lida" para movê-la de volta para as Ativas.</p>`,
      },
    ],
  },
  {
    id: "equipe-gestao",
    titulo: "Gestão de Equipe",
    categoria: "equipe",
    emoji: "👥",
    secoes: [
      {
        titulo: "Perfil do colaborador",
        conteudo: `<p>Cada colaborador tem um perfil com:</p>
<ul>
  <li>Nome, cargo, avatar e contato (Google Chat, WhatsApp)</li>
  <li>Nível atual e XP acumulado</li>
  <li>Streak — dias consecutivos com check-in e rotinas concluídas</li>
  <li>Salário (visível apenas para admin)</li>
  <li>Lista de rotinas atribuídas</li>
</ul>`,
      },
      {
        titulo: "Semana do Time",
        conteudo: `<p>A página <strong>Semana do Time</strong> mostra uma visão semanal de cada pessoa: o que foi feito em cada dia da semana, status (em dia, travado, atrasado) e quantas rotinas foram concluídas.</p>
<p>Use essa visão para identificar rapidamente quem precisa de apoio na semana.</p>`,
      },
    ],
  },
  {
    id: "pomodoro",
    titulo: "Pomodoro & Calculadora",
    categoria: "ferramentas",
    emoji: "🍅",
    secoes: [
      {
        titulo: "Timer Pomodoro",
        conteudo: `<p>O 🍅 no canto da tela abre um timer Pomodoro com ciclos de foco/descanso:</p>
<ul>
  <li><strong>Foco</strong> — 25 minutos de trabalho concentrado</li>
  <li><strong>Pausa curta</strong> — 5 minutos</li>
  <li><strong>Pausa longa</strong> — 15 minutos (a cada 4 ciclos)</li>
</ul>
<p>Ao terminar um ciclo de foco, o sistema registra automaticamente como atividade e soma XP bônus.</p>`,
      },
      {
        titulo: "Calculadora flutuante",
        conteudo: `<p>A 🧮 no canto da tela é uma calculadora sempre disponível. Útil para cálculos rápidos de precificação, margem ou frete sem sair da página atual.</p>`,
      },
    ],
  },
];
