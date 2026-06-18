"use client";
import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { LOJAS } from "@/lib/data";
import type { Rotina } from "@/lib/data";
import { Plus, Pencil, Trash2, RefreshCw, X, ToggleLeft, ToggleRight, Eye, CheckCircle2, Circle } from "lucide-react";
import BackButton from "@/components/BackButton";

type Frequencia = Rotina["frequencia"];

const FREQ_LABELS: Record<Frequencia, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const FREQ_CORES: Record<Frequencia, string> = {
  diaria: "#10b981",
  semanal: "#3b82f6",
  quinzenal: "#0ea5e9",
  mensal: "#f59e0b",
  trimestral: "#8b5cf6",
  semestral: "#ec4899",
  anual: "#ef4444",
};

interface FormState {
  titulo: string;
  descricao: string;
  frequencia: Frequencia;
  colaboradorId: string;
  lojaId: string;
  subtarefas: string[];
}

const FORM_INICIAL: FormState = {
  titulo: "",
  descricao: "",
  frequencia: "diaria",
  colaboradorId: "",
  lojaId: "",
  subtarefas: [],
};

export default function RotinasPage() {
  const router = useRouter();
  const { usuarioAtual, colaboradores, rotinas, criarRotina, editarRotina, deletarRotina } = useAppStore();

  const [filtroColab, setFiltroColab] = useState("todos");
  const [filtroFreq, setFiltroFreq] = useState<"todas" | Frequencia>("todas");
  const [filtroLoja, setFiltroLoja] = useState("todas");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<{ colaboradorId: string; rotinaId: string } | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [novaSubtarefa, setNovaSubtarefa] = useState("");
  const [confirmarDel, setConfirmarDel] = useState<{ colaboradorId: string; rotinaId: string; titulo: string } | null>(null);
  const [verRotina, setVerRotina] = useState<{ rotina: typeof todasRotinas[0]; colaboradorNome: string } | null>(null);

  // Redirect se nao for admin (useEffect para evitar acesso ao location no SSR)
  useEffect(() => {
    if (!usuarioAtual || usuarioAtual.nivelAcesso !== "admin") {
      router.push("/dashboard");
    }
  }, [usuarioAtual, router]);

  if (!usuarioAtual || usuarioAtual.nivelAcesso !== "admin") {
    return null;
  }

  // Montar lista plana de rotinas com referencia ao colaborador (só as com responsável;
  // rotinas sem responsável vivem no painel Vagas & Pendências).
  const todasRotinas = useMemo(() => {
    return rotinas
      .filter((r) => r.colaboradorId)
      .map((r) => {
        const c = colaboradores.find((x) => x.id === r.colaboradorId);
        return { ...r, colaboradorId: r.colaboradorId as string, colaboradorNome: c?.nome ?? "—", colaboradorCor: c?.cor ?? "#64748b" };
      });
  }, [rotinas, colaboradores]);

  // Aplicar filtros
  const rotinasFiltradas = useMemo(() => {
    return todasRotinas.filter((r) => {
      if (filtroColab !== "todos" && r.colaboradorId !== filtroColab) return false;
      if (filtroFreq !== "todas" && r.frequencia !== filtroFreq) return false;
      if (filtroLoja !== "todas" && r.lojaId !== filtroLoja) return false;
      return true;
    });
  }, [todasRotinas, filtroColab, filtroFreq, filtroLoja]);

  // Agrupar por colaborador quando filtro = todos
  const rotinasPorColab = useMemo(() => {
    if (filtroColab !== "todos") {
      const colab = colaboradores.find((c) => c.id === filtroColab);
      if (!colab) return [];
      return [{ colaboradorId: colab.id, colaboradorNome: colab.nome, colaboradorCor: colab.cor, rotinas: rotinasFiltradas }];
    }
    const mapa = new Map<string, typeof rotinasFiltradas>();
    for (const r of rotinasFiltradas) {
      if (!mapa.has(r.colaboradorId)) mapa.set(r.colaboradorId, []);
      mapa.get(r.colaboradorId)!.push(r);
    }
    return Array.from(mapa.entries()).map(([colaboradorId, rotinas]) => ({
      colaboradorId,
      colaboradorNome: rotinas[0].colaboradorNome,
      colaboradorCor: rotinas[0].colaboradorCor,
      rotinas,
    }));
  }, [rotinasFiltradas, filtroColab, colaboradores]);

  function abrirModal(colaboradorId?: string, rotina?: Rotina) {
    if (rotina && colaboradorId) {
      setEditando({ colaboradorId, rotinaId: rotina.id });
      setForm({
        titulo: rotina.titulo,
        descricao: rotina.descricao || "",
        frequencia: rotina.frequencia,
        colaboradorId,
        lojaId: rotina.lojaId || "",
        subtarefas: rotina.subtarefas.map((s) => s.titulo),
      });
    } else {
      setEditando(null);
      setForm({ ...FORM_INICIAL, colaboradorId: colaboradorId || "" });
    }
    setNovaSubtarefa("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setForm(FORM_INICIAL);
    setNovaSubtarefa("");
  }

  function adicionarSubtarefa() {
    const txt = novaSubtarefa.trim();
    if (!txt) return;
    setForm((f) => ({ ...f, subtarefas: [...f.subtarefas, txt] }));
    setNovaSubtarefa("");
  }

  function removerSubtarefa(idx: number) {
    setForm((f) => ({ ...f, subtarefas: f.subtarefas.filter((_, i) => i !== idx) }));
  }

  function salvar() {
    if (!form.titulo.trim() || !form.colaboradorId) return;

    const payload: Omit<Rotina, "id"> = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || undefined,
      frequencia: form.frequencia,
      lojaId: form.lojaId || undefined,
      colaboradorId: form.colaboradorId || undefined,
      concluida: false,
      ativa: true,
      criadoPor: usuarioAtual?.id ?? "",
      subtarefas: form.subtarefas.map((titulo, i) => ({
        id: `sub-new-${Date.now()}-${i}`,
        titulo,
        concluida: false,
      })),
    };

    if (editando) {
      editarRotina(editando.rotinaId, payload);
    } else {
      criarRotina(payload);
    }

    fecharModal();
  }

  function confirmarDeletar(colaboradorId: string, rotinaId: string, titulo: string) {
    setConfirmarDel({ colaboradorId, rotinaId, titulo });
  }

  function toggleAtiva(colaboradorId: string, rotinaId: string, ativaAtual: boolean | undefined) {
    editarRotina(rotinaId, { ativa: !ativaAtual });
  }

  const inputStyle = {
    background: "#1e3356",
    border: "1px solid #334155",
    color: "#e8edf5",
    borderRadius: 10,
    padding: "8px 12px",
    width: "100%",
    outline: "none",
    fontSize: 14,
  };

  const selectStyle = { ...inputStyle };

  return (
    <div style={{ background: "#0b1624", minHeight: "100vh", padding: "24px 20px" }}>
      {/* Header */}
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BackButton />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "#c9a84c20", borderRadius: 10, padding: 8 }}>
                <RefreshCw size={20} style={{ color: "#c9a84c" }} />
              </div>
              <div>
                <h1 style={{ color: "#e8edf5", fontWeight: 700, fontSize: 20, margin: 0 }}>Rotinas</h1>
                <p style={{ color: "#64748b", fontSize: 12, margin: "2px 0 0" }}>
                  Habitos diarios que a equipe repete — cada um vale pontos ao ser marcado
                </p>
                <p style={{ color: "#475569", fontSize: 11, margin: "2px 0 0" }}>
                  {todasRotinas.length} {todasRotinas.length === 1 ? "rotina" : "rotinas"} · {colaboradores.length} {colaboradores.length === 1 ? "colaborador" : "colaboradores"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => abrirModal()}
            style={{
              background: "#c9a84c",
              color: "#0b1624",
              border: "none",
              borderRadius: 10,
              padding: "9px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plus size={16} />
            Nova Rotina
          </button>
        </div>

        {/* Filtros */}
        <div
          style={{
            background: "#122039",
            border: "1px solid #1e3356",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          {/* Filtro colaborador */}
          <select
            value={filtroColab}
            onChange={(e) => setFiltroColab(e.target.value)}
            style={{ ...selectStyle, width: "auto", minWidth: 160 }}
          >
            <option value="todos">Todos os colaboradores</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>{c.nome.split(" ")[0]}</option>
            ))}
          </select>

          {/* Filtro frequencia — pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["todas", "diaria", "semanal", "quinzenal", "mensal", "trimestral", "semestral", "anual"] as const).map((f) => {
              const ativo = filtroFreq === f;
              const cor = f === "todas" ? "#c9a84c" : FREQ_CORES[f];
              return (
                <button
                  key={f}
                  onClick={() => setFiltroFreq(f)}
                  style={{
                    background: ativo ? cor + "20" : "#1e3356",
                    border: `1px solid ${ativo ? cor : "#334155"}`,
                    color: ativo ? cor : "#94a3b8",
                    borderRadius: 8,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {f === "todas" ? "Todas" : FREQ_LABELS[f]}
                </button>
              );
            })}
          </div>

          {/* Filtro loja */}
          <select
            value={filtroLoja}
            onChange={(e) => setFiltroLoja(e.target.value)}
            style={{ ...selectStyle, width: "auto", minWidth: 160 }}
          >
            <option value="todas">Todas as lojas</option>
            {LOJAS.map((l) => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </select>
        </div>

        {/* Lista agrupada */}
        {rotinasPorColab.length === 0 ? (
          <div
            style={{
              background: "#122039",
              border: "1px solid #1e3356",
              borderRadius: 14,
              padding: 40,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔄</p>
            <p style={{ color: "#e8edf5", fontWeight: 600, marginBottom: 6 }}>Nenhuma rotina cadastrada ainda</p>
            <p style={{ color: "#475569", fontSize: 12, lineHeight: 1.6 }}>
              Rotinas sao habitos diarios, semanais ou mensais que a equipe repete.<br />
              Cada rotina concluida vale pontos de XP. Clique em &quot;Nova Rotina&quot; para comecar.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {rotinasPorColab.map((grupo) => (
              <div key={grupo.colaboradorId}>
                {/* Header do grupo */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: grupo.colaboradorCor,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#e8edf5", fontWeight: 600, fontSize: 15 }}>
                    {grupo.colaboradorNome}
                  </span>
                  <span
                    style={{
                      background: "#1e3356",
                      color: "#64748b",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {grupo.rotinas.length}
                  </span>
                  <button
                    onClick={() => abrirModal(grupo.colaboradorId)}
                    style={{
                      marginLeft: "auto",
                      background: "transparent",
                      border: "1px solid #1e3356",
                      color: "#94a3b8",
                      borderRadius: 7,
                      padding: "3px 10px",
                      fontSize: 11,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Plus size={11} /> Adicionar
                  </button>
                </div>

                {/* Cards de rotinas */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {grupo.rotinas.map((rotina) => {
                    const loja = LOJAS.find((l) => l.id === rotina.lojaId);
                    const freqCor = FREQ_CORES[rotina.frequencia];
                    const inativa = rotina.ativa === false;

                    return (
                      <div
                        key={rotina.id}
                        style={{
                          background: "#122039",
                          border: "1px solid #1e3356",
                          borderRadius: 12,
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          opacity: inativa ? 0.55 : 1,
                        }}
                      >
                        {/* Stripe de cor da frequencia */}
                        <div
                          style={{
                            width: 3,
                            height: 36,
                            borderRadius: 4,
                            background: freqCor,
                            flexShrink: 0,
                          }}
                        />

                        {/* Info principal */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span
                              style={{
                                color: "#e8edf5",
                                fontWeight: 600,
                                fontSize: 14,
                                textDecoration: inativa ? "line-through" : "none",
                              }}
                            >
                              {rotina.titulo}
                            </span>
                            {/* Badge frequencia */}
                            <span
                              style={{
                                background: freqCor + "20",
                                color: freqCor,
                                border: `1px solid ${freqCor}50`,
                                borderRadius: 6,
                                padding: "2px 7px",
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {FREQ_LABELS[rotina.frequencia]}
                            </span>
                            {/* Badge INATIVA */}
                            {inativa && (
                              <span
                                style={{
                                  background: "#47556915",
                                  color: "#64748b",
                                  border: "1px solid #475569",
                                  borderRadius: 6,
                                  padding: "2px 7px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                INATIVA
                              </span>
                            )}
                            {/* Badge loja */}
                            {loja && (
                              <span
                                style={{
                                  background: "#1e3356",
                                  color: "#94a3b8",
                                  border: "1px solid #334155",
                                  borderRadius: 6,
                                  padding: "2px 7px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                {loja.nome.length > 15 ? loja.nome.slice(0, 14) + "…" : loja.nome}
                              </span>
                            )}
                          </div>
                          {rotina.subtarefas.length > 0 && (
                            <p style={{ color: "#64748b", fontSize: 11, margin: "3px 0 0 0" }}>
                              {rotina.subtarefas.length} subtarefa{rotina.subtarefas.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>

                        {/* Acoes */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {/* Ver detalhe */}
                          <button
                            onClick={() => setVerRotina({ rotina, colaboradorNome: grupo.colaboradorNome })}
                            data-tip="Ver detalhes"
                            style={{
                              background: "#1e3356",
                              border: "none",
                              color: "#10b981",
                              borderRadius: 7,
                              width: 30,
                              height: 30,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Eye size={13} />
                          </button>

                          {/* Toggle ativa */}
                          <button
                            onClick={() => toggleAtiva(rotina.colaboradorId, rotina.id, rotina.ativa)}
                            data-tip={inativa ? "Ativar rotina" : "Desativar rotina"}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: 4,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {inativa ? (
                              <ToggleLeft size={22} style={{ color: "#475569" }} />
                            ) : (
                              <ToggleRight size={22} style={{ color: "#10b981" }} />
                            )}
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => abrirModal(rotina.colaboradorId, rotina)}
                            data-tip="Editar rotina"
                            style={{
                              background: "#1e3356",
                              border: "none",
                              color: "#94a3b8",
                              borderRadius: 7,
                              width: 30,
                              height: 30,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Deletar */}
                          <button
                            onClick={() => confirmarDeletar(rotina.colaboradorId, rotina.id, rotina.titulo)}
                            data-tip="Deletar rotina"
                            style={{
                              background: "#1e3356",
                              border: "none",
                              color: "#ef4444",
                              borderRadius: 7,
                              width: 30,
                              height: 30,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {modalAberto && (
        <div
          onClick={fecharModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "#00000090",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#122039",
              border: "1px solid #1e3356",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Cabecalho modal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ color: "#e8edf5", fontWeight: 700, fontSize: 16, margin: 0 }}>
                {editando ? "Editar Rotina" : "Nova Rotina"}
              </h2>
              <button
                onClick={fecharModal}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
              >
                <X size={18} style={{ color: "#64748b" }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Titulo */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Título *
                </label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Nome da rotina"
                  style={inputStyle}
                />
              </div>

              {/* Descricao */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição opcional"
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Frequencia + Colaborador */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Frequência *
                  </label>
                  <select
                    value={form.frequencia}
                    onChange={(e) => setForm((f) => ({ ...f, frequencia: e.target.value as Frequencia }))}
                    style={selectStyle}
                  >
                    <option value="diaria">Diária</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Colaborador *
                  </label>
                  <select
                    value={form.colaboradorId}
                    onChange={(e) => setForm((f) => ({ ...f, colaboradorId: e.target.value }))}
                    style={selectStyle}
                  >
                    <option value="">Selecionar...</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>{c.nome.split(" ")[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loja */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Loja (opcional)
                </label>
                <select
                  value={form.lojaId}
                  onChange={(e) => setForm((f) => ({ ...f, lojaId: e.target.value }))}
                  style={selectStyle}
                >
                  <option value="">Sem loja</option>
                  {LOJAS.map((l) => (
                    <option key={l.id} value={l.id}>{l.nome}</option>
                  ))}
                </select>
              </div>

              {/* Subtarefas */}
              <div>
                <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Subtarefas
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  {form.subtarefas.map((sub, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#1e3356",
                        borderRadius: 8,
                        padding: "6px 10px",
                      }}
                    >
                      <span style={{ flex: 1, color: "#e8edf5", fontSize: 13 }}>{sub}</span>
                      <button
                        onClick={() => removerSubtarefa(idx)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}
                      >
                        <X size={13} style={{ color: "#64748b" }} />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Input nova subtarefa */}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={novaSubtarefa}
                    onChange={(e) => setNovaSubtarefa(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && adicionarSubtarefa()}
                    placeholder="Adicionar subtarefa..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={adicionarSubtarefa}
                    disabled={!novaSubtarefa.trim()}
                    style={{
                      background: "#c9a84c20",
                      border: "1px solid #c9a84c50",
                      color: "#c9a84c",
                      borderRadius: 10,
                      padding: "0 14px",
                      cursor: "pointer",
                      fontSize: 18,
                      fontWeight: 700,
                      opacity: novaSubtarefa.trim() ? 1 : 0.4,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botoes */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={fecharModal}
                  style={{
                    flex: 1,
                    background: "#1e3356",
                    border: "1px solid #334155",
                    color: "#94a3b8",
                    borderRadius: 10,
                    padding: "9px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={!form.titulo.trim() || !form.colaboradorId}
                  style={{
                    flex: 1,
                    background: "#c9a84c",
                    border: "none",
                    color: "#0b1624",
                    borderRadius: 10,
                    padding: "9px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: !form.titulo.trim() || !form.colaboradorId ? 0.45 : 1,
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — ver detalhe da rotina */}
      {verRotina && (
        <div
          onClick={() => setVerRotina(null)}
          style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#122039", border: "1px solid #1e3356", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{
                    background: FREQ_CORES[verRotina.rotina.frequencia] + "20",
                    color: FREQ_CORES[verRotina.rotina.frequencia],
                    border: `1px solid ${FREQ_CORES[verRotina.rotina.frequencia]}50`,
                    borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase"
                  }}>
                    {FREQ_LABELS[verRotina.rotina.frequencia]}
                  </span>
                  {verRotina.rotina.ativa === false && (
                    <span style={{ background: "#47556915", color: "#64748b", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", border: "1px solid #475569" }}>INATIVA</span>
                  )}
                </div>
                <h2 style={{ color: "#e8edf5", fontWeight: 700, fontSize: 17, margin: 0 }}>{verRotina.rotina.titulo}</h2>
                <p style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{verRotina.colaboradorNome}</p>
              </div>
              <button onClick={() => setVerRotina(null)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, marginLeft: 8 }}>
                <X size={18} style={{ color: "#64748b" }} />
              </button>
            </div>

            {/* Descricao */}
            {verRotina.rotina.descricao && (
              <div style={{ background: "#1e3356", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>{verRotina.rotina.descricao}</p>
              </div>
            )}

            {/* Loja */}
            {(() => {
              const lj = LOJAS.find((l) => l.id === verRotina.rotina.lojaId);
              if (!lj) return null;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ color: "#64748b", fontSize: 12 }}>Loja:</span>
                  <span style={{ color: "#e8edf5", fontSize: 13, fontWeight: 600 }}>{lj.nome}</span>
                </div>
              );
            })()}

            {/* Subtarefas */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subtarefas</p>
                <span style={{ color: "#64748b", fontSize: 12 }}>
                  {verRotina.rotina.subtarefas.filter((s) => s.concluida).length}/{verRotina.rotina.subtarefas.length} concluidas
                </span>
              </div>
              {verRotina.rotina.subtarefas.length === 0 ? (
                <p style={{ color: "#334155", fontSize: 13 }}>Nenhuma subtarefa cadastrada.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {verRotina.rotina.subtarefas.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#1e3356", borderRadius: 10, padding: "10px 14px" }}>
                      {s.concluida
                        ? <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                        : <Circle size={16} style={{ color: "#334155", flexShrink: 0 }} />}
                      <span style={{ color: s.concluida ? "#64748b" : "#e8edf5", fontSize: 14, textDecoration: s.concluida ? "line-through" : "none" }}>
                        {s.titulo}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progresso bar */}
            {verRotina.rotina.subtarefas.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {(() => {
                  const done = verRotina.rotina.subtarefas.filter((s) => s.concluida).length;
                  const total = verRotina.rotina.subtarefas.length;
                  const pct = Math.round((done / total) * 100);
                  const cor = pct === 100 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, color: "#64748b" }}>
                        <span>Progresso</span><span style={{ color: cor, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "#1e3356", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: cor, borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmacao de delete */}
      {confirmarDel && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "#00000090" }}
          onClick={() => setConfirmarDel(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-6 space-y-4"
            style={{ background: "#122039", border: "1px solid #ef444440" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-bold text-white">Deletar rotina?</p>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              "{confirmarDel.titulo}" será removida permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarDel(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#1e3356", color: "#94a3b8" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deletarRotina(confirmarDel.rotinaId);
                  setConfirmarDel(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "#ef4444", color: "white" }}
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
