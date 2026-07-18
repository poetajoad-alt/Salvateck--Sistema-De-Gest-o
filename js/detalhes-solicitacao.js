import "./auth-guard.js";

import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

/* =========================================
   CONFIGURAÇÕES
========================================= */

const statusConfig = {
  "nova-solicitacao": {
    nome: "Nova solicitação",
    classe: "status--nova-solicitacao",
  },

  "em-analise": {
    nome: "Em análise",
    classe: "status--em-analise",
  },

  "aguardando-confirmacao": {
    nome: "Aguardando confirmação",
    classe: "status--aguardando-confirmacao",
  },

  agendada: {
    nome: "Agendada",
    classe: "status--agendada",
  },

  recusada: {
    nome: "Recusada",
    classe: "status--recusada",
  },

  cancelada: {
    nome: "Cancelada",
    classe: "status--cancelada",
  },
};

const categoriaConfig = {
  hidraulica: "Hidráulica",
  eletrica: "Elétrica",
  pintura: "Pintura",
  alvenaria: "Alvenaria",
  instalacoes: "Instalações",
  "manutencao-geral": "Manutenção geral",
  vistoria: "Vistoria técnica",
};

const periodoConfig = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  horario: "Horário específico",
};

const prioridadeConfig = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

const statusPropostaConfig = {
  aguardando: "Aguardando confirmação",
  aceita: "Data aceita",
  recusada: "Data recusada",
};

/* =========================================
   ELEMENTOS
========================================= */

const body = document.body;

const detailsShell = document.getElementById("details-shell");

const backButton = document.getElementById("back-button");

const requestCode = document.getElementById("request-code");

const requestStatus = document.getElementById("request-status");

const requestTitle = document.getElementById("request-title");

const requestDescription = document.getElementById("request-description");

const requestCreatedAt = document.getElementById("request-created-at");

const requestLastUpdate = document.getElementById("request-last-update");

const adminOnlyElements = document.querySelectorAll(".admin-only");

const clientOnlyElements = document.querySelectorAll(".client-only");

const adminVisibleElements = document.querySelectorAll(".admin-visible");

const timelineItems = document.querySelectorAll(".timeline-item");

/* Cliente */

const clientAvatar = document.getElementById("client-avatar");

const clientName = document.getElementById("client-name");

const clientPhone = document.getElementById("client-phone");

const clientEmail = document.getElementById("client-email");

const openClientButton = document.getElementById("open-client-button");

/* Serviços */

const categoryTags = document.getElementById("category-tags");

const servicesList = document.getElementById("services-list");

/* Endereço */

const addressMain = document.getElementById("address-main");

const addressComplement = document.getElementById("address-complement");

const addressCity = document.getElementById("address-city");

const addressReference = document.getElementById("address-reference");

const openMapButton = document.getElementById("open-map-button");

/* Agendamento confirmado */

const confirmedScheduleCard = document.getElementById(
  "confirmed-schedule-card",
);

const confirmedDate = document.getElementById("confirmed-date");

const confirmedPeriod = document.getElementById("confirmed-period");

const confirmedTime = document.getElementById("confirmed-time");

const confirmedScheduleMessageBox = document.getElementById(
  "confirmed-schedule-message-box",
);

const confirmedScheduleMessage = document.getElementById(
  "confirmed-schedule-message",
);

/* Fotos */

const requestPhotos = document.getElementById("request-photos");

const photosEmpty = document.getElementById("photos-empty");

/* Observações */

const clientObservation = document.getElementById("client-observation");

const responseObservationBox = document.getElementById(
  "response-observation-box",
);

const responseObservation = document.getElementById("response-observation");

const internalObservationBox = document.getElementById(
  "internal-observation-box",
);

const internalObservation = document.getElementById("internal-observation");

/* Prioridade */

const priorityInputs = document.querySelectorAll('input[name="prioridade"]');

const priorityCard = document.getElementById("priority-card");

/* Ações administrativas */

const adminActionsCard = document.getElementById("admin-actions-card");

const acceptRequestButton = document.getElementById("accept-request-button");

const rejectRequestButton = document.getElementById("reject-request-button");

const acceptForm = document.getElementById("accept-form");

const rejectForm = document.getElementById("reject-form");

const actionForms = [acceptForm, rejectForm];

const acceptDate = document.getElementById("accept-date");

