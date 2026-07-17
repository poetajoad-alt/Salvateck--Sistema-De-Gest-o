/* =========================================
   CONFIGURAÇÕES
========================================= */

const STORAGE_KEY = "salvateckDetalhesSolicitacoesTeste";

const statusConfig = {
  "nova-solicitacao": {
    nome: "Nova solicitação",
    classe: "status--nova-solicitacao",
  },

  "em-analise": {
    nome: "Em análise",
    classe: "status--em-analise",
  },

  "aguardando-confirmacao": {
    nome: "Aguardando confirmação",
    classe: "status--aguardando-confirmacao",
  },

  agendada: {
    nome: "Agendada",
    classe: "status--agendada",
  },

  recusada: {
    nome: "Recusada",
    classe: "status--recusada",
  },

  cancelada: {
    nome: "Cancelada",
    classe: "status--cancelada",
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
  horario: "Horário específico",
};

const prioridadeConfig = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

const statusPropostaConfig = {
  aguardando: "Aguardando confirmação",
  aceita: "Data aceita",
  recusada: "Data recusada",
};

/* =========================================
   IMAGENS TEMPORÁRIAS
========================================= */

function criarImagemMock(titulo, subtitulo) {
  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="800"
      height="800"
      viewBox="0 0 800 800"
    >
      <rect
        width="800"
        height="800"
        fill="#E7EBEE"
      />

      <rect
        x="75"
        y="75"
        width="650"
        height="650"
        rx="55"
        fill="#F9F9F9"
        stroke="#DD9A17"
        stroke-width="12"
      />

      <circle
        cx="400"
        cy="310"
        r="115"
        fill="#0D3861"
      />

      <path
        d="M350 310h100M400 260v100"
        stroke="#DD9A17"
        stroke-width="22"
        stroke-linecap="round"
      />

      <text
        x="400"
        y="505"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="44"
        font-weight="700"
        fill="#0D3861"
      >
        ${titulo}
      </text>

      <text
        x="400"
        y="565"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="28"
        fill="#2B2F33"
      >
        ${subtitulo}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/* =========================================
   CLIENTES TEMPORÁRIOS
========================================= */

const clientes = {
  "cliente-joao": {
    nome: "João da Silva",
    telefone: "(11) 99999-9999",
    email: "joao@email.com",
  },

  "cliente-maria": {
    nome: "Maria Oliveira",
    telefone: "(11) 98888-4545",
    email: "maria@email.com",
  },

  "cliente-carlos": {
    nome: "Carlos Henrique",
    telefone: "(11) 97777-3232",
    email: "carlos@email.com",
  },

  "cliente-ana": {
    nome: "Ana Paula Santos",
    telefone: "(11) 96666-1212",
    email: "ana@email.com",
  },

  "cliente-roberto": {
    nome: "Roberto Mendes",
    telefone: "(11) 95555-3434",
    email: "roberto@email.com",
  },

  "cliente-patricia": {
    nome: "Patrícia Souza",
    telefone: "(11) 94444-5656",
    email: "patricia@email.com",
  },
};

/* =========================================
   SOLICITAÇÕES TEMPORÁRIAS
========================================= */

const solicitacoes = [
  {
    id: "OS-0001",
    clienteId: "cliente-joao",

    titulo: "Vazamento na torneira da cozinha",

    descricao:
      "O cliente informou um vazamento contínuo na torneira da cozinha e solicitou avaliação técnica.",

    categorias: ["hidraulica"],

    servicos: ["Torneira vazando", "Ajustar torneira"],

    status: "nova-solicitacao",
    prioridade: "alta",

    criadoEm: "2026-07-16T09:30:00",
    atualizadoEm: "2026-07-16T09:30:00",

    endereco: {
      logradouro: "Rua Exemplo",
      numero: "150",
      complemento: "Casa 2",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "Próximo ao mercado da esquina.",
    },

    atendimento: {
      dataPreferida: "2026-07-18",
      periodo: "manha",
      horarioPreferido: "",
      dataConfirmada: "",
      periodoConfirmado: "",
      horarioConfirmado: "",
    },

    proposta: null,

    fotos: [
      criarImagemMock("Foto 1", "Torneira da cozinha"),

      criarImagemMock("Foto 2", "Região do vazamento"),
    ],

    observacoes: {
      cliente: "O vazamento aumenta quando o registro é aberto.",

      resposta: "",

      interna: "Levar vedação, fita veda rosca e ferramentas para torneira.",
    },
  },

  {
    id: "OS-0002",
    clienteId: "cliente-joao",

    titulo: "Instalação de luminária",

    descricao: "Instalação de uma nova luminária no teto da sala.",

    categorias: ["eletrica", "instalacoes"],

    servicos: ["Instalar luminária"],

    status: "em-analise",
    prioridade: "normal",

    criadoEm: "2026-07-14T14:10:00",
    atualizadoEm: "2026-07-15T08:40:00",

    endereco: {
      logradouro: "Rua Exemplo",
      numero: "150",
      complemento: "Casa 2",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "",
    },

    atendimento: {
      dataPreferida: "2026-07-19",
      periodo: "tarde",
      horarioPreferido: "",
      dataConfirmada: "",
      periodoConfirmado: "",
      horarioConfirmado: "",
    },

    proposta: null,
    fotos: [],

    observacoes: {
      cliente: "A luminária já foi comprada e está no local.",

      resposta:
        "Recebemos a solicitação e estamos verificando a disponibilidade.",

      interna: "Confirmar tipo de teto antes da visita.",
    },
  },

  {
    id: "OS-0003",
    clienteId: "cliente-joao",

    titulo: "Pintura de parede do quarto",

    descricao: "Preparação e pintura de uma parede com pequenas manchas.",

    categorias: ["pintura"],

    servicos: ["Pintura de parede", "Preparação da superfície"],

    status: "aguardando-confirmacao",
    prioridade: "normal",

    criadoEm: "2026-07-12T11:20:00",
    atualizadoEm: "2026-07-15T16:30:00",

    endereco: {
      logradouro: "Rua Exemplo",
      numero: "150",
      complemento: "Casa 2",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "",
    },

    atendimento: {
      dataPreferida: "2026-07-22",
      periodo: "manha",
      horarioPreferido: "",
      dataConfirmada: "",
      periodoConfirmado: "",
      horarioConfirmado: "",
    },

    proposta: {
      data: "2026-07-23",
      periodo: "tarde",
      horario: "14:00",

      mensagem:
        "Olá! Não temos disponibilidade na data solicitada. Podemos realizar o atendimento nesta nova data?",

      status: "aguardando",
    },

    fotos: [criarImagemMock("Foto 1", "Parede do quarto")],

    observacoes: {
      cliente: "A parede apresenta manchas próximas à janela.",

      resposta: "Sugerimos uma nova data para a realização do serviço.",

      interna: "Verificar possível umidade antes da pintura.",
    },
  },

  {
    id: "OS-0004",
    clienteId: "cliente-maria",

    titulo: "Troca de tomada danificada",

    descricao: "Tomada apresentou aquecimento e precisa ser substituída.",

    categorias: ["eletrica"],

    servicos: ["Trocar tomada"],

    status: "agendada",
    prioridade: "urgente",

    criadoEm: "2026-07-15T10:05:00",
    atualizadoEm: "2026-07-16T08:10:00",

    endereco: {
      logradouro: "Avenida das Flores",
      numero: "380",
      complemento: "Apartamento 42",
      bairro: "Vila Nova",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "Portaria do bloco B.",
    },

    atendimento: {
      dataPreferida: "2026-07-17",
      periodo: "tarde",
      horarioPreferido: "",

      dataConfirmada: "2026-07-17",
      periodoConfirmado: "tarde",
      horarioConfirmado: "15:00",
    },

    proposta: null,
    fotos: [],

    observacoes: {
      cliente: "A tomada foi desligada no quadro por segurança.",

      resposta: "Atendimento confirmado para o período da tarde.",

      interna: "Levar tomada padrão 20 A e verificar a fiação.",
    },
  },

  {
    id: "OS-0005",
    clienteId: "cliente-carlos",

    titulo: "Reparo em parede com infiltração",

    descricao:
      "Reparo em parede interna com sinais de umidade e pintura danificada.",

    categorias: ["alvenaria", "pintura"],

    servicos: [
      "Correção de infiltração",
      "Reparo em parede",
      "Retoque de pintura",
    ],

    status: "nova-solicitacao",
    prioridade: "alta",

    criadoEm: "2026-07-16T12:15:00",
    atualizadoEm: "2026-07-16T12:15:00",

    endereco: {
      logradouro: "Rua das Palmeiras",
      numero: "45",
      complemento: "",
      bairro: "Jardim Sul",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "Casa com portão cinza.",
    },

    atendimento: {
      dataPreferida: "2026-07-20",
      periodo: "manha",
      horarioPreferido: "",
      dataConfirmada: "",
      periodoConfirmado: "",
      horarioConfirmado: "",
    },

    proposta: null,

    fotos: [
      criarImagemMock("Foto 1", "Área com infiltração"),

      criarImagemMock("Foto 2", "Pintura danificada"),

      criarImagemMock("Foto 3", "Parte inferior da parede"),
    ],

    observacoes: {
      cliente: "A parede fica mais úmida em dias de chuva.",

      resposta: "",

      interna: "Avaliar origem da infiltração antes de fechar orçamento.",
    },
  },

  {
    id: "OS-0006",
    clienteId: "cliente-ana",

    titulo: "Instalação de suporte para televisão",

    descricao: "Instalação de suporte articulado em parede de alvenaria.",

    categorias: ["instalacoes"],

    servicos: ["Instalar suporte de TV"],

    status: "cancelada",
    prioridade: "baixa",

    criadoEm: "2026-07-10T09:00:00",
    atualizadoEm: "2026-07-11T13:10:00",

    endereco: {
      logradouro: "Rua dos Ipês",
      numero: "92",
      complemento: "",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "",
    },

    atendimento: {
      dataPreferida: "2026-07-13",
      periodo: "tarde",
      horarioPreferido: "",
      dataConfirmada: "",
      periodoConfirmado: "",
      horarioConfirmado: "",
    },

    proposta: null,
    fotos: [],

    observacoes: {
      cliente: "Solicitação cancelada pelo cliente.",

      resposta: "O cancelamento foi registrado.",

      interna: "",
    },
  },

  {
    id: "OS-0007",
    clienteId: "cliente-roberto",

    titulo: "Manutenção em porta e fechadura",

    descricao:
      "A porta está raspando no piso e a fechadura apresenta dificuldade para fechar.",

    categorias: ["manutencao-geral"],

    servicos: ["Ajustar porta", "Trocar fechadura"],

    status: "em-analise",
    prioridade: "normal",

    criadoEm: "2026-07-13T16:45:00",
    atualizadoEm: "2026-07-14T10:20:00",

    endereco: {
      logradouro: "Avenida Central",
      numero: "1020",
      complemento: "Sala 6",
      bairro: "Centro",
      cidade: "Osasco",
      uf: "SP",
      referencia: "",
    },

    atendimento: {
      dataPreferida: "2026-07-21",
      periodo: "manha",
      horarioPreferido: "",
      dataConfirmada: "",
      periodoConfirmado: "",
      horarioConfirmado: "",
    },

    proposta: null,
    fotos: [],

    observacoes: {
      cliente: "A porta ainda fecha, mas precisa ser levantada.",

      resposta: "A solicitação está sendo analisada.",

      interna: "Verificar modelo da fechadura.",
    },
  },

  {
    id: "OS-0008",
    clienteId: "cliente-patricia",

    titulo: "Desentupimento de vaso sanitário",

    descricao:
      "Solicitação de atendimento para desentupimento de vaso sanitário.",

    categorias: ["hidraulica"],

    servicos: ["Vaso sanitário entupido", "Desentupimento"],

    status: "recusada",
    prioridade: "urgente",

    criadoEm: "2026-07-11T19:10:00",
    atualizadoEm: "2026-07-11T20:00:00",

    endereco: {
      logradouro: "Rua São Bento",
      numero: "318",
      complemento: "",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP",
      referencia: "",
    },

    atendimento: {
      dataPreferida: "2026-07-12",
      periodo: "noite",
      horarioPreferido: "",
      dataConfirmada: "",
      periodoConfirmado: "",
      horarioConfirmado: "",
    },

    proposta: null,
    fotos: [],

    observacoes: {
      cliente: "O vaso está completamente sem escoamento.",

      resposta:
        "No momento não temos equipe disponível para este atendimento emergencial.",

      interna: "Solicitação recebida fora do horário de atendimento.",
    },
  },
];

/* =========================================
   ELEMENTOS
========================================= */

const body = document.body;

const backButton = document.getElementById("back-button");

const requestCode = document.getElementById("request-code");

const requestStatus = document.getElementById("request-status");

const requestTitle = document.getElementById("request-title");

const requestDescription = document.getElementById("request-description");

const requestCreatedAt = document.getElementById("request-created-at");

const requestLastUpdate = document.getElementById("request-last-update");

const profileButtons = document.querySelectorAll("[data-profile-button]");

const adminOnlyElements = document.querySelectorAll(".admin-only");

const clientOnlyElements = document.querySelectorAll(".client-only");

const adminVisibleElements = document.querySelectorAll(".admin-visible");

const timelineItems = document.querySelectorAll(".timeline-item");

const clientAvatar = document.getElementById("client-avatar");

const clientName = document.getElementById("client-name");

const clientPhone = document.getElementById("client-phone");

const clientEmail = document.getElementById("client-email");

const openClientButton = document.getElementById("open-client-button");

const categoryTags = document.getElementById("category-tags");

const servicesList = document.getElementById("services-list");

const addressMain = document.getElementById("address-main");

const addressComplement = document.getElementById("address-complement");

const addressCity = document.getElementById("address-city");

const addressReference = document.getElementById("address-reference");

const openMapButton = document.getElementById("open-map-button");

const requestedDate = document.getElementById("requested-date");

const requestedPeriod = document.getElementById("requested-period");

const requestedTime = document.getElementById("requested-time");

const proposedSchedule = document.getElementById("proposed-schedule");

const proposalStatus = document.getElementById("proposal-status");

const proposedDate = document.getElementById("proposed-date");

const proposedPeriod = document.getElementById("proposed-period");

const proposedTime = document.getElementById("proposed-time");

const proposalMessage = document.getElementById("proposal-message");

const requestPhotos = document.getElementById("request-photos");

const photosEmpty = document.getElementById("photos-empty");

const clientObservation = document.getElementById("client-observation");

const responseObservationBox = document.getElementById(
  "response-observation-box",
);

const responseObservation = document.getElementById("response-observation");

const internalObservationBox = document.getElementById(
  "internal-observation-box",
);

const internalObservation = document.getElementById("internal-observation");

const priorityInputs = document.querySelectorAll('input[name="prioridade"]');

const priorityCard = document.getElementById("priority-card");

const adminActionsCard = document.getElementById("admin-actions-card");

const acceptRequestButton = document.getElementById("accept-request-button");

const proposeDateButton = document.getElementById("propose-date-button");

const rejectRequestButton = document.getElementById("reject-request-button");

const acceptForm = document.getElementById("accept-form");

const proposalForm = document.getElementById("proposal-form");

const rejectForm = document.getElementById("reject-form");

const actionForms = [acceptForm, proposalForm, rejectForm];

const acceptDate = document.getElementById("accept-date");

const acceptPeriod = document.getElementById("accept-period");

const acceptTime = document.getElementById("accept-time");

const acceptMessage = document.getElementById("accept-message");

const proposalDate = document.getElementById("proposal-date");

const proposalPeriod = document.getElementById("proposal-period");

const proposalTimeInput = document.getElementById("proposal-time-input");

const proposalMessageInput = document.getElementById("proposal-message-input");

const rejectReason = document.getElementById("reject-reason");

const rejectMessage = document.getElementById("reject-message");

const clientProposalCard = document.getElementById("client-proposal-card");

const acceptProposalButton = document.getElementById("accept-proposal-button");

const declineProposalButton = document.getElementById(
  "decline-proposal-button",
);

const clientActionsCard = document.getElementById("client-actions-card");

const cancelRequestButton = document.getElementById("cancel-request-button");

const confirmationModal = document.getElementById("confirmation-modal");

const confirmationTitle = document.getElementById("confirmation-title");

const confirmationDescription = document.getElementById(
  "confirmation-description",
);

const confirmModalButton = document.getElementById("confirm-modal-button");

const closeModalButtons = document.querySelectorAll("[data-close-modal]");

const closeActionButtons = document.querySelectorAll("[data-close-action]");

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   CONTROLE
========================================= */

const urlParams = new URLSearchParams(window.location.search);

const requestId = urlParams.get("id") || "OS-0001";

let perfilAtual = urlParams.get("perfil") || body.dataset.profile || "cliente";

let solicitacaoAtual =
  solicitacoes.find((solicitacao) => solicitacao.id === requestId) ||
  solicitacoes[0];

let modalCallback = null;
let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function formatarData(valor) {
  if (!valor) {
    return "Não informada";
  }

  const data = new Date(`${valor}T12:00:00`);

  return data.toLocaleDateString("pt-BR");
}

function formatarDataHora(valor) {
  if (!valor) {
    return "Não informada";
  }

  const data = new Date(valor);

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obterDataLocal() {
  const data = new Date();

  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterIniciais(nome) {
  const palavras = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (palavras.length === 0) {
    return "CL";
  }

  if (palavras.length === 1) {
    return palavras[0].slice(0, 2).toUpperCase();
  }

  return `${palavras[0][0]}${palavras[palavras.length - 1][0]}`.toUpperCase();
}

function obterClienteAtual() {
  return (
    clientes[solicitacaoAtual.clienteId] || {
      nome: "Cliente não identificado",
      telefone: "",
      email: "",
    }
  );
}

function montarEnderecoCompleto() {
  const endereco = solicitacaoAtual.endereco;

  return [
    `${endereco.logradouro}, ${endereco.numero}`,
    endereco.complemento,
    endereco.bairro,
    `${endereco.cidade}/${endereco.uf}`,
  ]
    .filter(Boolean)
    .join(", ");
}

function mostrarFeedback(mensagem) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = mensagem;
  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3000);
}

function registrarAtualizacao() {
  solicitacaoAtual.atualizadoEm = new Date().toISOString();
}

/* =========================================
   ARMAZENAMENTO LOCAL
========================================= */

function carregarAlteracoesLocais() {
  try {
    const dadosSalvos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    const alteracao = dadosSalvos[solicitacaoAtual.id];

    if (!alteracao) {
      return;
    }

    solicitacaoAtual.status = alteracao.status || solicitacaoAtual.status;

    solicitacaoAtual.prioridade =
      alteracao.prioridade || solicitacaoAtual.prioridade;

    solicitacaoAtual.atualizadoEm =
      alteracao.atualizadoEm || solicitacaoAtual.atualizadoEm;

    if (alteracao.atendimento) {
      solicitacaoAtual.atendimento = {
        ...solicitacaoAtual.atendimento,
        ...alteracao.atendimento,
      };
    }

    if (Object.prototype.hasOwnProperty.call(alteracao, "proposta")) {
      solicitacaoAtual.proposta = alteracao.proposta;
    }

    if (alteracao.observacoes) {
      solicitacaoAtual.observacoes = {
        ...solicitacaoAtual.observacoes,
        ...alteracao.observacoes,
      };
    }
  } catch (error) {
    console.warn("Não foi possível carregar os dados locais.", error);
  }
}

function salvarAlteracoesLocais() {
  try {
    const dadosSalvos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    dadosSalvos[solicitacaoAtual.id] = {
      status: solicitacaoAtual.status,
      prioridade: solicitacaoAtual.prioridade,

      atualizadoEm: solicitacaoAtual.atualizadoEm,

      atendimento: solicitacaoAtual.atendimento,

      proposta: solicitacaoAtual.proposta,

      observacoes: solicitacaoAtual.observacoes,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosSalvos));
  } catch (error) {
    console.warn("Não foi possível salvar os dados localmente.", error);
  }
}

/* =========================================
   HERO E STATUS
========================================= */

function renderizarHero() {
  const status =
    statusConfig[solicitacaoAtual.status] || statusConfig["nova-solicitacao"];

  document.title = `${solicitacaoAtual.id} | Salvateck`;

  requestCode.textContent = solicitacaoAtual.id;

  requestStatus.className = "details-hero__status";

  requestStatus.classList.add(status.classe);

  requestStatus.textContent = status.nome;

  requestTitle.textContent = solicitacaoAtual.titulo;

  requestDescription.textContent = solicitacaoAtual.descricao;

  requestCreatedAt.textContent = `Criada em ${formatarDataHora(
    solicitacaoAtual.criadoEm,
  )}`;

  requestLastUpdate.textContent = `Atualizada em ${formatarDataHora(
    solicitacaoAtual.atualizadoEm,
  )}`;
}

/* =========================================
   LINHA DO TEMPO
========================================= */

function renderizarTimeline() {
  timelineItems.forEach((item) => {
    item.classList.remove("is-completed", "is-active");
  });

  const itens = Array.from(timelineItems);

  if (solicitacaoAtual.status === "nova-solicitacao") {
    itens[0]?.classList.add("is-completed");

    itens[1]?.classList.add("is-active");

    return;
  }

  if (solicitacaoAtual.status === "em-analise") {
    itens[0]?.classList.add("is-completed");

    itens[1]?.classList.add("is-active");

    return;
  }

  if (solicitacaoAtual.status === "aguardando-confirmacao") {
    itens[0]?.classList.add("is-completed");

    itens[1]?.classList.add("is-completed");

    itens[2]?.classList.add("is-active");

    return;
  }

  if (solicitacaoAtual.status === "agendada") {
    itens.forEach((item) => {
      item.classList.add("is-completed");
    });

    return;
  }

  itens[0]?.classList.add("is-completed");
}

/* =========================================
   CLIENTE
========================================= */

function renderizarCliente() {
  const cliente = obterClienteAtual();

  clientAvatar.textContent = obterIniciais(cliente.nome);

  clientName.textContent = cliente.nome;

  clientPhone.textContent = cliente.telefone || "Telefone não informado";

  clientPhone.href = cliente.telefone
    ? `tel:${cliente.telefone.replace(/\D/g, "")}`
    : "#";

  clientEmail.textContent = cliente.email || "E-mail não informado";

  clientEmail.href = cliente.email ? `mailto:${cliente.email}` : "#";
}

/* =========================================
   CATEGORIAS E SERVIÇOS
========================================= */

function renderizarServicos() {
  categoryTags.innerHTML = "";
  servicesList.innerHTML = "";

  solicitacaoAtual.categorias.forEach((categoria) => {
    const tag = document.createElement("span");

    tag.className = "category-tag";

    tag.textContent = categoriaConfig[categoria] || categoria;

    categoryTags.appendChild(tag);
  });

  solicitacaoAtual.servicos.forEach((servico) => {
    const item = document.createElement("article");

    item.className = "service-item";

    item.innerHTML = `
        <span class="service-item__check">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12l4 4L19 6"></path>
          </svg>
        </span>

        <span>${servico}</span>
      `;

    servicesList.appendChild(item);
  });
}

/* =========================================
   ENDEREÇO
========================================= */

function renderizarEndereco() {
  const endereco = solicitacaoAtual.endereco;

  addressMain.textContent = `${endereco.logradouro}, ${endereco.numero}`;

  addressComplement.textContent = endereco.complemento || "Sem complemento";

  addressCity.textContent = `${endereco.bairro} — ${endereco.cidade}/${endereco.uf}`;

  addressReference.textContent =
    endereco.referencia || "Referência não informada";
}

/* =========================================
   DATA E PROPOSTA
========================================= */

function renderizarAgenda() {
  const atendimento = solicitacaoAtual.atendimento;

  requestedDate.textContent = formatarData(atendimento.dataPreferida);

  requestedPeriod.textContent =
    periodoConfig[atendimento.periodo] || "Não informado";

  requestedTime.textContent = atendimento.horarioPreferido || "Não informado";

  const proposta = solicitacaoAtual.proposta;

  proposedSchedule.hidden = !proposta;

  if (!proposta) {
    return;
  }

  proposalStatus.textContent =
    statusPropostaConfig[proposta.status] || "Aguardando confirmação";

  proposedDate.textContent = formatarData(proposta.data);

  proposedPeriod.textContent =
    periodoConfig[proposta.periodo] || "Período não informado";

  proposedTime.textContent = proposta.horario || "Horário não informado";

  proposalMessage.textContent =
    proposta.mensagem || "A equipe sugeriu uma nova data para o atendimento.";
}

/* =========================================
   FOTOS
========================================= */

function abrirFoto(foto) {
  const link = document.createElement("a");

  link.href = foto;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  document.body.appendChild(link);

  link.click();
  link.remove();
}

function renderizarFotos() {
  requestPhotos.innerHTML = "";

  const fotos = solicitacaoAtual.fotos || [];

  const semFotos = fotos.length === 0;

  requestPhotos.hidden = semFotos;
  photosEmpty.hidden = !semFotos;

  fotos.forEach((foto, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "request-photo";

    button.setAttribute("aria-label", `Ampliar foto ${index + 1}`);

    const image = document.createElement("img");

    image.src = foto;
    image.alt = `Foto ${index + 1} da solicitação`;

    button.appendChild(image);

    button.addEventListener("click", () => abrirFoto(foto));

    requestPhotos.appendChild(button);
  });
}

/* =========================================
   OBSERVAÇÕES
========================================= */

function renderizarObservacoes() {
  const observacoes = solicitacaoAtual.observacoes;

  clientObservation.textContent =
    observacoes.cliente || "Nenhuma observação informada.";

  const possuiResposta = Boolean(observacoes.resposta);

  responseObservationBox.hidden = !possuiResposta;

  responseObservation.textContent =
    observacoes.resposta || "Nenhuma resposta adicionada.";

  internalObservation.textContent =
    observacoes.interna || "Nenhuma observação interna registrada.";
}

/* =========================================
   PRIORIDADE
========================================= */

function sincronizarPrioridade() {
  priorityInputs.forEach((input) => {
    const selecionado = input.value === solicitacaoAtual.prioridade;

    input.checked = selecionado;

    input
      .closest(".priority-option")
      ?.classList.toggle("is-selected", selecionado);
  });
}

function alterarPrioridade(valor) {
  if (!prioridadeConfig[valor]) {
    return;
  }

  solicitacaoAtual.prioridade = valor;

  registrarAtualizacao();
  salvarAlteracoesLocais();
  sincronizarPrioridade();
  renderizarHero();

  mostrarFeedback(`Prioridade alterada para ${prioridadeConfig[valor]}.`);
}

/* =========================================
   PERFIL
========================================= */

function renderizarPerfil() {
  const isAdmin = perfilAtual === "admin";

  body.dataset.profile = perfilAtual;

  profileButtons.forEach((button) => {
    const ativo = button.dataset.profileButton === perfilAtual;

    button.classList.toggle("is-active", ativo);

    button.setAttribute("aria-pressed", String(ativo));
  });

  adminOnlyElements.forEach((elemento) => {
    elemento.hidden = !isAdmin;
  });

  adminVisibleElements.forEach((elemento) => {
    elemento.hidden = !isAdmin;
  });

  clientOnlyElements.forEach((elemento) => {
    elemento.hidden = isAdmin;
  });

  const statusFinalizado = ["agendada", "recusada", "cancelada"].includes(
    solicitacaoAtual.status,
  );

  priorityCard.hidden = !isAdmin;

  adminActionsCard.hidden = !isAdmin || statusFinalizado;

  const possuiPropostaPendente =
    solicitacaoAtual.status === "aguardando-confirmacao" &&
    solicitacaoAtual.proposta?.status === "aguardando";

  clientProposalCard.hidden = isAdmin || !possuiPropostaPendente;

  clientActionsCard.hidden =
    isAdmin || ["recusada", "cancelada"].includes(solicitacaoAtual.status);

  internalObservationBox.hidden = !isAdmin;

  const parametros = new URLSearchParams({
    perfil: perfilAtual,
  });

  backButton.href = `solicitacoes.html?${parametros.toString()}`;
}

function alterarPerfil(perfil) {
  if (perfil !== "cliente" && perfil !== "admin") {
    return;
  }

  perfilAtual = perfil;

  try {
    localStorage.setItem("salvateckPerfilTeste", perfil);
  } catch (error) {
    console.warn("Não foi possível salvar o perfil de teste.", error);
  }

  fecharFormulariosAcao();
  renderizarPerfil();
}

/* =========================================
   FORMULÁRIOS DE AÇÃO
========================================= */

function fecharFormulariosAcao() {
  actionForms.forEach((form) => {
    form.hidden = true;
  });
}

function abrirFormularioAcao(form) {
  fecharFormulariosAcao();

  form.hidden = false;

  form.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

function preencherFormularioAceite() {
  const atendimento = solicitacaoAtual.atendimento;

  acceptDate.value =
    solicitacaoAtual.proposta?.data || atendimento.dataPreferida || "";

  acceptPeriod.value =
    solicitacaoAtual.proposta?.periodo || atendimento.periodo || "";

  acceptTime.value =
    solicitacaoAtual.proposta?.horario || atendimento.horarioPreferido || "";
}

function preencherFormularioProposta() {
  const proposta = solicitacaoAtual.proposta;

  proposalDate.value = proposta?.data || "";

  proposalPeriod.value = proposta?.periodo || "";

  proposalTimeInput.value = proposta?.horario || "";

  if (proposta?.mensagem) {
    proposalMessageInput.value = proposta.mensagem;
  }
}

/* =========================================
   MODAL
========================================= */

function abrirModal({
  titulo,
  descricao,
  textoConfirmacao = "Confirmar",
  perigo = false,
  confirmar,
}) {
  modalCallback = confirmar;

  confirmationTitle.textContent = titulo;

  confirmationDescription.textContent = descricao;

  confirmModalButton.textContent = textoConfirmacao;

  if (perigo) {
    confirmModalButton.style.backgroundColor = "#963333";

    confirmModalButton.style.color = "#F9F9F9";

    confirmModalButton.style.borderColor = "#963333";
  } else {
    confirmModalButton.style.backgroundColor = "#0D3861";

    confirmModalButton.style.color = "#DD9A17";

    confirmModalButton.style.borderColor = "rgba(221, 154, 23, 0.42)";
  }

  confirmationModal.hidden = false;

  document.body.style.overflow = "hidden";

  confirmModalButton.focus();
}

function fecharModal() {
  confirmationModal.hidden = true;

  document.body.style.overflow = "";

  modalCallback = null;
}

/* =========================================
   FINALIZAÇÃO DAS ALTERAÇÕES
========================================= */

function concluirAlteracao(mensagem) {
  registrarAtualizacao();
  salvarAlteracoesLocais();

  fecharFormulariosAcao();

  renderizarTudo();

  mostrarFeedback(mensagem);
}

/* =========================================
   ACEITAR SOLICITAÇÃO
========================================= */

function enviarAceite(event) {
  event.preventDefault();

  if (!acceptForm.checkValidity()) {
    acceptForm.reportValidity();
    return;
  }

  abrirModal({
    titulo: "Confirmar agendamento",

    descricao: "A solicitação será aceita e o atendimento entrará na agenda.",

    textoConfirmacao: "Confirmar agendamento",

    confirmar: () => {
      solicitacaoAtual.status = "agendada";

      solicitacaoAtual.atendimento = {
        ...solicitacaoAtual.atendimento,

        dataConfirmada: acceptDate.value,

        periodoConfirmado: acceptPeriod.value,

        horarioConfirmado: acceptTime.value,
      };

      if (solicitacaoAtual.proposta) {
        solicitacaoAtual.proposta.status = "aceita";
      }

      solicitacaoAtual.observacoes.resposta =
        acceptMessage.value.trim() || "Sua solicitação foi aceita.";

      concluirAlteracao("Solicitação aceita e atendimento agendado.");
    },
  });
}

/* =========================================
   PROPOR NOVA DATA
========================================= */

function enviarProposta(event) {
  event.preventDefault();

  if (!proposalForm.checkValidity()) {
    proposalForm.reportValidity();
    return;
  }

  abrirModal({
    titulo: "Enviar nova proposta",

    descricao:
      "O cliente receberá a nova data e precisará confirmar a disponibilidade.",

    textoConfirmacao: "Enviar proposta",

    confirmar: () => {
      solicitacaoAtual.status = "aguardando-confirmacao";

      solicitacaoAtual.proposta = {
        data: proposalDate.value,

        periodo: proposalPeriod.value,

        horario: proposalTimeInput.value,

        mensagem: proposalMessageInput.value.trim(),

        status: "aguardando",
      };

      solicitacaoAtual.observacoes.resposta = proposalMessageInput.value.trim();

      concluirAlteracao("Nova data enviada para confirmação do cliente.");
    },
  });
}

/* =========================================
   RECUSAR SOLICITAÇÃO
========================================= */

function enviarRecusa(event) {
  event.preventDefault();

  if (!rejectForm.checkValidity()) {
    rejectForm.reportValidity();
    return;
  }

  const motivo =
    rejectReason.selectedOptions[0]?.textContent.trim() ||
    "Motivo não informado";

  abrirModal({
    titulo: "Recusar solicitação",

    descricao:
      "A solicitação será encerrada e o cliente receberá a mensagem informada.",

    textoConfirmacao: "Confirmar recusa",
    perigo: true,

    confirmar: () => {
      solicitacaoAtual.status = "recusada";

      solicitacaoAtual.observacoes.resposta = rejectMessage.value.trim();

      const observacaoMotivo = `Motivo da recusa: ${motivo}.`;

      solicitacaoAtual.observacoes.interna = solicitacaoAtual.observacoes
        .interna
        ? `${solicitacaoAtual.observacoes.interna} ${observacaoMotivo}`
        : observacaoMotivo;

      concluirAlteracao("Solicitação recusada.");
    },
  });
}

/* =========================================
   RESPOSTA DO CLIENTE À PROPOSTA
========================================= */

function aceitarProposta() {
  const proposta = solicitacaoAtual.proposta;

  if (!proposta) {
    return;
  }

  abrirModal({
    titulo: "Aceitar nova data",

    descricao:
      "O atendimento será confirmado para a nova data proposta pela Salvateck.",

    textoConfirmacao: "Aceitar data",

    confirmar: () => {
      proposta.status = "aceita";

      solicitacaoAtual.status = "agendada";

      solicitacaoAtual.atendimento = {
        ...solicitacaoAtual.atendimento,

        dataConfirmada: proposta.data,

        periodoConfirmado: proposta.periodo,

        horarioConfirmado: proposta.horario,
      };

      solicitacaoAtual.observacoes.resposta =
        "O cliente aceitou a nova data proposta.";

      concluirAlteracao("Nova data aceita e atendimento agendado.");
    },
  });
}

function recusarProposta() {
  const proposta = solicitacaoAtual.proposta;

  if (!proposta) {
    return;
  }

  abrirModal({
    titulo: "Recusar nova data",

    descricao:
      "A equipe será informada de que esta data não funciona e poderá enviar outra opção.",

    textoConfirmacao: "Recusar data",
    perigo: true,

    confirmar: () => {
      proposta.status = "recusada";

      solicitacaoAtual.status = "em-analise";

      solicitacaoAtual.observacoes.resposta =
        "O cliente informou que não pode ser atendido na data proposta.";

      concluirAlteracao("A equipe foi informada sobre a indisponibilidade.");
    },
  });
}

/* =========================================
   CANCELAMENTO
========================================= */

function cancelarSolicitacao() {
  abrirModal({
    titulo: "Cancelar solicitação",

    descricao:
      "Esta solicitação será encerrada. Confirme apenas se realmente deseja cancelar.",

    textoConfirmacao: "Cancelar solicitação",

    perigo: true,

    confirmar: () => {
      solicitacaoAtual.status = "cancelada";

      solicitacaoAtual.observacoes.resposta =
        "A solicitação foi cancelada pelo cliente.";

      concluirAlteracao("Solicitação cancelada.");
    },
  });
}

/* =========================================
   MAPA E CLIENTE
========================================= */

function abrirEnderecoNoMapa() {
  const endereco = encodeURIComponent(montarEnderecoCompleto());

  const url = `https://www.google.com/maps/search/?api=1&query=${endereco}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

function abrirCadastroCliente() {
  mostrarFeedback(
    "A página de cadastro do cliente será conectada na próxima etapa.",
  );
}

/* =========================================
   RENDERIZAÇÃO GERAL
========================================= */

function renderizarTudo() {
  renderizarHero();
  renderizarTimeline();
  renderizarCliente();
  renderizarServicos();
  renderizarEndereco();
  renderizarAgenda();
  renderizarFotos();
  renderizarObservacoes();
  sincronizarPrioridade();
  renderizarPerfil();
}

/* =========================================
   EVENTOS
========================================= */

profileButtons.forEach((button) => {
  button.addEventListener("click", () => {
    alterarPerfil(button.dataset.profileButton);
  });
});

priorityInputs.forEach((input) => {
  input.addEventListener("change", () => {
    alterarPrioridade(input.value);
  });
});

acceptRequestButton.addEventListener("click", () => {
  preencherFormularioAceite();
  abrirFormularioAcao(acceptForm);
});

proposeDateButton.addEventListener("click", () => {
  preencherFormularioProposta();
  abrirFormularioAcao(proposalForm);
});

rejectRequestButton.addEventListener("click", () => {
  abrirFormularioAcao(rejectForm);
});

closeActionButtons.forEach((button) => {
  button.addEventListener("click", fecharFormulariosAcao);
});

acceptForm.addEventListener("submit", enviarAceite);

proposalForm.addEventListener("submit", enviarProposta);

rejectForm.addEventListener("submit", enviarRecusa);

acceptProposalButton.addEventListener("click", aceitarProposta);

declineProposalButton.addEventListener("click", recusarProposta);

cancelRequestButton.addEventListener("click", cancelarSolicitacao);

openMapButton.addEventListener("click", abrirEnderecoNoMapa);

openClientButton.addEventListener("click", abrirCadastroCliente);

closeModalButtons.forEach((button) => {
  button.addEventListener("click", fecharModal);
});

confirmModalButton.addEventListener("click", () => {
  const callback = modalCallback;

  fecharModal();

  if (typeof callback === "function") {
    callback();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !confirmationModal.hidden) {
    fecharModal();
  }

  if (event.key === "Escape" && confirmationModal.hidden) {
    fecharFormulariosAcao();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

const dataMinima = obterDataLocal();

acceptDate.min = dataMinima;
proposalDate.min = dataMinima;

if (!solicitacoes.some((solicitacao) => solicitacao.id === requestId)) {
  mostrarFeedback("Solicitação não encontrada. Exibindo um registro de teste.");
}

carregarAlteracoesLocais();

renderizarTudo();
