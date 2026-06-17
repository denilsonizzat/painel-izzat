"use client";
import { useAppStore } from "@/lib/store";
import { LOJAS } from "@/lib/data";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, MapPin, CheckCircle2, Circle, Target, Award, X, Phone, MessageCircle, Edit2, Check, Mail, Wrench, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import Image from "next/image";

function calcProgresso(rotinas: { concluida: boolean; subtarefas: { concluida: boolean }[] }[]) {
  if (!rotinas.length) return 100;
  const total = rotinas.reduce((acc, r) => acc + r.subtarefas.length, 0);
  if (total === 0) return rotinas.every((r) => r.concluida) ? 100 : 0;
  const feitas = rotinas.reduce((acc, r) => acc + r.subtarefas.filter((s) => s.concluida).length, 0);
  return Math.round((feitas / total) * 100);
}

function calcIdade(dataNasc: string): number {
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function calcExpectativas(expectativas: { cumprida: boolean; peso: number }[]) {
  if (!expectativas.length) return 100;
  const total = expectativas.reduce((acc, e) => acc + e.peso, 0);
  const cumprido = expectativas.filter((e) => e.cumprida).reduce((acc, e) => acc + e.peso, 0);
  return Math.round((cumprido / total) * 100);
}

function RadarChart({ habilidades, cor }: { habilidades: { nome: string; nivel: number }[]; cor: string }) {
  const n = habilidades.length;
  const cx = 100; const cy = 100; const r = 75;
  const pontos = habilidades.map((h, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const dist = (h.nivel / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  });
  const gridPontos = (frac: number) =>
    habilidades.map((_, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return `${cx + frac * r * Math.cos(angle)},${cy + frac * r * Math.sin(angle)}`;
    }).join(" ");
  const labelPts = habilidades.map((h, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + (r + 22) * Math.cos(angle), y: cy + (r + 22) * Math.sin(angle), nome: h.nome };
  });

  return (
    <svg width="200" height="200" viewBox="-22 -22 244 244" style={{ overflow: "visible" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={gridPontos(f)} fill="none" stroke="#1e3356" strokeWidth="1" />
      ))}
      {habilidades.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#1e3356" strokeWidth="1" />
        );
      })}
      <polygon points={pontos.map((p) => `${p.x},${p.y}`).join(" ")} fill={`${cor}30`} stroke={cor} strokeWidth="2" />
      {pontos.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={cor} />)}
      {labelPts.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#94a3b8">
          {l.nome}
        </text>
      ))}
    </svg>
  );
}

const EMOJIS_RECONH = ["🏆", "⭐", "🚀", "💪", "🎯", "🔥", "✨", "👑"];

