/* =========================================
   CONFIGURAÇÕES GERAIS
========================================= */

const SERVICES_STORAGE_KEY = "salvateckServicosTemporarios";

const SERVICES_PER_CATEGORY = 10;
const SERVICES_PER_PAGE = 20;

/* =========================================
   CONFIGURAÇÕES DE EXIBIÇÃO
========================================= */

const categoryConfig = {
  hidraulica: {
    nome: "Hidráulica",
    descricao: "Redes hidráulicas, bombas, reservatórios e vazamentos.",
    ordem: 1,
    icone: "hidraulica",
  },

  eletrica: {
    nome: "Elétrica",
    descricao: "Quadros, circuitos, iluminação e instalações elétricas.",
    ordem: 2,
    icone: "eletrica",
  },

  pintura: {
    nome: "Pintura",
    descricao: "Pintura interna, externa, fachadas e acabamentos.",
    ordem: 3,
    icone: "pintura",
  },

  alvenaria: {
    nome: "Alvenaria",
    descricao: "Reparos estruturais, paredes, pisos e revestimentos.",
    ordem: 4,
    icone: "alvenaria",
  },

  instalacoes: {
    nome: "Instalações",
    descricao: "Instalação de equipamentos, acessórios e estruturas.",
    ordem: 5,
    icone: "instalacoes",
  },

  "manutencao-geral": {
    nome: "Manutenção geral",
    descricao: "Serviços diversos de conservação e manutenção predial.",
    ordem: 6,
    icone: "manutencao-geral",
  },

  civil: {
    nome: "Manutenção civil",
    descricao: "Reparos civis, infiltrações, coberturas e fachadas.",
    ordem: 7,
    icone: "alvenaria",
  },

  acesso: {
    nome: "Acesso e portaria",
    descricao: "Portões, interfones, controles e sistemas de acesso.",
    ordem: 8,
    icone: "acesso",
  },

  seguranca: {
    nome: "Segurança",
    descricao: "CFTV, câmeras e dispositivos de segurança.",
    ordem: 9,
    icone: "seguranca",
  },

  incendio: {
    nome: "Combate a incêndio",
    descricao: "Hidrantes, alarmes e equipamentos de proteção.",
    ordem: 10,
    icone: "incendio",
  },

  equipamentos: {
    nome: "Equipamentos",
    descricao: "Manutenção de equipamentos e sistemas prediais.",
    ordem: 11,
    icone: "equipamentos",
  },

  inspecao: {
    nome: "Inspeção e vistoria",
    descricao: "Vistorias preventivas e verificações técnicas.",
    ordem: 12,
    icone: "inspecao",
  },

  outros: {
    nome: "Outros",
    descricao: "Outros serviços oferecidos pela Salvateck.",
    ordem: 99,
    icone: "outros",
  },
};
const categoryIconConfig = {
  hidraulica: `
    <path d="M12 3s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11Z"></path>
  `,

  eletrica: `
    <path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z"></path>
  `,

  pintura: `
    <path d="M4 5h11v5H4z"></path>
    <path d="M15 7h3a2 2 0 0 1 2 2v2"></path>
    <path d="M12 10v3"></path>
    <path d="M10 13h4v8h-4z"></path>
  `,

  alvenaria: `
    <path d="M3 4h8v6H3z"></path>
    <path d="M13 4h8v6h-8z"></path>
    <path d="M3 14h8v6H3z"></path>
    <path d="M13 14h8v6h-8z"></path>
  `,

  instalacoes: `
    <path d="m14.5 6.5 3-3 3 3-3 3"></path>
    <path d="m13 8 3 3-8 8H5v-3z"></path>
    <path d="M5 19 3 21"></path>
  `,

  "manutencao-geral": `
    <path d="M5 21V9l7-6 7 6v12"></path>
    <path d="M9 21v-7h6v7"></path>
    <path d="M3 21h18"></path>
  `,

  acesso: `
    <path d="M5 21V4h10v17"></path>
    <path d="M15 9h4v12"></path>
    <path d="M9 12h.01"></path>
    <path d="M3 21h18"></path>
  `,

  seguranca: `
    <path d="M12 3 4.5 6v5c0 5 3.2 8.6 7.5 10 4.3-1.4 7.5-5 7.5-10V6z"></path>
    <path d="m9 12 2 2 4-4"></path>
  `,

  incendio: `
    <path d="M12 22c4 0 7-2.8 7-6.6 0-2.8-1.8-5.5-5.2-8.3.1 2.2-.8 3.7-2 4.6.2-3.4-1.8-6.1-4.2-8.7.2 4.2-2.6 6.8-2.6 10.5C5 18.2 8 22 12 22Z"></path>
    <path d="M10 18c0-1.6.8-2.8 2-4 1.2 1.2 2 2.4 2 4a2 2 0 0 1-4 0Z"></path>
  `,

  equipamentos: `
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"></path>
  `,

  inspecao: `
    <path d="M9 5h6"></path>
    <path d="M9 3h6v4H9z"></path>
    <path d="M6 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1"></path>
    <path d="m8 14 2 2 5-5"></path>
  `,

  outros: `
    <path d="M14.5 6.5 17 4l3 3-2.5 2.5"></path>
    <path d="m13 8 3 3-8 8H5v-3z"></path>
    <path d="M4 4h6"></path>
    <path d="M4 8h4"></path>
  `,
};
const typeConfig = {
  preventivo: {
    nome: "Preventivo",
    classe: "type--preventivo",
  },

  corretivo: {
    nome: "Corretivo",
    classe: "type--corretivo",
  },

  emergencial: {
    nome: "Emergencial",
    classe: "type--emergencial",
  },

  inspecao: {
    nome: "Inspeção",
    classe: "type--inspecao",
  },
};

const statusConfig = {
  ativo: {
    nome: "Ativo",
    classe: "status--ativo",
  },

  inativo: {
    nome: "Inativo",
    classe: "status--inativo",
  },
};

