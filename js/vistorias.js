/* =========================================
   CONFIGURAÇÕES
========================================= */

const ORDERS_STORAGE_KEY = "salvateckOrdensTemporarias";

const INSPECTIONS_PER_PAGE = 10;

/* =========================================
   CONFIGURAÇÕES DE EXIBIÇÃO
========================================= */

const inspectionTypeConfig = {
  preventive: {
    nome: "Preventiva",
  },

  initial: {
    nome: "Inicial ou diagnóstico",
  },

  return: {
    nome: "Retorno",
  },

  emergency: {
    nome: "Emergencial",
  },
};

const inspectionPriorityConfig = {
  low: {
    nome: "Baixa",
    classe: "priority--low",
  },

  normal: {
    nome: "Normal",
    classe: "priority--normal",
  },

  high: {
    nome: "Alta",
    classe: "priority--high",
  },

  critical: {
    nome: "Crítica",
    classe: "priority--critical",
  },
};

const viewConfig = {
  all: {
    eyebrow: "Acompanhamento técnico",
    title: "Todas as vistorias",
  },

  scheduled: {
    eyebrow: "Próximos atendimentos",
    title: "Vistorias solicitadas e programadas",
  },

  progress: {
    eyebrow: "Execução técnica",
    title: "Vistorias em andamento",
  },

  completed: {
    eyebrow: "Histórico recente",
    title: "Vistorias concluídas",
  },

  overdue: {
    eyebrow: "Atenção necessária",
    title: "Vistorias atrasadas",
  },
};

/* =========================================
   ELEMENTOS
========================================= */

const summaryScheduled = document.getElementById("summary-scheduled");

const summaryProgress = document.getElementById("summary-progress");

const summaryCritical = document.getElementById("summary-critical");

const summaryCompleted = document.getElementById("summary-completed");

const viewButtons = document.querySelectorAll("[data-inspection-view]");

