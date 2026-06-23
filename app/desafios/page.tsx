"use client";
import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { CategoriaDesafio, Desafio, CheckInDesafio, Colaborador } from "@/lib/data";
import { Plus, X, Check, CheckCircle2, Flame, Trophy, Calendar, Target, Pencil, Trash2, ChevronDown, ChevronUp, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import MeuProgresso from "@/components/MeuProgresso";

// ─── CONFIG ────────────────────────────────────────────────────────────────────

const CAT: Record<CategoriaDesafio, { label: string; emoji: string; cor: string }> = {
  movimento:   { label: "Movimento",   emoji: "🏃", cor: "#10b981" },
  hidratacao:  { label: "Hidratação",  emoji: "💧", cor: "#3b82f6" },
  estudo:      { label: "Estudo",      emoji: "📚", cor: "#8b5cf6" },
  sono:        { label: "Sono",        emoji: "😴", cor: "#6366f1" },
  alimentacao: { label: "Alimentação", emoji: "🥗", cor: "#f59e0b" },
  outro:       { label: "Outro",       emoji: "⭐", cor: "#c9a84c" },
};

const MILESTONES = [
  { dias: 3,  emoji: "🌱", label: "3d"   },
  { dias: 7,  emoji: "⭐", label: "7d"   },
  { dias: 14, emoji: "🏆", label: "14d"  },
  { dias: 21, emoji: "💎", label: "21d"  },
  { dias: 30, emoji: "👑", label: "30d"  },
];

const EMOJIS_FEED = ["👏", "🔥", "💪", "⭐", "🎯"];

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function hoje(): string {
  return new Date().toISOString().split("T")[0];
}

function getDias(ini: string, fim: string): string[] {
  const days: string[] = [];
  const cur = new Date(ini + "T12:00:00");
  const end = new Date(fim + "T12:00:00");
  while (cur <= end) {
    days.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function statusDesafio(d: Desafio, h: string): "andamento" | "proximo" | "encerrado" {
  if (d.dataFim < h) return "encerrado";
  if (d.dataInicio > h) return "proximo";
  return "andamento";
}

function diasRestantes(fim: string, h: string): number {
  const f = new Date(fim + "T12:00:00");
  const hd = new Date(h + "T12:00:00");
  return Math.max(0, Math.round((f.getTime() - hd.getTime()) / 86400000));
}

function diasAteFim(fim: string, ini: string): number {
  const f = new Date(fim + "T12:00:00");
  const i = new Date(ini + "T12:00:00");
  return Math.round((f.getTime() - i.getTime()) / 86400000) + 1;
}

function calcStreak(datas: string[], h: string): number {
  let streak = 0;
  let expected = h;
  const set = new Set(datas);
  if (!set.has(h)) {
    const d = new Date(h + "T12:00:00");
    d.setDate(d.getDate() - 1);
    expected = d.toISOString().split("T")[0];
  }
  while (set.has(expected)) {
    streak++;
    const d = new Date(expected + "T12:00:00");
    d.setDate(d.getDate() - 1);
    expected = d.toISOString().split("T")[0];
  }
  return streak;
}

function calcBestStreak(datas: string[]): number {
  if (!datas.length) return 0;
  const sorted = [...datas].sort();
  let best = 1; let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    const curr = new Date(sorted[i] + "T12:00:00");
    if (Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1) {
      cur++; best = Math.max(best, cur);
    } else { cur = 1; }
  }
  return best;
}

function lunesAtual(): string {
  const h = new Date();
  const dow = h.getDay();
  const d = new Date(h);
  d.setDate(h.getDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().split("T")[0];
}

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function Heatmap({ datas, dataInicio, dataFim, h }: { datas: Set<string>; dataInicio: string; dataFim: string; h: string }) {
  const start = new Date(dataInicio + "T12:00:00");
  const dow = start.getDay();
  const mondayStart = new Date(start);
  mondayStart.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks: string[][] = [];
  let week: string[] = [];
  const cur = new Date(mondayStart);
  const fim = new Date(dataFim + "T12:00:00");

  while (cur <= fim || week.length > 0) {
    const ds = cur.toISOString().split("T")[0];
    week.push(ds);
    if (week.length === 7) { weeks.push([...week]); week = []; }
    cur.setDate(cur.getDate() + 1);
    if (cur > fim && week.length > 0) {
      while (week.length < 7) week.push("");
      weeks.push([...week]); week = [];
      break;
    }
  }

  const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1" style={{ minWidth: "fit-content" }}>
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          <div style={{ height: 14 }} />
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="flex items-center justify-center" style={{ height: 14, width: 12, fontSize: 9, color: "#334155" }}>{l}</div>
          ))}
        </div>
        {weeks.map((w, wi) => {
          const firstDay = w.find((d) => d >= dataInicio) || w[0];
          const showLabel = wi === 0 || new Date(firstDay + "T12:00:00").getDate() <= 7;
          const monthLabel = showLabel && firstDay
            ? new Date(firstDay + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })
            : "";
          return (
            <div key={wi} className="flex flex-col gap-1">
              <div style={{ height: 14, fontSize: 9, color: "#74859c", whiteSpace: "nowrap" }}>{monthLabel}</div>
              {w.map((d, di) => {
                if (!d) return <div key={di} style={{ width: 14, height: 14 }} />;
                const inRange = d >= dataInicio && d <= dataFim;
                const done = datas.has(d);
                const isToday = d === h;
                const isFuture = d > h;
                return (
                  <div
                    key={di}
                    data-tip={d}
                    style={{
                      width: 14, height: 14,
                      borderRadius: 3,
                      background: !inRange ? "transparent" : isFuture ? "#1e335640" : done ? "#10b981" : "#1e3356",
                      border: isToday ? "1.5px solid #c9a84c" : "1px solid transparent",
                      opacity: !inRange ? 0 : 1,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarChart7({ datas, dataInicio, dataFim, h }: { datas: Set<string>; dataInicio: string; dataFim: string; h: string }) {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(h + "T12:00:00");
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  const DAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return (
    <div className="flex items-end gap-1.5" style={{ height: 64 }}>
      {days.map((d) => {
        const inRange = d >= dataInicio && d <= dataFim;
        const done = datas.has(d);
        const isToday = d === h;
        const isFuture = d > h;
        const dow = new Date(d + "T12:00:00").getDay();
        return (
          <div key={d} className="flex flex-col items-center gap-0.5 flex-1">
            <div className="w-full relative" style={{ height: 48, background: "#1e3356", borderRadius: 4 }}>
              {inRange && !isFuture && (
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-b transition-all"
                  style={{
                    height: done ? "100%" : "14%",
                    borderRadius: done ? 4 : "0 0 4px 4px",
                    background: done ? "#10b981" : "#ef444440",
                  }}
                />
              )}
              {isToday && (
                <div className="absolute inset-0 rounded" style={{ border: "1.5px solid #c9a84c" }} />
              )}
            </div>
            <span style={{ fontSize: 9, color: isToday ? "#c9a84c" : "#475569" }}>{DAY[dow]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── FORMS ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  emoji: "🏃",
  titulo: "",
  descricao: "",
  meta: "",
  categoria: "movimento" as CategoriaDesafio,
  dataInicio: hoje(),
  dataFim: "",
};

type FormDesafio = typeof EMPTY_FORM;

function ModalDesafio({
  form, setForm, onSalvar, onFechar, editando,
}: {
  form: FormDesafio;
  setForm: (f: FormDesafio) => void;
  onSalvar: () => void;
  onFechar: () => void;
  editando: boolean;
}) {
  const upd = <K extends keyof FormDesafio>(k: K, v: FormDesafio[K]) => setForm({ ...form, [k]: v });

  const duracao = form.dataInicio && form.dataFim
    ? Math.max(0, Math.round((new Date(form.dataFim + "T12:00:00").getTime() - new Date(form.dataInicio + "T12:00:00").getTime()) / 86400000) + 1)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000090" }} onClick={onFechar}>
      <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto" style={{ background: "#0d1a2e", border: "1px solid #c9a84c30", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-white" style={{ fontSize: 18 }}>{editando ? "Editar Desafio" : "Novo Desafio"}</h2>
          <button onClick={onFechar} style={{ color: "#9aa7ba" }}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {/* Emoji + titulo */}
          <div className="flex gap-3">
            <input
              value={form.emoji}
              onChange={(e) => upd("emoji", e.target.value)}
              className="w-14 h-10 rounded-xl text-center text-2xl outline-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}
              maxLength={2}
            />
            <input
              value={form.titulo}
              onChange={(e) => upd("titulo", e.target.value)}
              placeholder="Nome do desafio"
              className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}
            />
          </div>

          {/* Meta */}
          <input
            value={form.meta}
            onChange={(e) => upd("meta", e.target.value)}
            placeholder="Meta diária (ex: 2L de água, 3km, 30min de leitura)"
            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
            style={{ background: "#1e3356", border: "1px solid #334155" }}
          />

          {/* Descricao */}
          <textarea
            value={form.descricao}
            onChange={(e) => upd("descricao", e.target.value)}
            placeholder="Descrição opcional..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
            style={{ background: "#1e3356", border: "1px solid #334155" }}
          />

          {/* Categoria */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#9aa7ba" }}>Categoria</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CAT) as [CategoriaDesafio, typeof CAT[CategoriaDesafio]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => upd("categoria", key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: form.categoria === key ? `${cfg.cor}25` : "#1e3356",
                    border: `1px solid ${form.categoria === key ? cfg.cor : "#334155"}`,
                    color: form.categoria === key ? cfg.cor : "#64748b",
                  }}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "#9aa7ba" }}>Início</p>
              <input
                type="date"
                value={form.dataInicio}
                onChange={(e) => upd("dataInicio", e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "#1e3356", border: "1px solid #334155", colorScheme: "dark" }}
              />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "#9aa7ba" }}>Fim</p>
              <input
                type="date"
                value={form.dataFim}
                onChange={(e) => upd("dataFim", e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "#1e3356", border: "1px solid #334155", colorScheme: "dark" }}
              />
            </div>
          </div>

          {duracao > 0 && (
            <p className="text-xs text-center" style={{ color: "#c9a84c" }}>
              Desafio de <strong>{duracao} dias</strong> — {duracao <= 7 ? "Tiro curto ⚡" : duracao <= 14 ? "Sprint 🏃" : duracao <= 21 ? "Formação de hábito 💪" : "Hábito sólido 👑"}
            </p>
          )}
        </div>

        <button
          onClick={onSalvar}
          disabled={!form.titulo || !form.meta || !form.dataInicio || !form.dataFim}
          className="w-full mt-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "#c9a84c", color: "#0b1624" }}
        >
          {editando ? "Salvar alterações" : "Criar Desafio"}
        </button>
      </div>
    </div>
  );
}

// ─── DETAIL VIEW ───────────────────────────────────────────────────────────────

function DetalheDesafio({
  desafio,
  checkIns,
  colaboradores,
  userId,
}: {
  desafio: Desafio;
  checkIns: CheckInDesafio[];
  colaboradores: Colaborador[];
  userId: string;
}) {
  const h = hoje();
  const meusCIs = checkIns.filter((ci) => ci.colaboradorId === userId && ci.desafioId === desafio.id).map((ci) => ci.data);
  const meuSet = new Set(meusCIs);
  const streak = calcStreak(meusCIs, h);
  const best = calcBestStreak(meusCIs);

  // Leaderboard
  const lunes = lunesAtual();
  const ranking = colaboradores
    .map((c) => {
      const total = checkIns.filter((ci) => ci.desafioId === desafio.id && ci.colaboradorId === c.id).length;
      const semana = checkIns.filter((ci) => ci.desafioId === desafio.id && ci.colaboradorId === c.id && ci.data >= lunes).length;
      return { c, total, semana };
    })
    .sort((a, b) => b.total - a.total)
    .filter((r) => r.total > 0);

  // Total possible days so far
  const todayOrFim = h > desafio.dataFim ? desafio.dataFim : h;
  const totalPossivel = getDias(desafio.dataInicio, todayOrFim).length;

  return (
    <div className="mt-4 space-y-5 pt-4" style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>
      {/* My stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ background: "#1e335640" }}>
          <p className="text-xs mb-1" style={{ color: "#9aa7ba" }}>Check-ins</p>
          <p className="font-black text-white text-lg">{meusCIs.length}<span className="text-xs font-normal" style={{ color: "#74859c" }}>/{totalPossivel}</span></p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "#1e335640" }}>
          <p className="text-xs mb-1" style={{ color: "#9aa7ba" }}>Streak atual</p>
          <p className="font-black text-lg" style={{ color: streak > 0 ? "#f59e0b" : "#334155" }}>
            {streak > 0 ? "🔥" : "💤"} {streak}d
          </p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "#1e335640" }}>
          <p className="text-xs mb-1" style={{ color: "#9aa7ba" }}>Melhor streak</p>
          <p className="font-black text-lg" style={{ color: "#c9a84c" }}>🏅 {best}d</p>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#74859c" }}>Conquistas</p>
        <div className="flex gap-2 flex-wrap">
          {MILESTONES.map((m) => {
            const unlocked = best >= m.dias;
            return (
              <div
                key={m.dias}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: unlocked ? "#c9a84c20" : "#1e3356",
                  border: `1px solid ${unlocked ? "#c9a84c40" : "#334155"}`,
                  color: unlocked ? "#c9a84c" : "#334155",
                  opacity: unlocked ? 1 : 0.6,
                }}
              >
                {m.emoji} {m.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#74859c" }}>Calendário do Desafio</p>
        <Heatmap datas={meuSet} dataInicio={desafio.dataInicio} dataFim={desafio.dataFim} h={h} />
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1"><div style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981" }} /><span className="text-xs" style={{ color: "#74859c" }}>Feito</span></div>
          <div className="flex items-center gap-1"><div style={{ width: 10, height: 10, borderRadius: 2, background: "#1e3356" }} /><span className="text-xs" style={{ color: "#74859c" }}>Não feito</span></div>
          <div className="flex items-center gap-1"><div style={{ width: 10, height: 10, borderRadius: 2, background: "#1e335640", border: "1px dashed #334155" }} /><span className="text-xs" style={{ color: "#74859c" }}>Futuro</span></div>
        </div>
      </div>

      {/* Bar chart 7 dias */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#74859c" }}>Últimos 7 dias</p>
        <BarChart7 datas={meuSet} dataInicio={desafio.dataInicio} dataFim={desafio.dataFim} h={h} />
      </div>

      {/* Leaderboard */}
      {ranking.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#74859c" }}>Ranking do Desafio</p>
          <div className="space-y-1.5">
            {ranking.slice(0, 5).map((r, i) => (
              <div key={r.c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: i === 0 ? "#c9a84c12" : "#1e335430", border: i === 0 ? "1px solid #c9a84c25" : "1px solid transparent" }}>
                <span className="text-sm w-5 text-center font-black" style={{ color: i === 0 ? "#c9a84c" : i === 1 ? "#94a3b8" : i === 2 ? "#f59e0b80" : "#475569" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <Avatar nome={r.c.nome} avatar={r.c.avatar} foto={r.c.foto} cor={r.c.cor} size={24} />
                <span className="flex-1 text-sm text-white truncate">{r.c.nome.split(" ")[0]}</span>
                <span className="text-xs font-bold" style={{ color: "#c9a84c" }}>{r.total} check-ins</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function DesafiosPage() {
  const { usuarioAtual, colaboradores, desafios, checkInsDesafio, criarDesafio, editarDesafio, deletarDesafio, fazerCheckIn, desfazerCheckIn, reagirCheckIn } = useAppStore();

  const h = hoje();
  const isAdmin = usuarioAtual?.nivelAcesso === "admin";
  const userId = usuarioAtual?.id || "";

  const [filtro, setFiltro] = useState<"andamento" | "proximo" | "encerrado" | "todos">("andamento");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormDesafio>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showFeed, setShowFeed] = useState(true);

  const lunes = lunesAtual();

  // Filtered challenges
  const desafiosFiltrados = useMemo(() => {
    return desafios.filter((d) => {
      if (!d.ativo && !isAdmin) return false;
      const s = statusDesafio(d, h);
      if (filtro === "todos") return true;
      return s === filtro;
    });
  }, [desafios, filtro, h, isAdmin]);

  // My global stats
  const meusCheckInsTotal = checkInsDesafio.filter((ci) => ci.colaboradorId === userId).length;
  const meusCheckInsSemana = checkInsDesafio.filter((ci) => ci.colaboradorId === userId && ci.data >= lunes).length;

  // Best streak across all challenges
  const meuMelhorStreak = useMemo(() => {
    const por = desafios.map((d) => {
      const datas = checkInsDesafio.filter((ci) => ci.colaboradorId === userId && ci.desafioId === d.id).map((ci) => ci.data);
      return calcStreak(datas, h);
    });
    return Math.max(0, ...por);
  }, [desafios, checkInsDesafio, userId, h]);

  // Team check-ins today across active challenges
  const checkInsHoje = checkInsDesafio.filter((ci) => ci.data === h);
  const membrosComCheckInHoje = new Set(checkInsHoje.map((ci) => ci.colaboradorId)).size;

  // Feed recente (last 48h by date)
  const ontem = (() => {
    const d = new Date(h + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const feedRecente = useMemo(() =>
    [...checkInsDesafio]
      .filter((ci) => ci.data >= ontem)
      .sort((a, b) => {
        if (b.data !== a.data) return b.data.localeCompare(a.data);
        return b.hora.localeCompare(a.hora);
      })
      .slice(0, 30)
  , [checkInsDesafio, ontem]);

  // Weekly leaderboard
  const rankingSemana = useMemo(() =>
    colaboradores
      .map((c) => ({
        c,
        n: checkInsDesafio.filter((ci) => ci.colaboradorId === c.id && ci.data >= lunes).length,
      }))
      .sort((a, b) => b.n - a.n)
      .filter((r) => r.n > 0)
  , [colaboradores, checkInsDesafio, lunes]);

  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...EMPTY_FORM, dataInicio: h });
    setModalAberto(true);
  }

  function abrirEditar(d: Desafio) {
    setEditandoId(d.id);
    setForm({ emoji: d.emoji, titulo: d.titulo, descricao: d.descricao, meta: d.meta, categoria: d.categoria, dataInicio: d.dataInicio, dataFim: d.dataFim });
    setModalAberto(true);
  }

  function handleSalvar() {
    if (!form.titulo || !form.meta || !form.dataInicio || !form.dataFim) return;
    if (editandoId) {
      editarDesafio(editandoId, form);
    } else {
      criarDesafio(form);
    }
    setModalAberto(false);
    setEditandoId(null);
    setForm(EMPTY_FORM);
  }

  const FILTROS: { key: typeof filtro; label: string; cor: string; dica: string }[] = [
    { key: "andamento", label: "Em andamento", cor: "#10b981", dica: "Desafios acontecendo agora (entre a data de início e fim)" },
    { key: "proximo", label: "Próximos", cor: "#3b82f6", dica: "Desafios que ainda vão começar" },
    { key: "encerrado", label: "Encerrados", cor: "#64748b", dica: "Desafios que já terminaram" },
    { key: "todos", label: "Todos", cor: "#c9a84c", dica: "Mostrar todos os desafios" },
  ];

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BackButton />
            <h1 className="text-2xl font-black text-white" style={{ letterSpacing: "-0.02em" }}>Desafios do Time 🏆</h1>
          </div>
          <p className="text-sm" style={{ color: "#9aa7ba" }}>Desafios com data de início e fim — tiro curto ou formação de hábito</p>
        </div>
        {isAdmin && (
          <button
            onClick={abrirNovo}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#c9a84c", color: "#0b1624" }}
          >
            <Plus size={16} /> Novo Desafio
          </button>
        )}
      </div>

      {/* Meu progresso — gamificação (movido do Meu Dia) */}
      <MeuProgresso />

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} data-tip="Quantos check-ins você fez nos desafios esta semana">
          <p className="text-xs mb-1" style={{ color: "#9aa7ba" }}>Minha semana</p>
          <p className="text-2xl font-black text-white">{meusCheckInsSemana}</p>
          <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>check-ins</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} data-tip="Sua maior sequência de dias seguidos fazendo check-in num desafio">
          <p className="text-xs mb-1" style={{ color: "#9aa7ba" }}>Streak ativo</p>
          <p className="text-2xl font-black" style={{ color: meuMelhorStreak > 0 ? "#f59e0b" : "#334155" }}>
            {meuMelhorStreak > 0 ? "🔥" : "💤"} {meuMelhorStreak}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>dias seguidos</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }} data-tip="Quantos membros do time já fizeram check-in hoje">
          <p className="text-xs mb-1" style={{ color: "#9aa7ba" }}>Time hoje</p>
          <p className="text-2xl font-black text-white">{membrosComCheckInHoje}</p>
          <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>/ {colaboradores.length} membros</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => {
          const count = desafios.filter((d) => {
            if (!d.ativo && !isAdmin) return false;
            if (f.key === "todos") return true;
            return statusDesafio(d, h) === f.key;
          }).length;
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              data-tip={f.dica}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: filtro === f.key ? `${f.cor}20` : "#112239",
                border: `1px solid ${filtro === f.key ? f.cor : "#1e3356"}`,
                color: filtro === f.key ? f.cor : "#64748b",
              }}
            >
              {f.label}
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: filtro === f.key ? `${f.cor}30` : "#1e3356", color: filtro === f.key ? f.cor : "#475569" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Challenge cards */}
      {desafiosFiltrados.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#112239", border: "1px dashed #1e3356" }}>
          <p className="text-4xl mb-3">🏁</p>
          <p className="font-bold text-white mb-1">Nenhum desafio aqui</p>
          <p className="text-sm" style={{ color: "#74859c" }}>
            {filtro === "andamento" ? "Nenhum desafio ativo no momento." : `Sem desafios ${filtro === "proximo" ? "futuros" : filtro === "encerrado" ? "encerrados" : ""} ainda.`}
          </p>
          {isAdmin && (
            <button onClick={abrirNovo} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "#c9a84c", color: "#0b1624" }}>
              + Criar desafio
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {desafiosFiltrados.map((desafio) => {
            const status = statusDesafio(desafio, h);
            const catCfg = CAT[desafio.categoria];
            const dr = diasRestantes(desafio.dataFim, h);
            const duracao = diasAteFim(desafio.dataFim, desafio.dataInicio);
            const isSelected = selectedId === desafio.id;

            const meusCIs = checkInsDesafio.filter((ci) => ci.desafioId === desafio.id && ci.colaboradorId === userId);
            const fezHoje = meusCIs.some((ci) => ci.data === h);
            const meuStreak = calcStreak(meusCIs.map((ci) => ci.data), h);

            const teamHoje = checkInsDesafio.filter((ci) => ci.desafioId === desafio.id && ci.data === h);
            const membrosHoje = teamHoje.map((ci) => colaboradores.find((c) => c.id === ci.colaboradorId)).filter(Boolean);
            const pctTime = colaboradores.length > 0 ? Math.round((new Set(teamHoje.map((ci) => ci.colaboradorId)).size / colaboradores.length) * 100) : 0;

            const STATUS_LABEL: Record<string, { label: string; cor: string; bg: string }> = {
              andamento: { label: "Em andamento", cor: "#10b981", bg: "#10b98120" },
              proximo:   { label: "Próximo",       cor: "#3b82f6", bg: "#3b82f620" },
              encerrado: { label: "Encerrado",     cor: "#64748b", bg: "#64748b20" },
            };
            const sl = STATUS_LABEL[status];

            return (
              <div
                key={desafio.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#112239",
                  border: `1px solid ${isSelected ? catCfg.cor + "50" : "#1e3356"}`,
                  opacity: !desafio.ativo ? 0.6 : 1,
                }}
              >
                {/* Card main */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Emoji */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ background: `${catCfg.cor}15` }}>
                      {desafio.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-black text-white" style={{ fontSize: 16 }}>{desafio.titulo}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: sl.bg, color: sl.cor }}>{sl.label}</span>
                        {!desafio.ativo && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#334155", color: "#9aa7ba" }}>Inativo</span>}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: catCfg.cor }}>
                          {catCfg.emoji} {catCfg.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#9aa7ba" }}>
                          <Target size={11} /> {desafio.meta}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#9aa7ba" }}>
                          <Calendar size={11} /> {duracao}d
                          {status === "andamento" && ` · ${dr}d restantes`}
                          {status === "proximo" && ` · começa em ${Math.abs(diasRestantes(desafio.dataInicio, h))}d`}
                        </span>
                      </div>

                      {desafio.descricao && (
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "#74859c" }}>{desafio.descricao}</p>
                      )}
                    </div>

                    {/* Admin actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => abrirEditar(desafio)} className="p-1.5 rounded-lg hover:opacity-80 transition-opacity" style={{ color: "#74859c" }}>
                          <Pencil size={14} />
                        </button>
                        {confirmDelete === desafio.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => { deletarDesafio(desafio.id); setConfirmDelete(null); if (selectedId === desafio.id) setSelectedId(null); }} className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>
                              Sim
                            </button>
                            <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 rounded-lg text-xs" style={{ color: "#9aa7ba" }}>
                              Não
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(desafio.id)} className="p-1.5 rounded-lg hover:opacity-80 transition-opacity" style={{ color: "#74859c" }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Team progress */}
                  {status === "andamento" && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: "#9aa7ba" }}>
                          <Users size={11} className="inline mr-1" />
                          {new Set(teamHoje.map((ci) => ci.colaboradorId)).size}/{colaboradores.length} hoje
                        </span>
                        <span className="text-xs font-semibold" style={{ color: pctTime >= 80 ? "#10b981" : pctTime >= 50 ? "#f59e0b" : "#94a3b8" }}>{pctTime}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pctTime}%`, background: pctTime >= 80 ? "#10b981" : pctTime >= 50 ? "#f59e0b" : "#3b82f6" }} />
                      </div>
                      {membrosHoje.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {membrosHoje.slice(0, 8).map((c) => c && (
                            <div key={c.id} data-tip={c.nome} style={{ opacity: 0.9 }}>
                              <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={20} />
                            </div>
                          ))}
                          {membrosHoje.length > 8 && (
                            <span className="text-xs" style={{ color: "#74859c" }}>+{membrosHoje.length - 8}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom row: streak + check-in button */}
                  <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid rgba(201,164,66,.16)" }}>
                    <div className="flex items-center gap-3">
                      {meuStreak > 0 && (
                        <span className="flex items-center gap-1 text-sm font-bold" style={{ color: "#f59e0b" }}>
                          <Flame size={14} /> {meuStreak} dias
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "#74859c" }}>
                        {meusCIs.length} check-in{meusCIs.length !== 1 ? "s" : ""} meus
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Expand detail */}
                      <button
                        onClick={() => setSelectedId(isSelected ? null : desafio.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all hover:opacity-80"
                        style={{ background: "#1e3356", color: "#9aa7ba" }}
                      >
                        {isSelected ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        Detalhes
                      </button>

                      {/* Check-in button */}
                      {status === "andamento" && (
                        fezHoje ? (
                          <button
                            onClick={() => desfazerCheckIn(desafio.id, h)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                            style={{ background: "#10b98125", color: "#10b981", border: "1px solid #10b98140" }}
                          >
                            <CheckCircle2 size={14} /> Feito hoje!
                          </button>
                        ) : (
                          <button
                            onClick={() => fazerCheckIn(desafio.id, h)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                            style={{ background: "#c9a84c", color: "#0b1624" }}
                          >
                            <Check size={14} /> Check-in
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Detail panel */}
                {isSelected && (
                  <div className="px-5 pb-5">
                    <DetalheDesafio desafio={desafio} checkIns={checkInsDesafio} colaboradores={colaboradores} userId={userId} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly ranking + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly ranking */}
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} style={{ color: "#c9a84c" }} />
            <p className="text-sm font-bold text-white">Ranking da Semana</p>
            <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: "#3b82f615", color: "#3b82f6", border: "1px solid #3b82f620" }}>
              reseta segunda
            </span>
          </div>
          {rankingSemana.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#74859c" }}>Nenhum check-in esta semana ainda</p>
          ) : (
            <div className="space-y-2">
              {rankingSemana.slice(0, 5).map((r, i) => (
                <div key={r.c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: i === 0 ? "#c9a84c10" : "#1e335430" }}>
                  <span className="text-sm w-5 text-center font-bold" style={{ color: i === 0 ? "#c9a84c" : "#475569" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                  </span>
                  <Avatar nome={r.c.nome} avatar={r.c.avatar} foto={r.c.foto} cor={r.c.cor} size={28} />
                  <span className="flex-1 text-sm text-white truncate">{r.c.nome.split(" ")[0]}</span>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(r.n, 7) }).map((_, j) => (
                        <div key={j} style={{ width: 6, height: 6, borderRadius: 2, background: "#10b981" }} />
                      ))}
                    </div>
                    <span className="text-xs font-bold ml-1" style={{ color: "#10b981" }}>{r.n}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feed */}
        <div className="rounded-2xl p-5" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>📡</span>
              <p className="text-sm font-bold text-white">Feed do Time</p>
            </div>
            <button onClick={() => setShowFeed((v) => !v)} style={{ color: "#74859c" }}>
              {showFeed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          {showFeed && (
            feedRecente.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "#74859c" }}>Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {feedRecente.map((ci) => {
                  const colab = colaboradores.find((c) => c.id === ci.colaboradorId);
                  const desafio = desafios.find((d) => d.id === ci.desafioId);
                  if (!colab || !desafio) return null;
                  const isHoje = ci.data === h;
                  return (
                    <div key={ci.id} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: "#1e335430" }}>
                      <Avatar nome={colab.nome} avatar={colab.avatar} foto={colab.foto} cor={colab.cor} size={28} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug">
                          <span className="font-bold text-white">{colab.nome.split(" ")[0]}</span>
                          <span style={{ color: "#9aa7ba" }}> completou </span>
                          <span className="font-semibold" style={{ color: "#c9a84c" }}>{desafio.emoji} {desafio.titulo}</span>
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>{isHoje ? `hoje · ${ci.hora}` : "ontem"}</p>
                        {ci.nota && <p className="text-xs mt-1 italic" style={{ color: "#9aa7ba" }}>&ldquo;{ci.nota}&rdquo;</p>}
                        {/* Reactions */}
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {EMOJIS_FEED.map((emoji) => {
                            const count = ci.reacoes.filter((r) => r.emoji === emoji).length;
                            const myReacao = ci.reacoes.some((r) => r.colaboradorId === userId && r.emoji === emoji);
                            return count > 0 || true ? (
                              <button
                                key={emoji}
                                onClick={() => reagirCheckIn(ci.id, emoji)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-xs transition-all hover:opacity-80"
                                style={{
                                  background: myReacao ? "#c9a84c20" : "#1e3356",
                                  border: `1px solid ${myReacao ? "#c9a84c40" : "#334155"}`,
                                  color: myReacao ? "#c9a84c" : "#475569",
                                }}
                              >
                                {emoji}{count > 0 && <span className="font-bold">{count}</span>}
                              </button>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalDesafio
          form={form}
          setForm={setForm}
          onSalvar={handleSalvar}
          onFechar={() => { setModalAberto(false); setEditandoId(null); }}
          editando={!!editandoId}
        />
      )}
    </div>
  );
}
