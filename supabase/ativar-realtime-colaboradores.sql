-- Ativa Realtime (mudanças ao vivo) na tabela colaboradores.
-- Sem isso, o código escuta mas nunca recebe eventos.
alter publication supabase_realtime add table public.colaboradores;
