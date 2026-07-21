/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const FIREBASE_VERSION = "12.16.0";

let db;
let collection;
let doc;
let getDocs;
let query;
let where;
let setDoc;
let serverTimestamp;
let writeBatch;

/* Firebase App secundário */

let initializeApp;
let deleteApp;

/* Firebase Authentication secundário */

let getAuth;
let setPersistence;
let inMemoryPersistence;
let createUserWithEmailAndPassword;
let updateProfile;
let sendPasswordResetEmail;
let deleteUser;
let signOut;

/* Configuração compartilhada */

let firebaseConfig;

let clientes = [];
let condominios = [];

async function prepararFirebaseDeClientes() {
  const [
    firebaseAppModule,
    firebaseAuthModule,
    firestoreModule,
    firebaseConfigModule,
  ] = await Promise.all([
    import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`
    ),

    import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`
    ),

    import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
    ),

    import("./firebase-config.js"),
  ]);

  db = firebaseConfigModule.db;

  firebaseConfig = firebaseConfigModule.firebaseConfig;

  if (!firebaseConfig) {
    throw new Error("FIREBASE_CONFIG_NOT_EXPORTED");
  }

  ({ initializeApp, deleteApp } = firebaseAppModule);

  ({
    getAuth,
    setPersistence,
    inMemoryPersistence,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    deleteUser,
    signOut,
  } = firebaseAuthModule);

  ({
    collection,
    doc,
    getDocs,
    query,
    where,
    setDoc,
    serverTimestamp,
    writeBatch,
  } = firestoreModule);
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

function obterDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

/* =========================================
   CONFIGURAÇÕES DOS CAMPOS
========================================= */

const statusConfig = {
  ativo: {
    nome: "Ativo",
    classe: "status--ativo",
  },

  inativo: {
    nome: "Inativo",
    classe: "status--inativo",
  },

  "cadastro-incompleto": {
    nome: "Cadastro incompleto",
    classe: "status--cadastro-incompleto",
  },

  "com-pendencia": {
    nome: "Com pendência",
    classe: "status--com-pendencia",
  },
};

const contatoConfig = {
  whatsapp: "WhatsApp",

  telefone: "Ligação telefônica",

  email: "E-mail",
};

const papelCondominioConfig = {
  sindico: "Síndico",

  subsindico: "Subsindico",

  proprietario: "Proprietário",

  gerente: "Gerente",

  administradora: "Administradora",

  zelador: "Zelador",

  financeiro: "Responsável financeiro",

  outro: "Outro",
};

const abasConfig = {
  todos: {
    titulo: "Clientes cadastrados",
    subtitulo: "Base de relacionamento",
  },

  ativos: {
    titulo: "Clientes ativos",
    subtitulo: "Cadastros em atividade",
  },

  novos: {
    titulo: "Novos clientes do mês",
    subtitulo: "Cadastros realizados neste mês",
  },

  "com-servicos": {
    titulo: "Clientes com serviços",
    subtitulo: "Clientes com ordens cadastradas",
  },

  "com-pendencias": {
    titulo: "Clientes com pendências",
    subtitulo: "Pontos que exigem atenção",
  },

  inativos: {
    titulo: "Clientes inativos",
    subtitulo: "Cadastros desativados",
  },
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const summaryTotal = document.getElementById("summary-total");

const summaryActive = document.getElementById("summary-active");

const summaryNewMonth = document.getElementById("summary-new-month");

const summaryWithOrders = document.getElementById("summary-with-orders");

const summaryFilterButtons = document.querySelectorAll("[data-summary-filter]");

const customersSummaryHint = document.getElementById("customers-summary-hint");

const customersTools = document.querySelector(".customers-tools");

const customersContent = document.querySelector(".customers-content");

const customerTabButtons = document.querySelectorAll("[data-customer-tab]");

const customersSearch = document.getElementById("customers-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const statusFilterInputs = document.querySelectorAll(
  'input[name="statusFilter"]',
);

const cityFilter = document.getElementById("city-filter");

const contactFilter = document.getElementById("contact-filter");

const registrationFilter = document.getElementById("registration-filter");

const ordersFilter = document.getElementById("orders-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const clearEmptyFiltersButton = document.getElementById(
  "clear-empty-filters-button",
);

const sortButton = document.getElementById("sort-button");

const sortMenu = document.getElementById("sort-menu");

const sortOptionButtons = document.querySelectorAll("[data-sort-option]");

const customersContentEyebrow = document.getElementById(
  "customers-content-eyebrow",
);

const customersContentTitle = document.getElementById(
  "customers-content-title",
);

const customersCount = document.getElementById("customers-count");

const customersList = document.getElementById("customers-list");

const emptyState = document.getElementById("empty-state");

const customerCardTemplate = document.getElementById("customer-card-template");

const newCustomerButton = document.getElementById("new-customer-button");
/* =========================================
   MODAL DE CADASTRO
========================================= */

const customerModal = document.getElementById("customer-modal");

const customerModalEyebrow = document.getElementById("customer-modal-eyebrow");

const customerModalTitle = document.getElementById("customer-modal-title");

const closeCustomerModalButton = document.getElementById(
  "close-customer-modal-button",
);

const cancelCustomerButton = document.getElementById("cancel-customer-button");

const customerForm = document.getElementById("customer-form");

const customerIdInput = document.getElementById("customer-id");

const customerNameInput = document.getElementById("customer-name");

const customerPhoneInput = document.getElementById("customer-phone");

const customerEmailInput = document.getElementById("customer-email");

const customerPostalCodeInput = document.getElementById("customer-postal-code");

const customerStateInput = document.getElementById("customer-state");

const customerStreetInput = document.getElementById("customer-street");

const customerAddressNumberInput = document.getElementById(
  "customer-address-number",
);

const customerAddressComplementInput = document.getElementById(
  "customer-address-complement",
);

const customerDistrictInput = document.getElementById("customer-district");

const customerCityInput = document.getElementById("customer-city");

const customerContactPreferenceInput = document.getElementById(
  "customer-contact-preference",
);

const customerStatusInput = document.getElementById("customer-status");

const customerNotesInput = document.getElementById("customer-notes");

const searchCustomerPostalCodeButton = document.getElementById(
  "search-customer-postal-code-button",
);

const saveCustomerButton = document.getElementById("save-customer-button");

const saveCustomerLabel = saveCustomerButton.querySelector(".button-label");

const saveCustomerLoading = saveCustomerButton.querySelector(".button-loading");

/* =========================================
   VÍNCULOS COM CONDOMÍNIOS
========================================= */

const customerCondominiumsCount = document.getElementById(
  "customer-condominiums-count",
);

const openCustomerCondominiumLinkButton = document.getElementById(
  "open-customer-condominium-link-button",
);

const customerCondominiumLinkPanel = document.getElementById(
  "customer-condominium-link-panel",
);

const customerCondominiumSelect = document.getElementById(
  "customer-condominium-select",
);

const customerCondominiumRole = document.getElementById(
  "customer-condominium-role",
);

const customerCondominiumPrimary = document.getElementById(
  "customer-condominium-primary",
);

const customerCondominiumFinancial = document.getElementById(
  "customer-condominium-financial",
);

const cancelCustomerCondominiumLinkButton = document.getElementById(
  "cancel-customer-condominium-link-button",
);

const linkCustomerCondominiumButton = document.getElementById(
  "link-customer-condominium-button",
);

const customerCondominiumsList = document.getElementById(
  "customer-condominiums-list",
);

const customerCondominiumsEmpty = document.getElementById(
  "customer-condominiums-empty",
);

const customerCondominiumTemplate = document.getElementById(
  "customer-condominium-template",
);

/* =========================================
   MODAL DE DETALHES
========================================= */

const customerDetailsModal = document.getElementById("customer-details-modal");

const closeCustomerDetailsButton = document.getElementById(
  "close-customer-details-button",
);

const detailsAvatar = document.getElementById("details-avatar");

const detailsCode = document.getElementById("details-code");

const detailsName = document.getElementById("details-name");

const detailsStatus = document.getElementById("details-status");

const detailsPhone = document.getElementById("details-phone");

const detailsEmail = document.getElementById("details-email");

const detailsContact = document.getElementById("details-contact");

const detailsRegistration = document.getElementById("details-registration");

const detailsAddress = document.getElementById("details-address");

const detailsNotes = document.getElementById("details-notes");

const detailsOrders = document.getElementById("details-orders");

const detailsActiveOrders = document.getElementById("details-active-orders");

const detailsTotalValue = document.getElementById("details-total-value");

const detailsEditButton = document.getElementById("details-edit-button");

const detailsNewOrderButton = document.getElementById(
  "details-new-order-button",
);

const detailsCondominiumsCount = document.getElementById(
  "details-condominiums-count",
);

const detailsCondominiumsList = document.getElementById(
  "details-condominiums-list",
);

const detailsCondominiumsEmpty = document.getElementById(
  "details-condominiums-empty",
);

const detailsLinkCondominiumButton = document.getElementById(
  "details-link-condominium-button",
);

const detailsCondominiumTemplate = document.getElementById(
  "details-condominium-template",
);

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let abaAtual = "todos";
let resumoSelecionado = null;

let ordenacaoAtual = "nome";

let filtrosAplicados = {
  status: [],
  cidade: "",
  contato: "",
  cadastro: "",
  ordens: "",
};

let clienteEmEdicaoId = null;

let clienteNosDetalhesId = null;

let vinculosDoClienteRascunho = [];

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function clonarDados(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function somenteNumeros(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function limparTexto(valor) {
  return String(valor || "").trim();
}

function aguardar(milissegundos) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milissegundos);
  });
}