const chargeConfig = {
  "valor-fixo": "Valor fixo",
  "por-hora": "Por hora",
  "sob-orcamento": "Sob orçamento",
  contrato: "Incluído em contrato",
};

const priorityConfig = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

const equipmentConfig = {
  bombas: "Bombas",
  reservatorios: "Reservatórios",
  "rede-hidraulica": "Rede hidráulica",
  "quadro-eletrico": "Quadro elétrico",
  gerador: "Gerador",
  iluminacao: "Iluminação",
  "portao-automatico": "Portão automático",
  interfone: "Interfone",
  cftv: "CFTV e câmeras",
  elevador: "Elevador",
  "sistema-incendio": "Sistema de incêndio",
  piscina: "Piscina",
  fachada: "Fachada",
  cobertura: "Cobertura e telhado",
  "areas-comuns": "Áreas comuns",
  pintura: "Pintura",
  alvenaria: "Alvenaria",
  drywall: "Drywall",
  pisos: "Pisos e revestimentos",
};

/* =========================================
   DADOS INICIAIS
========================================= */

const initialServices = [
  {
    id: "servico-0001",
    codigo: "SERV-0001",

    nome: "Reparo de vazamento hidráulico",

    categoria: "hidraulica",
    tipo: "corretivo",
    status: "ativo",

    descricao:
      "Identificação da origem e correção de vazamentos em tubulações, conexões, registros ou pontos hidráulicos.",

    cobranca: "sob-orcamento",
    valorReferencia: 0,

    duracaoValor: 2,
    duracaoUnidade: "horas",
    duracaoMinutos: 120,

    equipamentos: ["rede-hidraulica", "reservatorios"],

    equipeRecomendada: 1,
    prioridadePadrao: "alta",

    exigeFotos: true,
    exigeAprovacao: true,
    registrarMateriais: true,
    exigeAceite: true,

    orientacoes:
      "Identificar a origem antes de realizar quebras ou alterações em revestimentos.",

    checklist: [
      "Localizar a origem do vazamento.",
      "Fechar o abastecimento quando necessário.",
      "Executar o reparo.",
      "Testar a rede após a correção.",
      "Registrar fotos antes e depois.",
    ],
  },

  {
    id: "servico-0002",
    codigo: "SERV-0002",

    nome: "Manutenção preventiva de bombas",

    categoria: "hidraulica",
    tipo: "preventivo",
    status: "ativo",

    descricao:
      "Inspeção preventiva, limpeza e verificação do funcionamento de bombas e conexões.",

    cobranca: "valor-fixo",
    valorReferencia: 380,

    duracaoValor: 3,
    duracaoUnidade: "horas",
    duracaoMinutos: 180,

    equipamentos: ["bombas", "rede-hidraulica"],

    equipeRecomendada: 2,
    prioridadePadrao: "normal",

    exigeFotos: true,
    exigeAprovacao: false,
    registrarMateriais: true,
    exigeAceite: true,

    orientacoes:
      "Desligar o equipamento antes da intervenção e verificar ruídos, aquecimento e vazamentos.",

    checklist: [
      "Verificar vazamentos nas conexões.",
      "Avaliar ruídos e vibrações.",
      "Testar o acionamento automático.",
      "Registrar fotos antes e depois.",
    ],
  },

  {
    id: "servico-0003",
    codigo: "SERV-0003",

    nome: "Inspeção de quadro elétrico",

    categoria: "eletrica",
    tipo: "inspecao",
    status: "ativo",

    descricao:
      "Inspeção visual e funcional de quadros elétricos, componentes, conexões e identificação dos circuitos.",

    cobranca: "valor-fixo",
    valorReferencia: 290,

    duracaoValor: 2,
    duracaoUnidade: "horas",
    duracaoMinutos: 120,

    equipamentos: ["quadro-eletrico"],

    equipeRecomendada: 1,
    prioridadePadrao: "normal",

    exigeFotos: true,
    exigeAprovacao: false,
    registrarMateriais: false,
    exigeAceite: true,

    orientacoes:
      "Utilizar os equipamentos de proteção adequados e não tocar em partes energizadas sem autorização.",

    checklist: [
      "Verificar a identificação dos circuitos.",
      "Verificar sinais de aquecimento.",
      "Avaliar a conservação das conexões.",
      "Registrar não conformidades.",
    ],
  },

  {
    id: "servico-0004",
    codigo: "SERV-0004",

    nome: "Atendimento elétrico emergencial",

    categoria: "eletrica",
    tipo: "emergencial",
    status: "ativo",

    descricao:
      "Atendimento prioritário para falhas elétricas que comprometam áreas comuns ou a segurança do local.",

    cobranca: "por-hora",
    valorReferencia: 180,

    duracaoValor: 2,
    duracaoUnidade: "horas",
    duracaoMinutos: 120,

    equipamentos: ["quadro-eletrico", "gerador", "iluminacao"],

    equipeRecomendada: 1,
    prioridadePadrao: "urgente",

    exigeFotos: true,
    exigeAprovacao: false,
    registrarMateriais: true,
    exigeAceite: true,

    orientacoes:
      "Priorizar a segurança e isolar imediatamente o circuito afetado.",

    checklist: [
      "Identificar o circuito afetado.",
      "Avaliar a existência de risco imediato.",
      "Executar o reparo.",
      "Testar o funcionamento.",
    ],
  },

  {
    id: "servico-0005",
    codigo: "SERV-0005",

    nome: "Pintura de áreas internas",

    categoria: "pintura",
    tipo: "corretivo",
    status: "ativo",

    descricao:
      "Preparação de superfícies e pintura de paredes, corredores, halls e outras áreas internas.",

    cobranca: "sob-orcamento",
    valorReferencia: 0,

    duracaoValor: 2,
    duracaoUnidade: "dias",
    duracaoMinutos: 960,

    equipamentos: ["pintura", "areas-comuns"],

    equipeRecomendada: 2,
    prioridadePadrao: "normal",

    exigeFotos: true,
    exigeAprovacao: true,
    registrarMateriais: true,
    exigeAceite: true,

    orientacoes:
      "Proteger pisos, móveis, portas e demais elementos antes do início da pintura.",

    checklist: [
      "Proteger a área.",
      "Preparar a superfície.",
      "Aplicar a pintura.",
      "Revisar o acabamento.",
      "Limpar a área.",
    ],
  },

  {
    id: "servico-0006",
    codigo: "SERV-0006",

    nome: "Reparo de parede e alvenaria",

    categoria: "alvenaria",
    tipo: "corretivo",
    status: "ativo",

    descricao:
      "Reparo de trincas, buracos, paredes, reboco e pequenos danos em elementos de alvenaria.",

    cobranca: "sob-orcamento",
    valorReferencia: 0,

    duracaoValor: 1,
    duracaoUnidade: "dias",
    duracaoMinutos: 480,

    equipamentos: ["alvenaria", "areas-comuns"],

    equipeRecomendada: 2,
    prioridadePadrao: "normal",

    exigeFotos: true,
    exigeAprovacao: true,
    registrarMateriais: true,
    exigeAceite: true,

    orientacoes:
      "Verificar se o dano é apenas superficial antes de executar o fechamento.",

    checklist: [
      "Avaliar a origem do dano.",
      "Preparar a área.",
      "Executar o reparo.",
      "Verificar o acabamento.",
    ],
  },

  {
    id: "servico-0007",
    codigo: "SERV-0007",

    nome: "Instalação de luminária",

    categoria: "instalacoes",
    tipo: "corretivo",
    status: "ativo",

    descricao:
      "Instalação ou substituição de luminárias em áreas comuns, técnicas ou administrativas.",

    cobranca: "valor-fixo",
    valorReferencia: 160,

    duracaoValor: 1,
    duracaoUnidade: "horas",
    duracaoMinutos: 60,

    equipamentos: ["iluminacao"],

    equipeRecomendada: 1,
    prioridadePadrao: "normal",

    exigeFotos: true,
    exigeAprovacao: false,
    registrarMateriais: true,
    exigeAceite: true,

    orientacoes:
      "Desligar o circuito antes da instalação e confirmar a compatibilidade elétrica da luminária.",

    checklist: [
      "Desligar o circuito.",
      "Verificar a fixação.",
      "Executar as conexões.",
      "Testar a luminária.",
    ],
  },

  {
    id: "servico-0008",
    codigo: "SERV-0008",

    nome: "Manutenção de portão automático",

    categoria: "manutencao-geral",
    tipo: "preventivo",
    status: "ativo",

    descricao:
      "Verificação do motor, trilhos, roldanas, sensores e dispositivos de segurança do portão.",

    cobranca: "valor-fixo",
    valorReferencia: 450,

    duracaoValor: 3,
    duracaoUnidade: "horas",
    duracaoMinutos: 180,

    equipamentos: ["portao-automatico"],

    equipeRecomendada: 2,
    prioridadePadrao: "normal",

    exigeFotos: true,
    exigeAprovacao: false,
    registrarMateriais: true,
    exigeAceite: true,

    orientacoes: "Isolar a área de movimentação durante os testes.",

    checklist: [
      "Verificar trilhos e roldanas.",
      "Testar sensores de segurança.",
      "Verificar controles e acionadores.",
      "Testar abertura e fechamento.",
    ],
  },

  {
    id: "servico-0009",
    codigo: "SERV-0009",

    nome: "Vistoria preventiva condominial",

    categoria: "inspecao",
    tipo: "inspecao",
    status: "ativo",

    descricao:
      "Vistoria de estruturas, equipamentos e áreas cadastradas para identificação de não conformidades.",

    cobranca: "contrato",
    valorReferencia: 0,

    duracaoValor: 1,
    duracaoUnidade: "dias",
    duracaoMinutos: 480,

    equipamentos: [
      "bombas",
      "reservatorios",
      "quadro-eletrico",
      "gerador",
      "portao-automatico",
      "sistema-incendio",
      "areas-comuns",
    ],

    equipeRecomendada: 2,
    prioridadePadrao: "normal",

    exigeFotos: true,
    exigeAprovacao: false,
    registrarMateriais: false,
    exigeAceite: true,

    orientacoes:
      "Registrar todas as não conformidades encontradas e classificar a prioridade.",

    checklist: [
      "Confirmar os equipamentos existentes.",
      "Registrar fotos das não conformidades.",
      "Classificar o nível de prioridade.",
      "Apresentar o resumo ao responsável.",
    ],
  },

  {
    id: "servico-0010",
    codigo: "SERV-0010",

    nome: "Limpeza técnica de reservatório",

    categoria: "hidraulica",
    tipo: "preventivo",
    status: "inativo",

    descricao: "Limpeza e higienização programada de reservatórios de água.",

    cobranca: "sob-orcamento",
    valorReferencia: 0,

    duracaoValor: 1,
    duracaoUnidade: "dias",
    duracaoMinutos: 480,

    equipamentos: ["reservatorios"],

    equipeRecomendada: 3,
    prioridadePadrao: "normal",

    exigeFotos: true,
    exigeAprovacao: true,
    registrarMateriais: true,
    exigeAceite: true,

    orientacoes: "Programar previamente a interrupção do abastecimento.",

    checklist: [
      "Confirmar o esvaziamento.",
      "Executar a higienização.",
      "Registrar fotos antes e depois.",
    ],
  },
];

