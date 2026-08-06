/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const FIREBASE_VERSION = "12.16.0";

const ABAS_PERMITIDAS = [
  "todos",
  "ativos",
  "com-equipamentos",
  "atencao",
  "inativos",
];

let db;
let storage;

let collection;
let doc;
let getDocs;
let query;
let where;
let setDoc;
let serverTimestamp;
let runTransaction;

let storageRef;
let uploadBytesResumable;
let getDownloadURL;
let getBlob;
let deleteObject;

async function prepararFirebaseDeCondominios() {
  const [firestoreModule, storageModule, firebaseConfigModule] =
    await Promise.all([
      import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
      ),

      import(
        `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-storage.js`
      ),

      import("./firebase-config.js"),
    ]);

  db = firebaseConfigModule.db;

  storage = firebaseConfigModule.storage;

  ({
    collection,
    doc,
    getDocs,
    query,
    where,
    setDoc,
    serverTimestamp,
    runTransaction,
  } = firestoreModule);

  ({
    ref: storageRef,
    uploadBytesResumable,
    getDownloadURL,
    getBlob,
    deleteObject,
  } = storageModule);
}

async function aguardarSessaoDaPagina() {
  if (window.salvateckSessionReady) {
    return window.salvateckSessionReady;
  }

  return new Promise((resolve) => {
    window.addEventListener(
      "salvateck:auth-ready",
      (event) => resolve(event.detail),
      { once: true },
    );
  });
}

/* =========================================
   FUNÇÕES DE DATA
========================================= */

function obterInicioDoDia(data = new Date()) {
  const novaData = new Date(data);

  novaData.setHours(0, 0, 0, 0);

  return novaData;
}

function obterDataISO(data = new Date()) {
  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function criarDataLocal(valor) {
  if (!valor) {
    return null;
  }

  const apenasData = String(valor).split("T")[0];

  return new Date(`${apenasData}T12:00:00`);
}

function formatarData(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "Não informado";
  }

  return data.toLocaleDateString("pt-BR");
}