function criarDataLocal(valor) {
  if (!valor) {
    return null;
  }

  return new Date(`${valor}T12:00:00`);
}

function formatarQuantidadeClientes(quantidade) {
  return quantidade === 1 ? "1 cliente" : `${quantidade} clientes`;
}

function formatarQuantidadeVinculos(quantidade) {
  return quantidade === 1 ? "1 vínculo" : `${quantidade} vínculos`;
}

function formatarData(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "Data não informada";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatarValor(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarTelefone(valor) {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 2) {
    return numeros ? `(${numeros}` : "";
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      6,
    )}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function formatarCep(valor) {
  const numeros = somenteNumeros(valor).slice(0, 8);

  if (numeros.length <= 5) {
    return numeros;
  }

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

function obterIniciais(nome) {
  const partes = limparTexto(nome).split(/\s+/).filter(Boolean);

  if (partes.length === 0) {
    return "--";
  }

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function criarSlug(valor) {
  return normalizarTexto(valor)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function obterClientePorId(clienteId) {
  return clientes.find((cliente) => cliente.id === clienteId);
}

function obterCondominioPorId(condominioId) {
  return condominios.find((condominio) => condominio.id === condominioId);
}

function normalizarIdClienteVinculado(clienteId) {
  return String(clienteId || "").trim();
}

function mostrarFeedback(mensagem) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = mensagem;

  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3000);
}

function obterEnderecoCompleto(cliente) {
  const enderecoPrincipal = [cliente.rua, cliente.numero]
    .filter(Boolean)
    .join(", ");

  const complemento = cliente.complemento ? `, ${cliente.complemento}` : "";

  const regiao = [cliente.bairro, cliente.cidade, cliente.estado]
    .filter(Boolean)
    .join(" — ");

  return `${enderecoPrincipal}${complemento}${regiao ? ` — ${regiao}` : ""}`;
}

function obterEnderecoDoCondominio(condominio) {
  const endereco = condominio?.endereco || {};

  const primeiraLinha = [endereco.logradouro, endereco.numero]
    .filter(Boolean)
    .join(", ");

  const segundaLinha = [endereco.complemento, endereco.bairro]
    .filter(Boolean)
    .join(" — ");

  const terceiraLinha = [endereco.cidade, endereco.estado]
    .filter(Boolean)
    .join("/");

  return (
    [primeiraLinha, segundaLinha, terceiraLinha].filter(Boolean).join(" — ") ||
    "Endereço não informado"
  );
}

function abrirCadastroDoCondominio(condominioId) {
  const parametros = new URLSearchParams({
    condominio: condominioId,
  });

  window.location.href = `condominios.html?${parametros.toString()}`;
}
/* =========================================
   DADOS DO FIRESTORE
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

function obterEnderecoDoDocumento(dados) {
  const endereco = dados?.endereco || {};

  return {
    cep: endereco.cep || dados?.cep || "",
    estado: endereco.estado || dados?.estado || "",
    rua:
      endereco.rua ||
      endereco.logradouro ||
      dados?.rua ||
      dados?.logradouro ||
      "",
    numero: endereco.numero || dados?.numero || "",
    complemento: endereco.complemento || dados?.complemento || "",
    bairro: endereco.bairro || dados?.bairro || "",
    cidade: endereco.cidade || dados?.cidade || "",
  };
}

function mapearClienteDoFirestore(clienteSnapshot) {
  const dados = clienteSnapshot.data();
  const endereco = obterEnderecoDoDocumento(dados);

  const statusPermitidos = [
    "ativo",
    "inativo",
    "cadastro-incompleto",
    "com-pendencia",
  ];

  const status = statusPermitidos.includes(dados.statusCadastro)
    ? dados.statusCadastro
    : "ativo";

  return {
    id: clienteSnapshot.id,
    uid: dados.uid || clienteSnapshot.id,
    possuiAcesso: dados.possuiAcesso !== false,
    acessoAtivo: dados.ativo !== false,
    origemCadastro: dados.origemCadastro || "registro",

    nome: dados.nome || "",
    telefone: dados.telefone || "",
    email: dados.email || "",

    cep: endereco.cep,
    estado: endereco.estado,
    rua: endereco.rua,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,

    cidadeSlug: dados.cidadeSlug || criarSlug(endereco.cidade),
    canalPreferido: dados.canalPreferido || "whatsapp",
    status,

    cadastradoEm: converterDataDoFirestoreParaISO(
      dados.criadoEm || dados.cadastradoEm,
    ),

    quantidadeOrdens: 0,
    ordensAtivas: 0,
    valorMovimentado: 0,

    observacoes: dados.observacoesAdministrativas || dados.observacoes || "",

    aviso: dados.aviso || obterAvisoPorStatus(status),
  };
}

function mapearCondominioDoFirestore(condominioSnapshot) {
  const dados = condominioSnapshot.data();

  return {
    ...dados,
    id: condominioSnapshot.id,
    nome: dados.nome || "Condomínio sem nome",

    clientesVinculados: Array.isArray(dados.clientesVinculados)
      ? dados.clientesVinculados
      : [],
  };
}

function obterClienteIdDaOrdem(ordem) {
  return String(ordem?.clienteUid || ordem?.cliente?.id || "").trim();
}

function obterValorMovimentadoDaOrdem(ordem) {
  const valoresPossiveis = [
    ordem?.valorTotal,
    ordem?.valor,
    ordem?.valorFinal,
    ordem?.financeiro?.valorTotal,
    ordem?.financeiro?.valorFinal,
    ordem?.orcamento?.valorAprovado,
  ];

  const valorEncontrado = valoresPossiveis.find((valor) => {
    const numero = Number(valor);

    return Number.isFinite(numero);
  });

  return Number(valorEncontrado) || 0;
}

function ordemEstaAtiva(ordem) {
  if (
    ordem?.ativo === false ||
    ordem?.arquivada === true ||
    ordem?.arquivado === true
  ) {
    return false;
  }

  const status = normalizarTexto(ordem?.status);

  const indicadoresDeEncerramento = ["conclu", "finaliz", "cancel", "recus"];

  return !indicadoresDeEncerramento.some((indicador) =>
    status.includes(indicador),
  );
}

function aplicarMetricasDasOrdens(ordens) {
  const clientesPorId = new Map(
    clientes.map((cliente) => [cliente.id, cliente]),
  );

  ordens.forEach((ordem) => {
    const clienteId = obterClienteIdDaOrdem(ordem);
    const cliente = clientesPorId.get(clienteId);

    if (!cliente) {
      return;
    }

    cliente.quantidadeOrdens += 1;
    cliente.valorMovimentado += obterValorMovimentadoDaOrdem(ordem);

    if (ordemEstaAtiva(ordem)) {
      cliente.ordensAtivas += 1;
    }
  });
}

async function carregarDadosDeClientesDoFirestore() {
  const clientesQuery = query(
    collection(db, "usuarios"),
    where("role", "==", "cliente"),
  );

  const [clientesSnapshot, condominiosSnapshot, ordensSnapshot] =
    await Promise.all([
      getDocs(clientesQuery),
      getDocs(collection(db, "condominios")),
      getDocs(collection(db, "ordens")),
    ]);

  clientes = clientesSnapshot.docs.map(mapearClienteDoFirestore);

  condominios = condominiosSnapshot.docs.map(mapearCondominioDoFirestore);

  aplicarMetricasDasOrdens(
    ordensSnapshot.docs.map((ordemSnapshot) => ordemSnapshot.data()),
  );
}

/* =========================================
   RELAÇÃO CLIENTE ↔ CONDOMÍNIO
========================================= */

function obterVinculosDoCliente(clienteId) {
  if (!clienteId) {
    return [];
  }

  const vinculos = [];

  condominios.forEach((condominio) => {
    const clientesVinculados = Array.isArray(condominio.clientesVinculados)
      ? condominio.clientesVinculados
      : [];

    clientesVinculados.forEach((vinculo) => {
      const idNormalizado = normalizarIdClienteVinculado(vinculo.clienteId);

      if (idNormalizado !== clienteId) {
        return;
      }

      vinculos.push({
        condominioId: condominio.id,

        papel: vinculo.papel || "outro",

        contatoPrincipal: Boolean(vinculo.contatoPrincipal),

        responsavelFinanceiro: Boolean(vinculo.responsavelFinanceiro),
      });
    });
  });

  return vinculos;
}

async function sincronizarVinculosDoCliente(clienteId) {
  const batch = writeBatch(db);
  let possuiAlteracoes = false;

  condominios.forEach((condominio) => {
    const vinculosAtuais = Array.isArray(condominio.clientesVinculados)
      ? condominio.clientesVinculados
      : [];

    const vinculosAtualizados = vinculosAtuais
      .filter(
        (vinculo) =>
          normalizarIdClienteVinculado(vinculo.clienteId) !== clienteId,
      )
      .map((vinculo) => ({ ...vinculo }));

    const vinculosDoCondominio = vinculosDoClienteRascunho.filter(
      (vinculo) => vinculo.condominioId === condominio.id,
    );

    vinculosDoCondominio.forEach((vinculoRascunho) => {
      if (vinculoRascunho.contatoPrincipal) {
        vinculosAtualizados.forEach((vinculo) => {
          vinculo.contatoPrincipal = false;
        });
      }

      if (vinculoRascunho.responsavelFinanceiro) {
        vinculosAtualizados.forEach((vinculo) => {
          vinculo.responsavelFinanceiro = false;
        });
      }

      vinculosAtualizados.push({
        clienteId,

        papel: vinculoRascunho.papel,

        contatoPrincipal: Boolean(vinculoRascunho.contatoPrincipal),

        responsavelFinanceiro: Boolean(vinculoRascunho.responsavelFinanceiro),
      });
    });

    const antes = JSON.stringify(vinculosAtuais);
    const depois = JSON.stringify(vinculosAtualizados);

    if (antes === depois) {
      return;
    }

    possuiAlteracoes = true;

    condominio.clientesVinculados = vinculosAtualizados;

    batch.set(
      doc(db, "condominios", condominio.id),
      {
        clientesVinculados: vinculosAtualizados,
        atualizadoEm: serverTimestamp(),
      },
      {
        merge: true,
      },
    );
  });

  if (possuiAlteracoes) {
    await batch.commit();
  }

  return true;
}

function popularSelectDeCondominios() {
  const valorAtual = customerCondominiumSelect.value;

  customerCondominiumSelect.innerHTML = "";

  const optionInicial = document.createElement("option");

  optionInicial.value = "";

  optionInicial.textContent = condominios.length
    ? "Selecione um condomínio"
    : "Nenhum condomínio cadastrado";

  customerCondominiumSelect.appendChild(optionInicial);

  const idsJaVinculados = new Set(
    vinculosDoClienteRascunho.map((vinculo) => vinculo.condominioId),
  );

  [...condominios]
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .forEach((condominio) => {
      if (idsJaVinculados.has(condominio.id)) {
        return;
      }

      const option = document.createElement("option");

      option.value = condominio.id;

      option.textContent = condominio.nome;

      customerCondominiumSelect.appendChild(option);
    });

  const valorAindaExiste = Array.from(customerCondominiumSelect.options).some(
    (option) => option.value === valorAtual,
  );

  if (valorAindaExiste) {
    customerCondominiumSelect.value = valorAtual;
  }

  customerCondominiumSelect.disabled = condominios.length === 0;

  linkCustomerCondominiumButton.disabled = condominios.length === 0;
}

function abrirPainelDeVinculo() {
  popularSelectDeCondominios();

  customerCondominiumLinkPanel.hidden = false;

  openCustomerCondominiumLinkButton.setAttribute("aria-expanded", "true");

  window.setTimeout(() => {
    customerCondominiumSelect.focus();
  }, 30);
}

function fecharPainelDeVinculo() {
  customerCondominiumLinkPanel.hidden = true;

  openCustomerCondominiumLinkButton.setAttribute("aria-expanded", "false");

  customerCondominiumSelect.value = "";

  customerCondominiumRole.value = "sindico";

  customerCondominiumPrimary.checked = false;

  customerCondominiumFinancial.checked = false;
}

function renderizarVinculosNoFormulario() {
  customerCondominiumsList.innerHTML = "";

  const vinculosValidos = vinculosDoClienteRascunho.filter((vinculo) =>
    Boolean(obterCondominioPorId(vinculo.condominioId)),
  );

  customerCondominiumsCount.textContent = formatarQuantidadeVinculos(
    vinculosValidos.length,
  );

  customerCondominiumsEmpty.hidden = vinculosValidos.length > 0;

  customerCondominiumsList.hidden = vinculosValidos.length === 0;

  vinculosValidos.forEach((vinculo) => {
    const condominio = obterCondominioPorId(vinculo.condominioId);

    const fragmento = customerCondominiumTemplate.content.cloneNode(true);

    const name = fragmento.querySelector(".customer-condominium-card__name");

    const role = fragmento.querySelector(".customer-condominium-card__role");

    const address = fragmento.querySelector(
      ".customer-condominium-card__address",
    );

    const primaryBadge = fragmento.querySelector("[data-primary-badge]");

    const financialBadge = fragmento.querySelector("[data-financial-badge]");

    const openButton = fragmento.querySelector(
      ".customer-condominium-card__open",
    );

    const removeButton = fragmento.querySelector(
      ".customer-condominium-card__remove",
    );

    name.textContent = condominio.nome;

    role.textContent = papelCondominioConfig[vinculo.papel] || "Outro";

    address.textContent = obterEnderecoDoCondominio(condominio);

    primaryBadge.hidden = !vinculo.contatoPrincipal;

    financialBadge.hidden = !vinculo.responsavelFinanceiro;

    openButton.setAttribute("aria-label", `Abrir ${condominio.nome}`);

    openButton.addEventListener("click", () => {
      abrirCadastroDoCondominio(condominio.id);
    });

    removeButton.setAttribute("aria-label", `Desvincular ${condominio.nome}`);

    removeButton.addEventListener("click", () => {
      vinculosDoClienteRascunho = vinculosDoClienteRascunho.filter(
        (item) => item.condominioId !== vinculo.condominioId,
      );

      renderizarVinculosNoFormulario();

      mostrarFeedback(
        "Condomínio removido do vínculo. Salve o cliente para confirmar.",
      );
    });

    customerCondominiumsList.appendChild(fragmento);
  });

  popularSelectDeCondominios();
}

function vincularCondominioAoCliente() {
  const condominioId = customerCondominiumSelect.value;

  if (!condominioId) {
    mostrarFeedback("Selecione um condomínio.");

    customerCondominiumSelect.focus();

    return;
  }

  const jaVinculado = vinculosDoClienteRascunho.some(
    (vinculo) => vinculo.condominioId === condominioId,
  );

  if (jaVinculado) {
    mostrarFeedback("Este condomínio já está vinculado ao cliente.");

    return;
  }

  vinculosDoClienteRascunho.push({
    condominioId,

    papel: customerCondominiumRole.value || "outro",

    contatoPrincipal: customerCondominiumPrimary.checked,

    responsavelFinanceiro: customerCondominiumFinancial.checked,
  });

  fecharPainelDeVinculo();

  renderizarVinculosNoFormulario();

  mostrarFeedback(
    "Condomínio adicionado. Salve o cliente para confirmar o vínculo.",
  );
}

function renderizarCondominiosNosDetalhes(cliente) {
  const vinculos = obterVinculosDoCliente(cliente.id).filter((vinculo) =>
    Boolean(obterCondominioPorId(vinculo.condominioId)),
  );

  detailsCondominiumsList.innerHTML = "";

  detailsCondominiumsCount.textContent = formatarQuantidadeVinculos(
    vinculos.length,
  );

  detailsCondominiumsEmpty.hidden = vinculos.length > 0;

  detailsCondominiumsList.hidden = vinculos.length === 0;

  vinculos.forEach((vinculo) => {
    const condominio = obterCondominioPorId(vinculo.condominioId);

    const fragmento = detailsCondominiumTemplate.content.cloneNode(true);

    const name = fragmento.querySelector(".details-condominium-card__name");

    const role = fragmento.querySelector(".details-condominium-card__role");

    const address = fragmento.querySelector(
      ".details-condominium-card__address",
    );

    const openButton = fragmento.querySelector(
      ".details-condominium-card__open",
    );

    name.textContent = condominio.nome;

    const complementos = [];

    if (vinculo.contatoPrincipal) {
      complementos.push("Contato principal");
    }

    if (vinculo.responsavelFinanceiro) {
      complementos.push("Financeiro");
    }

    role.textContent = [
      papelCondominioConfig[vinculo.papel] || "Outro",

      ...complementos,
    ].join(" · ");

    address.textContent = obterEnderecoDoCondominio(condominio);

    openButton.setAttribute("aria-label", `Abrir ${condominio.nome}`);

    openButton.addEventListener("click", () => {
      abrirCadastroDoCondominio(condominio.id);
    });

    detailsCondominiumsList.appendChild(fragmento);
  });
}
/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const hoje = obterInicioDoDia();

  const clientesVisiveis = clientes.filter(
    (cliente) => cliente.status !== "inativo",
  );

  const total = clientesVisiveis.length;

  const ativos = clientesVisiveis.filter(
    (cliente) => cliente.status === "ativo",
  ).length;

  const novosNoMes = clientesVisiveis.filter((cliente) => {
    const dataCadastro = criarDataLocal(cliente.cadastradoEm);

    return (
      dataCadastro &&
      dataCadastro.getFullYear() === hoje.getFullYear() &&
      dataCadastro.getMonth() === hoje.getMonth()
    );
  }).length;

  const comServicos = clientesVisiveis.filter(
    (cliente) => Number(cliente.quantidadeOrdens) > 0,
  ).length;

  summaryTotal.textContent = String(total);

  summaryActive.textContent = String(ativos);

  summaryNewMonth.textContent = String(novosNoMes);

  summaryWithOrders.textContent = String(comServicos);
}

/* =========================================
   ABAS RÁPIDAS
========================================= */

function clienteEhNovo(cliente) {
  const dataCadastro = criarDataLocal(cliente.cadastradoEm);

  if (!dataCadastro) {
    return false;
  }

  const hoje = obterInicioDoDia();

  return (
    dataCadastro.getFullYear() === hoje.getFullYear() &&
    dataCadastro.getMonth() === hoje.getMonth()
  );
}

function correspondeAAba(cliente) {
  const filtroSolicitaInativos = filtrosAplicados.status.includes("inativo");

  /*
   * Quando o administrador escolhe "Inativo" nos filtros,
   * o filtro explícito assume prioridade sobre os cards de resumo.
   */
  if (filtroSolicitaInativos) {
    return true;
  }

  /*
   * Fora do filtro específico, clientes inativos permanecem
   * escondidos de Total, Ativos, Novos e Com serviços.
   */
  if (cliente.status === "inativo") {
    return false;
  }

  if (abaAtual === "todos") {
    return true;
  }

  if (abaAtual === "ativos") {
    return cliente.status === "ativo";
  }

  if (abaAtual === "novos") {
    return clienteEhNovo(cliente);
  }

  if (abaAtual === "com-servicos") {
    return Number(cliente.quantidadeOrdens) > 0;
  }

  if (abaAtual === "com-pendencias") {
    return cliente.status === "com-pendencia" || Boolean(cliente.aviso);
  }

  return true;
}
function atualizarAbas() {
  customerTabButtons.forEach((button) => {
    const estaAtiva = button.dataset.customerTab === abaAtual;

    button.classList.toggle("is-active", estaAtiva);

    button.setAttribute("aria-pressed", String(estaAtiva));
  });

  const configuracao = abasConfig[abaAtual] || abasConfig.todos;

  customersContentEyebrow.textContent = configuracao.subtitulo;

  customersContentTitle.textContent = configuracao.titulo;
}

function alterarAba(novaAba) {
  if (!abasConfig[novaAba]) {
    return;
  }

  abaAtual = novaAba;

  atualizarAbas();

  fecharTodosOsMenus();

  renderizarClientes();
}

/* =========================================
   PESQUISA
========================================= */

function correspondeAPesquisa(cliente) {
  const pesquisa = normalizarTexto(customersSearch.value);

  if (!pesquisa) {
    return true;
  }

  const condominiosDoCliente = obterVinculosDoCliente(cliente.id)
    .map((vinculo) => {
      const condominio = obterCondominioPorId(vinculo.condominioId);

      return `${condominio?.nome || ""} ${
        papelCondominioConfig[vinculo.papel] || ""
      }`;
    })
    .join(" ");

  const conteudoPesquisavel = normalizarTexto(
    [
      cliente.id,
      cliente.nome,
      cliente.telefone,
      cliente.email,
      cliente.cep,
      cliente.rua,
      cliente.numero,
      cliente.complemento,
      cliente.bairro,
      cliente.cidade,
      cliente.estado,
      contatoConfig[cliente.canalPreferido],
      statusConfig[cliente.status]?.nome,
      cliente.observacoes,
      cliente.aviso,
      condominiosDoCliente,
    ].join(" "),
  );

  return conteudoPesquisavel.includes(pesquisa);
}

/* =========================================
   FILTROS
========================================= */

function obterStatusSelecionados() {
  return Array.from(statusFilterInputs)
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function correspondeAoFiltroDeCadastro(cliente) {
  const filtro = filtrosAplicados.cadastro;

  if (!filtro) {
    return true;
  }

  const dataCadastro = criarDataLocal(cliente.cadastradoEm);

  if (!dataCadastro) {
    return false;
  }

  const hoje = obterInicioDoDia();

  if (filtro === "mes-atual") {
    return (
      dataCadastro.getFullYear() === hoje.getFullYear() &&
      dataCadastro.getMonth() === hoje.getMonth()
    );
  }

  if (filtro === "ultimos-30" || filtro === "ultimos-90") {
    const quantidadeDias = filtro === "ultimos-30" ? 30 : 90;

    const limite = obterInicioDoDia();

    limite.setDate(limite.getDate() - quantidadeDias);

    return dataCadastro >= limite;
  }

  if (filtro === "ano-atual") {
    return dataCadastro.getFullYear() === hoje.getFullYear();
  }

  return true;
}

function correspondeAoFiltroDeOrdens(cliente) {
  const filtro = filtrosAplicados.ordens;

  const quantidadeOrdens = Number(cliente.quantidadeOrdens) || 0;

  const ordensAtivas = Number(cliente.ordensAtivas) || 0;

  if (!filtro) {
    return true;
  }

  if (filtro === "sem-servicos") {
    return quantidadeOrdens === 0;
  }

  if (filtro === "com-servicos") {
    return quantidadeOrdens > 0;
  }

  if (filtro === "mais-de-tres") {
    return quantidadeOrdens > 3;
  }

  if (filtro === "servico-ativo") {
    return ordensAtivas > 0;
  }

  return true;
}

function correspondeAosFiltros(cliente) {
  const statusCorresponde =
    filtrosAplicados.status.length === 0 ||
    filtrosAplicados.status.includes(cliente.status);

  const cidadeCorresponde =
    !filtrosAplicados.cidade || cliente.cidadeSlug === filtrosAplicados.cidade;

  const contatoCorresponde =
    !filtrosAplicados.contato ||
    cliente.canalPreferido === filtrosAplicados.contato;

  return (
    statusCorresponde &&
    cidadeCorresponde &&
    contatoCorresponde &&
    correspondeAoFiltroDeCadastro(cliente) &&
    correspondeAoFiltroDeOrdens(cliente)
  );
}

function sincronizarEstiloDosFiltros() {
  document.querySelectorAll(".filter-option").forEach((opcao) => {
    const input = opcao.querySelector('input[name="statusFilter"]');

    opcao.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function contarFiltrosAtivos() {
  let quantidade = filtrosAplicados.status.length;

  if (filtrosAplicados.cidade) {
    quantidade += 1;
  }

  if (filtrosAplicados.contato) {
    quantidade += 1;
  }

  if (filtrosAplicados.cadastro) {
    quantidade += 1;
  }

  if (filtrosAplicados.ordens) {
    quantidade += 1;
  }

  return quantidade;
}

function atualizarContagemDeFiltros() {
  const quantidade = contarFiltrosAtivos();

  activeFilterCount.textContent = String(quantidade);

  activeFilterCount.hidden = quantidade === 0;
}

function abrirFiltros() {
  fecharOrdenacao();

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
    status: obterStatusSelecionados(),

    cidade: cityFilter.value,

    contato: contactFilter.value,

    cadastro: registrationFilter.value,

    ordens: ordersFilter.value,
  };

  const filtroSolicitaInativos = filtrosAplicados.status.includes("inativo");

  if (filtroSolicitaInativos) {
    resumoSelecionado = "todos";
    abaAtual = "todos";

    summaryFilterButtons.forEach((button) => {
      const estaAtivo = button.dataset.summaryFilter === "todos";

      button.classList.toggle("is-active", estaAtivo);

      button.setAttribute("aria-pressed", String(estaAtivo));
    });

    customersSummaryHint.hidden = true;

    atualizarAbas();
  }

  atualizarContagemDeFiltros();

  renderizarClientes();

  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparPesquisaEFiltros() {
  customersSearch.value = "";

  statusFilterInputs.forEach((input) => {
    input.checked = false;
  });

  cityFilter.value = "";

  contactFilter.value = "";

  registrationFilter.value = "";

  ordersFilter.value = "";

  filtrosAplicados = {
    status: [],
    cidade: "",
    contato: "",
    cadastro: "",
    ordens: "",
  };

  abaAtual = resumoSelecionado || "todos";

  sincronizarEstiloDosFiltros();

  atualizarContagemDeFiltros();

  atualizarAbas();

  renderizarClientes();

  mostrarFeedback("Pesquisa e filtros removidos.");
}

/* =========================================
   ORDENAÇÃO
========================================= */

function abrirOrdenacao() {
  fecharFiltros();

  const seraAberto = sortMenu.hidden;

  sortMenu.hidden = !seraAberto;

  sortButton.setAttribute("aria-expanded", String(seraAberto));
}

function fecharOrdenacao() {
  sortMenu.hidden = true;

  sortButton.setAttribute("aria-expanded", "false");
}

function atualizarOpcoesDeOrdenacao() {
  sortOptionButtons.forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.sortOption === ordenacaoAtual,
    );
  });
}

function ordenarClientes(lista) {
  const copia = [...lista];

  if (ordenacaoAtual === "mais-recentes") {
    return copia.sort(
      (a, b) => criarDataLocal(b.cadastradoEm) - criarDataLocal(a.cadastradoEm),
    );
  }

  if (ordenacaoAtual === "mais-antigos") {
    return copia.sort(
      (a, b) => criarDataLocal(a.cadastradoEm) - criarDataLocal(b.cadastradoEm),
    );
  }

  if (ordenacaoAtual === "mais-servicos") {
    return copia.sort(
      (a, b) => Number(b.quantidadeOrdens) - Number(a.quantidadeOrdens),
    );
  }

  if (ordenacaoAtual === "maior-valor") {
    return copia.sort(
      (a, b) => Number(b.valorMovimentado) - Number(a.valorMovimentado),
    );
  }

  return copia.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function alterarOrdenacao(novaOrdenacao) {
  const opcoesPermitidas = [
    "nome",
    "mais-recentes",
    "mais-antigos",
    "mais-servicos",
    "maior-valor",
  ];

  if (!opcoesPermitidas.includes(novaOrdenacao)) {
    return;
  }

  ordenacaoAtual = novaOrdenacao;

  atualizarOpcoesDeOrdenacao();

  fecharOrdenacao();

  renderizarClientes();

  mostrarFeedback("Ordenação atualizada.");
}

function obterClientesFiltrados() {
  return ordenarClientes(
    clientes
      .filter(correspondeAAba)
      .filter(correspondeAPesquisa)
      .filter(correspondeAosFiltros),
  );
}
/* =========================================
   MENUS DOS CARDS
========================================= */

function fecharTodosOsMenus(excecao = null) {
  document.querySelectorAll(".customer-card__options").forEach((menu) => {
    if (menu !== excecao) {
      menu.hidden = true;
    }
  });

  document.querySelectorAll(".customer-card__menu").forEach((button) => {
    const card = button.closest(".customer-card");

    const menu = card?.querySelector(".customer-card__options");

    if (menu !== excecao) {
      button.setAttribute("aria-expanded", "false");
    }
  });
}

/* =========================================
   CONTATOS E NAVEGAÇÃO
========================================= */

function abrirWhatsApp(cliente) {
  const telefone = somenteNumeros(cliente.telefone);

  if (!telefone) {
    mostrarFeedback("O cliente não possui telefone cadastrado.");

    return;
  }

  const telefoneComPais = telefone.startsWith("55")
    ? telefone
    : `55${telefone}`;

  const mensagem = encodeURIComponent(
    `Olá, ${cliente.nome}. Aqui é da Salvateck Group.`,
  );

  window.open(
    `https://wa.me/${telefoneComPais}?text=${mensagem}`,
    "_blank",
    "noopener,noreferrer",
  );
}

function ligarParaCliente(cliente) {
  const telefone = somenteNumeros(cliente.telefone);

  if (!telefone) {
    mostrarFeedback("O cliente não possui telefone cadastrado.");

    return;
  }

  window.location.href = `tel:${telefone}`;
}

function enviarEmail(cliente) {
  if (!cliente.email) {
    mostrarFeedback("O cliente não possui e-mail cadastrado.");

    return;
  }

  window.location.href = `mailto:${cliente.email}`;
}

function abrirOrdensDoCliente(cliente) {
  const parametros = new URLSearchParams({
    perfil: "admin",
    cliente: cliente.id,
  });

  window.location.href = `ordens.html?${parametros.toString()}`;
}

function criarOrdemParaCliente(cliente) {
  const parametros = new URLSearchParams({
    perfil: "admin",
    cliente: cliente.id,
  });

  window.location.href = `nova-ordem.html?${parametros.toString()}`;
}
/* =========================================
   STATUS VISUAL DO CLIENTE
========================================= */

async function alternarStatusVisualDoCliente(cliente) {
  const clienteEstaInativo = cliente.status === "inativo";

  const novoStatus = clienteEstaInativo ? "ativo" : "inativo";

  const mensagemDeConfirmacao = clienteEstaInativo
    ? `Deseja reativar o cliente "${cliente.nome}" na listagem?`
    : `Deseja desativar o cliente "${cliente.nome}" da listagem?\n\nO cliente continuará podendo acessar o sistema normalmente.`;

  const confirmou = window.confirm(mensagemDeConfirmacao);

  if (!confirmou) {
    return;
  }

  try {
    await setDoc(
      doc(db, "usuarios", cliente.id),
      {
        statusCadastro: novoStatus,
        aviso: "",
        atualizadoEm: serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    await carregarDadosDeClientesDoFirestore();

    atualizarResumo();
    atualizarAbas();
    renderizarClientes();

    mostrarFeedback(
      clienteEstaInativo
        ? "Cliente reativado na listagem."
        : "Cliente desativado da listagem.",
    );
  } catch (error) {
    console.error(
      "[Clientes] Não foi possível alterar o status visual:",
      error,
    );

    mostrarFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a alteração do cliente."
        : "Não foi possível alterar o status do cliente.",
    );
  }
}
/* =========================================
   MODAL DE CADASTRO
========================================= */

function limparErrosDoFormulario() {
  customerForm.querySelectorAll(".modal-field").forEach((field) => {
    field.classList.remove("has-error");
  });

  customerForm.querySelectorAll(".modal-field__error").forEach((error) => {
    error.textContent = "";
  });

  customerForm.querySelectorAll("[aria-invalid='true']").forEach((input) => {
    input.removeAttribute("aria-invalid");
  });
}

function obterContainerDoCampo(campo) {
  return campo.closest(".modal-field");
}

function limparErroDoCampo(campo) {
  const container = obterContainerDoCampo(campo);

  if (!container) {
    return;
  }

  container.classList.remove("has-error");

  campo.removeAttribute("aria-invalid");

  const erro = container.querySelector(".modal-field__error");

  if (erro) {
    erro.textContent = "";
  }
}

function definirErroDoCampo(campo, mensagem) {
  const container = obterContainerDoCampo(campo);

  if (!container) {
    return;
  }

  container.classList.add("has-error");

  campo.setAttribute("aria-invalid", "true");

  const erro = container.querySelector(".modal-field__error");

  if (erro) {
    erro.textContent = mensagem;
  }
}

function limparFormularioDoCliente() {
  customerForm.reset();

  customerIdInput.value = "";

  customerContactPreferenceInput.value = "whatsapp";

  customerStatusInput.value = "ativo";

  vinculosDoClienteRascunho = [];

  fecharPainelDeVinculo();

  renderizarVinculosNoFormulario();

  limparErrosDoFormulario();
}

function preencherFormularioDoCliente(cliente) {
  customerIdInput.value = cliente.id;

  customerNameInput.value = cliente.nome;

  customerPhoneInput.value = formatarTelefone(cliente.telefone);

  customerEmailInput.value = cliente.email;

  customerPostalCodeInput.value = formatarCep(cliente.cep);

  customerStateInput.value = cliente.estado;

  customerStreetInput.value = cliente.rua;

  customerAddressNumberInput.value = cliente.numero;

  customerAddressComplementInput.value = cliente.complemento || "";

  customerDistrictInput.value = cliente.bairro;

  customerCityInput.value = cliente.cidade;

  customerContactPreferenceInput.value = cliente.canalPreferido;

  customerStatusInput.value = cliente.status;

  customerNotesInput.value = cliente.observacoes || "";

  vinculosDoClienteRascunho = clonarDados(obterVinculosDoCliente(cliente.id));

  renderizarVinculosNoFormulario();
}

function abrirModalDeCliente(cliente = null, campoParaFocar = null) {
  fecharTodosOsMenus();

  fecharOrdenacao();

  fecharFiltros();

  limparFormularioDoCliente();

  clienteEmEdicaoId = cliente?.id || null;

  if (cliente) {
    customerModalEyebrow.textContent = "Atualização de cadastro";

    customerModalTitle.textContent = "Editar cliente";

    saveCustomerLabel.textContent = "Salvar alterações";

    preencherFormularioDoCliente(cliente);
  } else {
    customerModalEyebrow.textContent = "Cadastro de cliente";

    customerModalTitle.textContent = "Novo cliente";

    saveCustomerLabel.textContent = "Salvar cliente";
  }

  customerModal.hidden = false;

  document.body.classList.add("modal-open");

  window.setTimeout(() => {
    if (campoParaFocar === "status") {
      customerStatusInput.focus();

      return;
    }

    if (campoParaFocar === "condominios") {
      abrirPainelDeVinculo();

      return;
    }

    customerNameInput.focus();
  }, 50);
}

function fecharModalDeCliente() {
  customerModal.hidden = true;

  clienteEmEdicaoId = null;

  limparFormularioDoCliente();

  if (customerDetailsModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

/* =========================================
   VALIDAÇÃO DO CLIENTE
========================================= */

function emailEhValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarFormularioDoCliente() {
  limparErrosDoFormulario();

  const camposInvalidos = [];

  const nome = limparTexto(customerNameInput.value);

  if (nome.length < 3 || nome.split(/\s+/).length < 2) {
    definirErroDoCampo(customerNameInput, "Informe o nome completo.");

    camposInvalidos.push(customerNameInput);
  }

  const telefone = somenteNumeros(customerPhoneInput.value);

  if (telefone.length !== 10 && telefone.length !== 11) {
    definirErroDoCampo(
      customerPhoneInput,
      "Informe um telefone válido com DDD.",
    );

    camposInvalidos.push(customerPhoneInput);
  }

  const email = limparTexto(customerEmailInput.value);

  if (!emailEhValido(email)) {
    definirErroDoCampo(customerEmailInput, "Informe um e-mail válido.");

    camposInvalidos.push(customerEmailInput);
  }

  const cep = somenteNumeros(customerPostalCodeInput.value);

  if (cep.length !== 8) {
    definirErroDoCampo(customerPostalCodeInput, "Informe um CEP válido.");

    camposInvalidos.push(customerPostalCodeInput);
  }

  if (!customerStateInput.value) {
    definirErroDoCampo(customerStateInput, "Selecione o estado.");

    camposInvalidos.push(customerStateInput);
  }

  if (limparTexto(customerStreetInput.value).length < 3) {
    definirErroDoCampo(customerStreetInput, "Informe a rua ou avenida.");

    camposInvalidos.push(customerStreetInput);
  }

  if (!limparTexto(customerAddressNumberInput.value)) {
    definirErroDoCampo(customerAddressNumberInput, "Informe o número.");

    camposInvalidos.push(customerAddressNumberInput);
  }

  if (limparTexto(customerDistrictInput.value).length < 2) {
    definirErroDoCampo(customerDistrictInput, "Informe o bairro.");

    camposInvalidos.push(customerDistrictInput);
  }

  if (limparTexto(customerCityInput.value).length < 2) {
    definirErroDoCampo(customerCityInput, "Informe a cidade.");

    camposInvalidos.push(customerCityInput);
  }

  if (camposInvalidos.length > 0) {
    camposInvalidos[0].focus();

    mostrarFeedback("Revise os campos destacados.");

    return false;
  }

  return true;
}

function obterAvisoPorStatus(status) {
  if (status === "cadastro-incompleto") {
    return "O cadastro possui informações que ainda precisam ser confirmadas.";
  }

  if (status === "com-pendencia") {
    return "O cliente possui uma pendência que exige acompanhamento.";
  }

  return "";
}
/* =========================================
   ACESSO DO CLIENTE
========================================= */

function gerarSenhaTemporariaSegura() {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";

  const valoresAleatorios = new Uint32Array(24);

  window.crypto.getRandomValues(valoresAleatorios);

  const parteAleatoria = Array.from(
    valoresAleatorios,
    (valor) => caracteres[valor % caracteres.length],
  ).join("");

  return `Aa1!${parteAleatoria}`;
}

async function criarContaSecundariaDoCliente(nome, email) {
  const nomeDoAplicativo = `cliente-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const aplicativoSecundario = initializeApp(firebaseConfig, nomeDoAplicativo);

  const autenticacaoSecundaria = getAuth(aplicativoSecundario);

  let usuarioCriado = null;

  try {
    autenticacaoSecundaria.languageCode = "pt-BR";

    await setPersistence(autenticacaoSecundaria, inMemoryPersistence);

    const credencial = await createUserWithEmailAndPassword(
      autenticacaoSecundaria,
      email,
      gerarSenhaTemporariaSegura(),
    );

    usuarioCriado = credencial.user;

    await updateProfile(usuarioCriado, {
      displayName: nome,
    });

    return {
      app: aplicativoSecundario,
      auth: autenticacaoSecundaria,
      user: usuarioCriado,
    };
  } catch (error) {
    if (usuarioCriado) {
      try {
        await deleteUser(usuarioCriado);
      } catch (deleteError) {
        console.warn(
          "[Clientes] Não foi possível desfazer a conta incompleta:",
          deleteError,
        );
      }
    }

    try {
      await signOut(autenticacaoSecundaria);
    } catch (signOutError) {
      console.warn(
        "[Clientes] Não foi possível encerrar a autenticação secundária:",
        signOutError,
      );
    }

    try {
      await deleteApp(aplicativoSecundario);
    } catch (deleteAppError) {
      console.warn(
        "[Clientes] Não foi possível remover o aplicativo secundário:",
        deleteAppError,
      );
    }

    throw error;
  }
}

async function encerrarContaSecundaria(contexto) {
  if (!contexto) {
    return;
  }

  try {
    await signOut(contexto.auth);
  } catch (error) {
    console.warn(
      "[Clientes] Não foi possível encerrar a sessão secundária:",
      error,
    );
  }

  try {
    await deleteApp(contexto.app);
  } catch (error) {
    console.warn(
      "[Clientes] Não foi possível remover o aplicativo secundário:",
      error,
    );
  }
}
/* =========================================
   SALVAMENTO DO CLIENTE
========================================= */

function definirEstadoDeSalvamento(ativo) {
  saveCustomerButton.disabled = ativo;

  cancelCustomerButton.disabled = ativo;

  saveCustomerLabel.hidden = ativo;

  saveCustomerLoading.hidden = !ativo;
}

async function salvarCliente(event) {
  event.preventDefault();

  if (!validarFormularioDoCliente()) {
    return;
  }

  definirEstadoDeSalvamento(true);

  const clienteExistente = obterClientePorId(clienteEmEdicaoId);

  const status = customerStatusInput.value;

  const nome = limparTexto(customerNameInput.value);

  const email = limparTexto(customerEmailInput.value).toLowerCase();

  const endereco = {
    cep: formatarCep(customerPostalCodeInput.value),

    estado: customerStateInput.value,

    rua: limparTexto(customerStreetInput.value),

    logradouro: limparTexto(customerStreetInput.value),

    numero: limparTexto(customerAddressNumberInput.value),

    complemento: limparTexto(customerAddressComplementInput.value),

    bairro: limparTexto(customerDistrictInput.value),

    cidade: limparTexto(customerCityInput.value),
  };

  let contextoAcesso = null;

  let cadastroPersistido = false;

  let emailDeDefinicaoEnviado = false;

  try {
    let clienteUid = clienteExistente?.uid || clienteExistente?.id || "";

    if (!clienteExistente) {
      contextoAcesso = await criarContaSecundariaDoCliente(nome, email);

      clienteUid = contextoAcesso.user.uid;
    }

    const clienteReference = doc(db, "usuarios", clienteUid);

    const dadosDoCliente = {
      uid: clienteUid,

      role: "cliente",

      nome,

      telefone: formatarTelefone(customerPhoneInput.value),

      telefoneNumeros: somenteNumeros(customerPhoneInput.value),

      email,

      ativo: clienteExistente?.acessoAtivo ?? true,

      statusCadastro: status,

      statusAcesso:
        clienteExistente?.statusAcesso || "aguardando-definicao-senha",

      canalPreferido: customerContactPreferenceInput.value,

      observacoesAdministrativas: limparTexto(customerNotesInput.value),

      aviso: obterAvisoPorStatus(status),

      cidadeSlug: criarSlug(customerCityInput.value),

      endereco,

      cep: endereco.cep,

      estado: endereco.estado,

      rua: endereco.rua,

      numero: endereco.numero,

      complemento: endereco.complemento,

      bairro: endereco.bairro,

      cidade: endereco.cidade,

      possuiAcesso: clienteExistente?.possuiAcesso ?? false,

      origemCadastro:
        clienteExistente?.origemCadastro || "cadastro-administrativo",

      atualizadoEm: serverTimestamp(),
    };

    if (!clienteExistente) {
      dadosDoCliente.criadoEm = serverTimestamp();
    }

    await setDoc(clienteReference, dadosDoCliente, {
      merge: true,
    });

    cadastroPersistido = true;

    await sincronizarVinculosDoCliente(clienteReference.id);

    if (!clienteExistente && contextoAcesso) {
      try {
        await sendPasswordResetEmail(contextoAcesso.auth, email);

        emailDeDefinicaoEnviado = true;

        await setDoc(
          clienteReference,
          {
            conviteEnviadoEm: serverTimestamp(),
          },
          {
            merge: true,
          },
        );
      } catch (emailError) {
        console.warn(
          "[Clientes] Cliente criado, mas o e-mail para definição de senha não foi enviado:",
          emailError,
        );
      }
    }

    await carregarDadosDeClientesDoFirestore();

    fecharModalDeCliente();

    atualizarOpcoesDeOrdenacao();

    atualizarAbas();

    atualizarResumo();

    popularSelectDeCondominios();

    renderizarClientes();

    if (clienteExistente) {
      mostrarFeedback("Cadastro e vínculos atualizados com sucesso.");
    } else if (emailDeDefinicaoEnviado) {
      mostrarFeedback(
        "Cliente cadastrado. O e-mail para definir a senha foi enviado.",
      );
    } else {
      mostrarFeedback(
        "Cliente cadastrado, mas o e-mail de acesso não pôde ser enviado. Ele poderá usar a recuperação de senha.",
      );
    }
  } catch (error) {
    console.error("[Clientes] Não foi possível salvar o cliente:", error);

    if (contextoAcesso?.user && !cadastroPersistido) {
      try {
        await deleteUser(contextoAcesso.user);
      } catch (deleteError) {
        console.warn(
          "[Clientes] Não foi possível desfazer a conta criada:",
          deleteError,
        );
      }
    }

    if (error?.code === "auth/email-already-in-use") {
      definirErroDoCampo(
        customerEmailInput,
        "Este e-mail já possui uma conta cadastrada.",
      );

      mostrarFeedback("Já existe uma conta utilizando este e-mail.");
    } else if (error?.code === "auth/invalid-email") {
      definirErroDoCampo(customerEmailInput, "Informe um e-mail válido.");

      mostrarFeedback("O e-mail informado não é válido.");
    } else if (error?.code === "auth/network-request-failed") {
      mostrarFeedback(
        "Não foi possível acessar o Firebase. Verifique sua internet.",
      );
    } else if (error?.code === "permission-denied") {
      mostrarFeedback(
        "O Firebase bloqueou a gravação. Revise as regras do Firestore.",
      );
    } else if (cadastroPersistido) {
      mostrarFeedback(
        "O cliente foi criado, mas houve uma falha ao concluir o cadastro. Atualize a página e confira os dados.",
      );
    } else {
      mostrarFeedback("Não foi possível salvar os dados do cliente.");
    }
  } finally {
    await encerrarContaSecundaria(contextoAcesso);

    definirEstadoDeSalvamento(false);
  }
}

/* =========================================
   CONSULTA DE CEP
========================================= */

async function buscarCepDoCliente() {
  const cep = somenteNumeros(customerPostalCodeInput.value);

  limparErroDoCampo(customerPostalCodeInput);

  if (cep.length !== 8) {
    definirErroDoCampo(
      customerPostalCodeInput,
      "Informe os oito números do CEP.",
    );

    customerPostalCodeInput.focus();

    return;
  }

  const textoOriginal = searchCustomerPostalCodeButton.textContent;

  searchCustomerPostalCodeButton.disabled = true;

  searchCustomerPostalCodeButton.textContent = "Buscando...";

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

    if (!resposta.ok) {
      throw new Error("Falha na consulta do CEP.");
    }

    const endereco = await resposta.json();

    if (endereco.erro) {
      throw new Error("CEP não encontrado.");
    }

    customerStreetInput.value =
      endereco.logradouro || customerStreetInput.value;

    customerDistrictInput.value =
      endereco.bairro || customerDistrictInput.value;

    customerCityInput.value = endereco.localidade || customerCityInput.value;

    customerStateInput.value = endereco.uf || customerStateInput.value;

    [
      customerStreetInput,
      customerDistrictInput,
      customerCityInput,
      customerStateInput,
    ].forEach(limparErroDoCampo);

    if (!customerAddressNumberInput.value) {
      customerAddressNumberInput.focus();
    }

    mostrarFeedback("Endereço localizado pelo CEP.");
  } catch (error) {
    console.warn("Não foi possível consultar o CEP.", error);

    mostrarFeedback(
      "Não foi possível localizar o CEP. Preencha o endereço manualmente.",
    );
  } finally {
    searchCustomerPostalCodeButton.disabled = false;

    searchCustomerPostalCodeButton.textContent = textoOriginal;
  }
}

/* =========================================
   MODAL DE DETALHES
========================================= */

function abrirDetalhesDoCliente(cliente) {
  if (!cliente) {
    return;
  }

  fecharTodosOsMenus();

  clienteNosDetalhesId = cliente.id;

  const status = statusConfig[cliente.status] || statusConfig.ativo;

  detailsAvatar.textContent = obterIniciais(cliente.nome);

  detailsCode.textContent = cliente.id;

  detailsName.textContent = cliente.nome;

  detailsStatus.textContent = status.nome;

  detailsPhone.textContent = cliente.telefone || "Não informado";

  detailsEmail.textContent = cliente.email || "Não informado";

  detailsContact.textContent =
    contatoConfig[cliente.canalPreferido] || "Não informado";

  detailsRegistration.textContent = formatarData(cliente.cadastradoEm);

  detailsAddress.textContent = obterEnderecoCompleto(cliente);

  detailsNotes.textContent =
    cliente.observacoes || "Nenhuma observação cadastrada.";

  detailsOrders.textContent = String(cliente.quantidadeOrdens || 0);

  detailsActiveOrders.textContent = String(cliente.ordensAtivas || 0);

  detailsTotalValue.textContent = formatarValor(cliente.valorMovimentado);

  renderizarCondominiosNosDetalhes(cliente);

  customerDetailsModal.hidden = false;

  document.body.classList.add("modal-open");
}

function fecharDetalhesDoCliente() {
  customerDetailsModal.hidden = true;

  clienteNosDetalhesId = null;

  if (customerModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function editarClienteDosDetalhes() {
  const cliente = obterClientePorId(clienteNosDetalhesId);

  if (!cliente) {
    return;
  }

  fecharDetalhesDoCliente();

  abrirModalDeCliente(cliente);
}

function vincularCondominioDosDetalhes() {
  const cliente = obterClientePorId(clienteNosDetalhesId);

  if (!cliente) {
    return;
  }

  fecharDetalhesDoCliente();

  abrirModalDeCliente(cliente, "condominios");
}

function criarOrdemDosDetalhes() {
  const cliente = obterClientePorId(clienteNosDetalhesId);

  if (!cliente) {
    return;
  }

  criarOrdemParaCliente(cliente);
}

/* =========================================
   AÇÕES DO CLIENTE
========================================= */

function executarAcaoDoCliente(cliente, acao) {
  if (acao === "whatsapp") {
    abrirWhatsApp(cliente);

    return;
  }

  if (acao === "ligar") {
    ligarParaCliente(cliente);

    return;
  }

  if (acao === "email") {
    enviarEmail(cliente);

    return;
  }

  if (acao === "ordens") {
    abrirOrdensDoCliente(cliente);

    return;
  }

  if (acao === "editar") {
    abrirModalDeCliente(cliente);

    return;
  }

  if (acao === "status") {
    abrirModalDeCliente(cliente, "status");
  }
}

/* =========================================
   CRIAÇÃO DOS CARDS
========================================= */

function fecharDetalhesDosCards(excecao = null) {
  document.querySelectorAll(".customer-card").forEach((card) => {
    if (card === excecao) {
      return;
    }

    const expanded = card.querySelector(".customer-card__expanded");

    const toggle = card.querySelector(".customer-card__toggle");

    const label = card.querySelector(".customer-card__toggle-label");

    if (expanded) {
      expanded.hidden = true;
    }

    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }

    if (label) {
      label.textContent = "Ver mais";
    }

    card.classList.remove("is-expanded");
  });
}

function alternarDetalhesDoCard(card) {
  const expanded = card.querySelector(".customer-card__expanded");

  const toggle = card.querySelector(".customer-card__toggle");

  const label = card.querySelector(".customer-card__toggle-label");

  if (!expanded || !toggle || !label) {
    return;
  }

  const seraAberto = expanded.hidden;

  fecharDetalhesDosCards(seraAberto ? card : null);

  expanded.hidden = !seraAberto;

  toggle.setAttribute("aria-expanded", String(seraAberto));

  label.textContent = seraAberto ? "Ver menos" : "Ver mais";

  card.classList.toggle("is-expanded", seraAberto);
}

function preencherCard(cliente) {
  const fragmento = customerCardTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".customer-card");

  const avatar = card.querySelector(".customer-card__avatar");

  const code = card.querySelector(".customer-card__code");

  const name = card.querySelector(".customer-card__name");

  const status = card.querySelector(".customer-card__status");

  const phoneLink = card.querySelector(".customer-card__phone");

  const phoneText = phoneLink.querySelector("span");

  const emailLink = card.querySelector(".customer-card__email");

  const emailText = emailLink.querySelector("span");

  const toggleButton = card.querySelector(".customer-card__toggle");

  const expanded = card.querySelector(".customer-card__expanded");

  const address = card.querySelector(".customer-card__address > span");

  const registration = card.querySelector(
    ".customer-card__registration > span",
  );

  const contactPreference = card.querySelector(
    ".customer-card__contact-preference > span",
  );

  const ordersCount = card.querySelector(".customer-card__orders-count");

  const activeOrders = card.querySelector(".customer-card__active-orders");

  const totalValue = card.querySelector(".customer-card__total-value");

  const condominiumsIndicator = card.querySelector(
    ".customer-card__condominiums",
  );

  const condominiumsCount = card.querySelector(
    ".customer-card__condominiums-count",
  );

  const condominiumsLabel = card.querySelector(
    ".customer-card__condominiums-label",
  );

  const warning = card.querySelector(".customer-card__warning");

  const warningText = warning.querySelector("span");

  const registerButton = card.querySelector(".customer-card__button--register");

  const detailsButton = card.querySelector(".customer-card__button--details");

  const statusActionButton = card.querySelector(
    ".customer-card__status-action",
  );

  const orderButton = card.querySelector(".customer-card__quick-order");

  const statusData = statusConfig[cliente.status] || statusConfig.ativo;

  const quantidadeCondominios = obterVinculosDoCliente(cliente.id).length;

  const expandedId = `customer-expanded-${cliente.id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  card.dataset.customerId = cliente.id;

  expanded.id = expandedId;

  toggleButton.setAttribute("aria-controls", expandedId);

  avatar.textContent = obterIniciais(cliente.nome);

  code.textContent = cliente.id;

  name.textContent = cliente.nome;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);
  const clienteEstaInativo = cliente.status === "inativo";

  statusActionButton.classList.toggle("is-reactivate", clienteEstaInativo);

  statusActionButton.setAttribute(
    "aria-label",
    clienteEstaInativo
      ? `Reativar cliente ${cliente.nome}`
      : `Desativar cliente ${cliente.nome}`,
  );

  statusActionButton.setAttribute(
    "title",
    clienteEstaInativo ? "Reativar cliente" : "Desativar cliente",
  );

  statusActionButton.innerHTML = clienteEstaInativo
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

  phoneText.textContent = cliente.telefone || "Telefone não informado";

  phoneLink.href = cliente.telefone
    ? `tel:${somenteNumeros(cliente.telefone)}`
    : "#";

  emailText.textContent = cliente.email || "E-mail não informado";

  emailLink.href = cliente.email ? `mailto:${cliente.email}` : "#";

  address.textContent =
    obterEnderecoCompleto(cliente) || "Endereço não informado";

  registration.textContent = `Cadastrado em ${formatarData(
    cliente.cadastradoEm,
  )}`;

  contactPreference.textContent = `Contato preferido: ${
    contatoConfig[cliente.canalPreferido] || "Não informado"
  }`;

  ordersCount.textContent = String(cliente.quantidadeOrdens || 0);

  activeOrders.textContent = String(cliente.ordensAtivas || 0);

  totalValue.textContent = formatarValor(cliente.valorMovimentado);

  condominiumsIndicator.hidden = quantidadeCondominios === 0;

  condominiumsCount.textContent = String(quantidadeCondominios);

  condominiumsLabel.textContent =
    quantidadeCondominios === 1
      ? "condomínio vinculado"
      : "condomínios vinculados";

  const possuiAviso = Boolean(cliente.aviso);

  warning.hidden = !possuiAviso;

  warningText.textContent = cliente.aviso || "";

  phoneLink.addEventListener("click", (event) => {
    if (!cliente.telefone) {
      event.preventDefault();

      mostrarFeedback("O cliente não possui telefone cadastrado.");
    }
  });

  emailLink.addEventListener("click", (event) => {
    if (!cliente.email) {
      event.preventDefault();

      mostrarFeedback("O cliente não possui e-mail cadastrado.");
    }
  });

  toggleButton.addEventListener("click", () => {
    alternarDetalhesDoCard(card);
  });

  orderButton.addEventListener("click", () => {
    criarOrdemParaCliente(cliente);
  });

  registerButton.addEventListener("click", () => {
    abrirModalDeCliente(cliente);
  });

  detailsButton.addEventListener("click", () => {
    abrirDetalhesDoCliente(cliente);
  });
  statusActionButton.addEventListener("click", () => {
    alternarStatusVisualDoCliente(cliente);
  });

  return fragmento;
}

/* =========================================
   RENDERIZAÇÃO
========================================= */

function renderizarClientes() {
  if (!resumoSelecionado) {
    customersTools.hidden = true;

    customersContent.hidden = true;

    customersList.innerHTML = "";

    emptyState.hidden = true;

    return;
  }

  customersTools.hidden = false;

  customersContent.hidden = false;

  const lista = obterClientesFiltrados();

  customersList.innerHTML = "";

  lista.forEach((cliente) => {
    customersList.appendChild(preencherCard(cliente));
  });

  customersCount.textContent = formatarQuantidadeClientes(lista.length);

  const listaVazia = lista.length === 0;

  customersList.hidden = listaVazia;

  emptyState.hidden = !listaVazia;
}

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

  customersSummaryHint.hidden = Boolean(resumoSelecionado);

  if (!resumoSelecionado) {
    fecharFiltros();

    fecharOrdenacao();

    renderizarClientes();

    return;
  }

  abaAtual = resumoSelecionado;

  atualizarAbas();

  fecharFiltros();

  fecharOrdenacao();

  renderizarClientes();

  window.requestAnimationFrame(() => {
    customersContent.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

/* =========================================
   EVENTOS DO RESUMO E DAS ABAS
========================================= */

summaryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selecionarResumo(button.dataset.summaryFilter);
  });
});

customerTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    resumoSelecionado = button.dataset.customerTab;

    alterarAba(button.dataset.customerTab);
  });
});

