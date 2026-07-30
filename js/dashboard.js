import "./auth-guard.js";

import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

/* =========================================
   CONFIGURAÇÕES
========================================= */

const orderStatusLabels = {
  "nova-solicitacao": "Nova solicitação",
  "em-analise": "Em análise",
  "aguardando-confirmacao": "Aguardando confirmação",
  agendada: "Agendada",
  "em-andamento": "Em andamento",
  atrasada: "Atrasada",
  concluida: "Concluída",
  recusada: "Recusada",
  cancelada: "Cancelada",
};

const categoryLabels = {
  hidraulica: "Hidráulica",
  eletrica: "Elétrica",
  pintura: "Pintura",
  alvenaria: "Alvenaria",
  instalacoes: "Instalações",
  "manutencao-geral": "Manutenção geral",
  vistoria: "Vistoria técnica",
};

const demandOriginLabels = {
  "solicitacao-cliente": "Solicitações dos clientes",
  "cadastro-admin": "Cadastradas pelo administrador",
  vistoria: "Geradas por vistorias",
};

const finalOrderStatuses = new Set(["concluida", "recusada", "cancelada"]);

const chartColors = {
  blue: "#0D3861",
  gold: "#DD9A17",
  green: "#248B58",
  red: "#A23C3C",
  orange: "#B66C16",
  purple: "#6C5AA7",
  lightBlue: "#2D74B5",
  gray: "#AAB2B9",
};

/* =========================================
   ELEMENTOS
========================================= */

const updatedAt = document.getElementById("dashboard-updated-at");
const periodFilter = document.getElementById("dashboard-period-filter");
const condominiumFilter = document.getElementById(
  "dashboard-condominium-filter",
);
const refreshButton = document.getElementById("dashboard-refresh-button");
const loading = document.getElementById("dashboard-loading");
const content = document.getElementById("dashboard-content");
const feedback = document.getElementById("dashboard-feedback");

const metricOpenOrders = document.getElementById("metric-open-orders");
const metricProgressOrders = document.getElementById("metric-progress-orders");
const metricScheduledOrders = document.getElementById(
  "metric-scheduled-orders",
);
const metricOverdueOrders = document.getElementById("metric-overdue-orders");
const metricCompletedOrders = document.getElementById(
  "metric-completed-orders",
);
const metricCompletedOrdersLabel = metricCompletedOrders
  ?.closest(".dashboard-metric-card")
  ?.querySelector("div > span");
const metricUnlinkedInspections = document.getElementById(
  "metric-unlinked-inspections",
);

const attentionCount = document.getElementById("attention-count");
const attentionList = document.getElementById("attention-list");
const attentionEmpty = document.getElementById("attention-empty");

const upcomingCount = document.getElementById("upcoming-count");
const upcomingList = document.getElementById("upcoming-list");
const upcomingEmpty = document.getElementById("upcoming-empty");

const financeReceived = document.getElementById("finance-received");
const financeReceivable = document.getElementById("finance-receivable");
const financeOverdue = document.getElementById("finance-overdue");
const financeExpenses = document.getElementById("finance-expenses");
const financeBalance = document.getElementById("finance-balance");
const financeBalanceCard = financeBalance?.closest(
  ".dashboard-finance-card--balance",
);

/* =========================================
   ESTADO
========================================= */

let currentSession = null;
let orders = [];
let inspections = [];
let condominiums = [];
let financialEntries = [];
let charts = {};
let feedbackTimeout;
let loadingDashboard = false;

