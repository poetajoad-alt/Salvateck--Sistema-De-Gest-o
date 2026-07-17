/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const ORDERS_STORAGE_KEY = "salvateckOrdensTemporarias";

/* =========================================
   FUNÇÕES PARA DATAS TEMPORÁRIAS
========================================= */

function obterInicioDoDia(data = new Date()) {
  const novaData = new Date(data);

  novaData.setHours(0, 0, 0, 0);

  return novaData;
}

function obterDataISO(data) {
  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function criarDataComOffset(dias) {
  const data = obterInicioDoDia();

  data.setDate(data.getDate() + dias);

  return obterDataISO(data);
}

function criarDataHoraComOffset(dias, horario = "09:00") {
  return `${criarDataComOffset(dias)}T${horario}:00`;
}

/* =========================================
   DADOS TEMPORÁRIOS DAS ORDENS
========================================= */

const ordensDeServico = [
  {
    id: "OS-0021",

    clienteId: "cliente-fernanda",
    clienteNome: "Fernanda Lima",

    titulo: "Vazamento embaixo da pia",

    categorias: ["hidraulica"],

    servicos: ["Avaliação do vazamento", "Reparo da tubulação"],

    criadoEm: criarDataHoraComOffset(0, "08:20"),

    dataAgendada: null,

    periodo: "manha",
    horario: "",

    endereco: "Rua das Acácias, 114 — Jardim Paulista, São Paulo/SP",

    responsavel: "nao-definido",

    status: "nova",
    prioridade: "alta",

    valor: null,
    pagamentoStatus: "nao-informado",

    observacaoAdmin: "",
  },

  {
    id: "OS-0020",

    clienteId: "cliente-marcos",
    clienteNome: "Marcos Vinícius",

    titulo: "Instalação de chuveiro elétrico",

    categorias: ["eletrica", "instalacoes"],

    servicos: [
      "Retirada do chuveiro antigo",
      "Instalação do novo chuveiro",
      "Teste da rede elétrica",
    ],

    criadoEm: criarDataHoraComOffset(-1, "16:40"),

    dataAgendada: criarDataComOffset(2),

    periodo: "tarde",
    horario: "14:00",

    endereco: "Avenida Central, 820, Apartamento 31 — Centro, Osasco/SP",

    responsavel: "jose",

    status: "aguardando-confirmacao",
    prioridade: "normal",

    valor: 230,
    pagamentoStatus: "pendente",

    observacaoAdmin: "Data proposta ao cliente.",
  },

  {
    id: "OS-0019",

    clienteId: "cliente-joao",
    clienteNome: "João da Silva",

    titulo: "Vazamento na torneira da cozinha",

    categorias: ["hidraulica"],

    servicos: ["Torneira vazando", "Ajustar torneira"],

    criadoEm: criarDataHoraComOffset(-3, "10:15"),

    dataAgendada: criarDataComOffset(1),

    periodo: "manha",
    horario: "09:00",

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    responsavel: "jose",

    status: "agendada",
    prioridade: "normal",

    valor: 180,
    pagamentoStatus: "pendente",

    observacaoAdmin: "Atendimento confirmado pelo cliente.",
  },

  {
    id: "OS-0018",

    clienteId: "cliente-maria",
    clienteNome: "Maria Oliveira",

    titulo: "Troca de tomada danificada",

    categorias: ["eletrica"],

    servicos: ["Trocar tomada", "Verificar fiação"],

    criadoEm: criarDataHoraComOffset(-4, "13:10"),

    dataAgendada: criarDataComOffset(0),

    periodo: "manha",
    horario: "08:30",

    endereco:
      "Avenida das Flores, 380, Apartamento 42 — Vila Nova, São Paulo/SP",

    responsavel: "jose",

    status: "em-deslocamento",
    prioridade: "alta",

    valor: 145,
    pagamentoStatus: "pendente",

    observacaoAdmin: "Profissional a caminho do local.",
  },

  {
    id: "OS-0017",

    clienteId: "cliente-carlos",
    clienteNome: "Carlos Henrique",

    titulo: "Reparo em parede com infiltração",

    categorias: ["alvenaria", "pintura"],

    servicos: [
      "Correção de infiltração",
      "Reparo da superfície",
      "Retoque de pintura",
    ],

    criadoEm: criarDataHoraComOffset(-6, "09:30"),

    dataAgendada: criarDataComOffset(0),

    periodo: "tarde",
    horario: "13:30",

    endereco: "Rua das Palmeiras, 45 — Jardim Sul, São Paulo/SP",

    responsavel: "equipe-apoio",

    status: "em-atendimento",
    prioridade: "urgente",

    valor: 620,
    pagamentoStatus: "parcial",

    observacaoAdmin: "Cliente realizou pagamento parcial.",
  },

  {
    id: "OS-0016",

    clienteId: "cliente-ana",
    clienteNome: "Ana Paula Santos",

    titulo: "Instalação de suporte para televisão",

    categorias: ["instalacoes"],

    servicos: ["Instalação de suporte", "Fixação da televisão"],

    criadoEm: criarDataHoraComOffset(-12, "11:00"),

    dataAgendada: criarDataComOffset(-3),

    periodo: "manha",
    horario: "10:00",

    endereco: "Rua dos Ipês, 92 — Bela Vista, São Paulo/SP",

    responsavel: "jose",

    status: "concluida",
    prioridade: "normal",

    valor: 280,
    pagamentoStatus: "pago",

    observacaoAdmin: "Atendimento concluído sem pendências.",
  },

  {
    id: "OS-0015",

    clienteId: "cliente-roberto",
    clienteNome: "Roberto Mendes",

    titulo: "Manutenção em porta e fechadura",

    categorias: ["manutencao-geral"],

    servicos: ["Ajuste da porta", "Troca da fechadura"],

    criadoEm: criarDataHoraComOffset(-16, "14:45"),

    dataAgendada: criarDataComOffset(-8),

    periodo: "tarde",
    horario: "15:00",

    endereco: "Avenida Central, 1020, Sala 6 — Centro, Osasco/SP",

    responsavel: "equipe-apoio",

    status: "cancelada",
    prioridade: "baixa",

    valor: 190,
    pagamentoStatus: "nao-informado",

    observacaoAdmin: "Cancelamento solicitado pelo cliente.",
  },

  {
    id: "OS-0014",

    clienteId: "cliente-patricia",
    clienteNome: "Patrícia Souza",

    titulo: "Pintura completa da sala",

    categorias: ["pintura"],

    servicos: ["Preparação das paredes", "Pintura interna"],

    criadoEm: criarDataHoraComOffset(-20, "17:10"),

    dataAgendada: null,

    periodo: "manha",
    horario: "",

    endereco: "Rua São Bento, 318 — Centro, São Paulo/SP",

    responsavel: "nao-definido",

    status: "recusada",
    prioridade: "normal",

    valor: null,
    pagamentoStatus: "nao-informado",

    observacaoAdmin: "Serviço fora da área de atendimento.",
  },
];

/* =========================================
   CONFIGURAÇÕES DOS CAMPOS
========================================= */

const statusConfig = {
  nova: {
    nome: "Nova",
    classe: "status--nova",
  },

  "aguardando-confirmacao": {
    nome: "Aguardando confirmação",
    classe: "status--aguardando-confirmacao",
  },

  agendada: {
    nome: "Agendada",
    classe: "status--agendada",
  },

  "em-deslocamento": {
    nome: "Em deslocamento",
    classe: "status--em-deslocamento",
  },

  "em-atendimento": {
    nome: "Em atendimento",
    classe: "status--em-atendimento",
  },

  concluida: {
    nome: "Concluída",
    classe: "status--concluida",
  },

  cancelada: {
    nome: "Cancelada",
    classe: "status--cancelada",
  },

  recusada: {
    nome: "Recusada",
    classe: "status--recusada",
  },
};

const categoriaConfig = {
  hidraulica: "Hidráulica",
  eletrica: "Elétrica",
  pintura: "Pintura",
  alvenaria: "Alvenaria",
  instalacoes: "Instalações",
  "manutencao-geral": "Manutenção geral",
};

const periodoConfig = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

const responsavelConfig = {
  jose: "José",

  "equipe-apoio": "Equipe de apoio",

  "nao-definido": "Responsável não definido",
};

const prioridadeConfig = {
  baixa: {
    nome: "Baixa",
    classe: "priority--baixa",
  },

  normal: {
    nome: "Normal",
    classe: "",
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

const pagamentoConfig = {
  pago: {
    nome: "Pago",
    classe: "payment--pago",
  },

  pendente: {
    nome: "Pendente",
    classe: "payment--pendente",
  },

  parcial: {
    nome: "Parcial",
    classe: "payment--parcial",
  },

  "nao-informado": {
    nome: "Não informado",
    classe: "payment--nao-informado",
  },
};

const abasConfig = {
  todos: {
    titulo: "Ordens cadastradas",
    subtitulo: "Todas as situações",
  },

  novas: {
    titulo: "Novas solicitações",
    subtitulo: "Aguardando análise",
  },

  pendentes: {
    titulo: "Ordens pendentes",
    subtitulo: "Aguardando confirmação",
  },

  agendadas: {
    titulo: "Atendimentos agendados",
    subtitulo: "Programação confirmada",
  },

  andamento: {
    titulo: "Ordens em andamento",
    subtitulo: "Operação em execução",
  },

  encerradas: {
    titulo: "Ordens encerradas",
    subtitulo: "Histórico operacional",
  },
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const summaryTotal = document.getElementById("summary-total");

const summaryPending = document.getElementById("summary-pending");

const summaryProgress = document.getElementById("summary-progress");

const summaryCompleted = document.getElementById("summary-completed");

const statusTabButtons = document.querySelectorAll("[data-status-tab]");

const ordersSearch = document.getElementById("orders-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const statusFilterInputs = document.querySelectorAll(
  'input[name="statusFilter"]',
);

const categoryFilter = document.getElementById("category-filter");

const employeeFilter = document.getElementById("employee-filter");

const periodFilter = document.getElementById("period-filter");

const dateFilter = document.getElementById("date-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const clearEmptyFiltersButton = document.getElementById(
  "clear-empty-filters-button",
);

const sortButton = document.getElementById("sort-button");

const sortMenu = document.getElementById("sort-menu");

const sortOptionButtons = document.querySelectorAll("[data-sort-option]");

const ordersContentEyebrow = document.getElementById("orders-content-eyebrow");

const ordersContentTitle = document.getElementById("orders-content-title");

const ordersCount = document.getElementById("orders-count");

const ordersList = document.getElementById("orders-list");

const emptyState = document.getElementById("empty-state");

const orderCardTemplate = document.getElementById("order-card-template");

const updateModal = document.getElementById("update-modal");

const closeUpdateModalButton = document.getElementById(
  "close-update-modal-button",
);

const cancelUpdateButton = document.getElementById("cancel-update-button");

const updateOrderForm = document.getElementById("update-order-form");

const updateOrderId = document.getElementById("update-order-id");

const updateStatus = document.getElementById("update-status");

const updateEmployee = document.getElementById("update-employee");

const updateDate = document.getElementById("update-date");

const updateTime = document.getElementById("update-time");

const updateNote = document.getElementById("update-note");

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let abaAtual = "todos";

let ordenacaoAtual = "mais-recentes";

let filtrosAplicados = {
  status: [],
  categoria: "",
  responsavel: "",
  periodo: "",
  data: "",
};

let ordemEmEdicaoId = null;

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

function criarDataLocal(valor) {
  if (!valor) {
    return null;
  }

  const apenasData = String(valor).split("T")[0];

  return new Date(`${apenasData}T12:00:00`);
}

function formatarQuantidade(quantidade) {
  return quantidade === 1 ? "1 item" : `${quantidade} itens`;
}

function formatarDia(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "--";
  }

  return String(data.getDate()).padStart(2, "0");
}

function formatarMesCurto(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "---";
  }

  return data
    .toLocaleDateString("pt-BR", {
      month: "short",
    })
    .replace(".", "")
    .toUpperCase();
}

function formatarAno(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "----";
  }

  return String(data.getFullYear());
}

function formatarDataCompleta(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "Data não definida";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatarValor(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "Não informado";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterNomeCategorias(categorias) {
  return categorias
    .map((categoria) => categoriaConfig[categoria] || categoria)
    .filter(Boolean);
}

function obterOrdemPorId(ordemId) {
  return ordensDeServico.find((ordem) => ordem.id === ordemId);
}

function mostrarFeedback(mensagem) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = mensagem;

  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 2800);
}

function abrirDetalhes(ordemId) {
  const parametros = new URLSearchParams({
    id: ordemId,
    perfil: "admin",
  });

  window.location.href = `detalhes-solicitacao.html?${parametros.toString()}`;
}

/* =========================================
   INTERVALOS DE DATA
========================================= */

function obterInicioDaSemana(data) {
  const inicio = obterInicioDoDia(data);

  const diaDaSemana = inicio.getDay();

  const diferenca = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

  inicio.setDate(inicio.getDate() + diferenca);

  return inicio;
}

function obterFimDaSemana(data) {
  const fim = obterInicioDaSemana(data);

  fim.setDate(fim.getDate() + 6);

  fim.setHours(23, 59, 59, 999);

  return fim;
}

function datasSaoIguais(dataA, dataB) {
  if (!dataA || !dataB) {
    return false;
  }

  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()
  );
}

