import "./auth-guard.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  getDownloadURL,
  ref,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import { db, storage } from "./firebase-config.js";

/* =========================================================
SALVATECK
DETALHES DO ORÇAMENTO
========================================================= */

/* =========================================================
ELEMENTOS
========================================================= */

const loadingCard = document.getElementById("budget-loading");
const notFoundCard = document.getElementById("budget-not-found");
const notFoundMessage = document.getElementById("budget-not-found-message");
const detailContent = document.getElementById("budget-detail-content");

const budgetCode = document.getElementById("budget-detail-code");
const budgetStatus = document.getElementById("budget-detail-status");
const budgetTitle = document.getElementById("budget-detail-title");
const budgetSubtitle = document.getElementById("budget-detail-subtitle");
const budgetDate = document.getElementById("budget-detail-date");
const budgetValidity = document.getElementById("budget-detail-validity");
const budgetTotal = document.getElementById("budget-detail-total");

const editBudgetButton = document.getElementById("edit-budget-button");
const duplicateBudgetButton = document.getElementById(
  "duplicate-budget-button",
);
const generatePdfButton = document.getElementById("generate-budget-pdf-button");
const shareBudgetButton = document.getElementById("share-budget-button");
const generateBudgetImageButton = document.getElementById(
  "generate-budget-image-button",
);

const coverCard = document.getElementById("budget-cover-card");
const coverImage = document.getElementById("budget-cover-image");

const clientName = document.getElementById("budget-client-name");
const clientPhone = document.getElementById("budget-client-phone");
const clientEmail = document.getElementById("budget-client-email");

const condominiumName = document.getElementById("budget-condominium-name");
const condominiumCnpj = document.getElementById("budget-condominium-cnpj");
const condominiumUnit = document.getElementById("budget-condominium-unit");
const budgetAddress = document.getElementById("budget-address");

const proposalTitle = document.getElementById("budget-proposal-title");
const proposalSubtitle = document.getElementById("budget-proposal-subtitle");
const serviceDescription = document.getElementById(
  "budget-service-description",
);
const budgetObjective = document.getElementById("budget-objective");

const servicesList = document.getElementById("budget-services-list");

const materialsContainer = document.getElementById(
  "budget-materials-container",
);
const materialsNote = document.getElementById("budget-materials-note");

const originalValue = document.getElementById("budget-original-value");
const discountValue = document.getElementById("budget-discount-value");
const discountDescriptionContainer = document.getElementById(
  "budget-discount-description-container",
);
const discountDescription = document.getElementById(
  "budget-discount-description",
);
const finalValue = document.getElementById("budget-final-value");

const generalConditions = document.getElementById("budget-general-conditions");
const warranty = document.getElementById("budget-warranty");
const executionTime = document.getElementById("budget-execution-time");

const paymentConditions = document.getElementById("budget-payment-conditions");

const publicNoteCard = document.getElementById("budget-public-note-card");
const publicNote = document.getElementById("budget-public-note");

const internalNoteCard = document.getElementById("budget-internal-note-card");
const internalNote = document.getElementById("budget-internal-note");

const approvalCurrentStatus = document.getElementById(
  "approval-current-status",
);
const approvalUpdatedAt = document.getElementById("approval-updated-at");

const markSentButton = document.getElementById("mark-budget-sent-button");
const approveButton = document.getElementById("approve-budget-button");
const rejectButton = document.getElementById("reject-budget-button");
const expireButton = document.getElementById("expire-budget-button");

const conversionCard = document.getElementById("budget-conversion-card");
const convertBudgetOrderButton = document.getElementById(
  "convert-budget-order-button",
);

const createdBy = document.getElementById("budget-created-by");
const createdAt = document.getElementById("budget-created-at");

const confirmModal = document.getElementById("budget-confirm-modal");
const modalTitle = document.getElementById("budget-modal-title");
const modalMessage = document.getElementById("budget-modal-message");
const cancelModalButton = document.getElementById("cancel-budget-modal");
const confirmModalButton = document.getElementById("confirm-budget-modal");

const feedback = document.getElementById("budget-detail-feedback");

/* =========================================================
ESTADO
========================================================= */

let currentSession = null;
let currentBudgetId = "";
let currentBudget = null;
let currentPrivateData = null;
let pendingStatus = "";
let changingStatus = false;
let feedbackTimer = null;

/* =========================================================
STATUS
========================================================= */

const statusConfig = {
  rascunho: {
    label: "Rascunho",
    className: "budget-status--draft",
  },

  enviado: {
    label: "Enviado",
    className: "budget-status--sent",
  },

  aprovado: {
    label: "Aprovado",
    className: "budget-status--approved",
  },

  recusado: {
    label: "Recusado",
    className: "budget-status--rejected",
  },

  expirado: {
    label: "Expirado",
    className: "budget-status--expired",
  },
};

const statusConfirmations = {
  enviado: {
    title: "Marcar como enviado?",
    message: "O orçamento será identificado como enviado ao cliente.",
  },

  aprovado: {
    title: "Aprovar orçamento?",
    message:
      "O orçamento será marcado como aprovado e ficará disponível para a futura conversão em Ordem de Serviço.",
  },

  recusado: {
    title: "Recusar orçamento?",
    message:
      "O orçamento será marcado como recusado. Essa alteração ficará registrada na proposta.",
  },

  expirado: {
    title: "Marcar como expirado?",
    message:
      "O orçamento será marcado como expirado e deixará de ser considerado uma proposta vigente.",
  },
};

/* =========================================================
AUXILIARES
========================================================= */

function text(value) {
  return String(value || "").trim();
}

function setText(element, value, fallback = "—") {
  if (!element) {
    return;
  }

  element.textContent = text(value) || fallback;
}

function formatCurrency(value) {
  const number = Number(value || 0);

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parseDateOnly(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12,
      0,
      0,
    ),
  );
}

function timestampToDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDate(value) {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? parseDateOnly(value)
      : timestampToDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  const date = timestampToDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusData(status) {
  return statusConfig[status] || statusConfig.rascunho;
}

function showFeedback(message, type = "info") {
  window.clearTimeout(feedbackTimer);

  feedback.textContent = message;

  feedback.classList.remove("is-success", "is-error");

  if (type === "success") {
    feedback.classList.add("is-success");
  }

  if (type === "error") {
    feedback.classList.add("is-error");
  }

  feedback.hidden = false;

  feedbackTimer = window.setTimeout(() => {
    feedback.hidden = true;
  }, 5200);
}

function showNotFound(message) {
  loadingCard.hidden = true;
  detailContent.hidden = true;

  notFoundMessage.textContent =
    message || "Confira se o orçamento ainda existe ou volte para a listagem.";

  notFoundCard.hidden = false;
}

function getBudgetIdFromUrl() {
  const parameters = new URLSearchParams(window.location.search);

  return text(parameters.get("id"));
}

/* =========================================================
STATUS VISUAL
========================================================= */

function renderStatus(status) {
  const config = getStatusData(status);

  budgetStatus.classList.remove(
    "budget-status--draft",
    "budget-status--sent",
    "budget-status--approved",
    "budget-status--rejected",
    "budget-status--expired",
  );

  budgetStatus.classList.add(config.className);

  budgetStatus.textContent = config.label;
  approvalCurrentStatus.textContent = config.label;

  markSentButton.hidden = status === "enviado";
  approveButton.hidden = status === "aprovado";
  rejectButton.hidden = status === "recusado";
  expireButton.hidden = status === "expirado";

  conversionCard.hidden = status !== "aprovado";
}

/* =========================================================
SERVIÇOS
========================================================= */

function renderServices(services) {
  servicesList.innerHTML = "";

  const items = Array.isArray(services)
    ? services.map(text).filter(Boolean)
    : [];

  if (items.length === 0) {
    const item = document.createElement("li");

    item.textContent = "Nenhum serviço informado.";

    servicesList.appendChild(item);

    return;
  }

  items.forEach((service) => {
    const item = document.createElement("li");

    item.textContent = service;

    servicesList.appendChild(item);
  });
}

/* =========================================================
CONDIÇÕES
========================================================= */

function renderConditions(conditions) {
  generalConditions.innerHTML = "";

  const items = Array.isArray(conditions)
    ? conditions.map(text).filter(Boolean)
    : [];

  if (items.length === 0) {
    const item = document.createElement("li");

    item.textContent = "Nenhuma condição geral informada.";

    generalConditions.appendChild(item);

    return;
  }

  items.forEach((condition) => {
    const item = document.createElement("li");

    item.textContent = condition;

    generalConditions.appendChild(item);
  });
}

/* =========================================================
IMAGEM
========================================================= */

async function resolveBudgetImageUrl(imageData) {
  const savedUrl = text(imageData?.url);

  if (savedUrl) {
    return savedUrl;
  }

  const storagePath = text(imageData?.storagePath);

  if (!storagePath) {
    return "";
  }

  return getDownloadURL(ref(storage, storagePath));
}

async function renderBudgetImage() {
  const imageData = currentBudget?.imagemPrincipal;

  if (!imageData) {
    coverCard.hidden = true;

    return;
  }

  try {
    const url = await resolveBudgetImageUrl(imageData);

    if (!url) {
      coverCard.hidden = true;

      return;
    }

    coverImage.src = url;

    coverImage.alt = currentBudget?.titulo
      ? `Imagem do orçamento ${currentBudget.titulo}`
      : "Imagem principal do orçamento";

    coverCard.hidden = false;
  } catch (error) {
    console.error(
      "[Detalhes Orçamento] Não foi possível carregar a imagem:",
      error,
    );

    coverCard.hidden = true;
  }
}

/* =========================================================
CLIENTE E CONDOMÍNIO
========================================================= */

function renderIdentification() {
  const client = currentBudget?.cliente || {};
  const condominium = currentBudget?.condominio || {};
  const address = condominium?.endereco || {};

  setText(clientName, client.nome || currentBudget?.clienteNome);
  setText(clientPhone, client.telefone, "Não informado");
  setText(clientEmail, client.email, "Não informado");

  const condominiumLabel = [
    text(condominium.codigo),
    text(condominium.nome || currentBudget?.condominioNome),
  ]
    .filter(Boolean)
    .join(" — ");

  setText(condominiumName, condominiumLabel, "Não informado");

  setText(condominiumCnpj, condominium.cnpj, "Não informado");

  setText(condominiumUnit, condominium.unidade, "Não informada");

  setText(budgetAddress, address.resumo, "Não informado");
}

/* =========================================================
PROPOSTA
========================================================= */

function renderProposal() {
  setText(proposalTitle, currentBudget?.titulo);

  setText(proposalSubtitle, currentBudget?.subtitulo);

  setText(serviceDescription, currentBudget?.descricaoServico);

  setText(budgetObjective, currentBudget?.objetivo);

  renderServices(currentBudget?.servicosInclusos);

  const materials = text(currentBudget?.materiaisFornecimento);

  materialsContainer.hidden = !materials;

  if (materials) {
    materialsNote.textContent = materials;
  }
}

/* =========================================================
INVESTIMENTO
========================================================= */

function renderInvestment() {
  const investment = currentBudget?.investimento || {};

  const serviceAmount = Number(
    investment.valorServico ?? currentBudget?.valorServico ?? 0,
  );

  const discountAmount = Number(
    investment.desconto ?? currentBudget?.desconto ?? 0,
  );

  const totalAmount = Number(
    investment.valorFinal ??
      currentBudget?.valorFinal ??
      Math.max(0, serviceAmount - discountAmount),
  );

  originalValue.textContent = formatCurrency(serviceAmount);

  discountValue.textContent = formatCurrency(discountAmount);

  finalValue.textContent = formatCurrency(totalAmount);

  budgetTotal.textContent = formatCurrency(totalAmount);

  const benefitDescription = text(investment.descricaoDesconto);

  discountDescriptionContainer.hidden = !benefitDescription;

  if (benefitDescription) {
    discountDescription.textContent = benefitDescription;
  }
}

/* =========================================================
CONDIÇÕES E OBSERVAÇÕES
========================================================= */

function renderCommercialConditions() {
  const conditions = currentBudget?.condicoes || {};

  renderConditions(conditions.gerais);

  setText(warranty, conditions.garantia, "Não informada");

  setText(executionTime, conditions.prazoExecucao, "Não informado");

  setText(paymentConditions, conditions.pagamento, "Não informado");

  const proposalNote = text(currentBudget?.observacoes?.publica);

  publicNoteCard.hidden = !proposalNote;

  if (proposalNote) {
    publicNote.textContent = proposalNote;
  }

  const privateObservation = text(currentPrivateData?.observacaoInterna);

  internalNoteCard.hidden = !privateObservation;

  if (privateObservation) {
    internalNote.textContent = privateObservation;
  }
}

/* =========================================================
DATAS
========================================================= */

function renderDates() {
  const proposal = currentBudget?.proposta || {};

  budgetDate.textContent = formatDate(proposal.data);

  const validityDays = Number(proposal.validadeDias || 0);

  const validityDate = formatDate(proposal.validadeAte);

  if (validityDays > 0 && validityDate !== "—") {
    budgetValidity.textContent = `${validityDays} dias • até ${validityDate}`;
  } else if (validityDays > 0) {
    budgetValidity.textContent = `${validityDays} dias`;
  } else {
    budgetValidity.textContent = validityDate;
  }

  approvalUpdatedAt.textContent = formatDateTime(
    currentBudget?.atualizadoEm || currentBudget?.criadoEm,
  );

  setText(createdBy, currentBudget?.criadoPorNome, "Administrador");

  createdAt.textContent = formatDateTime(currentBudget?.criadoEm);
}

/* =========================================================
RENDERIZAÇÃO
========================================================= */

async function renderBudget() {
  if (!currentBudget) {
    return;
  }

  setText(budgetCode, currentBudget.codigo, "ORC-0000");

  setText(budgetTitle, currentBudget.titulo, "Orçamento");

  setText(
    budgetSubtitle,
    currentBudget.subtitulo,
    "Proposta comercial Salvateck",
  );

  renderStatus(text(currentBudget.status) || "rascunho");

  renderIdentification();
  renderProposal();
  renderInvestment();
  renderCommercialConditions();
  renderDates();

  await renderBudgetImage();
}

/* =========================================================
CARREGAMENTO
========================================================= */

async function loadBudget() {
  if (!currentBudgetId) {
    showNotFound("O identificador do orçamento não foi informado.");

    return;
  }

  try {
    let budgetSnapshot = null;

    const directReference = doc(db, "orcamentos", currentBudgetId);

    const directSnapshot = await getDoc(directReference);

    if (directSnapshot.exists()) {
      budgetSnapshot = directSnapshot;
    } else {
      const budgetQuery = query(
        collection(db, "orcamentos"),
        where("codigo", "==", currentBudgetId.toUpperCase()),
        limit(1),
      );

      const querySnapshot = await getDocs(budgetQuery);

      if (!querySnapshot.empty) {
        budgetSnapshot = querySnapshot.docs[0];
      }
    }

    if (!budgetSnapshot) {
      showNotFound("Este orçamento não foi encontrado no Firebase.");

      return;
    }

    currentBudgetId = budgetSnapshot.id;

    const privateReference = doc(db, "orcamentosPrivados", currentBudgetId);

    const privateSnapshot = await getDoc(privateReference);

    currentBudget = {
      id: budgetSnapshot.id,
      ...budgetSnapshot.data(),
    };

    currentPrivateData = privateSnapshot.exists()
      ? {
          id: privateSnapshot.id,
          ...privateSnapshot.data(),
        }
      : null;

    await renderBudget();

    loadingCard.hidden = true;
    notFoundCard.hidden = true;
    detailContent.hidden = false;
  } catch (error) {
    console.error("[Detalhes Orçamento] Não foi possível carregar:", error);

    showNotFound(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou o acesso a este orçamento."
        : "Não foi possível carregar o orçamento. Verifique sua conexão e tente novamente.",
    );
  }
}

/* =========================================================
MODAL DE STATUS
========================================================= */

function openStatusModal(status) {
  const config = statusConfirmations[status];

  if (!config) {
    return;
  }

  pendingStatus = status;

  modalTitle.textContent = config.title;

  modalMessage.textContent = config.message;

  confirmModal.hidden = false;

  document.body.style.overflow = "hidden";

  window.setTimeout(() => {
    confirmModalButton.focus();
  }, 50);
}

function closeStatusModal() {
  if (changingStatus) {
    return;
  }

  pendingStatus = "";

  confirmModal.hidden = true;

  document.body.style.overflow = "";
}

/* =========================================================
ALTERAÇÃO DE STATUS
========================================================= */

function getStatusTimestampField(status) {
  const fields = {
    enviado: "enviadoEm",
    aprovado: "aprovadoEm",
    recusado: "recusadoEm",
    expirado: "expiradoEm",
  };

  return fields[status] || "";
}

async function updateBudgetStatus(status) {
  if (changingStatus || !currentBudgetId || !statusConfig[status]) {
    return;
  }

  if (text(currentBudget?.status) === status) {
    closeStatusModal();

    return;
  }

  changingStatus = true;

  const originalButtonText = confirmModalButton.textContent;

  confirmModalButton.disabled = true;

  cancelModalButton.disabled = true;

  confirmModalButton.textContent = "Atualizando...";

  const reference = doc(db, "orcamentos", currentBudgetId);

  try {
    const updates = {
      status,
      statusAtualizadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
      atualizadoPorUid: currentSession.uid,
      atualizadoPorNome: text(
        currentSession?.profile?.nome ||
          currentSession?.email ||
          "Administrador",
      ),
    };

    const timestampField = getStatusTimestampField(status);

    if (timestampField) {
      updates[timestampField] = serverTimestamp();
    }

    await updateDoc(reference, updates);

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      throw new Error("BUDGET_NOT_FOUND_AFTER_UPDATE");
    }

    currentBudget = {
      id: snapshot.id,
      ...snapshot.data(),
    };

    await renderBudget();

    confirmModal.hidden = true;

    document.body.style.overflow = "";

    pendingStatus = "";

    showFeedback(
      `Orçamento marcado como ${getStatusData(status).label.toLowerCase()}.`,
      "success",
    );
  } catch (error) {
    console.error("[Detalhes Orçamento] Falha ao alterar status:", error);

    showFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a alteração do orçamento."
        : "Não foi possível alterar o status do orçamento.",
      "error",
    );
  } finally {
    changingStatus = false;

    confirmModalButton.disabled = false;

    cancelModalButton.disabled = false;

    confirmModalButton.textContent = originalButtonText;
  }
}