/* =========================================
   UTILITÁRIOS
========================================= */

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeOrderStatus(value) {
  const status = normalizeText(value).replace(/\s+/g, "-");

  const aliases = {
    nova: "nova-solicitacao",
    "nova-solicitacao": "nova-solicitacao",
    analise: "em-analise",
    "em-analise": "em-analise",
    "aguardando-confirmacao": "aguardando-confirmacao",
    agendada: "agendada",
    agendado: "agendada",
    andamento: "em-andamento",
    "em-andamento": "em-andamento",
    iniciada: "em-andamento",
    iniciado: "em-andamento",
    concluida: "concluida",
    concluido: "concluida",
    finalizada: "concluida",
    finalizado: "concluida",
    recusada: "recusada",
    recusado: "recusada",
    cancelada: "cancelada",
    cancelado: "cancelada",
  };

  return aliases[status] || status || "nova-solicitacao";
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (value instanceof Date) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T12:00:00`)
    : new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getPeriodRange(period = periodFilter.value) {
  const now = new Date();
  const end = endOfDay(now);
  let start = null;

  if (period === "this-month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (period === "last-30") {
    start = startOfDay(now);
    start.setDate(start.getDate() - 29);
  }

  if (period === "last-90") {
    start = startOfDay(now);
    start.setDate(start.getDate() - 89);
  }

  if (period === "this-year") {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return {
    start,
    end,
  };
}

function isDateInSelectedPeriod(value) {
  if (periodFilter.value === "all") {
    return true;
  }

  const date = toDate(value);

  if (!date) {
    return false;
  }

  const range = getPeriodRange();

  return date >= range.start && date <= range.end;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  const date = toDate(value);

  return date
    ? date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Data não informada";
}

function formatDateTime(value) {
  const date = toDate(value);

  return date
    ? date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Não informado";
}

function showFeedback(message, type = "success") {
  window.clearTimeout(feedbackTimeout);

  feedback.textContent = message;
  feedback.classList.toggle("is-error", type === "error");
  feedback.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedback.hidden = true;
  }, 3800);
}

function getSelectedCondominiumId() {
  return String(condominiumFilter.value || "").trim();
}

function getReferenceId(reference, fallback = "") {
  if (reference && typeof reference === "object") {
    return String(reference.id || fallback || "").trim();
  }

  return String(reference || fallback || "").trim();
}

function getOrderCondominiumId(order) {
  return getReferenceId(order.condominio, order.condominioId);
}

function getInspectionCondominiumId(inspection) {
  return getReferenceId(inspection.condominio, inspection.condominioId);
}

function getFinancialCondominiumId(entry) {
  return getReferenceId(entry.condominio, entry.condominioId);
}

function matchesSelectedCondominium(item, getId) {
  const selectedId = getSelectedCondominiumId();

  return !selectedId || getId(item) === selectedId;
}

function getOrderCreatedDate(order) {
  return order.criadoEm || order.createdAt || null;
}

function getOrderCompletedDate(order) {
  return (
    order.concluidaEm ||
    order.documentoFinal?.concluidaEm ||
    order.vistoria?.concluidaEm ||
    null
  );
}

function getOrderScheduledDate(order) {
  return order.atendimento?.dataConfirmada || null;
}

function getOrderReferenceDate(order) {
  const status = normalizeOrderStatus(order.status);

  if (status === "concluida") {
    return getOrderCompletedDate(order) || getOrderCreatedDate(order);
  }

  if (status === "agendada" || status === "em-andamento") {
    return getOrderScheduledDate(order) || getOrderCreatedDate(order);
  }

  return getOrderCreatedDate(order) || order.atualizadoEm || null;
}

function getInspectionReferenceDate(inspection) {
  return (
    inspection.validadaEm ||
    inspection.concluidaEm ||
    inspection.atualizadoEm ||
    inspection.criadoEm ||
    null
  );
}

function getFinancialReferenceDate(entry) {
  return entry.status === "paid"
    ? entry.pagamentoEm || entry.vencimento
    : entry.vencimento || entry.criadoEm;
}

function getEffectiveFinancialStatus(entry) {
  const status = String(entry.status || "pending").trim();
  const dueDate = toDate(entry.vencimento);

  if (
    status === "pending" &&
    dueDate &&
    startOfDay(dueDate) < startOfDay(new Date())
  ) {
    return "overdue";
  }

  return status;
}

function getCondominiumNameById(id) {
  return (
    condominiums.find((condominium) => condominium.id === id)?.nome ||
    "Condomínio não informado"
  );
}

function getOrderCondominiumName(order) {
  return (
    String(order.condominio?.nome || "").trim() ||
    getCondominiumNameById(getOrderCondominiumId(order))
  );
}

function getOrderServiceName(order) {
  const category = String(
    order.categoriaPrincipal || order.categorias?.[0] || "",
  ).trim();

  return (
    String(order.servicoPrincipal || order.titulo || "").trim() ||
    categoryLabels[category] ||
    "Atendimento não informado"
  );
}

function getOrderDemandOrigin(order) {
  const originType = normalizeText(order.origem?.tipo).replace(/\s+/g, "-");

  return demandOriginLabels[originType] || "Origem não informada";
}

function getOrderStatusData(order) {
  const status = normalizeOrderStatus(order.status);
  const scheduledDate = toDate(getOrderScheduledDate(order));
  const isOverdue =
    status === "agendada" &&
    scheduledDate &&
    startOfDay(scheduledDate) < startOfDay(new Date());

  return {
    status,
    isOverdue: Boolean(isOverdue),
    isFinal: finalOrderStatuses.has(status),
  };
}

function isUnlinkedInspectionRequiringOrder(inspection) {
  const linkedOrderId = String(
    inspection.ordemId || inspection.origem?.ordemId || "",
  ).trim();

  return (
    inspection.validada === true &&
    inspection.ordemVinculada !== true &&
    !linkedOrderId &&
    Number(inspection.naoConformidades || 0) > 0
  );
}

/* =========================================
   FIRESTORE
========================================= */

async function loadCollection(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));

  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  }));
}

async function loadDashboardData() {
  const results = await Promise.allSettled([
    loadCollection("ordens"),
    loadCollection("vistorias"),
    loadCollection("condominios"),
    loadCollection("financeiro"),
  ]);

  const [ordersResult, inspectionsResult, condominiumsResult, financeResult] =
    results;

  orders = ordersResult.status === "fulfilled" ? ordersResult.value : [];
  inspections =
    inspectionsResult.status === "fulfilled" ? inspectionsResult.value : [];
  condominiums =
    condominiumsResult.status === "fulfilled" ? condominiumsResult.value : [];
  financialEntries =
    financeResult.status === "fulfilled" ? financeResult.value : [];

  const failures = results.filter((result) => result.status === "rejected");

  failures.forEach((failure) => {
    console.error("[Dashboard] Falha ao carregar coleção:", failure.reason);
  });

  return failures.length;
}

/* =========================================
   FILTROS
========================================= */

function populateCondominiumFilter() {
  const selectedValue = condominiumFilter.value;

  condominiumFilter.innerHTML =
    '<option value="">Todos os condomínios</option>';

  condominiums
    .map((condominium) => ({
      id: condominium.id,
      codigo: String(condominium.codigo || "").trim(),
      nome: String(condominium.nome || "Condomínio sem nome").trim(),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .forEach((condominium) => {
      const option = document.createElement("option");
      option.value = condominium.id;
      option.textContent = [condominium.codigo, condominium.nome]
        .filter(Boolean)
        .join(" — ");
      condominiumFilter.appendChild(option);
    });

  condominiumFilter.value = Array.from(condominiumFilter.options).some(
    (option) => option.value === selectedValue,
  )
    ? selectedValue
    : "";
}

function getFilteredOrders() {
  return orders.filter(
    (order) =>
      matchesSelectedCondominium(order, getOrderCondominiumId) &&
      isDateInSelectedPeriod(getOrderReferenceDate(order)),
  );
}

function getFilteredInspections() {
  return inspections.filter(
    (inspection) =>
      matchesSelectedCondominium(inspection, getInspectionCondominiumId) &&
      isDateInSelectedPeriod(getInspectionReferenceDate(inspection)),
  );
}

function getFilteredFinancialEntries() {
  return financialEntries.filter(
    (entry) =>
      matchesSelectedCondominium(entry, getFinancialCondominiumId) &&
      isDateInSelectedPeriod(getFinancialReferenceDate(entry)),
  );
}

/* =========================================
   MÉTRICAS OPERACIONAIS
========================================= */

function renderOperationalMetrics() {
  const filteredOrders = getFilteredOrders();
  const filteredInspections = getFilteredInspections();

  const openOrders = filteredOrders.filter(
    (order) => !getOrderStatusData(order).isFinal,
  );

  const progressOrders = filteredOrders.filter(
    (order) => getOrderStatusData(order).status === "em-andamento",
  );

  const scheduledOrders = filteredOrders.filter((order) => {
    const statusData = getOrderStatusData(order);
    return statusData.status === "agendada" && !statusData.isOverdue;
  });

  const overdueOrders = filteredOrders.filter(
    (order) => getOrderStatusData(order).isOverdue,
  );

  const completedOrders = filteredOrders.filter(
    (order) => getOrderStatusData(order).status === "concluida",
  );

  const unlinkedInspections = filteredInspections.filter(
    isUnlinkedInspectionRequiringOrder,
  );

  metricOpenOrders.textContent = String(openOrders.length);
  metricProgressOrders.textContent = String(progressOrders.length);
  metricScheduledOrders.textContent = String(scheduledOrders.length);
  metricOverdueOrders.textContent = String(overdueOrders.length);
  metricCompletedOrders.textContent = String(completedOrders.length);

  if (metricCompletedOrdersLabel) {
    metricCompletedOrdersLabel.textContent =
      periodFilter.value === "this-month"
        ? "Concluídas no mês"
        : "Concluídas no período";
  }

  metricUnlinkedInspections.textContent = String(unlinkedInspections.length);
}

/* =========================================
   CHART.JS
========================================= */

function destroyChart(chartName) {
  if (charts[chartName]) {
    charts[chartName].destroy();
    charts[chartName] = null;
  }
}

function toggleChartEmpty(canvasId, emptyId, hasData) {
  const canvas = document.getElementById(canvasId);
  const empty = document.getElementById(emptyId);

  canvas.hidden = !hasData;
  empty.hidden = hasData;
}

function createChart(chartName, canvasId, emptyId, configuration, hasData) {
  destroyChart(chartName);
  toggleChartEmpty(canvasId, emptyId, hasData);

  if (!hasData || !window.Chart) {
    return;
  }

  const canvas = document.getElementById(canvasId);
  charts[chartName] = new window.Chart(canvas, configuration);
}

function getBaseChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#2B2F33",
          boxWidth: 13,
          boxHeight: 13,
          usePointStyle: true,
          font: {
            family: "Montserrat",
            size: 11,
            weight: "600",
          },
        },
      },
      tooltip: {
        titleFont: {
          family: "Montserrat",
          weight: "700",
        },
        bodyFont: {
          family: "Montserrat",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#68717C",
          font: {
            family: "Montserrat",
            size: 10,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#68717C",
          font: {
            family: "Montserrat",
            size: 10,
          },
        },
        grid: {
          color: "rgba(13, 56, 97, 0.08)",
        },
      },
    },
  };
}

function renderOrderStatusChart() {
  const filteredOrders = getFilteredOrders();
  const statusOrder = [
    "nova-solicitacao",
    "em-analise",
    "aguardando-confirmacao",
    "agendada",
    "em-andamento",
    "atrasada",
    "concluida",
    "cancelada",
    "recusada",
  ];

  const counts = Object.fromEntries(statusOrder.map((status) => [status, 0]));

  filteredOrders.forEach((order) => {
    const statusData = getOrderStatusData(order);
    const status = statusData.isOverdue ? "atrasada" : statusData.status;

    if (Object.hasOwn(counts, status)) {
      counts[status] += 1;
    }
  });

  const entries = statusOrder
    .map((status) => [status, counts[status]])
    .filter(([, quantity]) => quantity > 0);

  createChart(
    "orderStatus",
    "orders-status-chart",
    "orders-status-chart-empty",
    {
      type: "doughnut",
      data: {
        labels: entries.map(([status]) => orderStatusLabels[status] || status),
        datasets: [
          {
            data: entries.map(([, quantity]) => quantity),
            backgroundColor: [
              chartColors.gold,
              chartColors.orange,
              chartColors.purple,
              chartColors.lightBlue,
              chartColors.blue,
              chartColors.red,
              chartColors.green,
              chartColors.red,
              chartColors.gray,
            ],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: getBaseChartOptions().plugins,
      },
    },
    entries.length > 0,
  );
}

function getLastSixMonths() {
  const today = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);

    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleDateString("pt-BR", {
        month: "short",
      }),
    };
  });
}

function matchesMonth(value, bucket) {
  const date = toDate(value);

  return Boolean(
    date &&
    date.getFullYear() === bucket.year &&
    date.getMonth() === bucket.month,
  );
}

function getOrdersForHistoricalCharts() {
  return orders.filter((order) =>
    matchesSelectedCondominium(order, getOrderCondominiumId),
  );
}

function renderOrdersEvolutionChart() {
  const months = getLastSixMonths();
  const sourceOrders = getOrdersForHistoricalCharts();

  const opened = months.map(
    (month) =>
      sourceOrders.filter((order) =>
        matchesMonth(getOrderCreatedDate(order), month),
      ).length,
  );

  const completed = months.map(
    (month) =>
      sourceOrders.filter(
        (order) =>
          normalizeOrderStatus(order.status) === "concluida" &&
          matchesMonth(getOrderCompletedDate(order), month),
      ).length,
  );

  const hasData = [...opened, ...completed].some((value) => value > 0);
  const options = getBaseChartOptions();

  createChart(
    "ordersEvolution",
    "orders-evolution-chart",
    "orders-evolution-chart-empty",
    {
      type: "bar",
      data: {
        labels: months.map((month) => month.label),
        datasets: [
          {
            label: "Abertas",
            data: opened,
            backgroundColor: chartColors.gold,
            borderRadius: 8,
          },
          {
            label: "Concluídas",
            data: completed,
            backgroundColor: chartColors.green,
            borderRadius: 8,
          },
        ],
      },
      options,
    },
    hasData,
  );
}

function renderCondominiumOrdersChart() {
  const counts = new Map();

  getFilteredOrders().forEach((order) => {
    const name = getOrderCondominiumName(order);
    counts.set(name, (counts.get(name) || 0) + 1);
  });

  const ranking = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const options = getBaseChartOptions();
  options.indexAxis = "y";

  createChart(
    "condominiumOrders",
    "condominium-orders-chart",
    "condominium-orders-chart-empty",
    {
      type: "bar",
      data: {
        labels: ranking.map(([name]) => name),
        datasets: [
          {
            label: "Atendimentos",
            data: ranking.map(([, quantity]) => quantity),
            backgroundColor: chartColors.blue,
            borderRadius: 8,
          },
        ],
      },
      options,
    },
    ranking.length > 0,
  );
}

function renderServiceTypesChart() {
  const counts = new Map([
    ["Solicitações dos clientes", 0],
    ["Cadastradas pelo administrador", 0],
    ["Geradas por vistorias", 0],
  ]);

  getFilteredOrders().forEach((order) => {
    const origin = getOrderDemandOrigin(order);

    counts.set(origin, (counts.get(origin) || 0) + 1);
  });

  const ranking = Array.from(counts.entries()).filter(
    ([, quantity]) => quantity > 0,
  );

  const options = getBaseChartOptions();
  options.indexAxis = "y";

  createChart(
    "serviceTypes",
    "service-types-chart",
    "service-types-chart-empty",
    {
      type: "bar",
      data: {
        labels: ranking.map(([name]) => name),
        datasets: [
          {
            label: "Ordens de serviço",
            data: ranking.map(([, quantity]) => quantity),
            backgroundColor: [
              chartColors.lightBlue,
              chartColors.blue,
              chartColors.purple,
              chartColors.gray,
            ],
            borderRadius: 8,
          },
        ],
      },
      options,
    },
    ranking.length > 0,
  );
}

function renderInspectionResultsChart() {
  let ok = 0;
  let adjustments = 0;

  getFilteredInspections().forEach((inspection) => {
    const checklist = Array.isArray(inspection.checklist)
      ? inspection.checklist
      : [];

    checklist.forEach((item) => {
      const result = normalizeText(item.resultado).replace(/\s+/g, "-");

      if (result === "ok") {
        ok += 1;
      }

      if (result === "precisa-ajuste") {
        adjustments += 1;
      }
    });
  });

  createChart(
    "inspectionResults",
    "inspection-results-chart",
    "inspection-results-chart-empty",
    {
      type: "doughnut",
      data: {
        labels: ["Equipamentos OK", "Precisam de ajuste"],
        datasets: [
          {
            data: [ok, adjustments],
            backgroundColor: [chartColors.green, chartColors.red],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: getBaseChartOptions().plugins,
      },
    },
    ok + adjustments > 0,
  );
}

function renderInspectionAdjustmentsChart() {
  const counts = new Map();

  getFilteredInspections().forEach((inspection) => {
    const checklist = Array.isArray(inspection.checklist)
      ? inspection.checklist
      : [];

    checklist
      .filter(
        (item) =>
          normalizeText(item.resultado).replace(/\s+/g, "-") ===
          "precisa-ajuste",
      )
      .forEach((item) => {
        const name = String(item.nome || "Equipamento não informado").trim();
        counts.set(name, (counts.get(name) || 0) + 1);
      });
  });

  const ranking = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const options = getBaseChartOptions();
  options.indexAxis = "y";

  createChart(
    "inspectionAdjustments",
    "inspection-adjustments-chart",
    "inspection-adjustments-chart-empty",
    {
      type: "bar",
      data: {
        labels: ranking.map(([name]) => name),
        datasets: [
          {
            label: "Ajustes",
            data: ranking.map(([, quantity]) => quantity),
            backgroundColor: chartColors.red,
            borderRadius: 8,
          },
        ],
      },
      options,
    },
    ranking.length > 0,
  );
}

/* =========================================
   LISTAS OPERACIONAIS
========================================= */

function createActionItem({ modifier = "", code, badge, title, meta, href }) {
  const article = document.createElement("article");
  article.className = ["dashboard-action-item", modifier]
    .filter(Boolean)
    .join(" ");

  const indicator = document.createElement("span");
  indicator.className = "dashboard-action-item__indicator";

  const contentElement = document.createElement("div");
  contentElement.className = "dashboard-action-item__content";

  const top = document.createElement("div");
  top.className = "dashboard-action-item__top";

  const codeElement = document.createElement("span");
  codeElement.className = "dashboard-action-item__code";
  codeElement.textContent = code;

  const badgeElement = document.createElement("span");
  badgeElement.className = "dashboard-action-item__badge";
  badgeElement.textContent = badge;

  const titleElement = document.createElement("h4");
  titleElement.className = "dashboard-action-item__title";
  titleElement.textContent = title;

  const metaElement = document.createElement("p");
  metaElement.className = "dashboard-action-item__meta";
  metaElement.textContent = meta;

  const link = document.createElement("a");
  link.className = "dashboard-action-item__link";
  link.href = href;
  link.setAttribute("aria-label", `Abrir ${code}`);
  link.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 18 6-6-6-6"></path>
    </svg>
  `;

  top.append(codeElement, badgeElement);
  contentElement.append(top, titleElement, metaElement);
  article.append(indicator, contentElement, link);

  return article;
}