/* =========================================
   ARMAZENAMENTO LOCAL TEMPORÁRIO
========================================= */

function carregarEstadoLocal() {
  try {
    const dadosSalvos = JSON.parse(
      localStorage.getItem(ORDERS_STORAGE_KEY) || "{}",
    );

    ordensDeServico.forEach((ordem) => {
      const alteracao = dadosSalvos[ordem.id];

      if (!alteracao) {
        return;
      }

      ordem.status = alteracao.status ?? ordem.status;

      ordem.responsavel = alteracao.responsavel ?? ordem.responsavel;

      ordem.dataAgendada = alteracao.dataAgendada ?? ordem.dataAgendada;

      ordem.horario = alteracao.horario ?? ordem.horario;

      ordem.observacaoAdmin =
        alteracao.observacaoAdmin ?? ordem.observacaoAdmin;
    });
  } catch (error) {
    console.warn("Não foi possível carregar as ordens temporárias.", error);
  }
}

function salvarEstadoLocal() {
  try {
    const dadosParaSalvar = {};

    ordensDeServico.forEach((ordem) => {
      dadosParaSalvar[ordem.id] = {
        status: ordem.status,

        responsavel: ordem.responsavel,

        dataAgendada: ordem.dataAgendada,

        horario: ordem.horario,

        observacaoAdmin: ordem.observacaoAdmin,
      };
    });

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(dadosParaSalvar));
  } catch (error) {
    console.warn("Não foi possível salvar as ordens temporárias.", error);
  }
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const total = ordensDeServico.length;

  const pendentes = ordensDeServico.filter((ordem) =>
    ["nova", "aguardando-confirmacao"].includes(ordem.status),
  ).length;

  const emAndamento = ordensDeServico.filter((ordem) =>
    ["em-deslocamento", "em-atendimento"].includes(ordem.status),
  ).length;

  const concluidas = ordensDeServico.filter(
    (ordem) => ordem.status === "concluida",
  ).length;

  summaryTotal.textContent = String(total);

  summaryPending.textContent = String(pendentes);

  summaryProgress.textContent = String(emAndamento);

  summaryCompleted.textContent = String(concluidas);
}