function formatarDataCompleta(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "Não informado";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* =========================================
   CONFIGURAÇÕES DOS CAMPOS
========================================= */

const statusConfig = {
  ativo: {
    nome: "Ativo",
    classe: "status--ativo",
  },

  atencao: {
    nome: "Com atenção",
    classe: "status--atencao",
  },

  inativo: {
    nome: "Inativo",
    classe: "status--inativo",
  },
};

const papelConfig = {
  sindico: "Síndico",
  subsindico: "Subsindico",
  proprietario: "Proprietário",
  gerente: "Gerente",
  administradora: "Administradora",
  zelador: "Zelador",
  financeiro: "Responsável financeiro",
  outro: "Outro",
};

const equipamentoFiltroConfig = {
  elevador: "Elevador",
  bomba: "Bombas",
  portao: "Portão automático",
  piscina: "Piscina",
  gerador: "Gerador",
  "sistema-incendio": "Sistema de incêndio",
};
const equipamentosAntigosConfig = {
  portaria: {
    nome: "Portaria",
    categoria: "Segurança e acesso",
  },

  "portao-automatico": {
    nome: "Portão automático",
    categoria: "Segurança e acesso",
  },

  interfone: {
    nome: "Interfone",
    categoria: "Segurança e acesso",
  },

  cftv: {
    nome: "Câmeras e CFTV",
    categoria: "Segurança e acesso",
  },

  "controle-acesso": {
    nome: "Controle de acesso",
    categoria: "Segurança e acesso",
  },

  "quadro-eletrico": {
    nome: "Quadros elétricos",
    categoria: "Sistema elétrico",
  },

  "iluminacao-emergencia": {
    nome: "Iluminação de emergência",
    categoria: "Sistema elétrico",
  },

  gerador: {
    nome: "Gerador",
    categoria: "Sistema elétrico",
  },

  spda: {
    nome: "SPDA e para-raios",
    categoria: "Sistema elétrico",
  },

  bombas: {
    nome: "Bombas",
    categoria: "Sistema hidráulico",
  },

  "reservatorio-superior": {
    nome: "Reservatório superior",
    categoria: "Sistema hidráulico",
  },

  "reservatorio-inferior": {
    nome: "Reservatório inferior",
    categoria: "Sistema hidráulico",
  },

  "rede-hidraulica": {
    nome: "Rede hidráulica",
    categoria: "Sistema hidráulico",
  },

  extintores: {
    nome: "Extintores",
    categoria: "Combate a incêndio",
  },

  hidrantes: {
    nome: "Hidrantes",
    categoria: "Combate a incêndio",
  },

  "alarme-incendio": {
    nome: "Alarme de incêndio",
    categoria: "Combate a incêndio",
  },

  "sinalizacao-emergencia": {
    nome: "Sinalização de emergência",
    categoria: "Combate a incêndio",
  },

  "elevador-social": {
    nome: "Elevador social",
    categoria: "Transporte",
  },

  "elevador-servico": {
    nome: "Elevador de serviço",
    categoria: "Transporte",
  },

  "plataforma-acessibilidade": {
    nome: "Plataforma de acessibilidade",
    categoria: "Transporte",
  },

  piscina: {
    nome: "Piscina",
    categoria: "Áreas comuns",
  },

  playground: {
    nome: "Playground",
    categoria: "Áreas comuns",
  },

  academia: {
    nome: "Academia",
    categoria: "Áreas comuns",
  },

  "salao-festas": {
    nome: "Salão de festas",
    categoria: "Áreas comuns",
  },

  garagem: {
    nome: "Garagem",
    categoria: "Áreas comuns",
  },

  jardim: {
    nome: "Jardins",
    categoria: "Áreas comuns",
  },

  fachada: {
    nome: "Fachada",
    categoria: "Estrutura predial",
  },

  cobertura: {
    nome: "Cobertura e telhado",
    categoria: "Estrutura predial",
  },

  escadas: {
    nome: "Escadas e corrimãos",
    categoria: "Estrutura predial",
  },

  "casa-maquinas": {
    nome: "Casa de máquinas",
    categoria: "Estrutura predial",
  },
};
const documentoFiltroConfig = {
  regular: "Documentação regular",
  pendente: "Documentação pendente",
  vencida: "Documento vencido",
  "sem-documentos": "Sem documentos",
};

const abasConfig = {
  todos: {
    titulo: "Condomínios cadastrados",
    subtitulo: "Todos os cadastros",
  },

  ativos: {
    titulo: "Condomínios ativos",
    subtitulo: "Cadastros em operação",
  },
  "com-equipamentos": {
    titulo: "Condomínios com equipamentos",
    subtitulo: "Cadastros com estruturas e equipamentos",
  },
  atencao: {
    titulo: "Condomínios com atenção",
    subtitulo: "Pendências identificadas",
  },

  inativos: {
    titulo: "Condomínios inativos",
    subtitulo: "Cadastros desativados",
  },
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const summaryTotal = document.getElementById("summary-total");

const summaryActive = document.getElementById("summary-active");

const summaryEquipment = document.getElementById("summary-equipment");

const summaryAttention = document.getElementById("summary-attention");

const summaryFilterButtons = document.querySelectorAll("[data-summary-filter]");

const condominiumsOverviewHint = document.getElementById(
  "condominiums-overview-hint",
);

const condominiumsTools = document.querySelector(".condominiums-tools");

const condominiumsContent = document.querySelector(".condominiums-content");

const statusTabButtons = document.querySelectorAll("[data-status-tab]");

const condominiumsSearch = document.getElementById("condominiums-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");
const statusFilter = document.getElementById("status-filter");

const activeFilterCount = document.getElementById("active-filter-count");

const activeFiltersList = document.getElementById("active-filters-list");

const cityFilter = document.getElementById("city-filter");

const managerFilter = document.getElementById("manager-filter");

const equipmentFilter = document.getElementById("equipment-filter");

const documentFilter = document.getElementById("document-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const clearEmptyFiltersButton = document.getElementById(
  "clear-empty-filters-button",
);

const condominiumsContentEyebrow = document.getElementById(
  "condominiums-content-eyebrow",
);

const condominiumsContentTitle = document.getElementById(
  "condominiums-content-title",
);

const condominiumsCount = document.getElementById("condominiums-count");

const condominiumsList = document.getElementById("condominiums-list");

const emptyState = document.getElementById("empty-state");

const condominiumCardTemplate = document.getElementById(
  "condominium-card-template",
);

/* =========================================
   ELEMENTOS DO MODAL
========================================= */

const newCondominiumButton = document.getElementById("new-condominium-button");

const condominiumModal = document.getElementById("condominium-modal");

const condominiumModalEyebrow = document.getElementById(
  "condominium-modal-eyebrow",
);

const condominiumModalTitle = document.getElementById(
  "condominium-modal-title",
);

const closeCondominiumModalButton = document.getElementById(
  "close-condominium-modal-button",
);

const cancelCondominiumButton = document.getElementById(
  "cancel-condominium-button",
);

const condominiumForm = document.getElementById("condominium-form");

const condominiumId = document.getElementById("condominium-id");

const condominiumName = document.getElementById("condominium-name");

const condominiumCode = document.getElementById("condominium-code");
condominiumCode.readOnly = true;

const condominiumDocument = document.getElementById("condominium-document");

const condominiumStatus = document.getElementById("condominium-status");

const condominiumBlocks = document.getElementById("condominium-blocks");

const condominiumUnits = document.getElementById("condominium-units");

const condominiumZipCode = document.getElementById("condominium-zip-code");

const condominiumStreet = document.getElementById("condominium-street");

const condominiumNumber = document.getElementById("condominium-number");

const condominiumComplement = document.getElementById("condominium-complement");

const condominiumNeighborhood = document.getElementById(
  "condominium-neighborhood",
);

const condominiumCity = document.getElementById("condominium-city");

const condominiumState = document.getElementById("condominium-state");

const condominiumNotes = document.getElementById("condominium-notes");

/* =========================================
   ABAS DO MODAL
========================================= */

const modalTabButtons = document.querySelectorAll("[data-modal-tab]");

const modalTabPanels = document.querySelectorAll("[data-modal-panel]");

/* =========================================
   VÍNCULOS
========================================= */

const linkedClientSearch = document.getElementById("linked-client-search");

const linkedClientSelect = document.getElementById("linked-client-select");

const linkedClientRole = document.getElementById("linked-client-role");

const linkedClientPrimary = document.getElementById("linked-client-primary");

const linkedClientFinancial = document.getElementById(
  "linked-client-financial",
);

const linkClientButton = document.getElementById("link-client-button");

const linkedClientsCount = document.getElementById("linked-clients-count");

const linkedClientsList = document.getElementById("linked-clients-list");

const linkedClientsEmpty = document.getElementById("linked-clients-empty");

const linkedClientTemplate = document.getElementById("linked-client-template");

/* =========================================
   EQUIPAMENTOS
========================================= */

const equipmentInputs = document.querySelectorAll('input[name="equipment"]');

const selectedEquipmentCount = document.getElementById(
  "selected-equipment-count",
);

const equipmentGroups = document.querySelectorAll(".equipment-group");

/* =========================================
   NOVA ESTRUTURA DE AMBIENTES E EQUIPAMENTOS
========================================= */

const legacyEquipmentNotice = document.getElementById(
  "legacy-equipment-notice",
);

const addCondominiumEnvironmentButton = document.getElementById(
  "add-condominium-environment-button",
);

const condominiumEnvironmentEditor = document.getElementById(
  "condominium-environment-editor",
);

const condominiumEnvironmentEditorEyebrow = document.getElementById(
  "condominium-environment-editor-eyebrow",
);

const condominiumEnvironmentEditorTitle = document.getElementById(
  "condominium-environment-editor-title",
);

const closeCondominiumEnvironmentEditorButton = document.getElementById(
  "close-condominium-environment-editor-button",
);

const condominiumEnvironmentEditIndex = document.getElementById(
  "condominium-environment-edit-index",
);

const condominiumEnvironmentSelect = document.getElementById(
  "condominium-environment-select",
);

const condominiumEnvironmentSelectHelp = document.getElementById(
  "condominium-environment-select-help",
);

const environmentEquipmentSelectedCount = document.getElementById(
  "environment-equipment-selected-count",
);

const environmentEquipmentSearch = document.getElementById(
  "environment-equipment-search",
);

const environmentEquipmentOptions = document.getElementById(
  "environment-equipment-options",
);

const environmentEquipmentEmpty = document.getElementById(
  "environment-equipment-empty",
);

const cancelCondominiumEnvironmentButton = document.getElementById(
  "cancel-condominium-environment-button",
);

const saveCondominiumEnvironmentButton = document.getElementById(
  "save-condominium-environment-button",
);

const condominiumEnvironmentsList = document.getElementById(
  "condominium-environments-list",
);

const condominiumEnvironmentsEmpty = document.getElementById(
  "condominium-environments-empty",
);

const condominiumEnvironmentTemplate = document.getElementById(
  "condominium-environment-template",
);

const condominiumEnvironmentEquipmentTemplate = document.getElementById(
  "condominium-environment-equipment-template",
);

const environmentEquipmentOptionTemplate = document.getElementById(
  "environment-equipment-option-template",
);

/* =========================================
   DOCUMENTOS E HISTÓRICO
========================================= */

const addDocumentButton = document.getElementById("add-document-button");

const documentUploadPanel = document.getElementById("document-upload-panel");

const closeDocumentUploadButton = document.getElementById(
  "close-document-upload-button",
);

const documentUploadField = document.getElementById("document-upload-field");

const condominiumDocumentFile = document.getElementById(
  "condominium-document-file",
);

const documentSelectedFile = document.getElementById("document-selected-file");

const documentSelectedFileName = document.getElementById(
  "document-selected-file-name",
);

const documentSelectedFileSize = document.getElementById(
  "document-selected-file-size",
);

const removeSelectedDocumentButton = document.getElementById(
  "remove-selected-document-button",
);

const documentTitle = document.getElementById("document-title");

const documentExpirationDate = document.getElementById(
  "document-expiration-date",
);

const documentUploadStatus = document.getElementById("document-upload-status");

const documentUploadStatusText = document.getElementById(
  "document-upload-status-text",
);

const documentUploadProgress = document.getElementById(
  "document-upload-progress",
);

const documentUploadError = document.getElementById("document-upload-error");

const cancelDocumentUploadButton = document.getElementById(
  "cancel-document-upload-button",
);

const uploadDocumentButton = document.getElementById("upload-document-button");

const documentsLoading = document.getElementById("documents-loading");

const documentsList = document.getElementById("documents-list");

const documentsEmpty = document.getElementById("documents-empty");

const documentTemplate = document.getElementById("document-template");

const condominiumHistory = document.getElementById("condominium-history");

const historyEmpty = document.getElementById("history-empty");

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let condominios = [];

let clientes = [];

let ordens = [];

let ambientesCatalogo = [];

let equipamentosCatalogo = [];

let ambienteEmEdicaoIndex = null;

let equipamentosTemporariosDoEditor = [];

let abaAtual = "todos";

let resumoSelecionado = null;

let abaAtualModal = "general";

let filtrosAplicados = {
  status: "",
  cidade: "",
  responsavel: "",
  equipamento: "",
  documento: "",
};

let condominioEmEdicaoId = null;

let condominioRascunho = null;

let sessaoAtual = null;

let arquivoDocumentoSelecionado = null;

let uploadDocumentoEmAndamento = false;

let acaoDocumentoEmAndamento = false;

const tamanhoMaximoDocumento = 10 * 1024 * 1024;

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function clonarDados(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarSlug(valor) {
  return normalizarTexto(valor)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatarQuantidade(quantidade, singular = "item", plural = "itens") {
  return quantidade === 1 ? `1 ${singular}` : `${quantidade} ${plural}`;
}

function obterCondominioPorId(id) {
  return condominios.find((condominio) => condominio.id === id);
}

function obterClientePorId(clienteId) {
  return clientes.find((cliente) => cliente.id === clienteId) || null;
}

function normalizarListaDeIds(lista = []) {
  if (!Array.isArray(lista)) {
    return [];
  }

  return [
    ...new Set(lista.map((id) => String(id || "").trim()).filter(Boolean)),
  ].sort();
}

function obterClientesIdsDosVinculos(condominio = {}) {
  const vinculos = Array.isArray(condominio.clientesVinculados)
    ? condominio.clientesVinculados
    : [];

  return normalizarListaDeIds(vinculos.map((vinculo) => vinculo.clienteId));
}

function listasDeIdsSaoIguais(listaA, listaB) {
  return (
    JSON.stringify(normalizarListaDeIds(listaA)) ===
    JSON.stringify(normalizarListaDeIds(listaB))
  );
}

function obterIniciais(nome) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "CL";
  }

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function obterClientePrincipal(condominio) {
  const vinculos = Array.isArray(condominio.clientesVinculados)
    ? condominio.clientesVinculados
    : [];

  const principal = vinculos.find((vinculo) => vinculo.contatoPrincipal);

  return principal || vinculos[0] || null;
}

function obterNomeCliente(clienteId) {
  return obterClientePorId(clienteId)?.nome || "Cliente não identificado";
}

function obterNomeResponsavel(condominio) {
  const vinculo = obterClientePrincipal(condominio);

  if (!vinculo) {
    return "Sem responsável vinculado";
  }

  const cliente = obterNomeCliente(vinculo.clienteId);

  const papel = papelConfig[vinculo.papel] || "Responsável";

  return `${cliente} — ${papel}`;
}

function obterNomeCidadePorSlug(slug) {
  const condominio = condominios.find(
    (item) => criarSlug(item.endereco?.cidade) === slug,
  );

  return condominio?.endereco?.cidade || slug;
}

function obterEnderecoCompleto(condominio) {
  const endereco = condominio.endereco || {};

  const primeiraLinha = [endereco.logradouro, endereco.numero]
    .filter(Boolean)
    .join(", ");

  const segundaLinha = [endereco.complemento, endereco.bairro]
    .filter(Boolean)
    .join(" — ");

  const terceiraLinha = [endereco.cidade, endereco.estado]
    .filter(Boolean)
    .join("/");

  return [primeiraLinha, segundaLinha, terceiraLinha]
    .filter(Boolean)
    .join(" — ");
}

function mostrarFeedback(mensagem) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = mensagem;

  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 2800);
}

function extrairNumeroDoCodigoCondominio(codigo) {
  const correspondencia = String(codigo || "")
    .trim()
    .match(/^COND(?:-|\s)?(\d+)$/i);

  if (!correspondencia) {
    return 0;
  }

  return Math.max(0, Number(correspondencia[1]) || 0);
}

function obterMaiorNumeroDeCondominioCadastrado() {
  return condominios.reduce((maiorNumero, condominio) => {
    const numeroAtual = extrairNumeroDoCodigoCondominio(condominio.codigo);

    return Math.max(maiorNumero, numeroAtual);
  }, 0);
}

function formatarCodigoCondominio(numero) {
  return `COND-${String(numero).padStart(4, "0")}`;
}

function gerarIdentificadores() {
  const proximoNumero = obterMaiorNumeroDeCondominioCadastrado() + 1;

  return {
    id: doc(collection(db, "condominios")).id,

    /*
      Este código é apenas uma prévia no modal.
      O código definitivo será confirmado
      pela transação no momento do salvamento.
    */
    codigo: formatarCodigoCondominio(proximoNumero),
  };
}

function gerarIdDocumento() {
  return `DOC-${Date.now()}-` + Math.random().toString(16).slice(2, 7);
}

function gerarIdHistorico() {
  return `HIST-${Date.now()}-` + Math.random().toString(16).slice(2, 7);
}

/* =========================================
   FIRESTORE
========================================= */

function converterDataDoFirestoreParaISO(valor) {
  if (!valor) {
    return "";
  }

  if (typeof valor.toDate === "function") {
    return obterDataISO(valor.toDate());
  }

  if (valor instanceof Date) {
    return obterDataISO(valor);
  }

  const texto = String(valor).trim();

  if (!texto) {
    return "";
  }

  return texto.includes("T") ? texto.split("T")[0] : texto;
}

function mapearClienteDoFirestore(clienteSnapshot) {
  const dados = clienteSnapshot.data();

  const status =
    dados.statusCadastro || (dados.ativo === false ? "inativo" : "ativo");

  return {
    id: clienteSnapshot.id,
    uid: dados.uid || clienteSnapshot.id,
    nome: dados.nome || "Cliente sem nome",
    email: dados.email || "",
    telefone: dados.telefone || "",
    status,
    iniciais: obterIniciais(dados.nome),
  };
}

function normalizarHistorico(historico) {
  if (!Array.isArray(historico)) {
    return [];
  }

  return historico
    .filter((registro) => registro && typeof registro === "object")
    .map((registro) => ({
      id: registro.id || gerarIdHistorico(),

      tipo: registro.tipo || "cadastro",

      titulo: registro.titulo || "Atualização do cadastro",

      descricao: registro.descricao || "",

      data: converterDataDoFirestoreParaISO(registro.data),

      origemFirestore: false,
    }));
}
function mapearAmbienteDoCatalogo(ambienteSnapshot) {
  const dados = ambienteSnapshot.data();

  return {
    id: ambienteSnapshot.id,

    codigo: String(dados.codigo || "").trim(),

    nome: String(dados.nome || "").trim() || "Ambiente sem nome",

    categoria: String(dados.categoria || "").trim() || "Outros ambientes",

    descricao: String(dados.descricao || "").trim(),

    status:
      String(dados.status || "").trim() === "inativo" ? "inativo" : "ativo",
  };
}

function mapearEquipamentoDoCatalogo(equipamentoSnapshot) {
  const dados = equipamentoSnapshot.data();

  return {
    id: equipamentoSnapshot.id,

    codigo: String(dados.codigo || "").trim(),

    nome: String(dados.nome || "").trim() || "Equipamento sem nome",

    categoria: String(dados.categoria || "").trim() || "Outros equipamentos",

    descricao: String(dados.descricao || "").trim(),

    orientacaoVistoria: String(dados.orientacaoVistoria || "").trim(),

    status:
      String(dados.status || "").trim() === "inativo" ? "inativo" : "ativo",
  };
}

function obterAmbienteDoCatalogoPorId(ambienteId) {
  return (
    ambientesCatalogo.find((ambiente) => ambiente.id === ambienteId) || null
  );
}

function obterEquipamentoDoCatalogoPorId(equipamentoId) {
  return (
    equipamentosCatalogo.find(
      (equipamento) => equipamento.id === equipamentoId,
    ) || null
  );
}

function normalizarEquipamentoDaEstrutura(valor) {
  const dados =
    valor && typeof valor === "object"
      ? valor
      : {
          equipamentoId: valor,
        };

  const equipamentoId = String(
    dados.equipamentoId || dados.equipmentId || dados.id || dados.codigo || "",
  ).trim();

  if (!equipamentoId) {
    return null;
  }

  const equipamentoCatalogo = obterEquipamentoDoCatalogoPorId(equipamentoId);

  const equipamentoAntigo = equipamentosAntigosConfig[equipamentoId] || null;

  return {
    equipamentoId,

    equipamentoNome: String(
      dados.equipamentoNome ||
        dados.nome ||
        equipamentoCatalogo?.nome ||
        equipamentoAntigo?.nome ||
        equipamentoId,
    ).trim(),

    categoria: String(
      dados.categoria ||
        equipamentoCatalogo?.categoria ||
        equipamentoAntigo?.categoria ||
        "Outros equipamentos",
    ).trim(),

    quantidade: Math.max(1, Number(dados.quantidade) || 1),

    observacao: String(
      dados.observacao || dados.localizacao || dados.notas || "",
    ).trim(),
  };
}

function normalizarEstruturaDeAmbientes(estrutura) {
  if (!Array.isArray(estrutura)) {
    return [];
  }

  return estrutura
    .map((valor) => {
      if (!valor || typeof valor !== "object") {
        return null;
      }

      const ambienteId = String(
        valor.ambienteId ||
          valor.environmentId ||
          valor.id ||
          valor.codigo ||
          "",
      ).trim();

      if (!ambienteId) {
        return null;
      }

      const ambienteCatalogo = obterAmbienteDoCatalogoPorId(ambienteId);

      const equipamentosOriginais = Array.isArray(valor.equipamentos)
        ? valor.equipamentos
        : Array.isArray(valor.equipamentosIds)
          ? valor.equipamentosIds
          : Array.isArray(valor.equipmentIds)
            ? valor.equipmentIds
            : [];

      const equipamentos = equipamentosOriginais
        .map(normalizarEquipamentoDaEstrutura)
        .filter(Boolean);

      const legado =
        Boolean(valor.legado) || ambienteId === "sem-ambiente-definido";

      return {
        ambienteId,

        ambienteNome: String(
          valor.ambienteNome ||
            valor.nome ||
            ambienteCatalogo?.nome ||
            (legado ? "Sem ambiente definido" : ambienteId),
        ).trim(),

        categoria: String(
          valor.categoria ||
            ambienteCatalogo?.categoria ||
            (legado ? "Cadastro anterior" : "Outros ambientes"),
        ).trim(),

        observacao: String(
          valor.observacao || valor.observacoes || valor.notas || "",
        ).trim(),

        legado,

        equipamentos,
      };
    })
    .filter(Boolean);
}

function obterEquipamentosIdsDaEstrutura(estruturaAmbientes = []) {
  if (!Array.isArray(estruturaAmbientes)) {
    return [];
  }

  return normalizarListaDeIds(
    estruturaAmbientes.flatMap((ambiente) =>
      Array.isArray(ambiente.equipamentos)
        ? ambiente.equipamentos.map((equipamento) => equipamento.equipamentoId)
        : [],
    ),
  );
}

function prepararEstruturaComCompatibilidade(
  estruturaOriginal,
  equipamentosAntigos,
) {
  const estruturaAmbientes = normalizarEstruturaDeAmbientes(estruturaOriginal);

  const idsJaOrganizados = new Set(
    obterEquipamentosIdsDaEstrutura(estruturaAmbientes),
  );

  const idsSemAmbiente = normalizarListaDeIds(equipamentosAntigos).filter(
    (equipamentoId) => !idsJaOrganizados.has(equipamentoId),
  );

  if (idsSemAmbiente.length === 0) {
    return estruturaAmbientes;
  }

  let ambienteLegado =
    estruturaAmbientes.find(
      (ambiente) =>
        ambiente.legado === true ||
        ambiente.ambienteId === "sem-ambiente-definido",
    ) || null;

  if (!ambienteLegado) {
    ambienteLegado = {
      ambienteId: "sem-ambiente-definido",

      ambienteNome: "Sem ambiente definido",

      categoria: "Cadastro anterior",

      observacao: "Equipamentos preservados do cadastro anterior.",

      legado: true,

      equipamentos: [],
    };

    estruturaAmbientes.unshift(ambienteLegado);
  }

  const idsDoAmbienteLegado = new Set(
    ambienteLegado.equipamentos.map((equipamento) => equipamento.equipamentoId),
  );

  idsSemAmbiente.forEach((equipamentoId) => {
    if (idsDoAmbienteLegado.has(equipamentoId)) {
      return;
    }

    const equipamento = normalizarEquipamentoDaEstrutura(equipamentoId);

    if (equipamento) {
      ambienteLegado.equipamentos.push(equipamento);
    }
  });

  return estruturaAmbientes;
}
function mapearCondominioDoFirestore(condominioSnapshot) {
  const dados = condominioSnapshot.data();

  const endereco = dados.endereco || {};

  const equipamentosAntigos = normalizarListaDeIds(dados.equipamentos);

  const estruturaAmbientes = prepararEstruturaComCompatibilidade(
    dados.estruturaAmbientes || dados.ambientesEquipamentos || [],
    equipamentosAntigos,
  );

  const equipamentos = normalizarListaDeIds([
    ...equipamentosAntigos,
    ...obterEquipamentosIdsDaEstrutura(estruturaAmbientes),
  ]);

  return {
    id: condominioSnapshot.id,

    codigo:
      dados.codigo || `COND-${condominioSnapshot.id.slice(0, 6).toUpperCase()}`,

    nome: dados.nome || "",
    cnpj: dados.cnpj || "",

    status: ["ativo", "atencao", "inativo"].includes(dados.status)
      ? dados.status
      : "ativo",

    blocos: Math.max(0, Number(dados.blocos) || 0),

    unidades: Math.max(0, Number(dados.unidades) || 0),

    endereco: {
      cep: endereco.cep || dados.cep || "",

      logradouro:
        endereco.logradouro ||
        endereco.rua ||
        dados.logradouro ||
        dados.rua ||
        "",

      numero: endereco.numero || dados.numero || "",

      complemento: endereco.complemento || dados.complemento || "",

      bairro: endereco.bairro || dados.bairro || "",

      cidade: endereco.cidade || dados.cidade || "",

      estado: endereco.estado || dados.estado || "SP",
    },

    observacoes: dados.observacoes || "",

    clientesVinculados: Array.isArray(dados.clientesVinculados)
      ? dados.clientesVinculados.map((vinculo) => ({
          clienteId: String(vinculo.clienteId || "").trim(),

          nome: String(vinculo.nome || "").trim(),

          papel: vinculo.papel || "outro",

          contatoPrincipal: Boolean(vinculo.contatoPrincipal),

          responsavelFinanceiro: Boolean(vinculo.responsavelFinanceiro),
        }))
      : [],

    clientesIds: normalizarListaDeIds(dados.clientesIds),

    equipamentos,

    estruturaAmbientes,

    documentos: Array.isArray(dados.documentos)
      ? dados.documentos
          .filter((documento) => documento && typeof documento === "object")
          .map((documento) => {
            let enviadoEm = "";

            if (
              documento.enviadoEm &&
              typeof documento.enviadoEm.toDate === "function"
            ) {
              enviadoEm = documento.enviadoEm.toDate().toISOString();
            } else {
              enviadoEm = String(documento.enviadoEm || "").trim();
            }

            return {
              id: String(documento.id || "").trim() || gerarIdDocumento(),

              nome: String(documento.nome || "Documento").trim() || "Documento",

              nomeOriginal: String(documento.nomeOriginal || "").trim(),

              storagePath: String(documento.storagePath || "").trim(),

              contentType: String(
                documento.contentType || "application/pdf",
              ).trim(),

              tamanho: Math.max(0, Number(documento.tamanho) || 0),

              vencimento: converterDataDoFirestoreParaISO(documento.vencimento),

              status: documento.status || "regular",

              enviadoPorUid: String(documento.enviadoPorUid || "").trim(),

              enviadoEm,
            };
          })
      : [],

    historico: normalizarHistorico(dados.historico),

    pendencias: 0,

    criadoEm: converterDataDoFirestoreParaISO(dados.criadoEm),

    atualizadoEm: converterDataDoFirestoreParaISO(dados.atualizadoEm),
  };
}

function obterCondominioIdDaOrdem(ordem) {
  return String(ordem?.condominio?.id || ordem?.condominioId || "").trim();
}

function criarHistoricoDaOrdem(ordem) {
  const vistoria = ordem.tipoAtendimento === "vistoria";

  const codigo = ordem.codigo || "Ordem";

  const titulo =
    ordem.titulo || (vistoria ? "Vistoria técnica" : "Ordem de serviço");

  return {
    id: `ordem-${ordem.id}`,

    tipo: vistoria ? "vistoria" : "ordem",

    titulo: `${codigo} — ${titulo}`,

    descricao: ordem.status
      ? `Status atual: ${String(ordem.status).replace(/-/g, " ")}.`
      : "Ordem registrada no sistema.",

    data: converterDataDoFirestoreParaISO(ordem.atualizadoEm || ordem.criadoEm),

    origemFirestore: true,
  };
}

function calcularPendenciasDoCondominio(condominio, ordensRelacionadas) {
  const documentosPendentes = condominio.documentos.filter(
    (documento) => atualizarStatusDocumento(documento) !== "regular",
  ).length;

  const pendenciasDeVistorias = ordensRelacionadas
    .filter((ordem) => ordem.tipoAtendimento === "vistoria")
    .reduce((total, ordem) => {
      const vistoria = ordem.vistoria || {};

      return (
        total +
        Math.max(0, Number(vistoria.naoConformidades) || 0) +
        Math.max(0, Number(vistoria.pendenciasCriticas) || 0)
      );
    }, 0);

  const total = documentosPendentes + pendenciasDeVistorias;

  if (condominio.status === "atencao" && total === 0) {
    return 1;
  }

  return total;
}

function aplicarOrdensAosCondominios() {
  condominios.forEach((condominio) => {
    const historicoAdministrativo = condominio.historico.filter(
      (registro) => !registro.origemFirestore,
    );

    const ordensRelacionadas = ordens.filter(
      (ordem) => obterCondominioIdDaOrdem(ordem) === condominio.id,
    );

    const historicoOperacional = ordensRelacionadas.map(criarHistoricoDaOrdem);

    condominio.historico = [
      ...historicoAdministrativo,
      ...historicoOperacional,
    ];

    condominio.pendencias = calcularPendenciasDoCondominio(
      condominio,
      ordensRelacionadas,
    );
  });
}

async function carregarDadosDeCondominiosDoFirestore() {
  const clientesQuery = query(
    collection(db, "usuarios"),
    where("role", "==", "cliente"),
  );

  const resultados = await Promise.allSettled([
    getDocs(collection(db, "condominios")),

    getDocs(clientesQuery),

    getDocs(collection(db, "ordens")),

    getDocs(collection(db, "ambientes")),

    getDocs(collection(db, "equipamentos")),
  ]);

  const [
    resultadoCondominios,
    resultadoClientes,
    resultadoOrdens,
    resultadoAmbientes,
    resultadoEquipamentos,
  ] = resultados;
  /* =========================================
     CATÁLOGO DE AMBIENTES
  ========================================= */

  ambientesCatalogo = [];

  if (resultadoAmbientes.status === "fulfilled") {
    ambientesCatalogo = resultadoAmbientes.value.docs
      .map(mapearAmbienteDoCatalogo)
      .sort((ambienteA, ambienteB) =>
        ambienteA.nome.localeCompare(ambienteB.nome, "pt-BR"),
      );
  } else {
    console.error(
      "[Condomínios] Não foi possível carregar o catálogo de ambientes:",
      resultadoAmbientes.reason,
    );
  }

  /* =========================================
     CATÁLOGO DE EQUIPAMENTOS
  ========================================= */

  equipamentosCatalogo = [];

  if (resultadoEquipamentos.status === "fulfilled") {
    equipamentosCatalogo = resultadoEquipamentos.value.docs
      .map(mapearEquipamentoDoCatalogo)
      .sort((equipamentoA, equipamentoB) =>
        equipamentoA.nome.localeCompare(equipamentoB.nome, "pt-BR"),
      );
  } else {
    console.error(
      "[Condomínios] Não foi possível carregar o catálogo de equipamentos:",
      resultadoEquipamentos.reason,
    );
  }
  /* =========================================
     CONDOMÍNIOS
  ========================================= */

  if (resultadoCondominios.status === "rejected") {
    console.error(
      "[Condomínios] Erro ao consultar a coleção condominios:",
      resultadoCondominios.reason,
    );

    throw resultadoCondominios.reason;
  }

  condominios = [];

  resultadoCondominios.value.docs.forEach((condominioSnapshot) => {
    try {
      const condominio = mapearCondominioDoFirestore(condominioSnapshot);

      condominios.push(condominio);
    } catch (error) {
      console.error(
        `[Condomínios] Erro ao interpretar o documento ${condominioSnapshot.id}:`,
        error,
        condominioSnapshot.data(),
      );
    }
  });

  /* =========================================
     CLIENTES
  ========================================= */

  clientes = [];

  if (resultadoClientes.status === "fulfilled") {
    resultadoClientes.value.docs.forEach((clienteSnapshot) => {
      try {
        clientes.push(mapearClienteDoFirestore(clienteSnapshot));
      } catch (error) {
        console.error(
          `[Condomínios] Erro ao interpretar o cliente ${clienteSnapshot.id}:`,
          error,
          clienteSnapshot.data(),
        );
      }
    });

    clientes.sort((clienteA, clienteB) =>
      clienteA.nome.localeCompare(clienteB.nome, "pt-BR"),
    );
  } else {
    console.error(
      "[Condomínios] Não foi possível carregar os clientes:",
      resultadoClientes.reason,
    );
  }

  /* =========================================
     ORDENS
  ========================================= */

  ordens = [];

  if (resultadoOrdens.status === "fulfilled") {
    resultadoOrdens.value.docs.forEach((ordemSnapshot) => {
      try {
        ordens.push({
          id: ordemSnapshot.id,
          ...ordemSnapshot.data(),
        });
      } catch (error) {
        console.error(
          `[Condomínios] Erro ao interpretar a ordem ${ordemSnapshot.id}:`,
          error,
        );
      }
    });
  } else {
    console.error(
      "[Condomínios] Não foi possível carregar as ordens:",
      resultadoOrdens.reason,
    );
  }

  atualizarStatusDosDocumentos();
  aplicarOrdensAosCondominios();

  console.info(
    `[Condomínios] ${condominios.length} condomínio(s), ` +
      `${clientes.length} cliente(s), ` +
      `${ordens.length} ordem(ns), ` +
      `${ambientesCatalogo.length} ambiente(s) e ` +
      `${equipamentosCatalogo.length} equipamento(s) carregados.`,
  );
}

async function sincronizarClientesIdsDosCondominios() {
  const condominiosParaAtualizar = condominios.filter((condominio) => {
    const clientesIdsEsperados = obterClientesIdsDosVinculos(condominio);

    return !listasDeIdsSaoIguais(condominio.clientesIds, clientesIdsEsperados);
  });

  if (condominiosParaAtualizar.length === 0) {
    console.info("[Condomínios] Índices de clientes já estão atualizados.");

    return;
  }

  await Promise.all(
    condominiosParaAtualizar.map(async (condominio) => {
      const clientesIds = obterClientesIdsDosVinculos(condominio);

      await setDoc(
        doc(db, "condominios", condominio.id),
        {
          clientesIds,
          atualizadoEm: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      condominio.clientesIds = clientesIds;
    }),
  );

  console.info(
    `[Condomínios] ${condominiosParaAtualizar.length} índice(s) de clientes atualizado(s).`,
  );
}

function criarOpcao(valor, texto) {
  const option = document.createElement("option");

  option.value = valor;
  option.textContent = texto;

  return option;
}

function popularFiltroDeCidades() {
  const valorAtual = cityFilter.value;

  cityFilter.innerHTML = "";

  cityFilter.appendChild(criarOpcao("", "Todas as cidades"));

  const cidades = new Map();

  condominios.forEach((condominio) => {
    const cidade = String(condominio.endereco?.cidade || "").trim();

    const slug = criarSlug(cidade);

    if (cidade && slug && !cidades.has(slug)) {
      cidades.set(slug, cidade);
    }
  });

  Array.from(cidades.entries())
    .sort(([, cidadeA], [, cidadeB]) => cidadeA.localeCompare(cidadeB, "pt-BR"))
    .forEach(([slug, cidade]) => {
      cityFilter.appendChild(criarOpcao(slug, cidade));
    });

  cityFilter.value = Array.from(cityFilter.options).some(
    (option) => option.value === valorAtual,
  )
    ? valorAtual
    : "";
}

function obterClientesFiltradosParaVinculo() {
  const termo = normalizarTexto(linkedClientSearch.value);

  if (!termo) {
    return [...clientes];
  }

  return clientes.filter((cliente) => {
    const conteudoPesquisavel = normalizarTexto(
      [cliente.nome, cliente.email, cliente.telefone].join(" "),
    );

    return conteudoPesquisavel.includes(termo);
  });
}

function popularSelectDeClientesVinculaveis() {
  const clienteSelecionado = linkedClientSelect.value;

  const termo = normalizarTexto(linkedClientSearch.value);

  const clientesFiltrados = obterClientesFiltradosParaVinculo();

  linkedClientSelect.innerHTML = "";

  const textoInicial = termo
    ? clientesFiltrados.length === 1
      ? "1 cliente encontrado"
      : `${clientesFiltrados.length} clientes encontrados`
    : "Selecione um cliente";

  linkedClientSelect.appendChild(criarOpcao("", textoInicial));

  if (clientesFiltrados.length === 0) {
    const opcaoSemResultados = criarOpcao("", "Nenhum cliente encontrado");

    opcaoSemResultados.disabled = true;

    linkedClientSelect.appendChild(opcaoSemResultados);

    return;
  }

  clientesFiltrados.forEach((cliente) => {
    const complemento = cliente.status === "inativo" ? " — Inativo" : "";

    linkedClientSelect.appendChild(
      criarOpcao(cliente.id, `${cliente.nome}${complemento}`),
    );
  });

  const clienteAindaEstaVisivel = Array.from(linkedClientSelect.options).some(
    (option) => option.value === clienteSelecionado,
  );

  linkedClientSelect.value = clienteAindaEstaVisivel ? clienteSelecionado : "";
}

function popularOpcoesDeClientes() {
  const responsavelAtual = managerFilter.value;

  managerFilter.innerHTML = "";

  managerFilter.appendChild(criarOpcao("", "Todos os responsáveis"));

  clientes.forEach((cliente) => {
    const complemento = cliente.status === "inativo" ? " — Inativo" : "";

    managerFilter.appendChild(
      criarOpcao(cliente.id, `${cliente.nome}${complemento}`),
    );
  });

  managerFilter.appendChild(criarOpcao("sem-responsavel", "Sem responsável"));

  managerFilter.value = Array.from(managerFilter.options).some(
    (option) => option.value === responsavelAtual,
  )
    ? responsavelAtual
    : "";

  popularSelectDeClientesVinculaveis();
}
function prepararEstruturaParaPersistencia(estrutura = []) {
  return normalizarEstruturaDeAmbientes(estrutura)
    .map((ambiente) => ({
      ambienteId: String(ambiente.ambienteId || "").trim(),

      ambienteNome: String(ambiente.ambienteNome || "Ambiente sem nome").trim(),

      categoria: String(ambiente.categoria || "Outros ambientes").trim(),

      observacao: String(ambiente.observacao || "").trim(),

      legado: Boolean(ambiente.legado),

      equipamentos: Array.isArray(ambiente.equipamentos)
        ? ambiente.equipamentos
            .map((equipamento) => ({
              equipamentoId: String(equipamento.equipamentoId || "").trim(),

              equipamentoNome: String(
                equipamento.equipamentoNome ||
                  equipamento.equipamentoId ||
                  "Equipamento sem nome",
              ).trim(),

              categoria: String(
                equipamento.categoria || "Outros equipamentos",
              ).trim(),

              quantidade: Math.max(1, Number(equipamento.quantidade) || 1),

              observacao: String(equipamento.observacao || "").trim(),
            }))
            .filter((equipamento) => equipamento.equipamentoId)
        : [],
    }))
    .filter((ambiente) => ambiente.ambienteId);
}
function montarDadosDoCondominio(condominio, novoCadastro) {
  const historicoPersistido = condominio.historico
    .filter((registro) => !registro.origemFirestore)
    .map(({ origemFirestore, ...registro }) => registro);

  const estruturaAmbientes = prepararEstruturaParaPersistencia(
    condominio.estruturaAmbientes,
  );

  const equipamentosDaEstrutura =
    obterEquipamentosIdsDaEstrutura(estruturaAmbientes);

  /*
    Quando existe nova estrutura, ela passa
    a ser a fonte principal dos equipamentos.

    Caso um cadastro antigo seja salvo antes
    de a estrutura ser preparada, o array
    antigo continua preservado.
  */
  const equipamentos =
    estruturaAmbientes.length > 0
      ? equipamentosDaEstrutura
      : normalizarListaDeIds(condominio.equipamentos);

  const dados = {
    id: condominio.id,

    codigo: condominio.codigo,

    nome: condominio.nome,

    cnpj: condominio.cnpj,

    status: condominio.status,

    blocos: condominio.blocos,

    unidades: condominio.unidades,

    endereco: {
      ...condominio.endereco,
    },

    observacoes: condominio.observacoes,

    clientesVinculados: condominio.clientesVinculados.map((vinculo) => ({
      ...vinculo,

      nome: String(
        vinculo.nome || obterClientePorId(vinculo.clienteId)?.nome || "",
      ).trim(),
    })),

    clientesIds: obterClientesIdsDosVinculos(condominio),

    /*
      Estrutura nova.
    */
    estruturaAmbientes,

    /*
      Campo antigo mantido durante toda
      a migração para não quebrar vistorias,
      filtros ou outras telas existentes.
    */
    equipamentos,

    documentos: condominio.documentos.map((documento) => ({
      ...documento,

      status: atualizarStatusDocumento(documento),
    })),

    historico: historicoPersistido,

    atualizadoEm: serverTimestamp(),
  };

  if (novoCadastro) {
    dados.criadoEm = serverTimestamp();
  }

  return dados;
}

async function salvarCondominioNoFirestore(condominio, novoCadastro) {
  const condominioReference = doc(db, "condominios", condominio.id);

  /*
    Uma edição comum não utiliza nem altera
    o contador de condomínios.
  */
  if (!novoCadastro) {
    const dados = montarDadosDoCondominio(condominio, false);

    await setDoc(condominioReference, dados, {
      merge: true,
    });

    return;
  }

  const contadorReference = doc(db, "contadores", "condominios");

  /*
    Número mais alto encontrado nos cadastros
    que já existem. Nenhum deles será alterado.
  */
  const maiorNumeroExistente = obterMaiorNumeroDeCondominioCadastrado();

  await runTransaction(db, async (transaction) => {
    const contadorSnapshot = await transaction.get(contadorReference);

    const numeroDoContador = contadorSnapshot.exists()
      ? Math.max(0, Number(contadorSnapshot.data().ultimoNumero) || 0)
      : 0;

    /*
        Usa sempre o maior valor entre:
        - contador salvo;
        - códigos já existentes.

        Assim o contador nunca volta para trás.
      */
    const ultimoNumero = Math.max(numeroDoContador, maiorNumeroExistente);

    const proximoNumero = ultimoNumero + 1;

    const codigoDefinitivo = formatarCodigoCondominio(proximoNumero);

    condominio.codigo = codigoDefinitivo;

    const dadosDoNovoCondominio = montarDadosDoCondominio(condominio, true);

    transaction.set(
      contadorReference,
      {
        ultimoNumero: proximoNumero,

        ultimoDocumentoId: condominio.id,

        atualizadoEm: serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    transaction.set(condominioReference, dadosDoNovoCondominio);
  });
}
/* =========================================
   DOCUMENTOS
========================================= */

function atualizarStatusDocumento(documento) {
  if (!documento?.vencimento) {
    return "regular";
  }

  const vencimento = criarDataLocal(documento.vencimento);

  if (!vencimento || Number.isNaN(vencimento.getTime())) {
    return "pendente";
  }

  const hoje = obterInicioDoDia();

  if (vencimento < hoje) {
    return "vencido";
  }

  return "regular";
}

function atualizarStatusDosDocumentos() {
  condominios.forEach((condominio) => {
    const documentos = Array.isArray(condominio.documentos)
      ? condominio.documentos
      : [];

    documentos.forEach((documento) => {
      documento.status = atualizarStatusDocumento(documento);
    });
  });
}

function obterSituacaoDocumental(condominio) {
  const documentos = Array.isArray(condominio.documentos)
    ? condominio.documentos
    : [];

  if (documentos.length === 0) {
    return "sem-documentos";
  }

  const possuiVencido = documentos.some(
    (documento) => atualizarStatusDocumento(documento) === "vencido",
  );

  if (possuiVencido) {
    return "vencida";
  }

  const possuiPendente = documentos.some(
    (documento) => atualizarStatusDocumento(documento) === "pendente",
  );

  if (possuiPendente) {
    return "pendente";
  }

  return "regular";
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const condominiosVisiveis = condominios.filter(
    (condominio) => condominio.status !== "inativo",
  );

  const total = condominiosVisiveis.length;

  const ativos = condominiosVisiveis.filter(
    (condominio) => condominio.status === "ativo",
  ).length;

  const equipamentos = condominiosVisiveis.reduce(
    (totalAtual, condominio) => totalAtual + condominio.equipamentos.length,
    0,
  );

  const comAtencao = condominiosVisiveis.filter(
    (condominio) =>
      condominio.status === "atencao" || condominio.pendencias > 0,
  ).length;

  summaryTotal.textContent = String(total);

  summaryActive.textContent = String(ativos);

  summaryEquipment.textContent = String(equipamentos);

  summaryAttention.textContent = String(comAtencao);
}

/* =========================================
   ABAS DA LISTAGEM
========================================= */

function correspondeAAba(condominio) {
  const filtroSolicitaInativos = filtrosAplicados.status === "inativo";

  /*
   * Quando o administrador escolhe Inativo nos filtros,
   * o filtro assume prioridade sobre os cards do topo.
   */
  if (filtroSolicitaInativos) {
    return true;
  }

  /*
   * Condomínios inativos ficam escondidos dos cards
   * Total, Ativos, Equipamentos e Com atenção.
   */
  if (condominio.status === "inativo") {
    return false;
  }

  if (abaAtual === "todos") {
    return true;
  }

  if (abaAtual === "ativos") {
    return condominio.status === "ativo";
  }

  if (abaAtual === "com-equipamentos") {
    return condominio.equipamentos.length > 0;
  }

  if (abaAtual === "atencao") {
    return condominio.status === "atencao" || condominio.pendencias > 0;
  }

  if (abaAtual === "inativos") {
    return condominio.status === "inativo";
  }

  return true;
}

function atualizarAbas() {
  statusTabButtons.forEach((button) => {
    const ativo = button.dataset.statusTab === abaAtual;

    button.classList.toggle("is-active", ativo);

    button.setAttribute("aria-pressed", String(ativo));
  });

  const configuracao = abasConfig[abaAtual] || abasConfig.todos;

  condominiumsContentEyebrow.textContent = configuracao.subtitulo;

  condominiumsContentTitle.textContent = configuracao.titulo;
}

function alterarAba(novaAba) {
  if (!ABAS_PERMITIDAS.includes(novaAba)) {
    return;
  }

  abaAtual = novaAba;

  atualizarAbas();

  fecharTodosOsCards();

  renderizarCondominios();
}

/* =========================================
   CARDS DE RESUMO
========================================= */

function selecionarResumo(novaAba) {
  if (!abasConfig[novaAba]) {
    return;
  }

  const deveRecolher = resumoSelecionado === novaAba;

  resumoSelecionado = deveRecolher ? null : novaAba;

  summaryFilterButtons.forEach((button) => {
    const estaAtivo = button.dataset.summaryFilter === resumoSelecionado;

    button.classList.toggle("is-active", estaAtivo);

    button.setAttribute("aria-pressed", String(estaAtivo));
  });

  condominiumsOverviewHint.hidden = Boolean(resumoSelecionado);

  if (!resumoSelecionado) {
    fecharFiltros();

    renderizarCondominios();

    return;
  }

  abaAtual = resumoSelecionado;

  atualizarAbas();

  fecharFiltros();

  fecharTodosOsCards();

  renderizarCondominios();

  window.requestAnimationFrame(() => {
    condominiumsContent.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

/* =========================================
   PESQUISA
========================================= */

function correspondeAPesquisa(condominio) {
  const pesquisa = normalizarTexto(condominiumsSearch.value);

  if (!pesquisa) {
    return true;
  }

  const clientes = condominio.clientesVinculados
    .map((vinculo) => obterNomeCliente(vinculo.clienteId))
    .join(" ");

  const conteudo = normalizarTexto(
    [
      condominio.codigo,
      condominio.nome,
      condominio.cnpj,
      obterEnderecoCompleto(condominio),
      clientes,
      condominio.observacoes,
    ].join(" "),
  );

  return conteudo.includes(pesquisa);
}

/* =========================================
   FILTROS
========================================= */

function condominioTemEquipamento(condominio, filtro) {
  if (!filtro) {
    return true;
  }

  const equipamentos = condominio.equipamentos;

  if (filtro === "elevador") {
    return equipamentos.some((item) => item.startsWith("elevador"));
  }

  if (filtro === "bomba") {
    return equipamentos.includes("bombas");
  }

  if (filtro === "portao") {
    return equipamentos.includes("portao-automatico");
  }

  if (filtro === "piscina") {
    return equipamentos.includes("piscina");
  }

  if (filtro === "gerador") {
    return equipamentos.includes("gerador");
  }

  if (filtro === "sistema-incendio") {
    return [
      "extintores",
      "hidrantes",
      "alarme-incendio",
      "sinalizacao-emergencia",
    ].some((item) => equipamentos.includes(item));
  }

  return equipamentos.includes(filtro);
}

function correspondeAosFiltros(condominio) {
  const statusCorresponde =
    !filtrosAplicados.status || condominio.status === filtrosAplicados.status;

  const cidadeCorresponde =
    !filtrosAplicados.cidade ||
    criarSlug(condominio.endereco.cidade) === filtrosAplicados.cidade;

  let responsavelCorresponde = true;

  if (filtrosAplicados.responsavel === "sem-responsavel") {
    responsavelCorresponde = condominio.clientesVinculados.length === 0;
  } else if (filtrosAplicados.responsavel) {
    responsavelCorresponde = condominio.clientesVinculados.some(
      (vinculo) => vinculo.clienteId === filtrosAplicados.responsavel,
    );
  }

  const equipamentoCorresponde = condominioTemEquipamento(
    condominio,
    filtrosAplicados.equipamento,
  );

  const documentoCorresponde =
    !filtrosAplicados.documento ||
    obterSituacaoDocumental(condominio) === filtrosAplicados.documento;

  return (
    statusCorresponde &&
    cidadeCorresponde &&
    responsavelCorresponde &&
    equipamentoCorresponde &&
    documentoCorresponde
  );
}

function obterCondominiosFiltrados() {
  return condominios
    .filter(correspondeAAba)
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros)
    .sort((condominioA, condominioB) => {
      const numeroA =
        Number(String(condominioA.codigo || "").match(/\d+/)?.[0]) || 0;

      const numeroB =
        Number(String(condominioB.codigo || "").match(/\d+/)?.[0]) || 0;

      /*
    Ordena do maior código para o menor:
    COND-0026, COND-0025, COND-0024...
  */
      if (numeroA !== numeroB) {
        return numeroB - numeroA;
      }

      /*
    Caso dois registros tenham o mesmo número
    ou não possuam código numérico.
  */
      return condominioA.nome.localeCompare(condominioB.nome, "pt-BR");
    });
}

function contarFiltrosAtivos() {
  return Object.values(filtrosAplicados).filter(Boolean).length;
}

function atualizarContagemDeFiltros() {
  const quantidade = contarFiltrosAtivos();

  activeFilterCount.textContent = String(quantidade);

  activeFilterCount.hidden = quantidade === 0;
}

function sincronizarFormularioComFiltros() {
  statusFilter.value = filtrosAplicados.status;

  cityFilter.value = filtrosAplicados.cidade;

  managerFilter.value = filtrosAplicados.responsavel;

  equipmentFilter.value = filtrosAplicados.equipamento;

  documentFilter.value = filtrosAplicados.documento;
}

function criarChipDeFiltro(texto, removerFiltro) {
  const chip = document.createElement("span");

  chip.className = "active-filter-chip";

  const label = document.createElement("span");

  label.textContent = texto;

  const button = document.createElement("button");

  button.type = "button";

  button.textContent = "×";

  button.setAttribute("aria-label", `Remover filtro ${texto}`);

  button.addEventListener("click", removerFiltro);

  chip.append(label, button);

  return chip;
}

function finalizarRemocaoDeFiltro() {
  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarCondominios();
}

function renderizarFiltrosAtivos() {
  activeFiltersList.innerHTML = "";
  if (filtrosAplicados.status) {
    const texto =
      statusConfig[filtrosAplicados.status]?.nome || filtrosAplicados.status;

    activeFiltersList.appendChild(
      criarChipDeFiltro(texto, () => {
        filtrosAplicados.status = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.cidade) {
    const texto = obterNomeCidadePorSlug(filtrosAplicados.cidade);

    activeFiltersList.appendChild(
      criarChipDeFiltro(texto, () => {
        filtrosAplicados.cidade = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.responsavel) {
    const texto =
      filtrosAplicados.responsavel === "sem-responsavel"
        ? "Sem responsável"
        : obterNomeCliente(filtrosAplicados.responsavel);

    activeFiltersList.appendChild(
      criarChipDeFiltro(texto, () => {
        filtrosAplicados.responsavel = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.equipamento) {
    const texto =
      equipamentoFiltroConfig[filtrosAplicados.equipamento] ||
      filtrosAplicados.equipamento;

    activeFiltersList.appendChild(
      criarChipDeFiltro(texto, () => {
        filtrosAplicados.equipamento = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.documento) {
    const texto =
      documentoFiltroConfig[filtrosAplicados.documento] ||
      filtrosAplicados.documento;

    activeFiltersList.appendChild(
      criarChipDeFiltro(texto, () => {
        filtrosAplicados.documento = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  activeFiltersList.hidden = activeFiltersList.children.length === 0;
}

function abrirFiltros() {
  filterPanel.hidden = false;

  openFilterButton.setAttribute("aria-expanded", "true");

  filterPanel.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

function fecharFiltros() {
  filterPanel.hidden = true;

  openFilterButton.setAttribute("aria-expanded", "false");
}

function aplicarFiltros() {
  filtrosAplicados = {
    status: statusFilter.value,

    cidade: cityFilter.value,

    responsavel: managerFilter.value,

    equipamento: equipmentFilter.value,

    documento: documentFilter.value,
  };

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarCondominios();

  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparPesquisaEFiltros() {
  condominiumsSearch.value = "";

  statusFilter.value = "";

  filtrosAplicados = {
    status: "",
    cidade: "",
    responsavel: "",
    equipamento: "",
    documento: "",
  };

  abaAtual = resumoSelecionado || "todos";

  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  atualizarAbas();

  fecharFiltros();

  renderizarCondominios();

  mostrarFeedback("Pesquisa e filtros removidos.");
}

/* =========================================
   HISTÓRICO DO CONDOMÍNIO
========================================= */

function obterUltimoRegistroPorTipo(condominio, tipo) {
  const registros = condominio.historico
    .filter((registro) => registro.tipo === tipo)
    .sort(
      (registroA, registroB) =>
        criarDataLocal(registroB.data) - criarDataLocal(registroA.data),
    );

  return registros[0] || null;
}

function criarItemHistorico(registro) {
  const article = document.createElement("article");

  article.className = "history-item";

  const icon = document.createElement("span");

  icon.className = "history-item__icon";

  const simbolos = {
    ordem: "OS",
    vistoria: "VI",
    documento: "DO",
    cadastro: "CA",
  };

  icon.textContent = simbolos[registro.tipo] || "HI";

  const content = document.createElement("div");

  content.className = "history-item__content";

  const top = document.createElement("div");

  top.className = "history-item__top";

  const title = document.createElement("strong");

  title.className = "history-item__title";

  title.textContent = registro.titulo;

  const date = document.createElement("span");

  date.className = "history-item__date";

  date.textContent = formatarData(registro.data);

  const description = document.createElement("p");

  description.className = "history-item__description";

  description.textContent = registro.descricao || "Sem descrição adicional.";

  top.append(title, date);

  content.append(top, description);

  article.append(icon, content);

  return article;
}

/* =========================================
   CARDS DA LISTAGEM
========================================= */

function fecharCard(card) {
  const details = card.querySelector(".condominium-card__details");

  const toggle = card.querySelector(".condominium-card__toggle");

  details.hidden = true;

  toggle.setAttribute("aria-expanded", "false");

  toggle.setAttribute("aria-label", "Mostrar informações do condomínio");

  card.classList.remove("is-expanded");
}

function fecharTodosOsCards(excecao = null) {
  document.querySelectorAll(".condominium-card").forEach((card) => {
    if (card !== excecao) {
      fecharCard(card);
    }
  });
}

function alternarCard(card) {
  const details = card.querySelector(".condominium-card__details");

  const toggle = card.querySelector(".condominium-card__toggle");

  const seraAberto = details.hidden;

  if (seraAberto) {
    fecharTodosOsCards(card);

    details.hidden = false;

    toggle.setAttribute("aria-expanded", "true");

    toggle.setAttribute("aria-label", "Ocultar informações do condomínio");

    card.classList.add("is-expanded");
  } else {
    fecharCard(card);
  }
}

function abrirNovaOrdem(condominio) {
  const parametros = new URLSearchParams({
    perfil: "admin",
    condominio: condominio.id,
  });

  window.location.href = `nova-ordem.html?${parametros.toString()}`;
}

function abrirNovaVistoria(condominio) {
  const parametros = new URLSearchParams({
    perfil: "admin",
    condominio: condominio.id,
    origem: "condominio",
  });

  window.location.href = `nova-vistoria.html?${parametros.toString()}`;
}
/* =========================================
   ATIVAÇÃO VISUAL DO CONDOMÍNIO
========================================= */

async function alternarStatusDoCondominio(condominio) {
  const condominioEstaInativo = condominio.status === "inativo";

  const novoStatus = condominioEstaInativo ? "ativo" : "inativo";

  const mensagem = condominioEstaInativo
    ? `Deseja reativar o condomínio "${condominio.nome}"?`
    : `Deseja desativar o condomínio "${condominio.nome}" da listagem?\n\nNenhum cliente, ordem, vistoria ou histórico será apagado.`;

  const confirmou = window.confirm(mensagem);

  if (!confirmou) {
    return;
  }

  try {
    await setDoc(
      doc(db, "condominios", condominio.id),
      {
        status: novoStatus,
        atualizadoEm: serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    await carregarDadosDeCondominiosDoFirestore();

    popularFiltroDeCidades();
    popularOpcoesDeClientes();

    atualizarResumo();
    atualizarAbas();
    renderizarFiltrosAtivos();
    renderizarCondominios();

    mostrarFeedback(
      condominioEstaInativo
        ? "Condomínio reativado."
        : "Condomínio desativado da listagem.",
    );
  } catch (error) {
    console.error("[Condomínios] Não foi possível alterar o status:", error);

    mostrarFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a alteração."
        : "Não foi possível alterar o condomínio.",
    );
  }
}
function preencherCard(condominio) {
  const fragmento = condominiumCardTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".condominium-card");

  const code = card.querySelector(".condominium-card__code");

  const status = card.querySelector(".condominium-card__status");

  const name = card.querySelector(".condominium-card__name");

  const manager = card.querySelector(".condominium-card__manager");

  const city = card.querySelector(".condominium-card__city");

  const equipmentCount = card.querySelector(
    ".condominium-card__equipment-count",
  );

  const attentionCount = card.querySelector(
    ".condominium-card__attention-count",
  );

  const toggle = card.querySelector(".condominium-card__toggle");

  const details = card.querySelector(".condominium-card__details");

  const address = card.querySelector(".condominium-card__address");

  const contact = card.querySelector(".condominium-card__contact");

  const lastInspection = card.querySelector(
    ".condominium-card__last-inspection",
  );

  const lastOrder = card.querySelector(".condominium-card__last-order");

  const orderButton = card.querySelector('[data-condominium-action="order"]');

  const inspectionButton = card.querySelector(
    '[data-condominium-action="inspection"]',
  );

  const openButton = card.querySelector('[data-condominium-action="open"]');

  const statusActionButton = card.querySelector(
    '[data-condominium-action="status"]',
  );
  const statusData = statusConfig[condominio.status] || statusConfig.ativo;

  const principal = obterClientePrincipal(condominio);

  const ultimaVistoria = obterUltimoRegistroPorTipo(condominio, "vistoria");

  const ultimaOrdem = obterUltimoRegistroPorTipo(condominio, "ordem");

  card.dataset.condominiumId = condominio.id;

  code.textContent = condominio.codigo;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);
  const condominioEstaInativo = condominio.status === "inativo";

  statusActionButton.classList.toggle("is-reactivate", condominioEstaInativo);

  statusActionButton.setAttribute(
    "aria-label",
    condominioEstaInativo
      ? `Reativar condomínio ${condominio.nome}`
      : `Desativar condomínio ${condominio.nome}`,
  );

  statusActionButton.setAttribute(
    "title",
    condominioEstaInativo ? "Reativar condomínio" : "Desativar condomínio",
  );

  statusActionButton.innerHTML = condominioEstaInativo
    ? `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11a8 8 0 1 0-2.34 5.66"></path>
      <path d="M20 4v7h-7"></path>
    </svg>
  `
    : `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16"></path>
      <path d="M9 7V4h6v3"></path>
      <path d="m7 7 1 13h8l1-13"></path>
      <path d="M10 11v5"></path>
      <path d="M14 11v5"></path>
    </svg>
  `;

  name.textContent = condominio.nome;

  manager.textContent = obterNomeResponsavel(condominio);

  city.textContent = condominio.endereco.cidade || "Cidade não informada";

  equipmentCount.textContent = formatarQuantidade(
    condominio.equipamentos.length,
    "equipamento",
    "equipamentos",
  );

  attentionCount.textContent =
    condominio.pendencias > 0
      ? formatarQuantidade(condominio.pendencias, "pendência", "pendências")
      : "Sem pendências";

  attentionCount.classList.toggle("has-attention", condominio.pendencias > 0);

  address.textContent =
    obterEnderecoCompleto(condominio) || "Endereço não informado";

  contact.textContent = principal
    ? obterNomeCliente(principal.clienteId)
    : "Sem contato principal";

  lastInspection.textContent = ultimaVistoria
    ? formatarDataCompleta(ultimaVistoria.data)
    : "Nenhuma vistoria";

  lastOrder.textContent = ultimaOrdem ? ultimaOrdem.titulo : "Nenhuma ordem";

  const detailId = `condominium-details-${condominio.id}`;

  details.id = detailId;

  toggle.setAttribute("aria-controls", detailId);

  toggle.setAttribute(
    "aria-label",
    `Mostrar informações de ${condominio.nome}`,
  );

  toggle.addEventListener("click", () => {
    alternarCard(card);
  });

  orderButton.addEventListener("click", () => {
    abrirNovaOrdem(condominio);
  });

  inspectionButton.addEventListener("click", () => {
    abrirNovaVistoria(condominio);
  });

  openButton.addEventListener("click", () => {
    abrirModalDeCondominio(condominio);
  });
  statusActionButton.addEventListener("click", () => {
    alternarStatusDoCondominio(condominio);
  });

  return fragmento;
}

function renderizarCondominios() {
  if (!resumoSelecionado) {
    condominiumsTools.hidden = true;

    condominiumsContent.hidden = true;

    condominiumsList.innerHTML = "";

    emptyState.hidden = true;

    return;
  }

  condominiumsTools.hidden = false;

  condominiumsContent.hidden = false;

  const lista = obterCondominiosFiltrados();

  condominiumsList.innerHTML = "";

  lista.forEach((condominio) => {
    condominiumsList.appendChild(preencherCard(condominio));
  });

  condominiumsCount.textContent = formatarQuantidade(lista.length);

  const listaVazia = lista.length === 0;

  condominiumsList.hidden = listaVazia;

  emptyState.hidden = !listaVazia;
}

/* =========================================
   ABAS DO MODAL
========================================= */

function alterarAbaDoModal(novaAba) {
  abaAtualModal = novaAba;

  modalTabButtons.forEach((button) => {
    const ativo = button.dataset.modalTab === novaAba;

    button.classList.toggle("is-active", ativo);

    button.setAttribute("aria-pressed", String(ativo));
  });

  modalTabPanels.forEach((panel) => {
    const ativo = panel.dataset.modalPanel === novaAba;

    panel.hidden = !ativo;

    panel.classList.toggle("is-active", ativo);
  });
}

/* =========================================
   FORMULÁRIO DO CONDOMÍNIO
========================================= */

function criarCondominioVazio() {
  const identificadores = gerarIdentificadores();

  return {
    id: identificadores.id,

    codigo: identificadores.codigo,

    nome: "",

    cnpj: "",

    status: "ativo",

    blocos: 1,

    unidades: 0,

    endereco: {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "SP",
    },

    observacoes: "",

    clientesVinculados: [],

    clientesIds: [],

    equipamentos: [],

    estruturaAmbientes: [],

    documentos: [],

    historico: [],

    pendencias: 0,

    criadoEm: obterDataISO(),

    atualizadoEm: obterDataISO(),
  };
}

function preencherFormulario(condominio) {
  condominiumId.value = condominio.id;

  condominiumName.value = condominio.nome || "";

  condominiumCode.value = condominio.codigo || "";

  condominiumDocument.value = condominio.cnpj || "";

  condominiumStatus.value = condominio.status || "ativo";

  condominiumBlocks.value = condominio.blocos ?? 1;

  condominiumUnits.value = condominio.unidades ?? 0;

  condominiumZipCode.value = condominio.endereco.cep || "";

  condominiumStreet.value = condominio.endereco.logradouro || "";

  condominiumNumber.value = condominio.endereco.numero || "";

  condominiumComplement.value = condominio.endereco.complemento || "";

  condominiumNeighborhood.value = condominio.endereco.bairro || "";

  condominiumCity.value = condominio.endereco.cidade || "";

  condominiumState.value = condominio.endereco.estado || "SP";

  condominiumNotes.value = condominio.observacoes || "";

  equipmentInputs.forEach((input) => {
    input.checked = condominio.equipamentos.includes(input.value);
  });

  renderizarClientesVinculados();

  renderizarEstruturaDeAmbientes();

  renderizarDocumentos();

  renderizarHistorico();
}

function coletarDadosDoFormulario() {
  condominioRascunho.nome = condominiumName.value.trim();

  /*
  O código não é coletado do formulário.
  Um condomínio existente mantém seu código
  e um novo recebe o código pela transação.
*/
  if (condominioEmEdicaoId) {
    const condominioOriginal = obterCondominioPorId(condominioEmEdicaoId);

    condominioRascunho.codigo =
      condominioOriginal?.codigo || condominioRascunho.codigo;
  }

  condominioRascunho.cnpj = condominiumDocument.value.trim();

  condominioRascunho.status = condominiumStatus.value;

  condominioRascunho.blocos = Math.max(0, Number(condominiumBlocks.value) || 0);

  condominioRascunho.unidades = Math.max(
    0,
    Number(condominiumUnits.value) || 0,
  );

  condominioRascunho.endereco = {
    cep: condominiumZipCode.value.trim(),

    logradouro: condominiumStreet.value.trim(),

    numero: condominiumNumber.value.trim(),

    complemento: condominiumComplement.value.trim(),

    bairro: condominiumNeighborhood.value.trim(),

    cidade: condominiumCity.value.trim(),

    estado: condominiumState.value,
  };

  condominioRascunho.observacoes = condominiumNotes.value.trim();

  condominioRascunho.estruturaAmbientes = prepararEstruturaParaPersistencia(
    obterEstruturaDoCondominioRascunho(),
  );

  condominioRascunho.equipamentos = obterEquipamentosIdsDaEstrutura(
    condominioRascunho.estruturaAmbientes,
  );

  sincronizarEquipamentosAntigosComEstrutura();

  condominioRascunho.atualizadoEm = obterDataISO();
}

function abrirModalDeCondominio(condominio = null) {
  condominioEmEdicaoId = condominio?.id || null;

  condominioRascunho = condominio
    ? clonarDados(condominio)
    : criarCondominioVazio();

  limparFormularioUploadDocumento();

  documentUploadPanel.hidden = true;

  addDocumentButton.setAttribute("aria-expanded", "false");

  linkedClientSearch.value = "";

  popularSelectDeClientesVinculaveis();

  condominiumModalEyebrow.textContent = condominio
    ? "Editar cadastro"
    : "Novo cadastro";

  condominiumModalTitle.textContent = condominio
    ? condominio.nome
    : "Novo condomínio";

  preencherFormulario(condominioRascunho);

  alterarAbaDoModal("general");

  condominiumModal.hidden = false;

  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    condominiumName.focus();
  }, 50);
}

function fecharModalDeCondominio() {
  if (uploadDocumentoEmAndamento || acaoDocumentoEmAndamento) {
    mostrarFeedback("Aguarde a operação do documento terminar.");

    return;
  }

  fecharPainelUploadDocumento({
    forcar: true,
  });

  condominiumModal.hidden = true;

  document.body.classList.remove("modal-open");

  condominiumForm.reset();

  condominioRascunho = null;

  condominioEmEdicaoId = null;

  linkedClientSelect.value = "";

  linkedClientRole.value = "sindico";

  linkedClientPrimary.checked = false;

  linkedClientFinancial.checked = false;

  const urlAtual = new URL(window.location.href);

  if (urlAtual.searchParams.has("condominio")) {
    urlAtual.searchParams.delete("condominio");

    window.history.replaceState(
      {},
      "",
      `${urlAtual.pathname}${urlAtual.search}${urlAtual.hash}`,
    );
  }
}

async function salvarCondominio(event) {
  event.preventDefault();

  if (!condominioRascunho) {
    return;
  }

  if (uploadDocumentoEmAndamento || acaoDocumentoEmAndamento) {
    mostrarFeedback("Aguarde a operação do documento terminar.");

    return;
  }

  coletarDadosDoFormulario();

  if (!condominioRascunho.nome) {
    mostrarFeedback("Informe o nome do condomínio.");

    alterarAbaDoModal("general");

    condominiumName.focus();

    return;
  }

  const estavaEditando = Boolean(condominioEmEdicaoId);

  condominioRascunho.historico.unshift({
    id: gerarIdHistorico(),

    tipo: "cadastro",

    titulo: estavaEditando ? "Cadastro atualizado" : "Condomínio cadastrado",

    descricao: estavaEditando
      ? "As informações do condomínio foram atualizadas."
      : "O condomínio foi adicionado ao sistema.",

    data: obterDataISO(),

    origemFirestore: false,
  });

  const botaoSalvar = condominiumForm.querySelector('button[type="submit"]');

  const textoOriginal = botaoSalvar?.textContent || "Salvar condomínio";

  if (botaoSalvar) {
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
  }

  try {
    /* Primeiro salva. Se esta etapa falhar,
       nada foi gravado no Firestore. */

    await salvarCondominioNoFirestore(condominioRascunho, !estavaEditando);
  } catch (error) {
    console.error("[Condomínios] O Firestore recusou a gravação:", error);

    mostrarFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a gravação. Revise as regras do Firestore."
        : "Não foi possível gravar o condomínio no Firebase.",
    );

    if (botaoSalvar) {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = textoOriginal;
    }

    return;
  }

  try {
    /* A gravação já terminou. Agora somente
       recarregamos os dados para atualizar a tela. */

    await carregarDadosDeCondominiosDoFirestore();

    try {
      await sincronizarClientesIdsDosCondominios();
    } catch (error) {
      console.error(
        "[Condomínios] Não foi possível atualizar os índices de clientes:",
        error,
      );
    }
  } catch (error) {
    console.error(
      "[Condomínios] O condomínio foi salvo, mas a listagem não pôde ser recarregada:",
      error,
    );

    const condominioLocal = clonarDados(condominioRascunho);

    const indiceExistente = condominios.findIndex(
      (condominio) => condominio.id === condominioLocal.id,
    );

    if (indiceExistente >= 0) {
      condominios[indiceExistente] = condominioLocal;
    } else {
      condominios.push(condominioLocal);
    }
  }

  fecharModalDeCondominio();

  popularFiltroDeCidades();
  popularOpcoesDeClientes();
  atualizarAbas();
  atualizarResumo();
  renderizarFiltrosAtivos();
  renderizarCondominios();

  mostrarFeedback(
    estavaEditando
      ? "Condomínio atualizado com sucesso."
      : "Condomínio cadastrado com sucesso.",
  );

  if (botaoSalvar) {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = textoOriginal;
  }
}

/* =========================================
   CLIENTES VINCULADOS
========================================= */

function renderizarClientesVinculados() {
  linkedClientsList.innerHTML = "";

  if (!condominioRascunho) {
    return;
  }

  const vinculos = condominioRascunho.clientesVinculados;

  linkedClientsCount.textContent = formatarQuantidade(
    vinculos.length,
    "vínculo",
    "vínculos",
  );

  linkedClientsEmpty.hidden = vinculos.length > 0;

  linkedClientsList.hidden = vinculos.length === 0;

  vinculos.forEach((vinculo) => {
    const fragmento = linkedClientTemplate.content.cloneNode(true);

    const card = fragmento.querySelector(".linked-client-card");

    const avatar = card.querySelector(".linked-client-card__avatar");

    const name = card.querySelector(".linked-client-card__name");

    const role = card.querySelector(".linked-client-card__role");

    const primaryBadge = card.querySelector("[data-primary-badge]");

    const financialBadge = card.querySelector("[data-financial-badge]");

    const removeButton = card.querySelector(".linked-client-card__remove");

    const cliente = obterClientePorId(vinculo.clienteId);

    avatar.textContent = cliente?.iniciais || "CL";

    name.textContent = cliente?.nome || "Cliente não identificado";

    role.textContent = papelConfig[vinculo.papel] || "Responsável";

    primaryBadge.hidden = !vinculo.contatoPrincipal;

    financialBadge.hidden = !vinculo.responsavelFinanceiro;

    removeButton.setAttribute("aria-label", `Desvincular ${name.textContent}`);

    removeButton.addEventListener("click", () => {
      condominioRascunho.clientesVinculados =
        condominioRascunho.clientesVinculados.filter(
          (item) =>
            !(
              item.clienteId === vinculo.clienteId &&
              item.papel === vinculo.papel
            ),
        );

      renderizarClientesVinculados();

      mostrarFeedback("Cliente desvinculado do condomínio.");
    });

    linkedClientsList.appendChild(fragmento);
  });
}

function vincularCliente() {
  if (!condominioRascunho) {
    return;
  }

  const clienteId = linkedClientSelect.value;

  const papel = linkedClientRole.value;

  if (!clienteId) {
    mostrarFeedback("Selecione um cliente para vincular.");

    linkedClientSelect.focus();

    return;
  }

  const jaVinculado = condominioRascunho.clientesVinculados.some(
    (vinculo) => vinculo.clienteId === clienteId && vinculo.papel === papel,
  );

  if (jaVinculado) {
    mostrarFeedback("Esse cliente já possui esse vínculo.");

    return;
  }

  if (linkedClientPrimary.checked) {
    condominioRascunho.clientesVinculados.forEach((vinculo) => {
      vinculo.contatoPrincipal = false;
    });
  }

  if (linkedClientFinancial.checked) {
    condominioRascunho.clientesVinculados.forEach((vinculo) => {
      vinculo.responsavelFinanceiro = false;
    });
  }

  const clienteSelecionado = obterClientePorId(clienteId);

  condominioRascunho.clientesVinculados.push({
    clienteId,

    nome: String(clienteSelecionado?.nome || "").trim(),

    papel,

    contatoPrincipal: linkedClientPrimary.checked,

    responsavelFinanceiro: linkedClientFinancial.checked,
  });

  linkedClientSearch.value = "";

  popularSelectDeClientesVinculaveis();

  linkedClientRole.value = "sindico";

  linkedClientPrimary.checked = false;

  linkedClientFinancial.checked = false;

  renderizarClientesVinculados();
}

/* =========================================
   AMBIENTES E EQUIPAMENTOS
========================================= */

function obterEstruturaDoCondominioRascunho() {
  if (!condominioRascunho) {
    return [];
  }

  if (!Array.isArray(condominioRascunho.estruturaAmbientes)) {
    condominioRascunho.estruturaAmbientes = prepararEstruturaComCompatibilidade(
      [],
      condominioRascunho.equipamentos,
    );
  }

  return condominioRascunho.estruturaAmbientes;
}

function obterEquipamentosDisponiveisParaEstrutura(idsSelecionados = []) {
  const equipamentosPorId = new Map();

  Object.entries(equipamentosAntigosConfig).forEach(
    ([equipamentoId, configuracao]) => {
      equipamentosPorId.set(equipamentoId, {
        id: equipamentoId,

        nome: configuracao.nome,

        categoria: configuracao.categoria,

        descricao: "",

        status: "ativo",
      });
    },
  );

  equipamentosCatalogo.forEach((equipamento) => {
    equipamentosPorId.set(equipamento.id, {
      ...equipamento,
    });
  });

  const selecionados = new Set(
    idsSelecionados.map((id) => String(id || "").trim()),
  );

  return Array.from(equipamentosPorId.values())
    .filter(
      (equipamento) =>
        equipamento.status === "ativo" || selecionados.has(equipamento.id),
    )
    .sort((equipamentoA, equipamentoB) =>
      equipamentoA.nome.localeCompare(equipamentoB.nome, "pt-BR"),
    );
}

function sincronizarEquipamentosAntigosComEstrutura() {
  if (!condominioRascunho) {
    return;
  }

  const equipamentosIds = obterEquipamentosIdsDaEstrutura(
    obterEstruturaDoCondominioRascunho(),
  );

  condominioRascunho.equipamentos = equipamentosIds;

  const equipamentosSelecionados = new Set(equipamentosIds);

  equipmentInputs.forEach((input) => {
    input.checked = equipamentosSelecionados.has(input.value);
  });
}

function atualizarContagemEquipamentos() {
  if (!condominioRascunho) {
    selectedEquipmentCount.textContent = "0 equipamentos";

    return;
  }

  const equipamentosIds = obterEquipamentosIdsDaEstrutura(
    obterEstruturaDoCondominioRascunho(),
  );

  selectedEquipmentCount.textContent = formatarQuantidade(
    equipamentosIds.length,
    "equipamento",
    "equipamentos",
  );
}

function atualizarContagemDoEditorDeEquipamentos() {
  environmentEquipmentSelectedCount.textContent = formatarQuantidade(
    equipamentosTemporariosDoEditor.length,
    "selecionado",
    "selecionados",
  );
}

function atualizarEquipamentoTemporario(equipamentoId, alteracoes = {}) {
  const indice = equipamentosTemporariosDoEditor.findIndex(
    (equipamento) => equipamento.equipamentoId === equipamentoId,
  );

  if (indice < 0) {
    return;
  }

  equipamentosTemporariosDoEditor[indice] = {
    ...equipamentosTemporariosDoEditor[indice],
    ...alteracoes,
  };
}

function criarEquipamentoTemporario(equipamento, dadosAnteriores = null) {
  return {
    equipamentoId: equipamento.id,

    equipamentoNome: dadosAnteriores?.equipamentoNome || equipamento.nome,

    categoria:
      dadosAnteriores?.categoria ||
      equipamento.categoria ||
      "Outros equipamentos",

    quantidade: Math.max(1, Number(dadosAnteriores?.quantidade) || 1),

    observacao: String(dadosAnteriores?.observacao || "").trim(),
  };
}

function popularSelectDeAmbientesDaEstrutura(ambienteSelecionadoId = "") {
  condominiumEnvironmentSelect.innerHTML = "";

  condominiumEnvironmentSelect.appendChild(
    criarOpcao("", "Selecione um ambiente"),
  );

  const estrutura = obterEstruturaDoCondominioRascunho();

  const ambientesJaAdicionados = new Set(
    estrutura
      .map((ambiente, index) => {
        if (index === ambienteEmEdicaoIndex) {
          return "";
        }

        if (ambiente.legado) {
          return "";
        }

        return ambiente.ambienteId;
      })
      .filter(Boolean),
  );

  const ambientesDisponiveis = ambientesCatalogo
    .filter(
      (ambiente) =>
        ambiente.status === "ativo" || ambiente.id === ambienteSelecionadoId,
    )
    .sort((ambienteA, ambienteB) =>
      ambienteA.nome.localeCompare(ambienteB.nome, "pt-BR"),
    );

  ambientesDisponiveis.forEach((ambiente) => {
    const option = criarOpcao(ambiente.id, ambiente.nome);

    if (ambientesJaAdicionados.has(ambiente.id)) {
      option.disabled = true;

      option.textContent = `${ambiente.nome} — já adicionado`;
    }

    condominiumEnvironmentSelect.appendChild(option);
  });

  condominiumEnvironmentSelect.value = ambienteSelecionadoId;

  const possuiAmbientes = ambientesDisponiveis.length > 0;

  condominiumEnvironmentSelectHelp.textContent = possuiAmbientes
    ? "Ambientes já adicionados ao condomínio ficam indisponíveis nesta lista."
    : "Nenhum ambiente ativo foi cadastrado no catálogo.";
}

function renderizarOpcoesDeEquipamentosDoEditor() {
  environmentEquipmentOptions.innerHTML = "";

  const termo = normalizarTexto(environmentEquipmentSearch.value);

  const idsSelecionados = equipamentosTemporariosDoEditor.map(
    (equipamento) => equipamento.equipamentoId,
  );

  const equipamentosDisponiveis = obterEquipamentosDisponiveisParaEstrutura(
    idsSelecionados,
  ).filter((equipamento) => {
    if (!termo) {
      return true;
    }

    const conteudo = normalizarTexto(
      [equipamento.nome, equipamento.categoria, equipamento.descricao].join(
        " ",
      ),
    );

    return conteudo.includes(termo);
  });

  equipamentosDisponiveis.forEach((equipamento) => {
    const fragmento =
      environmentEquipmentOptionTemplate.content.cloneNode(true);

    const option = fragmento.querySelector(".environment-equipment-option");

    const checkbox = fragmento.querySelector(
      'input[name="environment-equipment"]',
    );

    const name = fragmento.querySelector(".environment-equipment-option__name");

    const category = fragmento.querySelector(
      ".environment-equipment-option__category",
    );

    const details = fragmento.querySelector(
      ".environment-equipment-option__details",
    );

    const quantity = fragmento.querySelector(
      ".environment-equipment-option__quantity",
    );

    const decreaseButton = fragmento.querySelector(
      ".environment-equipment-option__step-button--decrease",
    );

    const increaseButton = fragmento.querySelector(
      ".environment-equipment-option__step-button--increase",
    );

    const observation = fragmento.querySelector(
      ".environment-equipment-option__observation",
    );

    const dadosSelecionados =
      equipamentosTemporariosDoEditor.find(
        (item) => item.equipamentoId === equipamento.id,
      ) || null;

    option.dataset.equipmentId = equipamento.id;

    checkbox.value = equipamento.id;

    checkbox.checked = Boolean(dadosSelecionados);

    name.textContent = equipamento.nome;

    category.textContent = equipamento.categoria || "Outros equipamentos";

    quantity.value = Math.max(1, Number(dadosSelecionados?.quantidade) || 1);

    observation.value = dadosSelecionados?.observacao || "";

    details.hidden = !checkbox.checked;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        const jaSelecionado = equipamentosTemporariosDoEditor.some(
          (item) => item.equipamentoId === equipamento.id,
        );

        if (!jaSelecionado) {
          equipamentosTemporariosDoEditor.push(
            criarEquipamentoTemporario(equipamento, {
              quantidade: quantity.value,
              observacao: observation.value,
            }),
          );
        }
      } else {
        equipamentosTemporariosDoEditor =
          equipamentosTemporariosDoEditor.filter(
            (item) => item.equipamentoId !== equipamento.id,
          );
      }

      details.hidden = !checkbox.checked;

      atualizarContagemDoEditorDeEquipamentos();
    });

    function aplicarQuantidade(novoValor) {
      const quantidade = Math.max(1, Number.parseInt(novoValor, 10) || 1);

      quantity.value = String(quantidade);

      decreaseButton.disabled = quantidade <= 1;

      atualizarEquipamentoTemporario(equipamento.id, {
        quantidade,
      });
    }

    decreaseButton.disabled = Number(quantity.value) <= 1;

    quantity.addEventListener("input", () => {
      const valorDigitado = quantity.value.trim();

      if (!valorDigitado) {
        return;
      }

      const quantidade = Math.max(1, Number.parseInt(valorDigitado, 10) || 1);

      decreaseButton.disabled = quantidade <= 1;

      atualizarEquipamentoTemporario(equipamento.id, {
        quantidade,
      });
    });

    quantity.addEventListener("blur", () => {
      aplicarQuantidade(quantity.value);
    });

    decreaseButton.addEventListener("click", () => {
      aplicarQuantidade((Number.parseInt(quantity.value, 10) || 1) - 1);
    });

    increaseButton.addEventListener("click", () => {
      aplicarQuantidade((Number.parseInt(quantity.value, 10) || 1) + 1);
    });

    observation.addEventListener("input", () => {
      atualizarEquipamentoTemporario(equipamento.id, {
        observacao: observation.value.trim(),
      });
    });

    environmentEquipmentOptions.appendChild(fragmento);
  });

  const listaVazia = equipamentosDisponiveis.length === 0;

  environmentEquipmentOptions.hidden = listaVazia;

  environmentEquipmentEmpty.hidden = !listaVazia;

  atualizarContagemDoEditorDeEquipamentos();
}

function fecharEditorDeAmbiente() {
  condominiumEnvironmentEditor.hidden = true;

  condominiumEnvironmentEditIndex.value = "";

  condominiumEnvironmentSelect.value = "";

  environmentEquipmentSearch.value = "";

  environmentEquipmentOptions.innerHTML = "";

  equipamentosTemporariosDoEditor = [];

  ambienteEmEdicaoIndex = null;
}

function abrirEditorDeAmbiente(index = null) {
  const estrutura = obterEstruturaDoCondominioRascunho();

  const ambiente = Number.isInteger(index) ? estrutura[index] : null;

  if (ambiente?.legado) {
    mostrarFeedback(
      "Adicione um ambiente para organizar os equipamentos anteriores.",
    );

    return;
  }

  ambienteEmEdicaoIndex = Number.isInteger(index) ? index : null;

  condominiumEnvironmentEditIndex.value = Number.isInteger(index)
    ? String(index)
    : "";

  condominiumEnvironmentEditorEyebrow.textContent = ambiente
    ? "Editar estrutura"
    : "Estrutura do condomínio";

  condominiumEnvironmentEditorTitle.textContent = ambiente
    ? `Editar ${ambiente.ambienteNome}`
    : "Adicionar ambiente";

  saveCondominiumEnvironmentButton.textContent = ambiente
    ? "Salvar alterações"
    : "Adicionar ambiente";

  equipamentosTemporariosDoEditor = Array.isArray(ambiente?.equipamentos)
    ? ambiente.equipamentos.map((equipamento) => ({
        ...equipamento,
      }))
    : [];

  popularSelectDeAmbientesDaEstrutura(ambiente?.ambienteId || "");

  environmentEquipmentSearch.value = "";

  renderizarOpcoesDeEquipamentosDoEditor();

  condominiumEnvironmentEditor.hidden = false;

  condominiumEnvironmentEditor.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });

  window.setTimeout(() => {
    condominiumEnvironmentSelect.focus();
  }, 50);
}

function removerEquipamentosDoAmbienteLegado(equipamentosIds) {
  const idsOrganizados = new Set(equipamentosIds);

  const estrutura = obterEstruturaDoCondominioRascunho();

  estrutura.forEach((ambiente) => {
    if (!ambiente.legado) {
      return;
    }

    ambiente.equipamentos = ambiente.equipamentos.filter(
      (equipamento) => !idsOrganizados.has(equipamento.equipamentoId),
    );
  });

  condominioRascunho.estruturaAmbientes = estrutura.filter(
    (ambiente) => !ambiente.legado || ambiente.equipamentos.length > 0,
  );
}

function salvarAmbienteNoRascunho() {
  if (!condominioRascunho) {
    return;
  }

  const ambienteId = condominiumEnvironmentSelect.value;

  if (!ambienteId) {
    mostrarFeedback("Selecione o ambiente.");

    condominiumEnvironmentSelect.focus();

    return;
  }

  const ambienteCatalogo = obterAmbienteDoCatalogoPorId(ambienteId);

  if (!ambienteCatalogo) {
    mostrarFeedback("O ambiente selecionado não foi encontrado no catálogo.");

    return;
  }

  const estrutura = obterEstruturaDoCondominioRascunho();

  const ambienteDuplicado = estrutura.some((ambiente, index) => {
    if (index === ambienteEmEdicaoIndex) {
      return false;
    }

    return !ambiente.legado && ambiente.ambienteId === ambienteId;
  });

  if (ambienteDuplicado) {
    mostrarFeedback("Este ambiente já foi adicionado ao condomínio.");

    return;
  }

  const novoAmbiente = {
    ambienteId: ambienteCatalogo.id,

    ambienteNome: ambienteCatalogo.nome,

    categoria: ambienteCatalogo.categoria || "Outros ambientes",

    observacao: "",

    legado: false,

    equipamentos: equipamentosTemporariosDoEditor.map((equipamento) => ({
      equipamentoId: equipamento.equipamentoId,

      equipamentoNome: equipamento.equipamentoNome,

      categoria: equipamento.categoria,

      quantidade: Math.max(1, Number(equipamento.quantidade) || 1),

      observacao: String(equipamento.observacao || "").trim(),
    })),
  };

  if (Number.isInteger(ambienteEmEdicaoIndex)) {
    estrutura[ambienteEmEdicaoIndex] = novoAmbiente;
  } else {
    estrutura.push(novoAmbiente);
  }

  removerEquipamentosDoAmbienteLegado(
    novoAmbiente.equipamentos.map((equipamento) => equipamento.equipamentoId),
  );

  sincronizarEquipamentosAntigosComEstrutura();

  renderizarEstruturaDeAmbientes();

  fecharEditorDeAmbiente();

  mostrarFeedback(
    Number.isInteger(ambienteEmEdicaoIndex)
      ? "Ambiente atualizado."
      : "Ambiente adicionado ao condomínio.",
  );
}

function removerAmbienteDoRascunho(index) {
  const estrutura = obterEstruturaDoCondominioRascunho();

  const ambiente = estrutura[index];

  if (!ambiente) {
    return;
  }

  if (ambiente.legado) {
    mostrarFeedback(
      "Os equipamentos anteriores precisam ser organizados antes de serem removidos.",
    );

    return;
  }

  const confirmou = window.confirm(
    `Deseja remover o ambiente "${ambiente.ambienteNome}" e seus equipamentos deste condomínio?\n\nO catálogo geral não será alterado.`,
  );

  if (!confirmou) {
    return;
  }

  estrutura.splice(index, 1);

  sincronizarEquipamentosAntigosComEstrutura();

  renderizarEstruturaDeAmbientes();

  mostrarFeedback("Ambiente removido do condomínio.");
}

function criarCardDeAmbienteDoCondominio(ambiente, index) {
  const fragmento = condominiumEnvironmentTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".condominium-environment-card");

  const name = fragmento.querySelector(".condominium-environment-card__name");

  const category = fragmento.querySelector(
    ".condominium-environment-card__category",
  );

  const count = fragmento.querySelector(".condominium-environment-card__count");

  const legacyBadge = fragmento.querySelector(
    ".condominium-environment-card__legacy",
  );

  const toggle = fragmento.querySelector(
    ".condominium-environment-card__toggle",
  );

  const details = fragmento.querySelector(
    ".condominium-environment-card__details",
  );

  const equipmentList = fragmento.querySelector(
    ".condominium-environment-card__equipment-list",
  );

  const removeButton = fragmento.querySelector(
    '[data-environment-action="remove"]',
  );

  const editButton = fragmento.querySelector(
    '[data-environment-action="edit"]',
  );

  const equipamentos = Array.isArray(ambiente.equipamentos)
    ? ambiente.equipamentos
    : [];

  const quantidadeTotal = equipamentos.reduce(
    (total, equipamento) =>
      total + Math.max(1, Number(equipamento.quantidade) || 1),
    0,
  );

  card.dataset.environmentIndex = String(index);

  card.classList.toggle("is-legacy", Boolean(ambiente.legado));

  name.textContent = ambiente.ambienteNome || "Ambiente sem nome";

  category.textContent = ambiente.categoria || "Outros ambientes";

  count.textContent = formatarQuantidade(
    quantidadeTotal,
    "equipamento",
    "equipamentos",
  );

  legacyBadge.hidden = !ambiente.legado;

  equipamentos.forEach((equipamento) => {
    const equipamentoFragmento =
      condominiumEnvironmentEquipmentTemplate.content.cloneNode(true);

    const equipmentName = equipamentoFragmento.querySelector(
      ".condominium-environment-equipment__name",
    );

    const equipmentCategory = equipamentoFragmento.querySelector(
      ".condominium-environment-equipment__category",
    );

    const equipmentQuantity = equipamentoFragmento.querySelector(
      ".condominium-environment-equipment__quantity strong",
    );

    const equipmentObservation = equipamentoFragmento.querySelector(
      ".condominium-environment-equipment__observation",
    );

    equipmentName.textContent =
      equipamento.equipamentoNome || equipamento.equipamentoId;

    equipmentCategory.textContent =
      equipamento.categoria || "Outros equipamentos";

    equipmentQuantity.textContent = String(
      Math.max(1, Number(equipamento.quantidade) || 1),
    );

    const observacao = String(equipamento.observacao || "").trim();

    equipmentObservation.textContent = observacao;

    equipmentObservation.hidden = !observacao;

    equipmentList.appendChild(equipamentoFragmento);
  });

  toggle.addEventListener("click", () => {
    const abrir = details.hidden;

    details.hidden = !abrir;

    toggle.setAttribute("aria-expanded", String(abrir));
  });

  if (ambiente.legado) {
    removeButton.hidden = true;

    editButton.hidden = true;
  } else {
    removeButton.addEventListener("click", () => {
      removerAmbienteDoRascunho(index);
    });

    editButton.addEventListener("click", () => {
      abrirEditorDeAmbiente(index);
    });
  }

  return fragmento;
}

function renderizarEstruturaDeAmbientes() {
  condominiumEnvironmentsList.innerHTML = "";

  if (!condominioRascunho) {
    condominiumEnvironmentsEmpty.hidden = false;

    legacyEquipmentNotice.hidden = true;

    atualizarContagemEquipamentos();

    return;
  }

  const estrutura = obterEstruturaDoCondominioRascunho();

  estrutura.forEach((ambiente, index) => {
    condominiumEnvironmentsList.appendChild(
      criarCardDeAmbienteDoCondominio(ambiente, index),
    );
  });

  const listaVazia = estrutura.length === 0;

  condominiumEnvironmentsList.hidden = listaVazia;

  condominiumEnvironmentsEmpty.hidden = !listaVazia;

  const possuiEquipamentosAnteriores = estrutura.some(
    (ambiente) => ambiente.legado && ambiente.equipamentos.length > 0,
  );

  legacyEquipmentNotice.hidden = !possuiEquipamentosAnteriores;

  sincronizarEquipamentosAntigosComEstrutura();

  atualizarContagemEquipamentos();
}

/* =========================================
   DOCUMENTOS
========================================= */

function formatarTamanhoDocumento(tamanho) {
  const valor = Math.max(0, Number(tamanho) || 0);

  if (valor < 1024) {
    return `${valor} bytes`;
  }

  if (valor < 1024 * 1024) {
    return `${(valor / 1024).toFixed(1)} KB`;
  }

  return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarDataHoraDocumento(valor) {
  if (!valor) {
    return "";
  }

  const data =
    typeof valor?.toDate === "function" ? valor.toDate() : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obterNomeDocumentoParaDownload(documento) {
  const nomeBase = String(
    documento?.nomeOriginal || documento?.nome || "documento.pdf",
  )
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-");

  return /\.pdf$/i.test(nomeBase) ? nomeBase : `${nomeBase}.pdf`;
}

function prepararDocumentoParaPersistencia(documento) {
  return {
    id: String(documento?.id || gerarIdDocumento()).trim(),

    nome: String(documento?.nome || "Documento").trim() || "Documento",

    nomeOriginal: String(documento?.nomeOriginal || "").trim(),

    storagePath: String(documento?.storagePath || "").trim(),

    contentType: String(documento?.contentType || "application/pdf").trim(),

    tamanho: Math.max(0, Number(documento?.tamanho) || 0),

    vencimento: String(documento?.vencimento || "").trim(),

    status: atualizarStatusDocumento(documento),

    enviadoPorUid: String(documento?.enviadoPorUid || "").trim(),

    enviadoEm: String(documento?.enviadoEm || "").trim(),
  };
}

function prepararHistoricoParaPersistencia(historico) {
  return (Array.isArray(historico) ? historico : [])
    .filter(
      (registro) =>
        registro && typeof registro === "object" && !registro.origemFirestore,
    )
    .map(({ origemFirestore, ...registro }) => ({
      ...registro,
    }));
}

async function persistirDocumentosDoCondominio(documentos, historico) {
  if (!condominioEmEdicaoId) {
    throw new Error("CONDOMINIUM_NOT_SAVED");
  }

  await setDoc(
    doc(db, "condominios", condominioEmEdicaoId),
    {
      documentos: documentos.map(prepararDocumentoParaPersistencia),

      historico: prepararHistoricoParaPersistencia(historico),

      atualizadoEm: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

function sincronizarDocumentosNoEstadoLocal(documentos, historico) {
  if (!condominioRascunho) {
    return;
  }

  condominioRascunho.documentos = clonarDados(documentos);

  condominioRascunho.historico = clonarDados(historico);

  const condominioLocal = obterCondominioPorId(condominioEmEdicaoId);

  if (condominioLocal) {
    condominioLocal.documentos = clonarDados(documentos);

    condominioLocal.historico = clonarDados(historico);
  }

  aplicarOrdensAosCondominios();

  atualizarResumo();

  renderizarCondominios();
}

function criarRegistroHistoricoDocumento({ titulo, descricao }) {
  return {
    id: gerarIdHistorico(),

    tipo: "documento",

    titulo,

    descricao,

    data: obterDataISO(),

    origemFirestore: false,
  };
}

function definirStatusUploadDocumento({
  texto,
  estado = "",
  progresso = null,
  erro = "",
}) {
  documentUploadStatus.classList.remove(
    "is-processing",
    "is-success",
    "is-error",
  );

  if (estado) {
    documentUploadStatus.classList.add(estado);
  }

  documentUploadStatusText.textContent =
    texto || "Selecione um arquivo PDF para continuar.";

  if (progresso === null) {
    documentUploadProgress.hidden = true;

    documentUploadProgress.value = 0;
  } else {
    const progressoFinal = Math.min(100, Math.max(0, Number(progresso) || 0));

    documentUploadProgress.hidden = false;

    documentUploadProgress.value = progressoFinal;

    documentUploadProgress.textContent = `${Math.round(progressoFinal)}%`;
  }

  documentUploadError.textContent =
    erro || "Não foi possível preparar o documento.";

  documentUploadError.hidden = !erro;
}

function atualizarControlesDoDocumento() {
  const possuiArquivo = Boolean(arquivoDocumentoSelecionado);

  const possuiTitulo = Boolean(documentTitle.value.trim());

  const bloqueado = uploadDocumentoEmAndamento || acaoDocumentoEmAndamento;

  condominiumDocumentFile.disabled = bloqueado;

  documentTitle.disabled = bloqueado;

  documentExpirationDate.disabled = bloqueado;

  removeSelectedDocumentButton.disabled = bloqueado;

  closeDocumentUploadButton.disabled = bloqueado;

  cancelDocumentUploadButton.disabled = bloqueado;

  uploadDocumentButton.disabled =
    bloqueado || !possuiArquivo || !possuiTitulo || !condominioEmEdicaoId;

  addDocumentButton.disabled = bloqueado;

  documentUploadField.classList.toggle("is-disabled", bloqueado);
}

function limparArquivoDocumentoSelecionado({ limparTitulo = false } = {}) {
  arquivoDocumentoSelecionado = null;

  condominiumDocumentFile.value = "";

  documentSelectedFile.hidden = true;

  documentSelectedFileName.textContent = "documento.pdf";

  documentSelectedFileSize.textContent = "0 KB";

  if (limparTitulo) {
    documentTitle.value = "";
  }

  definirStatusUploadDocumento({
    texto: "Selecione um arquivo PDF para continuar.",
  });

  atualizarControlesDoDocumento();
}

function limparFormularioUploadDocumento() {
  arquivoDocumentoSelecionado = null;

  condominiumDocumentFile.value = "";

  documentTitle.value = "";

  documentExpirationDate.value = "";

  documentSelectedFile.hidden = true;

  documentSelectedFileName.textContent = "documento.pdf";

  documentSelectedFileSize.textContent = "0 KB";

  definirStatusUploadDocumento({
    texto: "Selecione um arquivo PDF para continuar.",
  });

  atualizarControlesDoDocumento();
}

function abrirPainelUploadDocumento() {
  if (!condominioRascunho) {
    return;
  }

  if (!condominioEmEdicaoId) {
    mostrarFeedback("Salve o condomínio antes de adicionar documentos.");

    return;
  }

  documentUploadPanel.hidden = false;

  addDocumentButton.setAttribute("aria-expanded", "true");

  documentUploadPanel.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });

  window.setTimeout(() => {
    condominiumDocumentFile.focus();
  }, 50);
}

function fecharPainelUploadDocumento({ forcar = false } = {}) {
  if (!forcar && (uploadDocumentoEmAndamento || acaoDocumentoEmAndamento)) {
    mostrarFeedback("Aguarde a operação do documento terminar.");

    return;
  }

  limparFormularioUploadDocumento();

  documentUploadPanel.hidden = true;

  addDocumentButton.setAttribute("aria-expanded", "false");

  addDocumentButton.focus();
}

async function arquivoPossuiAssinaturaPdf(arquivo) {
  try {
    const buffer = await arquivo.slice(0, 5).arrayBuffer();

    const bytes = new Uint8Array(buffer);

    const assinatura = String.fromCharCode(...bytes);

    return assinatura === "%PDF-";
  } catch (error) {
    console.error(
      "[Condomínios] Não foi possível validar a assinatura do PDF:",
      error,
    );

    return false;
  }
}

async function selecionarArquivoDocumento() {
  const arquivo = condominiumDocumentFile.files?.[0] || null;

  if (!arquivo) {
    limparArquivoDocumentoSelecionado();

    return;
  }

  const extensaoPdf = /\.pdf$/i.test(arquivo.name);

  const tipoPdf = arquivo.type === "application/pdf" || arquivo.type === "";

  if (!extensaoPdf || !tipoPdf) {
    limparArquivoDocumentoSelecionado();

    definirStatusUploadDocumento({
      texto: "Arquivo não aceito.",

      estado: "is-error",

      erro: "Selecione somente um arquivo no formato PDF.",
    });

    mostrarFeedback("O documento precisa estar no formato PDF.");

    return;
  }

  if (arquivo.size <= 0 || arquivo.size > tamanhoMaximoDocumento) {
    limparArquivoDocumentoSelecionado();

    definirStatusUploadDocumento({
      texto: "Arquivo fora do limite.",

      estado: "is-error",

      erro:
        arquivo.size <= 0
          ? "O arquivo selecionado está vazio."
          : "O PDF ultrapassa o limite máximo de 10 MB.",
    });

    mostrarFeedback(
      arquivo.size <= 0
        ? "O PDF selecionado está vazio."
        : "O PDF ultrapassa o limite de 10 MB.",
    );

    return;
  }

  definirStatusUploadDocumento({
    texto: "Validando o conteúdo do arquivo...",

    estado: "is-processing",
  });

  const assinaturaValida = await arquivoPossuiAssinaturaPdf(arquivo);

  if (!assinaturaValida) {
    limparArquivoDocumentoSelecionado();

    definirStatusUploadDocumento({
      texto: "Arquivo inválido.",

      estado: "is-error",

      erro: "O arquivo possui extensão PDF, mas seu conteúdo não foi reconhecido como PDF.",
    });

    mostrarFeedback("O arquivo selecionado não é um PDF válido.");

    return;
  }

  arquivoDocumentoSelecionado = arquivo;

  documentSelectedFile.hidden = false;

  documentSelectedFileName.textContent = arquivo.name;

  documentSelectedFileSize.textContent = formatarTamanhoDocumento(arquivo.size);

  if (!documentTitle.value.trim()) {
    documentTitle.value = arquivo.name
      .replace(/\.pdf$/i, "")
      .trim()
      .slice(0, 160);
  }

  definirStatusUploadDocumento({
    texto: "PDF validado e pronto para envio.",

    estado: "is-success",
  });

  atualizarControlesDoDocumento();
}

function criarNomeArquivoPdfNoStorage(documentoId) {
  return `documento-${String(documentoId).toLowerCase()}.pdf`;
}

async function enviarDocumentoDoCondominio() {
  if (uploadDocumentoEmAndamento || acaoDocumentoEmAndamento) {
    return;
  }

  if (!condominioEmEdicaoId) {
    mostrarFeedback("Salve o condomínio antes de enviar documentos.");

    return;
  }

  if (!arquivoDocumentoSelecionado) {
    mostrarFeedback("Selecione o arquivo PDF.");

    condominiumDocumentFile.focus();

    return;
  }

  const nomeDocumento = documentTitle.value.trim();

  if (!nomeDocumento) {
    mostrarFeedback("Informe o nome do documento.");

    documentTitle.focus();

    return;
  }

  const uid = String(sessaoAtual?.uid || "").trim();

  if (!uid) {
    mostrarFeedback("Não foi possível identificar o administrador.");

    return;
  }

  const documentoId = gerarIdDocumento();

  const nomeArquivoStorage = criarNomeArquivoPdfNoStorage(documentoId);

  const caminhoStorage =
    `condominios/${condominioEmEdicaoId}/` + `documentos/${nomeArquivoStorage}`;

  const referenciaDocumento = storageRef(storage, caminhoStorage);

  const arquivoAtual = arquivoDocumentoSelecionado;

  const vencimento = documentExpirationDate.value || "";

  uploadDocumentoEmAndamento = true;

  atualizarControlesDoDocumento();

  const textoOriginalBotao = uploadDocumentButton.textContent;

  uploadDocumentButton.textContent = "Enviando documento...";

  let uploadConcluido = false;

  try {
    const tarefaUpload = uploadBytesResumable(
      referenciaDocumento,
      arquivoAtual,
      {
        contentType: "application/pdf",

        customMetadata: {
          condominioId: condominioEmEdicaoId,

          enviadoPorUid: uid,

          nomeOriginal: arquivoAtual.name,
        },
      },
    );

    await new Promise((resolve, reject) => {
      tarefaUpload.on(
        "state_changed",

        (snapshot) => {
          const total = snapshot.totalBytes || 1;

          const progresso = (snapshot.bytesTransferred / total) * 100;

          definirStatusUploadDocumento({
            texto: `Enviando PDF: ${Math.round(progresso)}%`,

            estado: "is-processing",

            progresso,
          });
        },

        reject,

        resolve,
      );
    });

    uploadConcluido = true;

    const novoDocumento = {
      id: documentoId,

      nome: nomeDocumento,

      nomeOriginal: arquivoAtual.name,

      storagePath: caminhoStorage,

      contentType: "application/pdf",

      tamanho: arquivoAtual.size,

      vencimento,

      status: atualizarStatusDocumento({
        vencimento,
      }),

      enviadoPorUid: uid,

      enviadoEm: new Date().toISOString(),
    };

    const documentosAtualizados = [
      ...(condominioRascunho.documentos || []),
      novoDocumento,
    ];

    const novoHistorico = criarRegistroHistoricoDocumento({
      titulo: "Documento adicionado",

      descricao:
        `${nomeDocumento} foi armazenado ` + "nos documentos do condomínio.",
    });

    const historicoAtualizado = [
      novoHistorico,
      ...(condominioRascunho.historico || []),
    ];

    await persistirDocumentosDoCondominio(
      documentosAtualizados,
      historicoAtualizado,
    );

    sincronizarDocumentosNoEstadoLocal(
      documentosAtualizados,
      historicoAtualizado,
    );

    renderizarDocumentos();

    renderizarHistorico();

    definirStatusUploadDocumento({
      texto: "Documento enviado com sucesso.",

      estado: "is-success",

      progresso: 100,
    });

    mostrarFeedback("Documento adicionado ao condomínio.");

    window.setTimeout(() => {
      fecharPainelUploadDocumento({
        forcar: true,
      });
    }, 350);
  } catch (error) {
    console.error("[Condomínios] Não foi possível enviar o documento:", error);

    if (uploadConcluido) {
      try {
        await deleteObject(referenciaDocumento);
      } catch (rollbackError) {
        if (rollbackError?.code !== "storage/object-not-found") {
          console.error(
            "[Condomínios] Não foi possível remover o PDF após a falha do Firestore:",
            rollbackError,
          );
        }
      }
    }

    definirStatusUploadDocumento({
      texto: "O envio do documento não foi concluído.",

      estado: "is-error",

      erro: "Não foi possível armazenar o PDF. Tente novamente.",
    });

    mostrarFeedback(
      error?.code === "storage/unauthorized" ||
        error?.code === "permission-denied"
        ? "O Firebase bloqueou o envio do documento."
        : "Não foi possível enviar o documento.",
    );
  } finally {
    uploadDocumentoEmAndamento = false;

    uploadDocumentButton.textContent = textoOriginalBotao;

    atualizarControlesDoDocumento();
  }
}

async function obterUrlDocumento(documento) {
  const caminho = String(documento?.storagePath || "").trim();

  if (!caminho) {
    throw new Error("DOCUMENT_STORAGE_PATH_NOT_FOUND");
  }

  return getDownloadURL(storageRef(storage, caminho));
}

async function abrirDocumentoDoCondominio(documento) {
  const novaJanela = window.open("", "_blank");

  if (!novaJanela) {
    mostrarFeedback("O navegador bloqueou a abertura do documento.");

    return;
  }

  try {
    const url = await obterUrlDocumento(documento);

    novaJanela.opener = null;

    novaJanela.location.href = url;
  } catch (error) {
    novaJanela.close();

    console.error("[Condomínios] Não foi possível abrir o documento:", error);

    mostrarFeedback("Não foi possível abrir o documento.");
  }
}

async function baixarDocumentoDoCondominio(documento) {
  const caminho = String(documento?.storagePath || "").trim();

  if (!caminho) {
    mostrarFeedback("O arquivo deste documento não foi encontrado.");

    return;
  }

  try {
    mostrarFeedback("Preparando o download do documento...");

    const blob = await getBlob(
      storageRef(storage, caminho),
      tamanhoMaximoDocumento + 1024 * 1024,
    );

    const urlTemporaria = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = urlTemporaria;

    link.download = obterNomeDocumentoParaDownload(documento);

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(urlTemporaria);
    }, 1000);

    mostrarFeedback("Download do documento iniciado.");
  } catch (error) {
    console.error("[Condomínios] Não foi possível baixar o documento:", error);

    mostrarFeedback("Não foi possível baixar o documento.");
  }
}

async function removerDocumentoDoCondominio(documento, card) {
  if (acaoDocumentoEmAndamento || uploadDocumentoEmAndamento) {
    return;
  }

  const confirmou = window.confirm(
    `Deseja excluir o documento "${documento.nome}"?\n\n` +
      "O PDF será removido definitivamente do Firebase Storage.",
  );

  if (!confirmou) {
    return;
  }

  const documentosOriginais = [...(condominioRascunho.documentos || [])];

  const historicoOriginal = [...(condominioRascunho.historico || [])];

  const documentosAtualizados = documentosOriginais.filter(
    (item) => item.id !== documento.id,
  );

  const novoHistorico = criarRegistroHistoricoDocumento({
    titulo: "Documento excluído",

    descricao:
      `${documento.nome} foi removido ` + "dos documentos do condomínio.",
  });

  const historicoAtualizado = [novoHistorico, ...historicoOriginal];

  const caminhoStorage = String(documento.storagePath || "").trim();

  acaoDocumentoEmAndamento = true;

  card?.classList.add("is-removing");

  atualizarControlesDoDocumento();

  try {
    await persistirDocumentosDoCondominio(
      documentosAtualizados,
      historicoAtualizado,
    );

    if (caminhoStorage) {
      try {
        await deleteObject(storageRef(storage, caminhoStorage));
      } catch (storageError) {
        if (storageError?.code !== "storage/object-not-found") {
          try {
            await persistirDocumentosDoCondominio(
              documentosOriginais,
              historicoOriginal,
            );
          } catch (rollbackError) {
            console.error(
              "[Condomínios] Não foi possível restaurar o documento no Firestore:",
              rollbackError,
            );
          }

          throw storageError;
        }
      }
    }

    sincronizarDocumentosNoEstadoLocal(
      documentosAtualizados,
      historicoAtualizado,
    );

    renderizarDocumentos();

    renderizarHistorico();

    mostrarFeedback("Documento excluído do condomínio.");
  } catch (error) {
    console.error("[Condomínios] Não foi possível excluir o documento:", error);

    mostrarFeedback(
      error?.code === "storage/unauthorized" ||
        error?.code === "permission-denied"
        ? "O Firebase bloqueou a exclusão do documento."
        : "Não foi possível excluir o documento.",
    );
  } finally {
    acaoDocumentoEmAndamento = false;

    card?.classList.remove("is-removing");

    atualizarControlesDoDocumento();
  }
}

function renderizarDocumentos() {
  documentsList.innerHTML = "";

  documentsLoading.hidden = true;

  if (!condominioRascunho) {
    documentsList.hidden = true;

    documentsEmpty.hidden = false;

    return;
  }

  const documentos = Array.isArray(condominioRascunho.documentos)
    ? condominioRascunho.documentos
    : [];

  documentsEmpty.hidden = documentos.length > 0;

  documentsList.hidden = documentos.length === 0;

  documentos.forEach((documento) => {
    documento.status = atualizarStatusDocumento(documento);

    const fragmento = documentTemplate.content.cloneNode(true);

    const card = fragmento.querySelector(".document-card");

    const name = fragmento.querySelector(".document-card__name");

    const metadata = fragmento.querySelector(".document-card__metadata");

    const expiration = fragmento.querySelector(".document-card__expiration");

    const status = fragmento.querySelector(".document-card__status");

    const openButton = fragmento.querySelector(".document-card__action--open");

    const downloadButton = fragmento.querySelector(
      ".document-card__action--download",
    );

    const removeButton = fragmento.querySelector(".document-card__remove");

    name.textContent = documento.nome;

    const metadados = ["PDF"];

    if (documento.tamanho > 0) {
      metadados.push(formatarTamanhoDocumento(documento.tamanho));
    }

    const enviadoEm = formatarDataHoraDocumento(documento.enviadoEm);

    if (enviadoEm) {
      metadados.push(`Enviado em ${enviadoEm}`);
    }

    metadata.textContent = documento.storagePath
      ? metadados.join(" • ")
      : "Arquivo não vinculado ao Firebase Storage";

    expiration.textContent = documento.vencimento
      ? `Vencimento: ${formatarData(documento.vencimento)}`
      : "Sem data de vencimento";

    if (documento.status === "regular") {
      status.textContent = "Regular";

      status.classList.add("status--regular");
    }

    if (documento.status === "pendente") {
      status.textContent = "Pendente";

      status.classList.add("status--pendente");
    }

    if (documento.status === "vencido") {
      status.textContent = "Vencido";

      status.classList.add("status--vencido");
    }

    const possuiArquivo = Boolean(String(documento.storagePath || "").trim());

    openButton.disabled = !possuiArquivo;

    downloadButton.disabled = !possuiArquivo;

    openButton.addEventListener("click", () => {
      abrirDocumentoDoCondominio(documento);
    });

    downloadButton.addEventListener("click", () => {
      baixarDocumentoDoCondominio(documento);
    });

    removeButton.setAttribute(
      "aria-label",
      `Excluir documento ${documento.nome}`,
    );

    removeButton.addEventListener("click", () => {
      removerDocumentoDoCondominio(documento, card);
    });

    documentsList.appendChild(fragmento);
  });

  atualizarControlesDoDocumento();
}

/* =========================================
   HISTÓRICO NO MODAL
========================================= */

function renderizarHistorico() {
  condominiumHistory.innerHTML = "";

  if (!condominioRascunho) {
    return;
  }

  const historico = [...condominioRascunho.historico].sort(
    (registroA, registroB) =>
      criarDataLocal(registroB.data) - criarDataLocal(registroA.data),
  );

  historyEmpty.hidden = historico.length > 0;

  condominiumHistory.hidden = historico.length === 0;

  historico.forEach((registro) => {
    condominiumHistory.appendChild(criarItemHistorico(registro));
  });
}

/* =========================================
   MÁSCARAS
========================================= */

function aplicarMascaraCNPJ(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 14);

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function aplicarMascaraCEP(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);

  return numeros.replace(/(\d{5})(\d)/, "$1-$2");
}

/* =========================================
   EVENTOS DA LISTAGEM
========================================= */
summaryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selecionarResumo(button.dataset.summaryFilter);
  });
});
statusTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    alterarAba(button.dataset.statusTab);
  });
});

condominiumsSearch.addEventListener("input", renderizarCondominios);

openFilterButton.addEventListener("click", abrirFiltros);

closeFilterButton.addEventListener("click", fecharFiltros);

applyFiltersButton.addEventListener("click", aplicarFiltros);

clearFiltersButton.addEventListener("click", limparPesquisaEFiltros);

clearEmptyFiltersButton.addEventListener("click", limparPesquisaEFiltros);

/* =========================================
   EVENTOS DO MODAL
========================================= */

newCondominiumButton.addEventListener("click", () => {
  abrirModalDeCondominio();
});

closeCondominiumModalButton.addEventListener("click", fecharModalDeCondominio);

cancelCondominiumButton.addEventListener("click", fecharModalDeCondominio);

condominiumModal.addEventListener("click", (event) => {
  if (event.target === condominiumModal) {
    fecharModalDeCondominio();
  }
});

condominiumForm.addEventListener("submit", salvarCondominio);

modalTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    alterarAbaDoModal(button.dataset.modalTab);
  });
});

linkClientButton.addEventListener("click", vincularCliente);

linkedClientSearch.addEventListener(
  "input",
  popularSelectDeClientesVinculaveis,
);

addCondominiumEnvironmentButton.addEventListener("click", () => {
  abrirEditorDeAmbiente();
});

closeCondominiumEnvironmentEditorButton.addEventListener(
  "click",
  fecharEditorDeAmbiente,
);

cancelCondominiumEnvironmentButton.addEventListener(
  "click",
  fecharEditorDeAmbiente,
);

saveCondominiumEnvironmentButton.addEventListener(
  "click",
  salvarAmbienteNoRascunho,
);

environmentEquipmentSearch.addEventListener(
  "input",
  renderizarOpcoesDeEquipamentosDoEditor,
);
addDocumentButton.addEventListener("click", abrirPainelUploadDocumento);

closeDocumentUploadButton.addEventListener("click", () => {
  fecharPainelUploadDocumento();
});

cancelDocumentUploadButton.addEventListener("click", () => {
  fecharPainelUploadDocumento();
});

removeSelectedDocumentButton.addEventListener("click", () => {
  limparArquivoDocumentoSelecionado({
    limparTitulo: true,
  });
});

condominiumDocumentFile.addEventListener("change", selecionarArquivoDocumento);

documentTitle.addEventListener("input", atualizarControlesDoDocumento);

documentExpirationDate.addEventListener(
  "change",
  atualizarControlesDoDocumento,
);

uploadDocumentButton.addEventListener("click", enviarDocumentoDoCondominio);

condominiumDocument.addEventListener("input", () => {
  condominiumDocument.value = aplicarMascaraCNPJ(condominiumDocument.value);
});

condominiumZipCode.addEventListener("input", () => {
  condominiumZipCode.value = aplicarMascaraCEP(condominiumZipCode.value);
});

/* =========================================
   EVENTOS GERAIS
========================================= */

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!filterPanel.hidden) {
    fecharFiltros();

    openFilterButton.focus();

    return;
  }

  if (!condominiumEnvironmentEditor.hidden) {
    fecharEditorDeAmbiente();

    return;
  }

  if (!documentUploadPanel.hidden) {
    fecharPainelUploadDocumento();

    return;
  }

  if (!condominiumModal.hidden) {
    fecharModalDeCondominio();

    return;
  }

  const cardExpandido = document.querySelector(".condominium-card.is-expanded");

  if (cardExpandido) {
    fecharCard(cardExpandido);
  }
});
/* =========================================
   ABERTURA PELO PARÂMETRO DA URL
========================================= */

