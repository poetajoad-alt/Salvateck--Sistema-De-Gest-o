import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js";

const functions = getFunctions(auth.app, "southamerica-east1");

const criarAcessoFuncionarioCallable = httpsCallable(
  functions,
  "criarAcessoFuncionario",
);

/* =========================================================
   SALVATECK
   Funcionários
========================================================= */

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const specialtyLabels = {
  hidraulica: "Hidráulica",
  eletrica: "Elétrica",
  pintura: "Pintura",
  alvenaria: "Alvenaria",
  instalacoes: "Instalações",
  "manutencao-geral": "Manutenção geral",
  vistoria: "Vistoria técnica",
};

const availabilityLabels = {
  disponivel: "Disponível",
  "em-atendimento": "Em atendimento",
  indisponivel: "Indisponível",
};

/* =========================================================
   ESTADO
========================================================= */

let currentSession = null;

let employees = [];

let filteredEmployees = [];

let editingEmployeeId = null;

let detailsEmployeeId = null;

let feedbackTimer = null;

let pageInitialized = false;

/* =========================================================
   ELEMENTOS
========================================================= */

const newEmployeeButton = document.getElementById("new-employee-button");

const emptyNewEmployeeButton = document.getElementById(
  "empty-new-employee-button",
);

const employeeSearch = document.getElementById("employee-search");

const employeeStatusFilter = document.getElementById("employee-status-filter");

const employeeAvailabilityFilter = document.getElementById(
  "employee-availability-filter",
);

const summaryTotalEmployees = document.getElementById(
  "summary-total-employees",
);

const summaryActiveEmployees = document.getElementById(
  "summary-active-employees",
);

const summaryInactiveEmployees = document.getElementById(
  "summary-inactive-employees",
);

const summaryWithoutAccess = document.getElementById("summary-without-access");

const employeesCount = document.getElementById("employees-count");

const employeesLoading = document.getElementById("employees-loading");

const employeesList = document.getElementById("employees-list");

const employeesEmpty = document.getElementById("employees-empty");

const employeesEmptyTitle = document.getElementById("employees-empty-title");

const employeesEmptyDescription = document.getElementById(
  "employees-empty-description",
);

const employeeCardTemplate = document.getElementById("employee-card-template");

/* =========================================================
   MODAL DE CADASTRO / EDIÇÃO
========================================================= */

const employeeModal = document.getElementById("employee-modal");

const closeEmployeeModalButton = document.getElementById(
  "close-employee-modal-button",
);

const cancelEmployeeButton = document.getElementById("cancel-employee-button");

const employeeModalEyebrow = document.getElementById("employee-modal-eyebrow");

const employeeModalTitle = document.getElementById("employee-modal-title");

const employeeForm = document.getElementById("employee-form");

const employeeId = document.getElementById("employee-id");

const employeeName = document.getElementById("employee-name");

const employeePhone = document.getElementById("employee-phone");

const employeeEmail = document.getElementById("employee-email");

const employeeRole = document.getElementById("employee-role");

const employeeAdmissionDate = document.getElementById(
  "employee-admission-date",
);

const employeeStatus = document.getElementById("employee-status");

const employeeAvailability = document.getElementById("employee-availability");

const employeeNotes = document.getElementById("employee-notes");

const saveEmployeeButton = document.getElementById("save-employee-button");

const employeeSpecialtyInputs = Array.from(
  document.querySelectorAll('input[name="employeeSpecialty"]'),
);

/* =========================================================
   MODAL DE DETALHES
========================================================= */

const employeeDetailsModal = document.getElementById("employee-details-modal");

const closeEmployeeDetailsButton = document.getElementById(
  "close-employee-details-button",
);

const employeeDetailsInitials = document.getElementById(
  "employee-details-initials",
);

const employeeDetailsCode = document.getElementById("employee-details-code");

const employeeDetailsName = document.getElementById("employee-details-name");

