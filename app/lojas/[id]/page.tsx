"use client";
import { useAppStore } from "@/lib/store";
import { LOJAS, CAMPOS_PRODUTO, Produto, LinkRapido, Frequencia } from "@/lib/data";
import { LABEL_FREQUENCIA, ORDEM_FREQUENCIA } from "@/lib/recorrencia";
import Tabs from "@/components/Tabs";
import KanbanProdutosLoja from "@/components/KanbanProdutosLoja";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft, Store, Users, FolderOpen, Plus, X, ChevronDown,
  Trash2, Check, UserPlus, RefreshCw, CheckCircle2, Circle,
  PackageSearch, ShieldCheck, ShieldX, Globe, Share2, Copy,
  AlertTriangle, ExternalLink, ChevronRight, FileText,
  Receipt, ChevronUp, Pencil,
} from "lucide-react";
import { CategoriaGastoOp, CATEGORIA_GASTO_LABEL, GastoOperacional, TipoCusto } from "@/lib/data";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import ConexoesModal from "@/components/integracoes/ConexoesModal";
import Image from "next/image";
import ProdutoFormModal from "@/components/ProdutoFormModal";

function produtoCompleto(p: Produto): boolean {
  return CAMPOS_PRODUTO.every((c) => {
    const v = p[c.key];
    if (c.tipo === "url") return typeof v === "string" && v.trim() !== "";
    return typeof v === "number" && !isNaN(v) && v > 0;
  });
}

function camposPreenchidos(p: Produto): number {
  return CAMPOS_PRODUTO.filter((c) => {
    const v = p[c.key];
    if (c.tipo === "url") return typeof v === "string" && v.trim() !== "";
    return typeof v === "number" && !isNaN(v) && v > 0;
  }).length;
}

type StatusProduto = "todos" | "teste" | "validado" | "reprovado" | "no_ar";

type Prioridade = "alta" | "media" | "baixa";
interface SubForm { titulo: string; }
interface MembroForm { uid: string; colaboradorId: string; subtarefas: SubForm[]; }
interface TarefaForm {
  tipo: "rapida" | "elaborada"; titulo: string; contexto: string;
  atribuidoPara: string; prioridade: Prioridade; dataLimite: string; membros: MembroForm[];
}
interface RotinaForm { titulo: string; colaboradorId: string; frequencia: Frequencia; subtarefas: SubForm[]; }

function amanha() {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0];
}
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const PRI_COR: Record<string, string> = { alta: "#ef4444", media: "#f59e0b", baixa: "#64748b" };
const PRI_LABEL: Record<string, string> = { alta: "Alta", media: "Media", baixa: "Baixa" };
const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente", em_andamento: "Em andamento",
  concluida: "Concluida", atrasada: "Atrasada", aguardando_revisao: "Ag. Revisao", travado: "Travado",
};

