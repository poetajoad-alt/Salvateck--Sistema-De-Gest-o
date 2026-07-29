import "./auth-guard.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

const inspectionUrlParameters = new URLSearchParams(window.location.search);

const inspectionIdFromURL = String(
  inspectionUrlParameters.get("vistoria") || "",
).trim();

const orderIdFromURL = String(
  inspectionUrlParameters.get("ordem") || "",
).trim();

const condominiumIdFromURL = String(
  inspectionUrlParameters.get("condominio") || "",
).trim();

const inspectionOriginFromURL = String(
  inspectionUrlParameters.get("origem") || "",
).trim();

const inspectionPageMode = String(
  inspectionUrlParameters.get("modo") || "",
).trim();

/* =========================================
   CATÁLOGO DE EQUIPAMENTOS
========================================= */

const equipmentGroups = [
  {
    categoria: "Segurança e acesso",
    itens: [
      ["portaria", "Portaria"],
      ["portao-automatico", "Portão automático"],
      ["interfone", "Interfone"],
      ["cftv", "Câmeras e CFTV"],
      ["controle-acesso", "Controle de acesso"],
    ],
  },
  {
    categoria: "Sistema elétrico",
    itens: [
      ["quadro-eletrico", "Quadros elétricos"],
      ["iluminacao-emergencia", "Iluminação de emergência"],
      ["gerador", "Gerador"],
      ["spda", "SPDA e para-raios"],
    ],
  },
  {
    categoria: "Sistema hidráulico",
    itens: [
      ["bombas", "Bombas"],
      ["reservatorio-superior", "Reservatório superior"],
      ["reservatorio-inferior", "Reservatório inferior"],
      ["rede-hidraulica", "Rede hidráulica"],
    ],
  },
  {
    categoria: "Combate a incêndio",
    itens: [
      ["extintores", "Extintores"],
      ["hidrantes", "Hidrantes"],
      ["alarme-incendio", "Alarme de incêndio"],
      ["sinalizacao-emergencia", "Sinalização de emergência"],
    ],
  },
  {
    categoria: "Transporte",
    itens: [
      ["elevador-social", "Elevador social"],
      ["elevador-servico", "Elevador de serviço"],
      ["plataforma-acessibilidade", "Plataforma de acessibilidade"],
    ],
  },
  {
    categoria: "Áreas comuns",
    itens: [
      ["piscina", "Piscina"],
      ["playground", "Playground"],
      ["academia", "Academia"],
      ["salao-festas", "Salão de festas"],
      ["garagem", "Garagem"],
      ["jardim", "Jardins"],
    ],
  },
  {
    categoria: "Estrutura predial",
    itens: [
      ["fachada", "Fachada"],
      ["cobertura", "Cobertura e telhado"],
      ["escadas", "Escadas e corrimãos"],
      ["casa-maquinas", "Casa de máquinas"],
    ],
  },
];

const equipmentCatalog = Object.fromEntries(
  equipmentGroups.flatMap((group) =>
    group.itens.map(([id, nome]) => [
      id,
      {
        nome,
        categoria: group.categoria,
      },
    ]),
  ),
);

const roleNames = {
  sindico: "Síndico",
  subsindico: "Subsíndico",
  proprietario: "Proprietário",
  gerente: "Gerente",
  administradora: "Administradora",
  zelador: "Zelador",
  financeiro: "Responsável financeiro",
  outro: "Responsável",
};

/* =========================================
   ELEMENTOS
========================================= */

const form = document.getElementById("formNovaVistoria");

const condominiumSelect = document.getElementById("condominioVistoria");

const condominiumHelp = document.getElementById("condominioVistoriaAjuda");

const responsibleSelect = document.getElementById("responsavelVistoria");

const responsibleSummary = document.getElementById("responsavelResumo");

const responsibleAvatar = document.getElementById("responsavelAvatar");

const responsibleName = document.getElementById("responsavelNome");

const responsiblePhone = document.getElementById("responsavelTelefone");

const responsibleEmail = document.getElementById("responsavelEmail");

const condominiumSummary = document.getElementById("condominioResumo");

const condominiumSummaryName = document.getElementById("condominioResumoNome");

const condominiumSummaryAddress = document.getElementById(
  "condominioResumoEndereco",
);

const condominiumSummaryCnpj = document.getElementById("condominioResumoCnpj");

const checklistEmpty = document.getElementById("checklist-empty");

const checklistEmptyTitle = checklistEmpty.querySelector("strong");

const checklistEmptyDescription = checklistEmpty.querySelector("p");

const checklistList = document.getElementById("checklist-list");

const summaryCondominium = document.getElementById("summary-condominium");

const summaryClient = document.getElementById("summary-client");

const summaryEquipment = document.getElementById("summary-equipment");

const summaryEvaluated = document.getElementById("summary-evaluated");

const progressLabel = document.getElementById("progress-label");

const progressValue = document.getElementById("progress-value");

const progressBar = document.getElementById("progress-bar");

const saveInspectionButton = document.getElementById("btnSalvarVistoria");

const feedbackMessage = document.getElementById("feedback-message");

const inspectionOrderSummary = document.getElementById(
  "inspection-order-summary",
);

const inspectionOrderCode = document.getElementById("inspection-order-code");

const inspectionOrderTitle = document.getElementById("inspection-order-title");

const inspectionOrderStatus = document.getElementById(
  "inspection-order-status",
);

/* =========================================
   ESTADO
========================================= */

let currentSession = null;

let selectedCondominium = null;

let selectedResponsible = null;

let availableCondominiums = [];

let availableResponsibleClients = [];

let checklistItems = [];

let currentLinkedOrder = null;

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function showFeedback(message, type = "success") {
  clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;

  feedbackMessage.hidden = false;

  feedbackMessage.style.backgroundColor =
    type === "error" ? "#2B2F33" : "#0D3861";

  feedbackMessage.style.color = type === "error" ? "#F9F9F9" : "#DD9A17";

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3500);
}

