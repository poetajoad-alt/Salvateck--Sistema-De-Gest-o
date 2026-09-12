import "./auth-guard.js";

import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

/* =========================================================
ELEMENTOS
========================================================= */

const summaryButtons = Array.from(
  document.querySelectorAll("[data-budget-status]"),
);

const summaryTotal = document.getElementById("budget-summary-total");
const summaryDraft = document.getElementById("budget-summary-draft");
const summarySent = document.getElementById("budget-summary-sent");
const summaryApproved = document.getElementById("budget-summary-approved");
const summaryClosed = document.getElementById("budget-summary-closed");

const searchInput = document.getElementById("budget-search-input");

const openFilterButton = document.getElementById("open-budget-filter");
const closeFilterButton = document.getElementById("close-budget-filter");
const filterPanel = document.getElementById("budget-filter-panel");
const filterCount = document.getElementById("budget-filter-count");
const activeFilters = document.getElementById("budget-active-filters");

const statusFilter = document.getElementById("budget-status-filter");
const periodFilter = document.getElementById("budget-period-filter");
const clearFiltersButton = document.getElementById("clear-budget-filters");
const applyFiltersButton = document.getElementById("apply-budget-filters");

const resultsCount = document.getElementById("budget-results-count");

const loadingCard = document.getElementById("budgets-loading");
const errorCard = document.getElementById("budgets-error");
const errorMessage = document.getElementById("budgets-error-message");
const retryButton = document.getElementById("retry-budgets-button");

const budgetsList = document.getElementById("budgets-list");
const emptyCard = document.getElementById("budgets-empty");
const emptyTitle = document.getElementById("budgets-empty-title");
const emptyDescription = document.getElementById("budgets-empty-description");

/* =========================================================
ESTADO
========================================================= */

let currentSession = null;
let budgets = [];
let currentQuickStatus = "todos";
let currentStatusFilter = "";
let currentPeriodFilter = "";
let isLoading = false;

/* =========================================================
STATUS
========================================================= */

const statusConfig = {
  rascunho: {
    label: "Rascunho",
    className: "budget-card__status--draft",
  },

  enviado: {
    label: "Enviado",
    className: "budget-card__status--sent",
  },

  aprovado: {
    label: "Aprovado",
    className: "budget-card__status--approved",
  },

  recusado: {
    label: "Recusado",
    className: "budget-card__status--rejected",
  },

  expirado: {
    label: "Expirado",
    className: "budget-card__status--expired",
  },
};

/* =========================================================
AUXILIARES
========================================================= */

