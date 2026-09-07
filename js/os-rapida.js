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
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import { db, storage } from "./firebase-config.js";

const form = document.getElementById("quick-order-form");
const condominiumSelect = document.getElementById("quick-condominium");
const condominiumHelp = document.getElementById("condominium-help");
const clientSelect = document.getElementById("quick-client");
const clientName = document.getElementById("quick-client-name");
const clientPhone = document.getElementById("quick-client-phone");
const clientEmail = document.getElementById("quick-client-email");
const serviceTitle = document.getElementById("quick-service-title");
const serviceDate = document.getElementById("quick-service-date");
const serviceTime = document.getElementById("quick-service-time");
const employeeSelect = document.getElementById("quick-employee");
const description = document.getElementById("quick-description");
const descriptionCount = document.getElementById("description-count");
const technicalResponsibleName = document.getElementById(
  "quick-technical-responsible",
);
const technicalCrea = document.getElementById("quick-technical-crea");
const technicalTrt = document.getElementById("quick-technical-trt");
const photoInput = document.getElementById("quick-photos");
const photoPreview = document.getElementById("quick-photo-preview");
const photoStatus = document.getElementById("quick-photo-status");
const photoCount = document.getElementById("quick-photo-count");
const photoProcessing = document.getElementById("quick-photo-processing");
const photoError = document.getElementById("quick-photo-error");
const orderValue = document.getElementById("quick-value");
const paymentStatus = document.getElementById("quick-payment-status");
const paymentMethod = document.getElementById("quick-payment-method");
const internalNotes = document.getElementById("quick-notes");
const saveButton = document.getElementById("save-quick-order");
const feedback = document.getElementById("quick-feedback");
const successCard = document.getElementById("quick-order-success");
const successCode = document.getElementById("success-code");
const viewOrderLink = document.getElementById("view-order-link");
const newQuickOrderButton = document.getElementById("new-quick-order");
const summaryCondominium = document.getElementById("summary-condominium");
const summaryClient = document.getElementById("summary-client");
const summaryService = document.getElementById("summary-service");
const summaryValue = document.getElementById("summary-value");

let currentSession = null;
let condominiums = [];
let linkedClients = [];
let employees = [];
let selectedCondominium = null;
let selectedClient = null;
let feedbackTimer = null;
let selectedFiles = [];
let processingPhotos = false;

const maxPhotos = 6;
const maxOriginalPhotoSize = 10 * 1024 * 1024;
const targetCompressedPhotoSize = 1 * 1024 * 1024;
const maxCompressedPhotoSize = 2 * 1024 * 1024;
const maxPhotoDimension = 1920;

const acceptedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

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

function showFeedback(message, type = "info") {
  window.clearTimeout(feedbackTimer);

  feedback.textContent = message;
  feedback.classList.toggle("is-error", type === "error");
  feedback.hidden = false;

  feedbackTimer = window.setTimeout(() => {
    feedback.hidden = true;
  }, 5200);
}

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

function setPhotoStatus({
  countText = "",
  processingText = "",
  state = "",
  errorMessage = "",
} = {}) {
  photoCount.textContent = countText;
  photoProcessing.textContent = processingText;

  photoStatus.classList.remove("is-processing", "is-success", "is-error");

  if (state) {
    photoStatus.classList.add(state);
  }

  photoError.textContent =
    errorMessage || "Não foi possível preparar as imagens selecionadas.";

  photoError.hidden = !errorMessage;
}

function updatePhotoSelectionStatus() {
  const quantity = selectedFiles.length;

  if (quantity === 0) {
    setPhotoStatus({
      countText: "Nenhuma imagem selecionada",
      processingText: "Compressão automática para WebP",
    });

    return;
  }

  const totalSize = selectedFiles.reduce(
    (total, file) => total + Number(file.size || 0),
    0,
  );

  setPhotoStatus({
    countText:
      quantity === 1
        ? "1 de 6 imagens preparada"
        : `${quantity} de 6 imagens preparadas`,
    processingText: `Total após compressão: ${formatPhotoSize(totalSize)}`,
    state: "is-success",
  });
}

