import "./auth-guard.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import { db, storage } from "./firebase-config.js";

/* =========================================================
ELEMENTOS
========================================================= */

const form = document.getElementById("budget-form");

const condominiumSelect = document.getElementById("budget-condominium");

const condominiumHelp = document.getElementById("budget-condominium-help");

const clientSelect = document.getElementById("budget-client");

const clientName = document.getElementById("budget-client-name");

const clientPhone = document.getElementById("budget-client-phone");

const clientEmail = document.getElementById("budget-client-email");

const addressInput = document.getElementById("budget-address");

const condominiumUnit = document.getElementById("budget-condominium-unit");

const condominiumCnpj = document.getElementById("budget-condominium-cnpj");

const budgetCode = document.getElementById("budget-code");

const budgetDate = document.getElementById("budget-date");

const budgetValidity = document.getElementById("budget-validity");

const budgetStatus = document.getElementById("budget-status");

const budgetTitle = document.getElementById("budget-title");

const budgetSubtitle = document.getElementById("budget-subtitle");

const serviceDescription = document.getElementById(
  "budget-service-description",
);

const budgetObjective = document.getElementById("budget-objective");

const imageInput = document.getElementById("budget-image");

const imageCounter = document.getElementById("budget-image-counter");

const imagePreview = document.getElementById("budget-image-preview");

const imagePreviewElement = document.getElementById(
  "budget-image-preview-image",
);

const imageName = document.getElementById("budget-image-name");

const removeImageButton = document.getElementById("remove-budget-image");

const imageError = document.getElementById("budget-image-error");

const servicesList = document.getElementById("budget-services-list");

const addServiceButton = document.getElementById("add-budget-service");

const materialsNote = document.getElementById("budget-materials-note");

const serviceValue = document.getElementById("budget-value");

const discountValue = document.getElementById("budget-discount");

const discountDescription = document.getElementById(
  "budget-discount-description",
);

const investmentServiceValue = document.getElementById(
  "investment-service-value",
);

const investmentDiscountValue = document.getElementById(
  "investment-discount-value",
);

const investmentFinalValue = document.getElementById("investment-final-value");

const generalConditions = document.getElementById("budget-general-conditions");

const warranty = document.getElementById("budget-warranty");

const executionTime = document.getElementById("budget-execution-time");

const paymentConditions = document.getElementById("budget-payment-conditions");

const publicNote = document.getElementById("budget-public-note");

const internalNote = document.getElementById("budget-internal-note");

const summaryStatus = document.getElementById("summary-status");

const summaryClient = document.getElementById("summary-client");

const summaryCondominium = document.getElementById("summary-condominium");

const summaryCode = document.getElementById("summary-code");

const summaryValidity = document.getElementById("summary-validity");

const summaryService = document.getElementById("summary-service");

const summaryOriginalValue = document.getElementById("summary-original-value");

const summaryDiscount = document.getElementById("summary-discount");

const summaryFinalValue = document.getElementById("summary-final-value");

const saveDraftButton = document.getElementById("save-budget-draft");

const saveButton = document.getElementById("save-budget");

const feedback = document.getElementById("budget-feedback");

const successCard = document.getElementById("budget-success");

const successBudgetCode = document.getElementById("success-budget-code");

const viewBudgetLink = document.getElementById("view-budget-link");

const newBudgetButton = document.getElementById("new-budget-button");

/* =========================================================
CONTROLE
========================================================= */

let currentSession = null;

let condominiums = [];

let linkedClients = [];

let selectedCondominium = null;

let selectedClient = null;

let selectedImage = null;

let selectedImageOriginalName = "";

let imagePreviewUrl = "";

let processingImage = false;

let savingBudget = false;

let feedbackTimer = null;

let editMode = false;

let editingBudgetId = "";

let editingBudgetData = null;

let editingPrivateData = null;

let existingImageData = null;

const maxOriginalImageSize = 10 * 1024 * 1024;

const targetCompressedImageSize = 900 * 1024;

const maxCompressedImageSize = 2 * 1024 * 1024;

const maxImageDimension = 1920;

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const statusLabels = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Expirado",
};

/* =========================================================
AUXILIARES
========================================================= */

function text(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function createOption(value, label) {
  const option = document.createElement("option");

  option.value = value;

  option.textContent = label;

  return option;
}

function showFeedback(message, type = "success") {
  window.clearTimeout(feedbackTimer);

  feedback.textContent = message;

  feedback.classList.remove("is-error", "is-success");

  feedback.classList.add(type === "error" ? "is-error" : "is-success");

  feedback.hidden = false;

  feedbackTimer = window.setTimeout(() => {
    feedback.hidden = true;
  }, 5200);
}

function getSaoPauloDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDaysToDate(dateValue, days) {
  const match = String(dateValue || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return "";
  }

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );

  date.setUTCDate(date.getUTCDate() + Number(days || 0));

  return date.toISOString().slice(0, 10);
}

function currencyToNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");

  return digits ? Number(digits) / 100 : 0;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatBudgetCode(number) {
  return `ORC-${String(number).padStart(4, "0")}`;
}

function getCreatorName() {
  return text(
    currentSession?.profile?.nome ||
      currentSession?.user?.displayName ||
      currentSession?.email ||
      "Administrador",
  );
}

function getEditBudgetIdFromUrl() {
  const parameters = new URLSearchParams(window.location.search);

  const mode = text(parameters.get("modo")).toLowerCase();

  const id = text(parameters.get("id"));

  editMode = mode === "editar" && Boolean(id);

  editingBudgetId = editMode ? id : "";

  return editingBudgetId;
}