const inspectionsSearch = document.getElementById("inspections-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const activeFiltersList = document.getElementById("active-filters-list");

const typeFilter = document.getElementById("type-filter");

const priorityFilter = document.getElementById("priority-filter");

const periodFilter = document.getElementById("period-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const clearEmptyFiltersButton = document.getElementById(
  "clear-empty-filters-button",
);

const inspectionsContentEyebrow = document.getElementById(
  "inspections-content-eyebrow",
);

const inspectionsContentTitle = document.getElementById(
  "inspections-content-title",
);

const inspectionsCount = document.getElementById("inspections-count");

const inspectionsList = document.getElementById("inspections-list");

const loadMoreButton = document.getElementById("load-more-button");

const emptyState = document.getElementById("empty-state");

const inspectionItemTemplate = document.getElementById(
  "inspection-item-template",
);

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   ESTADO
========================================= */

let inspectionOrders = [];

let currentView = "all";

let currentLimit = INSPECTIONS_PER_PAGE;

let appliedFilters = {
  tipo: "",
  prioridade: "",
  periodo: "",
};

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanText(value) {
  return String(value || "").trim();
}

function clampNumber(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

function getStartOfDay(date = new Date()) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  const dateValue = String(value).split("T")[0];

  const date = new Date(`${dateValue}T12:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseLocalDate(value);

  if (!date) {
    return "Data não informada";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isCurrentMonth(value) {
  const date = parseLocalDate(value);

  const today = new Date();

  if (!date) {
    return false;
  }

  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function formatQuantity(quantity, singular, plural) {
  const value = Number(quantity) || 0;

  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

function formatInspectionQuantity(quantity) {
  return formatQuantity(quantity, "vistoria", "vistorias");
}

function showFeedback(message) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;

  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3000);
}

/* =========================================
   LEITURA DAS ORDENS
========================================= */

function loadOrders() {
  try {
    const savedData = JSON.parse(
      localStorage.getItem(ORDERS_STORAGE_KEY) || "[]",
    );

    const orders = Array.isArray(savedData) ? savedData : [];

    inspectionOrders = orders
      .filter(isInspectionOrder)
      .map(normalizeInspectionOrder);
  } catch (error) {
    console.warn("Não foi possível carregar as ordens de vistoria.", error);

    inspectionOrders = [];
  }
}

function isInspectionOrder(order) {
  if (!order) {
    return false;
  }

  if (normalizeText(order.tipoAtendimento) === "vistoria") {
    return true;
  }

  if (normalizeText(order.categoriaPrincipal) === "vistoria") {
    return true;
  }

  if (
    Array.isArray(order.categorias) &&
    order.categorias.some((category) => normalizeText(category) === "vistoria")
  ) {
    return true;
  }

  return Boolean(order.vistoria);
}

/* =========================================
   NORMALIZAÇÃO DOS DADOS
========================================= */

function getInspectionType(order) {
  const text = normalizeText(
    order.vistoria?.tipo || order.servicoPrincipal || order.titulo,
  );

  if (text.includes("preventiva")) {
    return "preventive";
  }

  if (text.includes("retorno")) {
    return "return";
  }

  if (text.includes("emergencial")) {
    return "emergency";
  }

  return "initial";
}

function getInspectionPriority(order) {
  const priority = normalizeText(
    order.vistoria?.prioridade || order.prioridade,
  );

  const map = {
    baixa: "low",
    low: "low",

    normal: "normal",

    alta: "high",
    high: "high",

    critica: "critical",
    critical: "critical",
    urgente: "critical",
  };

  return map[priority] || "normal";
}

function getOrderDate(order) {
  return (
    order.atendimento?.dataPreferida ||
    order.dataAgendada ||
    order.criadoEm ||
    ""
  );
}

function getCompletedDate(order) {
  return (
    order.vistoria?.concluidaEm ||
    order.concluidaEm ||
    order.atualizadoEm ||
    getOrderDate(order)
  );
}

function getAddressSummary(order) {
  if (cleanText(order.endereco?.resumo)) {
    return order.endereco.resumo;
  }

  const firstLine = [
    order.endereco?.rua,
    order.endereco?.numero,
    order.endereco?.complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const secondLine = [order.endereco?.bairro, order.endereco?.cidade]
    .filter(Boolean)
    .join(" — ");

  return (
    [firstLine, secondLine].filter(Boolean).join(" | ") ||
    "Endereço não informado"
  );
}

function getInspectionMainName(order) {
  return (
    order.condominio?.nome ||
    order.cliente?.nome ||
    "Vistoria sem identificação"
  );
}

function getResponsibleName(order) {
  return (
    order.responsavel?.nome ||
    order.executor?.nome ||
    order.vistoria?.responsavel ||
    order.responsavel ||
    "Ainda não definido"
  );
}

function getInspectionObservation(order) {
  return (
    order.vistoria?.observacao ||
    order.observacoes?.interna ||
    order.observacoes?.cliente ||
    ""
  );
}

function normalizeInspectionOrder(order, index) {
  const progress = clampNumber(
    order.vistoria?.progresso ?? order.progresso,
    0,
    100,
  );

  return {
    original: order,

    id: order.id || `ordem-vistoria-${index + 1}`,

    codigo: order.codigo || `OS-${String(index + 1).padStart(4, "0")}`,

    titulo:
      order.titulo ||
      order.servicoPrincipal ||
      order.vistoria?.tipo ||
      "Vistoria técnica",

    tipo: getInspectionType(order),

    prioridade: getInspectionPriority(order),

    dataAgendada: getOrderDate(order),

    concluidaEm: getCompletedDate(order),

    condominioId: order.condominio?.id || "",

    condominio: order.condominio?.nome || "",

    clienteId: order.cliente?.id || "",

    cliente: order.cliente?.nome || "Cliente não informado",

    nomePrincipal: getInspectionMainName(order),

    endereco: getAddressSummary(order),

    responsavel: getResponsibleName(order),

    progresso: progress,

    totalItens: Number(order.vistoria?.totalItens) || 0,

    itensConcluidos: Number(order.vistoria?.itensConcluidos) || 0,

    equipamentosAvaliados: Number(order.vistoria?.equipamentosAvaliados) || 0,

    naoConformidades: Number(order.vistoria?.naoConformidades) || 0,

    pendenciasCriticas: Number(order.vistoria?.pendenciasCriticas) || 0,

    fotos:
      Number(order.vistoria?.quantidadeFotos ?? order.quantidadeFotos) || 0,

    observacao: getInspectionObservation(order),

    statusOriginal:
      order.vistoria?.status || order.status || "nova-solicitacao",
  };
}

/* =========================================
   STATUS
========================================= */

function getStatusData(inspection) {
  const status = normalizeText(inspection.statusOriginal);

  if (status.includes("cancel") || status.includes("recus")) {
    return {
      grupo: "cancelled",
      nome: "Cancelada",
      classe: "status--cancelled",
    };
  }

  if (
    status.includes("conclu") ||
    status.includes("finaliz") ||
    status === "completed"
  ) {
    return {
      grupo: "completed",
      nome: "Concluída",
      classe: "status--completed",
    };
  }

  if (
    status.includes("andamento") ||
    status.includes("iniciad") ||
    status === "progress"
  ) {
    return {
      grupo: "progress",
      nome: "Em andamento",
      classe: "status--progress",
    };
  }

  if (status.includes("atras") || status === "overdue") {
    return {
      grupo: "overdue",
      nome: "Atrasada",
      classe: "status--overdue",
    };
  }

  const scheduledDate = parseLocalDate(inspection.dataAgendada);

  const today = getStartOfDay();

  if (scheduledDate && scheduledDate < today) {
    return {
      grupo: "overdue",
      nome: "Atrasada",
      classe: "status--overdue",
    };
  }

  const requested = status.includes("solicit") || status.includes("nova");

  return {
    grupo: "scheduled",

    nome: requested ? "Solicitada" : "Programada",

    classe: "status--scheduled",
  };
}

/* =========================================
   RESUMO
========================================= */

function updateSummary() {
  const scheduled = inspectionOrders.filter(
    (inspection) => getStatusData(inspection).grupo === "scheduled",
  ).length;

  const inProgress = inspectionOrders.filter(
    (inspection) => getStatusData(inspection).grupo === "progress",
  ).length;

  const critical = inspectionOrders
    .filter((inspection) => getStatusData(inspection).grupo !== "completed")
    .reduce((total, inspection) => total + inspection.pendenciasCriticas, 0);

  const completed = inspectionOrders.filter(
    (inspection) =>
      getStatusData(inspection).grupo === "completed" &&
      isCurrentMonth(inspection.concluidaEm),
  ).length;

  summaryScheduled.textContent = String(scheduled);

  summaryProgress.textContent = String(inProgress);

  summaryCritical.textContent = String(critical);

  summaryCompleted.textContent = String(completed);
}

/* =========================================
   ABAS
========================================= */

function updateViewHeading() {
  const configuration = viewConfig[currentView] || viewConfig.all;

  inspectionsContentEyebrow.textContent = configuration.eyebrow;

  inspectionsContentTitle.textContent = configuration.title;
}

function changeView(view) {
  currentView = view;

  currentLimit = INSPECTIONS_PER_PAGE;

  viewButtons.forEach((button) => {
    const active = button.dataset.inspectionView === view;

    button.classList.toggle("is-active", active);

    button.setAttribute("aria-pressed", String(active));
  });

  updateViewHeading();
  renderInspections();
}

/* =========================================
   PESQUISA
========================================= */

function matchesSearch(inspection) {
  const search = normalizeText(inspectionsSearch.value);

  if (!search) {
    return true;
  }

  const typeName = inspectionTypeConfig[inspection.tipo]?.nome || "";

  const statusName = getStatusData(inspection).nome;

  const priorityName =
    inspectionPriorityConfig[inspection.prioridade]?.nome || "";

  const content = normalizeText(
    [
      inspection.codigo,
      inspection.titulo,
      inspection.nomePrincipal,
      inspection.cliente,
      inspection.condominio,
      inspection.endereco,
      inspection.responsavel,
      typeName,
      statusName,
      priorityName,
      inspection.observacao,
    ].join(" "),
  );

  return content.includes(search);
}

/* =========================================
   FILTRO DE PERÍODO
========================================= */

function matchesPeriod(inspection) {
  const period = appliedFilters.periodo;

  if (!period) {
    return true;
  }

  const inspectionDate = parseLocalDate(inspection.dataAgendada);

  if (!inspectionDate) {
    return false;
  }

  const today = getStartOfDay();

  const difference = Math.floor(
    (getStartOfDay(inspectionDate) - today) / (1000 * 60 * 60 * 24),
  );

  if (period === "today") {
    return difference === 0;
  }

  if (period === "next-7") {
    return difference >= 0 && difference <= 7;
  }

  if (period === "this-month") {
    return (
      inspectionDate.getMonth() === today.getMonth() &&
      inspectionDate.getFullYear() === today.getFullYear()
    );
  }

  if (period === "last-30") {
    return difference <= 0 && difference >= -30;
  }

  return true;
}

/* =========================================
   FILTROS
========================================= */

function matchesFilters(inspection) {
  const typeMatches =
    !appliedFilters.tipo || inspection.tipo === appliedFilters.tipo;

  const priorityMatches =
    !appliedFilters.prioridade ||
    inspection.prioridade === appliedFilters.prioridade;

  return typeMatches && priorityMatches && matchesPeriod(inspection);
}

function matchesCurrentView(inspection) {
  if (currentView === "all") {
    return true;
  }

  return getStatusData(inspection).grupo === currentView;
}

function getFilteredInspections() {
  return inspectionOrders
    .filter(matchesCurrentView)
    .filter(matchesSearch)
    .filter(matchesFilters)
    .sort(sortInspections);
}

/* =========================================
   ORDENAÇÃO
========================================= */

function sortInspections(first, second) {
  const statusOrder = {
    overdue: 1,
    progress: 2,
    scheduled: 3,
    completed: 4,
    cancelled: 5,
  };

  const firstStatus = getStatusData(first).grupo;

  const secondStatus = getStatusData(second).grupo;

  const statusDifference =
    (statusOrder[firstStatus] || 99) - (statusOrder[secondStatus] || 99);

  if (statusDifference !== 0) {
    return statusDifference;
  }

  const firstDate = parseLocalDate(first.dataAgendada)?.getTime() || 0;

  const secondDate = parseLocalDate(second.dataAgendada)?.getTime() || 0;

  if (firstStatus === "completed") {
    return secondDate - firstDate;
  }

  return firstDate - secondDate;
}

/* =========================================
   FILTROS VISUAIS
========================================= */

function countActiveFilters() {
  return Object.values(appliedFilters).filter(Boolean).length;
}

function updateFilterCount() {
  const quantity = countActiveFilters();

  activeFilterCount.textContent = String(quantity);

  activeFilterCount.hidden = quantity === 0;
}

function synchronizeFilterForm() {
  typeFilter.value = appliedFilters.tipo;

  priorityFilter.value = appliedFilters.prioridade;

  periodFilter.value = appliedFilters.periodo;
}

function createFilterChip(text, removeAction) {
  const chip = document.createElement("span");

  chip.className = "active-filter-chip";

  const label = document.createElement("span");

  label.textContent = text;

  const button = document.createElement("button");

  button.type = "button";
  button.textContent = "×";

  button.setAttribute("aria-label", `Remover filtro ${text}`);

  button.addEventListener("click", removeAction);

  chip.append(label, button);

  return chip;
}

function renderActiveFilters() {
  activeFiltersList.innerHTML = "";

  if (appliedFilters.tipo) {
    activeFiltersList.appendChild(
      createFilterChip(
        inspectionTypeConfig[appliedFilters.tipo]?.nome || appliedFilters.tipo,

        () => {
          appliedFilters.tipo = "";
          finishFilterRemoval();
        },
      ),
    );
  }

  if (appliedFilters.prioridade) {
    activeFiltersList.appendChild(
      createFilterChip(
        inspectionPriorityConfig[appliedFilters.prioridade]?.nome ||
          appliedFilters.prioridade,

        () => {
          appliedFilters.prioridade = "";
          finishFilterRemoval();
        },
      ),
    );
  }

  if (appliedFilters.periodo) {
    const periodNames = {
      today: "Hoje",
      "next-7": "Próximos 7 dias",
      "this-month": "Este mês",
      "last-30": "Últimos 30 dias",
    };

    activeFiltersList.appendChild(
      createFilterChip(
        periodNames[appliedFilters.periodo] || appliedFilters.periodo,

        () => {
          appliedFilters.periodo = "";
          finishFilterRemoval();
        },
      ),
    );
  }

  activeFiltersList.hidden = activeFiltersList.children.length === 0;
}

function finishFilterRemoval() {
  synchronizeFilterForm();
  updateFilterCount();
  renderActiveFilters();

  currentLimit = INSPECTIONS_PER_PAGE;

  renderInspections();
}

function openFilters() {
  filterPanel.hidden = false;

  openFilterButton.setAttribute("aria-expanded", "true");
}

function closeFilters() {
  filterPanel.hidden = true;

  openFilterButton.setAttribute("aria-expanded", "false");
}

function applyFilters() {
  appliedFilters = {
    tipo: typeFilter.value,

    prioridade: priorityFilter.value,

    periodo: periodFilter.value,
  };

  currentLimit = INSPECTIONS_PER_PAGE;

  updateFilterCount();
  renderActiveFilters();
  closeFilters();
  renderInspections();

  showFeedback("Filtros aplicados.");
}

function clearSearchAndFilters() {
  inspectionsSearch.value = "";

  appliedFilters = {
    tipo: "",
    prioridade: "",
    periodo: "",
  };

  currentLimit = INSPECTIONS_PER_PAGE;

  synchronizeFilterForm();
  updateFilterCount();
  renderActiveFilters();
  closeFilters();
  renderInspections();

  showFeedback("Pesquisa e filtros removidos.");
}

/* =========================================
   LINKS
========================================= */

function createOrderDetailsURL(inspection) {
  const parameters = new URLSearchParams({
    perfil: "admin",
    id: inspection.id,
    ordem: inspection.id,
  });

  return `detalhes-solicitacao.html?` + parameters.toString();
}

function createCorrectiveOrderURL(inspection) {
  const parameters = new URLSearchParams({
    perfil: "admin",
    origem: "vistoria",
    ordemOrigemId: inspection.id,
    tipo: "servico",
  });

  if (inspection.clienteId) {
    parameters.set("cliente", inspection.clienteId);
  }

  if (inspection.condominioId) {
    parameters.set("condominio", inspection.condominioId);
  }

  return `nova-ordem.html?` + parameters.toString();
}

/* =========================================
   ITEM DA LISTA
========================================= */

function createInspectionItem(inspection) {
  const fragment = inspectionItemTemplate.content.cloneNode(true);

  const item = fragment.querySelector(".inspection-item");

  const code = fragment.querySelector(".inspection-item__code");

  const type = fragment.querySelector(".inspection-item__type");

  const status = fragment.querySelector(".inspection-item__status");

  const condominium = fragment.querySelector(".inspection-item__condominium");

  const reference = fragment.querySelector(".inspection-item__reference");

  const progressValue = fragment.querySelector(
    ".inspection-item__progress-value",
  );

  const progressFill = fragment.querySelector(
    ".inspection-item__progress-fill",
  );

  const date = fragment.querySelector(".inspection-item__date");

  const priority = fragment.querySelector(".inspection-item__priority");

  const toggleButton = fragment.querySelector(".inspection-item__toggle");

  const details = fragment.querySelector(".inspection-item__details");

  const responsible = fragment.querySelector(".inspection-item__responsible");

  const client = fragment.querySelector(".inspection-item__client");

  const equipmentCount = fragment.querySelector(
    ".inspection-item__equipment-count",
  );

  const nonconformities = fragment.querySelector(
    ".inspection-item__nonconformities",
  );

  const criticalCount = fragment.querySelector(
    ".inspection-item__critical-count",
  );

  const photoCount = fragment.querySelector(".inspection-item__photo-count");

  const observation = fragment.querySelector(".inspection-item__observation");

  const observationText = observation.querySelector("p");

  const viewAction = fragment.querySelector('[data-inspection-action="view"]');

  const continueAction = fragment.querySelector(
    '[data-inspection-action="continue"]',
  );

  const orderAction = fragment.querySelector(
    '[data-inspection-action="order"]',
  );

  const statusData = getStatusData(inspection);

  const typeData = inspectionTypeConfig[inspection.tipo];

  const priorityData = inspectionPriorityConfig[inspection.prioridade];

  item.dataset.inspectionId = inspection.id;

  item.classList.add(statusData.classe);

  code.textContent = inspection.codigo;

  type.textContent = inspection.titulo || typeData?.nome || "Vistoria técnica";

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  condominium.textContent = inspection.nomePrincipal;

  reference.textContent =
    [
      inspection.cliente !== inspection.nomePrincipal ? inspection.cliente : "",

      inspection.endereco,
    ]
      .filter(Boolean)
      .join(" · ") || "Sem referência cadastrada";

  progressValue.textContent = `${inspection.progresso}%`;

  progressFill.style.width = `${inspection.progresso}%`;

  date.textContent = `Data: ${formatDate(inspection.dataAgendada)}`;

  priority.textContent = `Prioridade: ${priorityData?.nome || "Normal"}`;

  priority.classList.add(priorityData?.classe || "priority--normal");

  responsible.textContent = inspection.responsavel;

  client.textContent = inspection.cliente;

  equipmentCount.textContent = formatQuantity(
    inspection.equipamentosAvaliados,
    "equipamento",
    "equipamentos",
  );

  nonconformities.textContent = formatQuantity(
    inspection.naoConformidades,
    "não conformidade",
    "não conformidades",
  );

  if (inspection.naoConformidades > 0) {
    nonconformities.classList.add("has-alert");
  }

  criticalCount.textContent =
    inspection.pendenciasCriticas > 0
      ? formatQuantity(
          inspection.pendenciasCriticas,
          "pendência crítica",
          "pendências críticas",
        )
      : "Nenhuma";

  if (inspection.pendenciasCriticas > 0) {
    criticalCount.classList.add("has-alert");
  }

  photoCount.textContent = formatQuantity(inspection.fotos, "foto", "fotos");

  const hasObservation = cleanText(inspection.observacao).length > 0;

  observation.hidden = !hasObservation;

  if (hasObservation) {
    observationText.textContent = inspection.observacao;
  }

  toggleButton.addEventListener("click", () => {
    const willOpen = details.hidden;

    document
      .querySelectorAll(".inspection-item__details")
      .forEach((otherDetails) => {
        if (otherDetails !== details) {
          otherDetails.hidden = true;

          const otherItem = otherDetails.closest(".inspection-item");

          const otherButton = otherItem?.querySelector(
            ".inspection-item__toggle",
          );

          if (otherButton) {
            otherButton.textContent = "Ver mais";

            otherButton.setAttribute("aria-expanded", "false");
          }
        }
      });

    details.hidden = !willOpen;

    toggleButton.textContent = willOpen ? "Ver menos" : "Ver mais";

    toggleButton.setAttribute("aria-expanded", String(willOpen));
  });

  viewAction.href = createOrderDetailsURL(inspection);

  viewAction.textContent = "Abrir OS";

  continueAction.hidden = true;

  const canGenerateCorrectiveOrder =
    statusData.grupo === "completed" && inspection.naoConformidades > 0;

  orderAction.hidden = !canGenerateCorrectiveOrder;

  orderAction.textContent = "Gerar OS corretiva";

  orderAction.addEventListener("click", () => {
    window.location.href = createCorrectiveOrderURL(inspection);
  });

  return fragment;
}

/* =========================================
   RENDERIZAÇÃO
========================================= */

function renderInspections() {
  const filteredInspections = getFilteredInspections();

  inspectionsList.innerHTML = "";

  const visibleInspections = filteredInspections.slice(0, currentLimit);

  visibleInspections.forEach((inspection) => {
    inspectionsList.appendChild(createInspectionItem(inspection));
  });

  inspectionsCount.textContent = formatInspectionQuantity(
    filteredInspections.length,
  );

  const empty = filteredInspections.length === 0;

  inspectionsList.hidden = empty;

  emptyState.hidden = !empty;

  const remaining = filteredInspections.length - visibleInspections.length;

  loadMoreButton.hidden = empty || remaining <= 0;

  if (remaining > 0) {
    const quantity = Math.min(INSPECTIONS_PER_PAGE, remaining);

    loadMoreButton.textContent = `Mostrar mais ${formatInspectionQuantity(
      quantity,
    )}`;
  }
}

/* =========================================
   ABERTURA PELA URL
========================================= */

function openInspectionFromURL() {
  const parameters = new URLSearchParams(window.location.search);

  const inspectionId = parameters.get("ordem") || parameters.get("vistoria");

  if (!inspectionId) {
    return;
  }

  currentLimit = inspectionOrders.length;

  renderInspections();

  window.setTimeout(() => {
    const item = inspectionsList.querySelector(
      `[data-inspection-id="${inspectionId}"]`,
    );

    const toggle = item?.querySelector(".inspection-item__toggle");

    if (!item || !toggle) {
      return;
    }

    toggle.click();

    item.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, 80);
}

/* =========================================
   EVENTOS
========================================= */

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeView(button.dataset.inspectionView);
  });
});

inspectionsSearch.addEventListener("input", () => {
  currentLimit = INSPECTIONS_PER_PAGE;

  renderInspections();
});

openFilterButton.addEventListener("click", openFilters);

closeFilterButton.addEventListener("click", closeFilters);

applyFiltersButton.addEventListener("click", applyFilters);

clearFiltersButton.addEventListener("click", clearSearchAndFilters);

clearEmptyFiltersButton.addEventListener("click", clearSearchAndFilters);

loadMoreButton.addEventListener("click", () => {
  currentLimit += INSPECTIONS_PER_PAGE;

  renderInspections();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!filterPanel.hidden) {
    closeFilters();
    return;
  }

  const openDetails = document.querySelector(
    ".inspection-item__details:not([hidden])",
  );

  if (!openDetails) {
    return;
  }

  openDetails.hidden = true;

  const item = openDetails.closest(".inspection-item");

  const toggle = item?.querySelector(".inspection-item__toggle");

  if (toggle) {
    toggle.textContent = "Ver mais";

    toggle.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== ORDERS_STORAGE_KEY) {
    return;
  }

  loadOrders();
  updateSummary();

  currentLimit = INSPECTIONS_PER_PAGE;

  renderInspections();
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

loadOrders();

synchronizeFilterForm();

updateFilterCount();

renderActiveFilters();

updateSummary();

changeView("all");

openInspectionFromURL();