/* =========================================
   ABAS DE STATUS
========================================= */

function correspondeAAba(ordem) {
  if (abaAtual === "todos") {
    return true;
  }

  if (abaAtual === "novas") {
    return ordem.status === "nova";
  }

  if (abaAtual === "pendentes") {
    return ordem.status === "aguardando-confirmacao";
  }

  if (abaAtual === "agendadas") {
    return ordem.status === "agendada";
  }

  if (abaAtual === "andamento") {
    return ["em-deslocamento", "em-atendimento"].includes(ordem.status);
  }

  if (abaAtual === "encerradas") {
    return ["concluida", "cancelada", "recusada"].includes(ordem.status);
  }

  return true;
}

function atualizarAbas() {
  statusTabButtons.forEach((button) => {
    const estaAtivo = button.dataset.statusTab === abaAtual;

    button.classList.toggle("is-active", estaAtivo);

    button.setAttribute("aria-pressed", String(estaAtivo));
  });

  const configuracao = abasConfig[abaAtual] || abasConfig.todos;

  ordersContentEyebrow.textContent = configuracao.subtitulo;

  ordersContentTitle.textContent = configuracao.titulo;
}

function alterarAba(novaAba) {
  if (!abasConfig[novaAba]) {
    return;
  }

  abaAtual = novaAba;

  atualizarAbas();
  fecharTodosOsMenus();
  renderizarOrdens();
}

