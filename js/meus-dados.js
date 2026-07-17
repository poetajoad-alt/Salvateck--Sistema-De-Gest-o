/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const PROFILE_STORAGE_KEY = "salvateckPerfilClienteTemporario";

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
   VARIÁVEIS DE CONTROLE
========================================= */

let editingProfile = false;

let profileSnapshot = null;

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

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function showFeedback(message) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;
  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3000);
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

/* =========================================
   OBTENÇÃO E APLICAÇÃO DOS DADOS
========================================= */

function getFormData() {
  return {
    fullName: normalizarTexto(fullNameInput.value),

    email: normalizarTexto(emailInput.value),

    phone: normalizarTexto(phoneInput.value),

    preferredContact: preferredContactInput.value,

    preferredPeriod: preferredPeriodInput.value,

    statusNotifications: statusNotificationsInput.checked,

    scheduleNotifications: scheduleNotificationsInput.checked,

    postalCode: normalizarTexto(postalCodeInput.value),

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
   ARMAZENAMENTO LOCAL TEMPORÁRIO
========================================= */

function loadSavedProfile() {
  try {
    const savedData = JSON.parse(
      localStorage.getItem(PROFILE_STORAGE_KEY) || "null",
    );

    if (savedData) {
      applyFormData(savedData);
    }
  } catch (error) {
    console.warn(
      "Não foi possível carregar os dados temporários do perfil.",
      error,
    );
  }
}

function saveProfileLocally(data) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));

    return true;
  } catch (error) {
    console.warn(
      "Não foi possível salvar os dados temporários do perfil.",
      error,
    );

    return false;
  }
}

/* =========================================
   RESUMO E COMPLETUDE DO CADASTRO
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

  const completedFields = fields.filter(
    (value) => normalizarTexto(value).length > 0,
  ).length;

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
   CONTROLE DO MODO DE EDIÇÃO
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
  profileSnapshot = getFormData();

  clearAllErrors();

  setEditingMode(true);
}

function cancelProfileEditing() {
  if (profileSnapshot) {
    applyFormData(profileSnapshot);
  }

  clearAllErrors();

  setEditingMode(false);

  showFeedback("As alterações foram canceladas.");
}

/* =========================================
   MENSAGENS DE VALIDAÇÃO
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

/* =========================================
   VALIDAÇÃO
========================================= */

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
      throw new Error("Falha na consulta do CEP.");
    }

    const addressData = await response.json();

    if (addressData.erro) {
      throw new Error("CEP não encontrado.");
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
    console.warn("Não foi possível consultar o CEP.", error);

    showFeedback(
      "Não foi possível localizar o CEP. Preencha o endereço manualmente.",
    );
  } finally {
    searchPostalCodeButton.disabled = !editingProfile;

    searchPostalCodeButton.textContent = originalLabel;
  }
}

/* =========================================
   SALVAMENTO DO PERFIL
========================================= */

function setSavingState(active) {
  saveProfileButton.disabled = active;

  cancelEditButton.disabled = active;

  saveButtonLabel.hidden = active;

  saveButtonLoading.hidden = !active;
}

async function saveProfile(event) {
  event.preventDefault();

  if (!editingProfile) {
    return;
  }

  if (!validateProfileForm()) {
    return;
  }

  setSavingState(true);

  await wait(700);

  const profileData = getFormData();

  const wasSaved = saveProfileLocally(profileData);

  setSavingState(false);

  if (!wasSaved) {
    showFeedback("Não foi possível salvar os dados.");

    return;
  }

  profileSnapshot = profileData;

  applyFormData(profileData);

  setEditingMode(false);

  showFeedback("Dados atualizados com sucesso.");
}

/* =========================================
   ALTERAÇÃO DE SENHA
========================================= */

function requestPasswordReset() {
  const email = normalizarTexto(emailInput.value);

  if (!email) {
    showFeedback("Nenhum e-mail está cadastrado.");

    return;
  }

  showFeedback(
    `A alteração de senha será enviada para ${email} após a integração com o Firebase.`,
  );
}

/* =========================================
   MÁSCARAS E EVENTOS DOS CAMPOS
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

loadSavedProfile();

phoneInput.value = formatPhone(phoneInput.value);

postalCodeInput.value = formatPostalCode(postalCodeInput.value);

updateProfileSummary();

setEditingMode(false);
