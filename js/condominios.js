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
let collection;
let doc;
let getDocs;
let query;
let where;
let setDoc;
let serverTimestamp;

async function prepararFirebaseDeCondominios() {
  const [firestoreModule, firebaseConfigModule] = await Promise.all([
    import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
    ),
    import("./firebase-config.js"),
  ]);

  db = firebaseConfigModule.db;

  ({ collection, doc, getDocs, query, where, setDoc, serverTimestamp } =
    firestoreModule);
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
   DOCUMENTOS E HISTÓRICO
========================================= */

const addDocumentButton = document.getElementById("add-document-button");

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

function gerarIdentificadores() {
  const numeros = condominios.map((condominio) => {
    const correspondencia = String(condominio.codigo || "").match(/\d+/);

    return correspondencia ? Number(correspondencia[0]) : 0;
  });

  const proximoNumero = Math.max(0, ...numeros) + 1;

  const numeroFormatado = String(proximoNumero).padStart(4, "0");

  return {
    id: doc(collection(db, "condominios")).id,

    codigo: `COND-${numeroFormatado}`,
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

function mapearCondominioDoFirestore(condominioSnapshot) {
  const dados = condominioSnapshot.data();

  const endereco = dados.endereco || {};

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

          papel: vinculo.papel || "outro",

          contatoPrincipal: Boolean(vinculo.contatoPrincipal),

          responsavelFinanceiro: Boolean(vinculo.responsavelFinanceiro),
        }))
      : [],

    equipamentos: Array.isArray(dados.equipamentos) ? dados.equipamentos : [],

    documentos: Array.isArray(dados.documentos)
      ? dados.documentos.map((documento) => ({
          id: documento.id || gerarIdDocumento(),

          nome: documento.nome || "Documento",

          vencimento: converterDataDoFirestoreParaISO(documento.vencimento),

          status: documento.status || "pendente",
        }))
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
  ]);

  const [resultadoCondominios, resultadoClientes, resultadoOrdens] = resultados;

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
    `[Condomínios] ${condominios.length} condomínio(s), ${clientes.length} cliente(s) e ${ordens.length} ordem(ns) carregados.`,
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

async function salvarCondominioNoFirestore(condominio, novoCadastro) {
  const historicoPersistido = condominio.historico
    .filter((registro) => !registro.origemFirestore)
    .map(({ origemFirestore, ...registro }) => registro);

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
    })),

    equipamentos: [...condominio.equipamentos],

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

  await setDoc(doc(db, "condominios", condominio.id), dados, {
    merge: true,
  });
}
/* =========================================
   DOCUMENTOS
========================================= */

function atualizarStatusDocumento(documento) {
  if (documento.status === "pendente") {
    return "pendente";
  }

  if (!documento.vencimento) {
    return "pendente";
  }

  const vencimento = criarDataLocal(documento.vencimento);

  const hoje = obterInicioDoDia();

  if (vencimento && vencimento < hoje) {
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
      if (
        condominioA.status === "atencao" &&
        condominioB.status !== "atencao"
      ) {
        return -1;
      }

      if (
        condominioB.status === "atencao" &&
        condominioA.status !== "atencao"
      ) {
        return 1;
      }

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
    tipo: "vistoria",
    condominio: condominio.id,
  });

  window.location.href = `nova-ordem.html?${parametros.toString()}`;
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

    equipamentos: [],

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

  atualizarContagemEquipamentos();

  renderizarDocumentos();

  renderizarHistorico();
}

function coletarDadosDoFormulario() {
  condominioRascunho.nome = condominiumName.value.trim();

  condominioRascunho.codigo = condominiumCode.value;

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

  condominioRascunho.equipamentos = Array.from(equipmentInputs)
    .filter((input) => input.checked)
    .map((input) => input.value);

  condominioRascunho.atualizadoEm = obterDataISO();
}

function abrirModalDeCondominio(condominio = null) {
  condominioEmEdicaoId = condominio?.id || null;

  condominioRascunho = condominio
    ? clonarDados(condominio)
    : criarCondominioVazio();

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

  condominioRascunho.clientesVinculados.push({
    clienteId,

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
   EQUIPAMENTOS
========================================= */

function atualizarContagemEquipamentos() {
  const selecionados = Array.from(equipmentInputs).filter(
    (input) => input.checked,
  );

  selectedEquipmentCount.textContent = formatarQuantidade(
    selecionados.length,
    "selecionado",
    "selecionados",
  );

  equipmentGroups.forEach((group) => {
    const quantidade = group.querySelectorAll(
      'input[name="equipment"]:checked',
    ).length;

    const count = group.querySelector(".equipment-group__count");

    count.textContent = String(quantidade);
  });
}

/* =========================================
   DOCUMENTOS
========================================= */

function renderizarDocumentos() {
  documentsList.innerHTML = "";

  if (!condominioRascunho) {
    return;
  }

  const documentos = condominioRascunho.documentos;

  documentsEmpty.hidden = documentos.length > 0;

  documentsList.hidden = documentos.length === 0;

  documentos.forEach((documento) => {
    documento.status = atualizarStatusDocumento(documento);

    const fragmento = documentTemplate.content.cloneNode(true);

    const name = fragmento.querySelector(".document-card__name");

    const expiration = fragmento.querySelector(".document-card__expiration");

    const status = fragmento.querySelector(".document-card__status");

    const removeButton = fragmento.querySelector(".document-card__remove");

    name.textContent = documento.nome;

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

    removeButton.setAttribute(
      "aria-label",
      `Remover documento ${documento.nome}`,
    );

    removeButton.addEventListener("click", () => {
      condominioRascunho.documentos = condominioRascunho.documentos.filter(
        (item) => item.id !== documento.id,
      );

      renderizarDocumentos();

      mostrarFeedback("Documento removido.");
    });

    documentsList.appendChild(fragmento);
  });
}

function adicionarDocumento() {
  if (!condominioRascunho) {
    return;
  }

  const nome = window.prompt("Digite o nome do documento:");

  if (!nome?.trim()) {
    return;
  }

  const vencimento = window.prompt(
    "Informe a data de vencimento no formato AAAA-MM-DD ou deixe em branco:",
    "",
  );

  let status = "pendente";

  if (vencimento?.trim()) {
    const data = criarDataLocal(vencimento.trim());

    if (!data) {
      mostrarFeedback("A data informada não é válida.");

      return;
    }

    status = data < obterInicioDoDia() ? "vencido" : "regular";
  }

  condominioRascunho.documentos.push({
    id: gerarIdDocumento(),

    nome: nome.trim(),

    vencimento: vencimento?.trim() || "",

    status,
  });

  renderizarDocumentos();

  mostrarFeedback("Documento adicionado.");
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

equipmentInputs.forEach((input) => {
  input.addEventListener("change", atualizarContagemEquipamentos);
});

addDocumentButton.addEventListener("click", adicionarDocumento);

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

    await aguardarSessaoDaPagina();

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
