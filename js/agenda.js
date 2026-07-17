/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const AGENDA_STORAGE_KEY = "salvateckAgendaTemporaria";

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
  },

  "a-confirmar": {
    nome: "A confirmar",
    classe: "status--a-confirmar",
  },

  "em-deslocamento": {
    nome: "Em deslocamento",
    classe: "status--em-deslocamento",
  },

  "em-atendimento": {
    nome: "Em atendimento",
    classe: "status--em-atendimento",
  },

  concluido: {
    nome: "Concluído",
    classe: "status--concluido",
  },

  cancelado: {
    nome: "Cancelado",
    classe: "status--cancelado",
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

let modoVisualizacao = "semana";

let dataReferencia = obterInicioDoDia(new Date());

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

function formatarQuantidade(quantidade) {
  return quantidade === 1 ? "1 item" : `${quantidade} itens`;
}

function obterDataISO(data) {
  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
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

function datasSaoIguais(dataA, dataB) {
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

  if (modoVisualizacao === "lista") {
    return {
      inicio: obterPrimeiroDiaDoMes(dataReferencia),

      fim: obterUltimoDiaDoMes(dataReferencia),
    };
  }

  return {
    inicio: obterInicioDaSemana(dataReferencia),

    fim: obterFimDaSemana(dataReferencia),
  };
}

function obterDatasDaVisualizacao() {
  const intervalo = obterIntervaloAtual();

  if (modoVisualizacao === "dia") {
    return [obterInicioDoDia(intervalo.inicio)];
  }

  if (modoVisualizacao === "semana") {
    const datas = [];

    const dataAtual = obterInicioDoDia(intervalo.inicio);

    while (dataAtual <= intervalo.fim) {
      datas.push(new Date(dataAtual));

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return datas;
  }

  return [];
}

/* =========================================
   TÍTULO DO PERÍODO
========================================= */

function atualizarTituloDoPeriodo() {
  if (modoVisualizacao === "dia") {
    currentPeriodEyebrow.textContent = "Dia selecionado";

    currentPeriodLabel.textContent = formatarDataCompleta(dataReferencia);

    agendaContentEyebrow.textContent = "Programação diária";

    agendaContentTitle.textContent = "Atendimentos do dia";

    return;
  }

  if (modoVisualizacao === "lista") {
    currentPeriodEyebrow.textContent = "Mês selecionado";

    currentPeriodLabel.textContent = dataReferencia.toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      },
    );

    agendaContentEyebrow.textContent = "Visão mensal";

    agendaContentTitle.textContent = "Lista de atendimentos";

    return;
  }

  const inicio = obterInicioDaSemana(dataReferencia);

  const fim = obterFimDaSemana(dataReferencia);

  currentPeriodEyebrow.textContent = "Semana selecionada";

  if (
    inicio.getMonth() === fim.getMonth() &&
    inicio.getFullYear() === fim.getFullYear()
  ) {
    currentPeriodLabel.textContent = `${String(inicio.getDate()).padStart(
      2,
      "0",
    )} a ${String(fim.getDate()).padStart(
      2,
      "0",
    )} de ${inicio.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    })}`;
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

  agendaContentTitle.textContent = "Atendimentos";
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
  renderizarAgenda();
  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparFiltros() {
  statusFilterInputs.forEach((input) => {
    input.checked = false;
  });

  categoryFilter.value = "";
  periodFilter.value = "";
  employeeFilter.value = "";

  filtrosAplicados = {
    status: [],
    categoria: "",
    periodo: "",
    responsavel: "",
  };

  sincronizarEstiloDosFiltros();
  atualizarContagemDeFiltros();
  renderizarAgenda();

  mostrarFeedback("Filtros removidos.");
}

/* =========================================
   OBTENÇÃO DOS ATENDIMENTOS
========================================= */

function obterAtendimentosDoPeriodo() {
  const intervalo = obterIntervaloAtual();

  return atendimentos
    .filter((atendimento) => {
      const dataAtendimento = criarDataLocal(atendimento.data);

      return (
        dataAtendimento >= intervalo.inicio && dataAtendimento <= intervalo.fim
      );
    })
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros)
    .sort((a, b) => {
      const diferencaData = criarDataLocal(a.data) - criarDataLocal(b.data);

      if (diferencaData !== 0) {
        return diferencaData;
      }

      return String(a.horario).localeCompare(String(b.horario));
    });
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
   MENU DOS CARDS
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

  timeStrong.textContent = atendimento.horario || "A definir";

  timePeriod.textContent = periodoConfig[atendimento.periodo] || "Período";

  code.textContent = atendimento.id;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  client.textContent = atendimento.clienteNome;

  title.textContent = atendimento.titulo;

  services.textContent = atendimento.servicos.join(" • ");

  address.textContent = atendimento.endereco;

  employee.textContent =
    responsavelConfig[atendimento.responsavel] || "Responsável não definido";

  mapButton.setAttribute(
    "aria-label",
    `Abrir endereço da ordem ${atendimento.id}`,
  );

  detailsButton.setAttribute("aria-label", `Abrir ordem ${atendimento.id}`);

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
   CRIAÇÃO DO GRUPO DE DIA
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
   RENDERIZAÇÃO DA AGENDA
========================================= */

function renderizarAgenda() {
  const lista = obterAtendimentosDoPeriodo();

  agendaBoard.innerHTML = "";

  agendaBoard.className = `agenda-board view--${modoVisualizacao}`;

  if (modoVisualizacao === "dia" || modoVisualizacao === "semana") {
    const datas = obterDatasDaVisualizacao();

    datas.forEach((data) => {
      const dataISO = obterDataISO(data);

      const atendimentosDoDia = lista.filter(
        (atendimento) => atendimento.data === dataISO,
      );

      agendaBoard.appendChild(criarGrupoDoDia(data, atendimentosDoDia));
    });
  } else {
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

  agendaCount.textContent = formatarQuantidade(lista.length);

  const listaVazia = lista.length === 0;

  if (listaVazia) {
    agendaBoard.hidden = true;
    emptyState.hidden = false;
  } else {
    agendaBoard.hidden = false;
    emptyState.hidden = true;
  }

  atualizarTituloDoPeriodo();
}

/* =========================================
   MODO DE VISUALIZAÇÃO
========================================= */

function alterarModoDeVisualizacao(novoModo) {
  if (!["dia", "semana", "lista"].includes(novoModo)) {
    return;
  }

  modoVisualizacao = novoModo;

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

  fecharTodosOsMenus();
  renderizarAgenda();
}

function voltarParaHoje() {
  dataReferencia = obterInicioDoDia(new Date());

  fecharTodosOsMenus();
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
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

carregarEstadoLocal();

sincronizarEstiloDosFiltros();

alterarModoDeVisualizacao(modoVisualizacao);

atualizarContagemDeFiltros();

atualizarResumo();

renderizarAgenda();