const employeeDetailsRole = document.getElementById("employee-details-role");

const employeeDetailsStatus = document.getElementById(
  "employee-details-status",
);

const employeeDetailsAvailability = document.getElementById(
  "employee-details-availability",
);

const employeeDetailsPhone = document.getElementById("employee-details-phone");

const employeeDetailsEmail = document.getElementById("employee-details-email");

const employeeDetailsAdmission = document.getElementById(
  "employee-details-admission",
);

const employeeDetailsAccess = document.getElementById(
  "employee-details-access",
);

const employeeDetailsSpecialties = document.getElementById(
  "employee-details-specialties",
);

const employeeDetailsNotes = document.getElementById("employee-details-notes");

const editEmployeeFromDetailsButton = document.getElementById(
  "edit-employee-from-details-button",
);

/* =========================================================
   FEEDBACK
========================================================= */

const employeesFeedback = document.getElementById("employees-feedback");

/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getEmployeeInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "ST";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatPhone(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDate(value) {
  if (!value) {
    return "Não informada";
  }

  const parts = String(value).split("-");

  if (parts.length !== 3) {
    return value;
  }

  const [year, month, day] = parts;

  return `${day}/${month}/${year}`;
}

function getAvailabilityLabel(value) {
  return availabilityLabels[value] || "Disponível";
}

function getSpecialtyLabel(value) {
  return specialtyLabels[value] || value;
}

function showFeedback(message, isError = false) {
  window.clearTimeout(feedbackTimer);

  employeesFeedback.textContent = message;

  employeesFeedback.classList.toggle("is-error", isError);

  employeesFeedback.hidden = false;

  feedbackTimer = window.setTimeout(() => {
    employeesFeedback.hidden = true;

    employeesFeedback.classList.remove("is-error");
  }, 3600);
}

function getEmployeeById(id) {
  return employees.find((employee) => employee.documentId === id) || null;
}

function getSelectedSpecialties() {
  return employeeSpecialtyInputs
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function getNextEmployeeCode() {
  const highestNumber = employees.reduce((highest, employee) => {
    const match = String(employee.codigo || "").match(/^FUNC-(\d+)$/i);

    if (!match) {
      return highest;
    }

    const number = Number(match[1]);

    return Number.isFinite(number) ? Math.max(highest, number) : highest;
  }, 0);

  return `FUNC-${String(highestNumber + 1).padStart(4, "0")}`;
}

/* =========================================================
   NORMALIZAÇÃO DO FIRESTORE
========================================================= */

function normalizeEmployee(snapshot) {
  const employee = snapshot.data();

  const validAvailability = [
    "disponivel",
    "em-atendimento",
    "indisponivel",
  ].includes(employee.disponibilidade)
    ? employee.disponibilidade
    : "disponivel";

  return {
    documentId: snapshot.id,

    id: employee.id || snapshot.id,

    codigo:
      String(employee.codigo || "").trim() ||
      `FUNC-${snapshot.id.slice(0, 6).toUpperCase()}`,

    nome: String(employee.nome || "").trim(),

    telefone: String(employee.telefone || "").trim(),

    email: String(employee.email || "").trim(),

    cargo: String(employee.cargo || "").trim(),

    dataAdmissao: String(employee.dataAdmissao || "").trim(),

    status: employee.status === "inativo" ? "inativo" : "ativo",

    disponibilidade: validAvailability,

    especialidades: Array.isArray(employee.especialidades)
      ? employee.especialidades
          .map((specialty) => String(specialty || "").trim())
          .filter(Boolean)
      : [],

    observacoes: String(employee.observacoes || "").trim(),

    acessoConfigurado:
      employee.acessoConfigurado === true ||
      Boolean(String(employee.usuarioUid || "").trim()),

    usuarioUid: String(employee.usuarioUid || "").trim(),

    criadoEm: employee.criadoEm || null,

    atualizadoEm: employee.atualizadoEm || null,
  };
}

/* =========================================================
   CARREGAMENTO
========================================================= */

async function loadEmployees() {
  employeesLoading.hidden = false;

  employeesList.hidden = true;

  employeesEmpty.hidden = true;

  try {
    const snapshot = await getDocs(collection(db, "funcionarios"));

    employees = snapshot.docs
      .map(normalizeEmployee)
      .sort((employeeA, employeeB) =>
        employeeA.nome.localeCompare(employeeB.nome, "pt-BR", {
          sensitivity: "base",
        }),
      );

    updateSummary();

    applyFilters();
  } catch (error) {
    console.error(
      "[Funcionários] Não foi possível carregar os funcionários:",
      error,
    );

    employees = [];

    filteredEmployees = [];

    updateSummary();

    employeesLoading.hidden = true;

    employeesList.hidden = true;

    employeesEmpty.hidden = false;

    employeesEmptyTitle.textContent = "Não foi possível carregar a equipe";

    employeesEmptyDescription.textContent =
      error?.code === "permission-denied"
        ? "O Firebase bloqueou o acesso à coleção de funcionários."
        : "Ocorreu um erro ao carregar os funcionários. Atualize a página e tente novamente.";

    showFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou o acesso aos funcionários."
        : "Não foi possível carregar os funcionários.",
      true,
    );
  }
}

/* =========================================================
   RESUMO
========================================================= */

function updateSummary() {
  const total = employees.length;

  const active = employees.filter(
    (employee) => employee.status === "ativo",
  ).length;

  const inactive = employees.filter(
    (employee) => employee.status === "inativo",
  ).length;

  const withoutAccess = employees.filter(
    (employee) => !employee.acessoConfigurado,
  ).length;

  summaryTotalEmployees.textContent = String(total);

  summaryActiveEmployees.textContent = String(active);

  summaryInactiveEmployees.textContent = String(inactive);

  summaryWithoutAccess.textContent = String(withoutAccess);
}

/* =========================================================
   FILTROS
========================================================= */

function applyFilters() {
  const search = normalizeText(employeeSearch.value);

  const status = employeeStatusFilter.value;

  const availability = employeeAvailabilityFilter.value;

  filteredEmployees = employees.filter((employee) => {
    if (status && employee.status !== status) {
      return false;
    }

    if (availability && employee.disponibilidade !== availability) {
      return false;
    }

    if (!search) {
      return true;
    }

    const specialties = employee.especialidades
      .map(getSpecialtyLabel)
      .join(" ");

    const searchableContent = normalizeText(
      [
        employee.codigo,
        employee.nome,
        employee.cargo,
        employee.telefone,
        employee.email,
        specialties,
      ].join(" "),
    );

    return searchableContent.includes(search);
  });

  renderEmployees();
}

/* =========================================================
   CONTADOR
========================================================= */

function updateEmployeesCount() {
  const total = filteredEmployees.length;

  employeesCount.textContent =
    total === 1 ? "1 funcionário" : `${total} funcionários`;
}

/* =========================================================
   TAGS
========================================================= */

function createSpecialtyTag(specialty) {
  const tag = document.createElement("span");

  tag.className = "employee-specialty-tag";

  tag.textContent = getSpecialtyLabel(specialty);

  return tag;
}

function renderSpecialtyTags(container, specialties) {
  container.replaceChildren();

  if (!specialties.length) {
    const tag = document.createElement("span");

    tag.className = "employee-specialty-tag";

    tag.textContent = "Sem especialidades";

    container.append(tag);

    return;
  }

  specialties.forEach((specialty) => {
    container.append(createSpecialtyTag(specialty));
  });
}

/* =========================================================
   ACESSO AO SISTEMA
========================================================= */

function getEmployeeAccessErrorMessage(error) {
  const code = String(error?.code || "");

  if (code === "functions/permission-denied") {
    return "Apenas administradores podem criar acessos.";
  }

  if (code === "functions/unauthenticated") {
    return "Sua sessão expirou. Entre novamente no sistema.";
  }

  if (code === "functions/already-exists") {
    return error?.message || "Este funcionário ou e-mail já possui acesso.";
  }

  if (code === "functions/failed-precondition") {
    return error?.message || "O cadastro do funcionário precisa ser revisado.";
  }

  if (code === "functions/not-found") {
    return "O funcionário não foi encontrado.";
  }

  if (code === "auth/user-not-found") {
    return "Não existe uma conta de acesso vinculada a este e-mail.";
  }

  if (code === "auth/invalid-email") {
    return "O e-mail do funcionário é inválido.";
  }

  if (code === "auth/too-many-requests") {
    return "Muitas tentativas foram realizadas. Aguarde alguns minutos.";
  }

  return error?.message || "Não foi possível concluir a operação de acesso.";
}

async function sendEmployeeAccessEmail(employee) {
  if (!employee.email) {
    throw new Error("O funcionário não possui e-mail cadastrado.");
  }

  auth.languageCode = "pt-BR";

  await sendPasswordResetEmail(auth, employee.email);
}

async function handleEmployeeAccess(employeeDocumentId, button) {
  const employee = getEmployeeById(employeeDocumentId);

  if (!employee) {
    showFeedback("Funcionário não encontrado.", true);

    return;
  }

  if (employee.status !== "ativo") {
    showFeedback(
      "Ative o funcionário antes de criar ou reenviar o acesso.",
      true,
    );

    return;
  }

  if (!employee.email) {
    showFeedback(
      "Cadastre um e-mail para este funcionário antes de criar o acesso.",
      true,
    );

    return;
  }

  const alreadyConfigured = employee.acessoConfigurado;

  const confirmationMessage = alreadyConfigured
    ? `Reenviar o e-mail de acesso para ${employee.nome}?\n\n${employee.email}`
    : `Criar acesso ao sistema para ${employee.nome}?\n\n${employee.email}\n\nO funcionário receberá um e-mail para definir a própria senha.`;

  if (!window.confirm(confirmationMessage)) {
    return;
  }

  const originalButtonText = button.textContent;

  button.disabled = true;

  button.textContent = alreadyConfigured ? "Enviando..." : "Criando acesso...";

  let accessCreated = false;

  try {
    if (!alreadyConfigured) {
      await criarAcessoFuncionarioCallable({
        funcionarioId: employee.documentId,
      });

      accessCreated = true;
    }

    try {
      await sendEmployeeAccessEmail(employee);
    } catch (emailError) {
      console.error(
        "[Funcionários] Não foi possível enviar o e-mail de acesso:",
        emailError,
      );

      if (accessCreated) {
        await loadEmployees();

        showFeedback(
          "O acesso foi criado, mas não foi possível enviar o e-mail de definição de senha.",
          true,
        );

        return;
      }

      throw emailError;
    }

    if (accessCreated) {
      await loadEmployees();

      showFeedback(
        "Acesso criado e e-mail de definição de senha enviado com sucesso.",
      );

      return;
    }

    showFeedback("E-mail de acesso reenviado com sucesso.");
  } catch (error) {
    console.error(
      "[Funcionários] Não foi possível configurar o acesso:",
      error,
    );

    if (error?.code === "functions/already-exists") {
      await loadEmployees();
    }

    showFeedback(getEmployeeAccessErrorMessage(error), true);
  } finally {
    if (button.isConnected) {
      button.disabled = false;

      button.textContent = originalButtonText;
    }
  }
}

/* =========================================================
   CARD
========================================================= */

function createEmployeeCard(employee) {
  const fragment = employeeCardTemplate.content.cloneNode(true);

  const card = fragment.querySelector(".employee-card");

  const initials = fragment.querySelector(".employee-avatar__initials");

  const code = fragment.querySelector(".employee-card__code");

  const name = fragment.querySelector(".employee-card__name");

  const role = fragment.querySelector(".employee-card__role");

  const status = fragment.querySelector(".employee-status");

  const specialties = fragment.querySelector(".employee-card__specialties");

  const phone = fragment.querySelector(".employee-card__phone");

  const email = fragment.querySelector(".employee-card__email");

  const availability = fragment.querySelector(".employee-card__availability");

  const accessStatus = fragment.querySelector(".employee-access-status");

  const accessStatusText = fragment.querySelector(
    ".employee-access-status__text",
  );

  const detailsButton = fragment.querySelector(
    '[data-employee-action="details"]',
  );

  const editButton = fragment.querySelector('[data-employee-action="edit"]');

  const actions = fragment.querySelector(".employee-card__actions");

  const accessButton = document.createElement("button");

  accessButton.type = "button";

  accessButton.className = employee.acessoConfigurado
    ? "employee-card__action employee-card__action--secondary"
    : "employee-card__action employee-card__action--primary";

  accessButton.textContent = employee.acessoConfigurado
    ? "Reenviar acesso"
    : "Criar acesso";

  actions.append(accessButton);

  card.dataset.employeeId = employee.documentId;

  initials.textContent = getEmployeeInitials(employee.nome);

  code.textContent = employee.codigo;

  name.textContent = employee.nome || "Funcionário";

  role.textContent = employee.cargo || "Cargo não informado";

  status.textContent = employee.status === "ativo" ? "Ativo" : "Inativo";

  status.classList.toggle("is-inactive", employee.status === "inativo");

  renderSpecialtyTags(specialties, employee.especialidades);

  phone.textContent = employee.telefone || "Não informado";

  email.textContent = employee.email || "Não informado";

  availability.textContent = getAvailabilityLabel(employee.disponibilidade);

  accessStatus.classList.toggle("has-access", employee.acessoConfigurado);

  accessStatusText.textContent = employee.acessoConfigurado
    ? "Acesso ao sistema configurado"
    : "Sem acesso ao sistema";

  detailsButton.addEventListener("click", () => {
    openEmployeeDetails(employee.documentId);
  });

  editButton.addEventListener("click", () => {
    openEmployeeModal(employee.documentId);
  });

  accessButton.addEventListener("click", () => {
    handleEmployeeAccess(employee.documentId, accessButton);
  });

  return fragment;
}

/* =========================================================
   RENDERIZAÇÃO DA LISTA
========================================================= */

function renderEmployees() {
  employeesLoading.hidden = true;

  updateEmployeesCount();

  employeesList.replaceChildren();

  if (!employees.length) {
    employeesList.hidden = true;

    employeesEmpty.hidden = false;

    employeesEmptyTitle.textContent = "Sua equipe começa aqui";

    employeesEmptyDescription.textContent =
      "Cadastre o primeiro funcionário para começar a organizar a operação da Salvateck.";

    emptyNewEmployeeButton.hidden = false;

    return;
  }

  if (!filteredEmployees.length) {
    employeesList.hidden = true;

    employeesEmpty.hidden = false;

    employeesEmptyTitle.textContent = "Nenhum funcionário encontrado";

    employeesEmptyDescription.textContent =
      "Não encontramos funcionários com os filtros selecionados. Ajuste a busca ou os filtros para visualizar outros resultados.";

    emptyNewEmployeeButton.hidden = true;

    return;
  }

  employeesEmpty.hidden = true;

  employeesList.hidden = false;

  filteredEmployees.forEach((employee) => {
    employeesList.append(createEmployeeCard(employee));
  });
}

/* =========================================================
   ERROS DO FORMULÁRIO
========================================================= */

function getFieldContainer(field) {
  return field.closest(".employee-form-field");
}

function clearFieldError(field) {
  const container = getFieldContainer(field);

  if (!container) {
    return;
  }

  container.classList.remove("has-error");

  const error = container.querySelector(".employee-form-field__error");

  if (error) {
    error.textContent = "";
  }
}

function setFieldError(field, message) {
  const container = getFieldContainer(field);

  if (!container) {
    return;
  }

  container.classList.add("has-error");

  const error = container.querySelector(".employee-form-field__error");

  if (error) {
    error.textContent = message;
  }
}

function clearFormErrors() {
  [
    employeeName,
    employeePhone,
    employeeEmail,
    employeeRole,
    employeeAdmissionDate,
    employeeStatus,
    employeeAvailability,
    employeeNotes,
  ].forEach(clearFieldError);
}

/* =========================================================
   VALIDAÇÃO
========================================================= */

function validateEmployeeForm() {
  clearFormErrors();

  let valid = true;

  const name = employeeName.value.trim();

  const phoneDigits = employeePhone.value.replace(/\D/g, "");

  const email = employeeEmail.value.trim();

  const role = employeeRole.value.trim();

  if (name.length < 3) {
    setFieldError(employeeName, "Informe o nome completo do funcionário.");

    valid = false;
  }

  if (phoneDigits.length < 10) {
    setFieldError(employeePhone, "Informe um telefone válido com DDD.");

    valid = false;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError(employeeEmail, "Informe um endereço de e-mail válido.");

    valid = false;
  }

  if (role.length < 2) {
    setFieldError(employeeRole, "Informe o cargo ou função do funcionário.");

    valid = false;
  }

  if (!["ativo", "inativo"].includes(employeeStatus.value)) {
    setFieldError(employeeStatus, "Selecione um status válido.");

    valid = false;
  }

  if (
    !["disponivel", "em-atendimento", "indisponivel"].includes(
      employeeAvailability.value,
    )
  ) {
    setFieldError(
      employeeAvailability,
      "Selecione uma disponibilidade válida.",
    );

    valid = false;
  }

  return valid;
}

/* =========================================================
   ABERTURA DO MODAL
========================================================= */

function openEmployeeModal(employeeDocumentId = null) {
  editingEmployeeId = employeeDocumentId;

  employeeForm.reset();

  clearFormErrors();

  employeeSpecialtyInputs.forEach((input) => {
    input.checked = false;
  });

  employeeId.value = "";

  employeeStatus.value = "ativo";

  employeeAvailability.value = "disponivel";

  if (employeeDocumentId) {
    const employee = getEmployeeById(employeeDocumentId);

    if (!employee) {
      return;
    }

    employeeModalEyebrow.textContent = "Editar cadastro";

    employeeModalTitle.textContent = "Editar funcionário";

    saveEmployeeButton.textContent = "Atualizar funcionário";

    employeeId.value = employee.documentId;

    employeeName.value = employee.nome;

    employeePhone.value = employee.telefone;

    employeeEmail.value = employee.email;

    employeeRole.value = employee.cargo;

    employeeAdmissionDate.value = employee.dataAdmissao;

    employeeStatus.value = employee.status;

    employeeAvailability.value = employee.disponibilidade;

    employeeNotes.value = employee.observacoes;

    employeeSpecialtyInputs.forEach((input) => {
      input.checked = employee.especialidades.includes(input.value);
    });
  } else {
    employeeModalEyebrow.textContent = "Novo cadastro";

    employeeModalTitle.textContent = "Cadastrar funcionário";

    saveEmployeeButton.textContent = "Salvar funcionário";
  }

  employeeModal.hidden = false;

  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    employeeName.focus();
  }, 50);
}