/* =========================================
   PESQUISA
========================================= */

function correspondeAPesquisa(ordem) {
  const pesquisa = normalizarTexto(ordersSearch.value);

  if (!pesquisa) {
    return true;
  }

  const categorias = obterNomeCategorias(ordem.categorias).join(" ");

  const status = statusConfig[ordem.status]?.nome || "";

  const responsavel = responsavelConfig[ordem.responsavel] || "";

  const conteudoPesquisavel = normalizarTexto(
    [
      ordem.id,
      ordem.clienteNome,
      ordem.titulo,
      ordem.servicos.join(" "),
      categorias,
      status,
      responsavel,
      ordem.endereco,
      ordem.observacaoAdmin,
    ].join(" "),
  );

  return conteudoPesquisavel.includes(pesquisa);
}

/* =========================================
   FILTROS
========================================= */

function obterStatusSelecionados() {
  return Array.from(statusFilterInputs)
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function correspondeAoFiltroDeData(ordem) {
  const filtro = filtrosAplicados.data;

  if (!filtro) {
    return true;
  }

  if (filtro === "sem-data") {
    return !ordem.dataAgendada;
  }

  const dataDaOrdem = criarDataLocal(ordem.dataAgendada);

  if (!dataDaOrdem) {
    return false;
  }

  const hoje = obterInicioDoDia();

  if (filtro === "hoje") {
    return datasSaoIguais(dataDaOrdem, hoje);
  }

  if (filtro === "semana") {
    const inicio = obterInicioDaSemana(hoje);

    const fim = obterFimDaSemana(hoje);

    return dataDaOrdem >= inicio && dataDaOrdem <= fim;
  }

  if (filtro === "mes") {
    return (
      dataDaOrdem.getFullYear() === hoje.getFullYear() &&
      dataDaOrdem.getMonth() === hoje.getMonth()
    );
  }

  return true;
}

function correspondeAosFiltros(ordem) {
  const statusCorresponde =
    filtrosAplicados.status.length === 0 ||
    filtrosAplicados.status.includes(ordem.status);

  const categoriaCorresponde =
    !filtrosAplicados.categoria ||
    ordem.categorias.includes(filtrosAplicados.categoria);

  const responsavelCorresponde =
    !filtrosAplicados.responsavel ||
    ordem.responsavel === filtrosAplicados.responsavel;

  const periodoCorresponde =
    !filtrosAplicados.periodo || ordem.periodo === filtrosAplicados.periodo;

  return (
    statusCorresponde &&
    categoriaCorresponde &&
    responsavelCorresponde &&
    periodoCorresponde &&
    correspondeAoFiltroDeData(ordem)
  );
}

function sincronizarEstiloDosFiltros() {
  document.querySelectorAll(".filter-option").forEach((opcao) => {
    const input = opcao.querySelector('input[name="statusFilter"]');

    opcao.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function contarFiltrosAtivos() {
  let quantidade = filtrosAplicados.status.length;

  if (filtrosAplicados.categoria) {
    quantidade += 1;
  }

  if (filtrosAplicados.responsavel) {
    quantidade += 1;
  }

  if (filtrosAplicados.periodo) {
    quantidade += 1;
  }

  if (filtrosAplicados.data) {
    quantidade += 1;
  }

  return quantidade;
}

function atualizarContagemDeFiltros() {
  const quantidade = contarFiltrosAtivos();

  activeFilterCount.textContent = String(quantidade);

  activeFilterCount.hidden = quantidade === 0;
}

function abrirFiltros() {
  fecharOrdenacao();

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

function aplicarFiltros() {
  filtrosAplicados = {
    status: obterStatusSelecionados(),

    categoria: categoryFilter.value,

    responsavel: employeeFilter.value,

    periodo: periodFilter.value,

    data: dateFilter.value,
  };

  atualizarContagemDeFiltros();
  renderizarOrdens();
  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparPesquisaEFiltros() {
  ordersSearch.value = "";

  statusFilterInputs.forEach((input) => {
    input.checked = false;
  });

  categoryFilter.value = "";
  employeeFilter.value = "";
  periodFilter.value = "";
  dateFilter.value = "";

  filtrosAplicados = {
    status: [],
    categoria: "",
    responsavel: "",
    periodo: "",
    data: "",
  };

  abaAtual = "todos";

  sincronizarEstiloDosFiltros();
  atualizarContagemDeFiltros();
  atualizarAbas();
  renderizarOrdens();

  mostrarFeedback("Pesquisa e filtros removidos.");
}

/* =========================================
   ORDENAÇÃO
========================================= */

function abrirOrdenacao() {
  fecharFiltros();

  const seraAberto = sortMenu.hidden;

  sortMenu.hidden = !seraAberto;

  sortButton.setAttribute("aria-expanded", String(seraAberto));
}

function fecharOrdenacao() {
  sortMenu.hidden = true;

  sortButton.setAttribute("aria-expanded", "false");
}

function atualizarOpcoesDeOrdenacao() {
  sortOptionButtons.forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.sortOption === ordenacaoAtual,
    );
  });
}

function ordenarOrdens(lista) {
  const copia = [...lista];

  if (ordenacaoAtual === "mais-antigas") {
    return copia.sort((a, b) => {
      return new Date(a.criadoEm) - new Date(b.criadoEm);
    });
  }

  if (ordenacaoAtual === "proxima-data") {
    return copia.sort((a, b) => {
      if (!a.dataAgendada && !b.dataAgendada) {
        return 0;
      }

      if (!a.dataAgendada) {
        return 1;
      }

      if (!b.dataAgendada) {
        return -1;
      }

      return criarDataLocal(a.dataAgendada) - criarDataLocal(b.dataAgendada);
    });
  }

  if (ordenacaoAtual === "cliente") {
    return copia.sort((a, b) => {
      return a.clienteNome.localeCompare(b.clienteNome, "pt-BR");
    });
  }

  return copia.sort((a, b) => {
    return new Date(b.criadoEm) - new Date(a.criadoEm);
  });
}

function alterarOrdenacao(novaOrdenacao) {
  const opcoesPermitidas = [
    "mais-recentes",
    "mais-antigas",
    "proxima-data",
    "cliente",
  ];

  if (!opcoesPermitidas.includes(novaOrdenacao)) {
    return;
  }

  ordenacaoAtual = novaOrdenacao;

  atualizarOpcoesDeOrdenacao();
  fecharOrdenacao();
  renderizarOrdens();

  mostrarFeedback("Ordenação atualizada.");
}

/* =========================================
   OBTENÇÃO DA LISTA
========================================= */

function obterOrdensFiltradas() {
  const lista = ordensDeServico
    .filter(correspondeAAba)
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros);

  return ordenarOrdens(lista);
}

/* =========================================
   MODAL DE ATUALIZAÇÃO
========================================= */

function abrirModalDeAtualizacao(ordem, configuracao = {}) {
  if (!ordem) {
    return;
  }

  ordemEmEdicaoId = ordem.id;

  updateOrderId.value = ordem.id;

  updateStatus.value = configuracao.status || ordem.status;

  updateEmployee.value = ordem.responsavel || "nao-definido";

  updateDate.value = ordem.dataAgendada || "";

  updateTime.value = ordem.horario || "";

  updateNote.value = ordem.observacaoAdmin || "";

  updateModal.hidden = false;

  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    if (configuracao.foco === "responsavel") {
      updateEmployee.focus();

      return;
    }

    if (configuracao.foco === "data") {
      updateDate.focus();

      return;
    }

    updateStatus.focus();
  }, 50);
}

