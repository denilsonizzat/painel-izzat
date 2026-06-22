"use client";
import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { LOJAS } from "@/lib/data";
import BackButton from "@/components/BackButton";
import { listarPaises, seedPaises, PrecPais } from "@/lib/precificacao";
import { TZ_PAIS, TZ_BR, datasDoPais, horaEm, dataEm, meiaNoiteAlvoEmBR } from "@/lib/ferramentas";
import { CalendarDays, Clock, Wrench } from "lucide-react";

const inp = { background: "#1e3356", border: "1px solid #334155", color: "#e8edf5", borderRadius: 9, padding: "8px 10px", outline: "none", fontSize: 13 } as React.CSSProperties;

export default function FerramentasPage() {
  const { lojasCustom } = useAppStore();
  const todasLojas = [...LOJAS, ...lojasCustom];
  const [lojaId, setLojaId] = useState(todasLojas[0]?.id || "");
  const [paises, setPaises] = useState<PrecPais[]>([]);
  const [aba, setAba] = useState<"calendario" | "fuso">("calendario");

  useEffect(() => {
    if (!lojaId) return;
    listarPaises(lojaId).then(async (ps) => {
      if (ps.length === 0) { await seedPaises(lojaId); setPaises(await listarPaises(lojaId)); }
      else setPaises(ps);
    }).catch(() => {});
  }, [lojaId]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <BackButton href="/dashboard" />
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Wrench size={22} style={{ color: "#c9a84c" }} /> Ferramentas</h1>
        <p className="text-sm mt-0.5" style={{ color: "#9aa7ba" }}>Calendário de datas e fuso horário por mercado. A calculadora é o botão flutuante 🧮 (segue você entre as páginas).</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs" style={{ color: "#74859c" }}>Loja (fonte dos mercados):</span>
        <select value={lojaId} onChange={(e) => setLojaId(e.target.value)} style={{ ...inp, width: "auto" }}>
          {todasLojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#0f1c30", border: "1px solid #1e3356", maxWidth: 360 }}>
        {([["calendario", "Calendário", CalendarDays], ["fuso", "Fuso horário", Clock]] as const).map(([id, lbl, Ic]) => (
          <button key={id} onClick={() => setAba(id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold" style={{ background: aba === id ? "#c9a84c" : "transparent", color: aba === id ? "#0b1624" : "#94a3b8" }}><Ic size={13} /> {lbl}</button>
        ))}
      </div>

      {aba === "calendario" ? <Calendario paises={paises} /> : <Fuso paises={paises} />}
    </div>
  );
}

function TierPaisSelector({ paises, paisCod, setPaisCod }: { paises: PrecPais[]; paisCod: string; setPaisCod: (c: string) => void }) {
  const tiers = useMemo(() => Array.from(new Set(paises.map((p) => p.tier))).sort(), [paises]);
  const [tier, setTier] = useState(tiers[0] || "A");
  useEffect(() => { if (tiers.length && !tiers.includes(tier)) setTier(tiers[0]); }, [tiers]);
  const doTier = paises.filter((p) => p.tier === tier);
  useEffect(() => { if (doTier.length && !doTier.some((p) => p.cod === paisCod)) setPaisCod(doTier[0].cod); }, [tier, paises]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs" style={{ color: "#74859c" }}>Tier:</span>
      <div className="flex gap-1">
        {tiers.map((t) => (
          <button key={t} onClick={() => setTier(t)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: tier === t ? "#3b82f622" : "#122039", color: tier === t ? "#4d9de0" : "#94a3b8", border: `1px solid ${tier === t ? "#4d9de0" : "#1e3356"}` }}>Tier {t}</button>
        ))}
      </div>
      <span className="text-xs ml-2" style={{ color: "#74859c" }}>País:</span>
      <select value={paisCod} onChange={(e) => setPaisCod(e.target.value)} style={{ ...inp, width: "auto" }}>
        {doTier.map((p) => <option key={p.cod} value={p.cod}>{p.nome}</option>)}
      </select>
    </div>
  );
}

function Calendario({ paises }: { paises: PrecPais[] }) {
  const [paisCod, setPaisCod] = useState("");
  if (paises.length === 0) return <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Carregando mercados...</div>;
  const datas = paisCod ? datasDoPais(paisCod) : [];
  const pais = paises.find((p) => p.cod === paisCod);
  return (
    <div className="space-y-4">
      <TierPaisSelector paises={paises} paisCod={paisCod} setPaisCod={setPaisCod} />
      <div className="rounded-2xl overflow-hidden" style={{ background: "#122039", border: "1px solid #1e3356" }}>
        <div className="p-3 text-sm font-bold text-white">Datas e-commerce — {pais?.nome || "—"}</div>
        <div className="divide-y" style={{ borderColor: "#1e3356" }}>
          {datas.map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i ? "1px solid #1e3356" : "none" }}>
              <span className="text-xs font-bold tabular-nums px-2 py-1 rounded-lg" style={{ background: "#0b1624", color: "#e8c462", minWidth: 56, textAlign: "center" }}>{d.md.slice(3)}/{d.md.slice(0, 2)}</span>
              <span className="text-sm flex-1" style={{ color: "#e8edf5" }}>{d.nome}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: d.tipo === "global" ? "#c9a84c20" : "#3b82f620", color: d.tipo === "global" ? "#c9a84c" : "#4d9de0" }}>{d.tipo === "global" ? "global" : "local"}</span>
              {d.movel && <span className="text-xs" style={{ color: "#74859c" }} title="data muda a cada ano">~</span>}
            </div>
          ))}
        </div>
        <p className="p-3 text-xs" style={{ color: "#74859c" }}>~ = data móvel (muda a cada ano, valor aproximado). Datas globais valem pra todo mercado.</p>
      </div>
    </div>
  );
}