/* =========================================================
   FECHAMENTO DO MODAL
========================================================= */

function closeEmployeeModal() {
  employeeModal.hidden = true;

  editingEmployeeId = null;

  employeeForm.reset();

  clearFormErrors();

  employeeSpecialtyInputs.forEach((input) => {
    input.checked = false;
  });

  saveEmployeeButton.disabled = false;

  document.body.classList.remove("modal-open");
}

/* =========================================================
   SALVAMENTO
========================================================= */

async function saveEmployee(event) {
  event.preventDefault();

  if (!currentSession || currentSession.role !== "admin") {
    showFeedback("Apenas administradores podem cadastrar funcionários.", true);

    return;
  }

  if (!validateEmployeeForm()) {
    showFeedback("Revise os campos destacados.", true);

    return;
  }

  const existingEmployee = getEmployeeById(editingEmployeeId);

  const originalButtonText = saveEmployeeButton.textContent;

  saveEmployeeButton.disabled = true;

  saveEmployeeButton.textContent = existingEmployee
    ? "Atualizando..."
    : "Salvando...";

  const data = {
    nome: employeeName.value.trim(),

    telefone: formatPhone(employeePhone.value),

    email: employeeEmail.value.trim().toLowerCase(),

    cargo: employeeRole.value.trim(),

    dataAdmissao: employeeAdmissionDate.value,

    status: employeeStatus.value,

    ativo: employeeStatus.value === "ativo",

    disponibilidade: employeeAvailability.value,

    especialidades: getSelectedSpecialties(),

    observacoes: employeeNotes.value.trim(),

    atualizadoEm: serverTimestamp(),

    atualizadoPorUid: currentSession.uid,
  };

  try {
    if (existingEmployee) {
      await updateDoc(
        doc(db, "funcionarios", existingEmployee.documentId),
        data,
      );
    } else {
      const employeeReference = doc(collection(db, "funcionarios"));

      await setDoc(employeeReference, {
        ...data,

        id: employeeReference.id,

        codigo: getNextEmployeeCode(),

        acessoConfigurado: false,

        usuarioUid: "",

        criadoEm: serverTimestamp(),

        criadoPorUid: currentSession.uid,
      });
    }

    await loadEmployees();

    closeEmployeeModal();

    showFeedback(
      existingEmployee
        ? "Funcionário atualizado com sucesso."
        : "Funcionário cadastrado com sucesso.",
    );
  } catch (error) {
    console.error(
      "[Funcionários] Não foi possível salvar o funcionário:",
      error,
    );

    showFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a gravação do funcionário."
        : "Não foi possível salvar o funcionário.",
      true,
    );
  } finally {
    saveEmployeeButton.disabled = false;

    saveEmployeeButton.textContent = existingEmployee
      ? "Atualizar funcionário"
      : originalButtonText;
  }
}