function fecharModalDeAtualizacao() {
  updateModal.hidden = true;

  document.body.classList.remove("modal-open");

  updateOrderForm.reset();

  updateOrderId.value = "";

  ordemEmEdicaoId = null;
}

function statusExigeAgendamento(status) {
  return [
    "aguardando-confirmacao",
    "agendada",
    "em-deslocamento",
    "em-atendimento",
  ].includes(status);
}

function salvarAtualizacaoDoModal(event) {
  event.preventDefault();

  const ordem = obterOrdemPorId(ordemEmEdicaoId);

  if (!ordem) {
    fecharModalDeAtualizacao();

    mostrarFeedback("Não foi possível localizar a ordem.");

    return;
  }

  const novoStatus = updateStatus.value;

  const novaData = updateDate.value;

  if (statusExigeAgendamento(novoStatus) && !novaData) {
    mostrarFeedback("Informe a data do atendimento.");

    updateDate.focus();

    return;
  }

  ordem.status = novoStatus;

  ordem.responsavel = updateEmployee.value || "nao-definido";

  ordem.dataAgendada = novaData || null;

  ordem.horario = updateTime.value;

  ordem.observacaoAdmin = updateNote.value.trim();

  salvarEstadoLocal();

  fecharModalDeAtualizacao();
  fecharTodosOsMenus();

  atualizarResumo();
  renderizarOrdens();

  mostrarFeedback("Ordem atualizada com sucesso.");
}