function renderAttentionList() {
  const orderItems = getFilteredOrders()
    .filter((order) => {
      const statusData = getOrderStatusData(order);
      const priority = normalizeText(order.prioridade);

      return (
        statusData.isOverdue ||
        (!statusData.isFinal &&
          ["alta", "urgente", "critica"].includes(priority))
      );
    })
    .map((order) => {
      const statusData = getOrderStatusData(order);
      const scheduledDate = getOrderScheduledDate(order);
      const urgent = ["urgente", "critica"].includes(
        normalizeText(order.prioridade),
      );

      return {
        sortDate: toDate(scheduledDate) || toDate(getOrderCreatedDate(order)),
        element: createActionItem({
          modifier: statusData.isOverdue ? "dashboard-action-item--danger" : "",
          code: order.codigo || "OS",
          badge: statusData.isOverdue
            ? "Atrasada"
            : urgent
              ? "Urgente"
              : "Prioridade alta",
          title: getOrderServiceName(order),
          meta: `${getOrderCondominiumName(order)} · ${formatDate(
            scheduledDate || getOrderCreatedDate(order),
          )}`,
          href: `detalhes-solicitacao.html?id=${encodeURIComponent(order.id)}`,
        }),
      };
    });

  const inspectionItems = getFilteredInspections()
    .filter(isUnlinkedInspectionRequiringOrder)
    .map((inspection) => ({
      sortDate: toDate(getInspectionReferenceDate(inspection)),
      element: createActionItem({
        modifier: "dashboard-action-item--inspection",
        code: inspection.codigo || "VST",
        badge: "Aguardando OS",
        title:
          String(inspection.condominio?.nome || "").trim() ||
          getCondominiumNameById(getInspectionCondominiumId(inspection)),
        meta: `${Number(inspection.naoConformidades || 0)} ajuste(s) identificado(s) · ${formatDate(
          getInspectionReferenceDate(inspection),
        )}`,
        href: `nova-vistoria.html?vistoria=${encodeURIComponent(
          inspection.id,
        )}&modo=consulta&perfil=admin`,
      }),
    }));

  const items = [...orderItems, ...inspectionItems]
    .sort((a, b) => {
      const timeA = a.sortDate?.getTime() || Number.MAX_SAFE_INTEGER;
      const timeB = b.sortDate?.getTime() || Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    })
    .slice(0, 6);

  attentionList.innerHTML = "";
  items.forEach((item) => attentionList.appendChild(item.element));

  attentionCount.textContent = String(items.length);
  attentionList.hidden = items.length === 0;
  attentionEmpty.hidden = items.length > 0;
}

