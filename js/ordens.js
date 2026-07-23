import "./auth-guard.js";

import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";
/* =========================================
   ORDENS DO FIRESTORE
========================================= */

let ordens = [];

/* =========================================
   CONFIGURAÇÕES
========================================= */

const statusConfig = {
  "nova-solicitacao": {
    nome: "Nova solicitação",
    classe: "status--nova-solicitacao",
  },

  "em-analise": {
    nome: "Em análise",
    classe: "status--em-analise",
  },

  "aguardando-confirmacao": {
    nome: "Aguardando confirmação",
    classe: "status--aguardando-confirmacao",
  },

  agendada: {
    nome: "Agendada",
    classe: "status--agendada",
  },

  concluida: {
    nome: "Concluída",
    classe: "status--concluida",
  },

  recusada: {
    nome: "Recusada",
    classe: "status--recusada",
  },

  cancelada: {
    nome: "Cancelada",
    classe: "status--cancelada",
  },
};

const categoriaConfig = {
  hidraulica: {
    nome: "Hidráulica",
    icone: `
      <path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z"></path>
    `,
  },

  eletrica: {
    nome: "Elétrica",
    icone: `
      <path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z"></path>
    `,
  },

  pintura: {
    nome: "Pintura",
    icone: `
      <path d="M4 4h11v5H4z"></path>
      <path d="M15 6h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-5"></path>
      <path d="M13 9v12"></path>
    `,
  },

  alvenaria: {
    nome: "Alvenaria",
    icone: `
      <path d="M3 5h8v5H3z"></path>
      <path d="M13 5h8v5h-8z"></path>
      <path d="M3 14h5v5H3z"></path>
      <path d="M10 14h11v5H10z"></path>
    `,
  },

  instalacoes: {
    nome: "Instalações",
    icone: `
      <path d="m14 6 4-4 4 4-4 4"></path>
      <path d="m16 8-9.5 9.5a2.1 2.1 0 0 1-3-3L13 5"></path>
    `,
  },

  "manutencao-geral": {
    nome: "Manutenção geral",
    icone: `
      <path d="M4 20h16"></path>
      <path d="M7 20V9l5-5 5 5v11"></path>
      <path d="M10 20v-6h4v6"></path>
    `,
  },

  vistoria: {
    nome: "Vistoria técnica",
    icone: `
      <path d="M9 5h6"></path>
      <path d="M9 3h6v4H9z"></path>
      <path d="M6 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1"></path>
      <path d="m8 14 2 2 5-5"></path>
    `,
  },
};

const prioridadeConfig = {
  baixa: {
    nome: "Baixa",
    classe: "priority--baixa",
  },

  normal: {
    nome: "Normal",
    classe: "priority--normal",
  },

  alta: {
    nome: "Alta",
    classe: "priority--alta",
  },

  urgente: {
    nome: "Urgente",
    classe: "priority--urgente",
  },
};

const periodoConfig = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  horario: "Horário específico",
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const body = document.body;

const pageTitle = document.getElementById("page-title");
const profileBadge = document.getElementById("profile-badge");
const introTitle = document.getElementById("intro-title");
const introDescription = document.getElementById("intro-description");
const newRequestButton = document.getElementById("new-request-button");
const requestsBackButton = document.querySelector(
  ".requests-header .header-button",
);

const adminFilters = document.querySelectorAll(".admin-filter");

const summaryTotal = document.getElementById("summary-total");

const summaryPending = document.getElementById("summary-pending");

const summaryAwaiting = document.getElementById("summary-awaiting");

const summaryConfirmed = document.getElementById("summary-confirmed");

const summaryCompleted = document.getElementById("summary-completed");

const summaryClosed = document.getElementById("summary-closed");

const quickStatusCards = document.querySelectorAll("[data-quick-status]");

const requestSearch = document.getElementById("request-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const statusFilterInputs = document.querySelectorAll(
  'input[name="statusFilter"]',
);