/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const summaryActive = document.getElementById("summary-active");

const summaryCategories = document.getElementById("summary-categories");

const summaryPreventive = document.getElementById("summary-preventive");

const summaryEmergency = document.getElementById("summary-emergency");

const viewButtons = document.querySelectorAll("[data-services-view]");

const servicesSearch = document.getElementById("services-search");

const openFilterButton = document.getElementById("open-filter-button");

const closeFilterButton = document.getElementById("close-filter-button");

const filterPanel = document.getElementById("filter-panel");

const activeFilterCount = document.getElementById("active-filter-count");

const activeFiltersList = document.getElementById("active-filters-list");

const categoryFilter = document.getElementById("category-filter");

const typeFilter = document.getElementById("type-filter");

const chargeFilter = document.getElementById("charge-filter");

const clearFiltersButton = document.getElementById("clear-filters-button");

const applyFiltersButton = document.getElementById("apply-filters-button");

const clearEmptyFiltersButton = document.getElementById(
  "clear-empty-filters-button",
);

const servicesContentEyebrow = document.getElementById(
  "services-content-eyebrow",
);

const servicesContentTitle = document.getElementById("services-content-title");

const servicesCount = document.getElementById("services-count");

const servicesCategories = document.getElementById("services-categories");

const allServices = document.getElementById("all-services");