/* =========================================================
   DETALHES
========================================================= */

function openEmployeeDetails(employeeDocumentId) {
  const employee = getEmployeeById(employeeDocumentId);

  if (!employee) {
    return;
  }

  detailsEmployeeId = employee.documentId;

  employeeDetailsInitials.textContent = getEmployeeInitials(employee.nome);

  employeeDetailsCode.textContent = employee.codigo;

  employeeDetailsName.textContent = employee.nome || "Funcionário";

  employeeDetailsRole.textContent = employee.cargo || "Cargo não informado";

  employeeDetailsStatus.textContent =
    employee.status === "ativo" ? "Ativo" : "Inativo";

  employeeDetailsStatus.classList.toggle(
    "is-inactive",
    employee.status === "inativo",
  );

  employeeDetailsAvailability.textContent = getAvailabilityLabel(
    employee.disponibilidade,
  );

  employeeDetailsAvailability.classList.toggle(
    "is-busy",
    employee.disponibilidade === "em-atendimento",
  );

  employeeDetailsAvailability.classList.toggle(
    "is-unavailable",
    employee.disponibilidade === "indisponivel",
  );

  employeeDetailsPhone.textContent = employee.telefone || "Não informado";

  employeeDetailsEmail.textContent = employee.email || "Não informado";

  employeeDetailsAdmission.textContent = formatDate(employee.dataAdmissao);

  employeeDetailsAccess.textContent = employee.acessoConfigurado
    ? "Acesso configurado"
    : "Não configurado";

  renderSpecialtyTags(employeeDetailsSpecialties, employee.especialidades);

  employeeDetailsNotes.textContent =
    employee.observacoes || "Nenhuma observação registrada.";

  employeeDetailsModal.hidden = false;

  document.body.classList.add("modal-open");
}

