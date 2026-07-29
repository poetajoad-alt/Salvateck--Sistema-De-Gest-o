import "./auth-guard.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";
/* =========================================
   CATÁLOGO DE SERVIÇOS
========================================= */

const catalogoServicos = {
  hidraulica: {
    nome: "Hidráulica",
    servicos: [
      "Torneira vazando",
      "Trocar torneira",
      "Ajustar torneira",
      "Trocar sifão",
      "Vazamento em tubulação",
      "Ajustar descarga",
      "Vaso sanitário entupido",
      "Desentupimento",
      "Instalar chuveiro",
      "Outro serviço hidráulico",
    ],
  },

  eletrica: {
    nome: "Elétrica",
    servicos: [
      "Trocar lâmpada",
      "Instalar luminária",
      "Tomada sem funcionar",
      "Trocar tomada",
      "Instalar interruptor",
      "Chuveiro sem funcionar",
      "Curto-circuito",
      "Instalar ventilador de teto",
      "Outro serviço elétrico",
    ],
  },

  pintura: {
    nome: "Pintura",
    servicos: [
      "Pintura de parede",
      "Retoque de pintura",
      "Pintura de teto",
      "Pintura de porta",
      "Pintura de janela",
      "Correção de manchas",
      "Preparação da superfície",
      "Outro serviço de pintura",
    ],
  },

  alvenaria: {
    nome: "Alvenaria",
    servicos: [
      "Reparo em parede",
      "Fechar buraco",
      "Assentamento de piso",
      "Reparo em revestimento",
      "Pequena demolição",
      "Correção de infiltração",
      "Aplicação de massa",
      "Outro serviço de alvenaria",
    ],
  },

  instalacoes: {
    nome: "Instalações",
    servicos: [
      "Instalar suporte de TV",
      "Instalar prateleira",
      "Instalar varal",
      "Instalar cortina ou persiana",
      "Montar móvel",
      "Instalar acessórios de banheiro",
      "Instalar armário",
      "Outro tipo de instalação",
    ],
  },

  "manutencao-geral": {
    nome: "Manutenção geral",

    servicos: [
      "Pequenos reparos",
      "Ajustar porta",
      "Ajustar janela",
      "Trocar fechadura",
      "Trocar maçaneta",
      "Reparo preventivo",
      "Avaliação para pequenos reparos",
      "Outro serviço",
    ],
  },

  vistoria: {
    nome: "Vistoria técnica",

    servicos: [
      "Vistoria completa do condomínio",
      "Vistoria para diagnóstico",
      "Vistoria preventiva",
      "Retorno de vistoria",
      "Vistoria emergencial",
      "Outro tipo de vistoria",
    ],
  },
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const body = document.body;

const form = document.getElementById("formNovaOrdem");

const adminOnlyElements = document.querySelectorAll(".admin-only");
const clientOnlyElements = document.querySelectorAll(".client-only");

const btnSalvarOrdem = document.getElementById("btnSalvarOrdem");

const btnEditarDados = document.getElementById("btnEditarDados");

const btnBuscarCliente = document.getElementById("btnBuscarCliente");

const btnNovoClienteRapido = document.getElementById("btnNovoClienteRapido");

const buscarCliente = document.getElementById("buscarCliente");

/* Dados do cliente */

const nomeCliente = document.getElementById("nomeCliente");

const telefoneCliente = document.getElementById("telefoneCliente");

const emailCliente = document.getElementById("emailCliente");

const resumoNomeCliente = document.getElementById("resumoNomeCliente");

const resumoContatoCliente = document.getElementById("resumoContatoCliente");

const resumoEmailCliente = document.getElementById("resumoEmailCliente");

const clientAvatar = document.querySelector(".client-summary__avatar");

/* Condomínio */

const condominiumSelect = document.getElementById("condominioAtendimento");

const condominiumHelp = document.getElementById("condominioAtendimentoAjuda");

/* Endereço */

const addressRadios = document.querySelectorAll('input[name="tipoEndereco"]');

const registeredAddress = document.getElementById("registered-address");

const registeredAddressTitle = registeredAddress?.querySelector("strong");

const registeredAddressChoiceTitle = document.getElementById(
  "registered-address-choice-title",
);

const registeredAddressChoiceDescription = document.getElementById(
  "registered-address-choice-description",
);

const registeredAddressLine1 = document.getElementById(
  "registered-address-line-1",
);

const registeredAddressLine2 = document.getElementById(
  "registered-address-line-2",
);

const registeredAddressRadio = document.querySelector(
  'input[name="tipoEndereco"][value="cadastrado"]',
);

const alternateAddressRadio = document.querySelector(
  'input[name="tipoEndereco"][value="outro"]',
);

const alternateAddress = document.getElementById("alternate-address");

const cepAtendimento = document.getElementById("cepAtendimento");

const numeroAtendimento = document.getElementById("numeroAtendimento");

const ruaAtendimento = document.getElementById("ruaAtendimento");

const complementoAtendimento = document.getElementById(
  "complementoAtendimento",
);

const bairroAtendimento = document.getElementById("bairroAtendimento");

const cidadeAtendimento = document.getElementById("cidadeAtendimento");

const alternateAddressRequiredFields = [
  cepAtendimento,
  numeroAtendimento,
  ruaAtendimento,
  bairroAtendimento,
  cidadeAtendimento,
];

/* Categorias e serviços */

const categoryInputs = document.querySelectorAll('input[name="categorias"]');

const categoryGrid = document.getElementById("category-grid");

const categoryError = document.getElementById("category-error");

const servicesSection = document.getElementById("services-section");

const serviceDescription = document.getElementById("descricaoServico");

const serviceDescriptionCounter = document.getElementById(
  "service-description-counter",
);

const serviceError = document.getElementById("service-error");

/* Data e período */

const dataPreferida = document.getElementById("dataPreferida");

const periodInputs = document.querySelectorAll('input[name="periodo"]');

const specificTimeGroup = document.getElementById("specific-time-group");

const horarioPreferido = document.getElementById("horarioPreferido");

const scheduleSection = document.getElementById("schedule-section");

/* Fotos */

const fotosProblema = document.getElementById("fotosProblema");

const photoPreview = document.getElementById("photo-preview");

/* Observações */

/* Progresso */

const progressLabel = document.getElementById("progress-label");

const progressValue = document.getElementById("progress-value");

const progressBar = document.getElementById("progress-bar");

/* Resumo final */

const summaryClient = document.getElementById("summary-client");

const summaryCondominium = document.getElementById("summary-condominium");

const summaryAddress = document.getElementById("summary-address");

const summaryCategories = document.getElementById("summary-categories");

const summaryServices = document.getElementById("summary-services");

const summarySchedule = document.getElementById("summary-schedule");

const summaryPhotos = document.getElementById("summary-photos");

/* Feedback */

const feedbackMessage = document.getElementById("feedback-msg");

const orderSuccess = document.getElementById("order-success");

const successOrderCode = document.getElementById("success-order-code");

const successOrderTitle = document.getElementById("success-order-title");

const whatsappOrderButton = document.getElementById("whatsapp-order-button");
const successOrderDescription = document.getElementById(
  "success-order-description",
);

/* Emergência */

const openEmergencyButton = document.getElementById("open-emergency-button");

const emergencyModal = document.getElementById("emergency-modal");

const emergencyModalDescription = document.getElementById(
  "emergency-modal-description",
);

const emergencyDescription = document.getElementById("emergency-description");

const emergencyDescriptionError = document.getElementById(
  "emergency-description-error",
);

const confirmEmergencyButton = document.getElementById(
  "confirm-emergency-button",
);

const closeEmergencyModalButtons = document.querySelectorAll(
  "[data-close-emergency-modal]",
);

/* Seleção de vistoria */

const inspectionLinkModal = document.getElementById("inspection-link-modal");

const inspectionLinkList = document.getElementById("inspection-link-list");

const inspectionLinkLoading = document.getElementById(
  "inspection-link-loading",
);

const inspectionLinkEmpty = document.getElementById("inspection-link-empty");

const inspectionLinkError = document.getElementById("inspection-link-error");

const confirmInspectionLinkButton = document.getElementById(
  "confirm-inspection-link-button",
);

const closeInspectionLinkModalButtons = document.querySelectorAll(
  "[data-close-inspection-link-modal]",
);
/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

const orderUrlParams = new URLSearchParams(window.location.search);

const orderBackLink = document.getElementById("order-back-link");

const orderCancelLink = document.getElementById("order-cancel-link");

let currentProfile = null;

let currentSession = null;

let selectedClientUid = "";

let selectedClientProfile = null;

let selectedCondominium = null;

let availableCondominiums = [];

let availableLinkedClients = [];

let hasRegisteredAddress = false;

let clientEditing = false;

let selectedFiles = [];

let availableUnlinkedInspections = [];

let selectedInspectionForOrder = null;

const maxPhotos = 6;

/*
  WhatsApp da Salvateck:
  use 55 + DDD + número, somente números.
  Exemplo: 5511999999999
*/
const SALVATECK_WHATSAPP = "554499343808";

let lastSavedOrder = null;

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

function createSlug(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createServiceKey(category, service) {
  return `${category}::${service}`;
}

function getCategoryFromServiceKey(key) {
  return key.split("::")[0];
}

function getServiceFromServiceKey(key) {
  return key.split("::").slice(1).join("::");
}

function getSelectedCategories() {
  return Array.from(categoryInputs)
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function getSelectedPeriod() {
  return document.querySelector('input[name="periodo"]:checked')?.value;
}

function getAddressMode() {
  return document.querySelector('input[name="tipoEndereco"]:checked')?.value;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T12:00:00`);

  return date.toLocaleDateString("pt-BR");
}

function getLocalDateString() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function showFeedback(message, type = "success") {
  clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;
  feedbackMessage.hidden = false;

  if (type === "error") {
    feedbackMessage.style.backgroundColor = "#2B2F33";

    feedbackMessage.style.color = "#F9F9F9";

    feedbackMessage.style.borderColor = "rgba(249, 249, 249, 0.25)";
  } else {
    feedbackMessage.style.backgroundColor = "#0D3861";

    feedbackMessage.style.color = "#DD9A17";

    feedbackMessage.style.borderColor = "rgba(221, 154, 23, 0.45)";
  }

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3500);
}

function sanitizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildEmergencyWhatsAppMessage(savedOrder) {
  const clientName =
    savedOrder?.cliente?.nome ||
    nomeCliente.value.trim() ||
    "Cliente não informado";

  const clientPhone =
    savedOrder?.cliente?.telefone ||
    telefoneCliente.value.trim() ||
    "Telefone não informado";

  const serviceTitle = savedOrder?.titulo || "Serviço não informado";

  const addressSummary =
    savedOrder?.endereco || getAddressSummary() || "Endereço não informado";

  const description =
    String(savedOrder?.descricao || emergencyDescription?.value || "").trim() ||
    "Descrição não informada";

  return [
    "🚨 EMERGÊNCIA SALVATECK",
    "",
    `OS: ${savedOrder.codigo}`,
    `Cliente: ${clientName}`,
    `Telefone: ${clientPhone}`,
    `Serviço: ${serviceTitle}`,
    `Endereço: ${addressSummary}`,
    "",
    "Descrição:",
    description,
  ].join("\n");
}

function buildWhatsAppMessage(savedOrder) {
  if (savedOrder?.prioridade === "urgente") {
    return buildEmergencyWhatsAppMessage(savedOrder);
  }

  const clientName = nomeCliente.value.trim() || "Cliente não informado";

  const clientPhone = telefoneCliente.value.trim() || "Telefone não informado";

  const serviceTitle = savedOrder?.titulo || "Serviço não informado";

  const addressSummary = getAddressSummary();

  return [
    "Olá! Criei uma solicitação de serviço na Salvateck.",
    "",
    `OS: ${savedOrder.codigo}`,
    `Serviço: ${serviceTitle}`,
    `Cliente: ${clientName}`,
    `Telefone: ${clientPhone}`,
    `Endereço: ${addressSummary}`,
    "",
    "Gostaria de conversar sobre o atendimento, o orçamento e o agendamento.",
  ].join("\n");
}

function openOrderOnWhatsApp() {
  if (!lastSavedOrder) {
    showFeedback("Não foi possível identificar a ordem criada.", "error");

    return;
  }

  const whatsappNumber = sanitizePhoneNumber(SALVATECK_WHATSAPP);

  if (whatsappNumber.length < 12) {
    showFeedback(
      "Configure o número de WhatsApp da Salvateck no arquivo nova-ordem.js.",
      "error",
    );

    return;
  }

  const message = encodeURIComponent(buildWhatsAppMessage(lastSavedOrder));

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}
function openEmergencyOnWhatsApp(savedOrder, openedWindow = null) {
  const whatsappNumber = sanitizePhoneNumber(SALVATECK_WHATSAPP);

  if (whatsappNumber.length < 12) {
    openedWindow?.close();

    showFeedback("Configure corretamente o WhatsApp da Salvateck.", "error");

    return;
  }

  const message = encodeURIComponent(buildEmergencyWhatsAppMessage(savedOrder));

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  /*
    A janela é aberta no clique antes da gravação.
    Isso evita que o celular bloqueie o WhatsApp
    depois da operação assíncrona do Firebase.
  */
  if (openedWindow && !openedWindow.closed) {
    openedWindow.location.href = whatsappUrl;

    return;
  }

  window.location.href = whatsappUrl;
}

function showOrderSuccess(savedOrder) {
  lastSavedOrder = savedOrder;

  const isEmergency = savedOrder?.prioridade === "urgente";

  successOrderCode.textContent = savedOrder.codigo;

  successOrderTitle.textContent = savedOrder.titulo || "Serviço solicitado";

  if (successOrderDescription) {
    successOrderDescription.textContent = isEmergency
      ? "A emergência foi registrada. O WhatsApp da Salvateck será aberto com as informações do atendimento."
      : "Envie a ordem pelo WhatsApp para conversar com a Salvateck sobre o orçamento e o agendamento.";
  }

  if (whatsappOrderButton) {
    whatsappOrderButton.textContent = isEmergency
      ? "Abrir emergência no WhatsApp"
      : "Enviar OS pelo WhatsApp";
  }

  form.hidden = true;

  orderSuccess.hidden = false;

  orderSuccess.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/* =========================================
   ARMAZENAMENTO DAS ORDENS NO FIRESTORE
========================================= */

function formatOrderCode(number) {
  return `OS-${String(number).padStart(4, "0")}`;
}

async function saveOrderInFirestore({
  isEmergency = false,
  emergencyDescription = "",
} = {}) {
  const counterReference = doc(db, "contadores", "ordens");

  const orderReference = doc(collection(db, "ordens"));

  const privateOrderReference = doc(db, "ordensPrivadas", orderReference.id);

  const inspectionReference = selectedInspectionForOrder?.id
    ? doc(db, "vistorias", selectedInspectionForOrder.id)
    : null;

  const internalObservation =
    currentProfile === "admin"
      ? String(document.getElementById("observacaoInterna")?.value || "").trim()
      : "";

  return runTransaction(db, async (transaction) => {
    const counterSnapshot = await transaction.get(counterReference);

    let inspectionSnapshot = null;

    if (inspectionReference) {
      inspectionSnapshot = await transaction.get(inspectionReference);

      if (!inspectionSnapshot.exists()) {
        throw new Error("INSPECTION_NOT_FOUND");
      }

      if (inspectionSnapshot.data().ordemVinculada === true) {
        throw new Error("INSPECTION_ALREADY_LINKED");
      }
    }

    if (!counterSnapshot.exists()) {
      throw new Error("ORDER_COUNTER_NOT_FOUND");
    }

    const currentNumber = Number(counterSnapshot.data().ultimoNumero || 0);

    if (!Number.isInteger(currentNumber) || currentNumber < 0) {
      throw new Error("INVALID_ORDER_COUNTER");
    }

    const nextNumber = currentNumber + 1;

    const code = formatOrderCode(nextNumber);

    const orderData = buildOrderData({
      id: orderReference.id,

      numero: nextNumber,

      codigo: code,

      isEmergency,

      emergencyDescription,
    });

    transaction.update(counterReference, {
      ultimoNumero: nextNumber,

      ultimoDocumentoId: orderReference.id,

      atualizadoEm: serverTimestamp(),
    });

    transaction.set(orderReference, orderData);

    if (inspectionReference) {
      transaction.update(inspectionReference, {
        ordemVinculada: true,

        ordemId: orderReference.id,

        codigoOS: code,

        atualizadoEm: serverTimestamp(),

        conversaoOS: {
          convertida: true,

          ordemId: orderReference.id,

          codigoOS: code,

          convertidaEm: serverTimestamp(),

          convertidaPorUid: currentSession?.uid || "",
        },
      });
    }

    if (internalObservation) {
      transaction.set(privateOrderReference, {
        ordemId: orderReference.id,

        codigo: code,

        observacaoInterna: internalObservation,

        atualizadoEm: serverTimestamp(),
      });
    }

    return {
      id: orderReference.id,

      numero: nextNumber,

      codigo: code,

      tipoAtendimento: orderData.tipoAtendimento,

      titulo: orderData.titulo,

      status: orderData.status,

      prioridade: orderData.prioridade,

      descricao: orderData.observacoes.cliente,

      cliente: orderData.cliente,

      endereco: orderData.endereco?.resumo || "",
    };
  });
}
/* =========================================
   DADOS DO CLIENTE
========================================= */

function updateClientSummary() {
  const name = nomeCliente.value.trim() || "Cliente não informado";

  const phone = telefoneCliente.value.trim() || "Telefone não informado";

  const email = emailCliente.value.trim() || "E-mail não informado";

  resumoNomeCliente.textContent = name;
  resumoContatoCliente.textContent = phone;
  resumoEmailCliente.textContent = email;

  clientAvatar.textContent = getInitials(name);

  summaryClient.textContent = name;
}

function setClientFieldsEditable(editable) {
  clientEditing = editable;

  nomeCliente.readOnly = !editable;
  telefoneCliente.readOnly = !editable;
  emailCliente.readOnly = !editable;

  if (currentProfile === "cliente") {
    btnEditarDados.textContent = editable ? "Concluir" : "Editar";
  }

  if (editable) {
    nomeCliente.focus();
  }
}

function handleClientEdit() {
  setClientFieldsEditable(!clientEditing);

  updateClientSummary();
  updateProgress();
}
function getProfileAddress(profile = {}) {
  const address = profile.endereco || {};

  return {
    cep: String(address.cep || profile.cep || "").trim(),

    rua: String(
      address.rua ||
        address.logradouro ||
        profile.rua ||
        profile.logradouro ||
        "",
    ).trim(),

    numero: String(address.numero || profile.numero || "").trim(),

    complemento: String(
      address.complemento || profile.complemento || "",
    ).trim(),

    bairro: String(address.bairro || profile.bairro || "").trim(),

    cidade: String(address.cidade || profile.cidade || "").trim(),

    estado: String(
      address.estado || address.uf || profile.estado || profile.uf || "",
    ).trim(),
  };
}
function getCondominiumAddress(condominium = {}) {
  const address = condominium.endereco || {};

  return {
    cep: String(address.cep || "").trim(),

    rua: String(address.logradouro || address.rua || "").trim(),

    numero: String(address.numero || "").trim(),

    complemento: String(address.complemento || "").trim(),

    bairro: String(address.bairro || "").trim(),

    cidade: String(address.cidade || "").trim(),

    estado: String(address.estado || address.uf || "").trim(),
  };
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
  };
}

function createCondominiumOption(value, text) {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = text;

  return option;
}

function restoreClientAddress() {
  selectedCondominium = null;

  if (condominiumSelect) {
    condominiumSelect.value = "";
  }

  if (registeredAddressChoiceTitle) {
    registeredAddressChoiceTitle.textContent = "Usar endereço cadastrado";
  }

  if (registeredAddressChoiceDescription) {
    registeredAddressChoiceDescription.textContent =
      "Mais rápido e sem precisar digitar novamente.";
  }

  if (registeredAddressTitle) {
    registeredAddressTitle.textContent = "Endereço principal";
  }

  applyRegisteredAddress(selectedClientProfile || {});
}

function resetCondominiumSelector(message) {
  availableCondominiums = [];
  selectedCondominium = null;

  condominiumSelect.innerHTML = "";

  condominiumSelect.appendChild(
    createCondominiumOption("", "Selecione um cliente primeiro"),
  );

  condominiumSelect.disabled = true;

  condominiumHelp.textContent =
    message || "Selecione um cliente para carregar os condomínios vinculados.";

  restoreClientAddress();
}

function populateCondominiumSelect() {
  condominiumSelect.innerHTML = "";

  condominiumSelect.appendChild(
    createCondominiumOption("", "Selecione o condomínio"),
  );

  availableCondominiums.forEach((condominium) => {
    const identification = [condominium.codigo, condominium.nome]
      .filter(Boolean)
      .join(" — ");

    condominiumSelect.appendChild(
      createCondominiumOption(condominium.id, identification),
    );
  });

  condominiumSelect.disabled = availableCondominiums.length === 0;
}

function getLinkedClientIds(condominium = selectedCondominium) {
  const directIds = Array.isArray(condominium?.clientesIds)
    ? condominium.clientesIds
    : [];

  const relationshipIds = Array.isArray(condominium?.clientesVinculados)
    ? condominium.clientesVinculados.map((link) =>
        String(link?.clienteId || "").trim(),
      )
    : [];

  return Array.from(
    new Set(
      [...directIds, ...relationshipIds]
        .map((clientId) => String(clientId || "").trim())
        .filter(Boolean),
    ),
  );
}

function clearAdminClientSelection({ disableSearch = true } = {}) {
  if (currentProfile !== "admin") {
    return;
  }

  selectedClientUid = "";
  selectedClientProfile = null;
  availableLinkedClients = [];

  nomeCliente.value = "";
  telefoneCliente.value = "";
  emailCliente.value = "";

  buscarCliente.innerHTML = "";

  buscarCliente.appendChild(
    createCondominiumOption(
      "",
      disableSearch
        ? "Selecione o condomínio primeiro"
        : "Carregando responsáveis...",
    ),
  );

  buscarCliente.disabled = disableSearch;

  if (btnBuscarCliente) {
    btnBuscarCliente.disabled = true;
  }

  if (selectedCondominium) {
    applySelectedCondominium(selectedCondominium);
  } else {
    applyRegisteredAddress({});
  }

  updateClientSummary();
  updateSummary();
  updateProgress();
}

function applyLinkedClient(client) {
  if (!client?.uid) {
    return;
  }

  selectedClientUid = String(client.uid).trim();

  selectedClientProfile = client;

  nomeCliente.value = String(client.nome || "").trim();

  telefoneCliente.value = String(client.telefone || "").trim();

  emailCliente.value = String(client.email || "").trim();

  buscarCliente.value = selectedClientUid;

  applySelectedCondominium(selectedCondominium);

  updateClientSummary();
  updateSummary();
  updateProgress();

  console.log("[Nova Ordem] Responsável selecionado:", {
    uid: selectedClientUid,
    nome: client.nome,
    condominioId: selectedCondominium?.id || "",
  });
}

async function loadLinkedClientsForCondominium(condominium) {
  const linkedClientIds = getLinkedClientIds(condominium);

  availableLinkedClients = [];

  buscarCliente.innerHTML = "";

  buscarCliente.appendChild(
    createCondominiumOption("", "Carregando responsáveis..."),
  );

  buscarCliente.disabled = true;

  if (linkedClientIds.length === 0) {
    buscarCliente.innerHTML = "";

    buscarCliente.appendChild(
      createCondominiumOption("", "Nenhum responsável vinculado"),
    );

    condominiumHelp.textContent =
      "Este condomínio não possui clientes vinculados.";

    clearAdminClientSelection({
      disableSearch: true,
    });

    return;
  }

  try {
    const clientSnapshots = await Promise.all(
      linkedClientIds.map((clientId) => getDoc(doc(db, "usuarios", clientId))),
    );

    availableLinkedClients = clientSnapshots
      .filter((snapshot) => snapshot.exists())
      .map((snapshot) => ({
        ...snapshot.data(),

        uid: snapshot.id,
      }))
      .filter((client) => client.role === "cliente" && client.ativo === true)
      .sort((clientA, clientB) =>
        String(clientA.nome || "").localeCompare(
          String(clientB.nome || ""),
          "pt-BR",
        ),
      );

    buscarCliente.innerHTML = "";

    if (availableLinkedClients.length === 0) {
      buscarCliente.appendChild(
        createCondominiumOption("", "Nenhum responsável ativo encontrado"),
      );

      buscarCliente.disabled = true;

      condominiumHelp.textContent =
        "Os vínculos existem, mas nenhum cliente ativo foi encontrado.";

      return;
    }

    if (availableLinkedClients.length > 1) {
      buscarCliente.appendChild(
        createCondominiumOption("", "Selecione o responsável"),
      );
    }

    availableLinkedClients.forEach((client) => {
      const identification = [client.nome, client.telefone]
        .filter(Boolean)
        .join(" — ");

      buscarCliente.appendChild(
        createCondominiumOption(
          client.uid,
          identification || "Responsável sem nome informado",
        ),
      );
    });

    buscarCliente.disabled = false;

    if (availableLinkedClients.length === 1) {
      const onlyClient = availableLinkedClients[0];

      applyLinkedClient(onlyClient);

      condominiumHelp.textContent = `${onlyClient.nome || "Responsável"} foi selecionado automaticamente.`;

      return;
    }

    condominiumHelp.textContent =
      `${availableLinkedClients.length} responsáveis vinculados. ` +
      "Selecione quem solicitou o atendimento.";
  } catch (error) {
    console.error(
      "[Nova Ordem] Não foi possível carregar os responsáveis:",
      error,
    );

    buscarCliente.innerHTML = "";

    buscarCliente.appendChild(
      createCondominiumOption("", "Erro ao carregar responsáveis"),
    );

    buscarCliente.disabled = true;

    condominiumHelp.textContent =
      "Não foi possível consultar os clientes vinculados.";

    showFeedback("Não foi possível carregar os responsáveis.", "error");
  }
}

function handleLinkedClientChange() {
  const clientUid = String(buscarCliente.value || "").trim();

  if (!clientUid) {
    selectedClientUid = "";
    selectedClientProfile = null;

    nomeCliente.value = "";
    telefoneCliente.value = "";
    emailCliente.value = "";

    applySelectedCondominium(selectedCondominium);

    updateClientSummary();
    updateSummary();
    updateProgress();

    return;
  }

  const client = availableLinkedClients.find((item) => item.uid === clientUid);

  if (!client) {
    showFeedback("O responsável selecionado não foi encontrado.", "error");

    return;
  }

  applyLinkedClient(client);

  showFeedback(`${client.nome || "Responsável"} selecionado para a ordem.`);
}

async function loadAllCondominiumsForAdmin() {
  selectedCondominium = null;
  availableCondominiums = [];

  clearAdminClientSelection({
    disableSearch: true,
  });

  condominiumSelect.innerHTML = "";

  condominiumSelect.appendChild(
    createCondominiumOption("", "Carregando condomínios..."),
  );

  condominiumSelect.disabled = true;

  condominiumHelp.textContent = "Consultando os condomínios cadastrados.";

  try {
    const snapshot = await getDocs(collection(db, "condominios"));

    availableCondominiums = snapshot.docs
      .map(mapCondominiumSnapshot)
      .filter((condominium) => condominium.status !== "inativo")
      .sort((condominiumA, condominiumB) =>
        condominiumA.nome.localeCompare(condominiumB.nome, "pt-BR"),
      );

    populateCondominiumSelect();

    if (availableCondominiums.length === 0) {
      condominiumHelp.textContent = "Nenhum condomínio ativo foi encontrado.";

      return;
    }

    condominiumHelp.textContent =
      `${availableCondominiums.length} condomínios disponíveis. ` +
      "Selecione o condomínio da ordem de serviço.";
  } catch (error) {
    console.error(
      "[Nova Ordem] Não foi possível carregar os condomínios:",
      error,
    );

    condominiumSelect.innerHTML = "";

    condominiumSelect.appendChild(
      createCondominiumOption("", "Não foi possível carregar os condomínios"),
    );

    condominiumSelect.disabled = true;

    condominiumHelp.textContent = "Não foi possível consultar os condomínios.";

    showFeedback("Não foi possível carregar os condomínios.", "error");
  }
}

async function loadCondominiumsForClient(clientUid, { preferredId = "" } = {}) {
  const finalClientUid = String(clientUid || "").trim();

  if (!finalClientUid) {
    resetCondominiumSelector(
      "Selecione um cliente para carregar os condomínios vinculados.",
    );

    return;
  }

  condominiumSelect.innerHTML = "";

  condominiumSelect.appendChild(
    createCondominiumOption("", "Carregando condomínios..."),
  );

  condominiumSelect.disabled = true;

  condominiumHelp.textContent =
    "Consultando condomínios vinculados ao cliente.";

  try {
    const linkedCondominiumsQuery = query(
      collection(db, "condominios"),
      where("clientesIds", "array-contains", finalClientUid),
    );

    const snapshot = await getDocs(linkedCondominiumsQuery);

    availableCondominiums = snapshot.docs
      .map(mapCondominiumSnapshot)
      .filter((condominium) => condominium.status !== "inativo")
      .sort((condominiumA, condominiumB) =>
        condominiumA.nome.localeCompare(condominiumB.nome, "pt-BR"),
      );

    populateCondominiumSelect();

    const preferredCondominium = availableCondominiums.find(
      (condominium) => condominium.id === preferredId,
    );

    const automaticCondominium =
      preferredCondominium ||
      (availableCondominiums.length === 1 ? availableCondominiums[0] : null);

    if (automaticCondominium) {
      condominiumSelect.value = automaticCondominium.id;

      applySelectedCondominium(automaticCondominium);

      condominiumHelp.textContent = preferredCondominium
        ? "Condomínio carregado para esta ordem."
        : "Único condomínio vinculado selecionado automaticamente.";

      return;
    }

    restoreClientAddress();

    if (availableCondominiums.length === 0) {
      condominiumHelp.textContent =
        "Nenhum condomínio ativo está vinculado a este cliente.";

      return;
    }

    condominiumHelp.textContent = `${availableCondominiums.length} condomínios vinculados. Selecione o local do atendimento.`;
  } catch (error) {
    console.error(
      "[Nova Ordem] Não foi possível carregar os condomínios:",
      error,
    );

    resetCondominiumSelector(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a consulta dos condomínios."
        : "Não foi possível carregar os condomínios vinculados.",
    );

    showFeedback("Não foi possível carregar os condomínios.", "error");
  }
}

async function handleCondominiumChange() {
  const condominiumId = condominiumSelect.value;

  if (!condominiumId) {
    selectedCondominium = null;

    if (currentProfile === "admin") {
      clearAdminClientSelection({
        disableSearch: true,
      });
    } else {
      applyRegisteredAddress(selectedClientProfile || {});
    }

    condominiumHelp.textContent = "Selecione o condomínio da ordem de serviço.";

    updateSummary();
    updateProgress();

    return;
  }

  const condominium = availableCondominiums.find(
    (item) => item.id === condominiumId,
  );

  if (!condominium) {
    selectedCondominium = null;

    condominiumHelp.textContent =
      "O condomínio selecionado não foi encontrado.";

    return;
  }

  if (currentProfile === "admin") {
    selectedCondominium = null;

    clearAdminClientSelection({
      disableSearch: false,
    });
  }

  applySelectedCondominium(condominium);

  if (currentProfile === "admin") {
    await loadLinkedClientsForCondominium(condominium);

    updateSummary();
    updateProgress();

    return;
  }

  condominiumHelp.textContent =
    "O endereço do condomínio será utilizado no atendimento.";

  updateSummary();
  updateProgress();
}
function applySelectedCondominium(condominium) {
  selectedCondominium = condominium;

  if (condominiumSelect) {
    condominiumSelect.value = condominium.id || "";
  }

  if (registeredAddressChoiceTitle) {
    registeredAddressChoiceTitle.textContent = "Usar endereço do condomínio";
  }

  if (registeredAddressChoiceDescription) {
    registeredAddressChoiceDescription.textContent =
      "O endereço será preenchido com os dados do condomínio selecionado.";
  }

  const address = getCondominiumAddress(condominium);

  hasRegisteredAddress = Boolean(
    address.rua || address.bairro || address.cidade || address.cep,
  );

  if (registeredAddressTitle) {
    registeredAddressTitle.textContent =
      condominium.nome || "Condomínio selecionado";
  }

  if (hasRegisteredAddress) {
    const firstLine = [address.rua, address.numero, address.complemento]
      .filter(Boolean)
      .join(", ");

    const cityAndState = [address.cidade, address.estado]
      .filter(Boolean)
      .join("/");

    const secondLine = [address.bairro, cityAndState, address.cep]
      .filter(Boolean)
      .join(" — ");

    registeredAddressLine1.textContent = firstLine || "Endereço do condomínio";

    registeredAddressLine2.textContent =
      secondLine || "Endereço cadastrado no condomínio";

    registeredAddressRadio.disabled = false;
    registeredAddressRadio.checked = true;

    alternateAddressRadio.checked = false;
  } else {
    registeredAddressLine1.textContent = "Condomínio sem endereço cadastrado";

    registeredAddressLine2.textContent =
      "Selecione outro endereço e preencha os campos.";

    registeredAddressRadio.disabled = true;
    registeredAddressRadio.checked = false;

    alternateAddressRadio.checked = true;
  }

  toggleAddressMode();
}

async function loadLinkedClientFromCondominium(condominium) {
  const links = Array.isArray(condominium.clientesVinculados)
    ? condominium.clientesVinculados
    : [];

  const mainLink =
    links.find((link) => link.contatoPrincipal) || links[0] || null;

  const clientId = String(mainLink?.clienteId || "").trim();

  if (!clientId) {
    return false;
  }

  const clientSnapshot = await getDoc(doc(db, "usuarios", clientId));

  if (!clientSnapshot.exists()) {
    console.warn(
      `[Nova Ordem] Cliente vinculado ${clientId} não foi encontrado.`,
    );

    return false;
  }

  const client = clientSnapshot.data();

  if (client.ativo === false) {
    console.warn(`[Nova Ordem] Cliente vinculado ${clientId} está inativo.`);

    return false;
  }

  selectedClientUid = clientSnapshot.id;

  selectedClientProfile = {
    ...client,

    uid: clientSnapshot.id,
  };

  buscarCliente.value = String(client.nome || "").trim();

  nomeCliente.value = String(client.nome || "").trim();

  telefoneCliente.value = String(client.telefone || "").trim();

  emailCliente.value = String(client.email || "").trim();

  updateClientSummary();
  updateSummary();
  updateProgress();

  return true;
}

async function loadCondominiumFromURL() {
  const condominiumId = String(orderUrlParams.get("condominio") || "").trim();

  if (!condominiumId || currentProfile !== "admin") {
    return;
  }

  const condominiumSnapshot = await getDoc(
    doc(db, "condominios", condominiumId),
  );

  if (!condominiumSnapshot.exists()) {
    showFeedback("O condomínio selecionado não foi encontrado.", "error");

    return;
  }

  const condominium = mapCondominiumSnapshot(condominiumSnapshot);

  const clientLoaded = await loadLinkedClientFromCondominium(condominium);

  if (clientLoaded) {
    await loadCondominiumsForClient(selectedClientUid, {
      preferredId: condominium.id,
    });
  } else {
    availableCondominiums = [condominium];

    populateCondominiumSelect();

    condominiumSelect.value = condominium.id;

    applySelectedCondominium(condominium);

    condominiumHelp.textContent =
      "Condomínio carregado. Selecione ou preencha o cliente da ordem.";
  }

  console.log("[Nova Ordem] Condomínio carregado:", {
    id: condominium.id,
    codigo: condominium.codigo,
    nome: condominium.nome,
    clienteCarregado: clientLoaded,
  });

  showFeedback(
    clientLoaded
      ? `${condominium.nome} e responsável carregados.`
      : `${condominium.nome} carregado. Selecione o cliente da ordem.`,
  );
}
function applyRegisteredAddress(profile = {}) {
  const address = getProfileAddress(profile);

  hasRegisteredAddress = Boolean(
    address.rua || address.bairro || address.cidade || address.cep,
  );

  if (hasRegisteredAddress) {
    const firstLine = [address.rua, address.numero, address.complemento]
      .filter(Boolean)
      .join(", ");

    const cityAndState = [address.cidade, address.estado]
      .filter(Boolean)
      .join("/");

    const secondLine = [address.bairro, cityAndState, address.cep]
      .filter(Boolean)
      .join(" — ");

    registeredAddressLine1.textContent = firstLine || "Endereço principal";

    registeredAddressLine2.textContent = secondLine || "Endereço cadastrado";

    registeredAddressRadio.disabled = false;
    registeredAddressRadio.checked = true;

    alternateAddressRadio.checked = false;
  } else {
    registeredAddressLine1.textContent = "Nenhum endereço cadastrado";

    registeredAddressLine2.textContent =
      "Selecione outro endereço e preencha os campos.";

    registeredAddressRadio.disabled = true;
    registeredAddressRadio.checked = false;

    alternateAddressRadio.checked = true;
  }

  toggleAddressMode();
}

function applyAuthenticatedSession(session) {
  if (!session || !session.role) {
    throw new Error("AUTHENTICATED_SESSION_NOT_FOUND");
  }

  currentSession = session;
  currentProfile = session.role;

  const profile = session.profile || {};

  /*
    Primeiro configura a visualização.
    Depois preenche os campos, evitando que outra
    função atualize o resumo ainda com valores vazios.
  */
  changeProfile(session.role);

  if (session.role === "cliente") {
    selectedClientUid = session.uid;

    selectedClientProfile = {
      ...profile,

      uid: session.uid,
    };

    const clientName = String(
      profile.nome || session.user?.displayName || "",
    ).trim();

    const clientPhone = String(profile.telefone || "").trim();

    const clientEmail = String(
      profile.email || session.email || session.user?.email || "",
    ).trim();

    nomeCliente.value = clientName;
    telefoneCliente.value = clientPhone;
    emailCliente.value = clientEmail;

    applyRegisteredAddress(profile);
  } else {
    selectedClientUid = "";

    selectedClientProfile = null;

    nomeCliente.value = "";
    telefoneCliente.value = "";
    emailCliente.value = "";

    applyRegisteredAddress({});
  }

  updateClientSummary();
  updateSummary();
  updateProgress();

  console.log("[Nova Ordem] Dados do usuário carregados:", {
    uid: session.uid,
    role: session.role,
    nome: nomeCliente.value,
    telefone: telefoneCliente.value,
    email: emailCliente.value,
  });
}
/* =========================================
   PERFIL CLIENTE OU ADMINISTRADOR
========================================= */
function updateOrderNavigation() {
  const principalTarget = "principal.html";

  if (orderBackLink) {
    orderBackLink.href = principalTarget;
  }

  if (orderCancelLink) {
    orderCancelLink.href = principalTarget;
  }
}

function changeProfile(profile) {
  if (profile !== "cliente" && profile !== "admin") {
    return;
  }

  currentProfile = profile;

  const isAdmin = profile === "admin";

  updateOrderNavigation();

  body.dataset.profile = profile;

  adminOnlyElements.forEach((element) => {
    element.hidden = !isAdmin;
  });

  clientOnlyElements.forEach((element) => {
    element.hidden = isAdmin;
  });

  dataPreferida.disabled = !isAdmin;

  dataPreferida.required = isAdmin;

  periodInputs.forEach((input) => {
    input.disabled = !isAdmin;

    input.required = isAdmin;
  });

  horarioPreferido.disabled = !isAdmin;

  if (!isAdmin) {
    dataPreferida.value = "";

    periodInputs.forEach((input) => {
      input.checked = false;
    });

    horarioPreferido.value = "";

    specificTimeGroup.hidden = true;
  }

  if (isAdmin) {
    btnSalvarOrdem.textContent = "Criar ordem de serviço";

    btnEditarDados.hidden = true;

    setClientFieldsEditable(true);
  } else {
    btnSalvarOrdem.textContent = "Criar solicitação";

    btnEditarDados.hidden = false;

    setClientFieldsEditable(false);
  }

  toggleSpecificTime();

  updateClientSummary();

  updateSummary();

  updateProgress();
}

/* =========================================
   BUSCA E CADASTRO DE CLIENTE
========================================= */

async function handleClientSearch() {
  if (!selectedCondominium?.id) {
    showFeedback(
      "Selecione o condomínio antes de pesquisar o responsável.",
      "error",
    );

    condominiumSelect.focus();

    return;
  }

  const linkedClientIds = getLinkedClientIds();

  if (linkedClientIds.length === 0) {
    showFeedback("Este condomínio não possui clientes vinculados.", "error");

    return;
  }

  const searchValue = buscarCliente.value.trim();

  if (!searchValue) {
    showFeedback("Digite o nome, telefone ou e-mail do responsável.", "error");

    buscarCliente.focus();

    return;
  }

  clearAdminClientSelection({
    disableSearch: false,
    preserveSearch: true,
  });

  btnBuscarCliente.disabled = true;
  btnBuscarCliente.textContent = "Buscando...";

  try {
    const clientsQuery = query(
      collection(db, "usuarios"),
      where("role", "==", "cliente"),
    );

    const snapshot = await getDocs(clientsQuery);

    const normalizedSearch = normalizeText(searchValue);

    const searchPhone = searchValue.replace(/\D/g, "");

    const matches = snapshot.docs
      .map((documentSnapshot) => ({
        ...documentSnapshot.data(),

        uid: documentSnapshot.id,
      }))
      .filter((client) =>
        linkedClientIds.includes(String(client.uid || "").trim()),
      )
      .filter((client) => {
        if (client.ativo !== true) {
          return false;
        }

        const name = normalizeText(client.nome);
        const email = normalizeText(client.email);

        const phone = String(client.telefone || "").replace(/\D/g, "");

        return (
          name.includes(normalizedSearch) ||
          email.includes(normalizedSearch) ||
          Boolean(searchPhone && phone.includes(searchPhone))
        );
      });

    if (matches.length === 0) {
      showFeedback("Nenhum responsável vinculado foi encontrado.", "error");

      return;
    }

    if (matches.length > 1) {
      showFeedback(
        "Mais de um responsável foi encontrado. Digite o nome completo, telefone ou e-mail.",
        "error",
      );

      return;
    }

    const client = matches[0];

    selectedClientUid = String(client.uid || "").trim();

    if (!selectedClientUid) {
      throw new Error("CLIENT_UID_NOT_FOUND");
    }

    selectedClientProfile = client;

    nomeCliente.value = String(client.nome || "").trim();

    telefoneCliente.value = String(client.telefone || "").trim();

    emailCliente.value = String(client.email || "").trim();

    applySelectedCondominium(selectedCondominium);

    updateClientSummary();
    updateSummary();
    updateProgress();

    console.log("[Nova Ordem] Responsável vinculado à ordem:", {
      uid: selectedClientUid,
      nome: client.nome,
      condominioId: selectedCondominium.id,
    });

    showFeedback(`${client.nome || "Responsável"} vinculado à ordem.`);
  } catch (error) {
    console.error("[Nova Ordem] Não foi possível buscar o responsável:", error);

    selectedClientUid = "";
    selectedClientProfile = null;

    if (error.code === "permission-denied") {
      showFeedback("O Firebase bloqueou a consulta dos clientes.", "error");

      return;
    }

    showFeedback("Não foi possível buscar o responsável.", "error");
  } finally {
    const searchAvailable = Boolean(
      selectedCondominium && getLinkedClientIds().length > 0,
    );

    btnBuscarCliente.disabled = !searchAvailable;
    btnBuscarCliente.textContent = "Buscar";
  }
}

function handleQuickClientCreation() {
  selectedClientUid = "";

  buscarCliente.value = "";

  nomeCliente.value = "";
  telefoneCliente.value = "";
  emailCliente.value = "";

  selectedClientProfile = {};

  resetCondominiumSelector(
    "Cliente sem cadastro não possui condomínios vinculados.",
  );

  setClientFieldsEditable(true);

  updateClientSummary();
  updateSummary();
  updateProgress();

  showFeedback("Preencha os dados do cliente não cadastrado.");
}

/* =========================================
   ENDEREÇO
========================================= */

function toggleAddressMode() {
  const mode = getAddressMode();

  const isAlternate = mode === "outro";

  registeredAddress.hidden = isAlternate;
  alternateAddress.hidden = !isAlternate;

  alternateAddressRequiredFields.forEach((field) => {
    field.required = isAlternate;
  });

  document.querySelectorAll(".choice-card").forEach((card) => {
    const input = card.querySelector('input[name="tipoEndereco"]');

    card.classList.toggle("is-selected", Boolean(input?.checked));
  });

  updateSummary();
  updateProgress();
}

function getAddressSummary() {
  const mode = getAddressMode();

  if (mode === "cadastrado") {
    if (!hasRegisteredAddress) {
      return "Nenhum endereço cadastrado";
    }

    const firstLine = String(registeredAddressLine1?.textContent || "").trim();

    const secondLine = String(registeredAddressLine2?.textContent || "").trim();

    const registeredSummary = [firstLine, secondLine]
      .filter(Boolean)
      .join(" — ");

    return registeredSummary || "Endereço cadastrado";
  }

  const street = String(ruaAtendimento.value || "").trim();

  const number = String(numeroAtendimento.value || "").trim();

  const complement = String(complementoAtendimento.value || "").trim();

  const neighborhood = String(bairroAtendimento.value || "").trim();

  const city = String(cidadeAtendimento.value || "").trim();

  const firstLine = [street, number, complement].filter(Boolean).join(", ");

  const secondLine = [neighborhood, city].filter(Boolean).join(" — ");

  const alternateSummary = [firstLine, secondLine].filter(Boolean).join(" | ");

  return alternateSummary || "Outro endereço não informado";
}

function getOrderAddressData() {
  const mode = getAddressMode();

  if (selectedCondominium && mode === "cadastrado") {
    const address = getCondominiumAddress(selectedCondominium);

    return {
      tipo: "condominio",

      enderecoCadastrado: true,

      resumo: getAddressSummary(),

      cep: address.cep,

      rua: address.rua,

      numero: address.numero,

      complemento: address.complemento,

      bairro: address.bairro,

      cidade: address.cidade,
    };
  }

  return {
    tipo: mode,

    enderecoCadastrado: mode === "cadastrado",

    resumo: getAddressSummary(),

    cep: cepAtendimento.value.trim(),

    rua: ruaAtendimento.value.trim(),

    numero: numeroAtendimento.value.trim(),

    complemento: complementoAtendimento.value.trim(),

    bairro: bairroAtendimento.value.trim(),

    cidade: cidadeAtendimento.value.trim(),
  };
}

function isAddressComplete() {
  if (getAddressMode() === "cadastrado") {
    return hasRegisteredAddress;
  }

  return alternateAddressRequiredFields.every((field) => field.value.trim());
}

/* =========================================
   TIPO E DESCRIÇÃO DO ATENDIMENTO
========================================= */

function syncCategoryStyles() {
  document.querySelectorAll(".category-card").forEach((card) => {
    const input = card.querySelector('input[name="categorias"]');

    card.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function getServiceDescription() {
  return String(serviceDescription?.value || "").trim();
}

function updateServiceDescriptionCounter() {
  const currentLength = serviceDescription?.value.length || 0;

  if (serviceDescriptionCounter) {
    serviceDescriptionCounter.textContent = `${currentLength}/1200`;
  }
}

function renderServices() {
  updateSummary();
  updateProgress();
}

function preselectCategoryFromURL() {
  const requestedType = normalizeText(orderUrlParams.get("tipo"));

  if (requestedType !== "vistoria") {
    return;
  }

  const inspectionInput = Array.from(categoryInputs).find(
    (input) => input.value === "vistoria",
  );

  if (!inspectionInput) {
    return;
  }

  categoryInputs.forEach((input) => {
    input.checked = input === inspectionInput;
  });

  syncCategoryStyles();
  renderServices();

  window.setTimeout(() => {
    scrollToElement(servicesSection);
  }, 150);
}

function formatInspectionModalDate(value) {
  if (!value) {
    return "Data não informada";
  }

  const date =
    typeof value.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return date.toLocaleDateString("pt-BR");
}

function getInspectionAdjustments(inspection) {
  return Array.isArray(inspection?.checklist)
    ? inspection.checklist.filter(
        (item) => item?.resultado === "precisa-ajuste",
      )
    : [];
}

function createInspectionLinkOption(inspection) {
  const option = document.createElement("label");

  option.className = "inspection-link-option";

  const input = document.createElement("input");

  input.type = "radio";

  input.name = "vistoriaSelecionada";

  input.value = inspection.id;

  const content = document.createElement("span");

  content.className = "inspection-link-option__content";

  const top = document.createElement("span");

  top.className = "inspection-link-option__top";

  const code = document.createElement("strong");

  code.textContent = inspection.codigo || "VST sem código";

  const status = document.createElement("small");

  status.textContent = "Sem OS vinculada";

  top.append(code, status);

  const condominium = document.createElement("strong");

  condominium.className = "inspection-link-option__condominium";

  condominium.textContent =
    inspection.condominio?.nome || "Condomínio não informado";

  const client = document.createElement("span");

  client.className = "inspection-link-option__client";

  client.textContent = inspection.cliente?.nome || "Responsável não informado";

  const adjustments = getInspectionAdjustments(inspection);

  const meta = document.createElement("span");

  meta.className = "inspection-link-option__meta";

  meta.textContent = [
    formatInspectionModalDate(inspection.validadaEm || inspection.criadoEm),
    adjustments.length === 1
      ? "1 ajuste identificado"
      : `${adjustments.length} ajustes identificados`,
  ].join(" · ");

  content.append(top, condominium, client, meta);

  option.append(input, content);

  input.addEventListener("change", () => {
    inspectionLinkError.hidden = true;

    confirmInspectionLinkButton.disabled = false;
  });

  return option;
}

function renderInspectionLinkOptions() {
  inspectionLinkList.innerHTML = "";

  if (availableUnlinkedInspections.length === 0) {
    inspectionLinkEmpty.hidden = false;

    confirmInspectionLinkButton.disabled = true;

    return;
  }

  inspectionLinkEmpty.hidden = true;

  availableUnlinkedInspections.forEach((inspection) => {
    inspectionLinkList.appendChild(createInspectionLinkOption(inspection));
  });
}

async function loadUnlinkedInspections() {
  inspectionLinkLoading.hidden = false;

  inspectionLinkEmpty.hidden = true;

  inspectionLinkError.hidden = true;

  inspectionLinkList.innerHTML = "";

  confirmInspectionLinkButton.disabled = true;

  try {
    const inspectionsQuery = query(
      collection(db, "vistorias"),
      where("ordemVinculada", "==", false),
    );

    const snapshot = await getDocs(inspectionsQuery);

    availableUnlinkedInspections = snapshot.docs
      .map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }))
      .filter((inspection) => inspection.validada === true)
      .sort(
        (inspectionA, inspectionB) =>
          Number(inspectionB.numero || 0) - Number(inspectionA.numero || 0),
      );

    renderInspectionLinkOptions();
  } catch (error) {
    console.error(
      "[Nova Ordem] Não foi possível carregar as vistorias:",
      error,
    );

    inspectionLinkEmpty.hidden = false;

    inspectionLinkEmpty.querySelector("strong").textContent =
      "Não foi possível carregar as vistorias";

    inspectionLinkEmpty.querySelector("p").textContent =
      "Verifique a conexão e as permissões do Firebase.";
  } finally {
    inspectionLinkLoading.hidden = true;
  }
}

async function openInspectionLinkModal() {
  inspectionLinkModal.hidden = false;

  inspectionLinkModal.setAttribute("aria-hidden", "false");

  body.classList.add("inspection-link-modal-open");

  await loadUnlinkedInspections();
}

function closeInspectionLinkModal({ keepCategory = false } = {}) {
  inspectionLinkModal.hidden = true;

  inspectionLinkModal.setAttribute("aria-hidden", "true");

  body.classList.remove("inspection-link-modal-open");

  inspectionLinkError.hidden = true;

  confirmInspectionLinkButton.disabled = true;

  if (!keepCategory && !selectedInspectionForOrder) {
    const inspectionInput = Array.from(categoryInputs).find(
      (input) => input.value === "vistoria",
    );

    if (inspectionInput) {
      inspectionInput.checked = false;
    }

    syncCategoryStyles();

    updateSummary();

    updateProgress();
  }
}

async function applySelectedInspectionToOrder() {
  const selectedInput = inspectionLinkList.querySelector(
    'input[name="vistoriaSelecionada"]:checked',
  );

  if (!selectedInput) {
    inspectionLinkError.hidden = false;

    return;
  }

  const inspection = availableUnlinkedInspections.find(
    (item) => item.id === selectedInput.value,
  );

  if (!inspection) {
    inspectionLinkError.hidden = false;

    return;
  }

  const condominiumId = String(
    inspection.condominio?.id || inspection.condominioId || "",
  ).trim();

  const condominium = availableCondominiums.find(
    (item) => item.id === condominiumId,
  );

  if (!condominium) {
    showFeedback(
      "O condomínio da vistoria não foi encontrado entre os condomínios ativos.",
      "error",
    );

    return;
  }

  selectedInspectionForOrder = inspection;

  condominiumSelect.value = condominium.id;

  await handleCondominiumChange();

  const clientUid = String(
    inspection.cliente?.id || inspection.clienteUid || "",
  ).trim();

  const linkedClient = availableLinkedClients.find(
    (client) => client.uid === clientUid,
  );

  if (linkedClient) {
    applyLinkedClient(linkedClient);
  } else if (clientUid) {
    selectedClientUid = clientUid;

    selectedClientProfile = {
      ...(inspection.cliente || {}),
      uid: clientUid,
    };

    nomeCliente.value = String(inspection.cliente?.nome || "").trim();

    telefoneCliente.value = String(inspection.cliente?.telefone || "").trim();

    emailCliente.value = String(inspection.cliente?.email || "").trim();

    if (
      !Array.from(buscarCliente.options).some(
        (option) => option.value === clientUid,
      )
    ) {
      buscarCliente.appendChild(
        createCondominiumOption(
          clientUid,
          inspection.cliente?.nome || "Responsável da vistoria",
        ),
      );
    }

    buscarCliente.disabled = false;

    buscarCliente.value = clientUid;

    updateClientSummary();
  }

  categoryInputs.forEach((input) => {
    input.checked = input.value === "vistoria";
  });

  const adjustments = getInspectionAdjustments(inspection);

  const adjustmentDescription = adjustments
    .map((item) => {
      const name = String(item.nome || "Equipamento").trim();

      const observation = String(item.observacao || "Ajuste necessário").trim();

      return `${name}: ${observation}`;
    })
    .join("; ");

  const description = [
    `Ordem de serviço originada da ${inspection.codigo || "vistoria selecionada"}.`,

    adjustments.length > 0
      ? `Ajustes identificados: ${adjustmentDescription}.`
      : "A vistoria foi validada sem não conformidades registradas.",
  ].join("\n\n");

  serviceDescription.value = description.slice(0, 1200);

  serviceError.hidden = true;

  updateServiceDescriptionCounter();

  syncCategoryStyles();

  updateSummary();

  updateProgress();

  closeInspectionLinkModal({
    keepCategory: true,
  });

  scrollToElement(servicesSection);

  showFeedback(
    `${inspection.codigo || "Vistoria"} selecionada para a nova OS.`,
  );
}

async function handleCategoryChange(event) {
  const changedInput = event.target;

  if (changedInput.checked) {
    categoryInputs.forEach((input) => {
      if (input !== changedInput) {
        input.checked = false;
      }
    });
  }

  if (changedInput.checked && changedInput.value !== "vistoria") {
    selectedInspectionForOrder = null;
  }

  syncCategoryStyles();

  categoryError.hidden = true;

  updateSummary();
  updateProgress();

  if (
    currentProfile === "admin" &&
    changedInput.checked &&
    changedInput.value === "vistoria"
  ) {
    await openInspectionLinkModal();
  }
}

/* =========================================
   DATA E PERÍODO
========================================= */

function setMinimumDate() {
  dataPreferida.min = getLocalDateString();
}

function syncPeriodStyles() {
  document.querySelectorAll(".period-option").forEach((option) => {
    const input = option.querySelector('input[name="periodo"]');

    option.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function toggleSpecificTime() {
  const selectedPeriod = getSelectedPeriod();

  const requiresTime =
    currentProfile === "admin" && selectedPeriod === "horario";

  specificTimeGroup.hidden = !requiresTime;

  horarioPreferido.disabled = currentProfile !== "admin";

  horarioPreferido.required = requiresTime;

  if (!requiresTime) {
    horarioPreferido.value = "";
  }

  syncPeriodStyles();

  updateSummary();

  updateProgress();
}

/* =========================================
   FOTOS
========================================= */

function syncPhotoInputFiles() {
  try {
    const dataTransfer = new DataTransfer();

    selectedFiles.forEach((file) => {
      dataTransfer.items.add(file);
    });

    fotosProblema.files = dataTransfer.files;
  } catch (error) {
    console.warn("Não foi possível sincronizar o campo de fotos.", error);
  }
}

function renderPhotoPreview() {
  photoPreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const previewItem = document.createElement("div");

    previewItem.className = "photo-preview__item";

    const image = document.createElement("img");

    image.alt = `Pré-visualização da foto ${index + 1}`;

    const objectUrl = URL.createObjectURL(file);

    image.src = objectUrl;

    image.addEventListener(
      "load",
      () => {
        URL.revokeObjectURL(objectUrl);
      },
      { once: true },
    );

    const removeButton = document.createElement("button");

    removeButton.type = "button";

    removeButton.className = "photo-preview__remove";

    removeButton.textContent = "×";

    removeButton.setAttribute("aria-label", `Remover foto ${index + 1}`);

    removeButton.addEventListener("click", () => {
      selectedFiles.splice(index, 1);

      syncPhotoInputFiles();
      renderPhotoPreview();
      updateSummary();
    });

    previewItem.append(image, removeButton);

    photoPreview.appendChild(previewItem);
  });
}

function handlePhotoSelection() {
  const newFiles = Array.from(fotosProblema.files).filter((file) =>
    file.type.startsWith("image/"),
  );

  newFiles.forEach((file) => {
    const alreadyExists = selectedFiles.some(
      (selectedFile) =>
        selectedFile.name === file.name &&
        selectedFile.size === file.size &&
        selectedFile.lastModified === file.lastModified,
    );

    if (!alreadyExists) {
      selectedFiles.push(file);
    }
  });

  if (selectedFiles.length > maxPhotos) {
    selectedFiles = selectedFiles.slice(0, maxPhotos);

    showFeedback(`Você pode adicionar até ${maxPhotos} fotos.`, "error");
  }

  syncPhotoInputFiles();
  renderPhotoPreview();
  updateSummary();
}

/* =========================================
   OBSERVAÇÕES
========================================= */

/* =========================================
   RESUMO DA ORDEM
========================================= */

function getSelectedCategoryNames() {
  return getSelectedCategories()
    .map((category) => catalogoServicos[category]?.nome)
    .filter(Boolean);
}

function getSelectedServiceNames() {
  const description = getServiceDescription();

  return description ? [description] : [];
}

function getScheduleSummary() {
  const date = dataPreferida.value;

  const period = getSelectedPeriod();

  if (!date || !period) {
    return "Data e período não informados";
  }

  const periodNames = {
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
    horario: "Horário específico",
  };

  let summary = `${formatDate(date)} — ${periodNames[period]}`;

  if (period === "horario" && horarioPreferido.value) {
    summary += ` às ${horarioPreferido.value}`;
  }

  return summary;
}

function updateSummary() {
  updateClientSummary();

  if (summaryCondominium) {
    summaryCondominium.textContent = selectedCondominium
      ? [selectedCondominium.codigo, selectedCondominium.nome]
          .filter(Boolean)
          .join(" — ")
      : "Sem condomínio selecionado";
  }

  summaryAddress.textContent = getAddressSummary();

  const categoryNames = getSelectedCategoryNames();

  summaryCategories.textContent = categoryNames.length
    ? categoryNames.join(", ")
    : "Nenhuma selecionada";

  const serviceNames = getSelectedServiceNames();

  summaryServices.textContent = serviceNames.length
    ? serviceNames.join(" • ")
    : "Nenhum selecionado";

  summarySchedule.textContent = getScheduleSummary();

  if (selectedFiles.length === 0) {
    summaryPhotos.textContent = "Nenhuma foto adicionada";
  } else if (selectedFiles.length === 1) {
    summaryPhotos.textContent = "1 foto adicionada";
  } else {
    summaryPhotos.textContent = `${selectedFiles.length} fotos adicionadas`;
  }
}

/* =========================================
   PROGRESSO DO PREENCHIMENTO
========================================= */

function isClientDataComplete() {
  return Boolean(nomeCliente.value.trim() && telefoneCliente.value.trim());
}

function isScheduleComplete() {
  if (currentProfile === "cliente") {
    return true;
  }

  const period = getSelectedPeriod();

  if (!dataPreferida.value || !period) {
    return false;
  }

  if (period === "horario" && !horarioPreferido.value) {
    return false;
  }

  return true;
}

function updateProgress() {
  const steps = [
    Boolean(selectedCondominium?.id),
    isClientDataComplete(),
    isAddressComplete(),
    getSelectedCategories().length > 0,
    getServiceDescription().length >= 10,
  ];

  if (currentProfile === "admin") {
    steps.push(isScheduleComplete());
  }

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
    progressLabel.textContent = "Pronto para enviar";
  }
}

/* =========================================
   VALIDAÇÃO
========================================= */

function showCategoryValidation() {
  categoryError.hidden = false;

  scrollToElement(categoryGrid);
}

function showServiceValidation() {
  serviceError.hidden = false;

  scrollToElement(servicesSection);
}

function validateForm() {
  categoryError.hidden = true;
  serviceError.hidden = true;

  if (!selectedCondominium?.id) {
    showFeedback("Selecione o condomínio da ordem de serviço.", "error");

    scrollToElement(document.getElementById("condominium-field"));

    condominiumSelect.focus();

    return false;
  }

  if (!form.checkValidity()) {
    form.reportValidity();

    return false;
  }

  if (getSelectedCategories().length === 0) {
    showCategoryValidation();

    return false;
  }

  const selectedCategory = getSelectedCategories()[0] || "";

  if (
    currentProfile === "admin" &&
    selectedCategory === "vistoria" &&
    !selectedInspectionForOrder
  ) {
    showFeedback(
      "Selecione uma vistoria validada antes de criar a OS.",
      "error",
    );

    openInspectionLinkModal();

    return false;
  }

  if (getServiceDescription().length < 10) {
    showServiceValidation();

    serviceDescription.focus();

    return false;
  }

  return true;
}
/* =========================================
   EMERGÊNCIA
========================================= */

function validateEmergencyData() {
  categoryError.hidden = true;
  serviceError.hidden = true;

  if (!selectedCondominium?.id) {
    showFeedback("Selecione o condomínio da emergência.", "error");

    scrollToElement(document.getElementById("condominium-field"));

    condominiumSelect.focus();

    return false;
  }

  if (!isClientDataComplete()) {
    showFeedback("Informe o nome e o telefone do cliente.", "error");

    scrollToElement(nomeCliente.closest(".form-card"));

    return false;
  }

  if (!isAddressComplete()) {
    showFeedback("Informe o endereço do atendimento.", "error");

    scrollToElement(document.querySelector('[data-section="endereco"]'));

    return false;
  }

  if (getSelectedCategories().length === 0) {
    showCategoryValidation();

    showFeedback("Selecione a categoria da emergência.", "error");

    return false;
  }

  if (getServiceDescription().length < 10) {
    showServiceValidation();

    showFeedback("Descreva o serviço relacionado à emergência.", "error");

    serviceDescription.focus();

    return false;
  }

  return true;
}

function openEmergencyModal() {
  if (!validateEmergencyData()) {
    return;
  }

  emergencyDescriptionError.hidden = true;

  if (currentProfile === "admin") {
    emergencyModalDescription.textContent =
      "A ordem será registrada como Emergência e ficará com prioridade máxima na gestão das ordens.";

    confirmEmergencyButton.textContent = "Criar OS de emergência";
  } else {
    emergencyModalDescription.textContent =
      "A ordem será registrada como Emergência e o WhatsApp da Salvateck será aberto com todas as informações.";

    confirmEmergencyButton.textContent = "Registrar e abrir WhatsApp";
  }

  emergencyModal.hidden = false;

  emergencyModal.setAttribute("aria-hidden", "false");

  body.classList.add("emergency-modal-open");

  window.setTimeout(() => {
    emergencyDescription.focus();
  }, 100);
}

function closeEmergencyModal() {
  emergencyModal.hidden = true;

  emergencyModal.setAttribute("aria-hidden", "true");

  body.classList.remove("emergency-modal-open");

  emergencyDescriptionError.hidden = true;

  confirmEmergencyButton.disabled = false;

  emergencyDescription.value = "";

  openEmergencyButton?.focus();
}

async function handleEmergencyConfirmation() {
  const description = emergencyDescription.value.trim();

  emergencyDescriptionError.hidden = true;

  if (description.length < 10) {
    emergencyDescriptionError.hidden = false;

    emergencyDescription.focus();

    return;
  }

  /*
    Abre uma janela vazia diretamente no clique.
    Depois da gravação, essa mesma janela recebe
    o link do WhatsApp.
  */
  const whatsappWindow =
    currentProfile === "cliente" ? window.open("", "_blank") : null;

  const originalButtonText = confirmEmergencyButton.textContent;

  confirmEmergencyButton.disabled = true;

  confirmEmergencyButton.textContent =
    currentProfile === "admin"
      ? "Criando emergência..."
      : "Registrando emergência...";

  try {
    const savedOrder = await saveOrderInFirestore({
      isEmergency: true,

      emergencyDescription: description,
    });

    console.log("[Nova Ordem] Emergência registrada:", savedOrder);

    closeEmergencyModal();

    showFeedback(`${savedOrder.codigo} registrada como emergência!`);

    if (currentProfile === "cliente") {
      showOrderSuccess(savedOrder);

      openEmergencyOnWhatsApp(savedOrder, whatsappWindow);

      return;
    }

    whatsappWindow?.close();

    window.setTimeout(() => {
      window.location.href = "ordens.html";
    }, 1300);
  } catch (error) {
    console.error(
      "[Nova Ordem] Não foi possível registrar a emergência:",
      error,
    );

    whatsappWindow?.close();

    confirmEmergencyButton.disabled = false;

    confirmEmergencyButton.textContent = originalButtonText;

    if (error.message === "ORDER_COUNTER_NOT_FOUND") {
      showFeedback("O contador das ordens não foi encontrado.", "error");

      return;
    }

    if (error.message === "INVALID_ORDER_COUNTER") {
      showFeedback("O contador das ordens possui um valor inválido.", "error");

      return;
    }

    if (error.code === "permission-denied") {
      showFeedback(
        "O Firebase bloqueou a criação da emergência. Publique as regras atualizadas.",
        "error",
      );

      return;
    }

    if (error.code === "unavailable") {
      showFeedback(
        "Não foi possível acessar o Firebase. Verifique sua conexão.",
        "error",
      );

      return;
    }

    showFeedback("Não foi possível registrar a emergência.", "error");
  }
}
/* =========================================
   OBJETO DA ORDEM DE SERVIÇO
========================================= */

function buildOrderData({
  id,
  numero,
  codigo,
  isEmergency = false,
  emergencyDescription = "",
}) {
  if (!selectedCondominium?.id) {
    throw new Error("CONDOMINIUM_REQUIRED");
  }

  const selectedCategories = getSelectedCategories();

  const selectedCategory = selectedCategories[0] || "";

  const serviceTypeName =
    catalogoServicos[selectedCategory]?.nome ||
    (selectedCategory === "vistoria" ? "Vistoria técnica" : "Manutenção geral");

  const serviceDescriptionText = getServiceDescription();

  const selectedServices = selectedCategory
    ? [
        {
          categoria: selectedCategory,

          servico: serviceTypeName,
        },
      ]
    : [];

  const isInspection = selectedCategory === "vistoria";

  const mainService = selectedServices[0] || null;

  const finalEmergencyDescription = String(emergencyDescription || "").trim();

  const finalClientObservation = [
    `Descrição do serviço: ${serviceDescriptionText}`,

    isEmergency && finalEmergencyDescription
      ? `Descrição da emergência: ${finalEmergencyDescription}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const initialStatus = isEmergency
    ? "nova-solicitacao"
    : currentProfile === "admin"
      ? document.getElementById("statusInicial")?.value || "nova-solicitacao"
      : "nova-solicitacao";

  const clientUid =
    currentProfile === "cliente"
      ? currentSession?.uid || ""
      : selectedClientUid;
  console.log("[Nova Ordem] UID usado na gravação:", {
    perfil: currentProfile,
    selectedClientUid,
    clientUid,
  });

  const creatorName = String(
    currentSession?.profile?.nome ||
      currentSession?.user?.displayName ||
      currentSession?.email ||
      "",
  ).trim();

  const orderAddress = getOrderAddressData();

  return {
    id,

    numero,

    codigo,

    criadoEm: serverTimestamp(),

    atualizadoEm: serverTimestamp(),

    statusAtualizadoEm: serverTimestamp(),

    perfilCriador: currentProfile,

    criadoPorUid: currentSession?.uid || "",

    criadoPorNome: creatorName,

    clienteUid: clientUid,

    condominioId: selectedCondominium.id,

    clientesAutorizadosIds: getLinkedClientIds(selectedCondominium),

    tipoAtendimento: isInspection ? "vistoria" : "servico",

    categoriaPrincipal: mainService?.categoria || selectedCategories[0] || "",

    servicoPrincipal: mainService?.servico || "",

    titulo:
      mainService?.servico ||
      (isInspection ? "Vistoria técnica" : "Nova ordem de serviço"),

    cliente: {
      id: clientUid,

      nome: nomeCliente.value.trim(),

      telefone: telefoneCliente.value.trim(),

      email: emailCliente.value.trim(),
    },

    condominio: {
      id: selectedCondominium.id,

      codigo: selectedCondominium.codigo || "",

      nome: selectedCondominium.nome || "",

      cnpj: selectedCondominium.cnpj || "",
    },

    endereco: orderAddress,

    categorias: selectedCategories,

    servicos: selectedServices,

    atendimento: {
      dataPreferida:
        currentProfile === "admin" && !isEmergency ? dataPreferida.value : "",

      periodo:
        currentProfile === "admin" && !isEmergency
          ? getSelectedPeriod() || ""
          : "",

      horarioPreferido:
        currentProfile === "admin" && !isEmergency
          ? horarioPreferido.value
          : "",

      dataConfirmada: "",

      periodoConfirmado: "",

      horarioConfirmado: "",
    },

    observacoes: {
      cliente: finalClientObservation,

      resposta:
        currentProfile === "admin"
          ? document.getElementById("observacaoResposta")?.value.trim() || ""
          : "",

      interna: "",
    },

    prioridade: isEmergency ? "urgente" : "normal",

    status: initialStatus,

    ativo: true,

    arquivado: false,

    quantidadeFotos: selectedFiles.length,

    vistoria: isInspection
      ? selectedInspectionForOrder
        ? {
            id: selectedInspectionForOrder.id,

            codigo: selectedInspectionForOrder.codigo || "",

            tipo:
              selectedInspectionForOrder.tipo ||
              mainService?.servico ||
              "Vistoria técnica",

            status: "concluida",

            validada: true,

            progresso: Number(selectedInspectionForOrder.progresso || 100),

            checklist: Array.isArray(selectedInspectionForOrder.checklist)
              ? selectedInspectionForOrder.checklist
              : [],

            totalItens: Number(selectedInspectionForOrder.totalItens || 0),

            itensConcluidos: Number(
              selectedInspectionForOrder.itensConcluidos || 0,
            ),

            equipamentosAvaliados: Number(
              selectedInspectionForOrder.equipamentosAvaliados || 0,
            ),

            naoConformidades: Number(
              selectedInspectionForOrder.naoConformidades || 0,
            ),

            pendenciasCriticas: Number(
              selectedInspectionForOrder.pendenciasCriticas || 0,
            ),

            quantidadeFotos: Number(
              selectedInspectionForOrder.quantidadeFotos || 0,
            ),

            concluidaEm:
              selectedInspectionForOrder.validadaEm ||
              selectedInspectionForOrder.atualizadoEm ||
              "",
          }
        : {
            tipo: mainService?.servico || "Vistoria técnica",

            status: "solicitada",

            progresso: 0,

            naoConformidades: 0,

            pendenciasCriticas: 0,

            quantidadeFotos: selectedFiles.length,

            concluidaEm: "",
          }
      : null,

    origem: selectedInspectionForOrder
      ? {
          tipo: "vistoria",

          vistoriaId: selectedInspectionForOrder.id,

          codigoVistoria: selectedInspectionForOrder.codigo || "",

          ordemOrigemId: "",
        }
      : {
          tipo:
            currentProfile === "admin"
              ? "cadastro-admin"
              : "solicitacao-cliente",

          ordemOrigemId: "",
        },
  };
}

/* =========================================
   ENVIO DO FORMULÁRIO
========================================= */

async function handleSubmit(event) {
  event.preventDefault();

  updateSummary();
  updateProgress();

  if (!validateForm()) {
    showFeedback("Revise os campos obrigatórios antes de continuar.", "error");

    return;
  }

  const originalButtonText = btnSalvarOrdem.textContent;

  btnSalvarOrdem.disabled = true;

  btnSalvarOrdem.textContent =
    currentProfile === "admin" ? "Criando ordem..." : "Enviando solicitação...";

  try {
    const savedOrder = await saveOrderInFirestore();

    console.log("Ordem salva no Firestore:", savedOrder);

    console.table({
      codigo: savedOrder.codigo,

      tipoAtendimento: savedOrder.tipoAtendimento,

      titulo: savedOrder.titulo,

      status: savedOrder.status,
    });

    btnSalvarOrdem.textContent =
      currentProfile === "admin" ? "Ordem criada" : "Solicitação enviada";

    showFeedback(
      currentProfile === "admin"
        ? `${savedOrder.codigo} criada com sucesso!`
        : `${savedOrder.codigo} enviada com sucesso!`,
    );

    if (currentProfile === "cliente") {
      showOrderSuccess(savedOrder);

      return;
    }

    const destination = selectedInspectionForOrder
      ? "ordens.html"
      : savedOrder.tipoAtendimento === "vistoria"
        ? "vistorias.html"
        : "ordens.html";

    window.setTimeout(() => {
      window.location.href = destination;
    }, 1800);
  } catch (error) {
    console.error("[Nova Ordem] Não foi possível salvar a ordem:", error);

    btnSalvarOrdem.disabled = false;

    btnSalvarOrdem.textContent = originalButtonText;

    if (error.message === "ORDER_COUNTER_NOT_FOUND") {
      showFeedback(
        "O contador das ordens não foi encontrado no Firebase.",
        "error",
      );

      return;
    }

    if (error.message === "INVALID_ORDER_COUNTER") {
      showFeedback(
        "O contador das ordens está com um valor inválido.",
        "error",
      );

      return;
    }

    if (error.message === "INSPECTION_NOT_FOUND") {
      showFeedback("A vistoria selecionada não foi encontrada.", "error");

      return;
    }

    if (error.message === "INSPECTION_ALREADY_LINKED") {
      showFeedback(
        "Essa vistoria já possui uma Ordem de Serviço vinculada.",
        "error",
      );

      return;
    }

    if (error.code === "permission-denied") {
      showFeedback(
        "O Firebase bloqueou a gravação. Verifique se as novas regras foram publicadas.",
        "error",
      );

      return;
    }

    if (error.code === "unavailable") {
      showFeedback(
        "Não foi possível acessar o Firebase. Verifique sua conexão.",
        "error",
      );

      return;
    }

    showFeedback("Não foi possível salvar a ordem de serviço.", "error");
  }
}

/* =========================================
   MÁSCARA SIMPLES DE CEP
========================================= */

function formatCep(value) {
  const numbers = value.replace(/\D/g, "");

  return numbers.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

/* =========================================
   EVENTOS
========================================= */

btnEditarDados.addEventListener("click", handleClientEdit);

buscarCliente.addEventListener("change", handleLinkedClientChange);

btnNovoClienteRapido?.addEventListener("click", handleQuickClientCreation);

if (condominiumSelect) {
  condominiumSelect.addEventListener("change", handleCondominiumChange);
}

[nomeCliente, telefoneCliente, emailCliente].forEach((field) => {
  field.addEventListener("input", () => {
    updateClientSummary();
    updateSummary();
    updateProgress();
  });
});

addressRadios.forEach((radio) => {
  radio.addEventListener("change", toggleAddressMode);
});

alternateAddress.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    updateSummary();
    updateProgress();
  });
});

