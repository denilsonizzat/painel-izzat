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
  SocioGestor,
  COLABORADORES,
  TAREFAS_MOCK,
  HISTORICO_MOCK,
  ROTINAS_MOCK,
  REGRAS_INICIAIS,
  Prioridade,
  PERGUNTAS_PULSO,
  semanaAtualKey,
  Frequencia,
} from "./data";
import { calcularProximaOcorrencia, hojeStr } from "./recorrencia";
import { tocarSomNotificacao, tocarSomOnline } from "./som";
import { logoutSupabase, buscarColaboradoresSupabase, salvarColaboradorSupabase } from "./auth";
import { buscarRotinasSupabase, salvarRotinaSupabase, excluirRotinaSupabase } from "./rotinasSync";
import {
  buscarTarefasSupabase, salvarTarefaSupabase, excluirTarefaSupabase,
  buscarNotificacoesSupabase, salvarNotificacaoSupabase, excluirNotificacaoSupabase,
  registrarAtividadeSupabase,
  buscarEntregasSupabase, salvarEntregaSupabase, excluirEntregaSupabase,
  buscarDesafiosSupabase, salvarDesafioSupabase, excluirDesafioSupabase,
  buscarCheckInsSupabase, registrarCheckInSupabase, atualizarCheckInSupabase, excluirCheckInSupabase,
  buscarProdutosSupabase, salvarProdutoSupabase, excluirProdutoSupabase,
  buscarFerramentasSupabase, salvarFerramentaSupabase, excluirFerramentaSupabase,
  buscarGastosSupabase, salvarGastoSupabase, excluirGastoSupabase,
  buscarLojasCustomSupabase, salvarLojaCustomSupabase, excluirLojaCustomSupabase,
  buscarSociosSupabase, salvarSocioSupabase, excluirSocioSupabase,
  buscarEstadoSupabase, salvarEstadoSupabase,
} from "./cloudMappers";

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
  socios: SocioGestor[];

  login: (id: string) => void;
  entrarComSupabase: (colaborador: Colaborador) => void;
  carregarRotinasSupabase: () => Promise<void>;
  carregarDadosSupabase: () => Promise<void>;
  aplicarColaboradorRealtime: (colaborador: Colaborador) => void;
  logout: () => void;
  rotinas: Rotina[];
  marcarSubtarefa: (rotinaId: string, subtarefaId: string, valor: boolean) => void;
  concluirRotina: (rotinaId: string) => void;
  reabrirRotina: (rotinaId: string) => void;
  delegarRotina: (rotinaId: string, colaboradorId: string | undefined) => void;
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
  marcarNotificacaoNaoLida: (notifId: string) => void;
  arquivarNotificacao: (notifId: string) => void;
  excluirNotificacao: (notifId: string) => void;
  snoozeNotificacao: (notifId: string, minutos: number) => void;
  limparNotificacoesLidas: () => void;
  addToast: (message: string, type: ToastMsg["type"], xp?: number) => void;
  removeToast: (id: string) => void;
  criarRotina: (rotina: Omit<Rotina, "id">) => void;
  editarRotina: (rotinaId: string, updates: Partial<Rotina>) => void;
  deletarRotina: (rotinaId: string) => void;
  usarFichaReconhecimento: (doId: string) => boolean;
  setTrabalhando: (colaboradorId: string, trabalhando: string, foco: boolean) => void;
  registrarPulso: (userId: string, nota: number) => void;
  concluirMissao: (userId: string) => void;
  setTema: (temaId: string) => void;
  abrirPomodoro: (tarefaId?: string | null, titulo?: string) => void;
  fecharPomodoro: () => void;
  calcAberta: boolean;
  abrirCalc: () => void;
  fecharCalc: () => void;
  roasAberta: boolean;
  abrirROAS: () => void;
  fecharROAS: () => void;
  calendarioAberta: boolean;
  abrirCalendario: () => void;
  fecharCalendario: () => void;
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
  deletarLoja: (id: string) => void;
  arquivarLoja: (id: string) => void;
  restaurarLoja: (id: string) => void;
  criarSocio: (dados: Omit<SocioGestor, "id" | "criadoEm">) => void;
  editarSocio: (id: string, updates: Partial<SocioGestor>) => void;
  deletarSocio: (id: string) => void;
  produtos: Produto[];
  criarProduto: (dados: Omit<Produto, "id" | "dataCriacao" | "noAr">) => void;
  criarProdutoEmLojas: (dados: Omit<Produto, "id" | "dataCriacao" | "noAr" | "lojaId">, lojaIds: string[]) => void;
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
      rotinas: ROTINAS_MOCK,
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
      calcAberta: false,
      roasAberta: false,
      calendarioAberta: false,
      sidebarColapsada: false,
      onboardingConcluido: false,
      filtroLuzAzul: false,
      corAcentoCustom: null,
      historicoAtividades: [],
      lojasCustom: [],
      socios: [],
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

      entrarComSupabase: (colaborador) => {
        set((state) => ({
          usuarioAtual: colaborador,
          colaboradores: state.colaboradores.some((c) => c.id === colaborador.id)
            ? state.colaboradores.map((c) => (c.id === colaborador.id ? colaborador : c))
            : [...state.colaboradores, colaborador],
        }));
        get().carregarDadosSupabase();
      },

      carregarRotinasSupabase: async () => {
        const rotinas = await buscarRotinasSupabase();
        if (rotinas.length > 0) set({ rotinas });
      },

      // Chamado pelo listener Realtime — só aplica local, nunca reescreve no
      // Supabase (senão o eco da própria escrita vira um loop infinito).
      aplicarColaboradorRealtime: (colaborador) => {
        set((state) => ({
          colaboradores: state.colaboradores.some((c) => c.id === colaborador.id)
            ? state.colaboradores.map((c) => (c.id === colaborador.id ? colaborador : c))
            : [...state.colaboradores, colaborador],
          usuarioAtual: state.usuarioAtual?.id === colaborador.id ? colaborador : state.usuarioAtual,
        }));
      },

      carregarDadosSupabase: async () => {
        const [
          colaboradores, rotinas, tarefas, notificacoes, entregas, desafios, checkins,
          produtos, ferramentas, gastos, lojasCustom, socios,
          regrasEmpresa, linksRapidos, pulsoAtual, missoesSemana, fichasReconhecimento, lojasArquivadas,
        ] = await Promise.all([
          buscarColaboradoresSupabase(), buscarRotinasSupabase(), buscarTarefasSupabase(),
          buscarNotificacoesSupabase(), buscarEntregasSupabase(), buscarDesafiosSupabase(),
          buscarCheckInsSupabase(), buscarProdutosSupabase(), buscarFerramentasSupabase(),
          buscarGastosSupabase(), buscarLojasCustomSupabase(), buscarSociosSupabase(),
          buscarEstadoSupabase<RegraEmpresa[]>("regrasEmpresa"),
          buscarEstadoSupabase<LinkRapido[]>("linksRapidos"),
          buscarEstadoSupabase<{ semana: string; notas: Record<string, number> }>("pulsoAtual"),
          buscarEstadoSupabase<Record<string, { semana: string; concluida: boolean }>>("missoesSemana"),
          buscarEstadoSupabase<Record<string, number>>("fichasReconhecimento"),
          buscarEstadoSupabase<string[]>("lojasArquivadas"),
        ]);
        set((state) => ({
          colaboradores: colaboradores.length > 0 ? colaboradores : state.colaboradores,
          rotinas: rotinas.length > 0 ? rotinas : state.rotinas,
          tarefas: tarefas.length > 0 ? tarefas : state.tarefas,
          notificacoesInApp: notificacoes.length > 0 ? notificacoes : state.notificacoesInApp,
          entregasSemanais: entregas,
          desafios,
          checkInsDesafio: checkins,
          produtos,
          ferramentas,
          gastosOperacionais: gastos,
          lojasCustom,
          socios,
          regrasEmpresa: regrasEmpresa ?? state.regrasEmpresa,
          linksRapidos: linksRapidos ?? state.linksRapidos,
          pulsoAtual: pulsoAtual ?? state.pulsoAtual,
          missoesSemana: missoesSemana ?? state.missoesSemana,
          fichasReconhecimento: fichasReconhecimento ?? state.fichasReconhecimento,
          lojasArquivadas: lojasArquivadas ?? state.lojasArquivadas,
          usuarioAtual: state.usuarioAtual && colaboradores.length > 0
            ? colaboradores.find((c) => c.id === state.usuarioAtual!.id) ?? state.usuarioAtual
            : state.usuarioAtual,
        }));
      },

      logout: () => {
        logoutSupabase();
        set({ usuarioAtual: null });
      },

      ganharXP: (colaboradorId, quantidade) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : { ...c, xp: (c.xp || 0) + quantidade }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated) {
          if (get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
          salvarColaboradorSupabase(updated);
        }
      },

      // Marca subtarefa de uma rotina (lista top-level). Quem ganha XP é o
      // dono da subtarefa (se houver) ou o usuário logado.
      marcarSubtarefa: (rotinaId, subtarefaId, valor) => {
        const rotina = get().rotinas.find((r) => r.id === rotinaId);
        const sub = rotina?.subtarefas.find((s) => s.id === subtarefaId);
        const quem = sub?.colaboradorId || rotina?.colaboradorId || get().usuarioAtual?.id;

        let atualizada: Rotina | undefined;
        set((state) => ({
          rotinas: state.rotinas.map((r) => {
            if (r.id !== rotinaId) return r;
            const novasSub = r.subtarefas.map((s) =>
              s.id === subtarefaId ? { ...s, concluida: valor } : s
            );
            atualizada = { ...r, subtarefas: novasSub, concluida: novasSub.every((s) => s.concluida) };
            return atualizada;
          }),
        }));
        if (atualizada) salvarRotinaSupabase(atualizada);

        if (valor && quem) {
          get().ganharXP(quem, 10);
          get().addToast("+10 XP · subtarefa concluida!", "success", 10);
          if (sub && rotina) {
            get().adicionarAtividadeEntry({
              colaboradorId: quem,
              tipo: "rotina_concluida",
              descricao: sub.titulo + " — " + rotina.titulo,
              hora: new Date().toTimeString().slice(0, 5),
              data: hojeStr(),
              xp: 10,
            });
          }
        }
      },

      // Conclui rotina (lista top-level) e avança a recorrência para o próximo
      // ciclo automaticamente. XP vai para o responsável (ou quem concluiu).
      concluirRotina: (rotinaId) => {
        const rotina = get().rotinas.find((r) => r.id === rotinaId);
        if (!rotina) return;
        const jaConcluidaHoje = rotina.ultimaConclusao === hojeStr();
        const quem = rotina.colaboradorId || get().usuarioAtual?.id;

        let atualizada: Rotina | undefined;
        set((state) => ({
          rotinas: state.rotinas.map((r) => {
            if (r.id !== rotinaId) return r;
            atualizada = {
              ...r,
              concluida: true,
              ultimaConclusao: hojeStr(),
              proximaOcorrencia: calcularProximaOcorrencia(r.frequencia, hojeStr()),
              subtarefas: r.subtarefas.map((s) => ({ ...s, concluida: true })),
            };
            return atualizada;
          }),
        }));
        if (atualizada) salvarRotinaSupabase(atualizada);

        if (!jaConcluidaHoje && quem) {
          const bonus = Math.random() < 0.10;
          const xp = bonus ? 50 : 25;
          get().ganharXP(quem, xp);
          const msg = bonus ? "+50 XP · BONUS 2x! Rotina concluida!" : "+25 XP · rotina concluida!";
          get().addToast(msg, "success", xp);
          get().adicionarAtividadeEntry({
            colaboradorId: quem,
            tipo: "rotina_concluida",
            descricao: "Rotina concluida: " + rotina.titulo,
            hora: new Date().toTimeString().slice(0, 5),
            data: hojeStr(),
            xp,
          });
        }
      },

      // Reabre rotina concluída: volta a próxima ocorrência para hoje (vence de novo).
      reabrirRotina: (rotinaId) => {
        let atualizada: Rotina | undefined;
        set((state) => ({
          rotinas: state.rotinas.map((r) => {
            if (r.id !== rotinaId) return r;
            atualizada = {
              ...r,
              concluida: false,
              ultimaConclusao: undefined,
              proximaOcorrencia: hojeStr(),
              subtarefas: r.subtarefas.map((s) => ({ ...s, concluida: false })),
            };
            return atualizada;
          }),
        }));
        if (atualizada) salvarRotinaSupabase(atualizada);
      },

      // Define (ou remove) o responsável de uma rotina. undefined = vai para Vagas.
      delegarRotina: (rotinaId, colaboradorId) => {
        let atualizada: Rotina | undefined;
        set((state) => ({
          rotinas: state.rotinas.map((r) => {
            if (r.id !== rotinaId) return r;
            atualizada = { ...r, colaboradorId, vagaTemporaria: colaboradorId ? false : r.vagaTemporaria };
            return atualizada;
          }),
        }));
        if (atualizada) salvarRotinaSupabase(atualizada);
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
        if (updated) {
          if (get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
          salvarColaboradorSupabase(updated);
        }
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
        const mudadas: Tarefa[] = [];
        set((state) => ({
          tarefas: state.tarefas.map((t) => {
            if (t.dataLimite && t.dataLimite < hoje && !FINAIS.includes(t.status as typeof FINAIS[number])) {
              const atualizada = { ...t, status: "atrasada" as const };
              mudadas.push(atualizada);
              return atualizada;
            }
            return t;
          }),
        }));
        mudadas.forEach(salvarTarefaSupabase);
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
        const tarefaAtualizada = get().tarefas.find((t) => t.id === tarefaId);
        if (tarefaAtualizada) salvarTarefaSupabase(tarefaAtualizada);
      },

      registrarCheckIn: (colaboradorId) => {
        const hoje = new Date().toISOString().split("T")[0];
        const colab = get().colaboradores.find((c) => c.id === colaboradorId);
        if (!colab || colab.ultimoCheckIn === hoje) return;

        const minhasRotinas = get().rotinas.filter((r) => r.colaboradorId === colaboradorId && r.ativa !== false);
        const totalSubs = minhasRotinas.reduce((a, r) => a + r.subtarefas.length, 0);
        const feitas = minhasRotinas.reduce((a, r) => a + r.subtarefas.filter((s) => s.concluida).length, 0);
        const pctRotinas = totalSubs === 0 ? (minhasRotinas.every((r) => r.concluida) ? 100 : 0) : Math.round((feitas / totalSubs) * 100);
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
        if (updated) {
          if (get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
          salvarColaboradorSupabase(updated);
        }
      },

      criarTarefa: (tarefa) => {
        const nova: Tarefa = {
          ...tarefa,
          id: `t${Date.now()}`,
          dataCriacao: new Date().toISOString().split("T")[0],
          comentarios: [],
        };
        set((state) => ({ tarefas: [nova, ...state.tarefas] }));
        salvarTarefaSupabase(nova);
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
        const tarefaSync = get().tarefas.find((t) => t.id === tarefaId);
        if (tarefaSync) salvarTarefaSupabase(tarefaSync);
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
        const tarefaAprovada = get().tarefas.find((t) => t.id === tarefaId);
        if (tarefaAprovada) salvarTarefaSupabase(tarefaAprovada);
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
        const tarefaSub = get().tarefas.find((t) => t.id === tarefaId);
        if (tarefaSub) salvarTarefaSupabase(tarefaSub);
        if (concluida) {
          get().ganharXP(colaboradorId, 10);
          get().addToast("+10 XP · subtarefa concluída!", "success", 10);
        }
      },

      resetarRotinas: () => set({ rotinas: ROTINAS_MOCK }),

      setStatusOnline: (colaboradorId, ativo, ate, proximoDia) => {
        const jaEstavaOnline = get().colaboradores.find((c) => c.id === colaboradorId)?.statusOnline?.ativo ?? false;
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
        if (updated) {
          if (get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
          salvarColaboradorSupabase(updated);
        }

        // Avisa o time quando alguém ENTRA online (transição offline→online).
        // (Cross-device passa a funcionar de verdade após o deploy com realtime.)
        if (ativo && !jaEstavaOnline) {
          const nome = updated?.nome.split(" ")[0] ?? "Alguém";
          const ateTxt = ate ? ` · até ${ate}${proximoDia ? " (+1 dia)" : ""}` : "";
          get().colaboradores
            .filter((c) => c.id !== colaboradorId)
            .forEach((c) => get().adicionarNotificacaoInApp({
              paraId: c.id,
              tipo: "online",
              titulo: `${nome} está online`,
              corpo: `${nome} ativou presença${ateTxt}.`,
              href: `/equipe/${colaboradorId}`,
            }));
          // Som marcante de "online" (toca uma vez, para quem está usando agora).
          tocarSomOnline();
        }
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
        registrarAtividadeSupabase(nova);
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
          id: `n${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
          lida: false,
          criadaEm: new Date().toISOString(),
        };
        set((state) => ({ notificacoesInApp: [nova, ...state.notificacoesInApp].slice(0, 50) }));
        salvarNotificacaoSupabase(nova);
        // Som: só toca para o destinatário logado. "online" tem som próprio (tocado em setStatusOnline).
        if (notif.paraId === get().usuarioAtual?.id && notif.tipo !== "online") {
          tocarSomNotificacao();
        }
      },

      marcarNotificacaoLida: (notifId) => {
        set((state) => ({
          notificacoesInApp: state.notificacoesInApp.map((n) =>
            n.id === notifId ? { ...n, lida: true } : n
          ),
        }));
        const n = get().notificacoesInApp.find((x) => x.id === notifId);
        if (n) salvarNotificacaoSupabase(n);
      },

      marcarNotificacaoNaoLida: (notifId) => {
        set((state) => ({
          notificacoesInApp: state.notificacoesInApp.map((n) =>
            n.id === notifId ? { ...n, lida: false, arquivada: false } : n
          ),
        }));
        const n = get().notificacoesInApp.find((x) => x.id === notifId);
        if (n) salvarNotificacaoSupabase(n);
      },

      arquivarNotificacao: (notifId) => {
        set((state) => ({
          notificacoesInApp: state.notificacoesInApp.map((n) =>
            n.id === notifId ? { ...n, lida: true, arquivada: true } : n
          ),
        }));
        const n = get().notificacoesInApp.find((x) => x.id === notifId);
        if (n) salvarNotificacaoSupabase(n);
      },

      excluirNotificacao: (notifId) => {
        set((state) => ({
          notificacoesInApp: state.notificacoesInApp.filter((n) => n.id !== notifId),
        }));
        excluirNotificacaoSupabase(notifId);
      },

      snoozeNotificacao: (notifId, minutos) => {
        const until = new Date(Date.now() + minutos * 60 * 1000).toISOString();
        set((state) => ({
          notificacoesInApp: state.notificacoesInApp.map((n) =>
            n.id === notifId ? { ...n, lida: true, snoozedUntil: until } : n
          ),
        }));
        const nSnooze = get().notificacoesInApp.find((x) => x.id === notifId);
        if (nSnooze) salvarNotificacaoSupabase(nSnooze);
        setTimeout(() => {
          set((state) => ({
            notificacoesInApp: state.notificacoesInApp.map((n) =>
              n.id === notifId ? { ...n, lida: false, snoozedUntil: undefined } : n
            ),
          }));
          const nDone = get().notificacoesInApp.find((x) => x.id === notifId);
          if (nDone) salvarNotificacaoSupabase(nDone);
        }, minutos * 60 * 1000);
      },

      limparNotificacoesLidas: () => {
        const idsLidos = get().notificacoesInApp.filter((n) => n.lida).map((n) => n.id);
        set((state) => ({
          notificacoesInApp: state.notificacoesInApp.filter((n) => !n.lida),
        }));
        idsLidos.forEach(excluirNotificacaoSupabase);
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

      criarRotina: (rotina) => {
        // Nasce com recorrência: começa devida na data de início (default hoje).
        const inicio = rotina.dataInicio || hojeStr();
        const novaRotina: Rotina = {
          ...rotina,
          id: `rot-${Date.now()}`,
          dataInicio: inicio,
          proximaOcorrencia: rotina.proximaOcorrencia || inicio,
        };
        set((state) => ({ rotinas: [...state.rotinas, novaRotina] }));
        salvarRotinaSupabase(novaRotina);
      },

      editarRotina: (rotinaId, updates) => {
        let atualizada: Rotina | undefined;
        set((state) => ({
          rotinas: state.rotinas.map((r) => {
            if (r.id !== rotinaId) return r;
            atualizada = { ...r, ...updates };
            return atualizada;
          }),
        }));
        if (atualizada) salvarRotinaSupabase(atualizada);
      },

      deletarRotina: (rotinaId) => {
        set((state) => ({ rotinas: state.rotinas.filter((r) => r.id !== rotinaId) }));
        excluirRotinaSupabase(rotinaId);
      },

      usarFichaReconhecimento: (doId) => {
        const fichas = get().fichasReconhecimento;
        const disponiveis = fichas[doId] !== undefined ? fichas[doId] : 3;
        if (disponiveis <= 0) return false;
        set((state) => ({
          fichasReconhecimento: { ...state.fichasReconhecimento, [doId]: disponiveis - 1 },
        }));
        salvarEstadoSupabase("fichasReconhecimento", get().fichasReconhecimento);
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
        if (updated) {
          if (get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
          salvarColaboradorSupabase(updated);
        }
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
        salvarEstadoSupabase("pulsoAtual", get().pulsoAtual);
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
        salvarEstadoSupabase("missoesSemana", get().missoesSemana);
        get().ganharXP(userId, 100);
        get().addToast("+100 XP · Missao da semana concluida!", "success", 100);
      },

      setTema: (temaId) => set({ temaId }),
      setFiltroLuzAzul: (v) => set({ filtroLuzAzul: v }),
      setCorAcentoCustom: (cor) => set({ corAcentoCustom: cor }),
      setTelefone: (colaboradorId, telefone) => {
        set((s) => ({ colaboradores: s.colaboradores.map((c) => c.id === colaboradorId ? { ...c, telefone } : c) }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated) salvarColaboradorSupabase(updated);
      },
      setSalario: (colaboradorId, salario) => {
        set((s) => ({ colaboradores: s.colaboradores.map((c) => c.id === colaboradorId ? { ...c, salario } : c) }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated) salvarColaboradorSupabase(updated);
      },
      setGoogleChatLink: (colaboradorId, link) => {
        set((s) => ({ colaboradores: s.colaboradores.map((c) => c.id === colaboradorId ? { ...c, googleChatLink: link } : c) }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated) salvarColaboradorSupabase(updated);
      },
      setDataNascimento: (colaboradorId, data) => {
        set((s) => ({ colaboradores: s.colaboradores.map((c) => c.id === colaboradorId ? { ...c, dataNascimento: data } : c) }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated) salvarColaboradorSupabase(updated);
      },
      marcarVisualizacaoTarefa: (tarefaId, colaboradorId) => set((s) => ({
        tarefas: s.tarefas.map((t) => t.id === tarefaId
          ? { ...t, visualizacoes: { ...(t.visualizacoes || {}), [colaboradorId]: new Date().toISOString() } }
          : t),
      })),
      adicionarMiniTarefa: (tarefaId, colaboradorId, titulo) => {
        set((s) => ({
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
        }));
        const t = get().tarefas.find((x) => x.id === tarefaId);
        if (t) salvarTarefaSupabase(t);
      },
      toggleMiniTarefa: (tarefaId, miniId, concluida) => {
        set((s) => ({
          tarefas: s.tarefas.map((t) => t.id === tarefaId ? {
            ...t,
            miniTarefas: (t.miniTarefas || []).map((m) => m.id === miniId ? { ...m, concluida } : m),
          } : t),
        }));
        const t = get().tarefas.find((x) => x.id === tarefaId);
        if (t) salvarTarefaSupabase(t);
      },
      deletarMiniTarefa: (tarefaId, miniId) => {
        set((s) => ({
          tarefas: s.tarefas.map((t) => t.id === tarefaId ? {
            ...t,
            miniTarefas: (t.miniTarefas || []).filter((m) => m.id !== miniId),
          } : t),
        }));
        const t = get().tarefas.find((x) => x.id === tarefaId);
        if (t) salvarTarefaSupabase(t);
      },

      criarLoja: (dados) => {
        const nova: Loja = { ...dados, id: `loja-custom-${Date.now()}` };
        set((s) => ({ lojasCustom: [...s.lojasCustom, nova] }));
        salvarLojaCustomSupabase(nova);
      },
      editarLoja: (id, updates) => {
        set((s) => ({
          lojasCustom: s.lojasCustom.map((l) => l.id === id ? { ...l, ...updates } : l),
        }));
        const l = get().lojasCustom.find((x) => x.id === id);
        if (l) salvarLojaCustomSupabase(l);
      },
      deletarLoja: (id) => {
        const sociosOrfaos = get().socios.filter((so) => so.lojaId === id);
        set((s) => ({
          lojasCustom: s.lojasCustom.filter((l) => l.id !== id),
          socios: s.socios.filter((so) => so.lojaId !== id), // remove sócios órfãos da loja excluída
        }));
        excluirLojaCustomSupabase(id);
        sociosOrfaos.forEach((so) => excluirSocioSupabase(so.id));
      },
      arquivarLoja: (id) => {
        set((s) => ({ lojasArquivadas: [...s.lojasArquivadas.filter((i) => i !== id), id] }));
        salvarEstadoSupabase("lojasArquivadas", get().lojasArquivadas);
      },
      restaurarLoja: (id) => {
        set((s) => ({ lojasArquivadas: s.lojasArquivadas.filter((i) => i !== id) }));
        salvarEstadoSupabase("lojasArquivadas", get().lojasArquivadas);
      },
      criarSocio: (dados) => {
        const novo: SocioGestor = { ...dados, id: `socio-${Date.now()}`, criadoEm: new Date().toISOString().split("T")[0] };
        set((s) => ({ socios: [...s.socios, novo] }));
        salvarSocioSupabase(novo);
      },
      editarSocio: (id, updates) => {
        set((s) => ({ socios: s.socios.map((so) => so.id === id ? { ...so, ...updates } : so) }));
        const so = get().socios.find((x) => x.id === id);
        if (so) salvarSocioSupabase(so);
      },
      deletarSocio: (id) => {
        set((s) => ({ socios: s.socios.filter((so) => so.id !== id) }));
        excluirSocioSupabase(id);
      },

      criarProduto: (dados) => {
        const novo: Produto = { ...dados, id: `prod-${Date.now()}`, dataCriacao: new Date().toISOString().split("T")[0], noAr: false };
        set((s) => ({ produtos: [...s.produtos, novo] }));
        salvarProdutoSupabase(novo);
      },
      // Fluxo "direto": cria uma cópia independente do produto em cada loja escolhida.
      // Cada cópia tem status próprio (em teste/aprovado/reprovado por loja).
      criarProdutoEmLojas: (dados, lojaIds) => {
        const data = new Date().toISOString().split("T")[0];
        const grupoId = `grp-${Date.now()}`;
        const novos: Produto[] = lojaIds.map((lojaId, i) => ({
          ...dados, lojaId, grupoId,
          id: `prod-${Date.now()}-${i}`,
          dataCriacao: data, noAr: false, emTeste: true,
        }));
        set((s) => ({ produtos: [...s.produtos, ...novos] }));
        novos.forEach(salvarProdutoSupabase);
      },
      editarProduto: (id, updates) => {
        set((s) => ({
          produtos: s.produtos.map((p) => p.id === id ? { ...p, ...updates } : p),
        }));
        const p = get().produtos.find((x) => x.id === id);
        if (p) salvarProdutoSupabase(p);
      },
      deletarProduto: (id) => {
        set((s) => ({ produtos: s.produtos.filter((p) => p.id !== id) }));
        excluirProdutoSupabase(id);
      },
      toggleProdutoNoAr: (id) => {
        const { produtos } = get();
        const p = produtos.find((x) => x.id === id);
        if (!p) return;
        set((s) => ({ produtos: s.produtos.map((x) => x.id === id ? { ...x, noAr: !x.noAr } : x) }));
        const atualizado = get().produtos.find((x) => x.id === id);
        if (atualizado) salvarProdutoSupabase(atualizado);
      },
      validarProduto: (id) => {
        set((s) => ({
          produtos: s.produtos.map((p) => p.id === id ? { ...p, validado: true, reprovado: false } : p),
        }));
        const p = get().produtos.find((x) => x.id === id);
        if (p) salvarProdutoSupabase(p);
      },
      reprovarProduto: (id) => {
        set((s) => ({
          produtos: s.produtos.map((p) => p.id === id ? { ...p, reprovado: true, validado: false, noAr: false } : p),
        }));
        const p = get().produtos.find((x) => x.id === id);
        if (p) salvarProdutoSupabase(p);
      },
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
        const origemAtualizada = get().produtos.find((p) => p.id === id);
        if (origemAtualizada) salvarProdutoSupabase(origemAtualizada);
        copias.forEach(salvarProdutoSupabase);
      },

      criarFerramenta: (dados) => {
        const nova: Ferramenta = { ...dados, id: `ferr-${Date.now()}` };
        set((s) => ({ ferramentas: [...s.ferramentas, nova] }));
        salvarFerramentaSupabase(nova);
      },
      editarFerramenta: (id, updates) => {
        set((s) => ({
          ferramentas: s.ferramentas.map((f) => f.id === id ? { ...f, ...updates } : f),
        }));
        const f = get().ferramentas.find((x) => x.id === id);
        if (f) salvarFerramentaSupabase(f);
      },
      deletarFerramenta: (id) => {
        set((s) => ({
          ferramentas: s.ferramentas.filter((f) => f.id !== id),
        }));
        excluirFerramentaSupabase(id);
      },
      vincularFerramenta: (ferramentaId, colaboradorId) => {
        set((s) => ({
          ferramentas: s.ferramentas.map((f) =>
            f.id !== ferramentaId ? f :
            f.colaboradoresIds.includes(colaboradorId) ? f :
            { ...f, colaboradoresIds: [...f.colaboradoresIds, colaboradorId] }
          ),
        }));
        const f = get().ferramentas.find((x) => x.id === ferramentaId);
        if (f) salvarFerramentaSupabase(f);
      },
      desvincularFerramenta: (ferramentaId, colaboradorId) => {
        set((s) => ({
          ferramentas: s.ferramentas.map((f) =>
            f.id !== ferramentaId ? f :
            { ...f, colaboradoresIds: f.colaboradoresIds.filter((id) => id !== colaboradorId) }
          ),
        }));
        const f = get().ferramentas.find((x) => x.id === ferramentaId);
        if (f) salvarFerramentaSupabase(f);
      },

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
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated) salvarColaboradorSupabase(updated);
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
        salvarEstadoSupabase("regrasEmpresa", get().regrasEmpresa);
      },
      editarRegra: (id, updates) => {
        set((s) => ({
          regrasEmpresa: s.regrasEmpresa.map((r) => r.id === id ? { ...r, ...updates } : r),
        }));
        salvarEstadoSupabase("regrasEmpresa", get().regrasEmpresa);
      },
      deletarRegra: (id) => {
        set((s) => ({
          regrasEmpresa: s.regrasEmpresa.filter((r) => r.id !== id),
        }));
        salvarEstadoSupabase("regrasEmpresa", get().regrasEmpresa);
      },
      toggleRegra: (id) => {
        set((s) => ({
          regrasEmpresa: s.regrasEmpresa.map((r) => r.id === id ? { ...r, ativa: !r.ativa } : r),
        }));
        salvarEstadoSupabase("regrasEmpresa", get().regrasEmpresa);
      },

      criarDesafio: (dados) => {
        const novo: Desafio = {
          ...dados,
          id: `desafio-${Date.now()}`,
          criadoEm: new Date().toISOString().split("T")[0],
          criadoPor: get().usuarioAtual?.id || "admin",
          ativo: true,
        };
        set((s) => ({ desafios: [...s.desafios, novo] }));
        salvarDesafioSupabase(novo);
      },
      editarDesafio: (id, updates) => {
        set((s) => ({
          desafios: s.desafios.map((d) => d.id === id ? { ...d, ...updates } : d),
        }));
        const d = get().desafios.find((x) => x.id === id);
        if (d) salvarDesafioSupabase(d);
      },
      deletarDesafio: (id) => {
        set((s) => ({
          desafios: s.desafios.filter((d) => d.id !== id),
          checkInsDesafio: s.checkInsDesafio.filter((ci) => ci.desafioId !== id),
        }));
        excluirDesafioSupabase(id);
      },
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
        registrarCheckInSupabase(novo);
      },
      desfazerCheckIn: (desafioId, data) => {
        const userId = get().usuarioAtual?.id;
        if (!userId) return;
        set((s) => ({
          checkInsDesafio: s.checkInsDesafio.filter(
            (ci) => !(ci.desafioId === desafioId && ci.colaboradorId === userId && ci.data === data)
          ),
        }));
        excluirCheckInSupabase(desafioId, userId, data);
      },
      reagirCheckIn: (checkInId, emoji) => {
        const userId = get().usuarioAtual?.id;
        if (!userId) return;
        let atualizado: CheckInDesafio | undefined;
        set((s) => ({
          checkInsDesafio: s.checkInsDesafio.map((ci) => {
            if (ci.id !== checkInId) return ci;
            const existing = ci.reacoes.find((r) => r.colaboradorId === userId);
            if (existing) {
              atualizado = existing.emoji === emoji
                ? { ...ci, reacoes: ci.reacoes.filter((r) => r.colaboradorId !== userId) }
                : { ...ci, reacoes: ci.reacoes.map((r) => r.colaboradorId === userId ? { ...r, emoji } : r) };
            } else {
              atualizado = { ...ci, reacoes: [...ci.reacoes, { colaboradorId: userId, emoji }] };
            }
            return atualizado;
          }),
        }));
        if (atualizado) atualizarCheckInSupabase(atualizado);
      },

      criarGastoOp: (dados) => {
        const novo: GastoOperacional = {
          ...dados,
          id: `gasto-${Date.now()}`,
          criadoEm: new Date().toISOString().split("T")[0],
        };
        set((s) => ({ gastosOperacionais: [...s.gastosOperacionais, novo] }));
        salvarGastoSupabase(novo);
      },
      editarGastoOp: (id, updates) => {
        set((s) => ({
          gastosOperacionais: s.gastosOperacionais.map((g) => g.id === id ? { ...g, ...updates } : g),
        }));
        const g = get().gastosOperacionais.find((x) => x.id === id);
        if (g) salvarGastoSupabase(g);
      },
      deletarGastoOp: (id) => {
        set((s) => ({
          gastosOperacionais: s.gastosOperacionais.filter((g) => g.id !== id),
        }));
        excluirGastoSupabase(id);
      },
      toggleGastoOp: (id) => {
        set((s) => ({
          gastosOperacionais: s.gastosOperacionais.map((g) => g.id === id ? { ...g, ativo: !g.ativo } : g),
        }));
        const g = get().gastosOperacionais.find((x) => x.id === id);
        if (g) salvarGastoSupabase(g);
      },

      criarLinkRapido: (dados) => {
        const novo: LinkRapido = {
          ...dados,
          id: `link-${Date.now()}`,
          criadoEm: new Date().toISOString().split("T")[0],
        };
        set((s) => ({ linksRapidos: [...s.linksRapidos, novo] }));
        salvarEstadoSupabase("linksRapidos", get().linksRapidos);
      },
      editarLinkRapido: (id, updates) => {
        set((s) => ({
          linksRapidos: s.linksRapidos.map((l) => l.id === id ? { ...l, ...updates } : l),
        }));
        salvarEstadoSupabase("linksRapidos", get().linksRapidos);
      },
      deletarLinkRapido: (id) => {
        set((s) => ({
          linksRapidos: s.linksRapidos.filter((l) => l.id !== id),
        }));
        salvarEstadoSupabase("linksRapidos", get().linksRapidos);
      },

      abrirPomodoro: (tarefaId, titulo) => set({ pomodoroAberto: true, pomodoroTarefaId: tarefaId ?? null, pomodoroTarefaTitulo: titulo ?? "" }),
      fecharPomodoro: () => set({ pomodoroAberto: false, pomodoroTarefaId: null, pomodoroTarefaTitulo: "" }),
      abrirCalc: () => set({ calcAberta: true }),
      fecharCalc: () => set({ calcAberta: false }),
      abrirROAS: () => set({ roasAberta: true }),
      fecharROAS: () => set({ roasAberta: false }),
      abrirCalendario: () => set({ calendarioAberta: true }),
      fecharCalendario: () => set({ calendarioAberta: false }),

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
        salvarEntregaSupabase(nova);
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
        const entregaSync = get().entregasSemanais.find((e) => e.id === entregaId);
        if (entregaSync) salvarEntregaSupabase(entregaSync);
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
        excluirEntregaSupabase(entregaId);
      },

      salvarFormulario: (colaboradorId, dados) => {
        set((state) => ({
          colaboradores: state.colaboradores.map((c) =>
            c.id !== colaboradorId ? c : { ...c, formulario: { ...dados, preenchidoEm: new Date().toISOString() } }
          ),
        }));
        const updated = get().colaboradores.find((c) => c.id === colaboradorId);
        if (updated) {
          if (get().usuarioAtual?.id === colaboradorId) set({ usuarioAtual: updated });
          salvarColaboradorSupabase(updated);
        }
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
        salvarColaboradorSupabase(novoColab);
      },
    }),
    {
      name: "painel-izzat-store",
      version: 22,
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
        if (version < 21) {
          // Recorrência automática: dá data inicial às rotinas existentes.
          // Todas começam "devidas hoje" → aparecem na sub-aba Diária.
          const hoje = hojeStr();
          const cols = (s.colaboradores as Colaborador[] | undefined) || [];
          return {
            ...s,
            colaboradores: cols.map((c) => ({
              ...c,
              rotinas: (c.rotinas || []).map((r) => ({
                ...r,
                dataInicio: r.dataInicio || hoje,
                proximaOcorrencia: r.proximaOcorrencia || hoje,
              })),
            })),
          };
        }
        if (version < 22) {
          // Rotinas saem de dentro do colaborador e viram lista própria (top-level),
          // ligadas por colaboradorId. Assim sobrevivem à exclusão da pessoa.
          const hoje = hojeStr();
          const cols = (s.colaboradores as Colaborador[] | undefined) || [];
          const jaTemTopLevel = Array.isArray(s.rotinas) && (s.rotinas as Rotina[]).length > 0;
          const achatadas: Rotina[] = jaTemTopLevel
            ? (s.rotinas as Rotina[])
            : cols.flatMap((c) =>
                (c.rotinas || []).map((r) => ({
                  ...r,
                  colaboradorId: r.colaboradorId || c.id,
                  dataInicio: r.dataInicio || hoje,
                  proximaOcorrencia: r.proximaOcorrencia || hoje,
                }))
              );
          return {
            ...s,
            rotinas: achatadas,
            colaboradores: cols.map((c) => ({ ...c, rotinas: [] })),
          };
        }
        return s;
      },
    }
  )
);