const loadMoreServicesButton = document.getElementById(
  "load-more-services-button",
);

const emptyState = document.getElementById("empty-state");

const categoryTemplate = document.getElementById("service-category-template");

const serviceRowTemplate = document.getElementById("service-row-template");

/* =========================================
   ELEMENTOS DO MODAL
========================================= */

const serviceDetailsModal = document.getElementById("service-details-modal");

const closeServiceDetailsButton = document.getElementById(
  "close-service-details-button",
);

const closeServiceDetailsSecondaryButton = document.getElementById(
  "close-service-details-secondary-button",
);

const createOrderWithServiceButton = document.getElementById(
  "create-order-with-service-button",
);

const detailsServiceCode = document.getElementById("details-service-code");

const serviceDetailsTitle = document.getElementById("service-details-title");

const detailsServiceCategory = document.getElementById(
  "details-service-category",
);

const detailsServiceType = document.getElementById("details-service-type");

const detailsServiceStatus = document.getElementById("details-service-status");

const detailsServiceDescription = document.getElementById(
  "details-service-description",
);

const detailsServiceDuration = document.getElementById(
  "details-service-duration",
);

const detailsServicePrice = document.getElementById("details-service-price");

const detailsServiceCharge = document.getElementById("details-service-charge");

const detailsServiceTeam = document.getElementById("details-service-team");

const detailsServicePriority = document.getElementById(
  "details-service-priority",
);

const detailsServiceEquipmentCount = document.getElementById(
  "details-service-equipment-count",
);

const detailsServiceEquipment = document.getElementById(
  "details-service-equipment",
);

const detailsServiceEquipmentEmpty = document.getElementById(
  "details-service-equipment-empty",
);

const detailsServiceRequirements = document.getElementById(
  "details-service-requirements",
);

const detailsServiceInstructions = document.getElementById(
  "details-service-instructions",
);

const detailsChecklistCount = document.getElementById(
  "details-checklist-count",
);

const detailsServiceChecklist = document.getElementById(
  "details-service-checklist",
);

const detailsServiceChecklistEmpty = document.getElementById(
  "details-service-checklist-empty",
);

const feedbackMessage = document.getElementById("feedback-message");

/* =========================================
   VARIÁVEIS DE CONTROLE
========================================= */

let services = [];

let currentView = "categories";

let appliedFilters = {
  categoria: "",
  tipo: "",
  cobranca: "",
};

let openCategories = new Set();

let categoryLimits = {};

let generalListLimit = SERVICES_PER_PAGE;

let selectedServiceId = null;

let feedbackTimeout;

/* =========================================
   FUNÇÕES AUXILIARES
========================================= */

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanText(value) {
  return String(value || "").trim();
}

