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
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  deleteObject,
  getBlob,
  getStorage,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js";

const functions = getFunctions(auth.app, "southamerica-east1");

const criarAcessoFuncionarioCallable = httpsCallable(
  functions,
  "criarAcessoFuncionario",
);

const storage = getStorage(auth.app);

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

const contractTypeLabels = {
  clt: "CLT",
  pj: "PJ",
  autonomo: "Autônomo",
  contrato: "Contrato",
  outro: "Outro",
};

const paymentPeriodicityLabels = {
  mensal: "Mensal",
  quinzenal: "Quinzenal",
  semanal: "Semanal",
  diaria: "Diária",
  "por-servico": "Por serviço",
};

const paymentMethodLabels = {
  pix: "Pix",
  transferencia: "Transferência bancária",
  deposito: "Depósito",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

const bankAccountTypeLabels = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  pagamento: "Conta de pagamento",
};

const privateDocumentCategoryLabels = {
  identificacao: "Identificação",
  contrato: "Contrato",
  certificados: "Certificados e NRs",
  outros: "Outros documentos",
};

const maxPrivateDocumentSize = 10 * 1024 * 1024;

const maxPrivateDocumentsPerEmployee = 30;

const acceptedPrivateDocumentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const acceptedPrivateDocumentExtensions = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

/* =========================================================
   ESTADO
========================================================= */

let currentSession = null;

let employees = [];

let filteredEmployees = [];

let editingEmployeeId = null;

let detailsEmployeeId = null;

let privateEmployeeId = null;

let editingPrivateEmployeeData = null;

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

const employeeCpf = document.getElementById("employee-cpf");

const employeeRg = document.getElementById("employee-rg");

const employeeBirthDate = document.getElementById("employee-birth-date");

const employeeCnh = document.getElementById("employee-cnh");

const employeeCnhExpiration = document.getElementById(
  "employee-cnh-expiration",
);

const employeeAddressZip = document.getElementById("employee-address-zip");

const employeeAddressStreet = document.getElementById(
  "employee-address-street",
);

const employeeAddressNumber = document.getElementById(
  "employee-address-number",
);

const employeeAddressComplement = document.getElementById(
  "employee-address-complement",
);

const employeeAddressNeighborhood = document.getElementById(
  "employee-address-neighborhood",
);

const employeeAddressCity = document.getElementById("employee-address-city");

const employeeAddressState = document.getElementById("employee-address-state");

const employeeEmergencyName = document.getElementById(
  "employee-emergency-name",
);

const employeeEmergencyRelation = document.getElementById(
  "employee-emergency-relation",
);

const employeeEmergencyPhone = document.getElementById(
  "employee-emergency-phone",
);

const employeeContractType = document.getElementById("employee-contract-type");

const employeePaymentValue = document.getElementById("employee-payment-value");

const employeePaymentPeriodicity = document.getElementById(
  "employee-payment-periodicity",
);

const employeePaymentMethod = document.getElementById(
  "employee-payment-method",
);

const employeeBank = document.getElementById("employee-bank");

const employeeBankAgency = document.getElementById("employee-bank-agency");

const employeeBankAccount = document.getElementById("employee-bank-account");

const employeeBankAccountType = document.getElementById(
  "employee-bank-account-type",
);

const employeePixKey = document.getElementById("employee-pix-key");

const employeeDocumentIdentification = document.getElementById(
  "employee-document-identification",
);

const employeeDocumentContract = document.getElementById(
  "employee-document-contract",
);

const employeeDocumentCertificates = document.getElementById(
  "employee-document-certificates",
);

const employeeDocumentOther = document.getElementById(
  "employee-document-other",
);

const employeePrivateDocumentsCurrent = document.getElementById(
  "employee-private-documents-current",
);