function setEditModePresentation() {
  if (!editMode || !editingBudgetData) {
    return;
  }

  document.title = `Editar ${editingBudgetData.codigo || "Orçamento"} | Salvateck`;

  const headerTitle = document.querySelector(".budget-header__copy strong");

  if (headerTitle) {
    headerTitle.textContent = "Editar Orçamento";
  }

  const pageTitle = document.getElementById("budget-page-title");

  if (pageTitle) {
    pageTitle.textContent = `Editar ${editingBudgetData.codigo || "orçamento"}`;
  }

  saveDraftButton.hidden = true;

  saveButton.querySelector("span").textContent = "Salvar alterações";
}

function populateServicesForEdit(services) {
  const items = Array.isArray(services)
    ? services.map(text).filter(Boolean)
    : [];

  servicesList.innerHTML = "";

  const values = items.length > 0 ? items : [""];

  values.forEach((service) => {
    const item = createServiceItem();

    const input = item.querySelector("[data-service-input]");

    if (input) {
      input.value = service;
    }

    servicesList.appendChild(item);
  });

  updateServiceItems();
}

async function populateBudgetForEdit() {
  if (!editingBudgetData) {
    return;
  }

  const data = editingBudgetData;

  const condominiumData = data.condominio || {};

  const clientData = data.cliente || {};

  const conditions = data.condicoes || {};

  const investment = data.investimento || {};

  const proposal = data.proposta || {};

  const condominiumId = text(data.condominioId || condominiumData.id);

  const clientId = text(data.clienteUid || clientData.id);

  selectedCondominium =
    condominiums.find((condominium) => condominium.id === condominiumId) ||
    null;

  if (!selectedCondominium && condominiumId) {
    selectedCondominium = {
      id: condominiumId,

      codigo: text(condominiumData.codigo),

      nome: text(condominiumData.nome || data.condominioNome) || "Condomínio",

      cnpj: text(condominiumData.cnpj),

      status: "ativo",

      endereco: condominiumData.endereco || {},

      clientesIds: clientId ? [clientId] : [],

      clientesVinculados: [],
    };

    const label = [selectedCondominium.codigo, selectedCondominium.nome]
      .filter(Boolean)
      .join(" — ");

    condominiumSelect.appendChild(
      createOption(selectedCondominium.id, label || "Condomínio do orçamento"),
    );
  }

  condominiumSelect.value = selectedCondominium?.id || "";

  if (selectedCondominium) {
    await loadLinkedClients();
  }

  selectedClient =
    linkedClients.find((client) => client.id === clientId) ||
    (clientId
      ? {
          ...clientData,
          id: clientId,
        }
      : null);

  if (clientId) {
    const hasClientOption = Array.from(clientSelect.options).some(
      (option) => option.value === clientId,
    );

    if (!hasClientOption) {
      const clientLabel = [
        text(clientData.nome || data.clienteNome),
        text(clientData.telefone),
      ]
        .filter(Boolean)
        .join(" — ");

      clientSelect.appendChild(
        createOption(clientId, clientLabel || "Cliente do orçamento"),
      );
    }

    clientSelect.disabled = false;

    clientSelect.value = clientId;
  }

  clientName.value = text(clientData.nome || data.clienteNome);

  clientPhone.value = text(clientData.telefone);

  clientEmail.value = text(clientData.email);

  addressInput.value = text(condominiumData?.endereco?.resumo || data.endereco);

  condominiumUnit.value = text(condominiumData.unidade);

  condominiumCnpj.value = text(condominiumData.cnpj);

  budgetCode.value = text(data.codigo);

  budgetDate.value = text(proposal.data) || getSaoPauloDate();

  const validityValue = String(Number(proposal.validadeDias || 15));

  if (
    validityValue &&
    !Array.from(budgetValidity.options).some(
      (option) => option.value === validityValue,
    )
  ) {
    budgetValidity.appendChild(
      createOption(validityValue, `${validityValue} dias`),
    );
  }

  budgetValidity.value = validityValue || "15";

  const statusValue = text(data.status) || "rascunho";

  if (
    statusValue &&
    !Array.from(budgetStatus.options).some(
      (option) => option.value === statusValue,
    )
  ) {
    budgetStatus.appendChild(
      createOption(statusValue, statusLabels[statusValue] || statusValue),
    );
  }

  budgetStatus.value = statusValue;

  budgetTitle.value = text(data.titulo);

  budgetSubtitle.value = text(data.subtitulo);

  serviceDescription.value = text(data.descricaoServico);

  budgetObjective.value = text(data.objetivo);

  populateServicesForEdit(data.servicosInclusos);

  materialsNote.value = text(data.materiaisFornecimento);

  const originalValue = Number(
    investment.valorServico ?? data.valorServico ?? 0,
  );

  const discount = Number(investment.desconto ?? data.desconto ?? 0);

  serviceValue.value = originalValue > 0 ? formatCurrency(originalValue) : "";

  discountValue.value = discount > 0 ? formatCurrency(discount) : "";

  discountDescription.value = text(investment.descricaoDesconto);

  generalConditions.value = Array.isArray(conditions.gerais)
    ? conditions.gerais.map(text).filter(Boolean).join("\n\n")
    : "";

  warranty.value = text(conditions.garantia);

  executionTime.value = text(conditions.prazoExecucao);

  paymentConditions.value = text(conditions.pagamento);

  publicNote.value = text(data.observacoes?.publica);

  internalNote.value = text(editingPrivateData?.observacaoInterna);

  existingImageData = data.imagemPrincipal || null;

  setEditModePresentation();

  updateSummary();
}

