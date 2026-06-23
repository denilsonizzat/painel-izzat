"use client";
import { useAppStore } from "@/lib/store";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { calcNivel } from "@/lib/data";
import { rotinasDoColaborador } from "@/lib/recorrencia";
import { Zap, Flame, UserPlus, X } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useState } from "react";

function calcProgresso(rotinas: { concluida: boolean; subtarefas: { concluida: boolean }[] }[]) {
  if (!rotinas.length) return 100;
  const total = rotinas.reduce((acc, r) => acc + r.subtarefas.length, 0);
  if (total === 0) return rotinas.every((r) => r.concluida) ? 100 : 0;
  const feitas = rotinas.reduce((acc, r) => acc + r.subtarefas.filter((s) => s.concluida).length, 0);
  return Math.round((feitas / total) * 100);
}

function calcExpectativas(expectativas: { cumprida: boolean; peso: number }[]) {
  if (!expectativas.length) return 100;
  const total = expectativas.reduce((acc, e) => acc + e.peso, 0);
  const cumprido = expectativas.filter((e) => e.cumprida).reduce((acc, e) => acc + e.peso, 0);
  return Math.round((cumprido / total) * 100);
}

const CORES_PALETTE = [
  "#8B5CF6", "#10B981", "#EC4899", "#F59E0B", "#14B8A6",
  "#6366F1", "#EF4444", "#D946EF", "#0EA5E9", "#F97316",
  "#84CC16", "#06B6D4", "#C9A84C", "#64748B", "#E11D48",
];

