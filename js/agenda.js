/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const AGENDA_STORAGE_KEY = "salvateckAgendaTemporaria";

const MODOS_VISUALIZACAO = ["mes", "semana", "dia", "lista"];

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

  return obterDataISO(data);
}

/* =========================================
   DADOS TEMPORÁRIOS DA AGENDA
========================================= */

const atendimentos = [
  {
    id: "OS-0004",
    clienteId: "cliente-maria",
    clienteNome: "Maria Oliveira",

    titulo: "Troca de tomada danificada",

    categorias: ["eletrica"],

    servicos: ["Trocar tomada", "Verificar fiação"],

    data: criarDataComOffset(0),

    periodo: "manha",
    horario: "08:30",

    endereco:
      "Avenida das Flores, 380, Apartamento 42 — Vila Nova, São Paulo/SP",

    responsavel: "jose",

    status: "em-atendimento",
  },

  {
    id: "OS-0001",
    clienteId: "cliente-joao",
    clienteNome: "João da Silva",

    titulo: "Vazamento na torneira da cozinha",

    categorias: ["hidraulica"],

    servicos: ["Torneira vazando", "Ajustar torneira"],

    data: criarDataComOffset(1),

    periodo: "manha",
    horario: "09:00",

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    responsavel: "jose",

    status: "confirmado",
  },

  {
    id: "OS-0002",
    clienteId: "cliente-joao",
    clienteNome: "João da Silva",

    titulo: "Instalação de luminária",

    categorias: ["eletrica", "instalacoes"],

    servicos: ["Instalar luminária"],

    data: criarDataComOffset(2),

    periodo: "tarde",
    horario: "14:30",

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    responsavel: "equipe-apoio",

    status: "confirmado",
  },

  {
    id: "OS-0005",
    clienteId: "cliente-carlos",
    clienteNome: "Carlos Henrique",

    titulo: "Reparo em parede com infiltração",

    categorias: ["alvenaria", "pintura"],

    servicos: [
      "Correção de infiltração",
      "Reparo em parede",
      "Retoque de pintura",
    ],

    data: criarDataComOffset(3),

    periodo: "manha",
    horario: "10:00",

    endereco: "Rua das Palmeiras, 45 — Jardim Sul, São Paulo/SP",

    responsavel: "jose",

    status: "a-confirmar",
  },

  {
    id: "OS-0007",
    clienteId: "cliente-roberto",
    clienteNome: "Roberto Mendes",

    titulo: "Manutenção em porta e fechadura",

    categorias: ["manutencao-geral"],

    servicos: ["Ajustar porta", "Trocar fechadura"],

    data: criarDataComOffset(5),

    periodo: "tarde",
    horario: "15:00",

    endereco: "Avenida Central, 1020, Sala 6 — Centro, Osasco/SP",

    responsavel: "nao-definido",

    status: "confirmado",
  },

  {
    id: "OS-0003",
    clienteId: "cliente-joao",
    clienteNome: "João da Silva",

    titulo: "Pintura de parede do quarto",

    categorias: ["pintura"],

    servicos: ["Preparação da superfície", "Pintura de parede"],

    data: criarDataComOffset(7),

    periodo: "tarde",
    horario: "14:00",

    endereco: "Rua Exemplo, 150, Casa 2 — Centro, São Paulo/SP",

    responsavel: "equipe-apoio",

    status: "confirmado",
  },

  {
    id: "OS-0006",
    clienteId: "cliente-ana",
    clienteNome: "Ana Paula Santos",

    titulo: "Instalação de suporte para televisão",

    categorias: ["instalacoes"],

    servicos: ["Instalar suporte de TV"],

    data: criarDataComOffset(9),

    periodo: "manha",
    horario: "11:00",

    endereco: "Rua dos Ipês, 92 — Bela Vista, São Paulo/SP",

    responsavel: "jose",

    status: "cancelado",
  },

  {
    id: "OS-0008",
    clienteId: "cliente-patricia",
    clienteNome: "Patrícia Souza",

    titulo: "Desentupimento de vaso sanitário",

    categorias: ["hidraulica"],

    servicos: ["Vaso sanitário entupido", "Desentupimento"],

    data: criarDataComOffset(12),

    periodo: "manha",
    horario: "08:00",

    endereco: "Rua São Bento, 318 — Centro, São Paulo/SP",

    responsavel: "nao-definido",

    status: "a-confirmar",
  },
];

/* =========================================
   CONFIGURAÇÕES DOS CAMPOS
========================================= */

