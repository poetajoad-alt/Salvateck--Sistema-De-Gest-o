import "./auth-guard.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import { db, storage } from "./firebase-config.js";

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

  concluida: {
    nome: "Concluída",
    classe: "status--concluida",
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

/* Condomínio */

const condominiumCard = document.getElementById("condominium-card");

const condominiumCode = document.getElementById("condominium-code");

const condominiumName = document.getElementById("condominium-name");

const condominiumCnpj = document.getElementById("condominium-cnpj");

const condominiumDescription = document.getElementById(
  "condominium-description",
);

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

const photoLimitSummary = document.getElementById("photo-limit-summary");

const photoManagement = document.getElementById("photo-management");

const photoAvailableSlots = document.getElementById("photo-available-slots");

const additionalPhotosInput = document.getElementById(
  "additional-photos-input",
);

const additionalPhotoUploadLabel = additionalPhotosInput?.closest(
  ".additional-photo-upload",
);

const additionalPhotoStatus = document.getElementById(
  "additional-photo-status",
);

const additionalPhotoCount = document.getElementById("additional-photo-count");

const additionalPhotoProcessing = document.getElementById(
  "additional-photo-processing",
);

const additionalPhotoError = document.getElementById("additional-photo-error");

const additionalPhotoPreview = document.getElementById(
  "additional-photo-preview",
);

const uploadAdditionalPhotosButton = document.getElementById(
  "upload-additional-photos-button",
);

const photoLockedMessage = document.getElementById("photo-locked-message");

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

/* Responsabilidade técnica */

const technicalResponsibilityCard = document.getElementById(
  "technical-responsibility-card",
);

const technicalResponsibilityForm = document.getElementById(
  "technical-responsibility-form",
);

const technicalResponsibleName = document.getElementById(
  "technical-responsible-name",
);

const technicalCrea = document.getElementById("technical-crea");

const technicalTrt = document.getElementById("technical-trt");

const saveTechnicalResponsibilityButton = document.getElementById(
  "save-technical-responsibility-button",
);

/* Valor da OS */

const orderValueCard = document.getElementById("order-value-card");

const orderValueForm = document.getElementById("order-value-form");

const orderValue = document.getElementById("order-value");

const saveOrderValueButton = document.getElementById("save-order-value-button");

/* Funcionário responsável */

const employeeAssignmentCard = document.getElementById(
  "employee-assignment-card",
);

const employeeAssignmentForm = document.getElementById(
  "employee-assignment-form",
);

const assignedEmployee = document.getElementById("assigned-employee");

const employeeAssignmentStatus = document.getElementById(
  "employee-assignment-status",
);

const saveEmployeeAssignmentButton = document.getElementById(
  "save-employee-assignment-button",
);

/* Prioridade */

const priorityInputs = document.querySelectorAll('input[name="prioridade"]');

const priorityCard = document.getElementById("priority-card");

/* Ações administrativas */

const adminActionsCard = document.getElementById("admin-actions-card");

const acceptRequestButton = document.getElementById("accept-request-button");

const confirmScheduleButton = document.getElementById(
  "confirm-schedule-button",
);

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
/* Ações da OS agendada */

const scheduledActionsCard = document.getElementById("scheduled-actions-card");

const scheduledWhatsAppButton = document.getElementById(
  "scheduled-whatsapp-button",
);

const rescheduleRequestButton = document.getElementById(
  "reschedule-request-button",
);

const startInspectionButton = document.getElementById(
  "start-inspection-button",
);

const completeRequestButton = document.getElementById(
  "complete-request-button",
);

const adminCancelRequestButton = document.getElementById(
  "admin-cancel-request-button",
);

const rescheduleForm = document.getElementById("reschedule-form");

actionForms.push(rescheduleForm);

const rescheduleDate = document.getElementById("reschedule-date");

const reschedulePeriod = document.getElementById("reschedule-period");

const rescheduleTime = document.getElementById("reschedule-time");

const rescheduleMessage = document.getElementById("reschedule-message");
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
/* Documento final */

const finalDocumentCard = document.getElementById("final-document-card");

const finalDocumentStatusTitle = document.getElementById(
  "final-document-status-title",
);

const finalDocumentStatusMessage = document.getElementById(
  "final-document-status-message",
);

const finalDocumentCode = document.getElementById("final-document-code");

const finalDocumentService = document.getElementById("final-document-service");

const finalDocumentClient = document.getElementById("final-document-client");

const finalDocumentCondominium = document.getElementById(
  "final-document-condominium",
);

const finalDocumentCondominiumCnpj = document.getElementById(
  "final-document-condominium-cnpj",
);

const finalDocumentDate = document.getElementById("final-document-date");

const finalDocumentResponsible = document.getElementById(
  "final-document-responsible",
);

const finalDocumentTechnicalResponsible = document.getElementById(
  "final-document-technical-responsible",
);

const finalDocumentCrea = document.getElementById("final-document-crea");

const finalDocumentTrt = document.getElementById("final-document-trt");

const finalInspectionBlock = document.getElementById("final-inspection-block");

const finalInspectionCode = document.getElementById("final-inspection-code");

const finalInspectionTechnician = document.getElementById(
  "final-inspection-technician",
);

const finalInspectionDate = document.getElementById("final-inspection-date");

const finalInspectionEvaluated = document.getElementById(
  "final-inspection-evaluated",
);

const finalInspectionNonconformities = document.getElementById(
  "final-inspection-nonconformities",
);

const finalInspectionChecklist = document.getElementById(
  "final-inspection-checklist",
);

const viewFinalDocumentButton = document.getElementById(
  "view-final-document-button",
);

const downloadFinalDocumentButton = document.getElementById(
  "download-final-document-button",
);
/* =========================================
   CONTROLE
========================================= */

const urlParams = new URLSearchParams(window.location.search);

const requestId = String(urlParams.get("id") || "").trim();

const origem = String(urlParams.get("origem") || "").trim();

const condominioRetornoId = String(urlParams.get("condominio") || "").trim();

const returnPage =
  origem === "historico"
    ? condominioRetornoId
      ? `historico.html?condominio=${encodeURIComponent(condominioRetornoId)}`
      : "historico.html"
    : "ordens.html";

let currentSession = null;

let currentRequest = null;

let currentRequestReference = null;

let currentPrivateRequestReference = null;

let assignableEmployees = [];

let modalCallback = null;

let feedbackTimeout;

let savingChanges = false;

let generatingFinalPdf = false;

let finalPdfLogoPromise = null;

let selectedAdditionalPhotos = [];

let processingAdditionalPhotos = false;

let uploadingAdditionalPhotos = false;

let photoActionInProgress = false;

let photoRenderVersion = 0;

const maxOrderPhotos = 6;

const maxOriginalPhotoSize = 10 * 1024 * 1024;

const targetCompressedPhotoSize = 1 * 1024 * 1024;

const maxCompressedPhotoSize = 2 * 1024 * 1024;

const maxPhotoDimension = 1920;

const acceptedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const statusesThatAllowPhotos = new Set([
  "nova-solicitacao",
  "em-analise",
  "aguardando-confirmacao",
  "agendada",
]);

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

    concluida: "concluida",

    concluido: "concluida",

    finalizada: "concluida",

    finalizado: "concluida",

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
function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}

function formatWhatsAppTime(value) {
  const time = String(value || "").trim();

  if (!time) {
    return "horário não informado";
  }

  const match = time.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return time;
  }

  return `${match[1].padStart(2, "0")}h${match[2]}`;
}

function getWhatsAppCondominiumName(condominium = currentRequest?.condominio) {
  const name = String(condominium?.nome || "").trim();

  if (!name) {
    return "Condomínio não informado";
  }

  return /^condom[ií]nio\b/i.test(name) ? name : `Condomínio ${name}`;
}

function buildScheduleWhatsAppMessage({
  introduction,
  date,
  period,
  time,
  requiresConfirmation = false,
}) {
  const clientName =
    String(currentRequest.cliente?.nome || "").trim() || "cliente";

  const periodName =
    periodoConfig[period] ||
    String(period || "").trim() ||
    "Período não informado";

  const messageLines = [
    `Olá, ${clientName}!`,
    "",
    introduction || "Temos um horário disponível para o seu atendimento.",
    "",
    `OS: ${currentRequest.codigo}`,
    `Serviço: ${currentRequest.titulo}`,
    `Data: ${formatDate(date)}`,
    `Horário: ${formatWhatsAppTime(time)} (${periodName})`,
    `Local: ${getWhatsAppCondominiumName()}`,
  ];

  if (requiresConfirmation) {
    messageLines.push(
      "",
      "Por favor, confirme se o horário funciona para você.",
    );
  }

  messageLines.push("", "Agradecemos a confiança!");

  return messageLines.join("\n");
}

function buildProposalWhatsAppMessage() {
  return buildScheduleWhatsAppMessage({
    introduction:
      acceptMessage.value.trim() ||
      "Temos um horário disponível para o seu atendimento.",

    date: acceptDate.value,

    period: acceptPeriod.value,

    time: acceptTime.value,

    requiresConfirmation: true,
  });
}

function buildScheduledWhatsAppMessage() {
  const attendance = currentRequest.atendimento || {};

  return buildScheduleWhatsAppMessage({
    introduction: "Seu atendimento está agendado:",

    date: attendance.dataConfirmada,

    period: attendance.periodoConfirmado,

    time: attendance.horarioConfirmado,

    requiresConfirmation: false,
  });
}