/* =========================================================
PDF DO ORÇAMENTO
========================================================= */

let generatingBudgetPdf = false;

const PDF_COLORS = {
  blue: [13, 56, 97],
  blueDark: [7, 39, 70],
  gold: [221, 154, 23],
  dark: [43, 47, 51],
  gray: [105, 112, 119],
  border: [221, 225, 228],
  light: [247, 248, 249],
  white: [255, 255, 255],
  green: [23, 101, 62],
};

function sanitizePdfText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function getBudgetPdfFileName() {
  const safeCode = sanitizePdfText(currentBudget?.codigo || "orcamento")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-");

  return `Salvateck-${safeCode}-orcamento.pdf`;
}

async function loadFileAsDataUrl(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("PDF_IMAGE_LOAD_FAILED");
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("PDF_IMAGE_LOAD_FAILED"));
    };

    reader.readAsDataURL(blob);
  });
}

async function loadBudgetPdfLogo() {
  try {
    const originalDataUrl = await loadFileAsDataUrl(
      "assets/logo.salvateck.png",
    );

    const image = await new Promise((resolve, reject) => {
      const imageElement = new Image();

      imageElement.onload = () => {
        resolve(imageElement);
      };

      imageElement.onerror = () => {
        reject(new Error("PDF_LOGO_LOAD_FAILED"));
      };

      imageElement.src = originalDataUrl;
    });

    const canvas = document.createElement("canvas");

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("PDF_LOGO_LOAD_FAILED");
    }

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const pixels = imageData.data;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];

      if (red >= 245 && green >= 245 && blue >= 245) {
        pixels[index + 3] = 0;
      }
    }

    context.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.warn("[PDF Orçamento] Não foi possível carregar a logo:", error);

    return "";
  }
}

async function loadBudgetPdfImage() {
  const imageData = currentBudget?.imagemPrincipal;

  if (!imageData) {
    return "";
  }

  try {
    const imageUrl = await resolveBudgetImageUrl(imageData);

    if (!imageUrl) {
      return "";
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error("PDF_IMAGE_LOAD_FAILED");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const image = await new Promise((resolve, reject) => {
        const imageElement = new Image();

        imageElement.onload = () => {
          resolve(imageElement);
        };

        imageElement.onerror = () => {
          reject(new Error("PDF_IMAGE_LOAD_FAILED"));
        };

        imageElement.src = objectUrl;
      });

      const maxDimension = 1800;

      const largestDimension = Math.max(
        image.naturalWidth,
        image.naturalHeight,
      );

      const scale =
        largestDimension > maxDimension ? maxDimension / largestDimension : 1;

      const width = Math.max(1, Math.round(image.naturalWidth * scale));

      const height = Math.max(1, Math.round(image.naturalHeight * scale));

      const canvas = document.createElement("canvas");

      const context = canvas.getContext("2d", {
        alpha: false,
      });

      if (!context) {
        throw new Error("PDF_IMAGE_LOAD_FAILED");
      }

      canvas.width = width;
      canvas.height = height;

      context.fillStyle = "#ffffff";

      context.fillRect(0, 0, width, height);

      context.drawImage(image, 0, 0, width, height);

      return canvas.toDataURL("image/jpeg", 0.9);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    console.warn(
      "[PDF Orçamento] Não foi possível carregar a imagem principal:",
      error,
    );

    return "";
  }
}

function addBudgetPdfContainedImage(pdf, dataUrl, format, x, y, width, height) {
  const properties = pdf.getImageProperties(dataUrl);

  const imageRatio = properties.width / properties.height;

  const boxRatio = width / height;

  let finalWidth = width;
  let finalHeight = height;

  if (imageRatio > boxRatio) {
    finalHeight = width / imageRatio;
  } else {
    finalWidth = height * imageRatio;
  }

  const finalX = x + (width - finalWidth) / 2;

  const finalY = y + (height - finalHeight) / 2;

  pdf.addImage(dataUrl, format, finalX, finalY, finalWidth, finalHeight);
}

function addBudgetPdfContinuationHeader(pdf, documentData) {
  pdf.setFillColor(...PDF_COLORS.blue);

  pdf.rect(0, 0, 210, 25, "F");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(10);

  pdf.setTextColor(...PDF_COLORS.white);

  pdf.text("SALVATECK", 15, 11);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(7);

  pdf.setTextColor(220, 228, 235);

  pdf.text("Proposta comercial", 15, 17);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(9);

  pdf.setTextColor(...PDF_COLORS.gold);

  pdf.text(sanitizePdfText(documentData.codigo || "ORÇAMENTO"), 195, 14, {
    align: "right",
  });
}

function ensureBudgetPdfSpace(pdf, currentY, requiredHeight, documentData) {
  if (currentY + requiredHeight <= 268) {
    return currentY;
  }

  pdf.addPage();

  addBudgetPdfContinuationHeader(pdf, documentData);

  return 34;
}

function addBudgetPdfSectionTitle(pdf, currentY, number, title, documentData) {
  const y = ensureBudgetPdfSpace(pdf, currentY, 15, documentData);

  pdf.setFillColor(...PDF_COLORS.gold);

  pdf.roundedRect(15, y - 4, 13, 9, 2, 2, "F");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7);

  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text(String(number).padStart(2, "0"), 21.5, y + 1, {
    align: "center",
  });

  pdf.setFontSize(10);

  pdf.text(sanitizePdfText(title).toUpperCase(), 33, y + 1);

  pdf.setDrawColor(...PDF_COLORS.border);

  pdf.line(33, y + 4, 195, y + 4);

  return y + 11;
}

function addBudgetPdfInfoPair(
  pdf,
  currentY,
  leftItem,
  rightItem,
  documentData,
) {
  const y = ensureBudgetPdfSpace(pdf, currentY, 23, documentData);

  const width = 86.5;

  [leftItem, rightItem].forEach((item, index) => {
    const x = 15 + index * 91.5;

    pdf.setFillColor(...PDF_COLORS.light);

    pdf.setDrawColor(...PDF_COLORS.border);

    pdf.roundedRect(x, y, width, 18, 2.5, 2.5, "FD");

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(6.3);

    pdf.setTextColor(...PDF_COLORS.gray);

    pdf.text(sanitizePdfText(item.label).toUpperCase(), x + 4, y + 5.5);

    pdf.setFontSize(8.2);

    pdf.setTextColor(...PDF_COLORS.blue);

    const valueLines = pdf
      .splitTextToSize(
        sanitizePdfText(item.value || "Não informado"),
        width - 8,
      )
      .slice(0, 2);

    pdf.text(valueLines, x + 4, y + 11);
  });

  return y + 23;
}

function addBudgetPdfTextBlock(pdf, currentY, label, value, documentData) {
  const lines = pdf.splitTextToSize(
    sanitizePdfText(value || "Não informado"),
    168,
  );

  const cardHeight = Math.max(22, 13 + lines.length * 4.2);

  const y = ensureBudgetPdfSpace(pdf, currentY, cardHeight + 5, documentData);

  pdf.setFillColor(...PDF_COLORS.light);

  pdf.setDrawColor(...PDF_COLORS.border);

  pdf.roundedRect(15, y, 180, cardHeight, 2.5, 2.5, "FD");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(6.5);

  pdf.setTextColor(...PDF_COLORS.gray);

  pdf.text(sanitizePdfText(label).toUpperCase(), 20, y + 6);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(8.3);

  pdf.setTextColor(...PDF_COLORS.dark);

  pdf.text(lines, 20, y + 12);

  return y + cardHeight + 5;
}