export default function LojaPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const {
    usuarioAtual, colaboradores, rotinas, tarefas, lojasCustom,
    criarTarefa, adicionarNotificacaoInApp,
    criarRotina, marcarSubtarefa, concluirRotina, reabrirRotina,
    produtos, validarProduto, reprovarProduto, toggleProdutoNoAr,
    distribuirProduto,
    gastosOperacionais, criarGastoOp, editarGastoOp, deletarGastoOp, toggleGastoOp,
    linksRapidos, criarLinkRapido, editarLinkRapido, deletarLinkRapido,
  } = useAppStore();

  const [abaAtiva, setAbaAtiva] = useState<"visao-geral" | "produtos">("visao-geral");
  const [filtroStatusProd, setFiltroStatusProd] = useState<StatusProduto>("todos");
  const [expandidoProd, setExpandidoProd] = useState<string | null>(null);
  const [distribuirModal, setDistribuirModal] = useState<Produto | null>(null);
  const [lojasDistribuir, setLojasDistribuir] = useState<string[]>([]);
  const [distribuirSucesso, setDistribuirSucesso] = useState(false);
  const [criarProdutoModalAberto, setCriarProdutoModalAberto] = useState(false);
  const [produtoEditandoLoja, setProdutoEditandoLoja] = useState<Produto | null>(null);
  const [conexoesAberto, setConexoesAberto] = useState(false);

  // links rápidos
  const linksDropdownRef = useRef<HTMLDivElement>(null);
  const [linksDropdownAberto, setLinksDropdownAberto] = useState(false);
  const [adicionandoLink, setAdicionandoLink] = useState(false);
  const [editandoLinkId, setEditandoLinkId] = useState<string | null>(null);
  const [confirmDeleteLinkId, setConfirmDeleteLinkId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState({ nome: "", url: "", emoji: "🔗" });

  // custos panel
  const [custosPanelAberto, setCustosPanelAberto] = useState(false);
  const [custoSecaoAberta, setCustoSecaoAberta] = useState<"fixo" | "variavel" | null>(null);
  const [adicionandoCusto, setAdicionandoCusto] = useState<TipoCusto | null>(null);
  const [editandoCustoId, setEditandoCustoId] = useState<string | null>(null);
  const [confirmDeleteGastoId, setConfirmDeleteGastoId] = useState<string | null>(null);
  const [custoForm, setCustoForm] = useState({
    nome: "", categoria: "outro" as CategoriaGastoOp, valor: "",
    moeda: "BRL" as "BRL" | "USD", mes: new Date().toISOString().slice(0, 7), descricao: "",
  });

  // tarefa modal
  const [modalTarefa, setModalTarefa] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [novoMembroId, setNovoMembroId] = useState("");
  const [formTarefa, setFormTarefa] = useState<TarefaForm>({
    tipo: "rapida", titulo: "", contexto: "", atribuidoPara: "",
    prioridade: "media", dataLimite: amanha(), membros: [],
  });

  // rotina modal
  const [modalRotina, setModalRotina] = useState(false);
  const [sucessoRotina, setSucessoRotina] = useState(false);
  const [formRotina, setFormRotina] = useState<RotinaForm>({ titulo: "", colaboradorId: "", frequencia: "diaria", subtarefas: [] });

  useEffect(() => {
    if (!usuarioAtual) { router.push("/"); return; }
  }, [usuarioAtual, router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setModalTarefa(false); setModalRotina(false); setLinksDropdownAberto(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!linksDropdownAberto) return;
    function handleOutside(e: MouseEvent) {
      if (linksDropdownRef.current && !linksDropdownRef.current.contains(e.target as Node)) {
        setLinksDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [linksDropdownAberto]);

  if (!usuarioAtual) return null;

  const isAdmin = usuarioAtual.nivelAcesso === "admin";

  function salvarLink() {
    if (!linkForm.nome.trim() || !linkForm.url.trim()) return;
    const url = linkForm.url.startsWith("http") ? linkForm.url : `https://${linkForm.url}`;
    if (editandoLinkId) {
      editarLinkRapido(editandoLinkId, { nome: linkForm.nome.trim(), url, emoji: linkForm.emoji || "🔗" });
      setEditandoLinkId(null);
    } else {
      criarLinkRapido({ lojaId: id!, nome: linkForm.nome.trim(), url, emoji: linkForm.emoji || "🔗" });
    }
    setLinkForm({ nome: "", url: "", emoji: "🔗" });
    setAdicionandoLink(false);
  }

  function iniciarEdicaoLink(link: LinkRapido) {
    setEditandoLinkId(link.id);
    setLinkForm({ nome: link.nome, url: link.url, emoji: link.emoji });
    setAdicionandoLink(false);
  }
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const linksLoja = linksRapidos.filter((l) => l.lojaId === id);
  const loja = [...LOJAS, ...lojasCustom].find((l) => l.id === id);

  if (!loja) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-white font-semibold text-lg">Loja nao encontrada.</p>
        <Link href="/lojas" className="text-sm mt-2 inline-block hover:underline" style={{ color: "#c9a84c" }}>Voltar para Lojas</Link>
      </div>
    );
  }

  const responsavel = colaboradores.find((c) => c.id === loja.responsavel);
  const tarefasLoja = tarefas.filter((t) => t.lojaId === loja.id);
  const concluidas = tarefasLoja.filter((t) => t.status === "concluida").length;
  const urgentes = tarefasLoja.filter((t) => t.prioridade === "alta" && t.status !== "concluida").length;
  const pct = tarefasLoja.length ? Math.round((concluidas / tarefasLoja.length) * 100) : 0;
  const corGrupo = loja.grupo === "izzat" ? "#c9a84c" : "#3b82f6";

  const todasLojas = [...LOJAS, ...lojasCustom];

  const gastosLoja = gastosOperacionais.filter((g) => g.lojaId === loja.id);
  const gastosFixos = gastosLoja.filter((g) => g.tipo === "fixo" && g.ativo);
  const gastosVariaveis = gastosLoja.filter((g) => g.tipo === "variavel" && g.ativo);
  const mesAtual = new Date().toISOString().slice(0, 7);
  const totalFixo = gastosFixos.reduce((sum, g) => sum + g.valor, 0);
  const totalVariavel = gastosVariaveis.filter((g) => g.mes === mesAtual).reduce((sum, g) => sum + g.valor, 0);

  function salvarCusto(tipo: TipoCusto) {
    const valor = parseFloat(custoForm.valor.replace(",", "."));
    if (!custoForm.nome.trim() || isNaN(valor) || valor <= 0) return;
    const base = {
      lojaId: loja!.id,
      nome: custoForm.nome.trim(),
      tipo,
      categoria: custoForm.categoria,
      valor,
      moeda: custoForm.moeda,
      ativo: true,
      descricao: custoForm.descricao.trim() || undefined,
      mes: tipo === "variavel" ? custoForm.mes : undefined,
    };
    if (editandoCustoId) {
      editarGastoOp(editandoCustoId, base);
      setEditandoCustoId(null);
    } else {
      criarGastoOp(base);
    }
    setCustoForm({ nome: "", categoria: "outro", valor: "", moeda: "BRL", mes: mesAtual, descricao: "" });
    setAdicionandoCusto(null);
  }

  function iniciarEdicaoCusto(g: GastoOperacional) {
    setEditandoCustoId(g.id);
    setCustoForm({
      nome: g.nome,
      categoria: g.categoria,
      valor: g.valor.toString(),
      moeda: g.moeda,
      mes: g.mes ?? mesAtual,
      descricao: g.descricao ?? "",
    });
    setAdicionandoCusto(g.tipo);
    setCustoSecaoAberta(g.tipo);
    setCustosPanelAberto(true);
  }

  const produtosLoja = produtos.filter((p) => p.lojaId === loja.id);
  const produtosFiltrados = produtosLoja.filter((p) => {
    if (filtroStatusProd === "todos") return true;
    if (filtroStatusProd === "teste") return !p.validado && !p.reprovado && !p.produtoOrigemId;
    if (filtroStatusProd === "validado") return !!p.validado;
    if (filtroStatusProd === "reprovado") return !!p.reprovado;
    if (filtroStatusProd === "no_ar") return p.noAr;
    return true;
  });

  function handleToggleNoArLoja(p: Produto) {
    if (!p.noAr && !produtoCompleto(p)) return;
    toggleProdutoNoAr(p.id);
  }

  function abrirDistribuirLoja(p: Produto) {
    setLojasDistribuir([]);
    setDistribuirSucesso(false);
    setDistribuirModal(p);
  }

  function handleDistribuirLoja() {
    if (!distribuirModal || lojasDistribuir.length === 0) return;
    distribuirProduto(distribuirModal.id, lojasDistribuir);
    setDistribuirSucesso(true);
    setTimeout(() => setDistribuirModal(null), 1500);
  }

  // Rotinas da loja: lista própria filtrada por lojaId (sobrevive à saída da pessoa)
  const rotinasLoja = rotinas.filter((r) => r.lojaId === loja.id && r.ativa !== false);

  const tarefasPorStatus = [
    { label: "Pendentes", status: "pendente", cor: "#64748b" },
    { label: "Em andamento", status: "em_andamento", cor: "#3b82f6" },
    { label: "Concluidas", status: "concluida", cor: "#10b981" },
    { label: "Atrasadas", status: "atrasada", cor: "#ef4444" },
  ].map((s) => ({ ...s, count: tarefasLoja.filter((t) => t.status === s.status).length }));

  // ── Tarefa helpers ──
  function abrirModalTarefa() {
    const membroInicial = loja!.responsavel ? [{ uid: uid(), colaboradorId: loja!.responsavel, subtarefas: [] }] : [];
    setFormTarefa({ tipo: "rapida", titulo: "", contexto: "", atribuidoPara: loja!.responsavel || "", prioridade: "media", dataLimite: amanha(), membros: membroInicial });
    setNovoMembroId(""); setSucesso(false); setModalTarefa(true);
  }
  function addMembro() {
    if (!novoMembroId || formTarefa.membros.some((m) => m.colaboradorId === novoMembroId)) return;
    setFormTarefa((f) => ({ ...f, membros: [...f.membros, { uid: uid(), colaboradorId: novoMembroId, subtarefas: [] }] }));
    setNovoMembroId("");
  }
  function rmMembro(mUid: string) { setFormTarefa((f) => ({ ...f, membros: f.membros.filter((m) => m.uid !== mUid) })); }
  function addSubMembro(mUid: string) {
    setFormTarefa((f) => ({ ...f, membros: f.membros.map((m) => m.uid !== mUid ? m : { ...m, subtarefas: [...m.subtarefas, { titulo: "" }] }) }));
  }
  function updSubMembro(mUid: string, i: number, v: string) {
    setFormTarefa((f) => ({ ...f, membros: f.membros.map((m) => { if (m.uid !== mUid) return m; const subs = [...m.subtarefas]; subs[i] = { titulo: v }; return { ...m, subtarefas: subs }; }) }));
  }
  function rmSubMembro(mUid: string, i: number) {
    setFormTarefa((f) => ({ ...f, membros: f.membros.map((m) => m.uid !== mUid ? m : { ...m, subtarefas: m.subtarefas.filter((_, idx) => idx !== i) }) }));
  }
  function handleCriarTarefa() {
    if (!formTarefa.titulo.trim() || !loja || !usuarioAtual) return;
    const atrib = formTarefa.atribuidoPara || loja.responsavel || "";
    criarTarefa({
      titulo: formTarefa.titulo.trim(), descricao: formTarefa.contexto.trim() || undefined,
      tipo: formTarefa.tipo, prioridade: formTarefa.prioridade, status: "pendente",
      atribuidoPara: atrib, criadoPor: usuarioAtual.id, lojaId: loja.id,
      dataLimite: formTarefa.dataLimite || undefined,
      membros: formTarefa.tipo === "elaborada" && formTarefa.membros.length > 0
        ? formTarefa.membros.map((m, mi) => ({
            colaboradorId: m.colaboradorId,
            subtarefas: m.subtarefas.filter((s) => s.titulo.trim()).map((s, si) => ({ id: `sub-${Date.now()}-${mi}-${si}`, titulo: s.titulo.trim(), concluida: false })),
          }))
        : undefined,
    });
    const contextoParte = formTarefa.contexto.trim() ? ` — ${formTarefa.contexto.trim()}` : "";
    const notificados = formTarefa.tipo === "elaborada"
      ? formTarefa.membros.map((m) => m.colaboradorId).filter((cid) => cid !== usuarioAtual.id)
      : atrib !== usuarioAtual.id ? [atrib] : [];
    notificados.forEach((cid) => adicionarNotificacaoInApp({
      paraId: cid, tipo: "tarefa_nova", titulo: `Nova tarefa em ${loja!.nome}`,
      corpo: `"${formTarefa.titulo.trim()}"${contextoParte}. Prazo: ${formTarefa.dataLimite || "sem prazo"}.`, href: "/tarefas",
    }));
    setSucesso(true); setTimeout(() => setModalTarefa(false), 1600);
  }

  // ── Rotina helpers ──
  function abrirModalRotina() {
    setFormRotina({ titulo: "", colaboradorId: loja!.responsavel || "", frequencia: "diaria", subtarefas: [] });
    setSucessoRotina(false); setModalRotina(true);
  }
  function addSubRotina() { setFormRotina((f) => ({ ...f, subtarefas: [...f.subtarefas, { titulo: "" }] })); }
  function updSubRotina(i: number, v: string) {
    setFormRotina((f) => { const s = [...f.subtarefas]; s[i] = { titulo: v }; return { ...f, subtarefas: s }; });
  }
  function rmSubRotina(i: number) { setFormRotina((f) => ({ ...f, subtarefas: f.subtarefas.filter((_, idx) => idx !== i) })); }
  function handleCriarRotina() {
    if (!formRotina.titulo.trim()) return;
    criarRotina({
      titulo: formRotina.titulo.trim(),
      lojaId: loja!.id,
      colaboradorId: formRotina.colaboradorId || undefined,
      frequencia: formRotina.frequencia,
      concluida: false,
      ativa: true,
      criadoPor: usuarioAtual?.id ?? "",
      subtarefas: formRotina.subtarefas.filter((s) => s.titulo.trim()).map((s, i) => ({
        id: `rsub-${Date.now()}-${i}`,
        titulo: s.titulo.trim(),
        concluida: false,
      })),
    });
    setSucessoRotina(true); setTimeout(() => setModalRotina(false), 1400);
  }

  const membrosDisponiveis = colaboradores.filter((c) => !formTarefa.membros.some((m) => m.colaboradorId === c.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/lojas" className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70" style={{ color: "#9aa7ba" }}>
        <ArrowLeft size={16} /> Voltar para Lojas
      </Link>

      {/* Header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: `1px solid ${corGrupo}40` }}>
        <div className="h-40 flex items-center justify-center relative" style={{ background: loja.corFundo || "#1e3356" }}>
          {loja.logo ? (
            <Image src={loja.logo} alt={loja.nome} width={128} height={128} className="object-contain" style={{ maxHeight: 96, maxWidth: 180 }} unoptimized />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Store size={48} style={{ color: "#c9a84c" }} />
              <span className="text-white font-bold text-xl">{loja.nome}</span>
            </div>
          )}
          <span className="absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: `${corGrupo}30`, color: corGrupo, border: `1px solid ${corGrupo}50`, backdropFilter: "blur(4px)" }}>
            {loja.grupo === "izzat" ? "Grupo Izzat" : "Partner"}
          </span>
          <span className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: "#0b162480", color: "#94a3b8", border: "1px solid rgba(201,164,66,.16)80" }}>
            {loja.mercado === "global" ? "Global" : "Brasil"}
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{loja.nome}</h1>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {isAdmin && (
                <>
                  <button onClick={abrirModalRotina}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: "#1e3356", border: "1px solid #334155", color: "#94a3b8" }}>
                    <RefreshCw size={14} /> Nova Rotina
                  </button>
                  <button onClick={abrirModalTarefa}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: corGrupo, color: corGrupo === "#c9a84c" ? "#000" : "#fff" }}>
                    <Plus size={15} /> Nova Tarefa
                  </button>
                </>
              )}
              <Link href={`/precificacao?loja=${loja.id}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "#1e3356", border: "1px solid #334155", color: "#94a3b8" }}>
                🧮 Precificar produto
              </Link>
              <button onClick={() => setConexoesAberto(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "#1e3356", border: "1px solid #334155", color: "#94a3b8" }}>
                🔗 Conexões
              </button>
              {/* LinkRapido dropdown */}
              <div className="relative" ref={linksDropdownRef}>
                <button
                  onClick={() => setLinksDropdownAberto((v) => !v)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{
                    background: linksDropdownAberto ? "#c9a84c22" : "#1e3356",
                    border: `1px solid ${linksDropdownAberto ? "#c9a84c50" : "#334155"}`,
                    color: "#c9a84c",
                  }}
                >
                  <FolderOpen size={15} /> Links
                  <ChevronDown size={12} style={{ transform: linksDropdownAberto ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                </button>

                {linksDropdownAberto && (
                  <div className="absolute right-0 top-full mt-1 w-64 rounded-xl overflow-hidden z-30"
                    style={{ background: "#0b1624", border: "1px solid #334155", boxShadow: "0 8px 32px #00000080" }}>

                    {linksLoja.length === 0 && !adicionandoLink && (
                      <div className="px-4 py-4 text-center">
                        <p className="text-xs" style={{ color: "#74859c" }}>Nenhum link cadastrado</p>
                        {!isAdmin && <p className="text-xs mt-1" style={{ color: "#334155" }}>Peça ao admin para adicionar links</p>}
                      </div>
                    )}

                    {linksLoja.map((link) => (
                      <div key={link.id} className="group flex items-center gap-2 px-3 py-2.5 transition-all hover:bg-white/5" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
                        {editandoLinkId === link.id ? (
                          <div className="flex-1 space-y-1.5">
                            <div className="flex gap-1.5">
                              <input
                                value={linkForm.emoji}
                                onChange={(e) => setLinkForm((f) => ({ ...f, emoji: e.target.value }))}
                                className="w-10 px-1.5 py-1 rounded-lg text-center text-sm outline-none"
                                style={{ background: "#112239", border: "1px solid #334155", color: "#fff" }}
                              />
                              <input
                                value={linkForm.nome}
                                onChange={(e) => setLinkForm((f) => ({ ...f, nome: e.target.value }))}
                                placeholder="Nome"
                                className="flex-1 px-2 py-1 rounded-lg text-xs text-white outline-none"
                                style={{ background: "#112239", border: "1px solid #334155" }}
                                autoFocus
                              />
                            </div>
                            <input
                              value={linkForm.url}
                              onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                              placeholder="https://..."
                              className="w-full px-2 py-1 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#112239", border: "1px solid #334155" }}
                            />
                            <div className="flex gap-1.5">
                              <button onClick={salvarLink} className="flex-1 py-1 rounded-lg text-xs font-bold" style={{ background: "#c9a84c", color: "#000" }}>Salvar</button>
                              <button onClick={() => { setEditandoLinkId(null); setLinkForm({ nome: "", url: "", emoji: "🔗" }); }} className="px-2 py-1 rounded-lg text-xs" style={{ background: "#1e3356", color: "#9aa7ba" }}>✕</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <a href={link.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                              <span className="text-base flex-shrink-0">{link.emoji}</span>
                              <span className="text-sm text-white truncate">{link.nome}</span>
                              <ExternalLink size={10} className="flex-shrink-0 ml-auto" style={{ color: "#74859c" }} />
                            </a>
                            {isAdmin && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                {confirmDeleteLinkId === link.id ? (
                                  <>
                                    <button onClick={() => { deletarLinkRapido(link.id); setConfirmDeleteLinkId(null); }} className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "#ef444430", color: "#ef4444" }}>Sim</button>
                                    <button onClick={() => setConfirmDeleteLinkId(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1e3356", color: "#9aa7ba" }}>Não</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => iniciarEdicaoLink(link)} className="p-1 rounded hover:bg-white/10" style={{ color: "#9aa7ba" }}><Pencil size={10} /></button>
                                    <button onClick={() => setConfirmDeleteLinkId(link.id)} className="p-1 rounded hover:bg-white/10" style={{ color: "#ef4444" }}><X size={10} /></button>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {isAdmin && adicionandoLink && (
                      <div className="p-3 space-y-1.5" style={{ borderTop: linksLoja.length > 0 ? "1px solid rgba(201,164,66,.16)" : "none" }}>
                        <div className="flex gap-1.5">
                          <input
                            value={linkForm.emoji}
                            onChange={(e) => setLinkForm((f) => ({ ...f, emoji: e.target.value }))}
                            className="w-10 px-1.5 py-1.5 rounded-lg text-center text-sm outline-none"
                            style={{ background: "#112239", border: "1px solid #334155", color: "#fff" }}
                            placeholder="🔗"
                          />
                          <input
                            value={linkForm.nome}
                            onChange={(e) => setLinkForm((f) => ({ ...f, nome: e.target.value }))}
                            placeholder="Nome do link"
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: "#112239", border: "1px solid #334155" }}
                            autoFocus
                          />
                        </div>
                        <input
                          value={linkForm.url}
                          onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                          style={{ background: "#112239", border: "1px solid #334155" }}
                          onKeyDown={(e) => e.key === "Enter" && salvarLink()}
                        />
                        <div className="flex gap-1.5">
                          <button onClick={salvarLink} className="flex-1 py-1.5 rounded-lg text-xs font-bold" style={{ background: "#c9a84c", color: "#000" }}>Adicionar</button>
                          <button onClick={() => { setAdicionandoLink(false); setLinkForm({ nome: "", url: "", emoji: "🔗" }); }} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "#1e3356", color: "#9aa7ba" }}>Cancelar</button>
                        </div>
                      </div>
                    )}

                    {isAdmin && !adicionandoLink && (
                      <button
                        onClick={() => setAdicionandoLink(true)}
                        className="w-full flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-all hover:bg-white/5"
                        style={{ color: "#c9a84c", borderTop: linksLoja.length > 0 || (!linksLoja.length && !adicionandoLink) ? "1px solid rgba(201,164,66,.16)" : "none" }}
                      >
                        <Plus size={12} /> Adicionar link
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setCustosPanelAberto((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: custosPanelAberto ? "#10b98122" : "#1e3356",
                  border: `1px solid ${custosPanelAberto ? "#10b98150" : "#334155"}`,
                  color: custosPanelAberto ? "#10b981" : "#94a3b8",
                }}
              >
                <Receipt size={15} />
                Custos
                {(totalFixo + totalVariavel) > 0 ? (
                  <span className="text-xs font-bold" style={{ color: custosPanelAberto ? "#10b981" : "#c9a84c" }}>
                    R$ {(totalFixo + totalVariavel).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                ) : gastosLoja.length === 0 ? (
                  <span className="text-xs" style={{ color: "#74859c" }}>vazio</span>
                ) : null}
                {custosPanelAberto ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {loja.descricao && <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>{loja.descricao}</p>}

          {/* Painel de Custos */}
          {custosPanelAberto && (
            <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(201,164,66,.16)", background: "#0a1a2e" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
                <div className="flex items-center gap-2">
                  <Receipt size={14} style={{ color: "#10b981" }} />
                  <span className="text-sm font-bold text-white">Custos Operacionais</span>
                </div>
                <div className="flex items-center gap-3">
                  {totalFixo > 0 && (
                    <span className="text-xs" style={{ color: "#9aa7ba" }}>
                      Fixo: <span style={{ color: "#10b981" }}>R$ {totalFixo.toFixed(2)}</span>
                    </span>
                  )}
                  {totalVariavel > 0 && (
                    <span className="text-xs" style={{ color: "#9aa7ba" }}>
                      Variável/mês: <span style={{ color: "#f59e0b" }}>R$ {totalVariavel.toFixed(2)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Seção Fixos */}
              <div style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
                <button
                  onClick={() => setCustoSecaoAberta((v) => v === "fixo" ? null : "fixo")}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "#10b981" }}>FIXOS</span>
                    <span className="text-xs px-1.5 rounded-full" style={{ background: "#10b98118", color: "#10b981" }}>
                      {gastosLoja.filter((g) => g.tipo === "fixo").length}
                    </span>
                    <span className="text-xs" style={{ color: "#74859c" }}>Claude AI, Workspace, plataformas…</span>
                  </div>
                  {custoSecaoAberta === "fixo" ? <ChevronUp size={12} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={12} style={{ color: "#9aa7ba" }} />}
                </button>

                {custoSecaoAberta === "fixo" && (
                  <div className="px-4 pb-3 space-y-1.5">
                    {gastosLoja.filter((g) => g.tipo === "fixo").map((g) => (
                      <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${g.ativo ? "text-white" : "line-through"}`} style={{ color: g.ativo ? "#fff" : "#475569" }}>{g.nome}</span>
                            <span className="text-xs px-1.5 py-0 rounded-full" style={{ background: "#1e3356", color: "#9aa7ba" }}>
                              {CATEGORIA_GASTO_LABEL[g.categoria]}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: g.ativo ? "#10b981" : "#475569" }}>
                          {g.moeda} {g.valor.toFixed(2)}
                        </span>
                        {isAdmin && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {confirmDeleteGastoId === g.id ? (
                              <>
                                <span className="text-xs" style={{ color: "#ef4444" }}>Apagar?</span>
                                <button onClick={() => { deletarGastoOp(g.id); setConfirmDeleteGastoId(null); }} className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "#ef444430", color: "#ef4444" }}>Sim</button>
                                <button onClick={() => setConfirmDeleteGastoId(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1e3356", color: "#9aa7ba" }}>Não</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => iniciarEdicaoCusto(g)} className="p-1 rounded hover:bg-white/10" style={{ color: "#9aa7ba" }}>
                                  <Pencil size={10} />
                                </button>
                                <button onClick={() => toggleGastoOp(g.id)} className="p-1 rounded hover:bg-white/10" style={{ color: g.ativo ? "#64748b" : "#10b981" }} data-tip={g.ativo ? "Desativar" : "Ativar"}>
                                  <Check size={10} />
                                </button>
                                <button onClick={() => setConfirmDeleteGastoId(g.id)} className="p-1 rounded hover:bg-white/10" style={{ color: "#ef4444" }}>
                                  <X size={10} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {gastosLoja.filter((g) => g.tipo === "fixo").length === 0 && (
                      <p className="text-xs py-2" style={{ color: "#334155" }}>Nenhum custo fixo cadastrado.</p>
                    )}

                    {isAdmin && (
                      adicionandoCusto === "fixo" ? (
                        <div className="rounded-xl p-3 space-y-2" style={{ background: "#112239", border: "1px solid #3b82f640" }}>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              placeholder="Nome (ex: Claude AI)"
                              value={custoForm.nome}
                              onChange={(e) => setCustoForm((f) => ({ ...f, nome: e.target.value }))}
                            />
                            <input
                              className="w-24 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              placeholder="Valor"
                              value={custoForm.valor}
                              onChange={(e) => setCustoForm((f) => ({ ...f, valor: e.target.value }))}
                            />
                            <select
                              className="px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              value={custoForm.moeda}
                              onChange={(e) => setCustoForm((f) => ({ ...f, moeda: e.target.value as "BRL" | "USD" }))}
                            >
                              <option value="BRL">BRL</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <select
                              className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              value={custoForm.categoria}
                              onChange={(e) => setCustoForm((f) => ({ ...f, categoria: e.target.value as CategoriaGastoOp }))}
                            >
                              {(Object.entries(CATEGORIA_GASTO_LABEL) as [CategoriaGastoOp, string][]).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => salvarCusto("fixo")}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: "#10b981", color: "#fff" }}
                            >
                              {editandoCustoId ? "Salvar" : "Adicionar"}
                            </button>
                            <button
                              onClick={() => { setAdicionandoCusto(null); setEditandoCustoId(null); setCustoForm({ nome: "", categoria: "outro", valor: "", moeda: "BRL", mes: mesAtual, descricao: "" }); }}
                              className="px-2 py-1.5 rounded-lg text-xs"
                              style={{ background: "#1e3356", color: "#9aa7ba" }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAdicionandoCusto("fixo"); setEditandoCustoId(null); setCustoForm({ nome: "", categoria: "ia_tools", valor: "", moeda: "BRL", mes: mesAtual, descricao: "" }); }}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{ color: "#10b981", background: "#10b98112", border: "1px dashed #10b98140" }}
                        >
                          <Plus size={11} /> Adicionar custo fixo
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Seção Variáveis */}
              <div>
                <button
                  onClick={() => setCustoSecaoAberta((v) => v === "variavel" ? null : "variavel")}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>VARIÁVEIS</span>
                    <span className="text-xs px-1.5 rounded-full" style={{ background: "#f59e0b18", color: "#f59e0b" }}>
                      {gastosLoja.filter((g) => g.tipo === "variavel").length}
                    </span>
                    <span className="text-xs" style={{ color: "#74859c" }}>Meta Ads, TikTok, campanhas…</span>
                  </div>
                  {custoSecaoAberta === "variavel" ? <ChevronUp size={12} style={{ color: "#9aa7ba" }} /> : <ChevronDown size={12} style={{ color: "#9aa7ba" }} />}
                </button>

                {custoSecaoAberta === "variavel" && (
                  <div className="px-4 pb-3 space-y-1.5">
                    {gastosLoja.filter((g) => g.tipo === "variavel").map((g) => (
                      <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{g.nome}</span>
                            <span className="text-xs px-1.5 py-0 rounded-full" style={{ background: "#1e3356", color: "#9aa7ba" }}>
                              {CATEGORIA_GASTO_LABEL[g.categoria]}
                            </span>
                            {g.mes && (
                              <span className="text-xs" style={{ color: "#74859c" }}>{g.mes}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: "#f59e0b" }}>
                          {g.moeda} {g.valor.toFixed(2)}
                        </span>
                        {isAdmin && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {confirmDeleteGastoId === g.id ? (
                              <>
                                <span className="text-xs" style={{ color: "#ef4444" }}>Apagar?</span>
                                <button onClick={() => { deletarGastoOp(g.id); setConfirmDeleteGastoId(null); }} className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "#ef444430", color: "#ef4444" }}>Sim</button>
                                <button onClick={() => setConfirmDeleteGastoId(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1e3356", color: "#9aa7ba" }}>Não</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => iniciarEdicaoCusto(g)} className="p-1 rounded hover:bg-white/10" style={{ color: "#9aa7ba" }}>
                                  <Pencil size={10} />
                                </button>
                                <button onClick={() => setConfirmDeleteGastoId(g.id)} className="p-1 rounded hover:bg-white/10" style={{ color: "#ef4444" }}>
                                  <X size={10} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {gastosLoja.filter((g) => g.tipo === "variavel").length === 0 && (
                      <p className="text-xs py-2" style={{ color: "#334155" }}>Nenhum gasto variável cadastrado.</p>
                    )}

                    {isAdmin && (
                      adicionandoCusto === "variavel" ? (
                        <div className="rounded-xl p-3 space-y-2" style={{ background: "#112239", border: "1px solid #f59e0b40" }}>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              placeholder="Nome (ex: Meta Ads)"
                              value={custoForm.nome}
                              onChange={(e) => setCustoForm((f) => ({ ...f, nome: e.target.value }))}
                            />
                            <input
                              className="w-24 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              placeholder="Valor"
                              value={custoForm.valor}
                              onChange={(e) => setCustoForm((f) => ({ ...f, valor: e.target.value }))}
                            />
                            <select
                              className="px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              value={custoForm.moeda}
                              onChange={(e) => setCustoForm((f) => ({ ...f, moeda: e.target.value as "BRL" | "USD" }))}
                            >
                              <option value="BRL">BRL</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="month"
                              className="px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              value={custoForm.mes}
                              onChange={(e) => setCustoForm((f) => ({ ...f, mes: e.target.value }))}
                            />
                            <select
                              className="flex-1 px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                              style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                              value={custoForm.categoria}
                              onChange={(e) => setCustoForm((f) => ({ ...f, categoria: e.target.value as CategoriaGastoOp }))}
                            >
                              {(Object.entries(CATEGORIA_GASTO_LABEL) as [CategoriaGastoOp, string][]).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => salvarCusto("variavel")}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold"
                              style={{ background: "#f59e0b", color: "#000" }}
                            >
                              {editandoCustoId ? "Salvar" : "Adicionar"}
                            </button>
                            <button
                              onClick={() => { setAdicionandoCusto(null); setEditandoCustoId(null); setCustoForm({ nome: "", categoria: "outro", valor: "", moeda: "BRL", mes: mesAtual, descricao: "" }); }}
                              className="px-2 py-1.5 rounded-lg text-xs"
                              style={{ background: "#1e3356", color: "#9aa7ba" }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAdicionandoCusto("variavel"); setEditandoCustoId(null); setCustoForm({ nome: "", categoria: "trafego_pago", valor: "", moeda: "BRL", mes: mesAtual, descricao: "" }); }}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{ color: "#f59e0b", background: "#f59e0b12", border: "1px dashed #f59e0b40" }}
                        >
                          <Plus size={11} /> Adicionar gasto variável
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-wider mr-1" style={{ color: "#9aa7ba" }}>Responsavel:</p>
            {responsavel ? (
              <Link href={`/equipe/${responsavel.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar nome={responsavel.nome} avatar={responsavel.avatar} foto={responsavel.foto} cor={responsavel.cor} size={32} />
                <div>
                  <p className="text-sm text-white leading-tight">{responsavel.nome}</p>
                  <p className="text-xs" style={{ color: "#9aa7ba" }}>{responsavel.cargo}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1e3356" }}>
                  <Users size={14} style={{ color: "#74859c" }} />
                </div>
                <span className="text-sm" style={{ color: "#74859c" }}>Sem responsavel</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 380 }}>
        <Tabs
          value={abaAtiva}
          onChange={setAbaAtiva}
          accent={corGrupo}
          tabs={[
            { id: "visao-geral", label: "Visão Geral", dica: "Resumo da loja: tarefas, rotinas, links, gastos e métricas" },
            { id: "produtos", label: "Produtos", count: produtosLoja.length, dica: "Catálogo de produtos desta loja no pipeline de validação" },
          ]}
        />
      </div>

      {/* ── ABA PRODUTOS ── */}
      {abaAtiva === "produtos" && (
        <div className="space-y-4">
          {/* Kanban desta loja (status por loja, arrastável) */}
          <div className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
            <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <PackageSearch size={15} style={{ color: corGrupo }} /> Pipeline de produtos · {loja.nome}
            </p>
            <KanbanProdutosLoja lojaId={loja.id} todasLojas={[...LOJAS, ...lojasCustom]} />
          </div>

          {/* Header aba com botao novo produto */}
          {isAdmin && (
            <div className="flex justify-end">
              <button
                onClick={() => setCriarProdutoModalAberto(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: corGrupo, color: corGrupo === "#c9a84c" ? "#0b1624" : "#fff" }}
              >
                <Plus size={14} /> Novo Produto
              </button>
            </div>
          )}

          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Em Teste", count: produtosLoja.filter((p) => !p.validado && !p.reprovado && !p.produtoOrigemId).length, cor: "#f59e0b", bg: "#f59e0b15" },
              { label: "Validados", count: produtosLoja.filter((p) => !!p.validado).length, cor: "#3b82f6", bg: "#3b82f615" },
              { label: "Reprovados", count: produtosLoja.filter((p) => !!p.reprovado).length, cor: "#ef4444", bg: "#ef444415" },
              { label: "No Ar", count: produtosLoja.filter((p) => p.noAr).length, cor: "#10b981", bg: "#10b98115" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg, border: `1px solid ${s.cor}30` }}>
                <p className="font-extrabold" style={{ fontSize: 28, letterSpacing: "-0.5px", lineHeight: 1, color: s.cor }}>{s.count}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: "#9aa7ba" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros status */}
          <div className="flex gap-2 flex-wrap">
            {([
              { v: "todos", label: "Todos", cor: "#64748b" },
              { v: "teste", label: "Em Teste", cor: "#f59e0b" },
              { v: "validado", label: "Validados", cor: "#3b82f6" },
              { v: "reprovado", label: "Reprovados", cor: "#ef4444" },
              { v: "no_ar", label: "No Ar", cor: "#10b981" },
            ] as const).map((f) => (
              <button
                key={f.v}
                onClick={() => setFiltroStatusProd(f.v)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: filtroStatusProd === f.v ? f.cor + "22" : "#112239",
                  color: filtroStatusProd === f.v ? f.cor : "#64748b",
                  border: `1px solid ${filtroStatusProd === f.v ? f.cor + "60" : "#1e3356"}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista */}
          {produtosFiltrados.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
              <PackageSearch size={28} className="mx-auto mb-3" style={{ color: "#334155" }} />
              <p className="text-white font-medium mb-1">Nenhum produto neste filtro</p>
              <Link href="/catalogo" className="text-xs hover:underline" style={{ color: corGrupo }}>
                Cadastrar produto no Catalogo
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {produtosFiltrados.map((p) => {
                const preenchidos = camposPreenchidos(p);
                const completo = preenchidos === CAMPOS_PRODUTO.length;
                const pctProd = Math.round((preenchidos / CAMPOS_PRODUTO.length) * 100);
                const aberto = expandidoProd === p.id;
                const jaDistribuido = p.distribuidoPara ?? [];
                const lojasDisp = todasLojas.filter((l) => l.id !== p.lojaId && !jaDistribuido.includes(l.id));

                const statusCor = p.reprovado ? "#ef4444" : p.noAr ? "#10b981" : p.validado ? "#3b82f6" : completo ? "#c9a84c" : "#f59e0b";
                const statusLabel = p.reprovado ? "Reprovado" : p.noAr ? "No Ar" : p.validado ? "Validado" : completo ? "Pronto" : "Em Teste";

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "#112239", border: `1px solid ${statusCor}30` }}
                  >
                    <div className="p-3 flex items-center gap-3 flex-wrap">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusCor }} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{p.nome}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: statusCor + "20", color: statusCor }}>
                            {statusLabel}
                          </span>
                          {p.produtoOrigemId && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#8b5cf620", color: "#8b5cf6" }}>
                              <Copy size={8} /> Copia
                            </span>
                          )}
                          {jaDistribuido.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#10b98115", color: "#10b981" }}>
                              <Share2 size={8} /> {jaDistribuido.length} {jaDistribuido.length === 1 ? "loja" : "lojas"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                            <div className="h-full rounded-full" style={{ width: `${pctProd}%`, background: completo ? statusCor : "#f59e0b" }} />
                          </div>
                          <span className="text-xs" style={{ color: "#74859c" }}>{preenchidos}/{CAMPOS_PRODUTO.length}</span>
                        </div>
                      </div>

                      {/* Acoes */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                        {isAdmin && !p.validado && !p.reprovado && !p.produtoOrigemId && completo && p.noAr && (
                          <>
                            <button
                              onClick={() => validarProduto(p.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                              style={{ background: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f640" }}
                            >
                              <ShieldCheck size={10} /> Validar
                            </button>
                            <button
                              onClick={() => reprovarProduto(p.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                              style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}
                            >
                              <ShieldX size={10} /> Reprovar
                            </button>
                          </>
                        )}
                        {p.reprovado && isAdmin && (
                          <button
                            onClick={() => validarProduto(p.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ background: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f640" }}
                          >
                            <ShieldCheck size={10} /> Revalidar
                          </button>
                        )}
                        {isAdmin && p.validado && !p.produtoOrigemId && lojasDisp.length > 0 && (
                          <button
                            onClick={() => abrirDistribuirLoja(p)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ background: "#8b5cf620", color: "#8b5cf6", border: "1px solid #8b5cf640" }}
                          >
                            <Share2 size={10} /> Distribuir
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleNoArLoja(p)}
                          disabled={!completo && !p.noAr}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-40"
                          style={{
                            background: p.noAr ? "#10b98120" : completo ? "#c9a84c20" : "#1e3356",
                            color: p.noAr ? "#10b981" : completo ? "#c9a84c" : "#475569",
                            border: `1px solid ${p.noAr ? "#10b98140" : completo ? "#c9a84c40" : "#334155"}`,
                          }}
                        >
                          {p.noAr ? <><Check size={9} /> Ar</> : <><Globe size={9} /> Ar</>}
                        </button>
                        <button
                          onClick={() => setExpandidoProd(aberto ? null : p.id)}
                          className="p-1 rounded-lg hover:bg-slate-800"
                          style={{ color: "#9aa7ba" }}
                        >
                          <ChevronDown size={13} style={{ transform: aberto ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                        </button>
                      </div>
                    </div>

                    {/* Checklist expandida */}
                    {aberto && (
                      <div className="px-3 pb-3 border-t" style={{ borderColor: "#1e3356" }}>
                        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {CAMPOS_PRODUTO.map((campo) => {
                            const val = p[campo.key];
                            const preenchido =
                              campo.tipo === "url"
                                ? typeof val === "string" && val.trim() !== ""
                                : typeof val === "number" && !isNaN(val) && val > 0;
                            return (
                              <div
                                key={campo.key}
                                className="flex items-center gap-2 p-2 rounded-lg"
                                style={{ background: preenchido ? "#10b98108" : "#0b162480", border: `1px solid ${preenchido ? "#10b98120" : "#1e3356"}` }}
                              >
                                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: preenchido ? "#10b98130" : "#ef444420" }}>
                                  {preenchido ? <Check size={8} style={{ color: "#10b981" }} /> : <X size={8} style={{ color: "#ef4444" }} />}
                                </div>
                                <span className="text-xs flex-1" style={{ color: preenchido ? "#94a3b8" : "#ef4444" }}>{campo.label}</span>
                                {preenchido && campo.tipo === "url" && typeof val === "string" && (
                                  <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: "#c9a84c" }}>
                                    <ExternalLink size={9} />
                                  </a>
                                )}
                                {preenchido && campo.tipo !== "url" && (
                                  <span className="text-xs font-mono" style={{ color: "#9aa7ba" }}>
                                    {campo.tipo === "pct" ? `${val}%` : `R$ ${(val as number).toFixed(2)}`}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Documento do produto */}
                        {p.linkDocumentoProduto && (
                          <a
                            href={p.linkDocumentoProduto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-2 p-2 rounded-lg transition-opacity hover:opacity-80"
                            style={{ background: "#4285f415", border: "1px solid #4285f430", color: "#4285f4" }}
                          >
                            <FileText size={12} style={{ flexShrink: 0 }} />
                            <span className="text-xs font-semibold flex-1">Documento do Produto</span>
                            <ExternalLink size={10} style={{ flexShrink: 0 }} />
                          </a>
                        )}

                        {!completo && (
                          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg" style={{ background: "#ef444415", border: "1px solid #ef444430" }}>
                            <AlertTriangle size={12} style={{ color: "#ef4444" }} />
                            <p className="text-xs" style={{ color: "#ef4444" }}>Faltam {CAMPOS_PRODUTO.length - preenchidos} campos para ir ao ar.</p>
                          </div>
                        )}
                        {isAdmin && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => setProdutoEditandoLoja(p)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                              style={{ background: "#1e3356", color: "#94a3b8" }}
                            >
                              Editar produto
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Modais produto */}
          {criarProdutoModalAberto && (
            <ProdutoFormModal
              lojaIdInicial={loja.id}
              todasLojas={todasLojas}
              onClose={() => setCriarProdutoModalAberto(false)}
            />
          )}
          {produtoEditandoLoja && (
            <ProdutoFormModal
              produtoParaEditar={produtoEditandoLoja}
              todasLojas={todasLojas}
              onClose={() => setProdutoEditandoLoja(null)}
            />
          )}
          <ConexoesModal lojaId={loja.id} lojaNome={loja.nome} aberto={conexoesAberto} onFechar={() => setConexoesAberto(false)} />

          {/* Modal distribuir */}
          {distribuirModal && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              style={{ background: "#00000090" }} onClick={() => !distribuirSucesso && setDistribuirModal(null)}>
              <div className="w-full max-w-md rounded-2xl overflow-hidden"
                style={{ background: "#0b1624", border: "1px solid #8b5cf640", maxHeight: "90vh" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
                  <div>
                    <h2 className="font-bold text-white text-sm flex items-center gap-2">
                      <Share2 size={14} style={{ color: "#8b5cf6" }} /> Distribuir Produto
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>{distribuirModal.nome}</p>
                  </div>
                  <button onClick={() => setDistribuirModal(null)} style={{ color: "#9aa7ba" }}><X size={16} /></button>
                </div>
                {distribuirSucesso ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#8b5cf622", border: "2px solid #8b5cf6" }}>
                      <Check size={20} style={{ color: "#8b5cf6" }} />
                    </div>
                    <p className="text-white font-bold">Distribuido para {lojasDistribuir.length} {lojasDistribuir.length === 1 ? "loja" : "lojas"}!</p>
                    <p className="text-xs text-center px-6" style={{ color: "#9aa7ba" }}>Atualize o Link Shopify em cada copia.</p>
                  </div>
                ) : (
                  <div className="px-5 py-4 space-y-3" style={{ maxHeight: "calc(90vh - 80px)", overflowY: "auto" }}>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      Selecione as lojas destino. Cada copia herda todos os dados exceto o Link Shopify.
                    </p>
                    <div className="space-y-2">
                      {todasLojas
                        .filter((l) => l.id !== distribuirModal.lojaId && !(distribuirModal.distribuidoPara ?? []).includes(l.id))
                        .map((l) => {
                          const sel = lojasDistribuir.includes(l.id);
                          return (
                            <button key={l.id} onClick={() => setLojasDistribuir((prev) => prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id])}
                              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                              style={{ background: sel ? "#8b5cf620" : "#112239", border: `1px solid ${sel ? "#8b5cf660" : "#1e3356"}` }}>
                              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                style={{ background: sel ? "#8b5cf6" : "#1e3356", border: `1px solid ${sel ? "#8b5cf6" : "#334155"}` }}>
                                {sel && <Check size={9} style={{ color: "#fff" }} />}
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.cor || "#64748b" }} />
                                <p className="text-sm font-medium text-white">{l.nome}</p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                    <button onClick={handleDistribuirLoja} disabled={lojasDistribuir.length === 0}
                      className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: "#8b5cf6", color: "#fff" }}>
                      Distribuir para {lojasDistribuir.length > 0 ? `${lojasDistribuir.length} ${lojasDistribuir.length === 1 ? "loja" : "lojas"}` : "lojas selecionadas"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {abaAtiva === "visao-geral" && <>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 text-center" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <p className="text-3xl font-bold text-white">{tarefasLoja.length}</p>
          <p className="text-xs mt-1" style={{ color: "#9aa7ba" }}>Total de Tarefas</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#112239", border: "1px solid #10b98140" }}>
          <p className="text-3xl font-bold" style={{ color: "#10b981" }}>{concluidas}</p>
          <p className="text-xs mt-1" style={{ color: "#9aa7ba" }}>Concluidas</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#112239", border: `1px solid ${urgentes > 0 ? "#ef444440" : "#1e3356"}` }}>
          <p className="text-3xl font-bold" style={{ color: urgentes > 0 ? "#ef4444" : "#475569" }}>{urgentes}</p>
          <p className="text-xs mt-1" style={{ color: "#9aa7ba" }}>Urgentes</p>
        </div>
      </div>

      {/* ─── ROTINAS DA LOJA ─── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center gap-2" data-tip="Rotinas vinculadas a esta loja. Cada uma pode ser delegada a um colaborador e aparece em Tarefas › Rotinas da pessoa. Sobrevivem se a pessoa sair.">
            <RefreshCw size={15} style={{ color: corGrupo }} />
            <p className="text-sm font-semibold text-white">Rotinas desta Loja</p>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e3356", color: "#9aa7ba" }}>
              {rotinasLoja.length} {rotinasLoja.length === 1 ? "rotina" : "rotinas"}
            </span>
            {rotinasLoja.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: rotinasLoja.filter((r) => r.concluida).length === rotinasLoja.length ? "#10b98120" : "#1e3356",
                color: rotinasLoja.filter((r) => r.concluida).length === rotinasLoja.length ? "#10b981" : "#64748b",
              }}>
                {rotinasLoja.filter((r) => r.concluida).length}/{rotinasLoja.length} hoje
              </span>
            )}
          </div>
          {isAdmin && (
            <button onClick={abrirModalRotina}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
              style={{ background: corGrupo + "20", color: corGrupo, border: `1px solid ${corGrupo}40` }}>
              <Plus size={12} /> Nova Rotina
            </button>
          )}
        </div>

        {rotinasLoja.length === 0 ? (
          <div className="p-10 text-center">
            <RefreshCw size={32} className="mx-auto mb-3" style={{ color: "#1e3356" }} />
            <p className="text-white font-medium mb-1">Nenhuma rotina para esta loja</p>
            <p className="text-xs mb-4" style={{ color: "#9aa7ba" }}>
              Rotinas sao atividades diarias recorrentes vinculadas a esta loja.
            </p>
            {isAdmin && (
              <button onClick={abrirModalRotina}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: corGrupo + "20", color: corGrupo, border: `1px solid ${corGrupo}40` }}>
                <Plus size={14} /> Criar primeira rotina
              </button>
            )}
          </div>
        ) : (
          <div>
            {rotinasLoja.map((rotina, idx) => {
              const colab = colaboradores.find((c) => c.id === rotina.colaboradorId);
              const podeCumprir = isAdmin || usuarioAtual.id === colab?.id;
              const subFeitas = rotina.subtarefas.filter((s) => s.concluida).length;
              const totalSub = rotina.subtarefas.length;
              const pctRotina = totalSub === 0
                ? (rotina.concluida ? 100 : 0)
                : Math.round((subFeitas / totalSub) * 100);
              const cor = rotina.concluida ? "#10b981" : pctRotina > 0 ? "#f59e0b" : "#475569";

              return (
                <div key={rotina.id}
                  className="p-4"
                  style={{ borderTop: idx > 0 ? "1px solid rgba(201,164,66,.16)" : "none", background: rotina.concluida ? "#10b98108" : "transparent" }}>
                  {/* Header da rotina */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => podeCumprir && (rotina.concluida ? reabrirRotina(rotina.id) : concluirRotina(rotina.id))}
                      disabled={!podeCumprir}
                      className="mt-0.5 flex-shrink-0"
                      style={{ cursor: podeCumprir ? "pointer" : "default" }}
                      data-tip={rotina.concluida ? "Marcar como nao concluida" : "Marcar como concluida"}>
                      {rotina.concluida
                        ? <CheckCircle2 size={20} style={{ color: "#10b981" }} />
                        : <Circle size={20} style={{ color: "#334155" }} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white" style={{ textDecoration: rotina.concluida ? "line-through" : "none", color: rotina.concluida ? "#64748b" : "#e8edf5" }}>
                          {rotina.titulo}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {totalSub > 0 && (
                            <span className="text-xs font-semibold" style={{ color: cor }}>{subFeitas}/{totalSub}</span>
                          )}
                          {colab ? (
                            <Link href={`/equipe/${colab.id}`} className="flex items-center gap-1.5 hover:opacity-80">
                              <Avatar nome={colab.nome} avatar={colab.avatar} foto={colab.foto} cor={colab.cor} size={22} />
                              <span className="text-xs" style={{ color: "#94a3b8" }}>{colab.nome.split(" ")[0]}</span>
                            </Link>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f59e0b20", color: "#f59e0b" }}>
                              Sem responsável
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {totalSub > 0 && (
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctRotina}%`, background: cor }} />
                        </div>
                      )}

                      {/* Subtarefas */}
                      {rotina.subtarefas.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {rotina.subtarefas.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => podeCumprir && marcarSubtarefa(rotina.id, sub.id, !sub.concluida)}
                              disabled={!podeCumprir}
                              className="flex items-center gap-2 w-full text-left"
                              style={{ cursor: podeCumprir ? "pointer" : "default" }}>
                              {sub.concluida
                                ? <CheckCircle2 size={13} style={{ color: "#10b981", flexShrink: 0 }} />
                                : <Circle size={13} style={{ color: "#334155", flexShrink: 0 }} />}
                              <span className="text-xs" style={{
                                color: sub.concluida ? "#475569" : "#94a3b8",
                                textDecoration: sub.concluida ? "line-through" : "none",
                              }}>
                                {sub.titulo}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress chart */}
      {tarefasLoja.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#9aa7ba" }}>Distribuicao por Status — Tarefas</p>
          <div className="space-y-3">
            {tarefasPorStatus.map((s) => {
              const pctS = tarefasLoja.length ? Math.round((s.count / tarefasLoja.length) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{s.label}</span>
                    <span style={{ color: s.cor }}>{s.count} ({pctS}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctS}%`, background: s.cor }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: "#9aa7ba" }}>Progresso geral</span>
              <span style={{ color: corGrupo }}>{pct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: corGrupo }} />
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      {tarefasLoja.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9aa7ba" }}>
              Tarefas ({tarefasLoja.length})
            </p>
            {isAdmin && (
              <button onClick={abrirModalTarefa}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                style={{ background: corGrupo + "20", color: corGrupo, border: `1px solid ${corGrupo}40` }}>
                <Plus size={12} /> Nova Tarefa
              </button>
            )}
          </div>
          <div className="space-y-2">
            {tarefasLoja.map((t) => {
              const pessoa = colaboradores.find((c) => c.id === t.atribuidoPara);
              const cor = PRI_COR[t.prioridade] || "#64748b";
              const membros = t.membros || [];
              return (
                <div key={t.id} className="flex items-start justify-between p-3 rounded-xl"
                  style={{ background: "#1e3356", borderLeft: `3px solid ${cor}` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{t.titulo}</p>
                    {t.descricao && <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>{t.descricao}</p>}
                    {membros.length > 0 ? (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {membros.map((m) => {
                          const mp = colaboradores.find((c) => c.id === m.colaboradorId);
                          if (!mp) return null;
                          const done = m.subtarefas.filter((s) => s.concluida).length;
                          const total = m.subtarefas.length;
                          return (
                            <div key={m.colaboradorId} className="flex items-center gap-1">
                              <Avatar nome={mp.nome} avatar={mp.avatar} foto={mp.foto} cor={mp.cor} size={18} />
                              <span className="text-xs" style={{ color: done === total && total > 0 ? "#10b981" : "#94a3b8" }}>
                                {mp.nome.split(" ")[0]}{total > 0 ? ` ${done}/${total}` : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : pessoa && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Avatar nome={pessoa.nome} avatar={pessoa.avatar} foto={pessoa.foto} cor={pessoa.cor} size={20} />
                        <Link href={`/equipe/${pessoa.id}`} className="text-xs hover:underline" style={{ color: "#94a3b8" }}>{pessoa.nome}</Link>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cor}20`, color: cor }}>{PRI_LABEL[t.prioridade] || t.prioridade}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#112239", color: "#9aa7ba" }}>{STATUS_LABEL[t.status] || t.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tarefasLoja.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <Store size={36} className="mx-auto mb-3" style={{ color: "#1e3356" }} />
          <p className="text-white font-medium mb-1">Nenhuma tarefa ativa para esta loja</p>
          <p className="text-xs mb-5" style={{ color: "#9aa7ba" }}>Crie a primeira tarefa para comecar a acompanhar.</p>
          {isAdmin && (
            <button onClick={abrirModalTarefa}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
              style={{ background: corGrupo, color: corGrupo === "#c9a84c" ? "#000" : "#fff" }}>
              <Plus size={16} /> Criar primeira tarefa
            </button>
          )}
        </div>
      )}

      </> }

      {/* ── Modal Nova Tarefa ── */}
      {modalTarefa && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000090" }} onClick={() => !sucesso && setModalTarefa(false)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "#0b1624", border: `1px solid ${corGrupo}40`, maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
              <div>
                <h2 className="font-bold text-white text-sm">Nova Tarefa</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>{loja.nome}</p>
              </div>
              <button onClick={() => setModalTarefa(false)} className="p-1.5 rounded-xl hover:bg-slate-800" style={{ color: "#9aa7ba" }}><X size={16} /></button>
            </div>

            {sucesso ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#10b98122", border: "2px solid #10b981" }}>
                  <Check size={24} style={{ color: "#10b981" }} />
                </div>
                <p className="text-white font-bold">Tarefa criada!</p>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
                <div className="px-5 py-4 space-y-4">
                  <div className="flex gap-2">
                    {(["rapida", "elaborada"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setFormTarefa((f) => ({ ...f, tipo: t }))}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: formTarefa.tipo === t ? corGrupo + "22" : "#112239", border: `1.5px solid ${formTarefa.tipo === t ? corGrupo : "#1e3356"}`, color: formTarefa.tipo === t ? corGrupo : "#64748b" }}>
                        {t === "rapida" ? "Tarefa Rapida" : "Tarefa Elaborada (multi-membro)"}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Titulo *</label>
                    <input value={formTarefa.titulo} onChange={(e) => setFormTarefa((f) => ({ ...f, titulo: e.target.value }))}
                      placeholder="Ex: Confirmar todos os pedidos ate as 18h"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} autoFocus />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Contexto <span style={{ color: "#74859c" }}>(opcional)</span></label>
                    <textarea rows={2} value={formTarefa.contexto} onChange={(e) => setFormTarefa((f) => ({ ...f, contexto: e.target.value }))}
                      placeholder="Contexto adicional para o responsavel..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                      style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} />
                  </div>
                  {formTarefa.tipo === "rapida" && (
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Responsavel</label>
                      <div className="relative">
                        <select value={formTarefa.atribuidoPara} onChange={(e) => setFormTarefa((f) => ({ ...f, atribuidoPara: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
                          style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                          <option value="" style={{ background: "#112239" }}>Selecionar...</option>
                          {colaboradores.map((c) => (
                            <option key={c.id} value={c.id} style={{ background: "#112239" }}>
                              {c.nome}{c.id === loja.responsavel ? " (responsavel da loja)" : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9aa7ba" }} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Prioridade</label>
                      <div className="flex gap-1">
                        {(["alta", "media", "baixa"] as Prioridade[]).map((p) => (
                          <button key={p} type="button" onClick={() => setFormTarefa((f) => ({ ...f, prioridade: p }))}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{ background: formTarefa.prioridade === p ? PRI_COR[p] + "22" : "#112239", border: `1px solid ${formTarefa.prioridade === p ? PRI_COR[p] : "#1e3356"}`, color: formTarefa.prioridade === p ? PRI_COR[p] : "#64748b" }}>
                            {PRI_LABEL[p]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Prazo</label>
                      <input type="date" value={formTarefa.dataLimite} onChange={(e) => setFormTarefa((f) => ({ ...f, dataLimite: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                        style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} />
                    </div>
                  </div>
                  {formTarefa.tipo === "elaborada" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#94a3b8" }}>Membros ({formTarefa.membros.length})</label>
                      </div>
                      {membrosDisponiveis.length > 0 && (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <select value={novoMembroId} onChange={(e) => setNovoMembroId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none appearance-none"
                              style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                              <option value="" style={{ background: "#112239" }}>Adicionar pessoa...</option>
                              {membrosDisponiveis.map((c) => (
                                <option key={c.id} value={c.id} style={{ background: "#112239" }}>{c.nome}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9aa7ba" }} />
                          </div>
                          <button type="button" onClick={addMembro} disabled={!novoMembroId}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                            style={{ background: corGrupo + "22", color: corGrupo, border: `1px solid ${corGrupo}40` }}>
                            <UserPlus size={13} /> Adicionar
                          </button>
                        </div>
                      )}
                      {formTarefa.membros.map((m) => {
                        const colab = colaboradores.find((c) => c.id === m.colaboradorId);
                        if (!colab) return null;
                        return (
                          <div key={m.uid} className="rounded-xl p-3 space-y-2" style={{ background: "#112239", border: `1px solid ${colab.cor}30` }}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar nome={colab.nome} avatar={colab.avatar} foto={colab.foto} cor={colab.cor} size={26} />
                                <p className="text-sm font-semibold text-white">{colab.nome.split(" ")[0]}</p>
                              </div>
                              <button type="button" onClick={() => rmMembro(m.uid)} className="p-1 rounded-lg" style={{ color: "#74859c" }}><X size={13} /></button>
                            </div>
                            <div className="space-y-1.5 ml-1">
                              {m.subtarefas.map((s, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colab.cor }} />
                                  <input value={s.titulo} onChange={(e) => updSubMembro(m.uid, i, e.target.value)}
                                    placeholder={`Subtarefa de ${colab.nome.split(" ")[0]}...`}
                                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                                    style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }} />
                                  <button type="button" onClick={() => rmSubMembro(m.uid, i)} style={{ color: "#74859c" }}><Trash2 size={11} /></button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addSubMembro(m.uid)}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg w-full"
                                style={{ color: colab.cor, border: `1px dashed ${colab.cor}40` }}>
                                <Plus size={10} /> Subtarefa para {colab.nome.split(" ")[0]}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <button onClick={handleCriarTarefa}
                    disabled={!formTarefa.titulo.trim() || (formTarefa.tipo === "elaborada" && formTarefa.membros.length === 0) || (formTarefa.tipo === "rapida" && !formTarefa.atribuidoPara)}
                    className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: corGrupo, color: corGrupo === "#c9a84c" ? "#000" : "#fff" }}>
                    <Plus size={16} /> Criar e Notificar Responsavel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Nova Rotina ── */}
      {modalRotina && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000090", backdropFilter: "blur(2px)" }} onClick={() => !sucessoRotina && setModalRotina(false)}>
          <div className="modal-card w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0b1624", border: `1px solid ${corGrupo}40`, maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
              <div>
                <h2 className="font-bold text-white text-sm">Nova Rotina</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>{loja.nome} — aparece no Meu Dia do responsavel</p>
              </div>
              <button onClick={() => setModalRotina(false)} className="p-1.5 rounded-xl hover:bg-slate-800" style={{ color: "#9aa7ba" }}><X size={16} /></button>
            </div>

            {sucessoRotina ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#10b98122", border: "2px solid #10b981" }}>
                  <Check size={24} style={{ color: "#10b981" }} />
                </div>
                <p className="text-white font-bold">Rotina criada!</p>
                <p className="text-xs text-center px-6" style={{ color: "#9aa7ba" }}>
                  Aparece no Meu Dia de {colaboradores.find((c) => c.id === formRotina.colaboradorId)?.nome.split(" ")[0] || ""}
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
                <div className="px-5 py-4 space-y-4">
                  {/* Titulo */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Titulo da rotina *</label>
                    <input value={formRotina.titulo} onChange={(e) => setFormRotina((f) => ({ ...f, titulo: e.target.value }))}
                      placeholder="Ex: Processar pedidos da loja"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                      style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} autoFocus />
                  </div>

                  {/* Frequencia */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Frequencia *</label>
                    <div className="relative">
                      <select value={formRotina.frequencia} onChange={(e) => setFormRotina((f) => ({ ...f, frequencia: e.target.value as Frequencia }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
                        style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                        {ORDEM_FREQUENCIA.map((f) => (
                          <option key={f} value={f} style={{ background: "#112239" }}>{LABEL_FREQUENCIA[f]}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9aa7ba" }} />
                    </div>
                  </div>

                  {/* Responsavel */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Responsavel <span style={{ color: "#74859c" }}>(opcional)</span></label>
                    <div className="relative">
                      <select value={formRotina.colaboradorId} onChange={(e) => setFormRotina((f) => ({ ...f, colaboradorId: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
                        style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                        <option value="" style={{ background: "#112239" }}>Sem responsavel (vai para Vagas)</option>
                        {colaboradores.map((c) => (
                          <option key={c.id} value={c.id} style={{ background: "#112239" }}>
                            {c.nome}{c.id === loja.responsavel ? " (responsavel da loja)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9aa7ba" }} />
                    </div>
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#74859c" }}>
                      <RefreshCw size={10} />
                      {formRotina.colaboradorId
                        ? `Aparece em Tarefas › Rotinas de ${colaboradores.find((c) => c.id === formRotina.colaboradorId)?.nome.split(" ")[0]}`
                        : "Sem responsável → fica no painel Vagas & Pendências"}
                    </p>
                  </div>

                  {/* Subtarefas */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Subtarefas <span style={{ color: "#74859c" }}>(opcional)</span></label>
                      <button type="button" onClick={addSubRotina}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{ background: corGrupo + "20", color: corGrupo, border: `1px solid ${corGrupo}30` }}>
                        <Plus size={10} /> Adicionar
                      </button>
                    </div>
                    {formRotina.subtarefas.length === 0 && (
                      <p className="text-xs py-2" style={{ color: "#334155" }}>Sem subtarefas — rotina sera marcada toda de uma vez</p>
                    )}
                    <div className="space-y-1.5">
                      {formRotina.subtarefas.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: corGrupo }} />
                          <input value={s.titulo} onChange={(e) => updSubRotina(i, e.target.value)}
                            placeholder={`Subtarefa ${i + 1}...`}
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                            style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} />
                          <button type="button" onClick={() => rmSubRotina(i)} style={{ color: "#74859c" }}><Trash2 size={11} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button onClick={handleCriarRotina}
                    disabled={!formRotina.titulo.trim()}
                    className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: corGrupo, color: corGrupo === "#c9a84c" ? "#000" : "#fff" }}>
                    <RefreshCw size={15} /> Criar Rotina
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
