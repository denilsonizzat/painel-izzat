// HTML email templates — inline styles only for maximum email client compatibility

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://painel-izzat.vercel.app";

function base(conteudo: string, titulo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#0b1624;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1624;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:#122039;border-radius:16px 16px 0 0;padding:24px 28px;border-bottom:1px solid #1e3356;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td><span style="font-size:20px;font-weight:800;color:#c9a84c;letter-spacing:-0.5px;">PAINEL IZZAT</span></td>
    <td align="right"><span style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;">GROUP</span></td>
  </tr>
  </table>
</td></tr>

<!-- Body -->
<tr><td style="background:#0f1d2e;padding:0;">
${conteudo}
</td></tr>

<!-- Footer -->
<tr><td style="background:#122039;border-radius:0 0 16px 16px;padding:20px 28px;border-top:1px solid #1e3356;">
  <p style="margin:0;font-size:11px;color:#334155;text-align:center;">
    Painel Izzat Group &mdash; email automatico, nao responda<br/>
    <a href="${BASE_URL}" style="color:#c9a84c;text-decoration:none;">Abrir painel</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function barra(pct: number, cor: string): string {
  const width = Math.max(2, Math.min(100, pct));
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0;">
<tr>
<td style="background:#1e3356;border-radius:99px;height:8px;overflow:hidden;">
<table height="8" cellpadding="0" cellspacing="0" style="height:8px;">
<tr><td width="${width}%" style="background:${cor};border-radius:99px;height:8px;display:block;"></td></tr>
</table>
</td>
</tr></table>`;
}

function avatarLetra(nome: string, cor: string, size = 36): string {
  const iniciais = nome.trim().split(/\s+/).map((w: string) => w[0] || "").join("").toUpperCase().slice(0, 2);
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${cor};display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size * 0.36)}px;color:#fff;">${iniciais}</div>`;
}

// ─── TEMPLATE 1: Email manha para colaborador ─────────────────────────────────

export interface DadosEmailManha {
  nome: string;
  rotinas: { titulo: string; subtarefas: number; lojaId?: string }[];
  tarefas: { titulo: string; prioridade: string; lojaId?: string }[];
  streak: number;
  xp: number;
  horarioInicio: string;
}

export function emailManha(d: DadosEmailManha): string {
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const prioridadeCor: Record<string, string> = { alta: "#F2545B", media: "#E8A33D", baixa: "#64748b" };
  const prioridadeLabel: Record<string, string> = { alta: "URGENTE", media: "Media", baixa: "Baixa" };

  const linhasRotinas = d.rotinas.map(r => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e3356;">
        <span style="color:#e8edf5;font-size:13px;">&#9744; ${r.titulo}</span>
        ${r.subtarefas > 0 ? `<span style="color:#475569;font-size:11px;margin-left:8px;">${r.subtarefas} etapas</span>` : ""}
      </td>
    </tr>`).join("");

  const linhasTarefas = d.tarefas.map(t => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e3356;">
        <span style="background:${prioridadeCor[t.prioridade] || "#64748b"}20;color:${prioridadeCor[t.prioridade] || "#64748b"};font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-right:8px;">${prioridadeLabel[t.prioridade] || t.prioridade}</span>
        <span style="color:#e8edf5;font-size:13px;">${t.titulo}</span>
      </td>
    </tr>`).join("");

  const conteudo = `
<div style="padding:28px 28px 8px;">
  <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#ffffff;">Bom dia, ${d.nome.split(" ")[0]}! &#9728;&#65039;</h1>
  <p style="margin:0;font-size:13px;color:#64748b;text-transform:capitalize;">${hoje} &mdash; trabalho come&ccedil;a &agrave;s ${d.horarioInicio}</p>
</div>

${d.streak > 1 ? `<div style="padding:12px 28px;">
  <div style="background:#E8A33D10;border:1px solid #E8A33D20;border-radius:12px;padding:12px 16px;">
    <span style="font-size:16px;">&#128293;</span>
    <span style="color:#E8A33D;font-size:13px;font-weight:600;margin-left:8px;">Sequencia de ${d.streak} dias! Continue assim.</span>
  </div>
</div>` : ""}

${d.rotinas.length > 0 ? `<div style="padding:16px 28px 8px;">
  <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#475569;">Rotinas de hoje (${d.rotinas.length})</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#122039;border-radius:12px;overflow:hidden;border:1px solid #1e3356;">
    ${linhasRotinas}
  </table>
</div>` : ""}

${d.tarefas.length > 0 ? `<div style="padding:16px 28px 8px;">
  <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#475569;">Tarefas abertas (${d.tarefas.length})</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#122039;border-radius:12px;overflow:hidden;border:1px solid #1e3356;">
    ${linhasTarefas}
  </table>
</div>` : `<div style="padding:16px 28px;">
  <div style="background:#36C98E15;border:1px solid #36C98E30;border-radius:12px;padding:16px;text-align:center;">
    <span style="font-size:20px;">&#127881;</span>
    <p style="margin:4px 0 0;color:#36C98E;font-size:13px;">Nenhuma tarefa aberta! Dia tranquilo.</p>
  </div>
</div>`}

<div style="padding:20px 28px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">
      <a href="${BASE_URL}/meu-dia" style="display:inline-block;background:#c9a84c;color:#0b1624;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        &#128197; Abrir Meu Dia
      </a>
    </td>
  </tr>
  </table>
</div>`;

  return base(conteudo, "Bom dia — Painel Izzat");
}

// ─── TEMPLATE 2: Email tarde (resumo do dia) ──────────────────────────────────

export interface DadosEmailTarde {
  nome: string;
  cor: string;
  pctRotinas: number;
  rotinasConcluidas: number;
  rotinasTotal: number;
  tarefasConcluidas: { titulo: string }[];
  tarefasPendentes: { titulo: string; prioridade: string }[];
  xpGanhoHoje: number;
  streak: number;
}

export function emailTarde(d: DadosEmailTarde): string {
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const corPct = d.pctRotinas === 100 ? "#36C98E" : d.pctRotinas >= 50 ? "#E8A33D" : "#F2545B";

  const conteudo = `
<div style="padding:28px 28px 8px;">
  <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#ffffff;">Resumo do dia, ${d.nome.split(" ")[0]} &#127769;</h1>
  <p style="margin:0;font-size:13px;color:#64748b;text-transform:capitalize;">${hoje}</p>
</div>

<div style="padding:16px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#122039;border-radius:12px;overflow:hidden;border:1px solid #1e3356;">
  <tr>
    <td style="padding:16px 20px;border-right:1px solid #1e3356;" width="50%">
      <p style="margin:0 0 4px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Rotinas</p>
      <p style="margin:0;font-size:26px;font-weight:800;color:${corPct};">${d.pctRotinas}%</p>
      <p style="margin:2px 0 8px;font-size:12px;color:#64748b;">${d.rotinasConcluidas}/${d.rotinasTotal} conclu&iacute;das</p>
      ${barra(d.pctRotinas, corPct)}
    </td>
    <td style="padding:16px 20px;" width="50%">
      <p style="margin:0 0 4px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;">XP ganho hoje</p>
      <p style="margin:0;font-size:26px;font-weight:800;color:#c9a84c;">+${d.xpGanhoHoje}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#64748b;">${d.tarefasConcluidas.length} tarefa(s) conclu&iacute;da(s)</p>
    </td>
  </tr>
  </table>
</div>

${d.tarefasConcluidas.length > 0 ? `<div style="padding:8px 28px;">
  <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#36C98E;">&#10003; Conclu&iacute;do hoje</p>
  ${d.tarefasConcluidas.map(t => `<p style="margin:0 0 6px;font-size:13px;color:#64748b;">&#10003; ${t.titulo}</p>`).join("")}
</div>` : ""}

${d.tarefasPendentes.length > 0 ? `<div style="padding:8px 28px 28px;">
  <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Pendente para amanh&atilde;</p>
  ${d.tarefasPendentes.map(t => `<p style="margin:0 0 6px;font-size:13px;color:#475569;">&#8250; ${t.titulo}</p>`).join("")}
</div>` : `<div style="padding:8px 28px 28px;">
  <div style="background:#36C98E15;border:1px solid #36C98E30;border-radius:12px;padding:16px;text-align:center;">
    <p style="margin:0;color:#36C98E;font-size:14px;font-weight:700;">&#127881; Nenhuma pendencia! Excelente dia.</p>
  </div>
</div>`}`;

  return base(conteudo, "Resumo do dia — Painel Izzat");
}

// ─── TEMPLATE 3: Relatorio diario para admin ─────────────────────────────────

export interface DadosPessoa {
  nome: string;
  cargo: string;
  cor: string;
  pctRotinas: number;
  rotinasConcluidas: number;
  rotinasTotal: number;
  checkIn: boolean;
  tarefasConcluidas: string[];
  tarefasAbertas: string[];
  tarefasAtrasadas: string[];
  tarefasAguardando: string[];
  xpGanhoHoje: number;
  humor?: string;
}

export interface DadosEmailAdminDiario {
  data: string;
  equipe: DadosPessoa[];
  totalTarefasConcluidas: number;
  totalUrgentes: number;
  mediaProgresso: number;
}

export function emailAdminDiario(d: DadosEmailAdminDiario): string {
  const secaoPessoa = (p: DadosPessoa) => {
    const corPct = p.pctRotinas === 100 ? "#36C98E" : p.pctRotinas >= 50 ? "#E8A33D" : "#F2545B";
    return `
<tr><td style="padding:16px 20px;border-bottom:1px solid #0b1624;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="44" valign="top" style="padding-right:12px;">
      <div style="width:40px;height:40px;border-radius:50%;background:${p.cor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;text-align:center;line-height:40px;">
        ${p.nome.trim().split(/\s+/).map((w: string) => w[0] || "").join("").toUpperCase().slice(0, 2)}
      </div>
    </td>
    <td valign="top">
      <p style="margin:0 0 1px;font-size:14px;font-weight:700;color:#e8edf5;">${p.nome.split(" ")[0]} ${p.humor || ""}</p>
      <p style="margin:0 0 8px;font-size:11px;color:#475569;">${p.cargo} &middot; ${p.checkIn ? '<span style="color:#36C98E;">&#10003; Check-in</span>' : '<span style="color:#F2545B;">&#10005; Sem check-in</span>'}</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="font-size:11px;color:#64748b;">Rotinas: <strong style="color:${corPct};">${p.pctRotinas}%</strong> (${p.rotinasConcluidas}/${p.rotinasTotal})</td>
        <td align="right" style="font-size:11px;color:#c9a84c;font-weight:700;">+${p.xpGanhoHoje} XP</td>
      </tr>
      </table>
      ${barra(p.pctRotinas, corPct)}

      ${p.tarefasConcluidas.length > 0 ? `<p style="margin:8px 0 4px;font-size:11px;color:#36C98E;font-weight:700;">Conclu&iacute;das (${p.tarefasConcluidas.length})</p>
      ${p.tarefasConcluidas.map(t => `<p style="margin:0 0 2px;font-size:12px;color:#64748b;">&#10003; ${t}</p>`).join("")}` : ""}

      ${p.tarefasAguardando.length > 0 ? `<p style="margin:8px 0 4px;font-size:11px;color:#E8A33D;font-weight:700;">Aguardando revis&atilde;o (${p.tarefasAguardando.length})</p>
      ${p.tarefasAguardando.map(t => `<p style="margin:0 0 2px;font-size:12px;color:#94a3b8;">&#9200; ${t}</p>`).join("")}` : ""}

      ${p.tarefasAtrasadas.length > 0 ? `<p style="margin:8px 0 4px;font-size:11px;color:#F2545B;font-weight:700;">Atrasadas (${p.tarefasAtrasadas.length})</p>
      ${p.tarefasAtrasadas.map(t => `<p style="margin:0 0 2px;font-size:12px;color:#94a3b8;">&#9888; ${t}</p>`).join("")}` : ""}
    </td>
  </tr>
  </table>
</td></tr>`;
  };

  const conteudo = `
<div style="padding:28px 28px 8px;">
  <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#ffffff;">Relat&oacute;rio Diario &#128202;</h1>
  <p style="margin:0;font-size:13px;color:#64748b;">${d.data}</p>
</div>

<div style="padding:16px 28px 8px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#122039;border-radius:12px;overflow:hidden;border:1px solid #1e3356;">
  <tr>
    <td style="padding:14px 16px;border-right:1px solid #1e3356;text-align:center;" width="33%">
      <p style="margin:0;font-size:24px;font-weight:800;color:#36C98E;">${d.mediaProgresso}%</p>
      <p style="margin:2px 0 0;font-size:11px;color:#475569;">Media rotinas</p>
    </td>
    <td style="padding:14px 16px;border-right:1px solid #1e3356;text-align:center;" width="33%">
      <p style="margin:0;font-size:24px;font-weight:800;color:#c9a84c;">${d.totalTarefasConcluidas}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#475569;">Tarefas conclu&iacute;das</p>
    </td>
    <td style="padding:14px 16px;text-align:center;" width="33%">
      <p style="margin:0;font-size:24px;font-weight:800;color:${d.totalUrgentes > 0 ? "#F2545B" : "#64748b"};">${d.totalUrgentes}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#475569;">Urgentes abertas</p>
    </td>
  </tr>
  </table>
</div>

<div style="padding:16px 28px 8px;">
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#475569;">Equipe (${d.equipe.length} pessoas)</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#122039;border-radius:12px;overflow:hidden;border:1px solid #1e3356;">
    ${d.equipe.map(secaoPessoa).join("")}
  </table>
</div>

<div style="padding:16px 28px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">
      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#c9a84c;color:#0b1624;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        Ver Dashboard Completo
      </a>
    </td>
  </tr>
  </table>
</div>`;

  return base(conteudo, "Relatorio Diario — Painel Izzat");
}

// ─── TEMPLATE 4: Relatorio semanal para admin ─────────────────────────────────

export interface DadosPessoaSemanal {
  nome: string;
  cargo: string;
  cor: string;
  mediaPctRotinas: number;
  tarefasConcluidas: number;
  tarefasAbertas: number;
  xpGanhoSemana: number;
  xpTotal: number;
  streakAtual: number;
  nivel: string;
  corNivel: string;
  checkInsCount: number;
  diasTrabalhados: number;
}

export interface DadosEmailAdminSemanal {
  semana: string;
  dataInicio: string;
  dataFim: string;
  equipe: DadosPessoaSemanal[];
  topPerformers: { nome: string; cor: string; xp: number; posicao: number }[];
  totalTarefasSemana: number;
  totalConcluidas: number;
  taxaConclusao: number;
}

export function emailAdminSemanal(d: DadosEmailAdminSemanal): string {
  const medalhas = ["&#127947;", "&#129352;", "&#129353;"];
  const corMedalha = ["#c9a84c", "#94a3b8", "#b87333"];

  const secaoPessoa = (p: DadosPessoaSemanal, i: number) => {
    const corPct = p.mediaPctRotinas >= 80 ? "#36C98E" : p.mediaPctRotinas >= 50 ? "#E8A33D" : "#F2545B";
    return `
<tr style="background:${i % 2 === 0 ? "#122039" : "#0f1d2e"};">
  <td style="padding:12px 16px;border-bottom:1px solid #0b1624;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:11px;font-weight:700;color:${p.corNivel};">${p.nivel}</span>
      &nbsp;
      <strong style="font-size:13px;color:#e8edf5;">${p.nome.split(" ")[0]}</strong>
      ${p.streakAtual > 0 ? `<span style="font-size:11px;color:#E8A33D;">&#128293; ${p.streakAtual}</span>` : ""}
    </div>
    <p style="margin:2px 0 0;font-size:11px;color:#475569;">${p.cargo}</p>
  </td>
  <td style="padding:12px 16px;border-bottom:1px solid #0b1624;text-align:center;">
    <span style="font-size:15px;font-weight:700;color:${corPct};">${p.mediaPctRotinas}%</span>
    ${barra(p.mediaPctRotinas, corPct)}
  </td>
  <td style="padding:12px 16px;border-bottom:1px solid #0b1624;text-align:center;">
    <span style="font-size:14px;font-weight:700;color:#36C98E;">${p.tarefasConcluidas}</span>
    <span style="font-size:11px;color:#475569;"> / ${p.tarefasConcluidas + p.tarefasAbertas}</span>
  </td>
  <td style="padding:12px 16px;border-bottom:1px solid #0b1624;text-align:center;">
    <span style="font-size:14px;font-weight:700;color:#c9a84c;">+${p.xpGanhoSemana}</span>
  </td>
  <td style="padding:12px 16px;border-bottom:1px solid #0b1624;text-align:center;">
    <span style="font-size:12px;color:#64748b;">${p.checkInsCount}/5</span>
  </td>
</tr>`;
  };

  const conteudo = `
<div style="padding:28px 28px 8px;">
  <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#ffffff;">Relat&oacute;rio Semanal &#128200;</h1>
  <p style="margin:0;font-size:13px;color:#64748b;">${d.dataInicio} &mdash; ${d.dataFim} &middot; ${d.semana}</p>
</div>

<!-- Resumo geral -->
<div style="padding:16px 28px 8px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#122039;border-radius:12px;overflow:hidden;border:1px solid #1e3356;">
  <tr>
    <td style="padding:14px 16px;border-right:1px solid #1e3356;text-align:center;" width="25%">
      <p style="margin:0;font-size:22px;font-weight:800;color:#c9a84c;">${d.totalTarefasSemana}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#475569;">Tarefas criadas</p>
    </td>
    <td style="padding:14px 16px;border-right:1px solid #1e3356;text-align:center;" width="25%">
      <p style="margin:0;font-size:22px;font-weight:800;color:#36C98E;">${d.totalConcluidas}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#475569;">Conclu&iacute;das</p>
    </td>
    <td style="padding:14px 16px;border-right:1px solid #1e3356;text-align:center;" width="25%">
      <p style="margin:0;font-size:22px;font-weight:800;color:#4D9DE0;">${d.taxaConclusao}%</p>
      <p style="margin:2px 0 0;font-size:11px;color:#475569;">Taxa conclus&atilde;o</p>
    </td>
    <td style="padding:14px 16px;text-align:center;" width="25%">
      <p style="margin:0;font-size:22px;font-weight:800;color:#7C6FE0;">${d.equipe.length}</p>
      <p style="margin:2px 0 0;font-size:11px;color:#475569;">Colaboradores</p>
    </td>
  </tr>
  </table>
</div>

<!-- Top performers -->
${d.topPerformers.length > 0 ? `<div style="padding:16px 28px 8px;">
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c9a84c;">&#127942; Top Performers da Semana</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#122039;border-radius:12px;overflow:hidden;border:1px solid #c9a84c30;">
  ${d.topPerformers.map((p, i) => `
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid #1e3356;">
      <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="32" style="font-size:20px;">${medalhas[i] || ""}</td>
        <td><span style="font-size:14px;font-weight:700;color:${corMedalha[i] || "#64748b"};">${p.nome.split(" ")[0]}</span></td>
        <td align="right"><span style="font-size:14px;font-weight:800;color:#c9a84c;">${p.xp} XP</span></td>
      </tr>
      </table>
    </td>
  </tr>`).join("")}
  </table>
</div>` : ""}

<!-- Tabela da equipe -->
<div style="padding:16px 28px 8px;">
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#475569;">Desempenho Individual</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#122039;border-radius:12px;overflow:hidden;border:1px solid #1e3356;">
  <tr style="background:#0b1624;">
    <th style="padding:10px 16px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;text-align:left;font-weight:600;">Pessoa</th>
    <th style="padding:10px 16px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;text-align:center;font-weight:600;">Rotinas</th>
    <th style="padding:10px 16px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;text-align:center;font-weight:600;">Tarefas</th>
    <th style="padding:10px 16px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;text-align:center;font-weight:600;">XP</th>
    <th style="padding:10px 16px;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:1px;text-align:center;font-weight:600;">Check-ins</th>
  </tr>
  ${d.equipe.map((p, i) => secaoPessoa(p, i)).join("")}
  </table>
</div>

<div style="padding:16px 28px 28px;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center">
      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#c9a84c;color:#0b1624;font-weight:800;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        Ver Dashboard Completo
      </a>
    </td>
  </tr>
  </table>
</div>`;

  return base(conteudo, "Relatorio Semanal — Painel Izzat");
}
