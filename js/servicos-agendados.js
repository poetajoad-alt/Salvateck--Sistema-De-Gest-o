import "./auth-guard.js";

import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const FILTROS_RAPIDOS = ["todos", "confirmado", "a-confirmar", "encerrados"];

let servicosAgendados = [];

let sessaoAtual = null;

/* =========================================
   FUNÇÕES INICIAIS DE DATA
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
  confirmado: {
    nome: "Confirmado",
    classe: "status--confirmado",
    marcador: "calendar-marker--confirmado",
  },

  "a-confirmar": {
    nome: "Aguardando",
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
  vistoria: "Vistoria técnica",
};

const periodoConfig = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  horario: "Horário específico",
};

const periodoFiltroConfig = {
  hoje: "Hoje",
  semana: "Esta semana",
  mes: "Este mês",
  proximos: "Próximos meses",
};

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const nextServiceSection = document.getElementById("next-service");

const nextServiceTop = nextServiceSection.querySelector(".next-service__top");

const nextServiceContent = nextServiceSection.querySelector(
  ".next-service__content",
);

const nextServiceActions = nextServiceSection.querySelector(
  ".next-service__actions",
);

const nextServiceEmpty = document.getElementById("next-service-empty");

const nextServiceTitle = document.getElementById("next-service-title");

const nextServiceStatus = document.getElementById("next-service-status");

const nextServiceDay = document.getElementById("next-service-day");

const nextServiceMonth = document.getElementById("next-service-month");

const nextServiceYear = document.getElementById("next-service-year");

const nextServiceTime = document.getElementById("next-service-time");

const nextServiceAddress = document.getElementById("next-service-address");

const nextServiceCode = document.getElementById("next-service-code");

const openNextMapButton = document.getElementById("open-next-map-button");

const openNextDetailsButton = document.getElementById(
  "open-next-details-button",
);

const summaryTotal = document.getElementById("summary-total");

const summaryMonth = document.getElementById("summary-month");

const summaryPending = document.getElementById("summary-pending");

const previousMonthButton = document.getElementById("previous-month-button");

const nextMonthButton = document.getElementById("next-month-button");

const todayButton = document.getElementById("today-button");

const currentMonthLabel = document.getElementById("current-month-label");

const quickFilterButtons = document.querySelectorAll("[data-quick-filter]");

const scheduleSearch = document.getElementById("schedule-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const activeFiltersList = document.getElementById("active-filters-list");

const periodFilter = document.getElementById("period-filter");

const categoryFilter = document.getElementById("category-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const servicesCount = document.getElementById("services-count");

const calendarGrid = document.getElementById("calendar-grid");

const calendarDayTemplate = document.getElementById("calendar-day-template");

const daySelectionPlaceholder = document.getElementById(
  "day-selection-placeholder",
);

const selectedDayPanel = document.getElementById("selected-day-panel");

const selectedDayTitle = document.getElementById("selected-day-title");

const selectedDayCount = document.getElementById("selected-day-count");

const closeSelectedDayButton = document.getElementById(
  "close-selected-day-button",
);

const servicesList = document.getElementById("services-list");

const selectedDayEmpty = document.getElementById("selected-day-empty");

const emptyState = document.getElementById("empty-state");

const serviceCardTemplate = document.getElementById("service-card-template");

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let dataReferencia = obterInicioDoDia();

let dataSelecionada = null;

let filtroRapido = "todos";

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

  if (typeof valor.toDate === "function") {
    const data = valor.toDate();

    return Number.isNaN(data.getTime()) ? null : data;
  }

  if (valor instanceof Date) {
    const data = new Date(valor);

    return Number.isNaN(data.getTime()) ? null : data;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  const apenasData = texto.split("T")[0];

  const data = new Date(`${apenasData}T12:00:00`);

  return Number.isNaN(data.getTime()) ? null : data;
}

function resolverData(valor) {
  if (valor instanceof Date) {
    return new Date(valor);
  }

  return criarDataLocal(valor);
}

function formatarQuantidade(quantidade) {
  return quantidade === 1 ? "1 item" : `${quantidade} itens`;
}

function formatarDia(valor) {
  const data = resolverData(valor);

  if (!data) {
    return "--";
  }

  return String(data.getDate()).padStart(2, "0");
}

function formatarMesCurto(valor) {
  const data = resolverData(valor);

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
  const data = resolverData(valor);

  return data ? String(data.getFullYear()) : "----";
}

function formatarMesEAno(valor) {
  const data = resolverData(valor);

  if (!data) {
    return "Mês não identificado";
  }

  const texto = data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarDataCompleta(valor) {
  const data = resolverData(valor);

  if (!data) {
    return "Data não informada";
  }

  const texto = data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
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

function ordenarServicos(lista) {
  return [...lista].sort((servicoA, servicoB) => {
    const diferencaData =
      criarDataLocal(servicoA.data) - criarDataLocal(servicoB.data);

    if (diferencaData !== 0) {
      return diferencaData;
    }

    return String(servicoA.horario).localeCompare(String(servicoB.horario));
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
   INTEGRAÇÃO COM O FIRESTORE
========================================= */