function addBudgetPdfServices(pdf, currentY, services, documentData) {
  let y = currentY;

  const items = Array.isArray(services)
    ? services.map((service) => sanitizePdfText(service)).filter(Boolean)
    : [];

  const serviceItems = items.length > 0 ? items : ["Nenhum serviço informado."];

  serviceItems.forEach((service, index) => {
    const lines = pdf.splitTextToSize(service, 155);

    const rowHeight = Math.max(12, 7 + lines.length * 4.1);

    y = ensureBudgetPdfSpace(pdf, y, rowHeight + 3, documentData);

    pdf.setFillColor(...PDF_COLORS.light);

    pdf.setDrawColor(...PDF_COLORS.border);

    pdf.roundedRect(15, y, 180, rowHeight, 2.5, 2.5, "FD");

    pdf.setFillColor(244, 226, 190);

    pdf.roundedRect(19, y + 3, 9, 7, 2, 2, "F");

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(7);

    pdf.setTextColor(...PDF_COLORS.blue);

    pdf.text(String(index + 1), 23.5, y + 7.8, {
      align: "center",
    });

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(8.3);

    pdf.setTextColor(...PDF_COLORS.dark);

    pdf.text(lines, 33, y + 7);

    y += rowHeight + 3;
  });

  return y;
}

