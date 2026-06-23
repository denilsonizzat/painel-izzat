"use client";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS, Frequencia } from "@/lib/data";
import { rotinasSemResponsavel, LABEL_FREQUENCIA, ORDEM_FREQUENCIA, fmtDataCurta } from "@/lib/recorrencia";
import { UserPlus, Plus, X, Briefcase, AlertTriangle, Store, RefreshCw, Trash2, CalendarClock, Undo2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import Tabs from "@/components/Tabs";

type AbaVagas = "sem-responsavel" | "contratacao";

export default function VagasPage() {
  const { rotinas, colaboradores, lojasCustom, delegarRotina, criarRotina, editarRotina, deletarRotina } = useAppStore();
  const [aba, setAba] = useState<AbaVagas>("sem-responsavel");
  const [modalAberto, setModalAberto] = useState(false);
  const [delegandoId, setDelegandoId] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: "", motivo: "", frequencia: "mensal" as Frequencia, lojaId: "" });

  const todasLojas = [...LOJAS, ...lojasCustom];
  const vagas = rotinasSemResponsavel(rotinas);
  // Órfãs = sem dono e ainda não marcadas como contratação. Contratação = marcadas como vaga.
  const orfas = vagas.filter((r) => !r.vagaTemporaria);
  const contratacoes = vagas.filter((r) => r.vagaTemporaria);

  const lojaNome = (id?: string) => todasLojas.find((l) => l.id === id)?.nome;

  function criarVaga() {
    if (!form.titulo.trim()) return;
    criarRotina({
      titulo: form.titulo.trim(),
      descricao: form.motivo.trim() || undefined,
      frequencia: form.frequencia,
      lojaId: form.lojaId || undefined,
      colaboradorId: undefined,
      vagaTemporaria: true,
      motivoVaga: form.motivo.trim() || undefined,
      concluida: false,
      ativa: true,
      subtarefas: [],
    });
    setForm({ titulo: "", motivo: "", frequencia: "mensal", lojaId: "" });
    setModalAberto(false);
  }

  function CardVaga({ rotina, tipo }: { rotina: typeof vagas[0]; tipo: AbaVagas }) {
    const cor = tipo === "sem-responsavel" ? "#F2545B" : "#E8A33D";
    return (
      <div className="rounded-2xl p-4" style={{ background: "#112239", border: `1px solid ${cor}30` }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e3356", color: "#94a3b8" }}>
              {LABEL_FREQUENCIA[rotina.frequencia]}
            </span>
            {lojaNome(rotina.lojaId) && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "#9aa7ba" }}>
                <Store size={11} /> {lojaNome(rotina.lojaId)}
              </span>
            )}
          </div>
          <p className="text-white font-medium text-sm">{rotina.titulo}</p>
          {(rotina.motivoVaga || rotina.descricao) && (
            <p className="text-xs mt-1" style={{ color: "#9aa7ba" }}>{rotina.motivoVaga || rotina.descricao}</p>
          )}
          {rotina.proximaOcorrencia && (
            <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: "#74859c" }}>
              <CalendarClock size={11} /> Próxima: {fmtDataCurta(rotina.proximaOcorrencia)}
            </p>
          )}

          {/* Delegar */}
          {delegandoId === rotina.id ? (
            <div className="mt-3 flex gap-2 flex-wrap">
              <select
                autoFocus
                onChange={(e) => { if (e.target.value) { delegarRotina(rotina.id, e.target.value); setDelegandoId(null); } }}
                defaultValue=""
                className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "#1e3356", border: "1px solid #334155" }}
              >
                <option value="">Escolher responsável...</option>
                {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <button onClick={() => setDelegandoId(null)} className="px-2 py-2 rounded-xl" style={{ color: "#9aa7ba" }}><X size={14} /></button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDelegandoId(rotina.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: "#36C98E20", color: "#36C98E" }}
              >
                <UserPlus size={13} /> {tipo === "contratacao" ? "Contratei / delegar" : "Delegar a alguém"}
              </button>

              {/* Órfã: virar vaga de contratação */}
              {tipo === "sem-responsavel" && (
                <button
                  onClick={() => editarRotina(rotina.id, { vagaTemporaria: true })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: "#E8A33D20", color: "#E8A33D" }}
                  data-tip="Marcar que precisa contratar alguém para isso"
                >
                  <Briefcase size={13} /> Preciso contratar
                </button>
              )}

              {/* Contratação: voltar a ser só rotina órfã */}
              {tipo === "contratacao" && (
                <button
                  onClick={() => editarRotina(rotina.id, { vagaTemporaria: false })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                  style={{ background: "#1e3356", color: "#94a3b8" }}
                  data-tip="Não é mais necessidade de contratação"
                >
                  <Undo2 size={13} /> Não preciso contratar
                </button>
              )}

              <button
                onClick={() => deletarRotina(rotina.id)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs"
                style={{ background: "#1e3356", color: "#9aa7ba" }}
                data-tip="Remover"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const lista = aba === "sem-responsavel" ? orfas : contratacoes;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackButton href="/dashboard" />

      <div>
        <h1 className="text-2xl font-bold text-white">Vagas & Pendências</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>
          Rotinas sem dono e necessidades de contratação do time
        </p>
      </div>

      {/* Abas */}
      <Tabs
        value={aba}
        onChange={setAba}
        accent={aba === "sem-responsavel" ? "#F2545B" : "#E8A33D"}
        tabs={[
          { id: "sem-responsavel", label: "Sem responsável", icon: AlertTriangle, count: orfas.length, dica: "Rotinas que existem mas ninguém faz — delegue a alguém do time" },
          { id: "contratacao", label: "Vagas de contratação", icon: Briefcase, count: contratacoes.length, dica: "Funções que a empresa precisa preencher (contratar)" },
        ]}
      />

      {/* Explicação contextual */}
      <div className="p-3 rounded-xl" style={{ background: (aba === "sem-responsavel" ? "#F2545B" : "#E8A33D") + "10", border: `1px solid ${(aba === "sem-responsavel" ? "#F2545B" : "#E8A33D")}25`, borderLeft: `3px solid ${aba === "sem-responsavel" ? "#F2545B" : "#E8A33D"}` }}>
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          {aba === "sem-responsavel"
            ? "Rotinas que existem mas ninguém faz (pessoa saiu, ou criada sem responsável). Delegue a alguém do time — ou, se precisa contratar, mande para Vagas de contratação."
            : "Funções que a empresa precisa preencher. Quando contratar (ou decidir quem faz), use 'Contratei / delegar' para ligar a uma pessoa."}
        </p>
      </div>

      {/* Botão criar vaga — só na aba de contratação */}
      {aba === "contratacao" && (
        <button
          onClick={() => setModalAberto(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
          style={{ background: "#E8A33D20", color: "#E8A33D", border: "1px dashed #E8A33D50" }}
        >
          <Plus size={15} /> Criar nova vaga de contratação
        </button>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {lista.map((r) => <CardVaga key={r.id} rotina={r} tipo={aba} />)}
      </div>

      {/* Vazio */}
      {lista.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="text-4xl mb-3">{aba === "sem-responsavel" ? "✅" : "💼"}</div>
          <p className="font-semibold text-white mb-1">
            {aba === "sem-responsavel" ? "Nenhuma rotina sem responsável" : "Nenhuma vaga aberta"}
          </p>
          <p className="text-sm" style={{ color: "#9aa7ba" }}>
            {aba === "sem-responsavel"
              ? "Todas as rotinas têm dono. Tudo certo na operação."
              : "Crie uma vaga quando identificar que precisa contratar alguém para uma função."}
          </p>
        </div>
      )}

      {/* Modal nova vaga */}
      {modalAberto && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000080", backdropFilter: "blur(2px)" }} onClick={() => setModalAberto(false)}>
          <div className="modal-card w-full max-w-md rounded-2xl p-6 space-y-4 overflow-y-auto" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={16} style={{ color: "#E8A33D" }} />
                <h2 className="text-white font-bold">Nova vaga de contratação</h2>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ color: "#9aa7ba" }}><X size={20} /></button>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>O que precisa ser feito? *</label>
              <input autoFocus value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Editar reels e cortes de vídeo"
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: "#1e3356", border: "1px solid #334155" }} />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>Por que (contexto)</label>
              <input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                placeholder="Ex: precisamos de um editor no time"
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: "#1e3356", border: "1px solid #334155" }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>Frequência</label>
                <select value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value as Frequencia })}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: "#1e3356", border: "1px solid #334155" }}>
                  {ORDEM_FREQUENCIA.map((f) => <option key={f} value={f}>{LABEL_FREQUENCIA[f]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>Loja (opcional)</label>
                <select value={form.lojaId} onChange={(e) => setForm({ ...form, lojaId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: "#1e3356", border: "1px solid #334155" }}>
                  <option value="">Sem loja</option>
                  {todasLojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalAberto(false)} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: "#1e3356", color: "#94a3b8" }}>Cancelar</button>
              <button onClick={criarVaga} disabled={!form.titulo.trim()} className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: "#E8A33D", color: "#0b1624" }}>
                <RefreshCw size={14} /> Criar vaga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