function contactScheduledClient() {
  openWhatsApp(buildScheduledWhatsAppMessage());
}
function openWhatsApp(message, popupWindow = null) {
  const phone = normalizeWhatsAppPhone(currentRequest.cliente?.telefone);

  if (!phone) {
    popupWindow?.close();

    showFeedback(
      "A proposta foi salva, mas o cliente não possui telefone cadastrado.",
    );

    return;
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (popupWindow && !popupWindow.closed) {
    popupWindow.location.href = url;

    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
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

    valorSalvateck: Number(order.valorSalvateck || 0),

    clienteId: order.clienteUid || order.cliente?.id || "",

    cliente: {
      nome: order.cliente?.nome || "Cliente não identificado",

      telefone: order.cliente?.telefone || "",

      email: order.cliente?.email || "",
    },

    condominio: {
      id: String(order.condominio?.id || order.condominioId || "").trim(),

      codigo: String(order.condominio?.codigo || "").trim(),

      nome: String(order.condominio?.nome || "").trim(),

      cnpj: String(order.condominio?.cnpj || order.condominioCnpj || "").trim(),
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

    concluidaEm: order.concluidaEm || null,

    concluidaPorUid: String(order.concluidaPorUid || "").trim(),

    concluidaPorNome: String(order.concluidaPorNome || "").trim(),

    documentoFinal: order.documentoFinal || null,

    funcionarioResponsavelUid: String(
      order.funcionarioResponsavelUid ||
        order.funcionarioResponsavel?.usuarioUid ||
        "",
    ).trim(),

    funcionarioResponsavel:
      order.funcionarioResponsavel &&
      typeof order.funcionarioResponsavel === "object"
        ? {
            funcionarioId: String(
              order.funcionarioResponsavel.funcionarioId || "",
            ).trim(),

            usuarioUid: String(
              order.funcionarioResponsavel.usuarioUid || "",
            ).trim(),

            codigo: String(order.funcionarioResponsavel.codigo || "").trim(),

            nome: String(order.funcionarioResponsavel.nome || "").trim(),

            cargo: String(order.funcionarioResponsavel.cargo || "").trim(),

            designadoEm: order.funcionarioResponsavel.designadoEm || null,

            designadoPorUid: String(
              order.funcionarioResponsavel.designadoPorUid || "",
            ).trim(),

            designadoPorNome: String(
              order.funcionarioResponsavel.designadoPorNome || "",
            ).trim(),
          }
        : null,

    responsabilidadeTecnica: {
      nome: String(order.responsabilidadeTecnica?.nome || "").trim(),

      crea: String(order.responsabilidadeTecnica?.crea || "").trim(),

      trt: String(order.responsabilidadeTecnica?.trt || "").trim(),

      atualizadoPorUid: String(
        order.responsabilidadeTecnica?.atualizadoPorUid || "",
      ).trim(),

      atualizadoEm: order.responsabilidadeTecnica?.atualizadoEm || null,
    },

    vistoria:
      order.vistoria && typeof order.vistoria === "object"
        ? {
            ...order.vistoria,

            id: String(
              order.vistoria.id || order.vistoria.vistoriaId || "",
            ).trim(),

            codigo: String(
              order.vistoria.codigo || order.vistoria.codigoVistoria || "",
            ).trim(),

            status: String(order.vistoria.status || "solicitada").trim(),

            validada: order.vistoria.validada === true,

            progresso: Number(order.vistoria.progresso || 0),
          }
        : null,

    endereco: normalizeOrderAddress(order),

    atendimento: {
      dataPreferida: order.atendimento?.dataPreferida || "",

      periodo: order.atendimento?.periodo || "",

      horarioPreferido: order.atendimento?.horarioPreferido || "",

      dataConfirmada: order.atendimento?.dataConfirmada || "",

      periodoConfirmado: order.atendimento?.periodoConfirmado || "",

      horarioConfirmado: order.atendimento?.horarioConfirmado || "",

      modo: order.atendimento?.modo || "",
    },

    proposta: order.proposta || null,

    agendaGoogle: {
      eventId: String(order.agendaGoogle?.eventId || "").trim(),
      status: String(order.agendaGoogle?.status || "").trim(),
      ultimaAcao: String(order.agendaGoogle?.ultimaAcao || "").trim(),
      sincronizadoEm: order.agendaGoogle?.sincronizadoEm || null,
      erro: String(order.agendaGoogle?.erro || "").trim(),
    },

    fotos: servicePhotos
      .map((photo, index) => {
        if (typeof photo === "string") {
          const url = photo.trim();

          if (!url) {
            return null;
          }

          return {
            url,

            storagePath: "",

            nome: `foto-${index + 1}`,

            posicao: index + 1,

            tamanho: 0,

            enviadoPorUid: "",

            enviadoPorPerfil: "",

            enviadoEm: "",
          };
        }

        if (!photo || typeof photo !== "object") {
          return null;
        }

        const storagePath = String(photo.storagePath || "").trim();

        const url = String(
          photo.url || photo.downloadURL || photo.downloadUrl || "",
        ).trim();

        if (!storagePath && !url) {
          return null;
        }

        return {
          ...photo,

          storagePath,

          url,

          nome: String(
            photo.nome || photo.nomeOriginal || `foto-${index + 1}`,
          ).trim(),

          posicao: Number(photo.posicao || index + 1),

          tamanho: Number(photo.tamanho || 0),

          enviadoPorUid: String(photo.enviadoPorUid || "").trim(),

          enviadoPorPerfil: String(photo.enviadoPorPerfil || "").trim(),

          enviadoEm: photo.enviadoEm || "",
        };
      })
      .filter(Boolean)
      .sort((photoA, photoB) => photoA.posicao - photoB.posicao),

    quantidadeFotos: Number(order.quantidadeFotos || servicePhotos.length || 0),

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
   FUNCIONÁRIO RESPONSÁVEL
========================================= */

async function loadAssignableEmployees() {
  if (currentSession.role !== "admin") {
    assignableEmployees = [];

    return;
  }

  const snapshot = await getDocs(collection(db, "funcionarios"));

  assignableEmployees = snapshot.docs
    .map((employeeSnapshot) => {
      const employee = employeeSnapshot.data();

      return {
        documentId: employeeSnapshot.id,

        codigo: String(employee.codigo || "").trim(),

        nome: String(employee.nome || "").trim(),

        cargo: String(employee.cargo || "").trim(),

        usuarioUid: String(employee.usuarioUid || "").trim(),

        ativo:
          employee.ativo === true &&
          String(employee.status || "ativo").trim() !== "inativo",
      };
    })
    .filter((employee) => employee.ativo && employee.usuarioUid)
    .sort((employeeA, employeeB) =>
      employeeA.nome.localeCompare(employeeB.nome, "pt-BR", {
        sensitivity: "base",
      }),
    );
}

function renderEmployeeAssignment() {
  assignedEmployee.replaceChildren();

  const emptyOption = document.createElement("option");

  emptyOption.value = "";

  emptyOption.textContent = "Sem funcionário designado";

  assignedEmployee.appendChild(emptyOption);

  const currentUid = String(
    currentRequest.funcionarioResponsavelUid || "",
  ).trim();

  let currentEmployeeFound = false;

  assignableEmployees.forEach((employee) => {
    const option = document.createElement("option");

    option.value = employee.usuarioUid;

    const employeeLabel =
      [employee.codigo, employee.nome].filter(Boolean).join(" — ") ||
      "Funcionário";

    option.textContent = employee.cargo
      ? `${employeeLabel} · ${employee.cargo}`
      : employeeLabel;

    if (employee.usuarioUid === currentUid) {
      currentEmployeeFound = true;
    }

    assignedEmployee.appendChild(option);
  });

  if (currentUid && !currentEmployeeFound) {
    const currentEmployee = currentRequest.funcionarioResponsavel || {};

    const option = document.createElement("option");

    option.value = currentUid;

    option.textContent =
      [currentEmployee.codigo, currentEmployee.nome]
        .filter(Boolean)
        .join(" — ") || "Funcionário anteriormente designado";

    assignedEmployee.appendChild(option);
  }

  assignedEmployee.value = currentUid;

  if (currentUid) {
    const currentEmployee = currentRequest.funcionarioResponsavel || {};

    const employeeLabel =
      [currentEmployee.codigo, currentEmployee.nome]
        .filter(Boolean)
        .join(" — ") || "Funcionário designado";

    employeeAssignmentStatus.textContent = `Designado atualmente: ${employeeLabel}.`;

    return;
  }

  employeeAssignmentStatus.textContent =
    assignableEmployees.length > 0
      ? "Nenhum funcionário foi designado para esta OS."
      : "Nenhum funcionário ativo com acesso ao sistema está disponível para designação.";
}

async function saveEmployeeAssignment(event) {
  event.preventDefault();

  const isFinalStatus = ["concluida", "recusada", "cancelada"].includes(
    currentRequest.status,
  );

  if (currentSession.role !== "admin" || isFinalStatus) {
    return;
  }

  const selectedUid = String(assignedEmployee.value || "").trim();

  const currentUid = String(
    currentRequest.funcionarioResponsavelUid || "",
  ).trim();

  if (selectedUid === currentUid) {
    showFeedback(
      selectedUid
        ? "Este funcionário já está designado para a OS."
        : "Esta OS já está sem funcionário designado.",
    );

    return;
  }

  const originalText = saveEmployeeAssignmentButton.textContent;

  saveEmployeeAssignmentButton.disabled = true;

  saveEmployeeAssignmentButton.textContent = "Salvando...";

  try {
    if (!selectedUid) {
      await saveChanges(
        {
          funcionarioResponsavelUid: "",

          funcionarioResponsavel: null,
        },
        "Funcionário removido da OS.",
      );

      return;
    }

    const employee = assignableEmployees.find(
      (item) => item.usuarioUid === selectedUid,
    );

    if (!employee) {
      showFeedback(
        "O funcionário selecionado não está disponível para designação.",
      );

      return;
    }

    const designatedByName = String(
      currentSession.profile?.nome ||
        currentSession.user?.displayName ||
        currentSession.email ||
        "Administrador",
    ).trim();

    await saveChanges(
      {
        funcionarioResponsavelUid: employee.usuarioUid,

        funcionarioResponsavel: {
          funcionarioId: employee.documentId,

          usuarioUid: employee.usuarioUid,

          codigo: employee.codigo,

          nome: employee.nome,

          cargo: employee.cargo,

          designadoEm: serverTimestamp(),

          designadoPorUid: currentSession.uid,

          designadoPorNome: designatedByName,
        },
      },
      "Funcionário responsável designado para a OS.",
    );
  } finally {
    saveEmployeeAssignmentButton.disabled = false;

    saveEmployeeAssignmentButton.textContent = originalText;
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
    items[0]?.classList.add("is-completed");
    items[1]?.classList.add("is-completed");
    items[2]?.classList.add("is-completed");
    items[3]?.classList.add("is-completed");
    items[4]?.classList.add("is-active");

    return;
  }

  if (currentRequest.status === "concluida") {
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

function getCondominiumLabel(condominium = {}) {
  return (
    [
      String(condominium.codigo || "").trim(),
      String(condominium.nome || "").trim(),
    ]
      .filter(Boolean)
      .join(" — ") || "Não vinculado"
  );
}

function getServiceDescriptionText(value) {
  return String(value || "")
    .replace(/^Descrição do serviço:\s*/i, "")
    .trim();
}

function renderCondominium() {
  const condominium = currentRequest.condominio || {};

  const hasCondominium = Boolean(
    condominium.id || condominium.codigo || condominium.nome,
  );

  condominiumCard.hidden = !hasCondominium;

  if (!hasCondominium) {
    condominiumCode.textContent = "";
    condominiumName.textContent = "";
    condominiumCnpj.textContent = "";
    condominiumDescription.textContent = "";

    return;
  }

  condominiumCode.hidden = !condominium.codigo;

  condominiumCode.textContent = condominium.codigo || "";

  condominiumName.textContent = condominium.nome || "Condomínio vinculado";

  condominiumCnpj.textContent = condominium.cnpj
    ? `CNPJ: ${condominium.cnpj}`
    : "CNPJ não informado";

  condominiumDescription.textContent =
    "Ativo principal vinculado a esta ordem de serviço.";
}

/* =========================================
   SERVIÇOS
========================================= */

function renderServices() {
  categoryTags.innerHTML = "";
  servicesList.innerHTML = "";

  categoryTags.hidden = true;

  const serviceType =
    currentRequest.tipoAtendimento === "vistoria"
      ? "Vistoria técnica"
      : "Manutenção geral";

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

    <span>${serviceType}</span>
  `;

  servicesList.appendChild(item);
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

function formatPhotoSize(size) {
  const value = Number(size || 0);

  if (value < 1024) {
    return `${value} bytes`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function createCompressedPhotoName(originalName) {
  const baseName = String(originalName || "imagem")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "imagem"}.webp`;
}

function orderAllowsPhotoChanges() {
  if (!currentRequest) {
    return false;
  }

  return (
    statusesThatAllowPhotos.has(currentRequest.status) &&
    !currentRequest.documentoFinal
  );
}

function getStoredPhotos() {
  return Array.isArray(currentRequest?.fotos) ? currentRequest.fotos : [];
}

function getAvailablePhotoSlots() {
  return Math.max(0, maxOrderPhotos - getStoredPhotos().length);
}

function serializePhotoForFirestore(photo) {
  return {
    storagePath: String(photo?.storagePath || "").trim(),

    nome: String(photo?.nome || "imagem.webp").trim(),

    contentType: String(photo?.contentType || "image/webp").trim(),

    tamanho: Number(photo?.tamanho || 0),

    posicao: Number(photo?.posicao || 0),

    enviadoPorUid: String(photo?.enviadoPorUid || "").trim(),

    enviadoPorPerfil: String(photo?.enviadoPorPerfil || "").trim(),

    enviadoEm: photo?.enviadoEm || "",
  };
}

function openPhoto(photoUrl) {
  const finalUrl = String(photoUrl || "").trim();

  if (!finalUrl) {
    return;
  }

  const link = document.createElement("a");

  link.href = finalUrl;

  link.target = "_blank";

  link.rel = "noopener noreferrer";

  document.body.appendChild(link);

  link.click();

  link.remove();
}

async function getPhotoViewUrl(photo) {
  const storagePath = String(photo?.storagePath || "").trim();

  if (!storagePath) {
    throw new Error("PHOTO_STORAGE_PATH_NOT_FOUND");
  }

  return getDownloadURL(ref(storage, storagePath));
}

function setAdditionalPhotoStatus({
  countText = "",
  processingText = "",
  state = "",
  errorMessage = "",
} = {}) {
  if (additionalPhotoCount && countText) {
    additionalPhotoCount.textContent = countText;
  }

  if (additionalPhotoProcessing && processingText) {
    additionalPhotoProcessing.textContent = processingText;
  }

  if (additionalPhotoStatus) {
    additionalPhotoStatus.classList.remove(
      "is-processing",
      "is-success",
      "is-error",
    );

    if (state) {
      additionalPhotoStatus.classList.add(state);
    }
  }

  if (additionalPhotoError) {
    additionalPhotoError.textContent =
      errorMessage || "Não foi possível preparar as imagens selecionadas.";

    additionalPhotoError.hidden = !errorMessage;
  }
}

function updateAdditionalPhotoButton() {
  const availableSlots = getAvailablePhotoSlots();

  const disabled =
    selectedAdditionalPhotos.length === 0 ||
    processingAdditionalPhotos ||
    uploadingAdditionalPhotos ||
    !orderAllowsPhotoChanges() ||
    availableSlots <= 0;

  uploadAdditionalPhotosButton.disabled = disabled;

  additionalPhotosInput.disabled =
    processingAdditionalPhotos ||
    uploadingAdditionalPhotos ||
    !orderAllowsPhotoChanges() ||
    availableSlots <= 0;

  additionalPhotoUploadLabel?.classList.toggle(
    "is-disabled",
    additionalPhotosInput.disabled,
  );
}

function clearAdditionalPhotoSelection() {
  selectedAdditionalPhotos = [];

  additionalPhotosInput.value = "";

  additionalPhotoPreview.innerHTML = "";

  setAdditionalPhotoStatus({
    countText: "Nenhuma nova imagem selecionada",
    processingText: "Compressão automática para WebP",
  });

  updateAdditionalPhotoButton();
}

function renderPhotoManagement() {
  const storedPhotos = getStoredPhotos();

  const quantity = storedPhotos.length;

  const availableSlots = getAvailablePhotoSlots();

  const allowsChanges = orderAllowsPhotoChanges();

  photoLimitSummary.textContent =
    quantity === 1 ? "1 de 6 imagens" : `${quantity} de 6 imagens`;

  photoAvailableSlots.textContent =
    availableSlots === 1
      ? "1 nova imagem disponível"
      : `${availableSlots} novas imagens disponíveis`;

  const canAddPhotos = allowsChanges && availableSlots > 0;

  photoManagement.hidden = !canAddPhotos;

  photoLockedMessage.hidden = canAddPhotos;

  if (!canAddPhotos) {
    if (currentRequest.status === "concluida") {
      photoLockedMessage.textContent =
        "Esta ordem foi concluída e não permite novas imagens ou exclusões.";
    } else if (currentRequest.status === "cancelada") {
      photoLockedMessage.textContent =
        "Esta ordem foi cancelada e não permite novas imagens ou exclusões.";
    } else if (currentRequest.status === "recusada") {
      photoLockedMessage.textContent =
        "Esta solicitação foi encerrada e não permite alterações nas imagens.";
    } else if (availableSlots <= 0) {
      photoLockedMessage.textContent =
        "O limite de 6 imagens desta ordem de serviço foi atingido.";
    } else {
      photoLockedMessage.textContent = "Esta ordem não permite novas imagens.";
    }

    if (selectedAdditionalPhotos.length > 0) {
      clearAdditionalPhotoSelection();
    }
  }

  updateAdditionalPhotoButton();
}

function loadPhotoImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(new Error("PHOTO_DECODE_FAILED"));
    };

    image.src = objectUrl;
  });
}

function canvasToWebpBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("PHOTO_COMPRESSION_FAILED"));

          return;
        }

        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

