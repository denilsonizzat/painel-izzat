"use client";
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#0b1624" }}>
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-bold text-white mb-2">Sem conexao</h1>
      <p className="text-sm" style={{ color: "#9aa7ba" }}>
        Verifique sua internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2.5 rounded-xl font-bold text-sm"
        style={{ background: "#c9a84c", color: "#0b1624" }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
