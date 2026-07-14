-- Seed inicial da tabela rotinas: só as 8 rotinas de Denilson e Mohamad
-- (mesmas que já estão no dados.rotinas de colaboradores, agora na tabela própria
-- que o app realmente lê/escreve). Idempotente: roda de novo sem duplicar.

insert into public.rotinas
  (id, titulo, descricao, loja_id, colaborador_id, frequencia, concluida, ativa, data_inicio, proxima_ocorrencia, dados)
values
('rot-moh-1', 'Revisão diária da equipe', 'Revisar tarefas e rotinas de todos os colaboradores, desbloquear impedimentos', null, 'mohamed', 'diaria', false, true, current_date, current_date,
  '{"subtarefas":[{"id":"sub-moh-1","titulo":"Verificar tarefas atrasadas","concluida":false},{"id":"sub-moh-2","titulo":"Responder mensagens urgentes","concluida":false},{"id":"sub-moh-3","titulo":"Tomar decisões pendentes","concluida":false}]}'::jsonb),
('rot-moh-2', 'Reunião semanal de gestão', 'Reunião com toda a equipe para alinhamento de objetivos e resultados da semana', null, 'mohamed', 'semanal', false, true, current_date, current_date,
  '{"subtarefas":[{"id":"sub-moh-4","titulo":"Preparar pauta da reunião","concluida":false},{"id":"sub-moh-5","titulo":"Conduzir reunião com equipe","concluida":false},{"id":"sub-moh-6","titulo":"Registrar ações e responsáveis","concluida":false}]}'::jsonb),
('rot-moh-3', 'Review mensal com diretoria', 'Apresentar resultados consolidados do grupo para diretoria e definir prioridades', null, 'mohamed', 'mensal', false, true, current_date, current_date,
  '{"subtarefas":[{"id":"sub-moh-7","titulo":"Compilar resultados de todas as lojas","concluida":false},{"id":"sub-moh-8","titulo":"Reunião com diretoria","concluida":false},{"id":"sub-moh-9","titulo":"Definir metas do próximo mês","concluida":false}]}'::jsonb),
('rot-moh-4', 'Planejamento estratégico anual', 'Definir visão, metas OKR, budget e roadmap do Grupo Izzat para o próximo ano', null, 'mohamed', 'anual', false, true, current_date, current_date,
  '{"subtarefas":[{"id":"sub-moh-10","titulo":"Análise dos resultados do ano","concluida":false},{"id":"sub-moh-11","titulo":"Workshop de planejamento estratégico","concluida":false},{"id":"sub-moh-12","titulo":"Definir OKRs e budget do próximo ano","concluida":false},{"id":"sub-moh-13","titulo":"Comunicar plano para toda a equipe","concluida":false}]}'::jsonb),
('rot-den-1', 'Análise do App Vitals', 'Analisar gravações de sessões e heatmaps da Izzat Express Global', 'izzat-express', 'denilson', 'diaria', false, true, current_date, current_date,
  '{"subtarefas":[{"id":"sub-den-1","titulo":"Verificar gravações do dia","concluida":false},{"id":"sub-den-2","titulo":"Analisar heatmap das páginas principais","concluida":false},{"id":"sub-den-3","titulo":"Registrar pontos de melhoria","concluida":false}]}'::jsonb),
('rot-den-2', 'Relatório semanal Izzat Express', 'Compilar métricas da semana: conversões, ROAS, pedidos, ticket médio', 'izzat-express', 'denilson', 'semanal', false, true, current_date, current_date,
  '{"subtarefas":[{"id":"sub-den-4","titulo":"Puxar dados do painel de anúncios","concluida":false},{"id":"sub-den-5","titulo":"Registrar pedidos e receita da semana","concluida":false},{"id":"sub-den-6","titulo":"Enviar relatório para diretoria","concluida":false}]}'::jsonb),
('rot-den-3', 'Prestação de contas mensal', 'Reunião com a diretoria apresentando valores, métricas e projeções da Izzat Express', 'izzat-express', 'denilson', 'mensal', false, true, current_date, current_date,
  '{"subtarefas":[{"id":"sub-den-7","titulo":"Preparar apresentação com dados do mês","concluida":false},{"id":"sub-den-8","titulo":"Reunião com diretoria","concluida":false},{"id":"sub-den-9","titulo":"Registrar ações definidas","concluida":false}]}'::jsonb),
('rot-den-4', 'Planejamento anual Izzat Express', 'Definir metas OKR, orçamento e roadmap para o próximo ano', 'izzat-express', 'denilson', 'anual', false, true, current_date, current_date,
  '{"subtarefas":[{"id":"sub-den-10","titulo":"Levantamento de resultados do ano","concluida":false},{"id":"sub-den-11","titulo":"Definir OKRs do próximo ano","concluida":false},{"id":"sub-den-12","titulo":"Aprovação com diretoria","concluida":false}]}'::jsonb)
on conflict (id) do update set
  titulo = excluded.titulo, descricao = excluded.descricao, loja_id = excluded.loja_id,
  colaborador_id = excluded.colaborador_id, frequencia = excluded.frequencia,
  dados = excluded.dados;
