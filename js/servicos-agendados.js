/* =========================================
   DADOS TEMPORÁRIOS DOS AGENDAMENTOS
========================================= */

const servicosAgendados = [
  {
    id: "OS-0001",
    clienteId: "cliente-joao",
    titulo: "Vazamento na torneira da cozinha",
    categorias: ["hidraulica"],
    servicos: ["Torneira vazando", "Ajustar torneira"],
    data: "2026-07-18",
    periodo: "manha",
    horario: "09:00",
    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",
    status: "confirmado",
  },

  {
    id: "OS-0002",
    clienteId: "cliente-joao",
    titulo: "Instalação de luminária",
    categorias: ["eletrica", "instalacoes"],
    servicos: ["Instalar luminária"],
    data: "2026-07-19",
    periodo: "tarde",
    horario: "14:30",
    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",
    status: "confirmado",
  },

  {
    id: "OS-0003",
    clienteId: "cliente-joao",
    titulo: "Pintura de parede do quarto",
    categorias: ["pintura"],
    servicos: ["Preparação da superfície", "Pintura de parede"],
    data: "2026-07-23",
    periodo: "tarde",
    horario: "14:00",
    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",
    status: "confirmado",
  },

  {
    id: "OS-0009",
    clienteId: "cliente-joao",
    titulo: "Ajuste da porta da área de serviço",
    categorias: ["manutencao-geral"],
    servicos: ["Ajustar porta", "Trocar maçaneta"],
    data: "2026-08-04",
    periodo: "manha",
    horario: "10:00",
    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",
    status: "confirmado",
  },
];

/* =========================================
   CONFIGURAÇÕES
========================================= */

const clienteAtualId = "cliente-joao";

const categoriaConfig = {
  hidraulica: "Hidráulica",
  eletrica: "Elétrica",
  pintura: "Pintura",
  alvenaria: "Alvenaria",
  instalacoes: "Instalações",
  "manutencao-geral": "Manutenção geral",
};

const periodoConfig = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  horario: "Horário específico",
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const nextServiceSection = document.getElementById("next-service");

const nextServiceTitle = document.getElementById("next-service-title");

const nextServiceStatus = document.getElementById("next-service-status");

const nextServiceDay = document.getElementById("next-service-day");

const nextServiceMonth = document.getElementById("next-service-month");

const nextServiceTime = document.getElementById("next-service-time");

const nextServiceAddress = document.getElementById("next-service-address");

const nextServiceCode = document.getElementById("next-service-code");

const openNextMapButton = document.getElementById("open-next-map-button");

const openNextDetailsButton = document.getElementById(
  "open-next-details-button",
);

const summaryTotal = document.getElementById("summary-total");

const summaryMonth = document.getElementById("summary-month");

const summaryNext = document.getElementById("summary-next");

const scheduleSearch = document.getElementById("schedule-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const periodFilterInputs = document.querySelectorAll(
  'input[name="periodFilter"]',
);

const categoryFilter = document.getElementById("category-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const servicesCount = document.getElementById("services-count");

const servicesList = document.getElementById("services-list");

const emptyState = document.getElementById("empty-state");

const serviceCardTemplate = document.getElementById("service-card-template");

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let filtrosAplicados = {
  periodo: "",
  categoria: "",
};

let proximoAtendimento = null;

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

function obterInicioDoDia(data = new Date()) {
  const novaData = new Date(data);

  novaData.setHours(0, 0, 0, 0);

  return novaData;
}

function obterHoje() {
  return obterInicioDoDia(new Date());
}

function formatarQuantidade(quantidade) {
  return quantidade === 1 ? "1 item" : `${quantidade} itens`;
}

function formatarDataCurta(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "--";
  }

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
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

function formatarDia(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return "--";
  }

  return String(data.getDate()).padStart(2, "0");
}

function formatarAno(valor) {
  const data = criarDataLocal(valor);

  return data ? String(data.getFullYear()) : "----";
}