/* =========================================
   EVENTOS DOS FILTROS
========================================= */

openFilterButton.addEventListener("click", abrirFiltros);

closeFilterButton.addEventListener("click", fecharFiltros);

applyFiltersButton.addEventListener("click", aplicarFiltros);

clearFiltersButton.addEventListener("click", limparPesquisaEFiltros);

clearEmptyFiltersButton.addEventListener("click", limparPesquisaEFiltros);

statusFilterInputs.forEach((input) => {
  input.addEventListener("change", sincronizarEstiloDosFiltros);
});

/* =========================================
   EVENTOS DE PESQUISA E ORDENAÇÃO
========================================= */

customersSearch.addEventListener("input", renderizarClientes);

sortButton.addEventListener("click", (event) => {
  event.stopPropagation();

  abrirOrdenacao();
});

sortOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    alterarOrdenacao(button.dataset.sortOption);
  });
});

/* =========================================
   EVENTOS DO FORMULÁRIO
========================================= */

newCustomerButton.addEventListener("click", () => {
  abrirModalDeCliente();
});

customerForm.addEventListener("submit", salvarCliente);

closeCustomerModalButton.addEventListener("click", fecharModalDeCliente);

cancelCustomerButton.addEventListener("click", fecharModalDeCliente);

searchCustomerPostalCodeButton.addEventListener("click", buscarCepDoCliente);