function resetPhotoSelection() {
  selectedFiles = [];
  processingPhotos = false;

  photoInput.value = "";
  photoInput.disabled = false;
  photoPreview.innerHTML = "";

  updatePhotoSelectionStatus();
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

async function compressPhoto(file) {
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

  for (let attempt = 0; attempt < 10; attempt += 1) {
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
      finalWidth = Math.max(1, Math.round(finalWidth * 0.88));
      finalHeight = Math.max(1, Math.round(finalHeight * 0.88));
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

function renderPhotoPreview() {
  photoPreview.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const previewItem = document.createElement("div");

    previewItem.className = "quick-photo-preview__item";

    const image = document.createElement("img");

    image.alt = `Pré-visualização da imagem ${index + 1}`;

    const objectUrl = URL.createObjectURL(file);

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
    removeButton.className = "quick-photo-preview__remove";
    removeButton.textContent = "×";

    removeButton.setAttribute("aria-label", `Remover imagem ${index + 1}`);

    removeButton.addEventListener("click", () => {
      if (processingPhotos) {
        return;
      }

      selectedFiles.splice(index, 1);

      photoInput.disabled = false;

      renderPhotoPreview();
      updatePhotoSelectionStatus();
    });

    previewItem.append(image, removeButton);

    photoPreview.appendChild(previewItem);
  });
}

async function handlePhotoSelection() {
  if (processingPhotos) {
    return;
  }

  const incomingFiles = Array.from(photoInput.files || []);

  if (incomingFiles.length === 0) {
    return;
  }

  const availableSlots = maxPhotos - selectedFiles.length;

  if (availableSlots <= 0) {
    photoInput.value = "";

    showFeedback(`A OS já possui o limite de ${maxPhotos} imagens.`, "error");

    return;
  }

  processingPhotos = true;
  photoInput.disabled = true;

  setPhotoStatus({
    countText: `${selectedFiles.length} de ${maxPhotos} imagens preparadas`,
    processingText: "Validando e comprimindo imagens...",
    state: "is-processing",
  });

  const filesToProcess = incomingFiles.slice(0, availableSlots);
  const errors = [];

  if (incomingFiles.length > availableSlots) {
    errors.push(
      `Somente ${availableSlots} imagem(ns) foram consideradas, pois o limite da OS é ${maxPhotos}.`,
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

      const compressedName = createCompressedPhotoName(file.name);

      const alreadyExists = selectedFiles.some(
        (selectedFile) =>
          selectedFile.name === compressedName &&
          selectedFile.lastModified === file.lastModified,
      );

      if (alreadyExists) {
        errors.push(`${file.name}: esta imagem já foi adicionada.`);

        continue;
      }

      try {
        const compressedFile = await compressPhoto(file);

        selectedFiles.push(compressedFile);
      } catch (error) {
        console.error(
          `[OS Rápida] Não foi possível comprimir ${file.name}:`,
          error,
        );

        errors.push(`${file.name}: não foi possível preparar a imagem.`);
      }
    }
  } finally {
    processingPhotos = false;

    photoInput.value = "";
    photoInput.disabled = selectedFiles.length >= maxPhotos;

    renderPhotoPreview();
    updatePhotoSelectionStatus();
  }

  if (errors.length > 0) {
    setPhotoStatus({
      countText:
        selectedFiles.length === 1
          ? "1 de 6 imagens preparada"
          : `${selectedFiles.length} de 6 imagens preparadas`,
      processingText:
        selectedFiles.length > 0
          ? "As imagens válidas foram preparadas."
          : "Nenhuma imagem válida foi adicionada.",
      state: "is-error",
      errorMessage: errors.join(" "),
    });

    showFeedback(errors[0], "error");

    return;
  }

  setPhotoStatus({
    countText:
      selectedFiles.length === 1
        ? "1 de 6 imagens preparada"
        : `${selectedFiles.length} de 6 imagens preparadas`,
    processingText: "Compressão concluída com sucesso.",
    state: "is-success",
  });
}

async function uploadQuickOrderPhotos(orderId) {
  if (selectedFiles.length === 0) {
    return [];
  }

  const uploadedPhotos = [];

  try {
    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      const position = index + 1;
      const fileName = `foto-${position}.webp`;
      const storagePath = `ordens/${orderId}/imagens/${fileName}`;

      const storageReference = ref(storage, storagePath);

      setPhotoStatus({
        countText: `${position} de ${selectedFiles.length}`,
        processingText: `Enviando imagem ${position}...`,
        state: "is-processing",
      });

      await uploadBytes(storageReference, file, {
        contentType: "image/webp",
        customMetadata: {
          ordemId: orderId,
          enviadoPorUid: currentSession.uid,
          enviadoPorPerfil: "admin",
          origem: "os-rapida",
          nomeOriginal: file.name || fileName,
        },
      });

      uploadedPhotos.push({
        storageReference,
        data: {
          storagePath,
          nome: file.name || fileName,
          contentType: "image/webp",
          tamanho: Number(file.size || 0),
          posicao: position,
          enviadoPorUid: currentSession.uid,
          enviadoPorPerfil: "admin",
          origem: "os-rapida",
          enviadoEm: new Date().toISOString(),
        },
      });
    }

    return uploadedPhotos;
  } catch (error) {
    await Promise.allSettled(
      uploadedPhotos.map((photo) => deleteObject(photo.storageReference)),
    );

    setPhotoStatus({
      countText: "Upload não concluído",
      processingText: "As imagens não foram armazenadas.",
      state: "is-error",
      errorMessage: "Não foi possível enviar as imagens da OS Rápida.",
    });

    throw error;
  }
}