const acceptPeriod = document.getElementById("accept-period");

const acceptTime = document.getElementById("accept-time");

const acceptMessage = document.getElementById("accept-message");

const rejectReason = document.getElementById("reject-reason");

const rejectMessage = document.getElementById("reject-message");

/* Ações do cliente */

const clientActionsCard = document.getElementById("client-actions-card");

const cancelRequestButton = document.getElementById("cancel-request-button");

/* Modal */

const confirmationModal = document.getElementById("confirmation-modal");

const confirmationTitle = document.getElementById("confirmation-title");

const confirmationDescription = document.getElementById(
  "confirmation-description",
);

const confirmModalButton = document.getElementById("confirm-modal-button");

const closeModalButtons = document.querySelectorAll("[data-close-modal]");

const closeActionButtons = document.querySelectorAll("[data-close-action]");

/* Feedback */

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   CONTROLE
========================================= */

const urlParams = new URLSearchParams(window.location.search);

const requestId = String(urlParams.get("id") || "").trim();

const returnPage =
  urlParams.get("origem") === "ordens" ? "ordens.html" : "solicitacoes.html";

let currentSession = null;

let currentRequest = null;

let currentRequestReference = null;

let currentPrivateRequestReference = null;

let modalCallback = null;

let feedbackTimeout;

let savingChanges = false;

/* =========================================
   AUXILIARES
========================================= */

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeStatus(status) {
  const normalizedStatus = normalizeText(status);

  const statusMap = {
    nova: "nova-solicitacao",

    "nova-solicitacao": "nova-solicitacao",

    analise: "em-analise",

    "em-analise": "em-analise",

    "aguardando-confirmacao": "aguardando-confirmacao",

    agendada: "agendada",

    agendado: "agendada",

    recusada: "recusada",

    recusado: "recusada",

    cancelada: "cancelada",

    cancelado: "cancelada",
  };

  return statusMap[normalizedStatus] || "nova-solicitacao";
}

function normalizePriority(priority) {
  const normalizedPriority = normalizeText(priority);

  const priorityMap = {
    baixa: "baixa",
    low: "baixa",

    normal: "normal",

    alta: "alta",
    high: "alta",

    urgente: "urgente",

    critica: "urgente",
    critical: "urgente",
  };

  return priorityMap[normalizedPriority] || "normal";
}

function convertToDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T12:00:00`)
    : new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDate(value) {
  const date = convertToDate(value);

  if (!date) {
    return "Não informada";
  }

  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value) {
  const date = convertToDate(value);

  if (!date) {
    return "Não informada";
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

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

function showFeedback(message) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;

  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3500);
}

function closeActionForms() {
  actionForms.forEach((form) => {
    form.hidden = true;
  });
}

function openActionForm(form) {
  closeActionForms();

  form.hidden = false;

  form.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

/* =========================================
   NORMALIZAÇÃO DO DOCUMENTO
========================================= */

function getOrderServices(order) {
  if (!Array.isArray(order.servicos)) {
    return [order.servicoPrincipal].filter(Boolean);
  }

  return order.servicos
    .map((service) => {
      if (typeof service === "string") {
        return service;
      }

      return String(service?.servico || service?.nome || "").trim();
    })
    .filter(Boolean);
}

function normalizeOrderAddress(order) {
  const address = order.endereco;

  if (typeof address === "string") {
    return {
      logradouro: address,
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      referencia: "",
      resumo: address,
    };
  }

  const summary = String(address?.resumo || "").trim();

  return {
    logradouro: String(
      address?.logradouro || address?.rua || summary || "",
    ).trim(),

    numero: String(address?.numero || "").trim(),

    complemento: String(address?.complemento || "").trim(),

    bairro: String(address?.bairro || "").trim(),

    cidade: String(address?.cidade || "").trim(),

    uf: String(address?.uf || address?.estado || "").trim(),

    referencia: String(
      address?.referencia || address?.pontoReferencia || "",
    ).trim(),

    resumo: summary,
  };
}

function normalizeOrder(snapshot) {
  const order = snapshot.data();

  const categories =
    Array.isArray(order.categorias) && order.categorias.length
      ? order.categorias
      : [order.categoriaPrincipal].filter(Boolean);

  const observations = order.observacoes || {};

  const servicePhotos = Array.isArray(order.fotos)
    ? order.fotos
    : Array.isArray(order.fotosUrls)
      ? order.fotosUrls
      : [];

  return {
    documentId: snapshot.id,

    id: order.id || snapshot.id,

    codigo: order.codigo || snapshot.id,

    numero: Number(order.numero || 0),

    clienteId: order.clienteUid || order.cliente?.id || "",

    cliente: {
      nome: order.cliente?.nome || "Cliente não identificado",

      telefone: order.cliente?.telefone || "",

      email: order.cliente?.email || "",
    },

    perfilCriador: order.perfilCriador || "cliente",

    tipoAtendimento:
      order.tipoAtendimento ||
      (categories.includes("vistoria") ? "vistoria" : "servico"),

    titulo:
      order.titulo ||
      order.servicoPrincipal ||
      (categories.includes("vistoria")
        ? "Vistoria técnica"
        : "Solicitação de serviço"),

    descricao:
      order.descricao ||
      observations.cliente ||
      "Consulte as informações registradas para este atendimento.",

    categorias: categories,

    servicos: getOrderServices(order),

    status: normalizeStatus(order.status),

    prioridade: normalizePriority(
      order.prioridade || order.vistoria?.prioridade,
    ),

    criadoEm: order.criadoEm || null,

    atualizadoEm: order.atualizadoEm || order.criadoEm || null,

    endereco: normalizeOrderAddress(order),

    atendimento: {
      dataPreferida: order.atendimento?.dataPreferida || "",

      periodo: order.atendimento?.periodo || "",

      horarioPreferido: order.atendimento?.horarioPreferido || "",

      dataConfirmada: order.atendimento?.dataConfirmada || "",

      periodoConfirmado: order.atendimento?.periodoConfirmado || "",

      horarioConfirmado: order.atendimento?.horarioConfirmado || "",
    },

    proposta: order.proposta || null,

    fotos: servicePhotos.filter(
      (photo) => typeof photo === "string" && photo.trim(),
    ),

    quantidadeFotos: Number(order.quantidadeFotos || 0),

    observacaoInternaPublica: String(observations.interna || "").trim(),

    observacoes: {
      cliente: String(observations.cliente || "").trim(),

      resposta: String(observations.resposta || "").trim(),

      interna: "",
    },
  };
}

/* =========================================
   CARREGAMENTO DO FIRESTORE
========================================= */

function combineInternalNotes(privateNote, publicNote) {
  const notes = [
    String(privateNote || "").trim(),
    String(publicNote || "").trim(),
  ].filter(Boolean);

  return [...new Set(notes)].join(" ");
}

async function migrateLegacyInternalObservation(note) {
  if (
    currentSession.role !== "admin" ||
    !note ||
    !currentRequestReference ||
    !currentPrivateRequestReference
  ) {
    return;
  }

  const batch = writeBatch(db);

  batch.set(
    currentPrivateRequestReference,
    {
      ordemId: currentRequest.documentId,
      codigo: currentRequest.codigo,
      observacaoInterna: note,
      atualizadoEm: serverTimestamp(),
    },
    {
      merge: true,
    },
  );

  batch.update(currentRequestReference, {
    "observacoes.interna": "",
  });

  await batch.commit();

  currentRequest.observacaoInternaPublica = "";
}

async function loadRequest() {
  currentRequestReference = doc(db, "ordens", requestId);

  currentPrivateRequestReference = doc(db, "ordensPrivadas", requestId);

  const snapshot = await getDoc(currentRequestReference);

  if (!snapshot.exists()) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  const request = normalizeOrder(snapshot);

  if (
    currentSession.role === "cliente" &&
    request.clienteId !== currentSession.uid
  ) {
    throw new Error("REQUEST_ACCESS_DENIED");
  }

  currentRequest = request;

  if (currentSession.role !== "admin") {
    currentRequest.observacoes.interna = "";
    return;
  }

  const privateSnapshot = await getDoc(currentPrivateRequestReference);

  const privateData = privateSnapshot.exists() ? privateSnapshot.data() : {};

  const privateNote = String(privateData.observacaoInterna || "").trim();

  const legacyPublicNote = String(
    currentRequest.observacaoInternaPublica || "",
  ).trim();

  const finalInternalNote = combineInternalNotes(privateNote, legacyPublicNote);

  currentRequest.observacoes.interna = finalInternalNote;

  if (legacyPublicNote) {
    await migrateLegacyInternalObservation(finalInternalNote);
  }
}

/* =========================================
   HERO
========================================= */

function renderHero() {
  const status =
    statusConfig[currentRequest.status] || statusConfig["nova-solicitacao"];

  document.title = `${currentRequest.codigo} | Salvateck`;

  requestCode.textContent = currentRequest.codigo;

  requestStatus.className = "details-hero__status";

  requestStatus.classList.add(status.classe);

  requestStatus.textContent = status.nome;

  requestTitle.textContent = currentRequest.titulo;

  requestDescription.textContent = currentRequest.descricao;

  requestCreatedAt.textContent = `Criada em ${formatDateTime(
    currentRequest.criadoEm,
  )}`;

  requestLastUpdate.textContent = `Atualizada em ${formatDateTime(
    currentRequest.atualizadoEm,
  )}`;
}

/* =========================================
   LINHA DO TEMPO
========================================= */

function renderTimeline() {
  timelineItems.forEach((item) => {
    item.classList.remove("is-completed", "is-active");
  });

  const items = Array.from(timelineItems);

  if (currentRequest.status === "nova-solicitacao") {
    items[0]?.classList.add("is-completed");

    items[1]?.classList.add("is-active");

    return;
  }

  if (currentRequest.status === "em-analise") {
    items[0]?.classList.add("is-completed");

    items[1]?.classList.add("is-active");

    return;
  }

  if (currentRequest.status === "aguardando-confirmacao") {
    items[0]?.classList.add("is-completed");

    items[1]?.classList.add("is-completed");

    items[2]?.classList.add("is-active");

    return;
  }

  if (currentRequest.status === "agendada") {
    items.forEach((item) => {
      item.classList.add("is-completed");
    });

    return;
  }

  items[0]?.classList.add("is-completed");
}

/* =========================================
   CLIENTE
========================================= */

function renderClient() {
  const client = currentRequest.cliente;

  clientAvatar.textContent = getInitials(client.nome);

  clientName.textContent = client.nome;

  clientPhone.textContent = client.telefone || "Telefone não informado";

  clientPhone.href = client.telefone
    ? `tel:${client.telefone.replace(/\D/g, "")}`
    : "#";

  clientEmail.textContent = client.email || "E-mail não informado";

  clientEmail.href = client.email ? `mailto:${client.email}` : "#";
}

/* =========================================
   SERVIÇOS
========================================= */

function renderServices() {
  categoryTags.innerHTML = "";

  servicesList.innerHTML = "";

  currentRequest.categorias.forEach((category) => {
    const tag = document.createElement("span");

    tag.className = "category-tag";

    tag.textContent = categoriaConfig[category] || category;

    categoryTags.appendChild(tag);
  });

  currentRequest.servicos.forEach((service) => {
    const item = document.createElement("article");

    item.className = "service-item";

    item.innerHTML = `
        <span class="service-item__check">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M5 12l4 4L19 6"></path>
          </svg>
        </span>

        <span>${service}</span>
      `;

    servicesList.appendChild(item);
  });
}

/* =========================================
   ENDEREÇO
========================================= */

function renderAddress() {
  const address = currentRequest.endereco || {};

  const mainAddress = [address.logradouro, address.numero]
    .filter(Boolean)
    .join(", ");

  const cityAndState = [address.cidade, address.uf].filter(Boolean).join("/");

  addressMain.textContent =
    mainAddress || address.resumo || "Endereço não informado";

  addressComplement.textContent = address.complemento || "Sem complemento";

  addressCity.textContent =
    [address.bairro, cityAndState].filter(Boolean).join(" — ") ||
    "Cidade não informada";

  addressReference.textContent =
    address.referencia || "Referência não informada";
}

function buildFullAddress() {
  const address = currentRequest.endereco || {};

  return [
    address.logradouro,
    address.numero,
    address.complemento,
    address.bairro,
    address.cidade,
    address.uf,
  ]
    .filter(Boolean)
    .join(", ");
}

/* =========================================
   AGENDA
========================================= */

function renderConfirmedSchedule() {
  const attendance = currentRequest.atendimento || {};

  const hasConfirmedSchedule = Boolean(
    attendance.dataConfirmada &&
    attendance.periodoConfirmado &&
    attendance.horarioConfirmado,
  );

  confirmedScheduleCard.hidden = !hasConfirmedSchedule;

  if (!hasConfirmedSchedule) {
    confirmedDate.textContent = "--";
    confirmedPeriod.textContent = "--";
    confirmedTime.textContent = "--";

    confirmedScheduleMessageBox.hidden = true;

    return;
  }

  confirmedDate.textContent = formatDate(attendance.dataConfirmada);

  confirmedPeriod.textContent =
    periodoConfig[attendance.periodoConfirmado] || "Período não informado";

  confirmedTime.textContent = attendance.horarioConfirmado;

  const message = currentRequest.observacoes?.resposta || "";

  confirmedScheduleMessageBox.hidden = !message;

  confirmedScheduleMessage.textContent =
    message || "Atendimento confirmado pela Salvateck.";
}

/* =========================================
   FOTOS
========================================= */

function openPhoto(photo) {
  const link = document.createElement("a");

  link.href = photo;

  link.target = "_blank";

  link.rel = "noopener noreferrer";

  document.body.appendChild(link);

  link.click();

  link.remove();
}

function renderPhotos() {
  requestPhotos.innerHTML = "";

  const photos = currentRequest.fotos || [];

  const noPhotos = photos.length === 0;

  requestPhotos.hidden = noPhotos;

  photosEmpty.hidden = !noPhotos;

  photos.forEach((photo, index) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className = "request-photo";

    button.setAttribute("aria-label", `Ampliar foto ${index + 1}`);

    const image = document.createElement("img");

    image.src = photo;

    image.alt = `Foto ${index + 1} da solicitação`;

    button.appendChild(image);

    button.addEventListener("click", () => openPhoto(photo));

    requestPhotos.appendChild(button);
  });
}

/* =========================================
   OBSERVAÇÕES
========================================= */

function renderObservations() {
  const observations = currentRequest.observacoes;

  clientObservation.textContent =
    observations.cliente || "Nenhuma observação informada.";

  const hasResponse = Boolean(observations.resposta);

  responseObservationBox.hidden = !hasResponse;

  responseObservation.textContent =
    observations.resposta || "Nenhuma resposta adicionada.";

  internalObservation.textContent =
    observations.interna || "Nenhuma observação interna registrada.";
}

/* =========================================
   PRIORIDADE
========================================= */

function syncPriority() {
  priorityInputs.forEach((input) => {
    const selected = input.value === currentRequest.prioridade;

    input.checked = selected;

    input
      .closest(".priority-option")
      ?.classList.toggle("is-selected", selected);
  });
}

/* =========================================
   PERFIL
========================================= */

function renderProfile() {
  const isAdmin = currentSession.role === "admin";

  body.dataset.profile = currentSession.role;

  adminOnlyElements.forEach((element) => {
    element.hidden = !isAdmin;
  });

  adminVisibleElements.forEach((element) => {
    element.hidden = !isAdmin;
  });

  clientOnlyElements.forEach((element) => {
    element.hidden = isAdmin;
  });

  const finalStatus = ["agendada", "recusada", "cancelada"].includes(
    currentRequest.status,
  );

  priorityCard.hidden = !isAdmin;

  adminActionsCard.hidden = !isAdmin || finalStatus;

  clientActionsCard.hidden =
    isAdmin || ["recusada", "cancelada"].includes(currentRequest.status);

  internalObservationBox.hidden = !isAdmin;

  backButton.href = returnPage;
}

/* =========================================
   RENDERIZAÇÃO
========================================= */

function renderAll() {
  renderHero();

  renderTimeline();

  renderClient();

  renderServices();

  renderAddress();

  renderConfirmedSchedule();

  renderPhotos();

  renderObservations();

  syncPriority();

  renderProfile();
}

/* =========================================
   GRAVAÇÃO NO FIRESTORE
========================================= */

function handleSaveError(error) {
  console.error("[Detalhes] Não foi possível salvar a alteração:", error);

  if (error.code === "permission-denied") {
    showFeedback(
      "O Firebase bloqueou esta alteração. Verifique as regras publicadas.",
    );

    return;
  }

  if (error.code === "unavailable") {
    showFeedback("Não foi possível acessar o Firebase. Verifique sua conexão.");

    return;
  }

  showFeedback("Não foi possível salvar a alteração.");
}

async function saveChanges(changes, successMessage, privateChanges = null) {
  if (savingChanges || !currentRequestReference) {
    return;
  }

  savingChanges = true;

  try {
    const batch = writeBatch(db);

    batch.update(currentRequestReference, {
      ...changes,

      atualizadoEm: serverTimestamp(),

      statusAtualizadoEm: serverTimestamp(),
    });

    if (
      privateChanges &&
      currentSession.role === "admin" &&
      currentPrivateRequestReference
    ) {
      batch.set(
        currentPrivateRequestReference,
        {
          ordemId: currentRequest.documentId,
          codigo: currentRequest.codigo,

          ...privateChanges,

          atualizadoEm: serverTimestamp(),
        },
        {
          merge: true,
        },
      );
    }

    await batch.commit();

    await loadRequest();

    closeActionForms();

    renderAll();

    showFeedback(successMessage);
  } catch (error) {
    handleSaveError(error);

    throw error;
  } finally {
    savingChanges = false;
  }
}

/* =========================================
   ALTERAR PRIORIDADE
========================================= */

async function changePriority(value) {
  if (currentSession.role !== "admin" || !prioridadeConfig[value]) {
    return;
  }

  try {
    await saveChanges(
      {
        prioridade: value,
      },

      `Prioridade alterada para ${prioridadeConfig[value]}.`,
    );
  } catch (error) {
    syncPriority();
  }
}

/* =========================================
   FORMULÁRIOS
========================================= */

function fillAcceptForm() {
  const attendance = currentRequest.atendimento;

  acceptDate.value =
    currentRequest.proposta?.data || attendance.dataPreferida || "";

  acceptPeriod.value =
    currentRequest.proposta?.periodo || attendance.periodo || "";

  acceptTime.value =
    currentRequest.proposta?.horario || attendance.horarioPreferido || "";
}

/* =========================================
   MODAL
========================================= */

function openModal({
  title,
  description,
  confirmationText = "Confirmar",
  danger = false,
  confirm,
}) {
  modalCallback = confirm;

  confirmationTitle.textContent = title;

  confirmationDescription.textContent = description;

  confirmModalButton.textContent = confirmationText;

  if (danger) {
    confirmModalButton.style.backgroundColor = "#963333";

    confirmModalButton.style.color = "#F9F9F9";

    confirmModalButton.style.borderColor = "#963333";
  } else {
    confirmModalButton.style.backgroundColor = "#0D3861";

    confirmModalButton.style.color = "#DD9A17";

    confirmModalButton.style.borderColor = "rgba(221, 154, 23, 0.42)";
  }

  confirmationModal.hidden = false;

  document.body.style.overflow = "hidden";

  confirmModalButton.focus();
}

function closeModal() {
  confirmationModal.hidden = true;

  document.body.style.overflow = "";

  modalCallback = null;
}

/* =========================================
   ACEITAR SOLICITAÇÃO
========================================= */

function submitAccept(event) {
  event.preventDefault();

  if (!acceptForm.checkValidity()) {
    acceptForm.reportValidity();

    return;
  }

  openModal({
    title: "Confirmar agendamento",

    description: "A solicitação será aceita e o atendimento entrará na agenda.",

    confirmationText: "Confirmar agendamento",

    confirm: async () => {
      const attendance = {
        ...currentRequest.atendimento,

        dataConfirmada: acceptDate.value,

        periodoConfirmado: acceptPeriod.value,

        horarioConfirmado: acceptTime.value,
      };

      const observations = {
        cliente: currentRequest.observacoes.cliente,

        resposta: acceptMessage.value.trim() || "Sua solicitação foi aceita.",

        interna: "",
      };

      await saveChanges(
        {
          status: "agendada",

          atendimento: attendance,

          observacoes: observations,
        },

        "Solicitação aceita e atendimento agendado.",
      );
    },
  });
}

/* =========================================
   RECUSAR SOLICITAÇÃO
========================================= */

function submitRejection(event) {
  event.preventDefault();

  if (!rejectForm.checkValidity()) {
    rejectForm.reportValidity();

    return;
  }

  const reason =
    rejectReason.selectedOptions[0]?.textContent.trim() ||
    "Motivo não informado";

  openModal({
    title: "Recusar solicitação",

    description:
      "A solicitação será encerrada e o cliente receberá a mensagem informada.",

    confirmationText: "Confirmar recusa",

    danger: true,

    confirm: async () => {
      const rejectionNote = `Motivo da recusa: ${reason}.`;

      const previousInternalNote = String(
        currentRequest.observacoes.interna || "",
      ).trim();

      const finalInternalNote = previousInternalNote
        ? `${previousInternalNote} ${rejectionNote}`
        : rejectionNote;

      await saveChanges(
        {
          status: "recusada",

          observacoes: {
            cliente: currentRequest.observacoes.cliente,

            resposta: rejectMessage.value.trim(),

            interna: "",
          },
        },

        "Solicitação recusada.",

        {
          observacaoInterna: finalInternalNote,
        },
      );
    },
  });
}

/* =========================================
   CANCELAMENTO
========================================= */

function cancelRequest() {
  openModal({
    title: "Cancelar solicitação",

    description:
      "Esta solicitação será encerrada. Confirme apenas se realmente deseja cancelar.",

    confirmationText: "Cancelar solicitação",

    danger: true,

    confirm: async () => {
      await saveChanges(
        {
          status: "cancelada",

          observacoes: {
            cliente: currentRequest.observacoes.cliente,

            resposta: "A solicitação foi cancelada pelo cliente.",

            interna: currentRequest.observacaoInternaPublica || "",
          },
        },

        "Solicitação cancelada.",
      );
    },
  });
}

/* =========================================
   MAPA E CLIENTE
========================================= */

function openAddressInMap() {
  const address = encodeURIComponent(buildFullAddress());

  const url = `https://www.google.com/maps/search/?api=1&query=${address}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

