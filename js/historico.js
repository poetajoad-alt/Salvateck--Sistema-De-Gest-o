/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const clienteAtualId = "cliente-joao";

/* =========================================
   FUNÇÕES PARA DATAS TEMPORÁRIAS
========================================= */

function obterInicioDoDia(data = new Date()) {
  const novaData = new Date(data);

  novaData.setHours(0, 0, 0, 0);

  return novaData;
}

function criarDataComOffset(dias) {
  const data = obterInicioDoDia();

  data.setDate(data.getDate() + dias);

  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

/* =========================================
   DADOS TEMPORÁRIOS DO HISTÓRICO
========================================= */

const historicoAtendimentos = [
  {
    id: "OS-0010",
    clienteId: "cliente-joao",

    titulo: "Troca do reparo da descarga",

    categorias: ["hidraulica"],

    servicos: ["Avaliação da descarga", "Troca do mecanismo interno"],

    data: criarDataComOffset(-12),

    dataEncerramento: criarDataComOffset(-12),

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    status: "concluido",

    valor: 185,

    valorLiberado: true,
  },

  {
    id: "OS-0011",
    clienteId: "cliente-joao",

    titulo: "Instalação de ventilador de teto",

    categorias: ["eletrica", "instalacoes"],

    servicos: ["Instalação de ventilador", "Teste da rede elétrica"],

    data: criarDataComOffset(-34),

    dataEncerramento: criarDataComOffset(-34),

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    status: "concluido",

    valor: 250,

    valorLiberado: true,
  },

  {
    id: "OS-0012",
    clienteId: "cliente-joao",

    titulo: "Reparo em parede com umidade",

    categorias: ["alvenaria", "pintura"],

    servicos: ["Avaliação da umidade", "Reparo da superfície"],

    data: criarDataComOffset(-57),

    dataEncerramento: criarDataComOffset(-55),

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    status: "cancelado",

    valor: null,

    valorLiberado: false,
  },

  {
    id: "OS-0013",
    clienteId: "cliente-joao",

    titulo: "Ajuste da porta do banheiro",

    categorias: ["manutencao-geral"],

    servicos: ["Ajuste da porta", "Regulagem das dobradiças"],

    data: criarDataComOffset(-91),

    dataEncerramento: criarDataComOffset(-91),

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    status: "concluido",

    valor: 140,

    valorLiberado: true,
  },

  {
    id: "OS-0014",
    clienteId: "cliente-joao",

    titulo: "Instalação de prateleiras",

    categorias: ["instalacoes"],

    servicos: ["Instalação de três prateleiras"],

    data: criarDataComOffset(-145),

    dataEncerramento: criarDataComOffset(-144),

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    status: "recusado",

    valor: null,

    valorLiberado: false,
  },

  {
    id: "OS-0015",
    clienteId: "cliente-joao",

    titulo: "Pintura da sala",

    categorias: ["pintura"],

    servicos: ["Preparação da parede", "Pintura interna"],

    data: criarDataComOffset(-210),

    dataEncerramento: criarDataComOffset(-207),

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    status: "concluido",

    valor: 780,

    valorLiberado: true,
  },

  {
    id: "OS-0016",
    clienteId: "cliente-maria",

    titulo: "Troca de interruptor",

    categorias: ["eletrica"],

    servicos: ["Troca de interruptor simples"],

    data: criarDataComOffset(-18),

    dataEncerramento: criarDataComOffset(-18),

    endereco: "Avenida das Flores, 380 — Vila Nova, São Paulo/SP",

    status: "concluido",

    valor: 95,

    valorLiberado: true,
  },
];

/* =========================================
   CONFIGURAÇÕES DOS CAMPOS
========================================= */

const statusConfig = {
  concluido: {
    nome: "Concluído",
    classe: "status--concluido",
    textoData: "Concluído em",
  },

  cancelado: {
    nome: "Cancelado",
    classe: "status--cancelado",
    textoData: "Cancelado em",
  },

  recusado: {
    nome: "Recusado",
    classe: "status--recusado",
    textoData: "Recusado em",
  },
};

const categoriaConfig = {
  hidraulica: "Hidráulica",
  eletrica: "Elétrica",
  pintura: "Pintura",
  alvenaria: "Alvenaria",
  instalacoes: "Instalações",
  "manutencao-geral": "Manutenção geral",
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const summaryCompleted = document.getElementById("summary-completed");

const summaryCancelled = document.getElementById("summary-cancelled");

const summaryYear = document.getElementById("summary-year");

const historySearch = document.getElementById("history-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const statusFilterInputs = document.querySelectorAll(
  'input[name="statusFilter"]',
);

const categoryFilter = document.getElementById("category-filter");

const yearFilter = document.getElementById("year-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const clearEmptyFiltersButton = document.getElementById(
  "clear-empty-filters-button",
);

const historyCount = document.getElementById("history-count");

const historyList = document.getElementById("history-list");

const emptyState = document.getElementById("empty-state");

const historyCardTemplate = document.getElementById("history-card-template");

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let filtrosAplicados = {
  status: [],
  categoria: "",
  ano: "",
};

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarDataLocal(valor) {
  if (!valor) {
    return null;
  }

  return new Date(`${valor}T12:00:00`);
}

function formatarQuantidade(quantidade) {
  return quantidade === 1 ? "1 item" : `${quantidade} itens`;
}

function formatarDia(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "--";
  }

  return String(data.getDate()).padStart(2, "0");
}

function formatarMesCurto(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "---";
  }

  return data
    .toLocaleDateString("pt-BR", {
      month: "short",
    })
    .replace(".", "")
    .toUpperCase();
}

