"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface LocalInfo { cidade: string; estado: string; lat: number; lon: number; bairro?: string }
interface ClimaInfo { temperatura: number; codigo: number }

function climaDesc(c: number) {
  if (c === 0) return "Ceu limpo";
  if (c === 1) return "Principalmente limpo";
  if (c === 2) return "Parcialmente nublado";
  if (c === 3) return "Nublado";
  if (c <= 48) return "Neblina";
  if (c <= 55) return "Garoa";
  if (c <= 65) return "Chuva";
  if (c <= 77) return "Neve";
  if (c <= 82) return "Pancadas de chuva";
  if (c <= 86) return "Neve forte";
  return "Tempestade";
}

/* ── Animated weather icons ─────────────────────────────────────────────── */

function SunIcon() {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" overflow="visible">
      <g style={{ transformOrigin: "22px 22px", animation: "spin 12s linear infinite" }}>
        {rays.map((a) => {
          const r = a * Math.PI / 180;
          const x1 = 22 + 14 * Math.cos(r), y1 = 22 + 14 * Math.sin(r);
          const x2 = 22 + 19 * Math.cos(r), y2 = 22 + 19 * Math.sin(r);
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />;
        })}
      </g>
      <circle cx="22" cy="22" r="9" fill="#fde68a">
        <animate attributeName="r" values="8.5;9.5;8.5" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="22" cy="22" r="6.5" fill="#fbbf24" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function PartlyCloudyIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {/* mini sun behind cloud */}
      <circle cx="14" cy="16" r="7" fill="#fde68a" opacity="0.9">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* cloud */}
      <g style={{ animation: "cloudFloat 5s ease-in-out infinite" }}>
        <ellipse cx="26" cy="26" rx="12" ry="7" fill="#64748b" />
        <ellipse cx="20" cy="29" rx="6" ry="5" fill="#64748b" />
        <ellipse cx="32" cy="28" rx="5.5" ry="4.5" fill="#64748b" />
        <rect x="17" y="27" width="18" height="6" fill="#64748b" />
      </g>
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <g style={{ animation: "cloudFloat 5s ease-in-out infinite" }}>
        <ellipse cx="22" cy="18" rx="13" ry="8" fill="#475569" />
        <ellipse cx="15" cy="22" rx="7" ry="5.5" fill="#475569" />
        <ellipse cx="29" cy="21" rx="6" ry="5" fill="#475569" />
        <rect x="12" y="21" width="20" height="7" fill="#475569" />
      </g>
    </svg>
  );
}

