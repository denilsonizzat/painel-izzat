"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard, CheckSquare, Users, Store, ListTodo, LogOut, Menu, X,
  ClipboardList, Plus, Zap, Flame, Bell, Search, Activity, Power, RefreshCw,
  CalendarDays, ChevronLeft, ChevronRight, PanelLeftClose, DollarSign, Moon,
  PackageSearch, BookMarked, Trophy, Receipt, Wallet, Briefcase,
} from "lucide-react";
import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import Image from "next/image";
import { LOJAS, Prioridade, calcNivel } from "@/lib/data";
import OnlineStatusModal from "./OnlineStatusModal";
import BotaoAtivarPush from "./BotaoAtivarPush";
import Tip from "./Tip";

const NAV_SECTIONS = [
  {
    label: "Principal",
    emoji: "🏠",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Visão geral: progresso do time, KPIs, acesso rápido às ferramentas e stories da equipe" },
      { href: "/tarefas", label: "Tarefas", icon: ListTodo, desc: "Tudo que você precisa fazer: Hoje, Rotinas (por frequência) e Avulsas" },
    ],
  },
  {
    label: "Equipe",
    emoji: "👥",
    items: [
      { href: "/atividade", label: "Atividade", icon: Activity, desc: "Histórico do que o time fez: conclusões, check-ins e XP ganho ao longo do tempo" },
      { href: "/regras", label: "Regras", icon: BookMarked, desc: "Regras da empresa em 3 níveis: inegociável, recomendado e maleável" },
      { href: "/formulario", label: "Formulário", icon: ClipboardList, desc: "Formulário de acompanhamento que cada colaborador preenche" },
    ],
    adminItems: [
      { href: "/equipe", label: "Equipe", icon: Users, desc: "Perfis do time: rotinas, nível, contato, salário e Google Chat de cada pessoa" },
      { href: "/rotinas", label: "Rotinas", icon: RefreshCw, desc: "Gerenciar todas as rotinas do time: criar, editar e delegar por frequência" },
      { href: "/semana", label: "Semana do Time", icon: CalendarDays, desc: "Visão semanal: entregas, status e quem está em dia ou travado" },
    ],
  },
  {
    label: "Lojas",
    emoji: "🏪",
    items: [
      { href: "/lojas", label: "Lojas", icon: Store, desc: "Todas as lojas do grupo e parceiras: dados, Drive, rotinas e risco operacional" },
    ],
    adminItems: [
      { href: "/catalogo", label: "Produtos", icon: PackageSearch, desc: "Kanban de produtos: pipeline de validação do cadastro até a distribuição" },
    ],
  },
  {
    label: "Controle Geral",
    emoji: "🎛️",
    items: [],
    adminItems: [
      { href: "/gastos", label: "Custos da Equipe", icon: DollarSign, desc: "Salários e custos relacionados à mão de obra do time" },
      { href: "/gastos-operacoes", label: "Custos Operacionais", icon: Receipt, desc: "Custos de operação por loja: ads, ferramentas, IA e plataforma" },
      { href: "/custo-total", label: "Custo Total", icon: Wallet, desc: "Soma dos custos da equipe + operações = quanto custa manter o grupo Izzat" },
      { href: "/vagas", label: "Vagas & Pendências", icon: Briefcase, desc: "Rotinas sem responsável e necessidades de contratação do grupo" },
    ],
  },
  {
    label: "Pessoal",
    emoji: "🌙",
    items: [
      { href: "/sono", label: "Sono", icon: Moon, desc: "Registre seu sono e acompanhe consistência e horas dormidas (privado, só você vê)" },
      { href: "/desafios", label: "Desafios", icon: Trophy, desc: "Seu progresso (XP, nível, streak) e os desafios do time com check-in diário" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    usuarioAtual, logout, colaboradores, criarTarefa, tarefas,
    notificacoesInApp, marcarNotificacaoLida,
    sidebarColapsada, setSidebarColapsada,
  } = useAppStore();

  const [menuAberto, setMenuAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [notifAberta, setNotifAberta] = useState(false);
  const [onlineModalAberto, setOnlineModalAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [hoverExpand, setHoverExpand] = useState(false);
  const [secoesColapsadas, setSecoesColapsadas] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ titulo: "", prioridade: "alta" as Prioridade, atribuidoPara: "", lojaId: "" });

  useEffect(() => {
    if (!usuarioAtual) return;
    const hoje = new Date().toISOString().split("T")[0];
    const hiddenDate = localStorage.getItem("online-popup-hidden");
    if (hiddenDate !== hoje) {
      const timer = setTimeout(() => setOnlineModalAberto(true), 800);
      return () => clearTimeout(timer);
    }
  }, [usuarioAtual?.id]);

  const handleLogout = () => { logout(); router.push("/"); };

  const handleCriar = () => {
    if (!form.titulo || !form.atribuidoPara) return;
    criarTarefa({ ...form, descricao: "", status: "pendente", criadoPor: usuarioAtual?.id || "" });
    setForm({ titulo: "", prioridade: "alta", atribuidoPara: "", lojaId: "" });
    setModalAberto(false);
  };

  const isAdmin = usuarioAtual?.nivelAcesso === "admin";
  const nivelInfo = usuarioAtual ? calcNivel(usuarioAtual.xp || 0) : null;
  const minhasNotifs = notificacoesInApp.filter((n) => n.paraId === usuarioAtual?.id);
  const naoLidas = minhasNotifs.filter((n) => !n.lida).length;
  const isOnline = usuarioAtual?.statusOnline?.ativo ?? false;
  const tarefasParaRevisar = isAdmin ? tarefas.filter((t) => t.status === "aguardando_revisao").length : 0;

  // Badges de navegacao
  const minhasTarefasAbertas = usuarioAtual
    ? tarefas.filter((t) => t.atribuidoPara === usuarioAtual.id && t.status !== "concluida" && t.status !== "aguardando_revisao").length
    : 0;
  const meuPctRotinas = usuarioAtual ? (() => {
    const rot = usuarioAtual.rotinas;
    if (!rot.length) return null;
    const total = rot.reduce((a, r) => a + r.subtarefas.length, 0);
    if (total === 0) return rot.every((r) => r.concluida) ? 100 : 0;
    return Math.round((rot.reduce((a, r) => a + r.subtarefas.filter((s) => s.concluida).length, 0) / total) * 100);
  })() : null;

  // true = icon-only; false = full sidebar
  const isCollapsed = sidebarColapsada && !hoverExpand;

  const resultadosBusca = busca.length >= 2
    ? [
        ...colaboradores
          .filter((c) => isAdmin
            ? c.nome.toLowerCase().includes(busca.toLowerCase())
            : c.id === usuarioAtual?.id && c.nome.toLowerCase().includes(busca.toLowerCase()))
          .slice(0, 3)
          .map((c) => ({ tipo: "colab" as const, id: c.id, label: c.nome, sub: c.cargo, href: `/equipe/${c.id}`, cor: c.cor, foto: c.foto })),
        ...LOJAS
          .filter((l) => l.nome.toLowerCase().includes(busca.toLowerCase()))
          .slice(0, 3)
          .map((l) => ({ tipo: "loja" as const, id: l.id, label: l.nome, sub: l.grupo === "izzat" ? "Grupo Izzat" : "Partner", href: `/lojas/${l.id}`, cor: l.cor, foto: undefined })),
        ...tarefas
          .filter((t) => {
            const ok = t.titulo.toLowerCase().includes(busca.toLowerCase());
            const vis = isAdmin || t.atribuidoPara === usuarioAtual?.id || (t.membros || []).some((m) => m.colaboradorId === usuarioAtual?.id);
            return ok && vis;
          })
          .slice(0, 3)
          .map((t) => {
            const a = colaboradores.find((c) => c.id === t.atribuidoPara);
            return { tipo: "tarefa" as const, id: t.id, label: t.titulo, sub: a?.nome.split(" ")[0] ?? "", href: "/tarefas", cor: "#c9a84c", foto: undefined };
          }),
      ]
    : [];

  /* ── Inner content component (shares outer scope via closure) ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header: logo + collapse toggle ── */}
      <div
        className="border-b flex-shrink-0"
        style={{
          borderColor: "var(--border)",
          padding: isCollapsed ? "16px 10px" : "20px",
          background: "linear-gradient(180deg, #162843 0%, var(--card) 100%)",
        }}
      >
        <div className="flex items-center" style={{ justifyContent: isCollapsed ? "center" : "space-between" }}>
          {/* Logo + name */}
          <div className="flex items-center" style={{ gap: isCollapsed ? 0 : 12, overflow: "hidden" }}>
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src="/lojas/izzat-group.png"
                alt="Izzat Group"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div
              className="overflow-hidden transition-all"
              style={{
                maxWidth: isCollapsed ? 0 : 140,
                opacity: isCollapsed ? 0 : 1,
                transition: "max-width 0.22s ease, opacity 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <p className="text-white font-bold text-sm">Izzat Group</p>
              <p className="text-xs" style={{ color: "#9aa7ba" }}>Gestao de Equipe</p>
            </div>
          </div>

          {/* Bell + toggle */}
          <div
            className="flex items-center gap-1 flex-shrink-0 overflow-hidden transition-all"
            style={{ maxWidth: isCollapsed ? 0 : 80, opacity: isCollapsed ? 0 : 1, transition: "max-width 0.22s ease, opacity 0.15s ease" }}
          >
            {usuarioAtual && (
              <button
                onClick={() => setNotifAberta((v) => !v)}
                className="relative p-2 rounded-xl transition-all"
                style={{ background: notifAberta ? "#c9a84c20" : "transparent" }}
              >
                <Bell size={15} style={{ color: naoLidas > 0 ? "#c9a84c" : "#64748b" }} />
                {naoLidas > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ background: "#ef4444", color: "white", fontSize: 9 }}
                  >
                    {naoLidas > 9 ? "9+" : naoLidas}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle button — always visible */}
        <button
          onClick={() => { setSidebarColapsada(!sidebarColapsada); setHoverExpand(false); }}
          className="mt-3 w-full flex items-center rounded-xl py-2 px-2 transition-all hover:opacity-90"
          style={{
            background: sidebarColapsada ? "var(--gold-dim)" : "#1e335640",
            color: sidebarColapsada ? "var(--gold)" : "#94a3b8",
            justifyContent: "center",
            border: sidebarColapsada ? "1px solid #c9a84c40" : "1px solid transparent",
          }}
          data-tip={sidebarColapsada ? "Fixar menu aberto" : "Recolher menu (passa o mouse para abrir)"}
        >
          {sidebarColapsada ? <ChevronRight size={16} /> : (
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <PanelLeftClose size={14} />
              Recolher menu
            </span>
          )}
        </button>

        {/* Notification panel */}
        {!isCollapsed && notifAberta && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "#9aa7ba" }}>Notificacoes</span>
              {naoLidas > 0 && (
                <button
                  onClick={() => minhasNotifs.filter((n) => !n.lida).forEach((n) => marcarNotificacaoLida(n.id))}
                  className="text-xs"
                  style={{ color: "#c9a84c" }}
                >
                  Limpar tudo
                </button>
              )}
            </div>
            <BotaoAtivarPush />
            <div className="max-h-56 overflow-y-auto" style={{ borderTop: "1px solid var(--border)" }}>
              {minhasNotifs.length === 0 ? (
                <p className="px-3 py-4 text-xs text-center" style={{ color: "#74859c" }}>
                  Nenhuma notificacao
                </p>
              ) : (
                minhasNotifs.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      marcarNotificacaoLida(n.id);
                      if (n.href) router.push(n.href);
                      setNotifAberta(false);
                      setMenuAberto(false);
                    }}
                    className="w-full px-3 py-2.5 text-left transition-opacity hover:opacity-80"
                    style={{ background: n.lida ? "transparent" : "#1e335640", borderTop: "1px solid #1e3356" }}
                  >
                    <p className="text-xs font-medium" style={{ color: n.lida ? "#64748b" : "#e8edf5" }}>{n.titulo}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: "#74859c" }}>
                      {n.corpo.length > 55 ? n.corpo.slice(0, 55) + "..." : n.corpo}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <div
        className="overflow-hidden transition-all flex-shrink-0"
        style={{ maxHeight: isCollapsed ? 0 : 120, opacity: isCollapsed ? 0 : 1, transition: "max-height 0.22s ease, opacity 0.15s ease" }}
      >
        <div className="px-4 pt-3 pb-1 relative">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--border)" }}>
            <Search size={13} style={{ color: "#9aa7ba" }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="bg-transparent text-sm outline-none flex-1 min-w-0"
              style={{ color: "#e8edf5" }}
            />
            {busca && (
              <button onClick={() => setBusca("")}>
                <X size={11} style={{ color: "#9aa7ba" }} />
              </button>
            )}
          </div>
          {resultadosBusca.length > 0 && (
            <div
              className="absolute left-4 right-4 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-2xl"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              {resultadosBusca.map((r) => (
                <Link
                  key={r.tipo + r.id}
                  href={r.href}
                  onClick={() => { setBusca(""); setMenuAberto(false); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 hover:opacity-80 transition-opacity"
                  style={{ borderTop: "1px solid #1e3356" }}
                >
                  <div className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ background: r.cor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{r.label}</p>
                    <p className="text-xs" style={{ color: "#9aa7ba" }}>
                      {r.tipo === "colab" ? "Pessoa" : r.tipo === "loja" ? "Loja" : "Tarefa"}
                      {r.sub ? " · " + r.sub : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: isCollapsed ? 4 : 14 }}>
        {NAV_SECTIONS.map((section) => {
          const allItems = [...(section.items || []), ...(isAdmin && section.adminItems ? section.adminItems : [])];
          if (allItems.length === 0) return null;
          return (
            <div key={section.label}>
              {/* Section label or divider */}
              {!isCollapsed ? (
                <button
                  onClick={() => setSecoesColapsadas((prev) => ({ ...prev, [section.label]: !prev[section.label] }))}
                  className="w-full flex items-center justify-between px-2 mb-1 hover:opacity-70 transition-opacity"
                  data-tip={secoesColapsadas[section.label] ? "Expandir " + section.label : "Recolher " + section.label}
                >
                  <div className="flex items-center gap-1.5">
                    {(section as { emoji?: string }).emoji && (
                      <span style={{ fontSize: 11 }}>{(section as { emoji?: string }).emoji}</span>
                    )}
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#334155" }}>
                      {section.label}
                    </p>
                  </div>
                  <ChevronRight
                    size={10}
                    style={{
                      color: "#334155",
                      transform: secoesColapsadas[section.label] ? "rotate(0deg)" : "rotate(90deg)",
                      transition: "transform 0.2s ease",
                      flexShrink: 0,
                    }}
                  />
                </button>
              ) : (
                <div className="border-t mb-1" style={{ borderColor: "#1e335660" }} />
              )}
              {!secoesColapsadas[section.label] && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {allItems
                  .filter(({ href }) => {
                    // Formulario: hide from admin (acessivel via perfil), hide from colab que ja preencheu
                    if (href === "/formulario") return !isAdmin && !usuarioAtual?.formulario;
                    return true;
                  })
                  .map(({ href, label, icon: Icon, desc }: { href: string; label: string; icon: typeof LayoutDashboard; desc?: string }) => {
                  const ativo = pathname === href || pathname.startsWith(href + "/");
                  const badge = href === "/tarefas" && isAdmin ? tarefasParaRevisar : 0;
                  const sidebarBadge = href === "/tarefas" && !isAdmin ? minhasTarefasAbertas
                    : href === "/meu-dia" && meuPctRotinas !== null ? null
                    : 0;
                  const meuDiaBadge = href === "/meu-dia" && meuPctRotinas !== null;
                  return (
                    <Tip key={href} titulo={label} texto={desc ?? ""} place="right">
                    <Link
                      href={href}
                      onClick={() => setMenuAberto(false)}
                      data-tour={href === "/meu-dia" ? "meu-dia" : undefined}
                      className="flex items-center rounded-xl text-sm font-medium relative"
                      style={{
                        background: ativo ? "var(--gold-dim)" : "transparent",
                        color: ativo ? "var(--gold)" : "var(--text-dim)",
                        padding: isCollapsed ? "10px 0" : "10px 12px",
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        gap: isCollapsed ? 0 : 12,
                        transition: "all 150ms cubic-bezier(0.4,0,0.2,1)",
                        boxShadow: ativo ? "0 0 0 1px #c9a84c20 inset" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!ativo) {
                          (e.currentTarget as HTMLElement).style.background = "#1e334560";
                          (e.currentTarget as HTMLElement).style.color = "var(--text)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!ativo) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "var(--text-dim)";
                        }
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        <Icon size={17} />
                        {badge > 0 && isCollapsed && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                            style={{ background: "#f59e0b", color: "#000", fontSize: 8, fontWeight: 700 }}>
                            {badge > 9 ? "9+" : badge}
                          </span>
                        )}
                      </div>
                      <span
                        className="overflow-hidden transition-all whitespace-nowrap flex-1"
                        style={{
                          maxWidth: isCollapsed ? 0 : 160,
                          opacity: isCollapsed ? 0 : 1,
                          transition: "max-width 0.2s ease, opacity 0.15s ease",
                        }}
                      >
                        {label}
                      </span>
                      {badge > 0 && !isCollapsed && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }}>
                          {badge}
                        </span>
                      )}
                      {/* Badge de tarefas abertas para colaborador */}
                      {!isAdmin && (sidebarBadge || 0) > 0 && !isCollapsed && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f640" }}>
                          {sidebarBadge}
                        </span>
                      )}
                      {/* Badge de progresso do Meu Dia */}
                      {meuDiaBadge && !isCollapsed && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: meuPctRotinas === 100 ? "#10b98120" : "#c9a84c15",
                            color: meuPctRotinas === 100 ? "#10b981" : "#c9a84c",
                            border: `1px solid ${meuPctRotinas === 100 ? "#10b98140" : "#c9a84c30"}`,
                          }}>
                          {meuPctRotinas}%
                        </span>
                      )}
                    </Link>
                    </Tip>
                  );
                  })}
              </div>}
            </div>
          );
        })}
      </nav>

      {/* ── User ── */}
      <div className="border-t flex-shrink-0" style={{ borderColor: "var(--border)", padding: isCollapsed ? "12px 8px" : "16px" }}>
        {usuarioAtual && (
          isCollapsed ? (
            <div className="flex justify-center mb-2">
              <Link href={`/equipe/${usuarioAtual.id}`} onClick={() => setMenuAberto(false)} data-tip={usuarioAtual.nome}>
                <div className="relative">
                  <Avatar nome={usuarioAtual.nome} avatar={usuarioAtual.avatar} foto={usuarioAtual.foto} cor={usuarioAtual.cor} size={32} />
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background: "#10b981", borderColor: "#122039" }} />
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <Link href={`/equipe/${usuarioAtual.id}`} onClick={() => setMenuAberto(false)} className="block mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar nome={usuarioAtual.nome} avatar={usuarioAtual.avatar} foto={usuarioAtual.foto} cor={usuarioAtual.cor} size={36} />
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ background: "#10b981", borderColor: "#122039" }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-sm font-medium truncate">{usuarioAtual.nome.split(" ")[0]}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: isAdmin ? "#c9a84c15" : "#3b82f615", color: isAdmin ? "#c9a84c" : "#3b82f6", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>
                      {isAdmin ? "GESTOR" : "COLAB"}
                    </span>
                  </div>
                  {nivelInfo && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Zap size={10} style={{ color: nivelInfo.cor }} />
                      <span className="text-xs" style={{ color: nivelInfo.cor }} data-tip={"Nivel: " + nivelInfo.nome + " · " + (usuarioAtual.xp || 0) + " XP acumulado"}>{nivelInfo.nome}</span>
                      {(usuarioAtual.streak || 0) > 0 && (
                        <>
                          <Flame size={10} style={{ color: "#f59e0b" }} />
                          <span className="text-xs" style={{ color: "#f59e0b" }} data-tip={"Streak: " + usuarioAtual.streak + " dias seguidos de check-in"}>{usuarioAtual.streak}d</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {nivelInfo?.proximo && (
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "#1e3356" }} data-tip={"Progresso para " + nivelInfo.proximo + ": " + nivelInfo.progresso + "%"}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${nivelInfo.progresso}%`, background: nivelInfo.cor }} />
                </div>
              )}
            </Link>
          )
        )}

        {isCollapsed ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 rounded-xl transition-all hover:opacity-80"
            style={{ color: "#9aa7ba" }}
            data-tip="Sair"
          >
            <LogOut size={15} />
          </button>
        ) : (
          <>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all hover:opacity-80"
              style={{ color: "#9aa7ba", background: "transparent" }}
            >
              <LogOut size={16} />
              Sair
            </button>
            <p className="text-center mt-3 text-xs" style={{ color: "#1e3356" }}>Dev: Denilson Bitencourt</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        data-tour="sidebar"
        className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-hidden"
        style={{
          width: sidebarColapsada && !hoverExpand ? 62 : 224,
          transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
        }}
        onMouseEnter={() => { if (sidebarColapsada) setHoverExpand(true); }}
        onMouseLeave={() => setHoverExpand(false)}
      >
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/lojas/izzat-group.png" alt="Izzat Group" width={28} height={28} className="w-full h-full object-cover" unoptimized />
          </div>
          <span className="text-white font-bold text-sm">Izzat Group</span>
        </div>
        <div className="flex items-center gap-1">
          {usuarioAtual && (
            <>
              <button onClick={() => setOnlineModalAberto(true)} className="relative p-1.5">
                <Power size={17} style={{ color: isOnline ? "#10b981" : "#64748b" }} />
                {isOnline && <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full" style={{ background: "#10b981" }} />}
              </button>
              <button onClick={() => setNotifAberta((v) => !v)} className="relative p-1.5">
                <Bell size={18} style={{ color: naoLidas > 0 ? "#c9a84c" : "#64748b" }} />
                {naoLidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ background: "#ef4444", color: "white", fontSize: 9 }}>
                    {naoLidas > 9 ? "9+" : naoLidas}
                  </span>
                )}
              </button>
            </>
          )}
          <button onClick={() => setMenuAberto(!menuAberto)} className="text-white p-1">
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuAberto && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMenuAberto(false)} style={{ background: "#00000080" }}>
          <div className="w-64 h-full" style={{ background: "var(--card)" }} onClick={(e) => e.stopPropagation()}>
            <div className="pt-16"><SidebarContent /></div>
          </div>
        </div>
      )}

      {/* Floating + button (admin only) */}
      {isAdmin && (
        <button
          onClick={() => setModalAberto(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ background: "#c9a84c", color: "#0b1624" }}
          data-tip="Nova Tarefa Rapida"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* Modal quick add */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000090" }} onClick={() => setModalAberto(false)}>
          <div className="w-full max-w-md rounded-2xl p-5 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Nova Tarefa</h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#9aa7ba" }}><X size={20} /></button>
            </div>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="O que precisa ser feito?"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}
              onKeyDown={(e) => e.key === "Enter" && handleCriar()}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value as Prioridade })}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "#1e3356", border: "1px solid #334155" }}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baixa">Baixa</option>
              </select>
              <select
                value={form.atribuidoPara}
                onChange={(e) => setForm({ ...form, atribuidoPara: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "#1e3356", border: "1px solid #334155" }}
              >
                <option value="">Para quem?</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome.split(" ")[0]}</option>
                ))}
              </select>
            </div>
            <select
              value={form.lojaId}
              onChange={(e) => setForm({ ...form, lojaId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}
            >
              <option value="">Sem loja</option>
              <option value="grupo-izzat">Grupo Izzat (geral)</option>
              {LOJAS.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            <button
              onClick={handleCriar}
              disabled={!form.titulo || !form.atribuidoPara}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "#c9a84c" }}
            >
              Criar Tarefa
            </button>
          </div>
        </div>
      )}

      <OnlineStatusModal aberto={onlineModalAberto} onFechar={() => setOnlineModalAberto(false)} />
    </>
  );
}
