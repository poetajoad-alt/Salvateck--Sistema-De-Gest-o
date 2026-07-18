import "./auth-guard.js";

import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";
/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const ORDERS_STORAGE_KEY = "salvateckOrdensTemporarias";

const ORDERS_STATE_STORAGE_KEY = "salvateckEstadoOrdensTemporarias";

const ORDER_PREVIEW_STORAGE_KEY = "salvateckOrdemPreviewTemporaria";

const ABAS_PERMITIDAS = [
  "todos",
  "novas",
  "pendentes",
  "agendadas",
  "andamento",
  "encerradas",
];

const ORDENACOES_PERMITIDAS = [
  "mais-recentes",
  "mais-antigas",
  "proxima-data",
  "cliente",
];

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
   ORDENS CARREGADAS DO FIRESTORE
========================================= */

let ordensDeServico = [];

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
  vistoria: "Vistoria técnica",
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

const filtroDataConfig = {
  hoje: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
  "sem-data": "Sem data definida",
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

const activeFiltersList = document.getElementById("active-filters-list");

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

const ordersContentHint = document.querySelector(".orders-content__hint");

const previousOrderButton = document.getElementById("previous-order-button");

const nextOrderButton = document.getElementById("next-order-button");

const ordersCarouselPosition = document.getElementById(
  "orders-carousel-position",
);

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

let indiceAtualCarrossel = 0;

let carouselAnimationFrame = null;

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

function abrirDetalhes(ordem) {
  const ordemId = String(ordem?.documentId || ordem?.id || "").trim();

  if (!ordemId) {
    mostrarFeedback("Não foi possível identificar a ordem.");

    return;
  }

  const parametros = new URLSearchParams({
    id: ordemId,
    origem: "ordens",
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
   CARREGAMENTO DO FIRESTORE
========================================= */

function converterDataFirestoreParaISO(valor) {
  if (!valor) {
    return "";
  }

  if (typeof valor === "object" && typeof valor.toDate === "function") {
    return valor.toDate().toISOString();
  }

  if (valor instanceof Date) {
    return valor.toISOString();
  }

  return String(valor);
}

function normalizarStatusDaOrdemFirestore(status) {
  const statusNormalizado = normalizarTexto(status);

  const statusMap = {
    nova: "nova",
    "nova-solicitacao": "nova",

    analise: "nova",
    "em-analise": "nova",

    "aguardando-confirmacao": "aguardando-confirmacao",

    agendada: "agendada",
    agendado: "agendada",

    "em-deslocamento": "em-deslocamento",

    "em-atendimento": "em-atendimento",

    concluida: "concluida",
    concluido: "concluida",

    cancelada: "cancelada",
    cancelado: "cancelada",

    recusada: "recusada",
    recusado: "recusada",
  };

  return statusMap[statusNormalizado] || "nova";
}

function normalizarPrioridadeDaOrdemFirestore(prioridade) {
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

function obterServicosDaOrdemFirestore(ordem) {
  if (!Array.isArray(ordem.servicos)) {
    return [ordem.servicoPrincipal].filter(Boolean);
  }

  return ordem.servicos
    .map((servico) => {
      if (typeof servico === "string") {
        return servico;
      }

      return String(servico?.servico || servico?.nome || "").trim();
    })
    .filter(Boolean);
}

function obterEnderecoDaOrdemFirestore(ordem) {
  const endereco = ordem.endereco;

  if (typeof endereco === "string") {
    return endereco;
  }

  if (endereco && String(endereco.resumo || "").trim()) {
    return String(endereco.resumo).trim();
  }

  const primeiraLinha = [
    endereco?.logradouro || endereco?.rua,
    endereco?.numero,
    endereco?.complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const cidadeEstado = [endereco?.cidade, endereco?.uf || endereco?.estado]
    .filter(Boolean)
    .join("/");

  const segundaLinha = [endereco?.bairro, cidadeEstado]
    .filter(Boolean)
    .join(" — ");

  return (
    [primeiraLinha, segundaLinha].filter(Boolean).join(" — ") ||
    "Endereço não informado"
  );
}

function normalizarOrdemDoFirestore(documento, indice) {
  const ordem = documento.data();

  const categorias =
    Array.isArray(ordem.categorias) && ordem.categorias.length
      ? ordem.categorias
      : [ordem.categoriaPrincipal].filter(Boolean);

  const status = normalizarStatusDaOrdemFirestore(ordem.status);

  const dataAgendada =
    ordem.atendimento?.dataConfirmada || ordem.dataAgendada || null;

  return {
    documentId: documento.id,

    id: documento.id,

    codigo: ordem.codigo || documento.id || `OS-${indice + 1}`,

    clienteId: ordem.clienteUid || ordem.cliente?.id || ordem.clienteId || "",

    clienteNome:
      ordem.cliente?.nome || ordem.clienteNome || "Cliente não informado",

    titulo:
      ordem.titulo ||
      ordem.servicoPrincipal ||
      (categorias.includes("vistoria")
        ? "Vistoria técnica"
        : "Ordem de serviço"),

    categorias,

    servicos: obterServicosDaOrdemFirestore(ordem),

    criadoEm:
      converterDataFirestoreParaISO(ordem.criadoEm) || new Date().toISOString(),

    dataAgendada,

    periodo:
      ordem.atendimento?.periodoConfirmado ||
      ordem.periodo ||
      ordem.atendimento?.periodo ||
      "",

    horario:
      ordem.atendimento?.horarioConfirmado ||
      ordem.horario ||
      ordem.atendimento?.horarioPreferido ||
      "",

    endereco: obterEnderecoDaOrdemFirestore(ordem),

    responsavel: ordem.responsavel || "nao-definido",

    status,

    prioridade: normalizarPrioridadeDaOrdemFirestore(
      ordem.prioridade || ordem.vistoria?.prioridade,
    ),

    valor: ordem.valor ?? null,

    pagamentoStatus: ordem.pagamentoStatus || "nao-informado",

    observacaoAdmin: "",

    perfilCriador: ordem.perfilCriador || "cliente",

    tipoAtendimento:
      ordem.tipoAtendimento ||
      (categorias.includes("vistoria") ? "vistoria" : "servico"),

    ativo: ordem.ativo !== false,

    arquivado: ordem.arquivado === true,
  };
}

async function carregarOrdensDoFirestore() {
  const resultado = await getDocs(collection(db, "ordens"));

  ordensDeServico = resultado.docs
    .map((documento, indice) => {
      return normalizarOrdemDoFirestore(documento, indice);
    })
    .filter((ordem) => {
      return ordem.ativo && !ordem.arquivado;
    });
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
  if (!ABAS_PERMITIDAS.includes(novaAba)) {
    return;
  }

  abaAtual = novaAba;

  atualizarAbas();

  fecharTodosOsMenus();

  fecharTodosOsDetalhes();

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
      ordem.codigo,
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

function sincronizarFormularioComFiltros() {
  statusFilterInputs.forEach((input) => {
    input.checked = filtrosAplicados.status.includes(input.value);
  });

  categoryFilter.value = filtrosAplicados.categoria;

  employeeFilter.value = filtrosAplicados.responsavel;

  periodFilter.value = filtrosAplicados.periodo;

  dateFilter.value = filtrosAplicados.data;

  sincronizarEstiloDosFiltros();
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

function criarChipDeFiltro(texto, removerFiltro) {
  const chip = document.createElement("span");

  chip.className = "active-filter-chip";

  const label = document.createElement("span");

  label.textContent = texto;

  const button = document.createElement("button");

  button.type = "button";

  button.textContent = "×";

  button.setAttribute("aria-label", `Remover filtro ${texto}`);

  button.addEventListener("click", removerFiltro);

  chip.append(label, button);

  return chip;
}

function finalizarRemocaoDeFiltro() {
  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarOrdens();
}

function renderizarFiltrosAtivos() {
  activeFiltersList.innerHTML = "";

  filtrosAplicados.status.forEach((status) => {
    const nome = statusConfig[status]?.nome || status;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.status = filtrosAplicados.status.filter(
          (item) => item !== status,
        );

        finalizarRemocaoDeFiltro();
      }),
    );
  });

  if (filtrosAplicados.categoria) {
    const nome =
      categoriaConfig[filtrosAplicados.categoria] || filtrosAplicados.categoria;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.categoria = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.responsavel) {
    const nome =
      responsavelConfig[filtrosAplicados.responsavel] ||
      filtrosAplicados.responsavel;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.responsavel = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.periodo) {
    const nome =
      periodoConfig[filtrosAplicados.periodo] || filtrosAplicados.periodo;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.periodo = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.data) {
    const nome =
      filtroDataConfig[filtrosAplicados.data] || filtrosAplicados.data;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.data = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  activeFiltersList.hidden = activeFiltersList.children.length === 0;
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

  renderizarFiltrosAtivos();

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

  filtrosAplicados = {
    status: [],
    categoria: "",
    responsavel: "",
    periodo: "",
    data: "",
  };

  abaAtual = "todos";

  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  atualizarAbas();

  fecharFiltros();

  fecharOrdenacao();

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
    return copia.sort(
      (ordemA, ordemB) => new Date(ordemA.criadoEm) - new Date(ordemB.criadoEm),
    );
  }

  if (ordenacaoAtual === "proxima-data") {
    return copia.sort((ordemA, ordemB) => {
      if (!ordemA.dataAgendada && !ordemB.dataAgendada) {
        return 0;
      }

      if (!ordemA.dataAgendada) {
        return 1;
      }

      if (!ordemB.dataAgendada) {
        return -1;
      }

      return (
        criarDataLocal(ordemA.dataAgendada) -
        criarDataLocal(ordemB.dataAgendada)
      );
    });
  }

  if (ordenacaoAtual === "cliente") {
    return copia.sort((ordemA, ordemB) =>
      ordemA.clienteNome.localeCompare(ordemB.clienteNome, "pt-BR"),
    );
  }

  return copia.sort(
    (ordemA, ordemB) => new Date(ordemB.criadoEm) - new Date(ordemA.criadoEm),
  );
}

function alterarOrdenacao(novaOrdenacao) {
  if (!ORDENACOES_PERMITIDAS.includes(novaOrdenacao)) {
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

  fecharModalDeAtualizacao();

  if (!ordem) {
    mostrarFeedback("Não foi possível localizar a ordem.");

    return;
  }

  abrirDetalhes(ordem);
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
   EXPANSÃO DOS CARDS
========================================= */

function fecharDetalhesDoCard(card) {
  const details = card.querySelector(".order-card__details");

  const toggle = card.querySelector(".order-card__toggle");

  if (!details || !toggle) {
    return;
  }

  details.hidden = true;

  toggle.setAttribute("aria-expanded", "false");

  toggle.setAttribute("aria-label", "Mostrar informações da ordem");

  card.classList.remove("is-expanded");

  const options = card.querySelector(".order-card__options");

  const menuButton = card.querySelector(".order-card__menu");

  if (options) {
    options.hidden = true;
  }

  if (menuButton) {
    menuButton.setAttribute("aria-expanded", "false");
  }
}

function fecharTodosOsDetalhes(excecao = null) {
  document.querySelectorAll(".order-card").forEach((card) => {
    if (card !== excecao) {
      fecharDetalhesDoCard(card);
    }
  });
}

function alternarDetalhesDoCard(card) {
  const details = card.querySelector(".order-card__details");

  const toggle = card.querySelector(".order-card__toggle");

  if (!details || !toggle) {
    return;
  }

  const seraAberto = details.hidden;

  if (seraAberto) {
    fecharTodosOsDetalhes(card);

    details.hidden = false;

    toggle.setAttribute("aria-expanded", "true");

    toggle.setAttribute("aria-label", "Ocultar informações da ordem");

    card.classList.add("is-expanded");
  } else {
    fecharDetalhesDoCard(card);
  }

  window.requestAnimationFrame(() => {
    atualizarControlesDoCarrossel();
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

function executarAcaoDaOrdem(ordem) {
  abrirDetalhes(ordem);
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

  const schedule = card.querySelector(".order-card__schedule > span");

  const toggle = card.querySelector(".order-card__toggle");

  const details = card.querySelector(".order-card__details");

  const services = card.querySelector(".order-card__services");

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

  card.dataset.orderId = ordem.id;

  card.setAttribute(
    "aria-label",
    `${ordem.id}, ${ordem.clienteNome}, ${ordem.titulo}`,
  );

  priority.textContent = prioridadeData.nome;

  if (prioridadeData.classe) {
    priority.classList.add(prioridadeData.classe);
  }

  dateLabel.textContent = ordem.dataAgendada ? "Agendada" : "Criada";

  day.textContent = formatarDia(dataDoCard);

  month.textContent = formatarMesCurto(dataDoCard);

  year.textContent = formatarAno(dataDoCard);

  code.textContent = ordem.codigo || ordem.id;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  client.textContent = ordem.clienteNome;

  title.textContent = ordem.titulo;

  schedule.textContent = obterTextoAgendamento(ordem);

  services.textContent = ordem.servicos.join(" • ");

  address.textContent = ordem.endereco || "Endereço não informado";

  employee.textContent =
    responsavelConfig[ordem.responsavel] || responsavelConfig["nao-definido"];

  const detalheId = `order-details-${ordem.id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  details.id = detalheId;

  toggle.setAttribute("aria-controls", detalheId);

  toggle.setAttribute("aria-label", `Mostrar informações da ordem ${ordem.id}`);

  toggle.addEventListener("click", () => {
    alternarDetalhesDoCard(card);
  });

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
    abrirDetalhes(ordem);
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
   CONTROLE DO CARROSSEL
========================================= */

function obterCardsDoCarrossel() {
  return Array.from(ordersList.querySelectorAll(".order-card"));
}

function obterIndiceMaisProximo() {
  const cards = obterCardsDoCarrossel();

  if (cards.length === 0) {
    return 0;
  }

  const limiteEsquerdo = ordersList.getBoundingClientRect().left;

  let indiceMaisProximo = 0;

  let menorDistancia = Number.POSITIVE_INFINITY;

  cards.forEach((card, indice) => {
    const distancia = Math.abs(
      card.getBoundingClientRect().left - limiteEsquerdo,
    );

    if (distancia < menorDistancia) {
      menorDistancia = distancia;

      indiceMaisProximo = indice;
    }
  });

  return indiceMaisProximo;
}

function atualizarControlesDoCarrossel() {
  const cards = obterCardsDoCarrossel();

  const quantidade = cards.length;

  if (quantidade === 0) {
    indiceAtualCarrossel = 0;

    ordersCarouselPosition.textContent = "0 de 0";

    previousOrderButton.disabled = true;

    nextOrderButton.disabled = true;

    if (ordersContentHint) {
      ordersContentHint.hidden = true;
    }

    return;
  }

  indiceAtualCarrossel = obterIndiceMaisProximo();

  indiceAtualCarrossel = Math.min(
    Math.max(indiceAtualCarrossel, 0),
    quantidade - 1,
  );

  ordersCarouselPosition.textContent = `${indiceAtualCarrossel + 1} de ${quantidade}`;

  previousOrderButton.disabled = indiceAtualCarrossel === 0;

  nextOrderButton.disabled = indiceAtualCarrossel === quantidade - 1;

  if (ordersContentHint) {
    ordersContentHint.hidden = quantidade <= 1;
  }
}

function agendarAtualizacaoDoCarrossel() {
  if (carouselAnimationFrame) {
    window.cancelAnimationFrame(carouselAnimationFrame);
  }

  carouselAnimationFrame = window.requestAnimationFrame(() => {
    carouselAnimationFrame = null;

    atualizarControlesDoCarrossel();
  });
}

function rolarParaOrdem(indice) {
  const cards = obterCardsDoCarrossel();

  if (cards.length === 0) {
    return;
  }

  const indiceSeguro = Math.min(Math.max(indice, 0), cards.length - 1);

  const card = cards[indiceSeguro];

  const containerRect = ordersList.getBoundingClientRect();

  const cardRect = card.getBoundingClientRect();

  const destino = ordersList.scrollLeft + cardRect.left - containerRect.left;

  ordersList.scrollTo({
    left: destino,
    behavior: "smooth",
  });

  indiceAtualCarrossel = indiceSeguro;
}

function moverCarrossel(direcao) {
  atualizarControlesDoCarrossel();

  rolarParaOrdem(indiceAtualCarrossel + direcao);
}

function resetarCarrossel() {
  indiceAtualCarrossel = 0;

  ordersList.scrollLeft = 0;

  window.requestAnimationFrame(() => {
    atualizarControlesDoCarrossel();
  });
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

  if (listaVazia) {
    atualizarControlesDoCarrossel();

    return;
  }

  resetarCarrossel();
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
   EVENTOS DO CARROSSEL
========================================= */

previousOrderButton.addEventListener("click", () => {
  moverCarrossel(-1);
});

nextOrderButton.addEventListener("click", () => {
  moverCarrossel(1);
});

ordersList.addEventListener("scroll", agendarAtualizacaoDoCarrossel, {
  passive: true,
});

window.addEventListener("resize", agendarAtualizacaoDoCarrossel);

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

    openFilterButton.focus();

    return;
  }

  if (!updateModal.hidden) {
    fecharModalDeAtualizacao();

    return;
  }

  const cardExpandido = document.querySelector(".order-card.is-expanded");

  if (cardExpandido) {
    fecharDetalhesDoCard(cardExpandido);
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function inicializarPagina() {
  try {
    const sessao = await window.salvateckSessionReady;

    if (sessao.role !== "admin") {
      window.location.replace("principal.html");

      return;
    }

    await carregarOrdensDoFirestore();

    sincronizarFormularioComFiltros();

    atualizarContagemDeFiltros();

    renderizarFiltrosAtivos();

    atualizarOpcoesDeOrdenacao();

    atualizarAbas();

    atualizarResumo();

    renderizarOrdens();
  } catch (error) {
    console.error("[Ordens] Não foi possível carregar as ordens:", error);

    ordensDeServico = [];

    atualizarResumo();

    renderizarOrdens();

    mostrarFeedback("Não foi possível carregar as ordens do Firebase.");
  }
}

inicializarPagina();