async function deleteUploadedQuickOrderPhotos(uploadedPhotos) {
  await Promise.allSettled(
    uploadedPhotos.map((photo) => deleteObject(photo.storageReference)),
  );
}

function getSaoPauloDateTime() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function setDefaultDateTime() {
  const now = getSaoPauloDateTime();

  serviceDate.value = now.date;
  serviceTime.value = now.time;
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
    estruturaAmbientes: Array.isArray(data.estruturaAmbientes)
      ? data.estruturaAmbientes
      : [],
    equipamentos: Array.isArray(data.equipamentos) ? data.equipamentos : [],
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

function getCreatorName() {
  return text(
    currentSession?.profile?.nome ||
      currentSession?.user?.displayName ||
      currentSession?.email ||
      "Administrador",
  );
}

function getSelectedEmployee() {
  return employees.find((employee) => employee.id === employeeSelect.value);
}

function updateSummary() {
  const condominiumLabel = selectedCondominium
    ? [selectedCondominium.codigo, selectedCondominium.nome]
        .filter(Boolean)
        .join(" — ")
    : "Não selecionado";

  summaryCondominium.textContent = condominiumLabel;
  summaryClient.textContent = text(clientName.value) || "Não informado";
  summaryService.textContent = text(serviceTitle.value) || "Manutenção geral";
  summaryValue.textContent = formatCurrency(currencyToNumber(orderValue.value));
}

function updatePaymentFields() {
  const isPaid = paymentStatus.value === "paid";

  paymentMethod.disabled = !isPaid;
  paymentMethod.required = isPaid;

  if (!isPaid) {
    paymentMethod.value = "";
  }
}

function clearClientSelection() {
  selectedClient = null;
  linkedClients = [];

  clientSelect.innerHTML = "";
  clientSelect.appendChild(createOption("", "Selecione o condomínio primeiro"));
  clientSelect.disabled = true;

  clientName.value = "";
  clientPhone.value = "";
  clientEmail.value = "";

  updateSummary();
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

async function loadLinkedClients() {
  const clientIds = getLinkedClientIds(selectedCondominium);

  linkedClients = [];
  selectedClient = null;
  clientSelect.innerHTML = "";

  if (clientIds.length === 0) {
    clientSelect.appendChild(createOption("", "Sem cliente vinculado"));
    clientSelect.disabled = true;
    clientName.focus();

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
      .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
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
    console.error("[OS Rápida] Falha ao carregar clientes:", error);

    clientSelect.innerHTML = "";
    clientSelect.appendChild(createOption("", "Erro ao carregar clientes"));
    clientSelect.disabled = true;
    showFeedback(
      "Não foi possível carregar os clientes. O nome pode ser informado manualmente.",
      "error",
    );
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
    console.error("[OS Rápida] Falha ao carregar condomínios:", error);

    condominiumSelect.innerHTML = "";
    condominiumSelect.appendChild(
      createOption("", "Não foi possível carregar os condomínios"),
    );
    condominiumHelp.textContent =
      "Confira a conexão e as permissões do Firebase.";
    showFeedback("Não foi possível carregar os condomínios.", "error");
  }
}

async function loadEmployees() {
  employeeSelect.disabled = true;

  try {
    const snapshot = await getDocs(collection(db, "funcionarios"));

    employees = snapshot.docs
      .map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }))
      .filter(
        (employee) =>
          normalizeText(employee.status) === "ativo" &&
          Boolean(text(employee.usuarioUid)),
      )
      .sort((employeeA, employeeB) =>
        text(employeeA.nome).localeCompare(text(employeeB.nome), "pt-BR"),
      );

    employeeSelect.innerHTML = "";
    employeeSelect.appendChild(createOption("", "Sem funcionário específico"));

    employees.forEach((employee) => {
      const label = [employee.codigo, employee.nome, employee.cargo]
        .map(text)
        .filter(Boolean)
        .join(" — ");

      employeeSelect.appendChild(
        createOption(employee.id, label || "Funcionário sem identificação"),
      );
    });

    employeeSelect.disabled = false;
  } catch (error) {
    console.error("[OS Rápida] Falha ao carregar funcionários:", error);

    employeeSelect.innerHTML = "";
    employeeSelect.appendChild(createOption("", "Sem funcionário específico"));
    employeeSelect.disabled = false;
  }
}