function createSlug(value) {
  return normalizeText(value)
    .replace(/^categoria-/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function formatQuantity(quantity, singular, plural) {
  return quantity === 1 ? `1 ${singular}` : `${quantity} ${plural}`;
}

function formatServicesQuantity(quantity) {
  return formatQuantity(quantity, "serviço", "serviços");
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getServiceById(serviceId) {
  return services.find((service) => service.id === serviceId);
}

function showFeedback(message) {
  window.clearTimeout(feedbackTimeout);

  feedbackMessage.textContent = message;

  feedbackMessage.hidden = false;

  feedbackTimeout = window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3000);
}

function getCategorySlug(service) {
  const rawCategory = service.categoria || service.categoriaId || "outros";

  const slug = createSlug(rawCategory);

  return slug || "outros";
}

function createCategoryName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function getCategoryData(serviceOrSlug) {
  const slug =
    typeof serviceOrSlug === "string"
      ? createSlug(serviceOrSlug)
      : getCategorySlug(serviceOrSlug);

  const service = typeof serviceOrSlug === "object" ? serviceOrSlug : null;

  const configured = categoryConfig[slug];

  return {
    slug,

    nome:
      service?.categoriaNome || configured?.nome || createCategoryName(slug),

    descricao:
      service?.categoriaDescricao ||
      configured?.descricao ||
      "Serviços disponíveis nesta categoria.",

    ordem: Number(service?.categoriaOrdem ?? configured?.ordem) || 99,

    icone: service?.categoriaIcone || configured?.icone || "outros",
  };
}

function formatDuration(service) {
  const durationValue = Number(service.duracaoValor) || 1;

  const durationUnit = service.duracaoUnidade || "minutos";

  if (durationUnit === "dias") {
    return durationValue === 1 ? "1 dia" : `${durationValue} dias`;
  }

  if (durationUnit === "horas") {
    return durationValue === 1 ? "1 hora" : `${durationValue} horas`;
  }

  return durationValue === 1 ? "1 minuto" : `${durationValue} minutos`;
}

function getPriceText(service) {
  if (service.cobranca === "sob-orcamento") {
    return "Sob orçamento";
  }

  if (service.cobranca === "contrato") {
    return "Em contrato";
  }

  if (Number(service.valorReferencia) <= 0) {
    return "Sem valor";
  }

  if (service.cobranca === "por-hora") {
    return `${formatCurrency(service.valorReferencia)}/h`;
  }

  return formatCurrency(service.valorReferencia);
}

function getTeamText(quantity) {
  const number = Number(quantity) || 1;

  if (number >= 4) {
    return "4 ou mais profissionais";
  }

  return number === 1 ? "1 profissional" : `${number} profissionais`;
}

function getChecklistText(item) {
  if (typeof item === "string") {
    return cleanText(item);
  }

  return cleanText(item?.texto || item?.nome || item?.descricao);
}

/* =========================================
   NORMALIZAÇÃO DOS SERVIÇOS
========================================= */

function normalizeService(service, index) {
  const category = getCategorySlug(service);

  const durationValue = Math.max(1, Number(service.duracaoValor) || 1);

  const durationUnit = service.duracaoUnidade || "minutos";

  let durationMinutes = Number(service.duracaoMinutos) || 0;

  if (!durationMinutes) {
    if (durationUnit === "horas") {
      durationMinutes = durationValue * 60;
    } else if (durationUnit === "dias") {
      durationMinutes = durationValue * 480;
    } else {
      durationMinutes = durationValue;
    }
  }

  let status = service.status;

  if (!status) {
    status = service.ativo === false ? "inativo" : "ativo";
  }

  return {
    ...service,

    id: service.id || `servico-${String(index + 1).padStart(4, "0")}`,

    codigo: service.codigo || `SERV-${String(index + 1).padStart(4, "0")}`,

    nome: service.nome || "Serviço sem nome",

    categoria: category,

    tipo: service.tipo || "corretivo",

    status,

    descricao: service.descricao || "",

    cobranca: service.cobranca || "sob-orcamento",

    valorReferencia: Number(service.valorReferencia) || 0,

    duracaoValor: durationValue,

    duracaoUnidade: durationUnit,

    duracaoMinutos: durationMinutes,

    equipamentos: Array.isArray(service.equipamentos)
      ? service.equipamentos
      : [],

    equipeRecomendada: Number(service.equipeRecomendada) || 1,

    prioridadePadrao: service.prioridadePadrao || "normal",

    exigeFotos: Boolean(service.exigeFotos),

    exigeAprovacao: Boolean(service.exigeAprovacao),

    registrarMateriais: Boolean(service.registrarMateriais),

    exigeAceite: Boolean(service.exigeAceite),

    orientacoes: service.orientacoes || service.instrucoes || "",

    checklist: Array.isArray(service.checklist) ? service.checklist : [],

    visivelParaEquipe: service.visivelParaEquipe !== false,
  };
}

/* =========================================
   ARMAZENAMENTO LOCAL
========================================= */

function loadServices() {
  try {
    const savedData = JSON.parse(
      localStorage.getItem(SERVICES_STORAGE_KEY) || "null",
    );

    if (Array.isArray(savedData)) {
      services = savedData.map(normalizeService);

      return;
    }
  } catch (error) {
    console.warn("Não foi possível carregar os serviços.", error);
  }

  services = cloneData(initialServices).map(normalizeService);

  saveServices();
}

function saveServices() {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));

    return true;
  } catch (error) {
    console.warn("Não foi possível salvar os serviços.", error);

    return false;
  }
}

/* =========================================
   RESUMO
========================================= */

function updateSummary() {
  const activeServices = services.filter(
    (service) => service.status === "ativo" && service.visivelParaEquipe,
  );

  const categories = new Set(activeServices.map(getCategorySlug));

  const preventive = activeServices.filter(
    (service) => service.tipo === "preventivo",
  ).length;

  const emergency = activeServices.filter(
    (service) => service.tipo === "emergencial",
  ).length;

  summaryActive.textContent = String(activeServices.length);

  summaryCategories.textContent = String(categories.size);

  summaryPreventive.textContent = String(preventive);

  summaryEmergency.textContent = String(emergency);
}

/* =========================================
   FILTRO DE VISUALIZAÇÃO
========================================= */

function matchesCurrentView(service) {
  if (!service.visivelParaEquipe) {
    return false;
  }

  if (currentView === "inactive") {
    return service.status === "inativo";
  }

  return service.status === "ativo";
}

/* =========================================
   PESQUISA
========================================= */

function matchesSearch(service) {
  const search = normalizeText(servicesSearch.value);

  if (!search) {
    return true;
  }

  const category = getCategoryData(service);

  const equipments = service.equipamentos
    .map((equipment) => {
      return equipmentConfig[equipment] || equipment;
    })
    .join(" ");

  const checklist = service.checklist.map(getChecklistText).join(" ");

  const content = normalizeText(
    [
      service.codigo,
      service.nome,
      service.descricao,
      category.nome,
      typeConfig[service.tipo]?.nome,
      chargeConfig[service.cobranca],
      equipments,
      checklist,
      service.orientacoes,
    ].join(" "),
  );

  return content.includes(search);
}

/* =========================================
   FILTROS
========================================= */

function matchesFilters(service) {
  const categoryMatches =
    !appliedFilters.categoria ||
    getCategorySlug(service) === appliedFilters.categoria;

  const typeMatches =
    !appliedFilters.tipo || service.tipo === appliedFilters.tipo;

  const chargeMatches =
    !appliedFilters.cobranca || service.cobranca === appliedFilters.cobranca;

  return categoryMatches && typeMatches && chargeMatches;
}

function getFilteredServices() {
  return services
    .filter(matchesCurrentView)
    .filter(matchesSearch)
    .filter(matchesFilters)
    .sort((serviceA, serviceB) => {
      const categoryA = getCategoryData(serviceA);

      const categoryB = getCategoryData(serviceB);

      if (categoryA.ordem !== categoryB.ordem) {
        return categoryA.ordem - categoryB.ordem;
      }

      return serviceA.nome.localeCompare(serviceB.nome, "pt-BR");
    });
}

function countActiveFilters() {
  return Object.values(appliedFilters).filter(Boolean).length;
}

function updateFilterCount() {
  const quantity = countActiveFilters();

  activeFilterCount.textContent = String(quantity);

  activeFilterCount.hidden = quantity === 0;
}