function renderUpcomingList() {
  const today = startOfDay(new Date());

  const upcoming = getFilteredOrders()
    .filter((order) => {
      const statusData = getOrderStatusData(order);
      const scheduledDate = toDate(getOrderScheduledDate(order));

      return (
        statusData.status === "agendada" &&
        !statusData.isOverdue &&
        scheduledDate &&
        startOfDay(scheduledDate) >= today
      );
    })
    .sort(
      (a, b) =>
        toDate(getOrderScheduledDate(a)) - toDate(getOrderScheduledDate(b)),
    )
    .slice(0, 6);

  upcomingList.innerHTML = "";

  upcoming.forEach((order) => {
    const period =
      order.atendimento?.periodoConfirmado || "Período não informado";

    const time =
      order.atendimento?.horarioConfirmado || "Horário não informado";

    upcomingList.appendChild(
      createActionItem({
        modifier: "dashboard-action-item--upcoming",
        code: order.codigo || "OS",
        badge: "Agendada",
        title: getOrderServiceName(order),
        meta: `${getOrderCondominiumName(order)} · ${formatDate(
          getOrderScheduledDate(order),
        )} · ${[period, time].filter(Boolean).join(" às ")}`,
        href: `detalhes-solicitacao.html?id=${encodeURIComponent(order.id)}`,
      }),
    );
  });

  upcomingCount.textContent = String(upcoming.length);
  upcomingList.hidden = upcoming.length === 0;
  upcomingEmpty.hidden = upcoming.length > 0;
}