async function compressAdditionalPhoto(file) {
  const image = await loadPhotoImage(file);

  const originalWidth = Number(image.naturalWidth || image.width || 0);

  const originalHeight = Number(image.naturalHeight || image.height || 0);

  if (!originalWidth || !originalHeight) {
    throw new Error("PHOTO_INVALID_DIMENSIONS");
  }

  const largestDimension = Math.max(originalWidth, originalHeight);

  const initialScale =
    largestDimension > maxPhotoDimension
      ? maxPhotoDimension / largestDimension
      : 1;

  let finalWidth = Math.max(1, Math.round(originalWidth * initialScale));

  let finalHeight = Math.max(1, Math.round(originalHeight * initialScale));

  const canvas = document.createElement("canvas");

  const context = canvas.getContext("2d", {
    alpha: false,
  });

  if (!context) {
    throw new Error("PHOTO_CANVAS_UNAVAILABLE");
  }

  let compressedBlob = null;

  let quality = 0.86;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    canvas.width = finalWidth;

    canvas.height = finalHeight;

    context.fillStyle = "#ffffff";

    context.fillRect(0, 0, finalWidth, finalHeight);

    context.drawImage(image, 0, 0, finalWidth, finalHeight);

    compressedBlob = await canvasToWebpBlob(canvas, quality);

    if (compressedBlob.size <= targetCompressedPhotoSize) {
      break;
    }

    if (quality > 0.58) {
      quality -= 0.07;
    } else {
      finalWidth = Math.max(320, Math.round(finalWidth * 0.88));

      finalHeight = Math.max(320, Math.round(finalHeight * 0.88));
    }
  }

  if (!compressedBlob || compressedBlob.size > maxCompressedPhotoSize) {
    throw new Error("PHOTO_STILL_TOO_LARGE");
  }

  return new File([compressedBlob], createCompressedPhotoName(file.name), {
    type: "image/webp",

    lastModified: file.lastModified || Date.now(),
  });
}

function renderAdditionalPhotoPreview() {
  additionalPhotoPreview.innerHTML = "";

  selectedAdditionalPhotos.forEach((photoEntry, index) => {
    const previewItem = document.createElement("div");

    previewItem.className = "additional-photo-preview__item";

    const image = document.createElement("img");

    image.alt = `Pré-visualização da nova imagem ${index + 1}`;

    const objectUrl = URL.createObjectURL(photoEntry.file);

    image.src = objectUrl;

    image.addEventListener(
      "load",
      () => {
        URL.revokeObjectURL(objectUrl);
      },
      {
        once: true,
      },
    );

    const removeButton = document.createElement("button");

    removeButton.type = "button";

    removeButton.className = "additional-photo-preview__remove";

    removeButton.textContent = "×";

    removeButton.setAttribute("aria-label", `Remover nova imagem ${index + 1}`);

    removeButton.addEventListener("click", () => {
      if (processingAdditionalPhotos || uploadingAdditionalPhotos) {
        return;
      }

      selectedAdditionalPhotos.splice(index, 1);

      renderAdditionalPhotoPreview();

      if (selectedAdditionalPhotos.length === 0) {
        setAdditionalPhotoStatus({
          countText: "Nenhuma nova imagem selecionada",

          processingText: "Compressão automática para WebP",
        });
      } else {
        const totalSize = selectedAdditionalPhotos.reduce(
          (total, entry) => total + Number(entry.file.size || 0),
          0,
        );

        setAdditionalPhotoStatus({
          countText:
            selectedAdditionalPhotos.length === 1
              ? "1 nova imagem preparada"
              : `${selectedAdditionalPhotos.length} novas imagens preparadas`,

          processingText: `Total comprimido: ${formatPhotoSize(totalSize)}`,

          state: "is-success",
        });
      }

      updateAdditionalPhotoButton();
    });

    previewItem.append(image, removeButton);

    additionalPhotoPreview.appendChild(previewItem);
  });
}

async function handleAdditionalPhotoSelection() {
  if (processingAdditionalPhotos || uploadingAdditionalPhotos) {
    return;
  }

  const incomingFiles = Array.from(additionalPhotosInput.files || []);

  additionalPhotosInput.value = "";

  if (incomingFiles.length === 0) {
    return;
  }

  const availableSlots =
    getAvailablePhotoSlots() - selectedAdditionalPhotos.length;

  if (availableSlots <= 0) {
    showFeedback("O limite de 6 imagens desta ordem foi atingido.");

    return;
  }

  processingAdditionalPhotos = true;

  updateAdditionalPhotoButton();

  setAdditionalPhotoStatus({
    countText:
      selectedAdditionalPhotos.length === 1
        ? "1 nova imagem preparada"
        : `${selectedAdditionalPhotos.length} novas imagens preparadas`,

    processingText: "Validando e comprimindo imagens...",

    state: "is-processing",
  });

  const filesToProcess = incomingFiles.slice(0, availableSlots);

  const errors = [];

  if (incomingFiles.length > availableSlots) {
    errors.push(
      `Somente ${availableSlots} imagem(ns) foram consideradas, pois o limite da OS é 6.`,
    );
  }

  try {
    for (const file of filesToProcess) {
      if (!acceptedPhotoTypes.has(file.type)) {
        errors.push(`${file.name}: formato não permitido.`);

        continue;
      }

      if (file.size <= 0) {
        errors.push(`${file.name}: arquivo vazio.`);

        continue;
      }

      if (file.size > maxOriginalPhotoSize) {
        errors.push(`${file.name}: o arquivo original ultrapassa 10 MB.`);

        continue;
      }

      const signature = [file.name, file.size, file.lastModified].join("::");

      const alreadySelected = selectedAdditionalPhotos.some(
        (entry) => entry.signature === signature,
      );

      if (alreadySelected) {
        errors.push(`${file.name}: esta imagem já foi selecionada.`);

        continue;
      }

      try {
        const compressedFile = await compressAdditionalPhoto(file);

        selectedAdditionalPhotos.push({
          file: compressedFile,

          originalName: file.name,

          originalSize: Number(file.size || 0),

          signature,
        });
      } catch (error) {
        console.error(
          `[Detalhes] Não foi possível comprimir ${file.name}:`,
          error,
        );

        errors.push(
          `${file.name}: não foi possível reduzir a imagem para o limite permitido.`,
        );
      }
    }
  } finally {
    processingAdditionalPhotos = false;

    renderAdditionalPhotoPreview();

    updateAdditionalPhotoButton();
  }

  const totalSize = selectedAdditionalPhotos.reduce(
    (total, entry) => total + Number(entry.file.size || 0),
    0,
  );

  if (errors.length > 0) {
    setAdditionalPhotoStatus({
      countText:
        selectedAdditionalPhotos.length === 1
          ? "1 nova imagem preparada"
          : `${selectedAdditionalPhotos.length} novas imagens preparadas`,

      processingText:
        selectedAdditionalPhotos.length > 0
          ? `Imagens válidas: ${formatPhotoSize(totalSize)}`
          : "Nenhuma imagem válida foi adicionada.",

      state: "is-error",

      errorMessage: errors.join(" "),
    });

    showFeedback(errors[0]);

    return;
  }

  setAdditionalPhotoStatus({
    countText:
      selectedAdditionalPhotos.length === 1
        ? "1 nova imagem preparada"
        : `${selectedAdditionalPhotos.length} novas imagens preparadas`,

    processingText: `Compressão concluída: ${formatPhotoSize(totalSize)}`,

    state: "is-success",
  });
}

function getFreePhotoPositions() {
  const occupiedPositions = new Set(
    getStoredPhotos()
      .map((photo) => Number(photo.posicao || 0))
      .filter((position) => position >= 1 && position <= maxOrderPhotos),
  );

  const availablePositions = [];

  for (let position = 1; position <= maxOrderPhotos; position += 1) {
    if (!occupiedPositions.has(position)) {
      availablePositions.push(position);
    }
  }

  return availablePositions;
}

async function uploadAdditionalPhotos() {
  if (
    uploadingAdditionalPhotos ||
    processingAdditionalPhotos ||
    selectedAdditionalPhotos.length === 0
  ) {
    return;
  }

  if (!orderAllowsPhotoChanges()) {
    showFeedback("Esta ordem não permite novas imagens.");

    return;
  }

  const freePositions = getFreePhotoPositions();

  if (selectedAdditionalPhotos.length > freePositions.length) {
    showFeedback("A quantidade selecionada ultrapassa o limite de 6 imagens.");

    return;
  }

  const orderId = String(currentRequest.documentId || "").trim();

  if (!orderId) {
    showFeedback("Não foi possível identificar a ordem de serviço.");

    return;
  }

  uploadingAdditionalPhotos = true;

  updateAdditionalPhotoButton();

  const originalButtonText = uploadAdditionalPhotosButton.textContent;

  uploadAdditionalPhotosButton.textContent = "Enviando imagens...";

  const uploadedPhotos = [];

  try {
    for (let index = 0; index < selectedAdditionalPhotos.length; index += 1) {
      const photoEntry = selectedAdditionalPhotos[index];

      const position = freePositions[index];

      const fileName = `foto-${position}.webp`;

      const storagePath = `ordens/${orderId}/imagens/${fileName}`;

      const storageReference = ref(storage, storagePath);

      setAdditionalPhotoStatus({
        countText: `${index + 1} de ${selectedAdditionalPhotos.length}`,

        processingText: `Enviando imagem ${index + 1}...`,

        state: "is-processing",
      });

      await uploadBytes(storageReference, photoEntry.file, {
        contentType: "image/webp",

        customMetadata: {
          ordemId: orderId,

          enviadoPorUid: currentSession.uid,

          enviadoPorPerfil: currentSession.role,

          nomeOriginal: photoEntry.originalName || photoEntry.file.name,
        },
      });

      uploadedPhotos.push({
        storageReference,

        data: {
          storagePath,

          nome: photoEntry.originalName || photoEntry.file.name || fileName,

          contentType: "image/webp",

          tamanho: Number(photoEntry.file.size || 0),

          posicao: position,

          enviadoPorUid: currentSession.uid,

          enviadoPorPerfil: currentSession.role,

          enviadoEm: new Date().toISOString(),
        },
      });
    }

    const existingPhotos = getStoredPhotos().map(serializePhotoForFirestore);

    const finalPhotos = [
      ...existingPhotos,
      ...uploadedPhotos.map((uploadedPhoto) => uploadedPhoto.data),
    ].sort((photoA, photoB) => photoA.posicao - photoB.posicao);

    await updateDoc(currentRequestReference, {
      fotos: finalPhotos,

      quantidadeFotos: finalPhotos.length,

      atualizadoEm: serverTimestamp(),
    });

    selectedAdditionalPhotos = [];

    additionalPhotosInput.value = "";

    additionalPhotoPreview.innerHTML = "";

    await loadRequest();

    renderAll();

    setAdditionalPhotoStatus({
      countText:
        uploadedPhotos.length === 1
          ? "1 imagem enviada"
          : `${uploadedPhotos.length} imagens enviadas`,

      processingText: "Imagens armazenadas com sucesso.",

      state: "is-success",
    });

    showFeedback(
      uploadedPhotos.length === 1
        ? "Imagem adicionada à ordem de serviço."
        : "Imagens adicionadas à ordem de serviço.",
    );
  } catch (error) {
    console.error("[Detalhes] Não foi possível enviar as imagens:", error);

    await Promise.allSettled(
      uploadedPhotos.map((photo) => deleteObject(photo.storageReference)),
    );

    setAdditionalPhotoStatus({
      countText: "Upload não concluído",

      processingText: "As novas imagens não foram vinculadas à OS.",

      state: "is-error",

      errorMessage: "Não foi possível enviar as imagens. Tente novamente.",
    });

    if (error.code === "permission-denied") {
      showFeedback("O Firebase bloqueou o envio das imagens.");
    } else {
      showFeedback("Não foi possível enviar as imagens.");
    }
  } finally {
    uploadingAdditionalPhotos = false;

    uploadAdditionalPhotosButton.textContent = originalButtonText;

    updateAdditionalPhotoButton();
  }
}

function userCanDeletePhoto(photo) {
  if (!orderAllowsPhotoChanges()) {
    return false;
  }

  if (currentSession.role === "admin") {
    return true;
  }

  return (
    currentSession.role === "cliente" &&
    String(photo?.enviadoPorUid || "").trim() === currentSession.uid
  );
}

async function removeStoredPhoto(photo, photoCard) {
  if (photoActionInProgress || !userCanDeletePhoto(photo)) {
    return;
  }

  const storagePath = String(photo?.storagePath || "").trim();

  if (!storagePath) {
    showFeedback("Não foi possível identificar o arquivo da imagem.");

    return;
  }

  const originalPhotos = getStoredPhotos().map(serializePhotoForFirestore);

  const remainingPhotos = originalPhotos.filter(
    (storedPhoto) => storedPhoto.storagePath !== storagePath,
  );

  photoActionInProgress = true;

  photoCard?.classList.add("is-removing");

  try {
    await updateDoc(currentRequestReference, {
      fotos: remainingPhotos,

      quantidadeFotos: remainingPhotos.length,

      atualizadoEm: serverTimestamp(),
    });

    try {
      await deleteObject(ref(storage, storagePath));
    } catch (storageError) {
      if (storageError.code !== "storage/object-not-found") {
        try {
          await updateDoc(currentRequestReference, {
            fotos: originalPhotos,

            quantidadeFotos: originalPhotos.length,

            atualizadoEm: serverTimestamp(),
          });
        } catch (rollbackError) {
          console.error(
            "[Detalhes] Não foi possível restaurar a imagem após a falha:",
            rollbackError,
          );
        }

        throw storageError;
      }
    }

    await loadRequest();

    renderAll();

    showFeedback("Imagem removida da ordem de serviço.");
  } catch (error) {
    console.error("[Detalhes] Não foi possível remover a imagem:", error);

    if (
      error.code === "permission-denied" ||
      error.code === "storage/unauthorized"
    ) {
      showFeedback("Você não possui permissão para remover esta imagem.");
    } else {
      showFeedback("Não foi possível remover a imagem.");
    }

    throw error;
  } finally {
    photoActionInProgress = false;

    photoCard?.classList.remove("is-removing");
  }
}

