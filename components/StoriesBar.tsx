"use client";
import { useAppStore } from "@/lib/store";
import { Story } from "@/lib/data";
import Avatar from "./Avatar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const EMOJIS_LIST = ["🚀", "🏆", "⭐", "🔥", "💪", "🎯", "✨", "👑", "💡", "🎉"];

export default function StoriesBar() {
  const { colaboradores, usuarioAtual, stories, adicionarStory, verStory } = useAppStore();
  const router = useRouter();
  const [criarModal, setCriarModal] = useState(false);
  const [verColabId, setVerColabId] = useState<string | null>(null);
  const [form, setForm] = useState<{ conteudo: string; emoji: string; tipo: Story["tipo"] }>({
    conteudo: "",
    emoji: "🚀",
    tipo: "update",
  });

  const limite = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const storiesAtivos = stories.filter((s) => s.criadoEm >= limite);
  const getStoriesDe = (id: string) => storiesAtivos.filter((s) => s.autorId === id);

  useEffect(() => {
    if (!verColabId || !usuarioAtual) return;
    getStoriesDe(verColabId).forEach((s) => {
      if (!s.vistoPor.includes(usuarioAtual.id)) {
        verStory(s.id, usuarioAtual.id);
      }
    });
  }, [verColabId]);

  const handlePostar = () => {
    if (!form.conteudo.trim() || !usuarioAtual) return;
    adicionarStory(usuarioAtual.id, form.conteudo.trim(), form.emoji, form.tipo);
    setForm({ conteudo: "", emoji: "🚀", tipo: "update" });
    setCriarModal(false);
  };

  const myStories = usuarioAtual ? getStoriesDe(usuarioAtual.id) : [];

  const verColabStories = verColabId ? storiesAtivos.filter((s) => s.autorId === verColabId) : [];
  const verColab = verColabId ? colaboradores.find((c) => c.id === verColabId) : null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {/* Current user — click to create story */}
        {usuarioAtual && (
          <button onClick={() => setCriarModal(true)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div
              className="p-0.5 rounded-full"
              style={{ background: myStories.length > 0 ? usuarioAtual.cor : "#334155" }}
            >
              <div className="p-0.5 rounded-full" style={{ background: "#0b1624" }}>
                <div className="relative">
                  <Avatar nome={usuarioAtual.nome} avatar={usuarioAtual.avatar} foto={usuarioAtual.foto} cor={usuarioAtual.cor} size={52} />
                  {myStories.length === 0 && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2"
                      style={{ background: "#c9a84c", borderColor: "#0b1624" }}
                    >
                      <Plus size={9} style={{ color: "#0b1624" }} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs" style={{ color: "#64748b" }}>Você</span>
          </button>
        )}

        {/* Other collaborators */}
        {colaboradores
          .filter((c) => c.id !== usuarioAtual?.id)
          .map((c) => {
            const cStories = getStoriesDe(c.id);
            const temStory = cStories.length > 0;
            const todosVistos = usuarioAtual
              ? cStories.every((s) => s.vistoPor.includes(usuarioAtual.id))
              : true;
            return (
              <button
                key={c.id}
                onClick={() => temStory ? setVerColabId(c.id) : router.push(`/equipe/${c.id}`)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-opacity hover:opacity-80"
                style={{ opacity: temStory ? 1 : 0.5, cursor: "pointer" }}
                data-tip={temStory ? `Ver story de ${c.nome.split(" ")[0]}` : `Ver perfil de ${c.nome.split(" ")[0]}`}
              >
                <div
                  className="p-0.5 rounded-full"
                  style={{
                    background: temStory
                      ? todosVistos ? "#64748b" : c.cor
                      : "#1e3356",
                  }}
                >
                  <div className="p-0.5 rounded-full" style={{ background: "#0b1624" }}>
                    <Avatar nome={c.nome} avatar={c.avatar} foto={c.foto} cor={c.cor} size={52} />
                  </div>
                </div>
                <span
                  className="text-xs truncate"
                  style={{ color: temStory ? "#e8edf5" : "#475569", maxWidth: 60 }}
                >
                  {c.nome.split(" ")[0]}
                </span>
              </button>
            );
          })}
      </div>

      {/* Modal — criar story */}
      {criarModal && usuarioAtual && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000090" }}
          onClick={() => setCriarModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ background: "#122039", border: "1px solid #1e3356" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Novo Story</h3>
              <button onClick={() => setCriarModal(false)}>
                <X size={18} style={{ color: "#64748b" }} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {EMOJIS_LIST.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className="text-2xl p-1.5 rounded-xl transition-all"
                  style={{
                    background: form.emoji === e ? "#c9a84c20" : "transparent",
                    border: `1px solid ${form.emoji === e ? "#c9a84c" : "transparent"}`,
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            <textarea
              value={form.conteudo}
              onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
              placeholder="O que você quer compartilhar com a equipe?"
              rows={3}
              maxLength={140}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none resize-none"
              style={{ background: "#1e3356", border: "1px solid #334155" }}
            />

            <div className="flex gap-2">
              {(["update", "conquista", "reconhecimento"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                  className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: form.tipo === t ? "#c9a84c" : "#1e3356",
                    color: form.tipo === t ? "#0b1624" : "#94a3b8",
                  }}
                >
                  {t === "update" ? "Update" : t === "conquista" ? "Conquista" : "Reconhec."}
                </button>
              ))}
            </div>

            <button
              onClick={handlePostar}
              disabled={!form.conteudo.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: "#c9a84c", color: "#0b1624" }}
            >
              Publicar Story
            </button>
          </div>
        </div>
      )}

      {/* Modal — ver story */}
      {verColab && verColabStories.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#000000C0" }}
          onClick={() => setVerColabId(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center space-y-5 relative"
            style={{ background: "#122039", border: `2px solid ${verColab.cor}50` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="absolute top-4 right-4" onClick={() => setVerColabId(null)}>
              <X size={20} style={{ color: "#64748b" }} />
            </button>

            <div className="flex justify-center">
              <Avatar nome={verColab.nome} avatar={verColab.avatar} foto={verColab.foto} cor={verColab.cor} size={72} />
            </div>

            <div>
              <p className="font-bold text-white text-lg">{verColab.nome.split(" ")[0]}</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                {new Date(verColabStories[0].criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                {" · "}{verColabStories[0].vistoPor.length - 1} visualizac
                {verColabStories[0].vistoPor.length - 1 !== 1 ? "oes" : "ao"}
              </p>
            </div>

            <div className="text-6xl">{verColabStories[0].emoji}</div>

            <p className="text-white text-base leading-relaxed">{verColabStories[0].conteudo}</p>

            <span
              className="inline-block text-xs px-3 py-1 rounded-full"
              style={{
                background:
                  verColabStories[0].tipo === "conquista"
                    ? "#f59e0b20"
                    : verColabStories[0].tipo === "reconhecimento"
                    ? "#8b5cf620"
                    : "#3b82f620",
                color:
                  verColabStories[0].tipo === "conquista"
                    ? "#f59e0b"
                    : verColabStories[0].tipo === "reconhecimento"
                    ? "#8b5cf6"
                    : "#3b82f6",
              }}
            >
              {verColabStories[0].tipo === "conquista"
                ? "Conquista"
                : verColabStories[0].tipo === "reconhecimento"
                ? "Reconhecimento"
                : "Update"}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
