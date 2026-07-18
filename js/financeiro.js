import "./auth-guard.js";

import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";
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

const entryClientSearch = document.getElementById("entry-client-search");

const entryClient = document.getElementById("entry-client");

const entryCondominium = document.getElementById("entry-condominium");

const entryOrder = document.getElementById("entry-order");

const entryNotes = document.getElementById("entry-notes");

const saveEntryButton = document.getElementById("save-entry-button");

const feedbackMessage = document.getElementById("feedback-message");

/* ESTADO */

let entries = [];

let currentSession = null;

let clients = [];

let condominiums = [];

let orders = [];

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

  if (typeof value.toDate === "function") {
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

  const date = new Date(`${text.split("T")[0]}T12:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
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

function normalizeLinkedReference(value, fallbackId = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      ...value,
      id: String(value.id || fallbackId || "").trim(),
    };
  }

  const id = String(value || fallbackId || "").trim();

  return id ? { id } : null;
}

function getReferenceId(reference) {
  if (reference && typeof reference === "object") {
    return String(reference.id || "").trim();
  }

  return String(reference || "").trim();
}

function getClientLabel(reference) {
  const id = getReferenceId(reference);

  const storedName =
    reference && typeof reference === "object"
      ? String(reference.nome || "").trim()
      : "";

  return storedName || clients.find((client) => client.id === id)?.nome || "";
}

function getCondominiumLabel(reference) {
  const id = getReferenceId(reference);

  const storedName =
    reference && typeof reference === "object"
      ? String(reference.nome || "").trim()
      : "";

  return (
    storedName ||
    condominiums.find((condominium) => condominium.id === id)?.nome ||
    ""
  );
}

function getOrderLabel(reference) {
  const id = getReferenceId(reference);

  const storedCode =
    reference && typeof reference === "object"
      ? String(reference.codigo || "").trim()
      : "";

  const storedTitle =
    reference && typeof reference === "object"
      ? String(reference.titulo || "").trim()
      : "";

  const linkedOrder = orders.find((order) => order.id === id);

  const code = storedCode || linkedOrder?.codigo || "";
  const title = storedTitle || linkedOrder?.titulo || "";

  return [code, title].filter(Boolean).join(" — ");
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

/* FIRESTORE */

function normalizeEntry(entry, documentId = "") {
  return {
    id: documentId || entry.id || "",

    codigo: entry.codigo || "Lançamento",

    tipo: entry.tipo === "expense" ? "expense" : "income",

    descricao: entry.descricao || "Lançamento financeiro",

    categoria: entry.categoria || "outro",

    valor: Number(entry.valor) || 0,

    vencimento: entry.vencimento || dateToISO(today),

    status: entry.status || "pending",

    pagamentoEm: entry.pagamentoEm || "",

    formaPagamento: entry.formaPagamento || "",

    cliente: normalizeLinkedReference(entry.cliente, entry.clienteUid),

    condominio: normalizeLinkedReference(entry.condominio, entry.condominioId),

    ordem: normalizeLinkedReference(entry.ordem, entry.ordemId),

    observacoes: entry.observacoes || "",

    criadoEm: entry.criadoEm || null,

    atualizadoEm: entry.atualizadoEm || null,
  };
}

async function loadEntries() {
  const snapshot = await getDocs(collection(db, "financeiro"));

  entries = snapshot.docs.map((documentSnapshot) =>
    normalizeEntry(documentSnapshot.data(), documentSnapshot.id),
  );

  console.info(
    `[Financeiro] ${entries.length} lançamento(s) carregado(s) do Firestore.`,
  );
}
function createSelectOption(value, text) {
  const option = document.createElement("option");

  option.value = value;

  option.textContent = text;

  return option;
}

function mapClientDocument(documentSnapshot) {
  const data = documentSnapshot.data();

  const status =
    data.statusCadastro || (data.ativo === false ? "inativo" : "ativo");

  return {
    id: documentSnapshot.id,

    nome: String(data.nome || "Cliente sem nome").trim(),

    email: String(data.email || "").trim(),

    telefone: String(data.telefone || "").trim(),

    status,
  };
}

function mapCondominiumDocument(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,

    codigo: String(data.codigo || "").trim(),

    nome: String(data.nome || "Condomínio sem nome").trim(),

    clientesVinculados: Array.isArray(data.clientesVinculados)
      ? data.clientesVinculados
      : [],
  };
}

function mapOrderDocument(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,

    codigo: String(data.codigo || documentSnapshot.id).trim(),

    titulo: String(
      data.titulo || data.servicoPrincipal || "Ordem de serviço",
    ).trim(),

    clienteId: String(data.cliente?.id || data.clienteUid || "").trim(),

    condominioId: String(data.condominio?.id || data.condominioId || "").trim(),
  };
}

async function loadFinancialLinks() {
  const clientsQuery = query(
    collection(db, "usuarios"),
    where("role", "==", "cliente"),
  );

  const results = await Promise.allSettled([
    getDocs(clientsQuery),
    getDocs(collection(db, "condominios")),
    getDocs(collection(db, "ordens")),
  ]);

  const [clientsResult, condominiumsResult, ordersResult] = results;

  clients = [];

  if (clientsResult.status === "fulfilled") {
    clients = clientsResult.value.docs
      .map(mapClientDocument)
      .sort((clientA, clientB) =>
        clientA.nome.localeCompare(clientB.nome, "pt-BR"),
      );

    console.info(`[Financeiro] ${clients.length} cliente(s) carregado(s).`);
  } else {
    console.error(
      "[Financeiro] Não foi possível carregar os clientes:",
      clientsResult.reason,
    );
  }

  condominiums = [];

  if (condominiumsResult.status === "fulfilled") {
    condominiums = condominiumsResult.value.docs
      .map(mapCondominiumDocument)
      .sort((condominiumA, condominiumB) =>
        condominiumA.nome.localeCompare(condominiumB.nome, "pt-BR"),
      );
  } else {
    console.error(
      "[Financeiro] Não foi possível carregar os condomínios:",
      condominiumsResult.reason,
    );
  }

  orders = [];

  if (ordersResult.status === "fulfilled") {
    orders = ordersResult.value.docs
      .map(mapOrderDocument)
      .sort((orderA, orderB) =>
        orderA.codigo.localeCompare(orderB.codigo, "pt-BR"),
      );
  } else {
    console.error(
      "[Financeiro] Não foi possível carregar as ordens:",
      ordersResult.reason,
    );
  }

  populateClientSelect();

  console.info(
    `[Financeiro] ${clients.length} cliente(s), ${condominiums.length} condomínio(s) e ${orders.length} ordem(ns) disponíveis para vínculo.`,
  );
}
function getFilteredFinanceClients() {
  const term = normalizeText(entryClientSearch.value);

  if (!term) {
    return [...clients];
  }

  const phoneSearch = String(entryClientSearch.value || "").replace(/\D/g, "");

  return clients.filter((client) => {
    const searchableContent = normalizeText(
      [client.nome, client.email, client.telefone].join(" "),
    );

    const clientPhone = String(client.telefone || "").replace(/\D/g, "");

    return (
      searchableContent.includes(term) ||
      Boolean(phoneSearch && clientPhone.includes(phoneSearch))
    );
  });
}

function populateClientSelect(selectedClientId = "") {
  const currentClientId = selectedClientId || entryClient.value;

  const term = normalizeText(entryClientSearch.value);

  const filteredClients = getFilteredFinanceClients();

  entryClient.innerHTML = "";

  let initialText = "Selecione um cliente";

  if (clients.length === 0) {
    initialText = "Nenhum cliente carregado";
  } else if (term && filteredClients.length === 0) {
    initialText = "Nenhum cliente encontrado";
  } else if (term) {
    initialText = `${filteredClients.length} cliente(s) encontrado(s)`;
  }

  entryClient.appendChild(createSelectOption("", initialText));

  filteredClients.forEach((client) => {
    const details = [client.email, client.telefone].filter(Boolean).join(" · ");

    const optionText = details ? `${client.nome} — ${details}` : client.nome;

    entryClient.appendChild(createSelectOption(client.id, optionText));
  });

  entryClient.value = filteredClients.some(
    (client) => client.id === currentClientId,
  )
    ? currentClientId
    : "";

  populateCondominiumSelect();

  populateOrderSelect();
}

function condominiumBelongsToClient(condominium, clientId) {
  if (!clientId) {
    return false;
  }

  return condominium.clientesVinculados.some(
    (link) => String(link.clienteId || "").trim() === clientId,
  );
}

function populateCondominiumSelect(selectedCondominiumId = "") {
  const clientId = entryClient.value;

  entryCondominium.innerHTML = "";

  if (!clientId) {
    entryCondominium.appendChild(
      createSelectOption("", "Selecione primeiro o cliente"),
    );

    entryCondominium.disabled = true;

    return;
  }

  const clientCondominiums = condominiums.filter((condominium) =>
    condominiumBelongsToClient(condominium, clientId),
  );

  entryCondominium.appendChild(
    createSelectOption(
      "",
      clientCondominiums.length
        ? "Nenhum condomínio específico"
        : "Cliente sem condomínio vinculado",
    ),
  );

  clientCondominiums.forEach((condominium) => {
    const code = condominium.codigo ? `${condominium.codigo} — ` : "";

    entryCondominium.appendChild(
      createSelectOption(condominium.id, `${code}${condominium.nome}`),
    );
  });

  entryCondominium.disabled = false;

  entryCondominium.value = clientCondominiums.some(
    (condominium) => condominium.id === selectedCondominiumId,
  )
    ? selectedCondominiumId
    : "";
}

function populateOrderSelect(selectedOrderId = "") {
  const clientId = entryClient.value;

  const condominiumId = entryCondominium.value;

  entryOrder.innerHTML = "";

  if (!clientId) {
    entryOrder.appendChild(
      createSelectOption("", "Selecione primeiro o cliente"),
    );

    entryOrder.disabled = true;

    return;
  }

  const clientOrders = orders.filter((order) => {
    if (order.clienteId !== clientId) {
      return false;
    }

    if (condominiumId && order.condominioId !== condominiumId) {
      return false;
    }

    return true;
  });

  entryOrder.appendChild(
    createSelectOption(
      "",
      clientOrders.length ? "Nenhuma OS específica" : "Nenhuma OS encontrada",
    ),
  );

  clientOrders.forEach((order) => {
    entryOrder.appendChild(
      createSelectOption(order.id, `${order.codigo} — ${order.titulo}`),
    );
  });

  entryOrder.disabled = false;

  entryOrder.value = clientOrders.some((order) => order.id === selectedOrderId)
    ? selectedOrderId
    : "";
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

  const clientData =
    entry.cliente && typeof entry.cliente === "object"
      ? [
          entry.cliente.nome,
          entry.cliente.email,
          entry.cliente.telefone,
          entry.cliente.id,
        ]
      : [entry.cliente];

  const condominiumData =
    entry.condominio && typeof entry.condominio === "object"
      ? [entry.condominio.nome, entry.condominio.codigo, entry.condominio.id]
      : [entry.condominio];

  const orderData =
    entry.ordem && typeof entry.ordem === "object"
      ? [entry.ordem.codigo, entry.ordem.titulo, entry.ordem.id]
      : [entry.ordem];

  const searchableContent = normalizeText(
    [
      entry.codigo,
      entry.descricao,
      ...clientData,
      ...condominiumData,
      ...orderData,
      getCategoryLabel(entry),
      entry.observacoes,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return searchableContent.includes(search);
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
      [
        getClientLabel(entry.cliente),
        getCondominiumLabel(entry.condominio),
        getOrderLabel(entry.ordem),
      ]
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

  if (entryType.value === "income" && !entryClient.value) {
    setFieldError(entryClient, "Selecione o cliente deste recebimento.");
    valid = false;
  }

  return valid;
}

function openEntryModal(entry = null) {
  editingEntryId = entry?.id || null;

  financeEntryForm.reset();

  clearFormErrors();

  entryClientSearch.value = "";

  populateClientSelect();

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

    const clientId = getReferenceId(entry.cliente);
    const condominiumId = getReferenceId(entry.condominio);
    const orderId = getReferenceId(entry.ordem);

    populateClientSelect(clientId);
    populateCondominiumSelect(condominiumId);
    populateOrderSelect(orderId);

    entryClientSearch.value = getClientLabel(entry.cliente);

    entryNotes.value = entry.observacoes;
  } else {
    entryId.value = "";

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

async function saveEntry(event) {
  event.preventDefault();

  if (!validateEntryForm()) {
    showFeedback("Revise os campos destacados.");
    return;
  }

  const existing = getEntryById(editingEntryId);
  const status = entryStatus.value;

  const selectedClient = clients.find(
    (client) => client.id === entryClient.value,
  );

  const selectedCondominium = condominiums.find(
    (condominium) => condominium.id === entryCondominium.value,
  );

  const selectedOrder = orders.find((order) => order.id === entryOrder.value);

  if (entryType.value === "income" && !selectedClient) {
    setFieldError(entryClient, "Selecione um cliente válido.");
    showFeedback("Selecione novamente o cliente.");
    return;
  }

  if (entryOrder.value && !selectedOrder) {
    setFieldError(entryOrder, "A ordem selecionada não foi encontrada.");
    showFeedback("Selecione novamente a ordem de serviço.");
    return;
  }

  if (
    selectedOrder &&
    selectedClient &&
    selectedOrder.clienteId &&
    selectedOrder.clienteId !== selectedClient.id
  ) {
    setFieldError(
      entryOrder,
      "Esta ordem não pertence ao cliente selecionado.",
    );

    showFeedback("A ordem não pertence ao cliente selecionado.");
    return;
  }

  if (
    selectedOrder &&
    selectedCondominium &&
    selectedOrder.condominioId &&
    selectedOrder.condominioId !== selectedCondominium.id
  ) {
    setFieldError(
      entryOrder,
      "Esta ordem não pertence ao condomínio selecionado.",
    );

    showFeedback("A ordem não pertence ao condomínio selecionado.");
    return;
  }

  const originalButtonText = saveEntryButton.textContent;

  saveEntryButton.disabled = true;
  saveEntryButton.textContent = existing ? "Atualizando..." : "Salvando...";

  const data = {
    tipo: entryType.value,

    descricao: entryDescription.value.trim(),

    categoria: entryCategory.value,

    valor: currencyInputToNumber(entryAmount.value),

    vencimento: entryDueDate.value,

    status,

    pagamentoEm:
      status === "paid" ? entryPaymentDate.value || dateToISO(today) : "",

    formaPagamento: status === "paid" ? entryPaymentMethod.value : "",

    clienteUid: selectedClient?.id || "",

    condominioId: selectedCondominium?.id || "",

    ordemId: selectedOrder?.id || "",

    cliente: selectedClient
      ? {
          id: selectedClient.id,
          nome: selectedClient.nome,
          email: selectedClient.email,
          telefone: selectedClient.telefone,
        }
      : null,

    condominio: selectedCondominium
      ? {
          id: selectedCondominium.id,
          codigo: selectedCondominium.codigo,
          nome: selectedCondominium.nome,
        }
      : null,

    ordem: selectedOrder
      ? {
          id: selectedOrder.id,
          codigo: selectedOrder.codigo,
          titulo: selectedOrder.titulo,
        }
      : null,

    observacoes: entryNotes.value.trim(),

    atualizadoEm: serverTimestamp(),

    atualizadoPorUid: currentSession?.uid || "",
  };

  try {
    if (existing) {
      await updateDoc(doc(db, "financeiro", existing.id), data);
    } else {
      const documentReference = doc(collection(db, "financeiro"));

      const code = `FIN-${documentReference.id.slice(0, 8).toUpperCase()}`;

      await setDoc(documentReference, {
        ...data,

        id: documentReference.id,

        codigo: code,

        criadoEm: serverTimestamp(),

        criadoPorUid: currentSession?.uid || "",
      });
    }

    await Promise.all([loadEntries(), loadFinancialLinks()]);

    closeEntryModal();

    updateSummary();

    renderEntries();

    showFeedback(
      existing ? "Lançamento atualizado." : "Lançamento registrado.",
    );
  } catch (error) {
    console.error("[Financeiro] Não foi possível salvar o lançamento:", error);

    showFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a gravação do lançamento."
        : "Não foi possível salvar o lançamento.",
    );
  } finally {
    saveEntryButton.disabled = false;

    saveEntryButton.textContent = originalButtonText;
  }
}

async function markEntryAsPaid(id) {
  const entry = getEntryById(id);

  if (!entry) {
    return;
  }

  try {
    await updateDoc(doc(db, "financeiro", id), {
      status: "paid",

      pagamentoEm: dateToISO(today),

      atualizadoEm: serverTimestamp(),

      atualizadoPorUid: currentSession?.uid || "",
    });

    await loadEntries();

    updateSummary();

    renderEntries();

    showFeedback("Pagamento registrado.");
  } catch (error) {
    console.error(
      "[Financeiro] Não foi possível registrar o pagamento:",
      error,
    );

    showFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a atualização do pagamento."
        : "Não foi possível registrar o pagamento.",
    );
  }
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

entryClientSearch.addEventListener("input", () => {
  populateClientSelect(entryClient.value);
});

entryClient.addEventListener("change", () => {
  populateCondominiumSelect();

  populateOrderSelect();
});

entryCondominium.addEventListener("change", () => {
  populateOrderSelect();
});

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

async function initializeFinancePage() {
  try {
    currentSession = await window.salvateckSessionReady;

    if (!currentSession || currentSession.role !== "admin") {
      throw new Error("ADMIN_SESSION_NOT_FOUND");
    }

    await Promise.all([loadEntries(), loadFinancialLinks()]);
  } catch (error) {
    console.error(
      "[Financeiro] Não foi possível carregar os lançamentos:",
      error,
    );

    entries = [];

    showFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a leitura dos lançamentos financeiros."
        : "Não foi possível carregar os lançamentos financeiros.",
    );
  }

  populateCategoryFilter();

  updateSummary();

  updateFilterCount();

  renderActiveFilters();

  changeView("all");
}

initializeFinancePage();