function confirmPhotoRemoval(photo, photoCard) {
  if (!userCanDeletePhoto(photo)) {
    return;
  }

  openModal({
    title: "Remover imagem",

    description:
      "A imagem será excluída definitivamente desta ordem de serviço.",

    confirmationText: "Remover imagem",

    danger: true,

    confirm: async () => {
      await removeStoredPhoto(photo, photoCard);
    },
  });
}

function createStoredPhotoCard(photo, url, index) {
  const card = document.createElement("article");

  card.className = "request-photo";

  card.setAttribute("role", "button");

  card.setAttribute("tabindex", "0");

  card.setAttribute("aria-label", `Ampliar foto ${index + 1}`);

  const image = document.createElement("img");

  image.src = url;

  image.alt = photo.nome
    ? `${photo.nome} — imagem da ordem de serviço`
    : `Foto ${index + 1} da ordem de serviço`;

  image.loading = "lazy";

  card.appendChild(image);

  const openStoredPhoto = () => {
    openPhoto(url);
  };

  card.addEventListener("click", openStoredPhoto);

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    openStoredPhoto();
  });

  if (userCanDeletePhoto(photo)) {
    const removeButton = document.createElement("button");

    removeButton.type = "button";

    removeButton.className = "request-photo__remove";

    removeButton.textContent = "×";

    removeButton.setAttribute("aria-label", `Remover foto ${index + 1}`);

    removeButton.addEventListener("click", (event) => {
      event.stopPropagation();

      confirmPhotoRemoval(photo, card);
    });

    card.appendChild(removeButton);
  }

  return card;
}

async function renderPhotos() {
  const currentRenderVersion = photoRenderVersion + 1;

  photoRenderVersion = currentRenderVersion;

  requestPhotos.innerHTML = "";

  renderPhotoManagement();

  const photos = getStoredPhotos();

  if (photos.length === 0) {
    requestPhotos.hidden = true;

    photosEmpty.hidden = false;

    photosEmpty.textContent = "Nenhuma foto foi adicionada nesta solicitação.";

    return;
  }

  requestPhotos.hidden = true;

  photosEmpty.hidden = false;

  photosEmpty.textContent = "Carregando imagens...";

  const resolvedPhotos = await Promise.all(
    photos.map(async (photo, index) => {
      try {
        const url = await getPhotoViewUrl(photo);

        return {
          photo,

          url,

          index,
        };
      } catch (error) {
        console.error(
          `[Detalhes] Não foi possível carregar a foto ${index + 1}:`,
          error,
        );

        return null;
      }
    }),
  );

  if (photoRenderVersion !== currentRenderVersion) {
    return;
  }

  const availablePhotos = resolvedPhotos.filter(Boolean);

  requestPhotos.innerHTML = "";

  if (availablePhotos.length === 0) {
    requestPhotos.hidden = true;

    photosEmpty.hidden = false;

    photosEmpty.textContent =
      "Não foi possível carregar as imagens desta solicitação.";

    return;
  }

  availablePhotos.forEach(({ photo, url, index }) => {
    requestPhotos.appendChild(createStoredPhotoCard(photo, url, index));
  });

  requestPhotos.hidden = false;

  photosEmpty.hidden = true;
}

/* =========================================
   OBSERVAÇÕES
========================================= */

function renderObservations() {
  const observations = currentRequest.observacoes || {};

  clientObservation.textContent =
    getServiceDescriptionText(observations.cliente) ||
    "Descrição do serviço não informada.";

  const hasResponse = Boolean(observations.resposta);

  responseObservationBox.hidden = !hasResponse;

  responseObservation.textContent =
    observations.resposta || "Nenhuma resposta adicionada.";

  internalObservation.textContent =
    observations.interna || "Nenhuma observação interna registrada.";
}
/* =========================================
   RESPONSABILIDADE TÉCNICA
========================================= */

function getTechnicalResponsibilityFormData() {
  return {
    nome: String(technicalResponsibleName?.value || "").trim(),

    crea: String(technicalCrea?.value || "").trim(),

    trt: String(technicalTrt?.value || "").trim(),
  };
}

function formatOrderValueFromNumber(value) {
  const numericValue = Number(value) || 0;

  if (numericValue <= 0) {
    return "";
  }

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatOrderValueInput(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const numericValue = Number(digits) / 100;

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function orderValueInputToNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  return Number(digits) / 100;
}

function renderOrderValue() {
  orderValue.value = formatOrderValueFromNumber(currentRequest.valorSalvateck);
}

async function saveOrderValue(event) {
  event.preventDefault();

  if (
    currentSession.role !== "admin" ||
    ["recusada", "cancelada"].includes(currentRequest.status)
  ) {
    return;
  }

  const value = orderValueInputToNumber(orderValue.value);

  if (value <= 0) {
    showFeedback("Informe um valor válido para a Ordem de Serviço.");

    orderValue.focus();

    return;
  }

  const originalText = saveOrderValueButton.textContent;

  saveOrderValueButton.disabled = true;

  saveOrderValueButton.textContent = "Salvando...";

  try {
    const financialReference = doc(
      db,
      "financeiro",
      `ordem-${currentRequest.documentId}`,
    );

    const financialSnapshot = await getDoc(financialReference);

    const batch = writeBatch(db);

    batch.update(currentRequestReference, {
      valorSalvateck: value,

      valorSalvateckAtualizadoEm: serverTimestamp(),

      valorSalvateckAtualizadoPorUid: currentSession.uid,

      atualizadoEm: serverTimestamp(),
    });

    const financialData = {
      tipo: "income",

      descricao: currentRequest.titulo,

      categoria:
        currentRequest.tipoAtendimento === "vistoria" ? "vistoria" : "servico",

      valor: value,

      clienteUid: currentRequest.clienteId,

      condominioId: currentRequest.condominio.id,

      ordemId: currentRequest.documentId,

      cliente: {
        id: currentRequest.clienteId,
        nome: currentRequest.cliente.nome,
        email: currentRequest.cliente.email,
        telefone: currentRequest.cliente.telefone,
      },

      condominio: {
        id: currentRequest.condominio.id,
        codigo: currentRequest.condominio.codigo,
        nome: currentRequest.condominio.nome,
      },

      ordem: {
        id: currentRequest.documentId,
        codigo: currentRequest.codigo,
        titulo: currentRequest.titulo,
      },

      origem: "ordem",

      observacoes: `Lançamento gerado automaticamente pela ${currentRequest.codigo}.`,

      atualizadoEm: serverTimestamp(),

      atualizadoPorUid: currentSession.uid,
    };

    if (financialSnapshot.exists()) {
      batch.set(financialReference, financialData, {
        merge: true,
      });
    } else {
      batch.set(financialReference, {
        ...financialData,

        id: financialReference.id,

        codigo: `FIN-${currentRequest.codigo}`,

        status: "pending",

        vencimento: "",

        pagamentoEm: "",

        formaPagamento: "",

        criadoEm: serverTimestamp(),

        criadoPorUid: currentSession.uid,
      });
    }

    await batch.commit();

    await loadRequest();

    renderAll();

    showFeedback("Valor da OS salvo e enviado ao Financeiro.");
  } catch (error) {
    handleSaveError(error);
  } finally {
    saveOrderValueButton.disabled = false;

    saveOrderValueButton.textContent = originalText;
  }
}

function isTechnicalResponsibilityComplete(data = {}) {
  return Boolean(String(data.nome || "").trim());
}

function focusFirstMissingTechnicalField(data = {}) {
  if (!String(data.nome || "").trim()) {
    technicalResponsibleName?.focus();
  }
}

function renderTechnicalResponsibility() {
  const data = currentRequest.responsabilidadeTecnica || {};

  technicalResponsibleName.value = data.nome || "";

  technicalCrea.value = data.crea || "";

  technicalTrt.value = data.trt || "";
}

async function saveTechnicalResponsibility(event) {
  event.preventDefault();

  const isFinalStatus = ["concluida", "recusada", "cancelada"].includes(
    currentRequest.status,
  );

  if (currentSession.role !== "admin" || isFinalStatus) {
    return;
  }

  const data = getTechnicalResponsibilityFormData();

  if (!isTechnicalResponsibilityComplete(data)) {
    showFeedback("Informe o nome do Responsável Técnico.");

    focusFirstMissingTechnicalField(data);

    return;
  }

  const originalText = saveTechnicalResponsibilityButton.textContent;

  saveTechnicalResponsibilityButton.disabled = true;

  saveTechnicalResponsibilityButton.textContent = "Salvando...";

  try {
    await saveChanges(
      {
        responsabilidadeTecnica: {
          ...data,

          atualizadoPorUid: currentSession.uid,

          atualizadoEm: serverTimestamp(),
        },
      },

      "Responsabilidade técnica salva na OS.",
    );
  } finally {
    saveTechnicalResponsibilityButton.disabled = false;

    saveTechnicalResponsibilityButton.textContent = originalText;
  }
}

function renderFinalTechnicalResponsibility(data = {}) {
  finalDocumentTechnicalResponsible.textContent =
    String(data.nome || "").trim() || "Não informado";

  finalDocumentCrea.textContent =
    String(data.crea || "").trim() || "Não informado";

  finalDocumentTrt.textContent =
    String(data.trt || "").trim() || "Não informado";
}

function renderFinalInspection(documentData = null) {
  const inspection = documentData?.vistoria || null;

  const hasInspection = Boolean(
    documentData?.tipoAtendimento === "vistoria" &&
    inspection &&
    (inspection.id || inspection.codigo),
  );

  finalInspectionBlock.hidden = !hasInspection;

  finalInspectionChecklist.innerHTML = "";

  if (!hasInspection) {
    return;
  }

  const checklist = Array.isArray(inspection.checklist)
    ? inspection.checklist
    : [];

  finalInspectionCode.textContent = inspection.codigo || "Vistoria sem código";

  finalInspectionTechnician.textContent =
    inspection.tecnico?.nome || "Técnico não informado";

  finalInspectionDate.textContent = formatDateTime(
    inspection.validadaEm || inspection.concluidaEm,
  );

  finalInspectionEvaluated.textContent = String(
    Number(
      inspection.equipamentosAvaliados ||
        inspection.itensConcluidos ||
        checklist.length,
    ),
  );

  finalInspectionNonconformities.textContent = String(
    Number(inspection.naoConformidades || 0),
  );

  checklist.forEach((item, index) => {
    const result = String(item.resultado || "").trim();

    const needsAdjustment = result === "precisa-ajuste";

    const card = document.createElement("article");

    card.className = needsAdjustment
      ? "final-inspection-item needs-adjustment"
      : "final-inspection-item is-ok";

    const top = document.createElement("div");

    top.className = "final-inspection-item__top";

    const identification = document.createElement("div");

    const category = document.createElement("span");

    category.textContent = String(item.categoria || "").trim() || "Equipamento";

    const name = document.createElement("strong");

    name.textContent = String(item.nome || "").trim() || `Item ${index + 1}`;

    identification.append(category, name);

    const status = document.createElement("small");

    status.textContent = needsAdjustment ? "Precisa de ajuste" : "OK";

    top.append(identification, status);

    card.appendChild(top);

    const observation = String(item.observacao || "").trim();

    if (observation) {
      const observationText = document.createElement("p");

      observationText.textContent = observation;

      card.appendChild(observationText);
    }

    finalInspectionChecklist.appendChild(card);
  });
}

/* =========================================
   DOCUMENTO FINAL
========================================= */

function renderFinalDocument() {
  const isCompleted = currentRequest.status === "concluida";

  finalDocumentCard.hidden = !isCompleted;

  if (!isCompleted) {
    return;
  }

  const documentData = currentRequest.documentoFinal;

  const hasFinalDocument = Boolean(documentData);

  if (!hasFinalDocument) {
    finalDocumentStatusTitle.textContent =
      "Documento final ainda não registrado";

    finalDocumentStatusMessage.textContent =
      "Esta ordem foi concluída antes da implantação do documento final.";

    finalDocumentCode.textContent = currentRequest.codigo;

    finalDocumentService.textContent = getFinalPdfType(currentRequest);

    finalDocumentClient.textContent = currentRequest.cliente.nome;

    finalDocumentCondominium.textContent = getCondominiumLabel(
      currentRequest.condominio,
    );

    finalDocumentCondominiumCnpj.textContent =
      currentRequest.condominio?.cnpj || "Não informado";

    finalDocumentDate.textContent = formatDateTime(currentRequest.concluidaEm);

    finalDocumentResponsible.textContent =
      currentRequest.concluidaPorNome || "Não informado";

    renderFinalTechnicalResponsibility(currentRequest.responsabilidadeTecnica);

    renderFinalInspection(null);

    viewFinalDocumentButton.disabled = true;
    downloadFinalDocumentButton.disabled = true;

    return;
  }

  const client = documentData.cliente || {};

  const condominium = documentData.condominio || {};

  const completedBy = documentData.concluidaPor || {};

  finalDocumentStatusTitle.textContent = "Documento final registrado";

  finalDocumentStatusMessage.textContent =
    "As informações deste atendimento foram congeladas no momento da conclusão.";

  finalDocumentCode.textContent = documentData.codigo || currentRequest.codigo;

  finalDocumentService.textContent = getFinalPdfType(documentData);

  finalDocumentClient.textContent = client.nome || currentRequest.cliente.nome;

  finalDocumentCondominium.textContent = getCondominiumLabel(condominium);

  finalDocumentCondominiumCnpj.textContent =
    condominium.cnpj || currentRequest.condominio?.cnpj || "Não informado";

  finalDocumentDate.textContent = formatDateTime(
    documentData.concluidaEm || currentRequest.concluidaEm,
  );

  finalDocumentResponsible.textContent =
    completedBy.nome || currentRequest.concluidaPorNome || "Administrador";

  renderFinalTechnicalResponsibility(
    documentData.responsabilidadeTecnica || {},
  );

  renderFinalInspection(documentData);

  viewFinalDocumentButton.disabled = generatingFinalPdf;

  downloadFinalDocumentButton.disabled = generatingFinalPdf;
}

/* =========================================
   PDF DO DOCUMENTO FINAL
========================================= */

const PDF_COLORS = {
  navy: [13, 56, 97],
  gold: [221, 154, 23],
  green: [37, 107, 71],
  dark: [43, 47, 51],
  gray: [98, 106, 113],
  lightGray: [243, 246, 248],
  border: [217, 224, 228],
  white: [249, 249, 249],
};

function sanitizePdfText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .trim();
}

