"use client";
import { useAppStore } from "@/lib/store";
import { LOJAS, CAMPOS_PRODUTO, Produto } from "@/lib/data";
import {
  PackageSearch, Plus, X, Check, ExternalLink,
  AlertTriangle, Trash2, Globe, Share2, ShieldCheck, Copy, FileText,
  GitBranch, Store, MoreHorizontal, ShieldX,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProdutoFormModal from "@/components/ProdutoFormModal";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  useDroppable, useDraggable, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";

// ── Tipos ────────────────────────────────────────────────────────
type FiltroOrigem = "todas" | "origem" | "distribuidos";

const COLUNAS = [
  {
    id: "cadastrando" as const,
    label: "Cadastrando",
    desc: "Campos pendentes",
    icon: AlertTriangle,
    cor: "#ef4444",
    bg: "#ef444408",
    borda: "#ef444430",
  },
  {
    id: "teste" as const,
    label: "Em Teste",
    desc: "Izzat Express Global",
    icon: PackageSearch,
    cor: "#94a3b8",
    bg: "#1e335608",
    borda: "#1e3356",
  },
  {
    id: "validado" as const,
    label: "Validado",
    desc: "Vendeu — pronto p/ distribuir",
    icon: ShieldCheck,
    cor: "#3b82f6",
    bg: "#3b82f608",
    borda: "#3b82f630",
  },
  {
    id: "distribuido" as const,
    label: "Distribuído",
    desc: "Em lojas nichadas",
    icon: Share2,
    cor: "#10b981",
    bg: "#10b98108",
    borda: "#10b98130",
  },
  {
    id: "reprovado" as const,
    label: "Reprovado",
    desc: "Não funcionou",
    icon: ShieldX,
    cor: "#f97316",
    bg: "#f9731608",
    borda: "#f9731630",
  },
] as const;

type ColId = (typeof COLUNAS)[number]["id"];
type LojaItem = { id: string; nome: string; cor?: string; grupo?: string; mercado?: string };

// ── Helpers ──────────────────────────────────────────────────────
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

function getColuna(p: Produto): ColId {
  if (p.reprovado) return "reprovado";
  if ((p.distribuidoPara?.length ?? 0) > 0) return "distribuido";
  if (p.validado) return "validado";
  if (produtoCompleto(p)) return "teste";
  return "cadastrando";
}

// ── Droppable column ─────────────────────────────────────────────
function KanbanCol({
  col,
  count,
  children,
}: {
  col: (typeof COLUNAS)[number];
  count: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-2xl p-3 gap-2"
      style={{
        minWidth: "272px",
        maxWidth: "272px",
        minHeight: "480px",
        background: isOver ? col.cor + "18" : col.bg,
        border: `2px solid ${isOver ? col.cor + "80" : col.borda}`,
        transition: "background 0.12s, border-color 0.12s",
      }}
    >
      {/* Cabeçalho da coluna */}
      <div className="flex items-center gap-2 px-1 pb-1" data-tip={`Etapa do pipeline: ${col.label} — ${col.desc}. Arraste cards para cá para mover o produto.`}>
        <col.icon size={13} style={{ color: col.cor, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight" style={{ color: col.cor }}>{col.label}</p>
          <p className="text-xs leading-tight" style={{ color: "#74859c" }}>{col.desc}</p>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: col.cor + "22", color: col.cor }}
        >
          {count}
        </span>
      </div>
      <div className="h-px flex-shrink-0" style={{ background: col.borda }} />

      {/* Cards + empty state */}
      <div className="flex flex-col gap-2 flex-1">
        {children}
        {count === 0 && (
          <div
            className="flex-1 rounded-xl border-dashed flex items-center justify-center"
            style={{ border: `1.5px dashed ${col.borda}`, minHeight: "80px" }}
          >
            <p className="text-xs" style={{ color: "#334155" }}>Arraste aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Draggable card ───────────────────────────────────────────────
function KanbanCard({
  p,
  todasLojas,
  isAdmin,
  onEdit,
  onDelete,
  onDistribuir,
  onValidar,
  onReprovar,
  onReativar,
  onToggleAr,
}: {
  p: Produto;
  todasLojas: LojaItem[];
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDistribuir: () => void;
  onValidar: () => void;
  onReprovar: () => void;
  onReativar: () => void;
  onToggleAr: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: p.id });
  const [expandido, setExpandido] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loja = todasLojas.find((l) => l.id === p.lojaId);
  const preenchidos = camposPreenchidos(p);
  const completo = preenchidos === CAMPOS_PRODUTO.length;
  const pct = Math.round((preenchidos / CAMPOS_PRODUTO.length) * 100);
  const jaDistribuido = p.distribuidoPara ?? [];

  const borderColor = p.reprovado
    ? "#f9731640"
    : p.noAr
    ? "#10b98150"
    : p.validado
    ? "#3b82f640"
    : completo
    ? "#c9a84c30"
    : "#1e3356";

  const dragStyle = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        ...dragStyle,
        opacity: isDragging ? 0.35 : 1,
        position: "relative",
        zIndex: isDragging ? 999 : "auto",
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="rounded-xl overflow-hidden select-none"
    >
      <div className="rounded-xl overflow-hidden" style={{ background: "#122039", border: `1px solid ${borderColor}` }}>

        {/* Linha superior: nome + menu */}
        <div className="flex items-start gap-2 px-3 pt-3 pb-2">

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">{p.nome}</p>

            {/* Badges */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {loja && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: (loja.cor || "#64748b") + "20", color: loja.cor || "#64748b" }}
                >
                  {loja.nome}
                </span>
              )}
              {p.produtoOrigemId && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5" style={{ background: "#8b5cf620", color: "#8b5cf6" }}>
                  <Copy size={8} /> Cópia
                </span>
              )}
              {jaDistribuido.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5" style={{ background: "#10b98118", color: "#10b981" }}>
                  <Share2 size={8} /> {jaDistribuido.length} {jaDistribuido.length === 1 ? "loja" : "lojas"}
                </span>
              )}
              {p.noAr && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5" style={{ background: "#10b98118", color: "#10b981" }}>
                  <Globe size={8} /> No Ar
                </span>
              )}
              {p.reprovado && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#f9731620", color: "#f97316" }}>
                  Reprovado
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpandido((v) => !v)}
            className="flex-shrink-0 p-1 rounded-lg transition-all hover:bg-slate-800 mt-0.5"
            style={{ color: expandido ? "#94a3b8" : "#475569" }}
          >
            <MoreHorizontal size={13} />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: completo ? "#c9a84c" : pct >= 70 ? "#f97316" : "#ef4444",
                }}
              />
            </div>
            <span className="text-xs font-mono flex-shrink-0" style={{ color: completo ? "#c9a84c" : "#64748b" }}>
              {preenchidos}/{CAMPOS_PRODUTO.length}
            </span>
          </div>

          {/* Métricas chave */}
          {(p.valorDeVenda || p.margemLucro) && (
            <div className="flex items-center gap-3 mt-1.5">
              {p.valorDeVenda && (
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  R$ {p.valorDeVenda.toFixed(2)}
                </span>
              )}
              {p.margemLucro && (
                <span
                  className="text-xs font-bold"
                  style={{ color: p.margemLucro >= 40 ? "#10b981" : p.margemLucro >= 20 ? "#c9a84c" : "#ef4444" }}
                >
                  {p.margemLucro}% margem
                </span>
              )}
            </div>
          )}
        </div>

        {/* Painel expandido */}
        {expandido && (
          <div className="border-t px-3 pb-3 pt-2.5 space-y-2" style={{ borderColor: "#1e3356" }}>

            {/* Ações rápidas */}
            <div className="flex flex-wrap gap-1.5">
              {isAdmin && !p.validado && !p.reprovado && completo && (
                <button
                  onClick={onValidar}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={{ background: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f640" }}
                >
                  <ShieldCheck size={10} /> Validar
                </button>
              )}
              {isAdmin && p.validado && !p.produtoOrigemId && (
                <button
                  onClick={onDistribuir}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={{ background: "#8b5cf620", color: "#8b5cf6", border: "1px solid #8b5cf640" }}
                >
                  <Share2 size={10} /> Distribuir
                </button>
              )}
              {completo && (
                <button
                  onClick={onToggleAr}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={{
                    background: p.noAr ? "#10b98122" : "#1e3356",
                    color: p.noAr ? "#10b981" : "#64748b",
                    border: `1px solid ${p.noAr ? "#10b98140" : "#1e3356"}`,
                  }}
                >
                  <Globe size={10} /> {p.noAr ? "No Ar ✓" : "Colocar no Ar"}
                </button>
              )}
              {isAdmin && p.reprovado && (
                <button
                  onClick={onReativar}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={{ background: "#3b82f615", color: "#3b82f6", border: "1px solid #3b82f630" }}
                >
                  <PackageSearch size={10} /> Reativar
                </button>
              )}
              {isAdmin && !p.reprovado && (
                <button
                  onClick={onReprovar}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={{ background: "#f9731615", color: "#f97316", border: "1px solid #f9731630" }}
                >
                  <ShieldX size={10} /> Reprovar
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold"
                  style={{ background: "#1e3356", color: "#94a3b8" }}
                >
                  Editar
                </button>
              )}
            </div>

            {/* Documento */}
            {p.linkDocumentoProduto && (
              <a
                href={p.linkDocumentoProduto}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "#4285f415", color: "#4285f4", border: "1px solid #4285f430" }}
              >
                <FileText size={10} />
                Documento do Produto
                <ExternalLink size={9} className="ml-auto" />
              </a>
            )}

            {/* Campos incompletos */}
            {!completo && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg" style={{ background: "#ef444412", border: "1px solid #ef444425" }}>
                <AlertTriangle size={10} style={{ color: "#ef4444", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  Faltam {CAMPOS_PRODUTO.length - preenchidos} campos obrigatórios
                </p>
              </div>
            )}

            {/* Distribuído para */}
            {jaDistribuido.length > 0 && (
              <div>
                <p className="text-xs mb-1" style={{ color: "#74859c" }}>Distribuído para:</p>
                <div className="flex flex-wrap gap-1">
                  {jaDistribuido.map((lid) => {
                    const l = todasLojas.find((x) => x.id === lid);
                    return l ? (
                      <span key={lid} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#1e3356", color: l.cor || "#94a3b8" }}>
                        {l.nome}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Excluir */}
            {isAdmin && (
              <div className="flex justify-end pt-1">
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: "#ef4444" }}>Confirmar?</span>
                    <button
                      onClick={onDelete}
                      className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{ background: "#ef444430", color: "#ef4444" }}
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "#1e3356", color: "#9aa7ba" }}
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-all"
                    style={{ color: "#334155" }}
                  >
                    <Trash2 size={9} /> Excluir
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
export default function CatalogoPage() {
  const router = useRouter();
  const {
    usuarioAtual, lojasCustom, produtos,
    deletarProduto, toggleProdutoNoAr, editarProduto,
    validarProduto, reprovarProduto, distribuirProduto,
  } = useAppStore();

  const [filtroLoja, setFiltroLoja] = useState<string>("todas");
  const [filtroOrigem, setFiltroOrigem] = useState<FiltroOrigem>("todas");
  const [criarModalAberto, setCriarModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [distribuirModal, setDistribuirModal] = useState<Produto | null>(null);
  const [lojasDistribuir, setLojasDistribuir] = useState<string[]>([]);
  const [distribuirSucesso, setDistribuirSucesso] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (!usuarioAtual) router.push("/");
  }, [usuarioAtual, router]);

  if (!usuarioAtual) return null;

  const todasLojas: LojaItem[] = [...LOJAS, ...lojasCustom];
  const isAdmin = usuarioAtual.nivelAcesso === "admin";

  const produtosFiltrados = produtos.filter((p) => {
    const lojaOk = filtroLoja === "todas" || p.lojaId === filtroLoja;
    const origemOk =
      filtroOrigem === "todas"
        ? true
        : filtroOrigem === "origem"
        ? !p.produtoOrigemId
        : !!p.produtoOrigemId;
    return lojaOk && origemOk;
  });

  const porColuna = (colId: ColId) =>
    produtosFiltrados.filter((p) => getColuna(p) === colId);

  const activeProduct = activeId ? produtos.find((p) => p.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const prodId = active.id as string;
    const targetCol = over.id as ColId;
    const prod = produtos.find((pp) => pp.id === prodId);
    if (!prod || getColuna(prod) === targetCol) return;

    if (targetCol === "validado") {
      validarProduto(prodId);
    } else if (targetCol === "reprovado") {
      reprovarProduto(prodId);
    } else if (targetCol === "distribuido") {
      setDistribuirModal(prod);
      setLojasDistribuir([]);
      setDistribuirSucesso(false);
    } else if (targetCol === "teste" || targetCol === "cadastrando") {
      // Voltar para Em Teste / Cadastrando de qualquer estágio (validado, reprovado,
      // distribuído): limpa os flags. A coluna final (teste vs cadastrando) é
      // decidida por getColuna conforme o produto está completo ou não.
      editarProduto(prodId, { reprovado: false, validado: false, noAr: false, distribuidoPara: [] });
    }
  }

  function abrirDistribuir(p: Produto) {
    setLojasDistribuir([]);
    setDistribuirSucesso(false);
    setDistribuirModal(p);
  }

  function handleDistribuir() {
    if (!distribuirModal || lojasDistribuir.length === 0) return;
    distribuirProduto(distribuirModal.id, lojasDistribuir);
    setDistribuirSucesso(true);
    setTimeout(() => setDistribuirModal(null), 1500);
  }

  function toggleLojaDistribuir(lojaId: string) {
    setLojasDistribuir((prev) =>
      prev.includes(lojaId) ? prev.filter((id) => id !== lojaId) : [...prev, lojaId]
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>
            Arraste os cards entre colunas para mover o produto no pipeline · {produtos.length} produto{produtos.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCriarModalAberto(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ background: "#c9a84c", color: "#0b1624" }}
          >
            <Plus size={14} /> Novo Produto
          </button>
        )}
      </div>

      {/* Barra de filtros compacta */}
      <div
        className="rounded-2xl px-4 py-2.5 flex items-center gap-4 flex-wrap"
        style={{ background: "#0a1a2e", border: "1px solid #1e3356" }}
      >
        {/* Tipo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-shrink-0" data-tip="Filtra por origem do produto: Originais (testados na loja matriz) ou Cópias (distribuídos para lojas nichadas)">
            <GitBranch size={10} style={{ color: "#74859c" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#74859c" }}>Tipo</span>
          </div>
          {([
            { v: "todas", label: "Todos" },
            { v: "origem", label: "★ Originais" },
            { v: "distribuidos", label: "↗ Cópias" },
          ] as const).map((f) => (
            <button
              key={f.v}
              onClick={() => setFiltroOrigem(f.v)}
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: filtroOrigem === f.v ? "#c9a84c22" : "#122039",
                color: filtroOrigem === f.v ? "#c9a84c" : "#475569",
                border: `1px solid ${filtroOrigem === f.v ? "#c9a84c50" : "#1e3356"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 flex-shrink-0" style={{ background: "#1e3356" }} />

        {/* Loja */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-shrink-0" data-tip="Filtra os produtos por loja">
            <Store size={10} style={{ color: "#74859c" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#74859c" }}>Loja</span>
          </div>
          <button
            onClick={() => setFiltroLoja("todas")}
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filtroLoja === "todas" ? "#33415560" : "#122039",
              color: filtroLoja === "todas" ? "#cbd5e1" : "#475569",
              border: `1px solid ${filtroLoja === "todas" ? "#475569" : "#1e3356"}`,
            }}
          >
            Todas
          </button>
          {todasLojas.map((l) => {
            const cor = l.cor || "#64748b";
            const ativo = filtroLoja === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setFiltroLoja(l.id)}
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: ativo ? cor + "22" : "#122039",
                  color: ativo ? cor : "#475569",
                  border: `1px solid ${ativo ? cor + "60" : "#1e3356"}`,
                }}
              >
                {l.nome}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda de arrastar */}
      <div className="flex items-center gap-4 flex-wrap">
        {COLUNAS.map((col) => (
          <div key={col.id} className="flex items-center gap-1.5">
            <col.icon size={11} style={{ color: col.cor }} />
            <span className="text-xs" style={{ color: "#9aa7ba" }}>{col.label}</span>
            <span
              className="text-xs font-bold px-1.5 py-0 rounded-full"
              style={{ background: col.cor + "20", color: col.cor }}
            >
              {porColuna(col.id).length}
            </span>
          </div>
        ))}
      </div>

      {/* Board Kanban */}
      <div className="overflow-x-auto -mx-1 px-1 pb-4">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {COLUNAS.map((col) => {
              const cards = porColuna(col.id);
              return (
                <KanbanCol key={col.id} col={col} count={cards.length}>
                  {cards.map((p) => (
                    <KanbanCard
                      key={p.id}
                      p={p}
                      todasLojas={todasLojas}
                      isAdmin={isAdmin}
                      onEdit={() => setProdutoEditando(p)}
                      onDelete={() => deletarProduto(p.id)}
                      onDistribuir={() => abrirDistribuir(p)}
                      onValidar={() => validarProduto(p.id)}
                      onReprovar={() => reprovarProduto(p.id)}
                      onReativar={() => editarProduto(p.id, { reprovado: false, validado: false, noAr: false })}
                      onToggleAr={() => toggleProdutoNoAr(p.id)}
                    />
                  ))}
                </KanbanCol>
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeProduct && (
              <div
                className="rounded-xl p-3 rotate-2 shadow-2xl"
                style={{
                  background: "#1a2e4a",
                  border: "1px solid #3b82f660",
                  minWidth: "250px",
                  maxWidth: "270px",
                  boxShadow: "0 20px 60px #00000080",
                }}
              >
                <p className="text-sm font-bold text-white">{activeProduct.nome}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>
                  {todasLojas.find((l) => l.id === activeProduct.lojaId)?.nome ?? ""}
                </p>
                <div className="mt-2 h-1 rounded-full" style={{ background: "#1e3356" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((camposPreenchidos(activeProduct) / CAMPOS_PRODUTO.length) * 100)}%`,
                      background: "#c9a84c",
                    }}
                  />
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modal distribuir */}
      {distribuirModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000090" }}
          onClick={() => !distribuirSucesso && setDistribuirModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0b1624", border: "1px solid #8b5cf640", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid #1e3356" }}>
              <div>
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                  <Share2 size={14} style={{ color: "#8b5cf6" }} /> Distribuir Produto
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>{distribuirModal.nome}</p>
              </div>
              <button onClick={() => setDistribuirModal(null)} style={{ color: "#9aa7ba" }}>
                <X size={16} />
              </button>
            </div>

            {distribuirSucesso ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#8b5cf622", border: "2px solid #8b5cf6" }}>
                  <Check size={24} style={{ color: "#8b5cf6" }} />
                </div>
                <p className="text-white font-bold">
                  Distribuído para {lojasDistribuir.length} {lojasDistribuir.length === 1 ? "loja" : "lojas"}!
                </p>
                <p className="text-xs text-center px-6" style={{ color: "#9aa7ba" }}>
                  Cada cópia precisa ter o Link Shopify Produto atualizado na loja destino.
                </p>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-4" style={{ maxHeight: "calc(90vh - 80px)", overflowY: "auto" }}>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Selecione as lojas que vão receber uma cópia deste produto. Cada cópia herda todos os dados exceto o Link Shopify.
                </p>
                <div className="space-y-2">
                  {todasLojas
                    .filter(
                      (l) =>
                        l.id !== distribuirModal.lojaId &&
                        !(distribuirModal.distribuidoPara ?? []).includes(l.id)
                    )
                    .map((l) => {
                      const selecionada = lojasDistribuir.includes(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => toggleLojaDistribuir(l.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                          style={{
                            background: selecionada ? "#8b5cf620" : "#122039",
                            border: `1px solid ${selecionada ? "#8b5cf660" : "#1e3356"}`,
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              background: selecionada ? "#8b5cf6" : "#1e3356",
                              border: `1px solid ${selecionada ? "#8b5cf6" : "#334155"}`,
                            }}
                          >
                            {selecionada && <Check size={10} style={{ color: "#fff" }} />}
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.cor || "#64748b" }} />
                            <p className="text-sm font-medium text-white">{l.nome}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
                {todasLojas.filter(
                  (l) =>
                    l.id !== distribuirModal.lojaId &&
                    !(distribuirModal.distribuidoPara ?? []).includes(l.id)
                ).length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "#74859c" }}>
                    Produto já distribuído para todas as lojas disponíveis.
                  </p>
                )}
                <button
                  onClick={handleDistribuir}
                  disabled={lojasDistribuir.length === 0}
                  className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#8b5cf6", color: "#fff" }}
                >
                  Distribuir para{" "}
                  {lojasDistribuir.length > 0
                    ? `${lojasDistribuir.length} ${lojasDistribuir.length === 1 ? "loja" : "lojas"}`
                    : "lojas selecionadas"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modais produto */}
      {criarModalAberto && (
        <ProdutoFormModal
          lojaIdInicial={
            filtroLoja !== "todas"
              ? filtroLoja
              : (todasLojas.find((l) => l.id === "izzat-express")?.id ?? todasLojas[0]?.id)
          }
          todasLojas={todasLojas}
          onClose={() => setCriarModalAberto(false)}
        />
      )}
      {produtoEditando && (
        <ProdutoFormModal
          produtoParaEditar={produtoEditando}
          todasLojas={todasLojas}
          onClose={() => setProdutoEditando(null)}
        />
      )}
    </div>
  );
}
