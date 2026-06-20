-- ═══════════════════════════════════════════════════════════
-- Super Painel Izzat — Módulo PRECIFICAÇÃO (Fase 1)
-- Cole no Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- ─── CONFIG por loja (tudo editável) ───────────────────────
create table if not exists prec_config (
  loja_id          text primary key,
  markup           numeric not null default 3.0,
  gateway_fee      numeric not null default 3.0,   -- %
  shopify_fee      numeric not null default 2.0,   -- %
  reembolso        numeric not null default 5.0,   -- % (e-commerce antecipado; sem COD)
  mkt              numeric not null default 25.0,  -- % verba marketing
  margem_min       numeric not null default 20.0,  -- %
  cambio_usd_brl   numeric not null default 5.40   -- fallback manual; câmbio do dia via API
);

-- ─── PAÍSES por loja (começa com 10 tiers, editável) ───────
create table if not exists prec_paises (
  id              bigint generated always as identity primary key,
  loja_id         text not null,
  cod             text not null,                   -- US, CA, UK, AU, IE, SG, HK, UAE, SA, JP...
  nome            text not null,
  moeda           text not null default 'USD',
  cambio          numeric not null default 1.0,    -- USD -> moeda local
  imposto         numeric not null default 0,      -- VAT % do país
  tier            text not null default 'A',       -- A | B
  markup_override numeric                          -- nulo = usa markup da config / por região
);
create index if not exists idx_prec_paises_loja on prec_paises (loja_id);

-- ─── PRODUTOS avaliados (esteira da precificação) ──────────
create table if not exists prec_produtos (
  id            bigint generated always as identity primary key,
  loja_id       text not null,
  nome          text not null,
  nota_garimpo  numeric,
  garimpo       jsonb,                             -- respostas dos 10 critérios (re-editar)
  status        text not null default 'avaliando', -- avaliando | aprovado | lista_espera | enviado
  criado_em     timestamptz not null default now()
);
create index if not exists idx_prec_produtos_loja on prec_produtos (loja_id, status);

-- ─── FORNECEDORES por produto (1 obrigatório + opcionais) ──
create table if not exists prec_fornecedores_prod (
  id          bigint generated always as identity primary key,
  produto_id  bigint not null references prec_produtos(id) on delete cascade,
  nome        text default 'AliExpress',
  link        text,
  custo       numeric not null default 0,
  frete       numeric not null default 0,
  prazo       int default 0,                       -- dias de entrega
  titular     boolean not null default false
);
create index if not exists idx_prec_forn_prod on prec_fornecedores_prod (produto_id);

-- ─── CUSTO por país (do fornecedor titular) ────────────────
create table if not exists prec_custos (
  id             bigint generated always as identity primary key,
  produto_id     bigint not null references prec_produtos(id) on delete cascade,
  pais_cod       text not null,
  custo_produto  numeric not null default 0,
  frete          numeric not null default 0
);
create index if not exists idx_prec_custos_prod on prec_custos (produto_id, pais_cod);

-- ─── RLS — liberado por enquanto (acesso controlado no app) ─
alter table prec_config            enable row level security;
alter table prec_paises            enable row level security;
alter table prec_produtos          enable row level security;
alter table prec_fornecedores_prod enable row level security;
alter table prec_custos            enable row level security;

create policy "prec_config_all"  on prec_config            for all using (true) with check (true);
create policy "prec_paises_all"  on prec_paises            for all using (true) with check (true);
create policy "prec_prod_all"    on prec_produtos          for all using (true) with check (true);
create policy "prec_forn_all"    on prec_fornecedores_prod for all using (true) with check (true);
create policy "prec_custos_all"  on prec_custos            for all using (true) with check (true);
