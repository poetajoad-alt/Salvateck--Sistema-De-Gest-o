const FINANCE_STORAGE_KEY = "salvateckLancamentosFinanceiros";

const incomeCategories = {
  servico: "Prestação de serviço",
  manutencao: "Manutenção",
  vistoria: "Vistoria",
  contrato: "Contrato mensal",
  material: "Venda de material",
  outro: "Outro recebimento",
};

const expenseCategories = {
  material: "Compra de material",
  combustivel: "Combustível",
  funcionario: "Pagamento de funcionário",
  fornecedor: "Fornecedor",
  ferramenta: "Ferramentas e equipamentos",
  transporte: "Transporte",
  imposto: "Impostos e taxas",
  outro: "Outra despesa",
};

const statusConfig = {
  pending: {
    nome: "Pendente",
    classe: "status--pending",
  },

  paid: {
    nome: "Pago",
    classe: "status--paid",
  },

  overdue: {
    nome: "Em atraso",
    classe: "status--overdue",
  },

  cancelled: {
    nome: "Cancelado",
    classe: "status--cancelled",
  },
};

const paymentMethodConfig = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
  transferencia: "Transferência",
  cartao: "Cartão",
  outro: "Outro",
};

const today = new Date();
today.setHours(0, 0, 0, 0);

function dateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateWithOffset(days) {
  const date = new Date(today);

  date.setDate(date.getDate() + days);

  return dateToISO(date);
}

const defaultEntries = [
  {
    id: "financeiro-0001",
    codigo: "FIN-0001",
    tipo: "income",
    descricao: "Manutenção preventiva de bombas",
    categoria: "manutencao",
    valor: 850,
    vencimento: dateWithOffset(5),
    status: "pending",
    pagamentoEm: "",
    formaPagamento: "",
    cliente: "Administradora Horizonte",
    condominio: "Condomínio Jardim Primavera",
    ordem: "OS-0021",
    observacoes: "",
  },

  {
    id: "financeiro-0002",
    codigo: "FIN-0002",
    tipo: "income",
    descricao: "Reparo de vazamento hidráulico",
    categoria: "servico",
    valor: 460,
    vencimento: dateWithOffset(-4),
    status: "pending",
    pagamentoEm: "",
    formaPagamento: "",
    cliente: "João Martins",
    condominio: "Edifício Central",
    ordem: "OS-0018",
    observacoes: "",
  },

  {
    id: "financeiro-0003",
    codigo: "FIN-0003",
    tipo: "income",
    descricao: "Contrato mensal de manutenção",
    categoria: "contrato",
    valor: 1200,
    vencimento: dateWithOffset(-8),
    status: "paid",
    pagamentoEm: dateWithOffset(-7),
    formaPagamento: "pix",
    cliente: "Administradora Nova Gestão",
    condominio: "Residencial das Flores",
    ordem: "",
    observacoes: "",
  },

  {
    id: "financeiro-0004",
    codigo: "FIN-0004",
    tipo: "expense",
    descricao: "Compra de materiais hidráulicos",
    categoria: "material",
    valor: 285.9,
    vencimento: dateWithOffset(-2),
    status: "paid",
    pagamentoEm: dateWithOffset(-2),
    formaPagamento: "cartao",
    cliente: "",
    condominio: "",
    ordem: "OS-0021",
    observacoes: "",
  },

  {
    id: "financeiro-0005",
    codigo: "FIN-0005",
    tipo: "expense",
    descricao: "Abastecimento do veículo",
    categoria: "combustivel",
    valor: 220,
    vencimento: dateWithOffset(1),
    status: "pending",
    pagamentoEm: "",
    formaPagamento: "",
    cliente: "",
    condominio: "",
    ordem: "",
    observacoes: "",
  },
];

/* ELEMENTOS */

const summaryReceivable = document.getElementById("summary-receivable");

const summaryReceived = document.getElementById("summary-received");

const summaryOverdue = document.getElementById("summary-overdue");

const summaryExpenses = document.getElementById("summary-expenses");

const viewButtons = document.querySelectorAll("[data-finance-view]");

