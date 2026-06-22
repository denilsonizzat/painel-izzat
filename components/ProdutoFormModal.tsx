"use client";
import { useAppStore } from "@/lib/store";
import { CAMPOS_PRODUTO, Produto, FornecedorItem } from "@/lib/data";
import { useState } from "react";
import { X, Check, ChevronDown, Zap, ExternalLink, FileText } from "lucide-react";

interface FormState {
  lojaId: string;
  nome: string;
  forn1Nome: string;
  forn1Link: string;
  forn1Preco?: number;
  forn1Frete?: number;
  forn2Nome: string;
  forn2Link: string;
  forn2Preco?: number;
  forn2Frete?: number;
  forn3Nome: string;
  forn3Link: string;
  forn3Preco?: number;
  forn3Frete?: number;
  taxaShopifyPct?: number;
  valorLiquido?: number;
  valorDeVenda?: number;
  margemLucro?: number;
  valorDolarNoDia?: number;
  linkDriveImagem: string;
  linkDriveVideo: string;
  linkDriveGiff: string;
  linkGoogleDocsCopy: string;
  linkShopifyProduto: string;
  linkDocumentoProduto: string;
}

const FORM_VAZIO: FormState = {
  lojaId: "",
  nome: "",
  forn1Nome: "",
  forn1Link: "",
  forn1Preco: undefined,
  forn1Frete: undefined,
  forn2Nome: "",
  forn2Link: "",
  forn2Preco: undefined,
  forn2Frete: undefined,
  forn3Nome: "",
  forn3Link: "",
  forn3Preco: undefined,
  forn3Frete: undefined,
  taxaShopifyPct: undefined,
  valorLiquido: undefined,
  valorDeVenda: undefined,
  margemLucro: undefined,
  valorDolarNoDia: undefined,
  linkDriveImagem: "",
  linkDriveVideo: "",
  linkDriveGiff: "",
  linkGoogleDocsCopy: "",
  linkShopifyProduto: "",
  linkDocumentoProduto: "",
};

function formToProduto(form: FormState): Omit<Produto, "id" | "dataCriacao" | "noAr"> {
  const extras: FornecedorItem[] = [];
  if (form.forn2Link.trim()) {
    extras.push({ nome: form.forn2Nome.trim() || undefined, link: form.forn2Link.trim(), precoPorUnidade: form.forn2Preco, precoPorFrete: form.forn2Frete });
  }
  if (form.forn3Link.trim()) {
    extras.push({ nome: form.forn3Nome.trim() || undefined, link: form.forn3Link.trim(), precoPorUnidade: form.forn3Preco, precoPorFrete: form.forn3Frete });
  }
  return {
    lojaId: form.lojaId,
    nome: form.nome.trim(),
    fornecedorNome: form.forn1Nome.trim() || undefined,
    linkFornecedor: form.forn1Link.trim() || undefined,
    precoPorUnidade: form.forn1Preco,
    precoPorFrete: form.forn1Frete,
    fornecedores: extras.length > 0 ? extras : undefined,
    taxaShopifyPct: form.taxaShopifyPct,
    valorLiquido: form.valorLiquido,
    valorDeVenda: form.valorDeVenda,
    margemLucro: form.margemLucro,
    valorDolarNoDia: form.valorDolarNoDia,
    linkDriveImagem: form.linkDriveImagem.trim() || undefined,
    linkDriveVideo: form.linkDriveVideo.trim() || undefined,
    linkDriveGiff: form.linkDriveGiff.trim() || undefined,
    linkGoogleDocsCopy: form.linkGoogleDocsCopy.trim() || undefined,
    linkShopifyProduto: form.linkShopifyProduto.trim() || undefined,
    linkDocumentoProduto: form.linkDocumentoProduto.trim() || undefined,
  };
}