function closeEmployeeDetails() {
  employeeDetailsModal.hidden = true;

  detailsEmployeeId = null;

  document.body.classList.remove("modal-open");
}

/* =========================================================
   EVENTOS DOS FILTROS
========================================================= */

employeeSearch.addEventListener("input", applyFilters);

employeeStatusFilter.addEventListener("change", applyFilters);

employeeAvailabilityFilter.addEventListener("change", applyFilters);

/* =========================================================
   TELEFONE
========================================================= */

employeePhone.addEventListener("input", () => {
  employeePhone.value = formatPhone(employeePhone.value);

  clearFieldError(employeePhone);
});

/* =========================================================
   LIMPEZA DE ERROS
========================================================= */

[
  employeeName,
  employeeEmail,
  employeeRole,
  employeeAdmissionDate,
  employeeStatus,
  employeeAvailability,
  employeeNotes,
].forEach((field) => {
  field.addEventListener("input", () => {
    clearFieldError(field);
  });

  field.addEventListener("change", () => {
    clearFieldError(field);
  });
});

/* =========================================================
   BOTÕES DE CADASTRO
========================================================= */

newEmployeeButton.addEventListener("click", () => {
  openEmployeeModal();
});

emptyNewEmployeeButton.addEventListener("click", () => {
  openEmployeeModal();
});