function synchronizeFilterForm() {
  categoryFilter.value = appliedFilters.categoria;

  typeFilter.value = appliedFilters.tipo;

  chargeFilter.value = appliedFilters.cobranca;
}

function createFilterChip(text, removeAction) {
  const chip = document.createElement("span");

  chip.className = "active-filter-chip";

  const label = document.createElement("span");

  label.textContent = text;

  const button = document.createElement("button");

  button.type = "button";
  button.textContent = "×";

  button.setAttribute("aria-label", `Remover filtro ${text}`);

  button.addEventListener("click", removeAction);

  chip.append(label, button);

  return chip;
}

function finishFilterRemoval() {
  synchronizeFilterForm();

  updateFilterCount();

  renderActiveFilters();

  resetListLimits();

  renderContent();
}

function renderActiveFilters() {
  activeFiltersList.innerHTML = "";

  if (appliedFilters.categoria) {
    const category = getCategoryData(appliedFilters.categoria);

    activeFiltersList.appendChild(
      createFilterChip(category.nome, () => {
        appliedFilters.categoria = "";

        finishFilterRemoval();
      }),
    );
  }

  if (appliedFilters.tipo) {
    const text = typeConfig[appliedFilters.tipo]?.nome || appliedFilters.tipo;

    activeFiltersList.appendChild(
      createFilterChip(text, () => {
        appliedFilters.tipo = "";

        finishFilterRemoval();
      }),
    );
  }

  if (appliedFilters.cobranca) {
    const text =
      chargeConfig[appliedFilters.cobranca] || appliedFilters.cobranca;

    activeFiltersList.appendChild(
      createFilterChip(text, () => {
        appliedFilters.cobranca = "";

        finishFilterRemoval();
      }),
    );
  }

  activeFiltersList.hidden = activeFiltersList.children.length === 0;
}

function populateCategoryFilter() {
  const selectedValue = categoryFilter.value;

  categoryFilter.innerHTML = "";

  const firstOption = document.createElement("option");

  firstOption.value = "";
  firstOption.textContent = "Todas as categorias";

  categoryFilter.appendChild(firstOption);

  const categoryMap = new Map();

  services.forEach((service) => {
    const category = getCategoryData(service);

    if (!categoryMap.has(category.slug)) {
      categoryMap.set(category.slug, category);
    }
  });

  [...categoryMap.values()]
    .sort((a, b) => {
      if (a.ordem !== b.ordem) {
        return a.ordem - b.ordem;
      }

      return a.nome.localeCompare(b.nome, "pt-BR");
    })
    .forEach((category) => {
      const option = document.createElement("option");

      option.value = category.slug;

      option.textContent = category.nome;

      categoryFilter.appendChild(option);
    });

  const valueExists = Array.from(categoryFilter.options).some((option) => {
    return option.value === selectedValue;
  });

  if (valueExists) {
    categoryFilter.value = selectedValue;
  }
}