function formatarAno(valor) {
  const data = criarDataLocal(valor);

  return data ? String(data.getFullYear()) : "----";
}

function formatarDataCompleta(valor) {
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
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "Não informado";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterNomeCategorias(categorias) {
  return categorias
    .map((categoria) => categoriaConfig[categoria] || categoria)
    .filter(Boolean);
}

function mostrarFeedback(mensagem) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = mensagem;
  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 2800);
}

function abrirDetalhes(atendimentoId) {
  const parametros = new URLSearchParams({
    id: atendimentoId,
    perfil: "cliente",
  });

  window.location.href = `detalhes-solicitacao.html?${parametros.toString()}`;
}

function solicitarNovamente(atendimentoId) {
  const parametros = new URLSearchParams({
    perfil: "cliente",
    repetir: atendimentoId,
  });

  window.location.href = `nova-ordem.html?${parametros.toString()}`;
}

/* =========================================
   DADOS DO CLIENTE
========================================= */

function obterHistoricoDoCliente() {
  return historicoAtendimentos
    .filter((atendimento) => atendimento.clienteId === clienteAtualId)
    .filter((atendimento) =>
      ["concluido", "cancelado", "recusado"].includes(atendimento.status),
    )
    .sort((a, b) => {
      return (
        criarDataLocal(b.dataEncerramento || b.data) -
        criarDataLocal(a.dataEncerramento || a.data)
      );
    });
}

/* =========================================
   PREENCHIMENTO DO FILTRO DE ANOS
========================================= */

function preencherFiltroDeAnos() {
  const anos = [
    ...new Set(
      obterHistoricoDoCliente()
        .map((atendimento) => {
          const data = criarDataLocal(
            atendimento.dataEncerramento || atendimento.data,
          );

          return data ? data.getFullYear() : null;
        })
        .filter(Boolean),
    ),
  ].sort((a, b) => b - a);

  anos.forEach((ano) => {
    const option = document.createElement("option");

    option.value = String(ano);
    option.textContent = String(ano);

    yearFilter.appendChild(option);
  });
}

/* =========================================
   PESQUISA
========================================= */

