-- ═══════════════════════════════════════════════════════════════════════
--  PAINEL IZZAT — Schema Supabase (Postgres)
--  Estratégia híbrida: colunas reais pro que é consultável/importa
--  (salário, status, acesso) + JSONB pro aninhado (rotinas, formulário…).
--  Rodar UMA vez no SQL Editor do Supabase Dashboard.
--  Idempotente: pode rodar de novo sem quebrar (IF NOT EXISTS / OR REPLACE).
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Função utilitária: atualiza updated_at automaticamente ───
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ═══════════════════════════════════════════════════════════════════════
--  COLABORADORES  (1 linha por pessoa · liga ao login via auth_id)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.colaboradores (
  id               text primary key,                 -- id de negócio ("denilson")
  auth_id          uuid references auth.users(id) on delete set null,
  nome             text not null,
  cargo            text,
  email            text unique,
  telefone         text,
  nivel_acesso     text not null default 'colaborador',  -- admin | gestor | colaborador
  avatar           text,
  foto             text,
  cor              text,
  xp               integer not null default 0,
  streak           integer not null default 0,
  salario          numeric,                           -- coluna real → consultável/protegível
  estado           text,
  ultimo_checkin   date,
  horario_inicio   text,
  horario_fim      text,
  horas_disponiveis numeric,
  status_online    text,
  dados            jsonb not null default '{}'::jsonb, -- habilidades, lojas, rotinas, expectativas,
                                                       -- reconhecimentos, formulario, registrosSono,
                                                       -- ferramentasIds, googleChatLink, dataNascimento
  updated_at       timestamptz not null default now()
);
drop trigger if exists trg_colab_touch on public.colaboradores;
create trigger trg_colab_touch before update on public.colaboradores
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
--  TAREFAS
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.tarefas (
  id             text primary key,
  titulo         text not null,
  descricao      text,
  tipo           text,
  prioridade     text,
  status         text not null default 'pendente',
  atribuido_para text,
  criado_por     text,
  loja_id        text,
  data_criacao   timestamptz default now(),
  data_limite    timestamptz,
  concluida_em   timestamptz,
  dados          jsonb not null default '{}'::jsonb,  -- membros, comentarios, miniTarefas, visualizacoes
  updated_at     timestamptz not null default now()
);
create index if not exists idx_tarefas_atribuido on public.tarefas(atribuido_para);
create index if not exists idx_tarefas_status on public.tarefas(status);
drop trigger if exists trg_tarefas_touch on public.tarefas;
create trigger trg_tarefas_touch before update on public.tarefas
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
--  ROTINAS  (recorrentes · podem ser "vaga" sem dono)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.rotinas (
  id                 text primary key,
  titulo             text not null,
  descricao          text,
  loja_id            text,
  colaborador_id     text,
  frequencia         text not null default 'diaria',
  criado_por         text,
  concluida          boolean default false,
  ativa              boolean default true,
  vaga_temporaria    boolean default false,
  motivo_vaga        text,
  data_inicio        date,
  proxima_ocorrencia date,
  ultima_conclusao   date,
  dados              jsonb not null default '{}'::jsonb,  -- subtarefas[]
  updated_at         timestamptz not null default now()
);
create index if not exists idx_rotinas_colab on public.rotinas(colaborador_id);
drop trigger if exists trg_rotinas_touch on public.rotinas;
create trigger trg_rotinas_touch before update on public.rotinas
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
--  NOTIFICAÇÕES
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.notificacoes (
  id          text primary key,
  para_id     text,
  de_id       text,
  tipo        text,
  lida        boolean default false,
  arquivada   boolean default false,
  criado_em   timestamptz default now(),
  dados       jsonb not null default '{}'::jsonb
);
create index if not exists idx_notif_para on public.notificacoes(para_id);

-- ═══════════════════════════════════════════════════════════════════════
--  ATIVIDADES (histórico/log · feed)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.atividades (
  id             bigint generated always as identity primary key,
  colaborador_id text,
  data           date,
  tipo           text,
  dados          jsonb not null default '{}'::jsonb,
  criado_em      timestamptz default now()
);
create index if not exists idx_ativ_colab on public.atividades(colaborador_id);
create index if not exists idx_ativ_data on public.atividades(data);

-- ═══════════════════════════════════════════════════════════════════════
--  ENTREGAS SEMANAIS / DESAFIOS / CHECK-INS
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.entregas_semanais (
  id             text primary key,
  colaborador_id text,
  semana         text,
  dados          jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

create table if not exists public.desafios (
  id         text primary key,
  titulo     text,
  ativo      boolean default true,
  dados      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins_desafio (
  id             bigint generated always as identity primary key,
  desafio_id     text,
  colaborador_id text,
  data           date,
  dados          jsonb not null default '{}'::jsonb,
  criado_em      timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════
--  PRODUTOS / FERRAMENTAS / GASTOS / LOJAS CUSTOM / SÓCIOS
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.produtos (
  id         text primary key,
  loja_id    text,
  nome       text,
  status     text,
  dados      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists idx_produtos_loja on public.produtos(loja_id);

create table if not exists public.ferramentas (
  id         text primary key,
  nome       text,
  descricao  text,
  preco      numeric default 0,
  tipo       text,
  cor        text,
  dados      jsonb not null default '{}'::jsonb,  -- colaboradoresIds
  updated_at timestamptz not null default now()
);

create table if not exists public.gastos_operacionais (
  id         text primary key,
  dados      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.lojas_custom (
  id         text primary key,
  nome       text,
  arquivada  boolean default false,
  dados      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.socios (
  id         text primary key,
  dados      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.stories (
  id             text primary key,
  colaborador_id text,
  criado_em      timestamptz default now(),
  dados          jsonb not null default '{}'::jsonb
);

-- ═══════════════════════════════════════════════════════════════════════
--  APP_ESTADO — chave/valor pros singletons globais
--  (pulsoAtual, missoesSemana, fichasReconhecimento, regrasEmpresa,
--   linksRapidos, lojasArquivadas, ultimaResetaFichas…)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.app_estado (
  chave      text primary key,
  valor      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_estado_touch on public.app_estado;
create trigger trg_estado_touch before update on public.app_estado
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
--  RLS — Row Level Security
--  Fase 1: time confiável (15 pessoas). Qualquer usuário AUTENTICADO
--  lê e escreve tudo. (Restrições por papel/admin → Fase 3.)
--  IMPORTANTE: sem nenhuma policy, RLS bloqueia 100%. Estas liberam o time.
-- ═══════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array[
    'colaboradores','tarefas','rotinas','notificacoes','atividades',
    'entregas_semanais','desafios','check_ins_desafio','produtos',
    'ferramentas','gastos_operacionais','lojas_custom','socios','stories','app_estado'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "auth_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "auth_all_%1$s" on public.%1$s
         for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- NOTA: op_* e prec_* NÃO são tocadas aqui de propósito — já estão em
-- produção usando a anon key (sem Supabase Auth ainda). Mexer na RLS delas
-- pra exigir "authenticated" quebraria o módulo Operação/Precificação no ar.
-- Isso entra só na Fase 3 (RLS por papel), junto com o login real.

-- ═══════════════════════════════════════════════════════════════════════
--  FIM. Próximo passo: popular colaboradores (seed) e migrar o store.
-- ═══════════════════════════════════════════════════════════════════════