async function loadBudgetForEdit() {
  if (!editingBudgetId) {
    return;
  }

  const budgetReference = doc(db, "orcamentos", editingBudgetId);

  const privateReference = doc(db, "orcamentosPrivados", editingBudgetId);

  const [budgetSnapshot, privateSnapshot] = await Promise.all([
    getDoc(budgetReference),
    getDoc(privateReference),
  ]);

  if (!budgetSnapshot.exists()) {
    throw new Error("BUDGET_NOT_FOUND");
  }

  editingBudgetData = {
    id: budgetSnapshot.id,
    ...budgetSnapshot.data(),
  };

  editingPrivateData = privateSnapshot.exists()
    ? {
        id: privateSnapshot.id,
        ...privateSnapshot.data(),
      }
    : null;

  await populateBudgetForEdit();
}

/* =========================================================
CONDOMÍNIO
========================================================= */

function mapCondominium(documentSnapshot) {
  const data = documentSnapshot.data() || {};

  return {
    id: documentSnapshot.id,

    codigo: text(data.codigo),

    nome: text(data.nome) || "Condomínio sem nome",

    cnpj: text(data.cnpj),

    status: text(data.status) || "ativo",

    endereco: data.endereco || {},

    clientesIds: Array.isArray(data.clientesIds) ? data.clientesIds : [],

    clientesVinculados: Array.isArray(data.clientesVinculados)
      ? data.clientesVinculados
      : [],
  };
}

function getLinkedClientIds(condominium) {
  const directIds = Array.isArray(condominium?.clientesIds)
    ? condominium.clientesIds
    : [];

  const relationshipIds = Array.isArray(condominium?.clientesVinculados)
    ? condominium.clientesVinculados.map((link) => text(link?.clienteId))
    : [];

  return Array.from(
    new Set([...directIds, ...relationshipIds].map(text).filter(Boolean)),
  );
}

function getCondominiumAddress(condominium) {
  const address = condominium?.endereco || {};

  const street = text(address.rua || address.logradouro);

  const state = text(address.estado || address.uf);

  const summary = [
    [street, text(address.numero)].filter(Boolean).join(", "),

    text(address.complemento),

    text(address.bairro),

    [text(address.cidade), state].filter(Boolean).join("/"),

    text(address.cep),
  ]
    .filter(Boolean)
    .join(" — ");

  return {
    cep: text(address.cep),

    rua: street,

    logradouro: street,

    numero: text(address.numero),

    complemento: text(address.complemento),

    bairro: text(address.bairro),

    cidade: text(address.cidade),

    estado: state,

    uf: state,

    referencia: text(address.referencia || address.pontoReferencia),

    resumo: summary,
  };
}

/* =========================================================
CLIENTE
========================================================= */

function clearClientSelection() {
  selectedClient = null;

  linkedClients = [];

  clientSelect.innerHTML = "";

  clientSelect.appendChild(createOption("", "Selecione o condomínio primeiro"));

  clientSelect.disabled = true;

  clientName.value = "";

  clientPhone.value = "";

  clientEmail.value = "";
}

function applyClient(client) {
  selectedClient = client || null;

  if (!client) {
    return;
  }

  clientName.value = text(client.nome);

  clientPhone.value = text(client.telefone);

  clientEmail.value = text(client.email);

  updateSummary();
}

function applyCondominium(condominium) {
  if (!condominium) {
    addressInput.value = "";

    condominiumCnpj.value = "";

    return;
  }

  const address = getCondominiumAddress(condominium);

  addressInput.value = address.resumo;

  condominiumCnpj.value = condominium.cnpj;
}

async function loadLinkedClients() {
  const clientIds = getLinkedClientIds(selectedCondominium);

  linkedClients = [];

  selectedClient = null;

  clientSelect.innerHTML = "";

  if (clientIds.length === 0) {
    clientSelect.appendChild(createOption("", "Sem cliente vinculado"));

    clientSelect.disabled = true;

    return;
  }

  clientSelect.appendChild(createOption("", "Carregando clientes..."));

  clientSelect.disabled = true;

  try {
    const snapshots = await Promise.all(
      clientIds.map((clientId) => getDoc(doc(db, "usuarios", clientId))),
    );

    linkedClients = snapshots
      .filter((snapshot) => snapshot.exists())
      .map((snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      }))
      .filter((client) => client.ativo !== false)
      .sort((clientA, clientB) =>
        text(clientA.nome).localeCompare(text(clientB.nome), "pt-BR"),
      );

    clientSelect.innerHTML = "";

    if (linkedClients.length === 0) {
      clientSelect.appendChild(createOption("", "Sem cliente ativo"));

      clientSelect.disabled = true;

      return;
    }

    if (linkedClients.length > 1) {
      clientSelect.appendChild(createOption("", "Selecione o cliente"));
    }

    linkedClients.forEach((client) => {
      const label = [text(client.nome), text(client.telefone)]
        .filter(Boolean)
        .join(" — ");

      clientSelect.appendChild(
        createOption(client.id, label || "Cliente sem nome"),
      );
    });

    clientSelect.disabled = false;

    if (linkedClients.length === 1) {
      clientSelect.value = linkedClients[0].id;

      applyClient(linkedClients[0]);
    }
  } catch (error) {
    console.error("[Orçamentos] Falha ao carregar clientes:", error);

    clientSelect.innerHTML = "";

    clientSelect.appendChild(createOption("", "Erro ao carregar clientes"));

    clientSelect.disabled = true;

    showFeedback("Não foi possível carregar os clientes vinculados.", "error");
  }
}