function validateForm() {
  if (processingPhotos) {
    showFeedback(
      "Aguarde o processamento das imagens antes de registrar a OS.",
      "error",
    );

    return false;
  }

  if (!selectedCondominium) {
    showFeedback("Selecione o condomínio do atendimento.", "error");
    condominiumSelect.focus();

    return false;
  }

  if (!text(clientName.value)) {
    showFeedback("Informe o nome do cliente ou responsável.", "error");
    clientName.focus();

    return false;
  }

  if (!text(serviceTitle.value)) {
    showFeedback("Informe o título da manutenção.", "error");
    serviceTitle.focus();

    return false;
  }

  if (!serviceDate.value || !serviceTime.value) {
    showFeedback("Informe a data e o horário do serviço.", "error");
    (serviceDate.value ? serviceTime : serviceDate).focus();

    return false;
  }

  if (!text(description.value)) {
    showFeedback("Descreva o serviço que foi realizado.", "error");
    description.focus();

    return false;
  }

  if (!text(technicalResponsibleName.value)) {
    showFeedback("Informe o nome do Responsável Técnico.", "error");
    technicalResponsibleName.focus();

    return false;
  }

  if (currencyToNumber(orderValue.value) <= 0) {
    showFeedback("Informe um valor válido para a OS.", "error");
    orderValue.focus();

    return false;
  }

  if (paymentStatus.value === "paid" && !paymentMethod.value) {
    showFeedback("Selecione a forma de pagamento.", "error");
    paymentMethod.focus();

    return false;
  }

  return true;
}

function formatOrderCode(number) {
  return `OS-${String(number).padStart(4, "0")}`;
}