openCustomerCondominiumLinkButton.addEventListener("click", () => {
  if (customerCondominiumLinkPanel.hidden) {
    abrirPainelDeVinculo();
  } else {
    fecharPainelDeVinculo();
  }
});

cancelCustomerCondominiumLinkButton.addEventListener(
  "click",
  fecharPainelDeVinculo,
);

linkCustomerCondominiumButton.addEventListener(
  "click",
  vincularCondominioAoCliente,
);

customerPhoneInput.addEventListener("input", () => {
  customerPhoneInput.value = formatarTelefone(customerPhoneInput.value);

  limparErroDoCampo(customerPhoneInput);
});

customerPostalCodeInput.addEventListener("input", () => {
  customerPostalCodeInput.value = formatarCep(customerPostalCodeInput.value);

  limparErroDoCampo(customerPostalCodeInput);
});

[
  customerNameInput,
  customerEmailInput,
  customerStateInput,
  customerStreetInput,
  customerAddressNumberInput,
  customerDistrictInput,
  customerCityInput,
].forEach((campo) => {
  campo.addEventListener("input", () => {
    limparErroDoCampo(campo);
  });

  campo.addEventListener("change", () => {
    limparErroDoCampo(campo);
  });
});

/* =========================================
   EVENTOS DO MODAL DE DETALHES
========================================= */

