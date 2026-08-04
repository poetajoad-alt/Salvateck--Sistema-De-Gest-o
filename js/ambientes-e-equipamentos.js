import "./auth-guard.js";

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

/* =========================================
   CONFIGURAÇÕES
========================================= */

const COLLECTIONS = {
  ambiente: "ambientes",
  equipamento: "equipamentos",
  condominios: "condominios",
};

const ENVIRONMENT_CATEGORIES = [
  "Acesso e circulação",
  "Áreas comuns",
  "Área técnica",
  "Estrutura predial",
  "Lazer e convivência",
  "Serviços e apoio",
  "Outros ambientes",
];

const EQUIPMENT_CATEGORIES = [
  "Segurança e acesso",
  "Sistema elétrico",
  "Sistema hidráulico",
  "Combate a incêndio",
  "Transporte",
  "Áreas comuns",
  "Estrutura predial",
  "Outros equipamentos",
];

/* =========================================
   ELEMENTOS
========================================= */

const newCatalogButton = document.getElementById("new-catalog-button");

const newCatalogButtonLabel = document.getElementById(
  "new-catalog-button-label",
);

const overviewButtons = document.querySelectorAll("[data-overview-target]");

const catalogTabs = document.querySelectorAll("[data-catalog-tab]");

const catalogPanels = document.querySelectorAll("[data-catalog-panel]");

const summaryEnvironments = document.getElementById("summary-environments");

const summaryEquipment = document.getElementById("summary-equipment");

const summaryActive = document.getElementById("summary-active");

const summaryInactive = document.getElementById("summary-inactive");

