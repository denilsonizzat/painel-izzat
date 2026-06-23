"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS, Prioridade, Tarefa, MembroTarefa } from "@/lib/data";
import { Plus, X, CheckCircle2, Clock, Circle, MessageSquare, Send, AlertTriangle, Zap, ChevronDown, ChevronUp, Users, MessageCircle, Phone, Eye, Trash2, RefreshCw, ListTodo, Sparkles } from "lucide-react";
import Avatar from "@/components/Avatar";
import Tooltip from "@/components/Tooltip";
import BackButton from "@/components/BackButton";
import Image from "next/image";
import { useNotifications } from "@/hooks/useNotifications";
import AbaHoje from "@/components/tarefas/AbaHoje";
import AbaRotinas from "@/components/tarefas/AbaRotinas";
import Tabs from "@/components/Tabs";

type AbaTarefas = "hoje" | "rotinas" | "avulsas";

const PRIORIDADE_COR: Record<string, string> = { alta: "#F2545B", media: "#E8A33D", baixa: "#64748b" };
const PRIORIDADE_BG: Record<string, string> = { alta: "#F2545B15", media: "#E8A33D15", baixa: "#64748b15" };
const PRIORIDADE_LABEL: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };
const STATUS_LABEL: Record<Tarefa["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluida",
  atrasada: "Atrasada",
  travado: "Travado",
  aguardando_revisao: "Aguard. aprovacao",
};
const STATUS_DESC: Record<Tarefa["status"], string> = {
  pendente: "Ainda não iniciada",
  em_andamento: "Em execução agora",
  concluida: "Finalizada e aprovada",
  atrasada: "Passou do prazo",
  travado: "Bloqueada por impedimento",
  aguardando_revisao: "Enviada ao gestor para aprovar",
};
const STATUS_COR: Record<Tarefa["status"], string> = {
  pendente: "#64748b", em_andamento: "#4D9DE0", concluida: "#36C98E", atrasada: "#F2545B", travado: "#F2545B", aguardando_revisao: "#E8A33D",
};