function getFinalPdfData() {
  const documentData = currentRequest?.documentoFinal;

  if (!documentData) {
    throw new Error("FINAL_DOCUMENT_NOT_FOUND");
  }

  return documentData;
}

function getFinalPdfServices(documentData) {
  const services = Array.isArray(documentData.servicos)
    ? documentData.servicos
    : [];

  return services
    .map((service) => {
      if (typeof service === "string") {
        return sanitizePdfText(service);
      }

      return sanitizePdfText(service?.servico || service?.nome || "");
    })
    .filter(Boolean);
}

function getFinalPdfCategories(documentData) {
  const categories = Array.isArray(documentData.categorias)
    ? documentData.categorias
    : [];

  return categories
    .map((category) => {
      return categoriaConfig[category] || category;
    })
    .map(sanitizePdfText)
    .filter(Boolean);
}

function getFinalPdfAddress(documentData) {
  const address = documentData.endereco || {};

  if (typeof address === "string") {
    return sanitizePdfText(address) || "Não informado";
  }

  const summary = sanitizePdfText(address.resumo);

  if (summary) {
    return summary;
  }

  const firstLine = [
    address.logradouro || address.rua,
    address.numero,
    address.complemento,
  ]
    .map(sanitizePdfText)
    .filter(Boolean)
    .join(", ");

  const cityAndState = [address.cidade, address.uf || address.estado]
    .map(sanitizePdfText)
    .filter(Boolean)
    .join("/");

  const secondLine = [address.bairro, cityAndState]
    .map(sanitizePdfText)
    .filter(Boolean)
    .join(" - ");

  return [firstLine, secondLine].filter(Boolean).join(" | ") || "Não informado";
}

function getFinalPdfSchedule(documentData) {
  const attendance = documentData.atendimento || {};

  const date = attendance.dataConfirmada
    ? formatDate(attendance.dataConfirmada)
    : "Não informada";

  const period =
    periodoConfig[attendance.periodoConfirmado] ||
    sanitizePdfText(attendance.periodoConfirmado) ||
    "Não informado";

  const time = sanitizePdfText(attendance.horarioConfirmado) || "Não informado";

  return `${date} - ${period} - ${time}`;
}
function getFinalPdfInspectionChecklist(inspection = {}) {
  const checklist = Array.isArray(inspection.checklist)
    ? inspection.checklist
    : [];

  if (checklist.length === 0) {
    return "Nenhum item de checklist registrado.";
  }

  return checklist
    .map((item, index) => {
      const category = sanitizePdfText(item.categoria) || "Equipamento";

      const name = sanitizePdfText(item.nome) || `Item ${index + 1}`;

      const result =
        item.resultado === "precisa-ajuste" ? "Precisa de ajuste" : "OK";

      const observation = sanitizePdfText(item.observacao);

      return [
        `${index + 1}. ${category} - ${name}: ${result}.`,
        observation ? `Observação: ${observation}` : "",
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join("\n");
}
function getFinalPdfType(documentData) {
  return documentData.tipoAtendimento === "vistoria"
    ? "Vistoria técnica"
    : "Manutenção geral";
}

function getFinalPdfFileName(documentData) {
  const safeCode = sanitizePdfText(documentData.codigo || "ordem-de-servico")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-");

  return `Salvateck-${safeCode}-conclusao.pdf`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(String(reader.result || ""));
    });

    reader.addEventListener("error", () => {
      reject(new Error("LOGO_CONVERSION_FAILED"));
    });

    reader.readAsDataURL(blob);
  });
}

async function loadFinalPdfLogo() {
  if (!finalPdfLogoPromise) {
    finalPdfLogoPromise = fetch("assets/logo.salvateck.png", {
      cache: "force-cache",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("LOGO_LOAD_FAILED");
        }

        return response.blob();
      })
      .then(blobToDataUrl)
      .catch((error) => {
        console.warn(
          "[PDF] A logo não pôde ser carregada. O PDF será gerado sem ela.",
          error,
        );

        return "";
      });
  }

  return finalPdfLogoPromise;
}

function addPdfContinuationHeader(pdf, documentData) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...PDF_COLORS.navy);

  pdf.rect(0, 0, pageWidth, 18, "F");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(9);

  pdf.setTextColor(...PDF_COLORS.white);

  pdf.text(
    `Relatório de Conclusão - ${sanitizePdfText(documentData.codigo)}`,
    16,
    11.5,
  );
}

function ensurePdfSpace(pdf, currentY, requiredHeight, documentData) {
  const pageHeight = pdf.internal.pageSize.getHeight();

  const contentLimit = pageHeight - 20;

  if (currentY + requiredHeight <= contentLimit) {
    return currentY;
  }

  pdf.addPage();

  addPdfContinuationHeader(pdf, documentData);

  return 26;
}

function addPdfMainHeader(pdf, documentData, logoDataUrl) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...PDF_COLORS.navy);

  pdf.rect(0, 0, pageWidth, 44, "F");

  if (logoDataUrl) {
    try {
      pdf.setFillColor(...PDF_COLORS.white);

      pdf.roundedRect(16, 9, 25, 25, 4, 4, "F");

      pdf.addImage(logoDataUrl, "PNG", 18.5, 11.5, 20, 20);
    } catch (error) {
      console.warn("[PDF] Não foi possível inserir a logo.", error);
    }
  }

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(8);

  pdf.setTextColor(...PDF_COLORS.gold);

  pdf.text("SALVATECK", 47, 12.5);

  pdf.setFontSize(16);

  pdf.setTextColor(...PDF_COLORS.white);

  pdf.text("Relatório de Conclusão", 47, 21);

  pdf.setFontSize(10);

  pdf.text(
    `Ordem de serviço ${sanitizePdfText(documentData.codigo)}`,
    47,
    28.5,
  );

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(8);

  pdf.setTextColor(220, 228, 234);

  pdf.text(`Documento emitido em ${formatDateTime(new Date())}`, 47, 35.5);

  return 52;
}

function addPdfSectionTitle(pdf, currentY, title, documentData) {
  const y = ensurePdfSpace(pdf, currentY, 13, documentData);

  pdf.setFillColor(236, 241, 244);

  pdf.roundedRect(16, y, 178, 9, 2, 2, "F");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(8);

  pdf.setTextColor(...PDF_COLORS.navy);

  pdf.text(sanitizePdfText(title).toUpperCase(), 20, y + 6);

  return y + 14;
}

function getPdfInfoBoxHeight(pdf, value, width) {
  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(9.5);

  const lines = pdf.splitTextToSize(
    sanitizePdfText(value) || "Não informado",
    width - 8,
  );

  return Math.max(20, 12 + lines.length * 4.5);
}

function drawPdfInfoBox(pdf, { x, y, width, height, label, value }) {
  pdf.setFillColor(...PDF_COLORS.lightGray);

  pdf.setDrawColor(...PDF_COLORS.border);

  pdf.roundedRect(x, y, width, height, 3, 3, "FD");

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(7.5);

  pdf.setTextColor(...PDF_COLORS.gray);

  pdf.text(sanitizePdfText(label), x + 4, y + 6);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(9.5);

  pdf.setTextColor(...PDF_COLORS.navy);

  const lines = pdf.splitTextToSize(
    sanitizePdfText(value) || "Não informado",
    width - 8,
  );

  pdf.text(lines, x + 4, y + 12);
}

function addPdfInfoPair(pdf, currentY, leftField, rightField, documentData) {
  const gap = 4;

  const columnWidth = (178 - gap) / 2;

  const leftHeight = getPdfInfoBoxHeight(pdf, leftField.value, columnWidth);

  const rightHeight = getPdfInfoBoxHeight(pdf, rightField.value, columnWidth);

  const height = Math.max(leftHeight, rightHeight);

  const y = ensurePdfSpace(pdf, currentY, height + 4, documentData);

  drawPdfInfoBox(pdf, {
    x: 16,
    y,
    width: columnWidth,
    height,
    label: leftField.label,
    value: leftField.value,
  });

  drawPdfInfoBox(pdf, {
    x: 16 + columnWidth + gap,
    y,
    width: columnWidth,
    height,
    label: rightField.label,
    value: rightField.value,
  });

  return y + height + 4;
}

function addPdfTextBlock(pdf, currentY, label, text, documentData) {
  const pageHeight = pdf.internal.pageSize.getHeight();

  const contentLimit = pageHeight - 20;

  const width = 178;

  const lineHeight = 4.4;

  const safeText = sanitizePdfText(text) || "Não informado";

  let remainingLines = pdf.splitTextToSize(safeText, width - 10);

  let y = currentY;

  let part = 1;

  while (remainingLines.length) {
    y = ensurePdfSpace(pdf, y, 20, documentData);

    const availableHeight = contentLimit - y;

    const maximumLines = Math.max(
      1,
      Math.floor((availableHeight - 13) / lineHeight),
    );

    const currentLines = remainingLines.splice(0, maximumLines);

    const boxHeight = Math.max(19, 12 + currentLines.length * lineHeight);

    pdf.setFillColor(...PDF_COLORS.lightGray);

    pdf.setDrawColor(...PDF_COLORS.border);

    pdf.roundedRect(16, y, width, boxHeight, 3, 3, "FD");

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(7.5);

    pdf.setTextColor(...PDF_COLORS.gray);

    const finalLabel = part === 1 ? label : `${label} - continuação`;

    pdf.text(sanitizePdfText(finalLabel), 20, y + 6);

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(9);

    pdf.setTextColor(...PDF_COLORS.dark);

    pdf.text(currentLines, 20, y + 12);

    y += boxHeight + 4;

    if (remainingLines.length) {
      pdf.addPage();

      addPdfContinuationHeader(pdf, documentData);

      y = 26;

      part += 1;
    }
  }

  return y;
}

/* =========================================
   IMAGENS NO PDF FINAL
========================================= */

function getPdfContainedImageSize(
  originalWidth,
  originalHeight,
  maximumWidth,
  maximumHeight,
) {
  const width = Number(originalWidth || 0);

  const height = Number(originalHeight || 0);

  if (!width || !height) {
    throw new Error("PDF_PHOTO_INVALID_DIMENSIONS");
  }

  const scale = Math.min(maximumWidth / width, maximumHeight / height);

  return {
    width: width * scale,

    height: height * scale,
  };
}

async function convertOrderPhotoToPdfImage(photo) {
  const photoUrl = await getPhotoViewUrl(photo);

  const response = await fetch(photoUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("PDF_PHOTO_DOWNLOAD_FAILED");
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const image = new Image();

    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      try {
        const originalWidth = Number(image.naturalWidth || image.width || 0);

        const originalHeight = Number(image.naturalHeight || image.height || 0);

        if (!originalWidth || !originalHeight) {
          throw new Error("PDF_PHOTO_INVALID_DIMENSIONS");
        }

        const maximumCanvasDimension = 1600;

        const largestDimension = Math.max(originalWidth, originalHeight);

        const scale =
          largestDimension > maximumCanvasDimension
            ? maximumCanvasDimension / largestDimension
            : 1;

        const finalWidth = Math.max(1, Math.round(originalWidth * scale));

        const finalHeight = Math.max(1, Math.round(originalHeight * scale));

        const canvas = document.createElement("canvas");

        canvas.width = finalWidth;

        canvas.height = finalHeight;

        const context = canvas.getContext("2d", {
          alpha: false,
        });

        if (!context) {
          throw new Error("PDF_PHOTO_CANVAS_UNAVAILABLE");
        }

        context.fillStyle = "#ffffff";

        context.fillRect(0, 0, finalWidth, finalHeight);

        context.drawImage(image, 0, 0, finalWidth, finalHeight);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.84);

        resolve({
          dataUrl,

          width: finalWidth,

          height: finalHeight,

          nome: String(photo?.nome || "Imagem da ordem").trim(),

          posicao: Number(photo?.posicao || 0),
        });
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(new Error("PDF_PHOTO_DECODE_FAILED"));
    };

    image.src = objectUrl;
  });
}

async function loadFinalPdfPhotos() {
  const photos = getStoredPhotos()
    .filter((photo) => {
      return Boolean(String(photo?.storagePath || "").trim());
    })
    .sort((photoA, photoB) => {
      return Number(photoA?.posicao || 0) - Number(photoB?.posicao || 0);
    })
    .slice(0, maxOrderPhotos);

  if (photos.length === 0) {
    return [];
  }

  try {
    return await Promise.all(
      photos.map((photo) => convertOrderPhotoToPdfImage(photo)),
    );
  } catch (error) {
    console.error(
      "[PDF] Não foi possível preparar o registro fotográfico:",
      error,
    );

    throw new Error("PDF_PHOTO_LOAD_FAILED");
  }
}