function FogIcon() {
  const lines = [
    { y: 18, w: 22, x: 11 },
    { y: 23, w: 18, x: 13 },
    { y: 28, w: 22, x: 11 },
  ];
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {lines.map((l, i) => (
        <rect key={i} x={l.x} y={l.y} width={l.w} height="2.5" rx="1.25" fill="#475569"
          style={{ animation: `fogDrift ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
      ))}
    </svg>
  );
}

function RainIcon({ heavy = false }: { heavy?: boolean }) {
  const drops = heavy ? [12, 18, 24, 30] : [14, 21, 28];
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <g style={{ animation: "cloudFloat 5s ease-in-out infinite" }}>
        <ellipse cx="22" cy="17" rx="12" ry="7" fill="#475569" />
        <ellipse cx="15" cy="21" rx="6.5" ry="5" fill="#475569" />
        <ellipse cx="29" cy="20" rx="6" ry="4.5" fill="#475569" />
        <rect x="12" y="20" width="20" height="5" fill="#475569" />
      </g>
      {drops.map((x, i) => (
        <line key={i} x1={x} y1="28" x2={x - 2} y2="36" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0">
          <animate attributeName="y1" values="27;35" dur="1s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
          <animate attributeName="y2" values="35;43" dur="1s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.15;0.8;1" dur="1s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  );
}

function SnowIcon() {
  const flakes = [14, 21, 28];
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <g style={{ animation: "cloudFloat 5s ease-in-out infinite" }}>
        <ellipse cx="22" cy="17" rx="12" ry="7" fill="#475569" />
        <ellipse cx="15" cy="21" rx="6.5" ry="5" fill="#475569" />
        <ellipse cx="29" cy="20" rx="6" ry="4.5" fill="#475569" />
        <rect x="12" y="20" width="20" height="5" fill="#475569" />
      </g>
      {flakes.map((x, i) => (
        <g key={i} opacity="0">
          <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.2;0.8;1" dur="1.4s" begin={`${i * 0.45}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values={`0,0;0,10`} dur="1.4s" begin={`${i * 0.45}s`} repeatCount="indefinite" />
          <circle cx={x} cy="29" r="2.2" fill="#e0f2fe" />
          <line x1={x} y1="26.5" x2={x} y2="31.5" stroke="#bae6fd" strokeWidth="1.2" />
          <line x1={x - 2.5} y1="29" x2={x + 2.5} y2="29" stroke="#bae6fd" strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  );
}

function ThunderIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <g style={{ animation: "cloudFloat 5s ease-in-out infinite" }}>
        <ellipse cx="22" cy="15" rx="12" ry="7" fill="#374151" />
        <ellipse cx="15" cy="19" rx="6.5" ry="5" fill="#374151" />
        <ellipse cx="29" cy="18" rx="6" ry="4.5" fill="#374151" />
        <rect x="12" y="18" width="20" height="5" fill="#374151" />
      </g>
      {/* lightning bolt */}
      <path d="M24 25 L19 33 L23 33 L18 42 L28 30 L23 30 Z" fill="#fbbf24">
        <animate attributeName="opacity" values="0;0;1;1;0;0;1;0" keyTimes="0;0.3;0.32;0.36;0.38;0.6;0.62;1" dur="3s" repeatCount="indefinite" />
      </path>
      {/* rain drops */}
      {[13, 22, 31].map((x, i) => (
        <line key={i} x1={x} y1="26" x2={x - 2} y2="33" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" opacity="0">
          <animate attributeName="y1" values="25;33" dur="1.1s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
          <animate attributeName="y2" values="32;40" dur="1.1s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.15;0.8;1" dur="1.1s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  );
}

function WeatherIcon({ code }: { code: number }) {
  if (code === 0) return <SunIcon />;
  if (code <= 2) return <PartlyCloudyIcon />;
  if (code === 3) return <CloudIcon />;
  if (code <= 48) return <FogIcon />;
  if (code <= 67) return <RainIcon />;
  if (code <= 77) return <SnowIcon />;
  if (code <= 82) return <RainIcon heavy />;
  if (code <= 86) return <SnowIcon />;
  return <ThunderIcon />;
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function RelogioWidget() {
  const [agora, setAgora] = useState<Date | null>(null);
  const [local, setLocal] = useState<LocalInfo | null>(null);
  const [clima, setClima] = useState<ClimaInfo | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setAgora(new Date());
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => {
        if (!d.city) return;
        const lat = parseFloat(d.latitude);
        const lon = parseFloat(d.longitude);
        const info: LocalInfo = { cidade: d.city, estado: d.region_code ?? d.region, lat, lon };
        setLocal(info);
        setCarregando(false);

        // neighborhood via Nominatim reverse geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR`, {
          headers: { "User-Agent": "painel-izzat/1.0" },
        })
          .then((r) => r.json())
          .then((nd) => {
            const b = nd?.address?.suburb ?? nd?.address?.neighbourhood ?? nd?.address?.city_district ?? nd?.address?.quarter;
            if (b) setLocal((prev) => prev ? { ...prev, bairro: b } : prev);
          })
          .catch(() => null);

        // weather
        return fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
        );
      })
      .then((r) => r?.json())
      .then((d) => {
        if (d?.current) setClima({ temperatura: Math.round(d.current.temperature_2m), codigo: d.current.weather_code });
      })
      .catch(() => setCarregando(false));
  }, []);

  if (!agora) return null;

  const hh = agora.getHours().toString().padStart(2, "0");
  const mm = agora.getMinutes().toString().padStart(2, "0");
  const ss = agora.getSeconds().toString().padStart(2, "0");
  const diaSemana = agora.toLocaleDateString("pt-BR", { weekday: "long" });
  const dataLabel = agora.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  const locLabel = local
    ? local.bairro
      ? `${local.bairro}, ${local.cidade}`
      : `${local.cidade}, ${local.estado}`
    : null;

  return (
    <div className="rounded-2xl p-5" style={{ background: "#122039", border: "1px solid #1e3356" }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Relogio */}
        <div>
          <div className="flex items-baseline" style={{ gap: 2 }}>
            <span
              className="font-mono font-black"
              style={{ fontSize: 46, color: "#e8edf5", letterSpacing: "-2px", lineHeight: 1 }}
            >
              {hh}:{mm}
            </span>
            <span
              className="font-mono font-bold"
              style={{ fontSize: 26, color: "#c9a84c", lineHeight: 1, letterSpacing: "-1px" }}
            >
              :{ss}
            </span>
          </div>
          <p className="text-sm mt-1 capitalize" style={{ color: "#64748b" }}>
            {diaSemana}, {dataLabel}
          </p>
        </div>

        {/* Localizacao + clima */}
        <div className="flex items-center gap-5 flex-wrap">
          {locLabel && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} style={{ color: "#475569" }} />
              <span className="text-sm" style={{ color: "#94a3b8" }}>{locLabel}</span>
            </div>
          )}
          {clima && (
            <div className="flex items-center gap-3">
              <WeatherIcon code={clima.codigo} />
              <div>
                <p className="font-bold" style={{ fontSize: 22, color: "#e8edf5", lineHeight: 1.1 }}>
                  {clima.temperatura}°C
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{climaDesc(clima.codigo)}</p>
              </div>
            </div>
          )}
          {carregando && (
            <p className="text-xs" style={{ color: "#334155" }}>Detectando localizacao...</p>
          )}
        </div>
      </div>
    </div>
  );
}