/* =========================================
   FINANCEIRO
========================================= */

function renderFinancialMetrics() {
  const entries = getFilteredFinancialEntries();

  const received = entries
    .filter((entry) => entry.tipo === "income" && entry.status === "paid")
    .reduce((total, entry) => total + Number(entry.valor || 0), 0);

  const receivable = entries
    .filter((entry) => {
      const status = getEffectiveFinancialStatus(entry);

      return (
        entry.tipo === "income" &&
        (status === "pending" || status === "overdue")
      );
    })
    .reduce((total, entry) => total + Number(entry.valor || 0), 0);

  const overdue = entries
    .filter(
      (entry) =>
        entry.tipo === "income" &&
        getEffectiveFinancialStatus(entry) === "overdue",
    )
    .reduce((total, entry) => total + Number(entry.valor || 0), 0);

  const expenses = entries
    .filter((entry) => entry.tipo === "expense" && entry.status === "paid")
    .reduce((total, entry) => total + Number(entry.valor || 0), 0);

  const balance = received - expenses;

  financeReceived.textContent = formatCurrency(received);
  financeReceivable.textContent = formatCurrency(receivable);
  financeOverdue.textContent = formatCurrency(overdue);
  financeExpenses.textContent = formatCurrency(expenses);
  financeBalance.textContent = formatCurrency(balance);

  financeBalanceCard?.classList.toggle(
    "dashboard-finance-card--negative",
    balance < 0,
  );
}