/* =========================================
   MENUS DOS CARDS
========================================= */

function fecharTodosOsMenus(excecao = null) {
  document.querySelectorAll(".order-card__options").forEach((menu) => {
    if (menu !== excecao) {
      menu.hidden = true;
    }
  });

  document.querySelectorAll(".order-card__menu").forEach((button) => {
    const card = button.closest(".order-card");

    const menu = card?.querySelector(".order-card__options");

    if (menu !== excecao) {
      button.setAttribute("aria-expanded", "false");
    }
  });
}

/* =========================================
   AÇÕES DISPONÍVEIS POR STATUS
========================================= */

function obterAcoesDisponiveis(ordem) {
  if (ordem.status === "nova") {
    return ["aceitar", "propor-data", "atribuir", "recusar"];
  }

  if (ordem.status === "aguardando-confirmacao") {
    return ["aceitar", "propor-data", "atribuir", "recusar"];
  }

  if (ordem.status === "agendada") {
    return ["atribuir", "reagendar", "iniciar", "cancelar"];
  }

  if (ordem.status === "em-deslocamento") {
    return ["atribuir", "iniciar", "cancelar"];
  }

  if (ordem.status === "em-atendimento") {
    return ["concluir", "cancelar"];
  }

  return [];
}

function obterAcaoPrincipal(ordem) {
  if (ordem.status === "nova") {
    return {
      texto: "Analisar",
      acao: "editar",
    };
  }

  if (ordem.status === "aguardando-confirmacao") {
    return {
      texto: "Confirmar",
      acao: "aceitar",
    };
  }

  if (ordem.status === "agendada") {
    return {
      texto: "Deslocamento",
      acao: "deslocamento",
    };
  }

  if (ordem.status === "em-deslocamento") {
    return {
      texto: "Iniciar",
      acao: "iniciar",
    };
  }

  if (ordem.status === "em-atendimento") {
    return {
      texto: "Concluir",
      acao: "concluir",
    };
  }

  return null;
}

/* =========================================
   ALTERAÇÃO RÁPIDA DE STATUS
========================================= */

function atualizarOrdem(ordem, alteracoes, mensagem) {
  Object.assign(ordem, alteracoes);

  salvarEstadoLocal();

  fecharTodosOsMenus();

  atualizarResumo();
  renderizarOrdens();

  mostrarFeedback(mensagem);
}

function aceitarSolicitacao(ordem) {
  if (!ordem.dataAgendada) {
    abrirModalDeAtualizacao(ordem, {
      status: "agendada",
      foco: "data",
    });

    mostrarFeedback("Defina a data e o horário para aceitar a solicitação.");

    return;
  }

  atualizarOrdem(
    ordem,
    {
      status: "agendada",
    },
    "Solicitação aceita e agendada.",
  );
}

function proporNovaData(ordem) {
  abrirModalDeAtualizacao(ordem, {
    status: "aguardando-confirmacao",
    foco: "data",
  });
}

function atribuirResponsavel(ordem) {
  abrirModalDeAtualizacao(ordem, {
    foco: "responsavel",
  });
}

