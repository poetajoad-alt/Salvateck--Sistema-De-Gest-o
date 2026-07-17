/* =========================================
   DADOS TEMPORÁRIOS DAS SOLICITAÇÕES
========================================= */
const ORDERS_STORAGE_KEY = "salvateckOrdensTemporarias";
const solicitacoes = [
  {
    id: "OS-0001",
    clienteId: "cliente-joao",
    clienteNome: "João da Silva",
    titulo: "Vazamento na torneira da cozinha",
    categorias: ["hidraulica"],
    servicos: ["Torneira vazando", "Ajustar torneira"],
    status: "nova-solicitacao",
    prioridade: "alta",
    criadoEm: "2026-07-16",
    dataPreferida: "2026-07-18",
    periodo: "manha",
    endereco: "Rua Exemplo, 150 — Centro, São Paulo/SP",
  },

  {
    id: "OS-0002",
    clienteId: "cliente-joao",
    clienteNome: "João da Silva",
    titulo: "Instalação de luminária",
    categorias: ["eletrica", "instalacoes"],
    servicos: ["Instalar luminária"],
    status: "em-analise",
    prioridade: "normal",
    criadoEm: "2026-07-14",
    dataPreferida: "2026-07-19",
    periodo: "tarde",
    endereco: "Rua Exemplo, 150 — Centro, São Paulo/SP",
  },

  {
    id: "OS-0003",
    clienteId: "cliente-joao",
    clienteNome: "João da Silva",
    titulo: "Pintura de parede do quarto",
    categorias: ["pintura"],
    servicos: ["Pintura de parede", "Preparação da superfície"],
    status: "aguardando-confirmacao",
    prioridade: "normal",
    criadoEm: "2026-07-12",
    dataPreferida: "2026-07-22",
    periodo: "manha",
    endereco: "Rua Exemplo, 150 — Centro, São Paulo/SP",
  },

  {
    id: "OS-0004",
    clienteId: "cliente-maria",
    clienteNome: "Maria Oliveira",
    titulo: "Troca de tomada danificada",
    categorias: ["eletrica"],
    servicos: ["Trocar tomada"],
    status: "agendada",
    prioridade: "urgente",
    criadoEm: "2026-07-15",
    dataPreferida: "2026-07-17",
    periodo: "tarde",
    endereco: "Av. das Flores, 380 — Vila Nova, São Paulo/SP",
  },

  {
    id: "OS-0005",
    clienteId: "cliente-carlos",
    clienteNome: "Carlos Henrique",
    titulo: "Reparo em parede com infiltração",
    categorias: ["alvenaria", "pintura"],
    servicos: [
      "Correção de infiltração",
      "Reparo em parede",
      "Retoque de pintura",
    ],
    status: "nova-solicitacao",
    prioridade: "alta",
    criadoEm: "2026-07-16",
    dataPreferida: "2026-07-20",
    periodo: "manha",
    endereco: "Rua das Palmeiras, 45 — Jardim Sul, São Paulo/SP",
  },

  {
    id: "OS-0006",
    clienteId: "cliente-ana",
    clienteNome: "Ana Paula Santos",
    titulo: "Instalação de suporte para televisão",
    categorias: ["instalacoes"],
    servicos: ["Instalar suporte de TV"],
    status: "cancelada",
    prioridade: "baixa",
    criadoEm: "2026-07-10",
    dataPreferida: "2026-07-13",
    periodo: "tarde",
    endereco: "Rua dos Ipês, 92 — Bela Vista, São Paulo/SP",
  },

  {
    id: "OS-0007",
    clienteId: "cliente-roberto",
    clienteNome: "Roberto Mendes",
    titulo: "Manutenção em porta e fechadura",
    categorias: ["manutencao-geral"],
    servicos: ["Ajustar porta", "Trocar fechadura"],
    status: "em-analise",
    prioridade: "normal",
    criadoEm: "2026-07-13",
    dataPreferida: "2026-07-21",
    periodo: "manha",
    endereco: "Av. Central, 1020 — Centro, Osasco/SP",
  },

  {
    id: "OS-0008",
    clienteId: "cliente-patricia",
    clienteNome: "Patrícia Souza",
    titulo: "Desentupimento de vaso sanitário",
    categorias: ["hidraulica"],
    servicos: ["Vaso sanitário entupido", "Desentupimento"],
    status: "recusada",
    prioridade: "urgente",
    criadoEm: "2026-07-11",
    dataPreferida: "2026-07-12",
    periodo: "noite",
    endereco: "Rua São Bento, 318 — Centro, São Paulo/SP",
  },
];

/* =========================================
   CONFIGURAÇÕES
========================================= */

