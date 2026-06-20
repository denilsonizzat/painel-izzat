-- ═══════════════════════════════════════════════════════════
-- Super Painel Izzat — Módulo Operação (Fase 1)
-- Cole isto no Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- ─── PEDIDOS ───────────────────────────────────────────────
create table if not exists op_pedidos (
  id            bigint generated always as identity primary key,
  loja_id       text not null,
  data          date not null,
  num_pedido    text,
  fornecedor    text,
  custo_produto numeric not null default 0,
  frete         numeric not null default 0,
  faturamento   numeric not null default 0,
  produto       text,
  status        text default '',            -- '' | reembolso | disputa
  notas         text,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_op_pedidos_loja_data on op_pedidos (loja_id, data);

-- ─── ADS ───────────────────────────────────────────────────
create table if not exists op_ads (
  id          bigint generated always as identity primary key,
  loja_id     text not null,
  data        date not null,
  valor       numeric not null default 0,
  plataforma  text default 'Meta',
  criado_em   timestamptz not null default now()
);
create index if not exists idx_op_ads_loja_data on op_ads (loja_id, data);

-- ─── CONFIG (taxas por loja) ───────────────────────────────
create table if not exists op_config (
  loja_id      text primary key,
  gateway_fee  numeric not null default 2.9,
  shopify_fee  numeric not null default 0.5,
  imposto      numeric not null default 6.0,
  ads_budget   numeric not null default 30,
  margem_alvo  numeric not null default 20
);

-- ─── RLS — por enquanto liberado (acesso por anon key) ─────
-- O painel já controla quem é admin/colaborador no app.
-- Endurecemos depois com auth Supabase, se quiser.
alter table op_pedidos enable row level security;
alter table op_ads     enable row level security;
alter table op_config  enable row level security;

create policy "op_pedidos_all" on op_pedidos for all using (true) with check (true);
create policy "op_ads_all"     on op_ads     for all using (true) with check (true);
create policy "op_config_all"  on op_config  for all using (true) with check (true);