const employeePrivateDocumentsList = document.getElementById(
  "employee-private-documents-list",
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

const openEmployeePrivateButton = document.getElementById(
  "open-employee-private-button",
);

/* =========================================================
   MODAL CONFIDENCIAL
========================================================= */

const employeePrivateModal = document.getElementById("employee-private-modal");

const closeEmployeePrivateModalButton = document.getElementById(
  "close-employee-private-modal-button",
);

const employeePrivateCode = document.getElementById("employee-private-code");

const employeePrivateName = document.getElementById("employee-private-name");

const employeePrivateCpf = document.getElementById("employee-private-cpf");

const employeePrivateRg = document.getElementById("employee-private-rg");

const employeePrivateBirthDate = document.getElementById(
  "employee-private-birth-date",
);

const employeePrivateCnh = document.getElementById("employee-private-cnh");

const employeePrivateCnhExpiration = document.getElementById(
  "employee-private-cnh-expiration",
);

const employeePrivateAddress = document.getElementById(
  "employee-private-address",
);

const employeePrivateEmergency = document.getElementById(
  "employee-private-emergency",
);

const employeePrivateContractType = document.getElementById(
  "employee-private-contract-type",
);

const employeePrivatePaymentValue = document.getElementById(
  "employee-private-payment-value",
);

const employeePrivatePaymentPeriodicity = document.getElementById(
  "employee-private-payment-periodicity",
);

const employeePrivatePaymentMethod = document.getElementById(
  "employee-private-payment-method",
);

const employeePrivateBank = document.getElementById("employee-private-bank");

const employeePrivateBankAgency = document.getElementById(
  "employee-private-bank-agency",
);

const employeePrivateBankAccount = document.getElementById(
  "employee-private-bank-account",
);

const employeePrivateBankAccountType = document.getElementById(
  "employee-private-bank-account-type",
);

const employeePrivatePixKey = document.getElementById(
  "employee-private-pix-key",
);

const employeePrivateFiles = document.getElementById("employee-private-files");

const employeePrivateFilesEmpty = document.getElementById(
  "employee-private-files-empty",
);

const editEmployeeFromPrivateButton = document.getElementById(
  "edit-employee-from-private-button",
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

function formatCpf(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9)}`;
}

function formatZipCode(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Não informado";
  }

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getFileExtension(fileName) {
  const parts = String(fileName || "")
    .trim()
    .toLowerCase()
    .split(".");

  return parts.length > 1 ? parts.pop() : "";
}

function sanitizePrivateFileName(fileName) {
  const normalizedName = String(fileName || "documento")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalizedName || "documento";
}

function createPrivateDocumentId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPrivateDocumentCategoryLabel(value) {
  return privateDocumentCategoryLabels[value] || "Documento";
}

function getContractTypeLabel(value) {
  return contractTypeLabels[value] || "Não informado";
}

function getPaymentPeriodicityLabel(value) {
  return paymentPeriodicityLabels[value] || "Não informada";
}

function getPaymentMethodLabel(value) {
  return paymentMethodLabels[value] || "Não informada";
}

function getBankAccountTypeLabel(value) {
  return bankAccountTypeLabels[value] || "Não informado";
}

function buildPrivateAddress(data) {
  const address = data?.endereco || {};

  const firstLine = [
    String(address.logradouro || "").trim(),
    String(address.numero || "").trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const secondLine = [
    String(address.complemento || "").trim(),
    String(address.bairro || "").trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  const cityState = [
    String(address.cidade || "").trim(),
    String(address.estado || "")
      .trim()
      .toUpperCase(),
  ]
    .filter(Boolean)
    .join(" - ");

  const zipCode = String(address.cep || "").trim();

  return [firstLine, secondLine, cityState, zipCode]
    .filter(Boolean)
    .join(" · ");
}

function buildEmergencyContact(data) {
  const emergency = data?.contatoEmergencia || {};

  const identification = [
    String(emergency.nome || "").trim(),
    String(emergency.relacao || "").trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  const phone = String(emergency.telefone || "").trim();

  return [identification, phone].filter(Boolean).join(" · ");
}

function getPrivateDocumentInputs() {
  return [
    {
      category: "identificacao",
      input: employeeDocumentIdentification,
    },
    {
      category: "contrato",
      input: employeeDocumentContract,
    },
    {
      category: "certificados",
      input: employeeDocumentCertificates,
    },
    {
      category: "outros",
      input: employeeDocumentOther,
    },
  ];
}

function getPendingPrivateDocuments() {
  return getPrivateDocumentInputs().flatMap(({ category, input }) =>
    Array.from(input.files || []).map((file) => ({
      category,
      file,
    })),
  );
}

function validatePrivateDocuments(existingDocuments = []) {
  const pendingDocuments = getPendingPrivateDocuments();

  if (
    existingDocuments.length + pendingDocuments.length >
    maxPrivateDocumentsPerEmployee
  ) {
    throw new Error(
      `Cada funcionário pode possuir no máximo ${maxPrivateDocumentsPerEmployee} documentos privados.`,
    );
  }

  pendingDocuments.forEach(({ file }) => {
    const extension = getFileExtension(file.name);

    if (
      !acceptedPrivateDocumentTypes.has(file.type) &&
      !acceptedPrivateDocumentExtensions.has(extension)
    ) {
      throw new Error(
        `O arquivo "${file.name}" possui um formato não permitido.`,
      );
    }

    if (file.size > maxPrivateDocumentSize) {
      throw new Error(`O arquivo "${file.name}" ultrapassa o limite de 10 MB.`);
    }
  });

  return pendingDocuments;
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

function normalizePrivateEmployee(snapshot) {
  if (!snapshot?.exists()) {
    return {
      funcionarioId: snapshot?.id || "",
      cpf: "",
      rg: "",
      dataNascimento: "",
      cnh: "",
      cnhValidade: "",
      endereco: {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      },
      contatoEmergencia: {
        nome: "",
        relacao: "",
        telefone: "",
      },
      contrato: {
        tipo: "",
      },
      pagamento: {
        valor: null,
        periodicidade: "",
        forma: "",
      },
      dadosBancarios: {
        banco: "",
        agencia: "",
        conta: "",
        tipoConta: "",
        chavePix: "",
      },
      documentos: [],
      criadoEm: null,
      atualizadoEm: null,
    };
  }

  const data = snapshot.data();

  const address = data.endereco || {};

  const emergency = data.contatoEmergencia || {};

  const contract = data.contrato || {};

  const payment = data.pagamento || {};

  const bank = data.dadosBancarios || {};

  return {
    funcionarioId: snapshot.id,

    cpf: String(data.cpf || "").trim(),

    rg: String(data.rg || "").trim(),

    dataNascimento: String(data.dataNascimento || "").trim(),

    cnh: String(data.cnh || "").trim(),

    cnhValidade: String(data.cnhValidade || "").trim(),

    endereco: {
      cep: String(address.cep || "").trim(),
      logradouro: String(address.logradouro || "").trim(),
      numero: String(address.numero || "").trim(),
      complemento: String(address.complemento || "").trim(),
      bairro: String(address.bairro || "").trim(),
      cidade: String(address.cidade || "").trim(),
      estado: String(address.estado || "")
        .trim()
        .toUpperCase(),
    },

    contatoEmergencia: {
      nome: String(emergency.nome || "").trim(),
      relacao: String(emergency.relacao || "").trim(),
      telefone: String(emergency.telefone || "").trim(),
    },

    contrato: {
      tipo: String(contract.tipo || "").trim(),
    },

    pagamento: {
      valor: Number.isFinite(Number(payment.valor))
        ? Number(payment.valor)
        : null,
      periodicidade: String(payment.periodicidade || "").trim(),
      forma: String(payment.forma || "").trim(),
    },

    dadosBancarios: {
      banco: String(bank.banco || "").trim(),
      agencia: String(bank.agencia || "").trim(),
      conta: String(bank.conta || "").trim(),
      tipoConta: String(bank.tipoConta || "").trim(),
      chavePix: String(bank.chavePix || "").trim(),
    },

    documentos: Array.isArray(data.documentos)
      ? data.documentos
          .map((document) => ({
            id: String(document?.id || "").trim(),
            categoria: String(document?.categoria || "").trim(),
            nome: String(document?.nome || "").trim(),
            caminho: String(document?.caminho || "").trim(),
            tipo: String(document?.tipo || "").trim(),
            tamanho: Number(document?.tamanho || 0),
            enviadoEm: String(document?.enviadoEm || "").trim(),
          }))
          .filter((document) => document.id && document.caminho)
      : [],

    criadoEm: data.criadoEm || null,

    atualizadoEm: data.atualizadoEm || null,
  };
}

async function loadPrivateEmployeeData(employeeDocumentId) {
  if (!employeeDocumentId) {
    return normalizePrivateEmployee(null);
  }

  if (!currentSession || currentSession.role !== "admin") {
    throw new Error("PRIVATE_EMPLOYEE_ACCESS_DENIED");
  }

  const privateReference = doc(db, "funcionariosPrivados", employeeDocumentId);

  const snapshot = await getDoc(privateReference);

  return normalizePrivateEmployee(snapshot);
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
   DADOS PRIVADOS DO FORMULÁRIO
========================================================= */

function getPrivateEmployeeFormData() {
  const paymentValueText = String(employeePaymentValue.value || "").trim();

  const paymentValue = paymentValueText
    ? Number(paymentValueText.replace(",", "."))
    : null;

  return {
    cpf: formatCpf(employeeCpf.value),

    rg: employeeRg.value.trim(),

    dataNascimento: employeeBirthDate.value,

    cnh: employeeCnh.value.trim(),

    cnhValidade: employeeCnhExpiration.value,

    endereco: {
      cep: formatZipCode(employeeAddressZip.value),
      logradouro: employeeAddressStreet.value.trim(),
      numero: employeeAddressNumber.value.trim(),
      complemento: employeeAddressComplement.value.trim(),
      bairro: employeeAddressNeighborhood.value.trim(),
      cidade: employeeAddressCity.value.trim(),
      estado: employeeAddressState.value.trim().toUpperCase().slice(0, 2),
    },

    contatoEmergencia: {
      nome: employeeEmergencyName.value.trim(),
      relacao: employeeEmergencyRelation.value.trim(),
      telefone: formatPhone(employeeEmergencyPhone.value),
    },

    contrato: {
      tipo: employeeContractType.value,
    },

    pagamento: {
      valor:
        paymentValue === null || !Number.isFinite(paymentValue)
          ? null
          : Math.max(0, paymentValue),
      periodicidade: employeePaymentPeriodicity.value,
      forma: employeePaymentMethod.value,
    },

    dadosBancarios: {
      banco: employeeBank.value.trim(),
      agencia: employeeBankAgency.value.trim(),
      conta: employeeBankAccount.value.trim(),
      tipoConta: employeeBankAccountType.value,
      chavePix: employeePixKey.value.trim(),
    },
  };
}

function renderCurrentPrivateDocuments(documents = []) {
  employeePrivateDocumentsList.replaceChildren();

  if (!documents.length) {
    employeePrivateDocumentsCurrent.hidden = true;

    return;
  }

  employeePrivateDocumentsCurrent.hidden = false;

  documents.forEach((privateDocument) => {
    const wrapper = document.createElement("div");

    wrapper.className = "employee-private-document-current";

    const copy = document.createElement("div");

    const category = document.createElement("span");

    category.textContent = getPrivateDocumentCategoryLabel(
      privateDocument.categoria,
    );

    const name = document.createElement("strong");

    name.textContent = privateDocument.nome || "Documento";

    copy.append(category, name);

    wrapper.append(copy);

    employeePrivateDocumentsList.append(wrapper);
  });
}

function applyPrivateEmployeeToForm(privateData) {
  employeeCpf.value = formatCpf(privateData.cpf);

  employeeRg.value = privateData.rg;

  employeeBirthDate.value = privateData.dataNascimento;

  employeeCnh.value = privateData.cnh;

  employeeCnhExpiration.value = privateData.cnhValidade;

  employeeAddressZip.value = formatZipCode(privateData.endereco.cep);

  employeeAddressStreet.value = privateData.endereco.logradouro;

  employeeAddressNumber.value = privateData.endereco.numero;

  employeeAddressComplement.value = privateData.endereco.complemento;

  employeeAddressNeighborhood.value = privateData.endereco.bairro;

  employeeAddressCity.value = privateData.endereco.cidade;

  employeeAddressState.value = privateData.endereco.estado;

  employeeEmergencyName.value = privateData.contatoEmergencia.nome;

  employeeEmergencyRelation.value = privateData.contatoEmergencia.relacao;

  employeeEmergencyPhone.value = formatPhone(
    privateData.contatoEmergencia.telefone,
  );

  employeeContractType.value = privateData.contrato.tipo;

  employeePaymentValue.value =
    privateData.pagamento.valor === null
      ? ""
      : String(privateData.pagamento.valor);

  employeePaymentPeriodicity.value = privateData.pagamento.periodicidade;

  employeePaymentMethod.value = privateData.pagamento.forma;

  employeeBank.value = privateData.dadosBancarios.banco;

  employeeBankAgency.value = privateData.dadosBancarios.agencia;

  employeeBankAccount.value = privateData.dadosBancarios.conta;

  employeeBankAccountType.value = privateData.dadosBancarios.tipoConta;

  employeePixKey.value = privateData.dadosBancarios.chavePix;

  renderCurrentPrivateDocuments(privateData.documentos);
}

/* =========================================================
   ABERTURA DO MODAL
========================================================= */

async function openEmployeeModal(employeeDocumentId = null) {
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

    try {
      editingPrivateEmployeeData = await loadPrivateEmployeeData(
        employee.documentId,
      );

      applyPrivateEmployeeToForm(editingPrivateEmployeeData);
    } catch (error) {
      console.error(
        "[Funcionários] Não foi possível carregar os dados confidenciais:",
        error,
      );

      editingPrivateEmployeeData = normalizePrivateEmployee(null);

      applyPrivateEmployeeToForm(editingPrivateEmployeeData);

      showFeedback(
        "Não foi possível carregar os dados confidenciais deste funcionário.",
        true,
      );
    }
  } else {
    employeeModalEyebrow.textContent = "Novo cadastro";

    employeeModalTitle.textContent = "Cadastrar funcionário";

    saveEmployeeButton.textContent = "Salvar funcionário";

    editingPrivateEmployeeData = normalizePrivateEmployee(null);

    applyPrivateEmployeeToForm(editingPrivateEmployeeData);
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

  editingPrivateEmployeeData = null;

  employeeForm.reset();

  clearFormErrors();

  employeeSpecialtyInputs.forEach((input) => {
    input.checked = false;
  });

  employeePrivateDocumentsList.replaceChildren();

  employeePrivateDocumentsCurrent.hidden = true;

  saveEmployeeButton.disabled = false;

  document.body.classList.remove("modal-open");
}

/* =========================================================
   DOCUMENTOS PRIVADOS
========================================================= */

async function removeUploadedPrivateDocuments(documents = []) {
  if (!documents.length) {
    return;
  }

  await Promise.allSettled(
    documents.map((privateDocument) =>
      deleteObject(ref(storage, privateDocument.caminho)),
    ),
  );
}

async function uploadPrivateDocuments(
  employeeDocumentId,
  pendingDocuments = [],
) {
  if (!pendingDocuments.length) {
    return [];
  }

  const uploadedDocuments = [];

  try {
    for (const { category, file } of pendingDocuments) {
      const documentId = createPrivateDocumentId();

      const safeFileName = sanitizePrivateFileName(file.name);

      const storagePath = [
        "funcionarios-privados",
        employeeDocumentId,
        "documentos",
        category,
        `${documentId}-${safeFileName}`,
      ].join("/");

      const storageReference = ref(storage, storagePath);

      await uploadBytes(storageReference, file, {
        contentType: file.type || undefined,
        customMetadata: {
          funcionarioId: employeeDocumentId,
          categoria: category,
          enviadoPorUid: currentSession.uid,
        },
      });

      uploadedDocuments.push({
        id: documentId,
        categoria: category,
        nome: file.name,
        caminho: storagePath,
        tipo: file.type || "",
        tamanho: file.size,
        enviadoEm: new Date().toISOString(),
      });
    }

    return uploadedDocuments;
  } catch (error) {
    await removeUploadedPrivateDocuments(uploadedDocuments);

    throw error;
  }
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

  const existingPrivateDocuments = Array.isArray(
    editingPrivateEmployeeData?.documentos,
  )
    ? editingPrivateEmployeeData.documentos
    : [];

  let pendingPrivateDocuments = [];

  try {
    pendingPrivateDocuments = validatePrivateDocuments(
      existingPrivateDocuments,
    );
  } catch (error) {
    showFeedback(error.message || "Revise os documentos selecionados.", true);

    return;
  }

  const originalButtonText = saveEmployeeButton.textContent;

  saveEmployeeButton.disabled = true;

  saveEmployeeButton.textContent = existingEmployee
    ? "Atualizando..."
    : "Salvando...";

  const operationalData = {
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

  const privateFormData = getPrivateEmployeeFormData();

  const employeeReference = existingEmployee
    ? doc(db, "funcionarios", existingEmployee.documentId)
    : doc(collection(db, "funcionarios"));

  const employeeDocumentId = employeeReference.id;

  const privateReference = doc(db, "funcionariosPrivados", employeeDocumentId);

  let uploadedPrivateDocuments = [];

  let newEmployeeBaseCreated = false;

  try {
    if (!existingEmployee) {
      const creationBatch = writeBatch(db);

      creationBatch.set(employeeReference, {
        ...operationalData,

        id: employeeDocumentId,

        codigo: getNextEmployeeCode(),

        acessoConfigurado: false,

        usuarioUid: "",

        criadoEm: serverTimestamp(),

        criadoPorUid: currentSession.uid,
      });

      creationBatch.set(privateReference, {
        ...privateFormData,

        funcionarioId: employeeDocumentId,

        documentos: [],

        criadoEm: serverTimestamp(),

        criadoPorUid: currentSession.uid,

        atualizadoEm: serverTimestamp(),

        atualizadoPorUid: currentSession.uid,
      });

      await creationBatch.commit();

      newEmployeeBaseCreated = true;
    }

    uploadedPrivateDocuments = await uploadPrivateDocuments(
      employeeDocumentId,
      pendingPrivateDocuments,
    );

    const allPrivateDocuments = [
      ...existingPrivateDocuments,
      ...uploadedPrivateDocuments,
    ];

    const batch = writeBatch(db);

    if (existingEmployee) {
      batch.set(employeeReference, operationalData, {
        merge: true,
      });
    }

    const privateData = {
      ...privateFormData,

      funcionarioId: employeeDocumentId,

      documentos: allPrivateDocuments,

      atualizadoEm: serverTimestamp(),

      atualizadoPorUid: currentSession.uid,
    };

    if (existingEmployee && !editingPrivateEmployeeData?.criadoEm) {
      privateData.criadoEm = serverTimestamp();

      privateData.criadoPorUid = currentSession.uid;
    }

    batch.set(privateReference, privateData, {
      merge: true,
    });

    await batch.commit();

    await loadEmployees();

    closeEmployeeModal();

    showFeedback(
      existingEmployee
        ? "Funcionário e dados confidenciais atualizados com sucesso."
        : "Funcionário cadastrado com os dados confidenciais protegidos.",
    );
  } catch (error) {
    console.error(
      "[Funcionários] Não foi possível salvar o funcionário:",
      error,
    );

    if (uploadedPrivateDocuments.length) {
      await removeUploadedPrivateDocuments(uploadedPrivateDocuments);
    }

    if (newEmployeeBaseCreated) {
      try {
        const cleanupBatch = writeBatch(db);

        cleanupBatch.delete(privateReference);

        cleanupBatch.delete(employeeReference);

        await cleanupBatch.commit();
      } catch (cleanupError) {
        console.error(
          "[Funcionários] Não foi possível limpar o cadastro incompleto:",
          cleanupError,
        );
      }
    }

    const permissionDenied =
      error?.code === "permission-denied" ||
      error?.code === "storage/unauthorized";

    showFeedback(
      permissionDenied
        ? "O Firebase bloqueou o acesso à área confidencial."
        : "Não foi possível salvar o funcionário e os dados confidenciais.",
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
   DADOS CONFIDENCIAIS
========================================================= */

function formatPrivateFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return "Tamanho não informado";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function openPrivateDocument(privateDocument, button) {
  if (!currentSession || currentSession.role !== "admin") {
    showFeedback("Acesso restrito à Administração.", true);

    return;
  }

  if (!privateDocument?.caminho) {
    showFeedback("O caminho deste documento não foi encontrado.", true);

    return;
  }

  const originalButtonText = button.textContent;

  button.disabled = true;

  button.textContent = "Abrindo...";

  try {
    const storageReference = ref(storage, privateDocument.caminho);

    const blob = await getBlob(storageReference);

    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = objectUrl;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    link.click();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 60000);
  } catch (error) {
    console.error(
      "[Funcionários] Não foi possível abrir o documento privado:",
      error,
    );

    showFeedback(
      error?.code === "storage/unauthorized"
        ? "O Firebase bloqueou o acesso a este documento."
        : "Não foi possível abrir o documento.",
      true,
    );
  } finally {
    button.disabled = false;

    button.textContent = originalButtonText;
  }
}

async function deletePrivateDocument(privateDocument, button) {
  if (!currentSession || currentSession.role !== "admin") {
    showFeedback("Acesso restrito à Administração.", true);

    return;
  }

  const employeeDocumentId = privateEmployeeId;

  if (
    !employeeDocumentId ||
    !privateDocument?.id ||
    !privateDocument?.caminho
  ) {
    showFeedback("Não foi possível identificar este documento.", true);

    return;
  }

  const confirmed = window.confirm(
    `Excluir o documento "${privateDocument.nome || "Documento"}"?\n\nEsta ação removerá o arquivo permanentemente.`,
  );

  if (!confirmed) {
    return;
  }

  const originalButtonText = button.textContent;

  button.disabled = true;

  button.textContent = "Excluindo...";

  try {
    const employee = getEmployeeById(employeeDocumentId);

    if (!employee) {
      throw new Error("EMPLOYEE_NOT_FOUND");
    }

    const privateData = await loadPrivateEmployeeData(employeeDocumentId);

    const documentToDelete = privateData.documentos.find(
      (document) =>
        document.id === privateDocument.id &&
        document.caminho === privateDocument.caminho,
    );

    if (!documentToDelete) {
      showFeedback("Este documento não está mais cadastrado.", true);

      renderPrivateEmployeeData(employee, privateData);

      return;
    }

    const remainingDocuments = privateData.documentos.filter(
      (document) => document.id !== documentToDelete.id,
    );

    const privateReference = doc(
      db,
      "funcionariosPrivados",
      employeeDocumentId,
    );

    const batch = writeBatch(db);

    batch.set(
      privateReference,
      {
        documentos: remainingDocuments,
        atualizadoEm: serverTimestamp(),
        atualizadoPorUid: currentSession.uid,
      },
      {
        merge: true,
      },
    );

    await batch.commit();

    try {
      await deleteObject(ref(storage, documentToDelete.caminho));
    } catch (storageError) {
      if (storageError?.code !== "storage/object-not-found") {
        const rollbackBatch = writeBatch(db);

        rollbackBatch.set(
          privateReference,
          {
            documentos: privateData.documentos,
            atualizadoEm: serverTimestamp(),
            atualizadoPorUid: currentSession.uid,
          },
          {
            merge: true,
          },
        );

        await rollbackBatch.commit();

        throw storageError;
      }
    }

    renderPrivateEmployeeData(employee, {
      ...privateData,
      documentos: remainingDocuments,
    });

    showFeedback("Documento excluído com sucesso.");
  } catch (error) {
    console.error(
      "[Funcionários] Não foi possível excluir o documento privado:",
      error,
    );

    showFeedback(
      error?.code === "storage/unauthorized" ||
        error?.code === "permission-denied"
        ? "O Firebase bloqueou a exclusão deste documento."
        : "Não foi possível excluir o documento.",
      true,
    );
  } finally {
    if (button.isConnected) {
      button.disabled = false;

      button.textContent = originalButtonText;
    }
  }
}

function renderPrivateEmployeeFiles(privateData) {
  employeePrivateFiles.replaceChildren();

  const documents = Array.isArray(privateData?.documentos)
    ? privateData.documentos
    : [];

  employeePrivateFilesEmpty.hidden = documents.length > 0;

  if (!documents.length) {
    return;
  }

  documents.forEach((privateDocument) => {
    const item = document.createElement("article");

    item.className = "employee-private-file";

    const copy = document.createElement("div");

    copy.className = "employee-private-file__copy";

    const category = document.createElement("span");

    category.className = "employee-private-file__category";

    category.textContent = getPrivateDocumentCategoryLabel(
      privateDocument.categoria,
    );

    const name = document.createElement("strong");

    name.className = "employee-private-file__name";

    name.textContent = privateDocument.nome || "Documento";

    const metadata = document.createElement("small");

    metadata.className = "employee-private-file__meta";

    metadata.textContent = formatPrivateFileSize(privateDocument.tamanho);

    copy.append(category, name, metadata);

    const actions = document.createElement("div");

    actions.className = "employee-private-file__actions";

    const openButton = document.createElement("button");

    openButton.type = "button";

    openButton.className =
      "employee-modal__button employee-modal__button--secondary employee-private-file__button";

    openButton.textContent = "Abrir";

    openButton.addEventListener("click", () => {
      openPrivateDocument(privateDocument, openButton);
    });

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
      "employee-modal__button employee-modal__button--secondary employee-private-file__button employee-private-file__delete-button";

    deleteButton.textContent = "Excluir";

    deleteButton.addEventListener("click", () => {
      deletePrivateDocument(privateDocument, deleteButton);
    });

    actions.append(openButton, deleteButton);

    item.append(copy, actions);

    employeePrivateFiles.append(item);
  });
}

function renderPrivateEmployeeData(employee, privateData) {
  employeePrivateCode.textContent = employee.codigo;

  employeePrivateName.textContent = employee.nome || "Funcionário";

  employeePrivateCpf.textContent = privateData.cpf || "Não informado";

  employeePrivateRg.textContent = privateData.rg || "Não informado";

  employeePrivateBirthDate.textContent = formatDate(privateData.dataNascimento);

  employeePrivateCnh.textContent = privateData.cnh || "Não informada";

  employeePrivateCnhExpiration.textContent = formatDate(
    privateData.cnhValidade,
  );

  employeePrivateAddress.textContent =
    buildPrivateAddress(privateData) || "Não informado";

  employeePrivateEmergency.textContent =
    buildEmergencyContact(privateData) || "Não informado";

  employeePrivateContractType.textContent = getContractTypeLabel(
    privateData.contrato.tipo,
  );

  employeePrivatePaymentValue.textContent =
    privateData.pagamento.valor === null
      ? "Não informado"
      : formatCurrency(privateData.pagamento.valor);

  employeePrivatePaymentPeriodicity.textContent = getPaymentPeriodicityLabel(
    privateData.pagamento.periodicidade,
  );

  employeePrivatePaymentMethod.textContent = getPaymentMethodLabel(
    privateData.pagamento.forma,
  );

  employeePrivateBank.textContent =
    privateData.dadosBancarios.banco || "Não informado";

  employeePrivateBankAgency.textContent =
    privateData.dadosBancarios.agencia || "Não informada";

  employeePrivateBankAccount.textContent =
    privateData.dadosBancarios.conta || "Não informada";

  employeePrivateBankAccountType.textContent = getBankAccountTypeLabel(
    privateData.dadosBancarios.tipoConta,
  );

  employeePrivatePixKey.textContent =
    privateData.dadosBancarios.chavePix || "Não informada";

  renderPrivateEmployeeFiles(privateData);
}

async function openEmployeePrivateModal(employeeDocumentId) {
  if (!currentSession || currentSession.role !== "admin") {
    showFeedback("Acesso restrito à Administração.", true);

    return;
  }

  const employee = getEmployeeById(employeeDocumentId);

  if (!employee) {
    showFeedback("Funcionário não encontrado.", true);

    return;
  }

  privateEmployeeId = employee.documentId;

  try {
    const privateData = await loadPrivateEmployeeData(employee.documentId);

    renderPrivateEmployeeData(employee, privateData);

    employeePrivateModal.hidden = false;

    document.body.classList.add("modal-open");
  } catch (error) {
    console.error(
      "[Funcionários] Não foi possível abrir os dados confidenciais:",
      error,
    );

    privateEmployeeId = null;

    showFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou o acesso aos dados confidenciais."
        : "Não foi possível carregar os dados confidenciais.",
      true,
    );
  }
}

function closeEmployeePrivateModal() {
  employeePrivateModal.hidden = true;

  privateEmployeeId = null;

  employeePrivateFiles.replaceChildren();

  employeePrivateFilesEmpty.hidden = false;

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

employeeCpf.addEventListener("input", () => {
  employeeCpf.value = formatCpf(employeeCpf.value);

  clearFieldError(employeeCpf);
});

employeeAddressZip.addEventListener("input", () => {
  employeeAddressZip.value = formatZipCode(employeeAddressZip.value);

  clearFieldError(employeeAddressZip);
});

employeeEmergencyPhone.addEventListener("input", () => {
  employeeEmergencyPhone.value = formatPhone(employeeEmergencyPhone.value);

  clearFieldError(employeeEmergencyPhone);
});

employeeAddressState.addEventListener("input", () => {
  employeeAddressState.value = employeeAddressState.value
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);

  clearFieldError(employeeAddressState);
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

openEmployeePrivateButton.addEventListener("click", () => {
  const employeeDocumentId = detailsEmployeeId;

  closeEmployeeDetails();

  if (employeeDocumentId) {
    openEmployeePrivateModal(employeeDocumentId);
  }
});

closeEmployeePrivateModalButton.addEventListener(
  "click",
  closeEmployeePrivateModal,
);

employeePrivateModal.addEventListener("click", (event) => {
  if (event.target === employeePrivateModal) {
    closeEmployeePrivateModal();
  }
});

editEmployeeFromPrivateButton.addEventListener("click", () => {
  const employeeDocumentId = privateEmployeeId;

  closeEmployeePrivateModal();

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

  if (!employeePrivateModal.hidden) {
    closeEmployeePrivateModal();

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
