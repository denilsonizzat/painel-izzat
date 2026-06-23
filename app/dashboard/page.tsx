"use client";
import { useAppStore } from "@/lib/store";
import { LOJAS, PERGUNTAS_PULSO } from "@/lib/data";
import { Users, Store, CheckSquare, ListTodo, TrendingUp, AlertCircle, Star, Award, Flame, Zap, Bell, UserX, Clock, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import Image from "next/image";
import { calcNivel } from "@/lib/data";
import { rotinasDoColaborador } from "@/lib/recorrencia";
import Tip from "@/components/Tip";
import { useEffect, useState, type ReactNode } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import StoriesBar from "@/components/StoriesBar";

const QUICK_ACCESS_TOOLS: {
  label: string; href: string; desc: string;
  bg?: string; icon?: string; light?: boolean; svgIcon?: ReactNode;
}[] = [
  {
    label: "Chat", href: "https://chat.google.com/app/home",
    desc: "Google Chat — conversas e grupos do time",
    bg: "transparent",
    svgIcon: (
      <svg viewBox="0 0 256 256" width={32} height={32}>
        <path fill="#00AC47" d="M208 32H48A16 16 0 0 0 32 48V192a16 16 0 0 0 16 16h54.06l14.09 25.65A8 8 0 0 0 123 236a8 8 0 0 0 6.95-4.35L144.06 208H208a16 16 0 0 0 16-16V48A16 16 0 0 0 208 32Z"/>
        <circle fill="white" cx="88" cy="120" r="12"/>
        <circle fill="white" cx="128" cy="120" r="12"/>
        <circle fill="white" cx="168" cy="120" r="12"/>
      </svg>
    ),
  },
  {
    label: "Meet", href: "https://meet.google.com/",
    desc: "Google Meet — reuniões por vídeo",
    bg: "transparent",
    svgIcon: (
      <svg viewBox="0 0 48 48" width={32} height={32}>
        <path fill="#00897B" d="M5 16.5A3.5 3.5 0 0 1 8.5 13H28a3.5 3.5 0 0 1 3.5 3.5V24l9-7v14l-9-7v7.5A3.5 3.5 0 0 1 28 35H8.5A3.5 3.5 0 0 1 5 31.5Z"/>
      </svg>
    ),
  },
  {
    label: "Drive", href: "https://drive.google.com/",
    desc: "Google Drive — arquivos, criativos e documentos das lojas",
    bg: "transparent",
    svgIcon: (
      <svg viewBox="0 0 87.3 78" width={32} height={28}>
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0A15.46 15.46 0 0 0 6.6 66.85z" fill="#0066da"/>
        <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L.85 45.15A15.55 15.55 0 0 0 0 53h27.5z" fill="#00ac47"/>
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335"/>
        <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
        <path d="M59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5L73.7 26.6c-.8-1.4-1.95-2.5-3.3-3.3L56.65 46.35z" fill="#2684fc"/>
        <path d="M27.5 53 13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h51.4c1.6 0 3.1-.45 4.5-1.2z" fill="#ffba00"/>
      </svg>
    ),
  },
  {
    label: "Miro", href: "https://miro.com/",
    desc: "Miro — quadros colaborativos e brainstorm",
    bg: "#FFD02F", icon: "/icons/miro.svg", light: true,
  },
  {
    label: "WhatsApp", href: "https://wa.me/",
    desc: "WhatsApp — toque para abrir no app",
    bg: "#25D366",
    svgIcon: (
      <svg viewBox="0 0 32 32" width={22} height={22}>
        <path fill="white" d="M16 3C8.832 3 3 8.832 3 16c0 2.35.633 4.547 1.73 6.45L3 29l6.727-1.703A12.9 12.9 0 0 0 16 29c7.168 0 13-5.832 13-13S23.168 3 16 3zm0 2c6.086 0 11 4.914 11 11s-4.914 11-11 11c-2.02 0-3.902-.55-5.52-1.504l-.387-.23-4.004 1.016 1.04-3.91-.254-.406A10.94 10.94 0 0 1 5 16c0-6.086 4.914-11 11-11zm-3.547 5.379c-.2 0-.527.074-.8.371-.274.3-1.047 1.02-1.047 2.489s1.07 2.887 1.22 3.086c.15.2 2.075 3.168 5.07 4.316 2.51.988 3.02.793 3.563.742.543-.05 1.754-.715 2-.406.246.31.246 1.774.246 1.774s-.742.578-1.078.7c-.336.12-.8.15-.8.15s-1.32.15-3.082-.5c-1.762-.65-3.672-2.262-4.91-3.727-1.235-1.46-2.41-3.355-2.527-4.898-.117-1.543.633-2.68 1.148-3.14.516-.46 1.114-.5 1.372-.5.254 0 .508 0 .73.008.234.008.547-.09.856.652.31.742 1.05 2.566 1.14 2.754.09.188.15.41.02.664-.133.254-.2.41-.39.633-.188.223-.403.496-.574.668-.188.188-.383.39-.164.766.218.375.965 1.59 2.07 2.578 1.42 1.265 2.617 1.656 2.988 1.84.375.184.594.156.813-.094.218-.25.937-1.094 1.187-1.469.25-.375.5-.312.844-.187.34.125 2.164 1.02 2.535 1.207.375.188.625.28.715.438.086.156.086.89-.21 1.75z"/>
      </svg>
    ),
  },
  {
    label: "Claude", href: "https://claude.ai/",
    desc: "Claude (IA) — assistente para trabalho e criação",
    bg: "#C96442",
    svgIcon: (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none">
        <path fill="white" d="M12 2L7 8.5 2 12l5 3.5L12 22l5-6.5L22 12l-5-3.5z"/>
      </svg>
    ),
  },
  {
    label: "tl;dv", href: "https://tldv.io/",
    desc: "tl;dv — gravação e transcrição de reuniões com IA",
    bg: "#0F0F0F",
    svgIcon: (
      <svg viewBox="0 0 40 40" width={26} height={26}>
        <text x="20" y="27" textAnchor="middle" fill="#F5A623" fontSize="14" fontWeight="900" fontFamily="monospace">tl;dv</text>
      </svg>
    ),
  },
];

function calcProgresso(rotinas: { concluida: boolean; subtarefas: { concluida: boolean }[] }[]) {
  if (!rotinas.length) return 100;
  const total = rotinas.reduce((acc, r) => acc + r.subtarefas.length, 0);
  if (total === 0) return rotinas.every((r) => r.concluida) ? 100 : 0;
  const feitas = rotinas.reduce((acc, r) => acc + r.subtarefas.filter((s) => s.concluida).length, 0);
  return Math.round((feitas / total) * 100);
}

function VerticalBarChart({ items }: { items: { id: string; nome: string; avatar: string; foto?: string; cor: string; pct: number }[] }) {
  return (
    <div className="flex items-end gap-3 pt-4 pb-2 px-2 overflow-x-auto">
      {items.map((item) => (
        <Link key={item.id} href={`/equipe/${item.id}`} className="flex flex-col items-center gap-1 flex-shrink-0 hover:opacity-80" style={{ minWidth: 52 }}>
          <span className="text-xs font-bold" style={{ color: "#c9a84c" }}>{item.pct}%</span>
          <div className="w-8 rounded-t-lg relative overflow-hidden" style={{ height: 80, background: "#1e3356" }}>
            <div className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700" style={{ height: `${item.pct}%`, background: item.pct === 100 ? "#10b981" : "#c9a84c" }} />
          </div>
          <Avatar nome={item.nome} avatar={item.avatar} foto={item.foto} cor={item.cor} size={28} />
          <span className="text-xs text-center leading-tight" style={{ color: "#94a3b8", maxWidth: 56 }}>
            {item.nome.split(" ")[0]}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { colaboradores, rotinas, tarefas, usuarioAtual, verificarAtrasadas, missoesSemana, concluirMissao, pulsoAtual, registrarPulso, atividadesHoje } = useAppStore();
  const { notificarStreakRisco } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [notaPulso, setNotaPulso] = useState<number | null>(null);
  const [verProgTime, setVerProgTime] = useState(false);

  useEffect(() => {
    verificarAtrasadas();
    if (usuarioAtual && (usuarioAtual.streak || 0) > 0) {
      notificarStreakRisco(usuarioAtual.streak || 0);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const isAdmin = usuarioAtual?.nivelAcesso === "admin";
  const colaboradoresAtivos = colaboradores.filter((c) => c.id !== "mohamed");
  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter((t) => t.status === "concluida").length;
  const tarefasUrgentes = tarefas.filter((t) => t.prioridade === "alta" && t.status !== "concluida").length;
  const tarefasAtrasadas = tarefas.filter((t) => t.status === "atrasada").length;
  const mediaProgresso = colaboradoresAtivos.length
    ? Math.round(colaboradoresAtivos.reduce((acc, c) => acc + calcProgresso(rotinasDoColaborador(rotinas, c.id)), 0) / colaboradoresAtivos.length)
    : 0;

  const chartItems = colaboradoresAtivos.map((c) => ({
    id: c.id, nome: c.nome, avatar: c.avatar, foto: c.foto, cor: c.cor, pct: calcProgresso(rotinasDoColaborador(rotinas, c.id)),
  }));

  // Resumo semanal
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  const inicioSemanaStr = inicioSemana.toISOString().split("T")[0];
  const tarefasSemana = tarefas.filter((t) => t.dataCriacao >= inicioSemanaStr);
  const concluidasSemana = tarefasSemana.filter((t) => t.status === "concluida").length;
  const emDia = colaboradores.filter((c) => calcProgresso(rotinasDoColaborador(rotinas, c.id)) === 100);

  // Destaques recentes (ultimos 7 dias)
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const seteDiasStr = seteDiasAtras.toISOString().split("T")[0];
  const todosReconhecimentos = colaboradores
    .flatMap((c) => (c.reconhecimentos || []).map((r) => ({ ...r, para: c })))
    .filter((r) => r.data >= seteDiasStr)
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 3);

  // Top XP
  const topXP = [...colaboradores].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 3);

  // Semana atual
  const semana = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const start = new Date(year, 0, 1);
    const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, "0")}`;
  })();

  const semanaNum = parseInt(semana.split("-W")[1]);
  const pergunta = PERGUNTAS_PULSO[semanaNum % PERGUNTAS_PULSO.length];

  // Widget A: Desafio Semanal
  const hojeStr = new Date().toISOString().split("T")[0];
  const totalColab = colaboradores.length;
  const checkinsHoje = colaboradores.filter((c) => c.ultimoCheckIn === hojeStr).length;
  const pctDesafio = totalColab > 0 ? Math.round((checkinsHoje / totalColab) * 100) : 0;

  // Widget B: Missao da Semana
  const missaoExpectativa = usuarioAtual?.expectativas
    .filter((e) => e.tipo === "semanal")
    .sort((a, b) => b.peso - a.peso)[0];

  const missaoConcluida =
    missoesSemana[usuarioAtual?.id ?? ""]?.semana === semana &&
    missoesSemana[usuarioAtual?.id ?? ""]?.concluida;

  // Widget C: Pulso Semanal
  const jaRespondeu =
    pulsoAtual?.semana === semana &&
    pulsoAtual?.notas[usuarioAtual?.id ?? ""] !== undefined;

  if (isLoading) {
    return (
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-4 w-48" style={{ opacity: 0.7 }} />
        </div>
        {/* Stories row */}
        <div className="skeleton h-24 rounded-2xl w-full" />
        {/* 4 KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        {/* Acesso rápido */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
        {/* Conteúdo */}
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  // Saudacao por hora do dia
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  // Novo usuario = nunca fez check-in
  const isNovoUsuario = !usuarioAtual?.ultimoCheckIn;

  // Alertas admin
  const semCheckInHoje = isAdmin
    ? colaboradores.filter((c) => c.id !== usuarioAtual?.id && c.ultimoCheckIn !== hojeStr)
    : [];
  const tarefasRevisao = isAdmin ? tarefas.filter((t) => t.status === "aguardando_revisao") : [];
  const tarefasAtrasadasLista = isAdmin ? tarefas.filter((t) => t.status === "atrasada") : [];
  const totalAlertas = semCheckInHoje.length + tarefasRevisao.length + tarefasAtrasadasLista.length;

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="font-extrabold text-white" style={{ fontSize: 28, letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            {saudacao}, {usuarioAtual?.nome?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "#9aa7ba" }}>
            {hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <span className="text-xs mt-2 px-2.5 py-1 rounded-full inline-flex items-center gap-1 font-semibold"
            style={{ background: isAdmin ? "#c9a84c15" : "#3b82f615", color: isAdmin ? "#c9a84c" : "#3b82f6", border: `1px solid ${isAdmin ? "#c9a84c25" : "#3b82f625"}` }}>
            {isAdmin ? "✦ Gestor" : "Colaborador"}
          </span>
        </div>
        {!isAdmin && (
          <a href="/meu-dia" className="btn-primary flex-shrink-0 text-sm">
            ☀️ Meu Dia
          </a>
        )}
      </div>

      {/* Card de boas-vindas para usuario novo */}
      {isNovoUsuario && (
        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #112239, #0f1e35)", border: "1px solid #c9a84c30" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: "#c9a84c20" }}>
              🎯
            </div>
            <div className="flex-1">
              <p className="font-bold text-white mb-1">Bem-vindo ao Painel Izzat!</p>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Este é o sistema de gestão da equipe. Aqui você acompanha rotinas diárias, tarefas, entregas da semana e evolução de cada pessoa. Para começar, faça seu check-in diário.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <a href="/meu-dia" className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#c9a84c", color: "#0b1624" }}>
                  1. Ir para Meu Dia
                </a>
                <a href="/formulario" className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#1e3356", color: "#94a3b8" }}>
                  2. Preencher meu perfil
                </a>
                <a href="/atividade" className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#1e3356", color: "#94a3b8" }}>
                  3. Ver minha atividade
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Painel de alertas — admin only */}
      {isAdmin && totalAlertas > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid #ef444430" }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={15} style={{ color: "#ef4444" }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#ef4444" }}>
              {totalAlertas} {totalAlertas === 1 ? "alerta" : "alertas"} requer{totalAlertas === 1 ? "" : "em"} atenção
            </p>
          </div>
          <div className="space-y-3">
            {semCheckInHoje.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: "#f59e0b0d", border: "1px solid #f59e0b20" }}>
                <div className="flex items-center gap-2 mb-2">
                  <UserX size={14} style={{ color: "#f59e0b" }} />
                  <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                    {semCheckInHoje.length} colaborador{semCheckInHoje.length > 1 ? "es" : ""} sem check-in hoje
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {semCheckInHoje.map((c) => (
                    <Link key={c.id} href={`/equipe/${c.id}`}
                      className="text-xs px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                      style={{ background: "#f59e0b15", color: "#f59e0b", border: "1px solid #f59e0b30" }}>
                      {c.nome.split(" ")[0]}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {tarefasRevisao.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: "#3b82f60d", border: "1px solid #3b82f620" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: "#3b82f6" }} />
                    <p className="text-xs font-semibold" style={{ color: "#3b82f6" }}>
                      {tarefasRevisao.length} tarefa{tarefasRevisao.length > 1 ? "s" : ""} aguardando sua aprovação
                    </p>
                  </div>
                  <Link href="/tarefas" className="text-xs px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                    style={{ background: "#3b82f620", color: "#3b82f6" }}>
                    Revisar
                  </Link>
                </div>
                <div className="space-y-1">
                  {tarefasRevisao.slice(0, 3).map((t) => {
                    const quem = colaboradores.find((c) => c.id === t.atribuidoPara);
                    return (
                      <p key={t.id} className="text-xs" style={{ color: "#9aa7ba" }}>
                        &bull; {t.titulo} <span style={{ color: "#74859c" }}>— {quem?.nome.split(" ")[0]}</span>
                      </p>
                    );
                  })}
                  {tarefasRevisao.length > 3 && (
                    <p className="text-xs" style={{ color: "#74859c" }}>+ {tarefasRevisao.length - 3} mais...</p>
                  )}
                </div>
              </div>
            )}

            {tarefasAtrasadasLista.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: "#ef44440d", border: "1px solid #ef444420" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} style={{ color: "#ef4444" }} />
                    <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                      {tarefasAtrasadasLista.length} tarefa{tarefasAtrasadasLista.length > 1 ? "s" : ""} atrasada{tarefasAtrasadasLista.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link href="/tarefas" className="text-xs px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                    style={{ background: "#ef444420", color: "#ef4444" }}>
                    Ver todas
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tarefasAtrasadasLista.slice(0, 4).map((t) => {
                    const quem = colaboradores.find((c) => c.id === t.atribuidoPara);
                    return (
                      <span key={t.id} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444425" }}>
                        {quem?.nome.split(" ")[0]}: {t.titulo.slice(0, 22)}{t.titulo.length > 22 ? "..." : ""}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nenhum alerta — admin tranquilo */}
      {isAdmin && totalAlertas === 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#10b98110", border: "1px solid #10b98125" }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#10b98120" }}>
            <span style={{ fontSize: 13 }}>✓</span>
          </div>
          <p className="text-sm" style={{ color: "#10b981" }}>
            Tudo certo por aqui — sem alertas pendentes hoje.
          </p>
        </div>
      )}

      {/* Stories */}
      <div className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} data-tip="Stories da equipe: compartilhe uma conquista do dia (texto ou emoji). Some sozinho em 24h, como nas redes sociais.">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-section-label" data-tip="Compartilhe uma vitória ou novidade rápida com o time. Expira em 24h.">Stories da Equipe</p>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c9a84c15", color: "#c9a84c99", border: "1px solid #c9a84c20" }}>
            Compartilhe conquistas — expira em 24h
          </span>
        </div>
        <StoriesBar />
      </div>

      {/* KPI Cards */}
      <div data-tour="kpis">
      {isAdmin ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={<TrendingUp size={20} />} label="Progresso do Time" value={`${mediaProgresso}%`} cor="#10b981" dica="Média de conclusão de rotinas diárias de toda a equipe hoje. 100% = todos concluíram suas rotinas." href="/equipe" />
          <KPICard icon={<ListTodo size={20} />} label="Tarefas Ativas" value={`${totalTarefas - tarefasConcluidas}`} cor="#3b82f6" dica="Tarefas abertas (pendente + em andamento + atrasada). Não conta concluídas." href="/tarefas" />
          <KPICard icon={<CheckSquare size={20} />} label="Concluídas" value={`${tarefasConcluidas}`} cor="#8b5cf6" dica="Total de tarefas marcadas como concluídas pela equipe." href="/tarefas" />
          <KPICard icon={<AlertCircle size={20} />} label="Urgentes" value={`${tarefasUrgentes}`} cor={tarefasUrgentes > 0 ? "#ef4444" : "#64748b"} dica="Tarefas com prioridade ALTA ainda abertas. Precisam de atenção imediata." href="/tarefas" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(() => {
            const minhasTarefas = tarefas.filter((t) => t.atribuidoPara === usuarioAtual?.id && t.status !== "concluida");
            const minhasConcluidas = tarefas.filter((t) => t.atribuidoPara === usuarioAtual?.id && t.status === "concluida");
            const meuPct = usuarioAtual ? (() => {
              const rot = rotinasDoColaborador(rotinas, usuarioAtual.id);
              if (!rot.length) return 100;
              const total = rot.reduce((a, r) => a + r.subtarefas.length, 0);
              if (total === 0) return rot.every((r) => r.concluida) ? 100 : 0;
              return Math.round((rot.reduce((a, r) => a + r.subtarefas.filter((s) => s.concluida).length, 0) / total) * 100);
            })() : 0;
            return (
              <>
                <KPICard icon={<TrendingUp size={20} />} label="Meu Progresso Hoje" value={`${meuPct}%`} cor="#10b981" dica="Percentual das suas rotinas de hoje concluídas. Vá em Meu Dia para marcar as rotinas." href="/meu-dia" />
                <KPICard icon={<ListTodo size={20} />} label="Minhas Tarefas" value={`${minhasTarefas.length}`} cor="#3b82f6" dica="Tarefas abertas atribuídas a você pelo gestor. Vá em Tarefas para ver detalhes." href="/tarefas" />
                <KPICard icon={<CheckSquare size={20} />} label="Concluídas por mim" value={`${minhasConcluidas.length}`} cor="#8b5cf6" dica="Quantidade de tarefas que você já concluiu. Cada uma vale +30 XP." href="/tarefas" />
                <KPICard icon={<Zap size={20} />} label="Meu XP Total" value={`${usuarioAtual?.xp ?? 0}`} cor="#c9a84c" dica="Total de pontos de experiência acumulados. XP sobe ao concluir rotinas, tarefas e sessões Pomodoro." href="/atividade" />
              </>
            );
          })()}
        </div>
      )}
      </div>

      {/* Acesso Rapido — Ferramentas */}
      <div data-tour="acesso-rapido" className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-section-label" data-tip="Atalhos para as ferramentas externas que o time usa no dia a dia. Abrem em nova aba.">Acesso Rápido</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {QUICK_ACCESS_TOOLS.map((tool) => (
            <Tip key={tool.label} titulo={tool.label} texto={tool.desc} place="top">
              <a
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-xl transition-all hover:scale-105 hover:opacity-90 active:scale-95"
                style={{ background: "#1e335450", border: "1px solid #1e335480" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: tool.bg ?? "transparent" }}>
                  {tool.svgIcon ?? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={tool.icon!} alt={tool.label} width={20} height={20}
                      style={{ filter: tool.light ? "brightness(0)" : "brightness(0) invert(1)", width: 20, height: 20 }} />
                  )}
                </div>
                <span className="text-xs font-medium text-center leading-tight" style={{ color: "#94a3b8" }}>{tool.label}</span>
              </a>
            </Tip>
          ))}
        </div>
      </div>

      {/* Alerta de atrasadas — admin only */}
      {isAdmin && tarefasAtrasadas > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#ef444415", border: "1px solid #ef444430" }}>
          <AlertCircle size={16} style={{ color: "#ef4444" }} />
          <p className="text-sm" style={{ color: "#ef4444" }}>
            {tarefasAtrasadas} tarefa{tarefasAtrasadas > 1 ? "s" : ""} atrasada{tarefasAtrasadas > 1 ? "s" : ""} &mdash;{" "}
            <Link href="/tarefas" className="underline">ver tarefas</Link>
          </p>
        </div>
      )}

      {/* Widget A: Desafio Semanal */}
      <div className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>⚔️</span>
            <p className="text-sm font-bold text-white">Desafio Semanal</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "#c9a84c20", color: "#c9a84c" }}>
            {checkinsHoje}/{totalColab} check-ins
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: "#9aa7ba" }}>
          Meta: toda equipe com check-in hoje
        </p>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pctDesafio}%`,
              background: pctDesafio >= 100
                ? "linear-gradient(90deg, #c9a84c, #f59e0b)"
                : "linear-gradient(90deg, #3b82f6, #6366f1)",
            }}
          />
        </div>
        {pctDesafio >= 100 && (
          <p className="text-xs mt-2 text-center font-semibold" style={{ color: "#c9a84c" }}>
            🏆 Meta alcançada! Time completo!
          </p>
        )}
      </div>

      {/* Widget B: Missao da Semana */}
      {missaoExpectativa && (
        <div className="rounded-2xl p-4" style={{
          background: "#112239",
          border: `1px solid ${missaoConcluida ? "#c9a84c40" : "#1e3356"}`,
        }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>🎯</span>
              <p className="text-sm font-bold text-white">Missão da Semana</p>
            </div>
            {missaoConcluida ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "#c9a84c20", color: "#c9a84c" }}>
                ✓ Concluída
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#1e3356", color: "#9aa7ba" }}>
                +100 XP
              </span>
            )}
          </div>
          <p className="text-sm text-white mb-3">{missaoExpectativa.descricao}</p>
          {!missaoConcluida && usuarioAtual && (
            <button
              onClick={() => concluirMissao(usuarioAtual.id)}
              className="w-full py-2 rounded-xl text-xs font-bold transition-opacity hover:opacity-90"
              style={{ background: "#c9a84c", color: "#0b1624" }}
            >
              Marcar como concluída (+100 XP)
            </button>
          )}
        </div>
      )}

      {/* Widget C: Pulso Semanal */}
      {usuarioAtual && !jaRespondeu && (
        <div className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 18 }}>📊</span>
            <p className="text-sm font-bold text-white">Pulso da Semana</p>
          </div>
          <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>{pergunta}</p>
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => {
                  setNotaPulso(n);
                  registrarPulso(usuarioAtual.id, n);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: notaPulso === n ? "#c9a84c" : "#1e3356",
                  color: notaPulso === n ? "#0b1624" : "#64748b",
                  border: `1px solid ${notaPulso === n ? "#c9a84c" : "#1e3356"}`,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: "#74859c" }}>Muito ruim</span>
            <span className="text-xs" style={{ color: "#74859c" }}>Excelente</span>
          </div>
        </div>
      )}
      {jaRespondeu && (
        <div className="rounded-2xl p-3 flex items-center gap-3"
          style={{ background: "#0f2a1a", border: "1px solid #10b98140" }}>
          <span>✓</span>
          <p className="text-sm" style={{ color: "#10b981" }}>
            Pulso desta semana respondido. Obrigado!
          </p>
        </div>
      )}

      {/* Resumo rapido admin */}
      {isAdmin && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#0d1928", border: "1px solid rgba(201,164,66,.16)" }}>
          <p className="text-xs" style={{ color: "#74859c" }}>
            Você gerencia <span className="font-semibold" style={{ color: "#e8edf5" }}>{colaboradores.length} pessoas</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#112239" }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>✅</span>
              <div>
                <p className="text-xl font-extrabold leading-none" style={{ color: "#10b981" }}>{emDia.length}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>em dia com as rotinas</p>
              </div>
            </div>
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#112239" }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{tarefasAtrasadas > 0 ? "⚠️" : "✅"}</span>
              <div>
                <p className="text-xl font-extrabold leading-none" style={{ color: tarefasAtrasadas > 0 ? "#ef4444" : "#10b981" }}>{tarefasAtrasadas}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>tarefas atrasadas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart — admin only */}
      {isAdmin && (
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} style={{ color: "#c9a84c" }} />
            <h2 className="text-white font-semibold">{"Conclusão de Rotinas por Pessoa"}</h2>
          </div>
          <p className="text-xs mb-3" style={{ color: "#9aa7ba" }}>
            Quanto cada colaborador concluiu das rotinas de hoje. 100% = dia completo. Clique no avatar para ver o perfil.
          </p>
          {chartItems.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#74859c" }}>Nenhum colaborador com rotinas cadastradas.</p>
          ) : (
            <VerticalBarChart items={chartItems} />
          )}
        </div>
      )}

      {/* Para colaboradores: secao "Progresso do Time" colapsavel */}
      {!isAdmin && (
        <button
          onClick={() => setVerProgTime((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:opacity-80"
          style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
        >
          <div className="flex items-center gap-2">
            <Users size={15} style={{ color: "#c9a84c" }} />
            <span className="text-sm font-semibold" style={{ color: "#e8edf5" }}>Progresso do Time</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c9a84c15", color: "#c9a84c" }}>
              Ranking, semana e destaques
            </span>
          </div>
          {verProgTime
            ? <ChevronUp size={16} style={{ color: "#9aa7ba" }} />
            : <ChevronDown size={16} style={{ color: "#9aa7ba" }} />
          }
        </button>
      )}

      {(isAdmin || verProgTime) && (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Resumo semanal */}
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Star size={18} style={{ color: "#c9a84c" }} />
            <h2 className="text-white font-semibold">Semana Atual</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "#74859c" }}>Resumo de tarefas desta semana</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#9aa7ba" }}>Tarefas criadas</span>
              <span className="text-sm font-bold text-white">{tarefasSemana.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#9aa7ba" }}>Concluidas</span>
              <span className="text-sm font-bold" style={{ color: "#10b981" }}>{concluidasSemana}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#9aa7ba" }}>{"Taxa conclusão"}</span>
              <span className="text-sm font-bold" style={{ color: "#c9a84c" }}>
                {tarefasSemana.length ? Math.round((concluidasSemana / tarefasSemana.length) * 100) : 0}%
              </span>
            </div>
            <div className="border-t pt-3" style={{ borderColor: "#1e3356" }}>
              <p className="text-xs mb-2" style={{ color: "#9aa7ba" }}>Em dia hoje ({emDia.length}/{colaboradores.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {emDia.map((c) => (
                  isAdmin
                    ? <Link key={c.id} href={`/equipe/${c.id}`}><Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={28} /></Link>
                    : <div key={c.id}><Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={28} /></div>
                ))}
                {emDia.length === 0 && <span className="text-xs" style={{ color: "#74859c" }}>Nenhum ainda</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Top XP */}
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} style={{ color: "#c9a84c" }} />
            <h2 className="text-white font-semibold">Ranking XP</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "#74859c" }}>XP acumulado completando rotinas, tarefas e check-ins</p>
          <div className="space-y-3">
            {topXP.map((c, i) => {
              const nivelInfo = calcNivel(c.xp || 0);
              const Row = ({ children }: { children: React.ReactNode }) =>
                isAdmin
                  ? <Link key={c.id} href={`/equipe/${c.id}`} className="flex items-center gap-3 hover:opacity-80">{children}</Link>
                  : <div key={c.id} className="flex items-center gap-3">{children}</div>;
              return (
                <Row key={c.id}>
                  <span className="text-lg font-bold w-6 text-center" style={{ color: i === 0 ? "#c9a84c" : i === 1 ? "#94a3b8" : "#b87333" }}>
                    {i + 1}
                  </span>
                  <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.nome.split(" ")[0]}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs" style={{ color: nivelInfo.cor }}>{nivelInfo.nome}</span>
                      {(c.streak || 0) > 0 && (
                        <>
                          <Flame size={10} style={{ color: "#f59e0b" }} />
                          <span className="text-xs" style={{ color: "#f59e0b" }}>{c.streak}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: "#c9a84c" }}>{c.xp || 0}</span>
                </Row>
              );
            })}
          </div>
        </div>

        {/* Destaques / Reconhecimentos */}
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Award size={18} style={{ color: "#c9a84c" }} />
            <h2 className="text-white font-semibold">Destaques da Semana</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "#74859c" }}>Reconhecimentos enviados entre colegas nos últimos 7 dias</p>
          {todosReconhecimentos.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <div className="text-3xl">🏅</div>
              <p className="text-sm font-medium" style={{ color: "#74859c" }}>Nenhum destaque esta semana</p>
              <p className="text-xs" style={{ color: "#334155" }}>{"Reconheça um colega visitando o perfil dele na seção Equipe."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todosReconhecimentos.map((r) => {
                const de = colaboradores.find((c) => c.id === r.deId);
                return (
                  <div key={r.id} className="p-3 rounded-xl" style={{ background: "#1e3356" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{r.emoji}</span>
                      {isAdmin
                        ? <Link href={`/equipe/${r.paraId}`} className="text-sm font-medium hover:underline" style={{ color: "#e8edf5" }}>{r.para.nome.split(" ")[0]}</Link>
                        : <span className="text-sm font-medium" style={{ color: "#e8edf5" }}>{r.para.nome.split(" ")[0]}</span>
                      }
                    </div>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{r.mensagem}</p>
                    <p className="text-xs mt-1" style={{ color: "#74859c" }}>por {de?.nome.split(" ")[0]} &middot; {r.data}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )} {/* end (isAdmin || verProgTime) */}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Progresso da Equipe — admin only */}
        {isAdmin && (
          <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
            <div className="flex items-center gap-2 mb-5">
              <Users size={18} style={{ color: "#c9a84c" }} />
              <h2 className="text-white font-semibold">Progresso da Equipe Hoje</h2>
            </div>
            <div className="space-y-4">
              {colaboradoresAtivos.map((c) => {
                const pct = calcProgresso(rotinasDoColaborador(rotinas, c.id));
                const cor = pct === 100 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                const atividadesCount = atividadesHoje.filter((a) => a.colaboradorId === c.id).length;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={28} />
                        <Link href={`/equipe/${c.id}`} className="text-sm hover:underline" style={{ color: "#e8edf5" }}>
                          {c.nome.split(" ")[0]}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        {atividadesCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#1e3356", color: "#9aa7ba" }}>
                            {atividadesCount} ativ.
                          </span>
                        )}
                        <span className="text-sm font-bold" style={{ color: cor }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status das Lojas — admin only */}
        {isAdmin && <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Store size={18} style={{ color: "#c9a84c" }} />
            <h2 className="text-white font-semibold">Status das Lojas</h2>
          </div>
          <div className="space-y-2">
            {LOJAS.map((loja) => {
              const responsavel = colaboradores.find((c) => c.id === loja.responsavel);
              const tarefasLoja = tarefas.filter((t) => t.lojaId === loja.id && t.status !== "concluida");
              const urgentes = tarefasLoja.filter((t) => t.prioridade === "alta").length;
              return (
                <Link key={loja.id} href={`/lojas/${loja.id}`} className="flex items-center justify-between p-3 rounded-xl hover:opacity-80" style={{ background: "#1e3356" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: loja.corFundo || "#0b1624" }}>
                      {loja.logo ? (
                        <Image src={loja.logo} alt={loja.nome} width={32} height={32} className="object-contain" unoptimized />
                      ) : (
                        <span className="text-xs font-bold" style={{ color: loja.grupo === "izzat" ? "#c9a84c" : "#3b82f6" }}>
                          {loja.nome.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#e8edf5" }}>{loja.nome}</p>
                      <p className="text-xs" style={{ color: "#9aa7ba" }}>
                        {responsavel ? responsavel.nome.split(" ")[0] : "Sem responsável"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {urgentes > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>
                        {urgentes} urgente{urgentes > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: loja.grupo === "izzat" ? "#c9a84c15" : "#3b82f615", color: loja.grupo === "izzat" ? "#c9a84c" : "#3b82f6" }}>
                      {loja.grupo === "izzat" ? "Grupo Izzat" : "Partner"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>}
      </div>

      {/* Tarefas Urgentes — admin only */}
      {isAdmin && tarefasUrgentes > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid #ef444430" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} style={{ color: "#ef4444" }} />
            <h2 className="text-white font-semibold">Tarefas Urgentes Pendentes</h2>
          </div>
          <div className="space-y-2">
            {tarefas.filter((t) => t.prioridade === "alta" && t.status !== "concluida").map((t) => {
              const pessoa = colaboradores.find((c) => c.id === t.atribuidoPara);
              const loja = LOJAS.find((l) => l.id === t.lojaId);
              const venceHoje = t.dataLimite === hoje.toISOString().split("T")[0];
              return (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#ef444415" }}>
                  <div>
                    <p className="text-white text-sm font-medium">{t.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                      {pessoa && <Link href={`/equipe/${pessoa.id}`} className="hover:underline" style={{ color: "#94a3b8" }}>{pessoa.nome.split(" ")[0]}</Link>}
                      {loja && <> &middot; <Link href={`/lojas/${loja.id}`} className="hover:underline" style={{ color: "#94a3b8" }}>{loja.nome}</Link></>}
                      {t.dataLimite && <> &middot; prazo: {t.dataLimite}</>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: "#ef444430", color: "#ef4444" }}>URGENTE</span>
                    {venceHoje && <span className="text-xs" style={{ color: "#f59e0b" }}>Vence hoje</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon, label, value, cor, dica, href }: { icon: React.ReactNode; label: string; value: string; cor: string; dica?: string; href?: string }) {
  const inner = (
    <>
      {dica && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 px-3 py-2 rounded-xl text-xs leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
          style={{ background: "#0a111e", border: "1px solid rgba(201,164,66,.16)", color: "#94a3b8", boxShadow: "0 8px 32px #00000080" }}>
          {dica}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="kpi-icon w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cor}18`, color: cor, transition: "transform var(--t-spring)" }}>{icon}</div>
        {href && <span className="text-xs opacity-0 group-hover:opacity-60 transition-all" style={{ color: cor, transform: "translateX(-4px)" }}>→</span>}
      </div>
      <p className="font-extrabold text-white" style={{ fontSize: 30, letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</p>
      <p className="text-xs mt-2 font-medium" style={{ color: "#9aa7ba" }}>{label}</p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl p-4 relative group block"
        style={{
          background: "linear-gradient(160deg, #14243f, #111e35)",
          border: `1px solid ${cor}30`,
          transition: "transform var(--t-spring), box-shadow var(--t-normal), border-color var(--t-normal)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${cor}20`;
          (e.currentTarget as HTMLElement).style.borderColor = `${cor}55`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
          (e.currentTarget as HTMLElement).style.borderColor = `${cor}30`;
        }}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-2xl p-4 relative group" style={{ background: "linear-gradient(160deg, #14243f, #111e35)", border: "1px solid rgba(201,164,66,.16)" }}>
      {inner}
    </div>
  );
}