function reagendarOrdem(ordem) {
  abrirModalDeAtualizacao(ordem, {
    status: "aguardando-confirmacao",
    foco: "data",
  });
}

function iniciarDeslocamento(ordem) {
  atualizarOrdem(
    ordem,
    {
      status: "em-deslocamento",
    },
    "Ordem marcada como em deslocamento.",
  );
}

function iniciarAtendimento(ordem) {
  atualizarOrdem(
    ordem,
    {
      status: "em-atendimento",
    },
    "Atendimento iniciado.",
  );
}

function concluirOrdem(ordem) {
  atualizarOrdem(
    ordem,
    {
      status: "concluida",
    },
    "Ordem marcada como concluída.",
  );
}

function cancelarOrdem(ordem) {
  const confirmou = window.confirm(`Deseja cancelar a ordem ${ordem.id}?`);

  if (!confirmou) {
    return;
  }

  atualizarOrdem(
    ordem,
    {
      status: "cancelada",
    },
    "Ordem cancelada.",
  );
}

function recusarOrdem(ordem) {
  const confirmou = window.confirm(`Deseja recusar a solicitação ${ordem.id}?`);

  if (!confirmou) {
    return;
  }

  atualizarOrdem(
    ordem,
    {
      status: "recusada",
    },
    "Solicitação recusada.",
  );
}

function executarAcaoDaOrdem(ordem, acao) {
  if (acao === "editar") {
    abrirModalDeAtualizacao(ordem);

    return;
  }

  if (acao === "aceitar") {
    aceitarSolicitacao(ordem);

    return;
  }

  if (acao === "propor-data") {
    proporNovaData(ordem);

    return;
  }

  if (acao === "atribuir") {
    atribuirResponsavel(ordem);

    return;
  }

  if (acao === "reagendar") {
    reagendarOrdem(ordem);

    return;
  }

  if (acao === "deslocamento") {
    iniciarDeslocamento(ordem);

    return;
  }

  if (acao === "iniciar") {
    iniciarAtendimento(ordem);

    return;
  }

  if (acao === "concluir") {
    concluirOrdem(ordem);

    return;
  }

  if (acao === "cancelar") {
    cancelarOrdem(ordem);

    return;
  }

  if (acao === "recusar") {
    recusarOrdem(ordem);
  }
}

/* =========================================
   INFORMAÇÕES DO CARD
========================================= */

function obterTextoAgendamento(ordem) {
  if (!ordem.dataAgendada) {
    return "Data ainda não definida";
  }

  const partes = [
    formatarDataCompleta(ordem.dataAgendada),

    periodoConfig[ordem.periodo] || "",
  ];

  if (ordem.horario) {
    partes.push(ordem.horario);
  }

  return partes.filter(Boolean).join(" • ");
}

/* =========================================
   CRIAÇÃO DOS CARDS
========================================= */