function buildOrderData({ id, number, code, photos = [] }) {
  const creatorName = getCreatorName();
  const employee = getSelectedEmployee();
  const clientId = text(selectedClient?.id);
  const title = text(serviceTitle.value);
  const serviceDescription = text(description.value);
  const address = getCondominiumAddress(selectedCondominium);
  const value = currencyToNumber(orderValue.value);
  const technicalResponsibility = {
    nome: text(technicalResponsibleName.value),
    crea: text(technicalCrea.value),
    trt: text(technicalTrt.value),
  };
  const services = [
    {
      categoria: "manutencao-geral",
      servico: title,
    },
  ];
  const attendance = {
    modo: "imediato",
    dataPreferida: serviceDate.value,
    periodo: "",
    horarioPreferido: serviceTime.value,
    dataConfirmada: serviceDate.value,
    periodoConfirmado: "",
    horarioConfirmado: serviceTime.value,
    horarioFinal: "",
    duracaoMinutos: 0,
    intervaloMinutos: 30,
    fusoHorario: "America/Sao_Paulo",
    agendadoEm: null,
  };
  const client = {
    id: clientId,
    nome: text(clientName.value),
    telefone: text(clientPhone.value),
    email: text(clientEmail.value),
  };
  const condominium = {
    id: selectedCondominium.id,
    codigo: selectedCondominium.codigo,
    nome: selectedCondominium.nome,
    cnpj: selectedCondominium.cnpj,
    endereco: selectedCondominium.endereco,
    estruturaAmbientes: selectedCondominium.estruturaAmbientes,
    equipamentos: selectedCondominium.equipamentos,
  };
  const observations = {
    cliente: serviceDescription,
    resposta: "",
    interna: "",
  };
  const completedBy = {
    uid: currentSession.uid,
    nome: creatorName,
  };
  const employeeAssignment = employee
    ? {
        funcionarioId: employee.id,
        usuarioUid: text(employee.usuarioUid),
        codigo: text(employee.codigo),
        nome: text(employee.nome),
        cargo: text(employee.cargo),
        designadoEm: serverTimestamp(),
        designadoPorUid: currentSession.uid,
        designadoPorNome: creatorName,
      }
    : null;

  return {
    id,
    numero: number,
    codigo: code,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
    statusAtualizadoEm: serverTimestamp(),
    perfilCriador: "admin",
    criadoPorUid: currentSession.uid,
    criadoPorNome: creatorName,
    clienteUid: "",
    condominioId: selectedCondominium.id,
    clientesAutorizadosIds: [],
    visibilidadeCliente: false,
    tipoAtendimento: "servico",
    dataServico: serviceDate.value,
    horarioServico: serviceTime.value,
    categoriaPrincipal: "manutencao-geral",
    servicoPrincipal: title,
    titulo: title,
    descricao: serviceDescription,
    cliente: client,
    condominio: condominium,
    endereco: address,
    categorias: ["manutencao-geral"],
    servicos: services,
    atendimento: attendance,
    observacoes: observations,
    prioridade: "normal",
    status: "concluida",
    ativo: true,
    arquivado: false,
    fotos: photos,
    quantidadeFotos: photos.length,
    vistoria: null,
    valorSalvateck: value,
    valorSalvateckAtualizadoEm: serverTimestamp(),
    valorSalvateckAtualizadoPorUid: currentSession.uid,
    concluidaEm: serverTimestamp(),
    concluidaPorUid: currentSession.uid,
    concluidaPorNome: creatorName,
    ...(employeeAssignment
      ? {
          funcionarioResponsavelUid: employeeAssignment.usuarioUid,
          funcionarioResponsavel: employeeAssignment,
        }
      : {}),
    responsabilidadeTecnica: {
      ...technicalResponsibility,
      atualizadoPorUid: currentSession.uid,
      atualizadoEm: serverTimestamp(),
    },
    documentoFinal: {
      versao: 3,
      ordemId: id,
      codigo: code,
      numero: number,
      titulo: title,
      tipoAtendimento: "servico",
      status: "concluida",
      cliente: client,
      condominio: {
        id: condominium.id,
        codigo: condominium.codigo,
        nome: condominium.nome,
        cnpj: condominium.cnpj,
      },
      responsabilidadeTecnica: {
        ...technicalResponsibility,
      },
      vistoria: null,
      categorias: ["manutencao-geral"],
      servicos: services,
      endereco: address,
      atendimento: attendance,
      observacoes: {
        cliente: serviceDescription,
        resposta: "",
      },
      prioridade: "normal",
      criadaEm: serverTimestamp(),
      concluidaEm: serverTimestamp(),
      concluidaPor: completedBy,
    },
    notificacoes: {
      habilitadas: false,
      push: false,
      whatsapp: false,
      motivo: "os-rapida",
    },
    origem: {
      tipo: "os-rapida",
      ordemOrigemId: "",
      interno: true,
    },
  };
}

