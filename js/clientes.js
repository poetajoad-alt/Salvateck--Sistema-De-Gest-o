/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const CUSTOMERS_STORAGE_KEY = "salvateckClientesTemporarios";

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

function criarDataComOffset(dias) {
  const data = obterInicioDoDia();

  data.setDate(data.getDate() + dias);

  return obterDataISO(data);
}

/* =========================================
   DADOS TEMPORÁRIOS DOS CLIENTES
========================================= */

const clientesIniciais = [
  {
    id: "CLI-0001",

    nome: "João da Silva",

    telefone: "(11) 99999-0000",

    email: "joao@email.com",

    cep: "01001-000",

    estado: "SP",

    rua: "Rua Exemplo",

    numero: "150",

    complemento: "Casa 2",

    bairro: "Centro",

    cidade: "São Paulo",

    cidadeSlug: "sao-paulo",

    canalPreferido: "whatsapp",

    status: "ativo",

    cadastradoEm: criarDataComOffset(-210),

    quantidadeOrdens: 9,

    ordensAtivas: 3,

    valorMovimentado: 1835,

    observacoes: "Entrar em contato antes de chegar ao endereço.",

    aviso: "",
  },

  {
    id: "CLI-0002",

    nome: "Maria Oliveira",

    telefone: "(11) 98888-1122",

    email: "maria.oliveira@email.com",

    cep: "01310-100",

    estado: "SP",

    rua: "Avenida das Flores",

    numero: "380",

    complemento: "Apartamento 42",

    bairro: "Vila Nova",

    cidade: "São Paulo",

    cidadeSlug: "sao-paulo",

    canalPreferido: "whatsapp",

    status: "ativo",

    cadastradoEm: criarDataComOffset(-95),

    quantidadeOrdens: 4,

    ordensAtivas: 1,

    valorMovimentado: 720,

    observacoes: "Preferência por atendimentos no período da manhã.",

    aviso: "",
  },

  {
    id: "CLI-0003",

    nome: "Carlos Henrique",

    telefone: "(11) 97777-3344",

    email: "carlos.henrique@email.com",

    cep: "06010-030",

    estado: "SP",

    rua: "Rua das Palmeiras",

    numero: "45",

    complemento: "",

    bairro: "Jardim Sul",

    cidade: "Osasco",

    cidadeSlug: "osasco",

    canalPreferido: "telefone",

    status: "com-pendencia",

    cadastradoEm: criarDataComOffset(-72),

    quantidadeOrdens: 5,

    ordensAtivas: 1,

    valorMovimentado: 1480,

    observacoes:
      "Cliente solicitou contato telefônico antes de qualquer alteração na ordem.",

    aviso: "Existe uma pendência financeira vinculada a um atendimento.",
  },

  {
    id: "CLI-0004",

    nome: "Ana Paula Santos",

    telefone: "(11) 96666-7788",

    email: "ana.paula@email.com",

    cep: "06401-110",

    estado: "SP",

    rua: "Rua dos Ipês",

    numero: "92",

    complemento: "",

    bairro: "Bela Vista",

    cidade: "Barueri",

    cidadeSlug: "barueri",

    canalPreferido: "email",

    status: "ativo",

    cadastradoEm: criarDataComOffset(-21),

    quantidadeOrdens: 2,

    ordensAtivas: 0,

    valorMovimentado: 465,

    observacoes: "Enviar confirmação do atendimento também por e-mail.",

    aviso: "",
  },

  {
    id: "CLI-0005",

    nome: "Roberto Mendes",

    telefone: "(11) 95555-8899",

    email: "roberto.mendes@email.com",

    cep: "06320-020",

    estado: "SP",

    rua: "Avenida Central",

    numero: "1020",

    complemento: "Sala 6",

    bairro: "Centro",

    cidade: "Carapicuíba",

    cidadeSlug: "carapicuiba",

    canalPreferido: "whatsapp",

    status: "inativo",

    cadastradoEm: criarDataComOffset(-320),

    quantidadeOrdens: 3,

    ordensAtivas: 0,

    valorMovimentado: 590,

    observacoes: "Cadastro inativado após solicitação do cliente.",

    aviso: "",
  },

  {
    id: "CLI-0006",

    nome: "Patrícia Souza",

    telefone: "(11) 94444-2211",

    email: "patricia.souza@email.com",

    cep: "01011-000",

    estado: "SP",

    rua: "Rua São Bento",

    numero: "318",

    complemento: "",

    bairro: "Centro",

    cidade: "São Paulo",

    cidadeSlug: "sao-paulo",

    canalPreferido: "whatsapp",

    status: "cadastro-incompleto",

    cadastradoEm: criarDataComOffset(-8),

    quantidadeOrdens: 1,

    ordensAtivas: 0,

    valorMovimentado: 0,

    observacoes: "Aguardando confirmação de alguns dados do endereço.",

    aviso: "O cadastro possui informações que ainda precisam ser confirmadas.",
  },

  {
    id: "CLI-0007",

    nome: "Fernanda Lima",

    telefone: "(11) 93333-4567",

    email: "fernanda.lima@email.com",

    cep: "01414-002",

    estado: "SP",

    rua: "Rua das Acácias",

    numero: "114",

    complemento: "",

    bairro: "Jardim Paulista",

    cidade: "São Paulo",

    cidadeSlug: "sao-paulo",

    canalPreferido: "telefone",

    status: "ativo",

    cadastradoEm: criarDataComOffset(-2),

    quantidadeOrdens: 1,

    ordensAtivas: 1,

    valorMovimentado: 0,

    observacoes: "Novo cadastro realizado durante uma solicitação de serviço.",

    aviso: "",
  },
];

