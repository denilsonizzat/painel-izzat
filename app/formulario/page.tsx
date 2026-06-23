"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { RespostaFormulario } from "@/lib/data";
import { ChevronRight, ChevronLeft, Check, User, Star, Building2, Clock, MessageCircle, Brain, Heart, Moon, Sun } from "lucide-react";

interface FormData {
  casado: boolean | null;
  temFilhos: boolean | null;
  temOutroEmprego: boolean | null;
  escolaridade: string;
  bairro: string;
  dataNascimento: string;
  sonho3anos: string;
  sonho5anos: string;
  oQueImpede: string;
  porQueQuerTrabalhar: string;
  comoEmpresaAjuda: string;
  areaAprender: string;
  horarioInicio: string;
  horarioFim: string;
  horarioDormir: string;
  horarioAcordar: string;
  diasDisponiveis: string[];
  distracoes: string;
  ambienteTrabalho: string;
  reacaoFeedback: string;
  motivadores: string;
  desmotivadores: string;
  prefereComunicacao: string;
  maiorForca: string;
  aDesenvolver: string;
  desafioSuperado: string;
  nivelEnergia: number;
  praticaAtividade: boolean | null;
  ansiedadeNivel: number;
  oQueDeveSaber: string;
  mensagemParaLider: string;
}

const INICIAL: FormData = {
  casado: null, temFilhos: null, temOutroEmprego: null, escolaridade: "", bairro: "", dataNascimento: "",
  sonho3anos: "", sonho5anos: "", oQueImpede: "",
  porQueQuerTrabalhar: "", comoEmpresaAjuda: "", areaAprender: "",
  horarioInicio: "09:00", horarioFim: "18:00", horarioDormir: "", horarioAcordar: "", diasDisponiveis: [], distracoes: "", ambienteTrabalho: "",
  reacaoFeedback: "", motivadores: "", desmotivadores: "", prefereComunicacao: "",
  maiorForca: "", aDesenvolver: "", desafioSuperado: "",
  nivelEnergia: 3, praticaAtividade: null, ansiedadeNivel: 2, oQueDeveSaber: "", mensagemParaLider: "",
};

const ETAPAS = [
  { label: "Identidade", icon: User },
  { label: "Sonhos", icon: Star },
  { label: "Empresa", icon: Building2 },
  { label: "Rotina", icon: Clock },
  { label: "Estilo", icon: MessageCircle },
  { label: "Autoconhec.", icon: Brain },
  { label: "Bem-estar", icon: Heart },
];

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function BoolBtn({ label, ativo, onClick }: { label: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
      style={{
        background: ativo ? "var(--gold)" + "22" : "var(--card)",
        border: `1.5px solid ${ativo ? "var(--gold)" : "var(--border)"}`,
        color: ativo ? "var(--gold)" : "var(--gray)",
      }}
    >
      {label}
    </button>
  );
}

