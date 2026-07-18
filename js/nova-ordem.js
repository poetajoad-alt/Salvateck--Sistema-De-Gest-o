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

/* Endereço */

const addressRadios = document.querySelectorAll('input[name="tipoEndereco"]');

const registeredAddress = document.getElementById("registered-address");

const registeredAddressTitle = registeredAddress?.querySelector("strong");

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

const servicePlaceholder = document.getElementById("service-placeholder");

const selectedServicesContainer = document.getElementById("selected-services");

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

const observacaoCliente = document.getElementById("observacaoCliente");

const observationCounter = document.getElementById("observation-counter");

/* Progresso */

const progressLabel = document.getElementById("progress-label");

const progressValue = document.getElementById("progress-value");

const progressBar = document.getElementById("progress-bar");

/* Resumo final */

const summaryClient = document.getElementById("summary-client");

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

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

const orderUrlParams = new URLSearchParams(window.location.search);

const orderBackLink = document.getElementById("order-back-link");

const orderCancelLink = document.getElementById("order-cancel-link");

let currentProfile = null;

let currentSession = null;

let selectedClientUid = "";

let selectedCondominium = null;

let hasRegisteredAddress = false;

let clientEditing = false;

let selectedFiles = [];

const selectedServiceKeys = new Set();

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