async function loadCondominiums() {
  condominiumSelect.disabled = true;

  condominiumHelp.textContent = "Consultando os locais cadastrados.";

  try {
    const snapshot = await getDocs(collection(db, "condominios"));

    condominiums = snapshot.docs
      .map(mapCondominium)
      .filter((condominium) => normalizeText(condominium.status) !== "inativo")
      .sort((condominiumA, condominiumB) =>
        condominiumA.nome.localeCompare(condominiumB.nome, "pt-BR"),
      );

    condominiumSelect.innerHTML = "";

    condominiumSelect.appendChild(createOption("", "Selecione o condomínio"));

    condominiums.forEach((condominium) => {
      const label = [condominium.codigo, condominium.nome]
        .filter(Boolean)
        .join(" — ");

      condominiumSelect.appendChild(createOption(condominium.id, label));
    });

    condominiumSelect.disabled = condominiums.length === 0;

    condominiumHelp.textContent = condominiums.length
      ? `${condominiums.length} locais disponíveis.`
      : "Nenhum condomínio ativo foi encontrado.";
  } catch (error) {
    console.error("[Orçamentos] Falha ao carregar condomínios:", error);

    condominiumSelect.innerHTML = "";

    condominiumSelect.appendChild(
      createOption("", "Não foi possível carregar os condomínios"),
    );

    condominiumHelp.textContent =
      "Confira a conexão e as permissões do Firebase.";

    showFeedback("Não foi possível carregar os condomínios.", "error");
  }
}

/* =========================================================
IMAGEM PRINCIPAL
========================================================= */