function correspondeAPesquisa(atendimento) {
  const pesquisa = normalizarTexto(historySearch.value);

  if (!pesquisa) {
    return true;
  }

  const categorias = obterNomeCategorias(atendimento.categorias).join(" ");

  const status = statusConfig[atendimento.status]?.nome || "";

  const conteudoPesquisavel = normalizarTexto(
    [
      atendimento.id,
      atendimento.titulo,
      atendimento.servicos.join(" "),
      categorias,
      status,
      atendimento.endereco,
      formatarDataCompleta(atendimento.dataEncerramento || atendimento.data),
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

function correspondeAosFiltros(atendimento) {
  const statusCorresponde =
    filtrosAplicados.status.length === 0 ||
    filtrosAplicados.status.includes(atendimento.status);

  const categoriaCorresponde =
    !filtrosAplicados.categoria ||
    atendimento.categorias.includes(filtrosAplicados.categoria);

  const data = criarDataLocal(atendimento.dataEncerramento || atendimento.data);

  const anoCorresponde =
    !filtrosAplicados.ano ||
    String(data?.getFullYear()) === filtrosAplicados.ano;

  return statusCorresponde && categoriaCorresponde && anoCorresponde;
}

function sincronizarEstiloDosFiltros() {
  document.querySelectorAll(".filter-option").forEach((opcao) => {
    const input = opcao.querySelector('input[name="statusFilter"]');

    opcao.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function contarFiltrosAtivos() {
  let quantidade = filtrosAplicados.status.length;

  if (filtrosAplicados.categoria) {
    quantidade += 1;
  }

  if (filtrosAplicados.ano) {
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

    categoria: categoryFilter.value,

    ano: yearFilter.value,
  };

  atualizarContagemDeFiltros();
  renderizarHistorico();
  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparPesquisaEFiltros() {
  historySearch.value = "";

  statusFilterInputs.forEach((input) => {
    input.checked = false;
  });

  categoryFilter.value = "";
  yearFilter.value = "";

  filtrosAplicados = {
    status: [],
    categoria: "",
    ano: "",
  };

  sincronizarEstiloDosFiltros();
  atualizarContagemDeFiltros();
  renderizarHistorico();

  mostrarFeedback("Pesquisa e filtros removidos.");
}

/* =========================================
   OBTENÇÃO DA LISTA FILTRADA
========================================= */

function obterHistoricoFiltrado() {
  return obterHistoricoDoCliente()
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros);
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const historico = obterHistoricoDoCliente();

  const anoAtual = new Date().getFullYear();

  const concluidos = historico.filter(
    (atendimento) => atendimento.status === "concluido",
  ).length;

  const cancelados = historico.filter(
    (atendimento) =>
      atendimento.status === "cancelado" || atendimento.status === "recusado",
  ).length;

  const registrosDoAno = historico.filter((atendimento) => {
    const data = criarDataLocal(
      atendimento.dataEncerramento || atendimento.data,
    );

    return data && data.getFullYear() === anoAtual;
  }).length;

  summaryCompleted.textContent = String(concluidos);

  summaryCancelled.textContent = String(cancelados);

  summaryYear.textContent = String(registrosDoAno);
}

/* =========================================
   CRIAÇÃO DOS CARDS
========================================= */

function preencherCard(atendimento) {
  const fragmento = historyCardTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".history-card");

  const day = card.querySelector(".history-card__day");

  const month = card.querySelector(".history-card__month");

  const year = card.querySelector(".history-card__year");

  const code = card.querySelector(".history-card__code");

  const status = card.querySelector(".history-card__status");

  const title = card.querySelector(".history-card__title");

  const services = card.querySelector(".history-card__services");

  const address = card.querySelector(".history-card__address span");

  const finished = card.querySelector(".history-card__finished span");

  const financial = card.querySelector(".history-card__financial");

  const value = card.querySelector(".history-card__value");

  const detailsButton = card.querySelector(".history-card__button--details");

  const requestButton = card.querySelector(".history-card__button--request");

  const dataDoCard = atendimento.dataEncerramento || atendimento.data;

  const statusData = statusConfig[atendimento.status] || statusConfig.concluido;

  day.textContent = formatarDia(dataDoCard);

  month.textContent = formatarMesCurto(dataDoCard);

  year.textContent = formatarAno(dataDoCard);

  code.textContent = atendimento.id;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  title.textContent = atendimento.titulo;

  services.textContent = atendimento.servicos.join(" • ");

  address.textContent = atendimento.endereco;

  finished.textContent = `${statusData.textoData} ${formatarDataCompleta(
    dataDoCard,
  )}`;

  const deveMostrarValor =
    atendimento.status === "concluido" &&
    atendimento.valorLiberado &&
    atendimento.valor !== null;

  financial.hidden = !deveMostrarValor;

  if (deveMostrarValor) {
    value.textContent = formatarValor(atendimento.valor);
  }

  detailsButton.setAttribute(
    "aria-label",
    `Abrir detalhes da ordem ${atendimento.id}`,
  );

  requestButton.setAttribute(
    "aria-label",
    `Solicitar novamente o serviço da ordem ${atendimento.id}`,
  );

  detailsButton.addEventListener("click", () => {
    abrirDetalhes(atendimento.id);
  });

  requestButton.addEventListener("click", () => {
    solicitarNovamente(atendimento.id);
  });

  return fragmento;
}

/* =========================================
   RENDERIZAÇÃO
========================================= */

function renderizarHistorico() {
  const lista = obterHistoricoFiltrado();

  historyList.innerHTML = "";

  lista.forEach((atendimento) => {
    historyList.appendChild(preencherCard(atendimento));
  });

  historyCount.textContent = formatarQuantidade(lista.length);

  const listaVazia = lista.length === 0;

  historyList.hidden = listaVazia;
  emptyState.hidden = !listaVazia;
}

/* =========================================
   EVENTOS
========================================= */

openFilterButton.addEventListener("click", abrirFiltros);

closeFilterButton.addEventListener("click", fecharFiltros);

applyFiltersButton.addEventListener("click", aplicarFiltros);

clearFiltersButton.addEventListener("click", limparPesquisaEFiltros);

clearEmptyFiltersButton.addEventListener("click", limparPesquisaEFiltros);

statusFilterInputs.forEach((input) => {
  input.addEventListener("change", sincronizarEstiloDosFiltros);
});

historySearch.addEventListener("input", renderizarHistorico);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !filterPanel.hidden) {
    fecharFiltros();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

preencherFiltroDeAnos();

sincronizarEstiloDosFiltros();

atualizarContagemDeFiltros();

atualizarResumo();

renderizarHistorico();