function getFinancialEntriesForHistoricalChart() {
  return financialEntries.filter((entry) =>
    matchesSelectedCondominium(entry, getFinancialCondominiumId),
  );
}

function renderFinanceEvolutionChart() {
  const months = getLastSixMonths();
  const entries = getFinancialEntriesForHistoricalChart();

  const income = months.map((month) =>
    entries
      .filter(
        (entry) =>
          entry.tipo === "income" &&
          entry.status === "paid" &&
          matchesMonth(entry.pagamentoEm, month),
      )
      .reduce((total, entry) => total + Number(entry.valor || 0), 0),
  );

  const expenses = months.map((month) =>
    entries
      .filter(
        (entry) =>
          entry.tipo === "expense" &&
          entry.status === "paid" &&
          matchesMonth(entry.pagamentoEm, month),
      )
      .reduce((total, entry) => total + Number(entry.valor || 0), 0),
  );

  const hasData = [...income, ...expenses].some((value) => value > 0);
  const options = getBaseChartOptions();

  options.scales.y.ticks.callback = (value) =>
    Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });

  options.plugins.tooltip.callbacks = {
    label(context) {
      return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
    },
  };

  createChart(
    "financeEvolution",
    "finance-evolution-chart",
    "finance-evolution-chart-empty",
    {
      type: "line",
      data: {
        labels: months.map((month) => month.label),
        datasets: [
          {
            label: "Receitas recebidas",
            data: income,
            borderColor: chartColors.green,
            backgroundColor: "rgba(36, 139, 88, 0.12)",
            fill: true,
            tension: 0.34,
            pointRadius: 4,
          },
          {
            label: "Despesas pagas",
            data: expenses,
            borderColor: chartColors.red,
            backgroundColor: "rgba(162, 60, 60, 0.08)",
            fill: true,
            tension: 0.34,
            pointRadius: 4,
          },
        ],
      },
      options,
    },
    hasData,
  );
}