function text(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateFromValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    const timestampDate = value.toDate();

    return Number.isNaN(timestampDate.getTime()) ? null : timestampDate;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const rawValue = text(value);

  if (!rawValue) {
    return null;
  }

  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    const localDate = new Date(Number(year), Number(month) - 1, Number(day));

    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }

  const parsedDate = new Date(rawValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDate(value) {
  const date = dateFromValue(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleDateString("pt-BR");
}

function getStatusData(status) {
  const normalizedStatus = normalizeText(status) || "rascunho";

  return (
    statusConfig[normalizedStatus] || {
      label: text(status) || "Rascunho",
      className: "budget-card__status--draft",
    }
  );
}

function getBudgetStatus(budget) {
  return normalizeText(budget?.status) || "rascunho";
}

function getBudgetValue(budget) {
  return Number(
    budget?.investimento?.valorFinal ??
      budget?.valorFinal ??
      budget?.investimento?.valorServico ??
      budget?.valorServico ??
      0,
  );
}

function getBudgetDate(budget) {
  return (
    dateFromValue(budget?.proposta?.data) ||
    dateFromValue(budget?.criadoEm) ||
    dateFromValue(budget?.atualizadoEm)
  );
}

function getBudgetSortDate(budget) {
  return (
    dateFromValue(budget?.criadoEm) ||
    dateFromValue(budget?.proposta?.data) ||
    dateFromValue(budget?.atualizadoEm)
  );
}

function getBudgetClientName(budget) {
  return (
    text(budget?.cliente?.nome) ||
    text(budget?.clienteNome) ||
    "Cliente não informado"
  );
}

function getBudgetCondominiumName(budget) {
  return (
    text(budget?.condominio?.nome) ||
    text(budget?.condominioNome) ||
    "Sem condomínio vinculado"
  );
}

function getBudgetTitle(budget) {
  return (
    text(budget?.titulo) ||
    text(budget?.descricaoServico) ||
    "Orçamento comercial"
  );
}

function getBudgetValidityText(budget) {
  const proposal = budget?.proposta || {};

  const validityDate = formatDate(proposal.validadeAte);

  const validityDays = Number(proposal.validadeDias || 0);

  if (validityDate !== "—") {
    return `Válido até ${validityDate}`;
  }

  if (validityDays > 0) {
    return `Validade: ${validityDays} dias`;
  }

  return "Validade não informada";
}

function getBudgetSearchContent(budget) {
  const address = budget?.condominio?.endereco || {};

  return normalizeText(
    [
      budget?.codigo,
      budget?.titulo,
      budget?.subtitulo,
      budget?.descricaoServico,
      budget?.objetivo,
      budget?.cliente?.nome,
      budget?.cliente?.telefone,
      budget?.clienteNome,
      budget?.condominio?.nome,
      budget?.condominioNome,
      budget?.condominio?.unidade,
      address?.resumo,
      address?.logradouro,
      address?.bairro,
      address?.cidade,
      address?.uf,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function isBudgetInPeriod(budget, days) {
  const periodDays = Number(days || 0);

  if (!periodDays) {
    return true;
  }

  const budgetDate = getBudgetDate(budget);

  if (!budgetDate) {
    return false;
  }

  const today = new Date();

  today.setHours(23, 59, 59, 999);

  const startDate = new Date(today);

  startDate.setDate(startDate.getDate() - periodDays);

  startDate.setHours(0, 0, 0, 0);

  return budgetDate >= startDate && budgetDate <= today;
}

/* =========================================================
CONTADORES
========================================================= */

function updateSummary() {
  const counters = {
    total: budgets.length,
    rascunho: 0,
    enviado: 0,
    aprovado: 0,
    encerrado: 0,
  };

  budgets.forEach((budget) => {
    const status = getBudgetStatus(budget);

    if (status === "rascunho") {
      counters.rascunho += 1;
    }

    if (status === "enviado") {
      counters.enviado += 1;
    }

    if (status === "aprovado") {
      counters.aprovado += 1;
    }

    if (status === "recusado" || status === "expirado") {
      counters.encerrado += 1;
    }
  });

  summaryTotal.textContent = counters.total;
  summaryDraft.textContent = counters.rascunho;
  summarySent.textContent = counters.enviado;
  summaryApproved.textContent = counters.aprovado;
  summaryClosed.textContent = counters.encerrado;
}

/* =========================================================
FILTROS
========================================================= */

function matchesQuickStatus(budget) {
  if (currentQuickStatus === "todos") {
    return true;
  }

  const status = getBudgetStatus(budget);

  if (currentQuickStatus === "encerrado") {
    return status === "recusado" || status === "expirado";
  }

  return status === currentQuickStatus;
}

function getFilteredBudgets() {
  const searchTerm = normalizeText(searchInput.value);

  return budgets.filter((budget) => {
    if (!matchesQuickStatus(budget)) {
      return false;
    }

    const status = getBudgetStatus(budget);

    if (currentStatusFilter && status !== currentStatusFilter) {
      return false;
    }

    if (currentPeriodFilter && !isBudgetInPeriod(budget, currentPeriodFilter)) {
      return false;
    }

    if (searchTerm && !getBudgetSearchContent(budget).includes(searchTerm)) {
      return false;
    }

    return true;
  });
}

function setQuickStatus(status) {
  currentQuickStatus = status || "todos";

  summaryButtons.forEach((button) => {
    const isActive = button.dataset.budgetStatus === currentQuickStatus;

    button.classList.toggle("is-active", isActive);

    button.setAttribute("aria-pressed", String(isActive));
  });
}

function getFilterStatusLabel(status) {
  return getStatusData(status).label;
}

function updateActiveFilters() {
  const filters = [];

  if (currentStatusFilter) {
    filters.push({
      key: "status",
      label: `Status: ${getFilterStatusLabel(currentStatusFilter)}`,
    });
  }

  if (currentPeriodFilter) {
    const option = periodFilter.querySelector(
      `option[value="${CSS.escape(currentPeriodFilter)}"]`,
    );

    filters.push({
      key: "period",
      label: option?.textContent?.trim() || "Período",
    });
  }

  filterCount.textContent = filters.length;
  filterCount.hidden = filters.length === 0;

  if (filters.length === 0) {
    activeFilters.innerHTML = "";
    activeFilters.hidden = true;

    return;
  }

  activeFilters.innerHTML = filters
    .map(
      (filter) => `
        <span class="budget-filter-chip">
          ${escapeHtml(filter.label)}

          <button
            type="button"
            data-remove-filter="${escapeHtml(filter.key)}"
            aria-label="Remover filtro"
          >
            ×
          </button>
        </span>
      `,
    )
    .join("");

  activeFilters.hidden = false;
}

function clearAdvancedFilters() {
  statusFilter.value = "";
  periodFilter.value = "";

  currentStatusFilter = "";
  currentPeriodFilter = "";

  updateActiveFilters();
  renderBudgets();
}

function applyAdvancedFilters() {
  currentStatusFilter = normalizeText(statusFilter.value);

  currentPeriodFilter = text(periodFilter.value);

  setQuickStatus("todos");

  updateActiveFilters();
  renderBudgets();
  closeFilterPanel();
}

/* =========================================================
PAINEL DE FILTROS
========================================================= */

function openFilterPanel() {
  filterPanel.hidden = false;

  openFilterButton.setAttribute("aria-expanded", "true");
}

function closeFilterPanel() {
  filterPanel.hidden = true;

  openFilterButton.setAttribute("aria-expanded", "false");
}

/* =========================================================
CARD
========================================================= */

function createBudgetCard(budget) {
  const status = getBudgetStatus(budget);
  const statusData = getStatusData(status);

  const budgetDate = formatDate(budget?.proposta?.data || budget?.criadoEm);

  const code = text(budget?.codigo) || "ORC-0000";

  const title = getBudgetTitle(budget);

  const clientName = getBudgetClientName(budget);

  const condominiumName = getBudgetCondominiumName(budget);

  const validityText = getBudgetValidityText(budget);

  const finalValue = formatCurrency(getBudgetValue(budget));

  return `
    <article
      class="budget-card"
      data-budget-id="${escapeHtml(budget.id)}"
      data-status="${escapeHtml(status)}"
    >
      <button
        type="button"
        class="budget-card__button"
        data-open-budget="${escapeHtml(budget.id)}"
        aria-label="Abrir ${escapeHtml(code)}"
      >
        <div class="budget-card__top">
          <div class="budget-card__identity">
            <span class="budget-card__code">
              ${escapeHtml(code)}
            </span>

            <span
              class="budget-card__status ${escapeHtml(statusData.className)}"
            >
              ${escapeHtml(statusData.label)}
            </span>
          </div>

          <span class="budget-card__date">
            ${escapeHtml(budgetDate)}
          </span>
        </div>

        <div class="budget-card__content">
          <span
            class="budget-card__icon"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <path d="M5 3h11l3 3v15H5z"></path>
              <path d="M16 3v4h4"></path>
              <path d="M8 11h8"></path>
              <path d="M8 15h6"></path>
            </svg>
          </span>

          <div class="budget-card__copy">
            <h3>
              ${escapeHtml(title)}
            </h3>

            <span class="budget-card__client">
              ${escapeHtml(clientName)}
            </span>

            <span class="budget-card__location">
              ${escapeHtml(condominiumName)}
            </span>
          </div>

          <span
            class="budget-card__arrow"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </span>
        </div>

        <div class="budget-card__footer">
          <div class="budget-card__meta">
            <span class="budget-card__meta-item">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                ></rect>

                <path
                  d="M7 3v4M17 3v4M3 10h18"
                ></path>
              </svg>

              ${escapeHtml(validityText)}
            </span>
          </div>

          <div class="budget-card__value">
            <small>
              Valor final
            </small>

            <strong>
              ${escapeHtml(finalValue)}
            </strong>
          </div>
        </div>
      </button>
    </article>
  `;
}

/* =========================================================
ESTADOS DA LISTAGEM
========================================================= */

function setResultsCount(amount) {
  resultsCount.textContent = `${amount} ${
    amount === 1 ? "proposta" : "propostas"
  }`;
}

function showLoading() {
  loadingCard.hidden = false;
  errorCard.hidden = true;
  budgetsList.hidden = true;
  emptyCard.hidden = true;
}

function showError(message) {
  loadingCard.hidden = true;
  budgetsList.hidden = true;
  emptyCard.hidden = true;
  errorCard.hidden = false;

  errorMessage.textContent = message;

  setResultsCount(0);
}

function showEmptyState(hasAnyBudget) {
  loadingCard.hidden = true;
  errorCard.hidden = true;
  budgetsList.hidden = true;
  emptyCard.hidden = false;

  if (hasAnyBudget) {
    emptyTitle.textContent = "Nenhum orçamento encontrado";

    emptyDescription.textContent =
      "Altere a pesquisa ou os filtros para localizar outras propostas.";
  } else {
    emptyTitle.textContent = "Ainda não existem orçamentos";

    emptyDescription.textContent =
      "Crie a primeira proposta comercial da Salvateck.";
  }
}

/* =========================================================
RENDERIZAÇÃO
========================================================= */

function renderBudgets() {
  updateSummary();

  const filteredBudgets = getFilteredBudgets();

  setResultsCount(filteredBudgets.length);

  if (filteredBudgets.length === 0) {
    budgetsList.innerHTML = "";

    showEmptyState(budgets.length > 0);

    return;
  }

  loadingCard.hidden = true;
  errorCard.hidden = true;
  emptyCard.hidden = true;
  budgetsList.hidden = false;

  budgetsList.innerHTML = filteredBudgets.map(createBudgetCard).join("");
}

/* =========================================================
CARREGAMENTO DO FIRESTORE
========================================================= */

async function loadBudgets() {
  if (isLoading) {
    return;
  }

  isLoading = true;

  showLoading();

  try {
    const snapshot = await getDocs(collection(db, "orcamentos"));

    budgets = snapshot.docs
      .map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }))
      .sort((firstBudget, secondBudget) => {
        const firstDate = getBudgetSortDate(firstBudget)?.getTime() || 0;

        const secondDate = getBudgetSortDate(secondBudget)?.getTime() || 0;

        if (secondDate !== firstDate) {
          return secondDate - firstDate;
        }

        return text(secondBudget?.codigo).localeCompare(
          text(firstBudget?.codigo),
          "pt-BR",
          {
            numeric: true,
          },
        );
      });

    renderBudgets();
  } catch (error) {
    console.error("[Orçamentos] Não foi possível carregar:", error);

    showError(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou o acesso aos orçamentos."
        : "Não foi possível carregar os orçamentos. Verifique sua conexão e tente novamente.",
    );
  } finally {
    isLoading = false;
  }
}

/* =========================================================
NAVEGAÇÃO
========================================================= */

function openBudget(budgetId) {
  const id = text(budgetId);

  if (!id) {
    return;
  }

  window.location.href = `detalhes-orcamento.html?id=${encodeURIComponent(id)}`;
}

/* =========================================================
EVENTOS
========================================================= */

summaryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const status = text(button.dataset.budgetStatus) || "todos";

    statusFilter.value = "";
    currentStatusFilter = "";

    setQuickStatus(status);

    updateActiveFilters();
    renderBudgets();
  });
});