function preencherCard(ordem) {
  const fragmento = orderCardTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".order-card");

  const priority = card.querySelector(".order-card__priority");

  const dateLabel = card.querySelector(".order-card__date-label");

  const day = card.querySelector(".order-card__day");

  const month = card.querySelector(".order-card__month");

  const year = card.querySelector(".order-card__year");

  const code = card.querySelector(".order-card__code");

  const status = card.querySelector(".order-card__status");

  const client = card.querySelector(".order-card__client");

  const title = card.querySelector(".order-card__title");

  const services = card.querySelector(".order-card__services");

  const schedule = card.querySelector(".order-card__schedule > span");

  const address = card.querySelector(".order-card__address > span");

  const employee = card.querySelector(".order-card__employee > span");

  const financial = card.querySelector(".order-card__financial");

  const value = card.querySelector(".order-card__value");

  const paymentStatus = card.querySelector(".order-card__payment-status");

  const detailsButton = card.querySelector(".order-card__button--details");

  const primaryButton = card.querySelector("[data-primary-action]");

  const menuButton = card.querySelector(".order-card__menu");

  const options = card.querySelector(".order-card__options");

  const actionButtons = card.querySelectorAll("[data-order-action]");

  const dataDoCard = ordem.dataAgendada || ordem.criadoEm;

  const statusData = statusConfig[ordem.status] || statusConfig.nova;

  const prioridadeData =
    prioridadeConfig[ordem.prioridade] || prioridadeConfig.normal;

  const pagamentoData =
    pagamentoConfig[ordem.pagamentoStatus] || pagamentoConfig["nao-informado"];

  priority.textContent = prioridadeData.nome;

  if (prioridadeData.classe) {
    priority.classList.add(prioridadeData.classe);
  }

  dateLabel.textContent = ordem.dataAgendada ? "Agendada" : "Criada";

  day.textContent = formatarDia(dataDoCard);

  month.textContent = formatarMesCurto(dataDoCard);

  year.textContent = formatarAno(dataDoCard);

  code.textContent = ordem.id;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  client.textContent = ordem.clienteNome;

  title.textContent = ordem.titulo;

  services.textContent = ordem.servicos.join(" • ");

  schedule.textContent = obterTextoAgendamento(ordem);

  address.textContent = ordem.endereco;

  employee.textContent =
    responsavelConfig[ordem.responsavel] || responsavelConfig["nao-definido"];

  const mostrarFinanceiro =
    ordem.valor !== null || ordem.pagamentoStatus !== "nao-informado";

  financial.hidden = !mostrarFinanceiro;

  if (mostrarFinanceiro) {
    value.textContent = formatarValor(ordem.valor);

    paymentStatus.textContent = pagamentoData.nome;

    paymentStatus.classList.add(pagamentoData.classe);
  }

  detailsButton.setAttribute(
    "aria-label",
    `Abrir detalhes da ordem ${ordem.id}`,
  );

  detailsButton.addEventListener("click", () => {
    abrirDetalhes(ordem.id);
  });

  const acaoPrincipal = obterAcaoPrincipal(ordem);

  if (!acaoPrincipal) {
    primaryButton.hidden = true;
  } else {
    primaryButton.textContent = acaoPrincipal.texto;

    primaryButton.addEventListener("click", () => {
      executarAcaoDaOrdem(ordem, acaoPrincipal.acao);
    });
  }

  const acoesDisponiveis = obterAcoesDisponiveis(ordem);

  actionButtons.forEach((button) => {
    const acao = button.dataset.orderAction;

    const estaDisponivel = acoesDisponiveis.includes(acao);

    button.hidden = !estaDisponivel;

    if (!estaDisponivel) {
      return;
    }

    button.addEventListener("click", () => {
      executarAcaoDaOrdem(ordem, acao);
    });
  });

  const possuiOpcoes = acoesDisponiveis.length > 0;

  menuButton.hidden = !possuiOpcoes;

  options.hidden = true;

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const seraAberto = options.hidden;

    fecharTodosOsMenus(options);

    options.hidden = !seraAberto;

    menuButton.setAttribute("aria-expanded", String(seraAberto));
  });

  return fragmento;
}

/* =========================================
   RENDERIZAÇÃO
========================================= */

function renderizarOrdens() {
  const lista = obterOrdensFiltradas();

  ordersList.innerHTML = "";

  lista.forEach((ordem) => {
    ordersList.appendChild(preencherCard(ordem));
  });

  ordersCount.textContent = formatarQuantidade(lista.length);

  const listaVazia = lista.length === 0;

  ordersList.hidden = listaVazia;

  emptyState.hidden = !listaVazia;
}

/* =========================================
   EVENTOS DAS ABAS
========================================= */

statusTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    alterarAba(button.dataset.statusTab);
  });
});

/* =========================================
   EVENTOS DOS FILTROS
========================================= */

openFilterButton.addEventListener("click", abrirFiltros);

closeFilterButton.addEventListener("click", fecharFiltros);

applyFiltersButton.addEventListener("click", aplicarFiltros);

clearFiltersButton.addEventListener("click", limparPesquisaEFiltros);

clearEmptyFiltersButton.addEventListener("click", limparPesquisaEFiltros);

statusFilterInputs.forEach((input) => {
  input.addEventListener("change", sincronizarEstiloDosFiltros);
});

/* =========================================
   EVENTOS DE PESQUISA E ORDENAÇÃO
========================================= */

ordersSearch.addEventListener("input", renderizarOrdens);

sortButton.addEventListener("click", (event) => {
  event.stopPropagation();

  abrirOrdenacao();
});

sortOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    alterarOrdenacao(button.dataset.sortOption);
  });
});

/* =========================================
   EVENTOS DO MODAL
========================================= */

updateOrderForm.addEventListener("submit", salvarAtualizacaoDoModal);

closeUpdateModalButton.addEventListener("click", fecharModalDeAtualizacao);

cancelUpdateButton.addEventListener("click", fecharModalDeAtualizacao);

updateModal.addEventListener("click", (event) => {
  if (event.target === updateModal) {
    fecharModalDeAtualizacao();
  }
});

/* =========================================
   EVENTOS GERAIS
========================================= */

document.addEventListener("click", (event) => {
  if (!event.target.closest(".order-card")) {
    fecharTodosOsMenus();
  }

  if (
    !event.target.closest(".sort-menu") &&
    !event.target.closest("#sort-button")
  ) {
    fecharOrdenacao();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  fecharTodosOsMenus();
  fecharOrdenacao();

  if (!filterPanel.hidden) {
    fecharFiltros();
  }

  if (!updateModal.hidden) {
    fecharModalDeAtualizacao();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

carregarEstadoLocal();

sincronizarEstiloDosFiltros();

atualizarContagemDeFiltros();

atualizarOpcoesDeOrdenacao();

atualizarAbas();

atualizarResumo();

renderizarOrdens();