function buildFinancialData({ orderId, code, title }) {
  const isPaid = paymentStatus.value === "paid";
  const clientId = text(selectedClient?.id);

  return {
    id: `ordem-${orderId}`,
    codigo: `FIN-${code}`,
    tipo: "income",
    descricao: title,
    categoria: "servico",
    valor: currencyToNumber(orderValue.value),
    dataReferencia: serviceDate.value,
    competencia: serviceDate.value.slice(0, 7),
    clienteUid: clientId,
    condominioId: selectedCondominium.id,
    ordemId: orderId,
    cliente: {
      id: clientId,
      nome: text(clientName.value),
      email: text(clientEmail.value),
      telefone: text(clientPhone.value),
    },
    condominio: {
      id: selectedCondominium.id,
      codigo: selectedCondominium.codigo,
      nome: selectedCondominium.nome,
    },
    ordem: {
      id: orderId,
      codigo: code,
      titulo: title,
    },
    origem: "ordem",
    origemDetalhe: "os-rapida",
    observacoes: `Lançamento gerado automaticamente pela ${code}.`,
    status: isPaid ? "paid" : "pending",
    vencimento: "",
    pagamentoEm: isPaid ? serverTimestamp() : "",
    formaPagamento: isPaid ? paymentMethod.value : "",
    criadoEm: serverTimestamp(),
    criadoPorUid: currentSession.uid,
    atualizadoEm: serverTimestamp(),
    atualizadoPorUid: currentSession.uid,
  };
}

async function saveQuickOrder() {
  const counterReference = doc(db, "contadores", "ordens");
  const orderReference = doc(collection(db, "ordens"));
  const privateReference = doc(db, "ordensPrivadas", orderReference.id);
  const financialReference = doc(
    db,
    "financeiro",
    `ordem-${orderReference.id}`,
  );

  const uploadedPhotos = await uploadQuickOrderPhotos(orderReference.id);

  const photos = uploadedPhotos.map((photo) => photo.data);

  try {
    const savedOrder = await runTransaction(db, async (transaction) => {
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
        number: nextNumber,
        code,
        photos,
      });

      const financialData = buildFinancialData({
        orderId: orderReference.id,
        code,
        title: orderData.titulo,
      });

      transaction.update(counterReference, {
        ultimoNumero: nextNumber,
        ultimoDocumentoId: orderReference.id,
        atualizadoEm: serverTimestamp(),
      });

      transaction.set(orderReference, orderData);
      transaction.set(financialReference, financialData);

      if (text(internalNotes.value)) {
        transaction.set(privateReference, {
          ordemId: orderReference.id,
          codigo: code,
          observacaoInterna: text(internalNotes.value),
          origem: "os-rapida",
          atualizadoEm: serverTimestamp(),
        });
      }

      return {
        id: orderReference.id,
        numero: nextNumber,
        codigo: code,
      };
    });

    if (photos.length > 0) {
      setPhotoStatus({
        countText:
          photos.length === 1
            ? "1 imagem enviada"
            : `${photos.length} imagens enviadas`,
        processingText: "Imagens armazenadas e vinculadas à OS.",
        state: "is-success",
      });
    }

    return savedOrder;
  } catch (error) {
    if (uploadedPhotos.length > 0) {
      await deleteUploadedQuickOrderPhotos(uploadedPhotos);
    }

    throw error;
  }
}