function addBudgetPdfInvestment(pdf, currentY, documentData) {
  const investment = documentData.investimento || {};

  const serviceAmount = Number(
    investment.valorServico ?? documentData.valorServico ?? 0,
  );

  const discountAmount = Number(
    investment.desconto ?? documentData.desconto ?? 0,
  );

  const finalAmount = Number(
    investment.valorFinal ??
      documentData.valorFinal ??
      Math.max(0, serviceAmount - discountAmount),
  );

  const discountText = sanitizePdfText(investment.descricaoDesconto || "");

  const cardHeight = discountText ? 46 : 40;

  const y = ensureBudgetPdfSpace(pdf, currentY, cardHeight + 5, documentData);

  pdf.setFillColor(...PDF_COLORS.light);

  pdf.setDrawColor(...PDF_COLORS.border);

  pdf.roundedRect(15, y, 180, cardHeight, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(6.8);

  pdf.setTextColor(...PDF_COLORS.gray);

  pdf.text("VALOR DO SERVIÇO", 21, y + 8);

  pdf.text("DESCONTO", 21, y + 19);

  pdf.setFontSize(9);

  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text(formatCurrency(serviceAmount), 21, y + 13);

  pdf.text(formatCurrency(discountAmount), 21, y + 24);

  if (discountText) {
    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(7);

    pdf.setTextColor(...PDF_COLORS.gray);

    pdf.text(pdf.splitTextToSize(discountText, 80).slice(0, 2), 21, y + 31);
  }

  pdf.setFillColor(...PDF_COLORS.gold);

  pdf.roundedRect(112, y + 5, 76, cardHeight - 10, 3, 3, "F");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(7);

  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text("INVESTIMENTO FINAL", 150, y + 14, {
    align: "center",
  });

  pdf.setFontSize(18);

  pdf.text(formatCurrency(finalAmount), 150, y + 25, {
    align: "center",
  });

  return y + cardHeight + 5;
}

function addBudgetPdfConditions(pdf, currentY, conditions, documentData) {
  let y = currentY;

  const items = Array.isArray(conditions)
    ? conditions.map((condition) => sanitizePdfText(condition)).filter(Boolean)
    : [];

  const conditionItems =
    items.length > 0 ? items : ["Nenhuma condição geral informada."];

  conditionItems.forEach((condition) => {
    const lines = pdf.splitTextToSize(condition, 158);

    const rowHeight = Math.max(12, 7 + lines.length * 4.1);

    y = ensureBudgetPdfSpace(pdf, y, rowHeight + 2, documentData);

    pdf.setFillColor(...PDF_COLORS.light);

    pdf.roundedRect(15, y, 180, rowHeight, 2.5, 2.5, "F");

    pdf.setFillColor(...PDF_COLORS.gold);

    pdf.circle(22, y + 6, 2.5, "F");

    pdf.setDrawColor(...PDF_COLORS.blue);

    pdf.setLineWidth(0.6);

    pdf.line(20.7, y + 6, 21.7, y + 7);

    pdf.line(21.7, y + 7, 23.6, y + 4.8);

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(8.2);

    pdf.setTextColor(...PDF_COLORS.dark);

    pdf.text(lines, 29, y + 7);

    y += rowHeight + 2;
  });

  return y;
}

function addBudgetPdfApproval(pdf, currentY, documentData) {
  const y = ensureBudgetPdfSpace(pdf, currentY, 61, documentData);

  const status = getStatusData(text(documentData.status) || "rascunho");

  pdf.setFillColor(249, 250, 251);

  pdf.setDrawColor(...PDF_COLORS.border);

  pdf.roundedRect(15, y, 180, 54, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(8);

  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text("APROVAÇÃO DA PROPOSTA", 21, y + 9);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(7.5);

  pdf.setTextColor(...PDF_COLORS.gray);

  pdf.text(`Situação atual: ${sanitizePdfText(status.label)}`, 21, y + 15);

  pdf.setDrawColor(175, 181, 186);

  pdf.line(21, y + 29, 96, y + 29);

  pdf.line(105, y + 29, 189, y + 29);

  pdf.line(21, y + 45, 125, y + 45);

  pdf.line(135, y + 45, 189, y + 45);

  pdf.setFontSize(6.3);

  pdf.setTextColor(...PDF_COLORS.gray);

  pdf.text("NOME DO RESPONSÁVEL", 21, y + 34);

  pdf.text("CARGO / FUNÇÃO", 105, y + 34);

  pdf.text("ASSINATURA", 21, y + 50);

  pdf.text("DATA", 135, y + 50);

  if (documentData.aprovadoEm) {
    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(7.3);

    pdf.setTextColor(...PDF_COLORS.green);

    pdf.text(formatDateTime(documentData.aprovadoEm), 162, y + 43, {
      align: "center",
    });
  }

  return y + 59;
}

function addBudgetPdfFooters(pdf, documentData) {
  const totalPages = pdf.getNumberOfPages();

  const safeCode = sanitizePdfText(documentData.codigo || "ORÇAMENTO");

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    pdf.setPage(pageNumber);

    pdf.setFillColor(...PDF_COLORS.gold);

    pdf.rect(0, 279, 210, 2, "F");

    pdf.setFillColor(...PDF_COLORS.blueDark);

    pdf.rect(0, 281, 210, 16, "F");

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(7);

    pdf.setTextColor(...PDF_COLORS.white);

    pdf.text("SALVATECK", 15, 288);

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(6.3);

    pdf.setTextColor(214, 223, 231);

    pdf.text("Proposta comercial | Manutenção predial", 15, 293);

    pdf.setFont("helvetica", "bold");

    pdf.setTextColor(...PDF_COLORS.gold);

    pdf.text(`${safeCode} | Página ${pageNumber} de ${totalPages}`, 195, 290, {
      align: "right",
    });
  }
}

async function createBudgetPdf() {
  const JsPdfClass = window.jspdf?.jsPDF;

  if (!JsPdfClass) {
    throw new Error("JSPDF_NOT_LOADED");
  }

  if (!currentBudget) {
    throw new Error("BUDGET_NOT_FOUND");
  }

  const documentData = currentBudget;

  const [logoDataUrl, coverDataUrl] = await Promise.all([
    loadBudgetPdfLogo(),
    loadBudgetPdfImage(),
  ]);

  const pdf = new JsPdfClass({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const client = documentData.cliente || {};
  const condominium = documentData.condominio || {};
  const proposal = documentData.proposta || {};
  const conditions = documentData.condicoes || {};
  const investment = documentData.investimento || {};
  const address = condominium.endereco || {};

  const serviceAmount = Number(
    investment.valorServico ?? documentData.valorServico ?? 0,
  );

  const discountAmount = Number(
    investment.desconto ?? documentData.desconto ?? 0,
  );

  const finalAmount = Number(
    investment.valorFinal ??
      documentData.valorFinal ??
      Math.max(0, serviceAmount - discountAmount),
  );

  const services = Array.isArray(documentData.servicosInclusos)
    ? documentData.servicosInclusos.map(text).filter(Boolean)
    : [];

  const generalConditions = Array.isArray(conditions.gerais)
    ? conditions.gerais.map(text).filter(Boolean)
    : [];

  const condominiumName = sanitizePdfText(
    condominium.nome ||
      documentData.condominioNome ||
      client.nome ||
      "Cliente não informado",
  );

  const responsibleName = sanitizePdfText(
    client.nome || documentData.clienteNome || "Não informado",
  );

  const addressText = sanitizePdfText(
    address.resumo || documentData.endereco || "Não informado",
  );

  const unitText = sanitizePdfText(condominium.unidade || "Não informada");

  const cnpjText = sanitizePdfText(condominium.cnpj || "Não informado");

  const titleText = sanitizePdfText(
    documentData.titulo || "Serviço de manutenção",
  );

  const subtitleText = sanitizePdfText(
    documentData.subtitulo || documentData.descricaoServico || "",
  );

  const objectiveText = sanitizePdfText(
    documentData.objetivo || "Objetivo não informado.",
  );

  const materialsText = sanitizePdfText(
    documentData.materiaisFornecimento ||
      "Materiais conforme necessidade e especificação do serviço.",
  );

  const paymentText = sanitizePdfText(
    conditions.pagamento || "Condição de pagamento não informada.",
  );

  const publicNoteText = sanitizePdfText(
    documentData.observacoes?.publica || "",
  );

  const discountDescription = sanitizePdfText(
    investment.descricaoDesconto || "Desconto concedido",
  );

  const proposalCode = sanitizePdfText(documentData.codigo || "ORC-0000");
  const proposalDate = formatDate(proposal.data);
  const validityDays = Number(proposal.validadeDias || 0);
  const validityDate = formatDate(proposal.validadeAte);

  let validityText = "Não informada";

  if (validityDays > 0 && validityDate !== "—") {
    validityText = `${validityDays} dias • até ${validityDate}`;
  } else if (validityDays > 0) {
    validityText = `${validityDays} dias`;
  } else if (validityDate !== "—") {
    validityText = validityDate;
  }

  pdf.setProperties({
    title: `${proposalCode} | Salvateck`,
    subject: titleText,
    author: "Salvateck",
    creator: "Salvateck",
  });

  function fitLines(value, width, maxLines = Number.POSITIVE_INFINITY) {
    const normalized = sanitizePdfText(value || "");

    if (!normalized) {
      return [];
    }

    const lines = pdf.splitTextToSize(normalized, width);

    if (lines.length <= maxLines) {
      return lines;
    }

    const visibleLines = lines.slice(0, maxLines);

    let lastLine = String(visibleLines[maxLines - 1] || "")
      .replace(/[.,;:\s]+$/g, "")
      .trim();

    while (lastLine.length > 1 && pdf.getTextWidth(`${lastLine}...`) > width) {
      lastLine = lastLine.slice(0, -1).trim();
    }

    visibleLines[maxLines - 1] = `${lastLine}...`;

    return visibleLines;
  }

  function drawSectionHeading(x, y, number, title, width) {
    pdf.setFillColor(...PDF_COLORS.blue);
    pdf.circle(x + 5.5, y + 5.5, 5.5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.2);
    pdf.setTextColor(...PDF_COLORS.gold);

    pdf.text(String(number).padStart(2, "0"), x + 5.5, y + 5.5, {
      align: "center",
      baseline: "middle",
    });

    pdf.setFontSize(11.5);
    pdf.setTextColor(...PDF_COLORS.blue);

    pdf.text(sanitizePdfText(title).toUpperCase(), x + 14, y + 7.5);

    pdf.setDrawColor(214, 219, 224);
    pdf.setLineWidth(0.35);

    pdf.line(x + 14, y + 11.5, x + width, y + 11.5);
  }

  function drawLabelValue(x, y, label, value, width) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...PDF_COLORS.gray);

    pdf.text(sanitizePdfText(label).toUpperCase(), x, y);

    pdf.setFontSize(9.5);
    pdf.setTextColor(...PDF_COLORS.blue);

    pdf.text(fitLines(value || "Não informado", width, 2), x, y + 5);
  }

  function drawBulletRow(x, y, value, width, options = {}) {
    const fontSize = Number(options.fontSize || 8.8);
    const lineHeight = Number(options.lineHeight || 4.4);
    const textWidth = width - 11;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fontSize);

    const lines = pdf.splitTextToSize(sanitizePdfText(value), textWidth);

    const rowHeight = Math.max(10, 5 + lines.length * lineHeight);

    pdf.setFillColor(...PDF_COLORS.light);
    pdf.setDrawColor(...PDF_COLORS.border);

    pdf.roundedRect(x, y, width, rowHeight, 2.5, 2.5, "FD");

    pdf.setFillColor(...PDF_COLORS.gold);
    pdf.circle(x + 5.5, y + 5.5, 2.8, "F");

    pdf.setDrawColor(...PDF_COLORS.blue);
    pdf.setLineWidth(0.65);

    pdf.line(x + 4.2, y + 5.5, x + 5.2, y + 6.5);

    pdf.line(x + 5.2, y + 6.5, x + 7.1, y + 4.3);

    pdf.setTextColor(...PDF_COLORS.dark);

    pdf.text(lines, x + 10.5, y + 6.3, {
      lineHeightFactor: 1.12,
    });

    return rowHeight;
  }

  function drawContinuationHeader(title) {
    pdf.setFillColor(...PDF_COLORS.blueDark);

    pdf.rect(0, 0, 210, 28, "F");

    if (logoDataUrl) {
      try {
        addBudgetPdfContainedImage(pdf, logoDataUrl, "PNG", 10, 5, 42, 18);
      } catch (error) {
        console.warn(
          "[PDF Orçamento] Não foi possível inserir a logo na continuação:",
          error,
        );
      }
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(...PDF_COLORS.white);

    pdf.text(sanitizePdfText(title).toUpperCase(), 62, 12);

    pdf.setFontSize(9);
    pdf.setTextColor(...PDF_COLORS.gold);

    pdf.text(proposalCode, 62, 19);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(221, 229, 236);

    pdf.text(titleText, 195, 18, {
      align: "right",
      maxWidth: 67,
    });
  }

  function ensureContentSpace(currentY, requiredHeight, nextPageTitle) {
    if (currentY + requiredHeight <= 268) {
      return currentY;
    }

    pdf.addPage();

    drawContinuationHeader(nextPageTitle);

    return 38;
  }

  function drawDocumentFooters() {
    const totalPages = pdf.getNumberOfPages();

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      pdf.setPage(pageNumber);

      pdf.setFillColor(...PDF_COLORS.blueDark);

      pdf.rect(0, 274, 210, 18, "F");

      if (logoDataUrl) {
        try {
          addBudgetPdfContainedImage(pdf, logoDataUrl, "PNG", 8, 277, 42, 11);
        } catch (error) {
          console.warn(
            "[PDF Orçamento] Não foi possível inserir a logo no rodapé:",
            error,
          );
        }
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...PDF_COLORS.gold);

      pdf.text("FALE CONOSCO", 58, 280);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.2);
      pdf.setTextColor(224, 231, 237);

      pdf.text("(44) 99934-3808 • contato@salvateckgroup.com.br", 58, 285);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.2);
      pdf.setTextColor(...PDF_COLORS.white);

      pdf.text(
        `${proposalCode} • Página ${pageNumber} de ${totalPages}`,
        198,
        284,
        {
          align: "right",
        },
      );

      pdf.setFillColor(...PDF_COLORS.gold);

      pdf.rect(0, 292, 210, 5, "F");

      pdf.setFontSize(6.8);
      pdf.setTextColor(...PDF_COLORS.blueDark);

      pdf.text(
        "SEGURANÇA E QUALIDADE GARANTINDO A VALORIZAÇÃO DO SEU PATRIMÔNIO.",
        105,
        295.4,
        {
          align: "center",
        },
      );
    }
  }

  /* =======================================================
  PÁGINA 1 — APRESENTAÇÃO COMERCIAL
  ======================================================== */

  pdf.setFillColor(...PDF_COLORS.white);

  pdf.rect(0, 0, 210, 297, "F");

  pdf.setFillColor(...PDF_COLORS.blueDark);

  pdf.circle(-2, -2, 37, "F");

  pdf.setDrawColor(...PDF_COLORS.gold);
  pdf.setLineWidth(3.4);

  pdf.circle(-2, -2, 31.5, "S");

  if (logoDataUrl) {
    try {
      addBudgetPdfContainedImage(pdf, logoDataUrl, "PNG", 9, 11, 58, 42);
    } catch (error) {
      console.warn("[PDF Orçamento] Não foi possível inserir a logo:", error);
    }
  }

  pdf.setDrawColor(...PDF_COLORS.blue);
  pdf.setLineWidth(0.7);

  pdf.line(72, 13, 72, 54);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text("ORÇAMENTO", 78, 23);

  pdf.setFontSize(12.5);
  pdf.setTextColor(...PDF_COLORS.gold);

  const topTitleLines = fitLines(titleText, 74, 2);

  pdf.text(topTitleLines, 78, 33);

  const topTitleBottom = 33 + Math.max(0, topTitleLines.length - 1) * 5.2;

  pdf.setDrawColor(...PDF_COLORS.gold);
  pdf.setLineWidth(0.5);

  pdf.line(78, topTitleBottom + 3.5, 151, topTitleBottom + 3.5);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.2);
  pdf.setTextColor(...PDF_COLORS.dark);

  pdf.text(
    fitLines(subtitleText || documentData.descricaoServico, 72, 3),
    78,
    topTitleBottom + 10,
  );

  pdf.setFillColor(247, 248, 249);

  pdf.rect(156, 0, 54, 62, "F");

  if (coverDataUrl) {
    try {
      addBudgetPdfContainedImage(pdf, coverDataUrl, "JPEG", 158, 2, 50, 58);
    } catch (error) {
      console.warn(
        "[PDF Orçamento] Não foi possível inserir a imagem principal:",
        error,
      );
    }
  }

  pdf.setDrawColor(...PDF_COLORS.blue);
  pdf.setLineWidth(0.45);

  pdf.roundedRect(7, 67, 196, 58, 3, 3, "S");

  pdf.setDrawColor(185, 191, 198);

  pdf.setLineWidth(0.35);

  pdf.line(78, 72, 78, 120);

  pdf.line(132, 72, 132, 120);

  drawSectionHeading(12, 72, 1, "Cliente", 60);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text(fitLines(condominiumName, 57, 2), 13, 88);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.2);
  pdf.setTextColor(...PDF_COLORS.gray);

  pdf.text(fitLines(`Responsável: ${responsibleName}`, 57, 2), 13, 98);

  pdf.setTextColor(...PDF_COLORS.dark);

  pdf.text(fitLines(addressText, 57, 3), 13, 107);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...PDF_COLORS.gold);

  pdf.text("UNIDADE", 13, 119);

  pdf.text("CNPJ", 42, 119);

  pdf.setFontSize(7.8);
  pdf.setTextColor(...PDF_COLORS.dark);

  pdf.text(fitLines(unitText, 25, 1), 26, 119);

  pdf.text(fitLines(cnpjText, 31, 1), 52, 119);

  drawSectionHeading(83, 72, 2, "Proposta", 44);

  drawLabelValue(84, 89, "Nº", proposalCode, 40);

  drawLabelValue(84, 102, "Data", proposalDate, 40);

  drawLabelValue(84, 115, "Validade", validityText, 40);

  drawSectionHeading(137, 72, 3, "Objetivo", 60);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.8);
  pdf.setTextColor(...PDF_COLORS.dark);

  pdf.text(fitLines(objectiveText, 59, 8), 138, 88, {
    lineHeightFactor: 1.18,
  });

  /* =======================================================
  SERVIÇOS — PÁGINA 1
  ======================================================== */

  pdf.setDrawColor(...PDF_COLORS.blue);
  pdf.setLineWidth(0.45);

  pdf.roundedRect(7, 131, 95, 137, 3, 3, "S");

  drawSectionHeading(12, 136, 4, "Serviços inclusos", 83);

  let servicesY = 154;

  let firstPageServiceCount = 0;

  const serviceAreaBottom = 233;

  for (const service of services) {
    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(8.8);

    const serviceLines = pdf.splitTextToSize(sanitizePdfText(service), 73);

    const rowHeight = Math.max(10, 5 + serviceLines.length * 4.4);

    if (servicesY + rowHeight > serviceAreaBottom) {
      break;
    }

    const drawnHeight = drawBulletRow(12, servicesY, service, 84, {
      fontSize: 8.8,
      lineHeight: 4.4,
    });

    servicesY += drawnHeight + 2.5;

    firstPageServiceCount += 1;
  }

  if (services.length === 0) {
    const drawnHeight = drawBulletRow(
      12,
      servicesY,
      "Nenhum serviço informado.",
      84,
      {
        fontSize: 8.8,
      },
    );

    servicesY += drawnHeight + 2.5;
  }

  const remainingServices = services.slice(firstPageServiceCount);

  if (remainingServices.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...PDF_COLORS.blue);

    pdf.text(
      `+ ${remainingServices.length} serviço(s) continua(m) na página seguinte`,
      14,
      239,
    );
  }

  pdf.setDrawColor(...PDF_COLORS.gold);
  pdf.setLineWidth(0.4);

  pdf.roundedRect(11, 244, 87, 19, 2.5, 2.5, "S");

  pdf.setFillColor(...PDF_COLORS.blue);

  pdf.circle(19, 253.5, 5.3, "F");

  pdf.setDrawColor(...PDF_COLORS.white);
  pdf.setLineWidth(0.9);

  pdf.line(16.4, 253.5, 18.2, 255.2);

  pdf.line(18.2, 255.2, 21.8, 251.7);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(...PDF_COLORS.dark);

  pdf.text(fitLines(materialsText, 65, 3), 28, 250, {
    lineHeightFactor: 1.12,
  });

  /* =======================================================
  INVESTIMENTO — PÁGINA 1
  ======================================================== */

  pdf.setFillColor(...PDF_COLORS.blueDark);

  pdf.roundedRect(106, 131, 97, 137, 3, 3, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12.5);
  pdf.setTextColor(...PDF_COLORS.gold);

  pdf.text("05", 113, 145);

  pdf.setTextColor(...PDF_COLORS.white);

  pdf.text("INVESTIMENTO", 127, 145);

  pdf.setFillColor(...PDF_COLORS.white);

  pdf.roundedRect(110, 153, 89, 49, 3, 3, "F");

  pdf.setFontSize(8.3);
  pdf.setTextColor(...PDF_COLORS.gray);

  pdf.text("VALOR DO SERVIÇO", 117, 164);

  pdf.setFontSize(15);
  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text(formatCurrency(serviceAmount), 117, 174);

  pdf.setDrawColor(151, 157, 164);

  pdf.setLineDashPattern([1.8, 1.8], 0);

  pdf.line(117, 180, 192, 180);

  pdf.setLineDashPattern([], 0);

  pdf.setFontSize(7.7);
  pdf.setTextColor(...PDF_COLORS.dark);

  pdf.text(fitLines(discountDescription, 52, 2), 117, 188);

  pdf.setFontSize(13.5);
  pdf.setTextColor(208, 45, 45);

  pdf.text(`- ${formatCurrency(discountAmount)}`, 192, 197, {
    align: "right",
  });

  pdf.setFillColor(...PDF_COLORS.gold);

  pdf.roundedRect(110, 208, 89, 38, 3, 3, "F");

  pdf.setFontSize(8.5);
  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text("VALOR FINAL COM DESCONTO", 154.5, 218, {
    align: "center",
  });

  pdf.setFontSize(24);

  pdf.text(formatCurrency(finalAmount), 154.5, 232, {
    align: "center",
  });

  pdf.setFillColor(...PDF_COLORS.blueDark);

  pdf.roundedRect(119, 237, 71, 6.5, 2, 2, "F");

  pdf.setFontSize(6.5);
  pdf.setTextColor(...PDF_COLORS.white);

  pdf.text("VALOR ESPECIAL PARA O CONDOMÍNIO", 154.5, 241.3, {
    align: "center",
  });

  pdf.setFillColor(...PDF_COLORS.white);

  pdf.roundedRect(110, 251, 89, 12, 2.5, 2.5, "F");

  pdf.setFontSize(7.8);
  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text("Agradecemos a confiança!", 154.5, 258.5, {
    align: "center",
  });

  /* =======================================================
  PÁGINA 2 — CONDIÇÕES E APROVAÇÃO
  ======================================================== */

  pdf.addPage();

  drawContinuationHeader("Condições da proposta");

  let y = 38;

  if (remainingServices.length > 0) {
    drawSectionHeading(15, y, 4, "Serviços inclusos — continuação", 180);

    y += 17;

    for (const service of remainingServices) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.2);

      const lines = pdf.splitTextToSize(sanitizePdfText(service), 165);

      const requiredHeight = Math.max(11, 5 + lines.length * 4.6) + 3;

      y = ensureContentSpace(y, requiredHeight, "Continuação da proposta");

      const rowHeight = drawBulletRow(15, y, service, 180, {
        fontSize: 9.2,
        lineHeight: 4.6,
      });

      y += rowHeight + 3;
    }

    y += 4;
  }

  drawSectionHeading(15, y, 6, "Condições gerais", 180);

  y += 17;

  const conditionsToRender = [
    ...generalConditions,
    text(conditions.garantia) ? `Garantia: ${conditions.garantia}` : "",
    text(conditions.prazoExecucao)
      ? `Prazo estimado de execução: ${conditions.prazoExecucao}`
      : "",
  ].filter(Boolean);

  const finalConditions =
    conditionsToRender.length > 0
      ? conditionsToRender
      : ["Nenhuma condição geral informada."];

  for (const condition of finalConditions) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.2);

    const lines = pdf.splitTextToSize(sanitizePdfText(condition), 165);

    const requiredHeight = Math.max(11, 5 + lines.length * 4.6) + 3;

    y = ensureContentSpace(y, requiredHeight, "Continuação das condições");

    const rowHeight = drawBulletRow(15, y, condition, 180, {
      fontSize: 9.2,
      lineHeight: 4.6,
    });

    y += rowHeight + 3;
  }

  y += 4;

  y = ensureContentSpace(y, 40, "Condições comerciais");

  pdf.setFillColor(...PDF_COLORS.light);
  pdf.setDrawColor(...PDF_COLORS.border);

  pdf.roundedRect(15, y, 180, 34, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(...PDF_COLORS.blue);

  pdf.text("CONDIÇÕES DE PAGAMENTO", 21, y + 10);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.2);
  pdf.setTextColor(...PDF_COLORS.dark);

  pdf.text(fitLines(paymentText, 166, 5), 21, y + 18, {
    lineHeightFactor: 1.15,
  });

  y += 41;

  if (publicNoteText) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.2);

    const noteLines = pdf.splitTextToSize(publicNoteText, 166);

    const noteHeight = Math.max(28, 15 + noteLines.length * 4.6);

    y = ensureContentSpace(y, noteHeight + 7, "Observações da proposta");

    pdf.setFillColor(255, 249, 236);

    pdf.setDrawColor(...PDF_COLORS.gold);

    pdf.roundedRect(15, y, 180, noteHeight, 3, 3, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...PDF_COLORS.blue);

    pdf.text("OBSERVAÇÃO DA PROPOSTA", 21, y + 9);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.2);
    pdf.setTextColor(...PDF_COLORS.dark);

    pdf.text(noteLines, 21, y + 17, {
      lineHeightFactor: 1.15,
    });

    y += noteHeight + 7;
  }

  y = ensureContentSpace(y, 70, "Aprovação da proposta");

  pdf.setFillColor(...PDF_COLORS.white);
  pdf.setDrawColor(...PDF_COLORS.blue);
  pdf.setLineWidth(0.45);

  pdf.roundedRect(15, y, 180, 61, 3, 3, "S");

  pdf.setFillColor(...PDF_COLORS.blueDark);

  pdf.roundedRect(15, y, 180, 13, 3, 3, "F");

  pdf.rect(15, y + 9, 180, 4, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...PDF_COLORS.white);

  pdf.text("APROVAÇÃO DO ORÇAMENTO", 105, y + 8.5, {
    align: "center",
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.8);
  pdf.setTextColor(...PDF_COLORS.dark);

  const approvalRows = [
    ["Nome:", y + 25],
    ["Cargo:", y + 35],
    ["Data:", y + 45],
    ["Assinatura:", y + 55],
  ];

  pdf.setDrawColor(158, 164, 170);

  pdf.setLineWidth(0.3);

  approvalRows.forEach(([label, rowY]) => {
    pdf.text(label, 23, rowY);

    pdf.line(46, rowY + 0.7, 186, rowY + 0.7);
  });

  if (documentData.aprovadoEm) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...PDF_COLORS.green);

    pdf.text(
      `Aprovado em ${formatDateTime(documentData.aprovadoEm)}`,
      186,
      y + 45,
      {
        align: "right",
      },
    );
  }

  drawDocumentFooters();

  return pdf;
}