type MembroForm = { uid: string; colaboradorId: string; subtarefas: { uid: string; titulo: string }[]; inputSub: string };

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export default function TarefasPage() {
  const { colaboradores, tarefas, usuarioAtual, criarTarefa, atualizarStatusTarefa, adicionarComentario, verificarAtrasadas, marcarSubtarefaTarefa, aprovarTarefa, rejeitarTarefa, marcarVisualizacaoTarefa, adicionarMiniTarefa, toggleMiniTarefa, deletarMiniTarefa } = useAppStore();
  const { notificarTarefaAtrasada } = useNotifications();
  const isAdmin = usuarioAtual?.nivelAcesso === "admin";

  // Aba ativa — rotinas é o "mínimo do dia", abre primeiro
  const [aba, setAba] = useState<AbaTarefas>("hoje");

  // Modal state
  const [rapidaAberto, setRapidaAberto] = useState(false);
  const [elaboradaAberto, setElaboradaAberto] = useState(false);

  // Tarefa Rápida form
  const emptyRapida = { titulo: "", prioridade: "alta" as Prioridade, atribuidoPara: "", lojaId: "", dataLimite: "" };
  const [formRapida, setFormRapida] = useState(emptyRapida);

  // Tarefa Elaborada form
  const emptyElab = { titulo: "", descricao: "", prioridade: "alta" as Prioridade, lojaId: "", dataLimite: "" };
  const [formElab, setFormElab] = useState(emptyElab);
  const [membrosElab, setMembrosElab] = useState<MembroForm[]>([]);
  const [novoMembroId, setNovoMembroId] = useState("");

  // List state
  const [filtroStatus, setFiltroStatus] = useState<"todos" | Tarefa["status"]>("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState<"todos" | Prioridade>("todos");
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [comentandoId, setComentandoId] = useState<string | null>(null);
  const [textoComentario, setTextoComentario] = useState("");
  const [filtroColab, setFiltroColab] = useState<string>("todos");
  const [filtroLoja, setFiltroLoja] = useState<string>("todos");
  const [miniTarefaInput, setMiniTarefaInput] = useState<Record<string, string>>({});
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    verificarAtrasadas();
    const interval = setInterval(verificarAtrasadas, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCriarRapida = () => {
    if (!formRapida.titulo || !formRapida.atribuidoPara) return;
    criarTarefa({ ...formRapida, tipo: "rapida", status: "pendente", criadoPor: usuarioAtual?.id || "" });
    const assignee = colaboradores.find((c) => c.id === formRapida.atribuidoPara);
    if (assignee?.telefone) {
      const phone = assignee.telefone.replace(/\D/g, "");
      const msg = encodeURIComponent(`Oi ${assignee.nome.split(" ")[0]}! Você recebeu uma nova tarefa: "${formRapida.titulo}". Acesse o painel para ver os detalhes.`);
      setWaLink(`https://wa.me/${phone}?text=${msg}`);
    }
    setFormRapida(emptyRapida);
    setRapidaAberto(false);
  };

  const handleCriarElaborada = () => {
    if (!formElab.titulo || membrosElab.length === 0) return;
    const membros: MembroTarefa[] = membrosElab.map((m) => ({
      colaboradorId: m.colaboradorId,
      subtarefas: m.subtarefas.map((s) => ({ id: s.uid, titulo: s.titulo, concluida: false })),
    }));
    criarTarefa({
      ...formElab,
      tipo: "elaborada",
      status: "pendente",
      criadoPor: usuarioAtual?.id || "",
      atribuidoPara: usuarioAtual?.id || "",
      membros,
    });
    setFormElab(emptyElab);
    setMembrosElab([]);
    setNovoMembroId("");
    setElaboradaAberto(false);
  };

  const addMembroElab = () => {
    if (!novoMembroId || membrosElab.some((m) => m.colaboradorId === novoMembroId)) return;
    setMembrosElab([...membrosElab, { uid: uid(), colaboradorId: novoMembroId, subtarefas: [], inputSub: "" }]);
    setNovoMembroId("");
  };

  const removeMembroElab = (mUid: string) => setMembrosElab(membrosElab.filter((m) => m.uid !== mUid));

  const addSubtarefaElab = (mUid: string) => {
    setMembrosElab(membrosElab.map((m) => {
      if (m.uid !== mUid || !m.inputSub.trim()) return m;
      return { ...m, subtarefas: [...m.subtarefas, { uid: uid(), titulo: m.inputSub.trim() }], inputSub: "" };
    }));
  };

  const removeSubtarefaElab = (mUid: string, sUid: string) => {
    setMembrosElab(membrosElab.map((m) =>
      m.uid !== mUid ? m : { ...m, subtarefas: m.subtarefas.filter((s) => s.uid !== sUid) }
    ));
  };

  const handleEnviarComentario = (tarefaId: string) => {
    if (!textoComentario.trim()) return;
    adicionarComentario(tarefaId, textoComentario);
    setTextoComentario("");
    setComentandoId(null);
  };

  const tarefasFiltradas = tarefas.filter((t) => {
    const statusOk = filtroStatus === "todos" || t.status === filtroStatus;
    const prioOk = filtroPrioridade === "todos" || t.prioridade === filtroPrioridade;
    const pessoaBase = isAdmin ||
      t.atribuidoPara === usuarioAtual?.id ||
      (t.membros || []).some((m) => m.colaboradorId === usuarioAtual?.id);
    const colabOk = filtroColab === "todos" ||
      t.atribuidoPara === filtroColab ||
      (t.membros || []).some((m) => m.colaboradorId === filtroColab);
    const lojaOk = filtroLoja === "todos" || t.lojaId === filtroLoja;
    return statusOk && prioOk && pessoaBase && colabOk && lojaOk;
  });

  const contagens = {
    pendente: tarefas.filter((t) => t.status === "pendente").length,
    em_andamento: tarefas.filter((t) => t.status === "em_andamento").length,
    concluida: tarefas.filter((t) => t.status === "concluida").length,
    atrasada: tarefas.filter((t) => t.status === "atrasada").length,
    travado: tarefas.filter((t) => t.status === "travado").length,
  };

  const hoje = new Date().toISOString().split("T")[0];

  const inputStyle = { background: "#1e3356", border: "1px solid #334155" };
  const labelStyle = { color: "#94a3b8" };

  return (
    <div data-tour="tarefas-main" className="mx-auto space-y-6">
      <BackButton href="/dashboard" />

      {/* WhatsApp notification banner */}
      {waLink && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: "#36C98E15", border: "1px solid #36C98E30" }}>
          <div className="flex items-center gap-2">
            <MessageCircle size={15} style={{ color: "#36C98E" }} />
            <span className="text-sm" style={{ color: "#36C98E" }}>Tarefa criada! Notificar pelo WhatsApp?</span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              onClick={() => setWaLink(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: "#36C98E", color: "#fff" }}>
              Abrir WhatsApp
            </a>
            <button onClick={() => setWaLink(null)} className="p-1.5 rounded-lg" style={{ color: "#74859c" }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tarefas</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>
            Tudo que você precisa fazer, organizado num lugar só
          </p>
        </div>
        {aba === "avulsas" && (
          isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRapidaAberto(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 active:scale-95"
                style={{ background: "#c9a84c", color: "#0b1624" }}
              >
                <Zap size={14} /> {"Rápida"}
              </button>
              <button
                onClick={() => setElaboradaAberto(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 active:scale-95"
                style={{ background: "#4D9DE020", color: "#4D9DE0", border: "1px solid #4D9DE040" }}
              >
                <Users size={14} /> Elaborada
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setFormRapida({ ...emptyRapida, atribuidoPara: usuarioAtual?.id || "" }); setRapidaAberto(true); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 active:scale-95"
              style={{ background: "#c9a84c", color: "#0b1624" }}
            >
              <Plus size={14} /> Nova tarefa
            </button>
          )
        )}
      </div>

      {/* Abas */}
      <Tabs
        value={aba}
        onChange={setAba}
        tabs={[
          { id: "hoje", label: "Hoje", icon: Sparkles, dica: "Tudo que você tem para fazer hoje (rotinas do dia + avulsas)" },
          { id: "rotinas", label: "Rotinas", icon: RefreshCw, dica: "Suas rotinas por frequência (diária, semanal, mensal...)" },
          { id: "avulsas", label: "Avulsas", icon: ListTodo, dica: "Tarefas avulsas — delegadas pelo gestor ou criadas por você" },
        ]}
      />

      {/* Aba Hoje */}
      {aba === "hoje" && <AbaHoje />}

      {/* Aba Rotinas */}
      {aba === "rotinas" && <AbaRotinas />}

      {/* ── Aba Avulsas (conteúdo original preservado) ── */}
      {aba === "avulsas" && (<>
      {/* KPIs — clicaveis para filtrar */}
      <div>
        <p className="text-xs mb-2" style={{ color: "#74859c" }}>
          Clique em um status para filtrar a lista abaixo
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {(["pendente", "em_andamento", "atrasada", "travado", "concluida"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(filtroStatus === s ? "todos" : s)}
              data-tip={STATUS_DESC[s]}
              className="rounded-xl p-3 text-left transition-all"
              style={{
                background: filtroStatus === s ? `${STATUS_COR[s]}25` : "#112239",
                border: `2px solid ${filtroStatus === s ? STATUS_COR[s] : "#1e3356"}`,
              }}
            >
              <p className="text-xl font-black" style={{ color: STATUS_COR[s] }}>{contagens[s]}</p>
              <p className="text-xs font-medium leading-tight" style={{ color: filtroStatus === s ? STATUS_COR[s] : "#64748b" }}>
                {STATUS_LABEL[s]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {contagens.travado > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F2545B15", border: "1px solid #F2545B30" }}>
          <AlertTriangle size={16} style={{ color: "#F2545B" }} />
          <p className="text-sm" style={{ color: "#F2545B" }}>
            {contagens.travado} tarefa{contagens.travado > 1 ? "s" : ""} travada{contagens.travado > 1 ? "s" : ""} — precisa de atenção imediata
          </p>
        </div>
      )}
      {contagens.atrasada > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F2545B15", border: "1px solid #F2545B30" }}>
          <AlertTriangle size={16} style={{ color: "#F2545B" }} />
          <p className="text-sm" style={{ color: "#F2545B" }}>
            {contagens.atrasada} tarefa{contagens.atrasada > 1 ? "s" : ""} atrasada{contagens.atrasada > 1 ? "s" : ""} — verifique os prazos
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-3">
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <select value={filtroColab} onChange={(e) => setFiltroColab(e.target.value)} className="px-3 py-1.5 rounded-xl text-sm text-white outline-none" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
              <option value="todos">👤 Todas as pessoas</option>
              {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome.split(" ")[0]}</option>)}
            </select>
            <select value={filtroLoja} onChange={(e) => setFiltroLoja(e.target.value)} className="px-3 py-1.5 rounded-xl text-sm text-white outline-none" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
              <option value="todos">🏪 Todas as lojas</option>
              {LOJAS.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
            {(filtroColab !== "todos" || filtroLoja !== "todos") && (
              <button onClick={() => { setFiltroColab("todos"); setFiltroLoja("todos"); }} className="px-3 py-1.5 rounded-xl text-xs" style={{ background: "#1e3356", color: "#9aa7ba" }}>
                Limpar filtros
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: "#74859c" }}>Prioridade:</span>
          {(["todos", "alta", "media", "baixa"] as const).map((p) => {
            const cor = p === "todos" ? "#c9a84c" : PRIORIDADE_COR[p as Prioridade];
            return (
              <button key={p} onClick={() => setFiltroPrioridade(p)} className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{ background: filtroPrioridade === p ? cor : "#112239", color: filtroPrioridade === p ? (p === "todos" ? "#0b1624" : "white") : "#64748b", border: `1px solid ${filtroPrioridade === p ? cor : "#1e3356"}` }}>
                {p === "todos" ? "Todas" : PRIORIDADE_LABEL[p as Prioridade]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contagem de resultados */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "#74859c" }}>
          {tarefasFiltradas.length === 0
            ? "Nenhuma tarefa encontrada"
            : `${tarefasFiltradas.length} tarefa${tarefasFiltradas.length > 1 ? "s" : ""} encontrada${tarefasFiltradas.length > 1 ? "s" : ""}`}
          {filtroStatus !== "todos" && <span> · filtro: <span style={{ color: STATUS_COR[filtroStatus as Tarefa["status"]] }}>{STATUS_LABEL[filtroStatus as Tarefa["status"]]}</span></span>}
        </p>
        {(filtroStatus !== "todos" || filtroPrioridade !== "todos") && (
          <button onClick={() => { setFiltroStatus("todos"); setFiltroPrioridade("todos"); }}
            className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: "#9aa7ba", background: "#1e3356" }}>
            Limpar
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {tarefasFiltradas.length === 0 ? (
          <div className="rounded-2xl p-10 text-center space-y-2" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
            <div className="text-4xl">🔍</div>
            <p className="text-white font-medium">
              {filtroStatus !== "todos" || filtroPrioridade !== "todos"
                ? "Nenhuma tarefa com esses filtros"
                : isAdmin ? "Nenhuma tarefa criada ainda" : "Você não tem tarefas atribuídas"}
            </p>
            <p className="text-sm" style={{ color: "#74859c" }}>
              {filtroStatus !== "todos" || filtroPrioridade !== "todos"
                ? "Tente mudar ou limpar os filtros acima"
                : isAdmin ? "Use o botão Nova Tarefa para começar" : "Aguarde o gestor atribuir tarefas a você"}
            </p>
          </div>
        ) : (
          tarefasFiltradas.map((t) => {
            const pessoa = colaboradores.find((c) => c.id === t.atribuidoPara);
            const loja = LOJAS.find((l) => l.id === t.lojaId);
            const corP = PRIORIDADE_COR[t.prioridade] || "#64748b";
            const bgP = PRIORIDADE_BG[t.prioridade] || "#64748b15";
            const estaAtrasada = t.status === "atrasada";
            const estaTravada = t.status === "travado";
            const venceHoje = t.dataLimite === hoje && t.status !== "concluida";
            const expandida = expandidoId === t.id;
            const nComentarios = (t.comentarios || []).length;
            const isElaborada = t.tipo === "elaborada";
            const isMembro = (t.membros || []).some((m) => m.colaboradorId === usuarioAtual?.id);
            const canAct = t.atribuidoPara === usuarioAtual?.id || isMembro || isAdmin;

            return (
              <div key={t.id} className="rounded-2xl overflow-hidden" style={{
                background: "#112239",
                border: estaTravada ? "1px solid #F2545B50" : estaAtrasada ? "1px solid #F2545B50" : venceHoje ? "1px solid #E8A33D50" : `1px solid ${corP}30`,
              }}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {isElaborada && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{ background: "#c9a84c20", color: "#c9a84c" }}>
                            <Users size={10} /> Elaborada
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: bgP, color: corP }}>
                          {PRIORIDADE_LABEL[t.prioridade] || t.prioridade}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COR[t.status]}20`, color: STATUS_COR[t.status] }}>
                          {STATUS_LABEL[t.status]}
                        </span>
                        {t.lojaId === "grupo-izzat" && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: "#c9a84c20", color: "#c9a84c" }}>Grupo Izzat</span>
                        )}
                        {loja && (
                          <div className="flex items-center gap-1">
                            {loja.logo && (
                              <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: loja.corFundo || "#1e3356" }}>
                                <Image src={loja.logo} alt={loja.nome} width={16} height={16} className="w-full h-full object-contain" unoptimized />
                              </div>
                            )}
                            <span className="text-xs" style={{ color: "#9aa7ba" }}>{loja.nome}</span>
                          </div>
                        )}
                        {estaTravada && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{ background: "#F2545B20", color: "#F2545B" }}>
                            <AlertTriangle size={10} /> TRAVADO
                          </span>
                        )}
                        {estaAtrasada && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{ background: "#F2545B20", color: "#F2545B" }}>
                            <AlertTriangle size={10} /> ATRASADA
                          </span>
                        )}
                        {venceHoje && !estaAtrasada && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#E8A33D20", color: "#E8A33D" }}>
                            Vence hoje
                          </span>
                        )}
                      </div>

                      <p className="text-white font-medium">{t.titulo}</p>
                      {t.descricao && <p className="text-sm mt-1" style={{ color: "#9aa7ba" }}>{t.descricao}</p>}

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {!isElaborada && pessoa && (
                          <div className="flex items-center gap-1.5">
                            <Avatar nome={pessoa.nome} avatar={pessoa.avatar} foto={pessoa.foto} cor={pessoa.cor} size={18} />
                            <span className="text-xs" style={{ color: "#94a3b8" }}>{pessoa.nome.split(" ")[0]}</span>
                          </div>
                        )}
                        {t.dataLimite && (
                          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: estaAtrasada ? "#F2545B" : venceHoje ? "#E8A33D" : "#94a3b8" }}>
                            <Clock size={11} /> Prazo: {t.dataLimite}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "#74859c" }}>Criada {t.dataCriacao}</span>
                        {nComentarios > 0 && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#9aa7ba" }}>
                            <MessageSquare size={11} /> {nComentarios}
                          </span>
                        )}
                      </div>

                      {/* Read receipts */}
                      {t.visualizacoes && Object.keys(t.visualizacoes).length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Eye size={10} style={{ color: "#74859c" }} />
                          <div className="flex -space-x-1">
                            {Object.entries(t.visualizacoes).slice(0, 5).map(([cid]) => {
                              const c = colaboradores.find((x) => x.id === cid);
                              if (!c) return null;
                              return <Avatar key={cid} nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={14} />;
                            })}
                          </div>
                          {Object.keys(t.visualizacoes).length > 5 && (
                            <span className="text-xs" style={{ color: "#74859c" }}>+{Object.keys(t.visualizacoes).length - 5}</span>
                          )}
                        </div>
                      )}

                      {/* Elaborada: membros progress */}
                      {isElaborada && (t.membros || []).length > 0 && (
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {(t.membros || []).map((m) => {
                            const colab = colaboradores.find((c) => c.id === m.colaboradorId);
                            if (!colab) return null;
                            const done = m.subtarefas.filter((s) => s.concluida).length;
                            const total = m.subtarefas.length;
                            return (
                              <div key={m.colaboradorId} className="flex items-center gap-1.5">
                                <Avatar nome={colab.nome} avatar={colab.avatar} foto={colab.foto} cor={colab.cor} size={18} />
                                <span className="text-xs" style={{ color: done === total && total > 0 ? "#36C98E" : "#94a3b8" }}>
                                  {colab.nome.split(" ")[0]} {total > 0 ? `${done}/${total}` : ""}
                                </span>
                                {done === total && total > 0 && <CheckCircle2 size={11} style={{ color: "#36C98E" }} />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {t.status === "aguardando_revisao" && isAdmin && (
                        <>
                          <button onClick={() => aprovarTarefa(t.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold" style={{ background: "#36C98E20", color: "#36C98E", border: "1px solid #36C98E30" }}>
                            <CheckCircle2 size={12} /> Aprovar
                          </button>
                          <button onClick={() => rejeitarTarefa(t.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#F2545B15", color: "#F2545B" }}>
                            <AlertTriangle size={12} /> Devolver
                          </button>
                        </>
                      )}
                      {t.status !== "concluida" && t.status !== "aguardando_revisao" && canAct && (
                        <button onClick={() => atualizarStatusTarefa(t.id, "concluida")} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#36C98E15", color: "#36C98E" }}>
                          <CheckCircle2 size={12} /> Concluir
                        </button>
                      )}
                      {t.status === "pendente" && isAdmin && (
                        <button onClick={() => atualizarStatusTarefa(t.id, "em_andamento")} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#4D9DE015", color: "#4D9DE0" }}>
                          <Clock size={12} /> Iniciar
                        </button>
                      )}
                      {(t.status === "em_andamento" || t.status === "pendente") && canAct && (
                        <button onClick={() => atualizarStatusTarefa(t.id, "travado")} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#F2545B15", color: "#F2545B" }}>
                          <AlertTriangle size={12} /> Travado
                        </button>
                      )}
                      {t.status === "travado" && canAct && (
                        <button onClick={() => atualizarStatusTarefa(t.id, "em_andamento")} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#4D9DE015", color: "#4D9DE0" }}>
                          <Clock size={12} /> Retomar
                        </button>
                      )}
                      <button onClick={() => {
                        const nowExpanding = !expandida;
                        setExpandidoId(nowExpanding ? t.id : null);
                        setComentandoId(null);
                        if (nowExpanding && usuarioAtual) marcarVisualizacaoTarefa(t.id, usuarioAtual.id);
                      }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: "#1e3356", color: "#9aa7ba" }}>
                        {isElaborada ? (expandida ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <MessageSquare size={12} />}
                        {nComentarios > 0 && !isElaborada ? nComentarios : ""}
                        {isElaborada && <span>{expandida ? "Fechar" : "Detalhe"}</span>}
                      </button>
                    </div>
                  </div>

                  {/* Expandido: subtarefas (elaborada) + comentários */}
                  {expandida && (
                    <div className="mt-3 pt-3 border-t space-y-4" style={{ borderColor: "#1e3356" }}>
                      {/* Membros + subtarefas */}
                      {isElaborada && (t.membros || []).map((m) => {
                        const colab = colaboradores.find((c) => c.id === m.colaboradorId);
                        const isEuMembro = m.colaboradorId === usuarioAtual?.id;
                        if (!colab) return null;
                        return (
                          <div key={m.colaboradorId}>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Avatar nome={colab.nome} avatar={colab.avatar} foto={colab.foto} cor={colab.cor} size={24} />
                              <span className="text-sm font-semibold text-white">{colab.nome.split(" ")[0]}</span>
                              <span className="text-xs" style={{ color: "#9aa7ba" }}>{m.subtarefas.filter(s => s.concluida).length}/{m.subtarefas.length} concluidas</span>
                              {/* Contato — só mostra para outros membros, nao para si mesmo */}
                              {colab.id !== usuarioAtual?.id && colab.telefone && (
                                <>
                                  <a
                                    href={`https://wa.me/${colab.telefone.replace(/\D/g, "")}?text=Oi%20${encodeURIComponent(colab.nome.split(" ")[0])}!%20Sobre%20a%20tarefa%20%22${encodeURIComponent(t.titulo)}%22%20`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all hover:opacity-80"
                                    style={{ background: "#36C98E15", color: "#36C98E", border: "1px solid #36C98E25" }}
                                    data-tip={`WhatsApp — ${colab.nome}`}
                                  >
                                    <MessageCircle size={11} />
                                    WhatsApp
                                  </a>
                                  <a
                                    href={`tel:${colab.telefone.replace(/\D/g, "")}`}
                                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all hover:opacity-80"
                                    style={{ background: "#4D9DE015", color: "#4D9DE0", border: "1px solid #4D9DE025" }}
                                    data-tip={`Ligar — ${colab.nome}`}
                                  >
                                    <Phone size={11} />
                                    Ligar
                                  </a>
                                </>
                              )}
                            </div>
                            <div className="space-y-1 ml-8">
                              {m.subtarefas.map((s) => (
                                <button
                                  key={s.id}
                                  disabled={!isEuMembro && !isAdmin}
                                  onClick={() => (isEuMembro || isAdmin) && marcarSubtarefaTarefa(t.id, m.colaboradorId, s.id, !s.concluida)}
                                  className="w-full flex items-center gap-2 p-2 rounded-xl text-left transition-all hover:opacity-80 disabled:cursor-default"
                                  style={{ background: "#1e3356" }}
                                >
                                  {s.concluida
                                    ? <CheckCircle2 size={15} style={{ color: "#36C98E" }} />
                                    : <Circle size={15} style={{ color: "#74859c" }} />}
                                  <span className="text-sm flex-1" style={{ color: s.concluida ? "#64748b" : "#e2e8f0", textDecoration: s.concluida ? "line-through" : "none" }}>
                                    {s.titulo}
                                  </span>
                                  {!s.concluida && (isEuMembro || isAdmin) && <span className="text-xs" style={{ color: "#74859c" }}>+10 XP</span>}
                                </button>
                              ))}
                              {m.subtarefas.length === 0 && <p className="text-xs" style={{ color: "#334155" }}>Nenhuma subtarefa.</p>}
                            </div>
                          </div>
                        );
                      })}

                      {/* Mini-tarefas pessoais */}
                      {usuarioAtual && (() => {
                        const minhas = (t.miniTarefas || []).filter((m) => m.colaboradorId === usuarioAtual.id);
                        const totalOutros = isAdmin ? (t.miniTarefas || []).filter((m) => m.colaboradorId !== usuarioAtual.id).length : 0;
                        return (
                          <div className="rounded-xl p-3" style={{ background: "#0f1c30", border: "1px solid rgba(201,164,66,.16)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#74859c" }}>
                                Minhas Sub-tarefas
                              </p>
                              {isAdmin && totalOutros > 0 && (
                                <span className="text-xs" style={{ color: "#334155" }}>{totalOutros} outras (privadas)</span>
                              )}
                            </div>
                            <div className="space-y-1 mb-2">
                              {minhas.map((m) => (
                                <div key={m.id} className="flex items-center gap-2 group">
                                  <button onClick={() => toggleMiniTarefa(t.id, m.id, !m.concluida)} className="flex-shrink-0">
                                    {m.concluida
                                      ? <CheckCircle2 size={14} style={{ color: "#36C98E" }} />
                                      : <Circle size={14} style={{ color: "#74859c" }} />}
                                  </button>
                                  <span className="text-xs flex-1" style={{ color: m.concluida ? "#475569" : "#94a3b8", textDecoration: m.concluida ? "line-through" : "none" }}>
                                    {m.titulo}
                                  </span>
                                  <button onClick={() => deletarMiniTarefa(t.id, m.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#74859c" }}>
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              ))}
                              {minhas.length === 0 && <p className="text-xs" style={{ color: "#334155" }}>Nenhuma sub-tarefa pessoal ainda.</p>}
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={miniTarefaInput[t.id] || ""}
                                onChange={(e) => setMiniTarefaInput((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                placeholder="Adicionar sub-tarefa..."
                                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid #334155" }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && (miniTarefaInput[t.id] || "").trim()) {
                                    adicionarMiniTarefa(t.id, usuarioAtual.id, (miniTarefaInput[t.id] || "").trim());
                                    setMiniTarefaInput((prev) => ({ ...prev, [t.id]: "" }));
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const val = (miniTarefaInput[t.id] || "").trim();
                                  if (val) { adicionarMiniTarefa(t.id, usuarioAtual.id, val); setMiniTarefaInput((prev) => ({ ...prev, [t.id]: "" })); }
                                }}
                                disabled={!(miniTarefaInput[t.id] || "").trim()}
                                className="px-2 py-1.5 rounded-lg text-xs disabled:opacity-40"
                                style={{ background: "#c9a84c20", color: "#c9a84c" }}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Comentários */}
                      <div>
                        {isElaborada && <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#74859c" }}>Comentarios</p>}
                        {(t.comentarios || []).length === 0 && <p className="text-xs" style={{ color: "#74859c" }}>Nenhum comentário ainda.</p>}
                        {(t.comentarios || []).map((c) => {
                          const autor = colaboradores.find((col) => col.id === c.autorId);
                          return (
                            <div key={c.id} className="flex items-start gap-2 mb-2">
                              {autor && <Avatar nome={autor.nome} avatar={autor.avatar} foto={autor.foto} cor={autor.cor} size={22} />}
                              <div className="flex-1 p-2 rounded-xl" style={{ background: "#1e3356" }}>
                                <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>{autor?.nome.split(" ")[0]} </span>
                                <span className="text-xs" style={{ color: "#9aa7ba" }}>{c.criadoEm.slice(0, 10)}</span>
                                <p className="text-xs mt-0.5" style={{ color: "#e8edf5" }}>{c.texto}</p>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex gap-2 mt-2">
                          <input
                            value={comentandoId === t.id ? textoComentario : ""}
                            onChange={(e) => { setComentandoId(t.id); setTextoComentario(e.target.value); }}
                            onFocus={() => setComentandoId(t.id)}
                            placeholder="Adicionar comentário... (Enter para enviar)"
                            className="flex-1 px-3 py-2 rounded-xl text-xs text-white outline-none"
                            style={{ background: "#1e3356", border: "1px solid #334155" }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleEnviarComentario(t.id); }}
                          />
                          <button onClick={() => handleEnviarComentario(t.id)} className="px-3 py-2 rounded-xl" style={{ background: "#c9a84c20", color: "#c9a84c" }}>
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Para tarefas rápidas: expandir só comentários */}
                  {!isElaborada && expandida && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: "#1e3356" }}>
                      {(t.comentarios || []).length === 0 && <p className="text-xs mb-2" style={{ color: "#74859c" }}>Nenhum comentário ainda.</p>}
                      {(t.comentarios || []).map((c) => {
                        const autor = colaboradores.find((col) => col.id === c.autorId);
                        return (
                          <div key={c.id} className="flex items-start gap-2 mb-2">
                            {autor && <Avatar nome={autor.nome} avatar={autor.avatar} foto={autor.foto} cor={autor.cor} size={22} />}
                            <div className="flex-1 p-2 rounded-xl" style={{ background: "#1e3356" }}>
                              <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>{autor?.nome.split(" ")[0]} </span>
                              <span className="text-xs" style={{ color: "#9aa7ba" }}>{c.criadoEm.slice(0, 10)}</span>
                              <p className="text-xs mt-0.5" style={{ color: "#e8edf5" }}>{c.texto}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex gap-2 mt-2">
                        <input
                          value={comentandoId === t.id ? textoComentario : ""}
                          onChange={(e) => { setComentandoId(t.id); setTextoComentario(e.target.value); }}
                          onFocus={() => setComentandoId(t.id)}
                          placeholder="Adicionar comentário..."
                          className="flex-1 px-3 py-2 rounded-xl text-xs text-white outline-none"
                          style={{ background: "#1e3356", border: "1px solid #334155" }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleEnviarComentario(t.id); }}
                        />
                        <button onClick={() => handleEnviarComentario(t.id)} className="px-3 py-2 rounded-xl" style={{ background: "#c9a84c20", color: "#c9a84c" }}>
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      </>)}

      {/* ── Modal: Tarefa Rápida ── */}
      {rapidaAberto && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000080", backdropFilter: "blur(2px)" }} onClick={() => setRapidaAberto(false)}>
          <div className="modal-card w-full max-w-md rounded-2xl p-6 space-y-4 overflow-y-auto" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#c9a84c20" }}>
                  <Zap size={14} style={{ color: "#c9a84c" }} />
                </div>
                <h2 className="text-white font-bold">Tarefa Rápida</h2>
              </div>
              <button onClick={() => setRapidaAberto(false)} style={{ color: "#9aa7ba" }}><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={labelStyle}>Título *</label>
                <input autoFocus value={formRapida.titulo} onChange={(e) => setFormRapida({ ...formRapida, titulo: e.target.value })}
                  placeholder="O que precisa ser feito?" className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={labelStyle}>Prazo máximo *</label>
                <input type="date" value={formRapida.dataLimite} onChange={(e) => setFormRapida({ ...formRapida, dataLimite: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={labelStyle}>Prioridade</label>
                  <select value={formRapida.prioridade} onChange={(e) => setFormRapida({ ...formRapida, prioridade: e.target.value as Prioridade })}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={inputStyle}>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={labelStyle}>Loja</label>
                  <select value={formRapida.lojaId} onChange={(e) => setFormRapida({ ...formRapida, lojaId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={inputStyle}>
                    <option value="">Sem loja</option>
                    <option value="grupo-izzat">Grupo Izzat</option>
                    {LOJAS.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                {isAdmin ? (
                  <>
                    <label className="text-xs font-medium mb-1 block" style={labelStyle}>Atribuir para *</label>
                    <select value={formRapida.atribuidoPara} onChange={(e) => setFormRapida({ ...formRapida, atribuidoPara: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={inputStyle}>
                      <option value="">Selecione...</option>
                      {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome.split(" ")[0]} — {c.cargo || "Sem cargo"}</option>)}
                    </select>
                  </>
                ) : (
                  <div className="px-3 py-2 rounded-xl text-sm" style={{ background: "#0f2a1a", border: "1px solid #36C98E40", color: "#36C98E" }}>
                    Tarefa pessoal — só você vê
                  </div>
                )}
                {isAdmin && (() => {
                  const assignee = colaboradores.find((c) => c.id === formRapida.atribuidoPara);
                  if (!assignee?.horarioFim) return null;
                  const horaAtual = new Date().toTimeString().slice(0, 5);
                  const foraDoPeriodo = horaAtual > assignee.horarioFim;
                  return (
                    <div className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg text-xs"
                      style={{ background: foraDoPeriodo ? "#2a1a0f" : "#0f2a1a", border: `1px solid ${foraDoPeriodo ? "#E8A33D40" : "#36C98E40"}`, color: foraDoPeriodo ? "#E8A33D" : "#36C98E" }}>
                      <span>{foraDoPeriodo ? "⚠️" : "✓"}</span>
                      <span>{assignee.nome.split(" ")[0]} trabalha até {assignee.horarioFim}{foraDoPeriodo ? " — fora do horário" : " — disponível"}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setRapidaAberto(false)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: "#1e3356", color: "#94a3b8" }}>Cancelar</button>
              <button onClick={handleCriarRapida} disabled={!formRapida.titulo || !formRapida.atribuidoPara} className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40" style={{ background: "#c9a84c", color: "#0b1624" }}>{isAdmin ? "Delegar" : "Criar tarefa"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Tarefa Elaborada ── */}
      {elaboradaAberto && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto" style={{ background: "#00000080", backdropFilter: "blur(2px)" }} onClick={() => setElaboradaAberto(false)}>
          <div className="modal-card w-full max-w-xl rounded-2xl p-6 space-y-5 my-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#4D9DE020" }}>
                  <Users size={14} style={{ color: "#4D9DE0" }} />
                </div>
                <h2 className="text-white font-bold">Tarefa Elaborada</h2>
              </div>
              <button onClick={() => setElaboradaAberto(false)} style={{ color: "#9aa7ba" }}><X size={20} /></button>
            </div>

            {/* Campos gerais */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={labelStyle}>Título *</label>
                <input autoFocus value={formElab.titulo} onChange={(e) => setFormElab({ ...formElab, titulo: e.target.value })}
                  placeholder="Ex: Subir anúncios da Loja X" className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={labelStyle}>Descrição</label>
                <textarea value={formElab.descricao} onChange={(e) => setFormElab({ ...formElab, descricao: e.target.value })}
                  placeholder="Contexto, objetivo e resultado esperado..." rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={inputStyle} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={labelStyle}>Prazo máximo *</label>
                  <input type="date" value={formElab.dataLimite} onChange={(e) => setFormElab({ ...formElab, dataLimite: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ ...inputStyle, colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={labelStyle}>Prioridade</label>
                  <select value={formElab.prioridade} onChange={(e) => setFormElab({ ...formElab, prioridade: e.target.value as Prioridade })}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={inputStyle}>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={labelStyle}>Loja</label>
                  <select value={formElab.lojaId} onChange={(e) => setFormElab({ ...formElab, lojaId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={inputStyle}>
                    <option value="">Sem loja</option>
                    <option value="grupo-izzat">Grupo Izzat</option>
                    {LOJAS.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Membros e subtarefas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Membros e Subtarefas</p>
                <span className="text-xs" style={{ color: "#9aa7ba" }}>{membrosElab.length} membro{membrosElab.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Add member */}
              <div className="flex gap-2 mb-4">
                <select value={novoMembroId} onChange={(e) => setNovoMembroId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none" style={inputStyle}>
                  <option value="">Selecione um colaborador...</option>
                  {colaboradores.filter((c) => !membrosElab.some((m) => m.colaboradorId === c.id)).map((c) => (
                    <option key={c.id} value={c.id}>{c.nome.split(" ")[0]} — {c.cargo || "Sem cargo"}</option>
                  ))}
                </select>
                <button onClick={addMembroElab} disabled={!novoMembroId}
                  className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
                  style={{ background: "#4D9DE020", color: "#4D9DE0" }}>
                  <Plus size={16} />
                </button>
              </div>

              {membrosElab.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: "#334155" }}>Adicione pelo menos um membro para continuar.</p>
              )}

              {/* Member cards */}
              <div className="space-y-3">
                {membrosElab.map((m) => {
                  const colab = colaboradores.find((c) => c.id === m.colaboradorId);
                  if (!colab) return null;
                  return (
                    <div key={m.uid} className="rounded-xl p-3" style={{ background: "#1e3356", border: "1px solid #2d4a70" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar nome={colab.nome} avatar={colab.avatar} foto={colab.foto} cor={colab.cor} size={24} />
                          <span className="text-sm font-semibold text-white">{colab.nome.split(" ")[0]}</span>
                          <span className="text-xs" style={{ color: "#9aa7ba" }}>{colab.cargo || ""}</span>
                        </div>
                        <button onClick={() => removeMembroElab(m.uid)} className="p-1 rounded-lg" style={{ color: "#74859c" }}>
                          <X size={14} />
                        </button>
                      </div>

                      {/* Subtarefas existentes */}
                      {m.subtarefas.length > 0 && (
                        <div className="space-y-1 mb-2 ml-1">
                          {m.subtarefas.map((s) => (
                            <div key={s.uid} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: "#112239" }}>
                              <Circle size={12} style={{ color: "#74859c" }} />
                              <span className="text-xs flex-1 text-white">{s.titulo}</span>
                              <button onClick={() => removeSubtarefaElab(m.uid, s.uid)} style={{ color: "#74859c" }}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add subtask input */}
                      <div className="flex gap-2 ml-1">
                        <input
                          value={m.inputSub}
                          onChange={(ev) => setMembrosElab(membrosElab.map((x) => x.uid === m.uid ? { ...x, inputSub: ev.target.value } : x))}
                          placeholder="Adicionar subtarefa..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                          style={{ background: "#112239", border: "1px solid #334155" }}
                          onKeyDown={(ev) => { if (ev.key === "Enter") addSubtarefaElab(m.uid); }}
                        />
                        <button onClick={() => addSubtarefaElab(m.uid)} disabled={!m.inputSub.trim()}
                          className="px-2 py-1.5 rounded-lg text-xs disabled:opacity-40"
                          style={{ background: "#c9a84c20", color: "#c9a84c" }}>
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setElaboradaAberto(false)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: "#1e3356", color: "#94a3b8" }}>Cancelar</button>
              <button onClick={handleCriarElaborada} disabled={!formElab.titulo || membrosElab.length === 0}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "#4D9DE0", color: "white" }}>
                Criar Tarefa Elaborada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