function Fuso({ paises }: { paises: PrecPais[] }) {
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((n) => n + 1), 30000); return () => clearInterval(t); }, []);
  const [paisCod, setPaisCod] = useState("");
  if (paises.length === 0) return <div className="rounded-2xl p-8 text-center" style={{ background: "#122039", color: "#74859c" }}>Carregando mercados...</div>;
  const comTz = paises.filter((p) => TZ_PAIS[p.cod]);
  const tzAlvo = TZ_PAIS[paisCod];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#14243f,#111e35)", border: "1px solid #1e3356" }}>
        <p className="text-xs" style={{ color: "#9aa7ba" }}>Agora no Brasil</p>
        <p className="text-3xl font-extrabold num-gold">{horaEm(TZ_BR)}</p>
        <p className="text-xs" style={{ color: "#74859c" }}>{dataEm(TZ_BR)}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#74859c" }}>Relógio mundial (mercados da loja)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {comTz.map((p) => (
            <div key={p.cod} className="rounded-xl p-3" style={{ background: "#122039", border: "1px solid #1e3356" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{p.nome}</span>
                <span className="text-xs px-1.5 rounded" style={{ background: p.tier === "A" ? "#3b82f620" : "#74859c20", color: p.tier === "A" ? "#4d9de0" : "#94a3b8" }}>{p.tier}</span>
              </div>
              <p className="text-xl font-extrabold tabular-nums mt-1" style={{ color: "#e8edf5" }}>{horaEm(TZ_PAIS[p.cod])}</p>
              <p className="text-xs" style={{ color: "#74859c" }}>{dataEm(TZ_PAIS[p.cod])}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "#122039", border: "1px solid #c9a84c30" }}>
        <p className="text-sm font-bold text-white mb-1">Campanha à meia-noite local</p>
        <p className="text-xs mb-3" style={{ color: "#74859c" }}>Pra programar o anúncio começando 00:00 no país-alvo (rodar 24h), veja que horas é no Brasil.</p>
        <TierPaisSelector paises={comTz} paisCod={paisCod} setPaisCod={setPaisCod} />
        {tzAlvo && (
          <div className="mt-3 rounded-xl p-4 flex items-center justify-between" style={{ background: "#0b1624" }}>
            <div>
              <p className="text-xs" style={{ color: "#74859c" }}>00:00 em {paises.find((p) => p.cod === paisCod)?.nome}</p>
              <p className="text-xs" style={{ color: "#74859c" }}>= programe no Brasil às</p>
            </div>
            <p className="text-3xl font-extrabold num-gold tabular-nums">{meiaNoiteAlvoEmBR(tzAlvo)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
