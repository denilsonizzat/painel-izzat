-- ═══════════════════════════════════════════════════════════
-- Fase 2B — tabela de METAS (rode no Supabase → SQL Editor → Run)
-- ═══════════════════════════════════════════════════════════
create table if not exists op_metas (
  loja_id          text not null,
  mes              int  not null,
  ano              int  not null,
  meta_faturamento numeric not null default 0,
  meta_lucro       numeric not null default 0,
  meta_pedidos     int  not null default 0,
  primary key (loja_id, mes, ano)
);
alter table op_metas enable row level security;
create policy "op_metas_all" on op_metas for all using (true) with check (true);
