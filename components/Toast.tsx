"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Check, AlertTriangle, Info, X, Zap } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div
      className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 320 }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: import("@/lib/store").ToastMsg;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 2400);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const config = {
    success: { icon: Check, bg: "#0f2a1a", border: "#36C98E", text: "#36C98E" },
    warning: { icon: AlertTriangle, bg: "#2a1a0f", border: "#E8A33D", text: "#E8A33D" },
    info: { icon: Info, bg: "#0f1a2a", border: "#4D9DE0", text: "#4D9DE0" },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className="pointer-events-auto relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: `linear-gradient(160deg, ${config.border}1a, ${config.bg})`,
        border: `1px solid ${config.border}55`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 24px ${config.border}22`,
        animation: "slideInRight 0.34s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1))",
      }}
    >
      {/* Barra que esvazia mostrando o tempo restante */}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: "100%", background: config.border, transformOrigin: "left", animation: "toastBar 2.4s linear forwards" }} />
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: config.border + "20" }}
      >
        <Icon size={14} style={{ color: config.text }} />
      </div>
      <p className="text-sm font-medium flex-1" style={{ color: "#e8edf5" }}>
        {toast.message}
      </p>
      {toast.xp !== undefined && toast.xp > 0 && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: "#c9a84c20", border: "1px solid #c9a84c40" }}
        >
          <Zap size={10} style={{ color: "#c9a84c" }} />
          <span className="text-xs font-bold" style={{ color: "#c9a84c" }}>
            {toast.xp}
          </span>
        </div>
      )}
      <button onClick={() => onRemove(toast.id)} className="flex-shrink-0 opacity-50 hover:opacity-100">
        <X size={12} style={{ color: "#94a3b8" }} />
      </button>
    </div>
  );
}