export default function ColaboradorPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const { usuarioAtual, colaboradores, tarefas, marcarSubtarefa, marcarExpectativa, darReconhecimento, fichasReconhecimento, usarFichaReconhecimento, setTelefone, setSalario, setGoogleChatLink, ferramentas, abrirPomodoro } = useAppStore();
  const [reconhModal, setReconhModal] = useState(false);
  const [reconhForm, setReconhForm] = useState({ mensagem: "", emoji: "🏆" });
  const [editandoTelefone, setEditandoTelefone] = useState(false);
  const [telefoneInput, setTelefoneInput] = useState("");
  const [editandoSalario, setEditandoSalario] = useState(false);
  const [salarioInput, setSalarioInput] = useState("");
  const [editandoGoogleChat, setEditandoGoogleChat] = useState(false);
  const [googleChatInput, setGoogleChatInput] = useState("");
  const [rotinasExpandidas, setRotinasExpandidas] = useState<string[]>([]);
  const toggleRotina = (id: string) =>
    setRotinasExpandidas((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  useEffect(() => {
    if (!usuarioAtual) { router.push("/"); return; }
    const targetId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (usuarioAtual.nivelAcesso !== "admin" && targetId !== usuarioAtual.id) {
      router.replace(`/equipe/${usuarioAtual.id}`);
    }
  }, [usuarioAtual, params.id, router]);

  if (!usuarioAtual) return null;

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const pessoa = colaboradores.find((c) => c.id === id);

  if (!pessoa) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-white font-semibold text-lg">Colaborador nao encontrado.</p>
        <Link href="/equipe" className="text-sm mt-2 inline-block hover:underline" style={{ color: "#c9a84c" }}>
          Voltar para Equipe
        </Link>
      </div>
    );
  }

  const pct = calcProgresso(pessoa.rotinas);
  const progressoCor = pct === 100 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const pctExp = calcExpectativas(pessoa.expectativas);
  const expCor = pctExp === 100 ? "#10b981" : pctExp >= 50 ? "#f59e0b" : "#ef4444";
  const expCumpridas = pessoa.expectativas.filter((e) => e.cumprida).length;

  const minhasTarefas = tarefas.filter((t) => t.atribuidoPara === pessoa.id);
  const tarefasAtivas = minhasTarefas.filter((t) => t.status !== "concluida");

  const PRIORIDADE_COR: Record<string, string> = { alta: "#ef4444", media: "#f59e0b", baixa: "#64748b" };
  const STATUS_LABEL: Record<string, string> = {
    pendente: "Pendente",
    em_andamento: "Em andamento",
    concluida: "Concluida",
    atrasada: "Atrasada",
  };

  const isAdmin = usuarioAtual.nivelAcesso === "admin";
  const isProprioUsuario = usuarioAtual.id === pessoa.id;

  const ferrsPessoa = ferramentas.filter((f) => f.colaboradoresIds.includes(pessoa.id));
  const custoFerrTotal = ferrsPessoa.reduce((acc, f) => {
    if (f.tipo === "individual") return acc + f.preco;
    const n = f.colaboradoresIds.length;
    return acc + (n > 0 ? f.preco / n : 0);
  }, 0);
  const custoTotal = (pessoa.salario || 0) + custoFerrTotal;
  const podeReconhecer = (isAdmin || true) && pessoa.id !== usuarioAtual.id;

  const fichasDisponiveis = usuarioAtual
    ? (fichasReconhecimento[usuarioAtual.id] !== undefined
        ? fichasReconhecimento[usuarioAtual.id]
        : 3)
    : 0;

  const handleReconhecer = () => {
    if (!reconhForm.mensagem.trim()) return;
    if (!usarFichaReconhecimento(usuarioAtual.id)) return;
    darReconhecimento(pessoa.id, reconhForm.mensagem.trim(), reconhForm.emoji);
    setReconhModal(false);
    setReconhForm({ mensagem: "", emoji: "🏆" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/equipe" className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70" style={{ color: "#64748b" }}>
        <ArrowLeft size={16} />
        Voltar para Equipe
      </Link>

      {/* Header card */}
      <div className="rounded-2xl p-6" style={{ background: "#122039", border: `1px solid ${pessoa.cor}40` }}>
        <div className="flex items-start gap-5">
          <Avatar nome={pessoa.nome} avatar={pessoa.avatar} foto={pessoa.foto} cor={pessoa.cor} size={96} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white">{pessoa.nome}</h1>
                {pessoa.cargo && <p className="text-base mt-0.5" style={{ color: "#94a3b8" }}>{pessoa.cargo}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {pessoa.nivelAcesso === "admin" && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c9a84c20", color: "#c9a84c" }}>Admin</span>
                  )}
                  {pessoa.statusOnline?.ativo && (
                    <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full" style={{ background: "#10b98120", color: "#10b981" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
                      Online{pessoa.statusOnline.ate ? " ate " + pessoa.statusOnline.ate : ""}
                    </span>
                  )}
                  {pessoa.estado && (
                    <span className="flex items-center gap-1 text-sm" style={{ color: "#64748b" }}>
                      <MapPin size={14} /> {pessoa.estado}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sm" style={{ color: "#64748b" }}>
                    <Clock size={14} /> {pessoa.horasDisponiveis}h/dia
                  </span>
                  {(() => {
                    const dn = pessoa.dataNascimento || pessoa.formulario?.dataNascimento;
                    if (!dn) return null;
                    const idade = calcIdade(dn);
                    return (
                      <span className="text-sm" style={{ color: "#64748b" }}>
                        {idade} anos
                      </span>
                    );
                  })()}
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(pessoa.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm transition-all hover:opacity-80 group"
                    style={{ color: "#64748b" }}
                    title={`Enviar email para ${pessoa.nome}`}
                  >
                    <Mail size={13} className="group-hover:text-blue-400 transition-colors" />
                    <span className="group-hover:underline">{pessoa.email}</span>
                  </a>
                </div>

                {/* Custo — apenas admin: salário + ferramentas + total num bloco compacto */}
                {isAdmin && (
                  <div className="mt-3 rounded-xl overflow-hidden" style={{ background: "#0d1f35", border: "1px solid #1e3356" }}>
                    {/* Linha salário */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wider flex-shrink-0 w-24" style={{ color: "#475569" }}>Salario</span>
                      {editandoSalario ? (
                        <>
                          <span className="text-xs" style={{ color: "#64748b" }}>R$</span>
                          <input
                            value={salarioInput}
                            onChange={(e) => setSalarioInput(e.target.value)}
                            placeholder="0,00"
                            type="number"
                            className="px-2 py-1 rounded-lg text-sm text-white outline-none flex-1"
                            style={{ background: "#1e3356", border: "1px solid #334155", minWidth: 0, maxWidth: 120 }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { setSalario(pessoa.id, Number(salarioInput)); setEditandoSalario(false); }
                              if (e.key === "Escape") setEditandoSalario(false);
                            }}
                          />
                          <button onClick={() => { setSalario(pessoa.id, Number(salarioInput)); setEditandoSalario(false); }}
                            className="p-1.5 rounded-lg flex-shrink-0" style={{ background: "#10b98120", color: "#10b981" }}>
                            <Check size={13} />
                          </button>
                          <button onClick={() => setEditandoSalario(false)} className="p-1.5 rounded-lg flex-shrink-0" style={{ color: "#64748b" }}>
                            <X size={13} />
                          </button>
                        </>
                      ) : pessoa.salario ? (
                        <>
                          <span className="text-sm font-bold flex-1" style={{ color: "#10b981" }}>
                            R$ {pessoa.salario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                          <button onClick={() => { setSalarioInput(String(pessoa.salario)); setEditandoSalario(true); }}
                            className="p-1 rounded-lg hover:opacity-80 flex-shrink-0" style={{ color: "#334155" }} title="Editar salario">
                            <Edit2 size={12} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setSalarioInput(""); setEditandoSalario(true); }}
                          className="flex items-center gap-1.5 text-xs transition-all hover:opacity-80" style={{ color: "#334155" }}>
                          Não informado <Edit2 size={11} />
                        </button>
                      )}
                    </div>

                    {/* Linha ferramentas — só aparece se tiver alguma */}
                    {ferrsPessoa.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: "1px solid #1e3356" }}>
                        <span className="text-xs font-semibold uppercase tracking-wider flex-shrink-0 w-24" style={{ color: "#475569" }}>Ferramentas</span>
                        <span className="text-sm font-bold flex-1" style={{ color: "#3b82f6" }}>
                          R$ {custoFerrTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {ferrsPessoa.map((f) => (
                            <span key={f.id} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: (f.cor || "#3b82f6") + "20", color: f.cor || "#3b82f6" }}>
                              {f.nome.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linha total — só aparece se tiver salário ou ferramenta */}
                    {custoTotal > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: "1px solid #c9a84c25", background: "#0b1624" }}>
                        <span className="text-xs font-semibold uppercase tracking-wider flex-shrink-0 w-24" style={{ color: "#c9a84c" }}>Total</span>
                        <span className="text-sm font-black flex-1" style={{ color: "#c9a84c" }}>
                          R$ {custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs" style={{ color: "#475569" }}>por mes</span>
                      </div>
                    )}
                  </div>
                )}

                {/* WhatsApp + Telefone */}
                {pessoa.telefone ? (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <a
                      href={`https://wa.me/${pessoa.telefone.replace(/\D/g, "")}?text=Oi%20${encodeURIComponent(pessoa.nome.split(" ")[0])}!%20`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98130" }}
                    >
                      <MessageCircle size={13} />
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${pessoa.telefone.replace(/\D/g, "")}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f630" }}
                    >
                      <Phone size={13} />
                      Ligar
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => { setTelefoneInput(pessoa.telefone || ""); setEditandoTelefone(true); }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        style={{ color: "#475569" }}
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                ) : isAdmin ? (
                  <div className="mt-3">
                    {editandoTelefone ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={telefoneInput}
                          onChange={(e) => setTelefoneInput(e.target.value)}
                          placeholder="+55 11 99999-0000"
                          className="px-3 py-1.5 rounded-xl text-sm text-white outline-none"
                          style={{ background: "#1e3356", border: "1px solid #334155", width: 180 }}
                          autoFocus
                        />
                        <button
                          onClick={() => { setTelefone(pessoa.id, telefoneInput); setEditandoTelefone(false); }}
                          className="p-1.5 rounded-lg"
                          style={{ background: "#10b98120", color: "#10b981" }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditandoTelefone(false)}
                          className="p-1.5 rounded-lg"
                          style={{ color: "#64748b" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setTelefoneInput(""); setEditandoTelefone(true); }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                        style={{ background: "#1e3356", color: "#475569", border: "1px solid #334155" }}
                      >
                        <Phone size={12} />
                        Adicionar telefone
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Google Chat */}
                <div className="mt-3">
                  {pessoa.googleChatLink ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={pessoa.googleChatLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                        style={{ background: "#1bb86420", color: "#1bb864", border: "1px solid #1bb86430" }}
                      >
                        <MessageCircle size={13} />
                        Google Chat
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => { setGoogleChatInput(pessoa.googleChatLink || ""); setEditandoGoogleChat(true); }}
                          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                          style={{ color: "#475569" }}
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  ) : isAdmin ? (
                    editandoGoogleChat ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={googleChatInput}
                          onChange={(e) => setGoogleChatInput(e.target.value)}
                          placeholder="https://mail.google.com/chat/u/0/#chat/dm/..."
                          className="px-3 py-1.5 rounded-xl text-sm text-white outline-none"
                          style={{ background: "#1e3356", border: "1px solid #334155", width: 260 }}
                          autoFocus
                        />
                        <button
                          onClick={() => { setGoogleChatLink(pessoa.id, googleChatInput); setEditandoGoogleChat(false); }}
                          className="p-1.5 rounded-lg"
                          style={{ background: "#10b98120", color: "#10b981" }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditandoGoogleChat(false)}
                          className="p-1.5 rounded-lg"
                          style={{ color: "#64748b" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setGoogleChatInput(""); setEditandoGoogleChat(true); }}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                        style={{ background: "#1e3356", color: "#475569", border: "1px solid #334155" }}
                      >
                        <MessageCircle size={12} />
                        Adicionar Google Chat
                      </button>
                    )
                  ) : null}
                </div>
              </div>
              {podeReconhecer && (
                <button
                  onClick={() => setReconhModal(true)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ background: "#c9a84c20", color: "#c9a84c", border: "1px solid #c9a84c30" }}
                >
                  <Award size={14} />
                  Reconhecer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Barras de progresso */}
        <div className="mt-5 space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span style={{ color: "#64748b" }}>Rotinas hoje</span>
              <span className="font-bold" style={{ color: progressoCor }}>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: progressoCor }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span style={{ color: "#64748b" }}>Expectativas ({expCumpridas}/{pessoa.expectativas.length} cumpridas)</span>
              <span className="font-bold" style={{ color: expCor }}>{pctExp}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctExp}%`, background: expCor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Expectativas */}
      <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} style={{ color: "#c9a84c" }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
            Expectativas &mdash; O que se espera desta pessoa
          </p>
        </div>
        <div className="space-y-2">
          {pessoa.expectativas.map((exp) => {
            const podeCumprir = isAdmin || usuarioAtual.id === pessoa.id;
            return (
              <button
                key={exp.id}
                onClick={() => podeCumprir && marcarExpectativa(pessoa.id, exp.id, !exp.cumprida)}
                disabled={!podeCumprir}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  background: exp.cumprida ? "#10b98110" : "#1e3356",
                  border: `1px solid ${exp.cumprida ? "#10b98130" : "transparent"}`,
                  cursor: podeCumprir ? "pointer" : "default",
                }}
              >
                {exp.cumprida
                  ? <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
                  : <Circle size={18} style={{ color: "#334155", flexShrink: 0 }} />
                }
                <span className="flex-1 text-sm" style={{ color: exp.cumprida ? "#64748b" : "#e8edf5", textDecoration: exp.cumprida ? "line-through" : "none" }}>
                  {exp.descricao}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: exp.tipo === "diaria" ? "#3b82f620" : "#8b5cf620",
                    color: exp.tipo === "diaria" ? "#3b82f6" : "#8b5cf6",
                  }}>
                    {exp.tipo === "diaria" ? "Diaria" : "Semanal"}
                  </span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: exp.peso }).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: exp.peso === 3 ? "#ef4444" : exp.peso === 2 ? "#f59e0b" : "#64748b" }} />
                    ))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-3" style={{ color: "#334155" }}>
          {isAdmin ? "Como admin, você pode marcar expectativas cumpridas." : usuarioAtual.id === pessoa.id ? "Marque as expectativas que você cumpriu hoje." : "Apenas admin ou o próprio colaborador pode marcar."}
        </p>
      </div>

      {pessoa.formulario?.sobreMim && (
        <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <h3 className="font-semibold text-white mb-4">Sobre {pessoa.nome.split(" ")[0]}</h3>
          <div className="space-y-3">
            {pessoa.formulario.sobreMim.estiloTrabalho && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#1e3356" }}>
                <span style={{ fontSize: 20 }}>
                  {pessoa.formulario.sobreMim.estiloTrabalho === "autonomo" ? "🦅"
                    : pessoa.formulario.sobreMim.estiloTrabalho === "colaborativo" ? "🤝"
                    : "🌊"}
                </span>
                <div>
                  <p className="text-xs" style={{ color: "#64748b" }}>Estilo de trabalho</p>
                  <p className="text-sm font-medium text-white">
                    {pessoa.formulario.sobreMim.estiloTrabalho === "autonomo" ? "Autônomo"
                      : pessoa.formulario.sobreMim.estiloTrabalho === "colaborativo" ? "Colaborativo"
                      : "Flexível"}
                  </p>
                </div>
              </div>
            )}
            {pessoa.formulario.sobreMim.motivacao && (
              <div>
                <p className="text-xs mb-1" style={{ color: "#64748b" }}>O que motiva</p>
                <p className="text-sm text-white">{pessoa.formulario.sobreMim.motivacao}</p>
              </div>
            )}
            {pessoa.formulario.sobreMim.desafioAtual && (
              <div>
                <p className="text-xs mb-1" style={{ color: "#64748b" }}>Maior desafio hoje</p>
                <p className="text-sm text-white">{pessoa.formulario.sobreMim.desafioAtual}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="rounded-2xl p-5 flex flex-col items-center" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4 self-start" style={{ color: "#64748b" }}>
            Mapa de Habilidades
          </p>
          <RadarChart habilidades={pessoa.habilidades} cor={pessoa.cor} />
        </div>

        {/* Habilidades bar chart */}
        <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#64748b" }}>
            Todas as Habilidades
          </p>
          <div className="space-y-3">
            {[...pessoa.habilidades].sort((a, b) => b.nivel - a.nivel).map((h) => (
              <div key={h.nome}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">{h.nome}</span>
                  <span className="font-bold" style={{ color: pessoa.cor }}>{h.nivel}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${h.nivel}%`, background: "#c9a84c" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lojas */}
      {pessoa.lojas.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#64748b" }}>
            Lojas Responsavel
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {pessoa.lojas.map((lid) => {
              const loja = LOJAS.find((l) => l.id === lid);
              if (!loja) return null;
              return (
                <Link
                  key={lid}
                  href={`/lojas/${loja.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-80"
                  style={{ background: "#1e3356" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: loja.corFundo || "#0b1624" }}>
                    {loja.logo ? (
                      <Image src={loja.logo} alt={loja.nome} width={40} height={40} className="object-contain" unoptimized />
                    ) : (
                      <span className="text-xs font-bold" style={{ color: "#c9a84c" }}>{loja.nome.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{loja.nome}</p>
                    <p className="text-xs" style={{ color: loja.grupo === "izzat" ? "#c9a84c" : "#3b82f6" }}>
                      {loja.grupo === "izzat" ? "Grupo Izzat" : "Partner"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Rotinas */}
      {pessoa.rotinas.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
              Rotinas Diárias
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1e3356", color: "#64748b" }}>
              {pessoa.rotinas.filter((r) => r.concluida).length}/{pessoa.rotinas.length} hoje
            </span>
          </div>
          <div className="space-y-2">
            {pessoa.rotinas.map((rotina) => {
              const subFeitas = rotina.subtarefas.filter((s) => s.concluida).length;
              const lojaRotina = LOJAS.find((l) => l.id === rotina.lojaId);
              const podeCumprir = isAdmin || usuarioAtual.id === pessoa.id;
              const aberta = rotinasExpandidas.includes(rotina.id);
              return (
                <div key={rotina.id} className="rounded-xl overflow-hidden" style={{ background: "#1e3356", border: `1px solid ${rotina.concluida ? "#10b98130" : "#1e3356"}` }}>
                  {/* Header clicável */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => toggleRotina(rotina.id)}
                  >
                    <span
                      role="button"
                      tabIndex={0}
                      className="flex-shrink-0"
                      onClick={(e) => {
                        if (!podeCumprir) return;
                        e.stopPropagation();
                        marcarSubtarefa(pessoa.id, rotina.id, rotina.id, !rotina.concluida);
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === " " || e.key === "Enter") && podeCumprir) {
                          e.stopPropagation();
                          marcarSubtarefa(pessoa.id, rotina.id, rotina.id, !rotina.concluida);
                        }
                      }}
                    >
                      {rotina.concluida
                        ? <CheckCircle2 size={18} style={{ color: "#10b981" }} />
                        : <Circle size={18} style={{ color: "#475569" }} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white" style={{ textDecoration: rotina.concluida ? "line-through" : "none", opacity: rotina.concluida ? 0.6 : 1 }}>
                        {rotina.titulo}
                      </p>
                      {lojaRotina && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{lojaRotina.nome}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirPomodoro(rotina.id, rotina.titulo); }}
                        className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                        style={{ background: "#ef444415", color: "#ef4444" }}
                        title="Iniciar Pomodoro"
                      >
                        &#127813; Foco
                      </button>
                      <span className="text-xs" style={{ color: "#64748b" }}>{subFeitas}/{rotina.subtarefas.length}</span>
                      {aberta ? <ChevronUp size={14} style={{ color: "#64748b" }} /> : <ChevronDown size={14} style={{ color: "#64748b" }} />}
                    </div>
                  </button>

                  {/* Subtarefas — colapsável */}
                  {aberta && rotina.subtarefas.length > 0 && (
                    <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: "#1e335660" }}>
                      <div className="pt-2 space-y-1.5">
                        {rotina.subtarefas.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "#122039" }}>
                            <button
                              onClick={() => podeCumprir && marcarSubtarefa(pessoa.id, rotina.id, sub.id, !sub.concluida)}
                              disabled={!podeCumprir}
                              className="flex-shrink-0"
                              style={{ cursor: podeCumprir ? "pointer" : "default" }}
                            >
                              {sub.concluida
                                ? <CheckCircle2 size={15} style={{ color: "#10b981" }} />
                                : <Circle size={15} style={{ color: "#334155" }} />}
                            </button>
                            <span className="text-xs flex-1" style={{ color: sub.concluida ? "#64748b" : "#94a3b8", textDecoration: sub.concluida ? "line-through" : "none" }}>
                              {sub.titulo}
                            </span>
                            <button
                              onClick={() => abrirPomodoro(sub.id, sub.titulo)}
                              className="flex-shrink-0 text-xs px-1.5 py-1 rounded-lg"
                              style={{ color: "#ef4444", background: "#ef444410" }}
                              title="Pomodoro nesta subtarefa"
                            >
                              &#127813;
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tarefas */}
      {minhasTarefas.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#64748b" }}>
            Tarefas ({minhasTarefas.length} total &middot; {tarefasAtivas.length} ativas)
          </p>
          <div className="space-y-2">
            {minhasTarefas.map((t) => {
              const loja = LOJAS.find((l) => l.id === t.lojaId);
              const cor = PRIORIDADE_COR[t.prioridade] || "#64748b";
              return (
                <div key={t.id} className="flex items-start justify-between p-3 rounded-xl"
                  style={{ background: "#1e3356", borderLeft: `3px solid ${cor}` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{t.titulo}</p>
                    {loja && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{loja.nome}</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0" style={{ background: "#122039", color: "#94a3b8" }}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulario — admin ve respostas preenchidas; colaborador ve link para preencher/rever */}
      {!isAdmin && isProprioUsuario && !pessoa.formulario && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#c9a84c10", border: "1px solid #c9a84c25" }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Formulario de perfil nao preenchido</p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Compartilhe seus sonhos, estilo de trabalho e bem-estar com o lider.</p>
          </div>
          <Link href="/formulario" className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80 flex-shrink-0" style={{ background: "#c9a84c", color: "#0b1624" }}>
            Preencher
          </Link>
        </div>
      )}
      {!isAdmin && isProprioUsuario && pessoa.formulario && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#10b98110", border: "1px solid #10b98125" }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#10b981" }}>Formulario preenchido</p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Suas respostas estao disponiveis para o gestor.</p>
          </div>
        </div>
      )}

      {isAdmin && pessoa.formulario && (
        <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <div className="flex items-center gap-2 mb-5">
            <span style={{ fontSize: 16 }}>📋</span>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
              Formulario de Perfil
            </p>
            {pessoa.formulario.preenchidoEm && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#10b98115", color: "#10b981" }}>
                Preenchido em {new Date(pessoa.formulario.preenchidoEm).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Etapa 2 — Sonhos */}
            {(pessoa.formulario.sonho3anos || pessoa.formulario.sonho5anos || pessoa.formulario.oQueImpede) && (
              <div className="rounded-xl p-4" style={{ background: "#1e3356" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#8b5cf6" }}>Sonhos e Objetivos</p>
                <div className="space-y-3">
                  {pessoa.formulario.sonho3anos && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Sonho em 3 anos</p>
                      <p className="text-sm text-white leading-relaxed">{pessoa.formulario.sonho3anos}</p>
                    </div>
                  )}
                  {pessoa.formulario.sonho5anos && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Visao em 5 anos</p>
                      <p className="text-sm text-white leading-relaxed">{pessoa.formulario.sonho5anos}</p>
                    </div>
                  )}
                  {pessoa.formulario.oQueImpede && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>O que impede hoje</p>
                      <p className="text-sm text-white leading-relaxed">{pessoa.formulario.oQueImpede}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Etapa 3 — Fit com empresa */}
            {(pessoa.formulario.porQueQuerTrabalhar || pessoa.formulario.comoEmpresaAjuda || pessoa.formulario.areaAprender) && (
              <div className="rounded-xl p-4" style={{ background: "#1e3356" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#3b82f6" }}>Por que esta aqui</p>
                <div className="space-y-3">
                  {pessoa.formulario.porQueQuerTrabalhar && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Motivacao para entrar</p>
                      <p className="text-sm text-white leading-relaxed">{pessoa.formulario.porQueQuerTrabalhar}</p>
                    </div>
                  )}
                  {pessoa.formulario.comoEmpresaAjuda && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Como a empresa ajuda nos objetivos</p>
                      <p className="text-sm text-white leading-relaxed">{pessoa.formulario.comoEmpresaAjuda}</p>
                    </div>
                  )}
                  {pessoa.formulario.areaAprender && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Area que quer aprender</p>
                      <p className="text-sm font-medium" style={{ color: "#c9a84c" }}>{pessoa.formulario.areaAprender}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Etapa 5 — Estilo de trabalho */}
            {(pessoa.formulario.reacaoFeedback || pessoa.formulario.motivadores || pessoa.formulario.desmotivadores || pessoa.formulario.prefereComunicacao) && (
              <div className="rounded-xl p-4" style={{ background: "#1e3356" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#10b981" }}>Estilo de Trabalho</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {pessoa.formulario.reacaoFeedback && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Reacao a feedback</p>
                      <p className="text-sm text-white">{pessoa.formulario.reacaoFeedback}</p>
                    </div>
                  )}
                  {pessoa.formulario.prefereComunicacao && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Prefere comunicacao via</p>
                      <p className="text-sm text-white">{pessoa.formulario.prefereComunicacao}</p>
                    </div>
                  )}
                  {pessoa.formulario.motivadores && (
                    <div className="sm:col-span-2">
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>O que motiva</p>
                      <p className="text-sm text-white">{pessoa.formulario.motivadores}</p>
                    </div>
                  )}
                  {pessoa.formulario.desmotivadores && (
                    <div className="sm:col-span-2">
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>O que desmotiva</p>
                      <p className="text-sm text-white">{pessoa.formulario.desmotivadores}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Etapa 6 — Autoconhecimento */}
            {(pessoa.formulario.maiorForca || pessoa.formulario.aDesenvolver || pessoa.formulario.desafioSuperado) && (
              <div className="rounded-xl p-4" style={{ background: "#1e3356" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#f59e0b" }}>Autoconhecimento</p>
                <div className="space-y-3">
                  {pessoa.formulario.maiorForca && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Maior forca</p>
                      <p className="text-sm text-white">{pessoa.formulario.maiorForca}</p>
                    </div>
                  )}
                  {pessoa.formulario.aDesenvolver && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Ponto a desenvolver</p>
                      <p className="text-sm text-white">{pessoa.formulario.aDesenvolver}</p>
                    </div>
                  )}
                  {pessoa.formulario.desafioSuperado && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>Desafio ja superado</p>
                      <p className="text-sm text-white leading-relaxed">{pessoa.formulario.desafioSuperado}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Etapa 7 — Bem-estar */}
            {(pessoa.formulario.nivelEnergia || pessoa.formulario.ansiedadeNivel || pessoa.formulario.oQueDeveSaber || pessoa.formulario.mensagemParaLider) && (
              <div className="rounded-xl p-4" style={{ background: "#1e3356", border: "1px solid #c9a84c20" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#c9a84c" }}>Bem-estar e Mensagem ao Lider</p>
                <div className="space-y-3">
                  {(pessoa.formulario.nivelEnergia || pessoa.formulario.ansiedadeNivel) && (
                    <div className="flex gap-4">
                      {pessoa.formulario.nivelEnergia && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: "#64748b" }}>Nivel de energia</p>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((n) => (
                              <div key={n} className="w-5 h-5 rounded-full"
                                style={{ background: n <= (pessoa.formulario?.nivelEnergia || 0) ? "#10b981" : "#334155" }} />
                            ))}
                          </div>
                        </div>
                      )}
                      {pessoa.formulario.ansiedadeNivel && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: "#64748b" }}>Nivel de ansiedade</p>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((n) => (
                              <div key={n} className="w-5 h-5 rounded-full"
                                style={{ background: n <= (pessoa.formulario?.ansiedadeNivel || 0)
                                  ? (pessoa.formulario?.ansiedadeNivel || 0) >= 4 ? "#ef4444" : "#f59e0b"
                                  : "#334155" }} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {pessoa.formulario.oQueDeveSaber && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#64748b" }}>O que o lider deve saber sobre mim</p>
                      <p className="text-sm text-white leading-relaxed">{pessoa.formulario.oQueDeveSaber}</p>
                    </div>
                  )}
                  {pessoa.formulario.mensagemParaLider && (
                    <div className="rounded-xl p-3" style={{ background: "#c9a84c0d", border: "1px solid #c9a84c30" }}>
                      <p className="text-xs mb-2 font-semibold" style={{ color: "#c9a84c" }}>Mensagem pessoal para o lider</p>
                      <p className="text-sm text-white leading-relaxed italic">"{pessoa.formulario.mensagemParaLider}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario nao preenchido — admin ve aviso */}
      {isAdmin && !pessoa.formulario && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#122039", border: "1px solid #1e3356" }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <p className="text-sm" style={{ color: "#475569" }}>
            {pessoa.nome.split(" ")[0]} ainda nao preencheu o formulario de perfil.
          </p>
        </div>
      )}

      {/* Reconhecimentos */}
      <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award size={16} style={{ color: "#c9a84c" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
                Reconhecimentos ({pessoa.reconhecimentos?.length || 0})
              </p>
            </div>
            <p className="text-xs mt-0.5 ml-6" style={{ color: "#334155" }}>Elogios publicos que colegas enviaram para esta pessoa · +25 XP cada</p>
          </div>
          {podeReconhecer && (
            <button
              onClick={() => setReconhModal(true)}
              className="text-xs px-3 py-1.5 rounded-xl font-bold transition-opacity hover:opacity-80"
              style={{ background: "#c9a84c20", color: "#c9a84c" }}
            >
              + Reconhecer
            </button>
          )}
        </div>

        {(!pessoa.reconhecimentos || pessoa.reconhecimentos.length === 0) ? (
          <div className="text-center py-6">
            <Award size={28} className="mx-auto mb-2" style={{ color: "#1e3356" }} />
            <p className="text-sm" style={{ color: "#475569" }}>Nenhum reconhecimento ainda.</p>
            {podeReconhecer && (
              <button onClick={() => setReconhModal(true)} className="mt-2 text-sm transition-opacity hover:opacity-80" style={{ color: "#c9a84c" }}>
                Seja o primeiro a reconhecer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pessoa.reconhecimentos.map((rec) => {
              const de = colaboradores.find((c) => c.id === rec.deId);
              return (
                <div key={rec.id} className="flex gap-3 p-3 rounded-xl" style={{ background: "#1e3356" }}>
                  <span className="text-2xl flex-shrink-0">{rec.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-snug">{rec.mensagem}</p>
                    <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                      por{" "}
                      {de ? (
                        <Link href={`/equipe/${de.id}`} className="hover:underline" style={{ color: "#94a3b8" }}>
                          {de.nome.split(" ")[0]}
                        </Link>
                      ) : "Alguem"}
                      {" "}&middot;{" "}{rec.data}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Reconhecimento */}
      {reconhModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000090" }}
          onClick={() => setReconhModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 space-y-4"
            style={{ background: "#122039", border: "1px solid #1e3356" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar nome={pessoa.nome} avatar={pessoa.avatar} foto={pessoa.foto} cor={pessoa.cor} size={36} />
                <div>
                  <h2 className="text-white font-bold">Reconhecer {pessoa.nome.split(" ")[0]}</h2>
                  <p className="text-xs" style={{ color: "#64748b" }}>Visivel no perfil + +25 XP</p>
                </div>
              </div>
              <button onClick={() => setReconhModal(false)}><X size={20} style={{ color: "#64748b" }} /></button>
            </div>

            <div>
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>Escolha um emoji</p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS_RECONH.map((e) => (
                  <button
                    key={e}
                    onClick={() => setReconhForm((f) => ({ ...f, emoji: e }))}
                    className="text-2xl p-2 rounded-xl transition-all"
                    style={{
                      background: reconhForm.emoji === e ? "#c9a84c20" : "#1e3356",
                      border: `1px solid ${reconhForm.emoji === e ? "#c9a84c" : "transparent"}`,
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={reconhForm.mensagem}
              onChange={(e) => setReconhForm((f) => ({ ...f, mensagem: e.target.value }))}
              placeholder={"Escreva uma mensagem para " + pessoa.nome.split(" ")[0] + "..."}
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}
            />

            <div className="flex items-center justify-between text-sm mb-3">
              <span style={{ color: "#64748b" }}>Fichas disponíveis esta semana</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full"
                    style={{
                      background: i < fichasDisponiveis ? "#c9a84c" : "#1e3356",
                      border: "1px solid #c9a84c40",
                    }}
                  />
                ))}
              </div>
            </div>

            {fichasDisponiveis <= 0 ? (
              <p className="text-xs text-center" style={{ color: "#64748b" }}>
                Você usou todas as fichas desta semana. Recarregam na próxima semana.
              </p>
            ) : (
              <button
                onClick={handleReconhecer}
                disabled={!reconhForm.mensagem.trim() || fichasDisponiveis <= 0}
                className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: "#c9a84c", color: "#0b1624" }}
              >
                Enviar Reconhecimento
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