function normalizarStatusParaAgenda(status) {
  const statusNormalizado = normalizarTexto(status);

  const statusMap = {
    "nova-solicitacao": "a-confirmar",

    "aguardando-confirmacao": "a-confirmar",

    "aguardando-agendamento": "a-confirmar",

    pendente: "a-confirmar",

    solicitada: "a-confirmar",

    agendada: "confirmado",

    agendado: "confirmado",

    confirmado: "confirmado",

    "em-deslocamento": "em-deslocamento",

    "em-atendimento": "em-atendimento",

    "em-andamento": "em-atendimento",

    iniciada: "em-atendimento",

    concluida: "concluido",

    concluido: "concluido",

    finalizada: "concluido",

    finalizado: "concluido",

    cancelada: "cancelado",

    cancelado: "cancelado",

    recusada: "cancelado",

    recusado: "cancelado",
  };

  return statusMap[statusNormalizado] || "";
}

function obterServicosDaOrdemSalva(ordem) {
  if (!Array.isArray(ordem.servicos)) {
    return [ordem.servicoPrincipal].filter(Boolean);
  }

  return ordem.servicos
    .map((servico) => {
      if (typeof servico === "string") {
        return servico;
      }

      return servico?.servico || servico?.nome || "";
    })
    .filter(Boolean);
}