function abrirCondominioRecebidoPelaURL() {
  const parametros = new URLSearchParams(window.location.search);

  const condominioId = parametros.get("condominio");

  if (!condominioId) {
    return;
  }

  const condominio = obterCondominioPorId(condominioId);

  if (!condominio) {
    mostrarFeedback("O condomínio solicitado não foi encontrado.");

    return;
  }

  window.setTimeout(() => {
    abrirModalDeCondominio(condominio);
  }, 80);
}
/* =========================================
   INICIALIZAÇÃO
========================================= */

async function inicializarPaginaDeCondominios() {
  try {
    await prepararFirebaseDeCondominios();

    sessaoAtual = await aguardarSessaoDaPagina();

    await carregarDadosDeCondominiosDoFirestore();
  } catch (error) {
    console.error("[Condomínios] Não foi possível carregar os dados:", error);

    condominios = [];
    clientes = [];
    ordens = [];

    mostrarFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a leitura dos condomínios. Revise as regras."
        : "Não foi possível carregar os condomínios.",
    );
  }

  popularFiltroDeCidades();
  popularOpcoesDeClientes();
  sincronizarFormularioComFiltros();
  atualizarContagemDeFiltros();
  renderizarFiltrosAtivos();
  atualizarAbas();
  atualizarResumo();
  renderizarCondominios();
  abrirCondominioRecebidoPelaURL();
}

inicializarPaginaDeCondominios();
