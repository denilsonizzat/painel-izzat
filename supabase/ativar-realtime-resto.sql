-- Ativa Realtime em tarefas, rotinas e notificações.
-- Cada tabela isolada num bloco próprio — se uma já estiver ativa (erro),
-- não trava as outras.
do $$ begin
  alter publication supabase_realtime add table public.tarefas;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.rotinas;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.notificacoes;
exception when duplicate_object then null;
end $$;