function drawPdfPhotoCard(pdf, photo, { x, y, width, height, index, total }) {
  pdf.setFillColor(...PDF_COLORS.white);

  pdf.setDrawColor(...PDF_COLORS.border);

  pdf.roundedRect(x, y, width, height, 3, 3, "FD");

  const imageAreaX = x + 4;

  const imageAreaY = y + 4;

  const imageAreaWidth = width - 8;

  const imageAreaHeight = height - 17;

  const containedSize = getPdfContainedImageSize(
    photo.width,
    photo.height,
    imageAreaWidth,
    imageAreaHeight,
  );

  const imageX = imageAreaX + (imageAreaWidth - containedSize.width) / 2;

  const imageY = imageAreaY + (imageAreaHeight - containedSize.height) / 2;

  pdf.addImage(
    photo.dataUrl,
    "JPEG",
    imageX,
    imageY,
    containedSize.width,
    containedSize.height,
  );

  pdf.setDrawColor(...PDF_COLORS.border);

  pdf.line(x + 4, y + height - 11, x + width - 4, y + height - 11);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7.5);

  pdf.setTextColor(...PDF_COLORS.navy);

  pdf.text(`Imagem ${index + 1} de ${total}`, x + 4, y + height - 5);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(6.5);

  pdf.setTextColor(...PDF_COLORS.gray);

  const photoName = sanitizePdfText(photo.nome);

  if (photoName) {
    const limitedName =
      photoName.length > 34 ? `${photoName.slice(0, 31)}...` : photoName;

    pdf.text(limitedName, x + width - 4, y + height - 5, {
      align: "right",
    });
  }
}

async function addPdfPhotoGallery(pdf, currentY, documentData) {
  const photos = await loadFinalPdfPhotos();

  if (photos.length === 0) {
    return currentY;
  }

  const columnGap = 6;

  const cardWidth = (178 - columnGap) / 2;

  const cardHeight = 66;

  const rowGap = 5;

  let y = ensurePdfSpace(pdf, currentY, 14 + cardHeight + rowGap, documentData);

  y = addPdfSectionTitle(pdf, y, "Registro fotográfico", documentData);

  for (let index = 0; index < photos.length; index += 2) {
    y = ensurePdfSpace(pdf, y, cardHeight + rowGap, documentData);

    const rowPhotos = photos.slice(index, index + 2);

    rowPhotos.forEach((photo, columnIndex) => {
      const x = 16 + columnIndex * (cardWidth + columnGap);

      drawPdfPhotoCard(pdf, photo, {
        x,

        y,

        width: cardWidth,

        height: cardHeight,

        index: index + columnIndex,

        total: photos.length,
      });
    });

    y += cardHeight + rowGap;
  }

  return y;
}

function addPdfConclusionNotice(pdf, currentY, documentData) {
  const y = ensurePdfSpace(pdf, currentY, 26, documentData);

  pdf.setFillColor(231, 242, 235);

  pdf.setDrawColor(179, 211, 190);

  pdf.roundedRect(16, y, 178, 22, 3, 3, "FD");

  pdf.setFillColor(...PDF_COLORS.green);

  pdf.circle(26, y + 11, 5, "F");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(8);

  pdf.setTextColor(...PDF_COLORS.green);

  pdf.text("REGISTRO FINAL", 36, y + 8);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(8);

  pdf.setTextColor(...PDF_COLORS.dark);

  const noticeLines = pdf.splitTextToSize(
    "Este documento foi gerado a partir dos dados congelados no momento da conclusão da ordem de serviço.",
    150,
  );

  pdf.text(noticeLines, 36, y + 13);

  return y + 27;
}

function addPdfFooters(pdf, documentData) {
  const totalPages = pdf.getNumberOfPages();

  const pageWidth = pdf.internal.pageSize.getWidth();

  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    pdf.setPage(pageNumber);

    pdf.setDrawColor(...PDF_COLORS.border);

    pdf.line(16, pageHeight - 14, pageWidth - 16, pageHeight - 14);

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(7);

    pdf.setTextColor(...PDF_COLORS.gray);

    pdf.text("Documento gerado pelo sistema Salvateck", 16, pageHeight - 9);

    pdf.text(
      `${sanitizePdfText(
        documentData.codigo,
      )} | Página ${pageNumber} de ${totalPages}`,
      pageWidth - 16,
      pageHeight - 9,
      {
        align: "right",
      },
    );
  }
}

async function createFinalDocumentPdf() {
  const JsPdfClass = window.jspdf?.jsPDF;

  if (!JsPdfClass) {
    throw new Error("JSPDF_NOT_LOADED");
  }

  const documentData = getFinalPdfData();

  const logoDataUrl = await loadFinalPdfLogo();

  const pdf = new JsPdfClass({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const client = documentData.cliente || {};

  const condominium = documentData.condominio || {};

  const completedBy = documentData.concluidaPor || {};

  const technicalResponsibility = documentData.responsabilidadeTecnica || {};

  const inspection = documentData.vistoria || null;

  const categories = getFinalPdfCategories(documentData);

  const services = getFinalPdfServices(documentData);

  const serviceDescription =
    getServiceDescriptionText(documentData.observacoes?.cliente) ||
    "Descrição do serviço não informada.";

  const companyResponse =
    documentData.observacoes?.resposta ||
    "Nenhuma orientação adicional registrada.";

  let y = addPdfMainHeader(pdf, documentData, logoDataUrl);

  y = addPdfSectionTitle(pdf, y, "Identificação", documentData);

  y = addPdfInfoPair(
    pdf,
    y,
    {
      label: "Ativo principal",
      value: getCondominiumLabel(condominium),
    },
    {
      label: "CNPJ",
      value: condominium.cnpj || "Não informado",
    },
    documentData,
  );

  y = addPdfInfoPair(
    pdf,
    y,
    {
      label: "Solicitante / responsável",
      value: client.nome || "Não informado",
    },
    {
      label: "Ordem de serviço",
      value: documentData.codigo || "Não informada",
    },
    documentData,
  );

  y = addPdfInfoPair(
    pdf,
    y,
    {
      label: "Criada em",
      value: formatDateTime(documentData.criadaEm),
    },
    {
      label: "Tipo de atendimento",
      value: getFinalPdfType(documentData),
    },
    documentData,
  );

  y = addPdfTextBlock(
    pdf,
    y,
    "Endereço do atendimento",
    getFinalPdfAddress(documentData),
    documentData,
  );

  y = addPdfSectionTitle(pdf, y, "Responsabilidade técnica", documentData);

  y = addPdfInfoPair(
    pdf,
    y,
    {
      label: "Responsável técnico",
      value: technicalResponsibility.nome || "Não informado",
    },
    {
      label: "CREA",
      value: technicalResponsibility.crea || "Não informado",
    },
    documentData,
  );

  y = addPdfTextBlock(
    pdf,
    y,
    "TRT",
    technicalResponsibility.trt || "Não informado",
    documentData,
  );

  y = addPdfSectionTitle(pdf, y, "Atendimento", documentData);

  y = addPdfTextBlock(
    pdf,
    y,
    "Descrição do serviço",
    serviceDescription,
    documentData,
  );

  y = addPdfTextBlock(
    pdf,
    y,
    "Agendamento confirmado",
    getFinalPdfSchedule(documentData),
    documentData,
  );

  if (inspection && (inspection.id || inspection.codigo)) {
    const totalItems = Number(
      inspection.totalItens ||
        inspection.itensConcluidos ||
        inspection.checklist?.length ||
        0,
    );

    const nonconformities = Number(inspection.naoConformidades || 0);

    const okItems = Math.max(0, totalItems - nonconformities);

    y = addPdfSectionTitle(pdf, y, "Resultado da vistoria", documentData);

    y = addPdfInfoPair(
      pdf,
      y,
      {
        label: "Vistoria",
        value: inspection.codigo || "Não informada",
      },
      {
        label: "Técnico executor",
        value: inspection.tecnico?.nome || "Não informado",
      },
      documentData,
    );

    y = addPdfInfoPair(
      pdf,
      y,
      {
        label: "Validada em",
        value: formatDateTime(inspection.validadaEm || inspection.concluidaEm),
      },
      {
        label: "Equipamentos avaliados",
        value: String(
          Number(
            inspection.equipamentosAvaliados ||
              inspection.itensConcluidos ||
              totalItems,
          ),
        ),
      },
      documentData,
    );

    y = addPdfInfoPair(
      pdf,
      y,
      {
        label: "Itens OK",
        value: String(okItems),
      },
      {
        label: "Não conformidades",
        value: String(nonconformities),
      },
      documentData,
    );

    y = addPdfTextBlock(
      pdf,
      y,
      "Checklist completo",
      getFinalPdfInspectionChecklist(inspection),
      documentData,
    );
  }

  y = await addPdfPhotoGallery(pdf, y, documentData);

  y = addPdfSectionTitle(pdf, y, "Comunicação do atendimento", documentData);

  y = addPdfTextBlock(
    pdf,
    y,
    "Resposta ou orientação da Salvateck",
    companyResponse,
    documentData,
  );

  y = addPdfSectionTitle(pdf, y, "Conclusão", documentData);

  y = addPdfInfoPair(
    pdf,
    y,
    {
      label: "Concluída em",
      value: formatDateTime(documentData.concluidaEm),
    },
    {
      label: "Responsável pela conclusão",
      value: completedBy.nome || "Administrador",
    },
    documentData,
  );

  addPdfConclusionNotice(pdf, y, documentData);

  addPdfFooters(pdf, documentData);

  return pdf;
}

function setFinalPdfBusy(isBusy) {
  generatingFinalPdf = isBusy;

  const hasDocument = Boolean(currentRequest?.documentoFinal);

  viewFinalDocumentButton.disabled = isBusy || !hasDocument;

  downloadFinalDocumentButton.disabled = isBusy || !hasDocument;

  viewFinalDocumentButton.textContent = isBusy
    ? "Gerando PDF..."
    : "Visualizar documento";

  downloadFinalDocumentButton.textContent = isBusy
    ? "Preparando PDF..."
    : "Compartilhar PDF";
}

function handleFinalPdfError(error) {
  console.error("[PDF] Não foi possível gerar o documento:", error);

  if (error.message === "FINAL_DOCUMENT_NOT_FOUND") {
    showFeedback("Esta ordem ainda não possui documento final.");

    return;
  }

  if (error.message === "JSPDF_NOT_LOADED") {
    showFeedback("A biblioteca de PDF não foi carregada. Atualize a página.");

    return;
  }

  if (error.message === "PDF_PHOTO_LOAD_FAILED") {
    showFeedback(
      "Não foi possível carregar todas as imagens da OS. Tente gerar o PDF novamente.",
    );

    return;
  }

  showFeedback("Não foi possível gerar o PDF desta ordem.");
}

async function viewFinalDocumentPdf() {
  if (generatingFinalPdf) {
    return;
  }

  const previewWindow = window.open("", "_blank");

  if (!previewWindow) {
    showFeedback(
      "O navegador bloqueou a nova aba. Permita pop-ups para visualizar o PDF.",
    );

    return;
  }

  previewWindow.document.title = "Gerando documento...";

  setFinalPdfBusy(true);

  try {
    const pdf = await createFinalDocumentPdf();

    const pdfBlob = pdf.output("blob");

    const pdfUrl = URL.createObjectURL(pdfBlob);

    previewWindow.location.replace(pdfUrl);

    window.setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 120000);
  } catch (error) {
    previewWindow.close();

    handleFinalPdfError(error);
  } finally {
    setFinalPdfBusy(false);
  }
}

async function shareFinalDocumentPdf() {
  if (generatingFinalPdf) {
    return;
  }

  setFinalPdfBusy(true);

  try {
    const documentData = getFinalPdfData();

    const pdf = await createFinalDocumentPdf();

    const fileName = getFinalPdfFileName(documentData);

    const pdfBlob = pdf.output("blob");

    const pdfFile = new File([pdfBlob], fileName, {
      type: "application/pdf",

      lastModified: Date.now(),
    });

    const shareData = {
      files: [pdfFile],
    };

    const canShareFile =
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" ||
        navigator.canShare(shareData));

    if (canShareFile) {
      try {
        await navigator.share(shareData);

        showFeedback("PDF da Ordem de Serviço compartilhado com sucesso.");

        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.warn(
          "[PDF] O compartilhamento direto da Ordem de Serviço não foi concluído:",
          error,
        );
      }
    }

    pdf.save(fileName);

    showFeedback(
      "O compartilhamento direto não está disponível. O PDF foi baixado.",
    );
  } catch (error) {
    handleFinalPdfError(error);
  } finally {
    setFinalPdfBusy(false);
  }
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

  const status = currentRequest.status;

  const isNewOrAnalysis = ["nova-solicitacao", "em-analise"].includes(status);

  const isAwaitingConfirmation = status === "aguardando-confirmacao";

  const isScheduled = status === "agendada";

  const isInspection = currentRequest.tipoAtendimento === "vistoria";

  const hasLinkedInspection = Boolean(getLinkedInspectionId());

  const hasCompletedInspection = hasExecutedInspection();

  const isFinalStatus = ["concluida", "recusada", "cancelada"].includes(status);

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

  priorityCard.hidden = !isAdmin || isFinalStatus;

  priorityInputs.forEach((input) => {
    input.disabled = !isAdmin || isFinalStatus;
  });

  const orderValueLocked = ["recusada", "cancelada"].includes(status);

  orderValueCard.hidden = !isAdmin || orderValueLocked;

  orderValue.disabled = !isAdmin || orderValueLocked;

  saveOrderValueButton.disabled = !isAdmin || orderValueLocked;

  employeeAssignmentCard.hidden = !isAdmin || isFinalStatus;

  assignedEmployee.disabled = !isAdmin || isFinalStatus;

  saveEmployeeAssignmentButton.disabled = !isAdmin || isFinalStatus;

  technicalResponsibilityCard.hidden = !isAdmin || isFinalStatus;

  [
    technicalResponsibleName,
    technicalCrea,
    technicalTrt,
    saveTechnicalResponsibilityButton,
  ].forEach((field) => {
    if (field) {
      field.disabled = !isAdmin || isFinalStatus;
    }
  });

  adminActionsCard.hidden =
    !isAdmin || (!isNewOrAnalysis && !isAwaitingConfirmation);

  const canStartImmediateInspection =
    isAdmin && isInspection && !hasLinkedInspection && isNewOrAnalysis;

  scheduledActionsCard.hidden =
    !isAdmin || (!isScheduled && !canStartImmediateInspection);

  scheduledWhatsAppButton.hidden = !isScheduled;

  startInspectionButton.hidden =
    !isAdmin || !isInspection || (!isScheduled && !canStartImmediateInspection);

  startInspectionButton.textContent = hasLinkedInspection
    ? "Abrir vistoria"
    : "Iniciar vistoria";

  completeRequestButton.hidden =
    !isAdmin || !isScheduled || (isInspection && !hasLinkedInspection);

  rescheduleRequestButton.hidden =
    !isAdmin || !isScheduled || hasCompletedInspection;

  adminCancelRequestButton.hidden =
    !isAdmin || !isScheduled || hasCompletedInspection;

  if (hasCompletedInspection) {
    rescheduleForm.hidden = true;
  }

  acceptRequestButton.hidden = !isAdmin || !isNewOrAnalysis;

  confirmScheduleButton.hidden = !isAdmin || !isAwaitingConfirmation;

  rejectRequestButton.hidden = !isAdmin || !isNewOrAnalysis;

  clientActionsCard.hidden = isAdmin || isFinalStatus || status === "agendada";

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

  renderCondominium();

  renderServices();

  renderAddress();

  renderConfirmedSchedule();

  renderPhotos();

  renderObservations();

  renderOrderValue();

  renderEmployeeAssignment();

  renderTechnicalResponsibility();

  renderFinalDocument();

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
   GOOGLE AGENDA
========================================= */

let sincronizadorGoogleAgenda = null;

async function obterSincronizadorGoogleAgenda() {
  if (sincronizadorGoogleAgenda) {
    return sincronizadorGoogleAgenda;
  }

  const [appModule, functionsModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js"),
  ]);

  const apps = appModule.getApps();

  if (!apps.length) {
    throw new Error("FIREBASE_APP_NAO_INICIALIZADO");
  }

  const functions = functionsModule.getFunctions(apps[0], "southamerica-east1");

  sincronizadorGoogleAgenda = functionsModule.httpsCallable(
    functions,
    "sincronizarGoogleAgenda",
  );

  return sincronizadorGoogleAgenda;
}

