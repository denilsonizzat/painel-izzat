-- Seed inicial: só Denilson e Mohamad (Fase 2 começando pequeno).
-- Idempotente: roda de novo sem duplicar (on conflict atualiza).

insert into public.colaboradores
  (id, nome, cargo, email, telefone, nivel_acesso, avatar, foto, cor, xp, streak, horas_disponiveis, estado, horario_inicio, horario_fim, dados)
values
(
  'mohamed', 'Mohamad', 'Dono / Gestor', 'mohamad@izzatglobal.com', '+55 11 91623-7916',
  'admin', 'MO', '/fotos/mohamad.png', '#8B5CF6', 320, 4, 10, 'SP', '09:00', '19:00',
  '{
    "habilidades": [
      {"nome":"Gestão","nivel":95},{"nome":"Estratégia","nivel":90},
      {"nome":"Vendas","nivel":85},{"nome":"Tráfego","nivel":60},{"nome":"Design","nivel":30}
    ],
    "lojas": [],
    "reconhecimentos": [],
    "rotinas": [
      {"id":"rot-moh-1","titulo":"Revisão diária da equipe","descricao":"Revisar tarefas e rotinas de todos os colaboradores, desbloquear impedimentos","frequencia":"diaria","concluida":false,"ativa":true,"subtarefas":[{"id":"sub-moh-1","titulo":"Verificar tarefas atrasadas","concluida":false},{"id":"sub-moh-2","titulo":"Responder mensagens urgentes","concluida":false},{"id":"sub-moh-3","titulo":"Tomar decisões pendentes","concluida":false}]},
      {"id":"rot-moh-2","titulo":"Reunião semanal de gestão","descricao":"Reunião com toda a equipe para alinhamento de objetivos e resultados da semana","frequencia":"semanal","concluida":false,"ativa":true,"subtarefas":[{"id":"sub-moh-4","titulo":"Preparar pauta da reunião","concluida":false},{"id":"sub-moh-5","titulo":"Conduzir reunião com equipe","concluida":false},{"id":"sub-moh-6","titulo":"Registrar ações e responsáveis","concluida":false}]},
      {"id":"rot-moh-3","titulo":"Review mensal com diretoria","descricao":"Apresentar resultados consolidados do grupo para diretoria e definir prioridades","frequencia":"mensal","concluida":false,"ativa":true,"subtarefas":[{"id":"sub-moh-7","titulo":"Compilar resultados de todas as lojas","concluida":false},{"id":"sub-moh-8","titulo":"Reunião com diretoria","concluida":false},{"id":"sub-moh-9","titulo":"Definir metas do próximo mês","concluida":false}]},
      {"id":"rot-moh-4","titulo":"Planejamento estratégico anual","descricao":"Definir visão, metas OKR, budget e roadmap do Grupo Izzat para o próximo ano","frequencia":"anual","concluida":false,"ativa":true,"subtarefas":[{"id":"sub-moh-10","titulo":"Análise dos resultados do ano","concluida":false},{"id":"sub-moh-11","titulo":"Workshop de planejamento estratégico","concluida":false},{"id":"sub-moh-12","titulo":"Definir OKRs e budget do próximo ano","concluida":false},{"id":"sub-moh-13","titulo":"Comunicar plano para toda a equipe","concluida":false}]}
    ],
    "expectativas": [
      {"id":"exp-moh-1","descricao":"Revisar tarefas e rotinas da equipe","tipo":"diaria","peso":3,"cumprida":false},
      {"id":"exp-moh-2","descricao":"Responder mensagens urgentes em até 2h","tipo":"diaria","peso":3,"cumprida":false},
      {"id":"exp-moh-3","descricao":"Tomada de decisão sem travar processos","tipo":"diaria","peso":2,"cumprida":false}
    ]
  }'::jsonb
),
(
  'denilson', 'Denilson Bitencourt', '', 'denilson@izzatexpress.com', '+55 51 982074359',
  'admin', 'DB', null, '#10B981', 540, 7, 8, 'RS', '09:00', '18:00',
  '{
    "habilidades": [
      {"nome":"Gestão","nivel":80},{"nome":"Estratégia","nivel":75},
      {"nome":"Análise","nivel":70},{"nome":"Tráfego","nivel":50},{"nome":"Design","nivel":40}
    ],
    "lojas": ["izzat-express"],
    "reconhecimentos": [],
    "rotinas": [
      {"id":"rot-den-1","titulo":"Análise do App Vitals","descricao":"Analisar gravações de sessões e heatmaps da Izzat Express Global","lojaId":"izzat-express","concluida":false,"frequencia":"diaria","subtarefas":[{"id":"sub-den-1","titulo":"Verificar gravações do dia","concluida":false},{"id":"sub-den-2","titulo":"Analisar heatmap das páginas principais","concluida":false},{"id":"sub-den-3","titulo":"Registrar pontos de melhoria","concluida":false}]},
      {"id":"rot-den-2","titulo":"Relatório semanal Izzat Express","descricao":"Compilar métricas da semana: conversões, ROAS, pedidos, ticket médio","frequencia":"semanal","lojaId":"izzat-express","concluida":false,"ativa":true,"subtarefas":[{"id":"sub-den-4","titulo":"Puxar dados do painel de anúncios","concluida":false},{"id":"sub-den-5","titulo":"Registrar pedidos e receita da semana","concluida":false},{"id":"sub-den-6","titulo":"Enviar relatório para diretoria","concluida":false}]},
      {"id":"rot-den-3","titulo":"Prestação de contas mensal","descricao":"Reunião com a diretoria apresentando valores, métricas e projeções da Izzat Express","frequencia":"mensal","lojaId":"izzat-express","concluida":false,"ativa":true,"subtarefas":[{"id":"sub-den-7","titulo":"Preparar apresentação com dados do mês","concluida":false},{"id":"sub-den-8","titulo":"Reunião com diretoria","concluida":false},{"id":"sub-den-9","titulo":"Registrar ações definidas","concluida":false}]},
      {"id":"rot-den-4","titulo":"Planejamento anual Izzat Express","descricao":"Definir metas OKR, orçamento e roadmap para o próximo ano","frequencia":"anual","lojaId":"izzat-express","concluida":false,"ativa":true,"subtarefas":[{"id":"sub-den-10","titulo":"Levantamento de resultados do ano","concluida":false},{"id":"sub-den-11","titulo":"Definir OKRs do próximo ano","concluida":false},{"id":"sub-den-12","titulo":"Aprovação com diretoria","concluida":false}]}
    ],
    "expectativas": [
      {"id":"exp-den-1","descricao":"Analisar App Vitals da Izzat Express","tipo":"diaria","peso":2,"cumprida":false},
      {"id":"exp-den-2","descricao":"Relatório de melhorias implementadas","tipo":"semanal","peso":2,"cumprida":false},
      {"id":"exp-den-3","descricao":"Projetos entregues dentro do prazo","tipo":"semanal","peso":3,"cumprida":false}
    ]
  }'::jsonb
)
on conflict (id) do update set
  nome = excluded.nome, cargo = excluded.cargo, email = excluded.email,
  telefone = excluded.telefone, nivel_acesso = excluded.nivel_acesso,
  avatar = excluded.avatar, foto = excluded.foto, cor = excluded.cor,
  xp = excluded.xp, streak = excluded.streak, horas_disponiveis = excluded.horas_disponiveis,
  estado = excluded.estado, horario_inicio = excluded.horario_inicio, horario_fim = excluded.horario_fim,
  dados = excluded.dados;

-- Liga o auth_id (login) a cada colaborador pelo e-mail
update public.colaboradores c
set auth_id = u.id
from auth.users u
where lower(c.email) = lower(u.email);