function createOption(value, text) {
  const option = document.createElement("option");

  option.value = value;

  option.textContent = text;

  return option;
}

function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "CL";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getCondominiumAddress(condominium = {}) {
  const address = condominium.endereco || {};

  const firstLine = [
    address.logradouro || address.rua || "",
    address.numero || "",
    address.complemento || "",
  ]
    .filter(Boolean)
    .join(", ");

  const cityAndState = [
    address.cidade || "",
    address.estado || address.uf || "",
  ]
    .filter(Boolean)
    .join("/");

  const secondLine = [address.bairro || "", cityAndState, address.cep || ""]
    .filter(Boolean)
    .join(" — ");

  return [firstLine, secondLine].filter(Boolean).join(" | ");
}

function mapCondominiumSnapshot(snapshot) {
  const data = snapshot.data();

  return {
    id: snapshot.id,

    codigo: String(data.codigo || "").trim(),

    nome: String(data.nome || "Condomínio sem nome").trim(),

    cnpj: String(data.cnpj || "").trim(),

    status: String(data.status || "ativo").trim(),

    endereco: data.endereco || {},

    clientesIds: Array.isArray(data.clientesIds) ? data.clientesIds : [],

    clientesVinculados: Array.isArray(data.clientesVinculados)
      ? data.clientesVinculados
      : [],

    equipamentos: Array.isArray(data.equipamentos) ? data.equipamentos : [],
  };
}

function getLinkedClientData(condominium = {}) {
  const links = Array.isArray(condominium.clientesVinculados)
    ? condominium.clientesVinculados
    : [];

  const linkMap = new Map(
    links
      .map((link) => [String(link?.clienteId || "").trim(), link])
      .filter(([clientId]) => Boolean(clientId)),
  );

  const clientIds = [
    ...links.map((link) => String(link?.clienteId || "").trim()),

    ...(Array.isArray(condominium.clientesIds)
      ? condominium.clientesIds.map((clientId) => String(clientId || "").trim())
      : []),
  ].filter(Boolean);

  return Array.from(new Set(clientIds)).map((clientId) => ({
    clientId,

    link: linkMap.get(clientId) || {},
  }));
}

/* =========================================
   CARREGAMENTO DA ORDEM PARA EXECUÇÃO
========================================= */

function normalizeInspectionText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getOrderLinkedInspectionId(order = {}) {
  return String(
    order.vistoria?.id || order.vistoria?.vistoriaId || order.vistoriaId || "",
  ).trim();
}

async function loadOrderForExecution(orderId) {
  const orderReference = doc(db, "ordens", orderId);

  const orderSnapshot = await getDoc(orderReference);

  if (!orderSnapshot.exists()) {
    throw new Error("ORDER_NOT_FOUND");
  }

  const order = orderSnapshot.data();

  const categories = Array.isArray(order.categorias)
    ? order.categorias
    : [order.categoriaPrincipal].filter(Boolean);

  const attendanceType =
    order.tipoAtendimento ||
    (categories.includes("vistoria") ? "vistoria" : "servico");

  if (attendanceType !== "vistoria") {
    throw new Error("ORDER_NOT_INSPECTION");
  }

  const normalizedStatus = normalizeInspectionText(order.status);

  if (!["agendada", "agendado"].includes(normalizedStatus)) {
    throw new Error("ORDER_NOT_SCHEDULED");
  }

  if (getOrderLinkedInspectionId(order)) {
    throw new Error("ORDER_ALREADY_HAS_INSPECTION");
  }

  const condominiumId = String(
    order.condominio?.id || order.condominioId || "",
  ).trim();

  if (!condominiumId) {
    throw new Error("ORDER_WITHOUT_CONDOMINIUM");
  }

  const condominiumSnapshot = await getDoc(
    doc(db, "condominios", condominiumId),
  );

  if (!condominiumSnapshot.exists()) {
    throw new Error("CONDOMINIUM_NOT_FOUND");
  }

  selectedCondominium = mapCondominiumSnapshot(condominiumSnapshot);

  const responsibleUid = String(
    order.clienteUid || order.cliente?.id || "",
  ).trim();

  if (!responsibleUid) {
    throw new Error("ORDER_WITHOUT_RESPONSIBLE");
  }

  const responsibleSnapshot = await getDoc(doc(db, "usuarios", responsibleUid));

  selectedResponsible = responsibleSnapshot.exists()
    ? {
        ...responsibleSnapshot.data(),

        uid: responsibleSnapshot.id,
      }
    : {
        ...(order.cliente || {}),

        uid: responsibleUid,
      };

  currentLinkedOrder = {
    id: orderSnapshot.id,

    codigo: String(order.codigo || orderSnapshot.id).trim(),

    titulo: String(
      order.titulo || order.servicoPrincipal || "Vistoria técnica",
    ).trim(),

    status: normalizedStatus,

    condominioId: condominiumId,

    clienteUid: responsibleUid,
  };

  availableCondominiums = [selectedCondominium];

  availableResponsibleClients = [selectedResponsible];

  condominiumSelect.innerHTML = "";

  condominiumSelect.appendChild(
    createOption(
      selectedCondominium.id,
      [selectedCondominium.codigo, selectedCondominium.nome]
        .filter(Boolean)
        .join(" — "),
    ),
  );

  condominiumSelect.value = selectedCondominium.id;

  condominiumSelect.disabled = true;

  responsibleSelect.innerHTML = "";

  responsibleSelect.appendChild(
    createOption(
      selectedResponsible.uid,
      selectedResponsible.nome || "Responsável da ordem",
    ),
  );

  responsibleSelect.value = selectedResponsible.uid;

  responsibleSelect.disabled = true;

  loadChecklistFromCondominium();

  updatePageState();

  if (inspectionOrderSummary) {
    inspectionOrderSummary.hidden = false;
  }

  if (inspectionOrderCode) {
    inspectionOrderCode.textContent = currentLinkedOrder.codigo;
  }

  if (inspectionOrderTitle) {
    inspectionOrderTitle.textContent = currentLinkedOrder.titulo;
  }

  if (inspectionOrderStatus) {
    inspectionOrderStatus.textContent =
      "Vistoria vinculada a atendimento agendado";
  }

  condominiumHelp.textContent =
    "O condomínio e o responsável vieram da Ordem de Serviço e não podem ser alterados.";

  const pageTitle = document.getElementById("inspection-page-title");

  const introTitle = document.getElementById("inspection-intro-title");

  const introDescription = document.getElementById(
    "inspection-intro-description",
  );

  const backLink = document.getElementById("inspection-back-link");

  const cancelLink = form.querySelector(".inspection-cancel-button");

  const orderDetailsUrl = `detalhes-solicitacao.html?id=${encodeURIComponent(
    currentLinkedOrder.id,
  )}`;

  if (pageTitle) {
    pageTitle.textContent = `Vistoria da ${currentLinkedOrder.codigo}`;
  }

  if (introTitle) {
    introTitle.textContent = "Execute a vistoria técnica agendada";
  }

  if (introDescription) {
    introDescription.textContent =
      "Avalie os equipamentos do condomínio. Ao salvar, a vistoria será vinculada automaticamente à Ordem de Serviço.";
  }

  if (backLink) {
    backLink.href = orderDetailsUrl;

    backLink.setAttribute(
      "aria-label",
      `Voltar para ${currentLinkedOrder.codigo}`,
    );
  }

  if (cancelLink) {
    cancelLink.href = orderDetailsUrl;

    cancelLink.textContent = "Voltar para a OS";
  }

  document.title = `Vistoria da ${currentLinkedOrder.codigo} | Salvateck`;
}

