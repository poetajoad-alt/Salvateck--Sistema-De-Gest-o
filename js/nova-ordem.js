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
      "Vistoria do local",
      "Pequenos reparos",
      "Ajustar porta",
      "Ajustar janela",
      "Trocar fechadura",
      "Trocar maçaneta",
      "Reparo preventivo",
      "Outro serviço",
    ],
  },
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const body = document.body;

const form = document.getElementById("formNovaOrdem");

const profileButtons = document.querySelectorAll("[data-form-profile]");

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

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

const orderUrlParams = new URLSearchParams(window.location.search);

const orderProfileFromUrl = orderUrlParams.get("perfil");

let currentProfile =
  orderProfileFromUrl === "admin" || orderProfileFromUrl === "cliente"
    ? orderProfileFromUrl
    : body.dataset.profile || "cliente";

let clientEditing = false;

let selectedFiles = [];

const selectedServiceKeys = new Set();

const maxPhotos = 6;

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

function scrollToElement(element) {
  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
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

/* =========================================
   PERFIL CLIENTE OU ADMINISTRADOR
========================================= */

function changeProfile(profile) {
  if (profile !== "cliente" && profile !== "admin") {
    return;
  }

  currentProfile = profile;

  body.dataset.profile = profile;

  const currentUrl = new URL(window.location.href);

  currentUrl.searchParams.set("perfil", profile);

  window.history.replaceState({}, "", currentUrl);

  profileButtons.forEach((button) => {
    const active = button.dataset.formProfile === profile;

    button.classList.toggle("is-active", active);

    button.setAttribute("aria-pressed", String(active));
  });

  adminOnlyElements.forEach((element) => {
    element.hidden = profile !== "admin";
  });
  clientOnlyElements.forEach((element) => {
    element.hidden = profile !== "cliente";
  });

  if (profile === "admin") {
    btnSalvarOrdem.textContent = "Criar ordem de serviço";

    btnEditarDados.hidden = true;

    setClientFieldsEditable(true);
  } else {
    btnSalvarOrdem.textContent = "Enviar solicitação";

    btnEditarDados.hidden = false;

    setClientFieldsEditable(false);
  }

  updateClientSummary();
  updateSummary();
  updateProgress();
}

/* =========================================
   BUSCA E CADASTRO DE CLIENTE
========================================= */

function handleClientSearch() {
  const searchValue = buscarCliente.value.trim();

  if (!searchValue) {
    showFeedback("Digite o nome ou telefone do cliente.", "error");

    buscarCliente.focus();

    return;
  }

  showFeedback("A busca será conectada aos clientes cadastrados no Firebase.");
}

function handleQuickClientCreation() {
  nomeCliente.value = "";
  telefoneCliente.value = "";
  emailCliente.value = "";

  setClientFieldsEditable(true);

  updateClientSummary();
  updateSummary();
  updateProgress();

  showFeedback("Preencha os dados do novo cliente.");
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
    return "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP";
  }

  const street = ruaAtendimento.value.trim();

  const number = numeroAtendimento.value.trim();

  const complement = complementoAtendimento.value.trim();

  const neighborhood = bairroAtendimento.value.trim();

  const city = cidadeAtendimento.value.trim();

  const firstLine = [street, number, complement].filter(Boolean).join(", ");

  const secondLine = [neighborhood, city].filter(Boolean).join(" — ");

  const address = [firstLine, secondLine].filter(Boolean).join(" | ");

  return address || "Outro endereço ainda não preenchido";
}

function isAddressComplete() {
  if (getAddressMode() === "cadastrado") {
    return true;
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

function handleCategoryChange() {
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

  const requiresTime = selectedPeriod === "horario";

  specificTimeGroup.hidden = !requiresTime;

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
    isScheduleComplete(),
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

function buildOrderData() {
  const selectedCategories = getSelectedCategories();

  const selectedServices = Array.from(selectedServiceKeys).map((key) => ({
    categoria: getCategoryFromServiceKey(key),

    servico: getServiceFromServiceKey(key),
  }));

  return {
    criadoEm: new Date().toISOString(),

    perfilCriador: currentProfile,

    cliente: {
      nome: nomeCliente.value.trim(),

      telefone: telefoneCliente.value.trim(),

      email: emailCliente.value.trim(),
    },

    endereco: {
      tipo: getAddressMode(),

      enderecoCadastrado: getAddressMode() === "cadastrado",

      cep: cepAtendimento.value.trim(),

      rua: ruaAtendimento.value.trim(),

      numero: numeroAtendimento.value.trim(),

      complemento: complementoAtendimento.value.trim(),

      bairro: bairroAtendimento.value.trim(),

      cidade: cidadeAtendimento.value.trim(),
    },

    categorias: selectedCategories,

    servicos: selectedServices,

    atendimento: {
      dataPreferida: dataPreferida.value,

      periodo: getSelectedPeriod(),

      horarioPreferido: horarioPreferido.value,
    },

    observacoes: {
      cliente: observacaoCliente.value.trim(),

      resposta:
        document.getElementById("observacaoResposta")?.value.trim() || "",

      interna: document.getElementById("observacaoInterna")?.value.trim() || "",
    },

    status:
      currentProfile === "admin"
        ? document.getElementById("statusInicial")?.value || "nova-solicitacao"
        : "nova-solicitacao",

    quantidadeFotos: selectedFiles.length,
  };
}

/* =========================================
   ENVIO DO FORMULÁRIO
========================================= */

function handleSubmit(event) {
  event.preventDefault();

  updateSummary();
  updateProgress();

  if (!validateForm()) {
    showFeedback("Revise os campos obrigatórios antes de continuar.", "error");

    return;
  }

  const orderData = buildOrderData();

  console.log("Ordem de serviço preparada:", orderData);

  try {
    localStorage.setItem(
      "salvateckUltimaOrdemTeste",
      JSON.stringify(orderData),
    );
  } catch (error) {
    console.warn("Não foi possível salvar o teste localmente.", error);
  }

  btnSalvarOrdem.disabled = true;

  btnSalvarOrdem.textContent =
    currentProfile === "admin" ? "Ordem criada" : "Solicitação enviada";

  showFeedback(
    currentProfile === "admin"
      ? "Ordem de serviço criada com sucesso!"
      : "Solicitação enviada com sucesso!",
  );

  window.setTimeout(() => {
    window.location.href = `solicitacoes.html?perfil=${currentProfile}`;
  }, 1800);
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

profileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeProfile(button.dataset.formProfile);
  });
});

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

/* =========================================
   INICIALIZAÇÃO
========================================= */

setMinimumDate();

syncCategoryStyles();

toggleAddressMode();

renderServices();

toggleSpecificTime();

updateObservationCounter();

changeProfile(currentProfile);

updateSummary();

updateProgress();