let verificadorDisponibilidadeAgenda = null;

let confirmadorAgendamentoSeguro = null;

async function obterVerificadorDisponibilidadeAgenda() {
  if (verificadorDisponibilidadeAgenda) {
    return verificadorDisponibilidadeAgenda;
  }

  const [appModule, functionsModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js"),
  ]);

  const apps = appModule.getApps();

  if (!apps.length) {
    throw new Error("FIREBASE_APP_NAO_INICIALIZADO");
  }

  const functions = functionsModule.getFunctions(apps[0], "southamerica-east1");

  verificadorDisponibilidadeAgenda = functionsModule.httpsCallable(
    functions,
    "verificarDisponibilidadeAgenda",
  );

  return verificadorDisponibilidadeAgenda;
}

async function obterConfirmadorAgendamentoSeguro() {
  if (confirmadorAgendamentoSeguro) {
    return confirmadorAgendamentoSeguro;
  }

  const [appModule, functionsModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js"),
  ]);

  const apps = appModule.getApps();

  if (!apps.length) {
    throw new Error("FIREBASE_APP_NAO_INICIALIZADO");
  }

  const functions = functionsModule.getFunctions(apps[0], "southamerica-east1");

  confirmadorAgendamentoSeguro = functionsModule.httpsCallable(
    functions,
    "confirmarAgendamentoSeguro",
  );

  return confirmadorAgendamentoSeguro;
}

function montarMensagemConflitoAgenda(conflito = {}) {
  const codigo = String(conflito.codigo || "Outra OS").trim();

  const tipo =
    conflito.tipoAtendimento === "vistoria" ? "uma vistoria" : "um atendimento";

  const horarioInicio = String(conflito.horarioInicio || "").trim();

  const horarioFim = String(conflito.horarioFim || "").trim();

  const periodo =
    horarioInicio && horarioFim ? ` das ${horarioInicio} às ${horarioFim}` : "";

  return (
    `Horário indisponível. ${codigo} já possui ${tipo} agendado${periodo}. ` +
    "Escolha uma nova data ou horário."
  );
}

async function verificarDisponibilidadeDoHorario(data, horario) {
  try {
    const verificar = await obterVerificadorDisponibilidadeAgenda();

    const resposta = await verificar({
      data,
      horario,
      ordemId: currentRequest.documentId,
    });

    const resultado = resposta.data || {};

    if (resultado.disponivel === true) {
      return true;
    }

    showFeedback(montarMensagemConflitoAgenda(resultado.conflito || {}));

    return false;
  } catch (error) {
    console.error(
      "[Agenda] Não foi possível verificar a disponibilidade:",
      error,
    );

    showFeedback(
      "Não foi possível verificar a disponibilidade deste horário. Tente novamente antes de enviar a proposta.",
    );

    return false;
  }
}

async function confirmarAgendamentoComBlindagem() {
  if (savingChanges || !currentRequestReference) {
    return false;
  }

  savingChanges = true;

  try {
    const confirmar = await obterConfirmadorAgendamentoSeguro();

    const resposta = await confirmar({
      ordemId: currentRequest.documentId,
    });

    const resultado = resposta.data || {};

    if (resultado.sucesso !== true) {
      throw new Error("CONFIRMACAO_SEGURA_INVALIDA");
    }

    await loadRequest();

    closeActionForms();

    renderAll();

    showFeedback("Agendamento confirmado com sucesso.");

    return true;
  } catch (error) {
    console.error("[Agenda] Não foi possível confirmar o agendamento:", error);

    const conflito =
      error?.details?.conflito || error?.customData?.details?.conflito || null;

    if (error?.code === "functions/already-exists" || conflito) {
      showFeedback(montarMensagemConflitoAgenda(conflito || {}));

      return false;
    }

    if (error?.code === "functions/failed-precondition") {
      showFeedback(
        "Este agendamento não pode mais ser confirmado. Atualize a página e verifique os dados da OS.",
      );

      return false;
    }

    showFeedback(
      "Não foi possível confirmar o agendamento. Nenhum horário foi reservado.",
    );

    return false;
  } finally {
    savingChanges = false;
  }
}

function obterEnderecoParaAgenda() {
  const endereco = currentRequest.endereco || {};

  if (endereco.resumo) {
    return endereco.resumo;
  }

  return [
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.cidade,
    endereco.uf,
  ]
    .filter(Boolean)
    .join(", ");
}

function montarDadosDoEventoAgenda(acao, eventId = "") {
  return {
    acao,
    eventId,
    codigo: currentRequest.codigo || "",
    servico: currentRequest.titulo || "Serviço",
    condominio: currentRequest.condominio?.nome || "",
    cliente: currentRequest.cliente?.nome || "",
    telefone: currentRequest.cliente?.telefone || "",
    descricao: currentRequest.descricao || "",
    endereco: obterEnderecoParaAgenda(),
    data: currentRequest.atendimento?.dataConfirmada || "",
    horario: currentRequest.atendimento?.horarioConfirmado || "",
  };
}

async function registrarStatusDaAgenda(dados) {
  if (!currentRequestReference) {
    return;
  }

  await updateDoc(currentRequestReference, {
    agendaGoogle: dados,
    atualizadoEm: serverTimestamp(),
  });

  await loadRequest();
}

async function sincronizarAgendamentoGoogle() {
  if (currentSession.role !== "admin" || !currentRequestReference) {
    return;
  }

  const modoAtendimento = String(currentRequest.atendimento?.modo || "")
    .trim()
    .toLowerCase();

  if (modoAtendimento === "imediato") {
    return;
  }

  const eventIdAtual = currentRequest.agendaGoogle?.eventId || "";

  const acao = eventIdAtual ? "atualizar" : "criar";

  let eventIdRecebido = eventIdAtual;

  try {
    const sincronizar = await obterSincronizadorGoogleAgenda();

    const resposta = await sincronizar(
      montarDadosDoEventoAgenda(acao, eventIdAtual),
    );

    const resultado = resposta.data || {};

    if (resultado.sucesso !== true || !resultado.eventId) {
      throw new Error("RESPOSTA_INVALIDA_DA_GOOGLE_AGENDA");
    }

    eventIdRecebido = resultado.eventId;

    await registrarStatusDaAgenda({
      eventId: eventIdRecebido,
      status: "sincronizado",
      ultimaAcao: acao,
      sincronizadoEm: serverTimestamp(),
      erro: "",
    });

    showFeedback(
      acao === "criar"
        ? "Agendamento confirmado e adicionado à Google Agenda."
        : "Agendamento confirmado e atualizado na Google Agenda.",
    );
  } catch (error) {
    console.error("[Google Agenda] Falha ao sincronizar agendamento:", error);

    try {
      await registrarStatusDaAgenda({
        eventId: eventIdRecebido,
        status: "erro",
        ultimaAcao: acao,
        sincronizadoEm: null,
        erro: String(error?.message || "ERRO_DESCONHECIDO"),
      });
    } catch (statusError) {
      console.error(
        "[Google Agenda] Não foi possível registrar o erro de sincronização:",
        statusError,
      );
    }

    showFeedback(
      "Agendamento salvo no Salvateck, mas não foi possível sincronizar com a Google Agenda.",
    );
  }
}

async function removerAgendamentoGoogle() {
  if (currentSession.role !== "admin" || !currentRequestReference) {
    return;
  }

  const eventId = currentRequest.agendaGoogle?.eventId || "";

  if (!eventId) {
    return;
  }

  try {
    const sincronizar = await obterSincronizadorGoogleAgenda();

    const resposta = await sincronizar({
      acao: "excluir",
      eventId,
    });

    const resultado = resposta.data || {};

    if (resultado.sucesso !== true) {
      throw new Error("RESPOSTA_INVALIDA_DA_GOOGLE_AGENDA");
    }

    await registrarStatusDaAgenda({
      eventId,
      status: "removido",
      ultimaAcao: "excluir",
      sincronizadoEm: serverTimestamp(),
      erro: "",
    });

    showFeedback("Ordem cancelada e removida da Google Agenda.");
  } catch (error) {
    console.error("[Google Agenda] Falha ao remover evento:", error);

    try {
      await registrarStatusDaAgenda({
        eventId,
        status: "erro",
        ultimaAcao: "excluir",
        sincronizadoEm: null,
        erro: String(error?.message || "ERRO_DESCONHECIDO"),
      });
    } catch (statusError) {
      console.error(
        "[Google Agenda] Não foi possível registrar o erro de remoção:",
        statusError,
      );
    }

    showFeedback(
      "A OS foi cancelada no Salvateck, mas não foi possível removê-la da Google Agenda.",
    );
  }
}

/* =========================================
   ALTERAR PRIORIDADE
========================================= */