closeCustomerDetailsButton.addEventListener("click", fecharDetalhesDoCliente);

detailsEditButton.addEventListener("click", editarClienteDosDetalhes);

detailsNewOrderButton.addEventListener("click", criarOrdemDosDetalhes);

detailsLinkCondominiumButton.addEventListener(
  "click",
  vincularCondominioDosDetalhes,
);

/* =========================================
   FECHAMENTO DOS MODAIS PELO FUNDO
========================================= */

customerModal.addEventListener("click", (event) => {
  if (event.target === customerModal) {
    fecharModalDeCliente();
  }
});

customerDetailsModal.addEventListener("click", (event) => {
  if (event.target === customerDetailsModal) {
    fecharDetalhesDoCliente();
  }
});

/* =========================================
   EVENTOS GERAIS
========================================= */

document.addEventListener("click", (event) => {
  if (!event.target.closest(".customer-card")) {
    fecharTodosOsMenus();
  }

  if (
    !event.target.closest(".sort-menu") &&
    !event.target.closest("#sort-button")
  ) {
    fecharOrdenacao();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  fecharTodosOsMenus();

  fecharOrdenacao();

  if (!customerCondominiumLinkPanel.hidden) {
    fecharPainelDeVinculo();

    openCustomerCondominiumLinkButton.focus();

    return;
  }

  if (!filterPanel.hidden) {
    fecharFiltros();

    return;
  }

  if (!customerModal.hidden) {
    fecharModalDeCliente();

    return;
  }

  if (!customerDetailsModal.hidden) {
    fecharDetalhesDoCliente();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function inicializarPaginaDeClientes() {
  try {
    await prepararFirebaseDeClientes();

    await aguardarSessaoDaPagina();

    await carregarDadosDeClientesDoFirestore();
  } catch (error) {
    console.error("[Clientes] Não foi possível carregar os dados:", error);

    clientes = [];
    condominios = [];

    mostrarFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a leitura dos clientes. Revise as regras."
        : "Não foi possível carregar os clientes.",
    );
  }

  sincronizarEstiloDosFiltros();
  atualizarContagemDeFiltros();
  atualizarOpcoesDeOrdenacao();
  atualizarAbas();
  atualizarResumo();
  popularSelectDeCondominios();
  renderizarClientes();
}

inicializarPaginaDeClientes();