function produtoToForm(p: Produto): FormState {
  const f2 = p.fornecedores?.[0];
  const f3 = p.fornecedores?.[1];
  return {
    lojaId: p.lojaId,
    nome: p.nome,
    forn1Nome: p.fornecedorNome ?? "",
    forn1Link: p.linkFornecedor ?? "",
    forn1Preco: p.precoPorUnidade,
    forn1Frete: p.precoPorFrete,
    forn2Nome: f2?.nome ?? "",
    forn2Link: f2?.link ?? "",
    forn2Preco: f2?.precoPorUnidade,
    forn2Frete: f2?.precoPorFrete,
    forn3Nome: f3?.nome ?? "",
    forn3Link: f3?.link ?? "",
    forn3Preco: f3?.precoPorUnidade,
    forn3Frete: f3?.precoPorFrete,
    taxaShopifyPct: p.taxaShopifyPct,
    valorLiquido: p.valorLiquido,
    valorDeVenda: p.valorDeVenda,
    margemLucro: p.margemLucro,
    valorDolarNoDia: p.valorDolarNoDia,
    linkDriveImagem: p.linkDriveImagem ?? "",
    linkDriveVideo: p.linkDriveVideo ?? "",
    linkDriveGiff: p.linkDriveGiff ?? "",
    linkGoogleDocsCopy: p.linkGoogleDocsCopy ?? "",
    linkShopifyProduto: p.linkShopifyProduto ?? "",
    linkDocumentoProduto: p.linkDocumentoProduto ?? "",
  };
}

function formCamposPreenchidos(form: FormState): number {
  const mock: Produto = {
    id: "_", dataCriacao: "", noAr: false,
    lojaId: form.lojaId, nome: form.nome,
    linkFornecedor: form.forn1Link,
    precoPorUnidade: form.forn1Preco,
    precoPorFrete: form.forn1Frete,
    taxaShopifyPct: form.taxaShopifyPct,
    valorLiquido: form.valorLiquido,
    valorDeVenda: form.valorDeVenda,
    margemLucro: form.margemLucro,
    valorDolarNoDia: form.valorDolarNoDia,
    linkDriveImagem: form.linkDriveImagem,
    linkDriveVideo: form.linkDriveVideo,
    linkDriveGiff: form.linkDriveGiff,
    linkGoogleDocsCopy: form.linkGoogleDocsCopy,
    linkShopifyProduto: form.linkShopifyProduto,
  };
  return CAMPOS_PRODUTO.filter((c) => {
    const v = mock[c.key];
    if (c.tipo === "url") return typeof v === "string" && v.trim() !== "";
    return typeof v === "number" && !isNaN(v) && v > 0;
  }).length;
}

const NOMES_COMUNS = ["AliExpress", "Wiio", "3Cliques", "DV"];

interface Props {
  onClose: () => void;
  lojaIdInicial?: string;
  produtoParaEditar?: Produto;
  todasLojas: { id: string; nome: string; cor?: string }[];
}

