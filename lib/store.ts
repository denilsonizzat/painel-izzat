"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Colaborador,
  Tarefa,
  ComentarioTarefa,
  HistoricoEntry,
  Reconhecimento,
  EntradaAtividade,
  Story,
  NotificacaoInApp,
  Rotina,
  EntregaSemanal,
  Loja,
  Produto,
  Ferramenta,
  RegistroSono,
  RegraEmpresa,
  Desafio,
  CheckInDesafio,
  GastoOperacional,
  LinkRapido,
  COLABORADORES,
  TAREFAS_MOCK,
  HISTORICO_MOCK,
  REGRAS_INICIAIS,
  Prioridade,
  PERGUNTAS_PULSO,
  semanaAtualKey,
} from "./data";

function semanaAtual(): string {
  const d = new Date();
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function perguntaSemana(): string {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
  return PERGUNTAS_PULSO[week % PERGUNTAS_PULSO.length];
}

export interface ToastMsg {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
  xp?: number;
}

interface AppState {
  usuarioAtual: Colaborador | null;
  colaboradores: Colaborador[];
  tarefas: Tarefa[];
  historico: HistoricoEntry[];
  atividadesHoje: EntradaAtividade[];
  stories: Story[];
  notificacoesInApp: NotificacaoInApp[];
  toasts: ToastMsg[];
  fichasReconhecimento: Record<string, number>;
  ultimaResetaFichas: string;
  pulsoAtual: { semana: string; notas: Record<string, number> } | null;
  missoesSemana: Record<string, { semana: string; concluida: boolean }>;
  temaId: string;
  entregasSemanais: EntregaSemanal[];
  pomodoroAberto: boolean;
  pomodoroTarefaId: string | null;
  pomodoroTarefaTitulo: string;
  filtroLuzAzul: boolean;
  corAcentoCustom: string | null;
  historicoAtividades: EntradaAtividade[];
  lojasCustom: Loja[];
  lojasArquivadas: string[];

  login: (id: string) => void;
  logout: () => void;
  marcarSubtarefa: (colaboradorId: string, rotinaId: string, subtarefaId: string, valor: boolean) => void;
  marcarRotina: (colaboradorId: string, rotinaId: string, valor: boolean) => void;
  marcarExpectativa: (colaboradorId: string, expectativaId: string, valor: boolean) => void;
  ganharXP: (colaboradorId: string, quantidade: number) => void;
  adicionarComentario: (tarefaId: string, texto: string) => void;
  registrarCheckIn: (colaboradorId: string) => void;
  darReconhecimento: (paraId: string, mensagem: string, emoji: string) => void;
  verificarAtrasadas: () => void;
  criarTarefa: (tarefa: Omit<Tarefa, "id" | "dataCriacao">) => void;
  atualizarStatusTarefa: (tarefaId: string, status: Tarefa["status"]) => void;
  marcarSubtarefaTarefa: (tarefaId: string, colaboradorId: string, subtarefaId: string, concluida: boolean) => void;
  resetarRotinas: () => void;
  setStatusOnline: (colaboradorId: string, ativo: boolean, ate?: string, proximoDia?: boolean) => void;
  adicionarAtividadeEntry: (entry: Omit<EntradaAtividade, "id">) => void;
  adicionarStory: (autorId: string, conteudo: string, emoji: string, tipo: Story["tipo"]) => void;
  verStory: (storyId: string, colaboradorId: string) => void;
  adicionarNotificacaoInApp: (notif: Omit<NotificacaoInApp, "id" | "criadaEm" | "lida">) => void;
  marcarNotificacaoLida: (notifId: string) => void;
  limparNotificacoesLidas: () => void;
  addToast: (message: string, type: ToastMsg["type"], xp?: number) => void;
  removeToast: (id: string) => void;
  criarRotina: (colaboradorId: string, rotina: Omit<Rotina, "id">) => void;
  editarRotina: (colaboradorId: string, rotinaId: string, updates: Partial<Rotina>) => void;
  deletarRotina: (colaboradorId: string, rotinaId: string) => void;
  usarFichaReconhecimento: (doId: string) => boolean;
  setTrabalhando: (colaboradorId: string, trabalhando: string, foco: boolean) => void;
  registrarPulso: (userId: string, nota: number) => void;
  concluirMissao: (userId: string) => void;
  setTema: (temaId: string) => void;
  abrirPomodoro: (tarefaId?: string | null, titulo?: string) => void;
  fecharPomodoro: () => void;
  criarEntregaSemanal: (colaboradorId: string, titulo: string) => void;
  atualizarStatusEntrega: (entregaId: string, status: EntregaSemanal["status"], motivoTravado?: string) => void;
  deletarEntregaSemanal: (entregaId: string) => void;
  salvarFormulario: (colaboradorId: string, dados: import("./data").RespostaFormulario) => void;
  aprovarTarefa: (tarefaId: string) => void;
  rejeitarTarefa: (tarefaId: string) => void;
  sidebarColapsada: boolean;
  onboardingConcluido: boolean;
  setSidebarColapsada: (v: boolean) => void;
  setOnboardingConcluido: (v: boolean) => void;
  criarColaborador: (dados: { nome: string; cargo: string; cor: string; nivelAcesso: Colaborador["nivelAcesso"]; email?: string }) => void;
  setFiltroLuzAzul: (v: boolean) => void;
  setCorAcentoCustom: (cor: string | null) => void;
  setTelefone: (colaboradorId: string, telefone: string) => void;
  setSalario: (colaboradorId: string, salario: number) => void;
  setGoogleChatLink: (colaboradorId: string, link: string) => void;
  setDataNascimento: (colaboradorId: string, data: string) => void;
  marcarVisualizacaoTarefa: (tarefaId: string, colaboradorId: string) => void;
  adicionarMiniTarefa: (tarefaId: string, colaboradorId: string, titulo: string) => void;
  toggleMiniTarefa: (tarefaId: string, miniId: string, concluida: boolean) => void;
  deletarMiniTarefa: (tarefaId: string, miniId: string) => void;
  criarLoja: (dados: Omit<Loja, "id">) => void;
  editarLoja: (id: string, updates: Partial<Loja>) => void;
  arquivarLoja: (id: string) => void;
  restaurarLoja: (id: string) => void;
  produtos: Produto[];
  criarProduto: (dados: Omit<Produto, "id" | "dataCriacao" | "noAr">) => void;
  editarProduto: (id: string, updates: Partial<Omit<Produto, "id" | "dataCriacao">>) => void;
  deletarProduto: (id: string) => void;
  toggleProdutoNoAr: (id: string) => void;
  validarProduto: (id: string) => void;
  reprovarProduto: (id: string) => void;
  distribuirProduto: (id: string, lojaIds: string[]) => void;

  ferramentas: Ferramenta[];
  criarFerramenta: (dados: Omit<Ferramenta, "id">) => void;
  registrarSono: (colaboradorId: string, dados: { data: string; horaDormir: string; horaAcordar: string }) => void;

  desafios: Desafio[];
  checkInsDesafio: CheckInDesafio[];
  criarDesafio: (dados: Omit<Desafio, "id" | "criadoEm" | "criadoPor" | "ativo">) => void;
  editarDesafio: (id: string, updates: Partial<Desafio>) => void;
  deletarDesafio: (id: string) => void;
  fazerCheckIn: (desafioId: string, data: string, nota?: string) => void;
  desfazerCheckIn: (desafioId: string, data: string) => void;
  reagirCheckIn: (checkInId: string, emoji: string) => void;

  regrasEmpresa: RegraEmpresa[];
  criarRegra: (dados: Omit<RegraEmpresa, "id" | "criadaEm" | "criadaPor" | "ativa">) => void;
  editarRegra: (id: string, updates: Partial<Omit<RegraEmpresa, "id" | "criadaEm" | "criadaPor">>) => void;
  deletarRegra: (id: string) => void;
  toggleRegra: (id: string) => void;
  editarFerramenta: (id: string, updates: Partial<Omit<Ferramenta, "id">>) => void;
  deletarFerramenta: (id: string) => void;
  vincularFerramenta: (ferramentaId: string, colaboradorId: string) => void;
  desvincularFerramenta: (ferramentaId: string, colaboradorId: string) => void;

  gastosOperacionais: GastoOperacional[];
  criarGastoOp: (dados: Omit<GastoOperacional, "id" | "criadoEm">) => void;
  editarGastoOp: (id: string, updates: Partial<Omit<GastoOperacional, "id" | "criadoEm">>) => void;
  deletarGastoOp: (id: string) => void;
  toggleGastoOp: (id: string) => void;

  linksRapidos: LinkRapido[];
  criarLinkRapido: (dados: Omit<LinkRapido, "id" | "criadoEm">) => void;
  editarLinkRapido: (id: string, updates: Partial<Omit<LinkRapido, "id" | "criadoEm">>) => void;
  deletarLinkRapido: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      usuarioAtual: null,
      colaboradores: COLABORADORES,
      tarefas: TAREFAS_MOCK,
      historico: HISTORICO_MOCK,
      atividadesHoje: [],
      stories: [],
      notificacoesInApp: [],
      toasts: [],
      fichasReconhecimento: {},
      ultimaResetaFichas: "",
      pulsoAtual: null,
      missoesSemana: {},
      temaId: "izzat",
      entregasSemanais: [],
      pomodoroAberto: false,
      pomodoroTarefaId: null,
      pomodoroTarefaTitulo: "",
      sidebarColapsada: false,
      onboardingConcluido: false,
      filtroLuzAzul: false,
      corAcentoCustom: null,
      historicoAtividades: [],
      lojasCustom: [],
      lojasArquivadas: [],
      produtos: [],
      ferramentas: [],
      desafios: [],
      checkInsDesafio: [],
      regrasEmpresa: REGRAS_INICIAIS,
      gastosOperacionais: [],
      linksRapidos: [],

      login: (id) => {
        const colab = get().colaboradores.find((c) => c.id === id);
        if (colab) set({ usuarioAtual: colab });
      },

      logout: () => set({ usuarioAtual: null }),

      ganharXP: (colaboradorId, quantidade) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : { ...c, xp: (c.xp || 0) + quantidade }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      marcarSubtarefa: (colaboradorId, rotinaId, subtarefaId, valor) => {
        const colab = get().colaboradores.find((c) => c.id === colaboradorId);
        const rotina = colab?.rotinas.find((r) => r.id === rotinaId);
        const sub = rotina?.subtarefas.find((s) => s.id === subtarefaId);

        set((state) => ({
          colaboradores: state.colaboradores.map((c) => {
            if (c.id !== colaboradorId) return c;
            return {
              ...c,
              rotinas: c.rotinas.map((r) => {
                if (r.id !== rotinaId) return r;
                const novasSub = r.subtarefas.map((s) =>
                  s.id === subtarefaId ? { ...s, concluida: valor } : s
                );
                return { ...r, subtarefas: novasSub, concluida: novasSub.every((s) => s.concluida) };
              }),
            };
          }),
        }));

        if (valor) {
          get().ganharXP(colaboradorId, 10);
          get().addToast("+10 XP · subtarefa concluida!", "success", 10);
          if (sub && rotina) {
            get().adicionarAtividadeEntry({
              colaboradorId,
              tipo: "rotina_concluida",
              descricao: sub.titulo + " — " + rotina.titulo,
              hora: new Date().toTimeString().slice(0, 5),
              data: new Date().toISOString().split("T")[0],
              xp: 10,
            });
          }
        }
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      marcarRotina: (colaboradorId, rotinaId, valor) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) => {
            if (c.id !== colaboradorId) return c;
            return {
              ...c,
              rotinas: c.rotinas.map((r) =>
                r.id !== rotinaId ? r : {
                  ...r,
                  concluida: valor,
                  subtarefas: r.subtarefas.map((s) => ({ ...s, concluida: valor })),
                }
              ),
            };
          }),
        }));
        if (valor) {
          const bonus = Math.random() < 0.10;
          const xp = bonus ? 50 : 25;
          get().ganharXP(colaboradorId, xp);
          const msg = bonus ? "+50 XP · BONUS 2x! Rotina concluida!" : "+25 XP · rotina concluida!";
          get().addToast(msg, "success", xp);
          get().adicionarAtividadeEntry({
            colaboradorId,
            tipo: "rotina_concluida",
            descricao: "Rotina concluida",
            hora: new Date().toTimeString().slice(0, 5),
            data: new Date().toISOString().split("T")[0],
            xp,
          });
        }
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      marcarExpectativa: (colaboradorId, expectativaId, valor) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) => {
            if (c.id !== colaboradorId) return c;
            return {
              ...c,
              expectativas: c.expectativas.map((e) =>
                e.id === expectativaId ? { ...e, cumprida: valor } : e
              ),
            };
          }),
        }));
        if (valor) {
          const colab = get().colaboradores.find((c) => c.id === colaboradorId);
          const exp = colab?.expectativas.find((e) => e.id === expectativaId);
          if (exp) {
            const xpGanho = exp.peso * 15;
            get().ganharXP(colaboradorId, xpGanho);
            get().addToast("+" + xpGanho + " XP · expectativa cumprida!", "success", xpGanho);
            get().adicionarAtividadeEntry({
              colaboradorId,
              tipo: "expectativa_cumprida",
              descricao: exp.descricao,
              hora: new Date().toTimeString().slice(0, 5),
              data: new Date().toISOString().split("T")[0],
              xp: xpGanho,
            });
          }
        }
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      darReconhecimento: (paraId, mensagem, emoji) => {
        const de = get().usuarioAtual;
        if (!de) return;
        const rec: Reconhecimento = {
          id: `r${Date.now()}`,
          deId: de.id,
          paraId,
          mensagem,
          emoji,
          data: new Date().toISOString().split("T")[0],
        };
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== paraId ? c : {
              ...c,
              reconhecimentos: [rec, ...(c.reconhecimentos || [])].slice(0, 50),
            }
          ),
        }));
        get().ganharXP(paraId, 25);
        get().adicionarNotificacaoInApp({
          paraId,
          tipo: "reconhecimento",
          titulo: "Reconhecimento recebido!",
          corpo: de.nome.split(" ")[0] + " disse: " + emoji + " \"" + mensagem + "\"",
          href: "/equipe/" + paraId,
        });
      },

      verificarAtrasadas: () => {
        const hoje = new Date().toISOString().split("T")[0];
        const FINAIS = ["concluida", "atrasada", "aguardando_revisao"] as const;
        set((state) => ({
          tarefas: state.tarefas.map((t) => {
            if (t.dataLimite && t.dataLimite < hoje && !FINAIS.includes(t.status as typeof FINAIS[number])) {
              return { ...t, status: "atrasada" as const };
            }
            return t;
          }),
        }));
      },

      adicionarComentario: (tarefaId, texto) => {
        const autor = get().usuarioAtual;
        if (!autor || !texto.trim()) return;
        const comentario: ComentarioTarefa = {
          id: `c${Date.now()}`,
          autorId: autor.id,
          texto: texto.trim(),
          criadoEm: new Date().toISOString(),
        };
        set((state) => ({
          tarefas: state.tarefas.map((t) =>
            t.id === tarefaId ? { ...t, comentarios: [...(t.comentarios || []), comentario] } : t
          ),
        }));
      },

      registrarCheckIn: (colaboradorId) => {
        const hoje = new Date().toISOString().split("T")[0];
        const colab = get().colaboradores.find((c) => c.id === colaboradorId);
        if (!colab || colab.ultimoCheckIn === hoje) return;

        const totalSubs = colab.rotinas.reduce((a, r) => a + r.subtarefas.length, 0);
        const feitas = colab.rotinas.reduce((a, r) => a + r.subtarefas.filter((s) => s.concluida).length, 0);
        const pctRotinas = totalSubs === 0 ? (colab.rotinas.every((r) => r.concluida) ? 100 : 0) : Math.round((feitas / totalSubs) * 100);
        const totalExp = colab.expectativas.reduce((a, e) => a + e.peso, 0);
        const cumprido = colab.expectativas.filter((e) => e.cumprida).reduce((a, e) => a + e.peso, 0);
        const pctExpectativas = totalExp === 0 ? 100 : Math.round((cumprido / totalExp) * 100);

        const xpBonus = pctRotinas === 100 ? 50 : 0;
        if (xpBonus > 0) get().ganharXP(colaboradorId, xpBonus);

        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = ontem.toISOString().split("T")[0];
        const streakAnterior = colab.streak || 0;
        const novoStreak = colab.ultimoCheckIn === ontemStr ? streakAnterior + 1 : 1;

        if (novoStreak === 1 && streakAnterior > 2) {
          setTimeout(() => get().addToast(
            "Tudo bem! Seu streak de " + streakAnterior + " dias acabou. Hoje e um novo comeco!",
            "info"
          ), 1500);
        } else if (novoStreak > 1 && novoStreak % 7 === 0) {
          setTimeout(() => get().addToast(
            "Incrivel! " + novoStreak + " dias seguidos de check-in. Voce e constante!", "success"
          ), 1500);
        }

        const entry: HistoricoEntry = {
          data: hoje,
          colaboradorId,
          pctRotinas,
          pctExpectativas,
          xpGanho: xpBonus,
          tarefasConcluidas: get().tarefas.filter((t) => t.atribuidoPara === colaboradorId && t.status === "concluida").length,
        };

        set((state) => ({
          historico: [...state.historico.slice(-(365 * 9)), entry],
          colaboradores: state.colaboradores.map((c) =>
            c.id === colaboradorId ? { ...c, ultimoCheckIn: hoje, streak: novoStreak } : c
          ),
        }));

        get().adicionarAtividadeEntry({
          colaboradorId,
          tipo: "check_in",
          descricao: "Check-in diario — " + pctRotinas + "% rotinas, " + pctExpectativas + "% expectativas",
          hora: new Date().toTimeString().slice(0, 5),
          data: hoje,
          xp: xpBonus,
        });

        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      criarTarefa: (tarefa) => {
        const nova: Tarefa = {
          ...tarefa,
          id: `t${Date.now()}`,
          dataCriacao: new Date().toISOString().split("T")[0],
          comentarios: [],
        };
        set((state) => ({ tarefas: [nova, ...state.tarefas] }));
        if (tarefa.atribuidoPara && tarefa.atribuidoPara !== tarefa.criadoPor) {
          const criador = get().colaboradores.find((c) => c.id === tarefa.criadoPor);
          get().adicionarNotificacaoInApp({
            paraId: tarefa.atribuidoPara,
            tipo: "tarefa_nova",
            titulo: "Nova tarefa para voce!",
            corpo: (criador?.nome.split(" ")[0] ?? "Alguem") + " delegou: \"" + tarefa.titulo + "\"",
            href: "/tarefas",
          });
        }
      },

      atualizarStatusTarefa: (tarefaId, status) => {
        const { usuarioAtual } = get();
        const isAdmin = usuarioAtual?.nivelAcesso === "admin";
        const finalStatus = (!isAdmin && status === "concluida") ? "aguardando_revisao" : status;
        const concluidaEm = (finalStatus === "concluida" || finalStatus === "aguardando_revisao")
          ? new Date().toISOString() : undefined;
        set((state) => ({
          tarefas: state.tarefas.map((t) => t.id === tarefaId
            ? { ...t, status: finalStatus, ...(concluidaEm ? { concluidaEm } : {}) }
            : t),
        }));
        if (finalStatus === "aguardando_revisao") {
          get().addToast("Enviado para revisao do gestor!", "info");
          const admin = get().colaboradores.find((c) => c.nivelAcesso === "admin");
          const tarefa = get().tarefas.find((t) => t.id === tarefaId);
          if (admin && tarefa) {
            get().adicionarNotificacaoInApp({
              paraId: admin.id,
              tipo: "tarefa_nova",
              titulo: "Tarefa aguardando revisao",
              corpo: (usuarioAtual?.nome.split(" ")[0] ?? "Alguem") + " concluiu: \"" + tarefa.titulo + "\"",
              href: "/tarefas",
            });
          }
        }
        if (finalStatus === "concluida") {
          const tarefa = get().tarefas.find((t) => t.id === tarefaId);
          if (tarefa) {
            get().ganharXP(tarefa.atribuidoPara, 30);
            get().addToast("+30 XP · tarefa concluida!", "success", 30);
            get().adicionarAtividadeEntry({
              colaboradorId: tarefa.atribuidoPara,
              tipo: "tarefa_concluida",
              descricao: tarefa.titulo,
              hora: new Date().toTimeString().slice(0, 5),
              data: new Date().toISOString().split("T")[0],
              xp: 30,
            });
          }
        }
      },

      aprovarTarefa: (tarefaId) => {
        const tarefa = get().tarefas.find((t) => t.id === tarefaId);
        if (!tarefa) return;
        set((state) => ({
          tarefas: state.tarefas.map((t) => t.id === tarefaId ? { ...t, status: "concluida" as const } : t),
        }));
        get().ganharXP(tarefa.atribuidoPara, 30);
        get().addToast("+30 XP · tarefa aprovada!", "success", 30);
        get().adicionarAtividadeEntry({
          colaboradorId: tarefa.atribuidoPara,
          tipo: "tarefa_concluida",
          descricao: tarefa.titulo,
          hora: new Date().toTimeString().slice(0, 5),
          data: new Date().toISOString().split("T")[0],
          xp: 30,
        });
        get().adicionarNotificacaoInApp({
          paraId: tarefa.atribuidoPara,
          tipo: "tarefa_nova",
          titulo: "Tarefa aprovada!",
          corpo: "\"" + tarefa.titulo + "\" foi aprovada pelo gestor. +30 XP!",
          href: "/tarefas",
        });
      },

      rejeitarTarefa: (tarefaId) => {
        const tarefa = get().tarefas.find((t) => t.id === tarefaId);
        if (!tarefa) return;
        set((state) => ({
          tarefas: state.tarefas.map((t) => t.id === tarefaId ? { ...t, status: "em_andamento" as const } : t),
        }));
        get().adicionarComentario(tarefaId, "Tarefa devolvida pelo gestor para revisao.");
        get().adicionarNotificacaoInApp({
          paraId: tarefa.atribuidoPara,
          tipo: "tarefa_atrasada",
          titulo: "Tarefa devolvida para revisao",
          corpo: "\"" + tarefa.titulo + "\" precisa de ajustes antes da aprovacao.",
          href: "/tarefas",
        });
        get().addToast("Tarefa devolvida para o colaborador.", "warning");
      },

      marcarSubtarefaTarefa: (tarefaId, colaboradorId, subtarefaId, concluida) => {
        set((state) => ({
          tarefas: state.tarefas.map((t) => {
            if (t.id !== tarefaId) return t;
            return {
              ...t,
              membros: (t.membros || []).map((m) => {
                if (m.colaboradorId !== colaboradorId) return m;
                return { ...m, subtarefas: m.subtarefas.map((s) => s.id === subtarefaId ? { ...s, concluida } : s) };
              }),
            };
          }),
        }));
        if (concluida) {
          get().ganharXP(colaboradorId, 10);
          get().addToast("+10 XP · subtarefa concluída!", "success", 10);
        }
      },

      resetarRotinas: () => set({ colaboradores: COLABORADORES }),

      setStatusOnline: (colaboradorId, ativo, ate, proximoDia) => {
        const desde = ativo ? new Date().toTimeString().slice(0, 5) : undefined;
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : {
              ...c,
              statusOnline: ativo ? { ativo: true, ate, desde, proximoDia: proximoDia ?? false } : { ativo: false },
            }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      adicionarAtividadeEntry: (entry) => {
        const hoje = new Date().toISOString().split("T")[0];
        const nova: EntradaAtividade = { ...entry, id: `a${Date.now()}${Math.random()}` };
        set((state) => {
          const historico = [nova, ...state.historicoAtividades].slice(0, 500);
          return {
            atividadesHoje: [
              ...state.atividadesHoje.filter((a) => a.data === hoje),
              nova,
            ].sort((a, b) => a.hora.localeCompare(b.hora)),
            historicoAtividades: historico,
          };
        });
      },

      adicionarStory: (autorId, conteudo, emoji, tipo) => {
        const agora = new Date();
        const nova: Story = {
          id: `s${Date.now()}`,
          autorId,
          conteudo,
          emoji,
          tipo,
          criadoEm: agora.toISOString(),
          vistoPor: [autorId],
        };
        set((state) => ({ stories: [nova, ...state.stories].slice(0, 100) }));
      },

      verStory: (storyId, colaboradorId) => {
        set((state) => ({
          stories: state.stories.map((s) =>
            s.id !== storyId ? s : {
              ...s,
              vistoPor: s.vistoPor.includes(colaboradorId) ? s.vistoPor : [...s.vistoPor, colaboradorId],
            }
          ),
        }));
      },

      adicionarNotificacaoInApp: (notif) => {
        const nova: NotificacaoInApp = {
          ...notif,
          id: `n${Date.now()}`,
          lida: false,
          criadaEm: new Date().toISOString(),
        };
        set((state) => ({ notificacoesInApp: [nova, ...state.notificacoesInApp].slice(0, 50) }));
      },

      marcarNotificacaoLida: (notifId) => {
        set((state) => ({
          notificacoesInApp: state.notificacoesInApp.map((n) =>
            n.id === notifId ? { ...n, lida: true } : n
          ),
        }));
      },

      limparNotificacoesLidas: () => {
        set((state) => ({
          notificacoesInApp: state.notificacoesInApp.filter((n) => !n.lida),
        }));
      },

      addToast: (message, type, xp) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        set((state) => ({ toasts: [...state.toasts, { id, message, type, xp }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 2500);
      },

      removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },

      criarRotina: (colaboradorId, rotina) => {
        const novaRotina = { ...rotina, id: `rot-${Date.now()}` };
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : { ...c, rotinas: [...c.rotinas, novaRotina] }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      editarRotina: (colaboradorId, rotinaId, updates) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : {
              ...c,
              rotinas: c.rotinas.map((r) => r.id !== rotinaId ? r : { ...r, ...updates }),
            }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      deletarRotina: (colaboradorId, rotinaId) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : {
              ...c,
              rotinas: c.rotinas.filter((r) => r.id !== rotinaId),
            }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      usarFichaReconhecimento: (doId) => {
        const fichas = get().fichasReconhecimento;
        const disponiveis = fichas[doId] !== undefined ? fichas[doId] : 3;
        if (disponiveis <= 0) return false;
        set((state) => ({
          fichasReconhecimento: { ...state.fichasReconhecimento, [doId]: disponiveis - 1 },
        }));
        return true;
      },

      setTrabalhando: (colaboradorId, trabalhando, foco) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : {
              ...c,
              statusOnline: c.statusOnline
                ? { ...c.statusOnline, trabalhando, foco }
                : { ativo: false, trabalhando, foco },
            }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      registrarPulso: (userId, nota) => {
        const semana = semanaAtual();
        set((state) => {
          const pulso = state.pulsoAtual;
          if (pulso && pulso.semana === semana) {
            return {
              pulsoAtual: {
                ...pulso,
                notas: { ...pulso.notas, [userId]: nota },
              },
            };
          }
          return {
            pulsoAtual: {
              semana,
              notas: { [userId]: nota },
            },
          };
        });
      },

      concluirMissao: (userId) => {
        const semana = semanaAtual();
        const ja = get().missoesSemana[userId];
        if (ja && ja.semana === semana && ja.concluida) return;
        set((state) => ({
          missoesSemana: {
            ...state.missoesSemana,
            [userId]: { semana, concluida: true },
          },
        }));
        get().ganharXP(userId, 100);
        get().addToast("+100 XP · Missao da semana concluida!", "success", 100);
      },

      setTema: (temaId) => set({ temaId }),
      setFiltroLuzAzul: (v) => set({ filtroLuzAzul: v }),
      setCorAcentoCustom: (cor) => set({ corAcentoCustom: cor }),
      setTelefone: (colaboradorId, telefone) => set((s) => ({
        colaboradores: s.colaboradores.map((c) => c.id === colaboradorId ? { ...c, telefone } : c),
      })),
      setSalario: (colaboradorId, salario) => set((s) => ({
        colaboradores: s.colaboradores.map((c) => c.id === colaboradorId ? { ...c, salario } : c),
      })),
      setGoogleChatLink: (colaboradorId, link) => set((s) => ({
        colaboradores: s.colaboradores.map((c) => c.id === colaboradorId ? { ...c, googleChatLink: link } : c),
      })),
      setDataNascimento: (colaboradorId, data) => set((s) => ({
        colaboradores: s.colaboradores.map((c) => c.id === colaboradorId ? { ...c, dataNascimento: data } : c),
      })),
      marcarVisualizacaoTarefa: (tarefaId, colaboradorId) => set((s) => ({
        tarefas: s.tarefas.map((t) => t.id === tarefaId
          ? { ...t, visualizacoes: { ...(t.visualizacoes || {}), [colaboradorId]: new Date().toISOString() } }
          : t),
      })),
      adicionarMiniTarefa: (tarefaId, colaboradorId, titulo) => set((s) => ({
        tarefas: s.tarefas.map((t) => t.id === tarefaId ? {
          ...t,
          miniTarefas: [...(t.miniTarefas || []), {
            id: `mt-${Date.now()}`,
            colaboradorId,
            titulo,
            concluida: false,
            criadaEm: new Date().toISOString(),
          }],
        } : t),
      })),
      toggleMiniTarefa: (tarefaId, miniId, concluida) => set((s) => ({
        tarefas: s.tarefas.map((t) => t.id === tarefaId ? {
          ...t,
          miniTarefas: (t.miniTarefas || []).map((m) => m.id === miniId ? { ...m, concluida } : m),
        } : t),
      })),
      deletarMiniTarefa: (tarefaId, miniId) => set((s) => ({
        tarefas: s.tarefas.map((t) => t.id === tarefaId ? {
          ...t,
          miniTarefas: (t.miniTarefas || []).filter((m) => m.id !== miniId),
        } : t),
      })),

      criarLoja: (dados) => {
        const nova: Loja = { ...dados, id: `loja-custom-${Date.now()}` };
        set((s) => ({ lojasCustom: [...s.lojasCustom, nova] }));
      },
      editarLoja: (id, updates) => {
        set((s) => ({
          lojasCustom: s.lojasCustom.map((l) => l.id === id ? { ...l, ...updates } : l),
        }));
      },
      arquivarLoja: (id) => set((s) => ({ lojasArquivadas: [...s.lojasArquivadas.filter((i) => i !== id), id] })),
      restaurarLoja: (id) => set((s) => ({ lojasArquivadas: s.lojasArquivadas.filter((i) => i !== id) })),

      criarProduto: (dados) => {
        const novo: Produto = { ...dados, id: `prod-${Date.now()}`, dataCriacao: new Date().toISOString().split("T")[0], noAr: false };
        set((s) => ({ produtos: [...s.produtos, novo] }));
      },
      editarProduto: (id, updates) => set((s) => ({
        produtos: s.produtos.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),
      deletarProduto: (id) => set((s) => ({ produtos: s.produtos.filter((p) => p.id !== id) })),
      toggleProdutoNoAr: (id) => {
        const { produtos } = get();
        const p = produtos.find((x) => x.id === id);
        if (!p) return;
        set((s) => ({ produtos: s.produtos.map((x) => x.id === id ? { ...x, noAr: !x.noAr } : x) }));
      },
      validarProduto: (id) => set((s) => ({
        produtos: s.produtos.map((p) => p.id === id ? { ...p, validado: true, reprovado: false } : p),
      })),
      reprovarProduto: (id) => set((s) => ({
        produtos: s.produtos.map((p) => p.id === id ? { ...p, reprovado: true, validado: false, noAr: false } : p),
      })),
      distribuirProduto: (id, lojaIds) => {
        const { produtos } = get();
        const origem = produtos.find((p) => p.id === id);
        if (!origem) return;
        const copias: Produto[] = lojaIds.map((lojaId, i) => ({
          ...origem,
          id: `prod-${Date.now()}-${i}`,
          lojaId,
          noAr: false,
          validado: undefined,
          distribuidoPara: undefined,
          produtoOrigemId: origem.id,
          linkShopifyProduto: "",
          dataCriacao: new Date().toISOString().split("T")[0],
        }));
        set((s) => ({
          produtos: [
            ...s.produtos.map((p) => p.id === id ? { ...p, distribuidoPara: [...(p.distribuidoPara ?? []), ...lojaIds] } : p),
            ...copias,
          ],
        }));
      },

      criarFerramenta: (dados) => {
        const nova: Ferramenta = { ...dados, id: `ferr-${Date.now()}` };
        set((s) => ({ ferramentas: [...s.ferramentas, nova] }));
      },
      editarFerramenta: (id, updates) => set((s) => ({
        ferramentas: s.ferramentas.map((f) => f.id === id ? { ...f, ...updates } : f),
      })),
      deletarFerramenta: (id) => set((s) => ({
        ferramentas: s.ferramentas.filter((f) => f.id !== id),
      })),
      vincularFerramenta: (ferramentaId, colaboradorId) => set((s) => ({
        ferramentas: s.ferramentas.map((f) =>
          f.id !== ferramentaId ? f :
          f.colaboradoresIds.includes(colaboradorId) ? f :
          { ...f, colaboradoresIds: [...f.colaboradoresIds, colaboradorId] }
        ),
      })),
      desvincularFerramenta: (ferramentaId, colaboradorId) => set((s) => ({
        ferramentas: s.ferramentas.map((f) =>
          f.id !== ferramentaId ? f :
          { ...f, colaboradoresIds: f.colaboradoresIds.filter((id) => id !== colaboradorId) }
        ),
      })),

      registrarSono: (colaboradorId, dados) => {
        const hd = dados.horaDormir.split(":").map(Number);
        const ha = dados.horaAcordar.split(":").map(Number);
        let minD = hd[0] * 60 + hd[1];
        let minA = ha[0] * 60 + ha[1];
        if (minA <= minD) minA += 1440;
        const horasDormidas = Math.round((minA - minD) / 60 * 10) / 10;
        const novo: RegistroSono = { id: `sono-${Date.now()}`, ...dados, horasDormidas };
        set((s) => ({
          colaboradores: s.colaboradores.map((c) =>
            c.id !== colaboradorId ? c :
            {
              ...c,
              registrosSono: [
                novo,
                ...(c.registrosSono || []).filter((r) => r.data !== dados.data),
              ].slice(0, 90),
            }
          ),
        }));
      },

      criarRegra: (dados) => {
        const nova: RegraEmpresa = {
          ...dados,
          id: `regra-${Date.now()}`,
          criadaEm: new Date().toISOString().split("T")[0],
          criadaPor: get().usuarioAtual?.id || "admin",
          ativa: true,
        };
        set((s) => ({ regrasEmpresa: [...s.regrasEmpresa, nova] }));
      },
      editarRegra: (id, updates) => set((s) => ({
        regrasEmpresa: s.regrasEmpresa.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),
      deletarRegra: (id) => set((s) => ({
        regrasEmpresa: s.regrasEmpresa.filter((r) => r.id !== id),
      })),
      toggleRegra: (id) => set((s) => ({
        regrasEmpresa: s.regrasEmpresa.map((r) => r.id === id ? { ...r, ativa: !r.ativa } : r),
      })),

      criarDesafio: (dados) => {
        const novo: Desafio = {
          ...dados,
          id: `desafio-${Date.now()}`,
          criadoEm: new Date().toISOString().split("T")[0],
          criadoPor: get().usuarioAtual?.id || "admin",
          ativo: true,
        };
        set((s) => ({ desafios: [...s.desafios, novo] }));
      },
      editarDesafio: (id, updates) => set((s) => ({
        desafios: s.desafios.map((d) => d.id === id ? { ...d, ...updates } : d),
      })),
      deletarDesafio: (id) => set((s) => ({
        desafios: s.desafios.filter((d) => d.id !== id),
        checkInsDesafio: s.checkInsDesafio.filter((ci) => ci.desafioId !== id),
      })),
      fazerCheckIn: (desafioId, data, nota) => {
        const userId = get().usuarioAtual?.id;
        if (!userId) return;
        const existing = get().checkInsDesafio.find(
          (ci) => ci.desafioId === desafioId && ci.colaboradorId === userId && ci.data === data
        );
        if (existing) return;
        const novo: CheckInDesafio = {
          id: `ci-${Date.now()}`,
          desafioId, colaboradorId: userId, data,
          hora: new Date().toTimeString().slice(0, 5),
          nota, reacoes: [],
        };
        set((s) => ({ checkInsDesafio: [...s.checkInsDesafio, novo] }));
      },
      desfazerCheckIn: (desafioId, data) => {
        const userId = get().usuarioAtual?.id;
        if (!userId) return;
        set((s) => ({
          checkInsDesafio: s.checkInsDesafio.filter(
            (ci) => !(ci.desafioId === desafioId && ci.colaboradorId === userId && ci.data === data)
          ),
        }));
      },
      reagirCheckIn: (checkInId, emoji) => {
        const userId = get().usuarioAtual?.id;
        if (!userId) return;
        set((s) => ({
          checkInsDesafio: s.checkInsDesafio.map((ci) => {
            if (ci.id !== checkInId) return ci;
            const existing = ci.reacoes.find((r) => r.colaboradorId === userId);
            if (existing) {
              if (existing.emoji === emoji) {
                return { ...ci, reacoes: ci.reacoes.filter((r) => r.colaboradorId !== userId) };
              }
              return { ...ci, reacoes: ci.reacoes.map((r) => r.colaboradorId === userId ? { ...r, emoji } : r) };
            }
            return { ...ci, reacoes: [...ci.reacoes, { colaboradorId: userId, emoji }] };
          }),
        }));
      },

      criarGastoOp: (dados) => {
        const novo: GastoOperacional = {
          ...dados,
          id: `gasto-${Date.now()}`,
          criadoEm: new Date().toISOString().split("T")[0],
        };
        set((s) => ({ gastosOperacionais: [...s.gastosOperacionais, novo] }));
      },
      editarGastoOp: (id, updates) => set((s) => ({
        gastosOperacionais: s.gastosOperacionais.map((g) => g.id === id ? { ...g, ...updates } : g),
      })),
      deletarGastoOp: (id) => set((s) => ({
        gastosOperacionais: s.gastosOperacionais.filter((g) => g.id !== id),
      })),
      toggleGastoOp: (id) => set((s) => ({
        gastosOperacionais: s.gastosOperacionais.map((g) => g.id === id ? { ...g, ativo: !g.ativo } : g),
      })),

      criarLinkRapido: (dados) => {
        const novo: LinkRapido = {
          ...dados,
          id: `link-${Date.now()}`,
          criadoEm: new Date().toISOString().split("T")[0],
        };
        set((s) => ({ linksRapidos: [...s.linksRapidos, novo] }));
      },
      editarLinkRapido: (id, updates) => set((s) => ({
        linksRapidos: s.linksRapidos.map((l) => l.id === id ? { ...l, ...updates } : l),
      })),
      deletarLinkRapido: (id) => set((s) => ({
        linksRapidos: s.linksRapidos.filter((l) => l.id !== id),
      })),

      abrirPomodoro: (tarefaId, titulo) => set({ pomodoroAberto: true, pomodoroTarefaId: tarefaId ?? null, pomodoroTarefaTitulo: titulo ?? "" }),
      fecharPomodoro: () => set({ pomodoroAberto: false, pomodoroTarefaId: null, pomodoroTarefaTitulo: "" }),

      criarEntregaSemanal: (colaboradorId, titulo) => {
        const nova: EntregaSemanal = {
          id: `es-${Date.now()}`,
          colaboradorId,
          semana: semanaAtualKey(),
          titulo: titulo.trim(),
          status: "pendente",
          criadoEm: new Date().toISOString(),
        };
        set((state) => ({ entregasSemanais: [...state.entregasSemanais, nova] }));
      },

      atualizarStatusEntrega: (entregaId, status, motivoTravado) => {
        set((state) => ({
          entregasSemanais: state.entregasSemanais.map((e) =>
            e.id !== entregaId ? e : {
              ...e,
              status,
              motivoTravado: motivoTravado ?? e.motivoTravado,
              concluidoEm: status === "entregue" ? new Date().toISOString() : e.concluidoEm,
            }
          ),
        }));
        if (status === "entregue") {
          const entrega = get().entregasSemanais.find((e) => e.id === entregaId);
          if (entrega) {
            get().ganharXP(entrega.colaboradorId, 40);
            get().addToast("+40 XP · Entrega da semana concluída!", "success", 40);
          }
        }
      },

      deletarEntregaSemanal: (entregaId) => {
        set((state) => ({ entregasSemanais: state.entregasSemanais.filter((e) => e.id !== entregaId) }));
      },

      salvarFormulario: (colaboradorId, dados) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : { ...c, formulario: { ...dados, preenchidoEm: new Date().toISOString() } }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated && get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
      },

      setSidebarColapsada: (v) => set({ sidebarColapsada: v }),
      setOnboardingConcluido: (v) => set({ onboardingConcluido: v }),

      criarColaborador: (dados) => {
        const id = `user-${Date.now()}`;
        const partes = dados.nome.trim().split(/\s+/);
        const initials = partes.map((w: string) => w[0] || "").join("").toUpperCase().slice(0, 2);
        const novoColab: Colaborador = {
          id,
          nome: dados.nome.trim(),
          cargo: dados.cargo.trim(),
          email: dados.email?.trim() || "",
          nivelAcesso: dados.nivelAcesso,
          avatar: initials,
          cor: dados.cor,
          xp: 0,
          streak: 0,
          horasDisponiveis: 8,
          habilidades: [],
          lojas: [],
          rotinas: [],
          expectativas: [],
          reconhecimentos: [],
        };
        set((state) => ({ colaboradores: [...state.colaboradores, novoColab] }));
      },
    }),
    {
      name: "painel-izzat-store",
      version: 20,
      migrate: (persisted: unknown, version: number) => {
        const s = persisted as Record<string, unknown>;
        if (version < 8) return { ...s, sidebarColapsada: false, onboardingConcluido: false };
        if (version < 9) return { ...s };
        if (version < 10) {
          const existentes = (s.colaboradores as Colaborador[] | undefined) || [];
          const merged = COLABORADORES.map((fresh) => {
            const cached = existentes.find((c) => c.id === fresh.id);
            if (!cached) return fresh;
            return { ...cached, email: fresh.email, telefone: fresh.telefone };
          });
          return { ...s, colaboradores: merged, filtroLuzAzul: false, corAcentoCustom: null, historicoAtividades: [] };
        }
        if (version < 11) {
          return { ...s, historicoAtividades: (s.historicoAtividades as unknown[] | undefined) || [] };
        }
        if (version < 12) {
          return { ...s, lojasCustom: [], lojasArquivadas: [] };
        }
        if (version < 13) {
          return { ...s, ferramentas: [] };
        }
        if (version < 14) {
          const cols = (s.colaboradores as Colaborador[] | undefined) || [];
          return { ...s, colaboradores: cols.map((c) => ({ ...c, registrosSono: c.registrosSono || [] })) };
        }
        if (version < 15) {
          return { ...s, regrasEmpresa: REGRAS_INICIAIS };
        }
        if (version < 16) {
          return { ...s };
        }
        if (version < 17) {
          return { ...s, desafios: [], checkInsDesafio: [] };
        }
        if (version < 18) {
          const regras = (s.regrasEmpresa as RegraEmpresa[] | undefined) || [];
          const jaExiste = regras.some((r) => r.id === "regra-003");
          if (!jaExiste) {
            const novaRegra: RegraEmpresa = {
              id: "regra-003",
              titulo: "Meta Ads: sempre usar post existente",
              descricao: "Nunca subir tráfego pago no Meta Ads a partir de arquivo do PC (upload direto). Sempre usar um post já publicado no Instagram ou Facebook para impulsionar — assim o anúncio aproveita o engajamento orgânico (curtidas, comentários, compartilhamentos) que o post já acumulou. Post sem engajamento = anúncio mais caro e menos eficaz.",
              categoria: "operacional",
              rigidez: "inflexivel",
              icone: "📣",
              ativa: true,
              criadaEm: "2026-06-15",
              criadaPor: "admin",
            };
            return { ...s, regrasEmpresa: [...regras, novaRegra] };
          }
          return { ...s };
        }
        if (version < 19) {
          return { ...s, gastosOperacionais: [] };
        }
        if (version < 20) {
          return { ...s, linksRapidos: [] };
        }
        return s;
      },
    }
  )
);
