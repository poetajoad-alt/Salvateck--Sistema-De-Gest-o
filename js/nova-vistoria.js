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

const exportInspectionPdfButton = document.getElementById(
  "btnExportarPdfVistoria",
);

const inspectionPdfModal = document.getElementById("inspection-pdf-modal");

const confirmInspectionPdfButton = document.getElementById(
  "confirm-inspection-pdf-button",
);

const closeInspectionPdfModalButtons = document.querySelectorAll(
  "[data-close-inspection-pdf-modal]",
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

let currentInspectionDocument = null;

let generatingInspectionPdf = false;

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

function getInspectionCommunicationCondominiumName(
  condominium = selectedCondominium,
) {
  const name = String(condominium?.nome || "").trim();

  if (!name) {
    return "Condomínio não informado";
  }

  return /^condom[ií]nio\b/i.test(name) ? name : `Condomínio ${name}`;
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
function normalizeCondominiumStructureEquipment(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const equipmentId = String(
    value.equipamentoId || value.equipmentId || value.id || value.codigo || "",
  ).trim();

  if (!equipmentId) {
    return null;
  }

  const legacyCatalogItem = equipmentCatalog[equipmentId];

  return {
    equipamentoId: equipmentId,

    equipamentoNome: String(
      value.equipamentoNome ||
        value.nome ||
        legacyCatalogItem?.nome ||
        equipmentId,
    ).trim(),

    categoria: String(
      value.categoria || legacyCatalogItem?.categoria || "Outros equipamentos",
    ).trim(),

    quantidade: Math.max(1, Number(value.quantidade) || 1),

    observacao: String(
      value.observacao || value.localizacao || value.notas || "",
    ).trim(),
  };
}

function normalizeCondominiumStructureEnvironment(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const environmentId = String(
    value.ambienteId || value.environmentId || value.id || value.codigo || "",
  ).trim();

  if (!environmentId) {
    return null;
  }

  const legacy =
    Boolean(value.legado) || environmentId === "sem-ambiente-definido";

  const equipment = Array.isArray(value.equipamentos)
    ? value.equipamentos
        .map(normalizeCondominiumStructureEquipment)
        .filter(Boolean)
    : [];

  return {
    ambienteId: environmentId,

    ambienteNome: String(
      value.ambienteNome ||
        value.nome ||
        (legacy ? "Sem ambiente definido" : environmentId),
    ).trim(),

    categoria: String(
      value.categoria || (legacy ? "Cadastro anterior" : "Outros ambientes"),
    ).trim(),

    observacao: String(
      value.observacao || value.observacoes || value.notas || "",
    ).trim(),

    legado: legacy,

    equipamentos: equipment,
  };
}

function normalizeCondominiumStructure(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeCondominiumStructureEnvironment).filter(Boolean);
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

    estruturaAmbientes: normalizeCondominiumStructure(
      data.estruturaAmbientes || data.ambientesEquipamentos || [],
    ),
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
      status.textContent = needsAdjustment
        ? "Precisa de ajuste"
        : item.resultado === "ok"
          ? "OK"
          : "Pendente";
    }

    if (observationGroup) {
      observationGroup.hidden = !needsAdjustment;
    }

    if (observation) {
      observation.value = String(item.observacao || "").trim();
    }
  });

  updateAllEnvironmentChecklistStatuses();
}

