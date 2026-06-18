"use client";
import { useAppStore } from "@/lib/store";
import { LOJAS, DRIVE_GERAL, Loja, GrupoLoja, MercadoLoja } from "@/lib/data";
import { Store, FolderOpen, Plus, Pencil, Archive, ArchiveRestore, AlertTriangle, ShieldCheck, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";

type FiltroGrupo = "todos" | "izzat" | "partner";
type FiltroMercado = "todos" | "global" | "brasil";
type FiltroRisco = "todos" | "alto" | "atencao" | "ok";

const CORES_PRESET = ["#c9a84c", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4"];

const FORM_INICIAL = {
  nome: "",
  grupo: "izzat" as GrupoLoja,
  mercado: "global" as MercadoLoja,
  responsavel: "",
  cor: "#c9a84c",
  descricao: "",
  donoParceiro: "",
  whatsappParceiro: "",
};

export default function LojasPage() {
  const router = useRouter();
  const {
    colaboradores, rotinas, tarefas, usuarioAtual,
    lojasCustom, lojasArquivadas,
    criarLoja, editarLoja, arquivarLoja, restaurarLoja,
  } = useAppStore();

  const [grupo, setGrupo] = useState<FiltroGrupo>("todos");
  const [mercado, setMercado] = useState<FiltroMercado>("todos");
  const [risco, setRisco] = useState<FiltroRisco>("todos");
  const [showArquivadas, setShowArquivadas] = useState(false);
  const [criarModal, setCriarModal] = useState(false);
  const [editarModal, setEditarModal] = useState<Loja | null>(null);
  const [arquivarConfirm, setArquivarConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!usuarioAtual) { router.push("/"); return; }
  }, [usuarioAtual, router]);

  if (!usuarioAtual) return null;

  const isAdmin = usuarioAtual.nivelAcesso === "admin";

  const hoje = new Date().toISOString().split("T")[0];

  function calcRisco(lojaId: string): "alto" | "atencao" | "ok" {
    const tLoja = tarefas.filter((t) => t.lojaId === lojaId);
    const atrasadas = tLoja.filter((t) => t.status === "atrasada").length;
    const vencidas = tLoja.filter(
      (t) => t.status !== "concluida" && t.status !== "atrasada" && t.dataLimite && t.dataLimite < hoje
    ).length;
    const rotinasAtrasadas = rotinas
      .filter((r) => r.lojaId === lojaId && r.ativa !== false && !r.concluida).length;
    const score = atrasadas * 3 + vencidas * 2 + rotinasAtrasadas;
    if (atrasadas > 0 || score >= 5) return "alto";
    if (score > 0) return "atencao";
    return "ok";
  }

  const todasLojas: Loja[] = [...LOJAS, ...lojasCustom];
  const lojasAtivas = todasLojas.filter((l) => !lojasArquivadas.includes(l.id));
  const lojasArqList = todasLojas.filter((l) => lojasArquivadas.includes(l.id));

  const lojasFiltradas = lojasAtivas
    .filter((l) => {
      const grupoOk = grupo === "todos" || l.grupo === grupo;
      const mercadoOk = mercado === "todos" || l.mercado === mercado;
      const riscoAtual = calcRisco(l.id);
      const riscoOk = risco === "todos" || riscoAtual === risco;
      return grupoOk && mercadoOk && riscoOk;
    })
    .sort((a, b) => {
      const order = { alto: 0, atencao: 1, ok: 2 };
      return order[calcRisco(a.id)] - order[calcRisco(b.id)];
    });

  const izzatCount = lojasAtivas.filter((l) => l.grupo === "izzat").length;
  const partnerCount = lojasAtivas.filter((l) => l.grupo === "partner").length;
  const emRiscoCount = lojasAtivas.filter((l) => calcRisco(l.id) === "alto").length;

  function abrirCriar() {
    setForm(FORM_INICIAL);
    setSucesso(false);
    setCriarModal(true);
  }

  function abrirEditar(loja: Loja) {
    setForm({
      nome: loja.nome,
      grupo: loja.grupo,
      mercado: loja.mercado,
      responsavel: loja.responsavel,
      cor: loja.cor,
      descricao: loja.descricao || "",
      donoParceiro: loja.donoParceiro || "",
      whatsappParceiro: loja.whatsappParceiro || "",
    });
    setSucesso(false);
    setEditarModal(loja);
  }

  function handleCriar() {
    if (!form.nome.trim()) return;
    criarLoja({
      nome: form.nome.trim(),
      grupo: form.grupo,
      mercado: form.mercado,
      responsavel: form.responsavel,
      cor: form.cor,
      descricao: form.descricao.trim() || undefined,
      donoParceiro: form.donoParceiro.trim() || undefined,
      whatsappParceiro: form.whatsappParceiro.trim() || undefined,
    });
    setSucesso(true);
    setTimeout(() => setCriarModal(false), 1400);
  }

  function handleEditar() {
    if (!editarModal || !form.nome.trim()) return;
    editarLoja(editarModal.id, {
      nome: form.nome.trim(),
      grupo: form.grupo,
      mercado: form.mercado,
      responsavel: form.responsavel,
      cor: form.cor,
      descricao: form.descricao.trim() || undefined,
      donoParceiro: form.donoParceiro.trim() || undefined,
      whatsappParceiro: form.whatsappParceiro.trim() || undefined,
    });
    setSucesso(true);
    setTimeout(() => setEditarModal(null), 1400);
  }

  function handleArquivar(id: string) {
    arquivarLoja(id);
    setArquivarConfirm(null);
  }

  const isCustom = (id: string) => lojasCustom.some((l) => l.id === id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <BackButton href="/dashboard" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-white" style={{ fontSize: 26, letterSpacing: "-0.3px" }}>Lojas</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Acompanhe o status e risco operacional de cada loja do grupo
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: "#475569" }}>{lojasAtivas.length} lojas ativas</span>
            <span style={{ color: "#334155" }}>·</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c9a84c15", color: "#c9a84c" }}>{izzatCount} Grupo Izzat</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#3b82f615", color: "#3b82f6" }}>{partnerCount} Partners</span>
            {emRiscoCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>
                ⚠ {emRiscoCount} em risco
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && (
            <button onClick={abrirCriar} className="btn-primary text-sm">
              <Plus size={15} />
              Nova Loja
            </button>
          )}
          <a
            href={DRIVE_GERAL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "#122039", border: "1px solid #1e3356", color: "#c9a84c" }}
          >
            <FolderOpen size={15} />
            Drive
          </a>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        {/* Grupo + Mercado */}
        <div className="flex gap-2 flex-wrap">
          {(["todos", "izzat", "partner"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setGrupo(f)}
              title={f === "todos" ? "Mostrar todas as lojas" : f === "izzat" ? "Lojas próprias do grupo Izzat" : "Lojas de clientes parceiros"}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: grupo === f ? "#c9a84c" : "#122039",
                color: grupo === f ? "#0b1624" : "#64748b",
                border: `1px solid ${grupo === f ? "#c9a84c" : "#1e3356"}`,
              }}
            >
              {f === "todos" ? "Todas" : f === "izzat" ? "Grupo Izzat" : "Partners"}
            </button>
          ))}
          <div className="w-px self-stretch" style={{ background: "#1e3356" }} />
          {(["todos", "global", "brasil"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setMercado(f)}
              title={f === "todos" ? "Todos os mercados" : f === "global" ? "Lojas que vendem para o mundo (global)" : "Lojas focadas no mercado brasileiro"}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: mercado === f ? "#3b82f6" : "#122039",
                color: mercado === f ? "#ffffff" : "#64748b",
                border: `1px solid ${mercado === f ? "#3b82f6" : "#1e3356"}`,
              }}
            >
              {f === "todos" ? "Global + BR" : f === "global" ? "Global" : "Brasil"}
            </button>
          ))}
        </div>

        {/* Risco */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>Risco:</span>
          <span className="text-xs" title="Risco e calculado com base em tarefas atrasadas e rotinas nao cumpridas da loja" style={{ color: "#334155", cursor: "help" }}>ⓘ</span>
          {([
            { v: "todos", label: "Todos", cor: "#64748b", bg: "#122039" },
            { v: "alto", label: "Alto Risco", cor: "#ef4444", bg: "#ef444420" },
            { v: "atencao", label: "Atenção", cor: "#f59e0b", bg: "#f59e0b20" },
            { v: "ok", label: "OK", cor: "#10b981", bg: "#10b98120" },
          ] as const).map((f) => (
            <button
              key={f.v}
              onClick={() => setRisco(f.v)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: risco === f.v ? f.bg : "#122039",
                color: risco === f.v ? f.cor : "#64748b",
                border: `1px solid ${risco === f.v ? f.cor + "60" : "#1e3356"}`,
              }}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setShowArquivadas((v) => !v)}
            className="ml-auto px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              background: showArquivadas ? "#33415520" : "#122039",
              color: showArquivadas ? "#94a3b8" : "#475569",
              border: `1px solid ${showArquivadas ? "#475569" : "#1e3356"}`,
            }}
          >
            {showArquivadas ? "Ocultar arquivadas" : `Arquivadas (${lojasArqList.length})`}
          </button>
        </div>
      </div>

      {/* Grid ativo */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lojasFiltradas.map((loja) => {
          const responsavel = colaboradores.find((c) => c.id === loja.responsavel);
          const tarefasLoja = tarefas.filter((t) => t.lojaId === loja.id);
          const concluidas = tarefasLoja.filter((t) => t.status === "concluida").length;
          const urgentes = tarefasLoja.filter((t) => t.prioridade === "alta" && t.status !== "concluida").length;
          const atrasadas = tarefasLoja.filter((t) => t.status === "atrasada").length;
          const pct = tarefasLoja.length ? Math.round((concluidas / tarefasLoja.length) * 100) : 0;
          const corGrupo = loja.grupo === "izzat" ? "#c9a84c" : "#3b82f6";
          const labelMercado = loja.mercado === "global" ? "Global" : "BR";
          const corMercado = loja.mercado === "global" ? "#8b5cf6" : "#10b981";
          const nivelRisco = calcRisco(loja.id);
          const corRisco = nivelRisco === "alto" ? "#ef4444" : nivelRisco === "atencao" ? "#f59e0b" : "#10b981";
          const isArquivando = arquivarConfirm === loja.id;
          const custom = isCustom(loja.id);

          return (
            <div
              key={loja.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#122039",
                border: `1px solid ${nivelRisco === "alto" ? "#ef444440" : nivelRisco === "atencao" ? "#f59e0b40" : "#1e3356"}`,
                transition: "all 150ms cubic-bezier(0.4,0,0.2,1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              {/* Logo banner */}
              <Link href={`/lojas/${loja.id}`} className="block">
                <div className="h-28 flex items-center justify-center relative transition-opacity hover:opacity-90"
                  style={{ background: loja.corFundo || "#1e3356" }}>
                  {loja.logo ? (
                    <Image src={loja.logo} alt={loja.nome} width={96} height={96}
                      className="object-contain" style={{ maxHeight: 72, maxWidth: 120 }} unoptimized />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Store size={28} style={{ color: loja.cor || "#c9a84c" }} />
                      <span className="text-white font-bold">{loja.nome}</span>
                    </div>
                  )}
                  {/* Badge grupo */}
                  <span className="absolute top-2.5 right-2.5 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(0,0,0,0.6)", color: corGrupo, border: `1px solid ${corGrupo}60` }}>
                    {loja.grupo === "izzat" ? "Grupo Izzat" : "Partner"}
                  </span>
                  {/* Badge mercado */}
                  <span className="absolute top-2.5 left-2.5 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(0,0,0,0.6)", color: corMercado, border: `1px solid ${corMercado}60` }}>
                    {labelMercado}
                  </span>
                  {/* Badge risco */}
                  {nivelRisco !== "ok" && (
                    <span
                      className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(0,0,0,0.7)", color: corRisco, border: `1px solid ${corRisco}60` }}
                      title={nivelRisco === "alto" ? "Alto Risco: 2+ tarefas atrasadas ou >=30% das tarefas atrasadas" : "Atenção: 1 tarefa atrasada ou >=10% das tarefas atrasadas"}
                    >
                      <AlertTriangle size={10} />
                      {nivelRisco === "alto" ? "Alto Risco" : "Atencao"}
                    </span>
                  )}
                  {nivelRisco === "ok" && tarefasLoja.length > 0 && (
                    <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(0,0,0,0.7)", color: "#10b981", border: "1px solid #10b98150" }}>
                      <ShieldCheck size={10} />
                      OK
                    </span>
                  )}
                </div>
              </Link>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Link href={`/lojas/${loja.id}`} className="hover:opacity-80 transition-opacity">
                    <h3 className="text-white font-semibold">{loja.nome}</h3>
                  </Link>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {custom && (
                      <button
                        onClick={() => abrirEditar(loja)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-slate-800"
                        title="Editar loja"
                        style={{ color: "#64748b" }}
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setArquivarConfirm(isArquivando ? null : loja.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-slate-800"
                      title="Arquivar loja"
                      style={{ color: isArquivando ? "#ef4444" : "#64748b" }}
                    >
                      <Archive size={13} />
                    </button>
                  </div>
                </div>

                {/* Confirm archive */}
                {isArquivando && (
                  <div className="mb-3 p-2.5 rounded-xl flex items-center justify-between gap-2"
                    style={{ background: "#ef444415", border: "1px solid #ef444440" }}>
                    <span className="text-xs" style={{ color: "#ef4444" }}>Arquivar esta loja?</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleArquivar(loja.id)}
                        className="text-xs px-2.5 py-1 rounded-lg font-bold"
                        style={{ background: "#ef444430", color: "#ef4444" }}>
                        Sim
                      </button>
                      <button onClick={() => setArquivarConfirm(null)}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ background: "#122039", color: "#64748b" }}>
                        Nao
                      </button>
                    </div>
                  </div>
                )}

                {/* Responsavel */}
                <div className="flex items-center gap-2 mb-3">
                  {responsavel ? (
                    <>
                      <Avatar nome={responsavel.nome} avatar={responsavel.avatar} foto={responsavel.foto} cor={responsavel.cor} size={26} />
                      <div>
                        <p className="text-sm text-white leading-tight">{responsavel.nome}</p>
                        <p className="text-xs" style={{ color: "#64748b" }}>{responsavel.cargo}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: "#475569" }}>Sem responsavel</p>
                  )}
                </div>

                {/* Dono parceiro */}
                {loja.grupo === "partner" && (loja.donoParceiro || loja.whatsappParceiro) && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-xl" style={{ background: "#1e3356" }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#3b82f6" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: loja.donoParceiro ? "#e8edf5" : "#475569" }}>
                        {loja.donoParceiro || "A definir"}
                      </p>
                      <p className="text-xs" style={{ color: "#64748b" }}>Dono</p>
                    </div>
                    {loja.whatsappParceiro && (
                      <a href={`https://wa.me/${loja.whatsappParceiro.replace(/\D/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-2 py-0.5 rounded-lg font-medium flex-shrink-0"
                        style={{ background: "#10b98120", color: "#10b981" }}>
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-xl p-2 text-center" style={{ background: "#1e3356" }}>
                    <p className="text-base font-bold text-white">{tarefasLoja.length}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>Tarefas</p>
                  </div>
                  <div className="rounded-xl p-2 text-center" style={{ background: "#1e3356" }}>
                    <p className="text-base font-bold" style={{ color: "#10b981" }}>{concluidas}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>Feitas</p>
                  </div>
                  <div className="rounded-xl p-2 text-center" style={{ background: "#1e3356" }}>
                    <p className="text-base font-bold" style={{ color: atrasadas > 0 ? "#ef4444" : urgentes > 0 ? "#f59e0b" : "#475569" }}>
                      {atrasadas > 0 ? atrasadas : urgentes}
                    </p>
                    <p className="text-xs" style={{ color: "#64748b" }}>{atrasadas > 0 ? "Atrasadas" : "Urgentes"}</p>
                  </div>
                </div>

                {/* Barra progresso */}
                {tarefasLoja.length > 0 ? (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#64748b" }}>Progresso</span>
                      <span style={{ color: corGrupo }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: corGrupo }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-center" style={{ color: "#475569" }}>Nenhuma tarefa ativa</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lojasFiltradas.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <Store size={32} className="mx-auto mb-3" style={{ color: "#334155" }} />
          <p className="text-white font-medium mb-1">Nenhuma loja encontrada</p>
          <p className="text-xs" style={{ color: "#64748b" }}>Ajuste os filtros ou crie uma nova loja.</p>
        </div>
      )}

      {/* Lojas arquivadas */}
      {showArquivadas && lojasArqList.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
            Lojas Arquivadas ({lojasArqList.length})
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lojasArqList.map((loja) => (
              <div key={loja.id} className="rounded-2xl p-4 flex items-center justify-between gap-3 opacity-60"
                style={{ background: "#122039", border: "1px solid #1e3356" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#1e3356" }}>
                    <Store size={18} style={{ color: loja.cor || "#64748b" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{loja.nome}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      {loja.grupo === "izzat" ? "Grupo Izzat" : "Partner"} &middot; {loja.mercado === "global" ? "Global" : "BR"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => restaurarLoja(loja.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-80 flex-shrink-0"
                  style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}
                >
                  <ArchiveRestore size={12} />
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl"
        style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#c9a84c" }} />
          <span className="text-sm" style={{ color: "#94a3b8" }}>Grupo Izzat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "#3b82f6" }} />
          <span className="text-sm" style={{ color: "#94a3b8" }}>Partners</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} style={{ color: "#ef4444" }} />
          <span className="text-sm" style={{ color: "#94a3b8" }}>Alto Risco — tarefas atrasadas</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} style={{ color: "#f59e0b" }} />
          <span className="text-sm" style={{ color: "#94a3b8" }}>{"Atenção — prazos prestes a vencer"}</span>
        </div>
      </div>

      {/* Modal criar / editar */}
      {(criarModal || editarModal) && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000090" }}
          onClick={() => { setCriarModal(false); setEditarModal(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0b1624", border: "1px solid #1e3356", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid #1e3356" }}>
              <h2 className="font-bold text-white text-sm">{editarModal ? "Editar Loja" : "Nova Loja"}</h2>
              <button onClick={() => { setCriarModal(false); setEditarModal(null); }} style={{ color: "#64748b" }}>
                <X size={16} />
              </button>
            </div>

            {sucesso ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "#10b98122", border: "2px solid #10b981" }}>
                  <Check size={24} style={{ color: "#10b981" }} />
                </div>
                <p className="text-white font-bold">{editarModal ? "Loja atualizada!" : "Loja criada!"}</p>
              </div>
            ) : (
              <div className="overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: "calc(90vh - 80px)" }}>

                {/* Nome */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Nome *</label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    placeholder="Ex: Izzat Express"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: "#122039", border: "1px solid #1e3356" }}
                    autoFocus
                  />
                </div>

                {/* Grupo + Mercado */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Grupo</label>
                    <div className="flex gap-1">
                      {(["izzat", "partner"] as const).map((g) => (
                        <button key={g} type="button"
                          onClick={() => setForm((f) => ({ ...f, grupo: g }))}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: form.grupo === g ? "#c9a84c22" : "#122039",
                            border: `1px solid ${form.grupo === g ? "#c9a84c" : "#1e3356"}`,
                            color: form.grupo === g ? "#c9a84c" : "#64748b",
                          }}>
                          {g === "izzat" ? "Izzat" : "Partner"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Mercado</label>
                    <div className="flex gap-1">
                      {(["global", "brasil"] as const).map((m) => (
                        <button key={m} type="button"
                          onClick={() => setForm((f) => ({ ...f, mercado: m }))}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={{
                            background: form.mercado === m ? "#3b82f622" : "#122039",
                            border: `1px solid ${form.mercado === m ? "#3b82f6" : "#1e3356"}`,
                            color: form.mercado === m ? "#3b82f6" : "#64748b",
                          }}>
                          {m === "global" ? "Global" : "BR"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Responsavel */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Responsavel interno</label>
                  <select
                    value={form.responsavel}
                    onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: "#122039", border: "1px solid #1e3356" }}
                  >
                    <option value="" style={{ background: "#122039" }}>Sem responsavel</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id} style={{ background: "#122039" }}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Cor */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Cor da loja</label>
                  <div className="flex gap-2 flex-wrap">
                    {CORES_PRESET.map((c) => (
                      <button key={c} type="button"
                        onClick={() => setForm((f) => ({ ...f, cor: c }))}
                        className="w-8 h-8 rounded-full transition-all"
                        style={{
                          background: c,
                          border: `3px solid ${form.cor === c ? "#fff" : "transparent"}`,
                          outline: form.cor === c ? `2px solid ${c}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Descricao */}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>
                    Descricao <span style={{ color: "#475569" }}>(opcional)</span>
                  </label>
                  <textarea
                    value={form.descricao}
                    onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                    placeholder="Breve descricao da loja..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
                    style={{ background: "#122039", border: "1px solid #1e3356" }}
                  />
                </div>

                {/* Dono parceiro (se grupo = partner) */}
                {form.grupo === "partner" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Dono/Parceiro</label>
                      <input
                        value={form.donoParceiro}
                        onChange={(e) => setForm((f) => ({ ...f, donoParceiro: e.target.value }))}
                        placeholder="Nome do parceiro"
                        className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                        style={{ background: "#122039", border: "1px solid #1e3356" }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>WhatsApp parceiro</label>
                      <input
                        value={form.whatsappParceiro}
                        onChange={(e) => setForm((f) => ({ ...f, whatsappParceiro: e.target.value }))}
                        placeholder="5511999999999"
                        className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                        style={{ background: "#122039", border: "1px solid #1e3356" }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={editarModal ? handleEditar : handleCriar}
                  disabled={!form.nome.trim()}
                  className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#c9a84c", color: "#0b1624" }}
                >
                  {editarModal ? "Salvar alteracoes" : "Criar Loja"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