const statusConfig = {
  confirmado: {
    nome: "Confirmado",
    classe: "status--confirmado",
    marcador: "calendar-marker--confirmado",
  },

  "a-confirmar": {
    nome: "A confirmar",
    classe: "status--a-confirmar",
    marcador: "calendar-marker--a-confirmar",
  },

  "em-deslocamento": {
    nome: "Em deslocamento",
    classe: "status--em-deslocamento",
    marcador: "calendar-marker--em-deslocamento",
  },

  "em-atendimento": {
    nome: "Em atendimento",
    classe: "status--em-atendimento",
    marcador: "calendar-marker--em-atendimento",
  },

  concluido: {
    nome: "Concluído",
    classe: "status--concluido",
    marcador: "calendar-marker--concluido",
  },

  cancelado: {
    nome: "Cancelado",
    classe: "status--cancelado",
    marcador: "calendar-marker--cancelado",
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

const periodoConfig = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

const responsavelConfig = {
  jose: "José",
  "equipe-apoio": "Equipe de apoio",
  "nao-definido": "Responsável não definido",
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const summaryToday = document.getElementById("summary-today");

const summaryWeek = document.getElementById("summary-week");

const summaryPending = document.getElementById("summary-pending");

const summaryConfirmed = document.getElementById("summary-confirmed");

const previousPeriodButton = document.getElementById("previous-period-button");

const nextPeriodButton = document.getElementById("next-period-button");

const todayButton = document.getElementById("today-button");

const currentPeriodEyebrow = document.getElementById("current-period-eyebrow");

const currentPeriodLabel = document.getElementById("current-period-label");

const viewModeButtons = document.querySelectorAll("[data-view-mode]");

const agendaSearch = document.getElementById("agenda-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const activeFiltersList = document.getElementById("active-filters-list");

const statusFilterInputs = document.querySelectorAll(
  'input[name="statusFilter"]',
);

const categoryFilter = document.getElementById("category-filter");

const periodFilter = document.getElementById("period-filter");

const employeeFilter = document.getElementById("employee-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const agendaContentEyebrow = document.getElementById("agenda-content-eyebrow");

const agendaContentTitle = document.getElementById("agenda-content-title");

const agendaCount = document.getElementById("agenda-count");

const calendarView = document.getElementById("calendar-view");

const calendarGrid = document.getElementById("calendar-grid");

const calendarDayTemplate = document.getElementById("calendar-day-template");

const daySelectionPlaceholder = document.getElementById(
  "day-selection-placeholder",
);

const selectedDayPanel = document.getElementById("selected-day-panel");

const selectedDayLabel = document.getElementById("selected-day-label");

const selectedDayCount = document.getElementById("selected-day-count");

const selectedDayAppointments = document.getElementById(
  "selected-day-appointments",
);

const selectedDayEmpty = document.getElementById("selected-day-empty");

const closeSelectedDayButton = document.getElementById(
  "close-selected-day-button",
);

const agendaBoard = document.getElementById("agenda-board");

const emptyState = document.getElementById("empty-state");

const agendaDayTemplate = document.getElementById("agenda-day-template");

const appointmentCardTemplate = document.getElementById(
  "appointment-card-template",
);

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let modoVisualizacao = "mes";

let dataReferencia = obterInicioDoDia(new Date());

let dataSelecionada = null;

let filtrosAplicados = {
  status: [],
  categoria: "",
  periodo: "",
  responsavel: "",
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

function obterDataISO(data) {
  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarQuantidade(quantidade) {
  return quantidade === 1 ? "1 item" : `${quantidade} itens`;
}

function formatarDiaDaSemana(data) {
  return data
    .toLocaleDateString("pt-BR", {
      weekday: "short",
    })
    .replace(".", "")
    .toUpperCase();
}

function formatarMesCurto(data) {
  return data
    .toLocaleDateString("pt-BR", {
      month: "short",
    })
    .replace(".", "")
    .toUpperCase();
}

function formatarDataCompleta(data) {
  const texto = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarMesEAno(data) {
  const texto = data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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

function obterPrimeiroDiaDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

function obterUltimoDiaDoMes(data) {
  const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);

  ultimoDia.setHours(23, 59, 59, 999);

  return ultimoDia;
}

function obterInicioDoCalendarioMensal(data) {
  const primeiroDiaDoMes = obterPrimeiroDiaDoMes(data);

  return obterInicioDaSemana(primeiroDiaDoMes);
}

function obterFimDoCalendarioMensal(data) {
  const inicio = obterInicioDoCalendarioMensal(data);

  const fim = new Date(inicio);

  fim.setDate(fim.getDate() + 41);

  fim.setHours(23, 59, 59, 999);

  return fim;
}

function datasSaoIguais(dataA, dataB) {
  if (!dataA || !dataB) {
    return false;
  }

  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()
  );
}

function obterNomeCategorias(categorias) {
  return categorias
    .map((categoria) => categoriaConfig[categoria] || categoria)
    .filter(Boolean);
}

function ordenarAtendimentos(lista) {
  return [...lista].sort((atendimentoA, atendimentoB) => {
    const diferencaData =
      criarDataLocal(atendimentoA.data) - criarDataLocal(atendimentoB.data);

    if (diferencaData !== 0) {
      return diferencaData;
    }

    return String(atendimentoA.horario).localeCompare(
      String(atendimentoB.horario),
    );
  });
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
    perfil: "admin",
  });

  window.location.href = `detalhes-solicitacao.html?${parametros.toString()}`;
}

function abrirEnderecoNoMapa(endereco) {
  if (!endereco) {
    mostrarFeedback("O endereço deste atendimento não está disponível.");

    return;
  }

  const enderecoCodificado = encodeURIComponent(endereco);

  const url = `https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

/* =========================================
   ARMAZENAMENTO LOCAL TEMPORÁRIO
========================================= */

function carregarEstadoLocal() {
  try {
    const dados = JSON.parse(localStorage.getItem(AGENDA_STORAGE_KEY) || "{}");

    atendimentos.forEach((atendimento) => {
      const alteracao = dados[atendimento.id];

      if (!alteracao) {
        return;
      }

      atendimento.status = alteracao.status || atendimento.status;

      atendimento.responsavel =
        alteracao.responsavel || atendimento.responsavel;
    });
  } catch (error) {
    console.warn("Não foi possível carregar a agenda temporária.", error);
  }
}

function salvarEstadoLocal() {
  try {
    const dados = {};

    atendimentos.forEach((atendimento) => {
      dados[atendimento.id] = {
        status: atendimento.status,
        responsavel: atendimento.responsavel,
      };
    });

    localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(dados));
  } catch (error) {
    console.warn("Não foi possível salvar a agenda temporária.", error);
  }
}

/* =========================================
   INTERVALO DA VISUALIZAÇÃO
========================================= */

function obterIntervaloAtual() {
  if (modoVisualizacao === "dia") {
    const inicio = obterInicioDoDia(dataReferencia);

    const fim = obterInicioDoDia(dataReferencia);

    fim.setHours(23, 59, 59, 999);

    return {
      inicio,
      fim,
    };
  }

  if (modoVisualizacao === "semana") {
    return {
      inicio: obterInicioDaSemana(dataReferencia),
      fim: obterFimDaSemana(dataReferencia),
    };
  }

  return {
    inicio: obterPrimeiroDiaDoMes(dataReferencia),
    fim: obterUltimoDiaDoMes(dataReferencia),
  };
}

function obterDatasDaSemana() {
  const datas = [];

  const inicio = obterInicioDaSemana(dataReferencia);

  for (let indice = 0; indice < 7; indice += 1) {
    const data = new Date(inicio);

    data.setDate(inicio.getDate() + indice);

    datas.push(data);
  }

  return datas;
}

/* =========================================
   TÍTULO DO PERÍODO
========================================= */

function atualizarTituloDoPeriodo() {
  if (modoVisualizacao === "mes") {
    currentPeriodEyebrow.textContent = "Mês selecionado";

    currentPeriodLabel.textContent = formatarMesEAno(dataReferencia);

    agendaContentEyebrow.textContent = "Visão mensal";

    agendaContentTitle.textContent = "Calendário de atendimentos";

    return;
  }

  if (modoVisualizacao === "dia") {
    currentPeriodEyebrow.textContent = "Dia selecionado";

    currentPeriodLabel.textContent = formatarDataCompleta(dataReferencia);

    agendaContentEyebrow.textContent = "Programação diária";

    agendaContentTitle.textContent = "Atendimentos do dia";

    return;
  }

  if (modoVisualizacao === "lista") {
    currentPeriodEyebrow.textContent = "Mês selecionado";

    currentPeriodLabel.textContent = formatarMesEAno(dataReferencia);

    agendaContentEyebrow.textContent = "Visão em lista";

    agendaContentTitle.textContent = "Todos os atendimentos";

    return;
  }

  const inicio = obterInicioDaSemana(dataReferencia);

  const fim = obterFimDaSemana(dataReferencia);

  currentPeriodEyebrow.textContent = "Semana selecionada";

  if (
    inicio.getMonth() === fim.getMonth() &&
    inicio.getFullYear() === fim.getFullYear()
  ) {
    currentPeriodLabel.textContent =
      `${String(inicio.getDate()).padStart(2, "0")} a ` +
      `${String(fim.getDate()).padStart(2, "0")} de ` +
      inicio.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
  } else {
    currentPeriodLabel.textContent = `${inicio.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })} a ${fim.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }

  agendaContentEyebrow.textContent = "Programação semanal";

  agendaContentTitle.textContent = "Atendimentos da semana";
}

/* =========================================
   PESQUISA
========================================= */

function correspondeAPesquisa(atendimento) {
  const pesquisa = normalizarTexto(agendaSearch.value);

  if (!pesquisa) {
    return true;
  }

  const categorias = obterNomeCategorias(atendimento.categorias).join(" ");

  const status = statusConfig[atendimento.status]?.nome || "";

  const responsavel = responsavelConfig[atendimento.responsavel] || "";

  const conteudoPesquisavel = normalizarTexto(
    [
      atendimento.id,
      atendimento.clienteNome,
      atendimento.titulo,
      atendimento.servicos.join(" "),
      categorias,
      status,
      atendimento.endereco,
      responsavel,
      atendimento.horario,
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

  const periodoCorresponde =
    !filtrosAplicados.periodo ||
    atendimento.periodo === filtrosAplicados.periodo;

  const responsavelCorresponde =
    !filtrosAplicados.responsavel ||
    atendimento.responsavel === filtrosAplicados.responsavel;

  return (
    statusCorresponde &&
    categoriaCorresponde &&
    periodoCorresponde &&
    responsavelCorresponde
  );
}

function obterAtendimentosFiltrados() {
  return ordenarAtendimentos(
    atendimentos.filter(correspondeAPesquisa).filter(correspondeAosFiltros),
  );
}

function sincronizarFormularioComFiltros() {
  statusFilterInputs.forEach((input) => {
    input.checked = filtrosAplicados.status.includes(input.value);
  });

  categoryFilter.value = filtrosAplicados.categoria;

  periodFilter.value = filtrosAplicados.periodo;

  employeeFilter.value = filtrosAplicados.responsavel;

  sincronizarEstiloDosFiltros();
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

  if (filtrosAplicados.periodo) {
    quantidade += 1;
  }

  if (filtrosAplicados.responsavel) {
    quantidade += 1;
  }

  return quantidade;
}

function atualizarContagemDeFiltros() {
  const quantidade = contarFiltrosAtivos();

  activeFilterCount.textContent = String(quantidade);

  activeFilterCount.hidden = quantidade === 0;
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

function renderizarFiltrosAtivos() {
  activeFiltersList.innerHTML = "";

  filtrosAplicados.status.forEach((status) => {
    const nome = statusConfig[status]?.nome || status;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.status = filtrosAplicados.status.filter(
          (item) => item !== status,
        );

        finalizarRemocaoDeFiltro();
      }),
    );
  });

  if (filtrosAplicados.categoria) {
    const nome =
      categoriaConfig[filtrosAplicados.categoria] || filtrosAplicados.categoria;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.categoria = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.periodo) {
    const nome =
      periodoConfig[filtrosAplicados.periodo] || filtrosAplicados.periodo;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.periodo = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  if (filtrosAplicados.responsavel) {
    const nome =
      responsavelConfig[filtrosAplicados.responsavel] ||
      filtrosAplicados.responsavel;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.responsavel = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

  activeFiltersList.hidden = activeFiltersList.children.length === 0;
}

function finalizarRemocaoDeFiltro() {
  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarAgenda();
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

    periodo: periodFilter.value,

    responsavel: employeeFilter.value,
  };

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarAgenda();

  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparFiltros() {
  filtrosAplicados = {
    status: [],
    categoria: "",
    periodo: "",
    responsavel: "",
  };

  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarAgenda();

  mostrarFeedback("Filtros removidos.");
}

/* =========================================
   OBTENÇÃO DOS ATENDIMENTOS DO PERÍODO
========================================= */

function obterAtendimentosDoPeriodo() {
  const intervalo = obterIntervaloAtual();

  return obterAtendimentosFiltrados().filter((atendimento) => {
    const dataAtendimento = criarDataLocal(atendimento.data);

    return (
      dataAtendimento >= intervalo.inicio && dataAtendimento <= intervalo.fim
    );
  });
}

function obterAtendimentosDaData(data) {
  const dataISO = obterDataISO(data);

  return obterAtendimentosFiltrados().filter(
    (atendimento) => atendimento.data === dataISO,
  );
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const hoje = obterInicioDoDia();

  const inicioSemana = obterInicioDaSemana(hoje);

  const fimSemana = obterFimDaSemana(hoje);

  const ativos = atendimentos.filter(
    (atendimento) => atendimento.status !== "cancelado",
  );

  const hojeQuantidade = ativos.filter((atendimento) => {
    const data = criarDataLocal(atendimento.data);

    return datasSaoIguais(data, hoje);
  }).length;

  const semanaQuantidade = ativos.filter((atendimento) => {
    const data = criarDataLocal(atendimento.data);

    return data >= inicioSemana && data <= fimSemana;
  }).length;

  const pendentesQuantidade = atendimentos.filter(
    (atendimento) => atendimento.status === "a-confirmar",
  ).length;

  const confirmadosQuantidade = atendimentos.filter(
    (atendimento) => atendimento.status === "confirmado",
  ).length;

  summaryToday.textContent = String(hojeQuantidade);

  summaryWeek.textContent = String(semanaQuantidade);

  summaryPending.textContent = String(pendentesQuantidade);

  summaryConfirmed.textContent = String(confirmadosQuantidade);
}

/* =========================================
   MENU E EXPANSÃO DOS CARDS
========================================= */

function fecharTodosOsMenus(excecao = null) {
  document.querySelectorAll(".appointment-card__options").forEach((menu) => {
    if (menu !== excecao) {
      menu.hidden = true;
    }
  });

  document.querySelectorAll(".appointment-card__menu").forEach((botao) => {
    const card = botao.closest(".appointment-card");

    const menu = card?.querySelector(".appointment-card__options");

    if (menu !== excecao) {
      botao.setAttribute("aria-expanded", "false");
    }
  });
}

function alternarDetalhesDoCard(card) {
  const toggle = card.querySelector(".appointment-card__toggle");

  const details = card.querySelector(".appointment-card__details");

  const seraAberto = details.hidden;

  details.hidden = !seraAberto;

  toggle.setAttribute("aria-expanded", String(seraAberto));

  toggle.setAttribute(
    "aria-label",
    seraAberto
      ? "Ocultar detalhes do atendimento"
      : "Mostrar detalhes do atendimento",
  );

  card.classList.toggle("is-expanded", seraAberto);

  if (!seraAberto) {
    const options = card.querySelector(".appointment-card__options");

    const menuButton = card.querySelector(".appointment-card__menu");

    if (options) {
      options.hidden = true;
    }

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }
  }
}

/* =========================================
   AÇÕES DOS ATENDIMENTOS
========================================= */

function alterarStatusDoAtendimento(atendimento, novoStatus, mensagem) {
  atendimento.status = novoStatus;

  salvarEstadoLocal();

  fecharTodosOsMenus();

  atualizarResumo();

  renderizarAgenda();

  mostrarFeedback(mensagem);
}

function executarAcaoDoAtendimento(atendimento, acao) {
  if (acao === "reagendar") {
    alterarStatusDoAtendimento(
      atendimento,
      "a-confirmar",
      "Atendimento marcado para reagendamento.",
    );

    return;
  }

  if (acao === "iniciar") {
    alterarStatusDoAtendimento(
      atendimento,
      "em-atendimento",
      "Atendimento iniciado.",
    );

    return;
  }

  if (acao === "concluir") {
    alterarStatusDoAtendimento(
      atendimento,
      "concluido",
      "Atendimento marcado como concluído.",
    );

    return;
  }

  if (acao === "cancelar") {
    alterarStatusDoAtendimento(
      atendimento,
      "cancelado",
      "Atendimento cancelado.",
    );
  }
}

/* =========================================
   CRIAÇÃO DO CARD
========================================= */

function preencherCard(atendimento) {
  const fragmento = appointmentCardTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".appointment-card");

  const timeStrong = card.querySelector(".appointment-card__time strong");

  const timePeriod = card.querySelector(".appointment-card__time span");

  const code = card.querySelector(".appointment-card__code");

  const status = card.querySelector(".appointment-card__status");

  const client = card.querySelector(".appointment-card__client");

  const title = card.querySelector(".appointment-card__title");

  const toggle = card.querySelector(".appointment-card__toggle");

  const services = card.querySelector(".appointment-card__services");

  const address = card.querySelector(".appointment-card__address span");

  const employee = card.querySelector(".appointment-card__employee span");

  const mapButton = card.querySelector(".appointment-card__button--map");

  const detailsButton = card.querySelector(
    ".appointment-card__button--details",
  );

  const menuButton = card.querySelector(".appointment-card__menu");

  const options = card.querySelector(".appointment-card__options");

  const actionButtons = card.querySelectorAll("[data-appointment-action]");

  const statusData =
    statusConfig[atendimento.status] || statusConfig.confirmado;

  card.dataset.appointmentId = atendimento.id;

  timeStrong.textContent = atendimento.horario || "A definir";

  timePeriod.textContent = periodoConfig[atendimento.periodo] || "Período";

  code.textContent = atendimento.id;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  client.textContent = atendimento.clienteNome;

  title.textContent = atendimento.titulo;

  services.textContent = atendimento.servicos.join(" • ");

  address.textContent = atendimento.endereco || "Endereço não informado";

  employee.textContent =
    responsavelConfig[atendimento.responsavel] || "Responsável não definido";

  toggle.setAttribute(
    "aria-label",
    `Mostrar detalhes da ordem ${atendimento.id}`,
  );

  mapButton.setAttribute(
    "aria-label",
    `Abrir endereço da ordem ${atendimento.id}`,
  );

  detailsButton.setAttribute("aria-label", `Abrir ordem ${atendimento.id}`);

  toggle.addEventListener("click", () => {
    alternarDetalhesDoCard(card);
  });

  mapButton.addEventListener("click", () => {
    abrirEnderecoNoMapa(atendimento.endereco);
  });

  detailsButton.addEventListener("click", () => {
    abrirDetalhes(atendimento.id);
  });

  const statusFinalizado = ["concluido", "cancelado"].includes(
    atendimento.status,
  );

  menuButton.hidden = statusFinalizado;

  if (statusFinalizado) {
    options.hidden = true;
  }

  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const seraAberto = options.hidden;

    fecharTodosOsMenus(options);

    options.hidden = !seraAberto;

    menuButton.setAttribute("aria-expanded", String(seraAberto));
  });

  actionButtons.forEach((button) => {
    const acao = button.dataset.appointmentAction;

    if (acao === "iniciar" && atendimento.status === "em-atendimento") {
      button.hidden = true;
    }

    if (acao === "concluir" && atendimento.status !== "em-atendimento") {
      button.hidden = true;
    }

    button.addEventListener("click", () => {
      executarAcaoDoAtendimento(atendimento, acao);
    });
  });

  return fragmento;
}

/* =========================================
   GRUPO DO DIA
========================================= */

function criarGrupoDoDia(data, atendimentosDoDia) {
  const fragmento = agendaDayTemplate.content.cloneNode(true);

  const daySection = fragmento.querySelector(".agenda-day");

  const weekday = daySection.querySelector(".agenda-day__weekday");

  const day = daySection.querySelector(".agenda-day__day");

  const month = daySection.querySelector(".agenda-day__month");

  const count = daySection.querySelector(".agenda-day__count");

  const appointmentsContainer = daySection.querySelector(
    ".agenda-day__appointments",
  );

  const dayEmpty = daySection.querySelector(".agenda-day__empty");

  weekday.textContent = formatarDiaDaSemana(data);

  day.textContent = String(data.getDate()).padStart(2, "0");

  month.textContent = formatarMesCurto(data);

  count.textContent = formatarQuantidade(atendimentosDoDia.length);

  const semAtendimentos = atendimentosDoDia.length === 0;

  appointmentsContainer.hidden = semAtendimentos;

  dayEmpty.hidden = !semAtendimentos;

  atendimentosDoDia.forEach((atendimento) => {
    appointmentsContainer.appendChild(preencherCard(atendimento));
  });

  if (datasSaoIguais(data, obterInicioDoDia())) {
    daySection.classList.add("is-today");
  }

  return fragmento;
}

/* =========================================
   CALENDÁRIO MENSAL
========================================= */

function criarMarcadoresDoDia(container, atendimentosDoDia) {
  container.innerHTML = "";

  const statusUnicos = [
    ...new Set(atendimentosDoDia.map((atendimento) => atendimento.status)),
  ].slice(0, 4);

  statusUnicos.forEach((status) => {
    const marcador = document.createElement("span");

    marcador.className = [
      "calendar-marker",
      statusConfig[status]?.marcador || "calendar-marker--confirmado",
    ].join(" ");

    container.appendChild(marcador);
  });
}

function selecionarDataDoCalendario(data) {
  const foraDoMesAtual =
    data.getMonth() !== dataReferencia.getMonth() ||
    data.getFullYear() !== dataReferencia.getFullYear();

  dataSelecionada = obterInicioDoDia(data);

  if (foraDoMesAtual) {
    dataReferencia = obterInicioDoDia(data);
  }

  renderizarAgenda();

  window.requestAnimationFrame(() => {
    selectedDayPanel.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  });
}

function fecharDiaSelecionado() {
  dataSelecionada = null;

  renderizarCalendarioMensal();
}

function renderizarPainelDoDiaSelecionado() {
  selectedDayAppointments.innerHTML = "";

  if (!dataSelecionada) {
    daySelectionPlaceholder.hidden = false;

    selectedDayPanel.hidden = true;

    return;
  }

  daySelectionPlaceholder.hidden = true;

  selectedDayPanel.hidden = false;

  const lista = obterAtendimentosDaData(dataSelecionada);

  selectedDayLabel.textContent = formatarDataCompleta(dataSelecionada);

  selectedDayCount.textContent = formatarQuantidade(lista.length);

  const semAtendimentos = lista.length === 0;

  selectedDayAppointments.hidden = semAtendimentos;

  selectedDayEmpty.hidden = !semAtendimentos;

  lista.forEach((atendimento) => {
    selectedDayAppointments.appendChild(preencherCard(atendimento));
  });
}

function renderizarCalendarioMensal() {
  calendarGrid.innerHTML = "";

  const inicioCalendario = obterInicioDoCalendarioMensal(dataReferencia);

  const hoje = obterInicioDoDia();

  const atendimentosFiltrados = obterAtendimentosFiltrados();

  for (let indice = 0; indice < 42; indice += 1) {
    const data = new Date(inicioCalendario);

    data.setDate(inicioCalendario.getDate() + indice);

    const dataISO = obterDataISO(data);

    const atendimentosDoDia = atendimentosFiltrados.filter(
      (atendimento) => atendimento.data === dataISO,
    );

    const fragmento = calendarDayTemplate.content.cloneNode(true);

    const dayButton = fragmento.querySelector(".calendar-day");

    const dayNumber = fragmento.querySelector(".calendar-day__number");

    const markers = fragmento.querySelector(".calendar-day__markers");

    const count = fragmento.querySelector(".calendar-day__count");

    dayNumber.textContent = String(data.getDate());

    count.textContent = String(atendimentosDoDia.length);

    dayButton.dataset.date = dataISO;

    dayButton.setAttribute(
      "aria-label",
      `${formatarDataCompleta(data)}. ` +
        `${formatarQuantidade(atendimentosDoDia.length)}.`,
    );

    const pertenceAoMes =
      data.getMonth() === dataReferencia.getMonth() &&
      data.getFullYear() === dataReferencia.getFullYear();

    dayButton.classList.toggle("is-outside-month", !pertenceAoMes);

    dayButton.classList.toggle("is-today", datasSaoIguais(data, hoje));

    dayButton.classList.toggle(
      "has-appointments",
      atendimentosDoDia.length > 0,
    );

    const estaSelecionado = datasSaoIguais(data, dataSelecionada);

    dayButton.classList.toggle("is-selected", estaSelecionado);

    dayButton.setAttribute("aria-pressed", String(estaSelecionado));

    criarMarcadoresDoDia(markers, atendimentosDoDia);

    dayButton.addEventListener("click", () => {
      selecionarDataDoCalendario(data);
    });

    calendarGrid.appendChild(fragmento);
  }

  renderizarPainelDoDiaSelecionado();
}

/* =========================================
   VISÕES SEMANA, DIA E LISTA
========================================= */

function renderizarVisaoSemana(lista) {
  const datas = obterDatasDaSemana();

  const diasComAtendimentos = datas.filter((data) => {
    const dataISO = obterDataISO(data);

    return lista.some((atendimento) => atendimento.data === dataISO);
  });

  diasComAtendimentos.forEach((data) => {
    const dataISO = obterDataISO(data);

    const atendimentosDoDia = lista.filter(
      (atendimento) => atendimento.data === dataISO,
    );

    agendaBoard.appendChild(criarGrupoDoDia(data, atendimentosDoDia));
  });
}

function renderizarVisaoDia(lista) {
  if (lista.length === 0) {
    return;
  }

  agendaBoard.appendChild(criarGrupoDoDia(dataReferencia, lista));
}

function renderizarVisaoLista(lista) {
  const grupos = new Map();

  lista.forEach((atendimento) => {
    if (!grupos.has(atendimento.data)) {
      grupos.set(atendimento.data, []);
    }

    grupos.get(atendimento.data).push(atendimento);
  });

  grupos.forEach((atendimentosDoDia, dataISO) => {
    agendaBoard.appendChild(
      criarGrupoDoDia(criarDataLocal(dataISO), atendimentosDoDia),
    );
  });
}

function renderizarAgendaSecundaria(lista) {
  agendaBoard.innerHTML = "";

  agendaBoard.className = `agenda-board view--${modoVisualizacao}`;

  if (modoVisualizacao === "semana") {
    renderizarVisaoSemana(lista);
  }

  if (modoVisualizacao === "dia") {
    renderizarVisaoDia(lista);
  }

  if (modoVisualizacao === "lista") {
    renderizarVisaoLista(lista);
  }

  const listaVazia = lista.length === 0;

  agendaBoard.hidden = listaVazia;

  emptyState.hidden = !listaVazia;
}

/* =========================================
   RENDERIZAÇÃO PRINCIPAL
========================================= */

function renderizarAgenda() {
  fecharTodosOsMenus();

  atualizarTituloDoPeriodo();

  const lista = obterAtendimentosDoPeriodo();

  agendaCount.textContent = formatarQuantidade(lista.length);

  const modoMensal = modoVisualizacao === "mes";

  calendarView.hidden = !modoMensal;

  agendaBoard.hidden = modoMensal;

  emptyState.hidden = true;

  if (modoMensal) {
    renderizarCalendarioMensal();

    return;
  }

  renderizarAgendaSecundaria(lista);
}

/* =========================================
   MODO DE VISUALIZAÇÃO
========================================= */

function alterarModoDeVisualizacao(novoModo) {
  if (!MODOS_VISUALIZACAO.includes(novoModo)) {
    return;
  }

  modoVisualizacao = novoModo;

  if (novoModo !== "mes") {
    dataSelecionada = null;
  }

  viewModeButtons.forEach((button) => {
    const ativo = button.dataset.viewMode === novoModo;

    button.classList.toggle("is-active", ativo);

    button.setAttribute("aria-pressed", String(ativo));
  });

  renderizarAgenda();
}

/* =========================================
   NAVEGAÇÃO ENTRE PERÍODOS
========================================= */

function moverPeriodo(direcao) {
  if (modoVisualizacao === "dia") {
    dataReferencia.setDate(dataReferencia.getDate() + direcao);
  } else if (modoVisualizacao === "semana") {
    dataReferencia.setDate(dataReferencia.getDate() + direcao * 7);
  } else {
    dataReferencia.setMonth(dataReferencia.getMonth() + direcao);
  }

  dataReferencia = obterInicioDoDia(dataReferencia);

  dataSelecionada = null;

  renderizarAgenda();
}

function voltarParaHoje() {
  dataReferencia = obterInicioDoDia(new Date());

  dataSelecionada = null;

  renderizarAgenda();

  mostrarFeedback("Agenda posicionada no período atual.");
}

/* =========================================
   EVENTOS
========================================= */

previousPeriodButton.addEventListener("click", () => {
  moverPeriodo(-1);
});

nextPeriodButton.addEventListener("click", () => {
  moverPeriodo(1);
});

todayButton.addEventListener("click", voltarParaHoje);

viewModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    alterarModoDeVisualizacao(button.dataset.viewMode);
  });
});

openFilterButton.addEventListener("click", abrirFiltros);

closeFilterButton.addEventListener("click", fecharFiltros);

applyFiltersButton.addEventListener("click", aplicarFiltros);

clearFiltersButton.addEventListener("click", limparFiltros);

closeSelectedDayButton.addEventListener("click", fecharDiaSelecionado);

statusFilterInputs.forEach((input) => {
  input.addEventListener("change", sincronizarEstiloDosFiltros);
});

agendaSearch.addEventListener("input", renderizarAgenda);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".appointment-card")) {
    fecharTodosOsMenus();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  fecharTodosOsMenus();

  if (!filterPanel.hidden) {
    fecharFiltros();

    openFilterButton.focus();

    return;
  }

  if (modoVisualizacao === "mes" && dataSelecionada) {
    fecharDiaSelecionado();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

carregarEstadoLocal();

sincronizarFormularioComFiltros();

atualizarContagemDeFiltros();

renderizarFiltrosAtivos();

atualizarResumo();

alterarModoDeVisualizacao(modoVisualizacao);