function getErrorMessage(error) {
  if (error?.message === "ORDER_COUNTER_NOT_FOUND") {
    return "O contador das ordens não foi encontrado no Firebase.";
  }

  if (error?.message === "INVALID_ORDER_COUNTER") {
    return "O contador das ordens possui um valor inválido.";
  }

  if (error?.code === "permission-denied") {
    return "O Firebase bloqueou o registro. Confira as regras publicadas.";
  }

  if (error?.code === "unavailable") {
    return "Não foi possível acessar o Firebase. Verifique sua conexão.";
  }

  if (
    error?.code === "storage/unauthorized" ||
    error?.code === "storage/permission-denied"
  ) {
    return "O Firebase Storage bloqueou o envio das imagens.";
  }

  if (error?.code === "storage/retry-limit-exceeded") {
    return "O envio das imagens demorou demais. Tente novamente.";
  }

  return "Não foi possível registrar a OS Rápida. Tente novamente.";
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const originalButtonContent = saveButton.innerHTML;

  saveButton.disabled = true;
  saveButton.querySelector("span").textContent = "Registrando OS...";

  try {
    const savedOrder = await saveQuickOrder();

    successCode.textContent = savedOrder.codigo;

    const parameters = new URLSearchParams({
      perfil: "admin",
      id: savedOrder.id,
      ordem: savedOrder.id,
      origem: "ordens",
    });

    viewOrderLink.href = `detalhes-solicitacao.html?${parameters.toString()}`;

    form.hidden = true;
    successCard.hidden = false;
    successCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("[OS Rápida] Não foi possível salvar a ordem:", error);
    showFeedback(getErrorMessage(error), "error");
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = originalButtonContent;
  }
}

function resetQuickOrderForm() {
  form.reset();

  selectedCondominium = null;
  selectedClient = null;
  clearClientSelection();
  resetPhotoSelection();
  setDefaultDateTime();
  updatePaymentFields();

  condominiumSelect.value = "";
  employeeSelect.value = "";
  descriptionCount.textContent = "0";
  successCard.hidden = true;
  form.hidden = false;
  updateSummary();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

condominiumSelect.addEventListener("change", async () => {
  selectedCondominium = condominiums.find(
    (condominium) => condominium.id === condominiumSelect.value,
  );

  clearClientSelection();

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

orderValue.addEventListener("input", () => {
  const value = currencyToNumber(orderValue.value);

  orderValue.value = value > 0 ? formatCurrency(value) : "";
  updateSummary();
});

description.addEventListener("input", () => {
  descriptionCount.textContent = String(description.value.length);
});

paymentStatus.addEventListener("change", updatePaymentFields);
clientName.addEventListener("input", updateSummary);
serviceTitle.addEventListener("input", updateSummary);
photoInput.addEventListener("change", handlePhotoSelection);
form.addEventListener("submit", handleSubmit);
newQuickOrderButton.addEventListener("click", resetQuickOrderForm);

async function initializePage() {
  try {
    currentSession = await window.salvateckSessionReady;

    if (!currentSession || currentSession.role !== "admin") {
      return;
    }

    setDefaultDateTime();
    updatePaymentFields();
    updateSummary();

    await Promise.all([loadCondominiums(), loadEmployees()]);
  } catch (error) {
    console.error("[OS Rápida] Não foi possível iniciar a página:", error);
    showFeedback("Não foi possível iniciar a OS Rápida.", "error");
  }
}

initializePage();