cepAtendimento.addEventListener("input", () => {
  cepAtendimento.value = formatCep(cepAtendimento.value);
});

categoryInputs.forEach((input) => {
  input.addEventListener("change", handleCategoryChange);
});

dataPreferida.addEventListener("change", () => {
  updateSummary();
  updateProgress();
});

periodInputs.forEach((input) => {
  input.addEventListener("change", toggleSpecificTime);
});

horarioPreferido.addEventListener("change", () => {
  updateSummary();
  updateProgress();
});

fotosProblema.addEventListener("change", handlePhotoSelection);

serviceDescription.addEventListener("input", () => {
  updateServiceDescriptionCounter();

  serviceError.hidden = true;

  updateSummary();
  updateProgress();
});

form.addEventListener("submit", handleSubmit);
if (openEmergencyButton) {
  openEmergencyButton.addEventListener("click", openEmergencyModal);
}

closeEmergencyModalButtons.forEach((button) => {
  button.addEventListener("click", closeEmergencyModal);
});

closeInspectionLinkModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeInspectionLinkModal();
  });
});

if (confirmInspectionLinkButton) {
  confirmInspectionLinkButton.addEventListener(
    "click",
    applySelectedInspectionToOrder,
  );
}

if (confirmEmergencyButton) {
  confirmEmergencyButton.addEventListener("click", handleEmergencyConfirmation);
}

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    inspectionLinkModal &&
    !inspectionLinkModal.hidden
  ) {
    closeInspectionLinkModal();

    return;
  }

  if (event.key === "Escape" && emergencyModal && !emergencyModal.hidden) {
    closeEmergencyModal();
  }
});
if (whatsappOrderButton) {
  whatsappOrderButton.addEventListener("click", openOrderOnWhatsApp);
} else {
  console.warn("[Nova Ordem] Botão de WhatsApp não encontrado no HTML.");
}

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function initializePage() {
  try {
    const session = await window.salvateckSessionReady;

    setMinimumDate();

    syncCategoryStyles();

    renderServices();

    toggleSpecificTime();

    updateServiceDescriptionCounter();

    applyAuthenticatedSession(session);

    const condominiumIdFromURL = String(
      orderUrlParams.get("condominio") || "",
    ).trim();

    if (currentProfile === "admin" && condominiumIdFromURL) {
      await loadCondominiumFromURL();
    } else if (currentProfile === "admin") {
      await loadAllCondominiumsForAdmin();
    } else {
      await loadCondominiumsForClient(currentSession.uid);
    }

    preselectCategoryFromURL();

    updateSummary();

    updateProgress();
  } catch (error) {
    console.error("[Nova Ordem] Não foi possível iniciar a página:", error);

    showFeedback("Não foi possível carregar seus dados.", "error");
  }
}

initializePage();
