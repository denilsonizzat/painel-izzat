"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { CategoriaRegraEmpresa, RigidzRegraEmpresa, RegraEmpresa } from "@/lib/data";
import { Plus, X, Pencil, Trash2, ShieldAlert, BookOpen, Check } from "lucide-react";
import BackButton from "@/components/BackButton";

const CATEGORIAS: { value: CategoriaRegraEmpresa; label: string; cor: string; emoji: string }[] = [
  { value: "operacional", label: "Operacional", cor: "#3b82f6", emoji: "⚙️" },
  { value: "arquivos", label: "Arquivos", cor: "#10b981", emoji: "📁" },
  { value: "qualidade", label: "Qualidade", cor: "#8b5cf6", emoji: "✅" },
  { value: "comunicacao", label: "Comunicação", cor: "#f59e0b", emoji: "💬" },
  { value: "seguranca", label: "Segurança", cor: "#ef4444", emoji: "🔐" },
  { value: "outro", label: "Outro", cor: "#64748b", emoji: "📌" },
];

const RIGIDEZ: { value: RigidzRegraEmpresa; label: string; desc: string; cor: string; bg: string; icone: string }[] = [
  { value: "inflexivel", label: "Inegociável", desc: "Sem exceções. Obrigatório sempre.", cor: "#ef4444", bg: "#ef444415", icone: "🔴" },
  { value: "recomendado", label: "Recomendado", desc: "Fortemente recomendado. Desvios precisam de justificativa.", cor: "#f59e0b", bg: "#f59e0b15", icone: "🟡" },
  { value: "maleavel", label: "Maleável", desc: "Diretriz flexível. Adaptável ao contexto.", cor: "#10b981", bg: "#10b98115", icone: "🟢" },
];

const ICONES_SUGERIDOS = ["🛒", "☁️", "📁", "🔐", "💬", "✅", "⚙️", "📌", "🚫", "📋", "🎯", "⚠️", "🔑", "📱", "💻", "🤝", "🕐", "💰", "📊", "🔧"];

const emptyForm = {
  titulo: "",
  descricao: "",
  categoria: "operacional" as CategoriaRegraEmpresa,
  rigidez: "inflexivel" as RigidzRegraEmpresa,
  icone: "📌",
};

