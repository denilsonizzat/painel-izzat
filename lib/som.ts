"use client";
// Sons de notificação sintetizados (Web Audio) — sem arquivos.
// Dois timbres distintos: genérico (notificação comum) e "online" (marcante,
// arpejo ascendente) para a pessoa identificar de ouvido quando alguém entra.

let ctx: AudioContext | null = null;
let liberado = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// Navegadores exigem gesto do usuário para tocar áudio. Liberamos no 1º clique/tecla.
if (typeof window !== "undefined") {
  const liberar = () => {
    liberado = true;
    const c = getCtx();
    if (c && c.state === "suspended") c.resume();
    window.removeEventListener("pointerdown", liberar);
    window.removeEventListener("keydown", liberar);
  };
  window.addEventListener("pointerdown", liberar);
  window.addEventListener("keydown", liberar);
}

/** Toca uma sequência de notas (freq em Hz, dur em s) com envelope suave. */
function tocarNotas(notas: { f: number; t: number; d: number }[], tipo: OscillatorType = "sine", volume = 0.16) {
  const c = getCtx();
  if (!c || !liberado) return;
  const agora = c.currentTime;
  for (const n of notas) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = tipo;
    osc.frequency.value = n.f;
    osc.connect(gain);
    gain.connect(c.destination);
    const start = agora + n.t;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
    osc.start(start);
    osc.stop(start + n.d + 0.02);
  }
}

/** Notificação comum: dois toques curtos e discretos. */
export function tocarSomNotificacao() {
  tocarNotas([
    { f: 660, t: 0, d: 0.12 },
    { f: 880, t: 0.09, d: 0.16 },
  ], "sine", 0.14);
}

/** Alguém entrou online: arpejo ascendente marcante (timbre triangular, alegre). */
export function tocarSomOnline() {
  tocarNotas([
    { f: 523.25, t: 0,    d: 0.16 }, // C5
    { f: 659.25, t: 0.10, d: 0.16 }, // E5
    { f: 783.99, t: 0.20, d: 0.28 }, // G5
  ], "triangle", 0.18);
}
