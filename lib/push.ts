"use client";
// Base de Web Push no cliente. Pede permissão, inscreve no PushManager usando a
// chave pública VAPID e envia a inscrição para /api/push/subscribe.
// O ENVIO das mensagens (com app fechado) será feito por um cron no servidor
// usando web-push + VAPID_PRIVATE_KEY — configurar após o deploy na Vercel.

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSuportado(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function vapidConfigurado(): boolean {
  return VAPID_PUBLIC.length > 0;
}

/**
 * Ativa notificações push no dispositivo para o colaborador.
 * Retorna { ok, motivo } — motivo explica falhas (sem suporte, sem VAPID, permissão negada).
 */
export async function ativarPush(colaboradorId: string): Promise<{ ok: boolean; motivo?: string }> {
  if (!pushSuportado()) return { ok: false, motivo: "Dispositivo não suporta push" };
  if (!vapidConfigurado()) return { ok: false, motivo: "Push ainda não configurado no servidor (falta chave VAPID)" };

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return { ok: false, motivo: "Permissão negada" };

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
  });

  const resp = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colaboradorId, subscription: sub }),
  });
  if (!resp.ok) return { ok: false, motivo: "Falha ao registrar inscrição no servidor" };
  return { ok: true };
}

/** Desativa o push do dispositivo e remove a inscrição do servidor. */
export async function desativarPush(colaboradorId: string): Promise<void> {
  if (!pushSuportado()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) await sub.unsubscribe();
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colaboradorId }),
  }).catch(() => {});
}
