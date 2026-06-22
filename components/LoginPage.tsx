"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { COLABORADORES } from "@/lib/data";
import { LogIn, Users } from "lucide-react";
import Avatar from "./Avatar";

export default function LoginPage() {
  const { login } = useAppStore();
  const router = useRouter();
  const [selecionado, setSelecionado] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = () => {
    if (!selecionado) { setErro("Selecione seu perfil para continuar."); return; }
    login(selecionado);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col items-center justify-center py-6 px-4" style={{ background: "#0b1624" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#c9a84c" }}>
            <span className="text-white font-bold text-2xl">IZ</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Izzat Group</h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>{"Painel de Gestão da Equipe"}</p>
          <p className="text-xs mt-1" style={{ color: "#74859c" }}>{"Acompanhe rotinas, tarefas, progresso e equipe num só lugar"}</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} style={{ color: "#c9a84c" }} />
              <h2 className="text-white font-semibold">{"Quem é você?"}</h2>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "#74859c" }}>
              <span className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#c9a84c20", color: "#c9a84c" }}>Admin</span>
                <span>= gestor</span>
              </span>
            </div>
          </div>

          <div className="space-y-1.5 mb-5 max-h-64 overflow-y-auto pr-1">
            {COLABORADORES.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelecionado(c.id); setErro(""); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
                style={{
                  background: selecionado === c.id ? "#1e3356" : "transparent",
                  border: selecionado === c.id ? `2px solid ${c.cor}` : "2px solid transparent",
                }}
              >
                <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{c.nome}</p>
                  <p className="text-xs" style={{ color: "#9aa7ba" }}>{c.cargo}</p>
                </div>
                {c.nivelAcesso === "admin" && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: "#c9a84c20", color: "#c9a84c" }}>Admin</span>
                )}
              </button>
            ))}
          </div>

          {erro && <p className="text-sm mb-3 text-center" style={{ color: "#ef4444" }}>{erro}</p>}

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "#c9a84c" }}
          >
            <LogIn size={18} />
            Entrar
          </button>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#1e3356" }}>
          MVP v0.1 — Izzat Group 2026
        </p>
      </div>
    </div>
  );
}
