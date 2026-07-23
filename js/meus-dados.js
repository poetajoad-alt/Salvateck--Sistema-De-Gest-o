import "./auth-guard.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { auth, db } from "./firebase-config.js";

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const profileForm = document.getElementById("profile-form");

const editProfileButton = document.getElementById("edit-profile-button");

const formActions = document.getElementById("form-actions");

const cancelEditButton = document.getElementById("cancel-edit-button");

const saveProfileButton = document.getElementById("save-profile-button");

const saveButtonLabel = saveProfileButton.querySelector(".button-label");

const saveButtonLoading = saveProfileButton.querySelector(".button-loading");

const searchPostalCodeButton = document.getElementById(
  "search-postal-code-button",
);

const passwordResetButton = document.getElementById("password-reset-button");

const profileAvatar = document.getElementById("profile-avatar");

const profileSummaryName = document.getElementById("profile-summary-name");

const profileSummaryEmail = document.getElementById("profile-summary-email");

const profileCompletionValue = document.getElementById(
  "profile-completion-value",
);

const profileProgress = document.querySelector(".profile-progress");

const profileProgressBar = document.getElementById("profile-progress-bar");

const profileCompletionMessage = document.getElementById(
  "profile-completion-message",
);

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   CAMPOS DO FORMULÁRIO
========================================= */

const fullNameInput = document.getElementById("full-name");

const emailInput = document.getElementById("email");

const phoneInput = document.getElementById("phone");

const preferredContactInput = document.getElementById("preferred-contact");

const preferredPeriodInput = document.getElementById("preferred-period");

const statusNotificationsInput = document.getElementById(
  "status-notifications",
);

const scheduleNotificationsInput = document.getElementById(
  "schedule-notifications",
);

const postalCodeInput = document.getElementById("postal-code");

const stateInput = document.getElementById("state");

const streetInput = document.getElementById("street");

const addressNumberInput = document.getElementById("address-number");

const addressComplementInput = document.getElementById("address-complement");

const districtInput = document.getElementById("district");

const cityInput = document.getElementById("city");

const addressReferenceInput = document.getElementById("address-reference");

const serviceNotesInput = document.getElementById("service-notes");

const formControls = profileForm.querySelectorAll("input, select, textarea");

/* =========================================
   ESTADOS BRASILEIROS
========================================= */

const brazilianStates = [
  ["AC", "Acre"],
  ["AL", "Alagoas"],
  ["AP", "Amapá"],
  ["AM", "Amazonas"],
  ["BA", "Bahia"],
  ["CE", "Ceará"],
  ["DF", "Distrito Federal"],
  ["ES", "Espírito Santo"],
  ["GO", "Goiás"],
  ["MA", "Maranhão"],
  ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"],
  ["PA", "Pará"],
  ["PB", "Paraíba"],
  ["PR", "Paraná"],
  ["PE", "Pernambuco"],
  ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"],
  ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"],
  ["RR", "Roraima"],
  ["SC", "Santa Catarina"],
  ["SP", "São Paulo"],
  ["SE", "Sergipe"],
  ["TO", "Tocantins"],
];

/* =========================================
   CONTROLE
========================================= */

let currentSession = null;

let profileReference = null;

let profileSnapshot = null;

let editingProfile = false;

let savingProfile = false;

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarTexto(valor) {
  return String(valor || "").trim();
}

function showFeedback(message) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;

  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3500);
}