/* =========================================================
   MODAL DE CADASTRO
========================================================= */

closeEmployeeModalButton.addEventListener("click", closeEmployeeModal);

cancelEmployeeButton.addEventListener("click", closeEmployeeModal);

employeeForm.addEventListener("submit", saveEmployee);

employeeModal.addEventListener("click", (event) => {
  if (event.target === employeeModal) {
    closeEmployeeModal();
  }
});

/* =========================================================
   MODAL DE DETALHES
========================================================= */

closeEmployeeDetailsButton.addEventListener("click", closeEmployeeDetails);

employeeDetailsModal.addEventListener("click", (event) => {
  if (event.target === employeeDetailsModal) {
    closeEmployeeDetails();
  }
});

editEmployeeFromDetailsButton.addEventListener("click", () => {
  const employeeDocumentId = detailsEmployeeId;

  closeEmployeeDetails();

  if (employeeDocumentId) {
    openEmployeeModal(employeeDocumentId);
  }
});

/* =========================================================
   TECLA ESC
========================================================= */

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!employeeModal.hidden) {
    closeEmployeeModal();

    return;
  }

  if (!employeeDetailsModal.hidden) {
    closeEmployeeDetails();
  }
});

/* =========================================================
   SESSÃO
========================================================= */

async function initializePage(user) {
  if (pageInitialized) {
    return;
  }

  try {
    const userReference = doc(db, "usuarios", user.uid);

    const userSnapshot = await getDoc(userReference);

    if (!userSnapshot.exists()) {
      return;
    }

    const userData = userSnapshot.data();

    const role = String(userData.role || "")
      .trim()
      .toLowerCase();

    if (userData.ativo !== true || role !== "admin") {
      return;
    }

    currentSession = {
      uid: user.uid,

      email: user.email || "",

      role,

      nome: String(userData.nome || "").trim(),
    };

    pageInitialized = true;

    await loadEmployees();
  } catch (error) {
    console.error(
      "[Funcionários] Não foi possível inicializar a página:",
      error,
    );

    employeesLoading.hidden = true;

    employeesEmpty.hidden = false;

    employeesEmptyTitle.textContent = "Não foi possível abrir Funcionários";

    employeesEmptyDescription.textContent =
      "Ocorreu um erro ao validar o acesso e carregar a equipe.";

    showFeedback("Não foi possível inicializar a área de funcionários.", true);
  }
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    return;
  }

  await initializePage(user);
});
