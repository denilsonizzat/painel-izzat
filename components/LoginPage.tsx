"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { loginComEmailSenha } from "@/lib/auth";
import { LogIn, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const { entrarComSupabase } = useAppStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setErro("");
    setCarregando(true);
    const { colaborador, erro: erroLogin } = await loginComEmailSenha(email.trim(), senha);
    setCarregando(false);
    if (erroLogin || !colaborador) { setErro(erroLogin || "Não foi possível entrar."); return; }
    entrarComSupabase(colaborador);
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
          <h2 className="text-white font-semibold mb-4">Entrar</h2>

          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}>
              <Mail size={16} style={{ color: "#74859c" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErro(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="seu@email.com"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#4a5a72]"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}>
              <Lock size={16} style={{ color: "#74859c" }} />
              <input
                type="password"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Senha"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#4a5a72]"
              />
            </div>
          </div>

          {erro && <p className="text-sm mb-3 text-center" style={{ color: "#F2545B" }}>{erro}</p>}

          <button
            onClick={handleLogin}
            disabled={carregando}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#c9a84c" }}
          >
            <LogIn size={18} />
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#1e3356" }}>
          MVP v0.1 — Izzat Group 2026
        </p>
      </div>
    </div>
  );
}