function Txt({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  return (
    <div>
      <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
      />
    </div>
  );
}

function ScaleBtn({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
      style={{
        background: selected ? "var(--gold)" : "var(--card)",
        color: selected ? "#000" : "var(--gray)",
        border: `1.5px solid ${selected ? "var(--gold)" : "var(--border)"}`,
      }}
    >
      {value}
    </button>
  );
}

export default function FormularioPage() {
  const router = useRouter();
  const { usuarioAtual, salvarFormulario, registrarSono } = useAppStore();
  const [etapa, setEtapa] = useState(1);
  const [dados, setDados] = useState<FormData>(INICIAL);
  const [enviado, setEnviado] = useState(false);

  if (!usuarioAtual) {
    router.replace("/");
    return null;
  }

  const upd = <K extends keyof FormData>(k: K, v: FormData[K]) => setDados((d) => ({ ...d, [k]: v }));

  const toggleDia = (dia: string) => {
    const atual = dados.diasDisponiveis;
    upd("diasDisponiveis", atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia]);
  };

  function calcHoras(inicio: string, fim: string): number {
    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fim.split(":").map(Number);
    return Math.max(1, Math.round((h2 * 60 + m2 - h1 * 60 - m1) / 60));
  }

  function handleEnviar() {
    const resposta: RespostaFormulario = {
      casado: dados.casado,
      temFilhos: dados.temFilhos,
      temOutroEmprego: dados.temOutroEmprego,
      escolaridade: dados.escolaridade,
      bairro: dados.bairro,
      dataNascimento: dados.dataNascimento || undefined,
      sonho3anos: dados.sonho3anos,
      sonho5anos: dados.sonho5anos,
      oQueImpede: dados.oQueImpede,
      porQueQuerTrabalhar: dados.porQueQuerTrabalhar,
      comoEmpresaAjuda: dados.comoEmpresaAjuda,
      areaAprender: dados.areaAprender,
      horasDisponiveis: calcHoras(dados.horarioInicio, dados.horarioFim),
      horarioFoco: dados.horarioInicio,
      horarioInicio: dados.horarioInicio,
      horarioFim: dados.horarioFim,
      diasDisponiveis: dados.diasDisponiveis,
      distracoes: dados.distracoes,
      ambienteTrabalho: dados.ambienteTrabalho,
      reacaoFeedback: dados.reacaoFeedback,
      motivadores: dados.motivadores,
      desmotivadores: dados.desmotivadores,
      prefereComunicacao: dados.prefereComunicacao,
      maiorForca: dados.maiorForca,
      aDesenvolver: dados.aDesenvolver,
      desafioSuperado: dados.desafioSuperado,
      nivelEnergia: dados.nivelEnergia,
      praticaAtividade: dados.praticaAtividade,
      ansiedadeNivel: dados.ansiedadeNivel,
      oQueDeveSaber: dados.oQueDeveSaber,
      mensagemParaLider: dados.mensagemParaLider,
      pontosFortesLivre: dados.maiorForca,
      dificuldades: dados.aDesenvolver,
      preenchidoEm: new Date().toISOString(),
    };
    if (!usuarioAtual) return;
    salvarFormulario(usuarioAtual.id, resposta);
    if (dados.horarioDormir && dados.horarioAcordar) {
      const hoje = new Date().toISOString().split("T")[0];
      registrarSono(usuarioAtual.id, { data: hoje, horaDormir: dados.horarioDormir, horaAcordar: dados.horarioAcordar });
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center px-6 max-w-sm">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--gold)" + "22", border: "2px solid var(--gold)" }}
          >
            <Check size={36} style={{ color: "var(--gold)" }} />
          </div>
          <h1 className="text-2xl font-black mb-3" style={{ color: "var(--text)" }}>Perfil completo!</h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--gray)" }}>
            Suas respostas foram salvas. Obrigado por compartilhar — isso nos ajuda a te apoiar melhor.
          </p>
          <button
            onClick={() => router.replace("/dashboard")}
            className="w-full py-3 rounded-2xl font-bold text-sm"
            style={{ background: "var(--gold)", color: "#000" }}
          >
            Ir para o painel
          </button>
        </div>
      </div>
    );
  }

  const pct = Math.round(((etapa - 1) / ETAPAS.length) * 100);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header / progress */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
              Etapa {etapa} de {ETAPAS.length}
            </p>
            <p className="text-xs font-semibold" style={{ color: "var(--gray)" }}>{pct}% concluido</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--gold)" }} />
          </div>
          <div className="flex items-center justify-between mt-3">
            {ETAPAS.map((e, i) => {
              const Icon = e.icon;
              const done = i + 1 < etapa;
              const active = i + 1 === etapa;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: done ? "var(--gold)" : active ? "var(--gold)" + "22" : "var(--card)",
                      border: `1.5px solid ${done || active ? "var(--gold)" : "var(--border)"}`,
                    }}
                  >
                    {done
                      ? <Check size={12} strokeWidth={3} style={{ color: "#000" }} />
                      : <Icon size={12} style={{ color: active ? "var(--gold)" : "var(--gray)" }} />}
                  </div>
                  <span className="text-[9px] font-semibold hidden sm:block" style={{ color: active ? "var(--gold)" : "var(--gray)" }}>
                    {e.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-lg mx-auto space-y-5">

          {/* ETAPA 1 — Identidade */}
          {etapa === 1 && (
            <>
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--text)" }}>Identidade e Contexto</h2>
                <p className="text-sm" style={{ color: "var(--gray)" }}>Queremos te conhecer como pessoa, não só como colaborador.</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Bairro / Cidade</label>
                <input
                  value={dados.bairro}
                  onChange={(e) => upd("bairro", e.target.value)}
                  placeholder="Ex: Moema, São Paulo - SP"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Data de Nascimento</label>
                <input
                  type="date"
                  value={dados.dataNascimento}
                  onChange={(e) => upd("dataNascimento", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Escolaridade</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["ensino_medio", "Ensino Médio"], ["tecnico", "Técnico"], ["graduacao", "Graduação"], ["pos_graduacao", "Pós-Graduação"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => upd("escolaridade", v)}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: dados.escolaridade === v ? "var(--gold)" + "22" : "var(--card)",
                        border: `1.5px solid ${dados.escolaridade === v ? "var(--gold)" : "var(--border)"}`,
                        color: dados.escolaridade === v ? "var(--gold)" : "var(--gray)",
                      }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Estado civil</label>
                <div className="flex gap-2">
                  {[["false", "Solteiro(a)"], ["true", "Casado(a)"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => upd("casado", v === "true")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: (v === "true" ? dados.casado === true : dados.casado === false) ? "var(--gold)" + "22" : "var(--card)",
                        border: `1.5px solid ${(v === "true" ? dados.casado === true : dados.casado === false) ? "var(--gold)" : "var(--border)"}`,
                        color: (v === "true" ? dados.casado === true : dados.casado === false) ? "var(--gold)" : "var(--gray)",
                      }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Tem filhos?</label>
                <div className="flex gap-3">
                  <BoolBtn label="Sim" ativo={dados.temFilhos === true} onClick={() => upd("temFilhos", true)} />
                  <BoolBtn label="Não" ativo={dados.temFilhos === false} onClick={() => upd("temFilhos", false)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Tem outro emprego ou renda paralela?</label>
                <div className="flex gap-3">
                  <BoolBtn label="Sim" ativo={dados.temOutroEmprego === true} onClick={() => upd("temOutroEmprego", true)} />
                  <BoolBtn label="Não" ativo={dados.temOutroEmprego === false} onClick={() => upd("temOutroEmprego", false)} />
                </div>
              </div>
            </>
          )}

          {/* ETAPA 2 — Sonhos */}
          {etapa === 2 && (
            <>
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--text)" }}>Sonhos e Objetivos</h2>
                <p className="text-sm" style={{ color: "var(--gray)" }}>Entender onde você quer chegar nos ajuda a te apoiar no caminho.</p>
              </div>
              <Txt label="Em 3 anos, onde você quer estar?" value={dados.sonho3anos} onChange={(v) => upd("sonho3anos", v)}
                placeholder="Ex: Quero ter meu próprio negócio, estar em outra cidade, ter uma renda de X..." rows={3} />
              <Txt label="Qual e o seu sonho grande — para 5 anos ou mais?" value={dados.sonho5anos} onChange={(v) => upd("sonho5anos", v)}
                placeholder="Pode ser ousado. Quanto mais honesto, mais podemos ajudar." rows={3} />
              <Txt label="O que você sente que te impede de chegar lá hoje?" value={dados.oQueImpede} onChange={(v) => upd("oQueImpede", v)}
                placeholder="Ex: Falta de dinheiro, de tempo, de experiencia, de rede de contatos..." rows={3} />
            </>
          )}

          {/* ETAPA 3 — Empresa */}
          {etapa === 3 && (
            <>
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--text)" }}>Como a empresa se encaixa</h2>
                <p className="text-sm" style={{ color: "var(--gray)" }}>Queremos entender se a sua jornada e a nossa caminham juntas.</p>
              </div>
              <Txt label="Por que você quer trabalhar com a gente?" value={dados.porQueQuerTrabalhar} onChange={(v) => upd("porQueQuerTrabalhar", v)}
                placeholder="Seja honesto. Pode ser pela oportunidade, aprendizado, dinheiro — tudo é válido." rows={3} />
              <Txt label="Como você acredita que essa empresa pode te ajudar a crescer?" value={dados.comoEmpresaAjuda} onChange={(v) => upd("comoEmpresaAjuda", v)}
                placeholder="Ex: Aprender sobre e-commerce, ter flexibilidade, desenvolver liderança..." rows={3} />
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Em que área você mais quer aprender?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["marketing", "Marketing Digital"], ["vendas", "Vendas"], ["gestao", "Gestão de Equipe"], ["operacoes", "Operações / Logística"], ["design", "Design / Criativo"], ["dados", "Dados / Análise"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => upd("areaAprender", v)}
                      className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all text-left"
                      style={{
                        background: dados.areaAprender === v ? "var(--gold)" + "22" : "var(--card)",
                        border: `1.5px solid ${dados.areaAprender === v ? "var(--gold)" : "var(--border)"}`,
                        color: dados.areaAprender === v ? "var(--gold)" : "var(--gray)",
                      }}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ETAPA 4 — Rotina */}
          {etapa === 4 && (
            <>
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--text)" }}>Rotina Real</h2>
                <p className="text-sm" style={{ color: "var(--gray)" }}>Preciso entender como é o seu dia de verdade para não sobrecarregar você.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Inicio</label>
                  <input type="time" value={dados.horarioInicio} onChange={(e) => upd("horarioInicio", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Fim</label>
                  <input type="time" value={dados.horarioFim} onChange={(e) => upd("horarioFim", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
              </div>
              {/* Sono — opcional */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: "#7C6FE008", border: "1px solid #7C6FE025" }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Moon size={14} style={{ color: "#7C6FE0" }} />
                    <label className="text-sm font-semibold" style={{ color: "var(--text)" }}>{"Sono de ontem (opcional)"}</label>
                  </div>
                  <p className="text-xs" style={{ color: "var(--gray)" }}>{"Acompanhe seu sono ao longo do tempo. Pode pular por agora."}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1 mb-1.5" style={{ color: "#7C6FE0" }}>
                      <Moon size={11} /> Dormiu
                    </label>
                    <input
                      type="time"
                      value={dados.horarioDormir}
                      onChange={(e) => upd("horarioDormir", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--card)", border: "1px solid #7C6FE040", color: "var(--text)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1 mb-1.5" style={{ color: "#E8A33D" }}>
                      <Sun size={11} /> Acordou
                    </label>
                    <input
                      type="time"
                      value={dados.horarioAcordar}
                      onChange={(e) => upd("horarioAcordar", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "var(--card)", border: "1px solid #E8A33D40", color: "var(--text)" }}
                    />
                  </div>
                </div>
                {dados.horarioDormir && dados.horarioAcordar && (() => {
                  const [hd, md] = dados.horarioDormir.split(":").map(Number);
                  const [ha, ma] = dados.horarioAcordar.split(":").map(Number);
                  let minD = hd * 60 + md;
                  let minA = ha * 60 + ma;
                  if (minA <= minD) minA += 1440;
                  const total = minA - minD;
                  const h = Math.floor(total / 60);
                  const m = total % 60;
                  const cor = total >= 420 && total <= 540 ? "#36C98E" : total >= 360 ? "#E8A33D" : "#F2545B";
                  return (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--bg)" }}>
                      <span className="text-xs" style={{ color: "var(--gray)" }}>Total</span>
                      <span className="text-sm font-black" style={{ color: cor }}>
                        {m > 0 ? `${h}h ${m}min` : `${h}h`}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Dias disponiveis</label>
                <div className="flex gap-2 flex-wrap">
                  {DIAS.map((d) => {
                    const sel = dados.diasDisponiveis.includes(d);
                    return (
                      <button key={d} type="button" onClick={() => toggleDia(d)}
                        className="px-3 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: sel ? "var(--gold)" : "var(--card)",
                          color: sel ? "#000" : "var(--gray)",
                          border: `1.5px solid ${sel ? "var(--gold)" : "var(--border)"}`,
                        }}>{d}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Ambiente de trabalho</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["casa_silencio", "Casa (silencioso)"], ["casa_barulho", "Casa (com barulho)"], ["escritorio", "Escritorio / coworking"], ["variavel", "Varia muito"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => upd("ambienteTrabalho", v)}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: dados.ambienteTrabalho === v ? "var(--gold)" + "22" : "var(--card)",
                        border: `1.5px solid ${dados.ambienteTrabalho === v ? "var(--gold)" : "var(--border)"}`,
                        color: dados.ambienteTrabalho === v ? "var(--gold)" : "var(--gray)",
                      }}>{l}</button>
                  ))}
                </div>
              </div>
              <Txt label="Quais são suas principais distrações no dia a dia?" value={dados.distracoes} onChange={(v) => upd("distracoes", v)}
                placeholder="Ex: Filhos em casa, rede social, barulho da rua, outros afazeres..." rows={2} />
            </>
          )}

          {/* ETAPA 5 — Estilo */}
          {etapa === 5 && (
            <>
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--text)" }}>Estilo de Trabalho</h2>
                <p className="text-sm" style={{ color: "var(--gray)" }}>Como você funciona melhor — para adaptar a forma de trabalhar com você.</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Quando recebe um feedback difícil, você geralmente...</label>
                <div className="space-y-2">
                  {[
                    ["reflete", "Fico quieto(a) e processo internamente antes de responder"],
                    ["dialogo", "Quero entender melhor e começo a fazer perguntas"],
                    ["defensivo", "Fico na defensiva, depois processo e aceito"],
                    ["acao", "Aceito na hora e ja penso em como melhorar"],
                  ].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => upd("reacaoFeedback", v)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: dados.reacaoFeedback === v ? "var(--gold)" + "15" : "var(--card)",
                        border: `1.5px solid ${dados.reacaoFeedback === v ? "var(--gold)" : "var(--border)"}`,
                        color: dados.reacaoFeedback === v ? "var(--gold)" : "var(--text-dim)",
                      }}>{l}</button>
                  ))}
                </div>
              </div>
              <Txt label="O que mais te motiva no trabalho?" value={dados.motivadores} onChange={(v) => upd("motivadores", v)}
                placeholder="Ex: Resultado visivel, aprendizado, autonomia, reconhecimento, trabalho em equipe..." rows={2} />
              <Txt label="O que te desmotiva ou tira sua energia?" value={dados.desmotivadores} onChange={(v) => upd("desmotivadores", v)}
                placeholder="Ex: Tarefas repetitivas, falta de retorno, mudancas constantes sem explicacao..." rows={2} />
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Como prefere se comunicar no dia a dia?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["whatsapp", "WhatsApp / mensagem"], ["reuniao", "Reuniao rapida (video/voz)"], ["assincronico", "Pode ser assincronico"], ["qualquer", "Me adapto a qualquer um"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => upd("prefereComunicacao", v)}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: dados.prefereComunicacao === v ? "var(--gold)" + "22" : "var(--card)",
                        border: `1.5px solid ${dados.prefereComunicacao === v ? "var(--gold)" : "var(--border)"}`,
                        color: dados.prefereComunicacao === v ? "var(--gold)" : "var(--gray)",
                      }}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ETAPA 6 — Autoconhecimento */}
          {etapa === 6 && (
            <>
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--text)" }}>Autoconhecimento</h2>
                <p className="text-sm" style={{ color: "var(--gray)" }}>Quem é você quando está no seu melhor — e quando precisa de apoio.</p>
              </div>
              <Txt label="Qual é a sua maior força no trabalho?" value={dados.maiorForca} onChange={(v) => upd("maiorForca", v)}
                placeholder="Ex: Sou muito organizado(a), executo rápido, sou bom em relacionamento com o cliente..." rows={3} />
              <Txt label="O que você sabe que precisa desenvolver?" value={dados.aDesenvolver} onChange={(v) => upd("aDesenvolver", v)}
                placeholder="Ex: Preciso melhorar minha comunicação, tenho dificuldade com prazos curtos..." rows={3} />
              <Txt label="Conte um desafio que você superou — o que aconteceu e o que você fez?" value={dados.desafioSuperado} onChange={(v) => upd("desafioSuperado", v)}
                placeholder="Pode ser profissional ou pessoal. Mostra sua resiliência e como age sob pressão." rows={4} />
            </>
          )}

          {/* ETAPA 7 — Bem-estar */}
          {etapa === 7 && (
            <>
              <div>
                <h2 className="text-xl font-black mb-1" style={{ color: "var(--text)" }}>Bem-estar</h2>
                <p className="text-sm" style={{ color: "var(--gray)" }}>Sua saúde e energia importam. Queremos saber como cuidar de você da forma certa.</p>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: "var(--text)" }}>
                  Nível de energia no trabalho hoje
                  <span className="font-normal ml-1" style={{ color: "var(--gray)" }}>(1 = esgotado, 5 = energizado)</span>
                </label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <ScaleBtn key={n} value={n} selected={dados.nivelEnergia === n} onClick={() => upd("nivelEnergia", n)} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text)" }}>Pratica atividade física com regularidade?</label>
                <div className="flex gap-3">
                  <BoolBtn label="Sim" ativo={dados.praticaAtividade === true} onClick={() => upd("praticaAtividade", true)} />
                  <BoolBtn label="Não" ativo={dados.praticaAtividade === false} onClick={() => upd("praticaAtividade", false)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1" style={{ color: "var(--text)" }}>
                  Com que frequência sente ansiedade ou sobrecarga?
                  <span className="font-normal ml-1" style={{ color: "var(--gray)" }}>(1 = raramente, 5 = quase sempre)</span>
                </label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <ScaleBtn key={n} value={n} selected={dados.ansiedadeNivel === n} onClick={() => upd("ansiedadeNivel", n)} />
                  ))}
                </div>
              </div>
              <Txt label="O que a empresa deve saber sobre você que não foi perguntado?" value={dados.oQueDeveSaber} onChange={(v) => upd("oQueDeveSaber", v)}
                placeholder="Qualquer coisa que acha importante: uma condição, uma limitação, algo que te faz ser você..." rows={3} />
              <Txt label="Uma mensagem para o seu lider (opcional)" value={dados.mensagemParaLider} onChange={(v) => upd("mensagemParaLider", v)}
                placeholder="Pode ser um pedido, uma expectativa, algo que você quer que ele saiba..." rows={3} />
            </>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)", background: "var(--card)" }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {etapa > 1 && (
            <button
              onClick={() => setEtapa((e) => e - 1)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--gray)" }}
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
          )}
          {etapa < ETAPAS.length ? (
            <button
              onClick={() => setEtapa((e) => e + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all"
              style={{ background: "var(--gold)", color: "#000" }}
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleEnviar}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all"
              style={{ background: "var(--gold)", color: "#000" }}
            >
              <Check size={16} />
              Enviar perfil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