export default function RegrasPage() {
  const { regrasEmpresa, criarRegra, editarRegra, deletarRegra, toggleRegra, usuarioAtual } = useAppStore();
  const isAdmin = usuarioAtual?.nivelAcesso === "admin";

  const [filtroCategoria, setFiltroCategoria] = useState<"todos" | CategoriaRegraEmpresa>("todos");
  const [filtroRigidez, setFiltroRigidez] = useState<"todos" | RigidzRegraEmpresa>("todos");
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const upd = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function abrirNova() {
    setEditandoId(null);
    setForm(emptyForm);
    setModalAberto(true);
  }

  function abrirEditar(r: RegraEmpresa) {
    setEditandoId(r.id);
    setForm({ titulo: r.titulo, descricao: r.descricao, categoria: r.categoria, rigidez: r.rigidez, icone: r.icone });
    setModalAberto(true);
  }

  function handleSalvar() {
    if (!form.titulo.trim()) return;
    if (editandoId) {
      editarRegra(editandoId, form);
    } else {
      criarRegra(form);
    }
    setModalAberto(false);
    setEditandoId(null);
    setForm(emptyForm);
  }

  const regras = regrasEmpresa
    .filter((r) => mostrarInativas || r.ativa)
    .filter((r) => filtroCategoria === "todos" || r.categoria === filtroCategoria)
    .filter((r) => filtroRigidez === "todos" || r.rigidez === filtroRigidez);

  const contPorRigidez = {
    inflexivel: regrasEmpresa.filter((r) => r.ativa && r.rigidez === "inflexivel").length,
    recomendado: regrasEmpresa.filter((r) => r.ativa && r.rigidez === "recomendado").length,
    maleavel: regrasEmpresa.filter((r) => r.ativa && r.rigidez === "maleavel").length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton href="/dashboard" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "#c9a84c20", border: "1px solid #c9a84c30" }}>
              📋
            </div>
            <h1 className="text-2xl font-bold text-white">Regras da Empresa</h1>
          </div>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Diretrizes operacionais do time Izzat. O que é inegociável, o que é recomendado e o que é flexível.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={abrirNova}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity active:scale-95"
            style={{ background: "#c9a84c", color: "#0b1624" }}
          >
            <Plus size={16} /> Nova Regra
          </button>
        )}
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-3">
        {RIGIDEZ.map((r) => (
          <button
            key={r.value}
            onClick={() => setFiltroRigidez(filtroRigidez === r.value ? "todos" : r.value)}
            className="rounded-2xl p-4 text-left transition-all hover:scale-[1.02]"
            style={{
              background: filtroRigidez === r.value ? r.bg : "#122039",
              border: `2px solid ${filtroRigidez === r.value ? r.cor : "#1e3356"}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{r.icone}</span>
              <span className="text-xl font-black" style={{ color: r.cor }}>{contPorRigidez[r.value]}</span>
            </div>
            <p className="text-xs font-semibold" style={{ color: filtroRigidez === r.value ? r.cor : "#64748b" }}>{r.label}</p>
            <p className="text-xs mt-0.5 leading-tight" style={{ color: "#475569" }}>{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFiltroCategoria("todos")}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{ background: filtroCategoria === "todos" ? "#c9a84c" : "#122039", color: filtroCategoria === "todos" ? "#0b1624" : "#64748b", border: `1px solid ${filtroCategoria === "todos" ? "#c9a84c" : "#1e3356"}` }}
        >
          Todas
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c.value}
            onClick={() => setFiltroCategoria(filtroCategoria === c.value ? "todos" : c.value)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1"
            style={{ background: filtroCategoria === c.value ? c.cor + "25" : "#122039", color: filtroCategoria === c.value ? c.cor : "#64748b", border: `1px solid ${filtroCategoria === c.value ? c.cor : "#1e3356"}` }}
          >
            {c.emoji} {c.label}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={() => setMostrarInativas(!mostrarInativas)}
            className="ml-auto px-3 py-1.5 rounded-full text-xs transition-all"
            style={{ background: mostrarInativas ? "#1e3356" : "#122039", color: "#475569", border: "1px solid #1e3356" }}
          >
            {mostrarInativas ? "Ocultar inativas" : "Ver inativas"}
          </button>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 px-4 py-2 rounded-xl" style={{ background: "#0d1928", border: "1px solid #1e3356" }}>
        <div className="flex items-center gap-1.5">
          <ShieldAlert size={12} style={{ color: "#ef4444" }} />
          <span className="text-xs" style={{ color: "#64748b" }}>Inegociável = sem exceções</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen size={12} style={{ color: "#f59e0b" }} />
          <span className="text-xs" style={{ color: "#64748b" }}>Recomendado = desvio precisa de justificativa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check size={12} style={{ color: "#10b981" }} />
          <span className="text-xs" style={{ color: "#64748b" }}>Maleável = adaptar ao contexto</span>
        </div>
      </div>

      {/* Lista de regras */}
      <div className="space-y-3">
        {regras.length === 0 && (
          <div className="rounded-2xl p-10 text-center space-y-2" style={{ background: "#122039", border: "1px solid #1e3356" }}>
            <div className="text-4xl">📋</div>
            <p className="text-white font-medium">Nenhuma regra encontrada</p>
            <p className="text-sm" style={{ color: "#475569" }}>
              {filtroCategoria !== "todos" || filtroRigidez !== "todos"
                ? "Tente limpar os filtros acima"
                : isAdmin ? "Clique em Nova Regra para adicionar a primeira diretriz" : "Aguarde o gestor adicionar as regras do time"}
            </p>
          </div>
        )}

        {regras.map((regra) => {
          const rigidez = RIGIDEZ.find((r) => r.value === regra.rigidez)!;
          const categoria = CATEGORIAS.find((c) => c.value === regra.categoria)!;
          return (
            <div
              key={regra.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#122039",
                border: `1px solid ${regra.ativa ? rigidez.cor + "35" : "#1e3356"}`,
                opacity: regra.ativa ? 1 : 0.5,
              }}
            >
              {/* Barra lateral colorida */}
              <div className="flex">
                <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{ background: regra.ativa ? rigidez.cor : "#334155" }} />

                <div className="flex-1 p-5">
                  <div className="flex items-start gap-4">
                    {/* Ícone */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: rigidez.bg, border: `1px solid ${rigidez.cor}25` }}
                    >
                      {regra.icone}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-white">{regra.titulo}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                          style={{ background: rigidez.bg, color: rigidez.cor }}>
                          {rigidez.icone} {rigidez.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ background: categoria.cor + "15", color: categoria.cor }}>
                          {categoria.emoji} {categoria.label}
                        </span>
                        {!regra.ativa && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e3356", color: "#475569" }}>
                            Inativa
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                        {regra.descricao}
                      </p>
                      <p className="text-xs mt-2" style={{ color: "#334155" }}>
                        Criada em {regra.criadaEm}
                      </p>
                    </div>

                    {/* Ações — admin */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => toggleRegra(regra.id)}
                          className="p-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{ background: regra.ativa ? "#10b98115" : "#1e3356", color: regra.ativa ? "#10b981" : "#475569" }}
                          title={regra.ativa ? "Desativar regra" : "Ativar regra"}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => abrirEditar(regra)}
                          className="p-1.5 rounded-lg hover:opacity-80"
                          style={{ background: "#1e3356", color: "#64748b" }}
                          title="Editar regra"
                        >
                          <Pencil size={13} />
                        </button>
                        {confirmDeleteId === regra.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { deletarRegra(regra.id); setConfirmDeleteId(null); }}
                              className="px-2 py-1 rounded-lg text-xs font-bold"
                              style={{ background: "#ef444420", color: "#ef4444" }}
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1.5 rounded-lg"
                              style={{ color: "#64748b" }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(regra.id)}
                            className="p-1.5 rounded-lg hover:opacity-80"
                            style={{ background: "#1e3356", color: "#64748b" }}
                            title="Deletar regra"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal nova/editar regra */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto"
          style={{ background: "#00000085" }}
          onClick={() => setModalAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-5 my-4"
            style={{ background: "#122039", border: "1px solid #1e3356" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">
                {editandoId ? "Editar Regra" : "Nova Regra"}
              </h2>
              <button onClick={() => setModalAberto(false)} style={{ color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            {/* Ícone */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#64748b" }}>
                Ícone
              </label>
              <div className="flex gap-2 flex-wrap">
                {ICONES_SUGERIDOS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => upd("icone", ic)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110"
                    style={{
                      background: form.icone === ic ? "#c9a84c20" : "#1e3356",
                      border: `1.5px solid ${form.icone === ic ? "#c9a84c" : "#334155"}`,
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#64748b" }}>Título *</label>
              <input
                autoFocus
                value={form.titulo}
                onChange={(e) => upd("titulo", e.target.value)}
                placeholder="Ex: Shopify só manual"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: "#0b1624", border: "1px solid #1e3356" }}
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#64748b" }}>Descrição</label>
              <textarea
                value={form.descricao}
                onChange={(e) => upd("descricao", e.target.value)}
                placeholder="Explique o que é a regra, por que existe e como aplicar..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                style={{ background: "#0b1624", border: "1px solid #1e3356" }}
              />
            </div>

            {/* Rigidez */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#64748b" }}>Nível de rigidez</label>
              <div className="space-y-2">
                {RIGIDEZ.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => upd("rigidez", r.value)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: form.rigidez === r.value ? r.bg : "#1e3356",
                      border: `1.5px solid ${form.rigidez === r.value ? r.cor : "#334155"}`,
                    }}
                  >
                    <span className="text-lg">{r.icone}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: form.rigidez === r.value ? r.cor : "#e8edf5" }}>{r.label}</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#64748b" }}>Categoria</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIAS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => upd("categoria", c.value)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    style={{
                      background: form.categoria === c.value ? c.cor + "20" : "#1e3356",
                      border: `1.5px solid ${form.categoria === c.value ? c.cor : "#334155"}`,
                      color: form.categoria === c.value ? c.cor : "#64748b",
                    }}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalAberto(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "#1e3356", color: "#94a3b8" }}>
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={!form.titulo.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ background: "#c9a84c", color: "#0b1624" }}>
                {editandoId ? "Salvar" : "Criar Regra"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