function obterEnderecoDaOrdemSalva(ordem) {
  if (typeof ordem.endereco === "string") {
    return ordem.endereco;
  }

  const endereco = ordem.endereco || {};

  const resumo = String(endereco.resumo || "").trim();

  if (resumo) {
    return resumo;
  }

  const primeiraLinha = [
    endereco.logradouro || endereco.rua,

    endereco.numero,

    endereco.complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const cidadeEstado = [endereco.cidade, endereco.uf || endereco.estado]
    .filter(Boolean)
    .join("/");

  const segundaLinha = [endereco.bairro, cidadeEstado]
    .filter(Boolean)
    .join(" — ");

  return (
    [primeiraLinha, segundaLinha].filter(Boolean).join(" — ") ||
    "Endereço não informado"
  );
}

function converterDataParaISO(valor) {
  const data = criarDataLocal(valor);

  return data ? obterDataISO(data) : "";
}

function normalizarOrdemParaAgenda(documentSnapshot) {
  const ordem = documentSnapshot.data();

  const status = normalizarStatusParaAgenda(
    ordem.status || ordem.vistoria?.status,
  );

  if (!status) {
    return null;
  }

  const categorias =
    Array.isArray(ordem.categorias) && ordem.categorias.length > 0
      ? ordem.categorias.filter(Boolean)
      : [ordem.categoriaPrincipal].filter(Boolean);

  const data = converterDataParaISO(
    ordem.atendimento?.dataConfirmada ||
      ordem.dataAgendada ||
      ordem.proposta?.data ||
      ordem.atendimento?.dataPreferida ||
      ordem.dataPreferida ||
      "",
  );

  if (!data) {
    return null;
  }

  const periodo = String(
    ordem.atendimento?.periodoConfirmado ||
      ordem.periodoConfirmado ||
      ordem.proposta?.periodo ||
      ordem.periodo ||
      ordem.atendimento?.periodo ||
      "",
  ).trim();

  const horario = String(
    ordem.atendimento?.horarioConfirmado ||
      ordem.horarioConfirmado ||
      ordem.proposta?.horario ||
      ordem.horario ||
      ordem.atendimento?.horarioPreferido ||
      "",
  ).trim();

  return {
    id: documentSnapshot.id,

    codigo:
      String(ordem.codigo || ordem.numero || "").trim() || documentSnapshot.id,

    clienteId: String(ordem.cliente?.id || "").trim(),

    titulo: String(
      ordem.titulo ||
        ordem.servicoPrincipal ||
        (categorias.includes("vistoria")
          ? "Vistoria técnica"
          : "Serviço agendado"),
    ).trim(),

    categorias,

    servicos: obterServicosDaOrdemSalva(ordem),

    data,

    periodo,

    horario,

    endereco: obterEnderecoDaOrdemSalva(ordem),

    status,
  };
}

async function carregarServicosDoFirestore(sessao) {
  const uid = String(sessao?.uid || "").trim();

  if (!uid) {
    throw new Error("CLIENT_UID_NOT_FOUND");
  }

  const consulta = query(
    collection(db, "ordens"),

    where("clienteUid", "==", uid),
  );

  const snapshot = await getDocs(consulta);

  servicosAgendados = snapshot.docs
    .map(normalizarOrdemParaAgenda)
    .filter(Boolean);

  console.info(
    `[Serviços Agendados] ${servicosAgendados.length} serviço(s) do cliente carregado(s) do Firestore.`,
  );
}
/* =========================================
   INTERVALOS DE DATA
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

function obterPrimeiroDiaDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

function obterUltimoDiaDoMes(data) {
  const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);

  ultimoDia.setHours(23, 59, 59, 999);

  return ultimoDia;
}

function obterInicioDoCalendario(data) {
  return obterInicioDaSemana(obterPrimeiroDiaDoMes(data));
}

/* =========================================
   DADOS DO CLIENTE
========================================= */

function obterServicosDoCliente() {
  return ordenarServicos(servicosAgendados);
}

/* =========================================
   PESQUISA
========================================= */

function correspondeAPesquisa(servico) {
  const pesquisa = normalizarTexto(scheduleSearch.value);

  if (!pesquisa) {
    return true;
  }

  const categorias = obterNomeCategorias(servico.categorias).join(" ");

  const status = statusConfig[servico.status]?.nome || "";

  const conteudoPesquisavel = normalizarTexto(
    [
      servico.id,
      servico.codigo,
      servico.titulo,
      servico.servicos.join(" "),
      categorias,
      servico.endereco,
      status,
      formatarHorario(servico),
      formatarDataCompleta(servico.data),
    ].join(" "),
  );

  return conteudoPesquisavel.includes(pesquisa);
}

/* =========================================
   FILTRO RÁPIDO
========================================= */

function correspondeAoFiltroRapido(servico) {
  if (filtroRapido === "todos") {
    return true;
  }

  if (filtroRapido === "confirmado") {
    return ["confirmado", "em-deslocamento", "em-atendimento"].includes(
      servico.status,
    );
  }

  if (filtroRapido === "a-confirmar") {
    return servico.status === "a-confirmar";
  }

  if (filtroRapido === "encerrados") {
    return ["concluido", "cancelado"].includes(servico.status);
  }

  return true;
}

function alterarFiltroRapido(novoFiltro) {
  if (!FILTROS_RAPIDOS.includes(novoFiltro)) {
    return;
  }

  filtroRapido = novoFiltro;

  quickFilterButtons.forEach((button) => {
    const ativo = button.dataset.quickFilter === novoFiltro;

    button.classList.toggle("is-active", ativo);

    button.setAttribute("aria-pressed", String(ativo));
  });

  renderizarCalendario();
}

/* =========================================
   FILTROS AVANÇADOS
========================================= */

function pertenceAoPeriodo(servico) {
  const filtro = filtrosAplicados.periodo;

  if (!filtro) {
    return true;
  }

  const dataServico = criarDataLocal(servico.data);

  if (!dataServico) {
    return false;
  }

  const hoje = obterInicioDoDia();

  if (filtro === "hoje") {
    return datasSaoIguais(dataServico, hoje);
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

function correspondeAosFiltrosAvancados(servico) {
  const categoriaCorresponde =
    !filtrosAplicados.categoria ||
    servico.categorias.includes(filtrosAplicados.categoria);

  return categoriaCorresponde && pertenceAoPeriodo(servico);
}

function obterServicosFiltrados() {
  return ordenarServicos(
    obterServicosDoCliente()
      .filter(correspondeAPesquisa)
      .filter(correspondeAoFiltroRapido)
      .filter(correspondeAosFiltrosAvancados),
  );
}

function sincronizarFormularioComFiltros() {
  periodFilter.value = filtrosAplicados.periodo;

  categoryFilter.value = filtrosAplicados.categoria;
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

  if (filtrosAplicados.periodo) {
    const nome =
      periodoFiltroConfig[filtrosAplicados.periodo] || filtrosAplicados.periodo;

    activeFiltersList.appendChild(
      criarChipDeFiltro(nome, () => {
        filtrosAplicados.periodo = "";

        finalizarRemocaoDeFiltro();
      }),
    );
  }

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

  activeFiltersList.hidden = activeFiltersList.children.length === 0;
}

function finalizarRemocaoDeFiltro() {
  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarCalendario();
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
    periodo: periodFilter.value,
    categoria: categoryFilter.value,
  };

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarCalendario();

  fecharFiltros();

  mostrarFeedback(
    contarFiltrosAtivos() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function limparFiltros() {
  filtrosAplicados = {
    periodo: "",
    categoria: "",
  };

  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  renderizarCalendario();

  mostrarFeedback("Filtros removidos.");
}

/* =========================================
   PRÓXIMO ATENDIMENTO
========================================= */

function obterProximoAtendimento() {
  const hoje = obterInicioDoDia();

  return (
    obterServicosDoCliente().filter((servico) => {
      const dataServico = criarDataLocal(servico.data);

      return (
        dataServico &&
        dataServico >= hoje &&
        ["confirmado", "em-deslocamento", "em-atendimento"].includes(
          servico.status,
        )
      );
    })[0] || null
  );
}

function renderizarProximoAtendimento() {
  proximoAtendimento = obterProximoAtendimento();

  const possuiAtendimento = Boolean(proximoAtendimento);

  nextServiceTop.hidden = !possuiAtendimento;

  nextServiceContent.hidden = !possuiAtendimento;

  nextServiceActions.hidden = !possuiAtendimento;

  nextServiceEmpty.hidden = possuiAtendimento;

  if (!proximoAtendimento) {
    return;
  }

  const statusData =
    statusConfig[proximoAtendimento.status] || statusConfig.confirmado;

  nextServiceTitle.textContent = proximoAtendimento.titulo;

  nextServiceStatus.textContent = statusData.nome;

  nextServiceStatus.className = `next-service__status ${statusData.classe}`;

  nextServiceDay.textContent = formatarDia(proximoAtendimento.data);

  nextServiceMonth.textContent = formatarMesCurto(proximoAtendimento.data);

  nextServiceYear.textContent = formatarAno(proximoAtendimento.data);

  nextServiceTime.textContent = formatarHorario(proximoAtendimento);

  nextServiceAddress.textContent =
    proximoAtendimento.endereco || "Endereço não informado";

  nextServiceCode.textContent =
    proximoAtendimento.codigo || proximoAtendimento.id;
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const lista = obterServicosDoCliente();

  const hoje = obterInicioDoDia();

  const proximos = lista.filter((servico) => {
    const data = criarDataLocal(servico.data);

    return (
      data &&
      data >= hoje &&
      !["concluido", "cancelado"].includes(servico.status)
    );
  });

  const desteMes = lista.filter((servico) => {
    const data = criarDataLocal(servico.data);

    return (
      data &&
      data.getFullYear() === hoje.getFullYear() &&
      data.getMonth() === hoje.getMonth()
    );
  });

  const aguardando = lista.filter(
    (servico) => servico.status === "a-confirmar",
  );

  summaryTotal.textContent = String(proximos.length);

  summaryMonth.textContent = String(desteMes.length);

  summaryPending.textContent = String(aguardando.length);
}

/* =========================================
   CARD COMPACTO DO SERVIÇO
========================================= */

function alternarDetalhesDoCard(card) {
  const toggle = card.querySelector(".service-card__toggle");

  const details = card.querySelector(".service-card__details");

  const seraAberto = details.hidden;

  details.hidden = !seraAberto;

  toggle.setAttribute("aria-expanded", String(seraAberto));

  toggle.setAttribute(
    "aria-label",
    seraAberto ? "Ocultar detalhes do serviço" : "Mostrar detalhes do serviço",
  );

  card.classList.toggle("is-expanded", seraAberto);
}

function preencherCard(servico) {
  const fragmento = serviceCardTemplate.content.cloneNode(true);

  const card = fragmento.querySelector(".service-card");

  const timeStrong = card.querySelector(".service-card__time strong");

  const timePeriod = card.querySelector(".service-card__time span");

  const code = card.querySelector(".service-card__code");

  const status = card.querySelector(".service-card__status");

  const title = card.querySelector(".service-card__title");

  const toggle = card.querySelector(".service-card__toggle");

  const services = card.querySelector(".service-card__services");

  const address = card.querySelector(".service-card__address span");

  const dateInformation = card.querySelector(
    ".service-card__date-information span",
  );

  const mapButton = card.querySelector(".service-card__button--map");

  const detailsButton = card.querySelector(".service-card__button--details");

  const statusData = statusConfig[servico.status] || statusConfig.confirmado;

  card.dataset.serviceId = servico.id;

  timeStrong.textContent = servico.horario || "A definir";

  timePeriod.textContent = periodoConfig[servico.periodo] || "Período";

  code.textContent = servico.codigo || servico.id;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  title.textContent = servico.titulo;

  services.textContent =
    servico.servicos.join(" • ") || "Serviço não informado";
  address.textContent = servico.endereco || "Endereço não informado";

  dateInformation.textContent = formatarDataCompleta(servico.data);

  toggle.setAttribute(
    "aria-label",
    `Mostrar detalhes da ordem ${servico.codigo}`,
  );
  mapButton.setAttribute(
    "aria-label",
    `Abrir endereço da ordem ${servico.codigo}`,
  );
  detailsButton.setAttribute(
    "aria-label",
    `Abrir detalhes da ordem ${servico.codigo}`,
  );

  toggle.addEventListener("click", () => {
    alternarDetalhesDoCard(card);
  });

  mapButton.addEventListener("click", () => {
    abrirEnderecoNoMapa(servico.endereco);
  });

  detailsButton.addEventListener("click", () => {
    abrirDetalhes(servico.id);
  });

  return fragmento;
}

/* =========================================
   CALENDÁRIO MENSAL
========================================= */

function criarMarcadores(container, servicosDoDia) {
  container.innerHTML = "";

  const statusUnicos = [
    ...new Set(servicosDoDia.map((servico) => servico.status)),
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

function selecionarData(data) {
  const foraDoMes =
    data.getMonth() !== dataReferencia.getMonth() ||
    data.getFullYear() !== dataReferencia.getFullYear();

  dataSelecionada = obterInicioDoDia(data);

  if (foraDoMes) {
    dataReferencia = obterInicioDoDia(data);
  }

  renderizarCalendario();

  window.requestAnimationFrame(() => {
    selectedDayPanel.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  });
}

function fecharDiaSelecionado() {
  dataSelecionada = null;

  renderizarCalendario();
}

function renderizarPainelDoDia() {
  servicesList.innerHTML = "";

  if (!dataSelecionada) {
    selectedDayPanel.hidden = true;

    return;
  }

  selectedDayPanel.hidden = false;

  const dataISO = obterDataISO(dataSelecionada);

  const lista = obterServicosFiltrados().filter(
    (servico) => servico.data === dataISO,
  );

  selectedDayTitle.textContent = formatarDataCompleta(dataSelecionada);

  selectedDayCount.textContent = formatarQuantidade(lista.length);

  const listaVazia = lista.length === 0;

  servicesList.hidden = listaVazia;

  selectedDayEmpty.hidden = !listaVazia;

  lista.forEach((servico) => {
    servicesList.appendChild(preencherCard(servico));
  });
}

function renderizarCalendario() {
  calendarGrid.innerHTML = "";

  currentMonthLabel.textContent = formatarMesEAno(dataReferencia);

  const listaFiltrada = obterServicosFiltrados();

  const inicioDoMes = obterPrimeiroDiaDoMes(dataReferencia);

  const fimDoMes = obterUltimoDiaDoMes(dataReferencia);

  const servicosDoMes = listaFiltrada.filter((servico) => {
    const data = criarDataLocal(servico.data);

    return data >= inicioDoMes && data <= fimDoMes;
  });

  servicesCount.textContent = formatarQuantidade(servicosDoMes.length);

  const inicioCalendario = obterInicioDoCalendario(dataReferencia);

  const hoje = obterInicioDoDia();

  for (let indice = 0; indice < 42; indice += 1) {
    const data = new Date(inicioCalendario);

    data.setDate(inicioCalendario.getDate() + indice);

    const dataISO = obterDataISO(data);

    const servicosDoDia = listaFiltrada.filter(
      (servico) => servico.data === dataISO,
    );

    const fragmento = calendarDayTemplate.content.cloneNode(true);

    const dayButton = fragmento.querySelector(".calendar-day");

    const dayNumber = fragmento.querySelector(".calendar-day__number");

    const markers = fragmento.querySelector(".calendar-day__markers");

    const count = fragmento.querySelector(".calendar-day__count");

    dayNumber.textContent = String(data.getDate());

    count.textContent = String(servicosDoDia.length);

    dayButton.dataset.date = dataISO;

    dayButton.setAttribute(
      "aria-label",
      `${formatarDataCompleta(data)}. ` +
        `${formatarQuantidade(servicosDoDia.length)}.`,
    );

    const pertenceAoMes =
      data.getMonth() === dataReferencia.getMonth() &&
      data.getFullYear() === dataReferencia.getFullYear();

    dayButton.classList.toggle("is-outside-month", !pertenceAoMes);

    dayButton.classList.toggle("is-today", datasSaoIguais(data, hoje));

    dayButton.classList.toggle("has-services", servicosDoDia.length > 0);

    const estaSelecionado = datasSaoIguais(data, dataSelecionada);

    dayButton.classList.toggle("is-selected", estaSelecionado);

    dayButton.setAttribute("aria-pressed", String(estaSelecionado));

    criarMarcadores(markers, servicosDoDia);

    dayButton.addEventListener("click", () => {
      selecionarData(data);
    });

    calendarGrid.appendChild(fragmento);
  }

  const possuiServicosNoMes = servicosDoMes.length > 0;

  const possuiDataSelecionada = Boolean(dataSelecionada);

  daySelectionPlaceholder.hidden =
    !possuiServicosNoMes || possuiDataSelecionada;

  emptyState.hidden = possuiServicosNoMes || possuiDataSelecionada;

  renderizarPainelDoDia();
}

/* =========================================
   NAVEGAÇÃO ENTRE MESES
========================================= */

function moverMes(direcao) {
  dataReferencia = new Date(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth() + direcao,
    1,
  );

  dataSelecionada = null;

  renderizarCalendario();
}

function voltarParaHoje() {
  dataReferencia = obterInicioDoDia();

  dataSelecionada = null;

  renderizarCalendario();

  mostrarFeedback("Calendário posicionado no mês atual.");
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

previousMonthButton.addEventListener("click", () => {
  moverMes(-1);
});

nextMonthButton.addEventListener("click", () => {
  moverMes(1);
});

todayButton.addEventListener("click", voltarParaHoje);

quickFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    alterarFiltroRapido(button.dataset.quickFilter);
  });
});

openFilterButton.addEventListener("click", abrirFiltros);

closeFilterButton.addEventListener("click", fecharFiltros);

applyFiltersButton.addEventListener("click", aplicarFiltros);

clearFiltersButton.addEventListener("click", limparFiltros);

closeSelectedDayButton.addEventListener("click", fecharDiaSelecionado);

scheduleSearch.addEventListener("input", renderizarCalendario);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!filterPanel.hidden) {
    fecharFiltros();

    openFilterButton.focus();

    return;
  }

  if (dataSelecionada) {
    fecharDiaSelecionado();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

async function inicializarPaginaDeServicosAgendados() {
  try {
    const sessao = await window.salvateckSessionReady;

    if (!sessao || sessao.role !== "cliente") {
      throw new Error("CLIENT_SESSION_NOT_FOUND");
    }

    sessaoAtual = sessao;

    await carregarServicosDoFirestore(sessaoAtual);
  } catch (error) {
    console.error(
      "[Serviços Agendados] Não foi possível carregar os serviços:",
      error,
    );

    servicosAgendados = [];

    mostrarFeedback(
      error?.code === "permission-denied"
        ? "O Firebase bloqueou a leitura dos seus serviços."
        : "Não foi possível carregar seus serviços.",
    );
  }

  sincronizarFormularioComFiltros();

  atualizarContagemDeFiltros();

  renderizarFiltrosAtivos();

  alterarFiltroRapido(filtroRapido);

  renderizarProximoAtendimento();

  atualizarResumo();

  renderizarCalendario();
}

inicializarPaginaDeServicosAgendados();