function openClientRegistration() {
  const parameters = new URLSearchParams();

  if (currentRequest.clienteId) {
    parameters.set("cliente", currentRequest.clienteId);
  }

  window.location.href = `clientes.html?${parameters.toString()}`;
}

/* =========================================
   EVENTOS
========================================= */

priorityInputs.forEach((input) => {
  input.addEventListener("change", () => {
    changePriority(input.value);
  });
});

acceptRequestButton.addEventListener("click", () => {
  fillAcceptForm();

  openActionForm(acceptForm);
});

rejectRequestButton.addEventListener("click", () => {
  openActionForm(rejectForm);
});

closeActionButtons.forEach((button) => {
  button.addEventListener("click", closeActionForms);
});

acceptForm.addEventListener("submit", submitAccept);

rejectForm.addEventListener("submit", submitRejection);

cancelRequestButton.addEventListener("click", cancelRequest);

openMapButton.addEventListener("click", openAddressInMap);

openClientButton.addEventListener("click", openClientRegistration);

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

confirmModalButton.addEventListener("click", async () => {
  const callback = modalCallback;

  if (typeof callback !== "function" || savingChanges) {
    return;
  }

  const originalText = confirmModalButton.textContent;

  confirmModalButton.disabled = true;

  confirmModalButton.textContent = "Salvando...";

  try {
    await callback();

    closeModal();
  } catch (error) {
    console.warn("[Detalhes] A ação não foi concluída.", error);
  } finally {
    confirmModalButton.disabled = false;

    confirmModalButton.textContent = originalText;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !confirmationModal.hidden) {
    closeModal();

    return;
  }

  if (event.key === "Escape" && confirmationModal.hidden) {
    closeActionForms();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function initializePage() {
  try {
    currentSession = await window.salvateckSessionReady;

    if (!requestId) {
      throw new Error("REQUEST_ID_NOT_FOUND");
    }

    const minimumDate = getLocalDate();

    acceptDate.min = minimumDate;

    await loadRequest();

    renderAll();

    detailsShell.hidden = false;
  } catch (error) {
    console.error("[Detalhes] Não foi possível carregar a solicitação:", error);

    if (error.message === "REQUEST_NOT_FOUND") {
      window.alert("Esta solicitação não foi encontrada.");
    } else if (
      error.message === "REQUEST_ACCESS_DENIED" ||
      error.code === "permission-denied"
    ) {
      window.alert("Você não possui permissão para acessar esta solicitação.");
    } else if (error.message === "REQUEST_ID_NOT_FOUND") {
      window.alert("O identificador da solicitação não foi informado.");
    } else {
      window.alert("Não foi possível carregar os detalhes da solicitação.");
    }

    window.location.replace(returnPage);
  }
}

initializePage();