export default function ProdutoFormModal({ onClose, lojaIdInicial, produtoParaEditar, todasLojas }: Props) {
  const { criarProduto, criarProdutoEmLojas, editarProduto } = useAppStore();
  const isEditing = !!produtoParaEditar;
  // Fluxo só aparece ao criar no catálogo (sem loja pré-definida e sem edição)
  const mostrarFluxo = !isEditing && !lojaIdInicial;

  const [form, setForm] = useState<FormState>(
    produtoParaEditar ? produtoToForm(produtoParaEditar) : { ...FORM_VAZIO, lojaId: lojaIdInicial ?? "" }
  );
  const [fluxo, setFluxo] = useState<"central" | "direto">("central");
  const [lojasDireto, setLojasDireto] = useState<string[]>([]);
  const [sucesso, setSucesso] = useState(false);

  const toggleLojaDireto = (id: string) =>
    setLojasDireto((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  function setNum(key: keyof FormState, raw: string) {
    const v = raw === "" ? undefined : parseFloat(raw.replace(",", "."));
    setForm((f) => ({ ...f, [key]: isNaN(v as number) ? undefined : v }));
  }

  // Validação do botão salvar conforme o fluxo escolhido
  const podeSalvar = form.nome.trim() !== "" && (
    isEditing ? true :
    mostrarFluxo && fluxo === "direto" ? lojasDireto.length > 0 :
    form.lojaId !== ""
  );

  function handleSalvar() {
    if (!podeSalvar) return;
    if (isEditing && produtoParaEditar) {
      editarProduto(produtoParaEditar.id, formToProduto(form));
    } else if (mostrarFluxo && fluxo === "direto") {
      // Cria 1 cópia independente em cada loja marcada
      const { lojaId: _omit, ...dados } = formToProduto(form);
      void _omit;
      criarProdutoEmLojas(dados, lojasDireto);
    } else {
      criarProduto(formToProduto(form));
    }
    setSucesso(true);
    setTimeout(() => { onClose(); }, 1400);
  }

  const filled = formCamposPreenchidos(form);
  const pct = Math.round((filled / CAMPOS_PRODUTO.length) * 100);

  const FORNECEDORES_CFG = [
    { n: 1, nomeKey: "forn1Nome" as const, linkKey: "forn1Link" as const, precoKey: "forn1Preco" as const, freteKey: "forn1Frete" as const, required: true },
    { n: 2, nomeKey: "forn2Nome" as const, linkKey: "forn2Link" as const, precoKey: "forn2Preco" as const, freteKey: "forn2Frete" as const, required: false },
    { n: 3, nomeKey: "forn3Nome" as const, linkKey: "forn3Link" as const, precoKey: "forn3Preco" as const, freteKey: "forn3Frete" as const, required: false },
  ];

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "#00000090", backdropFilter: "blur(2px)" }}
      onClick={() => !sucesso && onClose()}
    >
      <div
        className="modal-card w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3" style={{ borderBottom: "1px solid rgba(201,164,66,.16)" }}>
          <div>
            <h2 className="font-bold text-white text-sm">{isEditing ? "Editar Produto" : "Novo Produto"}</h2>
            <p className="text-xs mt-0.5" style={{ color: "#9aa7ba" }}>Preencha os 13 campos obrigatorios para liberar</p>
          </div>
          <button onClick={onClose} style={{ color: "#9aa7ba" }}><X size={16} /></button>
        </div>

        {sucesso ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#10b98122", border: "2px solid #10b981" }}>
              <Check size={24} style={{ color: "#10b981" }} />
            </div>
            <p className="text-white font-bold">{isEditing ? "Produto salvo!" : "Produto criado!"}</p>
          </div>
        ) : (
          <div className="overflow-y-auto px-5 py-4 space-y-5" style={{ maxHeight: "calc(92vh - 90px)" }}>

            {/* Nome */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Nome do Produto *</label>
              <input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: VisionGlow Pro"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                autoFocus
              />
            </div>

            {/* Fluxo de teste (só ao criar no catálogo) */}
            {mostrarFluxo && (
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Como vai testar? *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFluxo("central")}
                    className="text-left p-3 rounded-xl transition-all"
                    style={{ background: fluxo === "central" ? "#c9a84c18" : "#112239", border: `1px solid ${fluxo === "central" ? "#c9a84c" : "#1e3356"}` }}
                  >
                    <p className="text-sm font-bold" style={{ color: fluxo === "central" ? "#c9a84c" : "#e8edf5" }}>Central</p>
                    <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>Testa na loja de teste → valida → distribui</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFluxo("direto")}
                    className="text-left p-3 rounded-xl transition-all"
                    style={{ background: fluxo === "direto" ? "#3b82f618" : "#112239", border: `1px solid ${fluxo === "direto" ? "#3b82f6" : "#1e3356"}` }}
                  >
                    <p className="text-sm font-bold" style={{ color: fluxo === "direto" ? "#3b82f6" : "#e8edf5" }}>Direto nas lojas</p>
                    <p className="text-xs mt-0.5" style={{ color: "#74859c" }}>Cria já nas lojas escolhidas, testa em cada</p>
                  </button>
                </div>
              </div>
            )}

            {/* Loja — central: 1 select · direto: várias lojas (chips) */}
            {(!mostrarFluxo || fluxo === "central") ? (
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>Loja *</label>
                <div className="relative">
                  <select
                    value={form.lojaId}
                    onChange={(e) => setForm((f) => ({ ...f, lojaId: e.target.value }))}
                    disabled={!!lojaIdInicial}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none appearance-none disabled:opacity-70"
                    style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                  >
                    <option value="" style={{ background: "#112239" }}>Selecionar loja...</option>
                    {todasLojas.map((l) => (
                      <option key={l.id} value={l.id} style={{ background: "#112239" }}>
                        {l.nome}{l.id === "izzat-express" ? " ★ (teste)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9aa7ba" }} />
                </div>
                {form.lojaId === "izzat-express" && (
                  <p className="text-xs mt-1" style={{ color: "#c9a84c" }}>Loja de teste → valide → distribua para nichadas</p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>
                  Lojas para testar * <span style={{ color: "#74859c" }}>({lojasDireto.length} selecionada{lojasDireto.length !== 1 ? "s" : ""})</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {todasLojas.map((l) => {
                    const on = lojasDireto.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleLojaDireto(l.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{ background: on ? "#3b82f622" : "#112239", color: on ? "#3b82f6" : "#94a3b8", border: `1px solid ${on ? "#3b82f6" : "#1e3356"}` }}
                      >
                        {l.nome}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-1.5" style={{ color: "#74859c" }}>Cria uma cópia independente em cada loja — status (aprovado/reprovado) é por loja.</p>
              </div>
            )}

            {/* ── FORNECEDORES ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background: "#1e3356" }} />
                <p className="text-xs font-bold uppercase tracking-wider px-2" style={{ color: "#c9a84c" }}>Fornecedores (ate 3)</p>
                <div className="h-px flex-1" style={{ background: "#1e3356" }} />
              </div>

              <div className="space-y-3">
                {FORNECEDORES_CFG.map((forn) => (
                  <div
                    key={forn.n}
                    className="rounded-xl p-3 space-y-2"
                    style={{
                      background: "#112239",
                      border: `1px solid ${forn.required ? "#c9a84c40" : "#1e3356"}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-bold flex-shrink-0" style={{ color: forn.required ? "#c9a84c" : "#475569" }}>
                        Fornecedor {forn.n} {forn.required ? "*" : "(opcional)"}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {NOMES_COMUNS.map((nome) => (
                          <button
                            key={nome}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, [forn.nomeKey]: nome }))}
                            className="text-xs px-1.5 py-0.5 rounded-md transition-all"
                            style={{
                              background: form[forn.nomeKey] === nome ? "#c9a84c20" : "#1e3356",
                              color: form[forn.nomeKey] === nome ? "#c9a84c" : "#475569",
                              border: `1px solid ${form[forn.nomeKey] === nome ? "#c9a84c50" : "#334155"}`,
                            }}
                          >
                            {nome}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      value={form[forn.nomeKey]}
                      onChange={(e) => setForm((f) => ({ ...f, [forn.nomeKey]: e.target.value }))}
                      placeholder="Nome do fornecedor..."
                      className="w-full px-3 py-1.5 rounded-lg text-xs text-white outline-none"
                      style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                    />

                    <input
                      type="url"
                      value={form[forn.linkKey]}
                      onChange={(e) => setForm((f) => ({ ...f, [forn.linkKey]: e.target.value }))}
                      placeholder={`Link do produto${forn.required ? " *" : " (opcional)"}`}
                      className="w-full px-3 py-1.5 rounded-lg text-xs text-white outline-none"
                      style={{
                        background: "#0b1624",
                        border: `1px solid ${forn.required && !form[forn.linkKey] ? "#c9a84c30" : "#1e3356"}`,
                      }}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs block mb-1" style={{ color: "#74859c" }}>Preco Unit. (R$)</label>
                        <input
                          type="number" step="0.01"
                          value={form[forn.precoKey] ?? ""}
                          onChange={(e) => setNum(forn.precoKey, e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                          style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                        />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: "#74859c" }}>Frete (R$)</label>
                        <input
                          type="number" step="0.01"
                          value={form[forn.freteKey] ?? ""}
                          onChange={(e) => setNum(forn.freteKey, e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                          style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── PRECIFICACAO ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background: "#1e3356" }} />
                <p className="text-xs font-bold uppercase tracking-wider px-2" style={{ color: "#74859c" }}>Precificacao</p>
                <div className="h-px flex-1" style={{ background: "#1e3356" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "taxaShopifyPct" as const, label: "Taxa Shopify (%)", placeholder: "2.5" },
                  { key: "valorLiquido" as const, label: "Valor Liquido (R$)", placeholder: "0.00" },
                  { key: "valorDeVenda" as const, label: "Valor de Venda (R$)", placeholder: "0.00" },
                  { key: "margemLucro" as const, label: "Margem de Lucro (%)", placeholder: "30" },
                  { key: "valorDolarNoDia" as const, label: "Dolar no Dia (R$)", placeholder: "5.10" },
                ]).map((campo) => (
                  <div key={campo.key}>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>{campo.label}</label>
                    <input
                      type="number" step="0.01"
                      value={form[campo.key] ?? ""}
                      onChange={(e) => setNum(campo.key, e.target.value)}
                      placeholder={campo.placeholder}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                      style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── DOCUMENTO DO PRODUTO ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background: "#1e3356" }} />
                <p className="text-xs font-bold uppercase tracking-wider px-2 flex items-center gap-1.5" style={{ color: "#4285f4" }}>
                  <FileText size={11} /> Documento do Produto
                </p>
                <div className="h-px flex-1" style={{ background: "#1e3356" }} />
              </div>

              <div
                className="rounded-xl p-3 space-y-2"
                style={{ background: "#112239", border: "1px solid #4285f430" }}
              >
                <p className="text-xs" style={{ color: "#9aa7ba" }}>
                  Pesquisa completa: fornecedor, concorrentes, dimensoes, margem, etc.
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.linkDocumentoProduto}
                    onChange={(e) => setForm((f) => ({ ...f, linkDocumentoProduto: e.target.value }))}
                    placeholder="https://docs.google.com/document/..."
                    className="flex-1 px-3 py-2 rounded-lg text-xs text-white outline-none"
                    style={{ background: "#0b1624", border: "1px solid rgba(201,164,66,.16)" }}
                  />
                  {form.linkDocumentoProduto.trim() && (
                    <a
                      href={form.linkDocumentoProduto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0 transition-opacity hover:opacity-80"
                      style={{ background: "#4285f420", color: "#4285f4", border: "1px solid #4285f440" }}
                    >
                      <ExternalLink size={11} /> Abrir
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ── MIDIA ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background: "#1e3356" }} />
                <p className="text-xs font-bold uppercase tracking-wider px-2" style={{ color: "#74859c" }}>Midia e Catalogo</p>
                <div className="h-px flex-1" style={{ background: "#1e3356" }} />
              </div>
              <div className="space-y-3">
                {([
                  { key: "linkDriveImagem" as const, label: "Link Drive Imagem", placeholder: "https://drive.google.com/..." },
                  { key: "linkDriveVideo" as const, label: "Link Drive Video", placeholder: "https://drive.google.com/..." },
                  { key: "linkDriveGiff" as const, label: "Link Drive GIF", placeholder: "https://drive.google.com/..." },
                  { key: "linkGoogleDocsCopy" as const, label: "Link Google Docs Copy", placeholder: "https://docs.google.com/..." },
                  { key: "linkShopifyProduto" as const, label: "Link Shopify Produto", placeholder: "https://admin.shopify.com/..." },
                ]).map((campo) => (
                  <div key={campo.key}>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "#94a3b8" }}>{campo.label}</label>
                    <input
                      type="url"
                      value={form[campo.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [campo.key]: e.target.value }))}
                      placeholder={campo.placeholder}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                      style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            {form.nome && (
              <div className="rounded-xl p-3" style={{ background: "#112239", border: "1px solid rgba(201,164,66,.16)" }}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#9aa7ba" }}>{filled}/{CAMPOS_PRODUTO.length} campos</span>
                  <span style={{ color: filled === CAMPOS_PRODUTO.length ? "#10b981" : "#c9a84c" }}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e3356" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: filled === CAMPOS_PRODUTO.length ? "#10b981" : "#c9a84c" }} />
                </div>
                {filled === CAMPOS_PRODUTO.length && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#10b981" }}>
                    <Zap size={10} /> Produto completo — podera ir ao ar!
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleSalvar}
              disabled={!podeSalvar}
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "#c9a84c", color: "#0b1624" }}
            >
              {isEditing ? "Salvar Alteracoes"
                : mostrarFluxo && fluxo === "direto" ? `Criar em ${lojasDireto.length || ""} loja${lojasDireto.length !== 1 ? "s" : ""}`
                : "Cadastrar Produto"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
