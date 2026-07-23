import "./auth-guard.js";

import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

/* =========================================
   CONFIGURAÇÕES
========================================= */

const statusConfig = {
  concluida: {
    nome: "Concluída",
    classe: "status--concluido",
    textoData: "Concluída em",
  },

  cancelada: {
    nome: "Cancelada",
    classe: "status--cancelado",
    textoData: "Cancelada em",
  },

  recusada: {
    nome: "Recusada",
    classe: "status--recusado",
    textoData: "Recusada em",
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

const statusFinais = ["concluida", "cancelada", "recusada"];

/* =========================================
   PARÂMETROS DA URL
========================================= */

const urlParams = new URLSearchParams(window.location.search);

const condominioFiltroId = String(urlParams.get("condominio") || "").trim();

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const body = document.body;

const headerBackButton = document.querySelector(
  ".history-header .header-button",
);

const headerEyebrow = document.querySelector(".history-header__eyebrow");

const headerTitle = document.querySelector(".history-header h1");

const introBadge = document.querySelector(".history-intro__badge");

const introTitle = document.querySelector(".history-intro h2");

const introDescription = document.querySelector(".history-intro__copy p");

const newRequestButton = document.querySelector(".new-request-button");

const newRequestButtonText = newRequestButton?.querySelector("span");

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
   CONTROLE
========================================= */

let currentSession = null;

let historicoAtendimentos = [];

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

function normalizarStatus(status) {
  const statusNormalizado = normalizarTexto(status);

  const mapa = {
    concluida: "concluida",
    concluido: "concluida",
    finalizada: "concluida",
    finalizado: "concluida",

    cancelada: "cancelada",
    cancelado: "cancelada",

    recusada: "recusada",
    recusado: "recusada",
  };

  return mapa[statusNormalizado] || statusNormalizado;
}

function converterParaData(valor) {
  if (!valor) {
    return null;
  }

  if (typeof valor === "object" && typeof valor.toDate === "function") {
    return valor.toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(`${texto}T12:00:00`)
    : new Date(texto);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function formatarQuantidade(quantidade) {
  return quantidade === 1 ? "1 item" : `${quantidade} itens`;
}

function formatarDia(valor) {
  const data = converterParaData(valor);

  if (!data) {
    return "--";
  }

  return String(data.getDate()).padStart(2, "0");
}

function formatarMesCurto(valor) {
  const data = converterParaData(valor);

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
  const data = converterParaData(valor);

  return data ? String(data.getFullYear()) : "----";
}

function formatarDataCompleta(valor) {
  const data = converterParaData(valor);

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

function obterTempoDaData(valor) {
  return converterParaData(valor)?.getTime() || 0;
}

function obterNomeCategorias(categorias = []) {
  return categorias
    .map((categoria) => {
      return categoriaConfig[categoria] || categoria;
    })
    .filter(Boolean);
}

function mostrarFeedback(mensagem) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = mensagem;
  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3000);
}

function abrirDetalhes(documentId) {
  const parametros = new URLSearchParams({
    id: documentId,
    origem: "historico",
  });

  if (condominioFiltroId) {
    parametros.set("condominio", condominioFiltroId);
  }

  window.location.href = `detalhes-solicitacao.html?${parametros.toString()}`;
}

/* =========================================
   NORMALIZAÇÃO DAS ORDENS
========================================= */

function obterServicosDaOrdem(ordem) {
  if (!Array.isArray(ordem.servicos)) {
    return [String(ordem.servicoPrincipal || "").trim()].filter(Boolean);
  }

  return ordem.servicos
    .map((servico) => {
      if (typeof servico === "string") {
        return servico.trim();
      }

      return String(servico?.servico || servico?.nome || "").trim();
    })
    .filter(Boolean);
}

function obterEnderecoDaOrdem(ordem) {
  const endereco = ordem.endereco;

  if (typeof endereco === "string") {
    return endereco.trim();
  }

  const resumo = String(endereco?.resumo || "").trim();

  if (resumo) {
    return resumo;
  }

  const primeiraLinha = [
    endereco?.logradouro || endereco?.rua,
    endereco?.numero,
    endereco?.complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const cidadeEstado = [endereco?.cidade, endereco?.uf || endereco?.estado]
    .filter(Boolean)
    .join("/");

  const segundaLinha = [endereco?.bairro, cidadeEstado]
    .filter(Boolean)
    .join(" — ");

  return (
    [primeiraLinha, segundaLinha].filter(Boolean).join(" | ") ||
    "Endereço não informado"
  );
}

function obterDataDeEncerramento(ordem, status) {
  if (status === "concluida") {
    return (
      ordem.concluidaEm ||
      ordem.statusAtualizadoEm ||
      ordem.atualizadoEm ||
      ordem.criadoEm ||
      null
    );
  }

  if (status === "cancelada") {
    return (
      ordem.canceladaEm ||
      ordem.statusAtualizadoEm ||
      ordem.atualizadoEm ||
      ordem.criadoEm ||
      null
    );
  }

  if (status === "recusada") {
    return (
      ordem.recusadaEm ||
      ordem.statusAtualizadoEm ||
      ordem.atualizadoEm ||
      ordem.criadoEm ||
      null
    );
  }

  return (
    ordem.statusAtualizadoEm || ordem.atualizadoEm || ordem.criadoEm || null
  );
}

function normalizarOrdem(documento) {
  const ordem = documento.data();

  const status = normalizarStatus(ordem.status);

  const categorias =
    Array.isArray(ordem.categorias) && ordem.categorias.length
      ? ordem.categorias
      : [ordem.categoriaPrincipal].filter(Boolean);

  const condominio = ordem.condominio || {};

  const cliente = ordem.cliente || {};

  const valor =
    ordem.valor ?? ordem.valorTotal ?? ordem.financeiro?.valor ?? null;

  return {
    documentId: documento.id,

    id: ordem.id || documento.id,

    codigo: ordem.codigo || ordem.id || documento.id,

    clienteId: ordem.clienteUid || cliente.id || "",

    clienteNome: cliente.nome || "Cliente não informado",

    condominio: {
      id: String(condominio.id || "").trim(),

      nome: String(condominio.nome || "").trim(),
    },

    titulo: ordem.titulo || ordem.servicoPrincipal || "Ordem de serviço",

    categorias,

    servicos: obterServicosDaOrdem(ordem),

    endereco: obterEnderecoDaOrdem(ordem),

    status,

    data:
      ordem.atendimento?.dataConfirmada ||
      ordem.atendimento?.dataPreferida ||
      ordem.criadoEm ||
      null,

    dataEncerramento: obterDataDeEncerramento(ordem, status),

    valor,

    valorLiberado: ordem.valorLiberado === true,

    ativo: ordem.ativo !== false,

    arquivado: ordem.arquivado === true,

    documentoFinal: ordem.documentoFinal || null,
  };
}

/* =========================================
   CARREGAMENTO DO FIRESTORE
========================================= */

async function carregarHistoricoDoFirestore() {
  if (!currentSession) {
    return;
  }

  const ordensReference = collection(db, "ordens");

  const consulta =
    currentSession.role === "cliente"
      ? query(ordensReference, where("clienteUid", "==", currentSession.uid))
      : ordensReference;

  const resultado = await getDocs(consulta);

  historicoAtendimentos = resultado.docs
    .map(normalizarOrdem)
    .filter((atendimento) => {
      return (
        atendimento.ativo &&
        !atendimento.arquivado &&
        statusFinais.includes(atendimento.status)
      );
    })
    .sort((a, b) => {
      return (
        obterTempoDaData(b.dataEncerramento) -
        obterTempoDaData(a.dataEncerramento)
      );
    });
}

/* =========================================
   PERFIL E CONTEXTO
========================================= */

function configurarTextosDoPerfil() {
  const isAdmin = currentSession.role === "admin";

  body.dataset.profile = currentSession.role;

  document.title = "Histórico | Salvateck";

  headerBackButton.href = "principal.html";

  headerTitle.textContent = "Histórico";

  newRequestButton.href = "nova-ordem.html";

  if (isAdmin) {
    headerEyebrow.textContent = "Área Administrativa";

    introBadge.textContent = "Gestão de atendimentos";

    introTitle.textContent = "Consulte os serviços encerrados";

    introDescription.textContent =
      "Acompanhe ordens concluídas, canceladas e recusadas de todos os clientes.";

    newRequestButtonText.textContent = "Nova ordem de serviço";

    historySearch.placeholder = "Pesquisar cliente, serviço ou ordem";
  } else {
    headerEyebrow.textContent = "Área do Cliente";

    introBadge.textContent = "Seus atendimentos";

    introTitle.textContent = "Consulte os serviços já encerrados";

    introDescription.textContent =
      "Veja atendimentos concluídos, solicitações canceladas e os detalhes de cada serviço realizado.";

    newRequestButtonText.textContent = "Nova solicitação";

    historySearch.placeholder = "Pesquisar serviço ou ordem";
  }
}

function obterHistoricoDoContexto() {
  if (!condominioFiltroId) {
    return [...historicoAtendimentos];
  }

  return historicoAtendimentos.filter((atendimento) => {
    return atendimento.condominio.id === condominioFiltroId;
  });
}

function configurarContextoDoCondominio() {
  if (!condominioFiltroId) {
    return;
  }

  const atendimentoDoCondominio = historicoAtendimentos.find((atendimento) => {
    return atendimento.condominio.id === condominioFiltroId;
  });

  const nomeCondominio =
    atendimentoDoCondominio?.condominio?.nome || "Condomínio selecionado";

  introBadge.textContent = "Histórico do condomínio";

  introTitle.textContent = nomeCondominio;

  introDescription.textContent =
    "Consulte as ordens de serviço encerradas vinculadas a este condomínio.";

  if (currentSession.role === "admin") {
    newRequestButton.href = `nova-ordem.html?condominio=${encodeURIComponent(
      condominioFiltroId,
    )}`;
  }
}

/* =========================================
   FILTRO DE ANOS
========================================= */

function preencherFiltroDeAnos() {
  yearFilter.innerHTML = `
    <option value="">
      Todos os anos
    </option>
  `;

  const anos = [
    ...new Set(
      obterHistoricoDoContexto()
        .map((atendimento) => {
          return converterParaData(atendimento.dataEncerramento)?.getFullYear();
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
   PESQUISA E FILTROS
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
      atendimento.documentId,
      atendimento.codigo,
      atendimento.clienteNome,
      atendimento.condominio.nome,
      atendimento.titulo,
      atendimento.servicos.join(" "),
      categorias,
      status,
      atendimento.endereco,
      formatarDataCompleta(atendimento.dataEncerramento),
    ].join(" "),
  );

  return conteudoPesquisavel.includes(pesquisa);
}

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

  const data = converterParaData(atendimento.dataEncerramento);

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

function obterHistoricoFiltrado() {
  return obterHistoricoDoContexto()
    .filter(correspondeAPesquisa)
    .filter(correspondeAosFiltros);
}

/* =========================================
   RESUMO
========================================= */

function atualizarResumo() {
  const historico = obterHistoricoDoContexto();

  const anoAtual = new Date().getFullYear();

  const concluidos = historico.filter((atendimento) => {
    return atendimento.status === "concluida";
  }).length;

  const cancelados = historico.filter((atendimento) => {
    return ["cancelada", "recusada"].includes(atendimento.status);
  }).length;

  const registrosDoAno = historico.filter((atendimento) => {
    const data = converterParaData(atendimento.dataEncerramento);

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

  const statusData = statusConfig[atendimento.status] || statusConfig.concluida;

  day.textContent = formatarDia(atendimento.dataEncerramento);

  month.textContent = formatarMesCurto(atendimento.dataEncerramento);

  year.textContent = formatarAno(atendimento.dataEncerramento);

  code.textContent = atendimento.codigo;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  title.textContent = atendimento.titulo;

  const informacoesComplementares = [];

  if (currentSession.role === "admin") {
    informacoesComplementares.push(`Cliente: ${atendimento.clienteNome}`);
  }

  if (atendimento.condominio.nome) {
    informacoesComplementares.push(
      `Condomínio: ${atendimento.condominio.nome}`,
    );
  }

  if (atendimento.servicos.length) {
    informacoesComplementares.push(atendimento.servicos.join(" • "));
  }

  services.textContent =
    informacoesComplementares.join(" • ") || "Serviço não informado";

  address.textContent = atendimento.endereco;

  finished.textContent = `${statusData.textoData} ${formatarDataCompleta(
    atendimento.dataEncerramento,
  )}`;

  const deveMostrarValor =
    atendimento.status === "concluida" &&
    atendimento.valorLiberado &&
    atendimento.valor !== null;

  financial.hidden = !deveMostrarValor;

  if (deveMostrarValor) {
    value.textContent = formatarValor(atendimento.valor);
  }

  detailsButton.setAttribute(
    "aria-label",
    `Abrir detalhes da ordem ${atendimento.codigo}`,
  );

  detailsButton.addEventListener("click", () => {
    abrirDetalhes(atendimento.documentId);
  });

  if (requestButton) {
    requestButton.hidden = true;
  }

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

async function inicializarPagina() {
  try {
    currentSession = await window.salvateckSessionReady;

    if (!["admin", "cliente"].includes(currentSession.role)) {
      throw new Error("INVALID_HISTORY_ROLE");
    }

    configurarTextosDoPerfil();

    await carregarHistoricoDoFirestore();

    configurarContextoDoCondominio();

    preencherFiltroDeAnos();

    sincronizarEstiloDosFiltros();

    atualizarContagemDeFiltros();

    atualizarResumo();

    renderizarHistorico();
  } catch (error) {
    console.error("[Histórico] Não foi possível carregar os registros:", error);

    historicoAtendimentos = [];

    atualizarResumo();

    renderizarHistorico();

    if (error.code === "permission-denied") {
      mostrarFeedback("O Firebase bloqueou a consulta do histórico.");

      return;
    }

    mostrarFeedback("Não foi possível carregar o histórico.");
  }
}

inicializarPagina();