let clientes = clientesIniciais.map((cliente) => ({
  ...cliente,
}));

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
    titulo: "Novos clientes",
    subtitulo: "Cadastros recentes",
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

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let abaAtual = "todos";

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

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

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

/* =========================================
   ARMAZENAMENTO LOCAL TEMPORÁRIO
========================================= */

function carregarClientesSalvos() {
  try {
    const dadosSalvos = JSON.parse(
      localStorage.getItem(CUSTOMERS_STORAGE_KEY) || "null",
    );

    if (Array.isArray(dadosSalvos) && dadosSalvos.length > 0) {
      clientes = dadosSalvos;

      return;
    }

    salvarClientesLocalmente();
  } catch (error) {
    console.warn("Não foi possível carregar os clientes temporários.", error);
  }
}

function salvarClientesLocalmente() {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(clientes));

    return true;
  } catch (error) {
    console.warn("Não foi possível salvar os clientes temporários.", error);

    return false;
  }
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const hoje = obterInicioDoDia();

  const total = clientes.length;

  const ativos = clientes.filter(
    (cliente) => cliente.status === "ativo",
  ).length;

  const novosNoMes = clientes.filter((cliente) => {
    const dataCadastro = criarDataLocal(cliente.cadastradoEm);

    return (
      dataCadastro &&
      dataCadastro.getFullYear() === hoje.getFullYear() &&
      dataCadastro.getMonth() === hoje.getMonth()
    );
  }).length;

  const comServicos = clientes.filter(
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

  const limite = obterInicioDoDia();

  limite.setDate(limite.getDate() - 30);

  return dataCadastro >= limite;
}