function formatarHorario(servico) {
  const periodo = periodoConfig[servico.periodo] || "Período não informado";

  if (servico.horario) {
    return `${periodo} — ${servico.horario}`;
  }

  return periodo;
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

function abrirDetalhes(servicoId) {
  const parametros = new URLSearchParams({
    id: servicoId,
    perfil: "cliente",
  });

  window.location.href = `detalhes-solicitacao.html?${parametros.toString()}`;
}

function abrirEnderecoNoMapa(endereco) {
  if (!endereco) {
    mostrarFeedback("Endereço não disponível.");

    return;
  }

  const enderecoCodificado = encodeURIComponent(endereco);

  const url = `https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

/* =========================================
   DATAS E PERÍODOS
========================================= */

function obterInicioDaSemana(data) {
  const inicio = obterInicioDoDia(data);

  const diaDaSemana = inicio.getDay();

  const diferenca = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

  inicio.setDate(inicio.getDate() + diferenca);

  return inicio;
}

function obterFimDaSemana(data) {
  const fim = obterInicioDaSemana(data);

  fim.setDate(fim.getDate() + 6);

  fim.setHours(23, 59, 59, 999);

  return fim;
}

function pertenceAoPeriodo(servico) {
  const filtro = filtrosAplicados.periodo;

  if (!filtro) {
    return true;
  }

  const dataServico = criarDataLocal(servico.data);

  if (!dataServico) {
    return false;
  }

  const hoje = obterHoje();

  if (filtro === "hoje") {
    return (
      dataServico.getFullYear() === hoje.getFullYear() &&
      dataServico.getMonth() === hoje.getMonth() &&
      dataServico.getDate() === hoje.getDate()
    );
  }

  if (filtro === "semana") {
    const inicio = obterInicioDaSemana(hoje);

    const fim = obterFimDaSemana(hoje);

    return dataServico >= inicio && dataServico <= fim;
  }

  if (filtro === "mes") {
    return (
      dataServico.getFullYear() === hoje.getFullYear() &&
      dataServico.getMonth() === hoje.getMonth()
    );
  }

  if (filtro === "proximos") {
    const inicioProximoMes = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      1,
    );

    return dataServico >= inicioProximoMes;
  }

  return true;
}

/* =========================================
   DADOS DO CLIENTE
========================================= */

function obterAgendamentosDoCliente() {
  const hoje = obterHoje();

  return servicosAgendados
    .filter((servico) => servico.clienteId === clienteAtualId)
    .filter((servico) => {
      const dataServico = criarDataLocal(servico.data);

      return dataServico && dataServico >= hoje;
    })
    .sort((a, b) => {
      return criarDataLocal(a.data) - criarDataLocal(b.data);
    });
}

/* =========================================
   PESQUISA E FILTROS
========================================= */

function obterPeriodoSelecionado() {
  return (
    document.querySelector('input[name="periodFilter"]:checked')?.value || ""
  );
}

function correspondeAPesquisa(servico) {
  const pesquisa = normalizarTexto(scheduleSearch.value);

  if (!pesquisa) {
    return true;
  }

  const categorias = obterNomeCategorias(servico.categorias).join(" ");

  const conteudoPesquisavel = normalizarTexto(
    [
      servico.id,
      servico.titulo,
      servico.servicos.join(" "),
      categorias,
      servico.endereco,
      formatarHorario(servico),
    ].join(" "),
  );

  return conteudoPesquisavel.includes(pesquisa);
}

function correspondeAosFiltros(servico) {
  const categoriaCorresponde =
    !filtrosAplicados.categoria ||
    servico.categorias.includes(filtrosAplicados.categoria);

  return categoriaCorresponde && pertenceAoPeriodo(servico);
}

function obterServicosFiltrados() {
  return obterAgendamentosDoCliente()
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros);
}

function sincronizarEstiloDosFiltros() {
  document.querySelectorAll(".filter-option").forEach((opcao) => {
    const input = opcao.querySelector('input[name="periodFilter"]');

    opcao.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function contarFiltrosAtivos() {
  let quantidade = 0;

  if (filtrosAplicados.periodo) {
    quantidade += 1;
  }

  if (filtrosAplicados.categoria) {
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
    periodo: obterPeriodoSelecionado(),
    categoria: categoryFilter.value,
  };

  atualizarContagemDeFiltros();
  renderizarLista();
  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparFiltros() {
  periodFilterInputs.forEach((input) => {
    input.checked = input.value === "";
  });

  categoryFilter.value = "";

  filtrosAplicados = {
    periodo: "",
    categoria: "",
  };

  sincronizarEstiloDosFiltros();
  atualizarContagemDeFiltros();
  renderizarLista();

  mostrarFeedback("Filtros removidos.");
}

/* =========================================
   PRÓXIMO ATENDIMENTO
========================================= */

function renderizarProximoAtendimento() {
  const agendamentos = obterAgendamentosDoCliente();

  proximoAtendimento = agendamentos[0] || null;

  nextServiceSection.hidden = !proximoAtendimento;

  if (!proximoAtendimento) {
    return;
  }

  nextServiceTitle.textContent = proximoAtendimento.titulo;

  nextServiceStatus.textContent = "Confirmado";

  nextServiceDay.textContent = formatarDia(proximoAtendimento.data);

  nextServiceMonth.textContent = formatarMesCurto(proximoAtendimento.data);

  nextServiceTime.textContent = formatarHorario(proximoAtendimento);

  nextServiceAddress.textContent = proximoAtendimento.endereco;

  nextServiceCode.textContent = proximoAtendimento.id;
}

/* =========================================
   RESUMO
========================================= */

function obterResumoProximaData(servico) {
  if (!servico) {
    return "--";
  }

  const hoje = obterHoje();

  const dataServico = criarDataLocal(servico.data);

  const amanha = new Date(hoje);

  amanha.setDate(amanha.getDate() + 1);

  if (dataServico.getTime() === hoje.getTime()) {
    return "Hoje";
  }

  if (dataServico.getTime() === amanha.getTime()) {
    return "Amanhã";
  }

  return formatarDataCurta(servico.data);
}

function atualizarResumo() {
  const agendamentos = obterAgendamentosDoCliente();

  const hoje = obterHoje();

  const agendamentosDoMes = agendamentos.filter((servico) => {
    const dataServico = criarDataLocal(servico.data);

    return (
      dataServico.getFullYear() === hoje.getFullYear() &&
      dataServico.getMonth() === hoje.getMonth()
    );
  });

  summaryTotal.textContent = String(agendamentos.length);

  summaryMonth.textContent = String(agendamentosDoMes.length);

  summaryNext.textContent = obterResumoProximaData(agendamentos[0]);
}

/* =========================================
   CRIAÇÃO DOS CARDS
========================================= */

function preencherCard(servico) {
  const fragmento = serviceCardTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".service-card");

  const day = card.querySelector(".service-card__day");

  const month = card.querySelector(".service-card__month");

  const year = card.querySelector(".service-card__year");

  const code = card.querySelector(".service-card__code");

  const status = card.querySelector(".service-card__status");

  const title = card.querySelector(".service-card__title");

  const services = card.querySelector(".service-card__services");

  const time = card.querySelector(".service-card__time span");

  const address = card.querySelector(".service-card__address span");

  const mapButton = card.querySelector(".service-card__button--map");

  const detailsButton = card.querySelector(".service-card__button--details");

  day.textContent = formatarDia(servico.data);

  month.textContent = formatarMesCurto(servico.data);

  year.textContent = formatarAno(servico.data);

  code.textContent = servico.id;

  status.textContent = "Confirmado";

  title.textContent = servico.titulo;

  services.textContent = servico.servicos.join(" • ");

  time.textContent = formatarHorario(servico);

  address.textContent = servico.endereco;

  mapButton.setAttribute("aria-label", `Abrir endereço da ordem ${servico.id}`);

  detailsButton.setAttribute(
    "aria-label",
    `Abrir detalhes da ordem ${servico.id}`,
  );

  mapButton.addEventListener("click", () => {
    abrirEnderecoNoMapa(servico.endereco);
  });

  detailsButton.addEventListener("click", () => {
    abrirDetalhes(servico.id);
  });

  return fragmento;
}

/* =========================================
   RENDERIZAÇÃO DA LISTA
========================================= */

function renderizarLista() {
  const listaFiltrada = obterServicosFiltrados();

  servicesList.innerHTML = "";

  listaFiltrada.forEach((servico) => {
    servicesList.appendChild(preencherCard(servico));
  });

  servicesCount.textContent = formatarQuantidade(listaFiltrada.length);

  const listaVazia = listaFiltrada.length === 0;

  servicesList.hidden = listaVazia;
  emptyState.hidden = !listaVazia;
}

/* =========================================
   EVENTOS
========================================= */

openNextMapButton.addEventListener("click", () => {
  if (!proximoAtendimento) {
    return;
  }

  abrirEnderecoNoMapa(proximoAtendimento.endereco);
});

openNextDetailsButton.addEventListener("click", () => {
  if (!proximoAtendimento) {
    return;
  }

  abrirDetalhes(proximoAtendimento.id);
});

openFilterButton.addEventListener("click", abrirFiltros);

closeFilterButton.addEventListener("click", fecharFiltros);

applyFiltersButton.addEventListener("click", aplicarFiltros);

clearFiltersButton.addEventListener("click", limparFiltros);

periodFilterInputs.forEach((input) => {
  input.addEventListener("change", sincronizarEstiloDosFiltros);
});

scheduleSearch.addEventListener("input", renderizarLista);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !filterPanel.hidden) {
    fecharFiltros();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

sincronizarEstiloDosFiltros();

renderizarProximoAtendimento();

atualizarResumo();

renderizarLista();