export default function EquipePage() {
  const { colaboradores, rotinas, usuarioAtual, criarColaborador } = useAppStore();

  const [novoMembro, setNovoMembro] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cargo: "",
    cor: "#8B5CF6",
    nivelAcesso: "colaborador" as "admin" | "colaborador",
    email: "",
  });
  const [erro, setErro] = useState("");

  if (!usuarioAtual) return null;

  const isAdmin = usuarioAtual.nivelAcesso === "admin";

  const handleCriar = () => {
    if (!form.nome.trim()) { setErro("Nome obrigatório"); return; }
    if (!form.cargo.trim()) { setErro("Cargo obrigatório"); return; }
    criarColaborador(form);
    setNovoMembro(false);
    setForm({ nome: "", cargo: "", cor: "#8B5CF6", nivelAcesso: "colaborador", email: "" });
    setErro("");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <BackButton href="/dashboard" />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipe</h1>
          <p className="text-sm mt-1" style={{ color: "#9aa7ba" }}>
            {"Todos os membros da sua equipe em um lugar só"}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "#10b98120", color: "#10b981" }}>
              {colaboradores.filter((c) => c.statusOnline?.ativo).length} online agora
            </span>
            <span className="text-xs" style={{ color: "#74859c" }}>
              {colaboradores.length} {colaboradores.length === 1 ? "membro" : "membros"} no total &middot; Clique para ver perfil
            </span>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setNovoMembro(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: "#c9a84c", color: "#0b1624" }}
          >
            <UserPlus size={16} />
            Adicionar Membro
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {colaboradores.map((c) => {
          const pctRotina = calcProgresso(rotinasDoColaborador(rotinas, c.id));
          const pctExp = calcExpectativas(c.expectativas);
          const corRotina = pctRotina === 100 ? "#10b981" : pctRotina >= 50 ? "#f59e0b" : "#ef4444";
          const corExp = pctExp === 100 ? "#10b981" : pctExp >= 50 ? "#f59e0b" : "#ef4444";
          const top3 = [...c.habilidades].sort((a, b) => b.nivel - a.nivel).slice(0, 3);
          const nivelInfo = calcNivel(c.xp || 0);
          return (
            <Link
              key={c.id}
              href={`/equipe/${c.id}`}
              className="block rounded-2xl p-4 transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ background: "#112239", border: `1px solid ${c.cor}30` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm truncate">{c.nome}</p>
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: c.statusOnline?.ativo ? (c.statusOnline.foco ? "#f97316" : "#10b981") : "#475569" }} />
                  </div>
                  <p className="text-xs truncate" style={{ color: "#9aa7ba" }}>{c.cargo}</p>
                  {c.statusOnline?.ativo && c.statusOnline?.trabalhando && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "#9aa7ba", maxWidth: 140 }}>
                      &rarr; {c.statusOnline.trabalhando}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <Zap size={10} style={{ color: nivelInfo.cor }} />
                    <span className="text-xs" style={{ color: nivelInfo.cor }}>{nivelInfo.nome}</span>
                    {(c.streak || 0) > 0 && (
                      <>
                        <Flame size={10} style={{ color: "#f59e0b" }} />
                        <span className="text-xs" style={{ color: "#f59e0b" }}>{c.streak}d</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold" style={{ color: "#74859c" }}>{c.xp || 0} XP</span>
                  <span className="text-xs font-semibold"
                    style={{ color: c.statusOnline?.ativo ? (c.statusOnline.foco ? "#f97316" : "#10b981") : "#475569" }}>
                    {c.statusOnline?.ativo ? (c.statusOnline.foco ? "No Foco" : "Online") : "Offline"}
                  </span>
                </div>
              </div>

              {nivelInfo.proximo && (
                <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: "#1e3356" }}>
                  <div className="h-full rounded-full" style={{ width: `${nivelInfo.progresso}%`, background: nivelInfo.cor }} />
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#9aa7ba" }}>Rotinas</span>
                    <span className="font-bold" style={{ color: corRotina }}>{pctRotina}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                    <div className="h-full rounded-full" style={{ width: `${pctRotina}%`, background: corRotina }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#9aa7ba" }}>Expectativas</span>
                    <span className="font-bold" style={{ color: corExp }}>{pctExp}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                    <div className="h-full rounded-full" style={{ width: `${pctExp}%`, background: corExp }} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {top3.map((h) => (
                  <div key={h.nome} className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                      <div className="h-full rounded-full" style={{ width: `${h.nivel}%`, background: c.cor }} />
                    </div>
                    <span className="text-xs w-20 truncate" style={{ color: "#9aa7ba" }}>{h.nome}</span>
                    <span className="text-xs font-bold w-6 text-right" style={{ color: c.cor }}>{h.nivel}</span>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}

        {/* "Adicionar" placeholder card — admin only */}
        {isAdmin && (
          <button
            onClick={() => setNovoMembro(true)}
            className="rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all hover:opacity-80 border-dashed"
            style={{ background: "#112239", border: "2px dashed #1e3356", minHeight: 200 }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#1e3356" }}>
              <UserPlus size={22} style={{ color: "#74859c" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#9aa7ba" }}>Adicionar membro</p>
              <p className="text-xs mt-0.5" style={{ color: "#334155" }}>Expandir o time</p>
            </div>
          </button>
        )}
      </div>

      {/* Reconhecimentos */}
      {usuarioAtual?.nivelAcesso === "admin" && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Mapa de Reconhecimentos</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
            <div className="overflow-x-auto">
            <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#9aa7ba", borderBottom: "1px solid rgba(201,164,66,.16)", minWidth: 480 }}>
              <span>De</span>
              <span>Para</span>
              <span>Mensagem</span>
              <span>Data</span>
            </div>
            {(() => {
              const todos = colaboradores.flatMap((c) =>
                (c.reconhecimentos || []).map((r) => ({
                  ...r,
                  paraColab: c,
                  deColab: colaboradores.find((x) => x.id === r.deId),
                }))
              ).sort((a, b) => b.data.localeCompare(a.data));

              if (todos.length === 0) {
                return (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: "#9aa7ba" }}>
                    Nenhum reconhecimento ainda.
                  </div>
                );
              }

              return todos.map((r) => (
                <div key={r.id} className="grid grid-cols-4 px-4 py-3 text-sm items-center"
                  style={{ borderBottom: "1px solid rgba(201,164,66,.16)30", minWidth: 480 }}>
                  <span style={{ color: "#94a3b8" }}>{r.deColab?.nome.split(" ")[0] ?? "—"}</span>
                  <span className="font-medium text-white">{r.paraColab.nome.split(" ")[0]}</span>
                  <span style={{ color: "#94a3b8" }} className="truncate">{r.emoji} {r.mensagem}</span>
                  <span style={{ color: "#9aa7ba" }}>{r.data}</span>
                </div>
              ));
            })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Membro — admin only */}
      {isAdmin && novoMembro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#00000090" }}
          onClick={() => setNovoMembro(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in-up"
            style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-bold text-lg">Novo Membro</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>Adicione alguem ao time Izzat</p>
              </div>
              <button onClick={() => setNovoMembro(false)} style={{ color: "#9aa7ba" }}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              {/* Preview do avatar */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl"
                  style={{ background: form.cor }}>
                  {form.nome ? form.nome.trim().split(/\s+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "?"}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#9aa7ba" }}>Nome *</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleCriar()}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#9aa7ba" }}>Cargo *</label>
                <input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex: Designer, Atendimento, Gestor..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#9aa7ba" }}>E-mail</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  type="email"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#9aa7ba" }}>Cor do perfil</label>
                <div className="flex flex-wrap gap-2">
                  {CORES_PALETTE.map((cor) => (
                    <button
                      key={cor}
                      onClick={() => setForm({ ...form, cor })}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: cor,
                        outline: form.cor === cor ? `3px solid ${cor}` : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Nivel */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "#9aa7ba" }}>Nivel de acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["colaborador", "admin"] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm({ ...form, nivelAcesso: n })}
                      className="py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: form.nivelAcesso === n ? (n === "admin" ? "#c9a84c20" : "#10b98120") : "#0b1624",
                        color: form.nivelAcesso === n ? (n === "admin" ? "#c9a84c" : "#10b981") : "#64748b",
                        border: `1px solid ${form.nivelAcesso === n ? (n === "admin" ? "#c9a84c50" : "#10b98150") : "#1e3356"}`,
                      }}
                    >
                      {n === "admin" ? "Admin / Gestor" : "Colaborador"}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1.5" style={{ color: "#334155" }}>
                  {form.nivelAcesso === "admin"
                    ? "Acesso total: ve dados de todos, gerencia lojas e equipe."
                    : "Acesso pessoal: ve apenas os proprios dados e tarefas atribuidas."}
                </p>
              </div>

              {erro && <p className="text-xs" style={{ color: "#ef4444" }}>{erro}</p>}

              <button
                onClick={handleCriar}
                disabled={!form.nome.trim() || !form.cargo.trim()}
                className="w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "#c9a84c", color: "#0b1624" }}
              >
                Adicionar ao Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