/* =========================================
   CARREGAMENTO DE VISTORIA EXISTENTE
========================================= */

function applyStoredChecklistState() {
  checklistItems.forEach((item, index) => {
    const card = checklistList.querySelector(
      `.inspection-checklist-item[data-index="${index}"]`,
    );

    if (!card) {
      return;
    }

    const resultInput = card.querySelector(`input[value="${item.resultado}"]`);

    const status = card.querySelector(".inspection-checklist-item__status");

    const observationGroup = card.querySelector(
      ".inspection-checklist-observation",
    );

    const observation = observationGroup?.querySelector("textarea");

    if (resultInput) {
      resultInput.checked = true;
    }

    const needsAdjustment = item.resultado === "precisa-ajuste";

    card.classList.toggle("is-ok", item.resultado === "ok");

    card.classList.toggle("needs-adjustment", needsAdjustment);

    if (status) {
      status.textContent = needsAdjustment ? "Precisa de ajuste" : "OK";
    }

    if (observationGroup) {
      observationGroup.hidden = !needsAdjustment;
    }

    if (observation) {
      observation.value = String(item.observacao || "").trim();
    }
  });
}

async function loadExistingInspection(inspectionId) {
  const inspectionSnapshot = await getDoc(doc(db, "vistorias", inspectionId));

  if (!inspectionSnapshot.exists()) {
    throw new Error("INSPECTION_NOT_FOUND");
  }

  const inspection = inspectionSnapshot.data();

  selectedCondominium = {
    id: inspection.condominio?.id || inspection.condominioId || "",

    codigo: inspection.condominio?.codigo || "",

    nome: inspection.condominio?.nome || "Condomínio não informado",

    cnpj: inspection.condominio?.cnpj || "",

    endereco: inspection.condominio?.endereco || inspection.endereco || {},

    clientesIds: [],

    clientesVinculados: [],

    equipamentos: [],
  };

  selectedResponsible = {
    ...(inspection.cliente || {}),

    uid: inspection.cliente?.id || inspection.clienteUid || "",
  };

  checklistItems = Array.isArray(inspection.checklist)
    ? inspection.checklist.map((item) => ({
        equipamentoId: String(item.equipamentoId || "").trim(),

        nome: String(item.nome || "").trim() || "Equipamento sem nome",

        categoria: String(item.categoria || "").trim() || "Outros equipamentos",

        resultado: String(item.resultado || "").trim(),

        observacao: String(item.observacao || "").trim(),
      }))
    : [];

  condominiumSelect.innerHTML = "";

  condominiumSelect.appendChild(
    createOption(
      selectedCondominium.id,
      [selectedCondominium.codigo, selectedCondominium.nome]
        .filter(Boolean)
        .join(" — "),
    ),
  );

  condominiumSelect.value = selectedCondominium.id;

  responsibleSelect.innerHTML = "";

  responsibleSelect.appendChild(
    createOption(
      selectedResponsible.uid,
      selectedResponsible.nome || "Responsável não informado",
    ),
  );

  responsibleSelect.value = selectedResponsible.uid;

  updateCondominiumSummary();

  updateResponsibleSummary();

  renderChecklist();

  applyStoredChecklistState();

  updateInspectionSummary();

  updateProgress();

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.disabled = true;
  });

  saveInspectionButton.disabled = true;

  saveInspectionButton.textContent = inspection.codigo || "Vistoria validada";

  const pageTitle = document.getElementById("inspection-page-title");

  const introTitle = document.getElementById("inspection-intro-title");

  const introDescription = document.getElementById(
    "inspection-intro-description",
  );

  const backLink = document.getElementById("inspection-back-link");

  const cancelLink = form.querySelector(".inspection-cancel-button");

  if (pageTitle) {
    pageTitle.textContent = inspection.codigo || "Vistoria";
  }

  if (introTitle) {
    introTitle.textContent = "Vistoria técnica validada";
  }

  if (introDescription) {
    introDescription.textContent =
      "Consulte o condomínio, o responsável e o resultado completo do checklist.";
  }

  if (backLink) {
    backLink.href = "vistorias.html";
  }

  if (cancelLink) {
    cancelLink.href = "vistorias.html";

    cancelLink.textContent = "Voltar para vistorias";
  }

  condominiumHelp.textContent =
    inspection.ordemVinculada === true
      ? `Vistoria vinculada à ${inspection.codigoOS || "uma OS"}.`
      : "Vistoria validada e ainda sem Ordem de Serviço vinculada.";

  document.title = `${inspection.codigo || "Vistoria"} | Salvateck`;
}