function createCompressedImageName(originalName) {
  const baseName = String(originalName || "orcamento")
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "orcamento"}.webp`;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(new Error("IMAGE_DECODE_FAILED"));
    };

    image.src = objectUrl;
  });
}

function canvasToWebpBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("IMAGE_COMPRESSION_FAILED"));

          return;
        }

        resolve(blob);
      },

      "image/webp",

      quality,
    );
  });
}

async function compressImage(file) {
  const image = await loadImage(file);

  const originalWidth = Number(image.naturalWidth || image.width || 0);

  const originalHeight = Number(image.naturalHeight || image.height || 0);

  if (!originalWidth || !originalHeight) {
    throw new Error("IMAGE_INVALID_DIMENSIONS");
  }

  const largestDimension = Math.max(originalWidth, originalHeight);

  const initialScale =
    largestDimension > maxImageDimension
      ? maxImageDimension / largestDimension
      : 1;

  let finalWidth = Math.max(1, Math.round(originalWidth * initialScale));

  let finalHeight = Math.max(1, Math.round(originalHeight * initialScale));

  const canvas = document.createElement("canvas");

  const context = canvas.getContext("2d", {
    alpha: false,
  });

  if (!context) {
    throw new Error("IMAGE_CANVAS_UNAVAILABLE");
  }

  let compressedBlob = null;

  let quality = 0.86;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    canvas.width = finalWidth;

    canvas.height = finalHeight;

    context.fillStyle = "#ffffff";

    context.fillRect(0, 0, finalWidth, finalHeight);

    context.drawImage(image, 0, 0, finalWidth, finalHeight);

    compressedBlob = await canvasToWebpBlob(canvas, quality);

    if (compressedBlob.size <= targetCompressedImageSize) {
      break;
    }

    if (quality > 0.58) {
      quality -= 0.07;
    } else {
      finalWidth = Math.max(480, Math.round(finalWidth * 0.88));

      finalHeight = Math.max(360, Math.round(finalHeight * 0.88));
    }
  }

  if (!compressedBlob || compressedBlob.size > maxCompressedImageSize) {
    throw new Error("IMAGE_STILL_TOO_LARGE");
  }

  return new File(
    [compressedBlob],

    createCompressedImageName(file.name),

    {
      type: "image/webp",

      lastModified: file.lastModified || Date.now(),
    },
  );
}

function clearImagePreview() {
  if (imagePreviewUrl) {
    URL.revokeObjectURL(imagePreviewUrl);

    imagePreviewUrl = "";
  }

  selectedImage = null;

  selectedImageOriginalName = "";

  imageInput.value = "";

  imagePreviewElement.src = "";

  imagePreview.hidden = true;

  imageCounter.textContent = "0 / 1";

  imageError.hidden = true;
}

function renderImagePreview() {
  if (!selectedImage) {
    clearImagePreview();

    return;
  }

  if (imagePreviewUrl) {
    URL.revokeObjectURL(imagePreviewUrl);
  }

  imagePreviewUrl = URL.createObjectURL(selectedImage);

  imagePreviewElement.src = imagePreviewUrl;

  imageName.textContent = selectedImageOriginalName || selectedImage.name;

  imagePreview.hidden = false;

  imageCounter.textContent = "1 / 1";
}

async function handleImageSelection() {
  if (processingImage) {
    return;
  }

  const file = imageInput.files?.[0];

  if (!file) {
    return;
  }

  imageError.hidden = true;

  if (!acceptedImageTypes.has(file.type)) {
    imageInput.value = "";

    imageError.textContent = "Use uma imagem JPG, PNG ou WebP.";

    imageError.hidden = false;

    showFeedback("O formato da imagem não é permitido.", "error");

    return;
  }

  if (file.size <= 0 || file.size > maxOriginalImageSize) {
    imageInput.value = "";

    imageError.textContent = "A imagem precisa ter conteúdo e no máximo 10 MB.";

    imageError.hidden = false;

    showFeedback(
      "A imagem selecionada ultrapassa o limite permitido.",
      "error",
    );

    return;
  }

  processingImage = true;

  imageInput.disabled = true;

  imageCounter.textContent = "...";

  try {
    selectedImageOriginalName = file.name;

    selectedImage = await compressImage(file);

    renderImagePreview();
  } catch (error) {
    console.error("[Orçamentos] Falha ao preparar imagem:", error);

    selectedImage = null;

    selectedImageOriginalName = "";

    imageError.textContent = "Não foi possível preparar a imagem selecionada.";

    imageError.hidden = false;

    imageCounter.textContent = "0 / 1";

    showFeedback("Não foi possível preparar a imagem.", "error");
  } finally {
    processingImage = false;

    imageInput.disabled = false;

    imageInput.value = "";
  }
}

async function uploadBudgetImage(budgetId) {
  if (!selectedImage) {
    return null;
  }

  const storagePath = `orcamentos/${budgetId}/capa.webp`;

  const storageReference = ref(storage, storagePath);

  await uploadBytes(
    storageReference,

    selectedImage,

    {
      contentType: "image/webp",

      customMetadata: {
        orcamentoId: budgetId,

        enviadoPorUid: currentSession.uid,

        enviadoPorPerfil: "admin",

        origem: "orcamento",

        nomeOriginal: selectedImageOriginalName || selectedImage.name,
      },
    },
  );

  const url = await getDownloadURL(storageReference);

  return {
    storageReference,

    data: {
      storagePath,

      url,

      nome: selectedImageOriginalName || selectedImage.name,

      contentType: "image/webp",

      tamanho: Number(selectedImage.size || 0),

      enviadoPorUid: currentSession.uid,

      enviadoPorPerfil: "admin",

      enviadoEm: new Date().toISOString(),
    },
  };
}

/* =========================================================
SERVIÇOS INCLUSOS
========================================================= */

function getServiceItems() {
  return Array.from(servicesList.querySelectorAll("[data-service-item]"));
}

function getServices() {
  return getServiceItems()
    .map((item) => text(item.querySelector("[data-service-input]")?.value))
    .filter(Boolean);
}

function updateServiceItems() {
  const items = getServiceItems();

  items.forEach((item, index) => {
    const number = item.querySelector(".budget-service-item__number");

    const input = item.querySelector("[data-service-input]");

    const removeButton = item.querySelector("[data-remove-service]");

    number.textContent = String(index + 1);

    input.id = `budget-service-${index + 1}`;

    const label = item.querySelector("label");

    label?.setAttribute("for", input.id);

    removeButton.disabled = items.length === 1;
  });
}

function createServiceItem() {
  const item = document.createElement("div");

  item.className = "budget-service-item";

  item.dataset.serviceItem = "";

  item.innerHTML = `
    <span class="budget-service-item__number"></span>

    <label class="field budget-service-item__field">
      <span>Serviço ou etapa *</span>

      <input
        type="text"
        maxlength="220"
        placeholder="Ex.: Teste, instalação ou acabamento"
        data-service-input
      />
    </label>

    <button
      type="button"
      class="budget-service-item__remove"
      data-remove-service
      aria-label="Remover serviço"
      title="Remover serviço"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18"></path>
      </svg>
    </button>
  `;

  const removeButton = item.querySelector("[data-remove-service]");

  removeButton.addEventListener("click", () => {
    item.remove();

    updateServiceItems();

    updateSummary();
  });

  item
    .querySelector("[data-service-input]")
    .addEventListener("input", updateSummary);

  return item;
}

function addServiceItem() {
  const item = createServiceItem();

  servicesList.appendChild(item);

  updateServiceItems();

  item.querySelector("[data-service-input]").focus();
}

function bindInitialServiceItem() {
  const firstItem = servicesList.querySelector("[data-service-item]");

  if (!firstItem) {
    servicesList.appendChild(createServiceItem());

    updateServiceItems();

    return;
  }

  firstItem
    .querySelector("[data-service-input]")
    ?.addEventListener("input", updateSummary);

  firstItem
    .querySelector("[data-remove-service]")
    ?.addEventListener("click", () => {
      if (getServiceItems().length <= 1) {
        return;
      }

      firstItem.remove();

      updateServiceItems();

      updateSummary();
    });

  updateServiceItems();
}

/* =========================================================
INVESTIMENTO
========================================================= */

function getInvestmentValues() {
  const originalValue = currencyToNumber(serviceValue.value);

  const discount = currencyToNumber(discountValue.value);

  const finalValue = Math.max(0, originalValue - discount);

  return {
    originalValue,
    discount,
    finalValue,
  };
}

function updateInvestment() {
  const values = getInvestmentValues();

  investmentServiceValue.textContent = formatCurrency(values.originalValue);

  investmentDiscountValue.textContent = formatCurrency(values.discount);

  investmentFinalValue.textContent = formatCurrency(values.finalValue);

  summaryOriginalValue.textContent = formatCurrency(values.originalValue);

  summaryDiscount.textContent = formatCurrency(values.discount);

  summaryFinalValue.textContent = formatCurrency(values.finalValue);
}

function formatCurrencyInput(input) {
  const value = currencyToNumber(input.value);

  input.value = value > 0 ? formatCurrency(value) : "";

  updateSummary();
}

/* =========================================================
RESUMO
========================================================= */

function updateSummary() {
  const condominiumLabel = selectedCondominium
    ? [selectedCondominium.codigo, selectedCondominium.nome]
        .filter(Boolean)
        .join(" — ")
    : "Não selecionado";

  summaryStatus.textContent =
    statusLabels[budgetStatus.value] || statusLabels.rascunho;

  summaryClient.textContent = text(clientName.value) || "Não informado";

  summaryCondominium.textContent = condominiumLabel;

  summaryCode.textContent = text(budgetCode.value) || "Será gerada ao salvar";

  summaryValidity.textContent = `${Number(budgetValidity.value || 15)} dias`;

  summaryService.textContent =
    text(budgetSubtitle.value) ||
    text(serviceDescription.value) ||
    text(budgetTitle.value) ||
    "Não informado";

  updateInvestment();
}

/* =========================================================
VALIDAÇÃO
========================================================= */

function validateBudget() {
  if (processingImage) {
    showFeedback(
      "Aguarde o processamento da imagem antes de salvar o orçamento.",
      "error",
    );

    return false;
  }

  if (!form.checkValidity()) {
    form.reportValidity();

    return false;
  }

  if (!selectedCondominium) {
    showFeedback("Selecione o condomínio do orçamento.", "error");

    condominiumSelect.focus();

    return false;
  }

  if (getServices().length === 0) {
    showFeedback("Adicione pelo menos um serviço incluso.", "error");

    servicesList.querySelector("[data-service-input]")?.focus();

    return false;
  }

  const values = getInvestmentValues();

  if (values.originalValue <= 0) {
    showFeedback("Informe o valor do serviço.", "error");

    serviceValue.focus();

    return false;
  }

  if (values.discount > values.originalValue) {
    showFeedback(
      "O desconto não pode ser maior que o valor do serviço.",
      "error",
    );

    discountValue.focus();

    return false;
  }

  return true;
}

/* =========================================================
DADOS DO ORÇAMENTO
========================================================= */

function buildBudgetData({
  id,
  number,
  code,
  status,
  imageData,
  existingData = null,
}) {
  const address = selectedCondominium
    ? getCondominiumAddress(selectedCondominium)
    : existingData?.condominio?.endereco || {};

  const values = getInvestmentValues();

  const validityDays = Number(budgetValidity.value || 15);

  const proposalDate = text(budgetDate.value) || getSaoPauloDate();

  const validityDate = addDaysToDate(proposalDate, validityDays);

  const creatorName = getCreatorName();

  const publicConditions = text(generalConditions.value)
    .split(/\n+/)
    .map(text)
    .filter(Boolean);

  const finalStatus = status || "rascunho";

  return {
    id,

    numero: number,

    codigo: code,

    status: finalStatus,

    titulo: text(budgetTitle.value),

    subtitulo: text(budgetSubtitle.value),

    descricaoServico: text(serviceDescription.value),

    objetivo: text(budgetObjective.value),

    clienteUid: selectedClient?.id || "",

    clienteNome: text(clientName.value),

    cliente: {
      id: selectedClient?.id || "",

      nome: text(clientName.value),

      telefone: text(clientPhone.value),

      email: text(clientEmail.value),
    },

    condominioId: selectedCondominium?.id || "",

    condominioNome: selectedCondominium?.nome || "",

    condominio: {
      id: selectedCondominium?.id || "",

      codigo: selectedCondominium?.codigo || "",

      nome: selectedCondominium?.nome || "",

      cnpj: text(condominiumCnpj.value),

      unidade: text(condominiumUnit.value),

      endereco: {
        ...address,

        resumo: text(addressInput.value) || text(address.resumo),
      },
    },

    proposta: {
      data: proposalDate,

      validadeDias: validityDays,

      validadeAte: validityDate,
    },

    imagemPrincipal: imageData || null,

    servicosInclusos: getServices(),

    materiaisFornecimento: text(materialsNote.value),

    investimento: {
      valorServico: values.originalValue,

      desconto: values.discount,

      valorFinal: values.finalValue,

      descricaoDesconto: text(discountDescription.value),
    },

    valorServico: values.originalValue,

    desconto: values.discount,

    valorFinal: values.finalValue,

    condicoes: {
      gerais: publicConditions,

      garantia: text(warranty.value),

      prazoExecucao: text(executionTime.value),

      pagamento: text(paymentConditions.value),
    },

    observacoes: {
      publica: text(publicNote.value),
    },

    origem: {
      tipo: "orcamento",

      criadoNoPainelAdmin: true,
    },

    enviadoEm:
      finalStatus === "enviado"
        ? existingData?.enviadoEm || serverTimestamp()
        : existingData?.enviadoEm || null,

    aprovadoEm:
      finalStatus === "aprovado"
        ? existingData?.aprovadoEm || serverTimestamp()
        : existingData?.aprovadoEm || null,

    recusadoEm:
      finalStatus === "recusado"
        ? existingData?.recusadoEm || serverTimestamp()
        : existingData?.recusadoEm || null,

    expiradoEm:
      finalStatus === "expirado"
        ? existingData?.expiradoEm || serverTimestamp()
        : existingData?.expiradoEm || null,

    criadoEm: existingData?.criadoEm || serverTimestamp(),

    criadoPorUid: text(existingData?.criadoPorUid) || currentSession.uid,

    criadoPorNome: text(existingData?.criadoPorNome) || creatorName,

    atualizadoEm: serverTimestamp(),

    atualizadoPorUid: currentSession.uid,

    atualizadoPorNome: creatorName,
  };
}

/* =========================================================
SALVAMENTO NO FIRESTORE
========================================================= */

async function updateExistingBudget(status) {
  if (!editingBudgetId || !editingBudgetData) {
    throw new Error("BUDGET_NOT_FOUND");
  }

  const budgetReference = doc(db, "orcamentos", editingBudgetId);

  const privateReference = doc(db, "orcamentosPrivados", editingBudgetId);

  let uploadedImage = null;

  if (selectedImage) {
    uploadedImage = await uploadBudgetImage(editingBudgetId);
  }

  const imageData = uploadedImage?.data || existingImageData || null;

  const budgetData = buildBudgetData({
    id: editingBudgetId,

    number: Number(editingBudgetData.numero || 0),

    code: text(editingBudgetData.codigo),

    status,

    imageData,

    existingData: editingBudgetData,
  });

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(budgetReference);

    if (!snapshot.exists()) {
      throw new Error("BUDGET_NOT_FOUND");
    }

    transaction.set(budgetReference, budgetData, {
      merge: true,
    });

    transaction.set(
      privateReference,
      {
        orcamentoId: editingBudgetId,

        codigo: text(editingBudgetData.codigo),

        observacaoInterna: text(internalNote.value),

        criadoEm: editingPrivateData?.criadoEm || serverTimestamp(),

        atualizadoEm: serverTimestamp(),

        atualizadoPorUid: currentSession.uid,
      },
      {
        merge: true,
      },
    );
  });

  editingBudgetData = {
    ...editingBudgetData,
    ...budgetData,
  };

  existingImageData = imageData;

  return {
    id: editingBudgetId,

    numero: Number(editingBudgetData.numero || 0),

    codigo: text(editingBudgetData.codigo),

    status,
  };
}

async function saveBudget(status) {
  if (editMode) {
    return updateExistingBudget(status);
  }

  const counterReference = doc(db, "contadores", "orcamentos");

  const budgetReference = doc(collection(db, "orcamentos"));

  const privateReference = doc(db, "orcamentosPrivados", budgetReference.id);

  let uploadedImage = null;

  try {
    uploadedImage = await uploadBudgetImage(budgetReference.id);

    const savedBudget = await runTransaction(db, async (transaction) => {
      const counterSnapshot = await transaction.get(counterReference);

      const currentNumber = counterSnapshot.exists()
        ? Number(counterSnapshot.data().ultimoNumero || 0)
        : 0;

      if (!Number.isInteger(currentNumber) || currentNumber < 0) {
        throw new Error("INVALID_BUDGET_COUNTER");
      }

      const nextNumber = currentNumber + 1;

      const code = formatBudgetCode(nextNumber);

      const budgetData = buildBudgetData({
        id: budgetReference.id,

        number: nextNumber,

        code,

        status,

        imageData: uploadedImage?.data || null,
      });

      transaction.set(
        counterReference,

        {
          ultimoNumero: nextNumber,

          ultimoDocumentoId: budgetReference.id,

          atualizadoEm: serverTimestamp(),
        },

        {
          merge: true,
        },
      );

      transaction.set(budgetReference, budgetData);

      if (text(internalNote.value)) {
        transaction.set(
          privateReference,

          {
            orcamentoId: budgetReference.id,

            codigo: code,

            observacaoInterna: text(internalNote.value),

            criadoEm: serverTimestamp(),

            atualizadoEm: serverTimestamp(),

            atualizadoPorUid: currentSession.uid,
          },
        );
      }

      return {
        id: budgetReference.id,

        numero: nextNumber,

        codigo: code,

        status,
      };
    });

    return savedBudget;
  } catch (error) {
    if (uploadedImage?.storageReference) {
      await Promise.allSettled([deleteObject(uploadedImage.storageReference)]);
    }

    throw error;
  }
}

/* =========================================================
ERROS
========================================================= */

function getErrorMessage(error) {
  if (error?.message === "BUDGET_NOT_FOUND") {
    return "O orçamento que você tentou editar não foi encontrado.";
  }

  if (error?.message === "INVALID_BUDGET_COUNTER") {
    return "O contador dos orçamentos possui um valor inválido.";
  }

  if (error?.code === "permission-denied") {
    return "O Firebase bloqueou o registro. Precisamos publicar as regras do módulo de Orçamentos.";
  }

  if (error?.code === "unavailable") {
    return "Não foi possível acessar o Firebase. Verifique sua conexão.";
  }

  if (
    error?.code === "storage/unauthorized" ||
    error?.code === "storage/permission-denied"
  ) {
    return "O Firebase Storage bloqueou a imagem. Precisamos publicar as regras do módulo de Orçamentos.";
  }

  if (error?.code === "storage/retry-limit-exceeded") {
    return "O envio da imagem demorou demais. Tente novamente.";
  }

  return "Não foi possível salvar o orçamento. Tente novamente.";
}

/* =========================================================
ESTADO DE SALVAMENTO
========================================================= */

function setSavingState(isSaving, mode = "budget") {
  savingBudget = isSaving;

  saveButton.disabled = isSaving;

  saveDraftButton.disabled = isSaving;

  if (!isSaving) {
    saveButton.querySelector("span").textContent = editMode
      ? "Salvar alterações"
      : "Salvar orçamento";

    saveDraftButton.querySelector("span").textContent = "Salvar rascunho";

    return;
  }

  if (editMode) {
    saveButton.querySelector("span").textContent = "Salvando alterações...";
  } else if (mode === "draft") {
    saveDraftButton.querySelector("span").textContent = "Salvando rascunho...";
  } else {
    saveButton.querySelector("span").textContent = "Salvando orçamento...";
  }
}

/* =========================================================
SUCESSO
========================================================= */

function showSuccess(savedBudget) {
  budgetCode.value = savedBudget.codigo;

  summaryCode.textContent = savedBudget.codigo;

  successBudgetCode.textContent = savedBudget.codigo;

  const parameters = new URLSearchParams({
    perfil: "admin",

    id: savedBudget.id,
  });

  viewBudgetLink.href = `detalhes-orcamento.html?${parameters.toString()}`;

  form.hidden = true;

  successCard.hidden = false;

  successCard.scrollIntoView({
    behavior: "smooth",

    block: "start",
  });
}

/* =========================================================
EXECUÇÃO DO SALVAMENTO
========================================================= */

async function handleBudgetSave({ mode, status }) {
  if (savingBudget) {
    return;
  }

  if (processingImage) {
    showFeedback("Aguarde o processamento da imagem antes de salvar.", "error");

    return;
  }

  if (mode !== "draft" && !validateBudget()) {
    return;
  }

  setSavingState(true, mode);

  try {
    const savedBudget = await saveBudget(status);

    if (editMode) {
      const parameters = new URLSearchParams({
        perfil: "admin",
        id: savedBudget.id,
      });

      window.location.href = `detalhes-orcamento.html?${parameters.toString()}`;

      return;
    }

    showSuccess(savedBudget);

    showFeedback(
      mode === "draft"
        ? "Rascunho salvo com sucesso."
        : "Orçamento salvo com sucesso.",
    );
  } catch (error) {
    console.error("[Orçamentos] Não foi possível salvar:", error);

    showFeedback(getErrorMessage(error), "error");
  } finally {
    setSavingState(false, mode);
  }
}

/* =========================================================
RESET
========================================================= */

function resetServices() {
  servicesList.innerHTML = "";

  servicesList.appendChild(createServiceItem());

  updateServiceItems();
}

function resetBudgetForm() {
  form.reset();

  selectedCondominium = null;

  selectedClient = null;

  clearClientSelection();

  clearImagePreview();

  resetServices();

  budgetDate.value = getSaoPauloDate();

  budgetValidity.value = "15";

  budgetStatus.value = "rascunho";

  budgetCode.value = "";

  condominiumSelect.value = "";

  addressInput.value = "";

  condominiumCnpj.value = "";

  successCard.hidden = true;

  form.hidden = false;

  updateSummary();

  window.scrollTo({
    top: 0,

    behavior: "smooth",
  });
}

/* =========================================================
EVENTOS
========================================================= */

condominiumSelect.addEventListener("change", async () => {
  selectedCondominium = condominiums.find(
    (condominium) => condominium.id === condominiumSelect.value,
  );

  clearClientSelection();

  applyCondominium(selectedCondominium);

  if (selectedCondominium) {
    await loadLinkedClients();
  }

  updateSummary();
});

clientSelect.addEventListener("change", () => {
  const client = linkedClients.find(
    (linkedClient) => linkedClient.id === clientSelect.value,
  );

  selectedClient = client || null;

  if (client) {
    applyClient(client);
  }
});

serviceValue.addEventListener("input", () => {
  formatCurrencyInput(serviceValue);
});

discountValue.addEventListener("input", () => {
  formatCurrencyInput(discountValue);
});

[clientName, budgetTitle, budgetSubtitle, serviceDescription].forEach(
  (element) => {
    element.addEventListener("input", updateSummary);
  },
);

budgetValidity.addEventListener("change", updateSummary);

budgetStatus.addEventListener("change", updateSummary);

imageInput.addEventListener("change", handleImageSelection);

removeImageButton.addEventListener("click", clearImagePreview);

addServiceButton.addEventListener("click", addServiceItem);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  handleBudgetSave({
    mode: "budget",

    status: budgetStatus.value || "rascunho",
  });
});

saveDraftButton.addEventListener("click", () => {
  handleBudgetSave({
    mode: "draft",

    status: "rascunho",
  });
});

newBudgetButton.addEventListener("click", resetBudgetForm);

/* =========================================================
INICIALIZAÇÃO
========================================================= */

async function initializePage() {
  try {
    currentSession = await window.salvateckSessionReady;

    if (!currentSession || currentSession.role !== "admin") {
      return;
    }

    getEditBudgetIdFromUrl();

    budgetDate.value = getSaoPauloDate();

    budgetValidity.value = "15";

    budgetStatus.value = "rascunho";

    bindInitialServiceItem();

    updateSummary();

    await loadCondominiums();

    if (editMode) {
      await loadBudgetForEdit();
    }
  } catch (error) {
    console.error("[Orçamentos] Não foi possível iniciar a página:", error);

    showFeedback("Não foi possível iniciar o módulo de Orçamentos.", "error");
  }
}

initializePage();