const catalogSearch = document.getElementById("catalog-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const activeFiltersList = document.getElementById("active-filters-list");

const statusFilter = document.getElementById("status-filter");

const categoryFilter = document.getElementById("category-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const environmentCount = document.getElementById("environment-count");

const equipmentCount = document.getElementById("equipment-count");

const environmentList = document.getElementById("environment-list");

const equipmentList = document.getElementById("equipment-list");

const environmentEmpty = document.getElementById("environment-empty");

const equipmentEmpty = document.getElementById("equipment-empty");

const environmentCardTemplate = document.getElementById(
  "environment-card-template",
);

const equipmentCardTemplate = document.getElementById(
  "equipment-card-template",
);

const catalogModal = document.getElementById("catalog-modal");

const catalogForm = document.getElementById("catalog-form");

const catalogModalEyebrow = document.getElementById("catalog-modal-eyebrow");

const catalogModalTitle = document.getElementById("catalog-modal-title");

const closeCatalogModalButton = document.getElementById(
  "close-catalog-modal-button",
);

const cancelCatalogButton = document.getElementById("cancel-catalog-button");

const saveCatalogButton = document.getElementById("save-catalog-button");

const catalogRecordId = document.getElementById("catalog-record-id");

const catalogRecordType = document.getElementById("catalog-record-type");

const catalogNameLabel = document.getElementById("catalog-name-label");

const catalogName = document.getElementById("catalog-name");

const catalogCode = document.getElementById("catalog-code");

const catalogCategory = document.getElementById("catalog-category");

const catalogStatus = document.getElementById("catalog-status");

const catalogDescription = document.getElementById("catalog-description");

const environmentFields = document.getElementById("environment-fields");

const environmentNotes = document.getElementById("environment-notes");

const equipmentFields = document.getElementById("equipment-fields");

const equipmentInspectionGuidance = document.getElementById(
  "equipment-inspection-guidance",
);

const recommendedEnvironmentsCount = document.getElementById(
  "recommended-environments-count",
);

const recommendedEnvironmentsList = document.getElementById(
  "recommended-environments-list",
);

const recommendedEnvironmentsEmpty = document.getElementById(
  "recommended-environments-empty",
);

const recommendedEnvironmentTemplate = document.getElementById(
  "recommended-environment-template",
);

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   ESTADO
========================================= */

let currentSession = null;

let currentCatalogTab = "ambientes";

let environments = [];

let equipment = [];

let condominiums = [];

let feedbackTimeout = null;

let savingRecord = false;

let appliedFilters = {
  status: "",
  categoria: "",
};

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function createSlug(value) {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || `cadastro-${Date.now()}`;
}

function formatQuantity(quantity, singular, plural) {
  const value = Number(quantity) || 0;

  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

function getCurrentRecordType() {
  return currentCatalogTab === "equipamentos" ? "equipamento" : "ambiente";
}

function getCollectionName(type) {
  return COLLECTIONS[type];
}

function getTypeLabel(type) {
  return type === "equipamento" ? "equipamento" : "ambiente";
}

function getCategoriesByType(type) {
  return type === "equipamento" ? EQUIPMENT_CATEGORIES : ENVIRONMENT_CATEGORIES;
}

function getRecordsByType(type) {
  return type === "equipamento" ? equipment : environments;
}

function buildRecordCode(type, recordId) {
  const prefix = type === "equipamento" ? "EQP" : "AMB";

  const identifier = cleanText(recordId)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toUpperCase();

  return `${prefix}-${identifier || String(Date.now()).slice(-8)}`;
}

function showFeedback(message, type = "success") {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;

  feedbackMessage.hidden = false;

  feedbackMessage.classList.toggle("is-error", type === "error");

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3500);
}

function getErrorMessage(error, fallback) {
  if (error?.code === "permission-denied") {
    return "O Firebase bloqueou esta operação.";
  }

  if (error?.code === "unavailable") {
    return "Não foi possível acessar o Firebase. Verifique sua conexão.";
  }

  return fallback;
}

function createOption(value, text) {
  const option = document.createElement("option");

  option.value = value;

  option.textContent = text;

  return option;
}

function sortCatalogRecords(first, second) {
  const statusDifference =
    Number(first.status === "inativo") - Number(second.status === "inativo");

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return first.nome.localeCompare(second.nome, "pt-BR");
}

/* =========================================
   NORMALIZAÇÃO DOS DOCUMENTOS
========================================= */

function normalizeEnvironment(snapshot) {
  const data = snapshot.data();

  return {
    id: snapshot.id,

    codigo: cleanText(data.codigo) || buildRecordCode("ambiente", snapshot.id),

    nome: cleanText(data.nome) || "Ambiente sem nome",

    categoria: cleanText(data.categoria) || "Outros ambientes",

    descricao: cleanText(data.descricao),

    observacoes: cleanText(data.observacoes || data.notas),

    status: cleanText(data.status) === "inativo" ? "inativo" : "ativo",

    criadoEm: data.criadoEm || null,

    atualizadoEm: data.atualizadoEm || null,

    usoCondominios: 0,
  };
}

function normalizeEquipment(snapshot) {
  const data = snapshot.data();

  return {
    id: snapshot.id,

    codigo:
      cleanText(data.codigo) || buildRecordCode("equipamento", snapshot.id),

    nome: cleanText(data.nome) || "Equipamento sem nome",

    categoria: cleanText(data.categoria) || "Outros equipamentos",

    descricao: cleanText(data.descricao),

    orientacaoVistoria: cleanText(
      data.orientacaoVistoria || data.orientacao || data.instrucaoVistoria,
    ),

    ambientesRecomendados: Array.isArray(data.ambientesRecomendados)
      ? data.ambientesRecomendados.map(cleanText).filter(Boolean)
      : [],

    status: cleanText(data.status) === "inativo" ? "inativo" : "ativo",

    criadoEm: data.criadoEm || null,

    atualizadoEm: data.atualizadoEm || null,

    usoCondominios: 0,
  };
}

function normalizeCondominium(snapshot) {
  return {
    id: snapshot.id,

    ...snapshot.data(),
  };
}

/* =========================================
   LEITURA DOS VÍNCULOS DOS CONDOMÍNIOS
========================================= */

function extractId(value, keys = []) {
  if (typeof value === "string" || typeof value === "number") {
    return cleanText(value);
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  for (const key of keys) {
    const candidate = cleanText(value[key]);

    if (candidate) {
      return candidate;
    }
  }

  return "";
}

function addEquipmentIdsFromArray(values, equipmentIds, validEquipmentIds) {
  if (!Array.isArray(values)) {
    return;
  }

  values.forEach((value) => {
    const equipmentId = extractId(value, [
      "equipamentoId",
      "equipmentId",
      "id",
      "codigo",
      "value",
    ]);

    if (equipmentId && validEquipmentIds.has(equipmentId)) {
      equipmentIds.add(equipmentId);
    }
  });
}

function readCondominiumCatalogUsage(condominium) {
  const validEnvironmentIds = new Set(environments.map((item) => item.id));

  const validEquipmentIds = new Set(equipment.map((item) => item.id));

  const environmentIds = new Set();

  const equipmentIds = new Set();

  addEquipmentIdsFromArray(
    condominium.equipamentos,
    equipmentIds,
    validEquipmentIds,
  );

  const environmentStructures = [
    condominium.ambientes,
    condominium.estruturaAmbientes,
    condominium.ambientesEquipamentos,
  ];

  environmentStructures.forEach((structure) => {
    if (!Array.isArray(structure)) {
      return;
    }

    structure.forEach((environmentEntry) => {
      const environmentId = extractId(environmentEntry, [
        "ambienteId",
        "environmentId",
        "id",
        "codigo",
        "value",
      ]);

      if (environmentId && validEnvironmentIds.has(environmentId)) {
        environmentIds.add(environmentId);
      }

      if (!environmentEntry || typeof environmentEntry !== "object") {
        return;
      }

      addEquipmentIdsFromArray(
        environmentEntry.equipamentos,
        equipmentIds,
        validEquipmentIds,
      );

      addEquipmentIdsFromArray(
        environmentEntry.equipamentosIds,
        equipmentIds,
        validEquipmentIds,
      );

      addEquipmentIdsFromArray(
        environmentEntry.equipmentIds,
        equipmentIds,
        validEquipmentIds,
      );
    });
  });

  return {
    environmentIds,

    equipmentIds,
  };
}

function applyUsageCounts() {
  const environmentUsage = new Map();

  const equipmentUsage = new Map();

  condominiums.forEach((condominium) => {
    const usage = readCondominiumCatalogUsage(condominium);

    usage.environmentIds.forEach((environmentId) => {
      environmentUsage.set(
        environmentId,
        (environmentUsage.get(environmentId) || 0) + 1,
      );
    });

    usage.equipmentIds.forEach((equipmentId) => {
      equipmentUsage.set(
        equipmentId,
        (equipmentUsage.get(equipmentId) || 0) + 1,
      );
    });
  });

  environments = environments.map((environment) => ({
    ...environment,

    usoCondominios: environmentUsage.get(environment.id) || 0,
  }));

  equipment = equipment.map((item) => ({
    ...item,

    usoCondominios: equipmentUsage.get(item.id) || 0,
  }));
}

/* =========================================
   CARREGAMENTO
========================================= */

async function loadCatalogData() {
  const [environmentSnapshot, equipmentSnapshot, condominiumSnapshot] =
    await Promise.all([
      getDocs(collection(db, COLLECTIONS.ambiente)),

      getDocs(collection(db, COLLECTIONS.equipamento)),

      getDocs(collection(db, COLLECTIONS.condominios)),
    ]);

  environments = environmentSnapshot.docs
    .map(normalizeEnvironment)
    .sort(sortCatalogRecords);

  equipment = equipmentSnapshot.docs
    .map(normalizeEquipment)
    .sort(sortCatalogRecords);

  condominiums = condominiumSnapshot.docs.map(normalizeCondominium);

  applyUsageCounts();
}

/* =========================================
   RESUMO
========================================= */

function updateSummary() {
  const allRecords = [...environments, ...equipment];

  summaryEnvironments.textContent = String(environments.length);

  summaryEquipment.textContent = String(equipment.length);

  summaryActive.textContent = String(
    allRecords.filter((record) => record.status === "ativo").length,
  );

  summaryInactive.textContent = String(
    allRecords.filter((record) => record.status === "inativo").length,
  );
}

function updateOverviewState() {
  overviewButtons.forEach((button) => {
    const target = button.dataset.overviewTarget;

    let active = false;

    if (target === "ambientes") {
      active = currentCatalogTab === "ambientes" && !appliedFilters.status;
    }

    if (target === "equipamentos") {
      active = currentCatalogTab === "equipamentos" && !appliedFilters.status;
    }

    if (target === "ativos") {
      active = appliedFilters.status === "ativo";
    }

    if (target === "inativos") {
      active = appliedFilters.status === "inativo";
    }

    button.classList.toggle("is-active", active);

    button.setAttribute("aria-pressed", String(active));
  });
}

/* =========================================
   ABAS
========================================= */

function updateNewButton() {
  const type = getCurrentRecordType();

  newCatalogButtonLabel.textContent =
    type === "equipamento" ? "Novo equipamento" : "Novo ambiente";
}

function updateSearchPlaceholder() {
  catalogSearch.placeholder =
    currentCatalogTab === "equipamentos"
      ? "Pesquisar equipamento"
      : "Pesquisar ambiente";
}

function setCatalogTab(tab, { preserveCategory = false } = {}) {
  currentCatalogTab = tab === "equipamentos" ? "equipamentos" : "ambientes";

  catalogTabs.forEach((button) => {
    const active = button.dataset.catalogTab === currentCatalogTab;

    button.classList.toggle("is-active", active);

    button.setAttribute("aria-pressed", String(active));
  });

  catalogPanels.forEach((panel) => {
    const active = panel.dataset.catalogPanel === currentCatalogTab;

    panel.hidden = !active;

    panel.classList.toggle("is-active", active);
  });

  if (!preserveCategory) {
    appliedFilters.categoria = "";

    categoryFilter.value = "";
  }

  updateCategoryFilter();

  updateNewButton();

  updateSearchPlaceholder();

  updateOverviewState();

  renderActiveFilters();

  renderCurrentCatalog();
}

/* =========================================
   FILTROS
========================================= */

function updateCategoryFilter() {
  const type = getCurrentRecordType();

  const categories = getCategoriesByType(type);

  const currentValue = appliedFilters.categoria;

  categoryFilter.innerHTML = "";

  categoryFilter.appendChild(createOption("", "Todas as categorias"));

  categories.forEach((category) => {
    categoryFilter.appendChild(createOption(category, category));
  });

  const valueStillExists = categories.includes(currentValue);

  categoryFilter.value = valueStillExists ? currentValue : "";

  if (!valueStillExists) {
    appliedFilters.categoria = "";
  }
}

function matchesSearch(record) {
  const search = normalizeText(catalogSearch.value);

  if (!search) {
    return true;
  }

  const content = normalizeText(
    [
      record.codigo,
      record.nome,
      record.categoria,
      record.descricao,
      record.observacoes,
      record.orientacaoVistoria,
    ].join(" "),
  );

  return content.includes(search);
}

function matchesFilters(record) {
  const statusMatches =
    !appliedFilters.status || record.status === appliedFilters.status;

  const categoryMatches =
    !appliedFilters.categoria || record.categoria === appliedFilters.categoria;

  return statusMatches && categoryMatches;
}

function getFilteredRecords(type) {
  return getRecordsByType(type)
    .filter(matchesSearch)
    .filter(matchesFilters)
    .sort(sortCatalogRecords);
}

function countActiveFilters() {
  return Object.values(appliedFilters).filter(Boolean).length;
}

function updateFilterCount() {
  const quantity = countActiveFilters();

  activeFilterCount.textContent = String(quantity);

  activeFilterCount.hidden = quantity === 0;
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

  if (appliedFilters.status) {
    activeFiltersList.appendChild(
      createFilterChip(
        appliedFilters.status === "ativo" ? "Ativos" : "Inativos",

        () => {
          appliedFilters.status = "";

          statusFilter.value = "";

          finishFilterChange();
        },
      ),
    );
  }

  if (appliedFilters.categoria) {
    activeFiltersList.appendChild(
      createFilterChip(
        appliedFilters.categoria,

        () => {
          appliedFilters.categoria = "";

          categoryFilter.value = "";

          finishFilterChange();
        },
      ),
    );
  }

  activeFiltersList.hidden = activeFiltersList.children.length === 0;

  updateFilterCount();

  updateOverviewState();
}

function finishFilterChange() {
  renderActiveFilters();

  renderCurrentCatalog();
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
    status: statusFilter.value,

    categoria: categoryFilter.value,
  };

  closeFilters();

  renderActiveFilters();

  renderCurrentCatalog();

  showFeedback("Filtros aplicados.");
}

function clearFilters({ clearSearch = false } = {}) {
  appliedFilters = {
    status: "",

    categoria: "",
  };

  statusFilter.value = "";

  categoryFilter.value = "";

  if (clearSearch) {
    catalogSearch.value = "";
  }

  closeFilters();

  renderActiveFilters();

  renderCurrentCatalog();
}

/* =========================================
   CARDS
========================================= */

function closeOtherCatalogCards(currentDetails) {
  document
    .querySelectorAll(".catalog-card__details:not([hidden])")
    .forEach((details) => {
      if (details === currentDetails) {
        return;
      }

      details.hidden = true;

      const card = details.closest(".catalog-card");

      const toggle = card?.querySelector(".catalog-card__toggle");

      if (toggle) {
        toggle.classList.remove("is-open");

        toggle.setAttribute("aria-expanded", "false");
      }
    });
}

function createCatalogCard(record, type) {
  const template =
    type === "equipamento" ? equipmentCardTemplate : environmentCardTemplate;

  const fragment = template.content.cloneNode(true);

  const card = fragment.querySelector(".catalog-card");

  const code = fragment.querySelector(".catalog-card__code");

  const status = fragment.querySelector(".catalog-card__status");

  const name = fragment.querySelector(".catalog-card__name");

  const description = fragment.querySelector(".catalog-card__description");

  const category = fragment.querySelector(".catalog-card__category");

  const usageCount = fragment.querySelector(".catalog-card__usage-count");

  const toggle = fragment.querySelector(".catalog-card__toggle");

  const details = fragment.querySelector(".catalog-card__details");

  const detailCategory = fragment.querySelector(
    ".catalog-card__detail-category",
  );

  const detailUsage = fragment.querySelector(".catalog-card__detail-usage");

  const statusAction = fragment.querySelector('[data-catalog-action="status"]');

  const editAction = fragment.querySelector('[data-catalog-action="edit"]');

  card.dataset.recordId = record.id;

  card.dataset.recordType = type;

  card.classList.toggle("is-inactive", record.status === "inativo");

  code.textContent = record.codigo;

  status.textContent = record.status === "inativo" ? "Inativo" : "Ativo";

  status.classList.toggle("status--inactive", record.status === "inativo");

  name.textContent = record.nome;

  description.textContent =
    record.descricao ||
    (type === "equipamento"
      ? "Nenhuma descrição cadastrada para este equipamento."
      : "Nenhuma descrição cadastrada para este ambiente.");

  category.textContent = record.categoria;

  usageCount.textContent = formatQuantity(
    record.usoCondominios,
    "condomínio",
    "condomínios",
  );

  detailCategory.textContent = record.categoria;

  detailUsage.textContent = formatQuantity(
    record.usoCondominios,
    "condomínio",
    "condomínios",
  );

  if (type === "equipamento") {
    const guidance = fragment.querySelector(
      ".catalog-card__inspection-guidance",
    );

    guidance.textContent =
      record.orientacaoVistoria || "Nenhuma orientação cadastrada.";
  } else {
    const notes = fragment.querySelector(".catalog-card__notes");

    notes.textContent = record.observacoes || "Nenhuma observação cadastrada.";
  }

  statusAction.textContent =
    record.status === "inativo" ? "Reativar" : "Desativar";

  toggle.addEventListener("click", () => {
    const willOpen = details.hidden;

    if (willOpen) {
      closeOtherCatalogCards(details);
    }

    details.hidden = !willOpen;

    toggle.classList.toggle("is-open", willOpen);

    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  editAction.addEventListener("click", () => {
    openCatalogModal(type, record);
  });

  statusAction.addEventListener("click", () => {
    toggleRecordStatus(type, record);
  });

  return fragment;
}

/* =========================================
   RENDERIZAÇÃO
========================================= */

function renderEnvironmentList() {
  const filteredRecords = getFilteredRecords("ambiente");

  environmentList.innerHTML = "";

  filteredRecords.forEach((record) => {
    environmentList.appendChild(createCatalogCard(record, "ambiente"));
  });

  environmentCount.textContent = formatQuantity(
    filteredRecords.length,
    "item",
    "itens",
  );

  const isEmpty = filteredRecords.length === 0;

  environmentList.hidden = isEmpty;

  environmentEmpty.hidden = !isEmpty;
}

function renderEquipmentList() {
  const filteredRecords = getFilteredRecords("equipamento");

  equipmentList.innerHTML = "";

  filteredRecords.forEach((record) => {
    equipmentList.appendChild(createCatalogCard(record, "equipamento"));
  });

  equipmentCount.textContent = formatQuantity(
    filteredRecords.length,
    "item",
    "itens",
  );

  const isEmpty = filteredRecords.length === 0;

  equipmentList.hidden = isEmpty;

  equipmentEmpty.hidden = !isEmpty;
}

function renderCurrentCatalog() {
  if (currentCatalogTab === "equipamentos") {
    renderEquipmentList();

    return;
  }

  renderEnvironmentList();
}

function renderAllCatalogData() {
  updateSummary();

  updateCategoryFilter();

  renderActiveFilters();

  renderEnvironmentList();

  renderEquipmentList();
}

/* =========================================
   MODAL
========================================= */

function populateCatalogCategories(type, selectedValue = "") {
  catalogCategory.innerHTML = "";

  catalogCategory.appendChild(createOption("", "Selecione a categoria"));

  getCategoriesByType(type).forEach((category) => {
    catalogCategory.appendChild(createOption(category, category));
  });

  catalogCategory.value = selectedValue;
}

function updateRecommendedEnvironmentCount() {
  const selected = recommendedEnvironmentsList.querySelectorAll(
    'input[name="recommended-environment"]:checked',
  ).length;

  recommendedEnvironmentsCount.textContent = formatQuantity(
    selected,
    "selecionado",
    "selecionados",
  );
}

function renderRecommendedEnvironments(selectedIds = []) {
  recommendedEnvironmentsList.innerHTML = "";

  const selectedSet = new Set(selectedIds.map(cleanText).filter(Boolean));

  const activeEnvironments = environments
    .filter((environment) => environment.status === "ativo")
    .sort(sortCatalogRecords);

  activeEnvironments.forEach((environment) => {
    const fragment = recommendedEnvironmentTemplate.content.cloneNode(true);

    const option = fragment.querySelector(".recommended-environment-option");

    const input = fragment.querySelector("input");

    const name = fragment.querySelector(
      ".recommended-environment-option__name",
    );

    const category = fragment.querySelector(
      ".recommended-environment-option__category",
    );

    input.value = environment.id;

    input.checked = selectedSet.has(environment.id);

    name.textContent = environment.nome;

    category.textContent = environment.categoria;

    input.addEventListener("change", updateRecommendedEnvironmentCount);

    recommendedEnvironmentsList.appendChild(option);
  });

  const isEmpty = activeEnvironments.length === 0;

  recommendedEnvironmentsList.hidden = isEmpty;

  recommendedEnvironmentsEmpty.hidden = !isEmpty;

  updateRecommendedEnvironmentCount();
}

function configureCatalogModal(type, record = null) {
  const isEquipment = type === "equipamento";

  const isEditing = Boolean(record?.id);

  const typeLabel = getTypeLabel(type);

  catalogRecordType.value = type;

  catalogRecordId.value = record?.id || "";

  catalogModalEyebrow.textContent = isEditing
    ? "Edição de cadastro"
    : "Cadastro técnico";

  catalogModalTitle.textContent = isEditing
    ? `Editar ${typeLabel}`
    : `Novo ${typeLabel}`;

  catalogNameLabel.textContent = isEquipment
    ? "Nome do equipamento"
    : "Nome do ambiente";

  catalogName.placeholder = isEquipment
    ? "Ex.: Iluminação de emergência"
    : "Ex.: Hall de entrada";

  saveCatalogButton.textContent = isEditing
    ? "Salvar alterações"
    : `Salvar ${typeLabel}`;

  environmentFields.hidden = isEquipment;

  equipmentFields.hidden = !isEquipment;

  populateCatalogCategories(type, record?.categoria || "");

  catalogName.value = record?.nome || "";

  catalogCode.value = record?.codigo || "";

  catalogStatus.value = record?.status || "ativo";

  catalogDescription.value = record?.descricao || "";

  environmentNotes.value = record?.observacoes || "";

  equipmentInspectionGuidance.value = record?.orientacaoVistoria || "";

  renderRecommendedEnvironments(record?.ambientesRecomendados || []);
}

function openCatalogModal(type = getCurrentRecordType(), record = null) {
  catalogForm.reset();

  configureCatalogModal(type, record);

  catalogModal.hidden = false;

  document.body.style.overflow = "hidden";

  window.setTimeout(() => {
    catalogName.focus();
  }, 30);
}

function closeCatalogModal() {
  if (savingRecord) {
    return;
  }

  catalogModal.hidden = true;

  document.body.style.overflow = "";

  catalogForm.reset();

  catalogRecordId.value = "";

  catalogRecordType.value = "ambiente";

  recommendedEnvironmentsList.innerHTML = "";

  recommendedEnvironmentsCount.textContent = "0 selecionados";

  newCatalogButton.focus();
}

function getSelectedRecommendedEnvironmentIds() {
  return Array.from(
    recommendedEnvironmentsList.querySelectorAll(
      'input[name="recommended-environment"]:checked',
    ),
  )
    .map((input) => cleanText(input.value))
    .filter(Boolean);
}

/* =========================================
   VALIDAÇÃO E GRAVAÇÃO
========================================= */

function findDuplicateRecord(type, name, currentId = "") {
  const normalizedName = normalizeText(name);

  return getRecordsByType(type).find(
    (record) =>
      record.id !== currentId && normalizeText(record.nome) === normalizedName,
  );
}

function createUniqueRecordId(type, name) {
  const baseId = createSlug(name);

  const usedIds = new Set(getRecordsByType(type).map((record) => record.id));

  if (!usedIds.has(baseId)) {
    return baseId;
  }

  return `${baseId}-${String(Date.now()).slice(-5)}`;
}

function setSaveButtonBusy(isBusy, type) {
  savingRecord = isBusy;

  saveCatalogButton.disabled = isBusy;

  cancelCatalogButton.disabled = isBusy;

  closeCatalogModalButton.disabled = isBusy;

  saveCatalogButton.textContent = isBusy
    ? "Salvando..."
    : `Salvar ${getTypeLabel(type)}`;
}

async function handleCatalogSubmit(event) {
  event.preventDefault();

  if (savingRecord) {
    return;
  }

  const type =
    catalogRecordType.value === "equipamento" ? "equipamento" : "ambiente";

  const currentId = cleanText(catalogRecordId.value);

  const name = cleanText(catalogName.value);

  const category = cleanText(catalogCategory.value);

  if (!name) {
    showFeedback(`Informe o nome do ${getTypeLabel(type)}.`, "error");

    catalogName.focus();

    return;
  }

  if (!category) {
    showFeedback("Selecione uma categoria.", "error");

    catalogCategory.focus();

    return;
  }

  const duplicate = findDuplicateRecord(type, name, currentId);

  if (duplicate) {
    showFeedback(`Já existe um ${getTypeLabel(type)} com este nome.`, "error");

    catalogName.focus();

    return;
  }

  const collectionName = getCollectionName(type);

  const recordId = currentId || createUniqueRecordId(type, name);

  const existingRecord = getRecordsByType(type).find(
    (record) => record.id === recordId,
  );

  const code = existingRecord?.codigo || buildRecordCode(type, recordId);

  const commonData = {
    id: recordId,

    codigo: code,

    nome: name,

    categoria: category,

    descricao: cleanText(catalogDescription.value),

    status: catalogStatus.value === "inativo" ? "inativo" : "ativo",

    atualizadoEm: serverTimestamp(),

    atualizadoPorUid: currentSession.uid,
  };

  const typeData =
    type === "equipamento"
      ? {
          orientacaoVistoria: cleanText(equipmentInspectionGuidance.value),

          ambientesRecomendados: getSelectedRecommendedEnvironmentIds(),
        }
      : {
          observacoes: cleanText(environmentNotes.value),
        };

  const data = {
    ...commonData,

    ...typeData,
  };

  if (!currentId) {
    data.criadoEm = serverTimestamp();

    data.criadoPorUid = currentSession.uid;
  }

  setSaveButtonBusy(true, type);

  try {
    await setDoc(
      doc(db, collectionName, recordId),

      data,

      {
        merge: true,
      },
    );

    await loadCatalogData();

    catalogModal.hidden = true;

    document.body.style.overflow = "";

    renderAllCatalogData();

    showFeedback(
      currentId
        ? `${getTypeLabel(type)} atualizado com sucesso!`
        : `${getTypeLabel(type)} cadastrado com sucesso!`,
    );
  } catch (error) {
    console.error(
      "[Ambientes e Equipamentos] Não foi possível salvar o cadastro:",

      error,
    );

    showFeedback(
      getErrorMessage(error, "Não foi possível salvar o cadastro."),

      "error",
    );
  } finally {
    setSaveButtonBusy(false, type);
  }
}

async function toggleRecordStatus(type, record) {
  const newStatus = record.status === "inativo" ? "ativo" : "inativo";

  const action = newStatus === "ativo" ? "reativar" : "desativar";

  const confirmed = window.confirm(
    `Deseja ${action} o ${getTypeLabel(type)} “${record.nome}”?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    await updateDoc(
      doc(db, getCollectionName(type), record.id),

      {
        status: newStatus,

        atualizadoEm: serverTimestamp(),

        atualizadoPorUid: currentSession.uid,
      },
    );

    await loadCatalogData();

    renderAllCatalogData();

    showFeedback(
      `${getTypeLabel(type)} ${
        newStatus === "ativo" ? "reativado" : "desativado"
      } com sucesso!`,
    );
  } catch (error) {
    console.error(
      "[Ambientes e Equipamentos] Não foi possível alterar o status:",

      error,
    );

    showFeedback(
      getErrorMessage(error, "Não foi possível alterar o status."),

      "error",
    );
  }
}

/* =========================================
   EVENTOS
========================================= */

catalogTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setCatalogTab(button.dataset.catalogTab);
  });
});

overviewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.overviewTarget;

    if (target === "ambientes" || target === "equipamentos") {
      appliedFilters.status = "";

      statusFilter.value = "";

      setCatalogTab(target);

      return;
    }

    if (target === "ativos" || target === "inativos") {
      appliedFilters.status = target === "ativos" ? "ativo" : "inativo";

      statusFilter.value = appliedFilters.status;

      finishFilterChange();
    }
  });
});

newCatalogButton.addEventListener("click", () => {
  openCatalogModal(getCurrentRecordType());
});

document.querySelectorAll("[data-empty-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const type =
      button.dataset.emptyAction === "equipamento" ? "equipamento" : "ambiente";

    openCatalogModal(type);
  });
});

catalogSearch.addEventListener("input", renderCurrentCatalog);

openFilterButton.addEventListener("click", openFilters);

closeFilterButton.addEventListener("click", closeFilters);

applyFiltersButton.addEventListener("click", applyFilters);

clearFiltersButton.addEventListener(
  "click",

  () => clearFilters(),
);

closeCatalogModalButton.addEventListener("click", closeCatalogModal);

cancelCatalogButton.addEventListener("click", closeCatalogModal);

catalogForm.addEventListener("submit", handleCatalogSubmit);

catalogModal.addEventListener("click", (event) => {
  if (event.target === catalogModal) {
    closeCatalogModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!catalogModal.hidden) {
    closeCatalogModal();

    return;
  }

  if (!filterPanel.hidden) {
    closeFilters();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function initializeCatalogPage() {
  try {
    const session = await window.salvateckSessionReady;

    if (!session || session.role !== "admin") {
      throw new Error("ADMIN_SESSION_REQUIRED");
    }

    currentSession = session;

    await loadCatalogData();

    updateSummary();

    updateCategoryFilter();

    renderActiveFilters();

    setCatalogTab("ambientes", {
      preserveCategory: true,
    });

    console.info(
      "[Ambientes e Equipamentos] Catálogo carregado:",

      {
        ambientes: environments.length,

        equipamentos: equipment.length,

        condominios: condominiums.length,

        uid: currentSession.uid,
      },
    );
  } catch (error) {
    console.error(
      "[Ambientes e Equipamentos] Não foi possível iniciar a página:",

      error,
    );

    environments = [];

    equipment = [];

    condominiums = [];

    renderAllCatalogData();

    showFeedback(
      getErrorMessage(
        error,
        "Não foi possível carregar ambientes e equipamentos.",
      ),

      "error",
    );
  }
}

initializeCatalogPage();