function formatPhone(value) {
  const digits = somenteNumeros(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatPostalCode(value) {
  const digits = somenteNumeros(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function getInitials(name) {
  const parts = normalizarTexto(name).split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "--";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function populateStateOptions() {
  const currentValue = stateInput.value;

  stateInput.innerHTML = `
    <option value="">
      Selecione
    </option>
  `;

  brazilianStates.forEach(([code, name]) => {
    const option = document.createElement("option");

    option.value = code;

    option.textContent = name;

    stateInput.appendChild(option);
  });

  stateInput.value = currentValue;
}

/* =========================================
   NORMALIZAÇÃO DO PERFIL
========================================= */

function normalizeProfileData(profile = {}) {
  const address = profile.endereco || {};

  const contactPreferences = profile.preferenciasContato || {};

  const notifications = profile.notificacoes || {};

  const sessionProfile = currentSession?.profile || {};

  const sessionUser = currentSession?.user || {};

  return {
    fullName: normalizarTexto(
      profile.nome || sessionProfile.nome || sessionUser.displayName || "",
    ),

    email: normalizarTexto(
      profile.email ||
        sessionProfile.email ||
        currentSession?.email ||
        sessionUser.email ||
        auth.currentUser?.email ||
        "",
    ),

    phone: normalizarTexto(profile.telefone || sessionProfile.telefone || ""),

    preferredContact: contactPreferences.canal || "whatsapp",

    preferredPeriod: contactPreferences.periodo || "qualquer",

    statusNotifications: notifications.atualizacoesStatus !== false,

    scheduleNotifications: notifications.lembretesAtendimento !== false,

    postalCode: normalizarTexto(address.cep || ""),

    state: normalizarTexto(address.estado || address.uf || ""),

    street: normalizarTexto(address.rua || address.logradouro || ""),

    addressNumber: normalizarTexto(address.numero || ""),

    addressComplement: normalizarTexto(address.complemento || ""),

    district: normalizarTexto(address.bairro || ""),

    city: normalizarTexto(address.cidade || ""),

    addressReference: normalizarTexto(
      address.referencia || address.pontoReferencia || "",
    ),

    serviceNotes: normalizarTexto(profile.observacoesAtendimento || ""),
  };
}

/* =========================================
   LEITURA E APLICAÇÃO DOS CAMPOS
========================================= */

function getFormData() {
  return {
    fullName: normalizarTexto(fullNameInput.value),

    email: normalizarTexto(emailInput.value),

    phone: formatPhone(phoneInput.value),

    preferredContact: preferredContactInput.value,

    preferredPeriod: preferredPeriodInput.value,

    statusNotifications: statusNotificationsInput.checked,

    scheduleNotifications: scheduleNotificationsInput.checked,

    postalCode: formatPostalCode(postalCodeInput.value),

    state: stateInput.value,

    street: normalizarTexto(streetInput.value),

    addressNumber: normalizarTexto(addressNumberInput.value),

    addressComplement: normalizarTexto(addressComplementInput.value),

    district: normalizarTexto(districtInput.value),

    city: normalizarTexto(cityInput.value),

    addressReference: normalizarTexto(addressReferenceInput.value),

    serviceNotes: normalizarTexto(serviceNotesInput.value),
  };
}

function applyFormData(data) {
  if (!data) {
    return;
  }

  fullNameInput.value = data.fullName || "";

  emailInput.value = data.email || "";

  phoneInput.value = formatPhone(data.phone || "");

  preferredContactInput.value = data.preferredContact || "whatsapp";

  preferredPeriodInput.value = data.preferredPeriod || "qualquer";

  statusNotificationsInput.checked = data.statusNotifications !== false;

  scheduleNotificationsInput.checked = data.scheduleNotifications !== false;

  postalCodeInput.value = formatPostalCode(data.postalCode || "");

  stateInput.value = data.state || "";

  streetInput.value = data.street || "";

  addressNumberInput.value = data.addressNumber || "";

  addressComplementInput.value = data.addressComplement || "";

  districtInput.value = data.district || "";

  cityInput.value = data.city || "";

  addressReferenceInput.value = data.addressReference || "";

  serviceNotesInput.value = data.serviceNotes || "";

  updateProfileSummary();
}

/* =========================================
   RESUMO E COMPLETUDE
========================================= */

function calculateProfileCompletion() {
  const fields = [
    fullNameInput.value,
    phoneInput.value,
    postalCodeInput.value,
    stateInput.value,
    streetInput.value,
    addressNumberInput.value,
    districtInput.value,
    cityInput.value,
  ];

  const completedFields = fields.filter((value) => {
    return normalizarTexto(value).length > 0;
  }).length;

  return Math.round((completedFields / fields.length) * 100);
}

function updateProfileSummary() {
  const name = normalizarTexto(fullNameInput.value) || "Cliente Salvateck";

  const email = normalizarTexto(emailInput.value) || "E-mail não informado";

  const completion = calculateProfileCompletion();

  profileAvatar.textContent = getInitials(name);

  profileSummaryName.textContent = name;

  profileSummaryEmail.textContent = email;

  profileCompletionValue.textContent = `${completion}%`;

  profileProgressBar.style.width = `${completion}%`;

  profileProgress.setAttribute("aria-valuenow", String(completion));

  if (completion === 100) {
    profileCompletionMessage.textContent =
      "Seus dados principais estão completos.";

    return;
  }

  if (completion >= 75) {
    profileCompletionMessage.textContent =
      "Faltam poucas informações para completar seu cadastro.";

    return;
  }

  profileCompletionMessage.textContent =
    "Complete seus dados para facilitar os atendimentos.";
}

/* =========================================
   CONTROLE DE EDIÇÃO
========================================= */

function setEditingMode(active) {
  editingProfile = active;

  formControls.forEach((control) => {
    if (control === emailInput) {
      control.disabled = true;

      return;
    }

    control.disabled = !active;
  });

  searchPostalCodeButton.disabled = !active;

  formActions.hidden = !active;

  editProfileButton.hidden = active;

  document.body.classList.toggle("profile-editing", active);

  if (active) {
    fullNameInput.focus();
  }
}

function startEditingProfile() {
  if (savingProfile) {
    return;
  }

  profileSnapshot = getFormData();

  clearAllErrors();

  setEditingMode(true);
}

function cancelProfileEditing() {
  if (savingProfile) {
    return;
  }

  if (profileSnapshot) {
    applyFormData(profileSnapshot);
  }

  clearAllErrors();

  setEditingMode(false);

  showFeedback("As alterações foram canceladas.");
}

/* =========================================
   VALIDAÇÃO VISUAL
========================================= */

function getFieldContainer(input) {
  return input.closest(".form-field");
}

function clearFieldError(input) {
  const field = getFieldContainer(input);

  if (!field) {
    return;
  }

  const errorElement = field.querySelector(".form-field__error");

  field.classList.remove("has-error");

  input.removeAttribute("aria-invalid");

  if (errorElement) {
    errorElement.textContent = "";
  }
}

function setFieldError(input, message) {
  const field = getFieldContainer(input);

  if (!field) {
    return;
  }

  const errorElement = field.querySelector(".form-field__error");

  field.classList.add("has-error");

  input.setAttribute("aria-invalid", "true");

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearAllErrors() {
  profileForm.querySelectorAll(".form-field").forEach((field) => {
    field.classList.remove("has-error");
  });

  profileForm.querySelectorAll("[aria-invalid='true']").forEach((input) => {
    input.removeAttribute("aria-invalid");
  });

  profileForm.querySelectorAll(".form-field__error").forEach((error) => {
    error.textContent = "";
  });
}

function validateProfileForm() {
  clearAllErrors();

  const invalidFields = [];

  const fullName = normalizarTexto(fullNameInput.value);

  if (fullName.length < 3 || fullName.split(/\s+/).length < 2) {
    setFieldError(fullNameInput, "Informe seu nome completo.");

    invalidFields.push(fullNameInput);
  }

  const phoneDigits = somenteNumeros(phoneInput.value);

  if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
    setFieldError(phoneInput, "Informe um telefone válido com DDD.");

    invalidFields.push(phoneInput);
  }

  const postalCodeDigits = somenteNumeros(postalCodeInput.value);

  if (postalCodeDigits.length !== 8) {
    setFieldError(postalCodeInput, "Informe um CEP válido.");

    invalidFields.push(postalCodeInput);
  }

  if (!stateInput.value) {
    setFieldError(stateInput, "Selecione o estado.");

    invalidFields.push(stateInput);
  }

  if (normalizarTexto(streetInput.value).length < 3) {
    setFieldError(streetInput, "Informe a rua ou avenida.");

    invalidFields.push(streetInput);
  }

  if (!normalizarTexto(addressNumberInput.value)) {
    setFieldError(addressNumberInput, "Informe o número do endereço.");

    invalidFields.push(addressNumberInput);
  }

  if (normalizarTexto(districtInput.value).length < 2) {
    setFieldError(districtInput, "Informe o bairro.");

    invalidFields.push(districtInput);
  }

  if (normalizarTexto(cityInput.value).length < 2) {
    setFieldError(cityInput, "Informe a cidade.");

    invalidFields.push(cityInput);
  }

  if (invalidFields.length > 0) {
    invalidFields[0].focus();

    showFeedback("Revise os campos destacados.");

    return false;
  }

  return true;
}

/* =========================================
   CONSULTA DE CEP
========================================= */

async function searchPostalCode() {
  if (!editingProfile) {
    return;
  }

  const postalCode = somenteNumeros(postalCodeInput.value);

  clearFieldError(postalCodeInput);

  if (postalCode.length !== 8) {
    setFieldError(postalCodeInput, "Informe os oito números do CEP.");

    postalCodeInput.focus();

    return;
  }

  const originalLabel = searchPostalCodeButton.textContent;

  searchPostalCodeButton.disabled = true;

  searchPostalCodeButton.textContent = "Buscando...";

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${postalCode}/json/`,
    );

    if (!response.ok) {
      throw new Error("POSTAL_CODE_REQUEST_FAILED");
    }

    const addressData = await response.json();

    if (addressData.erro) {
      throw new Error("POSTAL_CODE_NOT_FOUND");
    }

    streetInput.value = addressData.logradouro || streetInput.value;

    districtInput.value = addressData.bairro || districtInput.value;

    cityInput.value = addressData.localidade || cityInput.value;

    stateInput.value = addressData.uf || stateInput.value;

    clearFieldError(streetInput);
    clearFieldError(districtInput);
    clearFieldError(cityInput);
    clearFieldError(stateInput);

    updateProfileSummary();

    if (!addressNumberInput.value) {
      addressNumberInput.focus();
    }

    showFeedback("Endereço localizado pelo CEP.");
  } catch (error) {
    console.warn("[Meus Dados] Não foi possível consultar o CEP:", error);

    showFeedback(
      "Não foi possível localizar o CEP. Preencha o endereço manualmente.",
    );
  } finally {
    searchPostalCodeButton.disabled = !editingProfile;

    searchPostalCodeButton.textContent = originalLabel;
  }
}

/* =========================================
   FIRESTORE
========================================= */

function buildProfileUpdate(data) {
  return {
    nome: data.fullName,

    telefone: data.phone,

    endereco: {
      cep: data.postalCode,

      rua: data.street,

      numero: data.addressNumber,

      complemento: data.addressComplement,

      bairro: data.district,

      cidade: data.city,

      estado: data.state,

      referencia: data.addressReference,
    },

    preferenciasContato: {
      canal: data.preferredContact,

      periodo: data.preferredPeriod,
    },

    notificacoes: {
      atualizacoesStatus: data.statusNotifications,

      lembretesAtendimento: data.scheduleNotifications,
    },

    observacoesAtendimento: data.serviceNotes,

    atualizadoEm: serverTimestamp(),
  };
}

async function loadProfile() {
  const snapshot = await getDoc(profileReference);

  if (!snapshot.exists()) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const profile = snapshot.data();

  if (profile.role !== "cliente" || profile.ativo !== true) {
    throw new Error("PROFILE_ACCESS_DENIED");
  }

  const normalizedData = normalizeProfileData(profile);

  profileSnapshot = normalizedData;

  applyFormData(normalizedData);
}

/* =========================================
   SALVAMENTO
========================================= */

function setSavingState(active) {
  savingProfile = active;

  saveProfileButton.disabled = active;

  cancelEditButton.disabled = active;

  saveButtonLabel.hidden = active;

  saveButtonLoading.hidden = !active;
}

function handleSaveError(error) {
  console.error("[Meus Dados] Não foi possível atualizar o perfil:", error);

  if (error.code === "permission-denied") {
    showFeedback(
      "O Firebase bloqueou a atualização. Confira se as regras foram publicadas.",
    );

    return;
  }

  if (error.code === "unavailable") {
    showFeedback("Não foi possível acessar o Firebase. Verifique sua conexão.");

    return;
  }

  showFeedback("Não foi possível salvar seus dados.");
}

async function saveProfile(event) {
  event.preventDefault();

  if (!editingProfile || savingProfile || !profileReference) {
    return;
  }

  if (!validateProfileForm()) {
    return;
  }

  setSavingState(true);

  try {
    const profileData = getFormData();

    const profileUpdate = buildProfileUpdate(profileData);

    await updateDoc(profileReference, profileUpdate);

    profileSnapshot = profileData;

    currentSession.profile = {
      ...(currentSession.profile || {}),

      nome: profileData.fullName,

      telefone: profileData.phone,

      endereco: {
        cep: profileData.postalCode,

        rua: profileData.street,

        numero: profileData.addressNumber,

        complemento: profileData.addressComplement,

        bairro: profileData.district,

        cidade: profileData.city,

        estado: profileData.state,

        referencia: profileData.addressReference,
      },

      preferenciasContato: {
        canal: profileData.preferredContact,

        periodo: profileData.preferredPeriod,
      },

      notificacoes: {
        atualizacoesStatus: profileData.statusNotifications,

        lembretesAtendimento: profileData.scheduleNotifications,
      },

      observacoesAtendimento: profileData.serviceNotes,
    };

    applyFormData(profileData);

    setEditingMode(false);

    showFeedback("Dados atualizados com sucesso.");
  } catch (error) {
    handleSaveError(error);
  } finally {
    setSavingState(false);
  }
}

/* =========================================
   ALTERAÇÃO DE SENHA
========================================= */

async function requestPasswordReset() {
  const email = normalizarTexto(emailInput.value);

  if (!email) {
    showFeedback("Nenhum e-mail está cadastrado.");

    return;
  }

  const originalText = passwordResetButton.textContent;

  passwordResetButton.disabled = true;

  passwordResetButton.textContent = "Enviando...";

  try {
    auth.languageCode = "pt-BR";

    await sendPasswordResetEmail(auth, email);

    showFeedback(`Enviamos o link de alteração de senha para ${email}.`);
  } catch (error) {
    console.error(
      "[Meus Dados] Não foi possível enviar o link de senha:",
      error,
    );

    if (error.code === "auth/invalid-email") {
      showFeedback("O e-mail cadastrado é inválido.");

      return;
    }

    if (error.code === "auth/too-many-requests") {
      showFeedback(
        "Muitas solicitações foram realizadas. Aguarde alguns minutos.",
      );

      return;
    }

    if (error.code === "auth/network-request-failed") {
      showFeedback("Não foi possível enviar o e-mail. Verifique sua conexão.");

      return;
    }

    showFeedback("Não foi possível enviar o link de alteração de senha.");
  } finally {
    passwordResetButton.disabled = false;

    passwordResetButton.textContent = originalText;
  }
}

/* =========================================
   EVENTOS DOS CAMPOS
========================================= */

phoneInput.addEventListener("input", () => {
  phoneInput.value = formatPhone(phoneInput.value);

  clearFieldError(phoneInput);

  updateProfileSummary();
});

postalCodeInput.addEventListener("input", () => {
  postalCodeInput.value = formatPostalCode(postalCodeInput.value);

  clearFieldError(postalCodeInput);

  updateProfileSummary();
});

fullNameInput.addEventListener("input", () => {
  clearFieldError(fullNameInput);

  updateProfileSummary();
});

[stateInput, streetInput, addressNumberInput, districtInput, cityInput].forEach(
  (input) => {
    input.addEventListener("input", () => {
      clearFieldError(input);

      updateProfileSummary();
    });

    input.addEventListener("change", () => {
      clearFieldError(input);

      updateProfileSummary();
    });
  },
);

/* =========================================
   EVENTOS PRINCIPAIS
========================================= */

editProfileButton.addEventListener("click", startEditingProfile);

cancelEditButton.addEventListener("click", cancelProfileEditing);

profileForm.addEventListener("submit", saveProfile);

searchPostalCodeButton.addEventListener("click", searchPostalCode);

passwordResetButton.addEventListener("click", requestPasswordReset);

/* =========================================
   TECLADO
========================================= */

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editingProfile) {
    cancelProfileEditing();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function initializePage() {
  try {
    populateStateOptions();

    currentSession = await window.salvateckSessionReady;

    if (!currentSession || currentSession.role !== "cliente") {
      throw new Error("PROFILE_ACCESS_DENIED");
    }

    profileReference = doc(db, "usuarios", currentSession.uid);

    /*
      Remove os dados antigos que eram salvos
      somente neste navegador.
    */
    localStorage.removeItem("salvateckPerfilClienteTemporario");

    applyFormData(normalizeProfileData(currentSession.profile || {}));

    await loadProfile();

    setEditingMode(false);
  } catch (error) {
    console.error("[Meus Dados] Não foi possível carregar o perfil:", error);

    if (error.message === "PROFILE_NOT_FOUND") {
      window.alert("Seu perfil não foi encontrado no sistema.");
    } else if (
      error.message === "PROFILE_ACCESS_DENIED" ||
      error.code === "permission-denied"
    ) {
      window.alert("Você não possui permissão para acessar esta página.");
    } else {
      window.alert("Não foi possível carregar seus dados.");
    }

    window.location.replace("principal.html");
  }
}

initializePage();
