"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Check, AlertTriangle, Info, X, Zap } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
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
    success: { icon: Check, bg: "#0f2a1a", border: "#10b981", text: "#10b981" },
    warning: { icon: AlertTriangle, bg: "#2a1a0f", border: "#f59e0b", text: "#f59e0b" },
    info: { icon: Info, bg: "#0f1a2a", border: "#3b82f6", text: "#3b82f6" },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}40`,
        animation: "slideInRight 0.25s ease-out",
      }}
    >
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