/* =========================================
   RESUMOS E PROGRESSO
========================================= */

function updateResponsibleSummary() {
  if (!selectedResponsible) {
    responsibleSummary.hidden = true;

    summaryClient.textContent = "Não selecionado";

    return;
  }

  const name = String(
    selectedResponsible.nome || "Responsável sem nome",
  ).trim();

  responsibleAvatar.textContent = getInitials(name);

  responsibleName.textContent = name;

  responsiblePhone.textContent =
    String(selectedResponsible.telefone || "").trim() ||
    "Telefone não informado";

  responsibleEmail.textContent =
    String(selectedResponsible.email || "").trim() || "E-mail não informado";

  responsibleSummary.hidden = false;

  summaryClient.textContent = name;
}

function updateCondominiumSummary() {
  if (!selectedCondominium) {
    condominiumSummary.hidden = true;

    summaryCondominium.textContent = "Não selecionado";

    return;
  }

  const identification = [selectedCondominium.codigo, selectedCondominium.nome]
    .filter(Boolean)
    .join(" — ");

  condominiumSummaryName.textContent =
    identification || "Condomínio não informado";

  condominiumSummaryAddress.textContent =
    getCondominiumAddress(selectedCondominium) || "Endereço não informado";

  condominiumSummaryCnpj.textContent = selectedCondominium.cnpj
    ? `CNPJ ${selectedCondominium.cnpj}`
    : "CNPJ não informado";

  condominiumSummary.hidden = false;

  summaryCondominium.textContent = identification || selectedCondominium.nome;
}

function updateInspectionSummary() {
  const evaluatedItems = checklistItems.filter((item) => item.resultado).length;

  summaryEquipment.textContent =
    checklistItems.length === 1
      ? "1 equipamento"
      : `${checklistItems.length} equipamentos`;

  summaryEvaluated.textContent = `${evaluatedItems} de ${checklistItems.length}`;
}

function updateProgress() {
  const hasCondominium = Boolean(selectedCondominium?.id);

  const hasResponsible = Boolean(selectedResponsible?.uid);

  const hasEquipment = checklistItems.length > 0;

  const hasCompletedChecklist =
    hasEquipment &&
    checklistItems.every((item) => {
      if (!item.resultado) {
        return false;
      }

      if (
        item.resultado === "precisa-ajuste" &&
        !String(item.observacao || "").trim()
      ) {
        return false;
      }

      return true;
    });

  const steps = [
    hasCondominium,
    hasResponsible,
    hasEquipment,
    hasCompletedChecklist,
  ];

  const completedSteps = steps.filter(Boolean).length;

  const percentage = Math.round((completedSteps / steps.length) * 100);

  progressValue.textContent = `${percentage}%`;

  progressBar.style.width = `${percentage}%`;

  if (percentage === 0) {
    progressLabel.textContent = "Etapa inicial";
  } else if (percentage < 50) {
    progressLabel.textContent = "Continue preenchendo";
  } else if (percentage < 100) {
    progressLabel.textContent = "Quase lá";
  } else {
    progressLabel.textContent = "Checklist concluído";
  }

  saveInspectionButton.disabled = !(
    hasCondominium &&
    hasResponsible &&
    hasCompletedChecklist
  );
}

function updatePageState() {
  updateCondominiumSummary();

  updateResponsibleSummary();

  updateInspectionSummary();

  updateProgress();
}

/* =========================================
   CHECKLIST
========================================= */

function resetChecklist(
  message = "Selecione o condomínio para iniciar o checklist.",
) {
  checklistItems = [];

  checklistList.innerHTML = "";

  checklistList.hidden = true;

  checklistEmptyTitle.textContent = "Nenhum equipamento carregado";

  checklistEmptyDescription.textContent = message;

  checklistEmpty.hidden = false;

  updateInspectionSummary();

  updateProgress();
}

function createChecklistOption(index, value, label) {
  const option = document.createElement("label");

  option.className = "inspection-checklist-option";

  const input = document.createElement("input");

  input.type = "radio";

  input.name = `equipamento-${index}`;

  input.value = value;

  input.dataset.checklistResult = "true";

  input.dataset.index = String(index);

  const text = document.createElement("span");

  text.textContent = label;

  option.append(input, text);

  return option;
}