function correspondeAAba(cliente) {
  if (abaAtual === "todos") {
    return true;
  }

  if (abaAtual === "ativos") {
    return cliente.status === "ativo";
  }

  if (abaAtual === "novos") {
    return clienteEhNovo(cliente);
  }

  if (abaAtual === "com-pendencias") {
    return cliente.status === "com-pendencia" || Boolean(cliente.aviso);
  }

  if (abaAtual === "inativos") {
    return cliente.status === "inativo";
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

  abaAtual = "todos";

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
    return copia.sort((a, b) => {
      return criarDataLocal(b.cadastradoEm) - criarDataLocal(a.cadastradoEm);
    });
  }

  if (ordenacaoAtual === "mais-antigos") {
    return copia.sort((a, b) => {
      return criarDataLocal(a.cadastradoEm) - criarDataLocal(b.cadastradoEm);
    });
  }

  if (ordenacaoAtual === "mais-servicos") {
    return copia.sort((a, b) => {
      return Number(b.quantidadeOrdens) - Number(a.quantidadeOrdens);
    });
  }

  if (ordenacaoAtual === "maior-valor") {
    return copia.sort((a, b) => {
      return Number(b.valorMovimentado) - Number(a.valorMovimentado);
    });
  }

  return copia.sort((a, b) => {
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
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

/* =========================================
   OBTENÇÃO DA LISTA
========================================= */

function obterClientesFiltrados() {
  const lista = clientes
    .filter(correspondeAAba)
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros);

  return ordenarClientes(lista);
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

/* =========================================
   IDENTIFICAÇÃO DO NOVO CLIENTE
========================================= */

function gerarNovoIdDeCliente() {
  const maiorNumero = clientes.reduce((maior, cliente) => {
    const numero = Number(String(cliente.id).replace(/\D/g, ""));

    return Math.max(maior, numero || 0);
  }, 0);

  return `CLI-${String(maiorNumero + 1).padStart(4, "0")}`;
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

  await aguardar(650);

  const clienteExistente = obterClientePorId(clienteEmEdicaoId);

  const status = customerStatusInput.value;

  const dadosDoCliente = {
    nome: limparTexto(customerNameInput.value),

    telefone: formatarTelefone(customerPhoneInput.value),

    email: limparTexto(customerEmailInput.value),

    cep: formatarCep(customerPostalCodeInput.value),

    estado: customerStateInput.value,

    rua: limparTexto(customerStreetInput.value),

    numero: limparTexto(customerAddressNumberInput.value),

    complemento: limparTexto(customerAddressComplementInput.value),

    bairro: limparTexto(customerDistrictInput.value),

    cidade: limparTexto(customerCityInput.value),

    cidadeSlug: criarSlug(customerCityInput.value),

    canalPreferido: customerContactPreferenceInput.value,

    status,

    observacoes: limparTexto(customerNotesInput.value),

    aviso: obterAvisoPorStatus(status),
  };

  if (clienteExistente) {
    Object.assign(clienteExistente, dadosDoCliente);
  } else {
    clientes.push({
      id: gerarNovoIdDeCliente(),

      ...dadosDoCliente,

      cadastradoEm: obterDataISO(new Date()),

      quantidadeOrdens: 0,

      ordensAtivas: 0,

      valorMovimentado: 0,
    });
  }

  const salvo = salvarClientesLocalmente();

  definirEstadoDeSalvamento(false);

  if (!salvo) {
    mostrarFeedback("Não foi possível salvar o cliente.");

    return;
  }

  fecharModalDeCliente();

  atualizarResumo();

  renderizarClientes();

  mostrarFeedback(
    clienteExistente
      ? "Cadastro atualizado com sucesso."
      : "Cliente cadastrado com sucesso.",
  );
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

  const warning = card.querySelector(".customer-card__warning");

  const warningText = warning.querySelector("span");

  const detailsButton = card.querySelector(".customer-card__button--details");

  const orderButton = card.querySelector(".customer-card__button--order");

  const menuButton = card.querySelector(".customer-card__menu");

  const options = card.querySelector(".customer-card__options");

  const actionButtons = card.querySelectorAll("[data-customer-action]");

  const statusData = statusConfig[cliente.status] || statusConfig.ativo;

  avatar.textContent = obterIniciais(cliente.nome);

  code.textContent = cliente.id;

  name.textContent = cliente.nome;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  phoneText.textContent = cliente.telefone || "Não informado";

  phoneLink.href = cliente.telefone
    ? `tel:${somenteNumeros(cliente.telefone)}`
    : "#";

  emailText.textContent = cliente.email || "Não informado";

  emailLink.href = cliente.email ? `mailto:${cliente.email}` : "#";

  address.textContent = obterEnderecoCompleto(cliente);

  registration.textContent = `Cadastrado em ${formatarData(
    cliente.cadastradoEm,
  )}`;

  contactPreference.textContent = `Contato preferido: ${
    contatoConfig[cliente.canalPreferido] || "Não informado"
  }`;

  ordersCount.textContent = String(cliente.quantidadeOrdens || 0);

  activeOrders.textContent = String(cliente.ordensAtivas || 0);

  totalValue.textContent = formatarValor(cliente.valorMovimentado);

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

  detailsButton.addEventListener("click", () => {
    abrirDetalhesDoCliente(cliente);
  });

  orderButton.addEventListener("click", () => {
    criarOrdemParaCliente(cliente);
  });

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const seraAberto = options.hidden;

    fecharTodosOsMenus(options);

    options.hidden = !seraAberto;

    menuButton.setAttribute("aria-expanded", String(seraAberto));
  });

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      executarAcaoDoCliente(cliente, button.dataset.customerAction);
    });
  });

  return fragmento;
}

/* =========================================
   RENDERIZAÇÃO
========================================= */

function renderizarClientes() {
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

/* =========================================
   EVENTOS DAS ABAS
========================================= */

customerTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
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

  if (!filterPanel.hidden) {
    fecharFiltros();
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

carregarClientesSalvos();

sincronizarEstiloDosFiltros();

atualizarContagemDeFiltros();

atualizarOpcoesDeOrdenacao();

atualizarAbas();

atualizarResumo();

renderizarClientes();