/* =========================================
   RENDERIZAÇÃO GERAL
========================================= */

function renderDashboard() {
  renderOperationalMetrics();
  renderOrderStatusChart();
  renderOrdersEvolutionChart();
  renderCondominiumOrdersChart();
  renderServiceTypesChart();
  renderAttentionList();
  renderUpcomingList();
  renderInspectionResultsChart();
  renderInspectionAdjustmentsChart();
  renderFinancialMetrics();
  renderFinanceEvolutionChart();
}

function setLoadingState(isLoading) {
  loadingDashboard = isLoading;
  loading.hidden = !isLoading;
  content.hidden = isLoading;
  refreshButton.disabled = isLoading;
  refreshButton.classList.toggle("is-loading", isLoading);

  const label = refreshButton.querySelector("span");

  if (label) {
    label.textContent = isLoading ? "Atualizando" : "Atualizar";
  }
}

async function refreshDashboard({ notify = false } = {}) {
  if (loadingDashboard) {
    return;
  }

  setLoadingState(true);

  try {
    const failureCount = await loadDashboardData();

    populateCondominiumFilter();
    renderDashboard();

    updatedAt.textContent = formatDateTime(new Date());

    if (failureCount > 0) {
      showFeedback(
        "Alguns indicadores não puderam ser carregados. Verifique as permissões do Firebase.",
        "error",
      );
    } else if (notify) {
      showFeedback("Indicadores atualizados.");
    }
  } catch (error) {
    console.error("[Dashboard] Não foi possível carregar os dados:", error);

    showFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a leitura dos indicadores."
        : "Não foi possível carregar o Dashboard.",
      "error",
    );
  } finally {
    setLoadingState(false);
  }
}

/* =========================================
   EVENTOS
========================================= */

periodFilter.addEventListener("change", renderDashboard);
condominiumFilter.addEventListener("change", renderDashboard);
refreshButton.addEventListener("click", () =>
  refreshDashboard({ notify: true }),
);

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function initializeDashboard() {
  try {
    currentSession = await window.salvateckSessionReady;

    if (!currentSession || currentSession.role !== "admin") {
      throw new Error("ADMIN_SESSION_NOT_FOUND");
    }

    await refreshDashboard();
  } catch (error) {
    console.error("[Dashboard] Sessão administrativa não encontrada:", error);

    setLoadingState(false);

    showFeedback("Não foi possível validar a sessão administrativa.", "error");
  }
}

initializeDashboard();
