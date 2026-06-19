"use client";
import { useState, useRef, ReactNode } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  texto?: string;
  text?: string;
  posicao?: "top" | "bottom" | "left" | "right";
  position?: "top" | "bottom" | "left" | "right";
  children?: ReactNode;
  delay?: number;
}

const posMap: Record<string, React.CSSProperties> = {
  top:    { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
  bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
  left:   { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  right:  { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
};

export default function Tooltip({ texto, text, posicao, position, children, delay = 400 }: TooltipProps) {
  const label = texto ?? text ?? "";
  const pos = posicao ?? position ?? "top";
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = () => { timer.current = setTimeout(() => setShow(true), delay); };
  const leave = () => { if (timer.current) clearTimeout(timer.current); setShow(false); };

  const trigger = children ?? (
    <button
      type="button"
      className="inline-flex items-center"
      onFocus={() => setShow(true)}
      onBlur={leave}
    >
      <HelpCircle size={13} style={{ color: "#74859c" }} />
    </button>
  );

  return (
    <div className="relative inline-flex items-center" onMouseEnter={enter} onMouseLeave={leave}>
      {trigger}
      {show && label && (
        <div
          className="absolute z-[9999] w-60 px-3 py-2 rounded-xl text-xs leading-relaxed pointer-events-none animate-fade-in"
          style={{
            ...posMap[pos],
            background: "#0a111e",
            border: "1px solid #1e3356",
            color: "#94a3b8",
            boxShadow: "0 8px 32px #00000080",
            fontWeight: 400,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