function setBudgetPdfBusy(isBusy) {
  generatingBudgetPdf = isBusy;

  generatePdfButton.disabled = isBusy;

  shareBudgetButton.disabled = isBusy;

  generatePdfButton.querySelector("span").textContent = isBusy
    ? "Gerando PDF..."
    : "Gerar PDF";

  shareBudgetButton.querySelector("span").textContent = isBusy
    ? "Preparando PDF..."
    : "Compartilhar PDF";
}

function handleBudgetPdfError(error) {
  console.error("[PDF Orçamento] Não foi possível gerar o documento:", error);

  if (error?.message === "JSPDF_NOT_LOADED") {
    showFeedback(
      "A biblioteca de PDF não foi carregada. Atualize a página e tente novamente.",
      "error",
    );

    return;
  }

  if (error?.message === "BUDGET_NOT_FOUND") {
    showFeedback("Os dados do orçamento não foram encontrados.", "error");

    return;
  }

  showFeedback("Não foi possível gerar o PDF do orçamento.", "error");
}

/* =========================================================
AÇÕES TEMPORÁRIAS
========================================================= */

function handleEditBudget() {
  showFeedback(
    "A edição do orçamento será conectada ao formulário na próxima etapa.",
  );
}

function handleDuplicateBudget() {
  showFeedback(
    "A duplicação será ligada ao Novo Orçamento depois que fecharmos esta tela.",
  );
}

