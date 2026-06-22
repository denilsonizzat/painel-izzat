"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS, SocioGestor } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { calcularGanhosMes, GanhoSocio } from "@/lib/socios";
import { Handshake, Plus, Pencil, Trash2, X, Users } from "lucide-react";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmt = (n: number) => "R$ " + (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const inp = { background: "#1e3356", border: "1px solid rgba(201,164,66,.16)", color: "#e8edf5", borderRadius: 9, padding: "8px 10px", width: "100%", outline: "none", fontSize: 13 } as React.CSSProperties;

export default function SociosPage() {
  const { socios, colaboradores, lojasCustom, criarSocio, editarSocio, deletarSocio } = useAppStore();
  const todasLojas = [...LOJAS, ...lojasCustom];
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano] = useState(agora.getFullYear());
  const [aba, setAba] = useState<"socios" | "remuneracao">("socios");
  const [ganhos, setGanhos] = useState<GanhoSocio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const nomeLoja = (id: string) => todasLojas.find((l) => l.id === id)?.nome || id;
  const nomeColab = (id?: string) => colaboradores.find((c) => c.id === id)?.nome;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { setGanhos(await calcularGanhosMes(socios, mes, ano)); } finally { setCarregando(false); }
  }, [socios, mes, ano]);
  useEffect(() => { carregar(); }, [carregar]);

  const ganhoDe = (socioId: string) => ganhos.find((g) => g.socio.id === socioId);
  const totalVariavel = ganhos.reduce((s, g) => s + g.ganho, 0);

  // form state
  const vazio = { nome: "", contato: "", colaboradorId: "", lojaId: todasLojas[0]?.id || "", base: "lucro" as "lucro" | "faturamento", percentual: "30", ativo: true };
  const [f, setF] = useState(vazio);
  function abrirNovo() { setEditId(null); setF(vazio); setForm(true); }
  function abrirEdit(s: SocioGestor) {
    setEditId(s.id);
    setF({ nome: s.nome, contato: s.contato || "", colaboradorId: s.colaboradorId || "", lojaId: s.lojaId, base: s.base, percentual: String(s.percentual), ativo: s.ativo });
    setForm(true);
  }
  function salvar() {
    if (!f.nome.trim() || !f.lojaId) return;
    const dados = { nome: f.nome.trim(), contato: f.contato.trim() || undefined, colaboradorId: f.colaboradorId || undefined, lojaId: f.lojaId, base: f.base, percentual: parseFloat(f.percentual) || 0, ativo: f.ativo };
    if (editId) editarSocio(editId, dados); else criarSocio(dados);
    setForm(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <BackButton href="/dashboard" />
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Handshake size={22} style={{ color: "#c9a84c" }} /> Sócios & Remuneração Variável</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>Gestores que ganham % do lucro/faturamento da loja que administram. Separado do custo fixo da empresa.</p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#0f1c30", border: "1px solid rgba(201,164,66,.16)" }}>
          {([["socios", "Sócios", Handshake], ["remuneracao", "Remuneração (fixo+variável)", Users]] as const).map(([id, lbl, Ic]) => (
            <button key={id} onClick={() => setAba(id)} className="flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold" style={{ background: aba === id ? "#c9a84c" : "transparent", color: aba === id ? "#0b1624" : "#94a3b8" }}><Ic size={13} /> {lbl}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMes((m) => m > 1 ? m - 1 : 12)} className="w-8 h-8 rounded-lg" style={{ background: "#1e3356", color: "#94a3b8" }}>‹</button>
          <span className="text-sm font-bold text-white" style={{ minWidth: 84, textAlign: "center" }}>{MESES[mes - 1]} {ano}</span>
          <button onClick={() => setMes((m) => m < 12 ? m + 1 : 1)} className="w-8 h-8 rounded-lg" style={{ background: "#1e3356", color: "#94a3b8" }}>›</button>
        </div>
      </div>

      {aba === "socios" && (
        <div className="space-y-3">
          <button onClick={abrirNovo} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--grad-btn-gold)", color: "#0b1624" }}><Plus size={14} /> Novo sócio-gestor</button>

          {socios.length === 0 && <div className="rounded-2xl p-8 text-center" style={{ background: "#112239", color: "#74859c", border: "1px solid rgba(201,164,66,.16)" }}>Nenhum sócio cadastrado. Eles ganham % do resultado da loja, sem salário fixo.</div>}

          <div className="grid sm:grid-cols-2 gap-3">
            {socios.map((s) => {
              const g = ganhoDe(s.id);
              return (
                <div key={s.id} className="rounded-2xl p-4" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold flex items-center gap-2">{s.nome} {!s.ativo && <span className="text-xs px-1.5 rounded" style={{ background: "#74859c20", color: "#74859c" }}>inativo</span>}</p>
                      <p className="text-xs" style={{ color: "#9aa7ba" }}>{nomeLoja(s.lojaId)} · {s.percentual}% do {s.base}</p>
                      {s.colaboradorId && <p className="text-xs mt-0.5" style={{ color: "#4d9de0" }}>↔ também colaborador: {nomeColab(s.colaboradorId) || "—"}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => abrirEdit(s)} style={{ color: "#74859c" }}><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Excluir sócio?")) deletarSocio(s.id); }} style={{ color: "#74859c" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl p-3" style={{ background: "#0b1624" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#74859c" }}>Ganho em {MESES[mes - 1]}</span>
                      <span className="text-lg font-extrabold num-gold">{carregando ? "..." : fmt(g?.ganho || 0)}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#74859c" }}>{s.percentual}% de {fmt(g?.baseValor || 0)} ({s.base}) · da Operação</p>
                  </div>
                </div>
              );
            })}
          </div>

          {socios.length > 0 && (
            <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#15283c,#112239)", border: "1px solid rgba(201,164,66,.3)" }}>
              <span className="text-sm font-bold text-white">Total variável a pagar — {MESES[mes - 1]}</span>
              <span className="text-2xl font-extrabold num-gold">{carregando ? "..." : fmt(totalVariavel)}</span>
            </div>
          )}
          <p className="text-xs" style={{ color: "#74859c" }}>Valores puxam do módulo Operação (faturamento/lucro real da loja no mês). Prejuízo → ganho zero. Quando a API conectar, fica 100% automático.</p>
        </div>
      )}

      {aba === "remuneracao" && (
        <Remuneracao socios={socios} ganhos={ganhos} colaboradores={colaboradores} carregando={carregando} mesLabel={MESES[mes - 1]} nomeLoja={nomeLoja} />
      )}

      {form && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#00000090", backdropFilter: "blur(2px)" }} onClick={() => setForm(false)}>
          <div className="modal-card w-full max-w-md rounded-2xl p-4 space-y-3 overflow-y-auto" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-white font-bold">{editId ? "Editar sócio" : "Novo sócio-gestor"}</h3><button onClick={() => setForm(false)} style={{ color: "#74859c" }}><X size={18} /></button></div>
            <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Nome *</label><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} style={inp} /></div>
            <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Contato</label><input value={f.contato} onChange={(e) => setF({ ...f, contato: e.target.value })} placeholder="WhatsApp / e-mail (opcional)" style={inp} /></div>
            <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Vincular a colaborador (opcional)</label><select value={f.colaboradorId} onChange={(e) => setF({ ...f, colaboradorId: e.target.value })} style={inp}><option value="">— externo (não é da equipe)</option>{colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
            <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Loja que administra *</label><select value={f.lojaId} onChange={(e) => setF({ ...f, lojaId: e.target.value })} style={inp}>{todasLojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Base</label><select value={f.base} onChange={(e) => setF({ ...f, base: e.target.value as "lucro" | "faturamento" })} style={inp}><option value="lucro">% do lucro</option><option value="faturamento">% do faturamento</option></select></div>
              <div><label className="text-xs" style={{ color: "#9aa7ba" }}>Percentual %</label><input type="number" value={f.percentual} onChange={(e) => setF({ ...f, percentual: e.target.value })} style={inp} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: "#9aa7ba" }}><input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> Ativo</label>
            <button onClick={salvar} disabled={!f.nome.trim()} className="w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-40" style={{ background: "var(--grad-btn-gold)", color: "#0b1624" }}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Remuneracao({ socios, ganhos, colaboradores, carregando, mesLabel, nomeLoja }: { socios: SocioGestor[]; ganhos: GanhoSocio[]; colaboradores: { id: string; nome: string; salario?: number }[]; carregando: boolean; mesLabel: string; nomeLoja: (id: string) => string }) {
  // Junta: cada colaborador (fixo) + variável dos sócios vinculados. Sócios externos = linha própria.
  const ganhoSocio = (id: string) => ganhos.find((g) => g.socio.id === id)?.ganho || 0;
  const linhas: { nome: string; fixo: number; variavel: number; detalhe: string }[] = [];

  colaboradores.filter((c) => (c.salario || 0) > 0 || socios.some((s) => s.colaboradorId === c.id)).forEach((c) => {
    const sociosDele = socios.filter((s) => s.colaboradorId === c.id);
    const variavel = sociosDele.reduce((sum, s) => sum + ganhoSocio(s.id), 0);
    const det = sociosDele.map((s) => `${s.percentual}% ${s.base} ${nomeLoja(s.lojaId)}`).join(" · ");
    linhas.push({ nome: c.nome, fixo: c.salario || 0, variavel, detalhe: det || "salário fixo" });
  });
  // sócios externos (sem colaboradorId)
  socios.filter((s) => !s.colaboradorId).forEach((s) => {
    linhas.push({ nome: s.nome, fixo: 0, variavel: ganhoSocio(s.id), detalhe: `${s.percentual}% ${s.base} ${nomeLoja(s.lojaId)} (externo)` });
  });

  const totFixo = linhas.reduce((s, l) => s + l.fixo, 0);
  const totVar = linhas.reduce((s, l) => s + l.variavel, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Fixo (mês)" valor={fmt(totFixo)} cor="#4d9de0" />
        <Kpi label={`Variável (${mesLabel})`} valor={carregando ? "..." : fmt(totVar)} cor="#e8c462" />
        <Kpi label="Total a pagar" valor={carregando ? "..." : fmt(totFixo + totVar)} cor="#46d69b" />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
        <table className="w-full text-xs">
          <thead><tr style={{ color: "#74859c", textAlign: "left" }}><th className="p-3">Pessoa</th><th className="p-3">Fixo</th><th className="p-3">Variável</th><th className="p-3">Total</th></tr></thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} style={{ borderTop: "1px solid rgba(201,164,66,.12)" }}>
                <td className="p-3"><p className="text-white font-semibold">{l.nome}</p><p style={{ color: "#74859c", fontSize: 11 }}>{l.detalhe}</p></td>
                <td className="p-3" style={{ color: "#9aa7ba" }}>{l.fixo > 0 ? fmt(l.fixo) : "—"}</td>
                <td className="p-3" style={{ color: l.variavel > 0 ? "#e8c462" : "#74859c" }}>{l.variavel > 0 ? fmt(l.variavel) : "—"}</td>
                <td className="p-3 font-bold text-white">{fmt(l.fixo + l.variavel)}</td>
              </tr>
            ))}
            {linhas.length === 0 && <tr><td colSpan={4} className="p-6 text-center" style={{ color: "#74859c" }}>Sem dados. Cadastre salários (Custos da Equipe) e sócios.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs" style={{ color: "#74859c" }}>Visão separada do &quot;Custo Total&quot; atual. Junta o fixo (salário) + o variável (% das lojas). Mesma pessoa vinculada aparece numa linha só.</p>
    </div>
  );
}

function Kpi({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "linear-gradient(160deg,#14243f,#111e35)", border: `1px solid ${cor}30` }}>
      <p className="text-xs" style={{ color: "#9aa7ba" }}>{label}</p>
      <p className="font-extrabold mt-1" style={{ fontSize: 20, color: cor }}>{valor}</p>
    </div>
  );
}