function renderChecklist() {
  checklistList.innerHTML = "";

  if (checklistItems.length === 0) {
    resetChecklist(
      "Este condomínio ainda não possui equipamentos cadastrados para a vistoria.",
    );

    return;
  }

  checklistItems.forEach((item, index) => {
    const card = document.createElement("article");

    card.className = "inspection-checklist-item";

    card.dataset.index = String(index);

    const heading = document.createElement("div");

    heading.className = "inspection-checklist-item__heading";

    const identification = document.createElement("div");

    const category = document.createElement("span");

    category.textContent = item.categoria;

    const title = document.createElement("strong");

    title.textContent = item.nome;

    identification.append(category, title);

    const headingActions = document.createElement("div");

    headingActions.className = "inspection-checklist-item__heading-actions";

    const status = document.createElement("small");

    status.className = "inspection-checklist-item__status";

    status.textContent = "Pendente";

    const toggleButton = document.createElement("button");

    toggleButton.type = "button";

    toggleButton.className = "inspection-checklist-item__toggle";

    toggleButton.setAttribute("aria-expanded", "false");

    toggleButton.setAttribute("aria-label", `Abrir detalhes de ${item.nome}`);

    toggleButton.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    `;

    headingActions.append(status, toggleButton);

    heading.append(identification, headingActions);

    const options = document.createElement("div");

    options.className = "inspection-checklist-item__options";

    options.append(
      createChecklistOption(index, "ok", "Está OK"),

      createChecklistOption(index, "precisa-ajuste", "Precisa de ajuste"),
    );

    const observationGroup = document.createElement("label");

    observationGroup.className = "inspection-checklist-observation";

    observationGroup.hidden = true;

    const observationLabel = document.createElement("span");

    observationLabel.textContent = "Observação do ajuste";

    const observation = document.createElement("textarea");

    observation.rows = 3;

    observation.maxLength = 600;

    observation.placeholder =
      "Descreva o problema encontrado e o ajuste necessário.";

    observation.dataset.checklistObservation = "true";

    observation.dataset.index = String(index);

    observationGroup.append(observationLabel, observation);

    const details = document.createElement("div");

    details.className = "inspection-checklist-item__details";

    details.hidden = true;

    details.append(options, observationGroup);

    toggleButton.addEventListener("click", () => {
      const willOpen = details.hidden;

      checklistList
        .querySelectorAll(".inspection-checklist-item__details")
        .forEach((otherDetails) => {
          if (otherDetails === details) {
            return;
          }

          otherDetails.hidden = true;

          const otherCard = otherDetails.closest(".inspection-checklist-item");

          const otherToggle = otherCard?.querySelector(
            ".inspection-checklist-item__toggle",
          );

          if (otherToggle) {
            otherToggle.classList.remove("is-open");

            otherToggle.setAttribute("aria-expanded", "false");
          }
        });

      details.hidden = !willOpen;

      toggleButton.classList.toggle("is-open", willOpen);

      toggleButton.setAttribute("aria-expanded", String(willOpen));

      toggleButton.setAttribute(
        "aria-label",
        `${willOpen ? "Fechar" : "Abrir"} detalhes de ${item.nome}`,
      );
    });

    card.append(heading, details);

    checklistList.appendChild(card);
  });

  checklistEmpty.hidden = true;

  checklistList.hidden = false;

  updateInspectionSummary();

  updateProgress();
}

function loadChecklistFromCondominium() {
  const equipmentIds = Array.isArray(selectedCondominium?.equipamentos)
    ? selectedCondominium.equipamentos
    : [];

  checklistItems = equipmentIds.map((equipmentId) => {
    const normalizedId = String(equipmentId || "").trim();

    const catalogItem = equipmentCatalog[normalizedId];

    return {
      equipamentoId: normalizedId,

      nome: catalogItem?.nome || normalizedId || "Equipamento sem nome",

      categoria: catalogItem?.categoria || "Outros equipamentos",

      resultado: "",

      observacao: "",
    };
  });

  renderChecklist();
}

function handleChecklistChange(event) {
  const input = event.target.closest('input[data-checklist-result="true"]');

  if (!input) {
    return;
  }

  const index = Number(input.dataset.index);

  const item = checklistItems[index];

  const card = checklistList.querySelector(
    `.inspection-checklist-item[data-index="${index}"]`,
  );

  if (!item || !card) {
    return;
  }

  item.resultado = input.value;

  const needsAdjustment = item.resultado === "precisa-ajuste";

  const observationGroup = card.querySelector(
    ".inspection-checklist-observation",
  );

  const observation = observationGroup.querySelector("textarea");

  const status = card.querySelector(".inspection-checklist-item__status");

  card.classList.toggle("is-ok", item.resultado === "ok");

  card.classList.toggle("needs-adjustment", needsAdjustment);

  observationGroup.hidden = !needsAdjustment;

  if (needsAdjustment) {
    status.textContent = "Precisa de ajuste";

    observation.focus();
  } else {
    status.textContent = "OK";

    observation.value = "";

    item.observacao = "";
  }

  updateInspectionSummary();

  updateProgress();
}

function handleChecklistObservation(event) {
  const field = event.target.closest(
    'textarea[data-checklist-observation="true"]',
  );

  if (!field) {
    return;
  }

  const index = Number(field.dataset.index);

  if (!checklistItems[index]) {
    return;
  }

  checklistItems[index].observacao = field.value.trim();

  updateInspectionSummary();

  updateProgress();
}

/* =========================================
   CONDOMÍNIOS E RESPONSÁVEIS
========================================= */

function resetResponsibleSelection(
  message = "Selecione o condomínio primeiro",
) {
  selectedResponsible = null;

  availableResponsibleClients = [];

  responsibleSelect.innerHTML = "";

  responsibleSelect.appendChild(createOption("", message));

  responsibleSelect.disabled = true;

  updateResponsibleSummary();

  updateProgress();
}

function applyResponsible(client) {
  selectedResponsible = client;

  responsibleSelect.value = client.uid;

  updateResponsibleSummary();

  updateProgress();
}

async function loadResponsibleClients(condominium) {
  const linkedClients = getLinkedClientData(condominium);

  resetResponsibleSelection("Carregando responsáveis...");

  if (linkedClients.length === 0) {
    resetResponsibleSelection("Nenhum responsável vinculado");

    condominiumHelp.textContent =
      "O condomínio não possui clientes ou responsáveis vinculados.";

    return;
  }

  try {
    const snapshots = await Promise.all(
      linkedClients.map(({ clientId }) =>
        getDoc(doc(db, "usuarios", clientId)),
      ),
    );

    availableResponsibleClients = snapshots
      .map((snapshot, index) => {
        if (!snapshot.exists()) {
          return null;
        }

        const linkedClient = linkedClients[index];

        const data = snapshot.data();

        return {
          ...data,

          uid: snapshot.id,

          papel: linkedClient.link?.papel || "outro",

          contatoPrincipal: Boolean(linkedClient.link?.contatoPrincipal),
        };
      })
      .filter(Boolean)
      .filter((client) => client.role === "cliente")
      .sort((clientA, clientB) => {
        if (clientA.contatoPrincipal !== clientB.contatoPrincipal) {
          return clientA.contatoPrincipal ? -1 : 1;
        }

        return String(clientA.nome || "").localeCompare(
          String(clientB.nome || ""),
          "pt-BR",
        );
      });

    responsibleSelect.innerHTML = "";

    if (availableResponsibleClients.length === 0) {
      resetResponsibleSelection("Nenhum responsável encontrado");

      condominiumHelp.textContent =
        "Os vínculos existem, mas os usuários não foram encontrados.";

      return;
    }

    if (availableResponsibleClients.length > 1) {
      responsibleSelect.appendChild(
        createOption("", "Selecione o responsável"),
      );
    }

    availableResponsibleClients.forEach((client) => {
      const role = roleNames[client.papel] || "Responsável";

      const identification = [client.nome, role, client.telefone]
        .filter(Boolean)
        .join(" — ");

      responsibleSelect.appendChild(
        createOption(
          client.uid,

          identification || "Responsável sem nome informado",
        ),
      );
    });

    responsibleSelect.disabled = false;

    if (availableResponsibleClients.length === 1) {
      applyResponsible(availableResponsibleClients[0]);

      condominiumHelp.textContent =
        "O único responsável vinculado foi selecionado automaticamente.";

      return;
    }

    condominiumHelp.textContent =
      `${availableResponsibleClients.length} responsáveis vinculados. ` +
      "Selecione quem acompanhará a vistoria.";
  } catch (error) {
    console.error(
      "[Nova Vistoria] Não foi possível carregar os responsáveis:",
      error,
    );

    resetResponsibleSelection("Erro ao carregar responsáveis");

    condominiumHelp.textContent =
      "Não foi possível consultar os responsáveis vinculados.";

    showFeedback("Não foi possível carregar os responsáveis.", "error");
  }
}

async function loadCondominiums() {
  condominiumSelect.innerHTML = "";

  condominiumSelect.appendChild(createOption("", "Carregando condomínios..."));

  condominiumSelect.disabled = true;

  try {
    const snapshot = await getDocs(collection(db, "condominios"));

    availableCondominiums = snapshot.docs
      .map(mapCondominiumSnapshot)
      .filter((condominium) => condominium.status !== "inativo")
      .sort((condominiumA, condominiumB) =>
        condominiumA.nome.localeCompare(condominiumB.nome, "pt-BR"),
      );

    condominiumSelect.innerHTML = "";

    condominiumSelect.appendChild(createOption("", "Selecione o condomínio"));

    availableCondominiums.forEach((condominium) => {
      const identification = [condominium.codigo, condominium.nome]
        .filter(Boolean)
        .join(" — ");

      condominiumSelect.appendChild(
        createOption(condominium.id, identification),
      );
    });

    condominiumSelect.disabled = availableCondominiums.length === 0;

    condominiumHelp.textContent =
      availableCondominiums.length === 0
        ? "Nenhum condomínio ativo foi encontrado."
        : `${availableCondominiums.length} condomínios disponíveis. Selecione o local da vistoria.`;
  } catch (error) {
    console.error(
      "[Nova Vistoria] Não foi possível carregar os condomínios:",
      error,
    );

    condominiumSelect.innerHTML = "";

    condominiumSelect.appendChild(
      createOption("", "Não foi possível carregar os condomínios"),
    );

    condominiumSelect.disabled = true;

    condominiumHelp.textContent =
      "O Firebase bloqueou ou não concluiu a consulta dos condomínios.";

    showFeedback("Não foi possível carregar os condomínios.", "error");
  }
}

async function handleCondominiumChange() {
  const condominiumId = String(condominiumSelect.value || "").trim();

  selectedCondominium =
    availableCondominiums.find(
      (condominium) => condominium.id === condominiumId,
    ) || null;

  resetResponsibleSelection();

  if (!selectedCondominium) {
    resetChecklist();

    updatePageState();

    return;
  }

  updateCondominiumSummary();

  loadChecklistFromCondominium();

  await loadResponsibleClients(selectedCondominium);

  updatePageState();
}

function handleResponsibleChange() {
  const responsibleUid = String(responsibleSelect.value || "").trim();

  selectedResponsible =
    availableResponsibleClients.find(
      (client) => client.uid === responsibleUid,
    ) || null;

  updateResponsibleSummary();

  updateProgress();
}

/* =========================================
   GRAVAÇÃO DA VISTORIA
========================================= */

function formatInspectionCode(number) {
  return `VST-${String(number).padStart(4, "0")}`;
}

function buildInspectionData({ id, numero, codigo }) {
  const evaluatedItems = checklistItems.filter((item) =>
    Boolean(item.resultado),
  );

  const nonconformities = checklistItems.filter(
    (item) => item.resultado === "precisa-ajuste",
  );

  const creatorName = String(
    currentSession?.profile?.nome ||
      currentSession?.user?.displayName ||
      currentSession?.email ||
      currentSession?.user?.email ||
      "",
  ).trim();

  const creatorEmail = String(
    currentSession?.email ||
      currentSession?.user?.email ||
      currentSession?.profile?.email ||
      "",
  ).trim();

  return {
    id,

    numero,

    codigo,

    criadoEm: serverTimestamp(),

    atualizadoEm: serverTimestamp(),

    statusAtualizadoEm: serverTimestamp(),

    validadaEm: serverTimestamp(),

    criadoPorUid: currentSession.uid,

    criadoPorNome: creatorName,

    perfilCriador: "admin",

    tipoAtendimento: "vistoria",

    tipo: "Vistoria técnica",

    titulo: "Vistoria técnica",

    status: "concluida",

    validada: true,

    progresso: 100,

    prioridade: "normal",

    condominioId: selectedCondominium.id,

    clienteUid: selectedResponsible.uid,

    condominio: {
      id: selectedCondominium.id,

      codigo: selectedCondominium.codigo || "",

      nome: selectedCondominium.nome || "",

      cnpj: selectedCondominium.cnpj || "",

      endereco: selectedCondominium.endereco || {},
    },

    cliente: {
      id: selectedResponsible.uid,

      nome: selectedResponsible.nome || "",

      telefone: selectedResponsible.telefone || "",

      email: selectedResponsible.email || "",

      papel: selectedResponsible.papel || "outro",
    },

    endereco: selectedCondominium.endereco || {},

    tecnico: {
      uid: currentSession.uid,

      nome: creatorName,

      email: creatorEmail,
    },

    checklist: checklistItems.map((item) => ({
      equipamentoId: item.equipamentoId || "",

      nome: item.nome || "",

      categoria: item.categoria || "",

      resultado: item.resultado || "",

      observacao: String(item.observacao || "").trim(),
    })),

    totalItens: checklistItems.length,

    itensConcluidos: evaluatedItems.length,

    equipamentosAvaliados: evaluatedItems.length,

    naoConformidades: nonconformities.length,

    pendenciasCriticas: 0,

    quantidadeFotos: 0,

    observacao: "",

    ordemVinculada: Boolean(currentLinkedOrder?.id),

    ordemId: currentLinkedOrder?.id || "",

    codigoOS: currentLinkedOrder?.codigo || "",

    origem: currentLinkedOrder
      ? {
          tipo: "ordem-servico",

          ordemId: currentLinkedOrder.id,

          codigoOS: currentLinkedOrder.codigo,
        }
      : {
          tipo: "vistoria-admin",

          ordemId: "",

          codigoOS: "",
        },
  };
}

async function saveInspectionInFirestore() {
  const counterReference = doc(db, "contadores", "vistorias");

  const inspectionReference = doc(collection(db, "vistorias"));

  const orderReference = currentLinkedOrder?.id
    ? doc(db, "ordens", currentLinkedOrder.id)
    : null;

  return runTransaction(db, async (transaction) => {
    const counterSnapshot = await transaction.get(counterReference);

    let linkedOrderSnapshot = null;

    if (orderReference) {
      linkedOrderSnapshot = await transaction.get(orderReference);

      if (!linkedOrderSnapshot.exists()) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const linkedOrderData = linkedOrderSnapshot.data();

      const linkedInspectionId = getOrderLinkedInspectionId(linkedOrderData);

      if (linkedInspectionId) {
        throw new Error("ORDER_ALREADY_HAS_INSPECTION");
      }

      const linkedOrderStatus = normalizeInspectionText(linkedOrderData.status);

      if (!["agendada", "agendado"].includes(linkedOrderStatus)) {
        throw new Error("ORDER_NOT_SCHEDULED");
      }
    }

    const currentNumber = counterSnapshot.exists()
      ? Number(counterSnapshot.data().ultimoNumero || 0)
      : 0;

    if (!Number.isInteger(currentNumber) || currentNumber < 0) {
      throw new Error("INVALID_INSPECTION_COUNTER");
    }

    const nextNumber = currentNumber + 1;

    const code = formatInspectionCode(nextNumber);

    const inspectionData = buildInspectionData({
      id: inspectionReference.id,

      numero: nextNumber,

      codigo: code,
    });

    transaction.set(
      counterReference,
      {
        ultimoNumero: nextNumber,

        ultimoDocumentoId: inspectionReference.id,

        atualizadoEm: serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    transaction.set(inspectionReference, inspectionData);

    if (orderReference) {
      transaction.update(orderReference, {
        "vistoria.id": inspectionReference.id,

        "vistoria.vistoriaId": inspectionReference.id,

        "vistoria.codigo": code,

        "vistoria.codigoVistoria": code,

        "vistoria.status": "concluida",

        "vistoria.validada": true,

        "vistoria.progresso": 100,

        "vistoria.totalItens": inspectionData.totalItens,

        "vistoria.itensConcluidos": inspectionData.itensConcluidos,

        "vistoria.equipamentosAvaliados": inspectionData.equipamentosAvaliados,

        "vistoria.naoConformidades": inspectionData.naoConformidades,

        "vistoria.pendenciasCriticas": inspectionData.pendenciasCriticas,

        "vistoria.quantidadeFotos": inspectionData.quantidadeFotos,

        "vistoria.concluidaEm": serverTimestamp(),

        vistoriaId: inspectionReference.id,

        codigoVistoria: code,

        atualizadoEm: serverTimestamp(),

        statusAtualizadoEm: serverTimestamp(),
      });
    }

    return {
      id: inspectionReference.id,

      numero: nextNumber,

      codigo: code,

      condominio: inspectionData.condominio,

      cliente: inspectionData.cliente,

      totalItens: inspectionData.totalItens,

      naoConformidades: inspectionData.naoConformidades,

      status: inspectionData.status,

      ordemId: inspectionData.ordemId,

      codigoOS: inspectionData.codigoOS,
    };
  });
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!selectedCondominium?.id) {
    showFeedback("Selecione o condomínio da vistoria.", "error");

    condominiumSelect.focus();

    return;
  }

  if (!selectedResponsible?.uid) {
    showFeedback("Selecione o responsável vinculado.", "error");

    responsibleSelect.focus();

    return;
  }

  if (checklistItems.length === 0) {
    showFeedback(
      "O condomínio não possui equipamentos para a vistoria.",
      "error",
    );

    return;
  }

  const pendingItemIndex = checklistItems.findIndex((item) => !item.resultado);

  if (pendingItemIndex >= 0) {
    showFeedback("Avalie todos os equipamentos antes de salvar.", "error");

    const pendingCard = checklistList.querySelector(
      `.inspection-checklist-item[data-index="${pendingItemIndex}"]`,
    );

    pendingCard?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return;
  }

  const missingObservationIndex = checklistItems.findIndex(
    (item) =>
      item.resultado === "precisa-ajuste" &&
      !String(item.observacao || "").trim(),
  );

  if (missingObservationIndex >= 0) {
    showFeedback(
      "Descreva o ajuste necessário no equipamento indicado.",
      "error",
    );

    const observation = checklistList.querySelector(
      `textarea[data-index="${missingObservationIndex}"]`,
    );

    observation?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    observation?.focus();

    return;
  }

  const originalButtonText = saveInspectionButton.textContent;

  saveInspectionButton.disabled = true;

  saveInspectionButton.textContent = "Salvando vistoria...";

  try {
    const savedInspection = await saveInspectionInFirestore();

    console.log("[Nova Vistoria] Vistoria salva:", savedInspection);

    saveInspectionButton.textContent = `${savedInspection.codigo} salva`;

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.disabled = true;
    });

    if (currentLinkedOrder?.id) {
      showFeedback(
        `${savedInspection.codigo} criada e vinculada à ${currentLinkedOrder.codigo}!`,
      );

      window.setTimeout(() => {
        window.location.href = `detalhes-solicitacao.html?id=${encodeURIComponent(
          currentLinkedOrder.id,
        )}`;
      }, 900);

      return;
    }

    showFeedback(`${savedInspection.codigo} criada e validada com sucesso!`);

    if (inspectionOriginFromURL === "condominio" && condominiumIdFromURL) {
      window.setTimeout(() => {
        window.location.href = "condominios.html?perfil=admin";
      }, 900);

      return;
    }
  } catch (error) {
    console.error("[Nova Vistoria] Não foi possível salvar:", error);

    saveInspectionButton.disabled = false;

    saveInspectionButton.textContent = originalButtonText;

    if (error.message === "INVALID_INSPECTION_COUNTER") {
      showFeedback(
        "O contador das vistorias possui um valor inválido.",
        "error",
      );

      return;
    }

    if (error.message === "ORDER_NOT_FOUND") {
      showFeedback("A Ordem de Serviço vinculada não foi encontrada.", "error");

      return;
    }

    if (error.message === "ORDER_ALREADY_HAS_INSPECTION") {
      showFeedback(
        "Esta Ordem de Serviço já possui uma vistoria vinculada.",
        "error",
      );

      return;
    }

    if (error.message === "ORDER_NOT_SCHEDULED") {
      showFeedback(
        "A vistoria só pode ser executada enquanto a OS estiver agendada.",
        "error",
      );

      return;
    }

    if (error.code === "permission-denied") {
      showFeedback("O Firebase bloqueou a gravação da vistoria.", "error");

      return;
    }

    if (error.code === "unavailable") {
      showFeedback(
        "Não foi possível acessar o Firebase. Verifique sua conexão.",
        "error",
      );

      return;
    }

    showFeedback("Não foi possível salvar a vistoria.", "error");
  }
}

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function initializePage() {
  try {
    const session = await window.salvateckSessionReady;

    if (!session || session.role !== "admin") {
      throw new Error("ADMIN_SESSION_REQUIRED");
    }

    currentSession = session;

    if (inspectionIdFromURL && inspectionPageMode === "consulta") {
      await loadExistingInspection(inspectionIdFromURL);

      console.log("[Nova Vistoria] Vistoria existente carregada:", {
        vistoriaId: inspectionIdFromURL,

        uid: currentSession.uid,

        role: currentSession.role,
      });

      return;
    }

    if (orderIdFromURL && inspectionPageMode === "execucao") {
      await loadOrderForExecution(orderIdFromURL);

      console.log("[Nova Vistoria] Ordem carregada para execução:", {
        ordemId: orderIdFromURL,

        codigoOS: currentLinkedOrder?.codigo || "",

        uid: currentSession.uid,
      });

      return;
    }

    resetResponsibleSelection();

    resetChecklist();

    updatePageState();

    await loadCondominiums();

    if (condominiumIdFromURL) {
      const condominiumExists = availableCondominiums.some(
        (condominium) => condominium.id === condominiumIdFromURL,
      );

      if (!condominiumExists) {
        throw new Error("CONDOMINIUM_NOT_FOUND");
      }

      condominiumSelect.value = condominiumIdFromURL;

      await handleCondominiumChange();

      if (inspectionOriginFromURL === "condominio") {
        const backLink = document.getElementById("inspection-back-link");

        const cancelLink = form.querySelector(".inspection-cancel-button");

        if (backLink) {
          backLink.href = "condominios.html?perfil=admin";
        }

        if (cancelLink) {
          cancelLink.href = "condominios.html?perfil=admin";

          cancelLink.textContent = "Voltar para condomínios";
        }
      }
    }

    console.log("[Nova Vistoria] Sessão administrativa carregada:", {
      uid: currentSession.uid,

      role: currentSession.role,

      nome: currentSession.profile?.nome || "",
    });
  } catch (error) {
    console.error("[Nova Vistoria] Não foi possível iniciar a página:", error);

    if (error.message === "INSPECTION_NOT_FOUND") {
      showFeedback("A vistoria selecionada não foi encontrada.", "error");

      return;
    }

    if (error.message === "ORDER_NOT_FOUND") {
      showFeedback("A Ordem de Serviço não foi encontrada.", "error");

      return;
    }

    if (error.message === "ORDER_NOT_INSPECTION") {
      showFeedback("Esta Ordem de Serviço não é do tipo vistoria.", "error");

      return;
    }

    if (error.message === "ORDER_NOT_SCHEDULED") {
      showFeedback(
        "A vistoria só pode ser iniciada depois do agendamento da OS.",
        "error",
      );

      return;
    }

    if (error.message === "ORDER_ALREADY_HAS_INSPECTION") {
      showFeedback(
        "Esta Ordem de Serviço já possui uma vistoria vinculada.",
        "error",
      );

      return;
    }

    if (error.message === "ORDER_WITHOUT_CONDOMINIUM") {
      showFeedback(
        "A Ordem de Serviço não possui condomínio vinculado.",
        "error",
      );

      return;
    }

    if (error.message === "CONDOMINIUM_NOT_FOUND") {
      showFeedback("O condomínio selecionado não foi encontrado.", "error");

      return;
    }

    if (error.message === "ORDER_WITHOUT_RESPONSIBLE") {
      showFeedback("A OS não possui um responsável vinculado.", "error");

      return;
    }

    showFeedback("Não foi possível carregar a área administrativa.", "error");
  }
}

/* =========================================
   EVENTOS
========================================= */

form.addEventListener("submit", handleSubmit);

condominiumSelect.addEventListener("change", handleCondominiumChange);

responsibleSelect.addEventListener("change", handleResponsibleChange);

checklistList.addEventListener("change", handleChecklistChange);

checklistList.addEventListener("input", handleChecklistObservation);

initializePage();