const clienteAtualId = "cliente-joao";

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

const profileButtons = document.querySelectorAll("[data-profile-button]");

const adminFilters = document.querySelectorAll(".admin-filter");

const summaryTotalLabel = document.getElementById("summary-total-label");

const summaryPendingLabel = document.getElementById("summary-pending-label");

const summaryConfirmedLabel = document.getElementById(
  "summary-confirmed-label",
);

const summaryTotal = document.getElementById("summary-total");
const summaryPending = document.getElementById("summary-pending");
const summaryConfirmed = document.getElementById("summary-confirmed");

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

const parametrosDaPagina = new URLSearchParams(window.location.search);

const perfilDaUrl = parametrosDaPagina.get("perfil");

let perfilAtual =
  perfilDaUrl === "admin" || perfilDaUrl === "cliente"
    ? perfilDaUrl
    : body.dataset.profile || "cliente";

let filtrosAplicados = {
  status: [],
  categoria: "",
  prioridade: "",
};

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

function formatarData(valor) {
  if (!valor) {
    return "Data não informada";
  }

  const data = new Date(`${valor}T12:00:00`);

  return data.toLocaleDateString("pt-BR");
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

function abrirDetalhes(solicitacao) {
  if (!solicitacao) {
    mostrarFeedback("Não foi possível identificar esta solicitação.");
    return;
  }

  const parametros = new URLSearchParams({
    id: solicitacao.id,
    codigo: solicitacao.codigo || solicitacao.id,
    perfil: perfilAtual,
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
   SOLICITAÇÕES SALVAS PELA NOVA ORDEM
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
  if (String(ordem.endereco?.resumo || "").trim()) {
    return ordem.endereco.resumo;
  }

  if (typeof ordem.endereco === "string") {
    return ordem.endereco;
  }

  const primeiraLinha = [
    ordem.endereco?.rua,
    ordem.endereco?.numero,
    ordem.endereco?.complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const segundaLinha = [ordem.endereco?.bairro, ordem.endereco?.cidade]
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

        return servico?.servico || "";
      })
      .filter(Boolean);
  }

  return [ordem.servicoPrincipal].filter(Boolean);
}

function normalizarOrdemParaSolicitacao(ordem, indice) {
  const categorias =
    Array.isArray(ordem.categorias) && ordem.categorias.length
      ? ordem.categorias
      : [ordem.categoriaPrincipal].filter(Boolean);

  const perfilCriador = normalizarTexto(ordem.perfilCriador);

  const clienteId =
    ordem.cliente?.id ||
    ordem.clienteId ||
    (perfilCriador === "cliente" ? clienteAtualId : "");

  const codigo = ordem.codigo || ordem.numero || `OS-TEMP-${indice + 1}`;

  return {
    perfilCriador: perfilCriador || "cliente",
    id: ordem.id || `ordem-temporaria-${indice + 1}`,

    codigo,

    clienteId,

    clienteNome:
      ordem.cliente?.nome || ordem.clienteNome || "Cliente não informado",

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

    criadoEm: String(ordem.criadoEm || "").split("T")[0],

    dataPreferida:
      ordem.atendimento?.dataPreferida || ordem.dataPreferida || "",

    periodo: ordem.atendimento?.periodo || ordem.periodo || "",

    endereco: obterEnderecoDaOrdem(ordem),
  };
}

function carregarSolicitacoesSalvas() {
  try {
    const dadosSalvos = JSON.parse(
      localStorage.getItem(ORDERS_STORAGE_KEY) || "[]",
    );

    if (!Array.isArray(dadosSalvos)) {
      return;
    }

    const ordensNormalizadas = dadosSalvos
      .filter((ordem) => {
        return Boolean(ordem && (ordem.id || ordem.codigo || ordem.titulo));
      })
      .map(normalizarOrdemParaSolicitacao);

    ordensNormalizadas.forEach((ordemSalva) => {
      const indiceExistente = solicitacoes.findIndex(
        (solicitacao) => solicitacao.id === ordemSalva.id,
      );

      if (indiceExistente >= 0) {
        solicitacoes[indiceExistente] = ordemSalva;

        return;
      }

      solicitacoes.unshift(ordemSalva);
    });
  } catch (error) {
    console.warn("Não foi possível carregar as solicitações salvas.", error);
  }
}

/* =========================================
   CONFIGURAÇÃO DO PERFIL
========================================= */

function configurarTextosDoPerfil() {
  const isAdmin = perfilAtual === "admin";

  body.dataset.profile = perfilAtual;

  requestsBackButton.href = `principal.html?perfil=${perfilAtual}`;

  newRequestButton.href = `nova-ordem.html?perfil=${perfilAtual}`;

  emptyStateButton.href = `nova-ordem.html?perfil=${perfilAtual}`;

  if (isAdmin) {
    document.title = "Novas Solicitações | Salvateck";

    pageTitle.textContent = "Novas Solicitações";
    profileBadge.textContent = "Área administrativa";

    introTitle.textContent = "Analise os pedidos recebidos";

    introDescription.textContent =
      "Confira os detalhes de cada solicitação, defina prioridades e organize os próximos atendimentos.";

    newRequestButton.querySelector("span").textContent =
      "Nova ordem de serviço";

    summaryTotalLabel.textContent = "Solicitações";
    summaryPendingLabel.textContent = "Para analisar";
    summaryConfirmedLabel.textContent = "Agendadas";

    requestSearch.placeholder = "Pesquisar cliente ou solicitação";

    listEyebrow.textContent = "Gestão de atendimentos";
    listTitle.textContent = "Solicitações recebidas";

    emptyStateTitle.textContent = "Nenhuma solicitação encontrada";

    emptyStateDescription.textContent =
      "Não existem solicitações correspondentes à pesquisa ou aos filtros selecionados.";

    emptyStateButton.textContent = "Criar ordem de serviço";
  } else {
    document.title = "Minhas Solicitações | Salvateck";

    pageTitle.textContent = "Minhas Solicitações";
    profileBadge.textContent = "Área do cliente";

    introTitle.textContent = "Acompanhe seus pedidos";

    introDescription.textContent =
      "Veja o andamento das suas solicitações e consulte os detalhes de cada atendimento.";

    newRequestButton.querySelector("span").textContent = "Nova solicitação";

    summaryTotalLabel.textContent = "Total";
    summaryPendingLabel.textContent = "Em andamento";
    summaryConfirmedLabel.textContent = "Agendadas";

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

function alterarPerfil(novoPerfil) {
  if (novoPerfil !== "cliente" && novoPerfil !== "admin") {
    return;
  }

  perfilAtual = novoPerfil;

  profileButtons.forEach((botao) => {
    const isActive = botao.dataset.profileButton === novoPerfil;

    botao.classList.toggle("is-active", isActive);

    botao.setAttribute("aria-pressed", String(isActive));
  });

  configurarTextosDoPerfil();
  atualizarContagemDeFiltros();
  renderizarSolicitacoes();
}

/* =========================================
   FILTROS
========================================= */

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
    return [...solicitacoes];
  }

  return solicitacoes.filter((solicitacao) => {
    const perfilCriador = normalizarTexto(
      solicitacao.perfilCriador || "cliente",
    );

    return (
      perfilCriador === "cliente" && solicitacao.clienteId === clienteAtualId
    );
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
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros)
    .sort((a, b) => {
      return new Date(b.criadoEm) - new Date(a.criadoEm);
    });
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const solicitacoesDoPerfil = obterSolicitacoesDoPerfil();

  const emAndamento = solicitacoesDoPerfil.filter((solicitacao) =>
    ["nova-solicitacao", "em-analise", "aguardando-confirmacao"].includes(
      solicitacao.status,
    ),
  ).length;

  const paraAnalisar = solicitacoesDoPerfil.filter((solicitacao) =>
    ["nova-solicitacao", "em-analise"].includes(solicitacao.status),
  ).length;

  const agendadas = solicitacoesDoPerfil.filter(
    (solicitacao) => solicitacao.status === "agendada",
  ).length;

  summaryTotal.textContent = String(solicitacoesDoPerfil.length);

  summaryPending.textContent = String(
    perfilAtual === "admin" ? paraAnalisar : emAndamento,
  );

  summaryConfirmed.textContent = String(agendadas);
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

  schedule.textContent = `${formatarData(solicitacao.dataPreferida)} — ${
    periodoConfig[solicitacao.periodo] || "Período não informado"
  }`;

  adminArea.hidden = perfilAtual !== "admin";

  priority.textContent = priorityData.nome;
  priority.classList.add(priorityData.classe);

  mainButton.setAttribute(
    "aria-label",
    `Abrir detalhes da solicitação ${solicitacao.id}`,
  );

  mainButton.addEventListener("click", () => {
    abrirDetalhes(solicitacao);
  });

  analyzeButton.addEventListener("click", () => {
    abrirDetalhes(solicitacao);
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

profileButtons.forEach((botao) => {
  botao.addEventListener("click", () => {
    alterarPerfil(botao.dataset.profileButton);
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

carregarSolicitacoesSalvas();

sincronizarEstiloDosFiltros();

alterarPerfil(perfilAtual);