async function changePriority(value) {
  const isFinalStatus = ["concluida", "recusada", "cancelada"].includes(
    currentRequest.status,
  );

  if (
    currentSession.role !== "admin" ||
    !prioridadeConfig[value] ||
    isFinalStatus
  ) {
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

async function submitAccept(event) {
  event.preventDefault();

  if (!acceptForm.checkValidity()) {
    acceptForm.reportValidity();

    return;
  }

  const horarioDisponivel = await verificarDisponibilidadeDoHorario(
    acceptDate.value,
    acceptTime.value,
  );

  if (!horarioDisponivel) {
    return;
  }

  openModal({
    title: "Enviar proposta ao cliente",

    description:
      "A data e o horário serão salvos como proposta. A OS ainda não entrará oficialmente na agenda.",

    confirmationText: "Salvar e abrir WhatsApp",

    confirm: async () => {
      const whatsappWindow = window.open("", "_blank");

      const proposal = {
        data: acceptDate.value,

        periodo: acceptPeriod.value,

        horario: acceptTime.value,

        status: "aguardando",

        enviadaEm: new Date().toISOString(),
      };

      const observations = {
        cliente: currentRequest.observacoes.cliente,

        resposta:
          acceptMessage.value.trim() ||
          "A Salvateck enviou uma proposta de data para o atendimento.",

        interna: "",
      };

      const whatsappMessage = buildProposalWhatsAppMessage();

      try {
        await saveChanges(
          {
            status: "aguardando-confirmacao",

            proposta: proposal,

            observacoes: observations,
          },

          "Proposta salva. Aguardando confirmação do cliente.",
        );

        openWhatsApp(whatsappMessage, whatsappWindow);
      } catch (error) {
        whatsappWindow?.close();

        throw error;
      }
    },
  });
}
/* =========================================
   CONFIRMAR AGENDAMENTO
========================================= */

function confirmSchedule() {
  if (
    currentSession.role !== "admin" ||
    currentRequest.status !== "aguardando-confirmacao"
  ) {
    return;
  }

  const proposal = currentRequest.proposta || {};

  if (!proposal.data || !proposal.periodo || !proposal.horario) {
    showFeedback("A proposta não possui data e horário completos.");

    return;
  }

  const proposalDate = formatDate(proposal.data);

  const proposalPeriod = periodoConfig[proposal.periodo] || proposal.periodo;

  openModal({
    title: "Confirmar Agendamento",

    description:
      `O cliente confirmou o atendimento para ${proposalDate}, ` +
      `${proposalPeriod}, às ${proposal.horario}?`,

    confirmationText: "Confirmar Agendamento",

    confirm: async () => {
      const agendamentoConfirmado = await confirmarAgendamentoComBlindagem();

      if (!agendamentoConfirmado) {
        return;
      }

      await sincronizarAgendamentoGoogle();
    },
  });
}
/* =========================================
   REAGENDAR ORDEM DE SERVIÇO
========================================= */

async function submitReschedule(event) {
  event.preventDefault();

  if (
    currentSession.role !== "admin" ||
    currentRequest.status !== "agendada" ||
    hasExecutedInspection()
  ) {
    return;
  }

  if (!rescheduleForm.checkValidity()) {
    rescheduleForm.reportValidity();

    return;
  }

  const horarioDisponivel = await verificarDisponibilidadeDoHorario(
    rescheduleDate.value,
    rescheduleTime.value,
  );

  if (!horarioDisponivel) {
    return;
  }

  openModal({
    title: "Enviar nova proposta",

    description:
      "A OS voltará para Aguardando confirmação até o cliente aceitar a nova data.",

    confirmationText: "Salvar e abrir WhatsApp",

    confirm: async () => {
      const whatsappWindow = window.open("", "_blank");

      const proposal = {
        data: rescheduleDate.value,

        periodo: reschedulePeriod.value,

        horario: rescheduleTime.value,

        status: "aguardando",

        tipo: "reagendamento",

        enviadaEm: new Date().toISOString(),
      };

      const customMessage = rescheduleMessage.value.trim();

      const whatsappMessage = buildScheduleWhatsAppMessage({
        introduction:
          customMessage ||
          "Temos uma nova opção de horário para o seu atendimento.",

        date: rescheduleDate.value,

        period: reschedulePeriod.value,

        time: rescheduleTime.value,

        requiresConfirmation: true,
      });

      try {
        await saveChanges(
          {
            status: "aguardando-confirmacao",

            proposta: proposal,

            observacoes: {
              cliente: currentRequest.observacoes.cliente,

              resposta:
                customMessage ||
                "A Salvateck enviou uma nova proposta de data para o atendimento.",

              interna: "",
            },
          },

          "Nova proposta salva. Aguardando confirmação do cliente.",
        );

        openWhatsApp(whatsappMessage, whatsappWindow);
      } catch (error) {
        whatsappWindow?.close();

        throw error;
      }
    },
  });
}
async function loadLinkedInspectionForFinalDocument() {
  if (currentRequest.tipoAtendimento !== "vistoria") {
    return null;
  }

  const inspectionId = getLinkedInspectionId();

  if (!inspectionId) {
    return null;
  }

  const inspectionSnapshot = await getDoc(doc(db, "vistorias", inspectionId));

  if (!inspectionSnapshot.exists()) {
    return null;
  }

  const inspection = inspectionSnapshot.data();

  const linkedOrderId = String(
    inspection.ordemId || inspection.origem?.ordemId || "",
  ).trim();

  if (linkedOrderId && linkedOrderId !== currentRequest.documentId) {
    throw new Error("INSPECTION_ORDER_MISMATCH");
  }

  const checklist = Array.isArray(inspection.checklist)
    ? inspection.checklist.map((item) => ({
        equipamentoId: String(item.equipamentoId || "").trim(),

        nome: String(item.nome || "").trim(),

        categoria: String(item.categoria || "").trim(),

        resultado: String(item.resultado || "").trim(),

        observacao: String(item.observacao || "").trim(),
      }))
    : [];

  return {
    id: inspectionSnapshot.id,

    numero: Number(inspection.numero || 0),

    codigo: String(
      inspection.codigo || currentRequest.vistoria?.codigo || "",
    ).trim(),

    tecnico: {
      uid: String(
        inspection.tecnico?.uid || inspection.criadoPorUid || "",
      ).trim(),

      nome: String(
        inspection.tecnico?.nome || inspection.criadoPorNome || "",
      ).trim(),

      email: String(inspection.tecnico?.email || "").trim(),
    },

    validadaEm:
      inspection.validadaEm ||
      inspection.atualizadoEm ||
      inspection.criadoEm ||
      null,

    concluidaEm: inspection.validadaEm || inspection.atualizadoEm || null,

    totalItens: Number(inspection.totalItens || checklist.length),

    itensConcluidos: Number(inspection.itensConcluidos || checklist.length),

    equipamentosAvaliados: Number(
      inspection.equipamentosAvaliados ||
        inspection.itensConcluidos ||
        checklist.length,
    ),

    naoConformidades: Number(inspection.naoConformidades || 0),

    pendenciasCriticas: Number(inspection.pendenciasCriticas || 0),

    checklist,
  };
}

function buildFinalDocument(
  responsibleName,
  inspectionData = null,
  technicalResponsibility = {},
) {
  return {
    versao: 3,

    ordemId: currentRequest.documentId,

    codigo: currentRequest.codigo,

    numero: currentRequest.numero,

    titulo: currentRequest.titulo,

    tipoAtendimento: currentRequest.tipoAtendimento,

    status: "concluida",

    cliente: {
      id: currentRequest.clienteId,

      nome: currentRequest.cliente.nome,

      telefone: currentRequest.cliente.telefone,

      email: currentRequest.cliente.email,
    },

    condominio: {
      id: currentRequest.condominio?.id || "",

      codigo: currentRequest.condominio?.codigo || "",

      nome: currentRequest.condominio?.nome || "",

      cnpj: currentRequest.condominio?.cnpj || "",
    },

    responsabilidadeTecnica: {
      nome: String(technicalResponsibility.nome || "").trim(),

      crea: String(technicalResponsibility.crea || "").trim(),

      trt: String(technicalResponsibility.trt || "").trim(),
    },

    vistoria: inspectionData,

    categorias: [...currentRequest.categorias],

    servicos: [...currentRequest.servicos],

    endereco: {
      ...currentRequest.endereco,
    },

    atendimento: {
      ...currentRequest.atendimento,
    },

    observacoes: {
      cliente: currentRequest.observacoes.cliente,

      resposta: currentRequest.observacoes.resposta,
    },

    prioridade: currentRequest.prioridade,

    criadaEm: currentRequest.criadoEm,

    concluidaEm: serverTimestamp(),

    concluidaPor: {
      uid: currentSession.uid,

      nome: responsibleName,
    },
  };
}
/* =========================================
   ABRIR OU INICIAR VISTORIA
========================================= */

function getLinkedInspectionId() {
  return String(
    currentRequest?.vistoria?.id || currentRequest?.vistoria?.vistoriaId || "",
  ).trim();
}

function hasExecutedInspection() {
  return (
    currentRequest?.tipoAtendimento === "vistoria" &&
    Boolean(getLinkedInspectionId())
  );
}

let iniciadorVistoriaAgora = null;

async function obterIniciadorVistoriaAgora() {
  if (iniciadorVistoriaAgora) {
    return iniciadorVistoriaAgora;
  }

  const [appModule, functionsModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js"),
  ]);

  const apps = appModule.getApps();

  if (!apps.length) {
    throw new Error("FIREBASE_APP_NAO_INICIALIZADO");
  }

  const functions = functionsModule.getFunctions(apps[0], "southamerica-east1");

  iniciadorVistoriaAgora = functionsModule.httpsCallable(
    functions,
    "iniciarVistoriaAgora",
  );

  return iniciadorVistoriaAgora;
}

async function openInspectionExecution() {
  if (
    currentSession.role !== "admin" ||
    currentRequest.tipoAtendimento !== "vistoria"
  ) {
    return;
  }

  const linkedInspectionId = getLinkedInspectionId();

  if (linkedInspectionId) {
    if (currentRequest.status !== "agendada") {
      return;
    }

    const parameters = new URLSearchParams({
      perfil: "admin",
      vistoria: linkedInspectionId,
      modo: "consulta",
    });

    window.location.href = `nova-vistoria.html?${parameters.toString()}`;

    return;
  }

  if (currentRequest.status === "agendada") {
    const parameters = new URLSearchParams({
      perfil: "admin",
      ordem: currentRequest.documentId,
      modo: "execucao",
    });

    window.location.href = `nova-vistoria.html?${parameters.toString()}`;

    return;
  }

  if (
    !["nova-solicitacao", "em-analise"].includes(currentRequest.status) ||
    savingChanges
  ) {
    return;
  }

  savingChanges = true;

  const originalText = startInspectionButton.textContent;

  startInspectionButton.disabled = true;
  startInspectionButton.textContent = "Iniciando vistoria...";

  try {
    const iniciarVistoria = await obterIniciadorVistoriaAgora();

    const resposta = await iniciarVistoria({
      ordemId: currentRequest.documentId,
    });

    const resultado = resposta.data || {};

    if (resultado.sucesso !== true) {
      throw new Error("Não foi possível iniciar a vistoria agora.");
    }

    const parameters = new URLSearchParams({
      perfil: "admin",
      ordem: currentRequest.documentId,
      modo: "execucao",
    });

    window.location.href = `nova-vistoria.html?${parameters.toString()}`;
  } catch (error) {
    console.error("[Detalhes] Não foi possível iniciar a vistoria:", error);

    showFeedback(
      error?.message || "Não foi possível iniciar a vistoria agora.",
    );
  } finally {
    savingChanges = false;

    startInspectionButton.disabled = false;
    startInspectionButton.textContent = originalText;
  }
}

/* =========================================
   CONCLUIR ORDEM DE SERVIÇO
========================================= */

function completeRequest() {
  if (currentSession.role !== "admin" || currentRequest.status !== "agendada") {
    return;
  }

  const technicalResponsibility = getTechnicalResponsibilityFormData();

  if (!isTechnicalResponsibilityComplete(technicalResponsibility)) {
    showFeedback("Informe o nome do Responsável Técnico.");

    focusFirstMissingTechnicalField(technicalResponsibility);

    technicalResponsibilityCard.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    return;
  }

  openModal({
    title: "Concluir ordem de serviço",

    description:
      "Confirme que o atendimento foi realizado. A OS será movida para Concluídas e não poderá mais ser alterada por esta tela.",

    confirmationText: "Concluir OS",

    confirm: async () => {
      const responsibleName =
        currentSession.nome ||
        currentSession.profile?.nome ||
        currentSession.email ||
        "Administrador";

      let inspectionData = null;

      if (currentRequest.tipoAtendimento === "vistoria") {
        try {
          inspectionData = await loadLinkedInspectionForFinalDocument();
        } catch (error) {
          console.error("[Detalhes] Vínculo da vistoria inválido:", error);

          showFeedback(
            "A vistoria vinculada não corresponde a esta Ordem de Serviço.",
          );

          return;
        }

        if (!inspectionData) {
          showFeedback(
            "A vistoria vinculada não foi encontrada. Abra ou execute a vistoria antes de concluir a OS.",
          );

          return;
        }
      }

      const technicalRecord = {
        ...technicalResponsibility,

        atualizadoPorUid: currentSession.uid,

        atualizadoEm: serverTimestamp(),
      };

      const changes = {
        status: "concluida",

        concluidaEm: serverTimestamp(),

        concluidaPorUid: currentSession.uid,

        concluidaPorNome: responsibleName,

        responsabilidadeTecnica: technicalRecord,

        documentoFinal: buildFinalDocument(
          responsibleName,
          inspectionData,
          technicalResponsibility,
        ),
      };

      if (currentRequest.tipoAtendimento === "vistoria") {
        changes["vistoria.status"] = "concluida";
        changes["vistoria.progresso"] = 100;
        changes["vistoria.concluidaEm"] = serverTimestamp();
      }

      await saveChanges(changes, "Ordem de serviço concluída com sucesso.");
    },
  });
}
/* =========================================
   CANCELAR ORDEM PELO ADMINISTRADOR
========================================= */

function cancelRequestByAdmin() {
  if (
    currentSession.role !== "admin" ||
    currentRequest.status !== "agendada" ||
    hasExecutedInspection()
  ) {
    return;
  }

  openModal({
    title: "Cancelar ordem de serviço",

    description:
      "A OS será cancelada e permanecerá registrada no histórico. Nenhum dado será apagado.",

    confirmationText: "Cancelar OS",

    danger: true,

    confirm: async () => {
      await saveChanges(
        {
          status: "cancelada",

          canceladaEm: serverTimestamp(),

          canceladaPorUid: currentSession.uid,

          canceladaPorNome:
            currentSession.nome || currentSession.email || "Administrador",

          motivoCancelamento: "Ordem de serviço cancelada pelo administrador.",
        },

        "Ordem de serviço cancelada.",
      );

      await removerAgendamentoGoogle();
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

additionalPhotosInput.addEventListener(
  "change",
  handleAdditionalPhotoSelection,
);

uploadAdditionalPhotosButton.addEventListener("click", uploadAdditionalPhotos);

viewFinalDocumentButton.addEventListener("click", viewFinalDocumentPdf);

downloadFinalDocumentButton.addEventListener("click", shareFinalDocumentPdf);

orderValue.addEventListener("input", () => {
  orderValue.value = formatOrderValueInput(orderValue.value);
});

orderValueForm.addEventListener("submit", saveOrderValue);

employeeAssignmentForm.addEventListener("submit", saveEmployeeAssignment);

technicalResponsibilityForm.addEventListener(
  "submit",
  saveTechnicalResponsibility,
);

priorityInputs.forEach((input) => {
  input.addEventListener("change", () => {
    changePriority(input.value);
  });
});

acceptRequestButton.addEventListener("click", () => {
  fillAcceptForm();

  openActionForm(acceptForm);
});

confirmScheduleButton.addEventListener("click", confirmSchedule);
scheduledWhatsAppButton.addEventListener("click", contactScheduledClient);

rescheduleRequestButton.addEventListener("click", () => {
  if (hasExecutedInspection()) {
    return;
  }

  rescheduleDate.value = currentRequest.atendimento?.dataConfirmada || "";

  reschedulePeriod.value = currentRequest.atendimento?.periodoConfirmado || "";

  rescheduleTime.value = currentRequest.atendimento?.horarioConfirmado || "";

  openActionForm(rescheduleForm);
});

startInspectionButton.addEventListener("click", openInspectionExecution);

completeRequestButton.addEventListener("click", completeRequest);

adminCancelRequestButton.addEventListener("click", cancelRequestByAdmin);
rejectRequestButton.addEventListener("click", () => {
  openActionForm(rejectForm);
});

closeActionButtons.forEach((button) => {
  button.addEventListener("click", closeActionForms);
});

acceptForm.addEventListener("submit", submitAccept);

rejectForm.addEventListener("submit", submitRejection);

rescheduleForm.addEventListener("submit", submitReschedule);

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

    rescheduleDate.min = minimumDate;

    await loadRequest();

    await loadAssignableEmployees();

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