const categoryFilter = document.getElementById("category-filter");
const priorityFilter = document.getElementById("priority-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const listEyebrow = document.getElementById("list-eyebrow");
const listTitle = document.getElementById("list-title");
const requestsCount = document.getElementById("requests-count");

const requestsList = document.getElementById("requests-list");

const emptyState = document.getElementById("empty-state");

const emptyStateTitle = document.getElementById("empty-state-title");

const emptyStateDescription = document.getElementById(
  "empty-state-description",
);

const emptyStateButton = document.getElementById("empty-state-button");

const requestCardTemplate = document.getElementById("request-card-template");

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let perfilAtual = null;

let sessaoAtual = null;

let filtrosAplicados = {
  status: [],
  categoria: "",
  prioridade: "",
};

let filtroRapidoAtual = "todos";

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function converterParaData(valor) {
  if (!valor) {
    return null;
  }

  if (typeof valor === "object" && typeof valor.toDate === "function") {
    return valor.toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(`${texto}T12:00:00`)
    : new Date(texto);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function formatarData(valor) {
  const data = converterParaData(valor);

  if (!data) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR");
}

function obterTempoDaData(valor) {
  return converterParaData(valor)?.getTime() || 0;
}

function formatarQuantidade(quantidade) {
  return quantidade === 1 ? "1 item" : `${quantidade} itens`;
}

function mostrarFeedback(mensagem) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = mensagem;
  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 2800);
}
function obterFiltroRapidoInicialDaUrl() {
  const parametros = new URLSearchParams(window.location.search);

  const filtroRecebido = normalizarTexto(parametros.get("filtro"));

  const filtrosPermitidos = {
    todos: "todos",

    analise: "analise",

    aguardando: "aguardando",

    agendada: "agendadas",
    agendadas: "agendadas",

    concluida: "concluidas",
    concluidas: "concluidas",

    encerrada: "encerradas",
    encerradas: "encerradas",
  };

  return filtrosPermitidos[filtroRecebido] || "todos";
}
function abrirDetalhes(ordemOuId) {
  const ordemId =
    typeof ordemOuId === "object"
      ? String(ordemOuId?.documentId || ordemOuId?.id || "").trim()
      : String(ordemOuId || "").trim();

  if (!ordemId) {
    console.error("[Ordens] ID inválido ao abrir detalhes:", ordemOuId);

    mostrarFeedback("Não foi possível identificar esta ordem de serviço.");

    return;
  }

  const parametros = new URLSearchParams({
    id: ordemId,
    origem: "ordens",
  });

  window.location.href = `detalhes-solicitacao.html?${parametros.toString()}`;
}

function obterNomeCategorias(categorias) {
  return categorias
    .map((categoria) => categoriaConfig[categoria]?.nome)
    .filter(Boolean);
}

function obterIconePrincipal(solicitacao) {
  const categoriaPrincipal = solicitacao.categorias[0];

  return (
    categoriaConfig[categoriaPrincipal]?.icone ||
    categoriaConfig["manutencao-geral"].icone
  );
}

/* =========================================
   SOLICITAÇÕES DO FIRESTORE
========================================= */

function normalizarStatusDaOrdem(status) {
  const statusNormalizado = normalizarTexto(status);

  const statusMap = {
    nova: "nova-solicitacao",

    "nova-solicitacao": "nova-solicitacao",

    analise: "em-analise",

    "em-analise": "em-analise",

    "aguardando-confirmacao": "aguardando-confirmacao",

    agendada: "agendada",

    agendado: "agendada",

    concluida: "concluida",

    concluido: "concluida",

    finalizada: "concluida",

    finalizado: "concluida",

    recusada: "recusada",

    recusado: "recusada",

    cancelada: "cancelada",

    cancelado: "cancelada",
  };

  return statusMap[statusNormalizado] || "nova-solicitacao";
}

function normalizarPrioridadeDaOrdem(prioridade) {
  const prioridadeNormalizada = normalizarTexto(prioridade);

  const prioridadeMap = {
    baixa: "baixa",
    low: "baixa",

    normal: "normal",

    alta: "alta",
    high: "alta",

    urgente: "urgente",

    critica: "urgente",
    critical: "urgente",
  };

  return prioridadeMap[prioridadeNormalizada] || "normal";
}

function obterEnderecoDaOrdem(ordem) {
  const endereco = ordem.endereco;

  if (
    endereco &&
    typeof endereco === "object" &&
    String(endereco.resumo || "").trim()
  ) {
    return String(endereco.resumo).trim();
  }

  if (typeof endereco === "string") {
    return endereco;
  }

  const primeiraLinha = [endereco?.rua, endereco?.numero, endereco?.complemento]
    .filter(Boolean)
    .join(", ");

  const segundaLinha = [endereco?.bairro, endereco?.cidade]
    .filter(Boolean)
    .join(" — ");

  return (
    [primeiraLinha, segundaLinha].filter(Boolean).join(" | ") ||
    "Endereço não informado"
  );
}

function obterServicosDaOrdem(ordem) {
  if (Array.isArray(ordem.servicos)) {
    return ordem.servicos
      .map((servico) => {
        if (typeof servico === "string") {
          return servico;
        }

        return String(servico?.servico || "").trim();
      })
      .filter(Boolean);
  }

  return [ordem.servicoPrincipal].filter(Boolean);
}

function normalizarOrdemParaSolicitacao(documento) {
  const ordem = documento.data();

  const categorias =
    Array.isArray(ordem.categorias) && ordem.categorias.length
      ? ordem.categorias
      : [ordem.categoriaPrincipal].filter(Boolean);

  const perfilCriador = normalizarTexto(ordem.perfilCriador) || "cliente";

  return {
    id: documento.id,

    codigo: ordem.codigo || documento.id,

    numero: Number(ordem.numero || 0),

    perfilCriador,

    clienteId: ordem.clienteUid || ordem.cliente?.id || "",

    clienteNome: ordem.cliente?.nome || "Cliente não informado",

    titulo:
      ordem.titulo ||
      ordem.servicoPrincipal ||
      (categorias.includes("vistoria")
        ? "Vistoria técnica"
        : "Solicitação de serviço"),

    categorias,

    servicos: obterServicosDaOrdem(ordem),

    tipoAtendimento:
      ordem.tipoAtendimento ||
      (categorias.includes("vistoria") ? "vistoria" : "servico"),

    status: normalizarStatusDaOrdem(ordem.status),

    prioridade: normalizarPrioridadeDaOrdem(
      ordem.prioridade || ordem.vistoria?.prioridade,
    ),

    criadoEm: ordem.criadoEm || null,

    atualizadoEm: ordem.atualizadoEm || null,

    dataPreferida:
      ordem.atendimento?.dataConfirmada ||
      ordem.atendimento?.dataPreferida ||
      "",

    periodo:
      ordem.atendimento?.periodoConfirmado || ordem.atendimento?.periodo || "",

    horarioPreferido:
      ordem.atendimento?.horarioConfirmado ||
      ordem.atendimento?.horarioPreferido ||
      "",

    endereco: obterEnderecoDaOrdem(ordem),

    ativo: ordem.ativo !== false,

    arquivado: ordem.arquivado === true,
  };
}

async function carregarSolicitacoesDoFirestore() {
  if (!sessaoAtual || !perfilAtual) {
    return;
  }

  const ordensReference = collection(db, "ordens");

  const consulta =
    perfilAtual === "cliente"
      ? query(ordensReference, where("clienteUid", "==", sessaoAtual.uid))
      : ordensReference;

  const resultado = await getDocs(consulta);

  ordens = resultado.docs
    .map(normalizarOrdemParaSolicitacao)
    .filter((solicitacao) => {
      return solicitacao.ativo && !solicitacao.arquivado;
    });
}

/* =========================================
   CONFIGURAÇÃO DO PERFIL
========================================= */

function configurarTextosDoPerfil() {
  const isAdmin = perfilAtual === "admin";

  body.dataset.profile = perfilAtual;

  requestsBackButton.href = "principal.html";

  newRequestButton.href = "nova-ordem.html";

  emptyStateButton.href = "nova-ordem.html";

  if (isAdmin) {
    document.title = "Ordens de Serviço | Salvateck";

    pageTitle.textContent = "Ordens de Serviço";
    profileBadge.textContent = "Área administrativa";

    introTitle.textContent = "Gerencie todos os atendimentos";

    introDescription.textContent =
      "Acompanhe solicitações, propostas, agendamentos, conclusões e encerramentos em uma única página.";

    newRequestButton.querySelector("span").textContent =
      "Nova ordem de serviço";

    requestSearch.placeholder = "Pesquisar cliente, ordem ou serviço";

    listEyebrow.textContent = "Gestão operacional";
    listTitle.textContent = "Ordens cadastradas";

    emptyStateTitle.textContent = "Nenhuma ordem encontrada";

    emptyStateDescription.textContent =
      "Não existem ordens correspondentes à pesquisa ou aos filtros selecionados.";

    emptyStateButton.textContent = "Criar ordem de serviço";
  } else {
    document.title = "Minhas Solicitações | Salvateck";

    pageTitle.textContent = "Minhas Solicitações";
    profileBadge.textContent = "Área do cliente";

    introTitle.textContent = "Acompanhe seus pedidos";

    introDescription.textContent =
      "Veja o andamento das suas solicitações e consulte os detalhes de cada atendimento.";

    newRequestButton.querySelector("span").textContent = "Nova solicitação";

    requestSearch.placeholder = "Pesquisar solicitação";

    listEyebrow.textContent = "Seus atendimentos";
    listTitle.textContent = "Solicitações recentes";

    emptyStateTitle.textContent = "Nenhuma solicitação encontrada";

    emptyStateDescription.textContent =
      "Crie uma nova solicitação ou altere os filtros utilizados.";

    emptyStateButton.textContent = "Criar nova solicitação";
  }

  adminFilters.forEach((elemento) => {
    elemento.hidden = !isAdmin;
  });

  if (!isAdmin) {
    priorityFilter.value = "";
    filtrosAplicados.prioridade = "";
  }
}

function aplicarPerfilDaSessao(sessao) {
  if (sessao.role !== "cliente" && sessao.role !== "admin") {
    return;
  }

  sessaoAtual = sessao;

  perfilAtual = sessao.role;

  configurarTextosDoPerfil();

  atualizarContagemDeFiltros();
}

/* =========================================
   FILTROS
========================================= */
function configurarTextosDoFiltroRapido() {
  /*
    Primeiro restaura os textos normais
    da página de acordo com o perfil.
  */
  configurarTextosDoPerfil();

  if (perfilAtual !== "cliente" || filtroRapidoAtual !== "agendadas") {
    return;
  }

  document.title = "Serviços Agendados | Salvateck";

  pageTitle.textContent = "Serviços Agendados";

  profileBadge.textContent = "Área do cliente";

  introTitle.textContent = "Seus próximos atendimentos";

  introDescription.textContent =
    "Consulte as datas, períodos e horários confirmados pela equipe Salvateck.";

  requestSearch.placeholder = "Pesquisar serviço agendado";

  listEyebrow.textContent = "Agenda do cliente";

  listTitle.textContent = "Atendimentos confirmados";

  emptyStateTitle.textContent = "Nenhum serviço agendado";

  emptyStateDescription.textContent =
    "Quando uma solicitação tiver a data confirmada, ela aparecerá nesta página.";

  emptyStateButton.textContent = "Criar nova solicitação";
}
function atualizarFiltroRapido(statusSelecionado) {
  filtroRapidoAtual = statusSelecionado || "todos";

  configurarTextosDoFiltroRapido();

  quickStatusCards.forEach((card) => {
    const isActive = card.dataset.quickStatus === filtroRapidoAtual;

    card.classList.toggle("is-active", isActive);

    card.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  renderizarSolicitacoes();
}
function abrirFiltros() {
  filterPanel.hidden = false;

  openFilterButton.setAttribute("aria-expanded", "true");

  filterPanel.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

function fecharFiltros() {
  filterPanel.hidden = true;

  openFilterButton.setAttribute("aria-expanded", "false");
}

function sincronizarEstiloDosFiltros() {
  document.querySelectorAll(".filter-option").forEach((opcao) => {
    const input = opcao.querySelector('input[name="statusFilter"]');

    opcao.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function obterStatusSelecionados() {
  return Array.from(statusFilterInputs)
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function contarFiltrosAtivos() {
  let quantidade = filtrosAplicados.status.length;

  if (filtrosAplicados.categoria) {
    quantidade += 1;
  }

  if (perfilAtual === "admin" && filtrosAplicados.prioridade) {
    quantidade += 1;
  }

  return quantidade;
}

function atualizarContagemDeFiltros() {
  const quantidade = contarFiltrosAtivos();

  activeFilterCount.textContent = String(quantidade);
  activeFilterCount.hidden = quantidade === 0;
}

function aplicarFiltros() {
  filtrosAplicados = {
    status: obterStatusSelecionados(),
    categoria: categoryFilter.value,
    prioridade: perfilAtual === "admin" ? priorityFilter.value : "",
  };

  atualizarContagemDeFiltros();
  renderizarSolicitacoes();
  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparFiltros() {
  statusFilterInputs.forEach((input) => {
    input.checked = false;
  });

  categoryFilter.value = "";
  priorityFilter.value = "";

  filtrosAplicados = {
    status: [],
    categoria: "",
    prioridade: "",
  };

  sincronizarEstiloDosFiltros();
  atualizarContagemDeFiltros();
  renderizarSolicitacoes();

  mostrarFeedback("Filtros removidos.");
}

/* =========================================
   FILTRAGEM DAS SOLICITAÇÕES
========================================= */

function obterSolicitacoesDoPerfil() {
  if (perfilAtual === "admin") {
    return [...ordens];
  }

  return ordens.filter((solicitacao) => {
    return solicitacao.clienteId === sessaoAtual?.uid;
  });
}

function correspondeAPesquisa(solicitacao) {
  const pesquisa = normalizarTexto(requestSearch.value);

  if (!pesquisa) {
    return true;
  }

  const categorias = obterNomeCategorias(solicitacao.categorias).join(" ");

  const status = statusConfig[solicitacao.status]?.nome || "";

  const conteudoPesquisavel = normalizarTexto(
    [
      solicitacao.id,
      solicitacao.clienteNome,
      solicitacao.titulo,
      solicitacao.servicos.join(" "),
      categorias,
      status,
      solicitacao.endereco,
    ].join(" "),
  );

  return conteudoPesquisavel.includes(pesquisa);
}
function correspondeAoFiltroRapido(solicitacao) {
  const status = solicitacao.status;

  const gruposDeStatus = {
    todos: [],

    analise: ["nova-solicitacao", "em-analise"],

    aguardando: ["aguardando-confirmacao"],

    agendadas: ["agendada"],

    concluidas: ["concluida"],

    encerradas: ["recusada", "cancelada"],
  };

  const statusDoGrupo = gruposDeStatus[filtroRapidoAtual] || [];

  return filtroRapidoAtual === "todos" || statusDoGrupo.includes(status);
}
function correspondeAosFiltros(solicitacao) {
  const statusCorresponde =
    filtrosAplicados.status.length === 0 ||
    filtrosAplicados.status.includes(solicitacao.status);

  const categoriaCorresponde =
    !filtrosAplicados.categoria ||
    solicitacao.categorias.includes(filtrosAplicados.categoria);

  const prioridadeCorresponde =
    perfilAtual !== "admin" ||
    !filtrosAplicados.prioridade ||
    solicitacao.prioridade === filtrosAplicados.prioridade;

  return statusCorresponde && categoriaCorresponde && prioridadeCorresponde;
}

function obterSolicitacoesFiltradas() {
  return obterSolicitacoesDoPerfil()
    .filter(correspondeAoFiltroRapido)
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros)
    .sort((a, b) => {
      return obterTempoDaData(b.criadoEm) - obterTempoDaData(a.criadoEm);
    });
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const ordensDoPerfil = obterSolicitacoesDoPerfil();

  const paraAnalisar = ordensDoPerfil.filter((solicitacao) =>
    ["nova-solicitacao", "em-analise"].includes(solicitacao.status),
  ).length;

  const aguardando = ordensDoPerfil.filter(
    (solicitacao) => solicitacao.status === "aguardando-confirmacao",
  ).length;

  const agendadas = ordensDoPerfil.filter(
    (solicitacao) => solicitacao.status === "agendada",
  ).length;

  const concluidas = ordensDoPerfil.filter(
    (solicitacao) => solicitacao.status === "concluida",
  ).length;

  const encerradas = ordensDoPerfil.filter((solicitacao) =>
    ["recusada", "cancelada"].includes(solicitacao.status),
  ).length;

  summaryTotal.textContent = String(ordensDoPerfil.length);

  summaryPending.textContent = String(paraAnalisar);

  summaryAwaiting.textContent = String(aguardando);

  summaryConfirmed.textContent = String(agendadas);

  summaryCompleted.textContent = String(concluidas);

  summaryClosed.textContent = String(encerradas);
}

/* =========================================
   CRIAÇÃO DOS CARDS
========================================= */

function preencherCard(solicitacao) {
  const fragmento = requestCardTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".request-card");

  const mainButton = card.querySelector(".request-card__main");

  const code = card.querySelector(".request-card__code");
  const status = card.querySelector(".request-card__status");
  const date = card.querySelector(".request-card__date");

  const iconSvg = card.querySelector(".request-card__icon svg");

  const client = card.querySelector(".request-card__client");

  const title = card.querySelector(".request-card__title");

  const service = card.querySelector(".request-card__service");

  const address = card.querySelector(".request-card__address span");

  const schedule = card.querySelector(".request-card__schedule span");

  const adminArea = card.querySelector(".request-card__admin");

  const priority = card.querySelector(".request-card__priority strong");

  const analyzeButton = card.querySelector(".request-card__analyze");
  const expandedContent = card.querySelector(".request-card__expanded");

  const expandedClient = card.querySelector(".request-card__expanded-client");

  const expandedStatus = card.querySelector(".request-card__expanded-status");

  const expandedService = card.querySelector(".request-card__expanded-service");

  const expandedSchedule = card.querySelector(
    ".request-card__expanded-schedule",
  );

  const expandedAddress = card.querySelector(
    ".request-card__expanded-address strong",
  );
  const statusData =
    statusConfig[solicitacao.status] || statusConfig["nova-solicitacao"];

  const priorityData =
    prioridadeConfig[solicitacao.prioridade] || prioridadeConfig.normal;

  code.textContent = solicitacao.codigo || solicitacao.id;

  status.textContent = statusData.nome;
  status.classList.add(statusData.classe);

  date.textContent = `Criada em ${formatarData(solicitacao.criadoEm)}`;

  iconSvg.innerHTML = obterIconePrincipal(solicitacao);

  client.textContent = solicitacao.clienteNome;
  client.hidden = perfilAtual !== "admin";

  title.textContent = solicitacao.titulo;

  service.textContent = solicitacao.servicos.join(" • ");

  address.textContent = solicitacao.endereco;

  const periodoTexto =
    periodoConfig[solicitacao.periodo] || "Período não informado";

  const horarioTexto = solicitacao.horarioPreferido
    ? ` às ${solicitacao.horarioPreferido}`
    : "";

  const atendimentoTexto =
    `${formatarData(solicitacao.dataPreferida)} — ` +
    `${periodoTexto}${horarioTexto}`;

  schedule.textContent = atendimentoTexto;

  expandedClient.textContent =
    solicitacao.clienteNome || "Cliente não informado";

  expandedStatus.textContent = statusData.nome;

  expandedService.textContent =
    solicitacao.servicos.join(" • ") ||
    solicitacao.titulo ||
    "Serviço não informado";

  expandedSchedule.textContent = atendimentoTexto;

  expandedAddress.textContent =
    solicitacao.endereco || "Endereço não informado";

  adminArea.hidden = perfilAtual !== "admin";

  const textoDaAcaoPorStatus = {
    "nova-solicitacao": "Analisar ordem",
    "em-analise": "Continuar análise",
    "aguardando-confirmacao": "Ver proposta",
    agendada: "Gerenciar ordem",
    concluida: "Consultar ordem",
    recusada: "Consultar ordem",
    cancelada: "Consultar ordem",
  };

  analyzeButton.textContent =
    textoDaAcaoPorStatus[solicitacao.status] || "Abrir ordem";

  priority.textContent = priorityData.nome;
  priority.classList.add(priorityData.classe);

  mainButton.setAttribute(
    "aria-label",
    `Mostrar resumo da ordem ${solicitacao.codigo || solicitacao.id}`,
  );

  mainButton.addEventListener("click", () => {
    const deveExpandir = expandedContent.hidden;

    document.querySelectorAll(".request-card__expanded").forEach((elemento) => {
      if (elemento !== expandedContent) {
        elemento.hidden = true;

        const outroCard = elemento.closest(".request-card");

        outroCard?.classList.remove("is-expanded");

        outroCard
          ?.querySelector(".request-card__main")
          ?.setAttribute("aria-expanded", "false");
      }
    });

    expandedContent.hidden = !deveExpandir;

    card.classList.toggle("is-expanded", deveExpandir);

    mainButton.setAttribute("aria-expanded", deveExpandir ? "true" : "false");

    mainButton.setAttribute(
      "aria-label",
      deveExpandir
        ? `Ocultar resumo da ordem ${solicitacao.codigo || solicitacao.id}`
        : `Mostrar resumo da ordem ${solicitacao.codigo || solicitacao.id}`,
    );
  });

  analyzeButton.addEventListener("click", () => {
    abrirDetalhes(solicitacao.id);
  });

  return fragmento;
}

/* =========================================
   RENDERIZAÇÃO
========================================= */

function renderizarSolicitacoes() {
  const listaFiltrada = obterSolicitacoesFiltradas();

  requestsList.innerHTML = "";

  listaFiltrada.forEach((solicitacao) => {
    requestsList.appendChild(preencherCard(solicitacao));
  });

  requestsCount.textContent = formatarQuantidade(listaFiltrada.length);

  const listaVazia = listaFiltrada.length === 0;

  requestsList.hidden = listaVazia;
  emptyState.hidden = !listaVazia;

  atualizarResumo();
}

/* =========================================
   EVENTOS
========================================= */
quickStatusCards.forEach((card) => {
  card.addEventListener("click", () => {
    atualizarFiltroRapido(card.dataset.quickStatus);
  });
});
openFilterButton.addEventListener("click", abrirFiltros);

closeFilterButton.addEventListener("click", fecharFiltros);

applyFiltersButton.addEventListener("click", aplicarFiltros);

clearFiltersButton.addEventListener("click", limparFiltros);

statusFilterInputs.forEach((input) => {
  input.addEventListener("change", sincronizarEstiloDosFiltros);
});

requestSearch.addEventListener("input", () => {
  renderizarSolicitacoes();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !filterPanel.hidden) {
    fecharFiltros();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function inicializarPagina() {
  try {
    const sessao = await window.salvateckSessionReady;

    aplicarPerfilDaSessao(sessao);

    sincronizarEstiloDosFiltros();

    await carregarSolicitacoesDoFirestore();

    atualizarFiltroRapido(obterFiltroRapidoInicialDaUrl());
  } catch (error) {
    console.error("[Ordens] Não foi possível carregar as ordens:", error);

    ordens = [];

    renderizarSolicitacoes();

    if (error.code === "permission-denied") {
      mostrarFeedback("O Firebase bloqueou a consulta das solicitações.");

      return;
    }

    mostrarFeedback("Não foi possível carregar as solicitações.");
  }
}

inicializarPagina();