async function handleGeneratePdf() {
  if (generatingBudgetPdf) {
    return;
  }

  setBudgetPdfBusy(true);

  try {
    const pdf = await createBudgetPdf();

    pdf.save(getBudgetPdfFileName());

    showFeedback("PDF do orçamento gerado com sucesso.", "success");
  } catch (error) {
    handleBudgetPdfError(error);
  } finally {
    setBudgetPdfBusy(false);
  }
}

async function handleSharePdf() {
  if (generatingBudgetPdf) {
    return;
  }

  setBudgetPdfBusy(true);

  try {
    const pdf = await createBudgetPdf();

    const fileName = getBudgetPdfFileName();

    const pdfArrayBuffer = pdf.output("arraybuffer");

    const pdfFile = new File([pdfArrayBuffer], fileName, {
      type: "application/pdf",
      lastModified: Date.now(),
    });

    const shareData = {
      title: `${currentBudget?.codigo || "Orçamento"} | Salvateck`,
      files: [pdfFile],
    };

    const canShareFile =
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" ||
        navigator.canShare(shareData));

    if (canShareFile) {
      try {
        await navigator.share(shareData);

        showFeedback("PDF do orçamento compartilhado com sucesso.", "success");

        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.warn(
          "[PDF Orçamento] O compartilhamento direto não foi concluído:",
          error,
        );
      }
    }

    pdf.save(fileName);

    showFeedback(
      "O compartilhamento direto não está disponível. O PDF foi baixado.",
      "success",
    );
  } catch (error) {
    handleBudgetPdfError(error);
  } finally {
    setBudgetPdfBusy(false);
  }
}

let generatingBudgetImage = false;

function getBudgetImageFileName() {
  return getBudgetPdfFileName().replace(/\.pdf$/i, ".png");
}

function setBudgetImageBusy(isBusy) {
  generatingBudgetImage = isBusy;

  generateBudgetImageButton.disabled = isBusy;

  const label = generateBudgetImageButton.querySelector("span");

  if (label) {
    label.textContent = isBusy ? "Gerando PNG..." : "Gerar PNG";
  }
}

function setExportText(id, value, fallback = "—") {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.textContent = text(value) || fallback;
}

function waitForExportImages(container) {
  const images = Array.from(container.querySelectorAll("img")).filter(
    (image) => image.src && !image.hidden,
  );

  return Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        image.addEventListener("load", resolve, {
          once: true,
        });

        image.addEventListener("error", resolve, {
          once: true,
        });
      });
    }),
  );
}