function openFilters() {
  filterPanel.hidden = false;

  openFilterButton.setAttribute("aria-expanded", "true");

  filterPanel.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

function closeFilters() {
  filterPanel.hidden = true;

  openFilterButton.setAttribute("aria-expanded", "false");
}

function applyFilters() {
  appliedFilters = {
    categoria: categoryFilter.value,

    tipo: typeFilter.value,

    cobranca: chargeFilter.value,
  };

  updateFilterCount();

  renderActiveFilters();

  resetListLimits();

  closeFilters();

  renderContent();

  showFeedback(
    countActiveFilters() > 0
      ? "Filtros aplicados."
      : "Todos os filtros foram removidos.",
  );
}

function clearSearchAndFilters() {
  servicesSearch.value = "";

  appliedFilters = {
    categoria: "",
    tipo: "",
    cobranca: "",
  };

  synchronizeFilterForm();

  updateFilterCount();

  renderActiveFilters();

  resetListLimits();

  closeFilters();

  renderContent();

  showFeedback("Pesquisa e filtros removidos.");
}

/* =========================================
   VISUALIZAÇÕES
========================================= */

function changeView(newView) {
  const allowedViews = ["categories", "all", "inactive"];

  if (!allowedViews.includes(newView)) {
    return;
  }

  currentView = newView;

  viewButtons.forEach((button) => {
    const active = button.dataset.servicesView === currentView;

    button.classList.toggle("is-active", active);

    button.setAttribute("aria-pressed", String(active));
  });

  resetListLimits();

  renderContent();
}

function updateContentHeading() {
  if (currentView === "categories") {
    servicesContentEyebrow.textContent = "Consulta por área";

    servicesContentTitle.textContent = "Categorias de serviços";

    return;
  }

  if (currentView === "inactive") {
    servicesContentEyebrow.textContent = "Catálogo arquivado";

    servicesContentTitle.textContent = "Serviços inativos";

    return;
  }

  servicesContentEyebrow.textContent = "Consulta geral";

  servicesContentTitle.textContent = "Todos os serviços ativos";
}

function resetListLimits() {
  categoryLimits = {};

  generalListLimit = SERVICES_PER_PAGE;
}

/* =========================================
   LINHA DE SERVIÇO
========================================= */

function createServiceRow(service) {
  const fragment = serviceRowTemplate.content.cloneNode(true);

  const row = fragment.querySelector(".service-row");

  const code = row.querySelector(".service-row__code");

  const status = row.querySelector(".service-row__status");

  const name = row.querySelector(".service-row__name");

  const type = row.querySelector(".service-row__type");

  const duration = row.querySelector(".service-row__duration");

  const price = row.querySelector(".service-row__price");

  const openButton = row.querySelector(".service-row__open");

  const statusData = statusConfig[service.status] || statusConfig.ativo;

  const typeData = typeConfig[service.tipo] || typeConfig.corretivo;

  row.dataset.serviceId = service.id;

  code.textContent = service.codigo;

  status.textContent = statusData.nome;

  status.classList.add(statusData.classe);

  name.textContent = service.nome;

  type.textContent = typeData.nome;

  type.classList.add(typeData.classe);

  duration.textContent = formatDuration(service);

  price.textContent = getPriceText(service);

  openButton.setAttribute("aria-label", `Ver detalhes de ${service.nome}`);

  openButton.addEventListener("click", () => {
    openServiceDetails(service);
  });

  row.addEventListener("dblclick", () => {
    openServiceDetails(service);
  });

  return fragment;
}

/* =========================================
   CATEGORIAS
========================================= */

function groupServicesByCategory(filteredServices) {
  const groups = new Map();

  filteredServices.forEach((service) => {
    const category = getCategoryData(service);

    if (!groups.has(category.slug)) {
      groups.set(category.slug, {
        ...category,
        servicos: [],
      });
    }

    groups.get(category.slug).servicos.push(service);
  });

  return [...groups.values()].sort((categoryA, categoryB) => {
    if (categoryA.ordem !== categoryB.ordem) {
      return categoryA.ordem - categoryB.ordem;
    }

    return categoryA.nome.localeCompare(categoryB.nome, "pt-BR");
  });
}

function renderCategoryServices(category, servicesContainer, moreButton) {
  servicesContainer.innerHTML = "";

  const limit = categoryLimits[category.slug] || SERVICES_PER_CATEGORY;

  const visibleServices = category.servicos.slice(0, limit);

  visibleServices.forEach((service) => {
    servicesContainer.appendChild(createServiceRow(service));
  });

  const remaining = category.servicos.length - visibleServices.length;

  moreButton.hidden = remaining <= 0;

  if (remaining > 0) {
    const quantity = Math.min(SERVICES_PER_CATEGORY, remaining);

    moreButton.textContent = `Mostrar mais ${quantity}`;
  }
}

function renderCategories(filteredServices) {
  servicesCategories.innerHTML = "";

  const categories = groupServicesByCategory(filteredServices);

  categories.forEach((category) => {
    const fragment = categoryTemplate.content.cloneNode(true);

    const article = fragment.querySelector(".service-category");

    const header = fragment.querySelector(".service-category__header");
    const categoryIcon = fragment.querySelector(".service-category__icon svg");

    const name = fragment.querySelector(".service-category__name");

    const description = fragment.querySelector(
      ".service-category__description",
    );

    const count = fragment.querySelector(".service-category__count");

    const body = fragment.querySelector(".service-category__body");

    const servicesContainer = fragment.querySelector(
      ".service-category__services",
    );

    const moreButton = fragment.querySelector(".service-category__more");

    const bodyId = `category-body-${category.slug}`;

    article.dataset.category = category.slug;

    body.id = bodyId;

    header.setAttribute("aria-controls", bodyId);
    categoryIcon.innerHTML =
      categoryIconConfig[category.icone] || categoryIconConfig.outros;
    name.textContent = category.nome;

    description.textContent = category.descricao;

    count.textContent = String(category.servicos.length);

    const isOpen = openCategories.has(category.slug);

    body.hidden = !isOpen;

    article.classList.toggle("is-open", isOpen);

    header.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      renderCategoryServices(category, servicesContainer, moreButton);
    }

    header.addEventListener("click", () => {
      const willOpen = !openCategories.has(category.slug);

      if (willOpen) {
        openCategories.add(category.slug);
      } else {
        openCategories.delete(category.slug);
      }

      renderContent();
    });

    moreButton.addEventListener("click", () => {
      const currentLimit =
        categoryLimits[category.slug] || SERVICES_PER_CATEGORY;

      categoryLimits[category.slug] = currentLimit + SERVICES_PER_CATEGORY;

      openCategories.add(category.slug);

      renderContent();
    });

    servicesCategories.appendChild(fragment);
  });
}

/* =========================================
   LISTA GERAL
========================================= */

function renderGeneralList(filteredServices) {
  allServices.innerHTML = "";

  const visibleServices = filteredServices.slice(0, generalListLimit);

  visibleServices.forEach((service) => {
    allServices.appendChild(createServiceRow(service));
  });

  const remaining = filteredServices.length - visibleServices.length;

  loadMoreServicesButton.hidden = remaining <= 0;

  if (remaining > 0) {
    const quantity = Math.min(SERVICES_PER_PAGE, remaining);

    loadMoreServicesButton.textContent = `Mostrar mais ${quantity} serviços`;
  }
}

/* =========================================
   RENDERIZAÇÃO PRINCIPAL
========================================= */

function renderContent() {
  const filteredServices = getFilteredServices();

  updateContentHeading();

  servicesCount.textContent = formatServicesQuantity(filteredServices.length);

  const empty = filteredServices.length === 0;

  emptyState.hidden = !empty;

  if (empty) {
    servicesCategories.hidden = true;
    allServices.hidden = true;
    loadMoreServicesButton.hidden = true;

    return;
  }

  if (currentView === "categories") {
    servicesCategories.hidden = false;
    allServices.hidden = true;
    loadMoreServicesButton.hidden = true;

    renderCategories(filteredServices);

    return;
  }

  servicesCategories.hidden = true;
  allServices.hidden = false;

  renderGeneralList(filteredServices);
}

/* =========================================
   MODAL DE DETALHES
========================================= */

function createTag(text) {
  const tag = document.createElement("span");

  tag.className = "service-details__tag";

  tag.textContent = text;

  return tag;
}

function renderEquipmentDetails(service) {
  detailsServiceEquipment.innerHTML = "";

  const equipments = service.equipamentos;

  detailsServiceEquipmentEmpty.hidden = equipments.length > 0;

  detailsServiceEquipment.hidden = equipments.length === 0;

  equipments.forEach((equipment) => {
    detailsServiceEquipment.appendChild(
      createTag(equipmentConfig[equipment] || createCategoryName(equipment)),
    );
  });
}