searchInput.addEventListener("input", renderBudgets);

openFilterButton.addEventListener("click", () => {
  if (filterPanel.hidden) {
    openFilterPanel();

    return;
  }

  closeFilterPanel();
});

closeFilterButton.addEventListener("click", closeFilterPanel);

clearFiltersButton.addEventListener("click", clearAdvancedFilters);

applyFiltersButton.addEventListener("click", applyAdvancedFilters);

activeFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-filter]");

  if (!button) {
    return;
  }

  const filterKey = button.dataset.removeFilter;

  if (filterKey === "status") {
    statusFilter.value = "";
    currentStatusFilter = "";
  }

  if (filterKey === "period") {
    periodFilter.value = "";
    currentPeriodFilter = "";
  }

  updateActiveFilters();
  renderBudgets();
});

budgetsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-budget]");

  if (!button) {
    return;
  }

  openBudget(button.dataset.openBudget);
});

retryButton.addEventListener("click", loadBudgets);

/* =========================================================
INICIALIZAÇÃO
========================================================= */

async function initializePage() {
  try {
    currentSession = await window.salvateckSessionReady;

    if (!currentSession || currentSession.role !== "admin") {
      return;
    }

    setQuickStatus("todos");
    updateActiveFilters();

    await loadBudgets();
  } catch (error) {
    console.error("[Orçamentos] Não foi possível iniciar a página:", error);

    showError(
      "Não foi possível iniciar a área de orçamentos. Atualize a página e tente novamente.",
    );
  }
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted && currentSession?.role === "admin") {
    loadBudgets();
  }
});

initializePage();