async function renderBudgetImageExport() {
  if (!currentBudget) {
    throw new Error("BUDGET_NOT_FOUND");
  }

  const documentData = currentBudget;

  const client = documentData.cliente || {};
  const condominium = documentData.condominio || {};
  const proposal = documentData.proposta || {};
  const conditions = documentData.condicoes || {};
  const investment = documentData.investimento || {};
  const address = condominium.endereco || {};

  const condominiumLabel = [
    text(condominium.codigo),
    text(condominium.nome || documentData.condominioNome),
  ]
    .filter(Boolean)
    .join(" — ");

  const responsibleName = text(
    client.nome || documentData.clienteNome || "Não informado",
  );

  const addressText = text(
    address.resumo || documentData.endereco || "Não informado",
  );

  const serviceAmount = Number(
    investment.valorServico ?? documentData.valorServico ?? 0,
  );

  const discountAmount = Number(
    investment.desconto ?? documentData.desconto ?? 0,
  );

  const finalAmount = Number(
    investment.valorFinal ??
      documentData.valorFinal ??
      Math.max(0, serviceAmount - discountAmount),
  );

  const validityDays = Number(proposal.validadeDias || 0);

  const validityDate = formatDate(proposal.validadeAte);

  let validityText = "Não informada";

  if (validityDays > 0 && validityDate !== "—") {
    validityText = `${validityDays} dias • até ${validityDate}`;
  } else if (validityDays > 0) {
    validityText = `${validityDays} dias`;
  } else if (validityDate !== "—") {
    validityText = validityDate;
  }

  setExportText(
    "export-budget-title",
    documentData.titulo,
    "Serviço de manutenção",
  );

  setExportText(
    "export-budget-subtitle",
    documentData.subtitulo || documentData.descricaoServico,
    "Proposta comercial Salvateck",
  );

  setExportText(
    "export-condominium-name",
    condominiumLabel || responsibleName,
    "Cliente não informado",
  );

  setExportText("export-client-name", `Responsável: ${responsibleName}`);

  setExportText("export-address", addressText);

  setExportText("export-unit", condominium.unidade, "Não informada");

  setExportText("export-cnpj", condominium.cnpj, "Não informado");

  setExportText("export-budget-code", documentData.codigo, "ORC-0000");

  setExportText("export-budget-date", formatDate(proposal.data));

  setExportText("export-budget-validity", validityText);

  setExportText(
    "export-budget-objective",
    documentData.objetivo,
    "Objetivo não informado.",
  );

  const servicesList = document.getElementById("export-services-list");

  servicesList.innerHTML = "";

  const services = Array.isArray(documentData.servicosInclusos)
    ? documentData.servicosInclusos.map(text).filter(Boolean)
    : [];

  const visibleServices =
    services.length > 0 ? services.slice(0, 9) : ["Nenhum serviço informado."];

  visibleServices.forEach((service) => {
    const item = document.createElement("li");

    item.textContent = service;

    servicesList.appendChild(item);
  });

  if (services.length > 9) {
    const item = document.createElement("li");

    item.textContent = `+ ${services.length - 9} serviço(s) adicional(is)`;

    servicesList.appendChild(item);
  }

  setExportText(
    "export-materials-text",
    documentData.materiaisFornecimento,
    "Materiais conforme necessidade e especificação do serviço.",
  );

  setExportText("export-service-value", formatCurrency(serviceAmount));

  setExportText(
    "export-discount-description",
    investment.descricaoDesconto,
    "Desconto",
  );

  setExportText("export-discount-value", `- ${formatCurrency(discountAmount)}`);

  setExportText("export-final-value", formatCurrency(finalAmount));

  const conditionsList = document.getElementById("export-general-conditions");

  conditionsList.innerHTML = "";

  const generalConditions = Array.isArray(conditions.gerais)
    ? conditions.gerais.map(text).filter(Boolean).slice(0, 3)
    : [];

  const conditionItems = [...generalConditions];

  if (text(conditions.garantia)) {
    conditionItems.push(`Garantia: ${text(conditions.garantia)}`);
  }

  if (text(conditions.prazoExecucao)) {
    conditionItems.push(`Prazo de execução: ${text(conditions.prazoExecucao)}`);
  }

  const visibleConditions =
    conditionItems.length > 0
      ? conditionItems
      : ["Nenhuma condição geral informada."];

  visibleConditions.forEach((condition) => {
    const item = document.createElement("li");

    item.textContent = condition;

    conditionsList.appendChild(item);
  });

  setExportText(
    "export-payment-conditions",
    conditions.pagamento,
    "Condição de pagamento não informada.",
  );

  const exportLogo = document.getElementById("export-logo");

  const exportFooterLogo = document.querySelector(".export-footer__brand img");

  const exportCoverImage = document.getElementById("export-cover-image");

  const [logoDataUrl, coverDataUrl] = await Promise.all([
    loadBudgetPdfLogo(),
    loadBudgetPdfImage(),
  ]);

  if (logoDataUrl) {
    exportLogo.src = logoDataUrl;
    exportFooterLogo.src = logoDataUrl;
  }

  if (coverDataUrl) {
    exportCoverImage.hidden = false;
    exportCoverImage.src = coverDataUrl;
  } else {
    exportCoverImage.hidden = true;
    exportCoverImage.removeAttribute("src");
  }
}

async function handleGenerateBudgetImage() {
  if (generatingBudgetImage || generatingBudgetPdf) {
    return;
  }

  if (typeof window.html2canvas !== "function") {
    showFeedback(
      "A biblioteca de imagem não foi carregada. " +
        "Atualize a página e tente novamente.",
      "error",
    );

    return;
  }

  const stage = document.getElementById("budget-image-export-stage");

  const exportElement = document.getElementById("budget-image-export");

  if (!stage || !exportElement) {
    showFeedback(
      "A estrutura da imagem do orçamento não foi encontrada.",
      "error",
    );

    return;
  }

  setBudgetImageBusy(true);

  const previousOpacity = stage.style.opacity;

  try {
    await renderBudgetImageExport();

    stage.style.opacity = "1";

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    await waitForExportImages(exportElement);

    await new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });

    const exportWidth = exportElement.scrollWidth;

    const exportHeight = exportElement.scrollHeight;

    const canvas = await window.html2canvas(exportElement, {
      backgroundColor: "#ffffff",
      scale: 1,
      useCORS: true,
      logging: false,
      width: exportWidth,
      height: exportHeight,
      windowWidth: exportWidth,
      windowHeight: exportHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imageDataUrl = canvas.toDataURL("image/png");

    const downloadLink = document.createElement("a");

    downloadLink.href = imageDataUrl;
    downloadLink.download = getBudgetImageFileName();

    document.body.appendChild(downloadLink);

    downloadLink.click();

    downloadLink.remove();

    showFeedback("PNG do orçamento gerado com sucesso.", "success");
  } catch (error) {
    console.error("[Imagem Orçamento] Não foi possível gerar o PNG:", error);

    showFeedback(
      error?.message === "BUDGET_NOT_FOUND"
        ? "Os dados do orçamento não foram encontrados."
        : "Não foi possível gerar a imagem do orçamento.",
      "error",
    );
  } finally {
    stage.style.opacity = previousOpacity;

    setBudgetImageBusy(false);
  }
}

function handleConvertBudgetToOrder() {
  showFeedback(
    "A conversão automática do orçamento aprovado em OS ficará para a próxima fase do módulo.",
  );
}

/* =========================================================
EVENTOS DE STATUS
========================================================= */

markSentButton.addEventListener("click", () => {
  openStatusModal("enviado");
});

approveButton.addEventListener("click", () => {
  openStatusModal("aprovado");
});

rejectButton.addEventListener("click", () => {
  openStatusModal("recusado");
});

expireButton.addEventListener("click", () => {
  openStatusModal("expirado");
});

/* =========================================================
EVENTOS DO MODAL
========================================================= */

cancelModalButton.addEventListener("click", closeStatusModal);

confirmModalButton.addEventListener("click", () => {
  if (!pendingStatus) {
    return;
  }

  updateBudgetStatus(pendingStatus);
});

document.querySelectorAll("[data-close-budget-modal]").forEach((element) => {
  element.addEventListener("click", closeStatusModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !confirmModal.hidden) {
    closeStatusModal();
  }
});

/* =========================================================
OUTRAS AÇÕES
========================================================= */

editBudgetButton.addEventListener("click", handleEditBudget);

duplicateBudgetButton.addEventListener("click", handleDuplicateBudget);

generatePdfButton.addEventListener("click", handleGeneratePdf);

shareBudgetButton.addEventListener("click", handleSharePdf);

generateBudgetImageButton.addEventListener("click", handleGenerateBudgetImage);

convertBudgetOrderButton.addEventListener("click", handleConvertBudgetToOrder);

/* =========================================================
INICIALIZAÇÃO
========================================================= */

async function initializePage() {
  try {
    currentSession = await window.salvateckSessionReady;

    if (!currentSession || currentSession.role !== "admin") {
      return;
    }

    currentBudgetId = getBudgetIdFromUrl();

    await loadBudget();
  } catch (error) {
    console.error("[Detalhes Orçamento] Não foi possível iniciar:", error);

    showNotFound("Não foi possível iniciar a tela de detalhes do orçamento.");
  }
}

initializePage();