function renderRequirementDetails(service) {
  detailsServiceRequirements.innerHTML = "";

  const requirements = [];

  if (service.exigeFotos) {
    requirements.push("Exige fotos");
  }

  if (service.exigeAprovacao) {
    requirements.push("Exige aprovação");
  }

  if (service.registrarMateriais) {
    requirements.push("Registrar materiais");
  }

  if (service.exigeAceite) {
    requirements.push("Exige aceite");
  }

  if (requirements.length === 0) {
    requirements.push("Sem exigências adicionais");
  }

  requirements.forEach((requirement) => {
    detailsServiceRequirements.appendChild(createTag(requirement));
  });
}

function renderChecklistDetails(service) {
  detailsServiceChecklist.innerHTML = "";

  const checklist = service.checklist.map(getChecklistText).filter(Boolean);

  detailsChecklistCount.textContent = formatQuantity(
    checklist.length,
    "item",
    "itens",
  );

  detailsServiceChecklistEmpty.hidden = checklist.length > 0;

  detailsServiceChecklist.hidden = checklist.length === 0;

  checklist.forEach((item, index) => {
    const article = document.createElement("article");

    article.className = "service-details__checklist-item";

    const number = document.createElement("span");

    number.textContent = String(index + 1);

    const text = document.createElement("p");

    text.textContent = item;

    article.append(number, text);

    detailsServiceChecklist.appendChild(article);
  });
}

function openServiceDetails(service) {
  selectedServiceId = service.id;

  const category = getCategoryData(service);

  const type = typeConfig[service.tipo] || typeConfig.corretivo;

  const status = statusConfig[service.status] || statusConfig.ativo;

  detailsServiceCode.textContent = service.codigo;

  serviceDetailsTitle.textContent = service.nome;

  detailsServiceCategory.textContent = category.nome;

  detailsServiceType.textContent = type.nome;

  detailsServiceStatus.textContent = status.nome;

  detailsServiceStatus.className = `service-details__status ${status.classe}`;

  detailsServiceDescription.textContent =
    service.descricao || "Nenhuma descrição cadastrada.";

  detailsServiceDuration.textContent = formatDuration(service);

  detailsServicePrice.textContent = getPriceText(service);

  detailsServiceCharge.textContent =
    chargeConfig[service.cobranca] || "Não informada";

  detailsServiceTeam.textContent = getTeamText(service.equipeRecomendada);

  detailsServicePriority.textContent =
    priorityConfig[service.prioridadePadrao] || "Normal";

  detailsServiceEquipmentCount.textContent = formatQuantity(
    service.equipamentos.length,
    "equipamento",
    "equipamentos",
  );

  detailsServiceInstructions.textContent =
    service.orientacoes || "Nenhuma orientação técnica cadastrada.";

  renderEquipmentDetails(service);

  renderRequirementDetails(service);

  renderChecklistDetails(service);

  const inactive = service.status === "inativo";

  createOrderWithServiceButton.disabled = inactive;

  createOrderWithServiceButton.textContent = inactive
    ? "Serviço inativo"
    : "Criar ordem com este serviço";

  serviceDetailsModal.hidden = false;

  document.body.classList.add("modal-open");

  const url = new URL(window.location.href);

  url.searchParams.set("servico", service.id);

  window.history.replaceState(
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function closeServiceDetails() {
  serviceDetailsModal.hidden = true;

  document.body.classList.remove("modal-open");

  selectedServiceId = null;

  const url = new URL(window.location.href);

  url.searchParams.delete("servico");

  window.history.replaceState(
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function createOrderWithService() {
  const service = getServiceById(selectedServiceId);

  if (!service || service.status !== "ativo") {
    return;
  }

  const parameters = new URLSearchParams({
    perfil: "admin",
    servico: service.id,
  });

  window.location.href = `nova-ordem.html?${parameters.toString()}`;
}

/* =========================================
   ABERTURA PELA URL
========================================= */

function openServiceFromURL() {
  const parameters = new URLSearchParams(window.location.search);

  const serviceId = parameters.get("servico");

  if (!serviceId) {
    return;
  }

  const service = getServiceById(serviceId);

  if (!service) {
    showFeedback("O serviço solicitado não foi encontrado.");

    return;
  }

  window.setTimeout(() => {
    openServiceDetails(service);
  }, 80);
}

/* =========================================
   EVENTOS DAS VISUALIZAÇÕES
========================================= */

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeView(button.dataset.servicesView);
  });
});

/* =========================================
   EVENTOS DE PESQUISA E FILTROS
========================================= */

servicesSearch.addEventListener("input", () => {
  resetListLimits();

  renderContent();
});

openFilterButton.addEventListener("click", openFilters);

closeFilterButton.addEventListener("click", closeFilters);

applyFiltersButton.addEventListener("click", applyFilters);

clearFiltersButton.addEventListener("click", clearSearchAndFilters);

clearEmptyFiltersButton.addEventListener("click", clearSearchAndFilters);

loadMoreServicesButton.addEventListener("click", () => {
  generalListLimit += SERVICES_PER_PAGE;

  renderContent();
});

/* =========================================
   EVENTOS DO MODAL
========================================= */

closeServiceDetailsButton.addEventListener("click", closeServiceDetails);

closeServiceDetailsSecondaryButton.addEventListener(
  "click",
  closeServiceDetails,
);

createOrderWithServiceButton.addEventListener("click", createOrderWithService);

serviceDetailsModal.addEventListener("click", (event) => {
  if (event.target === serviceDetailsModal) {
    closeServiceDetails();
  }
});

/* =========================================
   EVENTOS GERAIS
========================================= */

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (!serviceDetailsModal.hidden) {
    closeServiceDetails();

    return;
  }

  if (!filterPanel.hidden) {
    closeFilters();

    openFilterButton.focus();

    return;
  }

  if (openCategories.size > 0) {
    openCategories.clear();

    renderContent();
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== SERVICES_STORAGE_KEY) {
    return;
  }

  loadServices();

  populateCategoryFilter();

  updateSummary();

  resetListLimits();

  renderContent();
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

loadServices();

populateCategoryFilter();

synchronizeFilterForm();

updateFilterCount();

renderActiveFilters();

updateSummary();

changeView("categories");

openServiceFromURL();
