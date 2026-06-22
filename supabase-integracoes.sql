-- ═══════════════════════════════════════════════════════════
-- Super Painel Izzat — INTEGRAÇÕES por loja (esqueleto, sem segredos)
-- Cole no Supabase → SQL Editor → Run
-- Guarda só STATUS e identificador não-secreto. Token de API entra
-- depois, server-side (nunca aqui, nunca no client).
-- ═══════════════════════════════════════════════════════════
create table if not exists loja_integracoes (
  id           bigint generated always as identity primary key,
  loja_id      text not null,
  plataforma   text not null,                       -- shopify | meta | google | tiktok
  status       text not null default 'nao_conectado', -- nao_conectado | configurando | conectado
  conta        text,                                -- domínio/ID da conta (NÃO secreto)
  ultima_sync  timestamptz,
  obs          text,
  unique (loja_id, plataforma)
);
create index if not exists idx_loja_integr on loja_integracoes (loja_id);

alter table loja_integracoes enable row level security;
create policy "loja_integr_all" on loja_integracoes for all using (true) with check (true);