const financeSearch = document.getElementById("finance-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const activeFiltersList = document.getElementById("active-filters-list");

const statusFilter = document.getElementById("status-filter");

const periodFilter = document.getElementById("period-filter");

const categoryFilter = document.getElementById("category-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const clearEmptyFiltersButton = document.getElementById(
  "clear-empty-filters-button",
);

const financeContentEyebrow = document.getElementById(
  "finance-content-eyebrow",
);

const financeContentTitle = document.getElementById("finance-content-title");

const financeEntryCount = document.getElementById("finance-entry-count");

const financeList = document.getElementById("finance-list");

const emptyState = document.getElementById("empty-state");

const financeEntryTemplate = document.getElementById("finance-entry-template");

const newEntryButton = document.getElementById("new-entry-button");

const financeEntryModal = document.getElementById("finance-entry-modal");

const closeEntryModalButton = document.getElementById(
  "close-entry-modal-button",
);

const cancelEntryButton = document.getElementById("cancel-entry-button");

const financeEntryForm = document.getElementById("finance-entry-form");

const entryModalEyebrow = document.getElementById("entry-modal-eyebrow");

const entryModalTitle = document.getElementById("entry-modal-title");

const entryId = document.getElementById("entry-id");

const entryType = document.getElementById("entry-type");

const entryStatus = document.getElementById("entry-status");

const entryDescription = document.getElementById("entry-description");

const entryCategory = document.getElementById("entry-category");

const entryAmount = document.getElementById("entry-amount");

const entryDueDate = document.getElementById("entry-due-date");

const entryPaymentDate = document.getElementById("entry-payment-date");

const entryPaymentMethod = document.getElementById("entry-payment-method");

const entryClient = document.getElementById("entry-client");

const entryCondominium = document.getElementById("entry-condominium");

const entryOrder = document.getElementById("entry-order");

const entryNotes = document.getElementById("entry-notes");

const feedbackMessage = document.getElementById("feedback-message");

/* ESTADO */

let entries = [];
let currentView = "all";

let appliedFilters = {
  status: "",
  period: "",
  category: "",
};

let editingEntryId = null;
let feedbackTimeout;

/* UTILITÁRIOS */

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseLocalDate(value) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T12:00:00`);
}

function formatDate(value) {
  const date = parseLocalDate(value);

  if (!date) {
    return "Não informada";
  }

  return date.toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function onlyNumbers(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCurrencyInput(value) {
  const numbers = onlyNumbers(value);

  if (!numbers) {
    return "";
  }

  return formatCurrency(Number(numbers) / 100);
}

function currencyInputToNumber(value) {
  const numbers = onlyNumbers(value);

  return numbers ? Number(numbers) / 100 : 0;
}

function formatEntryQuantity(quantity) {
  return quantity === 1 ? "1 lançamento" : `${quantity} lançamentos`;
}

function showFeedback(message) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;
  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3000);
}

function getEntryById(id) {
  return entries.find((entry) => entry.id === id);
}

function getEffectiveStatus(entry) {
  if (entry.status === "pending" && parseLocalDate(entry.vencimento) < today) {
    return "overdue";
  }

  return entry.status;
}

function getCategoryLabel(entry) {
  const config =
    entry.tipo === "expense" ? expenseCategories : incomeCategories;

  return config[entry.categoria] || entry.categoria || "Sem categoria";
}

/* ARMAZENAMENTO */

function normalizeEntry(entry, index) {
  return {
    ...entry,

    id: entry.id || `financeiro-${String(index + 1).padStart(4, "0")}`,

    codigo: entry.codigo || `FIN-${String(index + 1).padStart(4, "0")}`,

    tipo: entry.tipo === "expense" ? "expense" : "income",

    descricao: entry.descricao || "Lançamento financeiro",

    categoria: entry.categoria || "outro",

    valor: Number(entry.valor) || 0,

    vencimento: entry.vencimento || dateToISO(today),

    status: entry.status || "pending",

    pagamentoEm: entry.pagamentoEm || "",

    formaPagamento: entry.formaPagamento || "",

    cliente: entry.cliente || "",

    condominio: entry.condominio || "",

    ordem: entry.ordem || "",

    observacoes: entry.observacoes || "",
  };
}

function loadEntries() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(FINANCE_STORAGE_KEY) || "null",
    );

    if (Array.isArray(saved)) {
      entries = saved.map(normalizeEntry);
      return;
    }
  } catch (error) {
    console.warn("Erro ao carregar lançamentos.", error);
  }

  entries = cloneData(defaultEntries).map(normalizeEntry);

  saveEntries();
}

function saveEntries() {
  localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(entries));
}

/* RESUMO */

function isCurrentMonth(value) {
  const date = parseLocalDate(value);

  return Boolean(
    date &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear(),
  );
}

function updateSummary() {
  const receivable = entries
    .filter((entry) => {
      const status = getEffectiveStatus(entry);

      return (
        entry.tipo === "income" &&
        (status === "pending" || status === "overdue")
      );
    })
    .reduce((total, entry) => total + entry.valor, 0);

  const received = entries
    .filter(
      (entry) =>
        entry.tipo === "income" &&
        entry.status === "paid" &&
        isCurrentMonth(entry.pagamentoEm),
    )
    .reduce((total, entry) => total + entry.valor, 0);

  const overdue = entries
    .filter(
      (entry) =>
        entry.tipo === "income" && getEffectiveStatus(entry) === "overdue",
    )
    .reduce((total, entry) => total + entry.valor, 0);

  const expenses = entries
    .filter(
      (entry) =>
        entry.tipo === "expense" &&
        entry.status !== "cancelled" &&
        isCurrentMonth(entry.pagamentoEm || entry.vencimento),
    )
    .reduce((total, entry) => total + entry.valor, 0);

  summaryReceivable.textContent = formatCurrency(receivable);

  summaryReceived.textContent = formatCurrency(received);

  summaryOverdue.textContent = formatCurrency(overdue);

  summaryExpenses.textContent = formatCurrency(expenses);
}

/* FILTROS */

function matchesView(entry) {
  if (currentView === "income") {
    return entry.tipo === "income";
  }

  if (currentView === "expense") {
    return entry.tipo === "expense";
  }

  if (currentView === "overdue") {
    return getEffectiveStatus(entry) === "overdue";
  }

  return true;
}

function matchesSearch(entry) {
  const search = normalizeText(financeSearch.value);

  if (!search) {
    return true;
  }

  const content = normalizeText(
    [
      entry.codigo,
      entry.descricao,
      entry.cliente,
      entry.condominio,
      entry.ordem,
      getCategoryLabel(entry),
      entry.observacoes,
    ].join(" "),
  );

  return content.includes(search);
}

function matchesPeriod(entry) {
  const period = appliedFilters.period;

  if (!period) {
    return true;
  }

  const dueDate = parseLocalDate(entry.vencimento);

  if (!dueDate) {
    return false;
  }

  const difference = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

  if (period === "today") {
    return difference === 0;
  }

  if (period === "next-7") {
    return difference >= 0 && difference <= 7;
  }

  if (period === "next-30") {
    return difference >= 0 && difference <= 30;
  }

  if (period === "this-month") {
    return (
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  }

  return true;
}

function matchesFilters(entry) {
  const statusMatches =
    !appliedFilters.status ||
    getEffectiveStatus(entry) === appliedFilters.status;

  const categoryMatches =
    !appliedFilters.category || entry.categoria === appliedFilters.category;

  return statusMatches && categoryMatches && matchesPeriod(entry);
}

function getFilteredEntries() {
  return entries
    .filter(matchesView)
    .filter(matchesSearch)
    .filter(matchesFilters)
    .sort((a, b) => {
      return parseLocalDate(b.vencimento) - parseLocalDate(a.vencimento);
    });
}

/* RENDERIZAÇÃO */

function renderEntries() {
  const filtered = getFilteredEntries();

  financeList.innerHTML = "";

  filtered.forEach((entry) => {
    const fragment = financeEntryTemplate.content.cloneNode(true);

    const card = fragment.querySelector(".finance-entry");

    const code = fragment.querySelector(".finance-entry__code");

    const type = fragment.querySelector(".finance-entry__type");

    const status = fragment.querySelector(".finance-entry__status");

    const description = fragment.querySelector(".finance-entry__description");

    const reference = fragment.querySelector(".finance-entry__reference");

    const amount = fragment.querySelector(".finance-entry__amount");

    const dueDate = fragment.querySelector(".finance-entry__due-date");

    const category = fragment.querySelector(".finance-entry__category");

    const paymentMethod = fragment.querySelector(
      ".finance-entry__payment-method",
    );

    const fullStatus = fragment.querySelector(".finance-entry__full-status");

    const notes = fragment.querySelector(".finance-entry__notes");

    const details = fragment.querySelector(".finance-entry__details");

    const toggleButton = fragment.querySelector(".finance-entry__toggle");

    const payButton = fragment.querySelector('[data-entry-action="pay"]');

    const editButton = fragment.querySelector('[data-entry-action="edit"]');

    const effectiveStatus = getEffectiveStatus(entry);

    const statusData = statusConfig[effectiveStatus];

    if (entry.tipo === "expense") {
      card.classList.add("is-expense");
    }

    code.textContent = entry.codigo;

    type.textContent = entry.tipo === "income" ? "Recebimento" : "Despesa";

    status.textContent = statusData.nome;
    status.classList.add(statusData.classe);

    description.textContent = entry.descricao;

    reference.textContent =
      [entry.cliente, entry.condominio, entry.ordem]
        .filter(Boolean)
        .join(" · ") || "Sem vínculo informado";

    amount.textContent =
      `${entry.tipo === "expense" ? "- " : ""}` + formatCurrency(entry.valor);

    dueDate.textContent = `Vencimento: ${formatDate(entry.vencimento)}`;

    category.textContent = getCategoryLabel(entry);

    fullStatus.textContent = `Situação: ${statusData.nome}`;

    if (entry.status === "paid" && entry.formaPagamento) {
      paymentMethod.hidden = false;

      paymentMethod.textContent = `Pagamento: ${
        paymentMethodConfig[entry.formaPagamento] || entry.formaPagamento
      }`;
    }

    if (entry.observacoes?.trim()) {
      notes.hidden = false;
      notes.textContent = `Observações: ${entry.observacoes}`;
    }

    payButton.hidden = entry.status === "paid" || entry.status === "cancelled";

    payButton.addEventListener("click", () => {
      markEntryAsPaid(entry.id);
    });

    editButton.addEventListener("click", () => {
      openEntryModal(entry);
    });

    toggleButton.addEventListener("click", () => {
      const isOpen = !details.hidden;

      details.hidden = isOpen;
      toggleButton.setAttribute("aria-expanded", String(!isOpen));

      toggleButton.textContent = isOpen ? "Ver mais" : "Ver menos";
    });

    financeList.appendChild(fragment);
  });

  financeEntryCount.textContent = formatEntryQuantity(filtered.length);

  financeList.hidden = filtered.length === 0;

  emptyState.hidden = filtered.length > 0;
}

function updateViewHeading() {
  const configuration = {
    all: ["Movimentações", "Todos os lançamentos"],

    income: ["Entradas", "Recebimentos"],

    expense: ["Saídas", "Despesas"],

    overdue: ["Atenção necessária", "Lançamentos em atraso"],
  };

  const selected = configuration[currentView];

  financeContentEyebrow.textContent = selected[0];

  financeContentTitle.textContent = selected[1];
}

function changeView(view) {
  currentView = view;

  viewButtons.forEach((button) => {
    const active = button.dataset.financeView === view;

    button.classList.toggle("is-active", active);

    button.setAttribute("aria-pressed", String(active));
  });

  updateViewHeading();
  renderEntries();
}

/* FILTROS VISUAIS */

function populateCategoryFilter() {
  const allCategories = {
    ...incomeCategories,
    ...expenseCategories,
  };

  categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';

  Object.entries(allCategories)
    .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
    .forEach(([value, label]) => {
      const option = document.createElement("option");

      option.value = value;
      option.textContent = label;

      categoryFilter.appendChild(option);
    });
}

function countActiveFilters() {
  return Object.values(appliedFilters).filter(Boolean).length;
}

function updateFilterCount() {
  const count = countActiveFilters();

  activeFilterCount.textContent = String(count);

  activeFilterCount.hidden = count === 0;
}

function createFilterChip(text, callback) {
  const chip = document.createElement("span");

  chip.className = "active-filter-chip";

  const label = document.createElement("span");

  label.textContent = text;

  const button = document.createElement("button");

  button.type = "button";
  button.textContent = "×";

  button.addEventListener("click", callback);

  chip.append(label, button);

  return chip;
}

function renderActiveFilters() {
  activeFiltersList.innerHTML = "";

  if (appliedFilters.status) {
    activeFiltersList.appendChild(
      createFilterChip(
        statusConfig[appliedFilters.status]?.nome || appliedFilters.status,
        () => {
          appliedFilters.status = "";
          finishFilterRemoval();
        },
      ),
    );
  }

  if (appliedFilters.period) {
    const labels = {
      today: "Hoje",
      "next-7": "Próximos 7 dias",
      "this-month": "Este mês",
      "next-30": "Próximos 30 dias",
    };

    activeFiltersList.appendChild(
      createFilterChip(labels[appliedFilters.period], () => {
        appliedFilters.period = "";
        finishFilterRemoval();
      }),
    );
  }

  if (appliedFilters.category) {
    const allCategories = {
      ...incomeCategories,
      ...expenseCategories,
    };

    activeFiltersList.appendChild(
      createFilterChip(
        allCategories[appliedFilters.category] || appliedFilters.category,
        () => {
          appliedFilters.category = "";
          finishFilterRemoval();
        },
      ),
    );
  }

  activeFiltersList.hidden = activeFiltersList.children.length === 0;
}

function synchronizeFilters() {
  statusFilter.value = appliedFilters.status;

  periodFilter.value = appliedFilters.period;

  categoryFilter.value = appliedFilters.category;
}

function finishFilterRemoval() {
  synchronizeFilters();
  updateFilterCount();
  renderActiveFilters();
  renderEntries();
}

function applyFilters() {
  appliedFilters = {
    status: statusFilter.value,
    period: periodFilter.value,
    category: categoryFilter.value,
  };

  updateFilterCount();
  renderActiveFilters();
  closeFilters();
  renderEntries();

  showFeedback("Filtros aplicados.");
}

function clearSearchAndFilters() {
  financeSearch.value = "";

  appliedFilters = {
    status: "",
    period: "",
    category: "",
  };

  synchronizeFilters();
  updateFilterCount();
  renderActiveFilters();
  closeFilters();
  renderEntries();

  showFeedback("Pesquisa e filtros removidos.");
}

function openFilters() {
  filterPanel.hidden = false;

  openFilterButton.setAttribute("aria-expanded", "true");
}

function closeFilters() {
  filterPanel.hidden = true;

  openFilterButton.setAttribute("aria-expanded", "false");
}

/* MODAL */

function populateEntryCategories(type, selected = "") {
  const categories = type === "expense" ? expenseCategories : incomeCategories;

  entryCategory.innerHTML = "";

  Object.entries(categories).forEach(([value, label]) => {
    const option = document.createElement("option");

    option.value = value;
    option.textContent = label;

    entryCategory.appendChild(option);
  });

  if (selected && categories[selected]) {
    entryCategory.value = selected;
  }
}

function generateIdentifiers() {
  const numbers = entries.map((entry) => {
    const match = String(entry.codigo).match(/\d+/);

    return match ? Number(match[0]) : 0;
  });

  const next = Math.max(0, ...numbers) + 1;

  const formatted = String(next).padStart(4, "0");

  return {
    id: `financeiro-${formatted}`,
    codigo: `FIN-${formatted}`,
  };
}

function clearFormErrors() {
  financeEntryForm.querySelectorAll(".form-field").forEach((field) => {
    field.classList.remove("has-error");
  });

  financeEntryForm.querySelectorAll(".form-field__error").forEach((error) => {
    error.textContent = "";
  });
}

function setFieldError(field, message) {
  const container = field.closest(".form-field");

  container?.classList.add("has-error");

  const error = container?.querySelector(".form-field__error");

  if (error) {
    error.textContent = message;
  }
}

function validateEntryForm() {
  clearFormErrors();

  let valid = true;

  if (entryDescription.value.trim().length < 3) {
    setFieldError(entryDescription, "Informe a descrição.");

    valid = false;
  }

  if (currencyInputToNumber(entryAmount.value) <= 0) {
    setFieldError(entryAmount, "Informe um valor válido.");

    valid = false;
  }

  if (!entryDueDate.value) {
    setFieldError(entryDueDate, "Informe o vencimento.");

    valid = false;
  }

  if (!entryCategory.value) {
    setFieldError(entryCategory, "Selecione uma categoria.");

    valid = false;
  }

  return valid;
}

function openEntryModal(entry = null) {
  editingEntryId = entry?.id || null;

  financeEntryForm.reset();
  clearFormErrors();

  entryModalEyebrow.textContent = entry
    ? "Editar lançamento"
    : "Novo lançamento";

  entryModalTitle.textContent = entry
    ? entry.descricao
    : "Registrar movimentação";

  if (entry) {
    entryId.value = entry.id;
    entryType.value = entry.tipo;

    populateEntryCategories(entry.tipo, entry.categoria);

    entryStatus.value = entry.status;
    entryDescription.value = entry.descricao;
    entryAmount.value = formatCurrency(entry.valor);
    entryDueDate.value = entry.vencimento;
    entryPaymentDate.value = entry.pagamentoEm;
    entryPaymentMethod.value = entry.formaPagamento;

    entryClient.value = entry.cliente;
    entryCondominium.value = entry.condominio;

    entryOrder.value = entry.ordem;
    entryNotes.value = entry.observacoes;
  } else {
    const identifiers = generateIdentifiers();

    entryId.value = identifiers.id;
    entryType.value = "income";
    entryStatus.value = "pending";
    entryDueDate.value = dateToISO(today);

    populateEntryCategories("income");
  }

  financeEntryModal.hidden = false;

  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    entryDescription.focus();
  }, 50);
}

function closeEntryModal() {
  financeEntryModal.hidden = true;

  document.body.classList.remove("modal-open");

  editingEntryId = null;
  financeEntryForm.reset();
  clearFormErrors();
}

function saveEntry(event) {
  event.preventDefault();

  if (!validateEntryForm()) {
    showFeedback("Revise os campos destacados.");

    return;
  }

  const existing = getEntryById(editingEntryId);

  const identifiers = existing
    ? {
        id: existing.id,
        codigo: existing.codigo,
      }
    : generateIdentifiers();

  const status = entryStatus.value;

  const entry = normalizeEntry(
    {
      id: identifiers.id,
      codigo: identifiers.codigo,

      tipo: entryType.value,

      descricao: entryDescription.value.trim(),

      categoria: entryCategory.value,

      valor: currencyInputToNumber(entryAmount.value),

      vencimento: entryDueDate.value,

      status,

      pagamentoEm:
        status === "paid" ? entryPaymentDate.value || dateToISO(today) : "",

      formaPagamento: status === "paid" ? entryPaymentMethod.value : "",

      cliente: entryClient.value.trim(),

      condominio: entryCondominium.value.trim(),

      ordem: entryOrder.value.trim(),

      observacoes: entryNotes.value.trim(),
    },
    entries.length,
  );

  if (existing) {
    const index = entries.findIndex((item) => item.id === existing.id);

    entries[index] = entry;
  } else {
    entries.push(entry);
  }

  saveEntries();
  closeEntryModal();
  updateSummary();
  renderEntries();

  showFeedback(existing ? "Lançamento atualizado." : "Lançamento registrado.");
}

function markEntryAsPaid(id) {
  const entry = getEntryById(id);

  if (!entry) {
    return;
  }

  entry.status = "paid";
  entry.pagamentoEm = dateToISO(today);

  saveEntries();
  updateSummary();
  renderEntries();

  showFeedback("Pagamento registrado.");
}

/* EVENTOS */

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeView(button.dataset.financeView);
  });
});

financeSearch.addEventListener("input", renderEntries);

openFilterButton.addEventListener("click", openFilters);

closeFilterButton.addEventListener("click", closeFilters);

applyFiltersButton.addEventListener("click", applyFilters);

clearFiltersButton.addEventListener("click", clearSearchAndFilters);

clearEmptyFiltersButton.addEventListener("click", clearSearchAndFilters);

newEntryButton.addEventListener("click", () => openEntryModal());

closeEntryModalButton.addEventListener("click", closeEntryModal);

cancelEntryButton.addEventListener("click", closeEntryModal);

financeEntryForm.addEventListener("submit", saveEntry);

entryType.addEventListener("change", () => {
  populateEntryCategories(entryType.value);
});

entryAmount.addEventListener("input", () => {
  entryAmount.value = formatCurrencyInput(entryAmount.value);
});

entryStatus.addEventListener("change", () => {
  if (entryStatus.value === "paid" && !entryPaymentDate.value) {
    entryPaymentDate.value = dateToISO(today);
  }
});

financeEntryModal.addEventListener("click", (event) => {
  if (event.target === financeEntryModal) {
    closeEntryModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!financeEntryModal.hidden) {
    closeEntryModal();
    return;
  }

  if (!filterPanel.hidden) {
    closeFilters();
  }
});

/* INICIALIZAÇÃO */

loadEntries();
populateCategoryFilter();
updateSummary();
updateFilterCount();
renderActiveFilters();
changeView("all");