function buildWhatsAppMessage(savedOrder) {
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

function showOrderSuccess(savedOrder) {
  lastSavedOrder = savedOrder;

  successOrderCode.textContent = savedOrder.codigo;

  successOrderTitle.textContent = savedOrder.titulo || "Serviço solicitado";

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

async function saveOrderInFirestore() {
  const counterReference = doc(db, "contadores", "ordens");

  const orderReference = doc(collection(db, "ordens"));

  const privateOrderReference = doc(db, "ordensPrivadas", orderReference.id);

  const internalObservation =
    currentProfile === "admin"
      ? String(document.getElementById("observacaoInterna")?.value || "").trim()
      : "";

  return runTransaction(db, async (transaction) => {
    const counterSnapshot = await transaction.get(counterReference);

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
    });

    transaction.update(counterReference, {
      ultimoNumero: nextNumber,

      ultimoDocumentoId: orderReference.id,

      atualizadoEm: serverTimestamp(),
    });

    transaction.set(orderReference, orderData);

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

function applySelectedCondominium(condominium) {
  selectedCondominium = condominium;

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

  const data = condominiumSnapshot.data();

  selectedCondominium = {
    id: condominiumSnapshot.id,

    codigo: String(data.codigo || "").trim(),

    nome: String(data.nome || "Condomínio sem nome").trim(),

    endereco: data.endereco || {},

    clientesVinculados: Array.isArray(data.clientesVinculados)
      ? data.clientesVinculados
      : [],
  };

  applySelectedCondominium(selectedCondominium);

  const clientLoaded =
    await loadLinkedClientFromCondominium(selectedCondominium);

  console.log("[Nova Ordem] Condomínio carregado:", {
    id: selectedCondominium.id,
    codigo: selectedCondominium.codigo,
    nome: selectedCondominium.nome,
    clienteCarregado: clientLoaded,
  });

  showFeedback(
    clientLoaded
      ? `${selectedCondominium.nome} e responsável carregados.`
      : `${selectedCondominium.nome} carregado. Selecione o cliente da ordem.`,
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
  const searchValue = buscarCliente.value.trim();

  if (!searchValue) {
    showFeedback("Digite o nome, telefone ou e-mail do cliente.", "error");

    buscarCliente.focus();

    return;
  }

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
      selectedClientUid = "";

      showFeedback("Nenhum cliente cadastrado foi encontrado.", "error");

      return;
    }

    if (matches.length > 1) {
      selectedClientUid = "";

      showFeedback(
        "Mais de um cliente foi encontrado. Digite o nome completo, telefone ou e-mail.",
        "error",
      );

      return;
    }

    const client = matches[0];

    nomeCliente.value = String(client.nome || "").trim();

    telefoneCliente.value = String(client.telefone || "").trim();

    emailCliente.value = String(client.email || "").trim();

    if (selectedCondominium) {
      applySelectedCondominium(selectedCondominium);
    } else {
      applyRegisteredAddress(client);
    }

    /*
  Define o UID depois de preencher os campos,
  evitando que algum evento de input limpe o vínculo.
*/
    selectedClientUid = String(client.uid || "").trim();

    if (!selectedClientUid) {
      throw new Error("CLIENT_UID_NOT_FOUND");
    }

    updateClientSummary();
    updateSummary();
    updateProgress();

    console.log("[Nova Ordem] Cliente vinculado:", {
      uid: selectedClientUid,
      nome: client.nome,
      telefone: client.telefone,
    });

    showFeedback(`Cliente ${client.nome || ""} vinculado à ordem.`);
  } catch (error) {
    console.error("[Nova Ordem] Não foi possível buscar o cliente:", error);

    selectedClientUid = "";

    if (error.code === "permission-denied") {
      showFeedback("O Firebase bloqueou a consulta dos clientes.", "error");

      return;
    }

    showFeedback("Não foi possível buscar o cliente.", "error");
  } finally {
    btnBuscarCliente.disabled = false;
    btnBuscarCliente.textContent = "Buscar";
  }
}

function handleQuickClientCreation() {
  selectedClientUid = "";

  buscarCliente.value = "";

  nomeCliente.value = "";
  telefoneCliente.value = "";
  emailCliente.value = "";

  if (selectedCondominium) {
    applySelectedCondominium(selectedCondominium);
  } else {
    applyRegisteredAddress({});
  }

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
   CATEGORIAS E MINI SERVIÇOS
========================================= */

function syncCategoryStyles() {
  document.querySelectorAll(".category-card").forEach((card) => {
    const input = card.querySelector('input[name="categorias"]');

    card.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function removeUnselectedCategoryServices(selectedCategories) {
  Array.from(selectedServiceKeys).forEach((key) => {
    const category = getCategoryFromServiceKey(key);

    if (!selectedCategories.includes(category)) {
      selectedServiceKeys.delete(key);
    }
  });
}

function createServiceOption(category, service) {
  const key = createServiceKey(category, service);

  const label = document.createElement("label");

  label.className = "service-option";

  const input = document.createElement("input");

  input.type = "checkbox";
  input.name = "servicos";
  input.value = service;

  input.dataset.category = category;
  input.dataset.serviceKey = key;

  input.id = `service-${createSlug(category)}-${createSlug(service)}`;

  input.checked = selectedServiceKeys.has(key);

  const span = document.createElement("span");

  span.textContent = service;

  label.classList.toggle("is-selected", input.checked);

  input.addEventListener("change", () => {
    if (input.checked && category === "vistoria") {
      Array.from(selectedServiceKeys).forEach((selectedKey) => {
        if (getCategoryFromServiceKey(selectedKey) === "vistoria") {
          selectedServiceKeys.delete(selectedKey);
        }
      });

      selectedServicesContainer
        .querySelectorAll('input[name="servicos"][data-category="vistoria"]')
        .forEach((otherInput) => {
          if (otherInput !== input) {
            otherInput.checked = false;

            otherInput
              .closest(".service-option")
              ?.classList.remove("is-selected");
          }
        });
    }

    if (input.checked) {
      selectedServiceKeys.add(key);
    } else {
      selectedServiceKeys.delete(key);
    }

    label.classList.toggle("is-selected", input.checked);

    serviceError.hidden = true;

    updateSummary();
    updateProgress();
  });

  label.append(input, span);

  return label;
}

function renderServices() {
  const selectedCategories = getSelectedCategories();

  removeUnselectedCategoryServices(selectedCategories);

  selectedServicesContainer.innerHTML = "";

  if (selectedCategories.length === 0) {
    servicePlaceholder.hidden = false;
    selectedServicesContainer.hidden = true;

    updateSummary();
    updateProgress();

    return;
  }

  servicePlaceholder.hidden = true;
  selectedServicesContainer.hidden = false;

  selectedCategories.forEach((category) => {
    const categoryData = catalogoServicos[category];

    if (!categoryData) {
      return;
    }

    const group = document.createElement("section");

    group.className = "service-group";

    const title = document.createElement("h3");

    title.className = "service-group__title";

    title.textContent = categoryData.nome;

    const options = document.createElement("div");

    options.className = "service-options";

    categoryData.servicos.forEach((service) => {
      options.appendChild(createServiceOption(category, service));
    });

    group.append(title, options);

    selectedServicesContainer.appendChild(group);
  });

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

  selectedServiceKeys.clear();

  syncCategoryStyles();
  renderServices();

  window.setTimeout(() => {
    scrollToElement(servicesSection);
  }, 150);
}
function handleCategoryChange(event) {
  const changedInput = event.target;

  if (changedInput.value === "vistoria" && changedInput.checked) {
    categoryInputs.forEach((input) => {
      if (input !== changedInput) {
        input.checked = false;
      }
    });

    selectedServiceKeys.clear();
  }

  if (changedInput.value !== "vistoria" && changedInput.checked) {
    const inspectionInput = Array.from(categoryInputs).find(
      (input) => input.value === "vistoria",
    );

    if (inspectionInput?.checked) {
      inspectionInput.checked = false;

      Array.from(selectedServiceKeys).forEach((key) => {
        if (getCategoryFromServiceKey(key) === "vistoria") {
          selectedServiceKeys.delete(key);
        }
      });
    }
  }

  syncCategoryStyles();

  categoryError.hidden = true;

  renderServices();
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

function updateObservationCounter() {
  const currentLength = observacaoCliente.value.length;

  observationCounter.textContent = `${currentLength}/600`;
}

/* =========================================
   RESUMO DA ORDEM
========================================= */

function getSelectedCategoryNames() {
  return getSelectedCategories()
    .map((category) => catalogoServicos[category]?.nome)
    .filter(Boolean);
}

function getSelectedServiceNames() {
  return Array.from(selectedServiceKeys).map((key) => {
    const category = getCategoryFromServiceKey(key);

    const service = getServiceFromServiceKey(key);

    const categoryName = catalogoServicos[category]?.nome;

    return categoryName ? `${categoryName}: ${service}` : service;
  });
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
    isClientDataComplete(),
    isAddressComplete(),
    getSelectedCategories().length > 0,
    selectedServiceKeys.size > 0,
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

  if (!form.checkValidity()) {
    form.reportValidity();

    return false;
  }

  if (getSelectedCategories().length === 0) {
    showCategoryValidation();

    return false;
  }

  if (selectedServiceKeys.size === 0) {
    showServiceValidation();

    return false;
  }

  return true;
}

/* =========================================
   OBJETO DA ORDEM DE SERVIÇO
========================================= */

function buildOrderData({ id, numero, codigo }) {
  const selectedCategories = getSelectedCategories();

  const selectedServices = Array.from(selectedServiceKeys).map((key) => ({
    categoria: getCategoryFromServiceKey(key),

    servico: getServiceFromServiceKey(key),
  }));

  const isInspection = selectedCategories.includes("vistoria");

  const mainService = isInspection
    ? selectedServices.find((service) => service.categoria === "vistoria")
    : selectedServices[0];

  const initialStatus =
    currentProfile === "admin"
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
      id: selectedCondominium?.id || "",

      nome: selectedCondominium?.nome || "",
    },

    endereco: orderAddress,

    categorias: selectedCategories,

    servicos: selectedServices,

    atendimento: {
      dataPreferida: currentProfile === "admin" ? dataPreferida.value : "",

      periodo: currentProfile === "admin" ? getSelectedPeriod() || "" : "",

      horarioPreferido:
        currentProfile === "admin" ? horarioPreferido.value : "",

      dataConfirmada: "",

      periodoConfirmado: "",

      horarioConfirmado: "",
    },

    observacoes: {
      cliente: observacaoCliente.value.trim(),

      resposta:
        currentProfile === "admin"
          ? document.getElementById("observacaoResposta")?.value.trim() || ""
          : "",

      interna: "",
    },

    status: initialStatus,

    ativo: true,

    arquivado: false,

    quantidadeFotos: selectedFiles.length,

    vistoria: isInspection
      ? {
          tipo: mainService?.servico || "Vistoria técnica",

          status: "solicitada",

          progresso: 0,

          naoConformidades: 0,

          pendenciasCriticas: 0,

          quantidadeFotos: selectedFiles.length,

          concluidaEm: "",
        }
      : null,

    origem: {
      tipo:
        currentProfile === "admin" ? "cadastro-admin" : "solicitacao-cliente",

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

    const destination =
      savedOrder.tipoAtendimento === "vistoria"
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

btnBuscarCliente.addEventListener("click", handleClientSearch);

btnNovoClienteRapido.addEventListener("click", handleQuickClientCreation);

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

observacaoCliente.addEventListener("input", () => {
  updateObservationCounter();
  updateSummary();
});

form.addEventListener("submit", handleSubmit);

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

    updateObservationCounter();

    applyAuthenticatedSession(session);

    await loadCondominiumFromURL();

    preselectCategoryFromURL();

    updateSummary();

    updateProgress();
  } catch (error) {
    console.error("[Nova Ordem] Não foi possível iniciar a página:", error);

    showFeedback("Não foi possível carregar seus dados.", "error");
  }
}

initializePage();