async function loadExistingInspection(inspectionId) {
  const inspectionSnapshot = await getDoc(doc(db, "vistorias", inspectionId));

  if (!inspectionSnapshot.exists()) {
    throw new Error("INSPECTION_NOT_FOUND");
  }

  const inspection = inspectionSnapshot.data();

  currentInspectionDocument = {
    ...inspection,

    id: inspectionSnapshot.id,
  };

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
        ambienteId: String(item.ambienteId || "sem-ambiente-definido").trim(),

        ambienteNome: String(
          item.ambienteNome || "Sem ambiente definido",
        ).trim(),

        categoriaAmbiente: String(
          item.categoriaAmbiente || "Cadastro anterior",
        ).trim(),

        equipamentoId: String(item.equipamentoId || "").trim(),

        nome: String(item.nome || "").trim() || "Equipamento sem nome",

        categoria: String(item.categoria || "").trim() || "Outros equipamentos",

        quantidade: Math.max(1, Number(item.quantidade) || 1),

        localizacao: String(item.localizacao || "").trim(),

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

  const linkedOrderId = String(
    inspection.ordemId || inspection.origem?.ordemId || "",
  ).trim();

  const hasLinkedOrder = inspection.ordemVinculada === true;

  saveInspectionButton.type = "button";

  saveInspectionButton.textContent = inspection.codigo || "Vistoria validada";

  saveInspectionButton.onclick = null;

  if (hasLinkedOrder && linkedOrderId) {
    saveInspectionButton.disabled = false;

    saveInspectionButton.onclick = () => {
      window.location.href = `detalhes-solicitacao.html?id=${encodeURIComponent(
        linkedOrderId,
      )}`;
    };
  } else if (hasLinkedOrder) {
    saveInspectionButton.disabled = true;

    saveInspectionButton.textContent = "OS vinculada não identificada";
  } else {
    saveInspectionButton.disabled = false;

    saveInspectionButton.onclick = () => {
      const parameters = new URLSearchParams({
        perfil: "admin",
        tipo: "vistoria",
        origem: "vistoria",
        vistoria: inspectionSnapshot.id,
      });

      if (selectedCondominium.id) {
        parameters.set("condominio", selectedCondominium.id);
      }

      if (selectedResponsible.uid) {
        parameters.set("cliente", selectedResponsible.uid);
      }

      window.location.href = `nova-ordem.html?${parameters.toString()}`;
    };
  }

  if (exportInspectionPdfButton) {
    exportInspectionPdfButton.hidden = false;
  }

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

function groupChecklistItemsByEnvironment() {
  const environments = new Map();

  checklistItems.forEach((item, index) => {
    const environmentId =
      String(item.ambienteId || "sem-ambiente-definido").trim() ||
      "sem-ambiente-definido";

    if (!environments.has(environmentId)) {
      environments.set(environmentId, {
        ambienteId: environmentId,

        ambienteNome:
          String(item.ambienteNome || "Sem ambiente definido").trim() ||
          "Sem ambiente definido",

        categoriaAmbiente:
          String(item.categoriaAmbiente || "Outros ambientes").trim() ||
          "Outros ambientes",

        itens: [],
      });
    }

    environments.get(environmentId).itens.push({
      item,

      index,
    });
  });

  return Array.from(environments.values());
}

function updateEnvironmentChecklistStatus(environmentCard) {
  if (!environmentCard) {
    return;
  }

  const itemCards = Array.from(
    environmentCard.querySelectorAll(".inspection-checklist-item[data-index]"),
  );

  const items = itemCards
    .map((card) => checklistItems[Number(card.dataset.index)])
    .filter(Boolean);

  const totalItems = items.length;

  const evaluatedItems = items.filter((item) => Boolean(item.resultado)).length;

  const adjustmentItems = items.filter(
    (item) => item.resultado === "precisa-ajuste",
  ).length;

  const pendingObservations = items.filter(
    (item) =>
      item.resultado === "precisa-ajuste" &&
      !String(item.observacao || "").trim(),
  ).length;

  const status = environmentCard.querySelector(
    ".inspection-environment-card__status",
  );

  environmentCard.classList.remove("is-ok", "needs-adjustment", "is-pending");

  if (pendingObservations > 0) {
    environmentCard.classList.add("is-pending");

    if (status) {
      status.textContent = "Observação pendente";
    }

    return;
  }

  if (evaluatedItems < totalItems) {
    environmentCard.classList.add("is-pending");

    if (status) {
      status.textContent =
        evaluatedItems === 0
          ? "Pendente"
          : `${evaluatedItems} de ${totalItems}`;
    }

    return;
  }

  if (adjustmentItems > 0) {
    environmentCard.classList.add("needs-adjustment");

    if (status) {
      status.textContent =
        adjustmentItems === 1
          ? "1 com ajuste"
          : `${adjustmentItems} com ajuste`;
    }

    return;
  }

  environmentCard.classList.add("is-ok");

  if (status) {
    status.textContent = "Tudo OK";
  }
}

function updateAllEnvironmentChecklistStatuses() {
  checklistList
    .querySelectorAll(".inspection-environment-card")
    .forEach((environmentCard) => {
      updateEnvironmentChecklistStatus(environmentCard);
    });
}

function renderChecklist() {
  checklistList.innerHTML = "";

  if (checklistItems.length === 0) {
    resetChecklist(
      "Este condomínio ainda não possui equipamentos cadastrados para a vistoria.",
    );

    return;
  }

  const environments = groupChecklistItemsByEnvironment();

  environments.forEach((environment, environmentIndex) => {
    const environmentCard = document.createElement("article");

    environmentCard.className = "inspection-environment-card is-pending";

    environmentCard.dataset.environmentId = environment.ambienteId;

    const environmentHeading = document.createElement("div");

    environmentHeading.className = "inspection-environment-card__heading";

    const environmentIdentification = document.createElement("div");

    environmentIdentification.className =
      "inspection-environment-card__identification";

    const totalUnits = environment.itens.reduce(
      (total, { item }) => total + Math.max(1, Number(item.quantidade) || 1),
      0,
    );

    const environmentMeta = document.createElement("span");

    environmentMeta.className = "inspection-environment-card__meta";

    environmentMeta.textContent = [
      environment.categoriaAmbiente,
      environment.itens.length === 1
        ? "1 equipamento"
        : `${environment.itens.length} equipamentos`,
      totalUnits === 1 ? "1 unidade" : `${totalUnits} unidades`,
    ]
      .filter(Boolean)
      .join(" • ");

    const environmentTitle = document.createElement("strong");

    environmentTitle.className = "inspection-environment-card__title";

    environmentTitle.textContent = environment.ambienteNome;

    environmentIdentification.append(environmentMeta, environmentTitle);

    const environmentActions = document.createElement("div");

    environmentActions.className = "inspection-environment-card__actions";

    const environmentStatus = document.createElement("small");

    environmentStatus.className = "inspection-environment-card__status";

    environmentStatus.textContent = "Pendente";

    const environmentToggle = document.createElement("button");

    environmentToggle.type = "button";

    environmentToggle.className = "inspection-environment-card__toggle";

    environmentToggle.setAttribute("aria-expanded", "false");

    environmentToggle.setAttribute(
      "aria-label",
      `Abrir ambiente ${environment.ambienteNome}`,
    );

    const environmentBodyId = `inspection-environment-${environmentIndex}`;

    environmentToggle.setAttribute("aria-controls", environmentBodyId);

    environmentToggle.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 6 6 6-6"></path>
      </svg>
    `;

    environmentActions.append(environmentStatus, environmentToggle);

    environmentHeading.append(environmentIdentification, environmentActions);

    const environmentBody = document.createElement("div");

    environmentBody.className = "inspection-environment-card__body";

    environmentBody.id = environmentBodyId;

    environmentBody.hidden = true;

    environment.itens.forEach(({ item, index }) => {
      const card = document.createElement("article");

      card.className = "inspection-checklist-item";

      card.dataset.index = String(index);

      const heading = document.createElement("div");

      heading.className = "inspection-checklist-item__heading";

      const identification = document.createElement("div");

      const category = document.createElement("span");

      category.textContent = [
        item.categoria,
        `Quantidade: ${Math.max(1, Number(item.quantidade) || 1)}`,
      ]
        .filter(Boolean)
        .join(" • ");

      const title = document.createElement("strong");

      title.textContent = item.nome;

      identification.append(category, title);

      if (item.localizacao) {
        const location = document.createElement("p");

        location.className = "inspection-checklist-item__location";

        location.textContent = `Localização: ${item.localizacao}`;

        identification.appendChild(location);
      }

      const headingActions = document.createElement("div");

      headingActions.className = "inspection-checklist-item__heading-actions";

      const status = document.createElement("small");

      status.className = "inspection-checklist-item__status";

      status.textContent = "Pendente";

      headingActions.appendChild(status);

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
        "Ex.: 2 dos 3 equipamentos estão danificados, vencidos ou não funcionaram durante o teste.";

      observation.dataset.checklistObservation = "true";

      observation.dataset.index = String(index);

      observationGroup.append(observationLabel, observation);

      const details = document.createElement("div");

      details.className = "inspection-checklist-item__details";

      details.append(options, observationGroup);

      card.append(heading, details);

      environmentBody.appendChild(card);
    });

    environmentToggle.addEventListener("click", () => {
      const willOpen = environmentBody.hidden;

      checklistList
        .querySelectorAll(".inspection-environment-card__body")
        .forEach((otherBody) => {
          if (otherBody === environmentBody) {
            return;
          }

          otherBody.hidden = true;

          const otherCard = otherBody.closest(".inspection-environment-card");

          const otherToggle = otherCard?.querySelector(
            ".inspection-environment-card__toggle",
          );

          if (otherToggle) {
            otherToggle.classList.remove("is-open");

            otherToggle.setAttribute("aria-expanded", "false");
          }
        });

      environmentBody.hidden = !willOpen;

      environmentToggle.classList.toggle("is-open", willOpen);

      environmentToggle.setAttribute("aria-expanded", String(willOpen));

      environmentToggle.setAttribute(
        "aria-label",
        `${willOpen ? "Fechar" : "Abrir"} ambiente ${environment.ambienteNome}`,
      );
    });

    environmentCard.append(environmentHeading, environmentBody);

    checklistList.appendChild(environmentCard);
  });

  checklistEmpty.hidden = true;

  checklistList.hidden = false;

  updateAllEnvironmentChecklistStatuses();

  updateInspectionSummary();

  updateProgress();
}

function loadChecklistFromCondominium() {
  const structure = Array.isArray(selectedCondominium?.estruturaAmbientes)
    ? selectedCondominium.estruturaAmbientes
    : [];

  if (structure.length > 0) {
    checklistItems = structure.flatMap((environment) => {
      const equipment = Array.isArray(environment.equipamentos)
        ? environment.equipamentos
        : [];

      return equipment.map((item) => ({
        ambienteId: environment.ambienteId || "",

        ambienteNome: environment.ambienteNome || "Sem ambiente definido",

        categoriaAmbiente: environment.categoria || "Outros ambientes",

        equipamentoId: item.equipamentoId || "",

        nome:
          item.equipamentoNome || item.equipamentoId || "Equipamento sem nome",

        categoria: item.categoria || "Outros equipamentos",

        quantidade: Math.max(1, Number(item.quantidade) || 1),

        localizacao: String(item.observacao || "").trim(),

        resultado: "",

        observacao: "",
      }));
    });

    renderChecklist();

    return;
  }

  const equipmentIds = Array.isArray(selectedCondominium?.equipamentos)
    ? selectedCondominium.equipamentos
    : [];

  checklistItems = equipmentIds.map((equipmentId) => {
    const normalizedId = String(equipmentId || "").trim();

    const catalogItem = equipmentCatalog[normalizedId];

    return {
      ambienteId: "sem-ambiente-definido",

      ambienteNome: "Sem ambiente definido",

      categoriaAmbiente: "Cadastro anterior",

      equipamentoId: normalizedId,

      nome: catalogItem?.nome || normalizedId || "Equipamento sem nome",

      categoria: catalogItem?.categoria || "Outros equipamentos",

      quantidade: 1,

      localizacao: "",

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

  updateEnvironmentChecklistStatus(
    card.closest(".inspection-environment-card"),
  );

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

  const card = field.closest(".inspection-checklist-item");

  updateEnvironmentChecklistStatus(
    card?.closest(".inspection-environment-card"),
  );

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

    estruturaAmbientesSnapshot: normalizeCondominiumStructure(
      selectedCondominium.estruturaAmbientes,
    ).map((environment) => ({
      ambienteId: environment.ambienteId,

      ambienteNome: environment.ambienteNome,

      categoria: environment.categoria,

      observacao: environment.observacao,

      legado: environment.legado,

      equipamentos: environment.equipamentos.map((item) => ({
        equipamentoId: item.equipamentoId,

        equipamentoNome: item.equipamentoNome,

        categoria: item.categoria,

        quantidade: item.quantidade,

        observacao: item.observacao,
      })),
    })),

    checklist: checklistItems.map((item) => ({
      ambienteId: item.ambienteId || "",

      ambienteNome: item.ambienteNome || "",

      categoriaAmbiente: item.categoriaAmbiente || "",

      equipamentoId: item.equipamentoId || "",

      nome: item.nome || "",

      categoria: item.categoria || "",

      quantidade: Math.max(1, Number(item.quantidade) || 1),

      localizacao: String(item.localizacao || "").trim(),

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

    showFeedback(
      `${savedInspection.codigo} criada e validada! Abrindo a vistoria...`,
    );

    window.setTimeout(() => {
      const parameters = new URLSearchParams({
        vistoria: savedInspection.id,
        modo: "consulta",
      });

      window.location.href = `nova-vistoria.html?${parameters.toString()}`;
    }, 900);

    return;
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
   PDF DA VISTORIA
========================================= */

const INSPECTION_PDF_COLORS = {
  navy: [13, 56, 97],
  gold: [221, 154, 23],
  green: [36, 139, 88],
  dark: [43, 47, 51],
  gray: [98, 106, 113],
  lightGray: [243, 246, 248],
  border: [217, 224, 228],
  white: [249, 249, 249],
  paleGreen: [239, 248, 243],
  paleGold: [255, 248, 231],
};

function sanitizeInspectionPdfText(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\uFEFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .trim();
}

function formatInspectionPdfDate(value) {
  if (!value) {
    return "Não informada";
  }

  let date = value;

  if (typeof value.toDate === "function") {
    date = value.toDate();
  } else if (!(value instanceof Date)) {
    date = new Date(value);
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "Não informada";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getInspectionPdfFileName() {
  const code = sanitizeInspectionPdfText(
    currentInspectionDocument?.codigo || "VST",
  );

  return `Salvateck-${code}-vistoria-tecnica.pdf`;
}

function drawInspectionPdfHeader(pdf, code, compact = false) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  const headerHeight = compact ? 22 : 34;

  pdf.setFillColor(...INSPECTION_PDF_COLORS.navy);

  pdf.rect(0, 0, pageWidth, headerHeight, "F");

  pdf.setFillColor(...INSPECTION_PDF_COLORS.gold);

  pdf.rect(0, headerHeight, pageWidth, 2, "F");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.white);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(compact ? 13 : 18);

  pdf.text("SALVATECK", 16, compact ? 12 : 14);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(compact ? 8 : 10);

  pdf.text(
    compact ? "Relatório de Vistoria Técnica" : "RELATÓRIO DE VISTORIA TÉCNICA",
    16,
    compact ? 17 : 22,
  );

  pdf.setFillColor(...INSPECTION_PDF_COLORS.gold);

  pdf.roundedRect(pageWidth - 52, compact ? 6 : 10, 36, 11, 3, 3, "F");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.navy);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(9);

  pdf.text(code, pageWidth - 34, compact ? 13 : 17, {
    align: "center",
  });

  return headerHeight + 10;
}

function ensureInspectionPdfSpace(pdf, y, requiredHeight, code) {
  if (y + requiredHeight <= 278) {
    return y;
  }

  pdf.addPage();

  return drawInspectionPdfHeader(pdf, code, true);
}

function addInspectionPdfSectionTitle(pdf, y, title, code) {
  y = ensureInspectionPdfSpace(pdf, y, 14, code);

  pdf.setFillColor(...INSPECTION_PDF_COLORS.gold);

  pdf.roundedRect(16, y, 4, 8, 1, 1, "F");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.navy);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(10);

  pdf.text(sanitizeInspectionPdfText(title).toUpperCase(), 24, y + 6);

  return y + 14;
}

function addInspectionPdfInfoPair(pdf, y, leftItem, rightItem, code) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  const contentWidth = pageWidth - 32;

  const columnGap = 8;

  const columnWidth = (contentWidth - columnGap) / 2;

  const leftValue = sanitizeInspectionPdfText(
    leftItem.value || "Não informado",
  );

  const rightValue = sanitizeInspectionPdfText(
    rightItem.value || "Não informado",
  );

  const leftLines = pdf.splitTextToSize(leftValue, columnWidth);

  const rightLines = pdf.splitTextToSize(rightValue, columnWidth);

  const maximumLines = Math.max(leftLines.length, rightLines.length);

  const blockHeight = 13 + maximumLines * 4.3;

  y = ensureInspectionPdfSpace(pdf, y, blockHeight, code);

  pdf.setTextColor(...INSPECTION_PDF_COLORS.gray);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7);

  pdf.text(sanitizeInspectionPdfText(leftItem.label).toUpperCase(), 16, y + 4);

  pdf.text(
    sanitizeInspectionPdfText(rightItem.label).toUpperCase(),
    16 + columnWidth + columnGap,
    y + 4,
  );

  pdf.setTextColor(...INSPECTION_PDF_COLORS.dark);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(9);

  pdf.text(leftLines, 16, y + 10);

  pdf.text(rightLines, 16 + columnWidth + columnGap, y + 10);

  return y + blockHeight;
}

function addInspectionPdfTextBlock(pdf, y, label, value, code) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  const contentWidth = pageWidth - 32;

  const finalValue = sanitizeInspectionPdfText(value || "Não informado");

  const lines = pdf.splitTextToSize(finalValue, contentWidth - 12);

  const blockHeight = 15 + lines.length * 4.4;

  y = ensureInspectionPdfSpace(pdf, y, blockHeight, code);

  pdf.setFillColor(...INSPECTION_PDF_COLORS.lightGray);

  pdf.roundedRect(16, y, contentWidth, blockHeight, 3, 3, "F");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.gray);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7);

  pdf.text(sanitizeInspectionPdfText(label).toUpperCase(), 22, y + 6);

  pdf.setTextColor(...INSPECTION_PDF_COLORS.dark);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(9);

  pdf.text(lines, 22, y + 12);

  return y + blockHeight + 5;
}

function isLegacyInspectionPdfItem(item = {}) {
  const environmentId = String(item.ambienteId || "").trim();

  const environmentCategory = normalizeInspectionText(item.categoriaAmbiente);

  return (
    !environmentId ||
    environmentId === "sem-ambiente-definido" ||
    environmentCategory === "cadastro anterior"
  );
}

function buildInspectionPdfChecklistBlocks(checklist = []) {
  const blocks = [];

  const environmentBlocks = new Map();

  checklist.forEach((item, index) => {
    if (isLegacyInspectionPdfItem(item)) {
      blocks.push({
        tipo: "equipamento",

        item,

        index,
      });

      return;
    }

    const environmentId = String(item.ambienteId || "").trim();

    if (!environmentBlocks.has(environmentId)) {
      const block = {
        tipo: "ambiente",

        ambiente: {
          ambienteId: environmentId,

          ambienteNome:
            String(item.ambienteNome || "Ambiente").trim() || "Ambiente",

          categoriaAmbiente:
            String(item.categoriaAmbiente || "Outros ambientes").trim() ||
            "Outros ambientes",

          itens: [],
        },
      };

      environmentBlocks.set(environmentId, block);

      blocks.push(block);
    }

    environmentBlocks.get(environmentId).ambiente.itens.push({
      item,

      index,
    });
  });

  return blocks;
}

function addInspectionPdfEnvironmentHeader(pdf, y, environment, code) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  const contentWidth = pageWidth - 32;

  const items = Array.isArray(environment.itens) ? environment.itens : [];

  const totalUnits = items.reduce(
    (total, { item }) => total + Math.max(1, Number(item.quantidade) || 1),
    0,
  );

  const adjustmentItems = items.filter(
    ({ item }) => item.resultado === "precisa-ajuste",
  ).length;

  const environmentName = sanitizeInspectionPdfText(
    environment.ambienteNome || "Sem ambiente definido",
  );

  const environmentMeta = sanitizeInspectionPdfText(
    [
      environment.categoriaAmbiente || "Outros ambientes",

      items.length === 1 ? "1 equipamento" : `${items.length} equipamentos`,

      totalUnits === 1 ? "1 unidade" : `${totalUnits} unidades`,
    ].join(" | "),
  );

  const statusText =
    adjustmentItems === 0
      ? "TUDO OK"
      : adjustmentItems === 1
        ? "1 COM AJUSTE"
        : `${adjustmentItems} COM AJUSTE`;

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7);

  const metaLines = pdf.splitTextToSize(environmentMeta, contentWidth - 58);

  pdf.setFontSize(11);

  const nameLines = pdf.splitTextToSize(environmentName, contentWidth - 58);

  const metaHeight = Math.max(1, metaLines.length) * 3.5;

  const nameHeight = Math.max(1, nameLines.length) * 4.8;

  const blockHeight = Math.max(23, 12 + metaHeight + nameHeight);

  y = ensureInspectionPdfSpace(pdf, y, blockHeight + 6, code);

  pdf.setFillColor(...INSPECTION_PDF_COLORS.navy);

  pdf.setDrawColor(...INSPECTION_PDF_COLORS.border);

  pdf.setLineWidth(0.35);

  pdf.roundedRect(16, y, contentWidth, blockHeight, 3, 3, "FD");

  pdf.setFillColor(
    ...(adjustmentItems > 0
      ? INSPECTION_PDF_COLORS.gold
      : INSPECTION_PDF_COLORS.green),
  );

  pdf.roundedRect(16, y, 4, blockHeight, 1, 1, "F");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.white);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7);

  pdf.text(metaLines, 24, y + 7);

  pdf.setFontSize(11);

  pdf.text(nameLines, 24, y + 12 + metaHeight);

  pdf.setFillColor(
    ...(adjustmentItems > 0
      ? INSPECTION_PDF_COLORS.gold
      : INSPECTION_PDF_COLORS.green),
  );

  pdf.roundedRect(pageWidth - 59, y + 6, 37, 9, 2, 2, "F");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.white);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(adjustmentItems > 0 ? 5.8 : 6.5);

  pdf.text(statusText, pageWidth - 40.5, y + 11.8, {
    align: "center",
  });

  return y + blockHeight + 5;
}

function addInspectionPdfChecklistItem(
  pdf,
  y,
  item,
  index,
  code,
  environment = null,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  const contentWidth = pageWidth - 32;

  const textWidth = contentWidth - 24;

  const needsAdjustment = item.resultado === "precisa-ajuste";

  const statusText = needsAdjustment ? "PRECISA DE AJUSTE" : "OK";

  const quantity = Math.max(1, Number(item.quantidade) || 1);

  const name = sanitizeInspectionPdfText(
    `${index + 1}. ${item.nome || "Equipamento"}`,
  );

  const equipmentMeta = sanitizeInspectionPdfText(
    `${item.categoria || "Outros equipamentos"} | Quantidade: ${quantity}`,
  );

  const location = sanitizeInspectionPdfText(item.localizacao || "");

  const observation = sanitizeInspectionPdfText(item.observacao || "");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7);

  const metaLines = pdf.splitTextToSize(equipmentMeta, contentWidth - 54);

  pdf.setFontSize(9);

  const nameLines = pdf.splitTextToSize(name, contentWidth - 54);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(8.5);

  const locationLines = location
    ? location
        .split("\n")
        .flatMap((paragraph) =>
          pdf.splitTextToSize(paragraph.trim(), textWidth),
        )
        .filter((line) => String(line || "").trim())
    : [];

  const observationLines = observation
    ? observation
        .split("\n")
        .flatMap((paragraph) =>
          pdf.splitTextToSize(paragraph.trim(), textWidth),
        )
        .filter((line) => String(line || "").trim())
    : [];

  const metaHeight = Math.max(1, metaLines.length) * 3.5;

  const nameHeight = Math.max(1, nameLines.length) * 4.4;

  const locationHeight =
    locationLines.length > 0 ? 8 + locationLines.length * 4.2 : 0;

  const observationHeight =
    observationLines.length > 0 ? 8 + observationLines.length * 4.2 : 0;

  const blockHeight =
    14 + metaHeight + nameHeight + locationHeight + observationHeight;

  if (y + blockHeight + 5 > 278) {
    pdf.addPage();

    y = drawInspectionPdfHeader(pdf, code, true);

    if (environment) {
      y = addInspectionPdfEnvironmentHeader(pdf, y, environment, code);
    }
  }

  pdf.setFillColor(
    ...(needsAdjustment
      ? INSPECTION_PDF_COLORS.paleGold
      : INSPECTION_PDF_COLORS.paleGreen),
  );

  pdf.setDrawColor(
    ...(needsAdjustment
      ? INSPECTION_PDF_COLORS.gold
      : INSPECTION_PDF_COLORS.green),
  );

  pdf.setLineWidth(0.35);

  pdf.roundedRect(16, y, contentWidth, blockHeight, 3, 3, "FD");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.gray);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7);

  pdf.text(metaLines, 22, y + 6);

  const nameY = y + 8 + metaHeight;

  pdf.setTextColor(...INSPECTION_PDF_COLORS.navy);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(9);

  pdf.text(nameLines, 22, nameY);

  pdf.setFillColor(
    ...(needsAdjustment
      ? INSPECTION_PDF_COLORS.gold
      : INSPECTION_PDF_COLORS.green),
  );

  pdf.roundedRect(pageWidth - 57, y + 5, 35, 8, 2, 2, "F");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.white);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(needsAdjustment ? 6.2 : 7);

  pdf.text(statusText, pageWidth - 39.5, y + 10.3, {
    align: "center",
  });

  let contentY = nameY + nameHeight + 1;

  if (locationLines.length > 0) {
    pdf.setTextColor(...INSPECTION_PDF_COLORS.gray);

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(7);

    pdf.text("LOCALIZAÇÃO", 22, contentY + 3);

    pdf.setTextColor(...INSPECTION_PDF_COLORS.dark);

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(8.5);

    pdf.text(locationLines, 22, contentY + 8, {
      maxWidth: textWidth,
      lineHeightFactor: 1.15,
    });

    contentY += locationHeight;
  }

  if (observationLines.length > 0) {
    pdf.setTextColor(...INSPECTION_PDF_COLORS.gray);

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(7);

    pdf.text("OBSERVAÇÃO DO AJUSTE", 22, contentY + 3);

    pdf.setTextColor(...INSPECTION_PDF_COLORS.dark);

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(8.5);

    pdf.text(observationLines, 22, contentY + 8, {
      maxWidth: textWidth,
      lineHeightFactor: 1.15,
    });
  }

  return y + blockHeight + 5;
}

function addInspectionPdfFooters(pdf, code) {
  const pageCount = pdf.getNumberOfPages();

  const pageWidth = pdf.internal.pageSize.getWidth();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pdf.setPage(pageNumber);

    pdf.setDrawColor(...INSPECTION_PDF_COLORS.border);

    pdf.setLineWidth(0.3);

    pdf.line(16, 285, pageWidth - 16, 285);

    pdf.setTextColor(...INSPECTION_PDF_COLORS.gray);

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(6.5);

    pdf.text(
      "Documento de Vistoria - não substitui uma Ordem de Serviço.",
      16,
      290,
    );

    pdf.text(
      `${code} | Página ${pageNumber} de ${pageCount}`,
      pageWidth - 16,
      290,
      {
        align: "right",
      },
    );
  }
}

function createInspectionPdf() {
  const PdfConstructor = window.jspdf?.jsPDF;

  if (!PdfConstructor) {
    throw new Error("JSPDF_NOT_LOADED");
  }

  if (!currentInspectionDocument) {
    throw new Error("INSPECTION_DOCUMENT_NOT_FOUND");
  }

  const pdf = new PdfConstructor({
    orientation: "portrait",

    unit: "mm",

    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();

  const contentWidth = pageWidth - 32;

  const inspection = currentInspectionDocument;

  const code = sanitizeInspectionPdfText(inspection.codigo || "VST");

  const checklist = Array.isArray(inspection.checklist)
    ? inspection.checklist
    : [];

  const okayItems = checklist.filter((item) => item.resultado === "ok").length;

  const adjustmentItems = checklist.filter(
    (item) => item.resultado === "precisa-ajuste",
  ).length;

  let y = drawInspectionPdfHeader(pdf, code);

  const warningText =
    "Este relatório registra exclusivamente uma Vistoria Técnica. " +
    "Ele não representa, não substitui e não possui validade como Ordem de Serviço.";

  const warningLines = pdf.splitTextToSize(warningText, contentWidth - 12);

  const warningHeight = 12 + warningLines.length * 4.3;

  pdf.setFillColor(...INSPECTION_PDF_COLORS.paleGold);

  pdf.setDrawColor(...INSPECTION_PDF_COLORS.gold);

  pdf.roundedRect(16, y, contentWidth, warningHeight, 3, 3, "FD");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.navy);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(8.5);

  pdf.text(warningLines, 22, y + 8);

  y += warningHeight + 8;

  y = addInspectionPdfSectionTitle(pdf, y, "Identificação", code);

  y = addInspectionPdfInfoPair(
    pdf,
    y,
    {
      label: "Código da vistoria",
      value: code,
    },
    {
      label: "Situação",
      value:
        inspection.ordemVinculada === true
          ? `Vinculada à ${inspection.codigoOS || "OS"}`
          : "Validada - sem OS",
    },
    code,
  );

  y = addInspectionPdfInfoPair(
    pdf,
    y,
    {
      label: "Condomínio",
      value: [inspection.condominio?.codigo, inspection.condominio?.nome]
        .filter(Boolean)
        .join(" - "),
    },
    {
      label: "CNPJ",
      value: inspection.condominio?.cnpj || "Não informado",
    },
    code,
  );

  y = addInspectionPdfInfoPair(
    pdf,
    y,
    {
      label: "Responsável",
      value: inspection.cliente?.nome || "Não informado",
    },
    {
      label: "Contato",
      value: [inspection.cliente?.telefone, inspection.cliente?.email]
        .filter(Boolean)
        .join(" | "),
    },
    code,
  );

  y = addInspectionPdfInfoPair(
    pdf,
    y,
    {
      label: "Vistoria validada em",
      value: formatInspectionPdfDate(
        inspection.validadaEm || inspection.criadoEm,
      ),
    },
    {
      label: "Técnico",
      value:
        inspection.tecnico?.nome || inspection.criadoPorNome || "Não informado",
    },
    code,
  );

  y = addInspectionPdfTextBlock(
    pdf,
    y,
    "Endereço do condomínio",
    getCondominiumAddress(inspection.condominio || selectedCondominium),
    code,
  );

  y = addInspectionPdfSectionTitle(pdf, y, "Resumo técnico", code);

  y = addInspectionPdfInfoPair(
    pdf,
    y,
    {
      label: "Equipamentos avaliados",
      value: String(checklist.length),
    },
    {
      label: "Equipamentos OK",
      value: String(okayItems),
    },
    code,
  );

  y = addInspectionPdfInfoPair(
    pdf,
    y,
    {
      label: "Precisam de ajuste",
      value: String(adjustmentItems),
    },
    {
      label: "Progresso",
      value: "100% - vistoria concluída",
    },
    code,
  );

  const checklistBlocks = buildInspectionPdfChecklistBlocks(checklist);

  y = addInspectionPdfSectionTitle(pdf, y, "Checklist de equipamentos", code);

  if (checklist.length === 0) {
    y = addInspectionPdfTextBlock(
      pdf,
      y,
      "Checklist",
      "Nenhum equipamento foi registrado nesta vistoria.",
      code,
    );
  } else {
    checklistBlocks.forEach((block) => {
      if (block.tipo === "equipamento") {
        y = addInspectionPdfChecklistItem(
          pdf,
          y,
          block.item,
          block.index,
          code,
        );

        return;
      }

      const environment = block.ambiente;

      y = ensureInspectionPdfSpace(pdf, y, 58, code);

      y = addInspectionPdfEnvironmentHeader(pdf, y, environment, code);

      environment.itens.forEach(({ item, index }) => {
        y = addInspectionPdfChecklistItem(
          pdf,
          y,
          item,
          index,
          code,
          environment,
        );
      });
    });
  }

  y = ensureInspectionPdfSpace(pdf, y, 28, code);

  pdf.setFillColor(...INSPECTION_PDF_COLORS.navy);

  pdf.roundedRect(16, y, contentWidth, 23, 3, 3, "F");

  pdf.setTextColor(...INSPECTION_PDF_COLORS.white);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(8.5);

  const finalNotice = pdf.splitTextToSize(
    "Para gerar uma Ordem de Serviço a partir desta vistoria, utilize no sistema Salvateck o botão verde identificado pelo código da VST.",
    contentWidth - 12,
  );

  pdf.text(finalNotice, 22, y + 8);

  addInspectionPdfFooters(pdf, code);

  return pdf;
}

function openInspectionPdfModal() {
  if (!currentInspectionDocument || !inspectionPdfModal) {
    showFeedback("Não foi possível identificar a vistoria.", "error");

    return;
  }

  inspectionPdfModal.hidden = false;

  inspectionPdfModal.setAttribute("aria-hidden", "false");

  document.body.classList.add("inspection-pdf-modal-open");

  confirmInspectionPdfButton?.focus();
}

function closeInspectionPdfModal() {
  if (!inspectionPdfModal) {
    return;
  }

  inspectionPdfModal.hidden = true;

  inspectionPdfModal.setAttribute("aria-hidden", "true");

  document.body.classList.remove("inspection-pdf-modal-open");

  exportInspectionPdfButton?.focus();
}

function setInspectionPdfBusy(isBusy) {
  generatingInspectionPdf = isBusy;

  if (exportInspectionPdfButton) {
    exportInspectionPdfButton.disabled = isBusy;

    exportInspectionPdfButton.textContent = isBusy
      ? "Gerando PDF..."
      : "Compartilhar PDF";
  }

  if (confirmInspectionPdfButton) {
    confirmInspectionPdfButton.disabled = isBusy;

    confirmInspectionPdfButton.textContent = isBusy
      ? "Preparando PDF..."
      : "Compartilhar PDF da vistoria";
  }
}

function handleInspectionPdfError(error) {
  console.error("[PDF Vistoria] Não foi possível gerar o PDF:", error);

  if (error.message === "JSPDF_NOT_LOADED") {
    showFeedback(
      "A biblioteca de PDF não foi carregada. Atualize a página.",
      "error",
    );

    return;
  }

  if (error.message === "INSPECTION_DOCUMENT_NOT_FOUND") {
    showFeedback("Os dados da vistoria não foram encontrados.", "error");

    return;
  }

  showFeedback("Não foi possível gerar o PDF da vistoria.", "error");
}

async function shareInspectionPdf() {
  if (generatingInspectionPdf) {
    return;
  }

  setInspectionPdfBusy(true);

  try {
    const pdf = createInspectionPdf();

    const fileName = getInspectionPdfFileName();

    const pdfBlob = pdf.output("blob");

    const pdfFile = new File([pdfBlob], fileName, {
      type: "application/pdf",

      lastModified: Date.now(),
    });

    const inspectionCode = String(
      currentInspectionDocument?.codigo ||
        currentLinkedOrder?.codigo ||
        "Vistoria técnica",
    ).trim();

    const responsibleName = String(selectedResponsible?.nome || "").trim();

    const shareData = {
      title: `${inspectionCode} | Salvateck`,

      text: [
        responsibleName ? `Olá, ${responsibleName}!` : "Olá!",
        "",
        "Segue o relatório da vistoria técnica:",
        "",
        `Vistoria: ${inspectionCode}`,
        `Local: ${getInspectionCommunicationCondominiumName()}`,
        "",
        "Agradecemos a confiança!",
      ].join("\n"),

      files: [pdfFile],
    };

    const canShareFile =
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" ||
        navigator.canShare(shareData));

    if (canShareFile) {
      try {
        await navigator.share(shareData);

        closeInspectionPdfModal();

        showFeedback("PDF da vistoria compartilhado com sucesso!");

        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.warn(
          "[PDF Vistoria] O compartilhamento direto não foi concluído:",
          error,
        );
      }
    }

    pdf.save(fileName);

    closeInspectionPdfModal();

    showFeedback(
      "O compartilhamento direto não está disponível. O PDF foi baixado.",
    );
  } catch (error) {
    handleInspectionPdfError(error);
  } finally {
    setInspectionPdfBusy(false);
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

exportInspectionPdfButton?.addEventListener("click", openInspectionPdfModal);

closeInspectionPdfModalButtons.forEach((button) => {
  button.addEventListener("click", closeInspectionPdfModal);
});

confirmInspectionPdfButton?.addEventListener("click", shareInspectionPdf);

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    inspectionPdfModal &&
    !inspectionPdfModal.hidden
  ) {
    closeInspectionPdfModal();
  }
});

initializePage();
