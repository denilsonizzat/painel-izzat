"use client";
import { useState } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
} from "@dnd-kit/core";
import { useAppStore } from "@/lib/store";
import { CAMPOS_PRODUTO, Produto } from "@/lib/data";
import { AlertTriangle, PackageSearch, ShieldCheck, ShieldX, Plus, Pencil } from "lucide-react";
import ProdutoFormModal from "./ProdutoFormModal";

type ColId = "cadastrando" | "teste" | "validado" | "reprovado";

const COLUNAS: { id: ColId; label: string; desc: string; icon: typeof AlertTriangle; cor: string }[] = [
  { id: "cadastrando", label: "Cadastrando", desc: "Campos pendentes", icon: AlertTriangle, cor: "#ef4444" },
  { id: "teste", label: "Em Teste", desc: "Testando nesta loja", icon: PackageSearch, cor: "#94a3b8" },
  { id: "validado", label: "Aprovado", desc: "Funcionou nesta loja", icon: ShieldCheck, cor: "#10b981" },
  { id: "reprovado", label: "Reprovado", desc: "Não funcionou aqui", icon: ShieldX, cor: "#f97316" },
];

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
  if (p.validado) return "validado";
  if (p.emTeste || produtoCompleto(p)) return "teste";
  return "cadastrando";
}

function Card({ p, onEdit }: { p: Produto; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: p.id });
  const feitos = camposPreenchidos(p);
  const pct = Math.round((feitos / CAMPOS_PRODUTO.length) * 100);
  const completo = feitos === CAMPOS_PRODUTO.length;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onEdit}
      className="rounded-xl p-3 cursor-pointer"
      style={{ background: "#0f1c30", border: "1px solid rgba(201,164,66,.16)", opacity: isDragging ? 0.4 : 1, touchAction: "none" }}
      data-tip="Clique para editar · arraste para mover"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white leading-tight">{p.nome}</p>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-shrink-0 p-1 rounded-lg" style={{ color: "#74859c" }} data-tip="Editar produto">
          <Pencil size={12} />
        </button>
      </div>
      {p.noAr && <span className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#10b98120", color: "#10b981" }}>No ar</span>}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: completo ? "#10b981" : "#c9a84c" }} />
        </div>
        <span className="text-xs" style={{ color: completo ? "#10b981" : "#74859c" }}>{feitos}/{CAMPOS_PRODUTO.length}</span>
      </div>
    </div>
  );
}

function Coluna({ col, produtos, onEdit }: { col: typeof COLUNAS[0]; produtos: Produto[]; onEdit: (p: Produto) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[180px] rounded-2xl p-2.5 flex flex-col gap-2"
      style={{ background: isOver ? col.cor + "12" : "#0b1624", border: `1px solid ${isOver ? col.cor : "#1e3356"}`, transition: "all 0.12s", minHeight: 200 }}
    >
      <div className="flex items-center gap-2 px-1 pb-1" data-tip={`${col.label} — ${col.desc}. Arraste cards para cá.`}>
        <col.icon size={13} style={{ color: col.cor, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight" style={{ color: col.cor }}>{col.label}</p>
          <p className="text-xs leading-tight" style={{ color: "#475569" }}>{col.desc}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: col.cor + "22", color: col.cor }}>{produtos.length}</span>
      </div>
      {produtos.map((p) => <Card key={p.id} p={p} onEdit={() => onEdit(p)} />)}
      {produtos.length === 0 && <p className="text-xs text-center py-4" style={{ color: "#334155" }}>Arraste aqui</p>}
    </div>
  );
}

/** Kanban compacto de produtos de UMA loja (status por loja). */
export default function KanbanProdutosLoja({ lojaId, todasLojas }: { lojaId: string; todasLojas: { id: string; nome: string; cor?: string }[] }) {
  const { produtos, validarProduto, reprovarProduto, editarProduto, usuarioAtual } = useAppStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [criar, setCriar] = useState(false);
  const isAdmin = usuarioAtual?.nivelAcesso === "admin";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const daLoja = produtos.filter((p) => p.lojaId === lojaId);
  const porColuna = (c: ColId) => daLoja.filter((p) => getColuna(p) === c);
  const ativo = activeId ? produtos.find((p) => p.id === activeId) : null;

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = active.id as string;
    const alvo = over.id as ColId;
    const p = produtos.find((x) => x.id === id);
    if (!p || getColuna(p) === alvo) return;
    if (alvo === "validado") validarProduto(id);
    else if (alvo === "reprovado") reprovarProduto(id);
    else if (alvo === "teste") editarProduto(id, { reprovado: false, validado: false, noAr: false, emTeste: true });
    else if (alvo === "cadastrando") editarProduto(id, { reprovado: false, validado: false, noAr: false, emTeste: false });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs" style={{ color: "#74859c" }}>
          {daLoja.length} produto{daLoja.length !== 1 ? "s" : ""} nesta loja · arraste entre as colunas
        </p>
        {isAdmin && (
          <button onClick={() => setCriar(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: "#c9a84c", color: "#0b1624" }}>
            <Plus size={13} /> Novo produto aqui
          </button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)} onDragEnd={onDragEnd}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {COLUNAS.map((c) => <Coluna key={c.id} col={c} produtos={porColuna(c.id)} onEdit={setEditando} />)}
        </div>
        <DragOverlay>
          {ativo && (
            <div className="rounded-xl p-3 shadow-2xl" style={{ background: "#112239", border: "1px solid #c9a84c", transform: "rotate(2deg)" }}>
              <p className="text-sm font-semibold text-white">{ativo.nome}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {criar && <ProdutoFormModal onClose={() => setCriar(false)} lojaIdInicial={lojaId} todasLojas={todasLojas} />}
      {editando && <ProdutoFormModal onClose={() => setEditando(null)} produtoParaEditar={editando} todasLojas={todasLojas} />}
    </div>
  );
}
